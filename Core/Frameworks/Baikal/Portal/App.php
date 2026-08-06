<?php

namespace Baikal\Portal;

use Baikal\Portal\Admin\AdminAudit;
use Baikal\Portal\Admin\AdminCapabilitiesService;
use Baikal\Portal\Admin\AdminDashboardService;
use Baikal\Portal\Admin\AdminSettingsService;
use Baikal\Portal\Admin\AdminUserResourceService;
use Baikal\Portal\Admin\AdminUserService;
use Symfony\Component\Yaml\Yaml;

/**
 * JSON API router for the user portal SPA.
 */
class App {
    /** @var Auth */
    private $auth;

    /** @var AdminAuth */
    private $adminAuth;

    /** @var AdminAudit */
    private $adminAudit;

    /** @var AdminDashboardService */
    private $adminDashboard;

    /** @var AdminCapabilitiesService */
    private $adminCapabilities;

    /** @var AdminUserService */
    private $adminUsers;

    /** @var AdminUserResourceService */
    private $adminResources;

    /** @var AdminSettingsService */
    private $adminSettings;

    /** @var ShareService */
    private $shares;

    /** @var ContactService */
    private $contacts;

    /** @var CalendarItemService */
    private $items;

    /** @var FileService */
    private $files;

    /** @var array<string, mixed> */
    private $config;

    /** @var array<string, mixed>|null Cached JSON body (php://input is one-shot) */
    private $jsonBodyCache;

    /** True when a streaming / download response was already sent (skip json()). */
    private $responseSent = false;

    public function __construct(\PDO $pdo, array $config) {
        $this->config = $config;
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
        $this->shares = new ShareService($pdo);
        $this->contacts = new ContactService($pdo);
        $this->items = new CalendarItemService($pdo);
        $this->files = new FileService($pdo, $config);
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
     * Portal UI prefs (time format / week start / log level). Env overrides YAML.
     * TIME_FORMAT / BAIKAL_PORTAL_TIME_FORMAT: auto|12h|24h
     * BAIKAL_PORTAL_WEEK_START: auto|monday|sunday
     * PORTAL_LOG_LEVEL / BAIKAL_PORTAL_LOG_LEVEL: off|error|warn|info|debug.
     *
     * @return array{timeFormat: string, weekStart: string, logLevel: string, sessionIdleSeconds: int, version: string, git: string}
     */
    private function portalUiSettings(): array {
        $sys = is_array($this->config['system'] ?? null) ? $this->config['system'] : [];
        $time = strtolower(trim((string) (
            getenv('TIME_FORMAT')
            ?: getenv('BAIKAL_PORTAL_TIME_FORMAT')
            ?: ($sys['portal_time_format'] ?? 'auto')
        )));
        if (!in_array($time, ['auto', '12h', '24h'], true)) {
            $time = 'auto';
        }
        $week = strtolower(trim((string) (
            getenv('BAIKAL_PORTAL_WEEK_START')
            ?: ($sys['portal_week_start'] ?? 'auto')
        )));
        if (!in_array($week, ['auto', 'monday', 'sunday'], true)) {
            $week = 'auto';
        }

        return [
            'timeFormat'         => $time,
            'weekStart'          => $week,
            'logLevel'           => $this->portalLogLevel(),
            'sessionIdleSeconds' => $this->auth->sessionMaxAge(),
            'version'            => defined('BAIKAL_VERSION') ? (string) BAIKAL_VERSION : '',
            'git'                => defined('BAIKAL_GIT_SHA') ? (string) BAIKAL_GIT_SHA : '',
        ];
    }

    /**
     * Portal log level (SPA console + optional server request log). Env overrides YAML.
     * PORTAL_LOG_LEVEL / BAIKAL_PORTAL_LOG_LEVEL / system.portal_log_level: off|error|warn|info|debug.
     */
    private function portalLogLevel(): string {
        $sys = is_array($this->config['system'] ?? null) ? $this->config['system'] : [];
        $level = strtolower(trim((string) (
            getenv('PORTAL_LOG_LEVEL')
            ?: getenv('BAIKAL_PORTAL_LOG_LEVEL')
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
     * Bootstrap Flake/Baikal and return App. PROJECT_PATH_ROOT must already be defined.
     */
    public static function bootstrap(): self {
        Auth::startSession();

        if (!defined('PROJECT_PATH_ROOT')) {
            throw new ApiException('PROJECT_PATH_ROOT not defined', 500);
        }

        \Flake\Framework::bootstrap();
        \Baikal\Framework::bootstrap();

        $configPath = PROJECT_PATH_CONFIG . 'baikal.yaml';
        if (!is_readable($configPath)) {
            throw new ApiException('AngaraDAV is not configured yet', 503);
        }
        $config = Yaml::parseFile($configPath);
        if (!is_array($config)) {
            throw new ApiException('Invalid AngaraDAV configuration', 503);
        }

        if (!isset($GLOBALS['DB']) || !is_object($GLOBALS['DB'])) {
            throw new ApiException('Database is not available', 503);
        }

        return new self($GLOBALS['DB']->getPDO(), $config);
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
                $meta = $this->files->openDownload($username, $filePath);
                $this->streamFileDownload(
                    $meta['absolutePath'],
                    $meta['name'],
                    $meta['contentType'],
                    $meta['size'],
                    $meta['etag']
                );
                $this->portalServerLog(
                    sprintf(
                        '%s %s → 200 files download path=%s size=%d user=%s (%dms)',
                        $method,
                        $path,
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
                $export = $this->shares->exportCalendar($username, (int) $m[1]);
                $this->fileDownload($export['ics'], $export['filename'], 'text/calendar; charset=utf-8');
                $this->portalServerLog(
                    sprintf('%s %s → 200 export (%dms)', $method, $path, (int) ((microtime(true) - $t0) * 1000)),
                    'info'
                );

                return;
            }
            if ($method === 'GET' && preg_match('#^/addressbooks/(\d+)/export$#', $path, $m)) {
                $username = $this->auth->requireUser();
                $export = $this->contacts->exportAddressBook($username, (int) $m[1]);
                $this->fileDownload($export['vcf'], $export['filename'], 'text/vcard; charset=utf-8');
                $this->portalServerLog(
                    sprintf('%s %s → 200 export (%dms)', $method, $path, (int) ((microtime(true) - $t0) * 1000)),
                    'info'
                );

                return;
            }
            // Single contact VCF export
            if ($method === 'GET' && preg_match('#^/addressbooks/(\d+)/contacts/([^/]+)/export$#', $path, $m)) {
                $username = $this->auth->requireUser();
                $export = $this->contacts->exportContact($username, (int) $m[1], rawurldecode($m[2]));
                $this->fileDownload($export['vcf'], $export['filename'], 'text/vcard; charset=utf-8');
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
            if ($this->responseSent) {
                $this->portalServerLog(
                    sprintf('%s %s → stream done (%dms)', $method, $path, (int) ((microtime(true) - $t0) * 1000)),
                    'info'
                );

                return;
            }
            $this->json(200, $result);
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
            if ($this->responseSent) {
                return;
            }
            $this->json($e->getStatus(), ['error' => $e->getMessage()]);
        } catch (\Throwable $e) {
            error_log('AngaraDAV portal API: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
            $this->portalServerLog(
                sprintf('%s %s → 500 %s', $method, $path, $e->getMessage()),
                'error'
            );
            if ($this->responseSent) {
                return;
            }
            $msg = 'Internal server error';
            // Surface timeout clearly for large imports (Thunderbird full calendar/contacts)
            if (stripos($e->getMessage(), 'Maximum execution time') !== false) {
                $msg = 'Import timed out. Try a smaller export, or import again (already-imported items update faster).';
            }
            $this->json(500, ['error' => $msg]);
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
            $this->assertSameOrigin();
            $body = $this->jsonBody();
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
            $this->assertSameOrigin();
            $sessionUser = $this->auth->username();
            if ($path === '/logout') {
                if ($sessionUser !== null) {
                    $this->auth->assertCsrf($this->csrfFromRequest());
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
            $this->auth->assertCsrf($this->csrfFromRequest());
        }

        if ($method === 'GET' && ($path === '/me' || $path === '')) {
            $username = $this->auth->requireUser();
            $profile = $this->enrichProfile($this->auth->profile($username));
            $profile['csrfToken'] = $this->auth->csrfToken();

            return [
                'user'      => $profile,
                'csrfToken' => $this->auth->csrfToken(),
                'version'   => defined('BAIKAL_VERSION') ? BAIKAL_VERSION : null,
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

        if ($method === 'GET' && $path === '/directory') {
            return ['users' => $this->shares->directory($username)];
        }

        if ($method === 'GET' && $path === '/holidays/countries') {
            return ['countries' => Holidays::countries()];
        }

        if ($method === 'GET' && $path === '/calendars') {
            return ['calendars' => $this->shares->listCalendars($username)];
        }

        // POST /calendars — create (optional holidays + readOnly)
        if ($method === 'POST' && $path === '/calendars') {
            $body = $this->jsonBody();
            $cal = $this->shares->createCalendar($username, $body);

            return [
                'calendar'      => $cal,
                'holidayImport' => $cal['holidayImport'] ?? null,
            ];
        }

        // PATCH|PUT /calendars/{id} — update displayname / color / description
        if (preg_match('#^/calendars/(\d+)$#', $path, $m) && ($method === 'PATCH' || $method === 'PUT')) {
            $instanceId = (int) $m[1];
            $body = $this->jsonBody();
            $cal = $this->shares->updateCalendar($username, $instanceId, $body);

            return ['calendar' => $cal];
        }

        // DELETE /calendars/{id} — permanently remove owned calendar
        if (preg_match('#^/calendars/(\d+)$#', $path, $m) && $method === 'DELETE') {
            $instanceId = (int) $m[1];
            $this->shares->deleteCalendar($username, $instanceId);

            return ['ok' => true];
        }

        // GET /calendars/{id}/events?from=YYYY-MM-DD&to=YYYY-MM-DD — month view
        // POST /calendars/{id}/events — create VEVENT
        if (preg_match('#^/calendars/(\d+)/events$#', $path, $m)) {
            $instanceId = (int) $m[1];
            if ($method === 'GET') {
                $from = isset($_GET['from']) ? (string) $_GET['from'] : '';
                $to = isset($_GET['to']) ? (string) $_GET['to'] : '';

                return [
                    'events' => $this->shares->listEvents($username, $instanceId, $from, $to),
                ];
            }
            if ($method === 'POST') {
                $body = $this->jsonBody();
                $event = $this->shares->createEvent($username, $instanceId, $body);

                return ['event' => $event];
            }
        }

        // GET|PATCH|DELETE /calendars/{id}/events/{uri} — single VEVENT
        if (preg_match('#^/calendars/(\d+)/events/([^/]+)$#', $path, $m)) {
            $instanceId = (int) $m[1];
            $uri = rawurldecode($m[2]);
            if ($method === 'GET') {
                return ['event' => $this->shares->getEvent($username, $instanceId, $uri)];
            }
            if ($method === 'PATCH' || $method === 'PUT') {
                $body = $this->jsonBody();
                $event = $this->shares->updateEvent($username, $instanceId, $uri, $body);

                return ['event' => $event];
            }
            if ($method === 'DELETE') {
                $this->shares->deleteEvent($username, $instanceId, $uri);

                return ['ok' => true];
            }
        }

        // POST /calendars/{id}/import — ICS body (raw text/calendar preferred; JSON {ics} still works)
        // Accept: application/x-ndjson → stream progress lines for the portal modal
        if ($method === 'POST' && preg_match('#^/calendars/(\d+)/import$#', $path, $m)) {
            $instanceId = (int) $m[1];
            // Raise limits before reading multi‑MB bodies into memory
            if (function_exists('set_time_limit')) {
                @set_time_limit(600);
            }
            @ini_set('memory_limit', '512M');
            // Release session lock so other portal tabs / healthchecks keep working
            if (session_status() === PHP_SESSION_ACTIVE) {
                session_write_close();
            }
            $ics = $this->readIcsPayload();
            if ($this->wantsImportProgressStream()) {
                $this->streamImportProgress(function (?callable $onProgress) use ($username, $instanceId, $ics) {
                    return $this->shares->importCalendar($username, $instanceId, $ics, false, $onProgress);
                });

                return null;
            }

            return $this->shares->importCalendar($username, $instanceId, $ics);
        }

        if (preg_match('#^/calendars/(\d+)/shares$#', $path, $m)) {
            $instanceId = (int) $m[1];
            if ($method === 'GET') {
                return ['shares' => $this->shares->listShares($username, $instanceId)];
            }
            if ($method === 'POST') {
                $body = $this->jsonBody();
                $share = $this->shares->addOrUpdateShare(
                    $username,
                    $instanceId,
                    (string) ($body['username'] ?? ''),
                    (string) ($body['access'] ?? 'read')
                );

                return ['share' => $share];
            }
            if ($method === 'DELETE') {
                $body = $this->jsonBody();
                $href = (string) ($body['href'] ?? ($_GET['href'] ?? ''));
                $this->shares->revokeShare($username, $instanceId, $href);

                return ['ok' => true];
            }
        }

        // --- Address books / contacts ---
        if ($method === 'GET' && $path === '/addressbooks') {
            return ['addressbooks' => $this->contacts->listAddressBooks($username)];
        }

        if ($method === 'POST' && $path === '/addressbooks') {
            $body = $this->jsonBody();
            $ab = $this->contacts->createAddressBook($username, $body);

            return ['addressbook' => $ab];
        }

        if (preg_match('#^/addressbooks/(\d+)$#', $path, $m)) {
            $id = (int) $m[1];
            if ($method === 'PATCH' || $method === 'PUT') {
                $body = $this->jsonBody();
                $ab = $this->contacts->updateAddressBook($username, $id, $body);

                return ['addressbook' => $ab];
            }
            if ($method === 'DELETE') {
                $body = $this->jsonBody();
                $force = !empty($body['force']) || (isset($_GET['force']) && $_GET['force'] !== '0' && $_GET['force'] !== '');
                $this->contacts->deleteAddressBook($username, $id, $force);

                return ['ok' => true];
            }
        }

        if ($method === 'POST' && preg_match('#^/addressbooks/(\d+)/import$#', $path, $m)) {
            $id = (int) $m[1];
            if (function_exists('set_time_limit')) {
                @set_time_limit(600);
            }
            @ini_set('memory_limit', '512M');
            if (session_status() === PHP_SESSION_ACTIVE) {
                session_write_close();
            }
            $vcf = $this->readPayloadField('vcf', ['text/vcard', 'text/x-vcard', 'text/directory']);
            if ($this->wantsImportProgressStream()) {
                $this->streamImportProgress(function (?callable $onProgress) use ($username, $id, $vcf) {
                    return $this->contacts->importAddressBook($username, $id, $vcf, $onProgress);
                });

                return null;
            }

            return $this->contacts->importAddressBook($username, $id, $vcf);
        }

        // GET list / POST create contacts
        if (preg_match('#^/addressbooks/(\d+)/contacts$#', $path, $m)) {
            $id = (int) $m[1];
            if ($method === 'GET') {
                $q = isset($_GET['q']) ? (string) $_GET['q'] : '';

                return ['contacts' => $this->contacts->listContacts($username, $id, $q)];
            }
            if ($method === 'POST') {
                $body = $this->jsonBody();
                $contact = $this->contacts->createContact($username, $id, $body);

                return ['contact' => $contact];
            }
        }

        // GET / PATCH / DELETE one contact
        if (preg_match('#^/addressbooks/(\d+)/contacts/([^/]+)$#', $path, $m)) {
            $id = (int) $m[1];
            $uri = rawurldecode($m[2]);
            if ($method === 'GET') {
                return ['contact' => $this->contacts->getContact($username, $id, $uri)];
            }
            if ($method === 'PATCH' || $method === 'PUT') {
                $body = $this->jsonBody();
                $contact = $this->contacts->updateContact($username, $id, $uri, $body);

                return ['contact' => $contact];
            }
            if ($method === 'DELETE') {
                $this->contacts->deleteContact($username, $id, $uri);

                return ['ok' => true];
            }
        }

        // --- Private WebDAV files (portal Files tab) ---
        $fileRoutes = $this->dispatchFileRoutes($method, $path, $username);
        if ($fileRoutes !== null) {
            return $fileRoutes;
        }

        // --- Tasks (VTODO) / Notes (VJOURNAL) ---
        $itemRoutes = $this->dispatchItemRoutes($method, $path, $username);
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
                $body = $this->jsonBody();
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
                $body = $this->jsonBody();
                $confirm = !empty($body['confirm']) && $body['confirm'] !== '0' && $body['confirm'] !== 'false';
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

        // Database settings — write requires confirm: "CONFIRM" (Phase 8.2)
        if ($adminPath === '/admin/settings/database' || $adminPath === '/admin/settings/database/') {
            if ($method === 'GET') {
                return ['data' => $this->adminSettings->getDatabaseSettings()];
            }
            if ($method === 'PUT' || $method === 'PATCH' || $method === 'POST') {
                $body = $this->jsonBody();
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
                $body = $this->jsonBody();
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
                    $body = $this->jsonBody();
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
                    $body = $this->jsonBody();
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
                    $body = $this->jsonBody();
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
                    $body = $this->jsonBody();
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
                    $body = $this->jsonBody();
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
                    $body = $this->jsonBody();
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
                $body = $this->jsonBody();
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
                $body = $this->jsonBody();
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
            $body = $this->jsonBody();
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
                $data = $this->rawRequestBody();
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
            $body = $this->jsonBody();
            $entryPath = (string) ($body['path'] ?? ($_GET['path'] ?? ''));
            $this->files->delete($username, $entryPath);
            $this->portalServerLog(
                'files delete path=' . $entryPath . ' user=' . $username,
                'info'
            );

            return ['ok' => true];
        }

        if ($method === 'POST' && $path === '/files/rename') {
            $body = $this->jsonBody();
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
            $body = $this->jsonBody();
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
            $body = $this->jsonBody();
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
            $body = $this->jsonBody();
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

    /**
     * Stream a file from disk for the portal Files download endpoint.
     */
    private function streamFileDownload(
        string $absolutePath,
        string $filename,
        string $contentType,
        int $size,
        string $etag
    ): void {
        $this->responseSent = true;
        $safe = preg_replace('/[^a-zA-Z0-9._ -]+/', '-', $filename) ?: 'download';
        $safe = trim($safe, '.- ') ?: 'download';
        // Release session so long downloads do not block other portal tabs
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_write_close();
        }
        while (ob_get_level() > 0) {
            @ob_end_clean();
        }
        http_response_code(200);
        header('Content-Type: ' . $contentType);
        header('Content-Disposition: attachment; filename="' . $safe . '"');
        header('Cache-Control: private, no-store');
        header('X-Content-Type-Options: nosniff');
        header('ETag: ' . $etag);
        if ($size >= 0) {
            header('Content-Length: ' . (string) $size);
        }
        $fp = fopen($absolutePath, 'rb');
        if ($fp === false) {
            throw new ApiException('Unable to read file', 500);
        }
        try {
            fpassthru($fp);
        } finally {
            fclose($fp);
        }
    }

    /**
     * @return array<string, mixed>|list<mixed>|null
     */
    private function dispatchItemRoutes(string $method, string $path, string $username) {
        foreach (['tasks' => CalendarItemService::KIND_TASK, 'notes' => CalendarItemService::KIND_NOTE] as $seg => $kind) {
            if ($method === 'GET' && $path === '/' . $seg) {
                $q = isset($_GET['q']) ? (string) $_GET['q'] : '';
                $sort = isset($_GET['sort']) ? (string) $_GET['sort'] : '';
                $order = isset($_GET['order']) ? (string) $_GET['order'] : 'asc';

                return [
                    $seg        => $this->items->listItems($username, $kind, $q, $sort, $order),
                    'calendars' => $this->items->writableCalendars($username, $kind),
                ];
            }
            if ($method === 'POST' && $path === '/' . $seg) {
                $body = $this->jsonBody();
                $item = $this->items->createItem($username, $kind, $body);

                return [rtrim($seg, 's') => $item]; // task / note
            }
            // POST /tasks/bulk — multi select update/delete
            if ($method === 'POST' && $path === '/' . $seg . '/bulk') {
                $body = $this->jsonBody();
                $op = (string) ($body['op'] ?? '');
                $items = $body['items'] ?? [];
                if (!is_array($items)) {
                    throw new ApiException('items must be an array', 400);
                }
                $fields = $body['fields'] ?? [];
                if (!is_array($fields)) {
                    $fields = [];
                }

                return $this->items->bulkItems($username, $kind, $op, $items, $fields);
            }
            // /tasks/{instanceId}/{uri}
            if (preg_match('#^/' . $seg . '/(\d+)/([^/]+)$#', $path, $m)) {
                $instanceId = (int) $m[1];
                $uri = rawurldecode($m[2]);
                $key = rtrim($seg, 's');
                if ($method === 'GET') {
                    return [$key => $this->items->getItem($username, $kind, $instanceId, $uri)];
                }
                if ($method === 'PATCH' || $method === 'PUT') {
                    $body = $this->jsonBody();
                    $item = $this->items->updateItem($username, $kind, $instanceId, $uri, $body);

                    return [$key => $item];
                }
                if ($method === 'DELETE') {
                    $this->items->deleteItem($username, $kind, $instanceId, $uri);

                    return ['ok' => true];
                }
            }
        }

        return null;
    }

    private function readIcsPayload(): string {
        return $this->readPayloadField('ics', ['text/calendar']);
    }

    private function csrfFromRequest(): string {
        $h = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? $_SERVER['HTTP_X_BAIKAL_CSRF'] ?? '';
        if (is_string($h) && $h !== '') {
            return $h;
        }

        return '';
    }

    /**
     * Reject cross-site browser requests (defense in depth with SameSite=Lax + CSRF).
     * Fail closed when neither Origin nor Referer is present on state-changing calls.
     */
    private function assertSameOrigin(): void {
        SameOrigin::assert($_SERVER);
    }

    /** @var string|null Raw php://input (one-shot stream — cache for reuse) */
    private $rawBodyCache;

    private function rawRequestBody(): string {
        if ($this->rawBodyCache !== null) {
            return $this->rawBodyCache;
        }
        $raw = file_get_contents('php://input');
        $this->rawBodyCache = $raw === false ? '' : $raw;

        return $this->rawBodyCache;
    }

    /**
     * @param list<string> $rawContentTypes
     */
    private function readPayloadField(string $jsonField, array $rawContentTypes): string {
        $ct = strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? $_SERVER['HTTP_CONTENT_TYPE'] ?? ''));
        $raw = $this->rawRequestBody();

        // Prefer raw calendar/vcard bodies (portal import) — avoid JSON round-trip
        foreach ($rawContentTypes as $t) {
            if (str_contains($ct, $t)) {
                if (trim($raw) === '') {
                    throw new ApiException('Request body is empty', 400);
                }

                return $raw;
            }
        }

        $isJson = str_contains($ct, 'application/json')
            || (isset($raw[0]) && ($raw[0] === '{' || $raw[0] === '['));
        if ($isJson) {
            $data = json_decode($raw, true);
            if (!is_array($data)) {
                throw new ApiException('Invalid JSON body (import prefers raw text/calendar or text/vcard)', 400);
            }
            if (isset($data[$jsonField]) && is_string($data[$jsonField]) && $data[$jsonField] !== '') {
                return $data[$jsonField];
            }
            throw new ApiException('JSON body must include string field "' . $jsonField . '"', 400);
        }

        // Allow plain text uploads
        if (trim($raw) === '') {
            throw new ApiException('Request body is empty', 400);
        }

        return $raw;
    }

    /**
     * @return array<string, mixed>
     */
    private function jsonBody(): array {
        if ($this->jsonBodyCache !== null) {
            return $this->jsonBodyCache;
        }
        $raw = $this->rawRequestBody();
        if (trim($raw) === '') {
            $this->jsonBodyCache = [];

            return [];
        }
        $data = json_decode($raw, true);
        if (!is_array($data)) {
            throw new ApiException('Invalid JSON body', 400);
        }
        $this->jsonBodyCache = $data;

        return $data;
    }

    /**
     * @param array<string, mixed>|list<mixed> $payload
     */
    private function json(int $status, $payload): void {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        // JSON_INVALID_UTF8_SUBSTITUTE: never fail the whole API if one field has bad bytes
        $flags = JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE;
        if (defined('JSON_INVALID_UTF8_SUBSTITUTE')) {
            $flags |= JSON_INVALID_UTF8_SUBSTITUTE;
        }
        $json = json_encode($payload, $flags);
        if ($json === false) {
            error_log('AngaraDAV portal JSON encode failed: ' . json_last_error_msg());
            $json = json_encode(['error' => 'Response encoding failed'], JSON_UNESCAPED_SLASHES) ?: '{"error":"Response encoding failed"}';
            http_response_code(500);
        }
        echo $json . "\n";
    }

    private function fileDownload(string $body, string $filename, string $contentType): void {
        $filename = preg_replace('/[^a-zA-Z0-9._-]+/', '-', $filename) ?: 'download';
        http_response_code(200);
        header('Content-Type: ' . $contentType);
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        header('Content-Length: ' . (string) strlen($body));
        echo $body;
    }

    /** Portal import UI requests Accept: application/x-ndjson for live %. */
    private function wantsImportProgressStream(): bool {
        $accept = strtolower((string) ($_SERVER['HTTP_ACCEPT'] ?? ''));

        return str_contains($accept, 'application/x-ndjson')
            || (isset($_GET['progress']) && (string) $_GET['progress'] === '1');
    }

    /**
     * Stream NDJSON progress for long imports (each line is one JSON object).
     * progress → {type,current,total,percent,imported,updated,skipped}
     * done     → {type,result:{imported,updated,skipped}}
     * error    → {type,error,status}.
     *
     * Keep this minimal: only echo + flush. Do not call ob_flush() with no buffer
     * (that aborts the import under error handlers that promote notices to exceptions).
     *
     * @param callable(?callable): array{imported: int, updated: int, skipped: int} $importFn
     */
    private function streamImportProgress(callable $importFn): void {
        $this->responseSent = true;

        // Drop any existing output buffers cleanly (no flush — may have no buffer left)
        while (ob_get_level() > 0) {
            @ob_end_clean();
        }
        @ini_set('zlib.output_compression', '0');
        @ini_set('implicit_flush', '1');
        if (function_exists('apache_setenv')) {
            @apache_setenv('no-gzip', '1');
        }

        http_response_code(200);
        header('Content-Type: application/x-ndjson; charset=utf-8');
        header('Cache-Control: no-store');
        header('X-Content-Type-Options: nosniff');
        header('X-Accel-Buffering: no');

        $emit = static function (array $payload): void {
            $flags = JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE;
            if (defined('JSON_INVALID_UTF8_SUBSTITUTE')) {
                $flags |= JSON_INVALID_UTF8_SUBSTITUTE;
            }
            $line = json_encode($payload, $flags);
            if ($line === false) {
                $line = '{"type":"error","error":"Progress encode failed","status":500}';
            }
            echo $line . "\n";
            // Never call ob_flush() when level is 0 — that is the "Failed to flush buffer" crash
            if (ob_get_level() > 0) {
                @ob_flush();
            }
            flush();
        };

        try {
            // First line immediately so nginx leaves "waiting for headers"
            $emit([
                'type'     => 'progress',
                'current'  => 0,
                'total'    => 0,
                'percent'  => 0,
                'imported' => 0,
                'updated'  => 0,
                'skipped'  => 0,
            ]);

            $result = $importFn(static function (
                int $current,
                int $total,
                int $imported,
                int $updated,
                int $skipped
            ) use ($emit): void {
                $percent = $total > 0 ? (int) min(100, max(0, (int) round(100 * $current / $total))) : 0;
                $emit([
                    'type'     => 'progress',
                    'current'  => $current,
                    'total'    => $total,
                    'percent'  => $percent,
                    'imported' => $imported,
                    'updated'  => $updated,
                    'skipped'  => $skipped,
                ]);
            });
            $emit([
                'type'   => 'done',
                'result' => [
                    'imported' => (int) ($result['imported'] ?? 0),
                    'updated'  => (int) ($result['updated'] ?? 0),
                    'skipped'  => (int) ($result['skipped'] ?? 0),
                ],
            ]);
        } catch (ApiException $e) {
            $emit([
                'type'   => 'error',
                'error'  => $e->getMessage(),
                'status' => $e->getStatus(),
            ]);
        } catch (\Throwable $e) {
            error_log('AngaraDAV portal import stream: ' . $e->getMessage() . ' @ ' . $e->getFile() . ':' . $e->getLine());
            $msg = 'Internal server error';
            if (stripos($e->getMessage(), 'Maximum execution time') !== false) {
                $msg = 'Import timed out. Try a smaller export, or import again (already-imported items update faster).';
            } elseif (stripos($e->getMessage(), 'ob_flush') !== false) {
                $msg = 'Import progress flush failed; please retry after updating the image.';
            }
            $emit([
                'type'   => 'error',
                'error'  => $msg,
                'status' => 500,
            ]);
        }
    }
}
