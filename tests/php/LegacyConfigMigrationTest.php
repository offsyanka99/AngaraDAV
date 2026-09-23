<?php

/**
 * Lab rename of config/baikal.yaml to config/configuration.yaml.
 *
 * Run: php tests/php/LegacyConfigMigrationTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';
require $root . '/Core/Distrib.php';

use Baikal\Portal\ApiException;
use Baikal\Portal\Install\InstallService;
use Baikal\Portal\Install\LegacyConfigMigration;
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

$dir = sys_get_temp_dir() . '/baikal-config-rename-' . bin2hex(random_bytes(4));
$configDir = $dir . '/config';
$specific = $dir . '/Specific';
@mkdir($configDir, 0700, true);
@mkdir($specific, 0700, true);
$_SERVER['SERVER_NAME'] = 'localhost';
if (session_status() !== PHP_SESSION_ACTIVE) {
    @session_start();
}

$legacy = $configDir . '/baikal.yaml';
$target = $configDir . '/configuration.yaml';
$doc = [
    'system' => [
        'configured_version' => '2.5.2',
        'timezone'           => 'America/Toronto',
        'admin_passwordhash' => 'hash-keep',
        'portal_log_level'   => 'info',
        'portal_time_format' => '24h',
        'portal_week_start'  => 'monday',
    ],
    'database' => ['backend' => 'sqlite', 'sqlite_file' => '/tmp/keep.sqlite'],
];
file_put_contents($legacy, Yaml::dump($doc, 4, 2));
touch($specific . '/INSTALL_DISABLED');

assert_true(LegacyConfigMigration::needed($target), 'legacy file alone needs rename');
assert_true(!LegacyConfigMigration::needed($legacy), 'a path that is already baikal.yaml is not a rename target');

$svc = new InstallService($target, $specific);
$st = $svc->status();
assert_true(($st['step'] ?? '') === 'migrate-config', 'installer step is migrate-config');

try {
    $svc->migrateConfigFile(false);
    assert_true(false, 'rename without confirm should throw');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 400, 'rename without confirm → 400');
}
assert_true(is_file($legacy) && !is_file($target), 'declined rename leaves baikal.yaml in place');

$done = $svc->migrateConfigFile(true);
assert_true(!is_file($legacy), 'baikal.yaml is gone');
assert_true(is_file($target), 'configuration.yaml exists');
$after = Yaml::parseFile($target);
assert_true(($after['system']['portal_log_level'] ?? '') === 'info', 'log level unchanged');
assert_true(($after['system']['portal_time_format'] ?? '') === '24h', 'time format unchanged');
assert_true(($after['system']['portal_week_start'] ?? '') === 'monday', 'week start unchanged');
assert_true(($after['system']['admin_passwordhash'] ?? '') === 'hash-keep', 'admin hash unchanged');
assert_true(($after['database']['sqlite_file'] ?? '') === '/tmp/keep.sqlite', 'database section unchanged');
assert_true(($done['step'] ?? '') !== 'migrate-config', 'status moves on after rename');

file_put_contents($legacy, "system: {}\n");
try {
    LegacyConfigMigration::rename($target);
    assert_true(false, 'both files present should refuse');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 409, 'both files → 409');
}
assert_true(is_file($legacy) && is_file($target), 'refused rename keeps both files');

@unlink($legacy);
@unlink($target);
@unlink($specific . '/INSTALL_DISABLED');
@rmdir($specific);
@rmdir($configDir);
@rmdir($dir);

if ($failures > 0) {
    echo "\n$failures failure(s)\n";
    exit(1);
}
echo "\nAll LegacyConfigMigration tests passed.\n";
exit(0);
