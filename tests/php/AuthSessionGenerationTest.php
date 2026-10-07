<?php

/**
 * Portal sessions carry the configuration.yaml generation from login.
 * A data-restore bump makes requireUser and peekUser return 401.
 *
 * Run: php tests/php/AuthSessionGenerationTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Portal\ApiException;
use Baikal\Portal\Auth;
use Baikal\Portal\PortalSessionGeneration;

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

$sessionDir = sys_get_temp_dir() . '/baikal-auth-gen-' . bin2hex(random_bytes(4));
$specific = $sessionDir . '/Specific';
@mkdir($specific, 0700, true);
if (!defined('PROJECT_PATH_SPECIFIC')) {
    define('PROJECT_PATH_SPECIFIC', $specific);
}
session_save_path($sessionDir);
ob_start();

$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, digesta1 TEXT NOT NULL)');
$pdo->exec('CREATE TABLE principals (id INTEGER PRIMARY KEY, uri TEXT, displayname TEXT, email TEXT)');
$digest = md5('alice:BaikalDAV:secret');
$pdo->exec("INSERT INTO users (username, digesta1) VALUES ('alice', '" . $digest . "')");
$pdo->exec("INSERT INTO principals (uri, displayname, email) VALUES ('principals/alice', 'Alice', 'alice@example.com')");

$rateFile = $specific . '/portal_login_rate.json';

Auth::startSession();

try {
    $_SESSION[Auth::SESSION_KEY] = 'alice';
    $_SESSION[Auth::LOGIN_AT_KEY] = time();
    $_SESSION[Auth::LAST_SEEN_KEY] = time() - 5;
    $current = new Auth($pdo, 'BaikalDAV', 900, 0);
    assert_true($current->requireUser() === 'alice', 'missing session generation matches request generation 0');
    assert_true($current->wasGenerationRejected() === false, 'matching generation is not a restore rejection');

    $seen = time() - 20;
    $_SESSION[Auth::SESSION_KEY] = 'alice';
    $_SESSION[Auth::LOGIN_AT_KEY] = time();
    $_SESSION[Auth::LAST_SEEN_KEY] = $seen;
    $_SESSION[Auth::SESSION_GENERATION_KEY] = 4;
    $peek = new Auth($pdo, 'BaikalDAV', 900, 4);
    assert_true($peek->peekUser() === 'alice', 'peekUser accepts the current generation');
    assert_true((int) $_SESSION[Auth::LAST_SEEN_KEY] === $seen, 'peekUser does not bump last-seen when the generation matches');
    assert_true((new Auth($pdo, 'BaikalDAV', 900, 4))->requireUser() === 'alice', 'requireUser accepts the current generation');

    $logged = [];
    $stale = new Auth($pdo, 'BaikalDAV', 900, 5, function (string $username) use (&$logged): void {
        $logged[] = $username;
    });
    try {
        $stale->requireUser();
        assert_true(false, 'requireUser rejects an older generation');
    } catch (ApiException $e) {
        assert_true($e->getStatus() === 401, 'older generation requireUser is 401');
        assert_true($e->getMessage() === PortalSessionGeneration::RESTORE_MESSAGE, 'requireUser uses the restore sentence');
        assert_true($stale->wasTimedOut() === false, 'generation rejection is not an idle timeout');
        assert_true($stale->wasGenerationRejected() === true, 'requireUser sets the generation flag');
        assert_true(!isset($_SESSION[Auth::SESSION_KEY]), 'requireUser clears the session username');
        assert_true($logged === ['alice'], 'rejection logs the username once');
        assert_true(!is_file($rateFile), 'generation rejection does not count as a failed login');
    }

    Auth::startSession();
    $_SESSION[Auth::SESSION_KEY] = 'alice';
    $_SESSION[Auth::LOGIN_AT_KEY] = time();
    $_SESSION[Auth::LAST_SEEN_KEY] = time();
    $missing = new Auth($pdo, 'BaikalDAV', 900, 1);
    try {
        $missing->peekUser();
        assert_true(false, 'peekUser rejects a session with no generation key when the request generation is 1');
    } catch (ApiException $e) {
        assert_true($e->getStatus() === 401, 'missing generation key peekUser is 401');
        assert_true($e->getMessage() === PortalSessionGeneration::RESTORE_MESSAGE, 'peekUser uses the restore sentence');
        assert_true($missing->wasTimedOut() === false, 'peekUser generation rejection is not an idle timeout');
        assert_true(!isset($_SESSION[Auth::SESSION_KEY]), 'peekUser clears the session username');
    }

    Auth::startSession();
    $_SESSION[Auth::SESSION_KEY] = 'alice';
    $_SESSION[Auth::LOGIN_AT_KEY] = time() - 120;
    $_SESSION[Auth::LAST_SEEN_KEY] = time() - 100;
    $_SESSION[Auth::SESSION_GENERATION_KEY] = 2;
    $idleLogged = [];
    $idle = new Auth($pdo, 'BaikalDAV', 30, 2, function (string $username) use (&$idleLogged): void {
        $idleLogged[] = $username;
    });
    try {
        $idle->requireUser();
        assert_true(false, 'idle expiry still rejects when the generation matches');
    } catch (ApiException $e) {
        assert_true($e->getStatus() === 401, 'idle expiry is 401');
        assert_true($e->getMessage() === 'Session timed out. Please sign in again.', 'idle expiry keeps the timeout sentence');
        assert_true($idle->wasTimedOut() === true, 'idle expiry sets timedOut');
        assert_true($idle->wasGenerationRejected() === false, 'idle expiry is not a generation rejection');
        assert_true($idleLogged === [], 'idle expiry does not log a data-restore line');
    }

    Auth::startSession();
    $login = new Auth($pdo, 'BaikalDAV', 900, 3);
    $profile = $login->login('alice', 'secret');
    assert_true(($profile['username'] ?? '') === 'alice', 'login returns the user');
    assert_true(($_SESSION[Auth::SESSION_GENERATION_KEY] ?? null) === 3, 'login stores the request generation');
    assert_true($login->requireUser() === 'alice', 'session minted at the current generation works');

    $appSrc = file_get_contents($root . '/Core/Frameworks/Baikal/Portal/App.php');
    assert_true(is_string($appSrc) && $appSrc !== '', 'App.php readable');
    assert_true(
        is_string($appSrc)
            && str_contains($appSrc, "wasGenerationRejected()")
            && str_contains($appSrc, 'PortalSessionGeneration::RESTORE_MESSAGE'),
        'mutation gate uses the restore sentence'
    );
    assert_true(
        is_string($appSrc) && str_contains($appSrc, "['sessionEnded'] = 'restored'"),
        'GET /me adds sessionEnded when the generation flag is set'
    );
    assert_true(
        is_string($appSrc) && str_contains($appSrc, 'portal session ended reason=data-restore user='),
        'generation rejection logs the data-restore reason'
    );
    $marker = 'A successful return is followed by a portal session generation bump';
    $start = is_string($appSrc) ? strpos($appSrc, $marker) : false;
    $end = is_int($start) ? strpos($appSrc, 'Settings restore:', $start) : false;
    $block = is_int($start) && is_int($end) ? substr($appSrc, $start, $end - $start) : '';
    $restorePos = strpos($block, '$this->adminDataExport->restore(');
    $catchPos = strpos($block, 'catch (ApiException');
    $bumpPos = strpos($block, 'bumpPortalSessionGeneration()');
    assert_true(
        is_int($restorePos) && is_int($catchPos) && is_int($bumpPos)
            && $restorePos < $catchPos && $catchPos < $bumpPos,
        'generation bump runs only after restore() returns'
    );
    $catchBlock = is_int($catchPos) && is_int($bumpPos) ? substr($block, $catchPos, $bumpPos - $catchPos) : '';
    assert_true(!str_contains($catchBlock, 'bumpPortalSessionGeneration'), 'a thrown restore does not bump');
    assert_true(str_contains($block, "'portal-session-generation'"), 'a bump failure is its own audit event');
    assert_true(str_contains($block, 'PortalSessionGeneration::BUMP_FAILED_MESSAGE'), 'a bump failure tells the operator sessions were not ended');
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
echo "\nAll AuthSessionGeneration tests passed.\n";
exit(0);
