<?php

namespace Baikal\Core\Plugins\Push;

/**
 * PDO-backed storage for WebDAV-Push subscriptions (push_subscriptions table).
 *
 * A subscription is uniquely identified per resource by its Web Push push
 * resource (endpoint URL). Re-registering the same endpoint for the same
 * resource updates the existing row (spec section 3.2) instead of duplicating.
 */
class SubscriptionStorage {
    /** @var \PDO */
    private $pdo;

    /** @var SecretCipher|null */
    private $cipher;

    public function __construct(\PDO $pdo, ?SecretCipher $cipher = null) {
        $this->pdo = $pdo;
        $this->cipher = $cipher;
    }

    /**
     * Insert or update a subscription, keyed by (resource_uri, push_resource).
     *
     * @param array{
     *   principaluri:string, resource_uri:string, topic:string,
     *   push_resource:string, content_encoding:?string, pubkey:string,
     *   auth_secret:string, triggers:string, expires:int
     * } $sub
     *
     * @return array{id: int, token: string}
     */
    public function upsert(array $sub): array {
        $existing = $this->findByResourceAndEndpoint($sub['resource_uri'], $sub['push_resource']);
        $now = time();

        if ($existing !== null) {
            $stmt = $this->pdo->prepare(
                'UPDATE push_subscriptions
                 SET principaluri = ?, topic = ?, content_encoding = ?, pubkey = ?,
                     auth_secret = ?, triggers = ?, expires = ?
                 WHERE id = ?'
            );
            $stmt->execute([
                $sub['principaluri'], $sub['topic'], $sub['content_encoding'],
                $this->protect($sub['pubkey']), $this->protect($sub['auth_secret']), $sub['triggers'],
                $sub['expires'], $existing['id'],
            ]);

            return [
                'id'    => (int) $existing['id'],
                'token' => (string) $existing['registration_token'],
            ];
        }

        $registrationToken = $this->newRegistrationToken();
        $stmt = $this->pdo->prepare(
            'INSERT INTO push_subscriptions
             (registration_token, principaluri, resource_uri, topic, push_resource,
              push_resource_hash, content_encoding, pubkey, auth_secret, triggers,
              created, expires)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        $stmt->execute([
            $registrationToken,
            $sub['principaluri'], $sub['resource_uri'], $sub['topic'],
            $this->protect($sub['push_resource']), $this->endpointHash($sub['push_resource']),
            $sub['content_encoding'], $this->protect($sub['pubkey']), $this->protect($sub['auth_secret']),
            $sub['triggers'], $now, $sub['expires'],
        ]);

        return ['id' => (int) $this->pdo->lastInsertId(), 'token' => $registrationToken];
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findById(int $id): ?array {
        $stmt = $this->pdo->prepare('SELECT * FROM push_subscriptions WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $row === false ? null : $this->unprotectRow($row);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findByToken(string $token): ?array {
        $stmt = $this->pdo->prepare('SELECT * FROM push_subscriptions WHERE registration_token = ?');
        $stmt->execute([$token]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $row === false ? null : $this->unprotectRow($row);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findByResourceAndEndpoint(string $resourceUri, string $pushResource): ?array {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM push_subscriptions WHERE resource_uri = ? AND push_resource_hash = ?'
        );
        $stmt->execute([$resourceUri, $this->endpointHash($pushResource)]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $row === false ? null : $this->unprotectRow($row);
    }

    /**
     * Active (non-expired) subscriptions registered for a resource.
     *
     * @return array<int, array<string, mixed>>
     */
    public function findActiveByResource(string $resourceUri): array {
        $stmt = $this->pdo->prepare(
            'SELECT * FROM push_subscriptions WHERE resource_uri = ? AND expires > ?'
        );
        $stmt->execute([$resourceUri, time()]);

        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];

        return array_map([$this, 'unprotectRow'], $rows);
    }

    /**
     * Which of $uris have at least one active subscription (no decryption).
     *
     * @param array<int, string> $uris
     *
     * @return list<string>
     */
    public function findActiveResourceUris(array $uris): array {
        $uris = array_values(array_unique(array_map('strval', $uris)));
        $found = [];
        $now = time();
        foreach (array_chunk($uris, 500) as $chunk) {
            $stmt = $this->pdo->prepare(
                'SELECT DISTINCT resource_uri FROM push_subscriptions WHERE resource_uri IN ('
                . implode(', ', array_fill(0, count($chunk), '?')) . ') AND expires > ?'
            );
            $stmt->execute(array_merge($chunk, [$now]));
            foreach ($stmt->fetchAll(\PDO::FETCH_COLUMN) ?: [] as $uri) {
                $found[] = (string) $uri;
            }
        }

        return array_values(array_unique($found));
    }

    /**
     * Actively subscribed resource URIs strictly below $prefix (no decryption).
     *
     * @return list<string>
     */
    public function findActiveResourceUrisUnder(string $prefix): array {
        $prefix = trim($prefix, '/');
        if ($prefix === '') {
            return [];
        }
        $like = str_replace(['=', '%', '_'], ['==', '=%', '=_'], $prefix) . '/%';
        $stmt = $this->pdo->prepare(
            "SELECT DISTINCT resource_uri FROM push_subscriptions WHERE resource_uri LIKE ? ESCAPE '=' AND expires > ?"
        );
        $stmt->execute([$like, time()]);
        $found = [];
        foreach ($stmt->fetchAll(\PDO::FETCH_COLUMN) ?: [] as $uri) {
            // SQLite LIKE is ASCII case-insensitive; enforce an exact prefix.
            if (str_starts_with((string) $uri, $prefix . '/')) {
                $found[] = (string) $uri;
            }
        }

        return $found;
    }

    /**
     * @return int number of rows removed
     */
    public function deleteByPrincipal(string $principaluri): int {
        $stmt = $this->pdo->prepare('DELETE FROM push_subscriptions WHERE principaluri = ?');
        $stmt->execute([$principaluri]);

        return $stmt->rowCount();
    }

    /**
     * Remove a subscription, scoped to its owner (spec section 7.1).
     *
     * @return bool true if a row was deleted
     */
    public function delete(int $id, string $principaluri): bool {
        $stmt = $this->pdo->prepare(
            'DELETE FROM push_subscriptions WHERE id = ? AND principaluri = ?'
        );
        $stmt->execute([$id, $principaluri]);

        return $stmt->rowCount() > 0;
    }

    public function deleteById(int $id): void {
        $stmt = $this->pdo->prepare('DELETE FROM push_subscriptions WHERE id = ?');
        $stmt->execute([$id]);
    }

    /**
     * Remove a subscription by its push endpoint (invalid-subscription cleanup).
     */
    public function quotaError(
        string $principaluri,
        string $resourceUri,
        string $pushResource,
        int $maxPerPrincipal,
        int $maxPerResource,
        int $maxRegistrationsPerHour
    ): ?string {
        if ($this->findByResourceAndEndpoint($resourceUri, $pushResource) !== null) {
            return null;
        }

        $now = time();
        if ($this->countWhere('principaluri = ? AND expires > ?', [$principaluri, $now]) >= $maxPerPrincipal) {
            return 'Principal subscription quota exceeded';
        }
        if ($this->countWhere('resource_uri = ? AND expires > ?', [$resourceUri, $now]) >= $maxPerResource) {
            return 'Resource subscription quota exceeded';
        }
        if ($this->countWhere('principaluri = ? AND created >= ?', [$principaluri, $now - 3600])
            >= $maxRegistrationsPerHour
        ) {
            return 'Registration rate limit exceeded';
        }

        return null;
    }

    /**
     * Purge expired subscriptions.
     *
     * @return int number of rows removed
     */
    public function purgeExpired(): int {
        $stmt = $this->pdo->prepare('DELETE FROM push_subscriptions WHERE expires <= ?');
        $stmt->execute([time()]);

        return $stmt->rowCount();
    }

    /**
     * Admin list. Decrypts push_resource only long enough to build a host and
     * a path hint, then drops the URL. Never returns tokens or key material.
     *
     * @return list<array{
     *   id: int,
     *   principaluri: string,
     *   resource_uri: string,
     *   triggers: string,
     *   created: int,
     *   expires: int,
     *   endpointHost: string,
     *   endpointHint: string
     * }>
     */
    public function listAdminSummaries(?string $principalUri, ?string $kind, bool $includeExpired, int $limit, int $now): array {
        $filter = $this->adminWhere($principalUri, $kind, $includeExpired ? null : 'active', $now);
        $limit = max(1, min(500, $limit));
        $stmt = $this->pdo->prepare(
            'SELECT id, principaluri, resource_uri, push_resource, triggers, created, expires
             FROM push_subscriptions' . $filter['sql'] . ' ORDER BY created DESC, id DESC LIMIT ' . $limit
        );
        $stmt->execute($filter['params']);
        $out = [];
        foreach ($stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [] as $row) {
            $endpoint = $this->endpointHintFields((string) $row['push_resource']);
            $out[] = [
                'id'            => (int) $row['id'],
                'principaluri'  => (string) $row['principaluri'],
                'resource_uri'  => (string) $row['resource_uri'],
                'triggers'      => (string) $row['triggers'],
                'created'       => (int) $row['created'],
                'expires'       => (int) $row['expires'],
                'endpointHost'  => $endpoint['host'],
                'endpointHint'  => $endpoint['hint'],
            ];
        }

        return $out;
    }

    /**
     * Expired rows matching the same user and kind filters as the admin list.
     */
    public function countExpiredAdmin(?string $principalUri, ?string $kind, int $now): int {
        $filter = $this->adminWhere($principalUri, $kind, 'expired', $now);
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM push_subscriptions' . $filter['sql']);
        $stmt->execute($filter['params']);

        return (int) $stmt->fetchColumn();
    }

    /**
     * Owner and resource only, for an audit line. No endpoint and no keys.
     *
     * @return array{principaluri: string, resource_uri: string}|null
     */
    public function findAdminIdentity(int $id): ?array {
        $stmt = $this->pdo->prepare(
            'SELECT principaluri, resource_uri FROM push_subscriptions WHERE id = ?'
        );
        $stmt->execute([$id]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if ($row === false) {
            return null;
        }

        return [
            'principaluri' => (string) $row['principaluri'],
            'resource_uri' => (string) $row['resource_uri'],
        ];
    }

    /**
     * @param array<int, mixed> $params
     */
    private function countWhere(string $where, array $params): int {
        $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM push_subscriptions WHERE ' . $where);
        $stmt->execute($params);

        return (int) $stmt->fetchColumn();
    }

    private function newRegistrationToken(): string {
        return rtrim(strtr(base64_encode(random_bytes(32)), '+/', '-_'), '=');
    }

    private function protect(string $value): string {
        return $this->cipher === null ? $value : $this->cipher->encrypt($value);
    }

    private function endpointHash(string $endpoint): string {
        return $this->cipher === null ? hash('sha256', $endpoint) : $this->cipher->blindIndex($endpoint);
    }

    /**
     * @param array<string, mixed> $row
     *
     * @return array<string, mixed>
     */
    private function unprotectRow(array $row): array {
        if ($this->cipher !== null) {
            $row['push_resource'] = $this->cipher->decrypt((string) $row['push_resource']);
            $row['pubkey'] = $this->cipher->decrypt((string) $row['pubkey']);
            $row['auth_secret'] = $this->cipher->decrypt((string) $row['auth_secret']);
        }

        return $row;
    }

    /**
     * Whitelist only. Unknown kinds match nothing so a caller cannot widen the SQL.
     */
    private function adminKindSql(?string $kind): ?string {
        if ($kind === null || $kind === '') {
            return null;
        }

        switch ($kind) {
            case 'calendars':
                return "resource_uri LIKE 'calendars/%'";
            case 'addressbooks':
                return "resource_uri LIKE 'addressbooks/%'";
            case 'files':
                return "resource_uri LIKE 'files/%'";
            case 'principals':
                return "resource_uri LIKE 'principals/%'";
            case 'other':
                return "resource_uri NOT LIKE 'calendars/%'"
                    . " AND resource_uri NOT LIKE 'addressbooks/%'"
                    . " AND resource_uri NOT LIKE 'files/%'"
                    . " AND resource_uri NOT LIKE 'principals/%'";
            default:
                return '0 = 1';
        }
    }

    /**
     * @param 'active'|'expired'|null $expiresMode
     *
     * @return array{sql: string, params: array<int, mixed>}
     */
    private function adminWhere(?string $principalUri, ?string $kind, ?string $expiresMode, int $now): array {
        $where = [];
        $params = [];
        if ($principalUri !== null && $principalUri !== '') {
            $where[] = 'principaluri = ?';
            $params[] = $principalUri;
        }
        $kindSql = $this->adminKindSql($kind);
        if ($kindSql !== null) {
            $where[] = $kindSql;
        }
        if ($expiresMode === 'active') {
            $where[] = 'expires > ?';
            $params[] = $now;
        } elseif ($expiresMode === 'expired') {
            $where[] = 'expires <= ?';
            $params[] = $now;
        }

        return [
            'sql'    => $where === [] ? '' : ' WHERE ' . implode(' AND ', $where),
            'params' => $params,
        ];
    }

    /**
     * @return array{host: string, hint: string}
     */
    private function endpointHintFields(string $stored): array {
        if ($this->cipher === null) {
            if (str_starts_with($stored, SecretCipher::PREFIX)) {
                return ['host' => '', 'hint' => ''];
            }

            return self::splitEndpoint($stored);
        }
        try {
            $plain = $this->cipher->decrypt($stored);
        } catch (\Throwable) {
            return ['host' => '', 'hint' => ''];
        }

        return self::splitEndpoint($plain);
    }

    /**
     * @return array{host: string, hint: string}
     */
    private static function splitEndpoint(string $url): array {
        $host = parse_url($url, PHP_URL_HOST);
        $path = parse_url($url, PHP_URL_PATH);
        $path = is_string($path) ? $path : '';

        return [
            'host' => is_string($host) ? $host : '',
            'hint' => $path === '' ? '' : substr($path, -6),
        ];
    }
}
