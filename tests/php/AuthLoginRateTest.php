<?php

/**
 * Portal address limit and username cool-down.
 *
 * Run: php tests/php/AuthLoginRateTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Core\PDOBasicAuth;
use Baikal\Portal\ApiException;
use Baikal\Portal\Auth;
use Baikal\Portal\LoginRatePolicy;

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

$specific = sys_get_temp_dir() . '/baikal-login-rate-' . bin2hex(random_bytes(4));
@mkdir($specific, 0700, true);
define('PROJECT_PATH_SPECIFIC', $specific);

$sessionDir = $specific . '/sessions';
@mkdir($sessionDir, 0700, true);
session_save_path($sessionDir);
ob_start();

$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, digesta1 TEXT NOT NULL)');
$pdo->exec("INSERT INTO users (username, digesta1) VALUES ('alice', '" . digest('alice', 'secret') . "')");

$policy = new LoginRatePolicy(20, 900, 2, 900, 120);
$auth = new Auth($pdo, 'BaikalDAV', 900, 0, null, $policy);
Auth::startSession();

$userFile = $specific . '/portal_login_user_rate.json';

try {
    $first = null;
    $second = null;
    try {
        $auth->login('alice', 'wrong');
    } catch (ApiException $e) {
        $first = $e;
    }
    try {
        $auth->login('alice', 'wrong');
    } catch (ApiException $e) {
        $second = $e;
    }
    assert_true($first instanceof ApiException && $first->getStatus() === 401, 'first failure is 401');
    assert_true($second instanceof ApiException && $second->getStatus() === 401, 'failure that starts the cool-down is still 401');
    assert_true($first->getMessage() === 'Invalid username or password', 'unknown-or-wrong message stays generic');

    $cooled = null;
    try {
        $auth->login('alice', 'secret');
    } catch (ApiException $e) {
        $cooled = $e;
    }
    assert_true($cooled instanceof ApiException && $cooled->getStatus() === 429, 'next portal sign-in is refused');
    assert_true($cooled->getMessage() === 'Too many login attempts. Please try again later.', 'cool-down uses the address-limit message');
    assert_true(!str_contains($cooled->getMessage(), 'alice'), 'cool-down message does not name the user');
    assert_true(!str_contains(strtolower($cooled->getMessage()), 'lock'), 'cool-down message does not say the account is locked');

    $stored = json_decode((string) file_get_contents($userFile), true);
    assert_true(is_array($stored) && isset($stored['alice']['cooldown_until']), 'cool-down is stored by username');
    assert_true((fileperms($userFile) & 0777) === 0600, 'username rate file is mode 0600');

    $unknown = null;
    $unknownAuth = new Auth($pdo, 'BaikalDAV', 900, 0, null, new LoginRatePolicy(50, 900, 1, 900, 120));
    try {
        $unknownAuth->login('nobody', 'nope');
    } catch (ApiException $e) {
        $unknown = $e;
    }
    $unknownAgain = null;
    try {
        $unknownAuth->login('nobody', 'nope');
    } catch (ApiException $e) {
        $unknownAgain = $e;
    }
    assert_true($unknown instanceof ApiException && $unknown->getStatus() === 401, 'unknown username first failure is 401');
    assert_true($unknownAgain instanceof ApiException && $unknownAgain->getStatus() === 429, 'unknown username is cooled down too');
    assert_true($unknownAgain->getMessage() === $cooled->getMessage(), 'unknown username gets the same refusal');

    $verify = new Auth($pdo, 'BaikalDAV', 900, 0, null, new LoginRatePolicy(50, 900, 1, 900, 120));
    $before = is_file($userFile) ? (string) file_get_contents($userFile) : '';
    assert_true($verify->verifyPassword('alice', 'wrong') === false, 'verifyPassword rejects a wrong password');
    $after = is_file($userFile) ? (string) file_get_contents($userFile) : '';
    $beforeData = json_decode($before, true);
    $afterData = json_decode($after, true);
    $beforeAlice = is_array($beforeData) ? ($beforeData['alice']['count'] ?? null) : null;
    $afterAlice = is_array($afterData) ? ($afterData['alice']['count'] ?? null) : null;
    assert_true($beforeAlice === $afterAlice, 'verifyPassword does not add a username cool-down count');

    $_SERVER['REMOTE_ADDR'] = '203.0.113.10';
    $basic = new PDOBasicAuth($pdo, 'BaikalDAV', 'users', new LoginRatePolicy(1, 900, 10, 900, 900));
    assert_true($basic->validateUserPass('alice', 'wrong') === false, 'Basic records the first failure');
    assert_true($basic->validateUserPass('alice', 'secret') === false, 'Basic stops at the address limit');
    $webdav = json_decode((string) file_get_contents($specific . '/webdav_auth_rate.json'), true);
    assert_true(is_array($webdav) && (int) ($webdav['203.0.113.10']['count'] ?? 0) === 1, 'Basic counts the address, not a later success');
} catch (Throwable $e) {
    echo 'FAIL unexpected ' . $e->getMessage() . "\n";
    ++$failures;
}

if ($failures > 0) {
    echo "$failures failed\n";
    exit(1);
}
echo "all passed\n";
