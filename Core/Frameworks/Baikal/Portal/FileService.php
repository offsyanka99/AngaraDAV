<?php

namespace Baikal\Portal;

use Baikal\Core\Files\FileStorageConfig;
use Baikal\Core\Files\HomeRepository;
use Baikal\Core\Files\HomeStorage;
use Baikal\Core\Files\PayloadTooLarge;
use Baikal\Core\Files\SchemaManager;
use Sabre\DAV\Exception\Conflict;
use Sabre\DAV\Exception\Forbidden;
use Sabre\DAV\Exception\InsufficientStorage;
use Sabre\DAV\Exception\NotFound;

/**
 * Portal API for private WebDAV file homes (same storage as /dav.php/files/{user}/).
 */
class FileService {
    /** @var \PDO */
    private $pdo;

    /** @var array<string, mixed> */
    private $config;

    /** @var FileStorageConfig|null */
    private $fileConfig;

    /** @var bool */
    private $initAttempted = false;

    /** @var string|null */
    private $initError;

    public function __construct(\PDO $pdo, array $config) {
        $this->pdo = $pdo;
        $this->config = $config;
    }

    /**
     * Feature flag + quota/limits for the portal Files tab.
     *
     * @return array{
     *   enabled: bool,
     *   ready: bool,
     *   error: string|null,
     *   davPath: string,
     *   maxUploadBytes: int,
     *   quotaBytes: int,
     *   usedBytes: int,
     *   availableBytes: int
     * }
     */
    public function status(string $username): array {
        $username = $this->assertUsername($username);
        $enabled = $this->isEnabledInConfig();
        $davPath = '/dav.php/files/' . rawurlencode($username) . '/';

        if (!$enabled) {
            return [
                'enabled'        => false,
                'ready'          => false,
                'error'          => null,
                'davPath'        => $davPath,
                'maxUploadBytes' => 0,
                'quotaBytes'     => 0,
                'usedBytes'      => 0,
                'availableBytes' => 0,
            ];
        }

        try {
            $storage = $this->storageFor($username);
            $cfg = $this->requireFileConfig();
            [$used, $available] = $storage->quotaInfo();

            return [
                'enabled'        => true,
                'ready'          => true,
                'error'          => null,
                'davPath'        => $davPath,
                'maxUploadBytes' => $cfg->getMaxUploadBytes(),
                'quotaBytes'     => $cfg->getQuotaBytes(),
                'usedBytes'      => $used,
                'availableBytes' => $available,
            ];
        } catch (ApiException $e) {
            return [
                'enabled'        => true,
                'ready'          => false,
                'error'          => $e->getMessage(),
                'davPath'        => $davPath,
                'maxUploadBytes' => 0,
                'quotaBytes'     => 0,
                'usedBytes'      => 0,
                'availableBytes' => 0,
            ];
        } catch (\Throwable $e) {
            error_log('AngaraDAV portal files status: ' . $e->getMessage());

            return [
                'enabled'        => true,
                'ready'          => false,
                'error'          => 'WebDAV file storage is not available',
                'davPath'        => $davPath,
                'maxUploadBytes' => 0,
                'quotaBytes'     => 0,
                'usedBytes'      => 0,
                'availableBytes' => 0,
            ];
        }
    }

    /**
     * List files and folders under a relative path ("" = home root).
     *
     * @return array{path: string, entries: list<array<string, mixed>>}
     */
    public function listEntries(string $username, string $path = ''): array {
        $username = $this->assertUsername($username);
        $storage = $this->storageFor($username);
        $relative = $this->normalizeListPath($path);
        $absolute = $storage->getPath($relative);

        if ($relative !== '' && (!$storage->isVisibleChild($relative) || !is_dir($absolute) || is_link($absolute))) {
            throw new ApiException('Folder not found', 404);
        }

        $entries = [];
        $iterator = new \FilesystemIterator(
            $absolute,
            \FilesystemIterator::CURRENT_AS_FILEINFO | \FilesystemIterator::SKIP_DOTS
        );
        foreach ($iterator as $entry) {
            if ($entry->isLink()) {
                continue;
            }
            $name = $entry->getFilename();
            $childRel = $relative === '' ? $name : $relative . '/' . $name;
            $isDir = $entry->isDir();
            $item = [
                'name'  => $name,
                'path'  => $childRel,
                'type'  => $isDir ? 'dir' : 'file',
                'size'  => $isDir ? 0 : (int) $entry->getSize(),
                'mtime' => (int) $entry->getMTime(),
            ];
            if (!$isDir) {
                try {
                    $item['etag'] = $storage->etag($childRel);
                } catch (\Throwable $e) {
                    $item['etag'] = null;
                }
            }
            $entries[] = $item;
        }

        usort($entries, static function (array $a, array $b): int {
            if ($a['type'] !== $b['type']) {
                return $a['type'] === 'dir' ? -1 : 1;
            }

            return strcasecmp((string) $a['name'], (string) $b['name']);
        });

        return [
            'path'    => $relative,
            'entries' => $entries,
        ];
    }

    /**
     * @return array{path: string, name: string, type: string}
     */
    public function createDirectory(string $username, string $parentPath, string $name): array {
        $username = $this->assertUsername($username);
        $storage = $this->storageFor($username);
        $parent = $this->normalizeListPath($parentPath);
        $name = $this->assertName($name);

        try {
            $child = $storage->childPath($parent, $name);
            $storage->createDirectory($child);
        } catch (\Throwable $e) {
            throw $this->mapStorageException($e);
        }

        return [
            'path' => $child,
            'name' => $name,
            'type' => 'dir',
        ];
    }

    /**
     * Write or replace a file from a string or open stream resource.
     *
     * @param resource|string $data
     *
     * @return array{path: string, name: string, type: string, etag: string, size: int}
     */
    public function writeFile(string $username, string $parentPath, string $name, $data, bool $replace = false): array {
        $username = $this->assertUsername($username);
        $storage = $this->storageFor($username);
        $parent = $this->normalizeListPath($parentPath);
        $name = $this->assertName($name);

        try {
            $child = $storage->childPath($parent, $name);
            $exists = $storage->isVisibleChild($child) && is_file($storage->getPath($child));
            // HomeStorage: replace=true means "overwrite existing file only";
            // replace=false means "create new (fail if present)".
            // Never pass replace=true for a missing path — that yields "The file no longer exists".
            if ($exists && !$replace) {
                throw new ApiException('A file with this name already exists', 409);
            }
            $etag = $storage->writeFile($child, $data, $exists);
            $size = 0;
            $path = $storage->getPath($child);
            if (is_file($path)) {
                $size = (int) filesize($path);
            }
        } catch (\Throwable $e) {
            throw $this->mapStorageException($e);
        }

        return [
            'path' => $child,
            'name' => $name,
            'type' => 'file',
            'etag' => $etag,
            'size' => $size,
        ];
    }

    /**
     * Absolute filesystem path + metadata for streaming download.
     *
     * @return array{absolutePath: string, name: string, path: string, size: int, mtime: int, contentType: string, etag: string}
     */
    public function openDownload(string $username, string $path): array {
        $username = $this->assertUsername($username);
        $storage = $this->storageFor($username);
        $relative = $this->normalizeListPath($path);
        if ($relative === '') {
            throw new ApiException('Choose a file to download', 400);
        }

        try {
            if (!$storage->isVisibleChild($relative)) {
                throw new NotFound('File not found');
            }
            $absolute = $storage->getPath($relative);
            if (!is_file($absolute) || is_link($absolute)) {
                throw new NotFound('File not found');
            }
            $etag = $storage->etag($relative);
        } catch (\Throwable $e) {
            throw $this->mapStorageException($e);
        }

        $name = basename(str_replace('\\', '/', $relative));
        $contentType = 'application/octet-stream';
        if (class_exists(\finfo::class)) {
            $finfo = new \finfo(FILEINFO_MIME_TYPE);
            $detected = $finfo->file($absolute);
            if (is_string($detected) && $detected !== '' && $detected !== 'inode/x-empty') {
                $contentType = $detected;
            }
        }

        return [
            'absolutePath' => $absolute,
            'name'         => $name,
            'path'         => $relative,
            'size'         => (int) filesize($absolute),
            'mtime'        => (int) filemtime($absolute),
            'contentType'  => $contentType,
            'etag'         => $etag,
        ];
    }

    /**
     * MIME type safe to send with Content-Disposition: inline (portal file viewer).
     *
     * HTML, JavaScript, and SVG are forced to text/plain so they cannot execute
     * if the browser navigates to the download URL or embeds it.
     */
    public static function contentTypeForInline(string $filename, string $detected): string {
        $detected = strtolower(trim(explode(';', $detected)[0]));
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));

        $byExt = [
            'jpg'  => 'image/jpeg',
            'jpeg' => 'image/jpeg',
            'jfif' => 'image/jpeg',
            'png'  => 'image/png',
            'gif'  => 'image/gif',
            'webp' => 'image/webp',
            'bmp'  => 'image/bmp',
            'avif' => 'image/avif',
            'ico'  => 'image/x-icon',
            'pdf'  => 'application/pdf',
            'mp3'  => 'audio/mpeg',
            'wav'  => 'audio/wav',
            'ogg'  => 'audio/ogg',
            'oga'  => 'audio/ogg',
            'flac' => 'audio/flac',
            'aac'  => 'audio/aac',
            'm4a'  => 'audio/mp4',
            'opus' => 'audio/ogg',
            'weba' => 'audio/webm',
            'mp4'  => 'video/mp4',
            'm4v'  => 'video/mp4',
            'webm' => 'video/webm',
            'ogv'  => 'video/ogg',
            'mov'  => 'video/quicktime',
            'txt'  => 'text/plain; charset=utf-8',
            'md'   => 'text/plain; charset=utf-8',
            'csv'  => 'text/csv; charset=utf-8',
            'tsv'  => 'text/plain; charset=utf-8',
            'json' => 'application/json; charset=utf-8',
            'xml'  => 'text/plain; charset=utf-8',
            'yml'  => 'text/plain; charset=utf-8',
            'yaml' => 'text/plain; charset=utf-8',
            'css'  => 'text/plain; charset=utf-8',
            'html' => 'text/plain; charset=utf-8',
            'htm'  => 'text/plain; charset=utf-8',
            'js'   => 'text/plain; charset=utf-8',
            'mjs'  => 'text/plain; charset=utf-8',
            'ts'   => 'text/plain; charset=utf-8',
            'tsx'  => 'text/plain; charset=utf-8',
            'jsx'  => 'text/plain; charset=utf-8',
            'svg'  => 'text/plain; charset=utf-8',
            'php'  => 'text/plain; charset=utf-8',
            'py'   => 'text/plain; charset=utf-8',
            'sh'   => 'text/plain; charset=utf-8',
            'log'  => 'text/plain; charset=utf-8',
        ];
        if ($ext !== '' && isset($byExt[$ext])) {
            return $byExt[$ext];
        }

        $unsafe = [
            'text/html',
            'application/javascript',
            'text/javascript',
            'application/x-javascript',
            'image/svg+xml',
            'application/xhtml+xml',
        ];
        if (in_array($detected, $unsafe, true)) {
            return 'text/plain; charset=utf-8';
        }

        $safe = [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/bmp',
            'image/avif',
            'image/x-icon',
            'application/pdf',
            'text/plain',
            'text/csv',
            'text/css',
            'text/markdown',
            'application/json',
            'audio/mpeg',
            'audio/ogg',
            'audio/wav',
            'audio/webm',
            'audio/mp4',
            'audio/flac',
            'audio/aac',
            'video/mp4',
            'video/webm',
            'video/ogg',
            'video/quicktime',
        ];
        if (in_array($detected, $safe, true)) {
            return $detected;
        }
        if (str_starts_with($detected, 'text/')) {
            return 'text/plain; charset=utf-8';
        }
        if (
            (str_starts_with($detected, 'image/') && $detected !== 'image/svg+xml')
            || str_starts_with($detected, 'audio/')
            || str_starts_with($detected, 'video/')
        ) {
            return $detected;
        }

        return 'application/octet-stream';
    }

    public function delete(string $username, string $path): void {
        $username = $this->assertUsername($username);
        $storage = $this->storageFor($username);
        $relative = $this->normalizeListPath($path);
        if ($relative === '') {
            throw new ApiException('Cannot delete the file home root', 403);
        }

        try {
            $storage->delete($relative);
        } catch (\Throwable $e) {
            throw $this->mapStorageException($e);
        }
    }

    /**
     * Rename a file or folder within the same parent directory.
     *
     * @return array{path: string, name: string}
     */
    public function rename(string $username, string $path, string $newName): array {
        $username = $this->assertUsername($username);
        $storage = $this->storageFor($username);
        $relative = $this->normalizeListPath($path);
        if ($relative === '') {
            throw new ApiException('Cannot rename the file home root', 403);
        }
        $newName = $this->assertName($newName);
        $parent = dirname(str_replace('\\', '/', $relative));
        if ($parent === '.' || $parent === '/') {
            $parent = '';
        }

        try {
            $destination = $storage->childPath($parent, $newName);
            $storage->rename($relative, $destination);
        } catch (\Throwable $e) {
            throw $this->mapStorageException($e);
        }

        return [
            'path' => $destination,
            'name' => $newName,
        ];
    }

    /**
     * Move a file or folder to another directory (newName optional).
     *
     * @return array{path: string, name: string}
     */
    public function move(string $username, string $from, string $toDir, ?string $newName = null): array {
        $username = $this->assertUsername($username);
        $storage = $this->storageFor($username);
        $source = $this->normalizeListPath($from);
        if ($source === '') {
            throw new ApiException('Cannot move the file home root', 403);
        }
        $destParent = $this->normalizeListPath($toDir);
        $baseName = $newName !== null && $newName !== ''
            ? $this->assertName($newName)
            : basename(str_replace('\\', '/', $source));

        try {
            $destination = $storage->childPath($destParent, $baseName);
            $storage->rename($source, $destination);
        } catch (\Throwable $e) {
            throw $this->mapStorageException($e);
        }

        return [
            'path' => $destination,
            'name' => $baseName,
        ];
    }

    /**
     * Copy a file or folder.
     *
     * Naming rules when $newName is empty (or equals the source name):
     * - Same folder: unique " (copy)" / " (copy N)" sibling name
     * - Different folder: keep the original name when free; only generate a
     *   unique " (copy)" name if the destination already has that name
     *
     * @return array{path: string, name: string, type: string}
     */
    public function copy(string $username, string $path, ?string $toDir = null, ?string $newName = null): array {
        $username = $this->assertUsername($username);
        $storage = $this->storageFor($username);
        $source = $this->normalizeListPath($path);
        if ($source === '') {
            throw new ApiException('Cannot copy the file home root', 403);
        }
        if (!$storage->isVisibleChild($source)) {
            throw new ApiException('Not found', 404);
        }
        $sourceAbs = $storage->getPath($source);
        $isDir = is_dir($sourceAbs) && !is_link($sourceAbs);
        $parent = dirname(str_replace('\\', '/', $source));
        if ($parent === '.' || $parent === '/') {
            $parent = '';
        }
        $destParent = $toDir !== null ? $this->normalizeListPath($toDir) : $parent;
        $sourceName = basename(str_replace('\\', '/', $source));
        $baseName = $this->resolveCopyBaseName($storage, $parent, $destParent, $sourceName, $newName);

        try {
            $destination = $storage->childPath($destParent, $baseName);
            $storage->copy($source, $destination);
        } catch (\Throwable $e) {
            throw $this->mapStorageException($e);
        }

        return [
            'path' => $destination,
            'name' => $baseName,
            'type' => $isDir ? 'dir' : 'file',
        ];
    }

    /**
     * Bulk delete or copy selected paths.
     *
     * @param list<string> $paths
     *
     * @return array{ok: int, failed: int, errors: list<string>, entries?: list<array<string, string>>}
     */
    public function bulk(string $username, string $op, array $paths): array {
        $username = $this->assertUsername($username);
        $op = strtolower(trim($op));
        if ($op !== 'delete' && $op !== 'copy') {
            throw new ApiException('Unsupported bulk operation', 400);
        }
        $ok = 0;
        $failed = 0;
        $errors = [];
        $entries = [];
        $seen = [];
        foreach ($paths as $raw) {
            if (!is_string($raw)) {
                continue;
            }
            $p = trim($raw);
            if ($p === '' || isset($seen[$p])) {
                continue;
            }
            $seen[$p] = true;
            try {
                if ($op === 'delete') {
                    $this->delete($username, $p);
                } else {
                    $entries[] = $this->copy($username, $p);
                }
                ++$ok;
            } catch (ApiException $e) {
                ++$failed;
                $errors[] = $p . ': ' . $e->getMessage();
            } catch (\Throwable $e) {
                ++$failed;
                $errors[] = $p . ': operation failed';
                error_log('AngaraDAV portal files bulk: ' . $e->getMessage());
            }
        }

        $out = [
            'ok'     => $ok,
            'failed' => $failed,
            'errors' => $errors,
        ];
        if ($op === 'copy') {
            $out['entries'] = $entries;
        }

        return $out;
    }

    /**
     * Choose the destination base name for a copy.
     *
     * Same-folder copies of the source name always use uniqueCopyName so the
     * original is never overwritten. Cross-folder copies keep the original
     * (or explicit) name when free; uniqueness is only applied on conflict.
     */
    private function resolveCopyBaseName(
        HomeStorage $storage,
        string $sourceParent,
        string $destParent,
        string $sourceName,
        ?string $newName
    ): string {
        $explicit = $newName !== null && trim($newName) !== '';
        $preferred = $explicit ? $this->assertName($newName) : $sourceName;
        $sameFolder = $destParent === $sourceParent;

        // Same folder + keeping the source name → always " (copy)" family
        if ($sameFolder && (!$explicit || $preferred === $sourceName)) {
            return $this->uniqueCopyName($storage, $destParent, $sourceName);
        }

        // Different folder or custom name: keep preferred when free
        try {
            $probe = $storage->childPath($destParent, $preferred);
            if (!$storage->isVisibleChild($probe)) {
                return $preferred;
            }
        } catch (\Throwable $e) {
            // Invalid path construction — fall through to unique name
        }

        // Destination already has that name (or name invalid at that path)
        return $this->uniqueCopyName($storage, $destParent, $preferred);
    }

    /**
     * Build a unique sibling name: "file (copy).txt", "file (copy 2).txt", ….
     */
    private function uniqueCopyName(HomeStorage $storage, string $parent, string $name): string {
        $name = $this->assertName($name);
        $dot = strrpos($name, '.');
        // Treat leading-dot names (.env) as no extension
        $hasExt = $dot !== false && $dot > 0;
        $stem = $hasExt ? substr($name, 0, $dot) : $name;
        $ext = $hasExt ? substr($name, $dot) : '';

        for ($n = 1; $n < 1000; ++$n) {
            $candidate = $n === 1
                ? $stem . ' (copy)' . $ext
                : $stem . ' (copy ' . $n . ')' . $ext;
            try {
                $rel = $storage->childPath($parent, $candidate);
            } catch (\Throwable $e) {
                continue;
            }
            if (!$storage->isVisibleChild($rel)) {
                return $candidate;
            }
        }

        return $stem . ' (copy ' . bin2hex(random_bytes(3)) . ')' . $ext;
    }

    public function isEnabledInConfig(): bool {
        $sys = is_array($this->config['system'] ?? null) ? $this->config['system'] : [];

        return !empty($sys['files_enabled']);
    }

    private function storageFor(string $username): HomeStorage {
        $cfg = $this->requireFileConfig();
        $principal = 'principals/' . $username;
        $repo = new HomeRepository($this->pdo, $cfg);
        try {
            $home = $repo->getOrCreateForPrincipal($principal);
        } catch (\Throwable $e) {
            throw new ApiException('Unable to open your WebDAV file home', 500);
        }
        $storageId = (string) ($home['storage_id'] ?? '');
        if ($storageId === '') {
            throw new ApiException('WebDAV file home is misconfigured', 500);
        }

        try {
            return new HomeStorage($cfg, $storageId);
        } catch (\Throwable $e) {
            error_log('AngaraDAV portal files home open: ' . $e->getMessage());
            throw new ApiException('Unable to open WebDAV file storage', 500);
        }
    }

    private function requireFileConfig(): FileStorageConfig {
        if (!$this->isEnabledInConfig()) {
            throw new ApiException('WebDAV file storage is disabled. Enable it under Admin → AngaraDAV Settings.', 503);
        }
        $this->ensureInitialized();
        if ($this->fileConfig === null) {
            throw new ApiException($this->initError ?: 'WebDAV file storage is not available', 503);
        }

        return $this->fileConfig;
    }

    private function ensureInitialized(): void {
        if ($this->initAttempted) {
            return;
        }
        $this->initAttempted = true;
        try {
            $cfg = new FileStorageConfig($this->config);
            if (!$cfg->isEnabled()) {
                $this->initError = 'WebDAV file storage is disabled';

                return;
            }
            $cfg->prepareStorage();
            SchemaManager::ensure($this->pdo);
            $cfg->markActive();
            $this->fileConfig = $cfg;
        } catch (\Throwable $e) {
            $this->initError = $e->getMessage();
            error_log('AngaraDAV portal files init: ' . $e->getMessage());
            $this->fileConfig = null;
        }
    }

    private function assertUsername(string $username): string {
        $username = trim($username);
        if ($username === '' || !preg_match('#^[A-Za-z0-9._-]+$#', $username)) {
            throw new ApiException('Invalid username', 400);
        }

        return $username;
    }

    private function assertName(string $name): string {
        $name = trim($name);
        if ($name === '' || $name === '.' || $name === '..') {
            throw new ApiException('Invalid name', 400);
        }
        if (str_contains($name, '/') || str_contains($name, '\\')) {
            throw new ApiException('Name cannot contain path separators', 400);
        }
        if (preg_match('/[\x00-\x1F\x7F]/', $name)) {
            throw new ApiException('Name contains unsupported characters', 400);
        }

        return $name;
    }

    private function normalizeListPath(string $path): string {
        $path = trim(str_replace('\\', '/', $path), '/');
        if ($path === '' || $path === '.') {
            return '';
        }
        if (str_contains($path, "\0")) {
            throw new ApiException('Invalid path', 400);
        }
        $segments = explode('/', $path);
        foreach ($segments as $segment) {
            if ($segment === '' || $segment === '.' || $segment === '..') {
                throw new ApiException('Invalid path', 400);
            }
        }

        return implode('/', $segments);
    }

    private function mapStorageException(\Throwable $e): ApiException {
        if ($e instanceof ApiException) {
            return $e;
        }
        if ($e instanceof NotFound) {
            return new ApiException($e->getMessage() ?: 'Not found', 404);
        }
        if ($e instanceof Forbidden) {
            return new ApiException($e->getMessage() ?: 'Forbidden', 403);
        }
        if ($e instanceof Conflict) {
            return new ApiException($e->getMessage() ?: 'Conflict', 409);
        }
        if ($e instanceof InsufficientStorage) {
            return new ApiException($e->getMessage() ?: 'Storage quota exceeded', 507);
        }
        if ($e instanceof PayloadTooLarge) {
            return new ApiException($e->getMessage() ?: 'File too large', 413);
        }
        error_log('AngaraDAV portal files: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());

        return new ApiException('File operation failed', 500);
    }
}
