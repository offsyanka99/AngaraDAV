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
}
