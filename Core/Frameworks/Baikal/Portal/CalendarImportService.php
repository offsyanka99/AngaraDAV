<?php

namespace Baikal\Portal;

use Sabre\DAV\UUIDUtil;
use Sabre\VObject\Component\VCalendar;
use Sabre\VObject\Reader;

/**
 * Calendar ICS import/export for the portal.
 */
class CalendarImportService {
    /** Soft cap on VEVENT/VTODO/VJOURNAL components per import request */
    private const MAX_IMPORT_COMPONENTS = 10000;

    /**
     * Commit every N calendar objects during import so SQLite does not fsync
     * per row (huge win on ZFS/NAS) while keeping lock windows bounded.
     */
    private const IMPORT_TX_CHUNK = 200;

    public function __construct(
        private CalendarStore $store,
    ) {
    }

    /**
     * Export all objects in a calendar as a single .ics file.
     *
     * @return array{ics: string, filename: string, count: int}
     */
    public function exportCalendar(string $username, int $instanceId): array {
        $calId = $this->store->requireCalendarAccess($username, $instanceId, false);
        $meta = $this->store->getCalendarMeta($username, $instanceId);

        $objects = $this->store->backend()->getCalendarObjects($calId);
        $uris = [];
        foreach ($objects as $obj) {
            if (!empty($obj['uri'])) {
                $uris[] = (string) $obj['uri'];
            }
        }

        $blobs = [];
        if ($uris !== []) {
            foreach ($this->store->backend()->getMultipleCalendarObjects($calId, $uris) as $row) {
                if (!empty($row['calendardata'])) {
                    $blobs[(string) $row['uri']] = $row['calendardata'];
                }
            }
        }

        $calendar = new VCalendar();
        $calendar->VERSION = '2.0';
        $calendar->PRODID = '-//AngaraDAV Portal//EN';
        $calendar->{'X-WR-CALNAME'} = $meta['displayname'];
        if ($meta['color'] !== '') {
            $calendar->{'X-APPLE-CALENDAR-COLOR'} = $meta['color'];
        }

        $collectedTimezones = [];
        $timezones = [];
        $components = [];
        $count = 0;

        foreach ($blobs as $inputObject) {
            try {
                $nodeComp = Reader::read($inputObject);
            } catch (\Throwable $e) {
                continue;
            }
            foreach ($nodeComp->children() as $child) {
                switch ($child->name) {
                    case 'VEVENT':
                    case 'VTODO':
                    case 'VJOURNAL':
                        $components[] = clone $child;
                        ++$count;
                        break;
                    case 'VTIMEZONE':
                        $tzid = (string) $child->TZID;
                        if ($tzid !== '' && !in_array($tzid, $collectedTimezones, true)) {
                            $timezones[] = clone $child;
                            $collectedTimezones[] = $tzid;
                        }
                        break;
                }
            }
            $nodeComp->destroy();
        }

        foreach ($timezones as $tz) {
            $calendar->add($tz);
        }
        foreach ($components as $comp) {
            $calendar->add($comp);
        }

        $safeName = preg_replace('/[^a-zA-Z0-9-_ ]/u', '', $meta['displayname']) ?: 'calendar';
        $safeName = trim(preg_replace('/\s+/', '-', $safeName) ?? 'calendar', '-');
        $filename = $safeName . '-' . date('Y-m-d') . '.ics';

        return [
            'ics'      => $calendar->serialize(),
            'filename' => $filename,
            'count'    => $count,
        ];
    }

    /**
     * Import events/tasks/notes from an .ics payload into a writable calendar.
     *
     * Optimized for large Thunderbird exports (thousands of components):
     * longer PHP time limit, one-shot existing-URI lookup, lean VTIMEZONE attach.
     *
     * Optional $onProgress(current, total, imported, updated, skipped) for streaming UIs.
     *
     * @param callable(int, int, int, int, int): void|null $onProgress
     *
     * @return array{imported: int, updated: int, skipped: int}
     */
    public function importCalendar(string $username, int $instanceId, string $icsData, bool $allowReadOnly = false, ?callable $onProgress = null): array {
        // Large .ics files (Thunderbird full export) exceed the default 30s easily.
        if (function_exists('set_time_limit')) {
            @set_time_limit(600);
        }
        @ini_set('max_execution_time', '600');
        @ini_set('memory_limit', '512M');

        $calId = $this->store->requireCalendarAccess($username, $instanceId, true);
        if (!$allowReadOnly && $this->store->meta()->isReadOnly($instanceId)) {
            throw new ApiException('This calendar is marked read-only. Import is disabled so events stay unchanged.', 403);
        }

        // Strip UTF-8 BOM (common from Windows / Thunderbird)
        if (strncmp($icsData, "\xEF\xBB\xBF", 3) === 0) {
            $icsData = substr($icsData, 3);
        }
        $icsData = trim($icsData);
        if ($icsData === '') {
            throw new ApiException('ICS data is empty', 400);
        }
        if (strlen($icsData) > 20 * 1024 * 1024) {
            throw new ApiException('ICS file is too large (max 20 MB)', 400);
        }

        try {
            $parsed = Reader::read($icsData, Reader::OPTION_FORGIVING);
        } catch (\Throwable $e) {
            throw new ApiException('Invalid ICS data: ' . $e->getMessage(), 400);
        }

        if ($parsed->name !== 'VCALENDAR') {
            // Single component without envelope — wrap
            if (in_array($parsed->name, ['VEVENT', 'VTODO', 'VJOURNAL'], true)) {
                $wrap = new VCalendar();
                $wrap->VERSION = '2.0';
                $wrap->add(clone $parsed);
                $parsed->destroy();
                $parsed = $wrap;
            } else {
                $name = $parsed->name;
                $parsed->destroy();
                throw new ApiException('ICS must be a VCALENDAR (got ' . $name . ')', 400);
            }
        }

        /** @var array<string, \Sabre\VObject\Component> $timezonesById */
        $timezonesById = [];
        $toImport = [];
        foreach ($parsed->getComponents() as $comp) {
            if ($comp->name === 'VTIMEZONE') {
                $tzid = isset($comp->TZID) ? (string) $comp->TZID : '';
                if ($tzid !== '' && !isset($timezonesById[$tzid])) {
                    $timezonesById[$tzid] = clone $comp;
                }
            } elseif (in_array($comp->name, ['VEVENT', 'VTODO', 'VJOURNAL'], true)) {
                $toImport[] = clone $comp;
            }
        }
        $parsed->destroy();

        if ($toImport === []) {
            throw new ApiException('No VEVENT, VTODO, or VJOURNAL components found in ICS', 400);
        }
        if (count($toImport) > self::MAX_IMPORT_COMPONENTS) {
            throw new ApiException('Too many components in import (max ' . self::MAX_IMPORT_COMPONENTS . '). Split the .ics file.', 400);
        }

        // Preload existing object URIs for this calendar (one query vs N)
        $existingUris = $this->listExistingObjectUris($calId);

        $imported = 0;
        $updated = 0;
        $skipped = 0;
        $n = 0;
        $total = count($toImport);
        // ~100 UI updates max (not every component on huge files)
        $progressEvery = max(1, (int) min(25, max(1, (int) floor($total / 100))));

        if ($onProgress !== null) {
            $onProgress(0, $total, 0, 0, 0);
        }

        // Phase 1 perf: chunked transactions (fewer fsyncs on SQLite/ZFS).
        // If a transaction is already open, skip nesting and run without wrapping.
        $ownsTx = false;
        try {
            $ownsTx = $this->beginImportTransaction();

            foreach ($toImport as $comp) {
                ++$n;
                // Keep the request alive on very large files
                if (($n % 50) === 0 && function_exists('set_time_limit')) {
                    @set_time_limit(600);
                }

                $uid = isset($comp->UID) ? (string) $comp->UID : '';
                if ($uid === '') {
                    $uid = UUIDUtil::getUUID();
                    $comp->UID = $uid;
                }

                $uri = $this->store->objectUriFromUid($uid);

                try {
                    $object = new VCalendar();
                    $object->VERSION = '2.0';
                    $object->PRODID = '-//AngaraDAV Portal//EN';
                    foreach ($this->referencedTimezoneIds($comp) as $tzid) {
                        if (isset($timezonesById[$tzid])) {
                            $object->add(clone $timezonesById[$tzid]);
                        }
                    }
                    $object->add($comp);
                    $serialized = $object->serialize();
                    $object->destroy();

                    if (isset($existingUris[$uri])) {
                        $this->store->backend()->updateCalendarObject($calId, $uri, $serialized);
                        ++$updated;
                    } else {
                        $this->store->backend()->createCalendarObject($calId, $uri, $serialized);
                        $existingUris[$uri] = true;
                        ++$imported;
                    }
                } catch (\Throwable $e) {
                    error_log('portal import object ' . $uri . ': ' . $e->getMessage());
                    ++$skipped;
                }

                if ($onProgress !== null && ($n === $total || ($n % $progressEvery) === 0)) {
                    $onProgress($n, $total, $imported, $updated, $skipped);
                }

                // Commit every IMPORT_TX_CHUNK successful loop iterations
                if ($ownsTx && $n < $total && ($n % self::IMPORT_TX_CHUNK) === 0) {
                    $this->commitImportTransaction($ownsTx);
                    $ownsTx = $this->beginImportTransaction();
                }
            }

            $this->commitImportTransaction($ownsTx);
            $ownsTx = false;
        } catch (\Throwable $e) {
            $this->rollbackImportTransaction($ownsTx);
            throw $e;
        }

        foreach ($timezonesById as $tz) {
            $tz->destroy();
        }

        if ($imported > 0 || $updated > 0) {
            $this->store->notifyCalendarPush($username, $instanceId, $calId);
        }

        return [
            'imported' => $imported,
            'updated'  => $updated,
            'skipped'  => $skipped,
        ];
    }

    /**
     * Start a DB transaction for bulk import if none is active.
     *
     * @return bool true if this caller owns a new transaction
     */
    private function beginImportTransaction(): bool {
        if ($this->store->pdo()->inTransaction()) {
            return false;
        }
        try {
            return $this->store->pdo()->beginTransaction();
        } catch (\Throwable $e) {
            error_log('portal import beginTransaction: ' . $e->getMessage());

            return false;
        }
    }

    private function commitImportTransaction(bool $ownsTx): void {
        if (!$ownsTx || !$this->store->pdo()->inTransaction()) {
            return;
        }
        try {
            $this->store->pdo()->commit();
        } catch (\Throwable $e) {
            error_log('portal import commit: ' . $e->getMessage());
            try {
                $this->store->pdo()->rollBack();
            } catch (\Throwable $e2) {
                // ignore
            }
            throw $e;
        }
    }

    private function rollbackImportTransaction(bool $ownsTx): void {
        if (!$ownsTx || !$this->store->pdo()->inTransaction()) {
            return;
        }
        try {
            $this->store->pdo()->rollBack();
        } catch (\Throwable $e) {
            error_log('portal import rollback: ' . $e->getMessage());
        }
    }

    /**
     * @param array{0: int, 1: int} $calId
     *
     * @return array<string, true> map of existing object URIs
     */
    private function listExistingObjectUris(array $calId): array {
        list($calendarId) = $calId;
        $stmt = $this->store->pdo()->prepare(
            'SELECT uri FROM calendarobjects WHERE calendarid = ?'
        );
        $stmt->execute([(int) $calendarId]);
        $map = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            if (!empty($row['uri'])) {
                $map[(string) $row['uri']] = true;
            }
        }

        return $map;
    }

    /**
     * Collect TZID parameter values referenced by a component.
     *
     * @return list<string>
     */
    private function referencedTimezoneIds($comp): array {
        $ids = [];
        foreach ($comp->children() as $child) {
            if (!$child instanceof \Sabre\VObject\Property) {
                continue;
            }
            if (isset($child['TZID'])) {
                $ids[(string) $child['TZID']] = true;
            }
        }

        return array_keys($ids);
    }
}
