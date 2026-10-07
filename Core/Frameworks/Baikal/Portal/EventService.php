<?php

namespace Baikal\Portal;

use Sabre\DAV\Sharing\Plugin as SharingPlugin;
use Sabre\DAV\UUIDUtil;
use Sabre\VObject\Component\VCalendar;
use Sabre\VObject\Reader;

/**
 * VEVENT CRUD, month-grid listing, and one relative display reminder for the portal Calendar tab.
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
     * Preset display-reminder minutes travel with each occurrence. Sabre's expand
     * can drop VALARM, so the minutes come from the master VEVENT (no RECURRENCE-ID).
     * A custom display alarm is null here; email and audio alarms are not listed.
     *
     * @return list<array{uid: string, uri: string, summary: string, start: string, end: string|null, allDay: bool, reminderMinutes: int|null}>
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
            $reminderMinutes = $this->seriesReminderMinutes($vcal);
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
                        'uid'              => $uid,
                        'uri'              => $uri,
                        'summary'          => $summary !== '' ? $summary : '(No title)',
                        'start'            => $startStr,
                        'end'              => $endStr,
                        'allDay'           => $allDay,
                        'reminderMinutes'  => $reminderMinutes,
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
            'hasRrule'        => false,
            'repeat'          => [
                'freq'     => '',
                'interval' => 1,
                'until'    => null,
                'count'    => null,
                'byDay'    => [],
            ],
            'reminderMinutes' => null,
            'reminderCustom'  => false,
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
        $repeat = RecurrenceRule::parse(isset($event->RRULE) ? $event->RRULE : null);
        $reminder = $this->readReminder($event);
        $out = [
            'uid'         => isset($event->UID) ? trim((string) $event->UID) : '',
            'summary'     => isset($event->SUMMARY) ? trim((string) $event->SUMMARY) : '',
            'description' => isset($event->DESCRIPTION) ? (string) $event->DESCRIPTION : '',
            'location'    => isset($event->LOCATION) ? trim((string) $event->LOCATION) : '',
            'start'       => $start,
            'end'         => $end,
            'allDay'      => $allDay,
            'hasRrule'        => $repeat['freq'] !== '',
            'repeat'          => $repeat,
            'reminderMinutes' => $reminder['minutes'],
            'reminderCustom'  => $reminder['custom'],
        ];
        $vcal->destroy();

        return $out;
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
                $rule = RecurrenceRule::build($rep);
                if ($rule !== null) {
                    $event->add('RRULE', $rule);
                }
            } elseif (is_string($rep) && trim($rep) !== '') {
                $event->add('RRULE', trim($rep));
            }
        }

        if (array_key_exists('reminder', $fields)) {
            $this->applyReminder($event, $fields['reminder']);
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

    /** Preset display reminders, in minutes before DTSTART. 0 is at the start. */
    private const REMINDER_MINUTES = [0, 5, 15, 30, 60, 1440, 10080];

    /**
     * Preset minutes on the series master. Overrides are not read; expand may drop VALARM.
     */
    private function seriesReminderMinutes(VCalendar $vcal): ?int {
        foreach ($vcal->getComponents() as $comp) {
            if (strtoupper((string) $comp->name) !== 'VEVENT') {
                continue;
            }
            if (isset($comp->{'RECURRENCE-ID'})) {
                continue;
            }

            return $this->readReminder($comp)['minutes'];
        }

        return null;
    }

    /**
     * @param mixed $event VEVENT component
     *
     * @return array{minutes: int|null, custom: bool}
     */
    private function readReminder($event): array {
        foreach ($this->componentValarms($event) as $alarm) {
            if (!$this->isManagedDisplayAlarm($alarm)) {
                continue;
            }
            $minutes = $this->minutesBeforeFromTrigger($alarm->TRIGGER ?? null);
            if ($minutes !== null && in_array($minutes, self::REMINDER_MINUTES, true)) {
                return ['minutes' => $minutes, 'custom' => false];
            }

            return ['minutes' => null, 'custom' => true];
        }

        return ['minutes' => null, 'custom' => false];
    }

    /**
     * @param mixed $event    VEVENT component
     * @param mixed $reminder null clears the portal display reminder; "keep" leaves alarms alone
     */
    private function applyReminder($event, $reminder): void {
        if ($reminder === 'keep') {
            return;
        }
        $minutes = null;
        if ($reminder === null || $reminder === '' || $reminder === false) {
            $minutes = null;
        } elseif (is_int($reminder) || (is_string($reminder) && preg_match('/^\d+$/', $reminder) === 1)) {
            $minutes = (int) $reminder;
            if (!in_array($minutes, self::REMINDER_MINUTES, true)) {
                throw new ApiException('Invalid reminder', 400);
            }
        } else {
            throw new ApiException('Invalid reminder', 400);
        }

        $managed = null;
        foreach ($this->componentValarms($event) as $alarm) {
            if ($this->isManagedDisplayAlarm($alarm)) {
                $managed = $alarm;
                break;
            }
        }
        if ($minutes === null) {
            if ($managed !== null) {
                $event->remove($managed);
            }

            return;
        }
        $trigger = $this->reminderTrigger($minutes);
        if ($managed !== null) {
            $managed->TRIGGER = $trigger;
            if (!isset($managed->ACTION) || trim((string) $managed->ACTION) === '') {
                $managed->ACTION = 'DISPLAY';
            }
            if (!isset($managed->DESCRIPTION) || trim((string) $managed->DESCRIPTION) === '') {
                $managed->DESCRIPTION = 'Reminder';
            }

            return;
        }
        $event->add('VALARM', [
            'ACTION'      => 'DISPLAY',
            'DESCRIPTION' => 'Reminder',
            'TRIGGER'     => $trigger,
        ]);
    }

    private function reminderTrigger(int $minutes): string {
        switch ($minutes) {
            case 0:
                return 'PT0S';
            case 5:
                return '-PT5M';
            case 15:
                return '-PT15M';
            case 30:
                return '-PT30M';
            case 60:
                return '-PT1H';
            case 1440:
                return '-P1D';
            case 10080:
                return '-P7D';
            default:
                throw new ApiException('Invalid reminder', 400);
        }
    }

    /**
     * @param mixed $trigger
     */
    private function minutesBeforeFromTrigger($trigger): ?int {
        $raw = trim((string) $trigger);
        if ($raw === '' || preg_match('/^\d{8}T/', $raw) === 1) {
            return null;
        }
        try {
            $iv = \Sabre\VObject\DateTimeParser::parseDuration($raw);
        } catch (\Throwable $e) {
            return null;
        }
        if (!$iv instanceof \DateInterval) {
            return null;
        }
        if ($iv->y !== 0 || $iv->m !== 0 || $iv->s !== 0) {
            return null;
        }
        $minutes = ($iv->d * 1440) + ($iv->h * 60) + $iv->i;
        if ($iv->invert === 1) {
            return $minutes > 0 ? $minutes : null;
        }

        return $minutes === 0 ? 0 : null;
    }

    /**
     * @param mixed $alarm VALARM component
     */
    private function isManagedDisplayAlarm($alarm): bool {
        $action = strtoupper(trim((string) ($alarm->ACTION ?? '')));
        if ($action !== 'DISPLAY') {
            return false;
        }
        if (!isset($alarm->TRIGGER)) {
            return false;
        }
        $valueType = strtoupper(trim((string) ($alarm->TRIGGER['VALUE'] ?? '')));
        if ($valueType !== '' && $valueType !== 'DURATION') {
            return false;
        }
        $related = strtoupper(trim((string) ($alarm->TRIGGER['RELATED'] ?? '')));
        if ($related !== '' && $related !== 'START') {
            return false;
        }
        if (isset($alarm->REPEAT) || isset($alarm->DURATION)) {
            return false;
        }
        $raw = trim((string) $alarm->TRIGGER);
        if ($raw === '' || preg_match('/^\d{8}T/', $raw) === 1) {
            return false;
        }

        return true;
    }

    /**
     * @param mixed $event VEVENT component
     *
     * @return list<object>
     */
    private function componentValarms($event): array {
        if (!is_object($event) || !method_exists($event, 'select')) {
            return [];
        }
        $list = $event->select('VALARM');
        if ($list instanceof \Traversable) {
            $list = iterator_to_array($list);
        }

        return is_array($list) ? array_values($list) : [];
    }
}
