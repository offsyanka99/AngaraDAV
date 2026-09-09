<?php

/**
 * Unit checks for Baikal\Portal\SyncStatusService.
 *
 * Run: php tests/php/SyncStatusServiceTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Portal\ApiException;
use Baikal\Portal\FileService;
use Baikal\Portal\SyncStatusService;
use Sabre\DAV\Sharing\Plugin as SharingPlugin;

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

function remove_tree(string $path): void {
    if (is_link($path) || is_file($path)) {
        @unlink($path);

        return;
    }
    if (!is_dir($path)) {
        return;
    }
    $iterator = new FilesystemIterator($path, FilesystemIterator::CURRENT_AS_FILEINFO | FilesystemIterator::SKIP_DOTS);
    foreach ($iterator as $entry) {
        remove_tree($entry->getPathname());
    }
    @rmdir($path);
}

$temporaryRoot = sys_get_temp_dir() . '/baikal-sync-status-' . bin2hex(random_bytes(6));
@mkdir($temporaryRoot, 0700, true);

$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec(<<<'SQL'
CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, digesta1 TEXT NOT NULL);
CREATE TABLE calendars (id integer primary key, synctoken integer, components text);
CREATE TABLE calendarinstances (
  id integer primary key, calendarid integer, principaluri text, access integer,
  displayname text, uri text, description text, calendarorder integer, calendarcolor text,
  timezone text, transparent bool, share_href text, share_displayname text, share_invitestatus integer
);
CREATE TABLE addressbooks (
  id integer primary key, principaluri text, displayname text, uri text, description text, synctoken integer
);
SQL);

$pdo->exec("INSERT INTO users (username, digesta1) VALUES ('alice', 'hash'), ('bob', 'hash')");
$pdo->exec("INSERT INTO calendars (id, synctoken, components) VALUES (1, 88, 'VEVENT,VTODO')");
$pdo->exec("INSERT INTO calendars (id, synctoken, components) VALUES (2, 3, 'VJOURNAL')");
$pdo->exec(
    'INSERT INTO calendarinstances (id, calendarid, principaluri, access, displayname, uri)
     VALUES (12, 1, \'principals/alice\', ' . SharingPlugin::ACCESS_SHAREDOWNER . ", 'Work', 'work')"
);
$pdo->exec(
    'INSERT INTO calendarinstances (id, calendarid, principaluri, access, displayname, uri)
     VALUES (13, 1, \'principals/bob\', ' . SharingPlugin::ACCESS_READ . ", 'Work (shared)', 'work')"
);
$pdo->exec(
    'INSERT INTO calendarinstances (id, calendarid, principaluri, access, displayname, uri)
     VALUES (20, 2, \'principals/alice\', ' . SharingPlugin::ACCESS_NOTSHARED . ", 'Journal', 'journal')"
);
$pdo->exec(
    "INSERT INTO addressbooks (id, principaluri, displayname, uri, description, synctoken)
     VALUES (3, 'principals/alice', 'Contacts', 'default', '', 14)"
);
$pdo->exec(
    "INSERT INTO addressbooks (id, principaluri, displayname, uri, description, synctoken)
     VALUES (4, 'principals/bob', 'Bob book', 'default', '', 2)"
);

$config = [
    'system' => [
        'files_enabled'           => true,
        'files_storage_path'      => $temporaryRoot,
        'files_max_upload_mb'     => 1,
        'files_quota_mb'          => 10,
        'portal_sync_poll_seconds' => 45,
    ],
];
$files = new FileService($pdo, $config);
$svc = new SyncStatusService($pdo, $files, $config);

try {
    $status = $svc->get('alice', false);
    assert_true($status['pollSeconds'] === 45, 'pollSeconds from config');
    assert_true(count($status['calendars']) === 2, 'alice sees owned instances');
    $byInstance = [];
    foreach ($status['calendars'] as $row) {
        $byInstance[$row['instanceId']] = $row;
    }
    assert_true(isset($byInstance[12], $byInstance[20]), 'alice instance ids');
    assert_true($byInstance[12]['calendarId'] === 1 && $byInstance[12]['synctoken'] === 88, 'alice work synctoken');
    assert_true($byInstance[12]['components'] === 'VEVENT,VTODO', 'alice work components');
    assert_true($byInstance[20]['synctoken'] === 3 && $byInstance[20]['components'] === 'VJOURNAL', 'alice journal');
    assert_true(count($status['addressBooks']) === 1 && $status['addressBooks'][0]['id'] === 3, 'alice own address book only');
    assert_true($status['addressBooks'][0]['synctoken'] === 14, 'alice address book synctoken');
    assert_true($status['files']['enabled'] === true, 'files enabled');
    assert_true($status['files']['ready'] === true, 'files ready');
    assert_true($status['files']['path'] === '', 'files path empty when omitted');
    assert_true($status['files']['fingerprint'] === null, 'no fingerprint when includeFiles omitted');
    assert_true($status['files']['missing'] === false, 'missing false when omitted');

    $bob = $svc->get('bob', false);
    assert_true(count($bob['calendars']) === 1, 'bob sees sharee instance only');
    assert_true($bob['calendars'][0]['instanceId'] === 13, 'bob instanceId is sharee row');
    assert_true($bob['calendars'][0]['calendarId'] === 1, 'bob shares calendarId');
    assert_true($bob['calendars'][0]['synctoken'] === 88, 'sharee sees same synctoken');
    assert_true(count($bob['addressBooks']) === 1 && $bob['addressBooks'][0]['id'] === 4, 'bob own book only');

    $files->writeFile('alice', '', 'readme.txt', "hello\n", false);
    $withFiles = $svc->get('alice', true, '');
    assert_true(is_string($withFiles['files']['fingerprint']) && $withFiles['files']['fingerprint'] !== '', 'root fingerprint');
    assert_true($withFiles['files']['path'] === '', 'root path');
    assert_true($withFiles['files']['missing'] === false, 'root not missing');
    $firstFp = $withFiles['files']['fingerprint'];

    $files->writeFile('alice', '', 'readme.txt', "hello world\n", true);
    $afterPut = $svc->get('alice', true, '');
    assert_true($afterPut['files']['fingerprint'] !== $firstFp, 'overwrite changes fingerprint (not dir mtime)');

    $missing = $svc->get('alice', true, 'no-such-folder');
    assert_true($missing['files']['missing'] === true, 'missing folder → files.missing');
    assert_true($missing['files']['fingerprint'] === null, 'missing folder fingerprint null');
    assert_true(count($missing['calendars']) === 2, 'missing files folder still returns calendars');
    assert_true(count($missing['addressBooks']) === 1, 'missing files folder still returns address books');

    try {
        $svc->get('alice', true, '../etc');
        assert_true(false, 'path traversal should fail');
    } catch (ApiException $e) {
        assert_true($e->getStatus() === 400, 'path traversal → 400');
    }

    $files->createDirectory('alice', '', 'docs');
    $nested = $svc->get('alice', true, 'docs');
    assert_true($nested['files']['path'] === 'docs', 'nested path echoed');
    assert_true($nested['files']['missing'] === false, 'existing nested folder');

    $off = new SyncStatusService($pdo, new FileService($pdo, [
        'system' => [
            'files_enabled'      => false,
            'files_storage_path' => $temporaryRoot,
        ],
    ]), ['system' => ['files_enabled' => false, 'portal_sync_poll_seconds' => 5]]);
    $offStatus = $off->get('alice', true, '');
    assert_true($offStatus['files']['enabled'] === false, 'disabled files enabled=false');
    assert_true($offStatus['files']['fingerprint'] === null, 'disabled files no fingerprint');
    assert_true($offStatus['pollSeconds'] === 10, 'pollSeconds clamped min 10');

    $high = new SyncStatusService($pdo, $files, ['system' => ['portal_sync_poll_seconds' => 999]]);
    assert_true($high->get('alice', false)['pollSeconds'] === 300, 'pollSeconds clamped max 300');
    assert_true(SyncStatusService::clampPollSeconds(null) === 30, 'missing poll fallback 30');
    assert_true(SyncStatusService::clampPollSeconds('nope') === 30, 'invalid poll fallback 30');

    $boomFiles = new class($pdo, $config) extends FileService {
        public function directoryFingerprint(string $username, string $path = ''): array {
            throw new RuntimeException('stat failed');
        }
    };
    $boom = new SyncStatusService($pdo, $boomFiles, $config);
    $boomStatus = $boom->get('alice', true, 'docs');
    assert_true($boomStatus['files']['missing'] === true, 'files stat failure → missing, not 500');
    assert_true($boomStatus['files']['fingerprint'] === null, 'files stat failure fingerprint null');
    assert_true(count($boomStatus['calendars']) === 2, 'files stat failure still returns calendars');
} finally {
    remove_tree($temporaryRoot);
}

if ($failures > 0) {
    echo "\n$failures failure(s)\n";
    exit(1);
}
echo "\nAll SyncStatusService tests passed.\n";
exit(0);
