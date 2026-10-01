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
     * $minContentDepth is the change level (0 = resource itself, 1 = direct
     * member, 2 = deeper descendant); merged content jobs keep the minimum.
     * With $debounceSeconds > 0 the job becomes available that long after the
     * latest change, but never later than $maxHoldSeconds after the hold window
     * started (first change, or the last worker pickup).
     *
     * @param array<int, int> $suppressedIds
     */
    public function enqueue(
        string $resourceUri,
        string $topic,
        bool $contentUpdate,
        bool $propertyUpdate,
        ?string $syncToken,
        array $suppressedIds,
        int $minContentDepth = 1,
        int $debounceSeconds = 0,
        int $maxHoldSeconds = 0
    ): void {
        $minContentDepth = max(0, min(2, $minContentDepth));
        $debounceSeconds = max(0, $debounceSeconds);
        $maxHoldSeconds = max($debounceSeconds, $maxHoldSeconds);
        $driver = (string) $this->pdo->getAttribute(\PDO::ATTR_DRIVER_NAME);
        $sqliteTransaction = false;
        if ($driver === 'sqlite') {
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
            $now = time();

            if ($existing !== false) {
                $oldSuppressed = json_decode((string) $existing['suppressed_ids'], true);
                $oldSuppressed = is_array($oldSuppressed) ? array_map('intval', $oldSuppressed) : [];
                $mergedSuppressed = array_values(array_intersect($oldSuppressed, $suppressedIds));
                $depth = (int) ($existing['min_content_depth'] ?? 1);
                if ($contentUpdate) {
                    $depth = !empty($existing['content_update']) ? min($depth, $minContentDepth) : $minContentDepth;
                }
                $holdSince = (int) ($existing['hold_since'] ?? 0);
                if ($holdSince <= 0) {
                    // Rows queued before the hold_since column existed.
                    $holdSince = (int) $existing['created'];
                }
                $availableAt = $debounceSeconds > 0
                    ? min($holdSince + $maxHoldSeconds, $now + $debounceSeconds)
                    : $now;
                $stmt = $this->pdo->prepare(
                    'UPDATE push_queue
                     SET content_update = ?, property_update = ?, sync_token = ?,
                         suppressed_ids = ?, available_at = ?, min_content_depth = ?,
                         hold_since = ?, revision = revision + 1
                     WHERE id = ?'
                );
                $stmt->execute([
                    !empty($existing['content_update']) || $contentUpdate ? 1 : 0,
                    !empty($existing['property_update']) || $propertyUpdate ? 1 : 0,
                    $syncToken ?? $existing['sync_token'],
                    json_encode($mergedSuppressed, JSON_THROW_ON_ERROR),
                    $availableAt,
                    $depth,
                    $holdSince,
                    $existing['id'],
                ]);
            } else {
                $stmt = $this->pdo->prepare(
                    'INSERT INTO push_queue
                     (resource_uri, topic, content_update, property_update, sync_token,
                      suppressed_ids, attempts, available_at, created, min_content_depth,
                      revision, hold_since)
                     VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, 0, ?)'
                );
                $stmt->execute([
                    $resourceUri, $topic, $contentUpdate ? 1 : 0, $propertyUpdate ? 1 : 0,
                    $syncToken, json_encode(array_values($suppressedIds), JSON_THROW_ON_ERROR),
                    $now + $debounceSeconds, $now, $contentUpdate ? $minContentDepth : 1, $now,
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

    /**
     * Returns false when the job was merged after it was fetched; it then stays queued.
     */
    public function complete(int $id, int $revision): bool {
        $stmt = $this->pdo->prepare('DELETE FROM push_queue WHERE id = ? AND revision = ?');
        $stmt->execute([$id, $revision]);

        return $stmt->rowCount() > 0;
    }

    /**
     * Returns false when the job was merged after it was fetched; the merged
     * row then stays queued with the availability the merge gave it.
     */
    public function retry(int $id, int $attempts, int $revision): bool {
        $delay = min(3600, 15 * (2 ** min($attempts, 8)));
        $stmt = $this->pdo->prepare(
            'UPDATE push_queue SET attempts = ?, available_at = ? WHERE id = ? AND revision = ?'
        );
        $stmt->execute([$attempts, time() + $delay, $id, $revision]);

        return $stmt->rowCount() > 0;
    }

    /**
     * Restart the max-hold window of fetched jobs, so changes merged while they
     * are being delivered are debounced from now instead of re-sent at once.
     *
     * @param array<int, int> $ids
     */
    public function markPicked(array $ids): void {
        $ids = array_values(array_unique(array_map('intval', $ids)));
        if ($ids === []) {
            return;
        }
        $stmt = $this->pdo->prepare(
            'UPDATE push_queue SET hold_since = ? WHERE id IN ('
            . implode(', ', array_fill(0, count($ids), '?')) . ')'
        );
        $stmt->execute(array_merge([time()], $ids));
    }
}
