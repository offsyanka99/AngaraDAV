<?php

/**
 * WebDAV-Push worker authorization for CalDAV/CardDAV paths: a subscription stays
 * valid only while its principal could still register on that path (the Sabre ACL):
 * the path owner, or for calendars a member of the owner's calendar-proxy groups.
 *
 * Run: php tests/php/PushWorkerAuthorizationTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Core\Plugins\Push\Notifier;
use Baikal\Core\Plugins\Push\PushLogger;
use Baikal\Core\Plugins\Push\PushWorker;
use Baikal\Core\Plugins\Push\QueueStorage;
use Baikal\Core\Plugins\Push\SecretCipher;
use Baikal\Core\Plugins\Push\SubscriptionStorage;

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

class CountingNotifier extends Notifier {
    /** @var array<int, int> */
    public array $notified = [];

    public function __construct() {
        parent::__construct(['publicKey' => 'x', 'privateKey' => 'y'], 'mailto:test@example.test', new PushLogger('off'));
    }

    public function send(array $subscriptions, string $payload, string $topicHeader, string $urgency = 'normal'): array {
        foreach ($subscriptions as $sub) {
            $this->notified[] = (int) $sub['id'];
        }

        return ['invalid' => [], 'retry' => false];
    }
}

$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
foreach (explode(';', (string) file_get_contents($root . '/Core/Resources/Db/SQLite/db.sql')) as $statement) {
    if (trim($statement) !== '') {
        $pdo->exec($statement);
    }
}
$principal = $pdo->prepare('INSERT INTO principals (uri) VALUES (?)');
foreach (['alice', 'bob', 'carol', 'alice/calendar-proxy-read', 'alice/calendar-proxy-write'] as $name) {
    $principal->execute(['principals/' . $name]);
}
$principalId = static function (string $uri) use ($pdo): int {
    $stmt = $pdo->prepare('SELECT id FROM principals WHERE uri = ?');
    $stmt->execute([$uri]);

    return (int) $stmt->fetchColumn();
};
$pdo->exec("INSERT INTO calendars (id, components) VALUES (1, 'VEVENT'), (2, 'VEVENT'), (3, 'VEVENT')");
$pdo->exec(
    "INSERT INTO calendarinstances (calendarid, principaluri, uri, access) VALUES
     (1, 'principals/alice', 'default', 1),
     (2, 'principals/bob', 'default', 1),
     (1, 'principals/bob', 'alice-shared', 2),
     (3, 'principals/alice', '100%25 work', 1)"
);
$pdo->exec("INSERT INTO addressbooks (principaluri, uri) VALUES ('principals/alice', 'default'), ('principals/bob', 'default')");

$cipher = new SecretCipher('test-encryption-key-at-least-16-bytes');
$queue = new QueueStorage($pdo);
$subscriptions = new SubscriptionStorage($pdo, $cipher);
$notifier = new CountingNotifier();
$worker = new PushWorker($pdo, $queue, $subscriptions, $notifier, new PushLogger('off'));

function subscribe(string $principal, string $resourceUri): int {
    global $subscriptions;
    static $n = 0;
    ++$n;

    return $subscriptions->upsert([
        'principaluri'     => $principal,
        'resource_uri'     => $resourceUri,
        'topic'            => 't',
        'push_resource'    => 'https://push.example.test/' . $n,
        'content_encoding' => 'aes128gcm',
        'pubkey'           => 'PUB',
        'auth_secret'      => 'SECRET',
        'triggers'         => json_encode(['content' => '1', 'property' => '0']),
        'expires'          => time() + 3600,
    ])['id'];
}

/**
 * @return array<int, int> subscription ids notified for one content job
 */
function deliver(string $resourceUri): array {
    global $pdo, $queue, $worker, $notifier;
    $pdo->exec('DELETE FROM push_queue');
    $notifier->notified = [];
    $queue->enqueue($resourceUri, 't', true, false, null, []);
    $worker->runOnce();
    sort($notifier->notified);

    return $notifier->notified;
}

function kept(int $id): bool {
    global $subscriptions;

    return $subscriptions->findById($id) !== null;
}

// --- Calendars ---
$owner = subscribe('principals/alice', 'calendars/alice/default');
$sameNameElsewhere = subscribe('principals/bob', 'calendars/alice/default');
$proxy = subscribe('principals/carol', 'calendars/alice/default');
$pdo->prepare('INSERT INTO groupmembers (principal_id, member_id) VALUES (?, ?)')
    ->execute([$principalId('principals/alice/calendar-proxy-read'), $principalId('principals/carol')]);

$notified = deliver('calendars/alice/default');
assert_true(in_array($owner, $notified, true) && kept($owner), 'owner subscription is delivered');
assert_true(in_array($proxy, $notified, true) && kept($proxy), 'calendar-proxy member subscription is delivered');
assert_true(
    !in_array($sameNameElsewhere, $notified, true) && !kept($sameNameElsewhere),
    "owning a calendar with the same uri does not authorize another owner's path"
);

$pdo->exec('DELETE FROM groupmembers');
deliver('calendars/alice/default');
assert_true(!kept($proxy), 'removed proxy loses the subscription');

$writeProxy = subscribe('principals/carol', 'calendars/alice/default');
$pdo->prepare('INSERT INTO groupmembers (principal_id, member_id) VALUES (?, ?)')
    ->execute([$principalId('principals/alice/calendar-proxy-write'), $principalId('principals/carol')]);
assert_true(in_array($writeProxy, deliver('calendars/alice/default'), true), 'calendar-proxy-write member is delivered');

$sharee = subscribe('principals/bob', 'calendars/bob/alice-shared');
assert_true(deliver('calendars/bob/alice-shared') === [$sharee], 'sharee subscription on their own instance path is delivered');
$pdo->exec("DELETE FROM calendarinstances WHERE principaluri = 'principals/bob' AND uri = 'alice-shared'");
deliver('calendars/bob/alice-shared');
assert_true(!kept($sharee), 'unshared calendar loses the subscription');

$percent = subscribe('principals/alice', 'calendars/alice/100%25 work');
assert_true(
    deliver('calendars/alice/100%25 work') === [$percent] && kept($percent),
    'calendar uris containing % are matched without decoding'
);

$pdo->exec("DELETE FROM calendarinstances WHERE principaluri = 'principals/alice' AND uri = 'default'");
deliver('calendars/alice/default');
assert_true(!kept($owner) && !kept($writeProxy), 'deleted calendar loses all subscriptions');

$home = subscribe('principals/alice', 'calendars/alice');
$foreignHome = subscribe('principals/bob', 'calendars/alice');
assert_true(deliver('calendars/alice') === [$home], 'calendar home: owner only');
assert_true(!kept($foreignHome), 'calendar home subscription of another principal is deleted');

// --- Address books ---
$bookOwner = subscribe('principals/alice', 'addressbooks/alice/default');
$bookOther = subscribe('principals/bob', 'addressbooks/alice/default');
assert_true(deliver('addressbooks/alice/default') === [$bookOwner], 'address book: owner only');
assert_true(
    !kept($bookOther),
    "owning an address book with the same uri does not authorize another owner's path"
);
$pdo->exec("DELETE FROM addressbooks WHERE principaluri = 'principals/alice'");
deliver('addressbooks/alice/default');
assert_true(!kept($bookOwner), 'deleted address book loses the subscription');

// --- Principals ---
$self = subscribe('principals/alice', 'principals/alice');
$other = subscribe('principals/bob', 'principals/alice');
assert_true(deliver('principals/alice') === [$self] && !kept($other), 'principal property subscriptions: self only');

echo "\n" . ($failures === 0 ? 'All push worker authorization tests passed.' : "$failures push worker authorization test(s) FAILED.") . "\n";
exit($failures === 0 ? 0 : 1);
