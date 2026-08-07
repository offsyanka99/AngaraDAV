<?php

/**
 * Unit checks for Baikal\Portal\Admin\AdminUserResourceService.
 *
 * Run: php tests/php/AdminUserResourceServiceTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Portal\Admin\AdminUserResourceService;
use Baikal\Portal\ApiException;

$failures = 0;

function assert_true(bool $condition, string $message): void {
    global $failures;
    if ($condition) {
        echo "OK  $message\n";

        return;
    }
    echo "FAIL $message\n";
    ++$failures;
}

$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, digesta1 TEXT NOT NULL)');
$pdo->exec('CREATE TABLE principals (id INTEGER PRIMARY KEY, uri TEXT, email TEXT, displayname TEXT)');
$pdo->exec('CREATE TABLE calendars (id INTEGER PRIMARY KEY, synctoken INTEGER DEFAULT 1, components TEXT NOT NULL)');
$pdo->exec('CREATE TABLE calendarinstances (
    id INTEGER PRIMARY KEY, calendarid INTEGER, principaluri TEXT, access INTEGER DEFAULT 1,
    displayname TEXT, uri TEXT, description TEXT, calendarcolor TEXT, calendarorder INTEGER DEFAULT 0,
    share_invitestatus INTEGER DEFAULT 2
)');
$pdo->exec('CREATE TABLE calendarobjects (id INTEGER PRIMARY KEY, calendarid INTEGER, uri TEXT)');
$pdo->exec('CREATE TABLE calendarchanges (id INTEGER PRIMARY KEY, calendarid INTEGER)');
$pdo->exec('CREATE TABLE addressbooks (
    id INTEGER PRIMARY KEY, principaluri TEXT, displayname TEXT, uri TEXT, description TEXT, synctoken INTEGER DEFAULT 1
)');
$pdo->exec('CREATE TABLE cards (id INTEGER PRIMARY KEY, addressbookid INTEGER, uri TEXT)');
$pdo->exec('CREATE TABLE addressbookchanges (id INTEGER PRIMARY KEY, addressbookid INTEGER)');

$pdo->exec("INSERT INTO users (username, digesta1) VALUES ('alice', 'h')");
$pdo->exec("INSERT INTO principals (uri, email, displayname) VALUES ('principals/alice', 'a@e.com', 'Alice')");

$config = ['system' => ['tasks_enabled' => true, 'notes_enabled' => true]];
$svc = new AdminUserResourceService($pdo, $config);

// Calendars
$cal = $svc->createCalendar('alice', [
    'uri'           => 'work',
    'displayname'   => 'Work',
    'description'   => 'Work cal',
    'calendarcolor' => '#FF0000',
    'todos'         => true,
    'notes'         => false,
]);
assert_true($cal['uri'] === 'work', 'calendar uri');
assert_true($cal['todos'] === true, 'calendar has todos');
assert_true($cal['notes'] === false, 'calendar no notes');
assert_true(str_contains($cal['davUri'], 'alice') && str_contains($cal['davUri'], 'work'), 'davUri set');

$list = $svc->listCalendars('alice');
assert_true(count($list) === 1, 'one calendar');

$upd = $svc->updateCalendar('alice', (int) $cal['instanceId'], [
    'displayname' => 'Work updated',
    'notes'       => true,
]);
assert_true($upd['displayname'] === 'Work updated', 'calendar rename');
assert_true($upd['notes'] === true, 'notes enabled');

try {
    $svc->createCalendar('alice', ['uri' => 'work', 'displayname' => 'Dup']);
    assert_true(false, 'dup calendar uri should fail');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 409, 'dup calendar → 409');
}

try {
    $svc->deleteCalendar('alice', (int) $cal['instanceId'], false);
    assert_true(false, 'delete without confirm');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 400, 'delete cal no confirm → 400');
}
$svc->deleteCalendar('alice', (int) $cal['instanceId'], true);
assert_true(count($svc->listCalendars('alice')) === 0, 'calendar deleted');

// Address books
$ab = $svc->createAddressBook('alice', [
    'uri'         => 'personal',
    'displayname' => 'Personal',
    'description' => 'AB',
]);
assert_true($ab['uri'] === 'personal', 'ab uri');
assert_true($ab['contactCount'] === 0, 'ab empty');

$pdo->exec("INSERT INTO cards (addressbookid, uri) VALUES (" . (int) $ab['id'] . ", 'c1.vcf')");
$ab2 = $svc->getAddressBook('alice', (int) $ab['id']);
assert_true($ab2['contactCount'] === 1, 'ab contact count');

try {
    $svc->deleteAddressBook('alice', (int) $ab['id'], true, false);
    assert_true(false, 'non-empty ab without force');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 409, 'non-empty ab → 409');
}
$svc->deleteAddressBook('alice', (int) $ab['id'], true, true);
assert_true(count($svc->listAddressBooks('alice')) === 0, 'ab deleted');

try {
    $svc->listCalendars('nobody');
    assert_true(false, 'missing user');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 404, 'missing user → 404');
}

if ($failures > 0) {
    echo "\n$failures failure(s)\n";
    exit(1);
}
echo "\nAll AdminUserResourceService tests passed.\n";
exit(0);
