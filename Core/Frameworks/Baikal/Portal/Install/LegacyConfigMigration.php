<?php

namespace Baikal\Portal\Install;

use Baikal\Portal\ApiException;

/**
 * TEMPORARY lab step: rename config/baikal.yaml to config/configuration.yaml.
 *
 * Delete this class after every lab instance has run Setup → Rename config file.
 * Also delete InstallService::migrateConfigFile(), POST /install/migrate-config,
 * and the installer "migrate-config" step.
 */
final class LegacyConfigMigration {
    public const LEGACY_FILENAME = 'baikal.yaml';
    public const FILENAME = 'configuration.yaml';

    public static function needed(string $targetPath): bool {
        $targetPath = self::normalize($targetPath);
        if ($targetPath === '' || basename($targetPath) === self::LEGACY_FILENAME) {
            return false;
        }
        $legacy = dirname($targetPath) . '/' . self::LEGACY_FILENAME;

        return is_file($legacy) && !is_file($targetPath);
    }

    /**
     * Rename the legacy file onto the target path. Does not rewrite YAML.
     */
    public static function rename(string $targetPath): void {
        $targetPath = self::normalize($targetPath);
        if (!self::needed($targetPath)) {
            throw new ApiException('Config rename is not available', 409);
        }
        $legacy = dirname($targetPath) . '/' . self::LEGACY_FILENAME;
        $dir = dirname($targetPath);
        if (!is_writable($dir) || !is_writable($legacy)) {
            throw new ApiException('Config directory is not writable', 503);
        }
        if (!@rename($legacy, $targetPath)) {
            throw new ApiException('Unable to rename ' . self::LEGACY_FILENAME . ' to ' . self::FILENAME, 500);
        }
        @chmod($targetPath, 0600);
    }

    private static function normalize(string $path): string {
        return rtrim(str_replace('\\', '/', $path), '/');
    }
}
