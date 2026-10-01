<?php

namespace Baikal\Core\Plugins\Push;

use Symfony\Component\Yaml\Yaml;

/**
 * Enqueue WebDAV-Push content-update jobs for mutations that do not go through
 * the SabreDAV server (portal /api writes).
 *
 * Failures are logged and swallowed so a misconfigured Push setup never breaks
 * calendar, contact, or file CRUD.
 *
 * Shared calendars: Sabre stores one calendar row and multiple calendarinstances
 * (owner + sharees), each under a different DAV path. Clients register push on
 * their own path, so content updates fan out to every instance path (and topic).
 */
class ChangeNotifier {
    private const SYNCTOKEN_PREFIX = 'http://sabre.io/ns/sync/';

    /**
     * Notify subscribers that a calendar collection's contents changed.
     *
     * @param array{0: int, 1: int}|int $calendarId  [calendarId, instanceId] or calendar id
     */
    public static function calendarContent(
        \PDO $pdo,
        string $username,
        string $calendarUri,
        $calendarId = null
    ): void {
        $resource = self::calendarResourceUri($username, $calendarUri);
        $syncToken = null;
        if (is_array($calendarId) && isset($calendarId[0])) {
            $syncToken = self::calendarSyncToken($pdo, (int) $calendarId[0]);
        } elseif (is_int($calendarId) || (is_string($calendarId) && ctype_digit((string) $calendarId))) {
            $syncToken = self::calendarSyncToken($pdo, (int) $calendarId);
        }
        self::enqueue($pdo, $resource, $syncToken);
    }

    /**
     * DAV collection paths that should receive a content-update for $resourceUri.
     *
     * For calendars/{user}/{uri}, returns every calendarinstance of the same
     * calendarid (owner + sharees). Other paths are returned as a single entry.
     *
     * @return list<string>
     */
    public static function expandContentResourceUris(\PDO $pdo, string $resourceUri): array {
        $resourceUri = trim($resourceUri, '/');
        if ($resourceUri === '') {
            return [];
        }

        $parts = explode('/', $resourceUri);
        if (count($parts) !== 3 || $parts[0] !== 'calendars') {
            return [$resourceUri];
        }

        $username = rawurldecode($parts[1]);
        $uri = rawurldecode($parts[2]);
        if ($username === '' || $uri === '') {
            return [$resourceUri];
        }

        try {
            $principal = 'principals/' . $username;
            $stmt = $pdo->prepare(
                'SELECT calendarid FROM calendarinstances WHERE principaluri = ? AND uri = ? LIMIT 1'
            );
            $stmt->execute([$principal, $uri]);
            $calendarId = $stmt->fetchColumn();
            if ($calendarId === false || $calendarId === null || $calendarId === '') {
                return [$resourceUri];
            }

            $stmt = $pdo->prepare(
                'SELECT principaluri, uri FROM calendarinstances WHERE calendarid = ?'
            );
            $stmt->execute([(int) $calendarId]);
            $paths = [];
            while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
                $p = (string) ($row['principaluri'] ?? '');
                $instanceUri = (string) ($row['uri'] ?? '');
                if ($instanceUri === '' || !str_starts_with($p, 'principals/')) {
                    continue;
                }
                $user = substr($p, strlen('principals/'));
                if ($user === '') {
                    continue;
                }
                $paths[] = 'calendars/' . $user . '/' . $instanceUri;
            }

            if ($paths === []) {
                return [$resourceUri];
            }

            $paths = array_values(array_unique($paths));
            // Keep the triggering path first for stable logs / sync-token preference.
            usort($paths, static function (string $a, string $b) use ($resourceUri): int {
                if ($a === $resourceUri) {
                    return -1;
                }
                if ($b === $resourceUri) {
                    return 1;
                }

                return strcmp($a, $b);
            });

            return $paths;
        } catch (\Throwable $e) {
            return [$resourceUri];
        }
    }

    /**
     * Notify subscribers that an address book collection's contents changed.
     */
    public static function addressBookContent(
        \PDO $pdo,
        string $username,
        string $addressBookUri,
        ?int $addressBookId = null
    ): void {
        $resource = self::addressBookResourceUri($username, $addressBookUri);
        $syncToken = $addressBookId !== null ? self::addressBookSyncToken($pdo, $addressBookId) : null;
        self::enqueue($pdo, $resource, $syncToken);
    }

    public static function calendarResourceUri(string $username, string $calendarUri): string {
        $user = trim($username, '/');
        $uri = trim($calendarUri, '/');

        return 'calendars/' . $user . '/' . $uri;
    }

    public static function addressBookResourceUri(string $username, string $addressBookUri): string {
        $user = trim($username, '/');
        $uri = trim($addressBookUri, '/');

        return 'addressbooks/' . $user . '/' . $uri;
    }

    /**
     * Unkeyed topic for calendar / address-book paths. File paths need a keyed
     * TopicResolver, so they are rejected here.
     */
    public static function topic(string $path): string {
        if (FilesPushPaths::isFilesPath($path)) {
            throw new \InvalidArgumentException('File push topics require a keyed TopicResolver');
        }

        return TopicResolver::legacy($path);
    }

    /**
     * Enqueue file-home changes made through the portal, with the same fan-out
     * as DAV writes. Changes outside files/{username} are ignored.
     */
    public static function filesChanged(\PDO $pdo, string $username, FilesChangeSet $changes): void {
        if ($changes->isEmpty()) {
            return;
        }
        $config = self::readConfig();
        $sys = is_array($config['system'] ?? null) ? $config['system'] : [];
        if (empty($sys['push_enabled']) || empty($sys['push_files_enabled'])) {
            return;
        }
        $logger = new PushLogger(isset($sys['push_log_level']) ? (string) $sys['push_log_level'] : null);
        try {
            $home = FilesPushPaths::ROOT . '/' . trim($username, '/');
            $scoped = new FilesChangeSet();
            foreach ($changes->members() as $path) {
                if (FilesPushPaths::homeRoot($path) === $home) {
                    $scoped->member($path);
                }
            }
            foreach ($changes->removedPaths() as $path) {
                if (FilesPushPaths::homeRoot($path) === $home) {
                    $scoped->removed($path);
                }
            }
            SchemaManager::ensure($pdo);
            $database = is_array($config['database'] ?? null) ? $config['database'] : [];
            $cipher = new SecretCipher((string) ($database['encryption_key'] ?? ''));
            $dispatcher = new FilesPushDispatcher(
                new QueueStorage($pdo),
                new SubscriptionStorage($pdo, $cipher),
                new TopicResolver($cipher),
                $logger
            );
            $dispatcher->dispatch($scoped, static fn (string $path): array => [], 'portal');
        } catch (\Throwable $e) {
            $logger->error('portal files enqueue failed', ['error' => $e->getMessage()]);
        }
    }

    private static function enqueue(\PDO $pdo, string $resourceUri, ?string $syncToken): void {
        if ($resourceUri === '' || !self::isPushEnabled()) {
            return;
        }
        try {
            SchemaManager::ensure($pdo);
            $queue = new QueueStorage($pdo);
            $paths = self::expandContentResourceUris($pdo, $resourceUri);
            if ($paths === []) {
                $paths = [$resourceUri];
            }
            foreach ($paths as $path) {
                $queue->enqueue(
                    $path,
                    self::topic($path),
                    true,
                    false,
                    $syncToken,
                    []
                );
                self::logger()->info('content notification enqueued', [
                    'resource' => $path,
                    'source'   => 'portal',
                    'trigger'  => $resourceUri,
                ]);
            }
        } catch (\Throwable $e) {
            self::logger()->error('portal enqueue failed', [
                'resource' => $resourceUri,
                'source'   => 'portal',
                'error'    => $e->getMessage(),
            ]);
        }
    }

    private static function isPushEnabled(): bool {
        $config = self::readConfig();
        $sys = is_array($config['system'] ?? null) ? $config['system'] : [];

        return !empty($sys['push_enabled']);
    }

    /**
     * Same dedicated log file as PushPlugin (never PHP error_log(); see PushLogger).
     */
    private static function logger(): PushLogger {
        $config = self::readConfig();
        $sys = is_array($config['system'] ?? null) ? $config['system'] : [];

        return new PushLogger(isset($sys['push_log_level']) ? (string) $sys['push_log_level'] : null);
    }

    /**
     * @return array<string, mixed> parsed configuration.yaml, or [] when unavailable
     */
    private static function readConfig(): array {
        if (!defined('PROJECT_PATH_CONFIG')) {
            return [];
        }
        try {
            $config = Yaml::parseFile(PROJECT_PATH_CONFIG . 'configuration.yaml');
        } catch (\Throwable $e) {
            return [];
        }

        return is_array($config) ? $config : [];
    }

    private static function calendarSyncToken(\PDO $pdo, int $calendarId): ?string {
        try {
            $stmt = $pdo->prepare('SELECT synctoken FROM calendars WHERE id = ?');
            $stmt->execute([$calendarId]);
            $token = $stmt->fetchColumn();
            if ($token === false || $token === null || $token === '') {
                return null;
            }

            return self::SYNCTOKEN_PREFIX . $token;
        } catch (\Throwable $e) {
            return null;
        }
    }

    private static function addressBookSyncToken(\PDO $pdo, int $addressBookId): ?string {
        try {
            $stmt = $pdo->prepare('SELECT synctoken FROM addressbooks WHERE id = ?');
            $stmt->execute([$addressBookId]);
            $token = $stmt->fetchColumn();
            if ($token === false || $token === null || $token === '') {
                return null;
            }

            return self::SYNCTOKEN_PREFIX . $token;
        } catch (\Throwable $e) {
            return null;
        }
    }
}
