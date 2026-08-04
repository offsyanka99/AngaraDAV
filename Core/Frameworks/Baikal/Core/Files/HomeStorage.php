<?php

namespace Baikal\Core\Files;

use Sabre\DAV\Exception\Conflict;
use Sabre\DAV\Exception\Forbidden;
use Sabre\DAV\Exception\InsufficientStorage;
use Sabre\DAV\Exception\NotFound;

/**
 * Filesystem policy and atomic mutation boundary for one DAV file home.
 */
class HomeStorage {
    const MAX_PATH_BYTES = 4096;
    const MAX_SEGMENT_BYTES = 255;
    const MAX_DEPTH = 64;

    /** @var FileStorageConfig */
    private $config;

    /** @var string */
    private $storageId;

    /** @var string */
    private $homePath;

    /** @var string */
    private $temporaryPath;

    public function __construct(FileStorageConfig $config, string $storageId) {
        $this->config = $config;
        $this->storageId = $storageId;
        $this->homePath = $config->homePath($storageId);
        $this->temporaryPath = $config->homeTemporaryPath($storageId);
        $this->createPrivateDirectory($this->homePath);
        $this->createPrivateDirectory($this->temporaryPath);

        if (is_link($this->homePath) || realpath($this->homePath) === false) {
            throw new \RuntimeException('Unsafe WebDAV file home');
        }
        $this->homePath = rtrim((string) realpath($this->homePath), '/\\');
    }

    public function getPath(string $relativePath = ''): string {
        $relativePath = $this->validateRelativePath($relativePath);

        return $relativePath === ''
            ? $this->homePath
            : $this->homePath . DIRECTORY_SEPARATOR . str_replace('/', DIRECTORY_SEPARATOR, $relativePath);
    }

    public function childPath(string $parentPath, string $name): string {
        $this->validateName($name);

        return $this->validateRelativePath(
            $parentPath === '' ? $name : $parentPath . '/' . $name
        );
    }

    public function isVisibleChild(string $relativePath): bool {
        $path = $this->getPath($relativePath);

        return file_exists($path) && !is_link($path);
    }

    /**
     * @param resource|string|null $data
     */
    public function writeFile(string $relativePath, $data, bool $replace): string {
        $relativePath = $this->validateRelativePath($relativePath);
        $targetPath = $this->getPath($relativePath);
        $this->assertParentDirectory($targetPath);

        return $this->withMutationLock(function () use ($relativePath, $targetPath, $data, $replace) {
            clearstatcache(true, $targetPath);
            if (is_link($targetPath)) {
                throw new Forbidden('Symbolic links are not available through WebDAV');
            }
            if (!$replace && file_exists($targetPath)) {
                throw new Conflict('The destination already exists');
            }
            if ($replace && !is_file($targetPath)) {
                throw new NotFound('The file no longer exists');
            }

            $oldSize = is_file($targetPath) ? (int) filesize($targetPath) : 0;
            $usedWithoutTarget = max(0, $this->calculateUsage() - $oldSize);
            $temporaryFile = $this->newTemporaryFile();

            try {
                $bytes = $this->copyRequestBody($data, $temporaryFile, $usedWithoutTarget);
                if ($bytes > $this->config->getMaxUploadBytes()) {
                    throw new PayloadTooLarge('WebDAV file exceeds the configured maximum size');
                }
                @chmod($temporaryFile, 0600);
                if (!@rename($temporaryFile, $targetPath)) {
                    throw new \RuntimeException('Unable to install completed WebDAV upload');
                }
                clearstatcache(true, $targetPath);

                return $this->etag($relativePath);
            } finally {
                if (file_exists($temporaryFile)) {
                    @unlink($temporaryFile);
                }
            }
        });
    }

    public function createDirectory(string $relativePath): void {
        $relativePath = $this->validateRelativePath($relativePath);
        $path = $this->getPath($relativePath);
        $this->assertParentDirectory($path);

        $this->withMutationLock(function () use ($path) {
            if (file_exists($path) || is_link($path)) {
                throw new Conflict('The destination already exists');
            }
            if (!mkdir($path, 0700)) {
                throw new \RuntimeException('Unable to create WebDAV directory');
            }
            @chmod($path, 0700);
        });
    }

    public function delete(string $relativePath): void {
        $relativePath = $this->validateRelativePath($relativePath);
        if ($relativePath === '') {
            throw new Forbidden('A WebDAV file home cannot be deleted');
        }

        $this->withMutationLock(function () use ($relativePath) {
            $path = $this->getPath($relativePath);
            if (!file_exists($path) && !is_link($path)) {
                throw new NotFound('The WebDAV resource no longer exists');
            }
            $this->removeWithoutFollowingLinks($path);
        });
    }

    public function rename(string $sourcePath, string $destinationPath): void {
        $sourcePath = $this->validateRelativePath($sourcePath);
        $destinationPath = $this->validateRelativePath($destinationPath);
        if ($sourcePath === '' || $destinationPath === '') {
            throw new Forbidden('A WebDAV file home cannot be moved');
        }

        $this->withMutationLock(function () use ($sourcePath, $destinationPath) {
            $source = $this->getPath($sourcePath);
            $destination = $this->getPath($destinationPath);
            $this->assertParentDirectory($destination);
            if (is_link($source) || !file_exists($source)) {
                throw new NotFound('The WebDAV resource no longer exists');
            }
            if (file_exists($destination) || is_link($destination)) {
                throw new Conflict('The destination already exists');
            }
            if (!rename($source, $destination)) {
                throw new \RuntimeException('Unable to move WebDAV resource');
            }
        });
    }

    /**
     * Copy a file or directory tree within this home (no symlink following).
     */
    public function copy(string $sourcePath, string $destinationPath): void {
        $sourcePath = $this->validateRelativePath($sourcePath);
        $destinationPath = $this->validateRelativePath($destinationPath);
        if ($sourcePath === '' || $destinationPath === '') {
            throw new Forbidden('A WebDAV file home cannot be copied onto itself as the root');
        }
        // Destination must not be inside source for directories
        if ($destinationPath === $sourcePath
            || str_starts_with($destinationPath . '/', $sourcePath . '/')
        ) {
            throw new Forbidden('Cannot copy a resource into itself');
        }

        $this->withMutationLock(function () use ($sourcePath, $destinationPath) {
            $source = $this->getPath($sourcePath);
            $destination = $this->getPath($destinationPath);
            $this->assertParentDirectory($destination);
            if (is_link($source) || !file_exists($source)) {
                throw new NotFound('The WebDAV resource no longer exists');
            }
            if (file_exists($destination) || is_link($destination)) {
                throw new Conflict('The destination already exists');
            }

            $bytesNeeded = $this->sizeOfTree($source);
            $quota = $this->config->getQuotaBytes();
            if ($quota > 0 && $this->calculateUsage() + $bytesNeeded > $quota) {
                throw new InsufficientStorage('WebDAV file home quota exceeded');
            }
            if (is_file($source)) {
                if ($bytesNeeded > $this->config->getMaxUploadBytes()) {
                    throw new PayloadTooLarge('WebDAV file exceeds the configured maximum size');
                }
                if (!@copy($source, $destination)) {
                    throw new \RuntimeException('Unable to copy WebDAV file');
                }
                @chmod($destination, 0600);

                return;
            }
            if (!is_dir($source)) {
                throw new NotFound('The WebDAV resource no longer exists');
            }
            $this->copyDirectoryTree($source, $destination);
        });
    }

    /**
     * Bytes used by a file, or total file bytes under a directory (no symlinks).
     */
    public function sizeOfTree(string $absolutePath): int {
        if (is_link($absolutePath)) {
            return 0;
        }
        if (is_file($absolutePath)) {
            return (int) filesize($absolutePath);
        }
        if (!is_dir($absolutePath)) {
            return 0;
        }
        $bytes = 0;
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator(
                $absolutePath,
                \FilesystemIterator::CURRENT_AS_FILEINFO | \FilesystemIterator::SKIP_DOTS
            ),
            \RecursiveIteratorIterator::LEAVES_ONLY
        );
        foreach ($iterator as $entry) {
            if ($entry->isLink() || !$entry->isFile()) {
                continue;
            }
            $bytes += $entry->getSize();
        }

        return $bytes;
    }

    private function copyDirectoryTree(string $source, string $destination): void {
        if (!mkdir($destination, 0700) && !is_dir($destination)) {
            throw new \RuntimeException('Unable to create WebDAV directory copy');
        }
        @chmod($destination, 0700);
        $iterator = new \FilesystemIterator(
            $source,
            \FilesystemIterator::CURRENT_AS_FILEINFO | \FilesystemIterator::SKIP_DOTS
        );
        foreach ($iterator as $entry) {
            if ($entry->isLink()) {
                continue;
            }
            $destChild = $destination . DIRECTORY_SEPARATOR . $entry->getFilename();
            if ($entry->isDir()) {
                $this->copyDirectoryTree($entry->getPathname(), $destChild);
            } elseif ($entry->isFile()) {
                if ($entry->getSize() > $this->config->getMaxUploadBytes()) {
                    throw new PayloadTooLarge('WebDAV file exceeds the configured maximum size');
                }
                if (!@copy($entry->getPathname(), $destChild)) {
                    throw new \RuntimeException('Unable to copy WebDAV file');
                }
                @chmod($destChild, 0600);
            }
        }
    }

    public function etag(string $relativePath): string {
        $path = $this->getPath($relativePath);
        if (!is_file($path) || is_link($path)) {
            throw new NotFound('The WebDAV file no longer exists');
        }
        $stat = stat($path);
        if ($stat === false) {
            throw new NotFound('The WebDAV file no longer exists');
        }

        return '"' . sha1($stat['ino'] . ':' . $stat['size'] . ':' . $stat['mtime']) . '"';
    }

    /**
     * @return array{0: int, 1: int}
     */
    public function quotaInfo(): array {
        $used = $this->calculateUsage();
        $diskFree = @disk_free_space($this->homePath);
        $available = $diskFree === false ? 0 : max(0, (int) $diskFree);
        $quota = $this->config->getQuotaBytes();
        if ($quota > 0) {
            $available = min($available, max(0, $quota - $used));
        }

        return [$used, $available];
    }

    public function usage(): int {
        return $this->calculateUsage();
    }

    public function sameHome(HomeStorage $other): bool {
        return $this->storageId === $other->storageId;
    }

    private function validateRelativePath(string $relativePath): string {
        $relativePath = trim(str_replace('\\', '/', $relativePath), '/');
        if ($relativePath === '') {
            return '';
        }
        if (strlen($relativePath) > self::MAX_PATH_BYTES) {
            throw new Forbidden('WebDAV path is too long');
        }
        $segments = explode('/', $relativePath);
        if (count($segments) > self::MAX_DEPTH) {
            throw new Forbidden('WebDAV directory depth is too large');
        }
        foreach ($segments as $segment) {
            $this->validateName($segment);
        }

        return implode('/', $segments);
    }

    private function validateName(string $name): void {
        if ($name === '' || $name === '.' || $name === '..') {
            throw new Forbidden('Invalid WebDAV resource name');
        }
        if (strlen($name) > self::MAX_SEGMENT_BYTES) {
            throw new Forbidden('WebDAV resource name is too long');
        }
        if (preg_match('/[\x00-\x1F\x7F\/\\\\]/', $name)) {
            throw new Forbidden('WebDAV resource name contains unsupported characters');
        }
        if (rtrim($name, '. ') !== $name) {
            throw new Forbidden('WebDAV resource names cannot end with a dot or space');
        }
    }

    private function assertParentDirectory(string $targetPath): void {
        $parent = dirname($targetPath);
        $resolvedParent = realpath($parent);
        if ($resolvedParent === false || is_link($parent) || !is_dir($resolvedParent)) {
            throw new Conflict('The parent WebDAV collection does not exist');
        }
        if (!$this->pathContains($this->homePath, $resolvedParent)) {
            throw new Forbidden('WebDAV path escapes its file home');
        }
    }

    private function copyRequestBody($data, string $temporaryFile, int $usedWithoutTarget): int {
        $output = fopen($temporaryFile, 'xb');
        if ($output === false) {
            throw new \RuntimeException('Unable to create WebDAV upload temporary file');
        }

        $bytes = 0;
        try {
            if ($data === null) {
                $data = '';
            }
            if (is_string($data)) {
                $this->checkWriteLimit(strlen($data), $usedWithoutTarget);
                $this->writeAll($output, $data);
                $bytes = strlen($data);
            } elseif (is_resource($data)) {
                while (!feof($data)) {
                    $chunk = fread($data, 1048576);
                    if ($chunk === false) {
                        throw new \RuntimeException('Unable to read WebDAV request body');
                    }
                    if ($chunk === '') {
                        continue;
                    }
                    $bytes += strlen($chunk);
                    $this->checkWriteLimit($bytes, $usedWithoutTarget);
                    $this->writeAll($output, $chunk);
                }
            } else {
                throw new \InvalidArgumentException('Invalid WebDAV request body');
            }
            if (!fflush($output)) {
                throw new InsufficientStorage('Unable to flush WebDAV upload');
            }
            if (function_exists('fsync') && !fsync($output)) {
                throw new InsufficientStorage('Unable to synchronize WebDAV upload');
            }
        } finally {
            fclose($output);
        }

        return $bytes;
    }

    private function checkWriteLimit(int $fileBytes, int $usedWithoutTarget): void {
        if ($fileBytes > $this->config->getMaxUploadBytes()) {
            throw new PayloadTooLarge('WebDAV file exceeds the configured maximum size');
        }
        $quota = $this->config->getQuotaBytes();
        if ($quota > 0 && $usedWithoutTarget + $fileBytes > $quota) {
            throw new InsufficientStorage('WebDAV file home quota exceeded');
        }
    }

    /** @param resource $stream */
    private function writeAll($stream, string $data): void {
        $offset = 0;
        $length = strlen($data);
        while ($offset < $length) {
            $written = fwrite($stream, substr($data, $offset));
            if ($written === false || $written === 0) {
                throw new InsufficientStorage('Unable to write WebDAV upload');
            }
            $offset += $written;
        }
    }

    private function newTemporaryFile(): string {
        for ($attempt = 0; $attempt < 10; ++$attempt) {
            $path = $this->temporaryPath . DIRECTORY_SEPARATOR . bin2hex(random_bytes(16)) . '.upload';
            if (!file_exists($path)) {
                return $path;
            }
        }

        throw new \RuntimeException('Unable to allocate WebDAV upload temporary file');
    }

    private function calculateUsage(): int {
        $bytes = 0;
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator(
                $this->homePath,
                \FilesystemIterator::CURRENT_AS_FILEINFO | \FilesystemIterator::SKIP_DOTS
            ),
            \RecursiveIteratorIterator::LEAVES_ONLY
        );
        foreach ($iterator as $entry) {
            if ($entry->isLink() || !$entry->isFile()) {
                continue;
            }
            $bytes += $entry->getSize();
        }

        return $bytes;
    }

    private function removeWithoutFollowingLinks(string $path): void {
        if (is_link($path) || is_file($path)) {
            if (!unlink($path)) {
                throw new \RuntimeException('Unable to delete WebDAV file');
            }

            return;
        }
        if (!is_dir($path)) {
            throw new NotFound('The WebDAV resource no longer exists');
        }
        $iterator = new \FilesystemIterator($path, \FilesystemIterator::CURRENT_AS_FILEINFO | \FilesystemIterator::SKIP_DOTS);
        foreach ($iterator as $entry) {
            $this->removeWithoutFollowingLinks($entry->getPathname());
        }
        if (!rmdir($path)) {
            throw new \RuntimeException('Unable to delete WebDAV directory');
        }
    }

    private function withMutationLock(callable $callback) {
        $lockPath = $this->config->homeLockPath($this->storageId);
        $handle = fopen($lockPath, 'c+');
        if ($handle === false) {
            throw new \RuntimeException('Unable to open WebDAV home mutation lock');
        }
        @chmod($lockPath, 0600);
        try {
            if (!flock($handle, LOCK_EX)) {
                throw new \RuntimeException('Unable to acquire WebDAV home mutation lock');
            }

            return $callback();
        } finally {
            @flock($handle, LOCK_UN);
            fclose($handle);
        }
    }

    private function createPrivateDirectory(string $path): void {
        if (!is_dir($path) && !mkdir($path, 0700, true) && !is_dir($path)) {
            throw new \RuntimeException('Unable to create WebDAV home directory');
        }
        @chmod($path, 0700);
    }

    private function pathContains(string $parent, string $path): bool {
        $parent = rtrim(str_replace('\\', '/', $parent), '/');
        $path = rtrim(str_replace('\\', '/', $path), '/');
        if (DIRECTORY_SEPARATOR === '\\') {
            $parent = strtolower($parent);
            $path = strtolower($path);
        }

        return $path === $parent || str_starts_with($path, $parent . '/');
    }
}
