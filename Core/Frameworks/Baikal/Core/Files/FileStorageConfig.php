<?php

namespace Baikal\Core\Files;

/**
 * Validated configuration for private WebDAV file homes.
 */
class FileStorageConfig {
    /** @var bool */
    private $enabled;

    /** @var string */
    private $storagePath;

    /** @var int */
    private $maxUploadBytes;

    /** @var int */
    private $quotaBytes;

    /** @var int */
    private $quarantineDays;

    public function __construct(array $config) {
        $system = is_array($config['system'] ?? null) ? $config['system'] : [];
        $this->enabled = !empty($system['files_enabled']);

        $configuredPath = self::environmentValue('BAIKAL_FILES_STORAGE_PATH');
        if ($configuredPath === null) {
            $configuredPath = trim((string) ($system['files_storage_path'] ?? ''));
        }
        if ($configuredPath === '') {
            if (!defined('PROJECT_PATH_SPECIFIC')) {
                throw new \RuntimeException('PROJECT_PATH_SPECIFIC is unavailable for WebDAV file storage');
            }
            $configuredPath = PROJECT_PATH_SPECIFIC . 'files';
        }
        if (!self::isAbsolutePath($configuredPath)) {
            throw new \InvalidArgumentException('WebDAV file storage path must be absolute');
        }
        $this->storagePath = self::normalizeAbsolutePath($configuredPath);

        $this->maxUploadBytes = self::resolveMaxUploadBytes($system);
        $this->quotaBytes = self::resolveQuotaBytes($system);
        $this->quarantineDays = self::configuredInteger(
            $system,
            'files_quarantine_days',
            '',
            30,
            0,
            3650
        );
    }

    public function isEnabled(): bool {
        return $this->enabled;
    }

    public function getStoragePath(): string {
        return $this->storagePath;
    }

    public function getMaxUploadBytes(): int {
        return $this->maxUploadBytes;
    }

    public function getQuotaBytes(): int {
        return $this->quotaBytes;
    }

    public function getQuarantineDays(): int {
        return $this->quarantineDays;
    }

    public function prepareStorage(): void {
        $this->assertSafeStoragePath($this->storagePath);
        $this->assertNoSymlinkComponents($this->storagePath);
        $this->createPrivateDirectory($this->storagePath);

        $resolved = realpath($this->storagePath);
        if ($resolved === false) {
            throw new \RuntimeException('Unable to resolve WebDAV file storage path');
        }
        $this->assertSafeStoragePath($resolved);

        $this->storagePath = rtrim($resolved, '/\\');
        $this->createPrivateDirectory($this->homesPath());
        $this->createPrivateDirectory($this->temporaryPath());
        $this->createPrivateDirectory($this->quarantinePath());
        $this->createPrivateDirectory($this->locksPath());
    }

    public function markActive(): void {
        if (!$this->isStorageReady() || @touch($this->activationMarkerPath()) === false) {
            throw new \RuntimeException('Unable to mark WebDAV file storage active');
        }
        @chmod($this->activationMarkerPath(), 0600);
    }

    public function clearActive(): void {
        $marker = $this->activationMarkerPath();
        if (is_file($marker)) {
            @unlink($marker);
        }
    }

    public function isActive(): bool {
        return $this->isStorageReady() && is_file($this->activationMarkerPath());
    }

    public function isStorageReady(): bool {
        try {
            $this->assertSafeStoragePath($this->storagePath);
            $resolved = realpath($this->storagePath);
            if ($resolved === false) {
                return false;
            }
            $this->assertSafeStoragePath($resolved);
            $this->assertNoSymlinkComponents($this->storagePath);

            return is_dir($resolved) && is_writable($resolved);
        } catch (\Throwable $e) {
            return false;
        }
    }

    public function homesPath(): string {
        return $this->storagePath . DIRECTORY_SEPARATOR . 'homes';
    }

    public function temporaryPath(): string {
        return $this->storagePath . DIRECTORY_SEPARATOR . 'tmp';
    }

    public function quarantinePath(): string {
        return $this->storagePath . DIRECTORY_SEPARATOR . 'quarantine';
    }

    public function locksPath(): string {
        return $this->storagePath . DIRECTORY_SEPARATOR . 'locks';
    }

    private function activationMarkerPath(): string {
        return $this->storagePath . DIRECTORY_SEPARATOR . '.active';
    }

    public function homePath(string $storageId): string {
        self::assertStorageId($storageId);

        return $this->homesPath() . DIRECTORY_SEPARATOR . $storageId;
    }

    public function homeTemporaryPath(string $storageId): string {
        self::assertStorageId($storageId);

        return $this->temporaryPath() . DIRECTORY_SEPARATOR . $storageId;
    }

    public function homeLockPath(string $storageId): string {
        self::assertStorageId($storageId);

        return $this->locksPath() . DIRECTORY_SEPARATOR . $storageId . '.lock';
    }

    public function quarantinedHomePath(string $storageId): string {
        self::assertStorageId($storageId);

        return $this->quarantinePath() . DIRECTORY_SEPARATOR . $storageId;
    }

    private function createPrivateDirectory(string $path): void {
        if (!is_dir($path) && !mkdir($path, 0700, true) && !is_dir($path)) {
            throw new \RuntimeException('Unable to create WebDAV file storage directory');
        }
        @chmod($path, 0700);
        if (!is_writable($path)) {
            throw new \RuntimeException('WebDAV file storage directory is not writable');
        }
    }

    private function assertSafeStoragePath(string $path): void {
        $normalized = self::normalizeAbsolutePath($path);
        if ($normalized === '/' || preg_match('#^[A-Za-z]:/$#', $normalized)) {
            throw new \RuntimeException('WebDAV file storage cannot use a filesystem root');
        }
        if (preg_match('#^//[^/]+/[^/]+/?$#', $normalized)) {
            throw new \RuntimeException('WebDAV file storage cannot use a network share root');
        }
        if (defined('PROJECT_PATH_ROOT')) {
            $htmlPath = realpath(PROJECT_PATH_ROOT . 'html');
            if ($htmlPath !== false && self::pathContains($htmlPath, $normalized)) {
                throw new \RuntimeException('WebDAV file storage must be outside the web document root');
            }
        }
    }

    private function assertNoSymlinkComponents(string $path): void {
        $current = $path;
        while (true) {
            if (is_link($current)) {
                throw new \RuntimeException('WebDAV file storage path cannot contain symbolic links');
            }
            $parent = dirname($current);
            if ($parent === $current) {
                break;
            }
            $current = $parent;
        }
    }

    /**
     * Maximum upload size, in bytes. Single source of truth is
     * files_max_upload_mb / BAIKAL_FILES_MAX_UPLOAD_MB (stored in MB). Falls
     * back to a pre-1.0.7 byte-based files_max_upload_bytes /
     * BAIKAL_FILES_MAX_UPLOAD_BYTES value, used as-is with no MB rounding,
     * only when the MB-based setting is absent, so existing installs keep
     * their exact configured limit until re-saved.
     */
    private static function resolveMaxUploadBytes(array $system): int {
        $hasMbSetting = self::environmentValue('BAIKAL_FILES_MAX_UPLOAD_MB') !== null
            || array_key_exists('files_max_upload_mb', $system);
        if ($hasMbSetting) {
            return self::configuredInteger($system, 'files_max_upload_mb', 'BAIKAL_FILES_MAX_UPLOAD_MB', 1024, 1, 1048576) * 1048576;
        }

        $hasLegacyBytesSetting = self::environmentValue('BAIKAL_FILES_MAX_UPLOAD_BYTES') !== null
            || array_key_exists('files_max_upload_bytes', $system);
        if ($hasLegacyBytesSetting) {
            return self::configuredInteger($system, 'files_max_upload_bytes', 'BAIKAL_FILES_MAX_UPLOAD_BYTES', 1073741824, 1048576, PHP_INT_MAX);
        }

        return 1024 * 1048576;
    }

    /**
     * Per-user application quota, in bytes (0 = unlimited). Single source of
     * truth is files_quota_mb / BAIKAL_FILES_QUOTA_MB (stored in MB). Falls
     * back to a pre-1.0.9 byte-based files_quota_bytes / BAIKAL_FILES_QUOTA_BYTES
     * value, used as-is with no MB rounding, only when the MB-based setting
     * is absent.
     */
    private static function resolveQuotaBytes(array $system): int {
        $hasMbSetting = self::environmentValue('BAIKAL_FILES_QUOTA_MB') !== null
            || array_key_exists('files_quota_mb', $system);
        if ($hasMbSetting) {
            return self::configuredInteger($system, 'files_quota_mb', 'BAIKAL_FILES_QUOTA_MB', 10240, 0, 1073741824) * 1048576;
        }

        $hasLegacyBytesSetting = self::environmentValue('BAIKAL_FILES_QUOTA_BYTES') !== null
            || array_key_exists('files_quota_bytes', $system);
        if ($hasLegacyBytesSetting) {
            return self::configuredInteger($system, 'files_quota_bytes', 'BAIKAL_FILES_QUOTA_BYTES', 10737418240, 0, PHP_INT_MAX);
        }

        return 10240 * 1048576;
    }

    private static function configuredInteger(
        array $system,
        string $key,
        string $environmentKey,
        int $default,
        int $minimum,
        int $maximum
    ): int {
        $raw = $environmentKey !== '' ? self::environmentValue($environmentKey) : null;
        if ($raw === null) {
            $raw = $system[$key] ?? $default;
        }
        $value = filter_var($raw, FILTER_VALIDATE_INT);
        if ($value === false || $value < $minimum || $value > $maximum) {
            throw new \InvalidArgumentException('Invalid WebDAV file storage setting: ' . $key);
        }

        return (int) $value;
    }

    private static function environmentValue(string $key): ?string {
        if ($key === '') {
            return null;
        }
        $value = getenv($key);

        return $value === false || trim($value) === '' ? null : trim($value);
    }

    private static function isAbsolutePath(string $path): bool {
        return str_starts_with($path, '/')
            || str_starts_with($path, '\\\\')
            || (bool) preg_match('/^[A-Za-z]:[\\\\\/]/', $path);
    }

    private static function normalizeAbsolutePath(string $path): string {
        $path = str_replace('\\', '/', $path);
        if (preg_match('#^[A-Za-z]:/#', $path)) {
            $prefix = strtoupper(substr($path, 0, 2)) . '/';
            $path = substr($path, 3);
        } elseif (str_starts_with($path, '//')) {
            $prefix = '//';
            $path = ltrim($path, '/');
        } else {
            $prefix = '/';
            $path = ltrim($path, '/');
        }

        $segments = [];
        foreach (explode('/', $path) as $segment) {
            if ($segment === '' || $segment === '.') {
                continue;
            }
            if ($segment === '..') {
                if ($segments === []) {
                    throw new \InvalidArgumentException('WebDAV file storage path escapes its root');
                }
                array_pop($segments);
                continue;
            }
            $segments[] = $segment;
        }

        return $prefix . implode('/', $segments);
    }

    private static function pathContains(string $parent, string $path): bool {
        $parent = rtrim(str_replace('\\', '/', $parent), '/');
        $path = rtrim(str_replace('\\', '/', $path), '/');
        if (DIRECTORY_SEPARATOR === '\\') {
            $parent = strtolower($parent);
            $path = strtolower($path);
        }

        return $path === $parent || str_starts_with($path, $parent . '/');
    }

    private static function assertStorageId(string $storageId): void {
        if (!preg_match('/^[a-f0-9]{32}$/', $storageId)) {
            throw new \InvalidArgumentException('Invalid WebDAV home storage identifier');
        }
    }
}
