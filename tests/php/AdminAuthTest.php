<?php

/**
 * Unit checks for Baikal\Portal\AdminAuth (portal Admin role + requireAdmin).
 *
 * Run: php tests/php/AdminAuthTest.php
 * Requires: composer install and pdo_sqlite.
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Portal\AdminAuth;
use Baikal\Portal\ApiException;
use Baikal\Portal\Auth;

// Session must start before any output (CLI unit tests echo pass/fail lines)
if (session_status() !== PHP_SESSION_ACTIVE) {
    // Plain start — Auth::startSession() also works pre-output; avoid cookie ini noise
    @session_start();
}

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

// Isolate env so getenv overrides from the host shell cannot break assertions
$envKeys = ['PORTAL_ADMIN_USERS', 'BAIKAL_PORTAL_ADMIN_USERS'];
$envBackup = [];
foreach ($envKeys as $k) {
    $v = getenv($k);
    $envBackup[$k] = $v === false ? null : $v;
    putenv($k);
    unset($_ENV[$k], $_SERVER[$k]);
}

try {
    // --- userIsAdmin: default username "admin" ---
    $empty = ['system' => []];
    assert_true(AdminAuth::userIsAdmin('admin', $empty) === true, 'default: admin is Admin');
    assert_true(AdminAuth::userIsAdmin('Admin', $empty) === true, 'default: Admin case-insensitive');
    assert_true(AdminAuth::userIsAdmin('alice', $empty) === false, 'default: alice is not Admin');
    assert_true(AdminAuth::userIsAdmin('', $empty) === false, 'empty username is never Admin');

    // --- YAML list ---
    $yamlList = ['system' => ['portal_admin_users' => ['bob', 'carol']]];
    assert_true(AdminAuth::userIsAdmin('bob', $yamlList) === true, 'YAML list: bob is Admin');
    assert_true(AdminAuth::userIsAdmin('Carol', $yamlList) === true, 'YAML list: case-insensitive');
    assert_true(AdminAuth::userIsAdmin('admin', $yamlList) === false, 'YAML list: default admin disabled when list set');
    assert_true(AdminAuth::userIsAdmin('alice', $yamlList) === false, 'YAML list: outsider not Admin');

    // --- YAML comma-separated string ---
    $yamlStr = ['system' => ['portal_admin_users' => 'dave, eve']];
    assert_true(AdminAuth::userIsAdmin('dave', $yamlStr) === true, 'YAML string: dave is Admin');
    assert_true(AdminAuth::userIsAdmin('eve', $yamlStr) === true, 'YAML string: eve is Admin');
    assert_true(AdminAuth::userIsAdmin('admin', $yamlStr) === false, 'YAML string: default admin not used');

    // --- Env override beats YAML ---
    putenv('PORTAL_ADMIN_USERS=frank');
    $yamlIgnored = ['system' => ['portal_admin_users' => ['bob']]];
    assert_true(AdminAuth::userIsAdmin('frank', $yamlIgnored) === true, 'env PORTAL_ADMIN_USERS wins over YAML');
    assert_true(AdminAuth::userIsAdmin('bob', $yamlIgnored) === false, 'YAML ignored when env set');
    putenv('PORTAL_ADMIN_USERS');
    unset($_ENV['PORTAL_ADMIN_USERS'], $_SERVER['PORTAL_ADMIN_USERS']);

    // --- requireAdmin: session + role ---
    $pdo = new PDO('sqlite::memory:');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $auth = new Auth($pdo, 'BaikalDAV', 900);
    $adminAuth = new AdminAuth($auth, ['system' => []]);

    // Anonymous → 401
    unset($_SESSION[Auth::SESSION_KEY], $_SESSION[Auth::LOGIN_AT_KEY], $_SESSION[Auth::LAST_SEEN_KEY]);
    try {
        $adminAuth->requireAdmin();
        assert_true(false, 'requireAdmin should throw when anonymous');
    } catch (ApiException $e) {
        assert_true($e->getStatus() === 401, 'requireAdmin anonymous → 401');
    }

    // Non-admin session → 403
    $_SESSION[Auth::SESSION_KEY] = 'alice';
    $_SESSION[Auth::LOGIN_AT_KEY] = time();
    $_SESSION[Auth::LAST_SEEN_KEY] = time();
    try {
        $adminAuth->requireAdmin();
        assert_true(false, 'requireAdmin should throw for non-admin');
    } catch (ApiException $e) {
        assert_true($e->getStatus() === 403, 'requireAdmin non-admin → 403');
        assert_true(str_contains($e->getMessage(), 'Admin'), '403 message mentions Admin');
    }

    // Admin session → username
    $_SESSION[Auth::SESSION_KEY] = 'admin';
    $_SESSION[Auth::LOGIN_AT_KEY] = time();
    $_SESSION[Auth::LAST_SEEN_KEY] = time();
    $u = $adminAuth->requireAdmin();
    assert_true($u === 'admin', 'requireAdmin admin → returns username');

    // Configured list user
    $auth2 = new Auth($pdo, 'BaikalDAV', 900);
    $adminAuth2 = new AdminAuth($auth2, ['system' => ['portal_admin_users' => ['alice']]]);
    $_SESSION[Auth::SESSION_KEY] = 'alice';
    $_SESSION[Auth::LOGIN_AT_KEY] = time();
    $_SESSION[Auth::LAST_SEEN_KEY] = time();
    assert_true($adminAuth2->requireAdmin() === 'alice', 'requireAdmin respects portal_admin_users');
} finally {
    foreach ($envBackup as $k => $v) {
        if ($v === null) {
            putenv($k);
            unset($_ENV[$k], $_SERVER[$k]);
        } else {
            putenv($k . '=' . $v);
            $_ENV[$k] = $v;
        }
    }
}

if ($failures > 0) {
    echo "\n$failures failure(s)\n";
    exit(1);
}
echo "\nAll AdminAuth tests passed.\n";
exit(0);
