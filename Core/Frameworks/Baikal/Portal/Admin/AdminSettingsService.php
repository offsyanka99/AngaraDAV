<?php

namespace Baikal\Portal\Admin;

use Baikal\Portal\ApiException;
use Symfony\Component\Yaml\Yaml;

/**
 * Read/write system settings from baikal.yaml (Standard config section).
 * Database section: read always; write requires body.confirm === "CONFIRM" (Phase 8.2).
 *
 * Never returns admin_passwordhash — only hasAdminPassword.
 * Never returns pgsql_password / encryption_key — only has* flags.
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

    /**
     * Absolute path to Specific/ (INSTALL_DISABLED lives here).
     * Empty string → resolve from PROJECT_PATH_SPECIFIC or config parent sibling.
     *
     * @var string
     */
    private $specificDir;

    /** @var array<string, mixed> In-memory config document (loaded on construct / refresh) */
    private $document;

    public function __construct(string $configPath, string $specificDir = '') {
        $this->configPath = $configPath;
        $this->specificDir = $this->resolveSpecificDir($specificDir);
        $this->document = $this->loadDocument();
    }

    private function resolveSpecificDir(string $specificDir): string {
        if ($specificDir !== '') {
            return rtrim($specificDir, '/');
        }
        if (defined('PROJECT_PATH_SPECIFIC') && PROJECT_PATH_SPECIFIC !== '') {
            return rtrim((string) PROJECT_PATH_SPECIFIC, '/');
        }
        // config/ and Specific/ are siblings under the project root
        $configDir = dirname($this->configPath);
        $sibling = dirname($configDir) . '/Specific';
        if (is_dir($sibling)) {
            return $sibling;
        }

        return $configDir;
    }

    private function installDisabledPath(): string {
        return $this->specificDir . '/INSTALL_DISABLED';
    }

    /**
     * Allow-listed settings keys (used by AdminBackupService to build/validate backups).
     *
     * @return list<string>
     */
    public function editableKeys(): array {
        return self::EDITABLE_KEYS;
    }

    /** True when $key must never be accepted from a request/backup body. */
    public function isForbiddenKey(string $key): bool {
        return in_array($key, self::FORBIDDEN_BODY_KEYS, true);
    }

    /**
     * Validate + coerce a single value for $key without persisting it
     * (used by AdminBackupService to preview a restore before writing).
     *
     * @param mixed $value
     *
     * @return mixed
     *
     * @throws ApiException when $value is invalid for $key
     */
    public function coerceSettingValue(string $key, $value) {
        return $this->validateAndCoerce($key, $value);
    }

    /**
     * Factory-reset: wipe config, database, DAV data, and file homes so
     * /portal/install/ starts clean.
     *
     * Removes (after backing up baikal.yaml only):
     *   - config/baikal.yaml
     *   - Specific/INSTALL_DISABLED
     *   - SQLite DB file (or all tables for PostgreSQL)
     *   - WebDAV file storage + quarantine
     *   - Other Specific runtime state (logs, rate files, push identity, …)
     *
     * Requires explicit confirm=true.
     * Honours BAIKAL_LOCK_INSTALL unless BAIKAL_ALLOW_REINSTALL=1.
     *
     * @return array{ok: true, redirectUrl: string, backupPath: string|null, wiped: list<string>}
     */
    public function resetToDefault(bool $confirm): array {
        if (!$confirm) {
            throw new ApiException('Confirmation required: set confirm to true after acknowledging the reset', 400);
        }

        $forceLock = getenv('BAIKAL_LOCK_INSTALL') === '1';
        $allowReinstall = getenv('BAIKAL_ALLOW_REINSTALL') === '1';
        if ($forceLock && !$allowReinstall) {
            throw new ApiException('Installer is locked (BAIKAL_LOCK_INSTALL=1). Set BAIKAL_ALLOW_REINSTALL=1 to allow reset to default.', 403);
        }

        // Fresh read so we know DB + files paths before deleting yaml
        $this->document = $this->loadDocument();
        $wiped = [];

        // 1) Database (users, calendars, contacts, …)
        $this->wipeDatabase($wiped);

        // 2) WebDAV file homes / quarantine
        $this->wipeFileStorage($wiped);

        // 3) Other Specific runtime state (keep directory itself)
        $this->wipeSpecificRuntimeState($wiped);

        // 4) Config yaml (backup first)
        $configDir = dirname($this->configPath);
        $backupPath = null;
        if (is_file($this->configPath)) {
            if (!is_writable($this->configPath) && !is_writable($configDir)) {
                throw new ApiException('Config file is not writable', 503);
            }
            $backupPath = $this->configPath . '.bak.' . date('Ymd-His') . '.' . bin2hex(random_bytes(3));
            if (!@copy($this->configPath, $backupPath)) {
                throw new ApiException('Unable to backup baikal.yaml before reset', 500);
            }
            @chmod($backupPath, 0600);
            if (!@unlink($this->configPath)) {
                throw new ApiException('Unable to remove baikal.yaml', 500);
            }
            $wiped[] = 'baikal.yaml';
        }

        // 5) Install lock
        $installDisabled = $this->installDisabledPath();
        if (is_file($installDisabled)) {
            if (!is_writable($installDisabled) && !is_writable(dirname($installDisabled))) {
                throw new ApiException('Unable to remove INSTALL_DISABLED (not writable)', 503);
            }
            if (!@unlink($installDisabled)) {
                throw new ApiException('Unable to remove INSTALL_DISABLED', 500);
            }
            $wiped[] = 'INSTALL_DISABLED';
        }

        $this->document = ['system' => []];

        return [
            'ok'          => true,
            'redirectUrl' => '/portal/install/',
            'backupPath'  => $backupPath,
            'wiped'       => $wiped,
        ];
    }

    /**
     * @param list<string> $wiped
     */
    private function wipeDatabase(array &$wiped): void {
        $db = is_array($this->document['database'] ?? null) ? $this->document['database'] : [];
        $backend = strtolower(trim((string) ($db['backend'] ?? '')));
        if ($backend === '') {
            if (trim((string) ($db['sqlite_file'] ?? '')) !== '') {
                $backend = 'sqlite';
            } elseif (trim((string) ($db['pgsql_host'] ?? '')) !== '') {
                $backend = 'pgsql';
            }
        }

        if ($backend === 'sqlite' || $backend === '') {
            $sqlite = trim((string) ($db['sqlite_file'] ?? ''));
            if ($sqlite === '') {
                $sqlite = $this->specificDir . '/db/db.sqlite';
            }
            foreach ([$sqlite, $sqlite . '-wal', $sqlite . '-shm', $sqlite . '-journal'] as $f) {
                if (is_file($f)) {
                    if (!@unlink($f)) {
                        throw new ApiException('Unable to remove database file: ' . $f, 500);
                    }
                    $wiped[] = basename($f);
                }
            }

            // Empty default db directory is fine to keep
            return;
        }

        if ($backend === 'pgsql') {
            $host = trim((string) ($db['pgsql_host'] ?? ''));
            $dbname = trim((string) ($db['pgsql_dbname'] ?? ''));
            $username = (string) ($db['pgsql_username'] ?? '');
            $password = (string) ($db['pgsql_password'] ?? '');
            if ($host === '' || $dbname === '') {
                $wiped[] = 'pgsql:skipped-incomplete-config';

                return;
            }
            try {
                $pdo = new \PDO(
                    'pgsql:host=' . $this->pgsqlHostDsn($host) . ';dbname=' . $dbname,
                    $username,
                    $password,
                    [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]
                );
                // Drop all objects in public schema (users, calendars, …)
                $pdo->exec('DROP SCHEMA IF EXISTS public CASCADE');
                $pdo->exec('CREATE SCHEMA public');
                // Restore default grants when possible
                if ($username !== '') {
                    try {
                        $pdo->exec('GRANT ALL ON SCHEMA public TO ' . $this->pgsqlIdent($username));
                        $pdo->exec('GRANT ALL ON SCHEMA public TO public');
                    } catch (\Throwable $e) {
                        // Non-fatal: superuser may not need grants
                    }
                }
                $wiped[] = 'pgsql:schema-dropped';
            } catch (\Throwable $e) {
                throw new ApiException('Unable to wipe PostgreSQL database: ' . $e->getMessage(), 500);
            }
        }
    }

    private function pgsqlHostDsn(string $host): string {
        // host may be "name:port"
        if (preg_match('/^(.+):(\d+)$/', $host, $m)) {
            return $m[1] . ';port=' . $m[2];
        }

        return $host;
    }

    private function pgsqlIdent(string $ident): string {
        // Quote identifier safely (alphanumeric + underscore only for reset grants)
        if (!preg_match('/^[A-Za-z_][A-Za-z0-9_]*$/', $ident)) {
            return 'PUBLIC';
        }

        return '"' . $ident . '"';
    }

    /**
     * @param list<string> $wiped
     */
    private function wipeFileStorage(array &$wiped): void {
        $sys = is_array($this->document['system'] ?? null) ? $this->document['system'] : [];
        $custom = trim((string) ($sys['files_storage_path'] ?? ''));
        $paths = [];
        if ($custom !== '' && $custom[0] === '/') {
            $paths[] = $custom;
        }
        $paths[] = $this->specificDir . '/files';
        $paths[] = $this->specificDir . '/files_quarantine';
        $paths[] = $this->specificDir . '/quarantine';
        foreach (array_unique($paths) as $p) {
            if (is_dir($p)) {
                $this->rmTree($p);
                $wiped[] = 'dir:' . basename($p);
            }
        }
    }

    /**
     * @param list<string> $wiped
     */
    private function wipeSpecificRuntimeState(array &$wiped): void {
        if (!is_dir($this->specificDir)) {
            return;
        }
        $keepDirs = ['db' => true, 'files' => true, 'files_quarantine' => true, 'quarantine' => true];
        $keepNames = ['.htaccess' => true, '.' => true, '..' => true];
        $entries = @scandir($this->specificDir);
        if (!is_array($entries)) {
            return;
        }
        foreach ($entries as $name) {
            if (isset($keepNames[$name])) {
                continue;
            }
            $full = $this->specificDir . '/' . $name;
            // Leave empty structural dirs; remove files and other dirs
            if (is_file($full) || is_link($full)) {
                if (@unlink($full)) {
                    $wiped[] = 'file:' . $name;
                }
            } elseif (is_dir($full) && !isset($keepDirs[$name])) {
                $this->rmTree($full);
                $wiped[] = 'dir:' . $name;
            }
        }
        // Clear db dir contents if SQLite path was outside or residual files remain
        $dbDir = $this->specificDir . '/db';
        if (is_dir($dbDir)) {
            $dbEntries = @scandir($dbDir) ?: [];
            foreach ($dbEntries as $name) {
                if ($name === '.' || $name === '..') {
                    continue;
                }
                $full = $dbDir . '/' . $name;
                if (is_file($full) || is_link($full)) {
                    @unlink($full);
                    $wiped[] = 'db/' . $name;
                }
            }
        }
    }

    private function rmTree(string $path): void {
        if (!is_dir($path)) {
            if (is_file($path) || is_link($path)) {
                @unlink($path);
            }

            return;
        }
        $items = @scandir($path);
        if (!is_array($items)) {
            return;
        }
        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            $full = $path . '/' . $item;
            if (is_dir($full) && !is_link($full)) {
                $this->rmTree($full);
            } else {
                @unlink($full);
            }
        }
        @rmdir($path);
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
        // admin_passwordhash is never copied into $out (not in EDITABLE_KEYS)

        $out['configured_version'] = (string) ($sys['configured_version'] ?? (defined('BAIKAL_VERSION') ? BAIKAL_VERSION : ''));
        $out['auth_realm'] = (string) ($sys['auth_realm'] ?? 'BaikalDAV');
        $out['writable'] = $this->isWritable();

        return $out;
    }

    /**
     * Database connection summary (Phase 8).
     *
     * Never returns pgsql_password or encryption_key material.
     * Writes require updateDatabaseSettings() with confirm === "CONFIRM".
     *
     * @return array{
     *   backend: string,
     *   sqlite_file: string,
     *   pgsql_host: string,
     *   pgsql_dbname: string,
     *   pgsql_username: string,
     *   hasPassword: bool,
     *   hasEncryptionKey: bool,
     *   writeEnabled: true,
     *   writable: bool,
     *   warning: string
     * }
     */
    public function getDatabaseSettings(): array {
        // Fresh read so operators see latest changes
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
            'writeEnabled'      => true,
            'writable'          => $this->isWritable(),
            'warning'           => 'Changing database settings can take the instance offline. You must type CONFIRM before save. Back up config and data first.',
        ];
    }

    /**
     * Update database connection settings (Phase 8.2).
     * Requires body.confirm === "CONFIRM" (exact). Never accepts encryption_key.
     * Empty pgsql_password leaves the stored password unchanged.
     *
     * @param array<string, mixed> $body
     *
     * @return array<string, mixed>
     */
    /**
     * Probe DB connectivity without writing YAML.
     * Empty pgsql_password uses the currently stored password when present.
     *
     * @param array<string, mixed> $body
     *
     * @return array{ok: true, backend: string, message: string}
     */
    public function testDatabaseConnection(array $body): array {
        $this->assertNoForbiddenBodyKeys($body);
        if (array_key_exists('encryption_key', $body) || array_key_exists('encryptionKey', $body)) {
            throw new ApiException('Refusing to accept encryption_key in request body', 400);
        }
        $this->document = $this->loadDocument();
        $merged = $this->mergeDatabaseBody($body);
        $this->assertDatabaseReachable($merged);

        return [
            'ok'      => true,
            'backend' => (string) $merged['backend'],
            'message' => $merged['backend'] === 'sqlite'
                ? 'SQLite path is reachable and writable.'
                : 'PostgreSQL connection succeeded.',
        ];
    }

    public function updateDatabaseSettings(array $body): array {
        if (!$this->isWritable()) {
            throw new ApiException('Config file is not writable', 503);
        }

        $confirm = trim((string) ($body['confirm'] ?? ''));
        if ($confirm !== 'CONFIRM') {
            throw new ApiException('Type CONFIRM exactly to change database settings', 400);
        }

        $this->assertNoForbiddenBodyKeys($body);
        // Extra hard reject for encryption_key even if not in FORBIDDEN list wording
        if (array_key_exists('encryption_key', $body) || array_key_exists('encryptionKey', $body)) {
            throw new ApiException('Refusing to accept encryption_key in request body', 400);
        }

        $this->document = $this->loadDocument();
        if (!isset($this->document['database']) || !is_array($this->document['database'])) {
            $this->document['database'] = [];
        }
        $db = &$this->document['database'];
        $merged = $this->mergeDatabaseBody($body);

        // Live connection test before writing (prevents bricking with unreachable DSN)
        $this->assertDatabaseReachable($merged);

        $db['backend'] = $merged['backend'];
        if ($merged['backend'] === 'sqlite') {
            $db['sqlite_file'] = $merged['sqlite_file'];
        } else {
            $db['pgsql_host'] = $merged['pgsql_host'];
            $db['pgsql_dbname'] = $merged['pgsql_dbname'];
            $db['pgsql_username'] = $merged['pgsql_username'];
            if (array_key_exists('pgsql_password', $merged)) {
                $db['pgsql_password'] = $merged['pgsql_password'];
            }
        }

        // Ensure encryption_key exists (generate if missing); never overwrite from body
        if (trim((string) ($db['encryption_key'] ?? '')) === '') {
            $db['encryption_key'] = bin2hex(random_bytes(32));
        }

        $this->writeDocument($this->document);

        return $this->getDatabaseSettings();
    }

    /**
     * Build candidate database settings from request body + current document.
     *
     * @param array<string, mixed> $body
     *
     * @return array<string, mixed>
     */
    private function mergeDatabaseBody(array $body): array {
        $current = is_array($this->document['database'] ?? null) ? $this->document['database'] : [];
        $backend = strtolower(trim((string) ($body['backend'] ?? ($current['backend'] ?? 'sqlite'))));
        if (!in_array($backend, ['sqlite', 'pgsql'], true)) {
            throw new ApiException('Backend must be sqlite or pgsql', 400);
        }
        $out = ['backend' => $backend];
        if ($backend === 'sqlite') {
            $sqlite = trim((string) ($body['sqlite_file'] ?? ($current['sqlite_file'] ?? '')));
            if ($sqlite === '') {
                throw new ApiException('SQLite file path is required', 400);
            }
            if ($sqlite[0] !== '/') {
                throw new ApiException('SQLite file path must be absolute', 400);
            }
            if (str_contains($sqlite, "\0") || preg_match('#/\.\.(/|$)#', $sqlite)) {
                throw new ApiException('Invalid SQLite path', 400);
            }
            $out['sqlite_file'] = $sqlite;
        } else {
            $host = trim((string) ($body['pgsql_host'] ?? ($current['pgsql_host'] ?? '')));
            $dbname = trim((string) ($body['pgsql_dbname'] ?? ($current['pgsql_dbname'] ?? '')));
            $username = trim((string) ($body['pgsql_username'] ?? ($current['pgsql_username'] ?? '')));
            if ($host === '' || $dbname === '') {
                throw new ApiException('PostgreSQL host and database name are required', 400);
            }
            $out['pgsql_host'] = $host;
            $out['pgsql_dbname'] = $dbname;
            $out['pgsql_username'] = $username;
            if (array_key_exists('pgsql_password', $body)) {
                $pw = (string) $body['pgsql_password'];
                if ($pw !== '') {
                    $out['pgsql_password'] = $pw;
                } elseif (isset($current['pgsql_password'])) {
                    $out['pgsql_password'] = (string) $current['pgsql_password'];
                } else {
                    $out['pgsql_password'] = '';
                }
            } else {
                $out['pgsql_password'] = (string) ($current['pgsql_password'] ?? '');
            }
        }

        return $out;
    }

    /**
     * @param array<string, mixed> $db
     */
    private function assertDatabaseReachable(array $db): void {
        $backend = (string) ($db['backend'] ?? 'sqlite');
        try {
            if ($backend === 'sqlite') {
                $file = (string) ($db['sqlite_file'] ?? '');
                $dir = dirname($file);
                if (!is_dir($dir)) {
                    if (!@mkdir($dir, 0755, true) && !is_dir($dir)) {
                        throw new ApiException('SQLite directory does not exist and could not be created: ' . $dir, 400);
                    }
                }
                if (!is_writable($dir)) {
                    throw new ApiException('SQLite directory is not writable: ' . $dir, 400);
                }
                if (is_file($file) && !is_writable($file)) {
                    throw new ApiException('SQLite file is not writable: ' . $file, 400);
                }
                $pdo = new \PDO('sqlite:' . $file, null, null, [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]);
                $pdo->query('SELECT 1');
            } else {
                $host = (string) ($db['pgsql_host'] ?? '');
                $dbname = (string) ($db['pgsql_dbname'] ?? '');
                $username = (string) ($db['pgsql_username'] ?? '');
                $password = (string) ($db['pgsql_password'] ?? '');
                $dsnHost = $host;
                $port = null;
                if (preg_match('/^(.+):(\d+)$/', $host, $m)) {
                    $dsnHost = $m[1];
                    $port = $m[2];
                }
                $dsn = 'pgsql:host=' . $dsnHost . ($port ? ';port=' . $port : '') . ';dbname=' . $dbname;
                $pdo = new \PDO($dsn, $username, $password, [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]);
                $pdo->query('SELECT 1');
            }
        } catch (ApiException $e) {
            throw $e;
        } catch (\Throwable $e) {
            throw new ApiException('Database connection failed: ' . $e->getMessage(), 400);
        }
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
                throw new ApiException('Refusing to accept secret or internal field "' . $key . '" in request body', 400);
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
