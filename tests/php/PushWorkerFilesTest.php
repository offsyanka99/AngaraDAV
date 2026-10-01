<?php

/**
 * WebDAV-Push worker for file homes: depth rule against change levels,
 * per-subscriber payloads, files authorization, and debounce metrics.
 *
 * Run: php tests/php/PushWorkerFilesTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Core\Plugins\Push\Notifier;
use Baikal\Core\Plugins\Push\PushLogger;
use Baikal\Core\Plugins\Push\PushWorker;
use Baikal\Core\Plugins\Push\QueueStorage;
use Baikal\Core\Plugins\Push\SchemaManager;
use Baikal\Core\Plugins\Push\SecretCipher;
use Baikal\Core\Plugins\Push\SubscriptionStorage;
use Baikal\Core\Plugins\Push\TopicResolver;

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

class RecordingNotifier extends Notifier {
    /** @var array<int, array{ids: array<int, int>, payload: string, topic: string}> */
    public array $sends = [];

    public function __construct() {
        parent::__construct(['publicKey' => 'x', 'privateKey' => 'y'], 'mailto:test@example.test', new PushLogger('off'));
    }

    public function send(array $subscriptions, string $payload, string $topicHeader, string $urgency = 'normal'): array {
        $ids = array_map(static fn (array $sub): int => (int) $sub['id'], $subscriptions);
        sort($ids);
        $this->sends[] = ['ids' => $ids, 'payload' => $payload, 'topic' => $topicHeader];

        return ['invalid' => [], 'retry' => false];
    }
}

$cipher = new SecretCipher('test-encryption-key-at-least-16-bytes');
$topics = new TopicResolver($cipher);

function setup_pdo(bool $withFileHomes): PDO {
    $pdo = new PDO('sqlite::memory:');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    SchemaManager::ensure($pdo);
    if ($withFileHomes) {
        \Baikal\Core\Files\SchemaManager::ensure($pdo);
        $home = $pdo->prepare(
            'INSERT INTO file_homes (user_id, principaluri, storage_id, status, created_at) VALUES (?, ?, ?, ?, ?)'
        );
        $home->execute([1, 'principals/alice', 'home-alice', 'active', time()]);
        $home->execute([2, 'principals/a%20b', 'home-ab', 'active', time()]);
        $home->execute([null, 'principals/carol', 'home-carol', 'quarantined', time()]);
    }
    $pdo->exec(
        'CREATE TABLE calendarinstances (
            id INTEGER PRIMARY KEY, calendarid INTEGER NOT NULL, principaluri TEXT NOT NULL, uri TEXT NOT NULL
        )'
    );
    $pdo->exec("INSERT INTO calendarinstances (calendarid, principaluri, uri) VALUES (1, 'principals/alice', 'default')");

    return $pdo;
}

$pdo = setup_pdo(true);
$queue = new QueueStorage($pdo);
$subscriptions = new SubscriptionStorage($pdo, $cipher);
$notifier = new RecordingNotifier();
$logFile = sys_get_temp_dir() . '/angara-push-worker-files-' . bin2hex(random_bytes(4)) . '.log';
$worker = new PushWorker($pdo, $queue, $subscriptions, $notifier, new PushLogger('debug', $logFile));

function subscribe(
    SubscriptionStorage $subscriptions,
    string $principal,
    string $resourceUri,
    ?string $content,
    ?string $property,
    string $endpoint
): int {
    global $topics;

    return $subscriptions->upsert([
        'principaluri'     => $principal,
        'resource_uri'     => $resourceUri,
        'topic'            => $topics->forPath($resourceUri),
        'push_resource'    => 'https://push.example.test/' . $endpoint,
        'content_encoding' => 'aes128gcm',
        'pubkey'           => 'PUB',
        'auth_secret'      => 'SECRET',
        'triggers'         => json_encode(['content' => $content, 'property' => $property]),
        'expires'          => time() + 3600,
    ])['id'];
}

/**
 * Enqueue one job (content at $level and/or property), run the worker, return the sends.
 *
 * @return array<int, array{ids: array<int, int>, payload: string, topic: string}>
 */
function deliver(string $resourceUri, bool $content, bool $property, int $level = 1, ?string $syncToken = null): array {
    global $pdo, $queue, $worker, $notifier, $topics;
    $pdo->exec('DELETE FROM push_queue');
    $notifier->sends = [];
    $topic = $topics->forPath($resourceUri);
    if ($content) {
        $queue->enqueue($resourceUri, $topic, true, false, $syncToken, [], $level);
    }
    if ($property) {
        $queue->enqueue($resourceUri, $topic, false, true, null, []);
    }
    $worker->runOnce();

    return $notifier->sends;
}

/**
 * @param array<int, array{ids: array<int, int>, payload: string, topic: string}> $sends
 *
 * @return array<int, int>
 */
function notified(array $sends): array {
    $ids = [];
    foreach ($sends as $send) {
        $ids = array_merge($ids, $send['ids']);
    }
    sort($ids);

    return $ids;
}

function subscription_exists(int $id): bool {
    global $subscriptions;

    return $subscriptions->findById($id) !== null;
}

// --- Depth rule: notify iff rank(depth) >= level ---
$d0 = subscribe($subscriptions, 'principals/alice', 'files/alice/M', '0', null, 'm-d0');
$d1 = subscribe($subscriptions, 'principals/alice', 'files/alice/M', '1', null, 'm-d1');
$dInf = subscribe($subscriptions, 'principals/alice', 'files/alice/M', 'infinity', null, 'm-dinf');
$expected = [0 => [$d0, $d1, $dInf], 1 => [$d1, $dInf], 2 => [$dInf]];
foreach ($expected as $level => $ids) {
    sort($ids);
    assert_true(notified(deliver('files/alice/M', true, false, $level)) === $ids, "level $level reaches exactly the subscriptions with rank >= $level");
}
assert_true(
    (int) $pdo->query('SELECT COUNT(*) FROM push_queue')->fetchColumn() === 0,
    'delivered jobs are completed'
);

// --- Payload: files content updates carry the topic and no sync-token ---
$sends = deliver('files/alice/M', true, false, 1);
$topicM = $topics->forPath('files/alice/M');
assert_true(
    count($sends) === 1
        && str_contains($sends[0]['payload'], '<topic>' . $topicM . '</topic><content-update/>')
        && !str_contains($sends[0]['payload'], 'sync-token')
        && !str_contains($sends[0]['payload'], 'property-update'),
    'file content message is <topic/><content-update/> without a sync-token'
);
assert_true($sends[0]['topic'] === $topicM, 'Web Push Topic header is the keyed file topic');

// --- Payload per subscriber group ---
$propertyOnly = subscribe($subscriptions, 'principals/alice', 'files/alice/G', '1', '0', 'g-a');
$both = subscribe($subscriptions, 'principals/alice', 'files/alice/G', 'infinity', '0', 'g-b');
$contentOnly = subscribe($subscriptions, 'principals/alice', 'files/alice/G', 'infinity', null, 'g-c');
$byTarget = [];
foreach (deliver('files/alice/G', true, true, 2) as $send) {
    $byTarget[implode(',', $send['ids'])] = $send['payload'];
}
assert_true(count($byTarget) === 3, 'one message per (content, property) group');
assert_true(
    isset($byTarget[(string) $propertyOnly])
        && str_contains($byTarget[(string) $propertyOnly], '<property-update/>')
        && !str_contains($byTarget[(string) $propertyOnly], 'content-update'),
    'depth-1 subscriber gets only the property update for a deeper change'
);
assert_true(
    isset($byTarget[(string) $both])
        && str_contains($byTarget[(string) $both], '<content-update/>')
        && str_contains($byTarget[(string) $both], '<property-update/>'),
    'infinity subscriber with a property trigger gets both updates'
);
assert_true(
    isset($byTarget[(string) $contentOnly])
        && str_contains($byTarget[(string) $contentOnly], '<content-update/>')
        && !str_contains($byTarget[(string) $contentOnly], 'property-update'),
    'subscriber without a property trigger gets only the content update'
);

// --- Files authorization ---
$homeRoot = subscribe($subscriptions, 'principals/alice', 'files/alice', 'infinity', null, 'auth-home');
assert_true(notified(deliver('files/alice', true, false, 1)) === [$homeRoot], 'home root subscription is delivered');
$deep = subscribe($subscriptions, 'principals/alice', 'files/alice/a/b/c', 'infinity', null, 'auth-deep');
assert_true(
    notified(deliver('files/alice/a/b/c', true, false, 1)) === [$deep] && subscription_exists($deep),
    'deep folder subscription is delivered and kept'
);
$percent = subscribe($subscriptions, 'principals/a%20b', 'files/a%20b/100%25', 'infinity', null, 'auth-percent');
assert_true(
    notified(deliver('files/a%20b/100%25', true, false, 1)) === [$percent] && subscription_exists($percent),
    'names containing % are matched without decoding'
);
$foreign = subscribe($subscriptions, 'principals/bob', 'files/alice/M', 'infinity', null, 'auth-bob');
deliver('files/alice/M', true, false, 2);
assert_true(!subscription_exists($foreign), "subscription on another user's home is deleted");
$quarantined = subscribe($subscriptions, 'principals/carol', 'files/carol/Docs', 'infinity', null, 'auth-carol');
assert_true(deliver('files/carol/Docs', true, false, 1) === [] && !subscription_exists($quarantined), 'quarantined home: subscription deleted');
$missing = subscribe($subscriptions, 'principals/dave', 'files/dave', 'infinity', null, 'auth-dave');
assert_true(deliver('files/dave', true, false, 1) === [] && !subscription_exists($missing), 'missing home: subscription deleted');

// --- Calendars keep their behavior (level 1, sync-token) ---
$calendar = subscribe($subscriptions, 'principals/alice', 'calendars/alice/default', '1', '0', 'cal-1');
$calendarDepth0 = subscribe($subscriptions, 'principals/alice', 'calendars/alice/default', '0', null, 'cal-0');
$calendarSends = deliver('calendars/alice/default', true, false, 1, 'http://sabre.io/ns/sync/9');
assert_true(notified($calendarSends) === [$calendar], 'calendar content reaches depth-1 subscribers, not depth 0');
assert_true(
    str_contains($calendarSends[0]['payload'], '<D:sync-token>http://sabre.io/ns/sync/9</D:sync-token>'),
    'calendar content message keeps its sync-token'
);
assert_true(subscription_exists($calendarDepth0), 'depth-0 calendar subscription is kept');

// --- Debounce metrics (plan D7) at debug, without paths ---
$log = is_file($logFile) ? (string) file_get_contents($logFile) : '';
assert_true(str_contains($log, 'files push sent') && str_contains($log, '"merges"') && str_contains($log, '"delay"'), 'files deliveries log delay and merge count at debug');
assert_true(str_contains($log, $topicM), 'metrics identify the job by topic');
assert_true(!str_contains($log, 'files/alice') && !str_contains($log, 'files/a%20b'), 'worker logs contain no file paths');
assert_true(!str_contains($log, 'calendars/alice'), 'calendar deliveries add no files metrics');
@unlink($logFile);

// --- A failing home lookup retries the job instead of deleting the subscription ---
$broken = setup_pdo(false);
$brokenQueue = new QueueStorage($broken);
$brokenSubscriptions = new SubscriptionStorage($broken, $cipher);
$kept = subscribe($brokenSubscriptions, 'principals/alice', 'files/alice', 'infinity', null, 'broken');
$brokenQueue->enqueue('files/alice', $topics->forPath('files/alice'), true, false, null, []);
$brokenNotifier = new RecordingNotifier();
(new PushWorker($broken, $brokenQueue, $brokenSubscriptions, $brokenNotifier, new PushLogger('off')))->runOnce();
$job = $broken->query('SELECT attempts FROM push_queue')->fetch(PDO::FETCH_ASSOC);
assert_true($brokenSubscriptions->findById($kept) !== null, 'subscription survives a failing home lookup');
assert_true($job !== false && (int) $job['attempts'] === 1 && $brokenNotifier->sends === [], 'job is retried, nothing is sent');

echo "\n" . ($failures === 0 ? 'All files push worker tests passed.' : "$failures files push worker test(s) FAILED.") . "\n";
exit($failures === 0 ? 0 : 1);
