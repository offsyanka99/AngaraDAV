<?php

namespace Baikal\Core\Files;

/**
 * Maps DAV principals to non-reusable physical home identifiers.
 */
class HomeRepository {
    /** @var \PDO */
    private $pdo;

    /** @var FileStorageConfig */
    private $config;

    public function __construct(\PDO $pdo, FileStorageConfig $config) {
        $this->pdo = $pdo;
        $this->config = $config;
    }

    /**
     * @return array<string, mixed>
     */
    public function getOrCreateForPrincipal(string $principalUri): array {
        $userId = $this->userIdForPrincipal($principalUri);
        $home = $this->findActiveByUserId($userId);
        if ($home !== null) {
            return $home;
        }

        $storageId = bin2hex(random_bytes(16));
        try {
            $stmt = $this->pdo->prepare(
                'INSERT INTO file_homes '
                . '(user_id, principaluri, storage_id, status, created_at, quarantined_at) '
                . "VALUES (?, ?, ?, 'active', ?, NULL)"
            );
            $stmt->execute([$userId, $principalUri, $storageId, time()]);
        } catch (\PDOException $e) {
            $home = $this->findActiveByUserId($userId);
            if ($home === null) {
                throw $e;
            }

            return $home;
        }

        $home = $this->findActiveByUserId($userId);
        if ($home === null) {
            throw new \RuntimeException('Unable to create WebDAV file home metadata');
        }

        return $home;
    }

    public function quarantineUser(int $userId, string $principalUri): void {
        $home = $this->findActiveByUserId($userId);
        if ($home === null) {
            return;
        }

        $prefix = 'files/' . self::principalName($principalUri);
        $storageId = (string) $home['storage_id'];
        $this->withHomeMutationLock($storageId, function () use ($home, $prefix, $storageId) {
            $stmt = $this->pdo->prepare(
                "UPDATE file_homes SET user_id = NULL, status = 'quarantined', quarantined_at = ? "
                . "WHERE id = ? AND status = 'active'"
            );
            $stmt->execute([time(), $home['id']]);
            if ($stmt->rowCount() === 0) {
                return;
            }

            $source = $this->config->homePath($storageId);
            $destination = $this->config->quarantinedHomePath($storageId);
            if (file_exists($source) && !@rename($source, $destination)) {
                error_log('WebDAV file home was revoked but could not be moved to quarantine');
            }
            $temporary = $this->config->homeTemporaryPath($storageId);
            if (file_exists($temporary) || is_link($temporary)) {
                self::removeWithoutFollowingLinks($temporary);
            }

            $this->deletePathMetadata('propertystorage', $prefix);
            $this->deletePathMetadata('locks', $prefix);
        });
        @unlink($this->config->homeLockPath($storageId));
    }

    public static function revokeUserAccess(\PDO $pdo, int $userId): void {
        if (!SchemaManager::exists($pdo)) {
            return;
        }
        $stmt = $pdo->prepare(
            "UPDATE file_homes SET user_id = NULL, status = 'quarantined', quarantined_at = ? "
            . "WHERE user_id = ? AND status = 'active'"
        );
        $stmt->execute([time(), $userId]);
    }

    public function purgeExpiredQuarantine(int $limit = 100): int {
        $limit = max(1, min(1000, $limit));
        $cutoff = time() - ($this->config->getQuarantineDays() * 86400);
        $stmt = $this->pdo->prepare(
            "SELECT id, storage_id FROM file_homes "
            . "WHERE status IN ('quarantined', 'purging') "
            . 'AND quarantined_at IS NOT NULL AND quarantined_at <= ? '
            . 'ORDER BY quarantined_at ASC LIMIT ' . $limit
        );
        $stmt->execute([$cutoff]);
        $homes = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        $purged = 0;

        foreach ($homes as $home) {
            $mark = $this->pdo->prepare("UPDATE file_homes SET status = 'purging' WHERE id = ?");
            $mark->execute([$home['id']]);
            $storageId = (string) $home['storage_id'];
            try {
                $purged += $this->withHomeMutationLock($storageId, function () use ($home, $storageId) {
                    foreach ([
                        $this->config->quarantinedHomePath($storageId),
                        $this->config->homePath($storageId),
                        $this->config->homeTemporaryPath($storageId),
                    ] as $path) {
                        if (file_exists($path) || is_link($path)) {
                            self::removeWithoutFollowingLinks($path);
                        }
                    }
                    $delete = $this->pdo->prepare(
                        "DELETE FROM file_homes WHERE id = ? AND status = 'purging'"
                    );
                    $delete->execute([$home['id']]);

                    return $delete->rowCount();
                });
                @unlink($this->config->homeLockPath($storageId));
            } catch (\Throwable $e) {
                error_log('Unable to purge quarantined WebDAV file home');
            }
        }

        return $purged;
    }

    public function cleanupTemporaryFiles(int $olderThanSeconds = 86400, int $limit = 1000): int {
        $olderThanSeconds = max(3600, $olderThanSeconds);
        $limit = max(1, min(10000, $limit));
        $cutoff = time() - $olderThanSeconds;
        $removed = 0;
        $root = $this->config->temporaryPath();
        if (!is_dir($root)) {
            return 0;
        }

        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator(
                $root,
                \FilesystemIterator::CURRENT_AS_FILEINFO | \FilesystemIterator::SKIP_DOTS
            ),
            \RecursiveIteratorIterator::CHILD_FIRST
        );
        foreach ($iterator as $entry) {
            if ($removed >= $limit) {
                break;
            }
            if ($entry->isDir() && !$entry->isLink()) {
                @rmdir($entry->getPathname());
                continue;
            }
            if ($entry->getMTime() <= $cutoff && @unlink($entry->getPathname())) {
                ++$removed;
            }
        }

        return $removed;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function findActiveByUserId(int $userId): ?array {
        $stmt = $this->pdo->prepare(
            "SELECT id, user_id, principaluri, storage_id, status, created_at, quarantined_at "
            . "FROM file_homes WHERE user_id = ? AND status = 'active'"
        );
        $stmt->execute([$userId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $row === false ? null : $row;
    }

    private function userIdForPrincipal(string $principalUri): int {
        $username = self::principalName($principalUri);
        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE username = ?');
        $stmt->execute([$username]);
        $userId = $stmt->fetchColumn();
        if ($userId === false) {
            throw new \Sabre\DAV\Exception\NotFound('DAV user for file home was not found');
        }

        return (int) $userId;
    }

    private function deletePathMetadata(string $table, string $prefix): void {
        if ($table !== 'propertystorage' && $table !== 'locks') {
            throw new \InvalidArgumentException('Unsupported WebDAV metadata table');
        }
        $column = 'path';
        if ($table === 'locks') {
            $column = 'uri';
        }
        $stmt = $this->pdo->prepare(
            'DELETE FROM ' . $table . ' WHERE ' . $column . ' = ? '
            . "OR " . $column . " LIKE ? ESCAPE '='"
        );
        $stmt->execute([$prefix, self::escapeLike($prefix) . '/%']);
    }

    private static function principalName(string $principalUri): string {
        if (!preg_match('#^principals/([^/]+)$#', $principalUri, $matches)) {
            throw new \InvalidArgumentException('Invalid DAV principal URI for file home');
        }

        return $matches[1];
    }

    private static function escapeLike(string $value): string {
        return str_replace(['=', '%', '_'], ['==', '=%', '=_'], $value);
    }

    private static function removeWithoutFollowingLinks(string $path): void {
        if (is_link($path) || is_file($path)) {
            if (!unlink($path)) {
                throw new \RuntimeException('Unable to purge quarantined WebDAV file');
            }

            return;
        }
        if (!is_dir($path)) {
            return;
        }
        $iterator = new \FilesystemIterator(
            $path,
            \FilesystemIterator::CURRENT_AS_FILEINFO | \FilesystemIterator::SKIP_DOTS
        );
        foreach ($iterator as $entry) {
            self::removeWithoutFollowingLinks($entry->getPathname());
        }
        if (!rmdir($path)) {
            throw new \RuntimeException('Unable to purge quarantined WebDAV directory');
        }
    }

    private function withHomeMutationLock(string $storageId, callable $callback) {
        $lockPath = $this->config->homeLockPath($storageId);
        $handle = fopen($lockPath, 'c+');
        if ($handle === false) {
            throw new \RuntimeException('Unable to open WebDAV home lifecycle lock');
        }
        @chmod($lockPath, 0600);
        try {
            if (!flock($handle, LOCK_EX)) {
                throw new \RuntimeException('Unable to acquire WebDAV home lifecycle lock');
            }

            return $callback();
        } finally {
            @flock($handle, LOCK_UN);
            fclose($handle);
        }
    }
}
