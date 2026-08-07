<?php

/**
 * Unit checks for Baikal\Portal\Admin\AdminDashboardService.
 *
 * Run: php tests/php/AdminDashboardServiceTest.php
 * Requires: composer install and pdo_sqlite.
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Portal\Admin\AdminDashboardService;

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

// Minimal schema matching Baikal model tables used for counts
$pdo->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, digesta1 TEXT NOT NULL)');
$pdo->exec('CREATE TABLE calendarinstances (id INTEGER PRIMARY KEY, calendarid INTEGER, principaluri TEXT)');
$pdo->exec('CREATE TABLE calendarobjects (id INTEGER PRIMARY KEY, calendarid INTEGER, uri TEXT)');
$pdo->exec('CREATE TABLE addressbooks (id INTEGER PRIMARY KEY, principaluri TEXT, uri TEXT)');
$pdo->exec('CREATE TABLE cards (id INTEGER PRIMARY KEY, addressbookid INTEGER, uri TEXT)');

$pdo->exec("INSERT INTO users (username, digesta1) VALUES ('alice', 'h1'), ('bob', 'h2')");
$pdo->exec('INSERT INTO calendarinstances (calendarid, principaluri) VALUES (1, \'principals/alice\'), (2, \'principals/bob\'), (3, \'principals/alice\')');
$pdo->exec('INSERT INTO calendarobjects (calendarid, uri) VALUES (1, \'e1.ics\'), (1, \'e2.ics\')');
$pdo->exec('INSERT INTO addressbooks (principaluri, uri) VALUES (\'principals/alice\', \'default\'), (\'principals/bob\', \'default\')');
$pdo->exec('INSERT INTO cards (addressbookid, uri) VALUES (1, \'c1.vcf\'), (1, \'c2.vcf\'), (2, \'c3.vcf\')');

$config = [
    'system' => [
        'cal_enabled'   => true,
        'card_enabled'  => false,
        'files_enabled' => true,
        'tasks_enabled' => true,
        'notes_enabled' => false,
        'push_enabled'  => true,
    ],
];

$svc = new AdminDashboardService($pdo, $config);
$stats = $svc->stats();

assert_true($stats['users'] === 2, 'users count = 2');
assert_true($stats['calendars'] === 3, 'calendars (instances) count = 3');
assert_true($stats['events'] === 2, 'events (calendarobjects) count = 2');
assert_true($stats['addressBooks'] === 2, 'addressBooks count = 2');
assert_true($stats['contacts'] === 3, 'contacts count = 3');

assert_true($stats['services']['caldav'] === true, 'caldav service flag');
assert_true($stats['services']['carddav'] === false, 'carddav off');
assert_true($stats['services']['files'] === true, 'files on');
assert_true($stats['services']['tasks'] === true, 'tasks on');
assert_true($stats['services']['notes'] === false, 'notes off');
assert_true($stats['services']['push'] === true, 'push on');
assert_true($stats['services']['webAdmin'] === true, 'webAdmin legacy alias on');
assert_true(($stats['services']['administration'] ?? false) === true, 'administration service on');
assert_true(is_string($stats['version']), 'version key is string');
// Compact count aliases (nbusers / nbcalendars / …)
assert_true($stats['nbusers'] === $stats['users'], 'nbusers alias');
assert_true($stats['nbcalendars'] === $stats['calendars'], 'nbcalendars alias');
assert_true($stats['nbevents'] === $stats['events'], 'nbevents alias');
assert_true($stats['nbbooks'] === $stats['addressBooks'], 'nbbooks alias');
assert_true($stats['nbcontacts'] === $stats['contacts'], 'nbcontacts alias');
assert_true(($stats['links']['administration'] ?? '') === '/portal/#admin', 'links.administration portal admin');
assert_true(isset($stats['links']['releases']), 'links.releases present');

// Defaults when flags omitted
$defaults = (new AdminDashboardService($pdo, ['system' => []]))->stats();
assert_true($defaults['services']['caldav'] === true, 'default caldav on');
assert_true($defaults['services']['files'] === false, 'default files off');
assert_true($defaults['services']['notes'] === false, 'default notes off');

if ($failures > 0) {
    echo "\n$failures failure(s)\n";
    exit(1);
}
echo "\nAll AdminDashboardService tests passed.\n";
exit(0);
