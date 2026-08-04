<?php

namespace Baikal\Core\Plugins\Push;

use Symfony\Component\Yaml\Yaml;

/**
 * Enqueue WebDAV-Push content-update jobs for mutations that do not go through
 * the SabreDAV server (portal /api writes).
 *
 * Failures are logged and swallowed so a misconfigured Push setup never breaks
 * calendar/contact CRUD.
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
     * Same topic algorithm as PushPlugin::topic().
     */
    public static function topic(string $path): string {
        $norm = trim($path, '/');
        $b64 = rtrim(strtr(base64_encode(hash('sha256', $norm, true)), '+/', '-_'), '=');

        return substr($b64, 0, 22);
    }

    private static function enqueue(\PDO $pdo, string $resourceUri, ?string $syncToken): void {
        if ($resourceUri === '' || !self::isPushEnabled()) {
            return;
        }
        try {
            SchemaManager::ensure($pdo);
            $queue = new QueueStorage($pdo);
            $queue->enqueue(
                $resourceUri,
                self::topic($resourceUri),
                true,
                false,
                $syncToken,
                []
            );
            self::logger()->info('content notification enqueued', [
                'resource' => $resourceUri,
                'source'   => 'portal',
            ]);
        } catch (\Throwable $e) {
            self::logger()->error('portal enqueue failed', [
                'resource' => $resourceUri,
                'source'   => 'portal',
                'error'    => $e->getMessage(),
            ]);
        }
    }

    private static function isPushEnabled(): bool {
        if (!defined('PROJECT_PATH_CONFIG')) {
            return false;
        }
        try {
            $config = Yaml::parseFile(PROJECT_PATH_CONFIG . 'baikal.yaml');
        } catch (\Throwable $e) {
            return false;
        }
        $sys = is_array($config['system'] ?? null) ? $config['system'] : [];

        return !empty($sys['push_enabled']);
    }

    /**
     * Same dedicated log file as PushPlugin (never PHP error_log(); see PushLogger).
     */
    private static function logger(): PushLogger {
        $level = null;
        if (defined('PROJECT_PATH_CONFIG')) {
            try {
                $config = Yaml::parseFile(PROJECT_PATH_CONFIG . 'baikal.yaml');
                $sys = is_array($config['system'] ?? null) ? $config['system'] : [];
                $level = isset($sys['push_log_level']) ? (string) $sys['push_log_level'] : null;
            } catch (\Throwable $e) {
                $level = null;
            }
        }

        return new PushLogger($level);
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
