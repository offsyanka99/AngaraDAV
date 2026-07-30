<?php

/**
 * Unit checks for the WebDAV-Push plugin components.
 *
 * Run: php tests/php/PushPluginTest.php
 * Requires: composer install (for sabre autoload; minishlink/web-push optional).
 *
 * These cover the server-independent pieces (parser, storage, topic, depth /
 * expiry resolution, logger). End-to-end delivery is exercised manually with a
 * real client (e.g. DAVx5) since it needs a live push service.
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Core\Plugins\Push\Notifier;
use Baikal\Core\Plugins\Push\PushLogger;
use Baikal\Core\Plugins\Push\QueueStorage;
use Baikal\Core\Plugins\Push\RegisterParser;
use Baikal\Core\Plugins\Push\SchemaManager;
use Baikal\Core\Plugins\Push\SecretCipher;
use Baikal\Core\Plugins\Push\SubscriptionStorage;
use Baikal\Core\Plugins\Push\SubscriptionValidator;
use Baikal\Core\Plugins\PushPlugin;

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

/**
 * Subclass to expose protected resolve helpers (no server needed).
 */
class PushPluginProbe extends PushPlugin {
    public function pubResolveDepth(?string $requested, ?string $capMax): ?string {
        return $this->resolveDepth($requested, $capMax);
    }

    public function pubResolveExpiry(?int $requested): int {
        return $this->resolveExpiry($requested);
    }
}

class SubscriptionValidatorProbe extends SubscriptionValidator {
    /** @var array<int, string> */
    private $addresses = ['8.8.8.8'];

    /** @param array<int, string> $addresses */
    public function setAddresses(array $addresses): void {
        $this->addresses = $addresses;
    }

    protected function resolveHost(string $host): array {
        return $this->addresses;
    }
}

function b64url(string $value): string {
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
SchemaManager::ensure($pdo);

$plugin = new PushPluginProbe($pdo, [
    'system'   => ['push_log_level' => 'off'],
    'database' => ['encryption_key' => 'test-encryption-key-at-least-16-bytes'],
]);

// --- topic: deterministic, stable, url-safe, 22 chars ---
$t1 = $plugin->topic('calendars/alice/default');
$t2 = $plugin->topic('/calendars/alice/default/');
assert_true($t1 === $t2, 'topic is stable regardless of surrounding slashes');
assert_true(strlen($t1) === 22, 'topic is 22 chars');
assert_true((bool) preg_match('#^[A-Za-z0-9_-]+$#', $t1), 'topic is base64url-safe');
assert_true($plugin->topic('calendars/bob/default') !== $t1, 'different paths yield different topics');

// --- resolveDepth: downgrade + ignore ---
assert_true($plugin->pubResolveDepth('infinity', '1') === '1', 'requested infinity downgraded to cap 1');
assert_true($plugin->pubResolveDepth('1', '1') === '1', 'requested 1 kept at cap 1');
assert_true($plugin->pubResolveDepth('0', '1') === '0', 'requested 0 kept');
assert_true($plugin->pubResolveDepth('1', null) === null, 'unsupported trigger ignored (cap null)');
assert_true($plugin->pubResolveDepth(null, '1') === null, 'absent trigger stays absent');

// --- resolveExpiry: default, floor, cap ---
$now = time();
assert_true(abs($plugin->pubResolveExpiry(null) - ($now + 7 * 86400)) <= 2, 'default expiry ~7 days');
assert_true($plugin->pubResolveExpiry($now + 60) >= $now + 3600, 'too-soon expiry floored to 1h');
assert_true($plugin->pubResolveExpiry($now + 999 * 86400) <= $now + 30 * 86400 + 2, 'far expiry capped to 30 days');

// --- RegisterParser: full valid document ---
$body = <<<'XML'
<?xml version="1.0" encoding="utf-8" ?>
<push-register xmlns="https://bitfire.at/webdav-push" xmlns:D="DAV:">
  <subscription>
    <web-push-subscription>
      <push-resource>https://up.example.net/yohd4yai5Phiz1wi</push-resource>
      <content-encoding>aes128gcm</content-encoding>
      <subscription-public-key type="p256dh">BCVxsr7N</subscription-public-key>
      <auth-secret>BTBZMqHH</auth-secret>
    </web-push-subscription>
  </subscription>
  <trigger>
    <content-update><D:depth>infinity</D:depth></content-update>
    <property-update><D:depth>0</D:depth></property-update>
  </trigger>
  <expires>Wed, 20 Dec 2023 10:03:31 GMT</expires>
</push-register>
XML;
$parsed = RegisterParser::parse($body);
assert_true($parsed !== null, 'valid push-register parses');
assert_true($parsed['pushResource'] === 'https://up.example.net/yohd4yai5Phiz1wi', 'push-resource extracted');
assert_true($parsed['pubkey'] === 'BCVxsr7N', 'subscription public key extracted');
assert_true($parsed['authSecret'] === 'BTBZMqHH', 'auth-secret extracted');
assert_true($parsed['contentEncoding'] === 'aes128gcm', 'content-encoding extracted');
assert_true($parsed['requestedContentDepth'] === 'infinity', 'content depth extracted');
assert_true($parsed['requestedPropertyDepth'] === '0', 'property depth extracted');
assert_true($parsed['expires'] === strtotime('Wed, 20 Dec 2023 10:03:31 GMT'), 'expires parsed to unix ts');

// --- RegisterParser: non push-register / garbage ---
assert_true(RegisterParser::parse('<propfind xmlns="DAV:"><prop/></propfind>') === null, 'non push-register returns null');
assert_true(RegisterParser::parse('not xml at all') === null, 'garbage body returns null');
assert_true(RegisterParser::parse('') === null, 'empty body returns null');
assert_true(
    RegisterParser::parse('<!DOCTYPE x [<!ENTITY bomb "boom">]><push-register xmlns="https://bitfire.at/webdav-push"/>') === null,
    'DOCTYPE/entity documents are rejected'
);
assert_true(
    RegisterParser::parse('<push-register>' . str_repeat('x', RegisterParser::MAX_BODY_BYTES) . '</push-register>') === null,
    'oversized registration body is rejected'
);

// --- RegisterParser: content-update trigger only ---
$bodyContentOnly = '<push-register xmlns="https://bitfire.at/webdav-push" xmlns:D="DAV:">'
    . '<subscription><web-push-subscription>'
    . '<push-resource>https://x/y</push-resource>'
    . '<subscription-public-key type="p256dh">K</subscription-public-key>'
    . '<auth-secret>A</auth-secret>'
    . '</web-push-subscription></subscription>'
    . '<trigger><content-update><D:depth>1</D:depth></content-update></trigger>'
    . '</push-register>';
$parsedC = RegisterParser::parse($bodyContentOnly);
assert_true($parsedC['requestedContentDepth'] === '1', 'content-only: content depth present');
assert_true($parsedC['requestedPropertyDepth'] === null, 'content-only: property trigger absent');
assert_true($parsedC['expires'] === null, 'content-only: no expires -> null');

// --- RegisterParser: DAVx5-style body (subscription + expires, no <trigger>) ---
$bodyDavx5 = <<<'XML'
<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>
<n0:push-register xmlns:n0="https://bitfire.at/webdav-push">
  <n0:subscription>
    <n0:web-push-subscription>
      <n0:push-resource>https://fcm.googleapis.com/fcm/send/example</n0:push-resource>
      <n0:subscription-public-key type="p256dh">BOT0Sv8qwKb9MQVcsViJ6bYLeB0F6t7Ff8VH4fuzFDlQBnYWobnZgplM5I1wMhD2yAnxRFg9ywKTIx3CN52bFfo</n0:subscription-public-key>
      <n0:auth-secret>np1NwXpVNqle-eBgEXuYcg</n0:auth-secret>
    </n0:web-push-subscription>
  </n0:subscription>
  <n0:expires>Mon, 27 Jul 2026 23:33:16 GMT</n0:expires>
</n0:push-register>
XML;
$parsedDavx5 = RegisterParser::parse($bodyDavx5);
assert_true($parsedDavx5 !== null, 'DAVx5-style push-register parses');
assert_true($parsedDavx5['pushResource'] !== null, 'DAVx5-style: push-resource present');
assert_true($parsedDavx5['requestedContentDepth'] === null, 'DAVx5-style: content trigger omitted');
assert_true($parsedDavx5['requestedPropertyDepth'] === null, 'DAVx5-style: property trigger omitted');
// Server must default omitted triggers to collection capability (PushPlugin::handleRegister).

// --- SubscriptionValidator: SSRF and strict Web Push fields ---
$validPublicKey = b64url("\x04" . str_repeat("\x01", 64));
$validAuthSecret = b64url(str_repeat("\x02", 16));
$validator = new SubscriptionValidatorProbe();
assert_true(
    $validator->validateSubscription(
        'https://push.example.test/subscription/1',
        'aes128gcm',
        $validPublicKey,
        $validAuthSecret
    ) === null,
    'public HTTPS endpoint and valid key material accepted'
);
assert_true($validator->validateEndpoint('http://push.example.test/x') !== null, 'HTTP endpoint rejected');
assert_true($validator->validateEndpoint('https://user:pass@push.example.test/x') !== null, 'endpoint credentials rejected');
assert_true($validator->validateEndpoint('https://push.example.test:8443/x') !== null, 'non-443 endpoint rejected');
assert_true($validator->validateEndpoint('https://push.example.test./x') !== null, 'trailing-dot endpoint rejected');
$validator->setAddresses(['127.0.0.1']);
assert_true($validator->validateEndpoint('https://push.example.test/x') !== null, 'loopback endpoint rejected');
$validator->setAddresses(['10.0.0.4']);
assert_true($validator->validateEndpoint('https://push.example.test/x') !== null, 'private-network endpoint rejected');
$validator->setAddresses(['169.254.169.254']);
assert_true($validator->validateEndpoint('https://push.example.test/x') !== null, 'link-local metadata endpoint rejected');
$validator->setAddresses(['::1']);
assert_true($validator->validateEndpoint('https://push.example.test/x') !== null, 'IPv6 loopback endpoint rejected');
$validator->setAddresses(['8.8.8.8']);
assert_true(
    $validator->validateSubscription('https://push.example.test/x', 'aesgcm', $validPublicKey, $validAuthSecret) !== null,
    'legacy content encoding rejected'
);
assert_true(
    $validator->validateSubscription('https://push.example.test/x', 'aes128gcm', 'short', $validAuthSecret) !== null,
    'malformed P-256 key rejected'
);
assert_true(
    $validator->validateSubscription('https://push.example.test/x', 'aes128gcm', $validPublicKey, 'short') !== null,
    'malformed authentication secret rejected'
);
$allowlistValidator = new SubscriptionValidatorProbe(['allowed.example.test']);
assert_true(
    $allowlistValidator->validateEndpoint('https://other.example.test/x') !== null,
    'endpoint outside configured host allowlist rejected'
);

// --- SubscriptionStorage: upsert (insert then update), lookup, delete ---
$cipher = new SecretCipher('test-encryption-key-at-least-16-bytes');
$storage = new SubscriptionStorage($pdo, $cipher);
$base = [
    'principaluri'     => 'principals/alice',
    'resource_uri'     => 'calendars/alice/default',
    'topic'            => $t1,
    'push_resource'    => 'https://up.example.net/endpoint-1',
    'content_encoding' => 'aes128gcm',
    'pubkey'           => 'PUB',
    'auth_secret'      => 'SECRET',
    'triggers'         => json_encode(['content' => '1', 'property' => '0']),
    'expires'          => $now + 3600,
];
$registration = $storage->upsert($base);
$id = $registration['id'];
assert_true($id > 0, 'upsert inserts and returns id');
assert_true(strlen($registration['token']) === 43, 'registration URL token has 256 bits');

$again = $storage->upsert(array_merge($base, ['pubkey' => 'PUB2']));
assert_true($again['id'] === $id, 'upsert with same (resource, endpoint) updates same row');
$row = $storage->findById($id);
assert_true($row['pubkey'] === 'PUB2', 'upsert updated the public key');
$rawRow = $pdo->query('SELECT push_resource, pubkey, auth_secret FROM push_subscriptions WHERE id = ' . $id)
    ->fetch(PDO::FETCH_ASSOC);
assert_true(!str_contains($rawRow['push_resource'], 'up.example.net'), 'push endpoint is encrypted at rest');
assert_true(!str_contains($rawRow['pubkey'], 'PUB2'), 'public key is encrypted at rest');
assert_true(!str_contains($rawRow['auth_secret'], 'SECRET'), 'auth secret is encrypted at rest');
$sealed = $cipher->encrypt('sensitive-value');
assert_true($cipher->decrypt($sealed) === 'sensitive-value', 'secret cipher round-trip succeeds');
$tampered = $sealed;
$tamperOffset = strlen(SecretCipher::PREFIX) + 20;
$tampered[$tamperOffset] = $tampered[$tamperOffset] === 'A' ? 'B' : 'A';
$tamperRejected = false;
try {
    $cipher->decrypt($tampered);
} catch (RuntimeException $e) {
    $tamperRejected = true;
}
assert_true($tamperRejected, 'tampered ciphertext is rejected');

$active = $storage->findActiveByResource('calendars/alice/default');
assert_true(count($active) === 1, 'one active subscription for resource');
assert_true(
    $storage->quotaError(
        'principals/alice',
        'calendars/alice/default',
        $base['push_resource'],
        1,
        1,
        1
    ) === null,
    'refresh of existing endpoint bypasses new-registration quota'
);
assert_true(
    $storage->quotaError(
        'principals/alice',
        'calendars/alice/default',
        'https://up.example.net/new-endpoint',
        1,
        10,
        10
    ) !== null,
    'per-principal subscription quota enforced'
);
assert_true(
    $storage->quotaError(
        'principals/bob',
        'calendars/alice/default',
        'https://up.example.net/bob-endpoint',
        10,
        1,
        10
    ) !== null,
    'per-resource subscription quota enforced'
);
assert_true(
    $storage->quotaError(
        'principals/alice',
        'calendars/alice/other',
        'https://up.example.net/rate-endpoint',
        10,
        10,
        1
    ) !== null,
    'hourly registration rate limit enforced'
);

// Queue merges trigger types and intersects suppression sets.
$queue = new QueueStorage($pdo);
$queue->enqueue('calendars/alice/default', $t1, true, false, 'sync-1', [1, 2]);
$queue->enqueue('calendars/alice/default', $t1, false, true, 'sync-2', [2, 3]);
$jobs = $queue->nextBatch(10);
assert_true(count($jobs) === 1, 'resource updates deduplicated into one queue job');
assert_true((int) $jobs[0]['content_update'] === 1, 'merged queue job keeps content update');
assert_true((int) $jobs[0]['property_update'] === 1, 'merged queue job keeps property update');
assert_true($jobs[0]['sync_token'] === 'sync-2', 'merged queue job keeps latest sync token');
assert_true(json_decode($jobs[0]['suppressed_ids'], true) === [2], 'merged suppression is intersection only');
$queue->complete((int) $jobs[0]['id']);

// Expired subscriptions are excluded and purgeable.
$storage->upsert(array_merge($base, [
    'push_resource' => 'https://up.example.net/endpoint-expired',
    'expires'       => $now - 10,
]));
$storage->upsert(array_merge($base, [
    'principaluri'  => 'principals/expired-user',
    'resource_uri'  => 'calendars/expired-user/default',
    'push_resource' => 'https://up.example.net/expired-only-endpoint',
    'expires'       => $now - 10,
]));
assert_true(count($storage->findActiveByResource('calendars/alice/default')) === 1, 'expired excluded from active');
assert_true(
    $storage->quotaError(
        'principals/expired-user',
        'calendars/expired-user/default',
        'https://up.example.net/fresh-endpoint',
        1,
        1,
        10
    ) === null,
    'expired subscriptions do not consume active quotas'
);
assert_true($storage->purgeExpired() === 2, 'purgeExpired removes expired rows');

// Owner-scoped delete.
assert_true($storage->delete($id, 'principals/mallory') === false, 'delete denied for non-owner');
assert_true($storage->delete($id, 'principals/alice') === true, 'delete allowed for owner');
assert_true($storage->findById($id) === null, 'row gone after delete');

// --- PushLogger: level gating + file output ---
$logFile = sys_get_temp_dir() . '/baikal-push-test-' . bin2hex(random_bytes(4)) . '.log';
$offLogger = new PushLogger('off', $logFile);
$offLogger->error('should not be written');
assert_true(!file_exists($logFile), 'off level writes nothing');

$dbgLogger = new PushLogger('debug', $logFile);
$dbgLogger->info(
    'failure at https://push.example.test/secret/path?token=abc',
    ['nested' => ['auth_token' => 'topsecret'], 'endpoint' => 'https://x/y']
);
$contents = file_exists($logFile) ? (string) file_get_contents($logFile) : '';
assert_true(str_contains($contents, 'failure at'), 'debug logger writes the message');
assert_true(str_contains($contents, '[redacted]') && !str_contains($contents, 'topsecret'), 'secrets are redacted in logs');
assert_true(!str_contains($contents, '/secret/path') && !str_contains($contents, 'token=abc'), 'URL paths and queries are stripped from logs');
@unlink($logFile);

// --- Notifier: never fatals when library is absent ---
assert_true(is_bool(Notifier::isAvailable()), 'Notifier::isAvailable returns bool');
$notifier = new Notifier(['publicKey' => 'x', 'privateKey' => 'y'], 'mailto:a@b', new PushLogger('off'));
assert_true(
    $notifier->send([], 'payload', 'topic') === ['invalid' => [], 'retry' => false],
    'send with no subscriptions returns a successful empty result'
);

echo "\n" . ($failures === 0 ? "All push tests passed." : "$failures push test(s) FAILED.") . "\n";
exit($failures === 0 ? 0 : 1);
