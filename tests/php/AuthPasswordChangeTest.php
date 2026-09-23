<?php

/**
 * Self-service DAV password change (Auth::changePassword).
 *
 * Run: php tests/php/AuthPasswordChangeTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Portal\ApiException;
use Baikal\Portal\Auth;

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

function digest(string $username, string $password): string {
    return md5($username . ':BaikalDAV:' . $password);
}

function rate_dir(): string {
    if (defined('PROJECT_PATH_SPECIFIC')) {
        return (string) PROJECT_PATH_SPECIFIC;
    }
    if (defined('PROJECT_PATH_ROOT')) {
        return PROJECT_PATH_ROOT . 'Specific/';
    }

    return sys_get_temp_dir() . '/';
}

function clear_rate_files(): void {
    foreach (['portal_self_password_rate.json', 'portal_login_rate.json'] as $name) {
        $path = rtrim(rate_dir(), '/') . '/' . $name;
        if (is_file($path)) {
            @unlink($path);
        }
    }
}

$sessionDir = sys_get_temp_dir() . '/baikal-auth-pw-' . bin2hex(random_bytes(4));
@mkdir($sessionDir, 0700, true);
session_save_path($sessionDir);
ob_start();
clear_rate_files();

$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, digesta1 TEXT NOT NULL)');
$pdo->exec("INSERT INTO users (username, digesta1) VALUES ('alice', '" . digest('alice', 'old-password') . "')");
$pdo->exec("INSERT INTO users (username, digesta1) VALUES ('bob', '" . digest('bob', 'bob-password') . "')");

$auth = new Auth($pdo, 'BaikalDAV', 900);
Auth::startSession();

try {
    $auth->changePassword('old-password', 'new-password', 'new-password');
    assert_true(false, 'change without a session user should throw');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 401, 'no session user → 401');
    assert_true(!str_contains($e->getMessage(), 'old-password'), '401 message has no password');
}

$_SESSION[Auth::SESSION_KEY] = 'alice';
$_SESSION[Auth::LOGIN_AT_KEY] = time();
$_SESSION[Auth::LAST_SEEN_KEY] = time();
$_SESSION[Auth::CSRF_KEY] = 'csrf-test';

$before = (string) $pdo->query("SELECT digesta1 FROM users WHERE username='alice'")->fetchColumn();

try {
    $auth->changePassword('wrong-password', 'new-password', 'new-password');
    assert_true(false, 'wrong current password should throw');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 400, 'wrong current password → 400 (not a session logout)');
    assert_true($e->getMessage() === 'Current password is incorrect', 'wrong current password message');
    assert_true(!str_contains($e->getMessage(), 'wrong-password'), 'error does not echo the password');
}
$afterWrong = (string) $pdo->query("SELECT digesta1 FROM users WHERE username='alice'")->fetchColumn();
assert_true($afterWrong === $before, 'wrong current password leaves digesta1 unchanged');

try {
    $auth->changePassword('old-password', 'new-password', 'other-password');
    assert_true(false, 'mismatch should throw');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 400, 'mismatch → 400');
    assert_true(str_contains(strtolower($e->getMessage()), 'match'), 'mismatch message');
}

try {
    $auth->changePassword('old-password', 'short', 'short');
    assert_true(false, 'short password should throw');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 400, 'short password → 400');
    assert_true(str_contains($e->getMessage(), (string) Auth::PASSWORD_MIN_LENGTH), 'short password names the minimum');
}

try {
    $auth->changePassword('old-password', 'old-password', 'old-password');
    assert_true(false, 'same password should throw');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 400, 'same password → 400');
    assert_true(str_contains(strtolower($e->getMessage()), 'different'), 'same password message');
}
assert_true(
    (string) $pdo->query("SELECT digesta1 FROM users WHERE username='alice'")->fetchColumn() === $before,
    'rejected changes leave digesta1 unchanged'
);

$sessionBefore = session_id();
$auth->changePassword('old-password', 'new-password', 'new-password');
$stored = (string) $pdo->query("SELECT digesta1 FROM users WHERE username='alice'")->fetchColumn();
assert_true($stored === digest('alice', 'new-password'), 'digesta1 matches DAV scheme');
assert_true($stored !== $before, 'digest changed');
assert_true($auth->verifyPassword('alice', 'new-password') === true, 'new password verifies');
assert_true($auth->verifyPassword('alice', 'old-password') === false, 'old password no longer verifies');
assert_true(
    (string) $pdo->query("SELECT digesta1 FROM users WHERE username='bob'")->fetchColumn() === digest('bob', 'bob-password'),
    'another user is unchanged'
);
assert_true(($_SESSION[Auth::SESSION_KEY] ?? '') === 'alice', 'session user kept after change');
assert_true(($_SESSION[Auth::CSRF_KEY] ?? '') === 'csrf-test', 'CSRF token kept after session regenerate');
assert_true(session_id() !== '' && session_id() !== $sessionBefore, 'session id rotates after a password change');

$rateRaw = file_get_contents(rtrim(rate_dir(), '/') . '/portal_self_password_rate.json');
assert_true(is_string($rateRaw) && !str_contains($rateRaw, 'new-password'), 'rate file does not store the password');
assert_true(is_string($rateRaw) && str_contains($rateRaw, 'alice'), 'rate file is keyed by username');

$current = 'new-password';
for ($i = 1; $i < Auth::PASSWORD_CHANGE_MAX; ++$i) {
    $next = 'new-pass-' . $i . 'x';
    $auth->changePassword($current, $next, $next);
    $current = $next;
}
assert_true(
    (string) $pdo->query("SELECT digesta1 FROM users WHERE username='alice'")->fetchColumn() === digest('alice', $current),
    'changes up to the limit apply'
);
try {
    $auth->changePassword($current, 'blocked-password', 'blocked-password');
    assert_true(false, 'rate limit should throw');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 429, 'too many changes → 429');
    assert_true(!str_contains($e->getMessage(), 'blocked-password'), '429 message has no password');
}
assert_true(
    (string) $pdo->query("SELECT digesta1 FROM users WHERE username='alice'")->fetchColumn() === digest('alice', $current),
    'rate-limited attempt does not change digesta1'
);

$appSrc = file_get_contents($root . '/Core/Frameworks/Baikal/Portal/App.php');
assert_true(is_string($appSrc) && $appSrc !== '', 'App.php readable');
$csrfPos = is_string($appSrc) ? strpos($appSrc, 'assertCsrf') : false;
$requirePos = is_string($appSrc) ? strpos($appSrc, '$username = $this->auth->requireUser();') : false;
$routePos = is_string($appSrc) ? strpos($appSrc, "\$path === '/me/password'") : false;
assert_true(is_int($csrfPos) && is_int($routePos) && $routePos > $csrfPos, 'POST /me/password is after the CSRF gate');
assert_true(is_int($requirePos) && is_int($routePos) && $routePos > $requirePos, 'POST /me/password requires a signed-in user');
assert_true(is_string($appSrc) && str_contains($appSrc, 'changePassword('), 'route calls Auth::changePassword');
assert_true(is_string($appSrc) && str_contains($appSrc, "['ok' => true]"), 'success body is ok:true');
assert_true(
    is_string($appSrc) && str_contains($appSrc, "'password changed user=' . \$username"),
    'success log names the user and not the password'
);
assert_true(is_string($appSrc) && str_contains($appSrc, 'digesta1'), 'route refuses a digesta1 body field');

$authSrc = file_get_contents($root . '/Core/Frameworks/Baikal/Portal/Auth.php');
assert_true(
    is_string($authSrc) && str_contains($authSrc, 'Does not write system.admin_passwordhash'),
    'admin password hash is explicitly out of this path'
);

if (session_status() === PHP_SESSION_ACTIVE) {
    session_write_close();
}
clear_rate_files();
if (ob_get_level() > 0) {
    ob_end_flush();
}
$it = new RecursiveIteratorIterator(
    new RecursiveDirectoryIterator($sessionDir, FilesystemIterator::SKIP_DOTS),
    RecursiveIteratorIterator::CHILD_FIRST
);
foreach ($it as $f) {
    $f->isDir() ? @rmdir($f->getPathname()) : @unlink($f->getPathname());
}
@rmdir($sessionDir);

if ($failures > 0) {
    echo "\n$failures failure(s)\n";
    exit(1);
}
echo "\nAll AuthPasswordChange tests passed.\n";
exit(0);
