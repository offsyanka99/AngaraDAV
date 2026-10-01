<?php

namespace Baikal\Portal\Admin;

use Baikal\Core\Plugins\Push\SchemaManager;
use Baikal\Core\Plugins\Push\SecretCipher;
use Baikal\Core\Plugins\Push\SubscriptionStorage;
use Baikal\Portal\ApiException;

/**
 * List and remove WebDAV-Push subscriptions for the Administration tab.
 *
 * Present only while system.push_enabled is on. The browser receives a host
 * and a short path hint, never the endpoint URL, token, or key material.
 */
class AdminPushSubscriptionService {
    private const LIST_CAP = 500;

    /** @var \PDO */
    private $pdo;

    /** @var array<string, mixed> */
    private $config;

    /** @var AdminAudit */
    private $audit;

    /**
     * @param array<string, mixed> $config
     */
    public function __construct(\PDO $pdo, array $config, AdminAudit $audit) {
        $this->pdo = $pdo;
        $this->config = $config;
        $this->audit = $audit;
    }

    /**
     * @param array<string, mixed> $query
     *
     * @return array{subscriptions: list<array<string, mixed>>, expiredHidden: int}
     */
    public function listFromQuery(array $query): array {
        $this->assertPushEnabled();
        $principal = $this->principalFilter($query);
        $kind = $this->kindFilter($query);
        $includeExpired = isset($query['expired']) && (string) $query['expired'] === '1';
        SchemaManager::ensure($this->pdo);
        $now = time();
        $storage = $this->storage();
        $rows = $storage->listAdminSummaries($principal, $kind, $includeExpired, self::LIST_CAP, $now);
        $subscriptions = [];
        foreach ($rows as $row) {
            $subscriptions[] = $this->present($row, $now);
        }

        return [
            'subscriptions' => $subscriptions,
            'expiredHidden' => $includeExpired ? 0 : $storage->countExpiredAdmin($principal, $kind, $now),
        ];
    }

    /**
     * @return array{ok: true}
     */
    public function deleteOne(string $actor, int $id, mixed $confirm): array {
        try {
            $this->assertPushEnabled();
            $this->assertConfirm($confirm);
            SchemaManager::ensure($this->pdo);
            $identity = $this->storage()->findAdminIdentity($id);
            if ($identity === null) {
                throw new ApiException('Not found', 404);
            }
            $this->storage()->deleteById($id);
            $this->audit->mutation($actor, 'push-subscription.delete', (string) $id, 'ok', [
                'username' => self::usernameOf($identity['principaluri']),
                'kind'     => self::kindOf($identity['resource_uri']),
            ]);

            return ['ok' => true];
        } catch (ApiException $e) {
            $this->audit->mutation(
                $actor,
                'push-subscription.delete',
                (string) $id,
                'error:' . $e->getStatus()
            );
            throw $e;
        }
    }

    /**
     * @return array{ok: true, deleted: int, missing: int}
     */
    public function deleteMany(string $actor, mixed $ids, mixed $confirm): array {
        try {
            $this->assertPushEnabled();
            $this->assertConfirm($confirm);
            $clean = $this->normalizeIds($ids);
            SchemaManager::ensure($this->pdo);
            $storage = $this->storage();
            $deleted = 0;
            $missing = 0;
            foreach ($clean as $id) {
                if ($storage->findAdminIdentity($id) === null) {
                    ++$missing;
                    continue;
                }
                $storage->deleteById($id);
                ++$deleted;
            }
            $this->audit->mutation($actor, 'push-subscription.delete', 'bulk', 'ok', [
                'deleted' => $deleted,
                'missing' => $missing,
            ]);

            return ['ok' => true, 'deleted' => $deleted, 'missing' => $missing];
        } catch (ApiException $e) {
            $this->audit->mutation(
                $actor,
                'push-subscription.delete',
                'bulk',
                'error:' . $e->getStatus()
            );
            throw $e;
        }
    }

    /**
     * @return array{ok: true, deleted: int}
     */
    public function purge(string $actor, mixed $confirm): array {
        try {
            $this->assertPushEnabled();
            $this->assertConfirm($confirm);
            SchemaManager::ensure($this->pdo);
            $deleted = $this->storage()->purgeExpired();
            $this->audit->mutation($actor, 'push-subscription.purge', 'expired', 'ok', [
                'deleted' => $deleted,
            ]);

            return ['ok' => true, 'deleted' => $deleted];
        } catch (ApiException $e) {
            $this->audit->mutation(
                $actor,
                'push-subscription.purge',
                'expired',
                'error:' . $e->getStatus()
            );
            throw $e;
        }
    }

    /**
     * @param array<string, mixed> $row
     *
     * @return array<string, mixed>
     */
    private function present(array $row, int $now): array {
        $depths = self::triggerDepths((string) ($row['triggers'] ?? ''));
        $expires = (int) $row['expires'];

        return [
            'id'            => (int) $row['id'],
            'username'      => self::usernameOf((string) $row['principaluri']),
            'principalUri'  => (string) $row['principaluri'],
            'kind'          => self::kindOf((string) $row['resource_uri']),
            'resourceUri'   => (string) $row['resource_uri'],
            'endpointHost'  => (string) $row['endpointHost'],
            'endpointHint'  => (string) $row['endpointHint'],
            'contentDepth'  => $depths['content'],
            'propertyDepth' => $depths['property'],
            'created'       => (int) $row['created'],
            'expires'       => $expires,
            'expired'       => $expires <= $now,
        ];
    }

    /**
     * @param array<string, mixed> $query
     */
    private function principalFilter(array $query): ?string {
        $user = isset($query['user']) ? trim((string) $query['user']) : '';
        if ($user === '') {
            return null;
        }

        return 'principals/' . $user;
    }

    /**
     * @param array<string, mixed> $query
     */
    private function kindFilter(array $query): ?string {
        $kind = isset($query['kind']) ? trim((string) $query['kind']) : '';
        if ($kind === '') {
            return null;
        }
        if (!in_array($kind, ['calendars', 'addressbooks', 'files', 'principals', 'other'], true)) {
            throw new ApiException('Invalid kind', 400);
        }

        return $kind;
    }

    private function assertPushEnabled(): void {
        $sys = is_array($this->config['system'] ?? null) ? $this->config['system'] : [];
        if (!self::boolFlag($sys, 'push_enabled', false)) {
            throw new ApiException('Not found', 404);
        }
    }

    private function assertConfirm(mixed $confirm): void {
        if (!empty($confirm) && $confirm !== '0' && $confirm !== 'false') {
            return;
        }
        throw new ApiException('Confirmation required', 400);
    }

    /**
     * @return list<int>
     */
    private function normalizeIds(mixed $ids): array {
        if (!is_array($ids) || !array_is_list($ids)) {
            throw new ApiException('ids must be a list of integers', 400);
        }
        $count = count($ids);
        if ($count < 1 || $count > 100) {
            throw new ApiException('ids must contain 1 to 100 entries', 400);
        }
        $out = [];
        foreach ($ids as $value) {
            if (is_int($value) && $value > 0) {
                $out[] = $value;
                continue;
            }
            if (is_string($value) && preg_match('/^[1-9][0-9]{0,17}$/', $value) === 1) {
                $out[] = (int) $value;
            }
        }
        $out = array_values(array_unique($out));
        if ($out === []) {
            throw new ApiException('ids must contain 1 to 100 entries', 400);
        }

        return $out;
    }

    private function storage(): SubscriptionStorage {
        return new SubscriptionStorage($this->pdo, $this->cipher());
    }

    private function cipher(): ?SecretCipher {
        $db = is_array($this->config['database'] ?? null) ? $this->config['database'] : [];
        $key = isset($db['encryption_key']) ? trim((string) $db['encryption_key']) : '';
        if (strlen($key) < 16) {
            return null;
        }

        return new SecretCipher($key);
    }

    private static function usernameOf(string $principalUri): string {
        $principalUri = rtrim($principalUri, '/');
        $pos = strrpos($principalUri, '/');
        if ($pos === false) {
            return $principalUri;
        }

        return substr($principalUri, $pos + 1);
    }

    private static function kindOf(string $resourceUri): string {
        foreach (['calendars', 'addressbooks', 'files', 'principals'] as $kind) {
            if (str_starts_with($resourceUri, $kind . '/')) {
                return $kind;
            }
        }

        return 'other';
    }

    /**
     * @return array{content: ?string, property: ?string}
     */
    private static function triggerDepths(string $raw): array {
        try {
            $decoded = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return ['content' => null, 'property' => null];
        }
        if (!is_array($decoded)) {
            return ['content' => null, 'property' => null];
        }

        return [
            'content'  => self::depthValue($decoded['content'] ?? null),
            'property' => self::depthValue($decoded['property'] ?? null),
        ];
    }

    private static function depthValue(mixed $value): ?string {
        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }
        if (is_int($value) || is_float($value) || is_string($value)) {
            return (string) $value;
        }

        return null;
    }

    /**
     * @param array<string, mixed> $sys
     */
    private static function boolFlag(array $sys, string $key, bool $default): bool {
        if (!array_key_exists($key, $sys)) {
            return $default;
        }
        $value = $sys[$key];
        if (is_bool($value)) {
            return $value;
        }
        if (is_int($value) || is_float($value)) {
            return (int) $value !== 0;
        }
        if (is_string($value)) {
            $s = strtolower(trim($value));

            return !in_array($s, ['', '0', 'false', 'off', 'no'], true);
        }

        return (bool) $value;
    }
}
