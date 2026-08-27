<?php

/**
 * Unit checks for Baikal\Portal\Admin\AdminSettingsService.
 *
 * Run: php tests/php/AdminSettingsServiceTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Portal\Admin\AdminSettingsService;
use Baikal\Portal\ApiException;
use Symfony\Component\Yaml\Yaml;

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

$dir = sys_get_temp_dir() . '/baikal-settings-test-' . bin2hex(random_bytes(4));
@mkdir($dir, 0700, true);
$path = $dir . '/baikal.yaml';

$initial = [
    'system' => [
        'timezone'            => 'UTC',
        'cal_enabled'         => true,
        'card_enabled'        => true,
        'files_enabled'       => false,
        'files_max_upload_mb' => 100,
        'files_quota_mb'      => 1000,
        'files_quarantine_days' => 7,
        'tasks_enabled'       => true,
        'notes_enabled'       => false,
        'dav_auth_type'       => 'Digest',
        'session_max_age_minutes' => 15,
        'push_enabled'        => false,
        'push_external_url'   => '',
        'push_log_level'      => 'off',
        'admin_passwordhash'  => password_hash('oldadmin', PASSWORD_DEFAULT),
        'auth_realm'          => 'BaikalDAV',
        'extra_unknown_key'   => 'preserve-me',
    ],
    'database' => ['backend' => 'sqlite'],
];
file_put_contents($path, Yaml::dump($initial, 4, 2));

try {
    $svc = new AdminSettingsService($path);
    $get = $svc->getSystemSettings();
    assert_true($get['hasAdminPassword'] === true, 'hasAdminPassword true');
    assert_true(!array_key_exists('admin_passwordhash', $get), 'hash never in GET');
    assert_true($get['files_enabled'] === false, 'files off');
    assert_true($get['cal_enabled'] === true, 'cal on');
    assert_true($get['writable'] === true, 'writable');

    $updated = $svc->updateSystemSettings([
        'files_enabled'       => true,
        'files_max_upload_mb' => 512,
        'session_max_age_minutes' => 30,
        'timezone'            => 'America/Toronto',
    ]);
    assert_true($updated['files_enabled'] === true, 'files toggled on');
    assert_true((int) $updated['files_max_upload_mb'] === 512, 'upload mb');
    assert_true((int) $updated['session_max_age_minutes'] === 30, 'session minutes');
    assert_true($updated['timezone'] === 'America/Toronto', 'timezone');

    // Preserve unknown keys + other sections
    $raw = Yaml::parseFile($path);
    assert_true(($raw['system']['extra_unknown_key'] ?? null) === 'preserve-me', 'unknown system key preserved');
    assert_true(($raw['database']['backend'] ?? null) === 'sqlite', 'database section preserved');
    assert_true(!empty($raw['system']['admin_passwordhash']), 'password hash still present');

    // Password change
    $svc->updateSystemSettings([
        'admin_password'         => 'newadmin-secret',
        'admin_password_confirm' => 'newadmin-secret',
    ]);
    $raw2 = Yaml::parseFile($path);
    assert_true(
        password_verify('newadmin-secret', (string) $raw2['system']['admin_passwordhash']),
        'admin password rehashed'
    );

    try {
        $svc->updateSystemSettings([
            'admin_password'         => 'a',
            'admin_password_confirm' => 'b',
        ]);
        assert_true(false, 'password mismatch should fail');
    } catch (ApiException $e) {
        assert_true($e->getStatus() === 400, 'password mismatch → 400');
    }

    try {
        $svc->updateSystemSettings([
            'push_enabled'      => true,
            'push_external_url' => 'http://insecure.example/dav.php/',
        ]);
        assert_true(false, 'http push url should fail');
    } catch (ApiException $e) {
        assert_true($e->getStatus() === 400, 'http push → 400');
    }

    $svc->updateSystemSettings([
        'push_enabled'      => true,
        'push_external_url' => 'https://dav.example.com/dav.php/',
    ]);
    $get2 = $svc->getSystemSettings();
    assert_true($get2['push_enabled'] === true, 'push enabled with https url');

    // Phase 8 — database read-only (password never returned)
    // Append database section to the same yaml used above
    $withDb = Yaml::parseFile($path);
    $withDb['database'] = [
        'backend'        => 'pgsql',
        'sqlite_file'    => '/var/www/baikal/Specific/db/db.sqlite',
        'pgsql_host'     => 'db.example:5432',
        'pgsql_dbname'   => 'angaradav',
        'pgsql_username' => 'davuser',
        'pgsql_password' => 'super-secret-db-pass',
        'encryption_key' => 'enc-key-secret',
    ];
    file_put_contents($path, Yaml::dump($withDb, 4, 2));
    $svcDb = new AdminSettingsService($path);
    $dbInfo = $svcDb->getDatabaseSettings();
    assert_true($dbInfo['backend'] === 'pgsql', 'db backend pgsql');
    assert_true($dbInfo['pgsql_host'] === 'db.example:5432', 'db host');
    assert_true($dbInfo['pgsql_dbname'] === 'angaradav', 'db name');
    assert_true($dbInfo['pgsql_username'] === 'davuser', 'db username');
    assert_true($dbInfo['hasPassword'] === true, 'hasPassword true');
    assert_true($dbInfo['hasEncryptionKey'] === true, 'hasEncryptionKey true');
    assert_true($dbInfo['writeEnabled'] === true, 'writeEnabled true (Phase 8.2)');
    assert_true(!array_key_exists('pgsql_password', $dbInfo), 'password never in payload keys');
    assert_true(!array_key_exists('encryption_key', $dbInfo), 'encryption_key never in payload');
    $dbJson = json_encode($dbInfo);
    assert_true($dbJson !== false && !str_contains($dbJson, 'super-secret-db-pass'), 'JSON has no password secret');
    assert_true(!str_contains((string) $dbJson, 'enc-key-secret'), 'JSON has no encryption key');

    // Write requires CONFIRM
    try {
        $svcDb->updateDatabaseSettings([
            'backend'     => 'sqlite',
            'sqlite_file' => '/tmp/db.sqlite',
        ]);
        assert_true(false, 'db write without CONFIRM should fail');
    } catch (ApiException $e) {
        assert_true($e->getStatus() === 400, 'db write without CONFIRM → 400');
    }
    // Optional connection test (sqlite dir/file probe)
    $testOk = $svcDb->testDatabaseConnection([
        'backend'     => 'sqlite',
        'sqlite_file' => '/tmp/portal-admin-db-test.sqlite',
    ]);
    assert_true(($testOk['ok'] ?? false) === true, 'test connection ok');
    try {
        $svcDb->testDatabaseConnection([
            'backend'     => 'sqlite',
            'sqlite_file' => 'relative/not-absolute.sqlite',
        ]);
        assert_true(false, 'relative sqlite path should fail test');
    } catch (ApiException $e) {
        assert_true($e->getStatus() === 400, 'bad sqlite path test → 400');
    }

    $svcDb->updateDatabaseSettings([
        'backend'     => 'sqlite',
        'sqlite_file' => '/tmp/portal-admin-db.sqlite',
        'confirm'     => 'CONFIRM',
    ]);
    $afterWrite = $svcDb->getDatabaseSettings();
    assert_true($afterWrite['backend'] === 'sqlite', 'after write backend sqlite');
    assert_true($afterWrite['sqlite_file'] === '/tmp/portal-admin-db.sqlite', 'after write path');
    // encryption_key preserved, password never in GET
    $rawDb = Yaml::parseFile($path);
    assert_true(($rawDb['database']['encryption_key'] ?? '') === 'enc-key-secret', 'encryption key preserved');

    // SQLite-only shape
    $withDb = Yaml::parseFile($path);
    $withDb['database'] = [
        'backend'     => 'sqlite',
        'sqlite_file' => '/data/db.sqlite',
        'pgsql_host'  => '',
        'pgsql_dbname' => '',
        'pgsql_username' => '',
        'pgsql_password' => '',
        'encryption_key' => 'enc-key-secret',
    ];
    file_put_contents($path, Yaml::dump($withDb, 4, 2));
    $sqliteInfo = (new AdminSettingsService($path))->getDatabaseSettings();
    assert_true($sqliteInfo['backend'] === 'sqlite', 'sqlite backend');
    assert_true($sqliteInfo['sqlite_file'] === '/data/db.sqlite', 'sqlite path');
    assert_true($sqliteInfo['hasPassword'] === false, 'sqlite no password');

    $localeSvc = new AdminSettingsService($path);
    $localeGet0 = $localeSvc->getSystemSettings();
    assert_true(($localeGet0['portal_time_format'] ?? '') === 'auto', 'default time format auto');
    assert_true(($localeGet0['portal_week_start'] ?? '') === 'auto', 'default week start auto');
    $locale = $localeSvc->updateSystemSettings([
        'portal_time_format' => '24h',
        'portal_week_start'  => 'monday',
    ]);
    assert_true($locale['portal_time_format'] === '24h', 'PUT time format 24h');
    assert_true($locale['portal_week_start'] === 'monday', 'PUT week start monday');
    $localeGet = $localeSvc->getSystemSettings();
    assert_true($localeGet['portal_time_format'] === '24h', 'GET time format round-trip');
    assert_true($localeGet['portal_week_start'] === 'monday', 'GET week start round-trip');
    $rawLocale = Yaml::parseFile($path);
    assert_true(($rawLocale['system']['portal_time_format'] ?? null) === '24h', 'YAML portal_time_format');
    assert_true(($rawLocale['system']['portal_week_start'] ?? null) === 'monday', 'YAML portal_week_start');

    try {
        $localeSvc->updateSystemSettings(['portal_time_format' => '36h']);
        assert_true(false, 'invalid time format should fail');
    } catch (ApiException $e) {
        assert_true($e->getStatus() === 400, 'invalid time format → 400');
    }
    try {
        $localeSvc->updateSystemSettings(['portal_week_start' => 'wednesday']);
        assert_true(false, 'invalid week start should fail');
    } catch (ApiException $e) {
        assert_true($e->getStatus() === 400, 'invalid week start → 400');
    }
    $afterBad = $localeSvc->getSystemSettings();
    assert_true($afterBad['portal_time_format'] === '24h', 'invalid PUT leaves time format');
    assert_true($afterBad['portal_week_start'] === 'monday', 'invalid PUT leaves week start');

    // Reset to default — full wipe: yaml + DB + files + INSTALL_DISABLED
    $specific = $dir . '/Specific';
    @mkdir($specific, 0700, true);
    @mkdir($specific . '/db', 0700, true);
    @mkdir($specific . '/files/user1', 0700, true);
    $sqlitePath = $specific . '/db/db.sqlite';
    file_put_contents($sqlitePath, 'fake-sqlite');
    file_put_contents($specific . '/files/user1/note.txt', 'data');
    file_put_contents($specific . '/portal_debug.log', "log\n");
    $installDisabled = $specific . '/INSTALL_DISABLED';
    file_put_contents($installDisabled, "1\n");
    $withDb['database'] = [
        'backend'     => 'sqlite',
        'sqlite_file' => $sqlitePath,
    ];
    file_put_contents($path, Yaml::dump($withDb, 4, 2));
    $svcReset = new AdminSettingsService($path, $specific);
    try {
        $svcReset->resetToDefault(false);
        assert_true(false, 'reset without confirm should fail');
    } catch (ApiException $e) {
        assert_true($e->getStatus() === 400, 'reset without confirm → 400');
    }
    assert_true(is_file($path), 'yaml still present after unconfirmed reset');
    assert_true(is_file($installDisabled), 'INSTALL_DISABLED still present after unconfirmed reset');
    assert_true(is_file($sqlitePath), 'db still present after unconfirmed reset');

    $result = $svcReset->resetToDefault(true);
    assert_true($result['ok'] === true, 'reset ok');
    assert_true(($result['redirectUrl'] ?? '') === '/portal/install/', 'redirect to portal installer');
    assert_true(!is_file($path), 'baikal.yaml removed');
    assert_true(!is_file($installDisabled), 'INSTALL_DISABLED removed');
    assert_true(!is_file($sqlitePath), 'sqlite db removed');
    assert_true(!is_file($specific . '/files/user1/note.txt'), 'webdav files removed');
    assert_true(!is_file($specific . '/portal_debug.log'), 'runtime logs removed');
    $backup = $result['backupPath'] ?? null;
    assert_true(is_string($backup) && $backup !== '' && is_file($backup), 'backup yaml written');
    if (is_string($backup) && is_file($backup)) {
        @unlink($backup);
    }
    // cleanup residual dirs
    $it = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($specific, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ($it as $f) {
        $f->isDir() ? @rmdir($f->getPathname()) : @unlink($f->getPathname());
    }
    @rmdir($specific);
} finally {
    @unlink($path);
    @rmdir($dir);
}

if ($failures > 0) {
    echo "\n$failures failure(s)\n";
    exit(1);
}
echo "\nAll AdminSettingsService tests passed.\n";
exit(0);
