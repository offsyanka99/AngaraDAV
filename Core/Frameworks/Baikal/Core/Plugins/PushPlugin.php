<?php

namespace Baikal\Core\Plugins;

use Baikal\Core\Plugins\Push\Property\SupportedTriggers;
use Baikal\Core\Plugins\Push\Property\Transports;
use Baikal\Core\Plugins\Push\PushLogger;
use Baikal\Core\Plugins\Push\QueueStorage;
use Baikal\Core\Plugins\Push\RegisterParser;
use Baikal\Core\Plugins\Push\SchemaManager;
use Baikal\Core\Plugins\Push\SecretCipher;
use Baikal\Core\Plugins\Push\SubscriptionStorage;
use Baikal\Core\Plugins\Push\SubscriptionValidator;
use Baikal\Core\Plugins\Push\VapidKeyStore;
use Sabre\DAV\INode;
use Sabre\DAV\PropFind;
use Sabre\DAV\Server;
use Sabre\DAV\ServerPlugin;
use Sabre\HTTP\RequestInterface;
use Sabre\HTTP\ResponseInterface;

/**
 * WebDAV-Push (draft-bitfire-webdav-push) server plugin.
 *
 * Advertises push support (OPTIONS DAV header + PROPFIND properties), manages
 * subscriptions (POST <push-register> / DELETE registration URL), and delivers
 * encrypted Web Push notifications (RFC 8030/8291/8292) when subscribed
 * CalDAV/CardDAV collections change.
 *
 * Design notes:
 *  - The Web Push library (minishlink/web-push) is OPTIONAL at runtime. If it is
 *    missing, subscriptions still register and advertise, but delivery is skipped
 *    and logged. The DAV server never fatals because of Push.
 *  - Notifications are merged per collection into a persistent queue and
 *    delivered by a bounded CLI worker, so DAV requests never contact untrusted
 *    push services directly (spec section 4.3).
 *  - v1 supports content-update depth 1 on calendars/address books/home-sets and
 *    property-update depth 0 on calendars/address books/principals. Deeper
 *    (infinity) triggers are downgraded at registration time.
 */
class PushPlugin extends ServerPlugin {
    const NS = 'https://bitfire.at/webdav-push';
    const PROP_TRANSPORTS = '{https://bitfire.at/webdav-push}transports';
    const PROP_TOPIC = '{https://bitfire.at/webdav-push}topic';
    const PROP_SUPPORTED_TRIGGERS = '{https://bitfire.at/webdav-push}supported-triggers';
    const REG_PREFIX = 'push-subscriptions/';

    /** @var Server */
    protected $server;

    /** @var \PDO */
    protected $pdo;

    /** @var PushLogger */
    protected $logger;

    /** @var SubscriptionStorage */
    protected $storage;

    /** @var QueueStorage */
    protected $queue;

    /** @var VapidKeyStore */
    protected $vapidStore;

    /** @var SubscriptionValidator */
    protected $validator;

    /** @var string VAPID subject (contact URI) */
    protected $subject;

    /** @var string canonical external DAV URL */
    protected $externalBaseUrl;

    /** @var int */
    protected $maxPerPrincipal;

    /** @var int */
    protected $maxPerResource;

    /** @var int */
    protected $maxRegistrationsPerHour;

    /** @var array<string, bool> collection paths with pending content updates */
    protected $dirtyContent = [];

    /** @var array<string, bool> resource paths with pending property updates */
    protected $dirtyProperty = [];

    /** @var bool */
    protected $shutdownRegistered = false;

    /**
     * @param array<string, mixed> $config parsed baikal.yaml (expects 'system')
     */
    public function __construct(\PDO $pdo, array $config) {
        $this->pdo = $pdo;
        $sys = is_array($config['system'] ?? null) ? $config['system'] : [];
        $this->logger = new PushLogger(isset($sys['push_log_level']) ? (string) $sys['push_log_level'] : 'off');
        SchemaManager::ensure($pdo);
        $encryptionKey = (string) ($config['database']['encryption_key'] ?? '');
        $this->storage = new SubscriptionStorage($pdo, new SecretCipher($encryptionKey));
        $this->queue = new QueueStorage($pdo);
        $this->vapidStore = new VapidKeyStore(null, $this->logger);
        $allowedHosts = isset($sys['push_allowed_hosts']) && is_array($sys['push_allowed_hosts'])
            ? $sys['push_allowed_hosts']
            : [];
        $this->validator = new SubscriptionValidator($allowedHosts);
        $this->subject = $this->deriveSubject($sys);
        $externalUrl = getenv('BAIKAL_PUSH_EXTERNAL_URL') ?: ($sys['push_external_url'] ?? '');
        $this->externalBaseUrl = $this->normalizeExternalBaseUrl((string) $externalUrl);
        $this->maxPerPrincipal = $this->boundedConfigInt($sys, 'push_max_subscriptions_per_principal', 20, 1, 1000);
        $this->maxPerResource = $this->boundedConfigInt($sys, 'push_max_subscriptions_per_resource', 100, 1, 5000);
        $this->maxRegistrationsPerHour = $this->boundedConfigInt($sys, 'push_max_registrations_per_hour', 30, 1, 1000);
    }

    public function initialize(Server $server) {
        $this->server = $server;

        // Registration/removal routes: run right after auth (priority 10), before
        // ACL/CalDAV so our synthetic push-subscriptions/* URLs aren't 404'd by
        // node resolution. Returning false short-circuits the request.
        $server->on('beforeMethod:POST', [$this, 'onBeforePost'], 11);
        $server->on('beforeMethod:DELETE', [$this, 'onBeforeDelete'], 11);

        // Service detection.
        $server->on('propFind', [$this, 'propFind']);

        // Change detection -> queue notifications (delivered on shutdown).
        $server->on('afterBind', [$this, 'onBind']);
        $server->on('afterUnbind', [$this, 'onUnbind']);
        $server->on('afterWriteContent', [$this, 'onWriteContent']);
        $server->on('afterMove', [$this, 'onMove']);
        $server->on('afterMethod:PROPPATCH', [$this, 'onPropPatch']);

        $this->logger->debug('WebDAV-Push plugin initialized');
    }

    /**
     * Advertise "webdav-push" in the OPTIONS DAV header (spec section 2).
     *
     * @return array<int, string>
     */
    public function getFeatures() {
        return $this->externalBaseUrl === '' ? [] : ['webdav-push'];
    }

    public function getPluginName() {
        return 'webdav-push';
    }

    /**
     * @return array{name: string, description: string}
     */
    public function getPluginInfo() {
        return [
            'name'        => $this->getPluginName(),
            'description' => 'Server-initiated CalDAV/CardDAV change notifications over Web Push (draft-bitfire-webdav-push).',
        ];
    }

    // --- Service detection -------------------------------------------------

    public function propFind(PropFind $propFind, INode $node) {
        if ($this->externalBaseUrl === '') {
            return;
        }
        $cap = $this->capabilityForNode($node);
        if ($cap === null) {
            return;
        }
        $path = $propFind->getPath();

        $propFind->handle(self::PROP_TRANSPORTS, function () {
            return new Transports($this->vapidStore->getPublicKey());
        });
        $propFind->handle(self::PROP_TOPIC, function () use ($path) {
            return $this->topic($path);
        });
        $propFind->handle(self::PROP_SUPPORTED_TRIGGERS, function () use ($cap) {
            return new SupportedTriggers($cap['content'], $cap['property']);
        });
    }

    // --- Subscription registration / removal -------------------------------

    /**
     * @return bool false when the request was a push-register and is handled
     */
    public function onBeforePost(RequestInterface $request, ResponseInterface $response) {
        if (stripos((string) $request->getHeader('Content-Type'), 'xml') === false) {
            return true;
        }
        $stream = $request->getBodyAsStream();
        $body = stream_get_contents($stream, RegisterParser::MAX_BODY_BYTES + 1);
        if ($body === false) {
            throw new \Sabre\DAV\Exception\BadRequest('Unable to read WebDAV-Push registration body');
        }
        if (strlen($body) > RegisterParser::MAX_BODY_BYTES) {
            $isPushRegistration = stripos($body, 'push-register') !== false;
            if (!@rewind($stream)) {
                throw new \Sabre\DAV\Exception\BadRequest('XML POST body is too large to inspect safely');
            }
            $request->setBody($stream);
            if ($isPushRegistration) {
                throw new \Sabre\DAV\Exception\BadRequest('WebDAV-Push registration body is too large');
            }

            return true;
        }
        // Rewind so, if this isn't ours, downstream handlers can read it too.
        $request->setBody($body);

        $parsed = RegisterParser::parse($body);
        if ($parsed === null) {
            return true;
        }
        $this->handleRegister($response, $parsed);

        return false;
    }

    /**
     * @return bool false when the request targeted a registration URL
     */
    public function onBeforeDelete(RequestInterface $request, ResponseInterface $response) {
        $path = trim($this->server->calculateUri($request->getUrl()), '/');
        if (!preg_match('#^' . preg_quote(self::REG_PREFIX, '#') . '([A-Za-z0-9_-]{43})$#', $path, $m)) {
            return true;
        }
        $token = $m[1];
        $principal = $this->currentPrincipal();
        $sub = $this->storage->findByToken($token);

        if ($sub === null) {
            $response->setStatus(404);
            $this->logger->info('unregister: unknown subscription');

            return false;
        }
        if ($principal === null || (string) $sub['principaluri'] !== $principal) {
            // Deliberately indistinguishable from an unknown opaque token.
            $response->setStatus(404);
            $this->logger->warn('unregister: owner mismatch');

            return false;
        }
        $this->storage->delete((int) $sub['id'], $principal);
        $response->setStatus(204);
        $this->logger->info('subscription removed', ['id' => (int) $sub['id']]);

        return false;
    }

    /**
     * @param array<string, mixed> $parsed
     */
    protected function handleRegister(ResponseInterface $response, array $parsed): void {
        $path = trim($this->server->getRequestUri(), '/');
        $cap = $this->capability($path);
        if ($cap === null) {
            $this->sendPrecondition($response, 403, 'push-not-available');

            return;
        }
        if (empty($parsed['pushResource']) || empty($parsed['pubkey']) || empty($parsed['authSecret'])) {
            $this->sendPrecondition($response, 403, 'invalid-subscription');

            return;
        }

        $validationError = $this->validator->validateSubscription(
            (string) $parsed['pushResource'],
            (string) $parsed['contentEncoding'],
            (string) $parsed['pubkey'],
            (string) $parsed['authSecret']
        );
        if ($validationError !== null) {
            $this->logger->warn('registration validation failed', ['reason' => $validationError]);
            $this->sendPrecondition($response, 403, 'invalid-subscription');

            return;
        }

        $content = $this->resolveDepth($parsed['requestedContentDepth'], $cap['content']);
        $property = $this->resolveDepth($parsed['requestedPropertyDepth'], $cap['property']);
        // DAVx5 (and similar clients) often omit <trigger> entirely. Treat
        // "no triggers requested" as "use everything this collection supports"
        // instead of failing closed with no-trigger-supported.
        if ($parsed['requestedContentDepth'] === null && $parsed['requestedPropertyDepth'] === null) {
            $content = $cap['content'];
            $property = $cap['property'];
        }
        if ($content === null && $property === null) {
            $this->sendPrecondition($response, 403, 'no-trigger-supported');

            return;
        }

        $principal = $this->currentPrincipal();
        if ($principal === null) {
            throw new \Sabre\DAV\Exception\NotAuthenticated('Authentication required to register a push subscription');
        }
        $acl = $this->server->getPlugin('acl');
        if (!$acl instanceof \Sabre\DAVACL\Plugin) {
            throw new \Sabre\DAV\Exception\Forbidden('WebDAV-Push requires DAV ACL support');
        }
        $acl->checkPrivileges($path, '{DAV:}read');

        if ($this->externalBaseUrl === '') {
            $this->sendPrecondition($response, 403, 'push-not-available');

            return;
        }
        $quotaError = $this->storage->quotaError(
            $principal,
            $path,
            (string) $parsed['pushResource'],
            $this->maxPerPrincipal,
            $this->maxPerResource,
            $this->maxRegistrationsPerHour
        );
        if ($quotaError !== null) {
            $this->logger->warn('registration quota rejected', ['reason' => $quotaError]);
            $response->setHeader('Retry-After', '3600');
            $response->setStatus(429);

            return;
        }

        $expires = $this->resolveExpiry($parsed['expires']);
        $topic = $this->topic($path);
        $registration = $this->storage->upsert([
            'principaluri'     => $principal,
            'resource_uri'     => $path,
            'topic'            => $topic,
            'push_resource'    => (string) $parsed['pushResource'],
            'content_encoding' => (string) $parsed['contentEncoding'],
            'pubkey'           => (string) $parsed['pubkey'],
            'auth_secret'      => (string) $parsed['authSecret'],
            'triggers'         => (string) json_encode(['content' => $content, 'property' => $property]),
            'expires'          => $expires,
        ]);

        $response->setHeader('Location', $this->absoluteUrl(self::REG_PREFIX . $registration['token']));
        $response->setHeader('Expires', gmdate('D, d M Y H:i:s', $expires) . ' GMT');
        $response->setStatus(204);
        $this->logger->info('subscription registered', [
            'id'       => $registration['id'],
            'resource' => $path,
            'content'  => $content,
            'property' => $property,
            'expires'  => $expires,
        ]);
    }

    // --- Change detection --------------------------------------------------

    public function onBind(string $path): void {
        $this->markContent($this->parentCollection($path));
    }

    public function onUnbind(string $path): void {
        $this->markContent($this->parentCollection($path));
    }

    public function onWriteContent(string $path, INode $node): void {
        $this->markContent($this->parentCollection($path));
    }

    public function onMove(string $source, string $destination): void {
        $this->markContent($this->parentCollection($source));
        $this->markContent($this->parentCollection($destination));
    }

    public function onPropPatch(RequestInterface $request, ResponseInterface $response): void {
        $status = $response->getStatus();
        if ($status < 200 || $status >= 300) {
            return;
        }
        $path = trim($this->server->calculateUri($request->getUrl()), '/');
        if ($path === '') {
            return;
        }
        $this->dirtyProperty[$path] = true;
        $this->ensureShutdown();
    }

    // --- Persistent enqueue (runs at shutdown) -----------------------------

    /**
     * Persist all queued resource updates. Registered as a shutdown function so
     * DAV responses do not wait for queue I/O. Outbound delivery only happens in
     * the separate bounded worker.
     */
    public function flush(): void {
        if ($this->dirtyContent === [] && $this->dirtyProperty === []) {
            return;
        }
        $dontNotify = $this->parseDontNotify();

        foreach (array_keys($this->dirtyContent) as $collection) {
            try {
                $this->dispatchContent($collection, $dontNotify);
            } catch (\Throwable $e) {
                $this->logger->error('content notification enqueue failed', [
                    'resource' => $collection,
                    'error'    => $e->getMessage(),
                ]);
            }
        }
        foreach (array_keys($this->dirtyProperty) as $resource) {
            try {
                $this->dispatchProperty($resource, $dontNotify);
            } catch (\Throwable $e) {
                $this->logger->error('property notification enqueue failed', [
                    'resource' => $resource,
                    'error'    => $e->getMessage(),
                ]);
            }
        }
    }

    /**
     * @param string|array<int, string> $dontNotify '*' or list of registration URLs
     */
    protected function dispatchContent(string $collection, $dontNotify): void {
        $topic = $this->topic($collection);
        $this->queue->enqueue(
            $collection,
            $topic,
            true,
            false,
            $this->syncTokenFor($collection),
            $this->suppressedIds($collection, $dontNotify)
        );
    }

    /**
     * @param string|array<int, string> $dontNotify
     */
    protected function dispatchProperty(string $resource, $dontNotify): void {
        $topic = $this->topic($resource);
        $this->queue->enqueue(
            $resource,
            $topic,
            false,
            true,
            null,
            $this->suppressedIds($resource, $dontNotify)
        );
    }

    // --- Helpers -----------------------------------------------------------

    protected function markContent(?string $collection): void {
        if ($collection === null || $collection === '') {
            return;
        }
        $this->dirtyContent[$collection] = true;
        $this->ensureShutdown();
    }

    protected function ensureShutdown(): void {
        if ($this->shutdownRegistered) {
            return;
        }
        $this->shutdownRegistered = true;
        register_shutdown_function([$this, 'flush']);
    }

    protected function parentCollection(string $path): ?string {
        $path = trim($path, '/');
        $pos = strrpos($path, '/');
        if ($pos === false) {
            return null;
        }

        return substr($path, 0, $pos);
    }

    /**
     * Deterministic, server-wide-unique push topic for a resource path.
     */
    public function topic(string $path): string {
        $norm = trim($path, '/');
        $b64 = rtrim(strtr(base64_encode(hash('sha256', $norm, true)), '+/', '-_'), '=');

        return substr($b64, 0, 22);
    }

    /**
     * @return array{content: ?string, property: ?string}|null
     */
    protected function capability(string $path): ?array {
        try {
            $node = $this->server->tree->getNodeForPath($path);
        } catch (\Throwable $e) {
            return null;
        }

        return $this->capabilityForNode($node);
    }

    /**
     * Push capability of a node, or null when the node isn't push-capable.
     *
     * @return array{content: ?string, property: ?string}|null
     */
    protected function capabilityForNode(INode $node): ?array {
        if ($node instanceof \Sabre\CalDAV\ICalendar || $node instanceof \Sabre\CardDAV\IAddressBook) {
            return ['content' => '1', 'property' => '0'];
        }
        if ($node instanceof \Sabre\CalDAV\CalendarHome || $node instanceof \Sabre\CardDAV\AddressBookHome) {
            return ['content' => '1', 'property' => null];
        }
        if ($node instanceof \Sabre\DAVACL\IPrincipal) {
            return ['content' => null, 'property' => '0'];
        }

        return null;
    }

    protected function resolveDepth(?string $requested, ?string $capMax): ?string {
        if ($requested === null || $capMax === null) {
            return null;
        }
        $order = ['0' => 0, '1' => 1, 'infinity' => 2];
        $r = $order[$requested] ?? 0;
        $c = $order[$capMax] ?? 0;

        return $r <= $c ? $requested : $capMax;
    }

    protected function resolveExpiry(?int $requested): int {
        $now = time();
        $max = $now + 30 * 86400;
        if ($requested === null) {
            return $now + 7 * 86400;
        }
        if ($requested < $now + 3600) {
            return $now + 3600;
        }

        return min($requested, $max);
    }

    protected function syncTokenFor(string $collection): ?string {
        try {
            $node = $this->server->tree->getNodeForPath($collection);
        } catch (\Throwable $e) {
            return null;
        }
        if ($node instanceof \Sabre\DAV\Sync\ISyncCollection) {
            $token = $node->getSyncToken();
            if ($token !== null && $token !== '') {
                return \Sabre\DAV\Sync\Plugin::SYNCTOKEN_PREFIX . $token;
            }
        }

        return null;
    }

    /**
     * @return string|array<int, string> '*' or list of registration URLs
     */
    protected function parseDontNotify() {
        if (!isset($this->server->httpRequest)) {
            return [];
        }
        $values = $this->server->httpRequest->getHeaderAsArray('Push-Dont-Notify');
        if ($values === []) {
            return [];
        }
        $list = [];
        foreach ($values as $value) {
            if (preg_match('/(^|,)\s*\*\s*($|,)/', $value)) {
                return '*';
            }
            if (preg_match_all('/"([^"\r\n]{1,2048})"/', $value, $matches)) {
                foreach ($matches[1] as $quotedUrl) {
                    if (count($list) >= 100) {
                        break 2;
                    }
                    $list[] = $quotedUrl;
                }
            }
        }

        return array_values(array_unique($list));
    }

    /**
     * @param string|array<int, string>        $dontNotify
     *
     * @return array<int, int> subscription ids owned by the current principal
     */
    protected function suppressedIds(string $resourceUri, $dontNotify): array {
        $principal = $this->currentPrincipal();
        if ($principal === null || $dontNotify === []) {
            return [];
        }

        $ids = [];
        foreach ($this->storage->findActiveByResource($resourceUri) as $sub) {
            if ((string) $sub['principaluri'] !== $principal) {
                continue;
            }
            if ($dontNotify === '*') {
                $ids[] = (int) $sub['id'];
                continue;
            }
            if (is_array($dontNotify)) {
                $regUrl = $this->absoluteUrl(self::REG_PREFIX . $sub['registration_token']);
                if (in_array($regUrl, $dontNotify, true)) {
                    $ids[] = (int) $sub['id'];
                }
            }
        }

        return $ids;
    }

    protected function currentPrincipal(): ?string {
        $acl = $this->server->getPlugin('acl');
        if ($acl instanceof \Sabre\DAVACL\Plugin) {
            $principal = $acl->getCurrentUserPrincipal();
            if ($principal !== null) {
                return $principal;
            }
        }
        $auth = $this->server->getPlugin('auth');
        if ($auth instanceof \Sabre\DAV\Auth\Plugin) {
            return $auth->getCurrentPrincipal();
        }

        return null;
    }

    protected function absoluteUrl(string $relPath): string {
        return $this->externalBaseUrl . ltrim($relPath, '/');
    }

    protected function normalizeExternalBaseUrl(string $url): string {
        $url = trim($url);
        if ($url === '' || strlen($url) > 2048 || filter_var($url, FILTER_VALIDATE_URL) === false) {
            return '';
        }
        $parts = parse_url($url);
        if (!is_array($parts)
            || strtolower((string) ($parts['scheme'] ?? '')) !== 'https'
            || empty($parts['host'])
            || isset($parts['user'])
            || isset($parts['pass'])
            || isset($parts['query'])
            || isset($parts['fragment'])
        ) {
            return '';
        }

        return rtrim($url, '/') . '/';
    }

    /**
     * @param array<string, mixed> $sys
     */
    protected function boundedConfigInt(
        array $sys,
        string $key,
        int $default,
        int $minimum,
        int $maximum
    ): int {
        $value = isset($sys[$key]) ? (int) $sys[$key] : $default;

        return max($minimum, min($maximum, $value));
    }

    /**
     * @param array<string, mixed> $sys system config section
     */
    protected function deriveSubject(array $sys): string {
        $from = isset($sys['invite_from']) ? trim((string) $sys['invite_from']) : '';
        if ($from !== '' && filter_var($from, FILTER_VALIDATE_EMAIL)) {
            return 'mailto:' . $from;
        }

        return 'mailto:webmaster@localhost';
    }

    protected function sendPrecondition(ResponseInterface $response, int $status, string $condition): void {
        $body = '<?xml version="1.0" encoding="utf-8"?>' . "\n"
            . '<D:error xmlns:D="DAV:" xmlns:P="' . self::NS . '"><P:' . $condition . '/></D:error>';
        $response->setStatus($status);
        $response->setHeader('Content-Type', 'application/xml; charset=utf-8');
        $response->setBody($body);
        $this->logger->info('registration rejected', ['condition' => $condition]);
    }
}
