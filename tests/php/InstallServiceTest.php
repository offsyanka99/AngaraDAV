<?php

/**
 * Unit checks for Baikal\Portal\Install\InstallService.
 *
 * Run: php tests/php/InstallServiceTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';
require $root . '/Core/Distrib.php';

use Baikal\Portal\ApiException;
use Baikal\Portal\Install\InstallService;
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

$dir = sys_get_temp_dir() . '/baikal-install-test-' . bin2hex(random_bytes(4));
$configDir = $dir . '/config';
$specific = $dir . '/Specific';
@mkdir($configDir, 0700, true);
@mkdir($specific, 0700, true);
@mkdir($specific . '/db', 0700, true);
$path = $configDir . '/baikal.yaml';

// Config models persist via PROJECT_PATH_* constants (must match test dirs)
if (!defined('PROJECT_PATH_ROOT')) {
    define('PROJECT_PATH_ROOT', $root . '/');
}
if (!defined('PROJECT_PATH_CONFIG')) {
    define('PROJECT_PATH_CONFIG', $configDir . '/');
}
if (!defined('PROJECT_PATH_SPECIFIC')) {
    define('PROJECT_PATH_SPECIFIC', $specific . '/');
}
if (!defined('PROJECT_PATH_CORERESOURCES')) {
    define('PROJECT_PATH_CORERESOURCES', $root . '/Core/Resources/');
}
if (!defined('PROJECT_PATH_DOCUMENTROOT')) {
    define('PROJECT_PATH_DOCUMENTROOT', $root . '/html/');
}
if (!defined('ANGARA_CONTEXT')) {
    define('ANGARA_CONTEXT', true);
}
if (!defined('ANGARA_CONTEXT_INSTALL')) {
    define('ANGARA_CONTEXT_INSTALL', true);
}

// Session for CSRF
if (session_status() !== PHP_SESSION_ACTIVE) {
    @session_start();
}

try {
    $svc = new InstallService($path, $specific);
    $st = $svc->status();
    assert_true(($st['step'] ?? '') === 'initialize', 'fresh install → initialize');
    assert_true(!empty($st['csrfToken']), 'csrf present');
    assert_true(($st['permissions']['ok'] ?? false) === true, 'permissions ok');

    try {
        $svc->initialize([
            'timezone'                => 'UTC',
            'admin_password'          => 'short',
            'admin_password_confirm'  => 'short',
        ]);
        assert_true(false, 'short password should fail');
    } catch (ApiException $e) {
        assert_true($e->getStatus() === 400, 'short password → 400');
    }

    $st2 = $svc->initialize([
        'timezone'                 => 'UTC',
        'cal_enabled'              => true,
        'card_enabled'             => true,
        'tasks_enabled'            => true,
        'notes_enabled'            => false,
        'files_enabled'            => false,
        'dav_auth_type'            => 'Digest',
        'invite_from'              => 'noreply@example.com',
        'session_max_age_minutes'  => 15,
        'admin_password'           => 'test-admin-pass',
        'admin_password_confirm'   => 'test-admin-pass',
    ]);
    assert_true(($st2['step'] ?? '') === 'database', 'after initialize → database');
    assert_true(is_file($path), 'baikal.yaml created');
    $raw = Yaml::parseFile($path);
    assert_true(!empty($raw['system']['admin_passwordhash']), 'admin hash set');
    assert_true(!empty($raw['database']['encryption_key']), 'encryption key set');

    $sqlite = $specific . '/db/db.sqlite';
    try {
        $svc->configureDatabase([
            'backend'     => 'sqlite',
            'sqlite_file' => $sqlite,
        ]);
        assert_true(false, 'database without re-entered password should fail');
    } catch (ApiException $e) {
        assert_true($e->getStatus() === 400, 'database without password → 400');
    }
    $st3 = $svc->configureDatabase([
        'backend'                 => 'sqlite',
        'sqlite_file'             => $sqlite,
        'admin_password'          => 'test-admin-pass',
        'admin_password_confirm'  => 'test-admin-pass',
    ]);
    assert_true(!empty($st3['completed']) || ($st3['step'] ?? '') === 'done', 'after database → done');
    assert_true(is_file($specific . '/INSTALL_DISABLED'), 'INSTALL_DISABLED created');
    assert_true(is_file($sqlite), 'sqlite file created');
    assert_true(!empty($st3['portalUserCreated']), 'portal user admin created');
    $pdo = new PDO('sqlite:' . $sqlite);
    $row = $pdo->query("SELECT username, digesta1 FROM users WHERE username = 'admin'")->fetch(PDO::FETCH_ASSOC);
    assert_true(is_array($row) && ($row['username'] ?? '') === 'admin', 'DAV user admin exists');
    $expectDigest = md5('admin:BaikalDAV:test-admin-pass');
    assert_true(hash_equals((string) ($row['digesta1'] ?? ''), $expectDigest), 'admin digesta1 matches install password');
    $principal = $pdo->query("SELECT uri FROM principals WHERE uri = 'principals/admin'")->fetchColumn();
    assert_true($principal === 'principals/admin', 'admin principal exists');

    $st4 = $svc->status();
    assert_true(($st4['step'] ?? '') === 'done', 'status done when locked by marker');
    assert_true(($st4['locked'] ?? false) === true, 'locked true');

    try {
        $svc->configureDatabase(['backend' => 'sqlite', 'sqlite_file' => $sqlite]);
        assert_true(false, 'database when done should 409');
    } catch (ApiException $e) {
        assert_true($e->getStatus() === 409, 'database when done → 409');
    }

    // Version base compare: same base + different build SHA must not force upgrade step
    $raw = Yaml::parseFile($path);
    $base = defined('ANGARA_VERSION_BASE') ? (string) ANGARA_VERSION_BASE : '2.0.2';
    $raw['system']['configured_version'] = $base . '+deadbeef';
    file_put_contents($path, Yaml::dump($raw));
    $stSameBase = $svc->status();
    assert_true(
        ($stSameBase['step'] ?? '') === 'done',
        'same version base with different +sha stays done (no false upgrade)'
    );

    // Older base forces upgrade wizard
    $raw['system']['configured_version'] = '1.0.0';
    file_put_contents($path, Yaml::dump($raw));
    $stUpgrade = $svc->status();
    assert_true(($stUpgrade['step'] ?? '') === 'upgrade', 'older configured_version → upgrade step');
    assert_true(($stUpgrade['locked'] ?? true) === false, 'upgrade step is not locked');
} finally {
    // cleanup
    $it = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ($it as $f) {
        $f->isDir() ? @rmdir($f->getPathname()) : @unlink($f->getPathname());
    }
    @rmdir($dir);
}

if ($failures > 0) {
    echo "\n$failures failure(s)\n";
    exit(1);
}
echo "\nAll InstallService tests passed.\n";
exit(0);
