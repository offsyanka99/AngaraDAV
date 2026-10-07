<?php

/**
 * Unit checks for CalendarItemService VTODO/VJOURNAL parse helpers via create/list on SQLite.
 * Run: php tests/php/CalendarItemServiceTest.php.
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Portal\CalendarItemService;
use Sabre\CalDAV\Backend\PDO as CaldavBackend;
use Sabre\VObject\Reader;

$failures = 0;
function assert_true(bool $cond, string $msg): void {
    global $failures;
    if ($cond) {
        echo "OK  $msg\n";

        return;
    }
    echo "FAIL $msg\n";
    ++$failures;
}

// Minimal sabre schema subset
$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec(<<<'SQL'
CREATE TABLE calendars (id integer primary key, synctoken integer, components text);
CREATE TABLE calendarinstances (
  id integer primary key, calendarid integer, principaluri text, access integer,
  displayname text, uri text, description text, calendarorder integer, calendarcolor text,
  timezone text, transparent bool, share_href text, share_displayname text, share_invitestatus integer
);
CREATE TABLE calendarobjects (
  id integer primary key, calendardata blob, uri text, calendarid integer,
  lastmodified integer, etag text, size integer, componenttype text,
  firstoccurence integer, lastoccurence integer, uid text
);
CREATE TABLE calendarchanges (
  id integer primary key, uri text, synctoken integer, calendarid integer, operation integer
);
CREATE TABLE calendarsubscriptions (
  id integer primary key, uri text, principaluri text, source text, displayname text,
  refreshrate text, calendarorder integer, calendarcolor text, striptodos bool, stripalarms bool,
  stripattachments bool, lastmodified int
);
CREATE TABLE schedulingobjects (
  id integer primary key, principaluri text, calendardata blob, uri text,
  lastmodified integer, etag text, size integer
);
CREATE TABLE principals (id integer primary key, uri text, email text, displayname text);
CREATE TABLE users (id integer primary key, username text, digesta1 text);
SQL);

$pdo->exec("INSERT INTO principals (uri, email, displayname) VALUES ('principals/alice','a@x','Alice')");
$pdo->exec("INSERT INTO users (username, digesta1) VALUES ('alice','x')");
$pdo->exec("INSERT INTO calendars (id, synctoken, components) VALUES (1, 1, 'VEVENT,VTODO,VJOURNAL')");
$pdo->exec("INSERT INTO calendarinstances (id, calendarid, principaluri, access, displayname, uri)
  VALUES (10, 1, 'principals/alice', 1, 'Work', 'work')");

// Portal meta path in temp
$metaPath = sys_get_temp_dir() . '/baikal-items-meta-' . bin2hex(random_bytes(4)) . '.json';
$meta = new Baikal\Portal\PortalMeta($metaPath);
$svc = new CalendarItemService($pdo, $meta);

$task = $svc->createItem('alice', CalendarItemService::KIND_TASK, [
    'instanceId'  => 10,
    'summary'     => 'Buy milk',
    'description' => '2%',
    'status'      => 'NEEDS-ACTION',
    'due'         => '2030-06-01T12:00:00+00:00',
    'priority'    => 5,
    'percent'     => 0,
]);
assert_true(($task['summary'] ?? '') === 'Buy milk', 'create task summary');
assert_true(($task['status'] ?? '') === 'NEEDS-ACTION', 'create task status');
assert_true(!empty($task['uri']), 'create task uri');
assert_true((int) ($task['instanceId'] ?? 0) === 10, 'create task instance');

$list = $svc->listItems('alice', CalendarItemService::KIND_TASK);
assert_true(count($list) === 1, 'list one task');
assert_true($list[0]['summary'] === 'Buy milk', 'list task summary');

$upd = $svc->updateItem('alice', CalendarItemService::KIND_TASK, 10, $task['uri'], [
    'status'  => 'COMPLETED',
    'percent' => 100,
]);
assert_true($upd['status'] === 'COMPLETED', 'update task completed');
assert_true((int) $upd['percent'] === 100, 'update task percent');

// Subtasks via RELATED-TO;RELTYPE=PARENT
assert_true(!empty($task['uid']), 'parent task has uid');
$sub = $svc->createItem('alice', CalendarItemService::KIND_TASK, [
    'instanceId' => 10,
    'summary'    => 'Buy 2% milk',
    'status'     => 'NEEDS-ACTION',
    'parentUid'  => $task['uid'],
]);
assert_true(($sub['parentUid'] ?? null) === $task['uid'], 'subtask parentUid set');
assert_true(!empty($sub['uid']), 'subtask has uid');
$listWithSub = $svc->listItems('alice', CalendarItemService::KIND_TASK);
$foundSub = null;
foreach ($listWithSub as $row) {
    if (($row['uri'] ?? '') === $sub['uri']) {
        $foundSub = $row;
        break;
    }
}
assert_true($foundSub !== null && ($foundSub['parentUid'] ?? null) === $task['uid'], 'list includes parentUid');

// Clear parent
$cleared = $svc->updateItem('alice', CalendarItemService::KIND_TASK, 10, $sub['uri'], [
    'parentUid' => null,
]);
assert_true(($cleared['parentUid'] ?? null) === null, 'parent cleared');

// Re-attach and ensure delete parent detaches children
$svc->updateItem('alice', CalendarItemService::KIND_TASK, 10, $sub['uri'], [
    'parentUid' => $task['uid'],
]);
$svc->deleteItem('alice', CalendarItemService::KIND_TASK, 10, $task['uri']);
$afterDel = $svc->getItem('alice', CalendarItemService::KIND_TASK, 10, $sub['uri']);
assert_true(($afterDel['parentUid'] ?? null) === null, 'delete parent detaches subtask');
$rawAfter = $pdo->prepare(
    "SELECT calendardata FROM calendarobjects WHERE calendarid = 1 AND uri = ?"
);
$rawAfter->execute([$sub['uri']]);
$icsAfter = (string) $rawAfter->fetchColumn();
assert_true(
    !preg_match('/^RELATED-TO/mi', $icsAfter),
    'promote strips RELATED-TO from child ICS'
);
$svc->deleteItem('alice', CalendarItemService::KIND_TASK, 10, $sub['uri']);
assert_true(count($svc->listItems('alice', CalendarItemService::KIND_TASK)) === 0, 'subtask deleted');

// Cascade: delete parent and descendants only when requested
$p2 = $svc->createItem('alice', CalendarItemService::KIND_TASK, [
    'instanceId' => 10,
    'summary'    => 'Checklist',
    'status'     => 'NEEDS-ACTION',
]);
$c1 = $svc->createItem('alice', CalendarItemService::KIND_TASK, [
    'instanceId' => 10,
    'summary'    => 'Item A',
    'status'     => 'NEEDS-ACTION',
    'parentUid'  => $p2['uid'],
]);
$c2 = $svc->createItem('alice', CalendarItemService::KIND_TASK, [
    'instanceId' => 10,
    'summary'    => 'Item B',
    'status'     => 'NEEDS-ACTION',
    'parentUid'  => $p2['uid'],
]);
$gc = $svc->createItem('alice', CalendarItemService::KIND_TASK, [
    'instanceId' => 10,
    'summary'    => 'Item A.1',
    'status'     => 'NEEDS-ACTION',
    'parentUid'  => $c1['uid'],
]);
$svc->deleteItem('alice', CalendarItemService::KIND_TASK, 10, $p2['uri'], true);
$left = $svc->listItems('alice', CalendarItemService::KIND_TASK);
$leftUris = array_map(static fn ($r) => $r['uri'] ?? '', $left);
assert_true(!in_array($p2['uri'], $leftUris, true), 'cascade deleted parent');
assert_true(!in_array($c1['uri'], $leftUris, true), 'cascade deleted child');
assert_true(!in_array($c2['uri'], $leftUris, true), 'cascade deleted sibling child');
assert_true(!in_array($gc['uri'], $leftUris, true), 'cascade deleted grandchild');

// Fresh parent for later cleanup path already empty — create note tests next
$task = $svc->createItem('alice', CalendarItemService::KIND_TASK, [
    'instanceId' => 10,
    'summary'    => 'Cleanup parent',
    'status'     => 'NEEDS-ACTION',
]);

$note = $svc->createItem('alice', CalendarItemService::KIND_NOTE, [
    'instanceId'  => 10,
    'summary'     => 'Meeting notes',
    'description' => 'Discussed roadmap',
]);
assert_true($note['summary'] === 'Meeting notes', 'create note');
assert_true($note['dtstart'] === null, 'create note without date leaves dtstart empty');

$htmlNote = $svc->createItem('alice', CalendarItemService::KIND_NOTE, [
    'instanceId'  => 10,
    'summary'     => 'Rich note',
    'description' => '<p>Hello <strong>team</strong></p><script>alert(1)</script>',
]);
assert_true(str_contains((string) $htmlNote['description'], '<strong>team</strong>'), 'html note round-trip');
assert_true(!str_contains((string) $htmlNote['description'], '<script>'), 'html note strips script');
$icsRow = $pdo->query('SELECT calendardata FROM calendarobjects WHERE uri = ' . $pdo->quote($htmlNote['uri']))->fetch(PDO::FETCH_ASSOC);
assert_true(is_array($icsRow) && isset($icsRow['calendardata']), 'rich note stored as calendar object');
$vcal = Reader::read((string) $icsRow['calendardata'], Reader::OPTION_FORGIVING);
$journal = $vcal->VJOURNAL;
$desc = isset($journal->DESCRIPTION) ? (string) $journal->DESCRIPTION : '';
$alt = '';
foreach ($journal->select('X-ALT-DESC') as $prop) {
    if (strtolower((string) ($prop['FMTTYPE'] ?? '')) === 'text/html') {
        $alt = (string) $prop;
        break;
    }
}
assert_true(str_contains($desc, '**team**'), 'DESCRIPTION is markdown for jtx Board');
assert_true(!str_contains($desc, '<strong>'), 'DESCRIPTION is not raw HTML');
assert_true(str_contains($alt, '<strong>team</strong>'), 'X-ALT-DESC keeps HTML for the portal');
$vcal->destroy();
$found = $svc->listItems('alice', CalendarItemService::KIND_NOTE, 'team', 'summary', 'asc');
assert_true(count($found) >= 1, 'plain-text search matches html note');
$svc->deleteItem('alice', CalendarItemService::KIND_NOTE, 10, $htmlNote['uri']);

$jtxIcs = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//jtx Board//EN\r\nBEGIN:VJOURNAL\r\nUID:jtx-md-1\r\nDTSTAMP:20260101T000000Z\r\nSUMMARY:From jtx\r\nDESCRIPTION:Hello **team**\r\nEND:VJOURNAL\r\nEND:VCALENDAR\r\n";
$dav = new CaldavBackend($pdo);
$dav->createCalendarObject([1, 10], 'jtx-md-1.ics', $jtxIcs);
$fromJtx = $svc->getItem('alice', CalendarItemService::KIND_NOTE, 10, 'jtx-md-1.ics');
assert_true(str_contains((string) $fromJtx['description'], '<strong>team</strong>'), 'jtx markdown DESCRIPTION becomes portal HTML');
$svc->deleteItem('alice', CalendarItemService::KIND_NOTE, 10, 'jtx-md-1.ics');
$notes = $svc->listItems('alice', CalendarItemService::KIND_NOTE, '', 'summary', 'asc');
assert_true(count($notes) === 1, 'list one note');

$copied = $svc->bulkItems('alice', CalendarItemService::KIND_NOTE, 'copy', [
    ['instanceId' => 10, 'uri' => $note['uri']],
]);
assert_true(($copied['ok'] ?? 0) === 1, 'copy note ok');
$afterCopy = $svc->listItems('alice', CalendarItemService::KIND_NOTE, '', 'summary', 'asc');
assert_true(count($afterCopy) === 2, 'list includes copied note');
$copyRow = null;
foreach ($afterCopy as $row) {
    if (($row['uri'] ?? '') !== ($note['uri'] ?? '')) {
        $copyRow = $row;
        break;
    }
}
assert_true($copyRow !== null && str_contains((string) ($copyRow['summary'] ?? ''), '(copy)'), 'copied note summary');
$svc->deleteItem('alice', CalendarItemService::KIND_NOTE, 10, $copyRow['uri']);

$svc->deleteItem('alice', CalendarItemService::KIND_TASK, 10, $task['uri']);
assert_true(count($svc->listItems('alice', CalendarItemService::KIND_TASK)) === 0, 'task deleted');

$svc->deleteItem('alice', CalendarItemService::KIND_NOTE, 10, $note['uri']);
assert_true(count($svc->listItems('alice', CalendarItemService::KIND_NOTE)) === 0, 'note deleted');

// Recurring VTODO: one series row, completion keeps a copy and advances due.
$series = $svc->createItem('alice', CalendarItemService::KIND_TASK, [
    'instanceId' => 10,
    'summary'    => 'Water plants',
    'status'     => 'NEEDS-ACTION',
    'due'        => '2030-06-02T12:00:00+00:00',
    'repeat'     => ['freq' => 'WEEKLY', 'interval' => 1],
]);
assert_true(!empty($series['hasRrule']), 'repeating task has RRULE');
assert_true(($series['repeat']['freq'] ?? '') === 'WEEKLY', 'repeat freq weekly');
assert_true(str_contains((string) ($series['due'] ?? ''), '2030-06-02'), 'series due is the first occurrence');
$child = $svc->createItem('alice', CalendarItemService::KIND_TASK, [
    'instanceId' => 10,
    'summary'    => 'Check soil',
    'status'     => 'NEEDS-ACTION',
    'parentUid'  => $series['uid'],
]);
$done = $svc->updateItem('alice', CalendarItemService::KIND_TASK, 10, $series['uri'], [
    'status' => 'COMPLETED',
]);
assert_true(!empty($done['occurrenceCompleted']), 'completion reports the occurrence');
assert_true(($done['status'] ?? '') === 'NEEDS-ACTION', 'series stays open');
assert_true(!empty($done['hasRrule']), 'series still repeats');
assert_true(str_contains((string) ($done['due'] ?? ''), '2030-06-09'), 'due moves to the next week');
assert_true((int) ($done['percent'] ?? -1) === 0, 'next occurrence percent resets');
$afterRepeat = $svc->listItems('alice', CalendarItemService::KIND_TASK);
$completedCopy = null;
$seriesRow = null;
$childRow = null;
foreach ($afterRepeat as $row) {
    if (($row['uri'] ?? '') === $series['uri']) {
        $seriesRow = $row;
    } elseif (($row['uri'] ?? '') === $child['uri']) {
        $childRow = $row;
    } elseif (($row['summary'] ?? '') === 'Water plants' && ($row['status'] ?? '') === 'COMPLETED') {
        $completedCopy = $row;
    }
}
assert_true($seriesRow !== null && !empty($seriesRow['hasRrule']), 'list keeps one open series');
assert_true($completedCopy !== null, 'completed occurrence is its own task');
assert_true(empty($completedCopy['hasRrule']), 'completed occurrence has no RRULE');
assert_true(($completedCopy['parentUid'] ?? null) === null, 'completed occurrence is not a subtask');
assert_true(str_contains((string) ($completedCopy['due'] ?? ''), '2030-06-02'), 'completed occurrence keeps the finished due date');
assert_true($childRow !== null && ($childRow['parentUid'] ?? null) === $series['uid'], 'subtask stays on the series');

$last = $svc->createItem('alice', CalendarItemService::KIND_TASK, [
    'instanceId' => 10,
    'summary'    => 'One time repeat',
    'status'     => 'NEEDS-ACTION',
    'due'        => '2030-07-01T09:00:00+00:00',
    'repeat'     => ['freq' => 'DAILY', 'count' => 1],
]);
$closed = $svc->updateItem('alice', CalendarItemService::KIND_TASK, 10, $last['uri'], [
    'status' => 'COMPLETED',
]);
assert_true(!empty($closed['occurrenceCompleted']), 'last occurrence reports completion');
assert_true(($closed['status'] ?? '') === 'COMPLETED', 'last occurrence completes the series');
assert_true(empty($closed['hasRrule']), 'last occurrence drops RRULE');
$closedTwins = 0;
foreach ($svc->listItems('alice', CalendarItemService::KIND_TASK) as $row) {
    if (($row['summary'] ?? '') === 'One time repeat') {
        ++$closedTwins;
    }
}
assert_true($closedTwins === 1, 'last occurrence does not create a second task');

$needsDue = false;
try {
    $svc->createItem('alice', CalendarItemService::KIND_TASK, [
        'instanceId' => 10,
        'summary'    => 'No due',
        'repeat'     => ['freq' => 'DAILY'],
    ]);
} catch (Baikal\Portal\ApiException $e) {
    $needsDue = $e->getStatus() === 400;
}
assert_true($needsDue, 'repeat without a due date is rejected');

$clearDue = false;
try {
    $svc->updateItem('alice', CalendarItemService::KIND_TASK, 10, $series['uri'], [
        'due' => null,
    ]);
} catch (Baikal\Portal\ApiException $e) {
    $clearDue = $e->getStatus() === 400;
}
assert_true($clearDue, 'clearing due on a repeating task is rejected');
$still = $svc->getItem('alice', CalendarItemService::KIND_TASK, 10, $series['uri']);
assert_true(str_contains((string) ($still['due'] ?? ''), '2030-06-09'), 'rejected clear leaves the series due');

$bulk = $svc->bulkItems('alice', CalendarItemService::KIND_TASK, 'update', [
    ['instanceId' => 10, 'uri' => $series['uri']],
], ['status' => 'COMPLETED']);
assert_true(($bulk['ok'] ?? 0) === 1 && ($bulk['failed'] ?? 1) === 0, 'bulk complete rolls a repeating task');
$afterBulk = $svc->getItem('alice', CalendarItemService::KIND_TASK, 10, $series['uri']);
assert_true(($afterBulk['status'] ?? '') === 'NEEDS-ACTION', 'bulk complete leaves the series open');
assert_true(str_contains((string) ($afterBulk['due'] ?? ''), '2030-06-16'), 'bulk complete advances one week');

$counted = $svc->createItem('alice', CalendarItemService::KIND_TASK, [
    'instanceId' => 10,
    'summary'    => 'Three days',
    'status'     => 'NEEDS-ACTION',
    'due'        => '2030-08-01T09:00:00+00:00',
    'repeat'     => ['freq' => 'DAILY', 'count' => 3],
]);
$countedNext = $svc->updateItem('alice', CalendarItemService::KIND_TASK, 10, $counted['uri'], [
    'status' => 'COMPLETED',
]);
assert_true(str_contains((string) ($countedNext['due'] ?? ''), '2030-08-02'), 'counted series advances one day');
assert_true((int) ($countedNext['repeat']['count'] ?? 0) === 2, 'COUNT decrements for the remaining occurrences');

foreach ($svc->listItems('alice', CalendarItemService::KIND_TASK) as $row) {
    $svc->deleteItem('alice', CalendarItemService::KIND_TASK, 10, (string) $row['uri']);
}
assert_true(count($svc->listItems('alice', CalendarItemService::KIND_TASK)) === 0, 'recurring fixtures removed');

$store = new Baikal\Portal\CalendarStore($pdo, $meta);
$events = new Baikal\Portal\EventService($store);
$ev = $events->createEvent('alice', 10, [
    'summary'  => 'Standup',
    'start'    => '2030-06-02T15:00:00+00:00',
    'end'      => '2030-06-02T15:30:00+00:00',
    'allDay'   => false,
    'reminder' => 15,
]);
assert_true(($ev['reminderMinutes'] ?? null) === 15, 'event reminder is 15 minutes');
assert_true(($ev['reminderCustom'] ?? true) === false, 'preset reminder is not custom');
$listed = $events->listEvents('alice', 10, '2030-06-01', '2030-06-03');
$found = null;
foreach ($listed as $row) {
    if (($row['uri'] ?? '') === $ev['uri']) {
        $found = $row;
    }
}
assert_true(is_array($found) && ($found['reminderMinutes'] ?? null) === 15, 'listEvents carries the display reminder');
$kept = $events->updateEvent('alice', 10, $ev['uri'], [
    'summary'  => 'Standup renamed',
    'reminder' => 'keep',
]);
assert_true(($kept['summary'] ?? '') === 'Standup renamed', 'keep reminder still updates the title');
assert_true(($kept['reminderMinutes'] ?? null) === 15, 'keep leaves the display reminder');

$calId = [1, 10];
$obj = $store->backend()->getCalendarObject($calId, $ev['uri']);
$rawIcs = $store->calendardataToString($obj['calendardata']);
$vcal = Reader::read($rawIcs, Reader::OPTION_FORGIVING);
$vcal->VEVENT->add('VALARM', [
    'ACTION'      => 'EMAIL',
    'SUMMARY'     => 'Mail',
    'DESCRIPTION' => 'Mail body',
    'TRIGGER'     => '-PT5M',
]);
$store->backend()->updateCalendarObject($calId, $ev['uri'], $vcal->serialize());
$vcal->destroy();

$withMail = $events->getEvent('alice', 10, $ev['uri']);
assert_true(($withMail['reminderMinutes'] ?? null) === 15, 'email alarm does not replace the display reminder');
$changed = $events->updateEvent('alice', 10, $ev['uri'], [
    'reminder' => 60,
]);
assert_true(($changed['reminderMinutes'] ?? null) === 60, 'display reminder becomes 1 hour');
$afterIcs = $store->calendardataToString($store->backend()->getCalendarObject($calId, $ev['uri'])['calendardata']);
assert_true(str_contains($afterIcs, 'ACTION:EMAIL'), 'email alarm stays on the event');
assert_true(str_contains($afterIcs, '-PT1H') || str_contains($afterIcs, '-PT60M'), 'display trigger is one hour');

$vcal = Reader::read($afterIcs, Reader::OPTION_FORGIVING);
foreach ($vcal->VEVENT->select('VALARM') as $alarm) {
    if (strtoupper((string) $alarm->ACTION) === 'DISPLAY') {
        $alarm->TRIGGER = '-PT10M';
    }
}
$store->backend()->updateCalendarObject($calId, $ev['uri'], $vcal->serialize());
$vcal->destroy();
$custom = $events->getEvent('alice', 10, $ev['uri']);
assert_true(($custom['reminderCustom'] ?? false) === true, '10 minute display reminder is custom');
assert_true($custom['reminderMinutes'] === null, 'custom reminder has no preset minutes');
$listedCustom = $events->listEvents('alice', 10, '2030-06-01', '2030-06-03');
$foundCustom = null;
foreach ($listedCustom as $row) {
    if (($row['uri'] ?? '') === $ev['uri']) {
        $foundCustom = $row;
    }
}
assert_true(is_array($foundCustom) && $foundCustom['reminderMinutes'] === null, 'listEvents omits a custom reminder');
$stillCustom = $events->updateEvent('alice', 10, $ev['uri'], [
    'summary'  => 'Standup',
    'reminder' => 'keep',
]);
assert_true(($stillCustom['reminderCustom'] ?? false) === true, 'keep leaves a custom reminder');
$cleared = $events->updateEvent('alice', 10, $ev['uri'], [
    'reminder' => null,
]);
assert_true($cleared['reminderMinutes'] === null, 'clearing removes the display reminder');
assert_true(($cleared['reminderCustom'] ?? true) === false, 'cleared reminder is not custom');
$clearedIcs = $store->calendardataToString($store->backend()->getCalendarObject($calId, $ev['uri'])['calendardata']);
assert_true(str_contains($clearedIcs, 'ACTION:EMAIL'), 'clearing the display reminder leaves the email alarm');
assert_true(!str_contains($clearedIcs, '-PT10M'), 'custom display trigger is removed');

$bad = false;
try {
    $events->updateEvent('alice', 10, $ev['uri'], ['reminder' => 10]);
} catch (Baikal\Portal\ApiException $e) {
    $bad = $e->getStatus() === 400;
}
assert_true($bad, 'a reminder outside the presets is rejected');

$atStart = $events->updateEvent('alice', 10, $ev['uri'], [
    'reminder' => 0,
]);
assert_true(($atStart['reminderMinutes'] ?? null) === 0, 'at start is zero minutes');
assert_true(($atStart['reminderCustom'] ?? true) === false, 'at start is a preset');
$dayBefore = $events->updateEvent('alice', 10, $ev['uri'], [
    'reminder' => 1440,
]);
assert_true(($dayBefore['reminderMinutes'] ?? null) === 1440, 'one day before is a preset');
$weekBefore = $events->updateEvent('alice', 10, $ev['uri'], [
    'reminder' => 10080,
]);
assert_true(($weekBefore['reminderMinutes'] ?? null) === 10080, 'one week before is a preset');
$weekIcs = $store->calendardataToString($store->backend()->getCalendarObject($calId, $ev['uri'])['calendardata']);
assert_true(str_contains($weekIcs, '-P7D') || str_contains($weekIcs, '-P1W'), 'week reminder is a duration');
assert_true(str_contains($weekIcs, 'ACTION:EMAIL'), 'email alarm stays after a preset change');
$listedWeek = $events->listEvents('alice', 10, '2030-06-01', '2030-06-03');
$foundWeek = null;
foreach ($listedWeek as $row) {
    if (($row['uri'] ?? '') === $ev['uri']) {
        $foundWeek = $row;
    }
}
assert_true(is_array($foundWeek) && ($foundWeek['reminderMinutes'] ?? null) === 10080, 'listEvents carries a week reminder');

$events->deleteEvent('alice', 10, $ev['uri']);

$seriesEv = $events->createEvent('alice', 10, [
    'summary'  => 'Weekly',
    'start'    => '2030-06-02T15:00:00+00:00',
    'end'      => '2030-06-02T16:00:00+00:00',
    'allDay'   => false,
    'reminder' => 30,
    'repeat'   => ['freq' => 'WEEKLY', 'count' => 3],
]);
$seriesRows = array_values(array_filter(
    $events->listEvents('alice', 10, '2030-06-01', '2030-06-20'),
    static fn (array $row): bool => ($row['uri'] ?? '') === $seriesEv['uri']
));
assert_true(count($seriesRows) >= 2, 'listEvents expands a repeating event');
foreach ($seriesRows as $hit) {
    assert_true(($hit['reminderMinutes'] ?? null) === 30, 'each occurrence keeps the series reminder');
}
$events->deleteEvent('alice', 10, $seriesEv['uri']);

@unlink($metaPath);

if ($failures > 0) {
    fwrite(STDERR, "\n$failures failure(s)\n");
    exit(1);
}
echo "\nAll CalendarItemService tests passed.\n";
exit(0);
