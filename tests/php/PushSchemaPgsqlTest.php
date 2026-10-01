<?php

/**
 * PostgreSQL checks for the WebDAV-Push queue schema migration and merge, user
 * deletion cleanup, and worker calendar-proxy authorization.
 *
 * Set BAIKAL_TEST_PGSQL_DSN to run; skips otherwise.
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
use Baikal\Portal\Admin\AdminUserService;

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

$dsn = getenv('BAIKAL_TEST_PGSQL_DSN');
if ($dsn === false || $dsn === '') {
    echo "SKIP No PostgreSQL DSN configured.\n";
    exit(0);
}

$pdo = new PDO(
    $dsn,
    getenv('BAIKAL_TEST_PGSQL_USER') ?: 'baikal',
    getenv('BAIKAL_TEST_PGSQL_PASSWORD') ?: 'baikal',
    [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
);
$schema = 'push_schema_test_' . bin2hex(random_bytes(4));
$pdo->exec('CREATE SCHEMA ' . $schema);
$pdo->exec('SET search_path TO ' . $schema);

try {
    $pdo->exec(
        "CREATE TABLE push_queue (
            id SERIAL PRIMARY KEY,
            resource_uri TEXT NOT NULL UNIQUE,
            topic TEXT NOT NULL,
            content_update SMALLINT NOT NULL DEFAULT 0,
            property_update SMALLINT NOT NULL DEFAULT 0,
            sync_token TEXT,
            suppressed_ids TEXT NOT NULL DEFAULT '[]',
            attempts INTEGER NOT NULL DEFAULT 0,
            available_at INTEGER NOT NULL,
            created INTEGER NOT NULL
        )"
    );
    $pdo->exec("INSERT INTO push_queue (resource_uri, topic, content_update, available_at, created) VALUES ('calendars/alice/default', 't', 1, 1, 1)");

    SchemaManager::ensure($pdo);
    SchemaManager::ensure($pdo);

    $stmt = $pdo->prepare(
        'SELECT column_name FROM information_schema.columns WHERE table_schema = ? AND table_name = ?'
    );
    $stmt->execute([$schema, 'push_queue']);
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    assert_true(
        count(array_intersect(['min_content_depth', 'revision', 'hold_since'], $columns)) === 3,
        'PostgreSQL push_queue gains the new columns idempotently'
    );

    $row = $pdo->query("SELECT * FROM push_queue WHERE resource_uri = 'calendars/alice/default'")->fetch(PDO::FETCH_ASSOC);
    assert_true(
        (int) $row['min_content_depth'] === 1 && (int) $row['revision'] === 0,
        'PostgreSQL existing job rows get defaults'
    );

    $queue = new QueueStorage($pdo);
    $queue->enqueue('files/alice/Sync', 't', true, false, null, [], 2, 5, 30);
    $queue->enqueue('files/alice/Sync', 't', true, false, null, [], 1, 5, 30);
    $row = $pdo->query("SELECT * FROM push_queue WHERE resource_uri = 'files/alice/Sync'")->fetch(PDO::FETCH_ASSOC);
    assert_true(
        (int) $row['min_content_depth'] === 1 && (int) $row['revision'] === 1,
        'PostgreSQL merge keeps the minimum level and bumps the revision'
    );
    assert_true($queue->complete((int) $row['id'], 0) === false, 'PostgreSQL complete() with a stale revision is a no-op');
    assert_true($queue->complete((int) $row['id'], 1) === true, 'PostgreSQL complete() with the current revision deletes');
} finally {
    $pdo->exec('DROP SCHEMA ' . $schema . ' CASCADE');
}

class RecordingNotifier extends Notifier {
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

function create_user(AdminUserService $users, string $name, string $mailbox): void {
    $users->createUser([
        'username'        => $name,
        'displayname'     => $name,
        'email'           => $mailbox . '@example.com',
        'password'        => 'secret',
        'passwordConfirm' => 'secret',
    ]);
}

$schema = 'push_users_test_' . bin2hex(random_bytes(4));
$pdo->exec('CREATE SCHEMA ' . $schema);
$pdo->exec('SET search_path TO ' . $schema);

try {
    $pdo->exec((string) file_get_contents($root . '/Core/Resources/Db/PgSQL/db.sql'));
    // An install that never enabled Push or file storage has none of these tables.
    $pdo->exec('DROP TABLE push_subscriptions, push_queue, file_homes');
    $users = new AdminUserService($pdo, ['system' => ['auth_realm' => 'BaikalDAV']]);
    create_user($users, 'olduser', 'olduser');
    create_user($users, 'keeper', 'keeper');
    $users->deleteUser('olduser', true);
    assert_true(
        (int) $pdo->query("SELECT COUNT(*) FROM users WHERE username = 'olduser'")->fetchColumn() === 0,
        'PostgreSQL user delete succeeds without push or file_homes tables'
    );

    SchemaManager::ensure($pdo);
    foreach (['dave' => 'dave', 'Dave' => 'dave-upper', 'erin' => 'erin', 'carol' => 'carol'] as $name => $mailbox) {
        create_user($users, $name, $mailbox);
    }
    $cipher = new SecretCipher('test-encryption-key-at-least-16-bytes');
    $subscriptions = new SubscriptionStorage($pdo, $cipher);
    $subscribe = static function (string $principal, string $resource) use ($subscriptions): int {
        static $n = 0;
        ++$n;

        return $subscriptions->upsert([
            'principaluri'     => $principal,
            'resource_uri'     => $resource,
            'topic'            => 't',
            'push_resource'    => 'https://push.example.test/' . $n,
            'content_encoding' => 'aes128gcm',
            'pubkey'           => 'PUB',
            'auth_secret'      => 'SECRET',
            'triggers'         => json_encode(['content' => '1', 'property' => '0']),
            'expires'          => time() + 3600,
        ])['id'];
    };
    $subscribe('principals/dave', 'files/dave/Docs');
    $subscribe('principals/erin', 'calendars/dave/default');
    $keptUpper = $subscribe('principals/Dave', 'files/Dave/Docs');
    $queue = new QueueStorage($pdo);
    foreach (['files/dave/Docs', 'calendars/dave/default', 'files/Dave/Docs'] as $resource) {
        $queue->enqueue($resource, 't', true, false, null, []);
    }
    $pdo->exec("INSERT INTO propertystorage (path, name, valuetype, value) VALUES ('files/dave/a', 'n', 1, 'x'), ('files/Dave/a', 'n', 1, 'x')");

    $users->deleteUser('dave', true);
    $remaining = $pdo->query('SELECT id FROM push_subscriptions')->fetchAll(PDO::FETCH_COLUMN);
    assert_true(array_map('intval', $remaining) === [$keptUpper], 'PostgreSQL user delete purges only that user\'s push subscriptions');
    assert_true(
        $pdo->query('SELECT resource_uri FROM push_queue')->fetchAll(PDO::FETCH_COLUMN) === ['files/Dave/Docs'],
        'PostgreSQL user delete purges only that user\'s queued jobs'
    );
    assert_true(
        $pdo->query('SELECT path FROM propertystorage')->fetchAll(PDO::FETCH_COLUMN) === ['files/Dave/a'],
        'PostgreSQL DAV metadata cleanup is case-sensitive'
    );

    $pdo->exec("INSERT INTO principals (uri) VALUES ('principals/erin/calendar-proxy-read')");
    $pdo->exec(
        "INSERT INTO groupmembers (principal_id, member_id) VALUES (
            (SELECT id FROM principals WHERE uri = 'principals/erin/calendar-proxy-read'),
            (SELECT id FROM principals WHERE uri = 'principals/carol'))"
    );
    $proxy = $subscribe('principals/carol', 'calendars/erin/default');
    $notifier = new RecordingNotifier();
    $pdo->exec('DELETE FROM push_queue');
    $queue->enqueue('calendars/erin/default', 't', true, false, null, []);
    (new PushWorker($pdo, $queue, $subscriptions, $notifier, new PushLogger('off')))->runOnce();
    assert_true($notifier->notified === [$proxy], 'PostgreSQL worker authorizes a calendar-proxy member');
} finally {
    $pdo->exec('SET search_path TO public');
    $pdo->exec('DROP SCHEMA ' . $schema . ' CASCADE');
}

if ($failures > 0) {
    fwrite(STDERR, "\n$failures failure(s)\n");
    exit(1);
}

echo "\nAll PostgreSQL push schema tests passed.\n";
exit(0);
