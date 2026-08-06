<?php

/**
 * Unit checks for Baikal\Portal\Admin\AdminUserService (read + write).
 *
 * Run: php tests/php/AdminUserServiceTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Portal\Admin\AdminUserService;
use Baikal\Portal\ApiException;

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

function fresh_pdo(): PDO {
    $pdo = new PDO('sqlite::memory:');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, digesta1 TEXT NOT NULL)');
    $pdo->exec('CREATE TABLE principals (id INTEGER PRIMARY KEY, uri TEXT NOT NULL UNIQUE, email TEXT, displayname TEXT)');
    $pdo->exec('CREATE TABLE calendars (id INTEGER PRIMARY KEY, synctoken INTEGER DEFAULT 1, components TEXT NOT NULL)');
    $pdo->exec('CREATE TABLE calendarinstances (
        id INTEGER PRIMARY KEY, calendarid INTEGER, principaluri TEXT, access INTEGER DEFAULT 1,
        displayname TEXT, uri TEXT, description TEXT, calendarorder INTEGER DEFAULT 0,
        share_invitestatus INTEGER DEFAULT 2
    )');
    $pdo->exec('CREATE TABLE calendarobjects (id INTEGER PRIMARY KEY, calendarid INTEGER, uri TEXT, calendardata BLOB)');
    $pdo->exec('CREATE TABLE calendarchanges (id INTEGER PRIMARY KEY, uri TEXT, synctoken INTEGER, calendarid INTEGER, operation INTEGER)');
    $pdo->exec('CREATE TABLE addressbooks (
        id INTEGER PRIMARY KEY, principaluri TEXT, displayname TEXT, uri TEXT, description TEXT, synctoken INTEGER DEFAULT 1
    )');
    $pdo->exec('CREATE TABLE cards (id INTEGER PRIMARY KEY, addressbookid INTEGER, uri TEXT)');
    $pdo->exec('CREATE TABLE addressbookchanges (id INTEGER PRIMARY KEY, uri TEXT, synctoken INTEGER, addressbookid INTEGER, operation INTEGER)');

    return $pdo;
}

$config = ['system' => ['auth_realm' => 'BaikalDAV', 'tasks_enabled' => true, 'notes_enabled' => false]];

// --- Seed for read path ---
$pdo = fresh_pdo();
$pdo->exec("INSERT INTO users (username, digesta1) VALUES ('alice', 'digest-alice-SECRET'), ('bob', 'digest-bob-SECRET')");
$pdo->exec("INSERT INTO principals (uri, email, displayname) VALUES
    ('principals/alice', 'alice@example.com', 'Alice A'),
    ('principals/bob', 'bob@example.com', 'Bob B')");
$pdo->exec("INSERT INTO calendars (components) VALUES ('VEVENT,VTODO'), ('VEVENT,VTODO'), ('VEVENT,VTODO')");
$pdo->exec("INSERT INTO calendarinstances (calendarid, principaluri, access, uri) VALUES
    (1, 'principals/alice', 1, 'default'),
    (2, 'principals/alice', 1, 'work'),
    (3, 'principals/bob', 1, 'default')");
$pdo->exec("INSERT INTO calendarobjects (calendarid, uri) VALUES (1, 'e1.ics'), (1, 'e2.ics'), (3, 'e3.ics')");
$pdo->exec("INSERT INTO addressbooks (principaluri, uri) VALUES
    ('principals/alice', 'default'),
    ('principals/bob', 'default')");
$pdo->exec("INSERT INTO cards (addressbookid, uri) VALUES (1, 'c1.vcf'), (1, 'c2.vcf'), (2, 'c3.vcf')");

$svc = new AdminUserService($pdo, $config);

$list = $svc->listUsers();
assert_true(count($list) === 2, 'list has 2 users');
assert_true($list[0]['username'] === 'alice', 'sorted alice first');
assert_true($list[0]['displayname'] === 'Alice A', 'alice displayname');
assert_true($list[0]['email'] === 'alice@example.com', 'alice email');
assert_true($list[0]['principal'] === 'principals/alice', 'alice principal');
assert_true(!array_key_exists('digesta1', $list[0]), 'list never includes digesta1');
assert_true(!array_key_exists('password', $list[0]), 'list never includes password');

$json = json_encode($list);
assert_true($json !== false && !str_contains($json, 'digest-alice-SECRET'), 'JSON list has no digest secrets');

$alice = $svc->getUser('alice');
assert_true($alice['username'] === 'alice', 'getUser alice');
assert_true($alice['calendarCount'] === 2, 'alice calendarCount = 2');
assert_true($alice['addressBookCount'] === 1, 'alice addressBookCount = 1');
assert_true($alice['contactCount'] === 2, 'alice contactCount = 2');
assert_true($alice['eventCount'] === 2, 'alice eventCount = 2');
assert_true(!array_key_exists('digesta1', $alice), 'detail never includes digesta1');

try {
    $svc->getUser('nobody');
    assert_true(false, 'missing user should throw');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 404, 'missing user → 404');
}

try {
    $svc->getUser('../etc');
    assert_true(false, 'invalid username should throw');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 400, 'invalid username → 400');
}

// --- Create ---
$pdo2 = fresh_pdo();
$svc2 = new AdminUserService($pdo2, $config);

try {
    $svc2->createUser([
        'username'        => 'carol',
        'displayname'     => 'Carol C',
        'email'           => 'not-email',
        'password'        => 'secret1',
        'passwordConfirm' => 'secret1',
    ]);
    assert_true(false, 'invalid email should throw');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 400, 'invalid email → 400');
}

try {
    $svc2->createUser([
        'username'        => 'carol',
        'displayname'     => 'Carol C',
        'email'           => 'carol@example.com',
        'password'        => 'secret1',
        'passwordConfirm' => 'other',
    ]);
    assert_true(false, 'password mismatch should throw');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 400 && str_contains(strtolower($e->getMessage()), 'match'), 'password mismatch → 400');
}

$created = $svc2->createUser([
    'username'        => 'carol',
    'displayname'     => 'Carol C',
    'email'           => 'carol@example.com',
    'password'        => 'secret1',
    'passwordConfirm' => 'secret1',
]);
assert_true($created['username'] === 'carol', 'create returns carol');
assert_true($created['calendarCount'] === 1, 'create default calendar');
assert_true($created['addressBookCount'] === 1, 'create default address book');
assert_true(!array_key_exists('digesta1', $created), 'create response has no digesta1');

$expectedDigest = md5('carol:BaikalDAV:secret1');
$stored = $pdo2->query("SELECT digesta1 FROM users WHERE username='carol'")->fetchColumn();
assert_true($stored === $expectedDigest, 'digesta1 matches DAV scheme');

$comp = $pdo2->query('SELECT components FROM calendars ORDER BY id DESC LIMIT 1')->fetchColumn();
assert_true(str_contains((string) $comp, 'VEVENT') && str_contains((string) $comp, 'VTODO'), 'default calendar components include VEVENT+VTODO');

try {
    $svc2->createUser([
        'username'        => 'carol',
        'displayname'     => 'Dup',
        'email'           => 'dup@example.com',
        'password'        => 'x',
        'passwordConfirm' => 'x',
    ]);
    assert_true(false, 'duplicate username should throw');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 409, 'duplicate → 409');
}

// --- Update ---
$updated = $svc2->updateUser('carol', [
    'displayname' => 'Carol Updated',
    'email'       => 'carol2@example.com',
]);
assert_true($updated['displayname'] === 'Carol Updated', 'update displayname');
assert_true($updated['email'] === 'carol2@example.com', 'update email');
$digestBefore = (string) $pdo2->query("SELECT digesta1 FROM users WHERE username='carol'")->fetchColumn();
$svc2->updateUser('carol', ['displayname' => 'Carol Updated Again']); // no password
$digestAfter = (string) $pdo2->query("SELECT digesta1 FROM users WHERE username='carol'")->fetchColumn();
assert_true($digestBefore === $digestAfter, 'empty password leaves digesta1 unchanged');

$svc2->updateUser('carol', [
    'password'        => 'newpass',
    'passwordConfirm' => 'newpass',
]);
$newDigest = (string) $pdo2->query("SELECT digesta1 FROM users WHERE username='carol'")->fetchColumn();
assert_true($newDigest === md5('carol:BaikalDAV:newpass'), 'password change updates digesta1');

try {
    $svc2->updateUser('carol', [
        'password'        => 'a',
        'passwordConfirm' => 'b',
    ]);
    assert_true(false, 'update password mismatch should throw');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 400, 'update password mismatch → 400');
}

// --- Delete ---
// Keep a second user so carol is not the last remaining account
$svc2->createUser([
    'username'        => 'keepme',
    'displayname'     => 'Keep Me',
    'email'           => 'keep@example.com',
    'password'        => 'secret',
    'passwordConfirm' => 'secret',
]);
try {
    $svc2->deleteUser('carol', false);
    assert_true(false, 'delete without confirm should throw');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 400, 'delete without confirm → 400');
}

$del = $svc2->deleteUser('carol', true);
assert_true($del['ok'] === true && $del['username'] === 'carol', 'delete ok');
assert_true((int) $pdo2->query("SELECT COUNT(*) FROM users WHERE username='carol'")->fetchColumn() === 0, 'user row gone');
assert_true((int) $pdo2->query("SELECT COUNT(*) FROM principals WHERE uri='principals/carol'")->fetchColumn() === 0, 'principal gone');
assert_true((int) $pdo2->query("SELECT COUNT(*) FROM calendarinstances WHERE principaluri='principals/carol'")->fetchColumn() === 0, 'calendars gone');
assert_true((int) $pdo2->query("SELECT COUNT(*) FROM addressbooks WHERE principaluri='principals/carol'")->fetchColumn() === 0, 'addressbooks gone');

try {
    $svc2->deleteUser('carol', true);
    assert_true(false, 'delete missing should throw');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 404, 'delete missing → 404');
}

// Cannot delete the last remaining user
try {
    $svc2->deleteUser('keepme', true);
    assert_true(false, 'delete last user should fail');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 400, 'delete last user → 400');
}

// --- Last Admin role user (default: username "admin") ---
$pdoAdmin = fresh_pdo();
$svcAdmin = new AdminUserService($pdoAdmin, ['system' => ['auth_realm' => 'BaikalDAV']]);
$svcAdmin->createUser([
    'username'        => 'admin',
    'displayname'     => 'Admin',
    'email'           => 'admin@example.com',
    'password'        => 'secret',
    'passwordConfirm' => 'secret',
]);
$svcAdmin->createUser([
    'username'        => 'alice',
    'displayname'     => 'Alice',
    'email'           => 'alice@example.com',
    'password'        => 'secret',
    'passwordConfirm' => 'secret',
]);
try {
    $svcAdmin->deleteUser('admin', true);
    assert_true(false, 'delete sole Admin role user should fail');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 400 && str_contains($e->getMessage(), 'Admin'), 'delete last Admin → 400');
}
// alice is not Admin by default — can be deleted while admin remains
$svcAdmin->deleteUser('alice', true);
assert_true((int) $pdoAdmin->query("SELECT COUNT(*) FROM users WHERE username='alice'")->fetchColumn() === 0, 'non-admin deleted');

// Env list: only bob is Admin — deleting bob blocked even with other users
putenv('PORTAL_ADMIN_USERS=bob');
$pdoEnv = fresh_pdo();
$svcEnv = new AdminUserService($pdoEnv, ['system' => ['auth_realm' => 'BaikalDAV']]);
$svcEnv->createUser([
    'username' => 'bob', 'displayname' => 'Bob', 'email' => 'bob@example.com',
    'password' => 'secret', 'passwordConfirm' => 'secret',
]);
$svcEnv->createUser([
    'username' => 'carol', 'displayname' => 'Carol', 'email' => 'carol@example.com',
    'password' => 'secret', 'passwordConfirm' => 'secret',
]);
try {
    $svcEnv->deleteUser('bob', true);
    assert_true(false, 'delete last env Admin should fail');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 400 && str_contains($e->getMessage(), 'Admin'), 'env last Admin → 400');
}
$svcEnv->deleteUser('carol', true);
assert_true((int) $pdoEnv->query("SELECT COUNT(*) FROM users")->fetchColumn() === 1, 'non-admin carol deleted under env list');
putenv('PORTAL_ADMIN_USERS'); // clear

if ($failures > 0) {
    echo "\n$failures failure(s)\n";
    exit(1);
}
echo "\nAll AdminUserService tests passed.\n";
exit(0);
