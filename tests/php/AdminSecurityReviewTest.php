<?php

/**
 * Phase 9.1 security regression: mass-assignment, secret rejection, path safety.
 *
 * Run: php tests/php/AdminSecurityReviewTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Portal\Admin\AdminSettingsService;
use Baikal\Portal\Admin\AdminUserService;
use Baikal\Portal\ApiException;
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

// --- Settings: forbid secret mass-assignment ---
$dir = sys_get_temp_dir() . '/baikal-sec-' . bin2hex(random_bytes(4));
@mkdir($dir, 0700, true);
$path = $dir . '/baikal.yaml';
file_put_contents($path, Yaml::dump([
    'system' => [
        'timezone'                => 'UTC',
        'cal_enabled'             => true,
        'card_enabled'            => true,
        'files_enabled'           => false,
        'files_max_upload_mb'     => 100,
        'files_quota_mb'          => 1000,
        'files_quarantine_days'   => 7,
        'tasks_enabled'           => true,
        'notes_enabled'           => false,
        'dav_auth_type'           => 'Digest',
        'session_max_age_minutes' => 15,
        'push_enabled'            => false,
        'push_external_url'       => '',
        'push_log_level'          => 'off',
        'admin_passwordhash'      => password_hash('x', PASSWORD_DEFAULT),
        'auth_realm'              => 'BaikalDAV',
    ],
    'database' => [
        'backend'        => 'sqlite',
        'sqlite_file'    => '/tmp/db.sqlite',
        'pgsql_password' => 'db-secret',
        'encryption_key' => 'enc-secret',
    ],
], 4, 2));

$settings = new AdminSettingsService($path);

try {
    $settings->updateSystemSettings([
        'files_enabled'      => true,
        'admin_passwordhash' => '$2y$10$shouldnotbeaccepted',
    ]);
    assert_true(false, 'admin_passwordhash in body should be rejected');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 400, 'admin_passwordhash mass-assign → 400');
}

try {
    $settings->updateSystemSettings([
        'files_enabled' => true,
        'digesta1'      => 'deadbeef',
    ]);
    assert_true(false, 'digesta1 in settings body should be rejected');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 400, 'digesta1 mass-assign → 400');
}

// files_storage_path path safety
try {
    $settings->updateSystemSettings(['files_storage_path' => 'relative/path']);
    assert_true(false, 'relative storage path should fail');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 400, 'relative path → 400');
}

try {
    $settings->updateSystemSettings(['files_storage_path' => '/var/lib/baikal/../etc']);
    assert_true(false, '.. in storage path should fail');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 400, 'path traversal → 400');
}

$settings->updateSystemSettings(['files_storage_path' => '/var/lib/baikal-files']);
$got = $settings->getSystemSettings();
assert_true($got['files_storage_path'] === '/var/lib/baikal-files', 'absolute path accepted');
assert_true(!array_key_exists('admin_passwordhash', $got), 'GET still omits password hash');

// Database GET never leaks secrets
$db = $settings->getDatabaseSettings();
$json = json_encode($db);
assert_true($json !== false && !str_contains($json, 'db-secret'), 'db GET no password');
assert_true(!str_contains((string) $json, 'enc-secret'), 'db GET no encryption key');
assert_true($db['writeEnabled'] === false, 'db write disabled');

// --- Users: forbid digesta1 mass-assignment ---
$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, digesta1 TEXT NOT NULL)');
$pdo->exec('CREATE TABLE principals (id INTEGER PRIMARY KEY, uri TEXT, email TEXT, displayname TEXT)');
$pdo->exec('CREATE TABLE calendars (id INTEGER PRIMARY KEY, synctoken INTEGER DEFAULT 1, components TEXT NOT NULL)');
$pdo->exec('CREATE TABLE calendarinstances (
    id INTEGER PRIMARY KEY, calendarid INTEGER, principaluri TEXT, access INTEGER DEFAULT 1,
    displayname TEXT, uri TEXT, description TEXT, calendarorder INTEGER DEFAULT 0, share_invitestatus INTEGER DEFAULT 2
)');
$pdo->exec('CREATE TABLE addressbooks (
    id INTEGER PRIMARY KEY, principaluri TEXT, displayname TEXT, uri TEXT, description TEXT, synctoken INTEGER DEFAULT 1
)');
$pdo->exec('CREATE TABLE cards (id INTEGER PRIMARY KEY, addressbookid INTEGER, uri TEXT)');
$pdo->exec('CREATE TABLE calendarobjects (id INTEGER PRIMARY KEY, calendarid INTEGER, uri TEXT)');

$users = new AdminUserService($pdo, ['system' => ['auth_realm' => 'BaikalDAV']]);
$users->createUser([
    'username'        => 'alice',
    'displayname'     => 'Alice',
    'email'           => 'a@example.com',
    'password'        => 'secret',
    'passwordConfirm' => 'secret',
]);

try {
    $users->updateUser('alice', [
        'displayname' => 'Alice2',
        'digesta1'    => 'injected',
    ]);
    assert_true(false, 'digesta1 on user update should fail');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 400, 'user digesta1 → 400');
}

try {
    $users->createUser([
        'username'        => 'bob',
        'displayname'     => 'Bob',
        'email'           => 'b@example.com',
        'password'        => 'x',
        'passwordConfirm' => 'x',
        'digesta1'        => 'injected',
    ]);
    assert_true(false, 'digesta1 on user create should fail');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 400, 'create digesta1 → 400');
}

try {
    $users->updateUser('alice', [
        'username'    => 'notalice',
        'displayname' => 'Alice',
        'email'       => 'a@example.com',
    ]);
    assert_true(false, 'username change should fail');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 400, 'username immutable → 400');
}

$detail = $users->getUser('alice');
assert_true(!array_key_exists('digesta1', $detail), 'getUser no digesta1');
$digest = (string) $pdo->query("SELECT digesta1 FROM users WHERE username='alice'")->fetchColumn();
assert_true($digest === md5('alice:BaikalDAV:secret'), 'digest unchanged after rejected inject');

// Gate location documented: requireAdmin must wrap dispatchAdminRoutes
$appSrc = file_get_contents($root . '/Core/Frameworks/Baikal/Portal/App.php');
assert_true(
    is_string($appSrc)
    && str_contains($appSrc, 'requireAdmin()')
    && str_contains($appSrc, 'dispatchAdminRoutes'),
    'App.php wires requireAdmin before dispatchAdminRoutes'
);
// Ensure dispatchAdminRoutes is private (no external bypass)
assert_true(
    is_string($appSrc) && preg_match('/private function dispatchAdminRoutes\s*\(/', $appSrc) === 1,
    'dispatchAdminRoutes is private'
);

@unlink($path);
@rmdir($dir);

if ($failures > 0) {
    echo "\n$failures failure(s)\n";
    exit(1);
}
echo "\nAll AdminSecurityReview tests passed.\n";
exit(0);
