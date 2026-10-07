<?php

namespace Baikal\Core\Files;

use Sabre\DAV\Exception\Conflict;
use Sabre\DAV\Exception\NotFound;

/**
 * Soft-deleted files and folders for one WebDAV home.
 *
 * Items live under the storage trash directory, outside the home, so clients
 * never see them. Bytes still count toward the home quota.
 */
class FileTrash {
    /** @var \PDO */
    private $pdo;

    /** @var FileStorageConfig */
    private $config;

    public function __construct(\PDO $pdo, FileStorageConfig $config) {
        $this->pdo = $pdo;
        $this->config = $config;
    }

    /**
     * Move a live home path into trash. Caller holds the home mutation lock.
     */
    public function capture(HomeStorage $storage, int $homeId, string $relativePath): void {
        $relativePath = trim(str_replace('\\', '/', $relativePath), '/');
        if ($relativePath === '' || $homeId <= 0) {
            throw new \InvalidArgumentException('Invalid trash capture');
        }
        $source = $storage->getPath($relativePath);
        if (is_link($source) || !file_exists($source)) {
            throw new NotFound('The WebDAV resource no longer exists');
        }

        $name = basename(str_replace('\\', '/', $relativePath));
        $token = bin2hex(random_bytes(16));
        $storageId = $storage->getStorageId();
        $itemDir = $this->itemDirectory($storageId, $token);
        $this->createPrivateDirectory($this->config->trashHomePath($storageId));
        $this->createPrivateDirectory($itemDir);
        $stored = $itemDir . DIRECTORY_SEPARATOR . $name;
        if (!@rename($source, $stored)) {
            $this->removeTree($itemDir);
            throw new \RuntimeException('Unable to move WebDAV resource to trash');
        }

        try {
            $size = $storage->sizeOfTree($stored);
            $stmt = $this->pdo->prepare(
                'INSERT INTO file_trash '
                . '(home_id, token, original_path, name, is_directory, size_bytes, deleted_at) '
                . 'VALUES (?, ?, ?, ?, ?, ?, ?)'
            );
            $stmt->execute([
                $homeId,
                $token,
                $relativePath,
                $name,
                is_dir($stored) ? 1 : 0,
                $size,
                time(),
            ]);
        } catch (\Throwable $e) {
            if (file_exists($stored) && !@rename($stored, $source)) {
                error_log('WebDAV trash rollback could not return the item to its home');
            }
            $this->removeTree($itemDir);
            throw $e;
        }
    }

    /**
     * @return list<array{id: int, name: string, path: string, directory: bool, size: int, deletedAt: int, expiresAt: int}>
     */
    public function listForHome(int $homeId): array {
        if ($homeId <= 0) {
            return [];
        }
        $stmt = $this->pdo->prepare(
            'SELECT id, original_path, name, is_directory, size_bytes, deleted_at '
            . 'FROM file_trash WHERE home_id = ? ORDER BY deleted_at DESC, id DESC'
        );
        $stmt->execute([$homeId]);
        $days = $this->config->getTrashDays();
        $items = [];
        foreach ($stmt->fetchAll(\PDO::FETCH_ASSOC) as $row) {
            $deletedAt = (int) $row['deleted_at'];
            $items[] = [
                'id'        => (int) $row['id'],
                'name'      => (string) $row['name'],
                'path'      => (string) $row['original_path'],
                'directory' => (int) $row['is_directory'] === 1,
                'size'      => (int) $row['size_bytes'],
                'deletedAt' => $deletedAt,
                'expiresAt' => $deletedAt + ($days * 86400),
            ];
        }

        return $items;
    }

    /**
     * @return array{path: string, name: string, renamed: bool}
     */
    public function restore(HomeStorage $storage, int $homeId, int $id): array {
        return $storage->mutate(function () use ($storage, $homeId, $id) {
            $row = $this->requireRow($homeId, $id);
            $itemDir = $this->itemDirectory($storage->getStorageId(), (string) $row['token']);
            $source = $itemDir . DIRECTORY_SEPARATOR . $row['name'];
            if (is_link($source) || !file_exists($source)) {
                throw new NotFound('The trashed item no longer exists');
            }
            $original = (string) $row['original_path'];
            $storage->makeParentDirectories($original);
            $destRel = $this->freeRestorePath($storage, $original);
            if (!@rename($source, $storage->getPath($destRel))) {
                throw new \RuntimeException('Unable to restore trashed item');
            }
            @rmdir($itemDir);
            $this->deleteRow($homeId, $id);

            return [
                'path'    => $destRel,
                'name'    => basename(str_replace('\\', '/', $destRel)),
                'renamed' => $destRel !== $original,
            ];
        });
    }

    public function destroy(HomeStorage $storage, int $homeId, int $id): void {
        $storage->mutate(function () use ($storage, $homeId, $id) {
            $row = $this->requireRow($homeId, $id);
            $this->removeToken($storage->getStorageId(), (string) $row['token']);
            $this->deleteRow($homeId, $id);
        });
    }

    public function emptyHome(HomeStorage $storage, int $homeId): int {
        return (int) $storage->mutate(function () use ($storage, $homeId) {
            $stmt = $this->pdo->prepare('SELECT id, token FROM file_trash WHERE home_id = ?');
            $stmt->execute([$homeId]);
            $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            foreach ($rows as $row) {
                $this->removeToken($storage->getStorageId(), (string) $row['token']);
                $this->deleteRow($homeId, (int) $row['id']);
            }

            return count($rows);
        });
    }

    /**
     * Drop metadata and tuck the trash directory into a quarantined home.
     * Caller holds the home lifecycle lock. $quarantinePath is the moved home.
     */
    public function absorbLocked(int $homeId, string $storageId, string $quarantinePath): void {
        $stmt = $this->pdo->prepare('DELETE FROM file_trash WHERE home_id = ?');
        $stmt->execute([$homeId]);
        $trashHome = $this->config->trashHomePath($storageId);
        if (!file_exists($trashHome) && !is_link($trashHome)) {
            return;
        }
        if (is_dir($quarantinePath) && !is_link($quarantinePath)) {
            $into = $quarantinePath . DIRECTORY_SEPARATOR . '.angara-trash';
            if (!file_exists($into) && !is_link($into) && @rename($trashHome, $into)) {
                return;
            }
        }
        $this->removeTree($trashHome);
    }

    public function purgeExpired(int $limit = 200): int {
        $limit = max(1, min(1000, $limit));
        $cutoff = time() - ($this->config->getTrashDays() * 86400);
        $stmt = $this->pdo->prepare(
            'SELECT t.id, t.token, h.storage_id FROM file_trash t '
            . 'INNER JOIN file_homes h ON h.id = t.home_id '
            . "WHERE h.status = 'active' AND t.deleted_at <= ? "
            . 'ORDER BY t.deleted_at ASC LIMIT ' . $limit
        );
        $stmt->execute([$cutoff]);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        $purged = 0;
        $open = [];
        foreach ($rows as $row) {
            $storageId = (string) $row['storage_id'];
            try {
                if (!isset($open[$storageId])) {
                    $open[$storageId] = new HomeStorage($this->config, $storageId);
                }
                $storage = $open[$storageId];
                $storage->mutate(function () use ($storage, $row) {
                    $this->removeToken($storage->getStorageId(), (string) $row['token']);
                    $delete = $this->pdo->prepare('DELETE FROM file_trash WHERE id = ?');
                    $delete->execute([(int) $row['id']]);
                });
                ++$purged;
            } catch (\Throwable $e) {
                error_log('Unable to purge expired WebDAV trash item');
            }
        }

        return $purged;
    }

    /**
     * @return array{id: int, token: string, original_path: string, name: string}
     */
    private function requireRow(int $homeId, int $id): array {
        $stmt = $this->pdo->prepare(
            'SELECT id, token, original_path, name FROM file_trash WHERE id = ? AND home_id = ?'
        );
        $stmt->execute([$id, $homeId]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if ($row === false) {
            throw new NotFound('Trashed item not found');
        }

        return [
            'id'            => (int) $row['id'],
            'token'         => (string) $row['token'],
            'original_path' => (string) $row['original_path'],
            'name'          => (string) $row['name'],
        ];
    }

    private function deleteRow(int $homeId, int $id): void {
        $stmt = $this->pdo->prepare('DELETE FROM file_trash WHERE id = ? AND home_id = ?');
        $stmt->execute([$id, $homeId]);
    }

    private function freeRestorePath(HomeStorage $storage, string $originalPath): string {
        $parent = str_contains($originalPath, '/') ? dirname($originalPath) : '';
        if ($parent === '.' || $parent === '/') {
            $parent = '';
        }
        $name = basename(str_replace('\\', '/', $originalPath));
        if (!$storage->isVisibleChild($parent === '' ? $name : $parent . '/' . $name)) {
            return $parent === '' ? $name : $parent . '/' . $name;
        }

        $dot = strrpos($name, '.');
        $hasExt = $dot !== false && $dot > 0;
        $stem = $hasExt ? substr($name, 0, $dot) : $name;
        $ext = $hasExt ? substr($name, $dot) : '';
        for ($n = 1; $n < 1000; ++$n) {
            $candidate = $n === 1
                ? $stem . ' (restored)' . $ext
                : $stem . ' (restored ' . $n . ')' . $ext;
            try {
                $rel = $storage->childPath($parent, $candidate);
            } catch (\Throwable $e) {
                continue;
            }
            if (!$storage->isVisibleChild($rel)) {
                return $rel;
            }
        }

        throw new Conflict('Unable to choose a restored name');
    }

    private function itemDirectory(string $storageId, string $token): string {
        if (!preg_match('/^[a-f0-9]{32}$/', $token)) {
            throw new \InvalidArgumentException('Invalid trash token');
        }

        return $this->config->trashItemPath($storageId, $token);
    }

    private function removeToken(string $storageId, string $token): void {
        $dir = $this->itemDirectory($storageId, $token);
        if (file_exists($dir) || is_link($dir)) {
            $this->removeTree($dir);
        }
    }

    private function createPrivateDirectory(string $path): void {
        if (!is_dir($path) && !mkdir($path, 0700, true) && !is_dir($path)) {
            throw new \RuntimeException('Unable to create WebDAV trash directory');
        }
        @chmod($path, 0700);
    }

    private function removeTree(string $path): void {
        if (is_link($path) || is_file($path)) {
            if (!@unlink($path)) {
                throw new \RuntimeException('Unable to delete trashed WebDAV item');
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
            $this->removeTree($entry->getPathname());
        }
        if (!@rmdir($path)) {
            throw new \RuntimeException('Unable to delete trashed WebDAV directory');
        }
    }
}
