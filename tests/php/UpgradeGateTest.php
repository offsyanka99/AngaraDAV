<?php

/**
 * Framework install/upgrade gate under BAIKAL_CONTEXT_PORTAL_API (JSON, not HTML 302).
 *
 * Run: php tests/php/UpgradeGateTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';
require $root . '/Core/Distrib.php';

use Baikal\Portal\ApiException;
use Symfony\Component\Yaml\Yaml;

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

$dir = sys_get_temp_dir() . '/baikal-upgrade-gate-' . bin2hex(random_bytes(4));
$configDir = $dir . '/config';
$specific = $dir . '/Specific';
@mkdir($configDir, 0700, true);
@mkdir($specific, 0700, true);

if (!defined('PROJECT_PATH_ROOT')) {
    define('PROJECT_PATH_ROOT', $root . '/');
}
if (!defined('PROJECT_PATH_CONFIG')) {
    define('PROJECT_PATH_CONFIG', $configDir . '/');
}
if (!defined('PROJECT_PATH_SPECIFIC')) {
    define('PROJECT_PATH_SPECIFIC', $specific . '/');
}
if (!defined('PROJECT_PATH_WWWROOT')) {
    define('PROJECT_PATH_WWWROOT', $root . '/html/');
}
if (!defined('PROJECT_PATH_DOCUMENTROOT')) {
    define('PROJECT_PATH_DOCUMENTROOT', $root . '/html/');
}
if (!defined('PROJECT_PATH_CORERESOURCES')) {
    define('PROJECT_PATH_CORERESOURCES', $root . '/Core/Resources/');
}
if (!defined('BAIKAL_CONTEXT')) {
    define('BAIKAL_CONTEXT', true);
}
if (!defined('BAIKAL_CONTEXT_PORTAL_API')) {
    define('BAIKAL_CONTEXT_PORTAL_API', true);
}
if (!defined('PROJECT_URI')) {
    define('PROJECT_URI', '/');
}

// Minimal config: older product version, admin password present
$config = [
    'system' => [
        'configured_version'  => '1.0.0',
        'timezone'            => 'UTC',
        'auth_realm'          => 'BaikalDAV',
        'admin_passwordhash'  => 'deadbeef',
        'card_enabled'        => true,
        'cal_enabled'         => true,
        'dav_auth_type'       => 'Digest',
    ],
    'database' => [
        'backend'         => 'sqlite',
        'sqlite_file'     => $specific . '/db.sqlite',
        'encryption_key'  => bin2hex(random_bytes(16)),
    ],
];
file_put_contents($configDir . '/baikal.yaml', Yaml::dump($config));

// Create empty sqlite so assertBaikalIsOk is not reached for upgrade path
@mkdir($specific, 0700, true);
touch($specific . '/db.sqlite');

try {
    try {
        \Baikal\Framework::installTool('upgrade_required', [
            'configuredVersion' => '1.0.0',
            'configuredBase'    => '1.0.0',
        ]);
        assert_true(false, 'portal API installTool should throw');
    } catch (ApiException $e) {
        assert_true($e->getStatus() === 503, 'upgrade gate → 503');
        $p = $e->getPayload();
        assert_true(($p['code'] ?? '') === 'upgrade_required', 'payload code upgrade_required');
        assert_true(($p['installUrl'] ?? '') === '/portal/install/', 'payload installUrl');
        assert_true(isset($p['productVersion']), 'payload productVersion set');
        assert_true(($p['configuredVersion'] ?? '') === '1.0.0', 'payload configuredVersion');
        assert_true(
            str_contains($e->getMessage(), 'upgrade') || str_contains($e->getMessage(), 'install'),
            'human-readable upgrade message'
        );
    }

    // Install context must not throw (wizard is already running)
    if (!defined('BAIKAL_CONTEXT_INSTALL')) {
        define('BAIKAL_CONTEXT_INSTALL', true);
    }
    try {
        \Baikal\Framework::installTool('upgrade_required', ['configuredVersion' => '1.0.0']);
        assert_true(true, 'install context installTool is a no-op');
    } catch (ApiException $e) {
        assert_true(false, 'install context must not throw: ' . $e->getMessage());
    }
} finally {
    $it = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ($it as $f) {
        $f->isDir() ? @rmdir($f->getPathname()) : @unlink($f->getPathname());
    }
    @rmdir($dir);
}

echo "\n" . ($failures === 0 ? "All UpgradeGate tests passed." : "$failures UpgradeGate test(s) FAILED.") . "\n";
exit($failures === 0 ? 0 : 1);
