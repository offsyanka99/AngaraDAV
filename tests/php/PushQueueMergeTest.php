<?php

/**
 * WebDAV-Push queue: depth-level merge, revision guard (lost-update fix),
 * debounce / max-hold window, and push_queue column migration.
 *
 * Run: php tests/php/PushQueueMergeTest.php
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

class ScriptedNotifier extends Notifier {
    public ?Closure $onSend = null;

    public int $sent = 0;

    /** @var array{invalid: array<int, int>, retry: bool} */
    public array $result = ['invalid' => [], 'retry' => false];

    public function __construct() {
        parent::__construct(['publicKey' => 'x', 'privateKey' => 'y'], 'mailto:test@example.test', new PushLogger('off'));
    }

    public function send(array $subscriptions, string $payload, string $topicHeader, string $urgency = 'normal'): array {
        ++$this->sent;
        if ($this->onSend !== null) {
            ($this->onSend)();
        }

        return $this->result;
    }
}

function memory_pdo(): PDO {
    $pdo = new PDO('sqlite::memory:');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    return $pdo;
}

/**
 * @return array<string, mixed>
 */
function job_row(PDO $pdo, string $resourceUri): array {
    $stmt = $pdo->prepare('SELECT * FROM push_queue WHERE resource_uri = ?');
    $stmt->execute([$resourceUri]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row === false ? [] : $row;
}

/**
 * @return array<int, string>
 */
function queue_columns(PDO $pdo): array {
    return array_map(
        static fn (array $c): string => (string) $c['name'],
        $pdo->query('PRAGMA table_info(push_queue)')->fetchAll(PDO::FETCH_ASSOC)
    );
}

// --- Schema: fresh install and migration of a pre-existing push_queue ---
$pdo = memory_pdo();
SchemaManager::ensure($pdo);
$columns = queue_columns($pdo);
assert_true(
    in_array('min_content_depth', $columns, true) && in_array('revision', $columns, true) && in_array('hold_since', $columns, true),
    'fresh push_queue has min_content_depth, revision, hold_since'
);

$legacy = memory_pdo();
$legacy->exec(
    "CREATE TABLE push_queue (
        id integer primary key asc NOT NULL,
        resource_uri text NOT NULL UNIQUE,
        topic text NOT NULL,
        content_update integer NOT NULL DEFAULT 0,
        property_update integer NOT NULL DEFAULT 0,
        sync_token text,
        suppressed_ids text NOT NULL DEFAULT '[]',
        attempts integer NOT NULL DEFAULT 0,
        available_at integer NOT NULL,
        created integer NOT NULL
    )"
);
$legacyCreated = time() - 100;
$legacy->exec(
    "INSERT INTO push_queue (resource_uri, topic, content_update, available_at, created)
     VALUES ('calendars/alice/default', 't', 1, $legacyCreated, $legacyCreated)"
);
SchemaManager::ensure($legacy);
SchemaManager::ensure($legacy);
$legacyColumns = queue_columns($legacy);
assert_true(
    count(array_intersect(['min_content_depth', 'revision', 'hold_since'], $legacyColumns)) === 3,
    'existing push_queue gains the new columns'
);
assert_true(count($legacyColumns) === count(array_unique($legacyColumns)), 'repeated ensure() adds no duplicate columns');
$legacyRow = job_row($legacy, 'calendars/alice/default');
assert_true(
    (int) $legacyRow['min_content_depth'] === 1 && (int) $legacyRow['revision'] === 0 && (int) $legacyRow['hold_since'] === 0,
    'existing job rows get defaults (depth 1, revision 0, hold_since 0)'
);
(new QueueStorage($legacy))->enqueue('calendars/alice/default', 't', true, false, null, [], 1, 5, 30);
$legacyRow = job_row($legacy, 'calendars/alice/default');
assert_true((int) $legacyRow['hold_since'] === $legacyCreated, 'pre-migration row anchors its hold window at created');
assert_true((int) $legacyRow['available_at'] <= time(), 'pre-migration row past its max hold is available at once');

// --- min_content_depth merge ---
$queue = new QueueStorage($pdo);
$queue->enqueue('files/alice/a', 't', true, false, null, [], 2);
assert_true((int) job_row($pdo, 'files/alice/a')['min_content_depth'] === 2, 'insert stores the content depth level');
$queue->enqueue('files/alice/a', 't', true, false, null, [], 1);
assert_true((int) job_row($pdo, 'files/alice/a')['min_content_depth'] === 1, 'content merge keeps the minimum level');
$queue->enqueue('files/alice/a', 't', true, false, null, [], 2);
assert_true((int) job_row($pdo, 'files/alice/a')['min_content_depth'] === 1, 'deeper content merge does not raise the level');
$queue->enqueue('files/alice/a', 't', false, true, null, [], 0);
assert_true((int) job_row($pdo, 'files/alice/a')['min_content_depth'] === 1, 'property-only merge leaves the level alone');
$queue->enqueue('files/alice/a', 't', true, false, null, [], 0);
$row = job_row($pdo, 'files/alice/a');
assert_true((int) $row['min_content_depth'] === 0, 'removal level 0 wins');
assert_true((int) $row['revision'] === 4, 'every merge bumps the revision');

$queue->enqueue('files/alice/b', 't', false, true, null, [], 0);
assert_true((int) job_row($pdo, 'files/alice/b')['min_content_depth'] === 1, 'property-only insert stores the default level');
$queue->enqueue('files/alice/b', 't', true, false, null, [], 2);
$row = job_row($pdo, 'files/alice/b');
assert_true(
    (int) $row['min_content_depth'] === 2 && (int) $row['content_update'] === 1 && (int) $row['property_update'] === 1,
    'first content merge into a property job takes the new level'
);

$queue->enqueue('files/alice/c', 't', true, false, null, [], 7);
assert_true((int) job_row($pdo, 'files/alice/c')['min_content_depth'] === 2, 'level above 2 is clamped');
$queue->enqueue('files/alice/d', 't', true, false, null, [], -3);
assert_true((int) job_row($pdo, 'files/alice/d')['min_content_depth'] === 0, 'negative level is clamped to 0');
$queue->enqueue('calendars/alice/default', 't', true, false, 'sync-1', []);
assert_true(
    (int) job_row($pdo, 'calendars/alice/default')['min_content_depth'] === 1,
    'CalDAV/CardDAV jobs default to level 1'
);
$pdo->exec('DELETE FROM push_queue');

// --- Debounce and max hold ---
$now = time();
$queue->enqueue('files/alice/Sync', 't', true, false, null, [], 1, 5, 30);
$row = job_row($pdo, 'files/alice/Sync');
assert_true(
    (int) $row['available_at'] >= $now + 5 && (int) $row['available_at'] <= time() + 5,
    'debounced insert becomes available after the debounce'
);
assert_true((int) $row['hold_since'] >= $now && (int) $row['hold_since'] <= time(), 'insert starts the hold window');
assert_true($queue->nextBatch(10) === [], 'debounced job is not fetched early');

$pdo->exec('UPDATE push_queue SET hold_since = ' . (time() - 28) . " WHERE resource_uri = 'files/alice/Sync'");
$queue->enqueue('files/alice/Sync', 't', true, false, null, [], 1, 5, 30);
$row = job_row($pdo, 'files/alice/Sync');
assert_true(
    (int) $row['available_at'] === (int) $row['hold_since'] + 30,
    'continuous changes are capped at hold_since + max hold'
);

$pdo->exec('UPDATE push_queue SET hold_since = ' . (time() - 10) . " WHERE resource_uri = 'files/alice/Sync'");
$before = time();
$queue->enqueue('files/alice/Sync', 't', true, false, null, [], 1, 5, 30);
$row = job_row($pdo, 'files/alice/Sync');
assert_true(
    (int) $row['available_at'] >= $before + 5 && (int) $row['available_at'] <= time() + 5,
    'inside the hold window the debounce slides with the latest change'
);

$queue->enqueue('files/alice/short', 't', true, false, null, [], 1, 5, 0);
$queue->enqueue('files/alice/short', 't', true, false, null, [], 1, 5, 0);
assert_true(
    (int) job_row($pdo, 'files/alice/short')['available_at'] >= $before + 5,
    'max hold shorter than the debounce is raised to the debounce'
);

$before = time();
$queue->enqueue('calendars/alice/default', 't', true, false, null, []);
$queue->enqueue('calendars/alice/default', 't', true, false, null, []);
$row = job_row($pdo, 'calendars/alice/default');
assert_true(
    (int) $row['available_at'] >= $before && (int) $row['available_at'] <= time(),
    'jobs without a debounce stay available immediately'
);
$pdo->exec('DELETE FROM push_queue');

// --- Revision guard on complete() / retry() ---
$queue->enqueue('calendars/alice/default', 't', true, false, null, []);
$fetched = $queue->nextBatch(10)[0];
$queue->enqueue('calendars/alice/default', 't', true, false, null, []);
assert_true(
    $queue->complete((int) $fetched['id'], (int) $fetched['revision']) === false,
    'complete() with a stale revision keeps the merged job'
);
assert_true(job_row($pdo, 'calendars/alice/default') !== [], 'merged job is still queued');
$current = job_row($pdo, 'calendars/alice/default');
assert_true($queue->complete((int) $current['id'], (int) $current['revision']) === true, 'complete() with the current revision deletes');
assert_true(job_row($pdo, 'calendars/alice/default') === [], 'completed job is gone');

$queue->enqueue('calendars/alice/default', 't', true, false, null, []);
$fetched = $queue->nextBatch(10)[0];
$queue->enqueue('calendars/alice/default', 't', true, false, null, []);
$mergedAvailableAt = (int) job_row($pdo, 'calendars/alice/default')['available_at'];
assert_true(
    $queue->retry((int) $fetched['id'], 1, (int) $fetched['revision']) === false,
    'retry() with a stale revision is a no-op'
);
$row = job_row($pdo, 'calendars/alice/default');
assert_true(
    (int) $row['attempts'] === 0 && (int) $row['available_at'] === $mergedAvailableAt,
    'merged job keeps its attempts and the availability the merge gave it'
);
assert_true($queue->retry((int) $row['id'], 1, (int) $row['revision']) === true, 'retry() with the current revision applies');
$row = job_row($pdo, 'calendars/alice/default');
assert_true((int) $row['attempts'] === 1 && (int) $row['available_at'] > time(), 'retry backs off');
$pdo->exec('DELETE FROM push_queue');

// --- markPicked ---
$queue->enqueue('files/alice/p', 't', true, false, null, [], 1, 5, 30);
$pdo->exec("UPDATE push_queue SET hold_since = 1 WHERE resource_uri = 'files/alice/p'");
$queue->markPicked([]);
assert_true((int) job_row($pdo, 'files/alice/p')['hold_since'] === 1, 'markPicked([]) changes nothing');
$before = time();
$queue->markPicked([(int) job_row($pdo, 'files/alice/p')['id']]);
assert_true((int) job_row($pdo, 'files/alice/p')['hold_since'] >= $before, 'markPicked restarts the hold window');
$pdo->exec('DELETE FROM push_queue');

// --- Worker: lost update and immediate re-send are prevented ---
$pdo->exec(
    'CREATE TABLE calendarinstances (
        id INTEGER PRIMARY KEY, calendarid INTEGER NOT NULL, principaluri TEXT NOT NULL, uri TEXT NOT NULL
    )'
);
$pdo->exec("INSERT INTO calendarinstances (id, calendarid, principaluri, uri) VALUES (1, 1, 'principals/alice', 'default')");
$subscriptions = new SubscriptionStorage($pdo, new SecretCipher('test-encryption-key-at-least-16-bytes'));
$subscriptions->upsert([
    'principaluri'     => 'principals/alice',
    'resource_uri'     => 'calendars/alice/default',
    'topic'            => 't',
    'push_resource'    => 'https://up.example.net/alice',
    'content_encoding' => 'aes128gcm',
    'pubkey'           => 'PUB',
    'auth_secret'      => 'SECRET',
    'triggers'         => json_encode(['content' => '1', 'property' => '0']),
    'expires'          => time() + 3600,
]);
$notifier = new ScriptedNotifier();
$worker = new PushWorker($pdo, $queue, $subscriptions, $notifier, new PushLogger('off'));

$queue->enqueue('calendars/alice/default', 't', true, false, null, []);
assert_true($worker->runOnce() === 1 && $notifier->sent === 1, 'worker delivers a queued job');
assert_true(job_row($pdo, 'calendars/alice/default') === [], 'delivered job without concurrent changes is completed');

$queue->enqueue('calendars/alice/default', 't', true, false, null, []);
$notifier->onSend = static function () use ($queue): void {
    $queue->enqueue('calendars/alice/default', 't', true, false, null, []);
};
$worker->runOnce();
$notifier->onSend = null;
$row = job_row($pdo, 'calendars/alice/default');
assert_true($row !== [] && (int) $row['content_update'] === 1, 'change merged during delivery is not lost');
assert_true($worker->runOnce() === 1 && $notifier->sent === 3, 'merged change is delivered on the next run');
assert_true(job_row($pdo, 'calendars/alice/default') === [], 'queue drains after the follow-up delivery');

// Continuous changes for 40 s: the job is due at once, and a change during delivery must wait for the debounce.
$queue->enqueue('calendars/alice/default', 't', true, false, null, [], 1, 5, 30);
$pdo->exec(
    'UPDATE push_queue SET available_at = ' . (time() - 1) . ', hold_since = ' . (time() - 40)
    . " WHERE resource_uri = 'calendars/alice/default'"
);
$notifier->onSend = static function () use ($queue): void {
    $queue->enqueue('calendars/alice/default', 't', true, false, null, [], 1, 5, 30);
};
$worker->runOnce();
$notifier->onSend = null;
$row = job_row($pdo, 'calendars/alice/default');
assert_true($row !== [] && (int) $row['available_at'] > time(), 'change during delivery is debounced from pickup, not re-sent at once');
assert_true($worker->runOnce() === 0, 'worker does not fetch the debounced follow-up early');
$pdo->exec('DELETE FROM push_queue');

$queue->enqueue('calendars/alice/default', 't', true, false, null, []);
$notifier->result = ['invalid' => [], 'retry' => true];
$notifier->onSend = static function () use ($queue): void {
    $queue->enqueue('calendars/alice/default', 't', true, false, null, []);
};
$worker->runOnce();
$row = job_row($pdo, 'calendars/alice/default');
assert_true(
    $row !== [] && (int) $row['attempts'] === 0 && (int) $row['available_at'] <= time(),
    'retry after a concurrent merge leaves the merged job due without a backoff'
);

echo "\n" . ($failures === 0 ? 'All push queue tests passed.' : "$failures push queue test(s) FAILED.") . "\n";
exit($failures === 0 ? 0 : 1);
