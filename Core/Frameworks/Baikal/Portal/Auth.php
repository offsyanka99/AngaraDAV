<?php

namespace Baikal\Portal;

/**
 * Session auth for DAV users (same digesta1 scheme as Basic auth).
 *
 * Includes idle timeout, login rate limiting, CSRF token, and full logout.
 */
class Auth {
    public const SESSION_KEY = 'angara_portal_user';
    public const SESSION_NAME = 'ANGARAPORTAL';
    public const CSRF_KEY = 'angara_portal_csrf';
    public const LAST_SEEN_KEY = 'angara_portal_last';
    public const LOGIN_AT_KEY = 'angara_portal_login_at';

    /** @var int Default idle timeout (seconds) — matches admin default (15 min) */
    public const DEFAULT_SESSION_MAX_AGE = 900;

    /** @var int Max failed portal logins per IP per window */
    public const RATE_LIMIT_MAX = 20;

    /** @var int Rate-limit window (seconds) */
    public const RATE_LIMIT_WINDOW = 900;

    /** Minimum length for a self-service DAV password (matches the installer). */
    public const PASSWORD_MIN_LENGTH = 8;

    /** Max successful self-service password changes per user per window. */
    public const PASSWORD_CHANGE_MAX = 5;

    /** Self-service password-change window (seconds). */
    public const PASSWORD_CHANGE_WINDOW = 900;

    /** @var \PDO */
    private $pdo;

    /** @var string */
    private $authRealm;

    /** @var int */
    private $sessionMaxAge;

    /** @var bool True when the current request expired an idle session */
    private $timedOut = false;

    public function __construct(\PDO $pdo, string $authRealm, int $sessionMaxAge = self::DEFAULT_SESSION_MAX_AGE) {
        $this->pdo = $pdo;
        $this->authRealm = $authRealm;
        $this->sessionMaxAge = $sessionMaxAge > 0 ? $sessionMaxAge : self::DEFAULT_SESSION_MAX_AGE;
    }

    /** Idle timeout in seconds (from session_max_age_minutes). */
    public function sessionMaxAge(): int {
        return $this->sessionMaxAge;
    }

    /** Whether this request logged the user out due to idle timeout. */
    public function wasTimedOut(): bool {
        return $this->timedOut;
    }

    public static function startSession(): void {
        if (session_status() === PHP_SESSION_ACTIVE) {
            return;
        }
        // Harden session handling (Bootstrap also does this; portal may run first)
        ini_set('session.use_strict_mode', '1');
        ini_set('session.use_only_cookies', '1');
        ini_set('session.cookie_httponly', '1');

        session_name(self::SESSION_NAME);
        $secure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
            || (isset($_SERVER['HTTP_X_FORWARDED_PROTO']) && $_SERVER['HTTP_X_FORWARDED_PROTO'] === 'https');
        session_set_cookie_params([
            'lifetime' => 0,
            'path'     => '/',
            'secure'   => $secure,
            'httponly'  => true,
            'samesite' => 'Lax',
        ]);
        session_start();
    }

    public function username(): ?string {
        $u = $_SESSION[self::SESSION_KEY] ?? null;
        if (!is_string($u) || $u === '') {
            return null;
        }
        if (!$this->touchSession()) {
            return null;
        }

        return $u;
    }

    public function requireUser(): string {
        $u = $this->username();
        if ($u === null) {
            if ($this->timedOut) {
                throw new ApiException('Session timed out. Please sign in again.', 401);
            }
            throw new ApiException('Not authenticated', 401);
        }

        return $u;
    }

    /** Authenticated username without bumping last-seen. */
    public function peekUser(): string {
        $u = $_SESSION[self::SESSION_KEY] ?? null;
        if (!is_string($u) || $u === '') {
            if ($this->timedOut) {
                throw new ApiException('Session timed out. Please sign in again.', 401);
            }
            throw new ApiException('Not authenticated', 401);
        }
        if ($this->sessionIdleExpired()) {
            $this->timedOut = true;
            $this->logout();
            throw new ApiException('Session timed out. Please sign in again.', 401);
        }

        return $u;
    }

    /**
     * Verify DAV credentials without creating a session (re-auth for dangerous admin actions).
     * Uses the same digesta1 scheme as login. Failed attempts count toward login rate limit.
     */
    public function verifyPassword(string $username, string $password): bool {
        $username = trim($username);
        if ($username === '' || $password === '') {
            return false;
        }
        if ($this->isRateLimited()) {
            throw new ApiException('Too many authentication attempts. Please try again later.', 429);
        }
        $stmt = $this->pdo->prepare('SELECT username, digesta1 FROM users WHERE username = ?');
        $stmt->execute([$username]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$row) {
            $this->registerFailedAttempt();

            return false;
        }
        $hash = md5($username . ':' . $this->authRealm . ':' . $password);
        if (!hash_equals((string) $row['digesta1'], $hash)) {
            $this->registerFailedAttempt();

            return false;
        }
        $this->clearFailedAttempts();

        return true;
    }

    /**
     * @return array{username: string, displayname: string, email: string, principal: string, csrfToken: string}
     */
    public function login(string $username, string $password): array {
        $username = trim($username);
        if ($username === '' || $password === '') {
            throw new ApiException('Username and password are required', 400);
        }

        if ($this->isRateLimited()) {
            error_log('AngaraDAV portal login rate limit exceeded for ' . $this->clientIp());
            throw new ApiException('Too many login attempts. Please try again later.', 429);
        }

        $stmt = $this->pdo->prepare('SELECT username, digesta1 FROM users WHERE username = ?');
        $stmt->execute([$username]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$row) {
            $this->registerFailedAttempt();
            $this->logFailedLogin($username);
            throw new ApiException('Invalid username or password', 401);
        }

        $hash = md5($username . ':' . $this->authRealm . ':' . $password);
        if (!hash_equals((string) $row['digesta1'], $hash)) {
            $this->registerFailedAttempt();
            $this->logFailedLogin($username);
            throw new ApiException('Invalid username or password', 401);
        }

        $this->clearFailedAttempts();
        session_regenerate_id(true);
        $_SESSION[self::SESSION_KEY] = $row['username'];
        $_SESSION[self::LOGIN_AT_KEY] = time();
        $_SESSION[self::LAST_SEEN_KEY] = time();
        $_SESSION[self::CSRF_KEY] = bin2hex(random_bytes(32));

        $profile = $this->profile($row['username']);
        $profile['csrfToken'] = $this->csrfToken();

        return $profile;
    }

    public function logout(): void {
        $_SESSION = [];
        if (session_status() === PHP_SESSION_ACTIVE) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', [
                'expires'  => time() - 42000,
                'path'     => $params['path'] ?? '/',
                'domain'   => $params['domain'] ?? '',
                'secure'   => (bool) ($params['secure'] ?? false),
                'httponly'  => (bool) ($params['httponly'] ?? true),
                'samesite' => $params['samesite'] ?? 'Lax',
            ]);
            session_destroy();
        }
        // Start a fresh empty session so subsequent API calls are clean
        if (session_status() !== PHP_SESSION_ACTIVE) {
            self::startSession();
        }
    }

    public function csrfToken(): string {
        if (empty($_SESSION[self::CSRF_KEY]) || !is_string($_SESSION[self::CSRF_KEY])) {
            $_SESSION[self::CSRF_KEY] = bin2hex(random_bytes(32));
        }

        return (string) $_SESSION[self::CSRF_KEY];
    }

    public function assertCsrf(?string $token): void {
        $expected = $_SESSION[self::CSRF_KEY] ?? '';
        if (!is_string($expected) || $expected === '' || $token === null || $token === '') {
            throw new ApiException('CSRF token missing', 403);
        }
        if (!hash_equals($expected, $token)) {
            throw new ApiException('CSRF token invalid', 403);
        }
    }

    /**
     * @return array{username: string, displayname: string, email: string, principal: string}
     */
    public function profile(string $username): array {
        $stmt = $this->pdo->prepare(
            'SELECT p.uri, p.displayname, p.email
             FROM principals p
             WHERE p.uri = ?'
        );
        $stmt->execute(['principals/' . $username]);
        $p = $stmt->fetch(\PDO::FETCH_ASSOC) ?: [];

        return [
            'username'    => $username,
            'displayname' => $p['displayname'] ?? $username,
            'email'       => $p['email'] ?? '',
            'principal'   => 'principals/' . $username,
        ];
    }

    /**
     * Change the signed-in user's DAV password (portal login and CalDAV/CardDAV/WebDAV).
     *
     * Does not write system.admin_passwordhash. A wrong current password is 400, not 401,
     * so the SPA does not treat a typo as a lost session. Failures share the login rate limit
     * via verifyPassword(); successful changes are limited per username.
     */
    public function changePassword(string $currentPassword, string $newPassword, string $newPasswordConfirm): void {
        $username = $this->requireUser();
        if ($currentPassword === '') {
            throw new ApiException('Current password is required', 400);
        }
        if ($newPassword === '' || $newPasswordConfirm === '') {
            throw new ApiException('New password and confirmation are required', 400);
        }
        if ($newPassword !== $newPasswordConfirm) {
            throw new ApiException('New password confirmation does not match', 400);
        }
        if (strlen($newPassword) < self::PASSWORD_MIN_LENGTH) {
            throw new ApiException('New password must be at least ' . self::PASSWORD_MIN_LENGTH . ' characters', 400);
        }
        if ($this->isPasswordChangeRateLimited($username)) {
            throw new ApiException('Too many password changes. Please try again later.', 429);
        }
        if (!$this->verifyPassword($username, $currentPassword)) {
            throw new ApiException('Current password is incorrect', 400);
        }
        if (strlen($currentPassword) === strlen($newPassword) && hash_equals($currentPassword, $newPassword)) {
            throw new ApiException('New password must be different from the current password', 400);
        }

        $hash = md5($username . ':' . $this->authRealm . ':' . $newPassword);
        $stmt = $this->pdo->prepare('UPDATE users SET digesta1 = ? WHERE username = ?');
        $stmt->execute([$hash, $username]);
        if ($stmt->rowCount() < 1) {
            throw new ApiException('Unable to change password', 500);
        }
        $this->registerPasswordChange($username);
        if (session_status() === PHP_SESSION_ACTIVE) {
            session_regenerate_id(true);
        }
    }

    /**
     * True when LAST_SEEN_KEY is older than sessionMaxAge.
     * Legacy sessions without LOGIN_AT_KEY are not treated as expired (touchSession migrates them).
     */
    private function sessionIdleExpired(): bool {
        $loginAt = isset($_SESSION[self::LOGIN_AT_KEY]) ? (int) $_SESSION[self::LOGIN_AT_KEY] : 0;
        if ($loginAt <= 0) {
            return false;
        }
        $last = isset($_SESSION[self::LAST_SEEN_KEY]) ? (int) $_SESSION[self::LAST_SEEN_KEY] : 0;

        return $last > 0 && (time() - $last) > $this->sessionMaxAge;
    }

    /**
     * Refresh last-seen; return false if session expired.
     */
    private function touchSession(): bool {
        $loginAt = isset($_SESSION[self::LOGIN_AT_KEY]) ? (int) $_SESSION[self::LOGIN_AT_KEY] : 0;
        if ($loginAt <= 0) {
            // Legacy sessions without timestamps — migrate once
            $_SESSION[self::LOGIN_AT_KEY] = time();
            $_SESSION[self::LAST_SEEN_KEY] = time();

            return true;
        }
        if ($this->sessionIdleExpired()) {
            $this->timedOut = true;
            $this->logout();

            return false;
        }
        $_SESSION[self::LAST_SEEN_KEY] = time();

        return true;
    }

    private function logFailedLogin(string $username): void {
        // Same pattern as admin for Fail2Ban hooks
        error_log('AngaraDAV portal authentication failure for user ' . preg_replace('/[^\w.@+-]/', '?', $username));
    }

    private function clientIp(): string {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

        return is_string($ip) && $ip !== '' ? $ip : '0.0.0.0';
    }

    private function rateLimitPath(): string {
        $dir = defined('PROJECT_PATH_SPECIFIC') ? PROJECT_PATH_SPECIFIC : (defined('PROJECT_PATH_ROOT') ? PROJECT_PATH_ROOT . 'Specific/' : sys_get_temp_dir() . '/');

        return rtrim($dir, '/') . '/portal_login_rate.json';
    }

    private function loadRateData(): array {
        $path = $this->rateLimitPath();
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

    private function saveRateData(array $data): void {
        $path = $this->rateLimitPath();
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

    private function isRateLimited(): bool {
        $ip = $this->clientIp();
        $data = $this->loadRateData();
        $now = time();
        $row = $data[$ip] ?? null;
        if (!is_array($row)) {
            return false;
        }
        $start = (int) ($row['start'] ?? 0);
        $count = (int) ($row['count'] ?? 0);
        if ($start <= 0 || ($now - $start) > self::RATE_LIMIT_WINDOW) {
            return false;
        }

        return $count >= self::RATE_LIMIT_MAX;
    }

    private function registerFailedAttempt(): void {
        $ip = $this->clientIp();
        $data = $this->loadRateData();
        $now = time();
        $row = $data[$ip] ?? null;
        if (!is_array($row) || (int) ($row['start'] ?? 0) <= 0 || ($now - (int) $row['start']) > self::RATE_LIMIT_WINDOW) {
            $data[$ip] = ['start' => $now, 'count' => 1];
        } else {
            $data[$ip]['count'] = (int) ($row['count'] ?? 0) + 1;
        }
        // Prune stale IPs
        foreach ($data as $k => $v) {
            if (!is_array($v) || ($now - (int) ($v['start'] ?? 0)) > self::RATE_LIMIT_WINDOW * 2) {
                unset($data[$k]);
            }
        }
        $this->saveRateData($data);
    }

    private function clearFailedAttempts(): void {
        $ip = $this->clientIp();
        $data = $this->loadRateData();
        if (isset($data[$ip])) {
            unset($data[$ip]);
            $this->saveRateData($data);
        }
    }

    private function passwordChangeRatePath(): string {
        $dir = defined('PROJECT_PATH_SPECIFIC') ? PROJECT_PATH_SPECIFIC : (defined('PROJECT_PATH_ROOT') ? PROJECT_PATH_ROOT . 'Specific/' : sys_get_temp_dir() . '/');

        return rtrim($dir, '/') . '/portal_self_password_rate.json';
    }

    /**
     * @return array<string, mixed>
     */
    private function loadPasswordChangeRateData(): array {
        $path = $this->passwordChangeRatePath();
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
    private function savePasswordChangeRateData(array $data): void {
        $path = $this->passwordChangeRatePath();
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

    private function isPasswordChangeRateLimited(string $username): bool {
        $data = $this->loadPasswordChangeRateData();
        $now = time();
        $row = $data[$username] ?? null;
        if (!is_array($row)) {
            return false;
        }
        $start = (int) ($row['start'] ?? 0);
        $count = (int) ($row['count'] ?? 0);
        if ($start <= 0 || ($now - $start) > self::PASSWORD_CHANGE_WINDOW) {
            return false;
        }

        return $count >= self::PASSWORD_CHANGE_MAX;
    }

    private function registerPasswordChange(string $username): void {
        $data = $this->loadPasswordChangeRateData();
        $now = time();
        $row = $data[$username] ?? null;
        if (!is_array($row) || (int) ($row['start'] ?? 0) <= 0 || ($now - (int) $row['start']) > self::PASSWORD_CHANGE_WINDOW) {
            $data[$username] = ['start' => $now, 'count' => 1];
        } else {
            $data[$username]['count'] = (int) ($row['count'] ?? 0) + 1;
        }
        foreach ($data as $k => $v) {
            if (!is_array($v) || ($now - (int) ($v['start'] ?? 0)) > self::PASSWORD_CHANGE_WINDOW * 2) {
                unset($data[$k]);
            }
        }
        $this->savePasswordChangeRateData($data);
    }
}
