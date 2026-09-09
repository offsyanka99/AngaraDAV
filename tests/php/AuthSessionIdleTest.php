<?php

/**
 * peekUser must not bump last-seen; expired idle still 401; requireUser / GET /me still touch.
 *
 * Run: php tests/php/AuthSessionIdleTest.php
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

$sessionDir = sys_get_temp_dir() . '/baikal-auth-idle-' . bin2hex(random_bytes(4));
@mkdir($sessionDir, 0700, true);
session_save_path($sessionDir);
ob_start();

$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

Auth::startSession();

try {
    $_SESSION[Auth::SESSION_KEY] = 'alice';
    $_SESSION[Auth::LOGIN_AT_KEY] = time() - 60;
    $seen = time() - 20;
    $_SESSION[Auth::LAST_SEEN_KEY] = $seen;
    $_SESSION[Auth::CSRF_KEY] = 'csrf-test';

    $peekAuth = new Auth($pdo, 'BaikalDAV', 900);
    $peeked = $peekAuth->peekUser();
    assert_true($peeked === 'alice', 'peekUser returns session username');
    assert_true((int) $_SESSION[Auth::LAST_SEEN_KEY] === $seen, 'peekUser does not bump last-seen');
    assert_true($peekAuth->wasTimedOut() === false, 'peekUser does not mark timed out when fresh');

    $touchAuth = new Auth($pdo, 'BaikalDAV', 900);
    $required = $touchAuth->requireUser();
    assert_true($required === 'alice', 'requireUser returns username');
    assert_true((int) $_SESSION[Auth::LAST_SEEN_KEY] >= $seen, 'requireUser bumps last-seen');
    assert_true((int) $_SESSION[Auth::LAST_SEEN_KEY] >= time() - 2, 'requireUser last-seen is now');

    $afterRequire = (int) $_SESSION[Auth::LAST_SEEN_KEY];
    $peekAgain = (new Auth($pdo, 'BaikalDAV', 900))->peekUser();
    assert_true($peekAgain === 'alice', 'peekUser still works after requireUser');
    assert_true((int) $_SESSION[Auth::LAST_SEEN_KEY] === $afterRequire, 'second peek does not bump last-seen');

    $_SESSION[Auth::SESSION_KEY] = 'alice';
    $_SESSION[Auth::LOGIN_AT_KEY] = time() - 120;
    $_SESSION[Auth::LAST_SEEN_KEY] = time() - 100;
    $expired = new Auth($pdo, 'BaikalDAV', 30);
    try {
        $expired->peekUser();
        assert_true(false, 'peekUser should 401 when idle expired');
    } catch (ApiException $e) {
        assert_true($e->getStatus() === 401, 'peekUser idle expired → 401');
        assert_true($e->getMessage() === 'Session timed out. Please sign in again.', 'peekUser idle message matches requireUser');
        assert_true($expired->wasTimedOut() === true, 'peekUser sets timedOut on idle expiry');
    }

    Auth::startSession();
    $_SESSION[Auth::SESSION_KEY] = 'alice';
    $_SESSION[Auth::LOGIN_AT_KEY] = time() - 120;
    $_SESSION[Auth::LAST_SEEN_KEY] = time() - 100;
    $expiredRequire = new Auth($pdo, 'BaikalDAV', 30);
    try {
        $expiredRequire->requireUser();
        assert_true(false, 'requireUser should 401 when idle expired');
    } catch (ApiException $e) {
        assert_true($e->getStatus() === 401, 'requireUser idle expired → 401');
        assert_true($e->getMessage() === 'Session timed out. Please sign in again.', 'requireUser idle message');
    }

    $appSrc = file_get_contents($root . '/Core/Frameworks/Baikal/Portal/App.php');
    assert_true(is_string($appSrc) && $appSrc !== '', 'App.php readable');
    assert_true(
        is_string($appSrc) && (bool) preg_match(
            '/GET.*\/me[\s\S]{0,800}?auth->username\(\)/',
            $appSrc
        ),
        'GET /me still uses username() (touches session)'
    );
    assert_true(
        is_string($appSrc) && str_contains($appSrc, "\$path === '/sync-status'")
            && str_contains($appSrc, 'peekUser()')
            && str_contains($appSrc, 'session_write_close()'),
        'GET /sync-status uses peekUser then session_write_close'
    );
    $idleSafe = is_string($appSrc) ? strpos($appSrc, "\$path === '/sync-status'") : false;
    $peekPos = is_int($idleSafe) ? strpos($appSrc, 'peekUser()', $idleSafe) : false;
    $requireAfter = is_int($idleSafe) ? strpos($appSrc, '$this->auth->requireUser()', $idleSafe) : false;
    assert_true(
        is_int($peekPos) && is_int($requireAfter) && $peekPos < $requireAfter,
        'GET /sync-status is dispatched before blanket requireUser()'
    );
    $authSrc = file_get_contents($root . '/Core/Frameworks/Baikal/Portal/Auth.php');
    assert_true(is_string($authSrc) && $authSrc !== '', 'Auth.php readable');
    $peekFn = is_string($authSrc)
        ? (preg_match('/function peekUser\(\)[\s\S]*?function /', $authSrc, $m) ? $m[0] : '')
        : '';
    assert_true($peekFn !== '', 'peekUser() function present');
    assert_true(!str_contains($peekFn, 'username()'), 'peekUser does not call username()');
    assert_true(!str_contains($peekFn, 'touchSession()'), 'peekUser does not call touchSession()');
} finally {
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_write_close();
    }
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
}

if ($failures > 0) {
    echo "\n$failures failure(s)\n";
    exit(1);
}
echo "\nAll AuthSessionIdle tests passed.\n";
exit(0);
