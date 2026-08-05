<?php

namespace Baikal\Portal\Install;

use Baikal\Portal\ApiException;
use Symfony\Component\Yaml\Yaml;

/**
 * Unauthenticated bootstrap / upgrade service for /api/install/* and /portal/install/.
 *
 * Does not use portal Admin role. Honours INSTALL_DISABLED, BAIKAL_LOCK_INSTALL,
 * and BAIKAL_ALLOW_REINSTALL the same way as classic /admin/install/.
 */
class InstallService {
    private const RATE_MAX = 30;
    private const RATE_WINDOW = 900;
    private const CSRF_SESSION_KEY = 'baikal_install_csrf';
    /** Held only for the install wizard session until database step creates the DAV user. */
    private const ADMIN_PASSWORD_SESSION_KEY = 'baikal_install_admin_password';
    private const PORTAL_ADMIN_USERNAME = 'admin';

    /** @var string */
    private $configPath;

    /** @var string */
    private $specificDir;

    public function __construct(?string $configPath = null, ?string $specificDir = null) {
        $this->configPath = $configPath !== null && $configPath !== ''
            ? $configPath
            : (defined('PROJECT_PATH_CONFIG')
                ? rtrim((string) PROJECT_PATH_CONFIG, '/') . '/baikal.yaml'
                : '');
        $this->specificDir = $specificDir !== null && $specificDir !== ''
            ? rtrim($specificDir, '/')
            : (defined('PROJECT_PATH_SPECIFIC')
                ? rtrim((string) PROJECT_PATH_SPECIFIC, '/')
                : dirname(dirname($this->configPath)) . '/Specific');
    }

    /**
     * @return array<string, mixed>
     */
    public function status(): array {
        $perms = $this->permissions();
        $csrf = $this->csrfToken();
        $productVersion = defined('BAIKAL_VERSION') ? (string) BAIKAL_VERSION : '';
        $base = [
            'csrfToken'       => $csrf,
            'productVersion'  => $productVersion,
            'installUrl'      => '/portal/install/',
            'portalUrl'       => '/portal/',
            'portalAdminUrl'  => '/portal/#admin',
            'permissions'     => $perms,
            'pdoDrivers'      => \PDO::getAvailableDrivers(),
            'defaults'        => $this->defaults(),
        ];

        if (!$perms['ok']) {
            return array_merge($base, [
                'step'    => 'permissions',
                'locked'  => false,
                'message' => 'Config and Specific directories must be writable by the PHP process.',
            ]);
        }

        $config = $this->loadConfig();
        $sys = is_array($config['system'] ?? null) ? $config['system'] : [];
        $configuredVersion = isset($sys['configured_version']) ? (string) $sys['configured_version'] : '';
        $hasAdminPassword = trim((string) ($sys['admin_passwordhash'] ?? '')) !== '';
        $installDisabled = is_file($this->installDisabledPath());
        $envLocked = $this->isEnvHardLocked();

        if ($config === null || $configuredVersion === '') {
            return array_merge($base, [
                'step'              => 'initialize',
                'locked'            => false,
                'configuredVersion' => null,
                'hasAdminPassword'  => false,
                'message'           => 'Configure server settings and the classic admin password.',
            ]);
        }

        if (!$hasAdminPassword) {
            return array_merge($base, [
                'step'              => 'initialize',
                'locked'            => false,
                'configuredVersion' => $configuredVersion,
                'hasAdminPassword'  => false,
                'message'           => 'Set the classic Web Admin password to continue.',
            ]);
        }

        // Version upgrade (same gate as classic install index)
        if ($configuredVersion !== $productVersion) {
            return array_merge($base, [
                'step'              => 'upgrade',
                'locked'            => false,
                'configuredVersion' => $configuredVersion,
                'hasAdminPassword'  => true,
                'message'           => 'Product version differs from configured_version; confirm upgrade.',
            ]);
        }

        if ($envLocked) {
            // Match classic: force marker when hard-locked without ALLOW_REINSTALL
            if (!$installDisabled) {
                @touch($this->installDisabledPath());
            }

            return array_merge($base, [
                'step'              => 'locked',
                'locked'            => true,
                'configuredVersion' => $configuredVersion,
                'hasAdminPassword'  => true,
                'message'           => 'Installer is locked (BAIKAL_LOCK_INSTALL=1). Set BAIKAL_ALLOW_REINSTALL=1 to re-open.',
            ]);
        }

        if ($installDisabled) {
            return array_merge($base, [
                'step'              => 'done',
                'locked'            => true,
                'configuredVersion' => $configuredVersion,
                'hasAdminPassword'  => true,
                'message'           => 'Installation already completed. Use the portal Administration UI.',
            ]);
        }

        return array_merge($base, [
            'step'              => 'database',
            'locked'            => false,
            'configuredVersion' => $configuredVersion,
            'hasAdminPassword'  => true,
            'message'           => 'Configure the database backend and finish install.',
        ]);
    }

    /**
     * @param array<string, mixed> $body
     *
     * @return array<string, mixed>
     */
    public function initialize(array $body): array {
        $this->assertNotHardLockedForMutations();
        $this->assertRateLimit();
        $status = $this->status();
        if (!in_array($status['step'], ['initialize'], true)) {
            throw new ApiException('Initialize step is not available (current step: ' . (string) $status['step'] . ')', 409);
        }
        if (!$this->permissions()['ok']) {
            throw new ApiException('Config/Specific directories are not writable', 503);
        }

        $password = (string) ($body['admin_password'] ?? '');
        $passwordConfirm = (string) ($body['admin_password_confirm'] ?? $body['admin_passwordConfirm'] ?? '');
        if ($password === '' || $passwordConfirm === '') {
            throw new ApiException('Admin password and confirmation are required', 400);
        }
        if ($password !== $passwordConfirm) {
            throw new ApiException('Admin password confirmation does not match', 400);
        }
        if (strlen($password) < 8) {
            throw new ApiException('Admin password must be at least 8 characters', 400);
        }

        $timezone = trim((string) ($body['timezone'] ?? ''));
        if ($timezone === '' || !in_array($timezone, \DateTimeZone::listIdentifiers(), true)) {
            throw new ApiException('Invalid timezone', 400);
        }

        $davAuth = (string) ($body['dav_auth_type'] ?? 'Digest');
        if (!in_array($davAuth, ['Digest', 'Basic', 'Apache'], true)) {
            throw new ApiException('Invalid DAV auth type', 400);
        }

        $this->createHtaccessFilesIfNeeded();

        $std = new \Baikal\Model\Config\Standard();
        $std->set('timezone', $timezone);
        $std->set('card_enabled', $this->toBool($body['card_enabled'] ?? true));
        $std->set('cal_enabled', $this->toBool($body['cal_enabled'] ?? true));
        $std->set('tasks_enabled', $this->toBool($body['tasks_enabled'] ?? true));
        $std->set('notes_enabled', $this->toBool($body['notes_enabled'] ?? false));
        $std->set('files_enabled', $this->toBool($body['files_enabled'] ?? false));
        $std->set('invite_from', trim((string) ($body['invite_from'] ?? '')));
        $std->set('dav_auth_type', $davAuth);
        $std->set('session_max_age_minutes', max(1, min(10080, (int) ($body['session_max_age_minutes'] ?? 15))));
        $std->set('configured_version', defined('BAIKAL_VERSION') ? BAIKAL_VERSION : '2.0.0');
        $std->set('admin_passwordhash', $password);
        $std->persist();

        // portal_admin_users is not on Config\Standard morphology; write via YAML merge
        $this->ensurePortalAdminUsersYaml();

        // Keep password for database step → create DAV user "admin" for /portal/ login
        $this->storeBootstrapAdminPassword($password);

        // Legacy pre-0.7 cleanup (same as classic Initialize)
        if (is_file($this->specificDir . '/INSTALL_DISABLED')) {
            @unlink($this->specificDir . '/INSTALL_DISABLED');
        }
        if (is_file($this->specificDir . '/config.php')) {
            @unlink($this->specificDir . '/config.php');
        }

        $db = new \Baikal\Model\Config\Database();
        if (trim((string) $db->get('encryption_key')) === '') {
            $db->set('encryption_key', bin2hex(random_bytes(32)));
        }
        $drivers = \PDO::getAvailableDrivers();
        if (in_array('sqlite', $drivers, true)) {
            $db->set('backend', 'sqlite');
        } else {
            $db->set('backend', 'pgsql');
        }
        $db->persist();

        $this->registerRateAttempt();

        $out = $this->status();
        $out['portalUser'] = self::PORTAL_ADMIN_USERNAME;
        $out['message'] = 'Server settings saved. Next: configure the database. '
            . 'DAV user “' . self::PORTAL_ADMIN_USERNAME . '” will be created with this password for /portal/ login.';

        return $out;
    }

    /**
     * @param array<string, mixed> $body
     *
     * @return array<string, mixed>
     */
    public function configureDatabase(array $body): array {
        $this->assertNotHardLockedForMutations();
        $this->assertRateLimit();
        $status = $this->status();
        if (($status['step'] ?? '') !== 'database') {
            throw new ApiException('Database step is not available (current step: ' . (string) ($status['step'] ?? '?') . ')', 409);
        }

        $backend = strtolower(trim((string) ($body['backend'] ?? 'sqlite')));
        if (!in_array($backend, ['sqlite', 'pgsql'], true)) {
            throw new ApiException('Backend must be sqlite or pgsql', 400);
        }

        if ($backend === 'sqlite') {
            $this->setupSqlite(trim((string) ($body['sqlite_file'] ?? '')));
        } else {
            $this->setupPgsql($body);
        }

        // Remove legacy system.php if present
        if (is_file($this->specificDir . '/config.system.php')) {
            @unlink($this->specificDir . '/config.system.php');
        }

        // Create DAV user "admin" so the install password works on /portal/
        $portalUserCreated = $this->ensurePortalAdminUser($backend === 'sqlite'
            ? trim((string) ($body['sqlite_file'] ?? ($this->specificDir . '/db/db.sqlite')))
            : null, $body);

        @touch($this->installDisabledPath());
        $this->registerRateAttempt();
        $this->clearBootstrapAdminPassword();

        $out = $this->status();
        $out['completed'] = true;
        $out['nextUrl'] = '/portal/';
        $out['portalUser'] = self::PORTAL_ADMIN_USERNAME;
        $out['portalUserCreated'] = $portalUserCreated;
        $out['message'] = $portalUserCreated
            ? 'Install complete. Log in to /portal/ as user “' . self::PORTAL_ADMIN_USERNAME
                . '” with the admin password you set.'
            : 'Install complete. Portal user “' . self::PORTAL_ADMIN_USERNAME
                . '” could not be created automatically — create it under classic admin or re-run install.';
        $envNote = $this->portalAdminEnvNote();
        if ($envNote !== '') {
            $out['message'] .= ' ' . $envNote;
        }

        return $out;
    }

    private function portalAdminEnvNote(): string {
        $raw = getenv('PORTAL_ADMIN_USERS');
        if ($raw === false || $raw === '') {
            $raw = getenv('BAIKAL_PORTAL_ADMIN_USERS');
        }
        if ($raw === false || trim((string) $raw) === '') {
            return '';
        }
        $parts = preg_split('/[\s,]+/', (string) $raw) ?: [];
        foreach ($parts as $u) {
            if ($u !== '' && strcasecmp($u, self::PORTAL_ADMIN_USERNAME) === 0) {
                return '';
            }
        }

        return 'Note: PORTAL_ADMIN_USERS=' . trim((string) $raw)
            . ' is set, so “' . self::PORTAL_ADMIN_USERNAME
            . '” can log in to the portal but may not see Administration until that env list includes “admin” (or is cleared).';
    }

    /**
     * Create or update DAV user "admin" with the bootstrap password (same as classic admin password).
     *
     * @param array<string, mixed> $body Database step body (pgsql credentials when needed)
     */
    private function ensurePortalAdminUser(?string $sqliteFile, array $body): bool {
        $password = $this->bootstrapAdminPassword();
        if ($password === null || $password === '') {
            return false;
        }

        $config = $this->loadConfig();
        if ($config === null) {
            return false;
        }
        $sys = is_array($config['system'] ?? null) ? $config['system'] : [];
        $db = is_array($config['database'] ?? null) ? $config['database'] : [];
        $realm = (string) ($sys['auth_realm'] ?? 'BaikalDAV');
        $backend = strtolower(trim((string) ($db['backend'] ?? 'sqlite')));

        try {
            if ($backend === 'pgsql') {
                $host = trim((string) ($db['pgsql_host'] ?? $body['pgsql_host'] ?? ''));
                $dbname = trim((string) ($db['pgsql_dbname'] ?? $body['pgsql_dbname'] ?? ''));
                $username = (string) ($db['pgsql_username'] ?? $body['pgsql_username'] ?? '');
                $pgPassword = (string) ($db['pgsql_password'] ?? $body['pgsql_password'] ?? '');
                $dsnHost = $host;
                $port = null;
                if (preg_match('/^(.+):(\d+)$/', $host, $m)) {
                    $dsnHost = $m[1];
                    $port = $m[2];
                }
                $dsn = 'pgsql:host=' . $dsnHost . ($port ? ';port=' . $port : '') . ';dbname=' . $dbname;
                $pdo = new \PDO($dsn, $username, $pgPassword, [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]);
            } else {
                $file = $sqliteFile ?: (string) ($db['sqlite_file'] ?? ($this->specificDir . '/db/db.sqlite'));
                $pdo = new \PDO('sqlite:' . $file, null, null, [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]);
            }
        } catch (\Throwable $e) {
            error_log('install: unable to open DB for portal admin user: ' . $e->getMessage());

            return false;
        }

        $userService = new \Baikal\Portal\Admin\AdminUserService($pdo, $config);
        $uname = self::PORTAL_ADMIN_USERNAME;
        // filter_var rejects some bare hostnames (e.g. localhost); prefer a valid domain
        $inviteHost = (string) ($_SERVER['SERVER_NAME'] ?? '');
        if ($inviteHost === '' || $inviteHost === 'localhost' || !str_contains($inviteHost, '.')) {
            $email = 'admin@example.local';
        } else {
            $email = 'admin@' . $inviteHost;
        }
        try {
            // If user already exists (reinstall without full wipe), update password
            $exists = $pdo->prepare('SELECT username FROM users WHERE username = ?');
            $exists->execute([$uname]);
            if ($exists->fetch()) {
                $userService->updateUser($uname, [
                    'displayname'     => 'Administrator',
                    'email'           => $email,
                    'password'        => $password,
                    'passwordConfirm' => $password,
                ]);
            } else {
                $userService->createUser([
                    'username'        => $uname,
                    'displayname'     => 'Administrator',
                    'email'           => $email,
                    'password'        => $password,
                    'passwordConfirm' => $password,
                ]);
            }
            // Sanity: digesta1 must match portal Auth scheme
            $digest = md5($uname . ':' . $realm . ':' . $password);
            $chk = $pdo->prepare('SELECT digesta1 FROM users WHERE username = ?');
            $chk->execute([$uname]);
            $row = $chk->fetch(\PDO::FETCH_ASSOC);
            if (!$row || !hash_equals((string) $row['digesta1'], $digest)) {
                $upd = $pdo->prepare('UPDATE users SET digesta1 = ? WHERE username = ?');
                $upd->execute([$digest, $uname]);
            }

            return true;
        } catch (\Throwable $e) {
            error_log('install: create portal admin user failed: ' . $e->getMessage());

            return false;
        }
    }

    /**
     * When PORTAL_ADMIN_USERS env is unset, grant portal Admin role to DAV user "admin".
     */
    private function ensurePortalAdminUsersYaml(): void {
        $envAdmins = getenv('PORTAL_ADMIN_USERS');
        if ($envAdmins === false || $envAdmins === '') {
            $envAdmins = getenv('BAIKAL_PORTAL_ADMIN_USERS');
        }
        if ($envAdmins !== false && trim((string) $envAdmins) !== '') {
            return; // env wins; do not fight it in YAML
        }
        $config = $this->loadConfig();
        if ($config === null) {
            $config = [];
        }
        if (!isset($config['system']) || !is_array($config['system'])) {
            $config['system'] = [];
        }
        $config['system']['portal_admin_users'] = self::PORTAL_ADMIN_USERNAME;
        try {
            \Baikal\Model\Config::writeConfigFile($config);
        } catch (\Throwable $e) {
            error_log('install: unable to set portal_admin_users: ' . $e->getMessage());
        }
    }

    private function storeBootstrapAdminPassword(string $password): void {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            \Baikal\Portal\Auth::startSession();
        }
        $_SESSION[self::ADMIN_PASSWORD_SESSION_KEY] = $password;
    }

    private function bootstrapAdminPassword(): ?string {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            \Baikal\Portal\Auth::startSession();
        }
        $p = $_SESSION[self::ADMIN_PASSWORD_SESSION_KEY] ?? null;

        return is_string($p) && $p !== '' ? $p : null;
    }

    private function clearBootstrapAdminPassword(): void {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            return;
        }
        unset($_SESSION[self::ADMIN_PASSWORD_SESSION_KEY]);
    }

    /**
     * @return array<string, mixed>
     */
    public function upgrade(bool $confirm): array {
        $this->assertRateLimit();
        if (!$confirm) {
            throw new ApiException('Confirmation required: set confirm to true', 400);
        }
        $status = $this->status();
        if (($status['step'] ?? '') !== 'upgrade') {
            throw new ApiException('Upgrade step is not available (current step: ' . (string) ($status['step'] ?? '?') . ')', 409);
        }

        $config = $this->loadConfig();
        if ($config === null) {
            throw new ApiException('Config missing', 500);
        }
        $from = (string) ($config['system']['configured_version'] ?? '');
        $to = defined('BAIKAL_VERSION') ? (string) BAIKAL_VERSION : '';

        $isLegacyMysql = !empty($config['database']['mysql']);
        $isMysqlBackend = ($config['database']['backend'] ?? '') === 'mysql';
        if ($isLegacyMysql || $isMysqlBackend) {
            throw new ApiException(
                'MySQL is no longer supported. Migrate to PostgreSQL or SQLite before upgrading.',
                400
            );
        }

        // Ensure DB is available for schema migrations
        if (!isset($GLOBALS['DB']) || !is_object($GLOBALS['DB'])) {
            throw new ApiException('Database is not available for upgrade', 503);
        }

        $runner = new SchemaUpgrade();
        $result = $runner->run(
            is_array($config['database'] ?? null) ? $config['database'] : [],
            $from,
            $to
        );
        $this->registerRateAttempt();

        if (!$result['ok']) {
            throw new ApiException(
                'Upgrade failed: ' . implode('; ', $result['errors'] !== [] ? $result['errors'] : ['unknown error']),
                500
            );
        }

        return [
            'ok'                => true,
            'configuredVersion' => $to,
            'productVersion'    => $to,
            'messages'          => $result['success'],
            'step'              => $this->status()['step'],
            'nextUrl'           => '/portal/',
            'portalAdminUrl'    => '/portal/#admin',
        ];
    }

    public function csrfToken(): string {
        if (session_status() !== PHP_SESSION_ACTIVE) {
            \Baikal\Portal\Auth::startSession();
        }
        if (empty($_SESSION[self::CSRF_SESSION_KEY]) || !is_string($_SESSION[self::CSRF_SESSION_KEY])) {
            $_SESSION[self::CSRF_SESSION_KEY] = bin2hex(random_bytes(32));
        }

        return (string) $_SESSION[self::CSRF_SESSION_KEY];
    }

    public function assertCsrf(?string $token): void {
        $expected = $_SESSION[self::CSRF_SESSION_KEY] ?? '';
        if (!is_string($expected) || $expected === '' || $token === null || $token === '') {
            throw new ApiException('CSRF token missing', 403);
        }
        if (!hash_equals($expected, $token)) {
            throw new ApiException('CSRF token invalid', 403);
        }
    }

    /**
     * @return array{ok: bool, configWritable: bool, specificWritable: bool, configPath: string, specificPath: string}
     */
    public function permissions(): array {
        $configDir = dirname($this->configPath);
        $configWritable = (is_dir($configDir) && is_writable($configDir))
            || (is_file($this->configPath) && is_writable($this->configPath));
        $specificWritable = is_dir($this->specificDir) && is_writable($this->specificDir);

        return [
            'ok'               => $configWritable && $specificWritable,
            'configWritable'   => $configWritable,
            'specificWritable' => $specificWritable,
            'configPath'       => $configDir,
            'specificPath'     => $this->specificDir,
        ];
    }

    /**
     * @return array<string, mixed>|null
     */
    private function loadConfig(): ?array {
        if (!is_readable($this->configPath)) {
            return null;
        }
        try {
            $parsed = Yaml::parseFile($this->configPath);
        } catch (\Throwable $e) {
            throw new ApiException('Invalid baikal.yaml: ' . $e->getMessage(), 500);
        }

        return is_array($parsed) ? $parsed : null;
    }

    private function installDisabledPath(): string {
        return $this->specificDir . '/INSTALL_DISABLED';
    }

    private function isEnvHardLocked(): bool {
        return getenv('BAIKAL_LOCK_INSTALL') === '1' && getenv('BAIKAL_ALLOW_REINSTALL') !== '1';
    }

    private function assertNotHardLockedForMutations(): void {
        if ($this->isEnvHardLocked()) {
            throw new ApiException(
                'Installer is locked (BAIKAL_LOCK_INSTALL=1). Set BAIKAL_ALLOW_REINSTALL=1 to re-open.',
                403
            );
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function defaults(): array {
        $tz = getenv('TZ');
        $timezone = (is_string($tz) && $tz !== '' && in_array($tz, \DateTimeZone::listIdentifiers(), true))
            ? $tz
            : 'UTC';
        $invite = 'noreply@' . (string) ($_SERVER['SERVER_NAME'] ?? 'localhost');
        $sqliteDefault = $this->specificDir . '/db/db.sqlite';
        $drivers = \PDO::getAvailableDrivers();
        $backend = in_array('sqlite', $drivers, true) ? 'sqlite' : 'pgsql';

        return [
            'timezone'                => $timezone,
            'cal_enabled'             => true,
            'card_enabled'            => true,
            'tasks_enabled'           => true,
            'notes_enabled'           => false,
            'files_enabled'           => false,
            'invite_from'             => $invite,
            'dav_auth_type'           => 'Digest',
            'session_max_age_minutes' => 15,
            'backend'                 => $backend,
            'sqlite_file'             => $sqliteDefault,
            'pgsql_host'              => '',
            'pgsql_dbname'            => '',
            'pgsql_username'          => '',
        ];
    }

    private function setupSqlite(string $file): void {
        if ($file === '') {
            $file = $this->specificDir . '/db/db.sqlite';
        }
        if ($file[0] !== '/') {
            throw new ApiException('SQLite file path must be absolute', 400);
        }
        if (str_contains($file, "\0") || preg_match('#/\.\.(/|$)#', $file)) {
            throw new ApiException('Invalid SQLite path', 400);
        }

        $dir = dirname($file);
        if (!is_dir($dir)) {
            if (!@mkdir($dir, 0755, true) && !is_dir($dir)) {
                throw new ApiException('Unable to create SQLite directory: ' . $dir, 503);
            }
        }
        if (is_file($file) && !is_writable($file)) {
            throw new ApiException('SQLite file is not writable: ' . $file, 503);
        }
        if (!is_writable($dir)) {
            throw new ApiException('SQLite directory is not writable: ' . $dir, 503);
        }

        try {
            $oDb = new \Flake\Core\Database\Sqlite($file);
        } catch (\Throwable $e) {
            throw new ApiException('SQLite connection failed: ' . $e->getMessage(), 400);
        }

        $this->ensureSchema($oDb, 'SQLite');

        $model = new \Baikal\Model\Config\Database();
        $model->set('backend', 'sqlite');
        $model->set('sqlite_file', $file);
        if (trim((string) $model->get('encryption_key')) === '') {
            $model->set('encryption_key', bin2hex(random_bytes(32)));
        }
        $model->persist();
    }

    /**
     * @param array<string, mixed> $body
     */
    private function setupPgsql(array $body): void {
        $host = trim((string) ($body['pgsql_host'] ?? ''));
        $dbname = trim((string) ($body['pgsql_dbname'] ?? ''));
        $username = trim((string) ($body['pgsql_username'] ?? ''));
        $password = (string) ($body['pgsql_password'] ?? '');
        if ($host === '' || $dbname === '') {
            throw new ApiException('PostgreSQL host and database name are required', 400);
        }

        try {
            $oDb = new \Flake\Core\Database\Pgsql($host, $dbname, $username, $password);
        } catch (\Throwable $e) {
            throw new ApiException('PostgreSQL connection failed: ' . $e->getMessage(), 400);
        }

        $this->ensureSchema($oDb, 'PgSQL');

        $model = new \Baikal\Model\Config\Database();
        $model->set('backend', 'pgsql');
        $model->set('pgsql_host', $host);
        $model->set('pgsql_dbname', $dbname);
        $model->set('pgsql_username', $username);
        $model->set('pgsql_password', $password);
        if (trim((string) $model->get('encryption_key')) === '') {
            $model->set('encryption_key', bin2hex(random_bytes(32)));
        }
        $model->persist();
    }

    /**
     * @param \Flake\Core\Database $oDb
     */
    private function ensureSchema($oDb, string $kind): void {
        $missing = \Baikal\Core\Tools::isDBStructurallyComplete($oDb);
        if ($missing === true) {
            return;
        }
        $required = \Baikal\Core\Tools::getRequiredTablesList();
        if (!is_array($missing)) {
            throw new ApiException('Unable to inspect database schema', 500);
        }
        if (count($required) !== count($missing)) {
            throw new ApiException(
                'Database is not structurally complete. Missing tables: ' . implode(', ', $missing)
                . '. See Core/Resources/Db/' . $kind . '/db.sql',
                400
            );
        }

        $sqlPath = (defined('PROJECT_PATH_CORERESOURCES')
            ? PROJECT_PATH_CORERESOURCES
            : (defined('PROJECT_PATH_ROOT') ? PROJECT_PATH_ROOT . 'Core/Resources/' : ''))
            . 'Db/' . $kind . '/db.sql';
        if (!is_readable($sqlPath)) {
            throw new ApiException('Schema file missing: ' . $sqlPath, 500);
        }
        $sql = file_get_contents($sqlPath);
        if ($sql === false || trim($sql) === '') {
            throw new ApiException('Schema file empty: ' . $sqlPath, 500);
        }

        if ($kind === 'PgSQL') {
            $oDb->getPDO()->exec($sql);
        } else {
            foreach (explode(';', $sql) as $query) {
                if (!trim($query)) {
                    continue;
                }
                $oDb->query($query);
            }
        }
    }

    private function createHtaccessFilesIfNeeded(): void {
        if (!defined('PROJECT_PATH_CORERESOURCES') || !defined('PROJECT_PATH_DOCUMENTROOT')) {
            return;
        }
        $this->copyResourceFile('System/htaccess-documentroot', PROJECT_PATH_DOCUMENTROOT . '.htaccess');
        $this->copyResourceFile('System/htaccess-deny-all', $this->specificDir . '/.htaccess');
        $configDir = dirname($this->configPath);
        $this->copyResourceFile('System/htaccess-deny-all', rtrim($configDir, '/') . '/.htaccess');
    }

    private function copyResourceFile(string $template, string $destination): void {
        if (is_file($destination)) {
            return;
        }
        $src = PROJECT_PATH_CORERESOURCES . $template;
        if (!is_file($src)) {
            return;
        }
        @copy($src, $destination);
    }

    private function ratePath(): string {
        return $this->specificDir . '/portal_install_rate.json';
    }

    private function clientIp(): string {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

        return is_string($ip) && $ip !== '' ? $ip : '0.0.0.0';
    }

    private function assertRateLimit(): void {
        $path = $this->ratePath();
        $data = [];
        if (is_readable($path)) {
            $raw = file_get_contents($path);
            $decoded = is_string($raw) ? json_decode($raw, true) : null;
            $data = is_array($decoded) ? $decoded : [];
        }
        $ip = $this->clientIp();
        $now = time();
        $row = $data[$ip] ?? null;
        if (is_array($row)) {
            $start = (int) ($row['start'] ?? 0);
            $count = (int) ($row['count'] ?? 0);
            if ($start > 0 && ($now - $start) <= self::RATE_WINDOW && $count >= self::RATE_MAX) {
                throw new ApiException('Too many install attempts. Please try again later.', 429);
            }
        }
    }

    private function registerRateAttempt(): void {
        $path = $this->ratePath();
        $data = [];
        if (is_readable($path)) {
            $raw = file_get_contents($path);
            $decoded = is_string($raw) ? json_decode($raw, true) : null;
            $data = is_array($decoded) ? $decoded : [];
        }
        $ip = $this->clientIp();
        $now = time();
        $row = $data[$ip] ?? null;
        if (!is_array($row) || (int) ($row['start'] ?? 0) <= 0 || ($now - (int) $row['start']) > self::RATE_WINDOW) {
            $data[$ip] = ['start' => $now, 'count' => 1];
        } else {
            $data[$ip]['count'] = (int) ($row['count'] ?? 0) + 1;
        }
        foreach ($data as $k => $v) {
            if (!is_array($v) || ($now - (int) ($v['start'] ?? 0)) > self::RATE_WINDOW * 2) {
                unset($data[$k]);
            }
        }
        if (is_dir($this->specificDir) && is_writable($this->specificDir)) {
            @file_put_contents($path, json_encode($data, JSON_UNESCAPED_SLASHES) . "\n", LOCK_EX);
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
}
