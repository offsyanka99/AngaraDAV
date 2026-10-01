<?php

/**
 * Unit checks for Baikal\Portal\Admin\AdminPushSubscriptionService.
 *
 * Run: php tests/php/AdminPushSubscriptionServiceTest.php
 * Requires: composer install and pdo_sqlite.
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Core\Plugins\Push\SecretCipher;
use Baikal\Core\Plugins\Push\SubscriptionStorage;
use Baikal\Portal\Admin\AdminAudit;
use Baikal\Portal\Admin\AdminPushSubscriptionService;
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

function expect_status(callable $fn, int $status, string $message): void {
    try {
        $fn();
        assert_true(false, $message . ' (no exception)');
    } catch (ApiException $e) {
        assert_true($e->getStatus() === $status, $message . ' got ' . $e->getStatus());
    }
}

function read_log(string $dir): string {
    $path = $dir . '/portal_debug.log';

    return is_file($path) ? (string) file_get_contents($path) : '';
}

function clear_log(string $dir): void {
    $path = $dir . '/portal_debug.log';
    if (is_file($path)) {
        unlink($path);
    }
}

/**
 * @param array<string, mixed> $fields
 */
function insert_plain(\PDO $pdo, array $fields): int {
    $stmt = $pdo->prepare(
        'INSERT INTO push_subscriptions
         (registration_token, principaluri, resource_uri, topic, push_resource,
          push_resource_hash, content_encoding, pubkey, auth_secret, triggers, created, expires)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([
        $fields['token'],
        $fields['principaluri'],
        $fields['resource_uri'],
        $fields['topic'],
        $fields['push_resource'],
        hash('sha256', (string) $fields['token']),
        null,
        $fields['pubkey'],
        $fields['auth_secret'],
        $fields['triggers'],
        $fields['created'],
        $fields['expires'],
    ]);

    return (int) $pdo->lastInsertId();
}

$logDir = sys_get_temp_dir() . '/angara-push-admin-' . bin2hex(random_bytes(4));
mkdir($logDir, 0700, true);
$audit = new AdminAudit($logDir, 'info');
$key = '0123456789abcdef-test-key';
$config = [
    'system'   => ['push_enabled' => true],
    'database' => ['encryption_key' => $key],
];

$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$svc = new AdminPushSubscriptionService($pdo, $config, $audit);

$empty = $svc->listFromQuery([]);
assert_true($empty['subscriptions'] === [] && $empty['expiredHidden'] === 0, 'push on, never used, empty list');

$cipher = new SecretCipher($key);
$storage = new SubscriptionStorage($pdo, $cipher);
$endpoint = 'https://fcm.googleapis.com/fcm/send/tok-ab12cd';
$pubkey = 'PUBKEY-SECRET-XYZ';
$authSecret = 'AUTHSECRET-XYZ';
$topic = 'TOPIC-SECRET-99';
$now = time();
$saved = $storage->upsert([
    'principaluri'     => 'principals/yurik',
    'resource_uri'     => 'files/yurik',
    'topic'            => $topic,
    'push_resource'    => $endpoint,
    'content_encoding' => 'aes128gcm',
    'pubkey'           => $pubkey,
    'auth_secret'      => $authSecret,
    'triggers'         => '{"content":"infinity","property":"1"}',
    'expires'          => $now + 86400,
]);
$token = (string) $saved['token'];

$listed = $svc->listFromQuery([]);
assert_true(count($listed['subscriptions']) === 1, 'one active subscription');
$row = $listed['subscriptions'][0];
assert_true($row['username'] === 'yurik', 'username is last principal segment');
assert_true($row['principalUri'] === 'principals/yurik', 'principalUri kept');
assert_true($row['kind'] === 'files', 'files kind');
assert_true($row['resourceUri'] === 'files/yurik', 'resource uri');
assert_true($row['endpointHost'] === 'fcm.googleapis.com', 'endpoint host');
assert_true($row['endpointHint'] === 'ab12cd', 'last six characters of the path');
assert_true($row['contentDepth'] === 'infinity', 'content depth');
assert_true($row['propertyDepth'] === '1', 'property depth');
assert_true($row['expired'] === false, 'active row is not expired');
assert_true($listed['expiredHidden'] === 0, 'no expired rows hidden');

$encoded = json_encode($listed);
assert_true(is_string($encoded), 'list encodes');
$hidden = [
    'endpoint'            => $endpoint,
    'path token'          => 'tok-ab12cd',
    'pubkey'              => $pubkey,
    'auth secret'         => $authSecret,
    'topic'               => $topic,
    'registration token'  => $token,
    'ciphertext prefix'   => SecretCipher::PREFIX,
    'registration column' => 'registration_token',
    'endpoint column'     => 'push_resource',
];
foreach ($hidden as $label => $secret) {
    assert_true(!str_contains((string) $encoded, $secret), 'list omits ' . $label);
}
assert_true(!array_key_exists('pubkey', $row) && !array_key_exists('auth_secret', $row), 'no key fields');

insert_plain($pdo, [
    'token'          => 'plain-cal',
    'principaluri'   => 'principals/ada',
    'resource_uri'   => 'calendars/ada/default',
    'topic'          => 'topic-cal',
    'push_resource'  => 'https://push.example/hook/calendar1',
    'pubkey'         => 'plain-pubkey',
    'auth_secret'    => 'plain-auth',
    'triggers'       => '{not-json',
    'created'        => $now - 50,
    'expires'        => $now + 100,
]);
insert_plain($pdo, [
    'token'          => 'plain-ab',
    'principaluri'   => 'principals/ada',
    'resource_uri'   => 'addressbooks/ada/default',
    'topic'          => 'topic-ab',
    'push_resource'  => 'https://push.example/hook/book0001',
    'pubkey'         => 'plain-pubkey',
    'auth_secret'    => 'plain-auth',
    'triggers'       => '{}',
    'created'        => $now - 40,
    'expires'        => $now + 100,
]);
insert_plain($pdo, [
    'token'          => 'plain-principal',
    'principaluri'   => 'principals/ada',
    'resource_uri'   => 'principals/ada',
    'topic'          => 'topic-pr',
    'push_resource'  => 'https://push.example/hook/princ01',
    'pubkey'         => 'plain-pubkey',
    'auth_secret'    => 'plain-auth',
    'triggers'       => '{}',
    'created'        => $now - 30,
    'expires'        => $now + 100,
]);
insert_plain($pdo, [
    'token'          => 'plain-other',
    'principaluri'   => 'principals/ada',
    'resource_uri'   => 'misc/ada',
    'topic'          => 'topic-other',
    'push_resource'  => 'https://push.example/hook/other01',
    'pubkey'         => 'plain-pubkey',
    'auth_secret'    => 'plain-auth',
    'triggers'       => '{}',
    'created'        => $now - 20,
    'expires'        => $now + 100,
]);
$expiredId = insert_plain($pdo, [
    'token'          => 'plain-expired',
    'principaluri'   => 'principals/yurik',
    'resource_uri'   => 'files/yurik/old',
    'topic'          => 'topic-expired',
    'push_resource'  => 'https://push.example/hook/oldend',
    'pubkey'         => 'plain-pubkey',
    'auth_secret'    => 'plain-auth',
    'triggers'       => '{"content":"1"}',
    'created'        => $now - 10,
    'expires'        => $now - 5,
]);

$kinds = [];
foreach ($svc->listFromQuery(['expired' => '1'])['subscriptions'] as $item) {
    $kinds[$item['resourceUri']] = $item['kind'];
}
assert_true($kinds['calendars/ada/default'] === 'calendars', 'calendars kind');
assert_true($kinds['addressbooks/ada/default'] === 'addressbooks', 'addressbooks kind');
assert_true($kinds['principals/ada'] === 'principals', 'principals kind is the resource, not the owner');
assert_true($kinds['misc/ada'] === 'other', 'other kind');

$bad = null;
foreach ($svc->listFromQuery([])['subscriptions'] as $item) {
    if ($item['resourceUri'] === 'calendars/ada/default') {
        $bad = $item;
    }
}
assert_true($bad !== null && $bad['contentDepth'] === null && $bad['propertyDepth'] === null, 'bad triggers are null');

$active = $svc->listFromQuery([]);
$activeIds = array_column($active['subscriptions'], 'id');
assert_true(!in_array($expiredId, $activeIds, true), 'default list hides expired');
assert_true($active['expiredHidden'] === 1, 'expiredHidden counts the omitted row');

$withExpired = $svc->listFromQuery(['expired' => '1']);
assert_true(in_array($expiredId, array_column($withExpired['subscriptions'], 'id'), true), 'expired=1 includes the old row');
assert_true($withExpired['expiredHidden'] === 0, 'expiredHidden is 0 when nothing is hidden');
$expiredRow = null;
foreach ($withExpired['subscriptions'] as $item) {
    if ($item['id'] === $expiredId) {
        $expiredRow = $item;
    }
}
assert_true($expiredRow !== null && $expiredRow['expired'] === true, 'expired flag');

$onlyYurik = $svc->listFromQuery(['user' => 'yurik', 'expired' => '1']);
foreach ($onlyYurik['subscriptions'] as $item) {
    assert_true($item['username'] === 'yurik', 'user filter is exact');
}
$injected = $svc->listFromQuery(['user' => "yurik' OR 1=1"]);
assert_true($injected['subscriptions'] === [], 'user filter is a bound principal, not SQL');
$prefix = $svc->listFromQuery(['user' => 'yuri']);
assert_true($prefix['subscriptions'] === [], 'user filter does not prefix-match');

$filesOnly = $svc->listFromQuery(['kind' => 'files', 'expired' => '1']);
foreach ($filesOnly['subscriptions'] as $item) {
    assert_true($item['kind'] === 'files', 'kind filter');
}
assert_true($filesOnly['expiredHidden'] === 0, 'kind filter with expired=1 hides nothing');
$filesActive = $svc->listFromQuery(['kind' => 'files']);
assert_true($filesActive['expiredHidden'] === 1, 'expiredHidden respects the kind filter');

expect_status(static function () use ($svc) {
    $svc->listFromQuery(['kind' => "files' OR 1=1"]);
}, 400, 'invalid kind');

$createdOrder = array_column($svc->listFromQuery(['expired' => '1'])['subscriptions'], 'created');
$sorted = $createdOrder;
rsort($sorted);
assert_true($createdOrder === $sorted, 'newest created first');

for ($i = 1; $i <= 501; ++$i) {
    insert_plain($pdo, [
        'token'         => 'cap-' . $i,
        'principaluri'  => 'principals/cap',
        'resource_uri'  => 'files/cap/' . $i,
        'topic'         => 'cap-topic',
        'push_resource' => 'https://push.example/c/' . str_pad((string) $i, 6, '0', STR_PAD_LEFT),
        'pubkey'        => 'cap-pubkey',
        'auth_secret'   => 'cap-auth',
        'triggers'      => '{}',
        'created'       => 1000 + $i,
        'expires'       => $now + 1000,
    ]);
}
$capped = $svc->listFromQuery(['user' => 'cap']);
assert_true(count($capped['subscriptions']) === 500, 'list caps at 500');
assert_true($capped['subscriptions'][0]['created'] === 1501, 'cap keeps the newest');
assert_true($capped['subscriptions'][499]['created'] === 1002, 'cap drops the oldest');

$short = new AdminPushSubscriptionService($pdo, [
    'system'   => ['push_enabled' => true],
    'database' => ['encryption_key' => 'too-short'],
], $audit);
$blob = 'enc:v1:CIPHERTEXTBLOB-NOT-A-HINT';
insert_plain($pdo, [
    'token'         => 'cipher-row',
    'principaluri'  => 'principals/cipher',
    'resource_uri'  => 'files/cipher',
    'topic'         => 'cipher-topic',
    'push_resource' => $blob,
    'pubkey'        => 'cipher-pubkey',
    'auth_secret'   => 'cipher-auth',
    'triggers'      => '{}',
    'created'       => $now,
    'expires'       => $now + 100,
]);
$blind = $short->listFromQuery(['user' => 'cipher']);
assert_true(count($blind['subscriptions']) === 1, 'ciphertext row still lists');
assert_true($blind['subscriptions'][0]['endpointHost'] === '', 'no host from ciphertext');
assert_true($blind['subscriptions'][0]['endpointHint'] === '', 'no hint from ciphertext');
assert_true(!str_contains((string) json_encode($blind), 'CIPHERTEXTBLOB'), 'ciphertext stays out of the payload');

clear_log($logDir);
expect_status(static function () use ($svc, $saved) {
    $svc->deleteOne('admin', (int) $saved['id'], null);
}, 400, 'delete requires confirm');
assert_true(str_contains(read_log($logDir), 'result=error:400'), 'confirm failure audited as 400');
assert_true(!str_contains(read_log($logDir), 'username='), 'confirm failure has no username');
assert_true($storage->findById((int) $saved['id']) !== null, 'unconfirmed delete keeps the row');

clear_log($logDir);
expect_status(static function () use ($svc) {
    $svc->deleteOne('admin', 999999, true);
}, 404, 'unknown id');
$unknownLog = read_log($logDir);
assert_true(str_contains($unknownLog, 'result=error:404'), 'unknown id audited as 404');
assert_true(!str_contains($unknownLog, 'username='), 'unknown id has no username');
assert_true(!str_contains($unknownLog, $endpoint) && !str_contains($unknownLog, $token), 'unknown id log has no endpoint or token');

clear_log($logDir);
$gone = $svc->deleteOne('admin', (int) $saved['id'], true);
assert_true($gone === ['ok' => true], 'delete ok');
assert_true($storage->findById((int) $saved['id']) === null, 'row removed');
$deleteLog = read_log($logDir);
assert_true(str_contains($deleteLog, 'action=push-subscription.delete'), 'delete action');
assert_true(str_contains($deleteLog, 'result=ok'), 'delete result ok');
assert_true(str_contains($deleteLog, 'username=yurik'), 'delete audits username');
assert_true(str_contains($deleteLog, 'kind=files'), 'delete audits kind');
assert_true(substr_count($deleteLog, 'admin audit') === 1, 'one delete audit line');
foreach ([
    'endpoint'           => $endpoint,
    'registration token' => $token,
    'pubkey'             => $pubkey,
    'auth secret'        => $authSecret,
    'topic'              => $topic,
    'path token'         => 'tok-ab12cd',
    'ciphertext prefix'  => SecretCipher::PREFIX,
] as $label => $secret) {
    assert_true(!str_contains($deleteLog, $secret), 'delete audit omits ' . $label);
}

$queueBefore = (int) $pdo->query('SELECT COUNT(*) FROM push_queue')->fetchColumn();
$pdo->prepare(
    'INSERT INTO push_queue (resource_uri, topic, available_at, created) VALUES (?, ?, ?, ?)'
)->execute(['files/yurik', 'queue-topic', $now, $now]);
$keepId = insert_plain($pdo, [
    'token'         => 'keep-active',
    'principaluri'  => 'principals/keep',
    'resource_uri'  => 'files/keep',
    'topic'         => 'keep-topic',
    'push_resource' => 'https://push.example/hook/keep01',
    'pubkey'        => 'keep-pubkey',
    'auth_secret'   => 'keep-auth',
    'triggers'      => '{}',
    'created'       => $now,
    'expires'       => $now + 500,
]);
clear_log($logDir);
$bulk = $svc->deleteMany('admin', [(int) $expiredId, (string) $keepId, 424242], true);
assert_true($bulk['ok'] === true && $bulk['deleted'] === 2 && $bulk['missing'] === 1, 'bulk skips unknown ids');
assert_true(substr_count(read_log($logDir), 'admin audit') === 1, 'one bulk audit line');
assert_true(str_contains(read_log($logDir), 'deleted=2') && str_contains(read_log($logDir), 'missing=1'), 'bulk audits counts');
assert_true((int) $pdo->query('SELECT COUNT(*) FROM push_queue')->fetchColumn() === $queueBefore + 1, 'delete does not touch push_queue');

expect_status(static function () use ($svc) {
    $svc->deleteMany('admin', [], true);
}, 400, 'empty ids');
expect_status(static function () use ($svc) {
    $svc->deleteMany('admin', range(1, 101), true);
}, 400, 'more than 100 ids');
expect_status(static function () use ($svc) {
    $svc->deleteMany('admin', ['nope'], true);
}, 400, 'no valid ids');
expect_status(static function () use ($svc) {
    $svc->deleteMany('admin', ['id' => 1], true);
}, 400, 'ids must be a list');

insert_plain($pdo, [
    'token'         => 'purge-me',
    'principaluri'  => 'principals/purge',
    'resource_uri'  => 'files/purge',
    'topic'         => 'purge-topic',
    'push_resource' => 'https://push.example/hook/purge1',
    'pubkey'        => 'purge-pubkey',
    'auth_secret'   => 'purge-auth',
    'triggers'      => '{}',
    'created'       => $now - 20,
    'expires'       => $now - 10,
]);
clear_log($logDir);
$purged = $svc->purge('admin', true);
assert_true($purged === ['ok' => true, 'deleted' => 1], 'purge removes expired rows');
assert_true(str_contains(read_log($logDir), 'action=push-subscription.purge'), 'purge action');
assert_true((int) $pdo->query('SELECT COUNT(*) FROM push_subscriptions WHERE expires <= ' . $now)->fetchColumn() === 0, 'no expired rows left');
assert_true((int) $pdo->query("SELECT COUNT(*) FROM push_subscriptions WHERE principaluri = 'principals/cap'")->fetchColumn() === 501, 'purge keeps active rows');

$offPdo = new PDO('sqlite::memory:');
$offPdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$off = new AdminPushSubscriptionService($offPdo, ['system' => ['push_enabled' => 'off']], $audit);
clear_log($logDir);
expect_status(static function () use ($off) {
    $off->listFromQuery([]);
}, 404, 'push off list');
assert_true(read_log($logDir) === '', 'list is not audited');
assert_true(
    $offPdo->query("SELECT name FROM sqlite_master WHERE name = 'push_subscriptions'")->fetchColumn() === false,
    'push off does not create the table'
);
expect_status(static function () use ($off) {
    $off->deleteOne('admin', 1, true);
}, 404, 'push off delete');
expect_status(static function () use ($off) {
    $off->purge('admin', true);
}, 404, 'push off purge');
$offLog = read_log($logDir);
assert_true(substr_count($offLog, 'result=error:404') === 2, 'push off mutations audited as 404');
assert_true(!str_contains($offLog, $endpoint) && !str_contains($offLog, $token), 'push off audit has no endpoint or token');
assert_true(
    $offPdo->query("SELECT name FROM sqlite_master WHERE name = 'push_subscriptions'")->fetchColumn() === false,
    'push off delete still does not create the table'
);

$stringOn = new AdminPushSubscriptionService(new PDO('sqlite::memory:'), [
    'system' => ['push_enabled' => 'true'],
], $audit);
$stringOn->listFromQuery([]);
assert_true(true, 'string true enables push');

if ($failures > 0) {
    echo "\n$failures failure(s)\n";
    exit(1);
}
echo "\nAll AdminPushSubscriptionService tests passed.\n";
exit(0);
