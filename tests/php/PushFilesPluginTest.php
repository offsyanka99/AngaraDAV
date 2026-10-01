<?php

/**
 * WebDAV-Push on file homes through a real SabreDAV server: discovery,
 * registration, and change capture for each DAV method.
 *
 * Run: php tests/php/PushFilesPluginTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Core\Files\FileStorageConfig;
use Baikal\Core\Files\HomeCollection;
use Baikal\Core\Files\HomeRepository;
use Baikal\Core\Files\IfHeaderPreconditionPlugin;
use Baikal\Core\Plugins\Push\SecretCipher;
use Baikal\Core\Plugins\Push\SubscriptionStorage;
use Baikal\Core\Plugins\Push\SubscriptionValidator;
use Baikal\Core\Plugins\Push\TopicResolver;
use Baikal\Core\Plugins\Push\VapidKeyStore;
use Baikal\Core\Plugins\PushPlugin;
use Sabre\HTTP\Request;
use Sabre\HTTP\Response;
use Sabre\HTTP\ResponseInterface;

const ENCRYPTION_KEY = 'test-encryption-key-at-least-16-bytes';
const EXTERNAL_URL = 'https://dav.example.test/dav.php/';

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

class NullSapi extends \Sabre\HTTP\Sapi {
    public static function sendResponse(ResponseInterface $response) {
    }
}

class PublicDnsValidator extends SubscriptionValidator {
    protected function resolveHost(string $host): array {
        return ['8.8.8.8'];
    }
}

class FilesPushPluginProbe extends PushPlugin {
    /**
     * @param array<string, mixed> $config
     */
    public function __construct(PDO $pdo, array $config, string $vapidPath) {
        parent::__construct($pdo, $config);
        $this->vapidStore = new VapidKeyStore($vapidPath, $this->logger);
        $this->validator = new PublicDnsValidator();
    }

    public function hasPendingFilesChanges(): bool {
        return !$this->filesChanges->isEmpty();
    }
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

function b64url(string $value): string {
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

$tmp = sys_get_temp_dir() . '/angara-push-files-dav-' . bin2hex(random_bytes(6));
mkdir($tmp, 0700, true);
$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
foreach (explode(';', (string) file_get_contents($root . '/Core/Resources/Db/SQLite/db.sql')) as $statement) {
    if (trim($statement) !== '') {
        $pdo->exec($statement);
    }
}
$pdo->exec("INSERT INTO users (username, digesta1) VALUES ('alice', ''), ('bob', '')");
$pdo->exec("INSERT INTO principals (uri, displayname) VALUES ('principals/alice', 'Alice'), ('principals/bob', 'Bob')");
$fileConfig = new FileStorageConfig([
    'system' => ['files_enabled' => true, 'files_storage_path' => $tmp . '/storage'],
]);
$fileConfig->prepareStorage();
$fileConfig->markActive();
$topics = new TopicResolver(new SecretCipher(ENCRYPTION_KEY));
$subscriptions = new SubscriptionStorage($pdo, new SecretCipher(ENCRYPTION_KEY));

/**
 * One DAV request against a fresh server, like one PHP-FPM request in production.
 *
 * @param array<string, string> $headers
 *
 * @return array{0: Response, 1: FilesPushPluginProbe}
 */
function dav(
    string $user,
    string $method,
    string $path,
    array $headers = [],
    ?string $body = null,
    bool $filesEnabled = true
): array {
    global $pdo, $fileConfig, $tmp;

    $principalBackend = new \Sabre\DAVACL\PrincipalBackend\PDO($pdo);
    $server = new \Sabre\DAV\Server([
        new \Sabre\CalDAV\Principal\Collection($principalBackend),
        new HomeCollection($principalBackend, new HomeRepository($pdo, $fileConfig), $fileConfig),
    ], new NullSapi());
    $server->setBaseUri('/dav.php/');
    $server->addPlugin(new \Sabre\DAV\Auth\Plugin(
        new \Sabre\DAV\Auth\Backend\BasicCallBack(static fn (string $u, string $p): bool => true)
    ));
    $server->addPlugin(new \Sabre\DAVACL\Plugin());
    $server->addPlugin(new \Sabre\DAV\PropertyStorage\Plugin(new \Sabre\DAV\PropertyStorage\Backend\PDO($pdo)));
    $server->addPlugin(new \Sabre\DAV\Locks\Plugin(new \Sabre\DAV\Locks\Backend\PDO($pdo)));
    $server->addPlugin(new IfHeaderPreconditionPlugin());
    $plugin = new FilesPushPluginProbe($pdo, [
        'system' => [
            'push_log_level'     => 'off',
            'push_external_url'  => EXTERNAL_URL,
            'push_files_enabled' => $filesEnabled,
        ],
        'database' => ['encryption_key' => ENCRYPTION_KEY],
    ], $tmp . '/push_vapid.json');
    $server->addPlugin($plugin);

    $headers['Authorization'] = 'Basic ' . base64_encode($user . ':secret');
    $url = '/dav.php/' . implode('/', array_map('rawurlencode', explode('/', $path)));
    $server->httpRequest = new Request($method, $url, $headers, $body);
    $server->httpResponse = new Response();
    $server->start();
    $plugin->flush();

    return [$server->httpResponse, $plugin];
}

function status(string $user, string $method, string $path, array $headers = [], ?string $body = null): int {
    return (int) dav($user, $method, $path, $headers, $body)[0]->getStatus();
}

/**
 * Push property from the 200 propstat of a Depth-0 PROPFIND, or null.
 */
function push_prop(string $path, string $localName, bool $filesEnabled = true): ?DOMElement {
    $body = '<?xml version="1.0" encoding="utf-8"?>'
        . '<d:propfind xmlns:d="DAV:" xmlns:p="' . PushPlugin::NS . '">'
        . '<d:prop><p:transports/><p:topic/><p:supported-triggers/></d:prop></d:propfind>';
    [$response] = dav('alice', 'PROPFIND', $path, ['Depth' => '0', 'Content-Type' => 'application/xml'], $body, $filesEnabled);
    $dom = new DOMDocument();
    if ((int) $response->getStatus() !== 207 || !@$dom->loadXML($response->getBodyAsString())) {
        return null;
    }
    $xpath = new DOMXPath($dom);
    $xpath->registerNamespace('d', 'DAV:');
    foreach ($xpath->query('//d:propstat') as $propstat) {
        if (!str_contains($xpath->evaluate('string(d:status)', $propstat), ' 200 ')) {
            continue;
        }
        foreach ($xpath->query('d:prop/*', $propstat) as $prop) {
            if ($prop instanceof DOMElement && $prop->localName === $localName && $prop->namespaceURI === PushPlugin::NS) {
                return $prop;
            }
        }
    }

    return null;
}

/**
 * @return array<string, string> trigger => depth
 */
function trigger_depths(?DOMElement $supportedTriggers): array {
    $depths = [];
    if ($supportedTriggers === null) {
        return $depths;
    }
    foreach ($supportedTriggers->childNodes as $trigger) {
        if ($trigger instanceof DOMElement) {
            $depths[$trigger->localName] = trim($trigger->textContent);
        }
    }

    return $depths;
}

function register_body(string $endpoint): string {
    return '<?xml version="1.0" encoding="utf-8"?>'
        . '<push-register xmlns="' . PushPlugin::NS . '" xmlns:D="DAV:"><subscription><web-push-subscription>'
        . '<push-resource>https://push.example.test/' . $endpoint . '</push-resource>'
        . '<content-encoding>aes128gcm</content-encoding>'
        . '<subscription-public-key type="p256dh">' . b64url("\x04" . str_repeat("\x01", 64)) . '</subscription-public-key>'
        . '<auth-secret>' . b64url(str_repeat("\x02", 16)) . '</auth-secret>'
        . '</web-push-subscription></subscription>'
        . '<trigger><content-update><D:depth>infinity</D:depth></content-update>'
        . '<property-update><D:depth>0</D:depth></property-update></trigger>'
        . '</push-register>';
}

function register(string $user, string $path, string $endpoint, bool $filesEnabled = true): Response {
    return dav($user, 'POST', $path, ['Content-Type' => 'application/xml'], register_body($endpoint), $filesEnabled)[0];
}

function lock_body(): string {
    return '<?xml version="1.0" encoding="utf-8"?><d:lockinfo xmlns:d="DAV:">'
        . '<d:lockscope><d:exclusive/></d:lockscope><d:locktype><d:write/></d:locktype>'
        . '<d:owner>test</d:owner></d:lockinfo>';
}

/**
 * @return array<string, int> resource_uri => min_content_depth of queued content jobs
 */
function queued_levels(): array {
    global $pdo;
    $levels = [];
    foreach ($pdo->query('SELECT resource_uri, min_content_depth FROM push_queue WHERE content_update = 1') as $row) {
        $levels[(string) $row['resource_uri']] = (int) $row['min_content_depth'];
    }
    ksort($levels);

    return $levels;
}

/**
 * @return array<string, mixed>|null
 */
function queued_row(string $resourceUri): ?array {
    global $pdo;
    $stmt = $pdo->prepare('SELECT * FROM push_queue WHERE resource_uri = ?');
    $stmt->execute([$resourceUri]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    return $row === false ? null : $row;
}

function clear_queue(): void {
    global $pdo;
    $pdo->exec('DELETE FROM push_queue');
}

function queue_row_count(): int {
    global $pdo;

    return (int) $pdo->query('SELECT COUNT(*) FROM push_queue')->fetchColumn();
}

function registration_url(int $subscriptionId): string {
    global $subscriptions;

    return EXTERNAL_URL . PushPlugin::REG_PREFIX . $subscriptions->findById($subscriptionId)['registration_token'];
}

try {
    // --- Setup without subscriptions writes no queue rows (plan section 2, wasted work) ---
    assert_true(status('alice', 'MKCOL', 'files/alice/Sync') === 201, 'MKCOL creates a directory');
    assert_true(status('alice', 'PUT', 'files/alice/Sync/a.txt', [], 'hello') === 201, 'PUT creates a file');
    assert_true(status('alice', 'MKCOL', 'files/alice/Locked') === 201, 'MKCOL creates a second directory');
    assert_true(queued_levels() === [] && queue_row_count() === 0, 'file changes without subscriptions enqueue nothing');

    // --- Discovery ---
    $homeTopic = push_prop('files/alice/', 'topic');
    assert_true(
        $homeTopic !== null && trim($homeTopic->textContent) === $topics->forPath('files/alice'),
        'home root advertises its keyed topic'
    );
    assert_true(
        trigger_depths(push_prop('files/alice/', 'supported-triggers')) === ['content-update' => 'infinity', 'property-update' => '0'],
        'home root supports content-update infinity and property-update 0'
    );
    assert_true(push_prop('files/alice/', 'transports') !== null, 'home root advertises transports');
    $syncTopic = push_prop('files/alice/Sync', 'topic');
    assert_true(
        $syncTopic !== null && trim($syncTopic->textContent) === $topics->forPath('files/alice/Sync'),
        'subdirectory advertises its keyed topic'
    );
    assert_true(push_prop('files/alice/Sync/a.txt', 'topic') === null, 'files are not push-capable');
    assert_true(push_prop('files/alice/Sync/a.txt', 'supported-triggers') === null, 'files advertise no triggers');
    assert_true(push_prop('files/', 'topic') === null, 'the files/ root is not push-capable');
    assert_true(push_prop('files/alice/Sync', 'topic', false) === null, 'directories are not push-capable while files push is off');

    // --- Registration ---
    $registered = register('alice', 'files/alice/Sync', 'sync-1');
    assert_true((int) $registered->getStatus() === 204, 'register on a directory returns 204');
    assert_true(
        str_starts_with((string) $registered->getHeader('Location'), EXTERNAL_URL . PushPlugin::REG_PREFIX),
        'register returns an absolute registration URL'
    );
    $active = $subscriptions->findActiveByResource('files/alice/Sync');
    assert_true(count($active) === 1, 'registration is stored on the decoded directory path');
    assert_true(
        json_decode((string) $active[0]['triggers'], true) === ['content' => 'infinity', 'property' => '0'],
        'depth infinity is kept for directories'
    );
    assert_true($active[0]['topic'] === $topics->forPath('files/alice/Sync'), 'stored topic matches the advertised topic');

    $onFile = register('alice', 'files/alice/Sync/a.txt', 'file-1');
    assert_true(
        (int) $onFile->getStatus() === 403 && str_contains($onFile->getBodyAsString(), 'push-not-available'),
        'register on a file returns 403 push-not-available'
    );
    $foreign = register('bob', 'files/alice/Sync', 'bob-1');
    assert_true((int) $foreign->getStatus() === 403, "register on another user's directory returns 403");
    $bobRows = $pdo->query("SELECT COUNT(*) FROM push_subscriptions WHERE principaluri = 'principals/bob'")->fetchColumn();
    assert_true((int) $bobRows === 0, "no subscription is stored for another user's directory");
    $disabled = register('alice', 'files/alice/Sync', 'off-1', false);
    assert_true(
        (int) $disabled->getStatus() === 403 && str_contains($disabled->getBodyAsString(), 'push-not-available'),
        'register returns push-not-available while files push is off'
    );
    $lock = dav('alice', 'LOCK', 'files/alice/Locked', ['Content-Type' => 'application/xml', 'Depth' => 'infinity'], lock_body())[0];
    assert_true((int) $lock->getStatus() === 200, 'LOCK on a directory succeeds');
    assert_true((int) register('alice', 'files/alice/Locked', 'locked-1')->getStatus() === 204, 'register on a locked directory succeeds');

    // --- Change capture for each DAV method (plan section 6) ---
    $pdo->exec('DELETE FROM push_subscriptions');
    foreach (['Photos', 'Photos/2026', 'Archive', 'Other'] as $directory) {
        status('alice', 'MKCOL', 'files/alice/' . $directory);
    }
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
    $s2 = $subscribe('principals/alice', 'files/alice/Photos', '1', 's2');
    $subscribe('principals/alice', 'files/alice/Photos/2026', 'infinity', 's3');
    $subscribe('principals/alice', 'files/alice/Archive', '1', 's4');
    $bobSubscription = $subscribe('principals/bob', 'files/bob', 'infinity', 's5');
    clear_queue();

    $before = time();
    status('alice', 'PUT', 'files/alice/Photos/2026/a.jpg', [], 'jpg');
    assert_true(
        queued_levels() === ['files/alice' => 2, 'files/alice/Photos' => 2, 'files/alice/Photos/2026' => 1],
        'PUT new file: collection level 1, subscribed ancestors level 2'
    );
    $homeJob = queued_row('files/alice');
    assert_true(
        $homeJob !== null && $homeTopic !== null && $homeJob['topic'] === trim($homeTopic->textContent),
        'queued topic equals the PROPFIND topic'
    );
    assert_true((int) $homeJob['available_at'] >= $before + 5, 'DAV file jobs are debounced');
    clear_queue();

    status('alice', 'PUT', 'files/alice/Photos/b.jpg', [], 'jpg');
    assert_true(queued_levels() === ['files/alice' => 2, 'files/alice/Photos' => 1], 'PUT new file in Photos');
    clear_queue();

    status('alice', 'PUT', 'files/alice/Photos/2026/a.jpg', [], 'jpg2');
    assert_true(
        queued_levels() === ['files/alice' => 2, 'files/alice/Photos' => 2, 'files/alice/Photos/2026' => 1],
        'PUT overwrite (afterWriteContent) notifies like a new member'
    );
    clear_queue();

    status('alice', 'MKCOL', 'files/alice/Photos/2026/Sub');
    assert_true(
        queued_levels() === ['files/alice' => 2, 'files/alice/Photos' => 2, 'files/alice/Photos/2026' => 1],
        'MKCOL notifies the parent collection and ancestors'
    );
    clear_queue();

    status('alice', 'COPY', 'files/alice/Photos/b.jpg', ['Destination' => '/dav.php/files/alice/Archive/b.jpg']);
    assert_true(queued_levels() === ['files/alice' => 2, 'files/alice/Archive' => 1], 'COPY notifies the destination parent');
    clear_queue();

    $move = status('alice', 'MOVE', 'files/alice/Photos/2026', ['Destination' => '/dav.php/files/alice/Archive/2026']);
    assert_true($move === 201, 'MOVE of a directory succeeds');
    assert_true(
        queued_levels() === [
            'files/alice'             => 2,
            'files/alice/Archive'     => 1,
            'files/alice/Photos'      => 1,
            'files/alice/Photos/2026' => 0,
        ],
        'MOVE notifies both parents and sends a removal notice for the source'
    );
    clear_queue();

    status('alice', 'COPY', 'files/alice/Archive/2026', ['Destination' => '/dav.php/files/alice/Photos/2026', 'Depth' => 'infinity']);
    assert_true(queued_levels() === ['files/alice' => 2, 'files/alice/Photos' => 1], 'COPY of a directory notifies the destination parent');
    clear_queue();

    assert_true(status('alice', 'DELETE', 'files/alice/Photos') === 204, 'DELETE of a directory succeeds');
    assert_true(
        queued_levels() === ['files/alice' => 1, 'files/alice/Photos' => 0, 'files/alice/Photos/2026' => 0],
        'DELETE sends removal notices to the directory and its subscribed descendants'
    );
    clear_queue();

    $lockNew = dav('alice', 'LOCK', 'files/alice/Archive/new.txt', ['Content-Type' => 'application/xml', 'Depth' => '0'], lock_body())[0];
    assert_true((int) $lockNew->getStatus() === 201, 'LOCK on an unmapped URL creates the file');
    assert_true(queued_levels() === ['files/alice' => 2, 'files/alice/Archive' => 1], 'LOCK on an unmapped URL notifies like PUT');
    clear_queue();

    status('alice', 'PUT', 'files/alice/Other/x.txt', [], 'x');
    assert_true(queued_levels() === ['files/alice' => 2], 'unsubscribed collections are not enqueued');
    clear_queue();

    status('bob', 'PUT', 'files/bob/Docs.txt', [], 'x');
    assert_true(queued_levels() === ['files/bob' => 1], "a user's change notifies only their own home");
    clear_queue();

    // --- Push-Dont-Notify ---
    status('alice', 'PUT', 'files/alice/Archive/c.txt', ['Push-Dont-Notify' => '"' . registration_url($s1) . '"'], 'c');
    assert_true(
        json_decode((string) queued_row('files/alice')['suppressed_ids'], true) === [$s1]
            && json_decode((string) queued_row('files/alice/Archive')['suppressed_ids'], true) === [],
        "Push-Dont-Notify suppresses only the caller's own registration on its own path"
    );
    clear_queue();

    status('alice', 'PUT', 'files/alice/Archive/d.txt', ['Push-Dont-Notify' => '"' . registration_url($bobSubscription) . '"'], 'd');
    assert_true(
        json_decode((string) queued_row('files/alice')['suppressed_ids'], true) === [],
        "another user's registration URL in Push-Dont-Notify is ignored"
    );
    clear_queue();

    // --- PROPPATCH ---
    $propPatch = '<?xml version="1.0" encoding="utf-8"?><d:propertyupdate xmlns:d="DAV:" xmlns:t="urn:test">'
        . '<d:set><d:prop><t:label>x</t:label></d:prop></d:set></d:propertyupdate>';
    assert_true(
        status('alice', 'PROPPATCH', 'files/alice/Archive', ['Content-Type' => 'application/xml'], $propPatch) === 207,
        'PROPPATCH on a directory succeeds'
    );
    $propertyJob = queued_row('files/alice/Archive');
    assert_true(
        $propertyJob !== null && (int) $propertyJob['property_update'] === 1 && (int) $propertyJob['content_update'] === 0,
        'PROPPATCH on a subscribed directory enqueues a property job'
    );
    clear_queue();
    status('alice', 'PROPPATCH', 'files/alice/Archive/b.jpg', ['Content-Type' => 'application/xml'], $propPatch);
    assert_true(queue_row_count() === 0, 'PROPPATCH on a file enqueues nothing');

    // --- Files push off ---
    [, $offPlugin] = dav('alice', 'PUT', 'files/alice/Archive/e.txt', [], 'e', false);
    assert_true(queue_row_count() === 0 && !$offPlugin->hasPendingFilesChanges(), 'files push off: DAV file changes enqueue nothing');
    dav('alice', 'PROPPATCH', 'files/alice/Archive', ['Content-Type' => 'application/xml'], $propPatch, false);
    assert_true(queue_row_count() === 0, 'files push off: PROPPATCH on a directory enqueues nothing');

    // --- CalDAV/CardDAV paths keep the immediate, unleveled behavior ---
    [, $calPlugin] = dav('alice', 'PROPFIND', 'files/alice', ['Depth' => '0']);
    $calPlugin->onBind('calendars/alice/default/event.ics');
    $calPlugin->flush();
    $calendarJob = queued_row('calendars/alice/default');
    assert_true(
        $calendarJob !== null && (int) $calendarJob['min_content_depth'] === 1 && (int) $calendarJob['available_at'] <= time(),
        'calendar changes are still enqueued immediately at level 1'
    );
    assert_true($calendarJob['topic'] === TopicResolver::legacy('calendars/alice/default'), 'calendar jobs keep the legacy topic');
} finally {
    remove_tree($tmp);
}

echo "\n" . ($failures === 0 ? 'All files push DAV tests passed.' : "$failures files push DAV test(s) FAILED.") . "\n";
exit($failures === 0 ? 0 : 1);
