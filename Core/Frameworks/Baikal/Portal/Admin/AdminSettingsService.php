<?php

namespace Baikal\Portal\Admin;

use Baikal\Portal\ApiException;
use Symfony\Component\Yaml\Yaml;

/**
 * Read/write system settings from baikal.yaml (Standard config section).
 * Read-only database section (Phase 8) — password never returned; writes deferred.
 *
 * Never returns admin_passwordhash — only hasAdminPassword.
 * Writes use temp file + rename (same approach as Baikal\Model\Config::writeConfigFile).
 */
class AdminSettingsService {
    /** Max classic-admin password changes per IP per window (brute-force / abuse guard). */
    private const PASSWORD_RATE_MAX = 10;

    /** Rate-limit window for admin password changes (seconds). */
    private const PASSWORD_RATE_WINDOW = 900;

    /**
     * Body keys that must never be accepted as mass-assignment (secret / internal).
     * Password changes go only through admin_password + admin_password_confirm.
     */
    private const FORBIDDEN_BODY_KEYS = [
        'admin_passwordhash',
        'admin_passwordhash_confirm',
        'digesta1',
        'pgsql_password',
        'encryption_key',
        'password_hash',
        'passwordhash',
    ];

    /** Keys exposed in GET (editable surface). */
    private const EDITABLE_KEYS = [
        'timezone',
        'card_enabled',
        'cal_enabled',
        'files_enabled',
        'files_storage_path',
        'files_max_upload_mb',
        'files_quota_mb',
        'files_quarantine_days',
        'tasks_enabled',
        'notes_enabled',
        'invite_from',
        'dav_auth_type',
        'session_max_age_minutes',
        'push_enabled',
        'push_external_url',
        'push_log_level',
        'push_max_subscriptions_per_principal',
        'push_max_subscriptions_per_resource',
        'push_max_registrations_per_hour',
        'push_worker_batch_size',
        'push_worker_poll_ms',
        'push_max_delivery_attempts',
        'portal_log_level',
        'portal_time_format',
        'portal_week_start',
        'portal_admin_users',
        'portal_admin_ui_enabled',
    ];

    /** @var string Absolute path to baikal.yaml */
    private $configPath;

    /** @var array<string, mixed> In-memory config document (loaded on construct / refresh) */
    private $document;

    public function __construct(string $configPath) {
        $this->configPath = $configPath;
        $this->document = $this->loadDocument();
    }

    /**
     * Settings for portal admin form.
     *
     * @return array<string, mixed>
     */
    public function getSystemSettings(): array {
        $sys = is_array($this->document['system'] ?? null) ? $this->document['system'] : [];
        $out = [];
        foreach (self::EDITABLE_KEYS as $key) {
            if (array_key_exists($key, $sys)) {
                $out[$key] = $sys[$key];
            } else {
                $out[$key] = $this->defaultFor($key);
            }
        }
        $hash = (string) ($sys['admin_passwordhash'] ?? '');
        $out['hasAdminPassword'] = $hash !== '';
        // Never include admin_passwordhash
        unset($out['admin_passwordhash']);

        $out['configured_version'] = (string) ($sys['configured_version'] ?? (defined('BAIKAL_VERSION') ? BAIKAL_VERSION : ''));
        $out['auth_realm'] = (string) ($sys['auth_realm'] ?? 'BaikalDAV');
        $out['writable'] = $this->isWritable();

        return $out;
    }

    /**
     * Read-only database connection summary (Phase 8).
     *
     * Never returns pgsql_password or encryption_key material.
     * Writes intentionally deferred — use classic /admin/?/settings/database.
     *
     * @return array{
     *   backend: string,
     *   sqlite_file: string,
     *   pgsql_host: string,
     *   pgsql_dbname: string,
     *   pgsql_username: string,
     *   hasPassword: bool,
     *   hasEncryptionKey: bool,
     *   writeEnabled: false,
     *   classicUrl: string,
     *   warning: string
     * }
     */
    public function getDatabaseSettings(): array {
        // Fresh read so operators see latest classic-admin changes
        $this->document = $this->loadDocument();
        $db = is_array($this->document['database'] ?? null) ? $this->document['database'] : [];

        $backend = strtolower(trim((string) ($db['backend'] ?? '')));
        if ($backend === '') {
            // Infer from presence of sqlite path vs pgsql host
            if (trim((string) ($db['sqlite_file'] ?? '')) !== '') {
                $backend = 'sqlite';
            } elseif (trim((string) ($db['pgsql_host'] ?? '')) !== '') {
                $backend = 'pgsql';
            }
        }

        $password = (string) ($db['pgsql_password'] ?? '');
        $encKey = (string) ($db['encryption_key'] ?? '');

        return [
            'backend'           => $backend,
            'sqlite_file'       => (string) ($db['sqlite_file'] ?? ''),
            'pgsql_host'        => (string) ($db['pgsql_host'] ?? ''),
            'pgsql_dbname'      => (string) ($db['pgsql_dbname'] ?? ''),
            'pgsql_username'    => (string) ($db['pgsql_username'] ?? ''),
            'hasPassword'       => $password !== '',
            'hasEncryptionKey'  => $encKey !== '',
            // Product decision (Phase 8.2): portal write DEFERRED — classic only
            'writeEnabled'      => false,
            'classicUrl'        => '/admin/?/settings/database',
            'warning'           => 'Changing database settings can take the instance offline. Portal write is disabled; use classic Web Admin with a recovery plan.',
        ];
    }

    /**
     * Apply partial update and write YAML atomically.
     *
     * @param array<string, mixed> $body
     *
     * @return array<string, mixed>
     */
    public function updateSystemSettings(array $body): array {
        if (!$this->isWritable()) {
            throw new ApiException('Config file is not writable', 503);
        }

        $this->assertNoForbiddenBodyKeys($body);

        // Reload so concurrent classic-admin saves are not clobbered more than necessary
        $this->document = $this->loadDocument();
        if (!isset($this->document['system']) || !is_array($this->document['system'])) {
            $this->document['system'] = [];
        }
        $sys = &$this->document['system'];

        $password = isset($body['admin_password']) ? (string) $body['admin_password'] : '';
        $passwordConfirm = isset($body['admin_password_confirm'])
            ? (string) $body['admin_password_confirm']
            : (isset($body['admin_passwordConfirm']) ? (string) $body['admin_passwordConfirm'] : '');

        if ($password !== '' || $passwordConfirm !== '') {
            if ($password === '' || $passwordConfirm === '') {
                throw new ApiException('Admin password and confirmation are required to change password', 400);
            }
            if ($password !== $passwordConfirm) {
                throw new ApiException('Admin password confirmation does not match', 400);
            }
            if ($this->isAdminPasswordChangeRateLimited()) {
                throw new ApiException('Too many admin password change attempts. Please try again later.', 429);
            }
            $sys['admin_passwordhash'] = password_hash($password, PASSWORD_DEFAULT);
            $this->registerAdminPasswordChangeAttempt();
        }

        // Allow-list only — unknown keys (including secrets) are ignored except FORBIDDEN (rejected above)
        foreach (self::EDITABLE_KEYS as $key) {
            if (!array_key_exists($key, $body)) {
                continue;
            }
            $sys[$key] = $this->validateAndCoerce($key, $body[$key]);
        }

        // push_enabled requires HTTPS external URL when enabled
        $pushOn = !empty($sys['push_enabled']);
        if ($pushOn) {
            $url = trim((string) ($sys['push_external_url'] ?? ''));
            if ($url === '') {
                throw new ApiException('WebDAV-Push external URL is required when Push is enabled', 400);
            }
            if (!preg_match('#^https://#i', $url)) {
                throw new ApiException('WebDAV-Push external URL must be HTTPS', 400);
            }
        }

        $this->writeDocument($this->document);

        return $this->getSystemSettings();
    }

    /**
     * @param array<string, mixed> $body
     */
    private function assertNoForbiddenBodyKeys(array $body): void {
        foreach (self::FORBIDDEN_BODY_KEYS as $key) {
            if (array_key_exists($key, $body)) {
                throw new ApiException(
                    'Refusing to accept secret or internal field "' . $key . '" in request body',
                    400
                );
            }
        }
    }

    private function clientIp(): string {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

        return is_string($ip) && $ip !== '' ? $ip : '0.0.0.0';
    }

    private function passwordRatePath(): string {
        $dir = defined('PROJECT_PATH_SPECIFIC')
            ? PROJECT_PATH_SPECIFIC
            : (defined('PROJECT_PATH_ROOT') ? PROJECT_PATH_ROOT . 'Specific/' : sys_get_temp_dir() . '/');

        return rtrim($dir, '/') . '/portal_admin_password_rate.json';
    }

    /**
     * @return array<string, mixed>
     */
    private function loadPasswordRateData(): array {
        $path = $this->passwordRatePath();
        if (!is_readable($path)) {
            return [];
        }
        $raw = file_get_contents($path);
        if ($raw === false || trim($raw) === '') {
            return [];
        }
        $data = json_decode($raw, true);

        return is_array($data) ? $data : [];
    }

    /**
     * @param array<string, mixed> $data
     */
    private function savePasswordRateData(array $data): void {
        $path = $this->passwordRatePath();
        $dir = dirname($path);
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        $json = json_encode($data, JSON_UNESCAPED_SLASHES);
        if ($json === false) {
            return;
        }
        @file_put_contents($path, $json . "\n", LOCK_EX);
    }

    private function isAdminPasswordChangeRateLimited(): bool {
        $ip = $this->clientIp();
        $data = $this->loadPasswordRateData();
        $now = time();
        $row = $data[$ip] ?? null;
        if (!is_array($row)) {
            return false;
        }
        $start = (int) ($row['start'] ?? 0);
        $count = (int) ($row['count'] ?? 0);
        if ($start <= 0 || ($now - $start) > self::PASSWORD_RATE_WINDOW) {
            return false;
        }

        return $count >= self::PASSWORD_RATE_MAX;
    }

    private function registerAdminPasswordChangeAttempt(): void {
        $ip = $this->clientIp();
        $data = $this->loadPasswordRateData();
        $now = time();
        $row = $data[$ip] ?? null;
        if (!is_array($row) || (int) ($row['start'] ?? 0) <= 0 || ($now - (int) $row['start']) > self::PASSWORD_RATE_WINDOW) {
            $data[$ip] = ['start' => $now, 'count' => 1];
        } else {
            $data[$ip]['count'] = (int) ($row['count'] ?? 0) + 1;
        }
        foreach ($data as $k => $v) {
            if (!is_array($v) || ($now - (int) ($v['start'] ?? 0)) > self::PASSWORD_RATE_WINDOW * 2) {
                unset($data[$k]);
            }
        }
        $this->savePasswordRateData($data);
    }

    public function isWritable(): bool {
        $path = $this->configPath;
        $dir = dirname($path);
        if (is_file($path)) {
            return is_writable($path);
        }

        return is_dir($dir) && is_writable($dir);
    }

    /**
     * @return array<string, mixed>
     */
    private function loadDocument(): array {
        if (!is_readable($this->configPath)) {
            return ['system' => []];
        }
        try {
            $parsed = Yaml::parseFile($this->configPath);
        } catch (\Throwable $e) {
            throw new ApiException('Invalid baikal.yaml: ' . $e->getMessage(), 500);
        }
        if (!is_array($parsed)) {
            return ['system' => []];
        }

        return $parsed;
    }

    /**
     * @param array<string, mixed> $document
     */
    private function writeDocument(array $document): void {
        $path = $this->configPath;
        $dir = dirname($path);
        if (!is_dir($dir) || !is_writable($dir)) {
            throw new ApiException('Config directory is not writable', 503);
        }
        $yaml = Yaml::dump($document, 4, 2);
        if ($yaml === '' || $yaml === false) {
            throw new ApiException('Failed to serialize config', 500);
        }
        $tmp = $path . '.tmp.' . getmypid() . '.' . bin2hex(random_bytes(4));
        $written = @file_put_contents($tmp, $yaml, LOCK_EX);
        if ($written === false) {
            @unlink($tmp);
            throw new ApiException('Unable to write temporary config file', 500);
        }
        if (!@rename($tmp, $path)) {
            @unlink($tmp);
            throw new ApiException('Unable to replace config file', 500);
        }
        @chmod($path, 0600);
        try {
            Yaml::parseFile($path);
        } catch (\Throwable $e) {
            throw new ApiException('Config write produced unreadable YAML', 500);
        }
        $this->document = $document;
    }

    /**
     * @param mixed $value
     *
     * @return mixed
     */
    private function validateAndCoerce(string $key, $value) {
        switch ($key) {
            case 'timezone':
                $tz = trim((string) $value);
                if ($tz === '' || !in_array($tz, \DateTimeZone::listIdentifiers(), true)) {
                    throw new ApiException('Invalid timezone', 400);
                }

                return $tz;

            case 'card_enabled':
            case 'cal_enabled':
            case 'files_enabled':
            case 'tasks_enabled':
            case 'notes_enabled':
            case 'push_enabled':
            case 'portal_admin_ui_enabled':
                return $this->toBool($value);

            case 'files_storage_path':
                $path = trim((string) $value);
                if ($path === '') {
                    return '';
                }
                if (str_contains($path, "\0")) {
                    throw new ApiException('Invalid files storage path', 400);
                }
                // Absolute path only; reject relative traversal segments
                if ($path[0] !== '/') {
                    throw new ApiException('WebDAV file storage path must be absolute (or empty for default)', 400);
                }
                if (preg_match('#/\.\.(/|$)#', $path) || str_contains($path, '/../')) {
                    throw new ApiException('WebDAV file storage path must not contain ".." segments', 400);
                }

                return $path;

            case 'invite_from':
            case 'push_external_url':
            case 'portal_admin_users':
                return is_array($value) ? $value : trim((string) $value);

            case 'files_max_upload_mb':
                return max(1, min(1048576, (int) $value));

            case 'files_quota_mb':
                return max(0, min(1073741824, (int) $value));

            case 'files_quarantine_days':
                return max(0, min(36500, (int) $value));

            case 'session_max_age_minutes':
                return max(1, min(10080, (int) $value));

            case 'dav_auth_type':
                $t = (string) $value;
                if (!in_array($t, ['Digest', 'Basic', 'Apache'], true)) {
                    throw new ApiException('Invalid DAV auth type', 400);
                }

                return $t;

            case 'push_log_level':
            case 'portal_log_level':
                $l = strtolower(trim((string) $value));
                if (!in_array($l, ['off', 'error', 'warn', 'info', 'debug'], true)) {
                    throw new ApiException('Invalid log level', 400);
                }

                return $l;

            case 'portal_time_format':
                $f = strtolower(trim((string) $value));
                if (!in_array($f, ['auto', '12h', '24h'], true)) {
                    throw new ApiException('Invalid time format', 400);
                }

                return $f;

            case 'portal_week_start':
                $w = strtolower(trim((string) $value));
                if (!in_array($w, ['auto', 'monday', 'sunday'], true)) {
                    throw new ApiException('Invalid week start', 400);
                }

                return $w;

            case 'push_max_subscriptions_per_principal':
                return max(1, min(1000, (int) $value));
            case 'push_max_subscriptions_per_resource':
                return max(1, min(5000, (int) $value));
            case 'push_max_registrations_per_hour':
                return max(1, min(1000, (int) $value));
            case 'push_worker_batch_size':
                return max(1, min(100, (int) $value));
            case 'push_worker_poll_ms':
                return max(250, min(10000, (int) $value));
            case 'push_max_delivery_attempts':
                return max(1, min(10, (int) $value));

            default:
                return $value;
        }
    }

    /**
     * @param mixed $v
     */
    private function toBool($v): bool {
        if (is_bool($v)) {
            return $v;
        }
        if (is_int($v) || is_float($v)) {
            return (int) $v !== 0;
        }
        if (is_string($v)) {
            $s = strtolower(trim($v));

            return !in_array($s, ['', '0', 'false', 'off', 'no'], true);
        }

        return (bool) $v;
    }

    /**
     * @return mixed
     */
    private function defaultFor(string $key) {
        $defaults = [
            'timezone'                => 'UTC',
            'card_enabled'            => true,
            'cal_enabled'             => true,
            'files_enabled'           => false,
            'files_storage_path'      => '',
            'files_max_upload_mb'     => 1024,
            'files_quota_mb'          => 10240,
            'files_quarantine_days'   => 30,
            'tasks_enabled'           => true,
            'notes_enabled'           => false,
            'invite_from'             => '',
            'dav_auth_type'           => 'Digest',
            'session_max_age_minutes' => 15,
            'push_enabled'            => false,
            'push_external_url'       => '',
            'push_log_level'          => 'off',
            'push_max_subscriptions_per_principal' => 20,
            'push_max_subscriptions_per_resource'  => 100,
            'push_max_registrations_per_hour'      => 30,
            'push_worker_batch_size'               => 20,
            'push_worker_poll_ms'                  => 2000,
            'push_max_delivery_attempts'           => 5,
            'portal_log_level'        => 'off',
            'portal_time_format'      => 'auto',
            'portal_week_start'       => 'auto',
            'portal_admin_users'      => '',
            'portal_admin_ui_enabled' => true,
        ];

        return $defaults[$key] ?? null;
    }
}
