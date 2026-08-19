<?php

namespace Baikal\Portal;

use Sabre\DAV\PropPatch;
use Sabre\DAV\Sharing\Plugin as SharingPlugin;

/**
 * Owned calendar list/create/update/delete for the portal Calendar tab.
 */
class CalendarService {
    public function __construct(
        private CalendarStore $store,
        private CalendarImportService $importer,
    ) {
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listCalendars(string $username): array {
        $principal = 'principals/' . $username;
        $raw = $this->store->backend()->getCalendarsForUser($principal);
        $out = [];

        foreach ($raw as $cal) {
            $id = $cal['id'] ?? null;
            if (!is_array($id) || count($id) < 2) {
                continue;
            }
            $access = (int) ($cal['share-access'] ?? SharingPlugin::ACCESS_NOTSHARED);
            $isOwner = $access === SharingPlugin::ACCESS_SHAREDOWNER
                || $access === SharingPlugin::ACCESS_NOTSHARED;
            $instanceId = (int) $id[1];
            $flags = $this->store->meta()->get($instanceId);

            $out[] = [
                'id'               => $instanceId, // instance id (unique per principal view)
                'calendarId'       => (int) $id[0],
                'instanceId'       => $instanceId,
                'uri'              => (string) ($cal['uri'] ?? ''),
                'displayname'      => (string) ($cal['{DAV:}displayname'] ?? $cal['uri'] ?? 'Calendar'),
                'description'      => (string) ($cal['{urn:ietf:params:xml:ns:caldav}calendar-description'] ?? ''),
                'color'            => (string) ($cal['{http://apple.com/ns/ical/}calendar-color'] ?? ''),
                'access'           => $this->store->accessLabel($access),
                'accessCode'       => $access,
                'canShare'         => $isOwner,
                'components'       => (string) ($cal['components'] ?? ''),
                'readOnly'         => $flags['readOnly'],
                'holidaysCountry'  => $flags['holidaysCountry'],
            ];
        }

        usort($out, static function ($a, $b) {
            return strcasecmp($a['displayname'], $b['displayname']);
        });

        return $out;
    }

    /**
     * Create a calendar owned by the user.
     *
     * @param array{
     *   displayname?: string,
     *   description?: string,
     *   color?: string,
     *   readOnly?: bool,
     *   holidays?: bool,
     *   holidayCountry?: string
     * } $fields
     *
     * @return array<string, mixed>
     */
    public function createCalendar(string $username, array $fields): array {
        $holidays = !empty($fields['holidays']);
        $holidayCountry = strtoupper(trim((string) ($fields['holidayCountry'] ?? '')));
        $readOnly = !empty($fields['readOnly']);

        if ($holidays) {
            if ($holidayCountry === '' || !preg_match('/^[A-Z]{2}$/', $holidayCountry)) {
                throw new ApiException('Select a country for the holidays calendar', 400);
            }
            if (!Holidays::isValidCountryCode($holidayCountry)) {
                throw new ApiException('Unknown country code: ' . $holidayCountry, 400);
            }
        }

        $displayname = trim((string) ($fields['displayname'] ?? ''));
        if ($displayname === '' && $holidays) {
            $displayname = 'Holidays (' . $holidayCountry . ')';
        }
        if ($displayname === '') {
            throw new ApiException('Display name is required', 400);
        }
        $description = trim((string) ($fields['description'] ?? ''));
        if ($holidays && $description === '') {
            $description = 'Public holidays for ' . $holidayCountry . ' (this year and next).';
        }
        $color = $this->store->normalizeColor(isset($fields['color']) ? (string) $fields['color'] : ($holidays ? '#DC2626' : ''));

        $uri = $this->store->uniqueCalendarUri($username, $displayname);
        $properties = [
            '{DAV:}displayname' => $displayname,
            '{urn:ietf:params:xml:ns:caldav}calendar-description' => $description,
        ];
        if ($color !== '') {
            $properties['{http://apple.com/ns/ical/}calendar-color'] = $color;
        }
        // Respect system Tasks/Notes flags for supported components (CalDAV clients)
        $compList = \Baikal\Core\Tools::defaultCalendarComponents();
        $properties['{urn:ietf:params:xml:ns:caldav}supported-calendar-component-set'] =
            new \Sabre\CalDAV\Xml\Property\SupportedCalendarComponentSet(
                array_values(array_filter(explode(',', $compList)))
            );

        $ids = $this->store->backend()->createCalendar('principals/' . $username, $uri, $properties);
        $instanceId = is_array($ids) ? (int) $ids[1] : 0;

        $this->store->meta()->set($instanceId, [
            'readOnly'        => $readOnly,
            'holidaysCountry' => $holidays ? $holidayCountry : null,
        ]);

        $holidayImport = null;
        if ($holidays) {
            $ics = Holidays::buildIcs($holidayCountry, $displayname);
            // Bypass read-only for the initial seed import
            $holidayImport = $this->importer->importCalendar($username, $instanceId, $ics, true);
        }

        foreach ($this->listCalendars($username) as $cal) {
            if ((int) $cal['id'] === $instanceId) {
                if ($holidayImport !== null) {
                    $cal['holidayImport'] = $holidayImport;
                }

                return $cal;
            }
        }

        return [
            'id'              => $instanceId,
            'calendarId'      => is_array($ids) ? (int) $ids[0] : 0,
            'instanceId'      => $instanceId,
            'uri'             => $uri,
            'displayname'     => $displayname,
            'description'     => $description,
            'color'           => $color,
            'access'          => 'owner',
            'accessCode'      => SharingPlugin::ACCESS_SHAREDOWNER,
            'canShare'        => true,
            'components'      => \Baikal\Core\Tools::defaultCalendarComponents(),
            'readOnly'        => $readOnly,
            'holidaysCountry' => $holidays ? $holidayCountry : null,
            'holidayImport'   => $holidayImport,
        ];
    }

    /**
     * Update display name, description, and/or color on an owned calendar.
     *
     * @param array{displayname?: string, description?: string, color?: string} $fields
     *
     * @return array<string, mixed>
     */
    public function updateCalendar(string $username, int $instanceId, array $fields): array {
        $calId = $this->store->requireOwnedCalendarId($username, $instanceId);
        $mutations = [];

        if (array_key_exists('displayname', $fields)) {
            $name = trim((string) $fields['displayname']);
            if ($name === '') {
                throw new ApiException('Display name cannot be empty', 400);
            }
            if (mb_strlen($name) > 200) {
                throw new ApiException('Display name is too long (max 200)', 400);
            }
            $mutations['{DAV:}displayname'] = $name;
        }

        if (array_key_exists('description', $fields)) {
            $desc = trim((string) $fields['description']);
            if (mb_strlen($desc) > 2000) {
                throw new ApiException('Description is too long (max 2000)', 400);
            }
            $mutations['{urn:ietf:params:xml:ns:caldav}calendar-description'] = $desc;
        }

        if (array_key_exists('color', $fields)) {
            $mutations['{http://apple.com/ns/ical/}calendar-color'] = $this->store->normalizeColor((string) $fields['color']);
        }

        if ($mutations === []) {
            throw new ApiException('No fields to update (displayname, description, color)', 400);
        }

        $propPatch = new PropPatch($mutations);
        $this->store->backend()->updateCalendar($calId, $propPatch);
        if (!$propPatch->commit()) {
            throw new ApiException('Failed to update calendar properties', 500);
        }

        foreach ($this->listCalendars($username) as $cal) {
            if ((int) $cal['id'] === $instanceId) {
                return $cal;
            }
        }

        throw new ApiException('Calendar updated but could not be reloaded', 500);
    }

    /**
     * Permanently delete an owned calendar (and all objects / share instances).
     */
    public function deleteCalendar(string $username, int $instanceId): void {
        $calId = $this->store->requireOwnedCalendarId($username, $instanceId);
        // sabre only fully wipes when access is SHAREDOWNER; NOTSHARED would orphan data
        $stmt = $this->store->pdo()->prepare('SELECT access FROM calendarinstances WHERE id = ?');
        $stmt->execute([$instanceId]);
        $access = (int) $stmt->fetchColumn();
        if ($access === SharingPlugin::ACCESS_NOTSHARED) {
            $upd = $this->store->pdo()->prepare('UPDATE calendarinstances SET access = ? WHERE id = ?');
            $upd->execute([SharingPlugin::ACCESS_SHAREDOWNER, $instanceId]);
        }
        $this->store->backend()->deleteCalendar($calId);
        $this->store->meta()->remove($instanceId);
    }
}
