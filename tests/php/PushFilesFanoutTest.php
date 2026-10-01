<?php

/**
 * WebDAV-Push for file homes: path helpers, change-level fan-out, and the
 * queue dispatcher (subscribed paths only, debounce, suppression, log redaction).
 *
 * Run: php tests/php/PushFilesFanoutTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Core\Plugins\Push\FilesChangeSet;
use Baikal\Core\Plugins\Push\FilesPushDispatcher;
use Baikal\Core\Plugins\Push\FilesPushFanout;
use Baikal\Core\Plugins\Push\FilesPushPaths;
use Baikal\Core\Plugins\Push\PushLogger;
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

/**
 * @param array<string, int> $levels
 *
 * @return array<string, int>
 */
function sorted(array $levels): array {
    ksort($levels);

    return $levels;
}

/**
 * @param array<int, array{0: string, 1: string}> $events list of ['member'|'removed', path]
 */
function change_set(array $events): FilesChangeSet {
    $changes = new FilesChangeSet();
    foreach ($events as [$kind, $path]) {
        $changes->$kind($path);
    }

    return $changes;
}

// --- FilesPushPaths ---
assert_true(FilesPushPaths::isFilesPath('files') && FilesPushPaths::isFilesPath('/files/alice/'), 'files root and homes are file paths');
assert_true(!FilesPushPaths::isFilesPath('filesystem/alice') && !FilesPushPaths::isFilesPath('calendars/alice'), 'other namespaces are not file paths');
assert_true(FilesPushPaths::homeRoot('files/alice/a/b') === 'files/alice', 'home root of a nested path');
assert_true(FilesPushPaths::homeRoot('/files/alice/') === 'files/alice', 'home root of the home itself');
assert_true(
    FilesPushPaths::homeRoot('files') === null && FilesPushPaths::homeRoot('files/') === null
        && FilesPushPaths::homeRoot('calendars/alice/x') === null,
    'no home root outside a file home'
);
assert_true(FilesPushPaths::parent('files/alice/a') === 'files/alice' && FilesPushPaths::parent('files') === null, 'parent path');
assert_true(
    FilesPushPaths::ancestorsUpToHome('files/alice/a/b/c') === ['files/alice/a/b', 'files/alice/a', 'files/alice'],
    'ancestors run nearest first up to the home root'
);
assert_true(FilesPushPaths::ancestorsUpToHome('files/alice') === [], 'the home root has no ancestors inside the home');
assert_true(FilesPushPaths::ancestorsUpToHome('files') === [] && FilesPushPaths::ancestorsUpToHome('calendars/a/b') === [], 'no ancestors outside homes');
$deep = 'files/alice/' . implode('/', array_map(static fn (int $i): string => 'd' . $i, range(1, 64)));
$deepAncestors = FilesPushPaths::ancestorsUpToHome($deep);
assert_true(count($deepAncestors) === 64 && end($deepAncestors) === 'files/alice', '64-level path yields 64 ancestors ending at the home');
assert_true(FilesPushPaths::parent('files/alice/100%25/x') === 'files/alice/100%25', 'percent signs in names are not decoded');

// --- FilesChangeSet ---
$outside = change_set([['member', 'files'], ['member', 'calendars/alice/default'], ['removed', 'files']]);
assert_true($outside->isEmpty(), 'changes outside file homes are ignored');
$dupes = change_set([['member', 'files/alice/a'], ['member', '/files/alice/a/'], ['removed', 'files/alice/a/x']]);
assert_true($dupes->members() === ['files/alice/a'] && $dupes->removedPaths() === ['files/alice/a/x'], 'change set normalizes and dedupes');

// --- FilesPushFanout::levels: plan section 6 examples ---
assert_true(
    sorted(FilesPushFanout::levels(change_set([['member', 'files/alice/Photos/2026']])))
        === ['files/alice' => 2, 'files/alice/Photos' => 2, 'files/alice/Photos/2026' => 1],
    'new file in Photos/2026: collection level 1, ancestors level 2'
);
assert_true(
    sorted(FilesPushFanout::levels(change_set([['member', 'files/alice/Photos']])))
        === ['files/alice' => 2, 'files/alice/Photos' => 1],
    'new file in Photos'
);
assert_true(
    sorted(FilesPushFanout::levels(change_set([['member', 'files/alice/Photos'], ['removed', 'files/alice/Photos/2026']])))
        === ['files/alice' => 2, 'files/alice/Photos' => 1, 'files/alice/Photos/2026' => 0],
    'deleted directory gets a level-0 removal notice'
);
assert_true(
    sorted(FilesPushFanout::levels(change_set([
        ['member', 'files/alice/Photos'],
        ['removed', 'files/alice/Photos/2026'],
        ['member', 'files/alice/Archive'],
    ])))
        === ['files/alice' => 2, 'files/alice/Archive' => 1, 'files/alice/Photos' => 1, 'files/alice/Photos/2026' => 0],
    'move notifies both parents, the home, and the removed source'
);
assert_true(
    FilesPushFanout::levels(change_set([['member', 'files/alice/a/b'], ['member', 'files/alice/a']]))['files/alice/a'] === 1
        && FilesPushFanout::levels(change_set([['member', 'files/alice/a'], ['member', 'files/alice/a/b']]))['files/alice/a'] === 1,
    'levels merge with MIN regardless of event order'
);
assert_true(
    FilesPushFanout::levels(change_set([['member', 'files/alice/a'], ['removed', 'files/alice/a']]))['files/alice/a'] === 0,
    'removal beats member change on the same path'
);
assert_true(
    FilesPushFanout::levels(change_set([['member', 'files/alice']])) === ['files/alice' => 1],
    'change directly in the home notifies only the home'
);

// --- FilesPushDispatcher ---
$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
SchemaManager::ensure($pdo);
$cipher = new SecretCipher('test-encryption-key-at-least-16-bytes');
$topics = new TopicResolver($cipher);
$queue = new QueueStorage($pdo);
$subscriptions = new SubscriptionStorage($pdo, $cipher);
$logFile = sys_get_temp_dir() . '/angara-push-files-' . bin2hex(random_bytes(4)) . '.log';
$dispatcher = new FilesPushDispatcher($queue, $subscriptions, $topics, new PushLogger('info', $logFile));
$noSuppression = static fn (string $path): array => [];

/**
 * @return array<string, array<string, mixed>>
 */
function queue_rows(PDO $pdo): array {
    $rows = [];
    foreach ($pdo->query('SELECT * FROM push_queue ORDER BY resource_uri')->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $rows[(string) $row['resource_uri']] = $row;
    }

    return $rows;
}

/**
 * @param array<string, array<string, mixed>> $rows
 *
 * @return array<string, int>
 */
function row_levels(array $rows): array {
    return array_map(static fn (array $row): int => (int) $row['min_content_depth'], $rows);
}

$photoChange = change_set([['member', 'files/alice/Photos/2026']]);
assert_true($dispatcher->dispatch($photoChange, $noSuppression, 'test') === 0, 'no subscriptions: nothing is enqueued');
assert_true(queue_rows($pdo) === [], 'no subscriptions: queue stays empty');

$subscribe = static function (string $principal, string $resourceUri, string $depth, string $endpoint) use ($subscriptions, $topics): int {
    return $subscriptions->upsert([
        'principaluri'     => $principal,
        'resource_uri'     => $resourceUri,
        'topic'            => $topics->forPath($resourceUri),
        'push_resource'    => 'https://push.example.test/' . $endpoint,
        'content_encoding' => 'aes128gcm',
        'pubkey'           => 'PUB',
        'auth_secret'      => 'SECRET',
        'triggers'         => json_encode(['content' => $depth, 'property' => '0']),
        'expires'          => time() + 3600,
    ])['id'];
};
$s1 = $subscribe('principals/alice', 'files/alice', 'infinity', 's1');
$subscribe('principals/alice', 'files/alice/Photos', '1', 's2');
$subscribe('principals/alice', 'files/alice/Photos/2026', 'infinity', 's3');
$subscribe('principals/bob', 'files/bob', 'infinity', 's4');

$before = time();
assert_true($dispatcher->dispatch($photoChange, $noSuppression, 'test') === 3, 'subscribed collection and ancestors are enqueued');
$rows = queue_rows($pdo);
assert_true(
    row_levels($rows) === ['files/alice' => 2, 'files/alice/Photos' => 2, 'files/alice/Photos/2026' => 1],
    'jobs carry the fan-out level'
);
assert_true($rows['files/alice']['topic'] === $topics->forPath('files/alice'), 'jobs use the keyed file topic');
assert_true(
    (int) $rows['files/alice']['available_at'] >= $before + FilesPushDispatcher::DEBOUNCE_SECONDS,
    'file jobs are debounced'
);
assert_true(
    (int) $rows['files/alice/Photos/2026']['content_update'] === 1 && $rows['files/alice/Photos/2026']['sync_token'] === null,
    'file jobs are content updates without a sync token'
);
$pdo->exec('DELETE FROM push_queue');

$removal = change_set([['member', 'files/alice'], ['removed', 'files/alice/Photos']]);
assert_true($dispatcher->dispatch($removal, $noSuppression, 'test') === 3, 'removal reaches subscribed descendants');
assert_true(
    row_levels(queue_rows($pdo)) === ['files/alice' => 1, 'files/alice/Photos' => 0, 'files/alice/Photos/2026' => 0],
    'removed directory and its subscribed descendants get level 0'
);
$pdo->exec('DELETE FROM push_queue');

$askedFor = [];
$suppressS1 = static function (string $path) use (&$askedFor, $s1): array {
    $askedFor[] = $path;

    return $path === 'files/alice' ? [$s1] : [];
};
$dispatcher->dispatch(change_set([['member', 'files/alice/Photos']]), $suppressS1, 'test');
sort($askedFor);
assert_true($askedFor === ['files/alice', 'files/alice/Photos'], 'suppression is resolved per enqueued path');
$rows = queue_rows($pdo);
assert_true(
    json_decode((string) $rows['files/alice']['suppressed_ids'], true) === [$s1]
        && json_decode((string) $rows['files/alice/Photos']['suppressed_ids'], true) === [],
    'suppressed ids apply only to their own path'
);
$pdo->exec('DELETE FROM push_queue');

$calls = 0;
$counting = static function (string $path) use (&$calls): array {
    ++$calls;

    return [];
};
assert_true($dispatcher->dispatch(new FilesChangeSet(), $counting, 'test') === 0 && $calls === 0, 'empty change set does no work');

assert_true($dispatcher->dispatchProperty('/files/alice/Photos/', $noSuppression, 'test') === 1, 'property change on a subscribed directory is enqueued');
$rows = queue_rows($pdo);
assert_true(
    (int) $rows['files/alice/Photos']['property_update'] === 1 && (int) $rows['files/alice/Photos']['content_update'] === 0,
    'property job is property-only'
);
assert_true($dispatcher->dispatchProperty('files/alice/Photos/b.jpg', $noSuppression, 'test') === 0, 'property change on an unsubscribed path is dropped');
$pdo->exec('DELETE FROM push_queue');

// --- Log redaction (plan D9) ---
$log = is_file($logFile) ? (string) file_get_contents($logFile) : '';
assert_true(str_contains($log, 'files-topic:'), 'info log identifies file jobs by topic');
assert_true(!str_contains($log, 'Photos') && !str_contains($log, 'files/alice'), 'info log never contains file paths');
@unlink($logFile);
assert_true(
    $dispatcher->resourceForLog('files/alice/Taxes') === 'files-topic:' . $topics->forPath('files/alice/Taxes'),
    'file path is logged as its topic below debug'
);
assert_true($dispatcher->resourceForLog('calendars/alice/default') === 'calendars/alice/default', 'calendar paths are logged as is');
$debugDispatcher = new FilesPushDispatcher($queue, $subscriptions, $topics, new PushLogger('debug', $logFile));
assert_true($debugDispatcher->resourceForLog('files/alice/Taxes') === 'files/alice/Taxes', 'debug logging shows file paths');

echo "\n" . ($failures === 0 ? 'All files push fan-out tests passed.' : "$failures files push fan-out test(s) FAILED.") . "\n";
exit($failures === 0 ? 0 : 1);
