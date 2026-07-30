<?php

namespace Baikal\Core\Plugins\Push;

/**
 * Persistent, deduplicating queue for WebDAV-Push resource updates.
 */
class QueueStorage {
    /** @var \PDO */
    private $pdo;

    public function __construct(\PDO $pdo) {
        $this->pdo = $pdo;
    }

    /**
     * Merge an update into the pending job for this resource. Suppression sets
     * are intersected: when any merged change requires a notification, it must
     * not remain suppressed by an earlier change.
     *
     * @param array<int, int> $suppressedIds
     */
    public function enqueue(
        string $resourceUri,
        string $topic,
        bool $contentUpdate,
        bool $propertyUpdate,
        ?string $syncToken,
        array $suppressedIds
    ): void {
        $driver = (string) $this->pdo->getAttribute(\PDO::ATTR_DRIVER_NAME);
        $mysqlLock = null;
        $sqliteTransaction = false;
        if ($driver === 'mysql') {
            $mysqlLock = 'baikal-push-' . hash('sha256', $resourceUri);
            $lock = $this->pdo->prepare('SELECT GET_LOCK(?, 5)');
            $lock->execute([$mysqlLock]);
            if ((int) $lock->fetchColumn() !== 1) {
                throw new \RuntimeException('Timed out acquiring WebDAV-Push queue lock');
            }
            $this->pdo->beginTransaction();
        } elseif ($driver === 'sqlite') {
            $this->pdo->exec('BEGIN IMMEDIATE TRANSACTION');
            // PDO did not consistently report SQL-started transactions before
            // PHP 8.4, so finalize this transaction with SQL as well.
            $sqliteTransaction = true;
        } else {
            $this->pdo->beginTransaction();
            if ($driver === 'pgsql') {
                $lock = $this->pdo->prepare('SELECT pg_advisory_xact_lock(hashtext(?))');
                $lock->execute([$resourceUri]);
            }
        }
        try {
            $stmt = $this->pdo->prepare('SELECT * FROM push_queue WHERE resource_uri = ?');
            $stmt->execute([$resourceUri]);
            $existing = $stmt->fetch(\PDO::FETCH_ASSOC);

            if ($existing !== false) {
                $oldSuppressed = json_decode((string) $existing['suppressed_ids'], true);
                $oldSuppressed = is_array($oldSuppressed) ? array_map('intval', $oldSuppressed) : [];
                $mergedSuppressed = array_values(array_intersect($oldSuppressed, $suppressedIds));
                $stmt = $this->pdo->prepare(
                    'UPDATE push_queue
                     SET content_update = ?, property_update = ?, sync_token = ?,
                         suppressed_ids = ?, available_at = ?
                     WHERE id = ?'
                );
                $stmt->execute([
                    !empty($existing['content_update']) || $contentUpdate ? 1 : 0,
                    !empty($existing['property_update']) || $propertyUpdate ? 1 : 0,
                    $syncToken ?? $existing['sync_token'],
                    json_encode($mergedSuppressed, JSON_THROW_ON_ERROR),
                    time(),
                    $existing['id'],
                ]);
            } else {
                $stmt = $this->pdo->prepare(
                    'INSERT INTO push_queue
                     (resource_uri, topic, content_update, property_update, sync_token,
                      suppressed_ids, attempts, available_at, created)
                     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)'
                );
                $now = time();
                $stmt->execute([
                    $resourceUri, $topic, $contentUpdate ? 1 : 0, $propertyUpdate ? 1 : 0,
                    $syncToken, json_encode(array_values($suppressedIds), JSON_THROW_ON_ERROR),
                    $now, $now,
                ]);
            }
            if ($sqliteTransaction) {
                $this->pdo->exec('COMMIT');
                $sqliteTransaction = false;
            } else {
                $this->pdo->commit();
            }
        } catch (\Throwable $e) {
            if ($sqliteTransaction) {
                $this->pdo->exec('ROLLBACK');
                $sqliteTransaction = false;
            } elseif ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        } finally {
            if ($mysqlLock !== null) {
                $unlock = $this->pdo->prepare('SELECT RELEASE_LOCK(?)');
                $unlock->execute([$mysqlLock]);
            }
        }
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function nextBatch(int $limit): array {
        $limit = max(1, min($limit, 100));
        $stmt = $this->pdo->prepare(
            'SELECT * FROM push_queue WHERE available_at <= ? ORDER BY id ASC LIMIT ' . $limit
        );
        $stmt->execute([time()]);

        return $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];
    }

    public function complete(int $id): void {
        $stmt = $this->pdo->prepare('DELETE FROM push_queue WHERE id = ?');
        $stmt->execute([$id]);
    }

    public function retry(int $id, int $attempts): void {
        $delay = min(3600, 15 * (2 ** min($attempts, 8)));
        $stmt = $this->pdo->prepare(
            'UPDATE push_queue SET attempts = ?, available_at = ? WHERE id = ?'
        );
        $stmt->execute([$attempts, time() + $delay, $id]);
    }
}
