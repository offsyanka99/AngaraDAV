<?php

namespace Baikal\Portal;

use Baikal\Portal\Admin\AdminAudit;
use Baikal\Portal\Admin\AdminBackupService;
use Baikal\Portal\Admin\AdminCapabilitiesService;
use Baikal\Portal\Admin\AdminDashboardService;
use Baikal\Portal\Admin\AdminSettingsService;
use Baikal\Portal\Admin\AdminUserResourceService;
use Baikal\Portal\Admin\AdminUserService;
use Baikal\Portal\Http\CalendarRoutes;
use Baikal\Portal\Http\ContactRoutes;
use Baikal\Portal\Http\HttpIO;
use Baikal\Portal\Http\ItemRoutes;
use Symfony\Component\Yaml\Yaml;

/**
 * JSON API router for the user portal SPA.
 */
class App {
    private Auth $auth;
    private AdminAuth $adminAuth;
    private AdminAudit $adminAudit;
    private AdminDashboardService $adminDashboard;
    private AdminCapabilitiesService $adminCapabilities;
    private AdminUserService $adminUsers;
    private AdminUserResourceService $adminResources;
    private AdminSettingsService $adminSettings;
    private AdminBackupService $adminBackup;
    private CalendarService $calendars;
    private EventService $events;
    private ShareService $shares;
    private CalendarImportService $calendarImport;
    private ContactService $contacts;
    private ContactImportService $contactImport;
    private CalendarItemService $items;
    private FileService $files;
    private FileDownloadRateLimiter $fileDownloadLimiter;
    private HttpIO $http;
    private CalendarRoutes $calendarRoutes;
    private ContactRoutes $contactRoutes;
    private ItemRoutes $itemRoutes;

    /** @var array<string, mixed> */
    private array $config;

    public function __construct(\PDO $pdo, array $config) {
        $this->config = $config;
        $this->http = new HttpIO();
        $realm = (string) ($config['system']['auth_realm'] ?? 'BaikalDAV');
        $sessionMax = Auth::DEFAULT_SESSION_MAX_AGE;
        if (isset($config['system']['session_max_age_minutes'])
            && is_numeric($config['system']['session_max_age_minutes'])
            && (int) $config['system']['session_max_age_minutes'] > 0
        ) {
            $sessionMax = (int) $config['system']['session_max_age_minutes'] * 60;
        }
        $this->auth = new Auth($pdo, $realm, $sessionMax);
        $this->adminAuth = new AdminAuth($this->auth, $config);
        $this->adminAudit = new AdminAudit($this->portalSpecificDir(), $this->portalLogLevel());
        $this->adminDashboard = new AdminDashboardService($pdo, $config);
        $this->adminCapabilities = new AdminCapabilitiesService($config);
        $this->adminUsers = new AdminUserService($pdo, $config);
        $this->adminResources = new AdminUserResourceService($pdo, $config);
        $configPath = defined('PROJECT_PATH_CONFIG')
            ? rtrim((string) PROJECT_PATH_CONFIG, '/') . '/baikal.yaml'
            : '';
        $this->adminSettings = new AdminSettingsService(
            $configPath !== '' ? $configPath : (sys_get_temp_dir() . '/baikal-admin-settings.yaml'),
            $this->portalSpecificDir()
        );
        $this->adminBackup = new AdminBackupService($this->adminSettings, $this->portalSpecificDir());
        $calendarStore = new CalendarStore($pdo);
        $this->calendarImport = new CalendarImportService($calendarStore);
        $this->calendars = new CalendarService($calendarStore, $this->calendarImport);
        $this->events = new EventService($calendarStore);
        $this->shares = new ShareService($calendarStore);
        $contactStore = new ContactStore($pdo);
        $vcard = new VCardMapper();
        $this->contacts = new ContactService($contactStore, $vcard);
        $this->contactImport = new ContactImportService($contactStore, $vcard);
        $this->items = new CalendarItemService($pdo);
        $this->files = new FileService($pdo, $config);
        $this->fileDownloadLimiter = new FileDownloadRateLimiter(
            $this->portalSpecificDir() . '/portal_file_download_rate.json'
        );
        $this->calendarRoutes = new CalendarRoutes(
            $this->calendars,
            $this->events,
            $this->shares,
            $this->calendarImport,
            $this->http
        );
        $this->contactRoutes = new ContactRoutes($this->contacts, $this->contactImport, $this->http);
        $this->itemRoutes = new ItemRoutes($this->items, $this->http);
    }

    /**
     * Attach portal Admin role flags to a user profile array.
     *
     * @param array<string, mixed> $profile
     *
     * @return array<string, mixed>
     */
    private function enrichProfile(array $profile): array {
        $username = (string) ($profile['username'] ?? '');
        $isAdmin = $username !== '' && $this->adminAuth->isAdmin($username);
        $profile['isAdmin'] = $isAdmin;
        $profile['role'] = $isAdmin ? 'Admin' : 'User';

        return $profile;
    }

    /**
     * Writable Specific/ directory for portal_debug.log (and rate-limit files).
     */
    private function portalSpecificDir(): string {
        if (defined('PROJECT_PATH_SPECIFIC') && PROJECT_PATH_SPECIFIC !== '') {
            return rtrim((string) PROJECT_PATH_SPECIFIC, '/');
        }
        if (defined('PROJECT_PATH_ROOT') && PROJECT_PATH_ROOT !== '') {
            return rtrim((string) PROJECT_PATH_ROOT, '/') . '/Specific';
        }

        return '';
    }

    /**
     * Instance portal time format from Admin YAML (`system.portal_time_format`).
     * Env (`TIME_FORMAT`, `BAIKAL_PORTAL_TIME_FORMAT`) is ignored.
     *
     * @param array<string, mixed> $sys system section of baikal.yaml
     */
    public static function portalTimeFormatFromSystem(array $sys): string {
        $time = strtolower(trim((string) ($sys['portal_time_format'] ?? 'auto')));

        return in_array($time, ['auto', '12h', '24h'], true) ? $time : 'auto';
    }

    /**
     * Instance portal week start from Admin YAML (`system.portal_week_start`).
     * Env (`BAIKAL_PORTAL_WEEK_START`) is ignored.
     *
     * @param array<string, mixed> $sys system section of baikal.yaml
     */
    public static function portalWeekStartFromSystem(array $sys): string {
        $week = strtolower(trim((string) ($sys['portal_week_start'] ?? 'auto')));

        return in_array($week, ['auto', 'monday', 'sunday'], true) ? $week : 'auto';
    }

    /**
     * Portal UI prefs (time format / week start / log level / DAV service flags).
     * Time format and week start come from Admin YAML only (`system.portal_time_format`,
     * `system.portal_week_start`). Log level still allows env override.
     * PORTAL_LOG_LEVEL: off|error|warn|info|debug.
     *
     * `services` mirrors Admin System settings (and public /info.php). Safe for all
     * authenticated users — not secrets; used by the SPA to hide disabled tabs.
     *
     * @return array{
     *   timeFormat: string,
     *   weekStart: string,
     *   logLevel: string,
     *   sessionIdleSeconds: int,
     *   version: string,
     *   git: string,
     *   services: array{caldav: bool, carddav: bool, tasks: bool, notes: bool, files: bool}
     * }
     */
    private function portalUiSettings(): array {
        $sys = is_array($this->config['system'] ?? null) ? $this->config['system'] : [];

        return [
            'timeFormat'         => self::portalTimeFormatFromSystem($sys),
            'weekStart'          => self::portalWeekStartFromSystem($sys),
            'logLevel'           => $this->portalLogLevel(),
            'sessionIdleSeconds' => $this->auth->sessionMaxAge(),
            'version'            => defined('ANGARA_VERSION') ? (string) ANGARA_VERSION : '',
            'git'                => defined('ANGARA_GIT_SHA') ? (string) ANGARA_GIT_SHA : '',
            // Defaults match AdminDashboardService / install (notes & files off by default)
            'services'           => [
                'caldav'  => $this->systemBoolFlag($sys, 'cal_enabled', true),
                'carddav' => $this->systemBoolFlag($sys, 'card_enabled', true),
                'tasks'   => $this->systemBoolFlag($sys, 'tasks_enabled', true),
                'notes'   => $this->systemBoolFlag($sys, 'notes_enabled', false),
                'files'   => $this->systemBoolFlag($sys, 'files_enabled', false),
            ],
        ];
    }

    /**
     * @param array<string, mixed> $sys
     */
    private function systemBoolFlag(array $sys, string $key, bool $default): bool {
        if (!array_key_exists($key, $sys)) {
            return $default;
        }
        $v = $sys[$key];
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
     * Portal log level (SPA console + optional server request log). Env overrides YAML.
     * ANGARA_PORTAL_LOG_LEVEL / PORTAL_LOG_LEVEL / system.portal_log_level: off|error|warn|info|debug.
     */
    private function portalLogLevel(): string {
        $sys = is_array($this->config['system'] ?? null) ? $this->config['system'] : [];
        $level = strtolower(trim((string) (
            getenv('ANGARA_PORTAL_LOG_LEVEL')
            ?: getenv('PORTAL_LOG_LEVEL')
            ?: ($sys['portal_log_level'] ?? 'off')
        )));
        if (!in_array($level, ['off', 'error', 'warn', 'info', 'debug'], true)) {
            return 'off';
        }

        return $level;
    }

    /** Whether server-side portal request logging is enabled for this level. */
    private function portalServerLogEnabled(string $min = 'info'): bool {
        $order = ['off' => 0, 'error' => 1, 'warn' => 2, 'info' => 3, 'debug' => 4];
        $cur = $order[$this->portalLogLevel()] ?? 0;
        $need = $order[$min] ?? 3;

        return $cur >= $need;
    }

    /**
     * Server-side portal request log → Specific/portal_debug.log only.
     *
     * Never use PHP error_log() here: php-fpm writes that to stderr and nginx
     * logs every line as [error], even for successful 200 responses.
     */
    private function portalServerLog(string $message, string $min = 'info'): void {
        if (!$this->portalServerLogEnabled($min)) {
            return;
        }
        $dir = $this->portalSpecificDir();
        if ($dir === '' || !is_dir($dir) || !is_writable($dir)) {
            return;
        }
        $path = $dir . '/portal_debug.log';
        $ts = date('Y-m-d H:i:s');
        $level = strtoupper($min);
        @file_put_contents(
            $path,
            '[' . $ts . '] [' . $level . '] AngaraDAV portal: ' . $message . "\n",
            FILE_APPEND | LOCK_EX
        );
    }

    /**
     * Audit helper for admin mutations (create-user, settings, …).
     * Prefer this over free-form portalServerLog for /api/admin/* writes.
     */
    public function adminAudit(): AdminAudit {
        return $this->adminAudit;
    }

    /**
     * Dashboard domain service (read-only stats). Used by admin routes and tests.
     */
    public function adminDashboard(): AdminDashboardService {
        return $this->adminDashboard;
    }

    /**
     * Bootstrap AngaraDAV and return App. PROJECT_PATH_ROOT must already be defined.
     */
    public static function bootstrap(): self {
        Auth::startSession();

        if (!defined('PROJECT_PATH_ROOT')) {
            throw new ApiException('PROJECT_PATH_ROOT not defined', 500);
        }

        \Baikal\Core\Bootstrap::bootstrap();
        \Baikal\Framework::bootstrap();

        $configPath = PROJECT_PATH_CONFIG . 'baikal.yaml';
        if (!is_readable($configPath)) {
            throw new ApiException('AngaraDAV is not configured yet', 503);
        }
        $config = Yaml::parseFile($configPath);
        if (!is_array($config)) {
            throw new ApiException('Invalid AngaraDAV configuration', 503);
        }

        if (!\Baikal\Core\Bootstrap::isDbInitialized()) {
            throw new ApiException('Database is not available', 503);
        }

        return new self(\Baikal\Core\Bootstrap::pdo(), $config);
    }

    public function handle(string $method, string $path): void {
        $method = strtoupper($method);
        $path = '/' . trim($path, '/');
        if ($path === '/') {
            $path = '';
        }

        $t0 = microtime(true);
        $this->portalServerLog($method . ' ' . $path, 'debug');

        try {
            // Binary download for portal Files tab (stream from disk)
            if ($method === 'GET' && $path === '/files/download') {
                $username = $this->auth->requireUser();
                $filePath = isset($_GET['path']) ? (string) $_GET['path'] : '';
                $inline = isset($_GET['inline']) && (string) $_GET['inline'] !== '' && (string) $_GET['inline'] !== '0';
                $meta = $this->files->openDownload($username, $filePath);
                $this->fileDownloadLimiter->assertAllowed($username);
                $contentType = $inline
                    ? FileService::contentTypeForInline($meta['name'], $meta['contentType'])
                    : $meta['contentType'];
                $this->http->streamFileDownload(
                    $meta['absolutePath'],
                    $meta['name'],
                    $contentType,
                    $meta['size'],
                    $meta['etag'],
                    $inline
                );
                $this->portalServerLog(
                    sprintf(
                        '%s %s → 200 files %s path=%s size=%d user=%s (%dms)',
                        $method,
                        $path,
                        $inline ? 'view' : 'download',
                        $meta['path'],
                        $meta['size'],
                        $username,
                        (int) ((microtime(true) - $t0) * 1000)
                    ),
                    'info'
                );

                return;
            }

            // Binary/download responses (ICS / VCF export)
            if ($method === 'GET' && preg_match('#^/calendars/(\d+)/export$#', $path, $m)) {
                $username = $this->auth->requireUser();
                $export = $this->calendarImport->exportCalendar($username, (int) $m[1]);
                $this->http->fileDownload($export['ics'], $export['filename'], 'text/calendar; charset=utf-8');
                $this->portalServerLog(
                    sprintf('%s %s → 200 export (%dms)', $method, $path, (int) ((microtime(true) - $t0) * 1000)),
                    'info'
                );

                return;
            }
            if ($method === 'GET' && preg_match('#^/addressbooks/(\d+)/export$#', $path, $m)) {
                $username = $this->auth->requireUser();
                $export = $this->contactImport->exportAddressBook($username, (int) $m[1]);
                $this->http->fileDownload($export['vcf'], $export['filename'], 'text/vcard; charset=utf-8');
                $this->portalServerLog(
                    sprintf('%s %s → 200 export (%dms)', $method, $path, (int) ((microtime(true) - $t0) * 1000)),
                    'info'
                );

                return;
            }
            // Single contact VCF export
            if ($method === 'GET' && preg_match('#^/addressbooks/(\d+)/contacts/([^/]+)/export$#', $path, $m)) {
                $username = $this->auth->requireUser();
                $export = $this->contactImport->exportContact($username, (int) $m[1], rawurldecode($m[2]));
                $this->http->fileDownload($export['vcf'], $export['filename'], 'text/vcard; charset=utf-8');
                $this->portalServerLog(
                    sprintf('%s %s → 200 export (%dms)', $method, $path, (int) ((microtime(true) - $t0) * 1000)),
                    'info'
                );

                return;
            }
            // Contact photo binary (JPEG)
            if ($method === 'GET' && preg_match('#^/addressbooks/(\d+)/contacts/([^/]+)/photo$#', $path, $m)) {
                $username = $this->auth->requireUser();
                $photo = $this->contacts->getContactPhoto($username, (int) $m[1], rawurldecode($m[2]));
                if ($photo === null) {
                    throw new ApiException('Contact has no photo', 404);
                }
                http_response_code(200);
                header('Content-Type: ' . $photo['contentType']);
                header('Cache-Control: private, max-age=300');
                header('X-Content-Type-Options: nosniff');
                header('Content-Length: ' . (string) strlen($photo['bytes']));
                echo $photo['bytes'];
                $this->portalServerLog(
                    sprintf('%s %s → 200 photo (%dms)', $method, $path, (int) ((microtime(true) - $t0) * 1000)),
                    'info'
                );

                return;
            }

            $result = $this->dispatch($method, $path);
            if ($this->http->responseSent) {
                $this->portalServerLog(
                    sprintf('%s %s → stream done (%dms)', $method, $path, (int) ((microtime(true) - $t0) * 1000)),
                    'info'
                );

                return;
            }
            $this->http->json(200, $result);
            $this->portalServerLog(
                sprintf('%s %s → 200 (%dms)', $method, $path, (int) ((microtime(true) - $t0) * 1000)),
                'info'
            );
        } catch (ApiException $e) {
            // 401 before login is normal; keep it at info so debug stays calm
            $lvl = 'info';
            if ($e->getStatus() >= 500) {
                $lvl = 'error';
            } elseif ($e->getStatus() >= 400 && $e->getStatus() !== 401) {
                $lvl = 'warn';
            }
            $this->portalServerLog(
                sprintf(
                    '%s %s → %d %s (%dms)',
                    $method,
                    $path,
                    $e->getStatus(),
                    $e->getMessage(),
                    (int) ((microtime(true) - $t0) * 1000)
                ),
                $lvl
            );
            // NDJSON stream may already have flushed headers/body
            if ($this->http->responseSent) {
                return;
            }
            $this->http->json($e->getStatus(), ['error' => $e->getMessage()]);
        } catch (\Throwable $e) {
            error_log('AngaraDAV portal API: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
            $this->portalServerLog(
                sprintf('%s %s → 500 %s', $method, $path, $e->getMessage()),
                'error'
            );
            if ($this->http->responseSent) {
                return;
            }
            $msg = 'Internal server error';
            // Surface timeout clearly for large imports (Thunderbird full calendar/contacts)
            if (stripos($e->getMessage(), 'Maximum execution time') !== false) {
                $msg = 'Import timed out. Try a smaller export, or import again (already-imported items update faster).';
            }
            $this->http->json(500, ['error' => $msg]);
        }
    }

    /**
     * @return array<string, mixed>|list<mixed>
     */
    private function dispatch(string $method, string $path) {
        // Public portal UI prefs (no auth) — SPA applies log level before login
        if ($method === 'GET' && $path === '/ui') {
            $ui = $this->portalUiSettings();

            return [
                'ui'      => $ui,
                'version' => $ui['version'] !== '' ? $ui['version'] : null,
                'git'     => $ui['git'] !== '' ? $ui['git'] : null,
            ];
        }

        if ($method === 'POST' && $path === '/login') {
            $this->http->assertSameOrigin();
            $body = $this->http->jsonBody();
            $user = $this->auth->login(
                (string) ($body['username'] ?? ''),
                (string) ($body['password'] ?? '')
            );
            $user = $this->enrichProfile($user);
            $this->portalServerLog('login ok user=' . (string) ($user['username'] ?? ''), 'info');

            return [
                'user' => $user,
                'ui'   => $this->portalUiSettings(),
            ];
        }

        // State-changing requests: same-origin + CSRF (when a session exists)
        if (in_array($method, ['POST', 'PUT', 'PATCH', 'DELETE'], true)) {
            $this->http->assertSameOrigin();
            $sessionUser = $this->auth->username();
            if ($path === '/logout') {
                if ($sessionUser !== null) {
                    $this->auth->assertCsrf($this->http->csrfFromRequest());
                }
                $this->auth->logout();
                $this->portalServerLog('logout', 'info');

                return ['ok' => true];
            }
            if ($sessionUser === null) {
                if ($this->auth->wasTimedOut()) {
                    throw new ApiException('Session timed out. Please sign in again.', 401);
                }
                throw new ApiException('Not authenticated', 401);
            }
            $this->auth->assertCsrf($this->http->csrfFromRequest());
        }

        if ($method === 'GET' && ($path === '/me' || $path === '')) {
            // Anonymous bootstrap is normal on first paint (login screen).
            // Return 200 with user:null so browsers do not log a spurious 401.
            $username = $this->auth->username();
            if ($username === null) {
                return [
                    'user'      => null,
                    'csrfToken' => null,
                    'version'   => defined('ANGARA_VERSION') ? ANGARA_VERSION : null,
                    'davPath'   => '/dav.php/',
                    'ui'        => $this->portalUiSettings(),
                ];
            }
            $profile = $this->enrichProfile($this->auth->profile($username));
            $profile['csrfToken'] = $this->auth->csrfToken();

            return [
                'user'      => $profile,
                'csrfToken' => $this->auth->csrfToken(),
                'version'   => defined('ANGARA_VERSION') ? ANGARA_VERSION : null,
                'davPath'   => '/dav.php/',
                'ui'        => $this->portalUiSettings(),
            ];
        }

        // --- Portal Administration API (/api/admin/*) ---
        // Security gate (Phase 9.1): EVERY admin route enters only here.
        // - requireAdmin() → 401 unauthenticated, 403 non-admin (server-side; UI hide is not enough)
        // - Mutations already passed assertSameOrigin + CSRF above
        // - dispatchAdminRoutes has no public entry; do not call it without requireAdmin first
        if ($path === '/admin' || str_starts_with($path, '/admin/')) {
            $adminUser = $this->adminAuth->requireAdmin();

            return $this->dispatchAdminRoutes($method, $path, $adminUser);
        }

        $username = $this->auth->requireUser();

        $calendarRoutes = $this->calendarRoutes->dispatch($method, $path, $username);
        if ($calendarRoutes !== null) {
            return $calendarRoutes;
        }

        $contactRoutes = $this->contactRoutes->dispatch($method, $path, $username);
        if ($contactRoutes !== null) {
            return $contactRoutes;
        }

        $fileRoutes = $this->dispatchFileRoutes($method, $path, $username);
        if ($fileRoutes !== null) {
            return $fileRoutes;
        }

        $itemRoutes = $this->itemRoutes->dispatch($method, $path, $username);
        if ($itemRoutes !== null) {
            return $itemRoutes;
        }

        throw new ApiException('Not found', 404);
    }

    /**
     * Non-secret field names from a settings PATCH body (observability only).
     *
     * @param array<string, mixed> $body
     *
     * @return array{keys?: string}
     */
    private function adminSettingsBodyKeysForLog(array $body): array {
        $safe = [];
        foreach (array_keys($body) as $k) {
            if (!is_string($k) || $k === '') {
                continue;
            }
            if (preg_match('/pass|digest|secret|token|hash|csrf/i', $k)) {
                // Record that a password-related key was present without the value
                if (stripos($k, 'admin_password') !== false) {
                    $safe[] = 'admin_password*';
                }
                continue;
            }
            $safe[] = $k;
        }
        if ($safe === []) {
            return [];
        }
        sort($safe);

        return ['keys' => implode(',', $safe)];
    }

    /**
     * Admin JSON API under /api/admin/*.
     *
     * Caller must already have called AdminAuth::requireAdmin() (and CSRF for
     * mutating methods is enforced in dispatch()).
     *
     * @return array<string, mixed>|list<mixed>
     */
    private function dispatchAdminRoutes(string $method, string $path, string $adminUser) {
        // Normalize: /admin → /admin/, strip trailing slash for matching
        $adminPath = $path;
        if ($adminPath === '/admin') {
            $adminPath = '/admin/';
        }

        // Health / authz smoke check
        if ($method === 'GET' && ($adminPath === '/admin/ping' || $adminPath === '/admin/ping/')) {
            return [
                'ok'   => true,
                'user' => $adminUser,
            ];
        }

        // Read-only dashboard stats (Phase 1 service + early API for tests/SPA)
        if ($method === 'GET' && ($adminPath === '/admin/dashboard' || $adminPath === '/admin/dashboard/')) {
            return [
                'data' => $this->adminDashboard->stats(),
            ];
        }

        // Feature gating / parity matrix for Administration shell
        if ($method === 'GET' && ($adminPath === '/admin/capabilities' || $adminPath === '/admin/capabilities/')) {
            return [
                'data' => $this->adminCapabilities->capabilities(),
            ];
        }

        // System settings (Standard)
        if ($adminPath === '/admin/settings/system' || $adminPath === '/admin/settings/system/') {
            if ($method === 'GET') {
                return ['data' => $this->adminSettings->getSystemSettings()];
            }
            if ($method === 'PUT' || $method === 'PATCH') {
                $body = $this->http->jsonBody();
                // Non-secret keys present in the request (for ops diagnosis only)
                $keysCtx = $this->adminSettingsBodyKeysForLog($body);
                try {
                    $data = $this->adminSettings->updateSystemSettings($body);
                    $this->adminAudit->mutation(
                        $adminUser,
                        'update-system-settings',
                        'system',
                        'ok',
                        $keysCtx
                    );
                    $this->portalServerLog(
                        'admin settings save ok user=' . $adminUser
                        . ($keysCtx !== [] ? ' keys=' . ($keysCtx['keys'] ?? '-') : ''),
                        'info'
                    );

                    return ['data' => $data];
                } catch (ApiException $e) {
                    $this->adminAudit->mutation(
                        $adminUser,
                        'update-system-settings',
                        'system',
                        'error:' . $e->getStatus(),
                        array_merge($keysCtx, ['msg' => $e->getMessage()])
                    );
                    // Explicit ops line even if audit file is unwritable
                    $this->portalServerLog(
                        'admin settings save failed user=' . $adminUser
                        . ' status=' . $e->getStatus()
                        . ' error=' . $e->getMessage(),
                        $e->getStatus() >= 500 ? 'error' : 'warn'
                    );
                    throw $e;
                }
            }
        }

        // Factory reset → installer (removes baikal.yaml + INSTALL_DISABLED)
        if ($adminPath === '/admin/settings/reset-to-default' || $adminPath === '/admin/settings/reset-to-default/') {
            if ($method === 'POST') {
                $body = $this->http->jsonBody();
                $confirm = !empty($body['confirm']) && $body['confirm'] !== '0' && $body['confirm'] !== 'false';
                $reauthPassword = (string) ($body['password'] ?? $body['admin_password'] ?? '');
                if ($reauthPassword === '') {
                    throw new ApiException('Re-enter your password to confirm Reset to Default', 400);
                }
                if (!$this->auth->verifyPassword($adminUser, $reauthPassword)) {
                    throw new ApiException('Password verification failed', 401);
                }
                try {
                    $result = $this->adminSettings->resetToDefault($confirm);
                    $this->adminAudit->mutation(
                        $adminUser,
                        'reset-to-default',
                        'system',
                        'ok',
                        ['backup' => $result['backupPath'] ?? null]
                    );
                    $this->portalServerLog(
                        'admin reset-to-default ok user=' . $adminUser
                        . ($result['backupPath'] ? ' backup=' . $result['backupPath'] : ''),
                        'warn'
                    );

                    return $result;
                } catch (ApiException $e) {
                    $this->adminAudit->mutation(
                        $adminUser,
                        'reset-to-default',
                        'system',
                        'error:' . $e->getStatus(),
                        ['msg' => $e->getMessage()]
                    );
                    $this->portalServerLog(
                        'admin reset-to-default failed user=' . $adminUser
                        . ' status=' . $e->getStatus()
                        . ' error=' . $e->getMessage(),
                        $e->getStatus() >= 500 ? 'error' : 'warn'
                    );
                    throw $e;
                }
            }
            throw new ApiException('Method not allowed', 405);
        }

        // Settings backup: export the editable system settings as a JSON document
        if ($adminPath === '/admin/settings/backup' || $adminPath === '/admin/settings/backup/') {
            if ($method === 'GET') {
                $data = $this->adminBackup->export($adminUser);
                $this->adminAudit->mutation($adminUser, 'export-settings-backup', 'system', 'ok');

                return ['data' => $data];
            }
            throw new ApiException('Method not allowed', 405);
        }

        // Settings restore: apply the "changed" keys from a previously exported backup
        if ($adminPath === '/admin/settings/restore' || $adminPath === '/admin/settings/restore/') {
            if ($method === 'POST') {
                $body = $this->http->jsonBody();
                $backup = is_array($body['backup'] ?? null) ? $body['backup'] : [];
                $confirm = !empty($body['confirm']) && $body['confirm'] !== '0' && $body['confirm'] !== 'false';
                $dryRun = !empty($body['dryRun']);
                try {
                    $result = $dryRun
                        ? $this->adminBackup->preview($backup)
                        : $this->adminBackup->restore($backup, $confirm, $adminUser);
                    $this->adminAudit->mutation(
                        $adminUser,
                        $dryRun ? 'preview-settings-restore' : 'restore-settings-backup',
                        'system',
                        'ok',
                        ['keys' => implode(',', $result['applied'] ?? [])]
                    );

                    return ['data' => $result];
                } catch (ApiException $e) {
                    $this->adminAudit->mutation(
                        $adminUser,
                        $dryRun ? 'preview-settings-restore' : 'restore-settings-backup',
                        'system',
                        'error:' . $e->getStatus(),
                        ['msg' => $e->getMessage()]
                    );
                    throw $e;
                }
            }
            throw new ApiException('Method not allowed', 405);
        }

        // Optional live connection probe (no YAML write)
        if ($adminPath === '/admin/settings/database/test' || $adminPath === '/admin/settings/database/test/') {
            if ($method === 'POST') {
                $body = $this->http->jsonBody();
                $result = $this->adminSettings->testDatabaseConnection($body);
                $this->adminAudit->mutation(
                    $adminUser,
                    'test-database-connection',
                    'database',
                    'ok',
                    ['backend' => $result['backend'] ?? null]
                );

                return $result;
            }
            throw new ApiException('Method not allowed', 405);
        }

        // Database settings — write requires confirm: "CONFIRM" (Phase 8.2)
        if ($adminPath === '/admin/settings/database' || $adminPath === '/admin/settings/database/') {
            if ($method === 'GET') {
                return ['data' => $this->adminSettings->getDatabaseSettings()];
            }
            if ($method === 'PUT' || $method === 'PATCH' || $method === 'POST') {
                $body = $this->http->jsonBody();
                $keysCtx = [
                    'keys'    => implode(',', array_values(array_filter(
                        array_keys($body),
                        static function ($k) {
                            return !in_array($k, ['pgsql_password', 'confirm', 'encryption_key'], true);
                        }
                    ))),
                    'backend' => isset($body['backend']) ? (string) $body['backend'] : null,
                ];
                try {
                    $data = $this->adminSettings->updateDatabaseSettings($body);
                    $this->adminAudit->mutation(
                        $adminUser,
                        'update-database-settings',
                        'database',
                        'ok',
                        $keysCtx
                    );
                    $this->portalServerLog(
                        'admin database settings save ok user=' . $adminUser
                        . ' backend=' . (string) ($data['backend'] ?? ''),
                        'warn'
                    );

                    return ['data' => $data];
                } catch (ApiException $e) {
                    $this->adminAudit->mutation(
                        $adminUser,
                        'update-database-settings',
                        'database',
                        'error:' . $e->getStatus(),
                        array_merge($keysCtx, ['msg' => $e->getMessage()])
                    );
                    $this->portalServerLog(
                        'admin database settings save failed user=' . $adminUser
                        . ' status=' . $e->getStatus()
                        . ' error=' . $e->getMessage(),
                        $e->getStatus() >= 500 ? 'error' : 'warn'
                    );
                    throw $e;
                }
            }
        }

        // Users — never returns digesta1
        if ($adminPath === '/admin/users' || $adminPath === '/admin/users/') {
            if ($method === 'GET') {
                return [
                    'users' => $this->adminUsers->listUsers(),
                ];
            }
            if ($method === 'POST') {
                $body = $this->http->jsonBody();
                try {
                    $user = $this->adminUsers->createUser($body);
                    $this->adminAudit->mutation(
                        $adminUser,
                        'create-user',
                        (string) ($user['username'] ?? ''),
                        'ok'
                    );

                    return ['user' => $user];
                } catch (ApiException $e) {
                    $this->adminAudit->mutation(
                        $adminUser,
                        'create-user',
                        (string) ($body['username'] ?? ''),
                        'error:' . $e->getStatus()
                    );
                    throw $e;
                }
            }
        }

        // Nested: /admin/users/{username}/calendars[/{id}]
        if (preg_match('#^/admin/users/([^/]+)/calendars(?:/(\d+))?/?$#', $adminPath, $m)) {
            $uname = rawurldecode($m[1]);
            $calId = isset($m[2]) && $m[2] !== '' ? (int) $m[2] : null;
            if ($calId === null) {
                if ($method === 'GET') {
                    return ['calendars' => $this->adminResources->listCalendars($uname)];
                }
                if ($method === 'POST') {
                    $body = $this->http->jsonBody();
                    try {
                        $cal = $this->adminResources->createCalendar($uname, $body);
                        $this->adminAudit->mutation(
                            $adminUser,
                            'create-calendar',
                            $uname . '/' . (string) ($cal['uri'] ?? ''),
                            'ok'
                        );

                        return ['calendar' => $cal];
                    } catch (ApiException $e) {
                        $this->adminAudit->mutation(
                            $adminUser,
                            'create-calendar',
                            $uname,
                            'error:' . $e->getStatus()
                        );
                        throw $e;
                    }
                }
            } else {
                if ($method === 'GET') {
                    return ['calendar' => $this->adminResources->getCalendar($uname, $calId)];
                }
                if ($method === 'PATCH' || $method === 'PUT') {
                    $body = $this->http->jsonBody();
                    try {
                        $cal = $this->adminResources->updateCalendar($uname, $calId, $body);
                        $this->adminAudit->mutation(
                            $adminUser,
                            'update-calendar',
                            $uname . '/' . $calId,
                            'ok'
                        );

                        return ['calendar' => $cal];
                    } catch (ApiException $e) {
                        $this->adminAudit->mutation(
                            $adminUser,
                            'update-calendar',
                            $uname . '/' . $calId,
                            'error:' . $e->getStatus()
                        );
                        throw $e;
                    }
                }
                if ($method === 'DELETE') {
                    $body = $this->http->jsonBody();
                    $confirm = !empty($body['confirm'])
                        || (isset($_GET['confirm']) && (string) $_GET['confirm'] !== '0' && (string) $_GET['confirm'] !== '');
                    try {
                        $this->adminResources->deleteCalendar($uname, $calId, $confirm);
                        $this->adminAudit->mutation(
                            $adminUser,
                            'delete-calendar',
                            $uname . '/' . $calId,
                            'ok'
                        );

                        return ['ok' => true];
                    } catch (ApiException $e) {
                        $this->adminAudit->mutation(
                            $adminUser,
                            'delete-calendar',
                            $uname . '/' . $calId,
                            'error:' . $e->getStatus()
                        );
                        throw $e;
                    }
                }
            }
        }

        // Nested: /admin/users/{username}/addressbooks[/{id}]
        if (preg_match('#^/admin/users/([^/]+)/addressbooks(?:/(\d+))?/?$#', $adminPath, $m)) {
            $uname = rawurldecode($m[1]);
            $abId = isset($m[2]) && $m[2] !== '' ? (int) $m[2] : null;
            if ($abId === null) {
                if ($method === 'GET') {
                    return ['addressbooks' => $this->adminResources->listAddressBooks($uname)];
                }
                if ($method === 'POST') {
                    $body = $this->http->jsonBody();
                    try {
                        $ab = $this->adminResources->createAddressBook($uname, $body);
                        $this->adminAudit->mutation(
                            $adminUser,
                            'create-addressbook',
                            $uname . '/' . (string) ($ab['uri'] ?? ''),
                            'ok'
                        );

                        return ['addressbook' => $ab];
                    } catch (ApiException $e) {
                        $this->adminAudit->mutation(
                            $adminUser,
                            'create-addressbook',
                            $uname,
                            'error:' . $e->getStatus()
                        );
                        throw $e;
                    }
                }
            } else {
                if ($method === 'GET') {
                    return ['addressbook' => $this->adminResources->getAddressBook($uname, $abId)];
                }
                if ($method === 'PATCH' || $method === 'PUT') {
                    $body = $this->http->jsonBody();
                    try {
                        $ab = $this->adminResources->updateAddressBook($uname, $abId, $body);
                        $this->adminAudit->mutation(
                            $adminUser,
                            'update-addressbook',
                            $uname . '/' . $abId,
                            'ok'
                        );

                        return ['addressbook' => $ab];
                    } catch (ApiException $e) {
                        $this->adminAudit->mutation(
                            $adminUser,
                            'update-addressbook',
                            $uname . '/' . $abId,
                            'error:' . $e->getStatus()
                        );
                        throw $e;
                    }
                }
                if ($method === 'DELETE') {
                    $body = $this->http->jsonBody();
                    $confirm = !empty($body['confirm'])
                        || (isset($_GET['confirm']) && (string) $_GET['confirm'] !== '0' && (string) $_GET['confirm'] !== '');
                    $force = !empty($body['force'])
                        || (isset($_GET['force']) && (string) $_GET['force'] !== '0' && (string) $_GET['force'] !== '');
                    try {
                        $this->adminResources->deleteAddressBook($uname, $abId, $confirm, $force);
                        $this->adminAudit->mutation(
                            $adminUser,
                            'delete-addressbook',
                            $uname . '/' . $abId,
                            'ok'
                        );

                        return ['ok' => true];
                    } catch (ApiException $e) {
                        $this->adminAudit->mutation(
                            $adminUser,
                            'delete-addressbook',
                            $uname . '/' . $abId,
                            'error:' . $e->getStatus()
                        );
                        throw $e;
                    }
                }
            }
        }

        if (preg_match('#^/admin/users/([^/]+)/?$#', $adminPath, $m)) {
            $uname = rawurldecode($m[1]);
            if ($method === 'GET') {
                return [
                    'user' => $this->adminUsers->getUser($uname),
                ];
            }
            if ($method === 'PATCH' || $method === 'PUT') {
                $body = $this->http->jsonBody();
                try {
                    $user = $this->adminUsers->updateUser($uname, $body);
                    $this->adminAudit->mutation(
                        $adminUser,
                        'update-user',
                        (string) ($user['username'] ?? $uname),
                        'ok',
                        [
                            'fields' => 'profile',
                        ]
                    );

                    return ['user' => $user];
                } catch (ApiException $e) {
                    $this->adminAudit->mutation(
                        $adminUser,
                        'update-user',
                        $uname,
                        'error:' . $e->getStatus()
                    );
                    throw $e;
                }
            }
            if ($method === 'DELETE') {
                $body = $this->http->jsonBody();
                $confirm = !empty($body['confirm'])
                    || (isset($_GET['confirm']) && (string) $_GET['confirm'] !== '0' && (string) $_GET['confirm'] !== '');
                try {
                    $result = $this->adminUsers->deleteUser($uname, $confirm);
                    $this->adminAudit->mutation(
                        $adminUser,
                        'delete-user',
                        (string) ($result['username'] ?? $uname),
                        'ok'
                    );

                    return $result;
                } catch (ApiException $e) {
                    $this->adminAudit->mutation(
                        $adminUser,
                        'delete-user',
                        $uname,
                        'error:' . $e->getStatus()
                    );
                    throw $e;
                }
            }
        }

        // Unknown admin route — 404 (not 403) so missing features are obvious
        throw new ApiException('Not found', 404);
    }

    /**
     * Portal Files API — same storage as /dav.php/files/{username}/.
     *
     * @return array<string, mixed>|list<mixed>|null
     */
    private function dispatchFileRoutes(string $method, string $path, string $username) {
        if ($method === 'GET' && $path === '/files') {
            $status = $this->files->status($username);
            $this->portalServerLog(
                'files status enabled=' . ($status['enabled'] ? '1' : '0')
                . ' ready=' . ($status['ready'] ? '1' : '0')
                . ' user=' . $username,
                'debug'
            );

            return $status;
        }

        if ($method === 'GET' && $path === '/files/entries') {
            $dir = isset($_GET['path']) ? (string) $_GET['path'] : '';
            $list = $this->files->listEntries($username, $dir);
            $this->portalServerLog(
                sprintf(
                    'files list path=%s count=%d user=%s',
                    $list['path'] === '' ? '/' : $list['path'],
                    count($list['entries']),
                    $username
                ),
                'debug'
            );

            return $list;
        }

        if ($method === 'POST' && $path === '/files/mkdir') {
            $body = $this->http->jsonBody();
            $created = $this->files->createDirectory(
                $username,
                (string) ($body['path'] ?? ''),
                (string) ($body['name'] ?? '')
            );
            $this->portalServerLog(
                'files mkdir path=' . $created['path'] . ' user=' . $username,
                'info'
            );

            return ['entry' => $created];
        }

        if ($method === 'POST' && $path === '/files/upload') {
            if (function_exists('set_time_limit')) {
                @set_time_limit(600);
            }
            // Large uploads: release session lock so other portal tabs stay responsive
            if (session_status() === PHP_SESSION_ACTIVE) {
                session_write_close();
            }
            // Parent folder + name always from query/multipart — never JSON (raw body is file bytes)
            $parent = isset($_GET['path']) ? (string) $_GET['path'] : '';
            $name = isset($_GET['name']) ? (string) $_GET['name'] : '';
            $replace = isset($_GET['replace']) && (string) $_GET['replace'] !== '0' && (string) $_GET['replace'] !== '';
            $data = null;

            if (!empty($_FILES['file']) && is_array($_FILES['file'])) {
                $file = $_FILES['file'];
                $err = (int) ($file['error'] ?? UPLOAD_ERR_NO_FILE);
                if ($err !== UPLOAD_ERR_OK) {
                    throw new ApiException($this->uploadErrorMessage($err), 400);
                }
                $tmp = (string) ($file['tmp_name'] ?? '');
                if ($tmp === '' || !is_uploaded_file($tmp)) {
                    throw new ApiException('Invalid upload', 400);
                }
                if ($name === '') {
                    $name = (string) ($file['name'] ?? 'upload.bin');
                }
                // multipart path field optional override
                if ($parent === '' && isset($_POST['path'])) {
                    $parent = (string) $_POST['path'];
                }
                $data = fopen($tmp, 'rb');
                if ($data === false) {
                    throw new ApiException('Unable to read uploaded file', 500);
                }
            } else {
                // Raw body upload (tests / API clients): path + name in query
                if ($name === '') {
                    $name = (string) ($_SERVER['HTTP_X_FILE_NAME'] ?? '');
                }
                if ($name === '') {
                    throw new ApiException('Missing file name (query name= or multipart file)', 400);
                }
                $data = $this->http->rawRequestBody();
            }

            try {
                $written = $this->files->writeFile($username, $parent, $name, $data, $replace);
            } finally {
                if (is_resource($data)) {
                    fclose($data);
                }
            }
            $this->portalServerLog(
                sprintf(
                    'files upload path=%s size=%d user=%s',
                    $written['path'],
                    $written['size'],
                    $username
                ),
                'info'
            );

            return ['entry' => $written];
        }

        if ($method === 'DELETE' && $path === '/files/entry') {
            $body = $this->http->jsonBody();
            $entryPath = (string) ($body['path'] ?? ($_GET['path'] ?? ''));
            $this->files->delete($username, $entryPath);
            $this->portalServerLog(
                'files delete path=' . $entryPath . ' user=' . $username,
                'info'
            );

            return ['ok' => true];
        }

        if ($method === 'POST' && $path === '/files/rename') {
            $body = $this->http->jsonBody();
            $renamed = $this->files->rename(
                $username,
                (string) ($body['path'] ?? ''),
                (string) ($body['newName'] ?? $body['name'] ?? '')
            );
            $this->portalServerLog(
                'files rename to=' . $renamed['path'] . ' user=' . $username,
                'info'
            );

            return ['entry' => $renamed];
        }

        if ($method === 'POST' && $path === '/files/move') {
            $body = $this->http->jsonBody();
            $moved = $this->files->move(
                $username,
                (string) ($body['from'] ?? $body['path'] ?? ''),
                (string) ($body['to'] ?? $body['toPath'] ?? ''),
                isset($body['newName']) ? (string) $body['newName'] : null
            );
            $this->portalServerLog(
                'files move to=' . $moved['path'] . ' user=' . $username,
                'info'
            );

            return ['entry' => $moved];
        }

        if ($method === 'POST' && $path === '/files/copy') {
            $body = $this->http->jsonBody();
            $copied = $this->files->copy(
                $username,
                (string) ($body['path'] ?? ''),
                isset($body['to']) || isset($body['toPath'])
                    ? (string) ($body['to'] ?? $body['toPath'] ?? '')
                    : null,
                isset($body['newName']) ? (string) $body['newName'] : null
            );
            $this->portalServerLog(
                'files copy to=' . $copied['path'] . ' user=' . $username,
                'info'
            );

            return ['entry' => $copied];
        }

        if ($method === 'POST' && $path === '/files/bulk') {
            $body = $this->http->jsonBody();
            $op = (string) ($body['op'] ?? '');
            $paths = $body['paths'] ?? [];
            if (!is_array($paths)) {
                throw new ApiException('paths must be an array', 400);
            }
            $result = $this->files->bulk($username, $op, $paths);
            $this->portalServerLog(
                sprintf(
                    'files bulk op=%s ok=%d failed=%d user=%s',
                    $op,
                    $result['ok'],
                    $result['failed'],
                    $username
                ),
                'info'
            );

            return $result;
        }

        return null;
    }

    private function uploadErrorMessage(int $code): string {
        switch ($code) {
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                $ini = ini_get('upload_max_filesize') ?: '?';
                $post = ini_get('post_max_size') ?: '?';

                return 'Uploaded file exceeds the PHP/server size limit'
                    . ' (upload_max_filesize=' . $ini . ', post_max_size=' . $post . ').'
                    . ' This is separate from the app “max upload” quota shown in the UI.';
            case UPLOAD_ERR_PARTIAL:
                return 'Upload was incomplete';
            case UPLOAD_ERR_NO_FILE:
                return 'No file was uploaded';
            case UPLOAD_ERR_NO_TMP_DIR:
                return 'Server missing temporary upload directory';
            case UPLOAD_ERR_CANT_WRITE:
                return 'Server failed to write the upload';
            default:
                return 'Upload failed (error ' . $code . ')';
        }
    }
}
