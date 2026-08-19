<?php

namespace Baikal\Portal;

use Sabre\DAV\Sharing\Plugin as SharingPlugin;
use Sabre\DAV\UUIDUtil;
use Sabre\VObject\Component\VCalendar;
use Sabre\VObject\Reader;

/**
 * VEVENT CRUD and month-grid listing for the portal Calendar tab.
 */
class EventService {
    public function __construct(
        private CalendarStore $store,
    ) {
    }

    /**
     * List VEVENT occurrences in [from, to] (inclusive, YYYY-MM-DD) for month view.
     * Expands RRULE within the range. Caps at 500 events.
     *
     * @return list<array{uid: string, uri: string, summary: string, start: string, end: string|null, allDay: bool}>
     */
    public function listEvents(string $username, int $instanceId, string $from, string $to): array {
        if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $from) || !preg_match('/^\d{4}-\d{2}-\d{2}$/', $to)) {
            throw new ApiException('from and to must be YYYY-MM-DD', 400);
        }
        try {
            $start = new \DateTimeImmutable($from . ' 00:00:00', new \DateTimeZone('UTC'));
            $end = new \DateTimeImmutable($to . ' 23:59:59', new \DateTimeZone('UTC'));
        } catch (\Throwable $e) {
            throw new ApiException('Invalid date range', 400);
        }
        if ($end < $start) {
            throw new ApiException('to must be on or after from', 400);
        }
        if ($end->getTimestamp() - $start->getTimestamp() > 100 * 86400) {
            throw new ApiException('Date range too large (max ~3 months)', 400);
        }

        $calId = $this->store->requireCalendarAccess($username, $instanceId, false);
        $calendarPk = (int) $calId[0];
        $fromTs = $start->getTimestamp();
        $toTs = $end->getTimestamp();

        $stmt = $this->store->pdo()->prepare(
            'SELECT uri, calendardata, uid
             FROM calendarobjects
             WHERE calendarid = ?
               AND UPPER(componenttype) = ?
               AND (firstoccurence IS NULL OR firstoccurence <= ?)
               AND (lastoccurence IS NULL OR lastoccurence >= ?)'
        );
        $stmt->execute([$calendarPk, 'VEVENT', $toTs, $fromTs]);

        $events = [];
        $max = 500;
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            if (count($events) >= $max) {
                break;
            }
            $data = $row['calendardata'] ?? '';
            if (is_resource($data)) {
                $data = stream_get_contents($data);
            }
            if (!is_string($data) || trim($data) === '') {
                continue;
            }
            try {
                $vcal = Reader::read($data, Reader::OPTION_FORGIVING);
            } catch (\Throwable $e) {
                continue;
            }
            if (!$vcal instanceof VCalendar) {
                continue;
            }
            $uri = (string) ($row['uri'] ?? '');
            $fallbackUid = (string) ($row['uid'] ?? '');
            try {
                $expanded = $vcal->expand(
                    new \DateTime($from . ' 00:00:00', new \DateTimeZone('UTC')),
                    new \DateTime($to . ' 23:59:59', new \DateTimeZone('UTC'))
                );
            } catch (\Throwable $e) {
                $expanded = $vcal;
            }
            foreach ($expanded->getComponents() as $comp) {
                if (strtoupper($comp->name) !== 'VEVENT') {
                    continue;
                }
                if (count($events) >= $max) {
                    break 2;
                }
                if (!isset($comp->DTSTART)) {
                    continue;
                }
                try {
                    $dtStart = $comp->DTSTART;
                    $allDay = !$dtStart->hasTime();
                    $startDt = $dtStart->getDateTime();
                    $startStr = $allDay ? $startDt->format('Y-m-d') : $startDt->format('c');
                    $endStr = null;
                    if (isset($comp->DTEND)) {
                        $endDt = $comp->DTEND->getDateTime();
                        if ($allDay || !$comp->DTEND->hasTime()) {
                            // Exclusive DTEND → inclusive last day for the month grid
                            $inclusive = new \DateTime($endDt->format('Y-m-d') . ' 00:00:00', new \DateTimeZone('UTC'));
                            if ($inclusive > $startDt) {
                                $inclusive->modify('-1 day');
                            }
                            $endStr = $inclusive->format('Y-m-d');
                        } else {
                            $endStr = $endDt->format('c');
                        }
                    } elseif (isset($comp->DURATION) && !$allDay) {
                        try {
                            $endDt = clone $startDt;
                            $endDt->add($comp->DURATION->getDateInterval());
                            $endStr = $endDt->format('c');
                        } catch (\Throwable $e) {
                            $endStr = null;
                        }
                    }
                    $summary = isset($comp->SUMMARY) ? trim((string) $comp->SUMMARY) : '';
                    $uid = isset($comp->UID) ? trim((string) $comp->UID) : $fallbackUid;
                    $events[] = [
                        'uid'     => $uid,
                        'uri'     => $uri,
                        'summary' => $summary !== '' ? $summary : '(No title)',
                        'start'   => $startStr,
                        'end'     => $endStr,
                        'allDay'  => $allDay,
                    ];
                } catch (\Throwable $e) {
                    continue;
                }
            }
            $vcal->destroy();
        }

        usort($events, static function ($a, $b) {
            return strcmp((string) $a['start'], (string) $b['start']);
        });

        return $events;
    }

    /**
     * Full VEVENT detail for the portal edit modal.
     *
     * @return array<string, mixed>
     */
    public function getEvent(string $username, int $instanceId, string $uri): array {
        $calId = $this->store->requireCalendarAccess($username, $instanceId, false);
        $uri = $this->store->normalizeObjectUri($uri);
        $obj = $this->store->backend()->getCalendarObject($calId, $uri);
        if (!$obj || empty($obj['calendardata'])) {
            throw new ApiException('Event not found', 404);
        }
        $comp = strtoupper((string) ($obj['component'] ?? $obj['componenttype'] ?? ''));
        if ($comp !== '' && $comp !== 'VEVENT') {
            throw new ApiException('Object is not a VEVENT', 404);
        }
        $data = $this->store->calendardataToString($obj['calendardata']);
        $parsed = $this->parseEvent($data);
        $meta = $this->store->getCalendarMeta($username, $instanceId);
        $row = $this->store->loadInstance($username, $instanceId);
        $access = (int) $row['access'];
        $canWriteAccess = $access === SharingPlugin::ACCESS_SHAREDOWNER
            || $access === SharingPlugin::ACCESS_NOTSHARED
            || $access === SharingPlugin::ACCESS_READWRITE;
        $readOnly = $this->store->meta()->isReadOnly($instanceId) || !$canWriteAccess;

        return array_merge($parsed, [
            'uri'          => $uri,
            'instanceId'   => $instanceId,
            'calendarId'   => (int) $calId[0],
            'calendarName' => $meta['displayname'],
            'calendarUri'  => $meta['uri'],
            'readOnly'     => $readOnly,
            'canWrite'     => !$readOnly,
        ]);
    }

    /**
     * Create a new VEVENT on a writable calendar.
     *
     * @param array<string, mixed> $fields
     *
     * @return array<string, mixed>
     */
    public function createEvent(string $username, int $instanceId, array $fields): array {
        $calId = $this->store->requireCalendarAccess($username, $instanceId, true);
        if ($this->store->meta()->isReadOnly($instanceId)) {
            throw new ApiException('This calendar is marked read-only', 403);
        }
        $summary = mb_substr(trim((string) ($fields['summary'] ?? '')), 0, 500);
        if ($summary === '') {
            throw new ApiException('Title is required', 400);
        }

        $uid = UUIDUtil::getUUID();
        $uri = $this->store->objectUriFromUid($uid);
        $vcal = new VCalendar();
        $vcal->PRODID = '-//AngaraDAV Portal//EN';
        $vcal->VERSION = '2.0';
        $event = $vcal->add('VEVENT', [
            'UID'     => $uid,
            'DTSTAMP' => new \DateTime('now', new \DateTimeZone('UTC')),
            'SUMMARY' => $summary,
        ]);
        // Defaults if client omitted dates (single all-day today)
        if (!array_key_exists('start', $fields) || $fields['start'] === null || $fields['start'] === '') {
            $fields['start'] = (new \DateTime('today', new \DateTimeZone('UTC')))->format('Y-m-d');
            $fields['allDay'] = true;
        }
        if (!array_key_exists('allDay', $fields)) {
            $fields['allDay'] = is_string($fields['start'] ?? null)
                && preg_match('/^\d{4}-\d{2}-\d{2}$/', trim((string) $fields['start']));
        }
        $this->applyEventFields($event, $fields);
        if (!isset($event->DTSTART)) {
            throw new ApiException('Start date/time is required', 400);
        }
        $serialized = $vcal->serialize();
        $vcal->destroy();
        $this->store->backend()->createCalendarObject($calId, $uri, $serialized);
        $this->store->notifyCalendarPush($username, $instanceId, $calId);

        return $this->getEvent($username, $instanceId, $uri);
    }

    /**
     * Update VEVENT fields; optional move to another writable calendar via instanceId.
     *
     * @param array<string, mixed> $fields
     *
     * @return array<string, mixed>
     */
    public function updateEvent(string $username, int $instanceId, string $uri, array $fields): array {
        $sourceCalId = $this->store->requireCalendarAccess($username, $instanceId, true);
        if ($this->store->meta()->isReadOnly($instanceId)) {
            throw new ApiException('This calendar is marked read-only', 403);
        }
        $uri = $this->store->normalizeObjectUri($uri);
        $obj = $this->store->backend()->getCalendarObject($sourceCalId, $uri);
        if (!$obj || empty($obj['calendardata'])) {
            throw new ApiException('Event not found', 404);
        }

        try {
            $vcal = Reader::read($this->store->calendardataToString($obj['calendardata']), Reader::OPTION_FORGIVING);
        } catch (\Throwable $e) {
            throw new ApiException('Invalid calendar data for this event', 500);
        }
        if (!$vcal instanceof VCalendar) {
            throw new ApiException('Invalid calendar object', 500);
        }
        $event = null;
        foreach ($vcal->getComponents() as $c) {
            if (strtoupper($c->name) === 'VEVENT') {
                $event = $c;
                break;
            }
        }
        if ($event === null) {
            $vcal->destroy();
            throw new ApiException('Object is not a VEVENT', 404);
        }

        $this->applyEventFields($event, $fields);
        $event->DTSTAMP = new \DateTime('now', new \DateTimeZone('UTC'));
        if (!isset($event->UID) || trim((string) $event->UID) === '') {
            $event->UID = UUIDUtil::getUUID();
        }

        $serialized = $vcal->serialize();
        $vcal->destroy();

        $targetInstanceId = $instanceId;
        if (array_key_exists('instanceId', $fields)) {
            $targetInstanceId = (int) $fields['instanceId'];
            if ($targetInstanceId <= 0) {
                throw new ApiException('Invalid target calendar', 400);
            }
        }

        if ($targetInstanceId === $instanceId) {
            $this->store->backend()->updateCalendarObject($sourceCalId, $uri, $serialized);
            $this->store->notifyCalendarPush($username, $instanceId, $sourceCalId);

            return $this->getEvent($username, $instanceId, $uri);
        }

        // Move to another calendar
        $targetCalId = $this->store->requireCalendarAccess($username, $targetInstanceId, true);
        if ($this->store->meta()->isReadOnly($targetInstanceId)) {
            throw new ApiException('Target calendar is marked read-only', 403);
        }
        $newUri = $uri;
        $existing = $this->store->backend()->getCalendarObject($targetCalId, $newUri);
        if ($existing) {
            $uid = '';
            try {
                $tmp = Reader::read($serialized, Reader::OPTION_FORGIVING);
                if ($tmp instanceof VCalendar && isset($tmp->VEVENT->UID)) {
                    $uid = trim((string) $tmp->VEVENT->UID);
                }
                if ($tmp) {
                    $tmp->destroy();
                }
            } catch (\Throwable $e) {
                $uid = '';
            }
            $newUri = $this->store->objectUriFromUid($uid !== '' ? $uid : UUIDUtil::getUUID());
        }
        $this->store->backend()->createCalendarObject($targetCalId, $newUri, $serialized);
        $this->store->backend()->deleteCalendarObject($sourceCalId, $uri);
        $this->store->notifyCalendarPush($username, $instanceId, $sourceCalId);
        $this->store->notifyCalendarPush($username, $targetInstanceId, $targetCalId);

        return $this->getEvent($username, $targetInstanceId, $newUri);
    }

    public function deleteEvent(string $username, int $instanceId, string $uri): void {
        $calId = $this->store->requireCalendarAccess($username, $instanceId, true);
        if ($this->store->meta()->isReadOnly($instanceId)) {
            throw new ApiException('This calendar is marked read-only', 403);
        }
        $uri = $this->store->normalizeObjectUri($uri);
        $obj = $this->store->backend()->getCalendarObject($calId, $uri);
        if (!$obj) {
            throw new ApiException('Event not found', 404);
        }
        $comp = strtoupper((string) ($obj['component'] ?? $obj['componenttype'] ?? ''));
        if ($comp !== '' && $comp !== 'VEVENT') {
            throw new ApiException('Object is not a VEVENT', 404);
        }
        $this->store->backend()->deleteCalendarObject($calId, $uri);
        $this->store->notifyCalendarPush($username, $instanceId, $calId);
    }

    /**
     * @return array<string, mixed>
     */
    private function parseEvent(string $data): array {
        $empty = [
            'uid'         => '',
            'summary'     => '',
            'description' => '',
            'location'    => '',
            'start'       => null,
            'end'         => null,
            'allDay'      => false,
            'hasRrule'    => false,
            'repeat'      => [
                'freq'     => '',
                'interval' => 1,
                'until'    => null,
                'count'    => null,
                'byDay'    => [],
            ],
        ];
        if (trim($data) === '') {
            return $empty;
        }
        try {
            $vcal = Reader::read($data, Reader::OPTION_FORGIVING);
        } catch (\Throwable $e) {
            return $empty;
        }
        $event = null;
        foreach ($vcal->getComponents() as $c) {
            if (strtoupper($c->name) === 'VEVENT') {
                $event = $c;
                break;
            }
        }
        if ($event === null) {
            $vcal->destroy();

            return $empty;
        }
        $allDay = false;
        $start = null;
        $end = null;
        if (isset($event->DTSTART)) {
            try {
                $allDay = !$event->DTSTART->hasTime();
                $startDt = $event->DTSTART->getDateTime();
                $start = $allDay ? $startDt->format('Y-m-d') : $startDt->format('c');
            } catch (\Throwable $e) {
                $start = null;
            }
        }
        if (isset($event->DTEND)) {
            try {
                $endDt = $event->DTEND->getDateTime();
                if ($allDay || !$event->DTEND->hasTime()) {
                    // iCal all-day DTEND is exclusive → expose inclusive last day to the UI
                    // (DateTimeImmutable::modify returns a new instance — always reassign)
                    $inclusive = new \DateTime($endDt->format('Y-m-d') . ' 00:00:00', new \DateTimeZone('UTC'));
                    if ($start !== null) {
                        $startDay = new \DateTime(substr($start, 0, 10) . ' 00:00:00', new \DateTimeZone('UTC'));
                        if ($inclusive > $startDay) {
                            $inclusive->modify('-1 day');
                        }
                    }
                    $end = $inclusive->format('Y-m-d');
                } else {
                    $end = $endDt->format('c');
                }
            } catch (\Throwable $e) {
                $end = null;
            }
        } elseif (isset($event->DURATION) && $start !== null && !$allDay) {
            try {
                $startDt = $event->DTSTART->getDateTime();
                $endDt = clone $startDt;
                $endDt->add($event->DURATION->getDateInterval());
                $end = $endDt->format('c');
            } catch (\Throwable $e) {
                $end = null;
            }
        }
        $repeat = $this->parseRrule(isset($event->RRULE) ? $event->RRULE : null);
        $out = [
            'uid'         => isset($event->UID) ? trim((string) $event->UID) : '',
            'summary'     => isset($event->SUMMARY) ? trim((string) $event->SUMMARY) : '',
            'description' => isset($event->DESCRIPTION) ? (string) $event->DESCRIPTION : '',
            'location'    => isset($event->LOCATION) ? trim((string) $event->LOCATION) : '',
            'start'       => $start,
            'end'         => $end,
            'allDay'      => $allDay,
            'hasRrule'    => $repeat['freq'] !== '',
            'repeat'      => $repeat,
        ];
        $vcal->destroy();

        return $out;
    }

    /**
     * @param mixed $rruleProperty
     *
     * @return array{freq: string, interval: int, until: string|null, count: int|null, byDay: list<string>}
     */
    private function parseRrule($rruleProperty): array {
        $empty = [
            'freq'     => '',
            'interval' => 1,
            'until'    => null,
            'count'    => null,
            'byDay'    => [],
        ];
        if ($rruleProperty === null) {
            return $empty;
        }
        try {
            $parts = is_object($rruleProperty) && method_exists($rruleProperty, 'getParts')
                ? $rruleProperty->getParts()
                : [];
            if (!is_array($parts) || $parts === []) {
                // Fallback parse "FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE"
                $raw = trim((string) $rruleProperty);
                if ($raw === '') {
                    return $empty;
                }
                $parts = [];
                foreach (explode(';', $raw) as $seg) {
                    if (str_contains($seg, '=')) {
                        [$k, $v] = explode('=', $seg, 2);
                        $parts[strtoupper(trim($k))] = trim($v);
                    }
                }
            }
        } catch (\Throwable $e) {
            return $empty;
        }
        $freq = strtoupper((string) ($parts['FREQ'] ?? ''));
        $allowed = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
        if (!in_array($freq, $allowed, true)) {
            return $empty;
        }
        $interval = max(1, min(99, (int) ($parts['INTERVAL'] ?? 1)));
        $until = null;
        if (!empty($parts['UNTIL'])) {
            $u = (string) $parts['UNTIL'];
            // YYYYMMDD or YYYYMMDDTHHMMSSZ
            if (preg_match('/^(\d{4})(\d{2})(\d{2})/', $u, $m)) {
                $until = $m[1] . '-' . $m[2] . '-' . $m[3];
            }
        }
        $count = null;
        if (isset($parts['COUNT']) && (int) $parts['COUNT'] > 0) {
            $count = min(999, (int) $parts['COUNT']);
        }
        $byDay = [];
        if (!empty($parts['BYDAY'])) {
            $rawDays = is_array($parts['BYDAY']) ? $parts['BYDAY'] : explode(',', (string) $parts['BYDAY']);
            $ok = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
            foreach ($rawDays as $d) {
                $d = strtoupper(preg_replace('/[^A-Z]/', '', (string) $d) ?? '');
                if (in_array($d, $ok, true)) {
                    $byDay[] = $d;
                }
            }
        }

        return [
            'freq'     => $freq,
            'interval' => $interval,
            'until'    => $until,
            'count'    => $count,
            'byDay'    => array_values(array_unique($byDay)),
        ];
    }

    /**
     * @param array<string, mixed> $repeat
     */
    private function buildRruleString(array $repeat): ?string {
        $freq = strtoupper(trim((string) ($repeat['freq'] ?? '')));
        if ($freq === '' || $freq === 'NONE') {
            return null;
        }
        $allowed = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
        if (!in_array($freq, $allowed, true)) {
            throw new ApiException('Invalid repeat frequency', 400);
        }
        $interval = max(1, min(99, (int) ($repeat['interval'] ?? 1)));
        $parts = ['FREQ=' . $freq];
        if ($interval !== 1) {
            $parts[] = 'INTERVAL=' . $interval;
        }
        $byDay = $repeat['byDay'] ?? $repeat['byday'] ?? [];
        if (is_array($byDay) && $byDay !== [] && $freq === 'WEEKLY') {
            $ok = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
            $days = [];
            foreach ($byDay as $d) {
                $d = strtoupper(trim((string) $d));
                if (in_array($d, $ok, true)) {
                    $days[] = $d;
                }
            }
            if ($days !== []) {
                $parts[] = 'BYDAY=' . implode(',', array_unique($days));
            }
        }
        $until = isset($repeat['until']) ? trim((string) $repeat['until']) : '';
        $count = isset($repeat['count']) ? (int) $repeat['count'] : 0;
        if ($until !== '' && preg_match('/^\d{4}-\d{2}-\d{2}$/', $until)) {
            $parts[] = 'UNTIL=' . str_replace('-', '', $until);
        } elseif ($count > 0) {
            $parts[] = 'COUNT=' . min(999, $count);
        }

        return implode(';', $parts);
    }

    /**
     * @param mixed                $event  VEVENT component
     * @param array<string, mixed> $fields
     */
    private function applyEventFields($event, array $fields): void {
        if (array_key_exists('summary', $fields)) {
            $summary = mb_substr(trim((string) $fields['summary']), 0, 500);
            if ($summary === '') {
                throw new ApiException('Title is required', 400);
            }
            $event->SUMMARY = $summary;
        }
        if (array_key_exists('description', $fields)) {
            $desc = mb_substr(trim((string) $fields['description']), 0, 20000);
            if ($desc === '') {
                unset($event->DESCRIPTION);
            } else {
                $event->DESCRIPTION = $desc;
            }
        }
        if (array_key_exists('location', $fields)) {
            $loc = mb_substr(trim((string) $fields['location']), 0, 500);
            if ($loc === '') {
                unset($event->LOCATION);
            } else {
                $event->LOCATION = $loc;
            }
        }

        if (array_key_exists('repeat', $fields)) {
            $rep = $fields['repeat'];
            unset($event->RRULE);
            if ($rep === null || $rep === '' || $rep === false) {
                // cleared
            } elseif (is_array($rep)) {
                $rule = $this->buildRruleString($rep);
                if ($rule !== null) {
                    $event->add('RRULE', $rule);
                }
            } elseif (is_string($rep) && trim($rep) !== '') {
                $event->add('RRULE', trim($rep));
            }
        }

        $touchStart = array_key_exists('start', $fields) || array_key_exists('allDay', $fields);
        $touchEnd = array_key_exists('end', $fields) || array_key_exists('allDay', $fields) || array_key_exists('start', $fields);
        if (!$touchStart && !$touchEnd) {
            return;
        }

        $allDay = array_key_exists('allDay', $fields)
            ? !empty($fields['allDay'])
            : (isset($event->DTSTART) && !$event->DTSTART->hasTime());

        if ($touchStart || array_key_exists('allDay', $fields)) {
            $startRaw = array_key_exists('start', $fields)
                ? $fields['start']
                : (isset($event->DTSTART) ? $event->DTSTART->getDateTime()->format('c') : null);
            if (!is_string($startRaw) || trim($startRaw) === '') {
                throw new ApiException('Start date/time is required', 400);
            }
            try {
                if ($allDay) {
                    $day = substr(trim($startRaw), 0, 10);
                    $dt = new \DateTime($day . ' 00:00:00', new \DateTimeZone('UTC'));
                    unset($event->DTSTART);
                    $event->DTSTART = $dt;
                    $event->DTSTART['VALUE'] = 'DATE';
                } else {
                    $raw = trim($startRaw);
                    // Date-only after all-day→timed conversion: start of that local day
                    if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw)) {
                        $dt = new \DateTime($raw . ' 00:00:00', new \DateTimeZone(date_default_timezone_get() ?: 'UTC'));
                    } else {
                        $dt = new \DateTime($raw);
                    }
                    unset($event->DTSTART);
                    $event->DTSTART = $dt;
                }
            } catch (\Throwable $e) {
                throw new ApiException('Invalid start date/time', 400);
            }
        }

        if ($touchEnd || array_key_exists('allDay', $fields)) {
            unset($event->DURATION);
            $endRaw = array_key_exists('end', $fields) ? $fields['end'] : null;
            if ($endRaw === null || (is_string($endRaw) && trim($endRaw) === '')) {
                // All-day single-day: DTEND = start + 1 day (exclusive)
                if ($allDay && isset($event->DTSTART)) {
                    try {
                        $s = $event->DTSTART->getDateTime();
                        $dt = clone $s;
                        $dt->modify('+1 day');
                        $event->DTEND = $dt;
                        $event->DTEND['VALUE'] = 'DATE';
                    } catch (\Throwable $e) {
                        unset($event->DTEND);
                    }
                } else {
                    unset($event->DTEND);
                }
            } else {
                try {
                    if ($allDay) {
                        // UI sends inclusive last day → store exclusive DTEND (+1 day)
                        $day = substr(trim((string) $endRaw), 0, 10);
                        $dt = new \DateTime($day . ' 00:00:00', new \DateTimeZone('UTC'));
                        $dt->modify('+1 day');
                        if (isset($event->DTSTART)) {
                            $s = $event->DTSTART->getDateTime();
                            if ($dt <= $s) {
                                $dt = clone $s;
                                $dt->modify('+1 day');
                            }
                        }
                        $event->DTEND = $dt;
                        $event->DTEND['VALUE'] = 'DATE';
                    } else {
                        $raw = trim((string) $endRaw);
                        // Date-only payload after all-day→timed: treat as end-of-day local/UTC
                        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $raw)) {
                            $dt = new \DateTime($raw . ' 23:59:59', new \DateTimeZone(date_default_timezone_get() ?: 'UTC'));
                        } else {
                            $dt = new \DateTime($raw);
                        }
                        unset($event->DTEND);
                        $event->DTEND = $dt;
                        // Ensure timed multi-day still has end after start
                        if (isset($event->DTSTART)) {
                            $s = $event->DTSTART->getDateTime();
                            if ($dt <= $s) {
                                $fix = clone $s;
                                $fix->modify('+1 hour');
                                $event->DTEND = $fix;
                            }
                        }
                    }
                } catch (\Throwable $e) {
                    throw new ApiException('Invalid end date/time', 400);
                }
            }
        }
    }
}
