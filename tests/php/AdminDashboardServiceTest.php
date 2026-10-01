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
assert_true($defaults['services']['filesPush'] === false, 'default files push off');

// filesPush is effective only with push, files, and push_files_enabled all on
$filesPushOn = ['push_enabled' => true, 'files_enabled' => true, 'push_files_enabled' => true];
assert_true((new AdminDashboardService($pdo, ['system' => $filesPushOn]))->stats()['services']['filesPush'] === true, 'files push on');
foreach (array_keys($filesPushOn) as $off) {
    $flags = array_merge($filesPushOn, [$off => false]);
    assert_true(
        (new AdminDashboardService($pdo, ['system' => $flags]))->stats()['services']['filesPush'] === false,
        "files push off when $off is off"
    );
}

// Push stats: zeros without push tables, aggregates only with them
$emptyPush = $stats['pushStats'];
assert_true(
    $emptyPush['subscriptions'] === ['calendars' => 0, 'addressbooks' => 0, 'files' => 0, 'principals' => 0]
        && $emptyPush['queue'] === ['jobs' => 0, 'oldestAgeSeconds' => 0],
    'push stats are zero without push tables'
);
\Baikal\Core\Plugins\Push\SchemaManager::ensure($pdo);
$sub = $pdo->prepare(
    'INSERT INTO push_subscriptions (registration_token, principaluri, resource_uri, topic, push_resource,'
    . ' push_resource_hash, pubkey, auth_secret, triggers, created, expires) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);
$future = time() + 3600;
foreach ([
    ['t1', 'calendars/alice/default', $future],
    ['t2', 'calendars/alice', $future],
    ['t3', 'addressbooks/alice/default', $future],
    ['t4', 'files/alice/Taxes', $future],
    ['t5', 'files/bob', $future],
    ['t6', 'principals/alice', $future],
    ['t7', 'files/alice/Expired', time() - 10],
] as [$token, $resource, $expires]) {
    $sub->execute([$token, 'principals/alice', $resource, 'topic', 'ep', 'hash-' . $token, 'pub', 'auth', '{}', time(), $expires]);
}
$queue = $pdo->prepare('INSERT INTO push_queue (resource_uri, topic, available_at, created) VALUES (?, ?, ?, ?)');
$queue->execute(['files/alice/Taxes', 'topic', time(), time() - 120]);
$queue->execute(['calendars/alice/default', 'topic', time(), time() - 5]);
$pushStats = (new AdminDashboardService($pdo, $config))->stats()['pushStats'];
assert_true(
    $pushStats['subscriptions'] === ['calendars' => 2, 'addressbooks' => 1, 'files' => 2, 'principals' => 1],
    'active subscriptions are counted per kind, expired ones excluded'
);
assert_true($pushStats['queue']['jobs'] === 2, 'queue job count');
assert_true(
    $pushStats['queue']['oldestAgeSeconds'] >= 120 && $pushStats['queue']['oldestAgeSeconds'] < 130,
    'oldest queued job age'
);
$encoded = (string) json_encode($pushStats);
assert_true(
    !str_contains($encoded, 'alice') && !str_contains($encoded, 'Taxes') && !str_contains($encoded, 'files/'),
    'push stats contain no usernames or paths'
);

if ($failures > 0) {
    echo "\n$failures failure(s)\n";
    exit(1);
}
echo "\nAll AdminDashboardService tests passed.\n";
exit(0);
