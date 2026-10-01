<?php

/**
 * Portal file writes feed WebDAV-Push: FileService records changes only after
 * successful mutations, bulk() dispatches once, and ChangeNotifier::filesChanged()
 * enqueues the same jobs as DAV writes when files push is enabled.
 *
 * Run: php tests/php/FileServicePushTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Core\Plugins\Push\ChangeNotifier;
use Baikal\Core\Plugins\Push\FilesChangeSet;
use Baikal\Core\Plugins\Push\SchemaManager;
use Baikal\Core\Plugins\Push\SecretCipher;
use Baikal\Core\Plugins\Push\SubscriptionStorage;
use Baikal\Core\Plugins\Push\TopicResolver;
use Baikal\Portal\ApiException;
use Baikal\Portal\FileService;
use Symfony\Component\Yaml\Yaml;

const ENCRYPTION_KEY = 'test-encryption-key-at-least-16-bytes';

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

function remove_tree(string $path): void {
    if (is_link($path) || is_file($path)) {
        @unlink($path);

        return;
    }
    if (!is_dir($path)) {
        return;
    }
    foreach (new FilesystemIterator($path, FilesystemIterator::SKIP_DOTS) as $entry) {
        remove_tree($entry->getPathname());
    }
    @rmdir($path);
}

$tmp = sys_get_temp_dir() . '/angara-portal-files-push-' . bin2hex(random_bytes(6));
mkdir($tmp . '/config', 0700, true);
define('PROJECT_PATH_CONFIG', $tmp . '/config/');

$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, digesta1 TEXT NOT NULL)');
$pdo->exec("INSERT INTO users (username, digesta1) VALUES ('alice', 'hash'), ('bob', 'hash')");
SchemaManager::ensure($pdo);

$filesConfig = [
    'system' => [
        'files_enabled'      => true,
        'files_storage_path' => $tmp . '/storage',
    ],
];

/** @var array<int, array{user: string, members: list<string>, removed: list<string>}> $calls */
$calls = [];
$spy = static function (string $username, FilesChangeSet $changes) use (&$calls): void {
    $members = $changes->members();
    $removed = $changes->removedPaths();
    sort($members);
    sort($removed);
    $calls[] = ['user' => $username, 'members' => $members, 'removed' => $removed];
};
$svc = new FileService($pdo, $filesConfig, $spy);

/**
 * @param list<string> $members
 * @param list<string> $removed
 */
function last_call_is(array $members, array $removed = []): bool {
    global $calls;
    sort($members);
    sort($removed);

    return count($calls) === 1 && $calls[0]['user'] === 'alice'
        && $calls[0]['members'] === $members && $calls[0]['removed'] === $removed;
}

function fails(callable $operation): bool {
    try {
        $operation();
    } catch (ApiException $e) {
        return true;
    }

    return false;
}

try {
    // --- Single operations (plan section 6 mapping) ---
    $calls = [];
    $svc->createDirectory('alice', '', 'docs');
    assert_true(last_call_is(['files/alice']), 'createDirectory in the home notifies the home');

    $calls = [];
    $svc->createDirectory('alice', 'docs', 'sub');
    assert_true(last_call_is(['files/alice/docs']), 'createDirectory notifies its parent');

    $calls = [];
    $svc->writeFile('alice', 'docs', 'a.txt', 'a', false);
    assert_true(last_call_is(['files/alice/docs']), 'upload notifies its parent');

    $calls = [];
    $svc->writeFile('alice', 'docs', 'a.txt', 'a2', true);
    assert_true(last_call_is(['files/alice/docs']), 'overwrite notifies its parent');

    $calls = [];
    assert_true(fails(static fn () => $svc->writeFile('alice', 'docs', 'a.txt', 'x', false)), 'conflicting upload fails');
    assert_true($calls === [], 'failed upload records nothing');

    $calls = [];
    $svc->rename('alice', 'docs/a.txt', 'b.txt');
    assert_true(last_call_is(['files/alice/docs'], ['files/alice/docs/a.txt']), 'rename notifies the parent and removes the old path');

    $calls = [];
    $svc->move('alice', 'docs/b.txt', 'docs/sub');
    assert_true(
        last_call_is(['files/alice/docs', 'files/alice/docs/sub'], ['files/alice/docs/b.txt']),
        'move notifies both parents and removes the source'
    );

    $calls = [];
    $svc->copy('alice', 'docs/sub/b.txt', '');
    assert_true(last_call_is(['files/alice']), 'copy notifies the destination parent');

    $calls = [];
    $svc->delete('alice', 'docs/sub');
    assert_true(last_call_is(['files/alice/docs'], ['files/alice/docs/sub']), 'delete notifies the parent and removes the path');

    $calls = [];
    assert_true(fails(static fn () => $svc->delete('alice', 'missing.txt')), 'deleting a missing path fails');
    assert_true(fails(static fn () => $svc->move('alice', 'missing.txt', 'docs')), 'moving a missing path fails');
    assert_true($calls === [], 'failed delete and move record nothing');

    // --- bulk(): one dispatch, successful items only ---
    $svc->writeFile('alice', '', 'c.txt', 'c', false);
    $calls = [];
    $result = $svc->bulk('alice', 'delete', ['b.txt', 'missing.txt', 'docs', 'c.txt']);
    assert_true($result['ok'] === 3 && $result['failed'] === 1, 'bulk delete reports partial failure');
    assert_true(
        last_call_is(['files/alice'], ['files/alice/b.txt', 'files/alice/c.txt', 'files/alice/docs']),
        'bulk delete dispatches once with only the deleted paths'
    );

    $calls = [];
    $svc->bulk('alice', 'delete', ['missing-1', 'missing-2']);
    assert_true($calls === [], 'bulk with no successful items dispatches nothing');

    $svc->writeFile('alice', '', 'd.txt', 'd', false);
    $svc->writeFile('alice', '', 'e.txt', 'e', false);
    $calls = [];
    $svc->bulk('alice', 'copy', ['d.txt', 'e.txt']);
    assert_true(last_call_is(['files/alice']), 'bulk copy dispatches once');

    $calls = [];
    assert_true(fails(static fn () => $svc->bulk('alice', 'chmod', ['d.txt'])), 'unsupported bulk op fails');
    $svc->createDirectory('alice', '', 'after-bulk');
    assert_true(last_call_is(['files/alice']), 'operations after bulk dispatch immediately again');

    // --- ChangeNotifier::filesChanged() ---
    $cipher = new SecretCipher(ENCRYPTION_KEY);
    $topics = new TopicResolver($cipher);
    $subscriptions = new SubscriptionStorage($pdo, $cipher);
    foreach (['files/alice/docs' => 'alice', 'files/bob' => 'bob'] as $resourceUri => $user) {
        $subscriptions->upsert([
            'principaluri'     => 'principals/' . $user,
            'resource_uri'     => $resourceUri,
            'topic'            => $topics->forPath($resourceUri),
            'push_resource'    => 'https://push.example.test/' . $user,
            'content_encoding' => 'aes128gcm',
            'pubkey'           => 'PUB',
            'auth_secret'      => 'SECRET',
            'triggers'         => json_encode(['content' => 'infinity', 'property' => '0']),
            'expires'          => time() + 3600,
        ]);
    }
    $writeConfig = static function (bool $pushEnabled, bool $filesPushEnabled, string $key = ENCRYPTION_KEY): void {
        file_put_contents(PROJECT_PATH_CONFIG . 'configuration.yaml', Yaml::dump([
            'system'   => [
                'push_enabled'       => $pushEnabled,
                'push_files_enabled' => $filesPushEnabled,
                'push_log_level'     => 'off',
            ],
            'database' => ['encryption_key' => $key],
        ]));
    };
    $queued = static function () use ($pdo): array {
        $levels = [];
        foreach ($pdo->query('SELECT resource_uri, min_content_depth FROM push_queue') as $row) {
            $levels[(string) $row['resource_uri']] = (int) $row['min_content_depth'];
        }

        return $levels;
    };
    $change = new FilesChangeSet();
    $change->member('files/alice/docs/sub');
    $change->member('files/bob');

    $writeConfig(false, true);
    ChangeNotifier::filesChanged($pdo, 'alice', $change);
    assert_true($queued() === [], 'push disabled: nothing is enqueued');

    $writeConfig(true, false);
    ChangeNotifier::filesChanged($pdo, 'alice', $change);
    assert_true($queued() === [], 'files push disabled: nothing is enqueued');

    $writeConfig(true, true, 'short');
    ChangeNotifier::filesChanged($pdo, 'alice', $change);
    assert_true($queued() === [], 'storage or key errors are swallowed');

    $writeConfig(true, true);
    $before = time();
    ChangeNotifier::filesChanged($pdo, 'alice', $change);
    assert_true($queued() === ['files/alice/docs' => 2], "only the user's own subscribed paths are enqueued");
    $job = $pdo->query("SELECT * FROM push_queue WHERE resource_uri = 'files/alice/docs'")->fetch(PDO::FETCH_ASSOC);
    assert_true(
        $job['topic'] === $topics->forPath('files/alice/docs') && (int) $job['available_at'] >= $before + 5,
        'portal jobs use the keyed topic and the files debounce'
    );
    $pdo->exec('DELETE FROM push_queue');

    // --- Default sink: portal writes reach the queue ---
    $portal = new FileService($pdo, $filesConfig);
    $portal->writeFile('alice', '', 'docs-file.txt', 'x', false);
    $portal->createDirectory('alice', '', 'docs');
    $portal->writeFile('alice', 'docs', 'note.txt', 'n', false);
    assert_true($queued() === ['files/alice/docs' => 1], 'FileService enqueues through ChangeNotifier by default');
} finally {
    remove_tree($tmp);
}

echo "\n" . ($failures === 0 ? 'All portal files push tests passed.' : "$failures portal files push test(s) FAILED.") . "\n";
exit($failures === 0 ? 0 : 1);
