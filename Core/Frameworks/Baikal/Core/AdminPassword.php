<?php

namespace Baikal\Core;

use Symfony\Component\Yaml\Yaml;

/**
 * Admin password hashing/verification and optional session cookie hardening.
 * Extracted from the removed classic Formal admin stack for portal install/settings.
 */
class AdminPassword {
    /** @var int Default idle lifetime (seconds) when configuring PHP sessions */
    public const DEFAULT_SESSION_MAX_AGE = 900;

    /**
     * Hash an admin password for storage in baikal.yaml (system.admin_passwordhash).
     *
     * @param string $sPassword
     * @param string $sAuthRealm unused (legacy Digest-era parameter)
     */
    public static function hashAdminPassword(string $sPassword, string $sAuthRealm = ''): string {
        return password_hash($sPassword, PASSWORD_DEFAULT);
    }

    /**
     * Verify admin password against stored hash (modern password_hash or legacy SHA-256/MD5).
     */
    public static function verifyAdminPassword(string $sPassword, string $sStoredHash, string $sAuthRealm): bool {
        if (self::isModernPasswordHash($sStoredHash)) {
            return password_verify($sPassword, $sStoredHash);
        }

        $legacySha256 = hash('sha256', 'admin:' . $sAuthRealm . ':' . $sPassword);
        if (hash_equals($legacySha256, $sStoredHash)) {
            return true;
        }

        $legacyMd5 = md5('admin:' . $sAuthRealm . ':' . $sPassword);
        if (hash_equals($legacyMd5, $sStoredHash)) {
            return true;
        }

        return false;
    }

    public static function isModernPasswordHash(string $sStoredHash): bool {
        return $sStoredHash !== ''
            && (str_starts_with($sStoredHash, '$2y$')
                || str_starts_with($sStoredHash, '$2a$')
                || str_starts_with($sStoredHash, '$2b$')
                || str_starts_with($sStoredHash, '$argon2'));
    }

    /**
     * Apply session cookie / GC settings before session_start() when possible.
     */
    public static function configureSession(): void {
        $maxAge = self::DEFAULT_SESSION_MAX_AGE;
        try {
            if (defined('PROJECT_PATH_CONFIG') && file_exists(PROJECT_PATH_CONFIG . 'baikal.yaml')) {
                $config = Yaml::parseFile(PROJECT_PATH_CONFIG . 'baikal.yaml');
                if (is_array($config)
                    && isset($config['system']['session_max_age_minutes'])
                    && is_numeric($config['system']['session_max_age_minutes'])
                    && (int) $config['system']['session_max_age_minutes'] > 0
                ) {
                    $maxAge = (int) $config['system']['session_max_age_minutes'] * 60;
                }
            }
        } catch (\Exception $e) {
            // keep default
        }

        if (session_status() === PHP_SESSION_NONE) {
            ini_set('session.gc_maxlifetime', (string) $maxAge);
            ini_set('session.cookie_httponly', '1');
            ini_set('session.use_strict_mode', '1');
            if (Bootstrap::currentProtocol() === 'https') {
                ini_set('session.cookie_secure', '1');
            }
            session_set_cookie_params([
                'lifetime' => 0,
                'path'     => '/',
                'secure'   => Bootstrap::currentProtocol() === 'https',
                'httponly' => true,
                'samesite' => 'Lax',
            ]);
        }
    }
}
