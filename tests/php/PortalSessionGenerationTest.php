<?php

/**
 * system.portal_session_generation reader and the data-restore bump.
 *
 * Run: php tests/php/PortalSessionGenerationTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Portal\PortalSessionGeneration;
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

assert_true(PortalSessionGeneration::fromSystem([]) === 0, 'missing key reads as 0');
assert_true(PortalSessionGeneration::fromSystem(['portal_session_generation' => null]) === 0, 'null reads as 0');
assert_true(PortalSessionGeneration::fromSystem(['portal_session_generation' => '']) === 0, 'empty string reads as 0');
assert_true(PortalSessionGeneration::fromSystem(['portal_session_generation' => '4']) === 4, 'digit string reads as that integer');
assert_true(PortalSessionGeneration::fromSystem(['portal_session_generation' => 4]) === 4, 'integer reads as itself');
assert_true(PortalSessionGeneration::fromSystem(['portal_session_generation' => 1.5]) === 0, 'float reads as 0');
assert_true(PortalSessionGeneration::fromSystem(['portal_session_generation' => -3]) === 0, 'negative reads as 0');
assert_true(PortalSessionGeneration::fromSystem(['portal_session_generation' => 'abc']) === 0, 'non-digit string reads as 0');
assert_true(PortalSessionGeneration::fromSystem(['portal_session_generation' => false]) === 0, 'false reads as 0');
$pastInt = '9' . (string) PHP_INT_MAX;
assert_true(
    PortalSessionGeneration::fromSystem(['portal_session_generation' => $pastInt]) === 0,
    'a digit string past PHP_INT_MAX reads as 0'
);
assert_true(PortalSessionGeneration::coerce('nope') === 0, 'a non-integer session value counts as 0');

$dir = sys_get_temp_dir() . '/baikal-session-gen-' . bin2hex(random_bytes(4));
$configDir = $dir . '/config/';
@mkdir($configDir, 0700, true);
if (!defined('PROJECT_PATH_CONFIG')) {
    define('PROJECT_PATH_CONFIG', $configDir);
}
$yamlPath = PROJECT_PATH_CONFIG . 'configuration.yaml';
$lockPath = $dir . '/portal_data_export.lock';

$kept = [
    'system' => [
        'admin_passwordhash' => 'hash-keep-me',
        'portal_log_level'   => 'info',
    ],
    'database' => [
        'encryption_key' => 'keep-the-key',
        'backend'        => 'sqlite',
    ],
];
file_put_contents($yamlPath, Yaml::dump($kept, 4, 2));
$absent = PortalSessionGeneration::bump($yamlPath, $lockPath);
assert_true($absent === 1, 'an absent counter bumps to 1');
clearstatcache(true, $yamlPath . '.lock');
$lockMode = fileperms($yamlPath . '.lock');
assert_true($lockMode !== false && ($lockMode & 0777) === 0600, 'configuration.yaml.lock is mode 0600');

$document = $kept;
$document['system']['portal_session_generation'] = 'abc';
file_put_contents($yamlPath, Yaml::dump($document, 4, 2));

$first = PortalSessionGeneration::bump($yamlPath, $lockPath);
assert_true($first === 1, 'an unparsable counter bumps to 1');
$after = Yaml::parseFile($yamlPath);
$sys = is_array($after['system'] ?? null) ? $after['system'] : [];
assert_true(($sys['portal_session_generation'] ?? null) === 1, 'yaml stores 1');
assert_true(($sys['admin_passwordhash'] ?? '') === 'hash-keep-me', 'admin password hash is kept');
assert_true(($sys['portal_log_level'] ?? '') === 'info', 'portal log level is kept');
assert_true(($after['database']['encryption_key'] ?? '') === 'keep-the-key', 'encryption key is kept');
clearstatcache(true, $yamlPath);
$mode = fileperms($yamlPath);
assert_true($mode !== false && ($mode & 0777) === 0600, 'configuration.yaml is mode 0600');

$sys['portal_session_generation'] = 4;
$after['system'] = $sys;
file_put_contents($yamlPath, Yaml::dump($after, 4, 2));
@chmod($yamlPath, 0644);
$second = PortalSessionGeneration::bump($yamlPath, $lockPath);
assert_true($second === 5, 'generation 4 bumps to 5');
$third = PortalSessionGeneration::bump($yamlPath, $lockPath);
assert_true($third === 6, 'the next bump yields 6');
$final = Yaml::parseFile($yamlPath);
assert_true(($final['system']['portal_session_generation'] ?? null) === 6, 'yaml stores 6');
assert_true(($final['database']['encryption_key'] ?? '') === 'keep-the-key', 'encryption key survives later bumps');
clearstatcache(true, $yamlPath);
$finalMode = fileperms($yamlPath);
assert_true($finalMode !== false && ($finalMode & 0777) === 0600, 'configuration.yaml stays mode 0600');

$capped = $final;
$capped['system']['portal_session_generation'] = PHP_INT_MAX;
file_put_contents($yamlPath, Yaml::dump($capped, 4, 2));
$threw = false;
try {
    PortalSessionGeneration::bump($yamlPath, $lockPath);
} catch (RuntimeException $e) {
    $threw = true;
    assert_true(str_contains($e->getMessage(), 'cannot be incremented'), 'PHP_INT_MAX does not wrap');
}
assert_true($threw, 'PHP_INT_MAX bump throws');
$cappedAfter = Yaml::parseFile($yamlPath);
assert_true(
    ($cappedAfter['system']['portal_session_generation'] ?? null) === PHP_INT_MAX,
    'a failed increment leaves the counter unchanged'
);

@unlink($yamlPath);
@unlink($yamlPath . '.lock');
@unlink($lockPath);
@rmdir($configDir);
@rmdir($dir);

if ($failures > 0) {
    echo "\n$failures failure(s)\n";
    exit(1);
}
echo "\nAll PortalSessionGeneration tests passed.\n";
exit(0);
