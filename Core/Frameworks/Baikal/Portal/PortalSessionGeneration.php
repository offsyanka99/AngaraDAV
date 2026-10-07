<?php

namespace Baikal\Portal;

use Baikal\Model\Config;
use Symfony\Component\Yaml\Yaml;

/**
 * Integer stored in configuration.yaml that invalidates portal sessions
 * minted before a successful data restore.
 *
 * A missing key reads as 0 so an upgrade does not sign anyone out.
 */
class PortalSessionGeneration {
    public const KEY = 'portal_session_generation';

    public const RESTORE_MESSAGE = 'The database was restored. Please sign in again.';

    public const BUMP_FAILED_MESSAGE = 'The database and file store were restored. Portal sessions were not ended because configuration.yaml could not be updated. Increment system.portal_session_generation by 1 in that file, then sign in again.';

    /**
     * @param array<string, mixed> $system
     */
    public static function fromSystem(array $system): int {
        if (!array_key_exists(self::KEY, $system)) {
            return 0;
        }
        $value = $system[self::KEY];
        if ($value === null || $value === '' || $value === false) {
            return 0;
        }

        return self::coerce($value);
    }

    /**
     * Session and YAML values that are not an integer >= 0 count as 0.
     */
    public static function coerce(mixed $value): int {
        if (is_int($value)) {
            return $value >= 0 ? $value : 0;
        }
        if (is_string($value) && preg_match('/^[0-9]+$/', $value) === 1) {
            $max = (string) PHP_INT_MAX;
            if (strlen($value) > strlen($max) || (strlen($value) === strlen($max) && strcmp($value, $max) > 0)) {
                return 0;
            }

            return (int) $value;
        }

        return 0;
    }

    /**
     * Increment the counter under the data-export lock, then the config lock.
     * The config lock is released first.
     */
    public static function bump(string $yamlPath, string $exportLockPath): int {
        if ($exportLockPath === '') {
            throw new \RuntimeException('Data export lock path is empty');
        }
        $export = fopen($exportLockPath, 'c');
        if ($export === false) {
            throw new \RuntimeException('Unable to lock the data export');
        }
        try {
            if (!flock($export, LOCK_EX)) {
                throw new \RuntimeException('Unable to lock the data export');
            }
            @chmod($exportLockPath, 0600);

            return Config::withConfigLock($yamlPath, function () use ($yamlPath): int {
                return self::writeNext($yamlPath);
            });
        } finally {
            flock($export, LOCK_UN);
            fclose($export);
        }
    }

    private static function writeNext(string $yamlPath): int {
        self::assertProjectConfigPath($yamlPath);
        $document = self::loadDocument($yamlPath);
        $system = is_array($document['system'] ?? null) ? $document['system'] : [];
        $current = self::fromSystem($system);
        if ($current >= PHP_INT_MAX) {
            throw new \RuntimeException('portal_session_generation cannot be incremented');
        }
        $next = $current + 1;
        $system[self::KEY] = $next;
        $document['system'] = $system;
        Config::writeConfigFile($document);

        return $next;
    }

    private static function assertProjectConfigPath(string $yamlPath): void {
        if (!defined('PROJECT_PATH_CONFIG') || PROJECT_PATH_CONFIG === '') {
            throw new \RuntimeException('PROJECT_PATH_CONFIG is not defined');
        }
        $expected = rtrim((string) PROJECT_PATH_CONFIG, '/') . '/configuration.yaml';
        if ($yamlPath !== $expected) {
            throw new \RuntimeException('Session generation is stored in configuration.yaml');
        }
    }

    /**
     * @return array<string, mixed>
     */
    private static function loadDocument(string $yamlPath): array {
        if (!is_file($yamlPath)) {
            return [];
        }
        if (!is_readable($yamlPath)) {
            throw new \RuntimeException('configuration.yaml is not readable');
        }
        try {
            $parsed = Yaml::parseFile($yamlPath);
        } catch (\Throwable $e) {
            throw new \RuntimeException('configuration.yaml could not be read', 0, $e);
        }
        if (!is_array($parsed)) {
            throw new \RuntimeException('configuration.yaml could not be read');
        }

        return $parsed;
    }
}
