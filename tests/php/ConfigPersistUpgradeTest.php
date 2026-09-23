<?php

/**
 * Upgrade must not drop system settings that Config\Standard does not model.
 *
 * Run: php tests/php/ConfigPersistUpgradeTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';
require $root . '/Core/Distrib.php';

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

$dir = sys_get_temp_dir() . '/baikal-config-persist-' . bin2hex(random_bytes(4));
$configDir = $dir . '/config/';
@mkdir($configDir, 0700, true);

if (!defined('PROJECT_PATH_CONFIG')) {
    define('PROJECT_PATH_CONFIG', $configDir);
}
if (!defined('PROJECT_PATH_SPECIFIC')) {
    define('PROJECT_PATH_SPECIFIC', $dir . '/Specific/');
}
$_SERVER['SERVER_NAME'] = 'localhost';

$yamlPath = PROJECT_PATH_CONFIG . 'configuration.yaml';
$before = [
    'system' => [
        'configured_version'  => '2.5.1',
        'timezone'            => 'America/Toronto',
        'cal_enabled'         => true,
        'card_enabled'        => true,
        'dav_auth_type'       => 'Digest',
        'auth_realm'          => 'BaikalDAV',
        'admin_passwordhash'  => 'hash-keep-me',
        'portal_log_level'    => 'info',
        'portal_time_format'  => '24h',
        'portal_week_start'   => 'monday',
        'portal_admin_users'  => ['alice'],
    ],
    'database' => [
        'backend'     => 'sqlite',
        'sqlite_file' => '/tmp/keep.sqlite',
    ],
];
file_put_contents($yamlPath, Yaml::dump($before, 4, 2));

$std = new Baikal\Model\Config\Standard();
$std->set('configured_version', '2.5.2');
$std->persist();

$after = Yaml::parseFile($yamlPath);
$sys = is_array($after['system'] ?? null) ? $after['system'] : [];

assert_true(($sys['configured_version'] ?? '') === '2.5.2', 'upgrade writes the new configured_version');
assert_true(($sys['timezone'] ?? '') === 'America/Toronto', 'timezone is kept');
assert_true(($sys['admin_passwordhash'] ?? '') === 'hash-keep-me', 'admin password hash is kept');
assert_true(($sys['portal_log_level'] ?? '') === 'info', 'portal log level is kept');
assert_true(($sys['portal_time_format'] ?? '') === '24h', 'time format is kept');
assert_true(($sys['portal_week_start'] ?? '') === 'monday', 'week start is kept');
assert_true(($sys['portal_admin_users'] ?? null) === ['alice'], 'portal admin list is kept');
assert_true(($after['database']['sqlite_file'] ?? '') === '/tmp/keep.sqlite', 'database section is untouched');

@unlink($yamlPath);
@rmdir($configDir);
@rmdir($dir);

if ($failures > 0) {
    echo "\n$failures failure(s)\n";
    exit(1);
}
echo "\nAll ConfigPersistUpgrade tests passed.\n";
exit(0);
