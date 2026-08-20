<?php

namespace Baikal\Portal\Admin;

use Baikal\Core\Files\FileStorageConfig;
use Baikal\Core\Files\HomeRepository;
use Baikal\Core\Files\SchemaManager;
use Baikal\Portal\AdminAuth;
use Baikal\Portal\ApiException;

/**
 * Admin access to DAV users (read + write).
 *
 * Never returns digesta1 / password fields. Create mirrors the former
 * Baikal\Model\User persist path (principal + default calendar + address book).
 * Delete is PDO-only and includes file-home quarantine plus DAV path cleanup.
 */
class AdminUserService {
    /** Max DAV user password changes per IP per window. */
    private const PASSWORD_RATE_MAX = 10;

    /** Rate-limit window for user password changes (seconds). */
    private const PASSWORD_RATE_WINDOW = 900;

    /** @var \PDO */
    private $pdo;

    /** @var array<string, mixed> */
    private $config;

    /**
     * @param array<string, mixed> $config Full baikal.yaml (or test fixture)
     */
    public function __construct(\PDO $pdo, array $config = []) {
        $this->pdo = $pdo;
        $this->config = $config;
    }

    /**
     * List all users ordered by username.
     *
     * @return list<array{username: string, displayname: string, email: string, principal: string}>
     */
    public function listUsers(): array {
        $sql = 'SELECT u.username,
                       COALESCE(p.displayname, u.username) AS displayname,
                       COALESCE(p.email, \'\') AS email,
                       COALESCE(p.uri, \'principals/\' || u.username) AS principal
                FROM users u
                LEFT JOIN principals p ON p.uri = \'principals/\' || u.username
                ORDER BY u.username COLLATE NOCASE';

        $driver = $this->driverName();
        if ($driver === 'pgsql') {
            $sql = 'SELECT u.username,
                           COALESCE(p.displayname, u.username) AS displayname,
                           COALESCE(p.email, \'\') AS email,
                           COALESCE(p.uri, \'principals/\' || u.username) AS principal
                    FROM users u
                    LEFT JOIN principals p ON p.uri = \'principals/\' || u.username
                    ORDER BY LOWER(u.username)';
        }

        $stmt = $this->pdo->query($sql);
        if ($stmt === false) {
            throw new ApiException('Unable to list users', 500);
        }
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];
        $out = [];
        foreach ($rows as $row) {
            $out[] = $this->mapListRow($row);
        }

        return $out;
    }

    /**
     * Single user detail for admin view / edit form.
     *
     * @return array{
     *   username: string,
     *   displayname: string,
     *   email: string,
     *   principal: string,
     *   calendarCount: int,
     *   addressBookCount: int,
     *   contactCount: int,
     *   eventCount: int
     * }
     */
    public function getUser(string $username): array {
        $row = $this->fetchUserRow($username);
        if ($row === null) {
            throw new ApiException('User not found', 404);
        }

        $user = $this->mapListRow($row);
        $principalUri = $user['principal'];

        return array_merge($user, [
            'calendarCount'    => $this->countWhere(
                'calendarinstances',
                'principaluri = ?',
                [$principalUri]
            ),
            'addressBookCount' => $this->countWhere(
                'addressbooks',
                'principaluri = ?',
                [$principalUri]
            ),
            'contactCount'     => $this->countContactsForPrincipal($principalUri),
            'eventCount'       => $this->countEventsForPrincipal($principalUri),
        ]);
    }

    /**
     * Create a DAV user (Formal parity: username, displayname, email, password + confirm).
     *
     * @param array<string, mixed> $body
     *
     * @return array{username: string, displayname: string, email: string, principal: string, calendarCount: int, addressBookCount: int, contactCount: int, eventCount: int}
     */
    public function createUser(array $body): array {
        $this->assertNoSecretMassAssignment($body);

        $username = trim((string) ($body['username'] ?? ''));
        $displayname = trim((string) ($body['displayname'] ?? ''));
        $email = trim((string) ($body['email'] ?? ''));
        $password = (string) ($body['password'] ?? '');
        $passwordConfirm = (string) ($body['passwordConfirm'] ?? $body['passwordconfirm'] ?? '');

        $this->assertUsernameFormat($username);
        if ($displayname === '') {
            throw new ApiException('Display name is required', 400);
        }
        $this->assertEmail($email);
        if ($password === '') {
            throw new ApiException('Password is required', 400);
        }
        if ($password !== $passwordConfirm) {
            throw new ApiException('Password confirmation does not match', 400);
        }
        if ($this->usernameExists($username)) {
            throw new ApiException('Username is already taken', 409);
        }

        $principal = 'principals/' . $username;
        $digest = $this->digestFor($username, $password);
        $components = $this->defaultCalendarComponents();

        try {
            $this->pdo->beginTransaction();

            $insP = $this->pdo->prepare(
                'INSERT INTO principals (uri, email, displayname) VALUES (?, ?, ?)'
            );
            $insP->execute([$principal, $email, $displayname]);

            $insU = $this->pdo->prepare(
                'INSERT INTO users (username, digesta1) VALUES (?, ?)'
            );
            $insU->execute([$username, $digest]);

            // Default calendar (mirrors Baikal\Model\User::persist floating path)
            $insCal = $this->pdo->prepare(
                'INSERT INTO calendars (synctoken, components) VALUES (1, ?)'
            );
            $insCal->execute([$components]);
            $calendarId = (int) $this->pdo->lastInsertId();
            if ($calendarId <= 0) {
                // PostgreSQL sometimes needs explicit sequence; fall back to MAX
                $calendarId = (int) $this->pdo->query('SELECT MAX(id) FROM calendars')->fetchColumn();
            }

            $insInst = $this->pdo->prepare(
                'INSERT INTO calendarinstances
                    (calendarid, principaluri, access, displayname, uri, description, calendarorder, share_invitestatus)
                 VALUES (?, ?, 1, ?, ?, ?, 0, 2)'
            );
            $insInst->execute([
                $calendarId,
                $principal,
                'Default calendar',
                'default',
                'Default calendar',
            ]);

            $insAb = $this->pdo->prepare(
                'INSERT INTO addressbooks (principaluri, displayname, uri, description, synctoken)
                 VALUES (?, ?, ?, ?, 1)'
            );
            $insAb->execute([
                $principal,
                'Default Address Book',
                'default',
                'Default Address Book for ' . $displayname,
            ]);

            $this->pdo->commit();
        } catch (ApiException $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            // Unique constraint races
            if ($this->usernameExists($username)) {
                throw new ApiException('Username is already taken', 409);
            }
            throw new ApiException('Unable to create user', 500);
        }

        return $this->getUser($username);
    }

    /**
     * Update displayname, email, and optional password.
     *
     * @param array<string, mixed> $body
     *
     * @return array{username: string, displayname: string, email: string, principal: string, calendarCount: int, addressBookCount: int, contactCount: int, eventCount: int}
     */
    public function updateUser(string $username, array $body): array {
        $this->assertNoSecretMassAssignment($body);
        // Username is immutable via PATCH (classic Formal sets readonly)
        if (array_key_exists('username', $body) && trim((string) $body['username']) !== ''
            && strcasecmp(trim((string) $body['username']), trim($username)) !== 0
        ) {
            throw new ApiException('Username cannot be changed', 400);
        }

        $row = $this->fetchUserRow($username);
        if ($row === null) {
            throw new ApiException('User not found', 404);
        }
        $username = (string) $row['username']; // canonical casing
        $principal = 'principals/' . $username;

        $hasDisplay = array_key_exists('displayname', $body);
        $hasEmail = array_key_exists('email', $body);
        $password = array_key_exists('password', $body) ? (string) $body['password'] : '';
        $passwordConfirm = array_key_exists('passwordConfirm', $body)
            ? (string) $body['passwordConfirm']
            : (array_key_exists('passwordconfirm', $body) ? (string) $body['passwordconfirm'] : '');

        // Empty password fields = leave password unchanged
        $changePassword = $password !== '' || $passwordConfirm !== '';
        if ($changePassword) {
            if ($password === '' || $passwordConfirm === '') {
                throw new ApiException('Password and confirmation are required to change password', 400);
            }
            if ($password !== $passwordConfirm) {
                throw new ApiException('Password confirmation does not match', 400);
            }
            if ($this->isUserPasswordChangeRateLimited()) {
                throw new ApiException('Too many password change attempts. Please try again later.', 429);
            }
        }

        if (!$hasDisplay && !$hasEmail && !$changePassword) {
            throw new ApiException('No fields to update', 400);
        }

        $displayname = $hasDisplay
            ? trim((string) $body['displayname'])
            : (string) ($row['displayname'] ?? $username);
        if ($hasDisplay && $displayname === '') {
            throw new ApiException('Display name is required', 400);
        }

        $email = $hasEmail
            ? trim((string) $body['email'])
            : (string) ($row['email'] ?? '');
        if ($hasEmail) {
            $this->assertEmail($email);
        }

        try {
            $this->pdo->beginTransaction();

            if ($hasDisplay || $hasEmail) {
                // Ensure principal row exists (legacy installs)
                $check = $this->pdo->prepare('SELECT id FROM principals WHERE uri = ? LIMIT 1');
                $check->execute([$principal]);
                if ($check->fetchColumn() === false) {
                    $ins = $this->pdo->prepare(
                        'INSERT INTO principals (uri, email, displayname) VALUES (?, ?, ?)'
                    );
                    $ins->execute([$principal, $email, $displayname]);
                } else {
                    $upd = $this->pdo->prepare(
                        'UPDATE principals SET email = ?, displayname = ? WHERE uri = ?'
                    );
                    $upd->execute([$email, $displayname, $principal]);
                }
            }

            if ($changePassword) {
                $digest = $this->digestFor($username, $password);
                $updU = $this->pdo->prepare('UPDATE users SET digesta1 = ? WHERE username = ?');
                $updU->execute([$digest, $username]);
            }

            $this->pdo->commit();
            if ($changePassword) {
                $this->registerUserPasswordChangeAttempt();
            }
        } catch (ApiException $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw new ApiException('Unable to update user', 500);
        }

        return $this->getUser($username);
    }

    /**
     * Delete a user and cascaded resources.
     *
     * Requires body/query confirm=true|1. File-home quarantine runs before the
     * SQL cascade so a principal cannot be reused against the old storage id.
     *
     * @return array{ok: true, username: string}
     */
    public function deleteUser(string $username, bool $confirm): array {
        if (!$confirm) {
            throw new ApiException('Confirmation required (confirm=true)', 400);
        }

        $row = $this->fetchUserRow($username);
        if ($row === null) {
            throw new ApiException('User not found', 404);
        }
        $username = (string) $row['username'];
        // Prevent locking out the sole remaining DAV account via admin API
        $count = (int) $this->pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
        if ($count <= 1) {
            throw new ApiException('Cannot delete the last remaining user account', 400);
        }
        // Prevent removing the last portal Admin (env list / YAML / default "admin")
        if (AdminAuth::userIsAdmin($username, $this->config) && $this->countAdminUsers() <= 1) {
            throw new ApiException('Cannot delete the last user with the portal Admin role. Grant Admin to another user first (PORTAL_ADMIN_USERS or system.portal_admin_users).', 400);
        }
        $userId = $this->userIdForUsername($username);

        $this->quarantineFileHome($userId, $username);
        $this->deleteUserViaPdo($username, $userId);

        return ['ok' => true, 'username' => $username];
    }

    private function quarantineFileHome(int $userId, string $username): void {
        if ($userId <= 0) {
            return;
        }
        $principal = 'principals/' . $username;
        try {
            if (!SchemaManager::exists($this->pdo)) {
                return;
            }
            $fileConfig = new FileStorageConfig($this->config);
            $fileConfig->prepareStorage();
            $homeRepository = new HomeRepository($this->pdo, $fileConfig);
            $homeRepository->quarantineUser($userId, $principal);
        } catch (\Throwable $e) {
            HomeRepository::revokeUserAccess($this->pdo, $userId);
            error_log('WebDAV file home access was revoked, but physical quarantine failed');
        }
    }

    /**
     * SQL cascade for calendars, address books, principals, and DAV metadata.
     */
    private function deleteUserViaPdo(string $username, int $userId): void {
        $principal = 'principals/' . $username;
        $calendarPath = 'calendars/' . $username;
        $addressBookPath = 'addressbooks/' . $username;
        $filePath = 'files/' . $username;

        try {
            $this->pdo->beginTransaction();

            // Calendar objects for this principal's owned calendars
            $calIds = $this->pdo->prepare(
                'SELECT calendarid FROM calendarinstances WHERE principaluri = ?'
            );
            $calIds->execute([$principal]);
            $ids = $calIds->fetchAll(\PDO::FETCH_COLUMN) ?: [];
            foreach ($ids as $cid) {
                $cid = (int) $cid;
                if ($cid <= 0) {
                    continue;
                }
                $this->pdo->prepare('DELETE FROM calendarobjects WHERE calendarid = ?')->execute([$cid]);
                $this->pdo->prepare('DELETE FROM calendarchanges WHERE calendarid = ?')->execute([$cid]);
            }
            $this->pdo->prepare('DELETE FROM calendarinstances WHERE principaluri = ?')->execute([$principal]);
            foreach ($ids as $cid) {
                $cid = (int) $cid;
                // Drop calendar row only if no other instances remain
                $left = $this->pdo->prepare('SELECT COUNT(*) FROM calendarinstances WHERE calendarid = ?');
                $left->execute([$cid]);
                if ((int) $left->fetchColumn() === 0) {
                    $this->pdo->prepare('DELETE FROM calendars WHERE id = ?')->execute([$cid]);
                }
            }

            $abIds = $this->pdo->prepare('SELECT id FROM addressbooks WHERE principaluri = ?');
            $abIds->execute([$principal]);
            foreach ($abIds->fetchAll(\PDO::FETCH_COLUMN) ?: [] as $abId) {
                $this->pdo->prepare('DELETE FROM cards WHERE addressbookid = ?')->execute([(int) $abId]);
                $this->pdo->prepare('DELETE FROM addressbookchanges WHERE addressbookid = ?')->execute([(int) $abId]);
            }
            $this->pdo->prepare('DELETE FROM addressbooks WHERE principaluri = ?')->execute([$principal]);

            // Optional tables (ignore if missing)
            $this->tryExec('DELETE FROM schedulingobjects WHERE principaluri = ?', [$principal]);
            $this->tryExec('DELETE FROM calendarsubscriptions WHERE principaluri = ?', [$principal]);

            $this->deleteDavPathPrefix('propertystorage', 'path', $calendarPath);
            $this->deleteDavPathPrefix('propertystorage', 'path', $addressBookPath);
            $this->deleteDavPathPrefix('propertystorage', 'path', $filePath);
            $this->deleteDavPathPrefix('propertystorage', 'path', $principal);
            $this->deleteDavPathPrefix('locks', 'uri', $filePath);

            $principalId = 0;
            try {
                $pid = $this->pdo->prepare('SELECT id FROM principals WHERE uri = ?');
                $pid->execute([$principal]);
                $principalId = (int) $pid->fetchColumn();
            } catch (\Throwable $e) {
                $principalId = 0;
            }
            if ($principalId > 0) {
                $this->tryExec(
                    'DELETE FROM groupmembers WHERE principal_id = ? OR member_id = ?',
                    [$principalId, $principalId]
                );
            }

            $this->pdo->prepare('DELETE FROM principals WHERE uri = ?')->execute([$principal]);
            $this->pdo->prepare('DELETE FROM users WHERE username = ?')->execute([$username]);

            // Best-effort file home revoke when schema exists
            if ($userId > 0) {
                $this->tryExec(
                    "UPDATE file_homes SET user_id = NULL, status = 'quarantined', quarantined_at = ? WHERE user_id = ?",
                    [time(), $userId]
                );
            }

            $this->pdo->commit();
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw new ApiException('Unable to delete user', 500);
        }
    }

    private function deleteDavPathPrefix(string $table, string $column, string $prefix): void {
        $like = str_replace(['=', '%', '_'], ['==', '=%', '=_'], $prefix) . '/%';
        $this->tryExec(
            'DELETE FROM ' . $table . ' WHERE ' . $column . ' = ? OR ' . $column . " LIKE ? ESCAPE '='",
            [$prefix, $like]
        );
    }

    /**
     * @param list<mixed> $params
     */
    private function tryExec(string $sql, array $params = []): void {
        try {
            $stmt = $this->pdo->prepare($sql);
            $stmt->execute($params);
        } catch (\Throwable $e) {
            // Table may not exist in minimal test DBs
        }
    }

    /**
     * Reject direct digesta1 / hash injection (password only via password fields).
     *
     * @param array<string, mixed> $body
     */
    private function assertNoSecretMassAssignment(array $body): void {
        foreach (['digesta1', 'password_hash', 'passwordhash', 'hash'] as $key) {
            if (array_key_exists($key, $body)) {
                throw new ApiException('Refusing to accept secret field "' . $key . '" in request body', 400);
            }
        }
    }

    private function assertUsernameFormat(string $username): void {
        if ($username === '') {
            throw new ApiException('Username is required', 400);
        }
        if (str_contains($username, '/') || str_contains($username, "\0") || str_contains($username, ' ')) {
            throw new ApiException('Invalid username', 400);
        }
        // Align with portal Auth logging charset (DAV-friendly)
        if (!preg_match('/^[\w.@+-]+$/u', $username)) {
            throw new ApiException('Username contains unsupported characters', 400);
        }
        if (strlen($username) > 255) {
            throw new ApiException('Username is too long', 400);
        }
    }

    private function assertEmail(string $email): void {
        if ($email === '') {
            throw new ApiException('Email is required', 400);
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            throw new ApiException('Email is not valid', 400);
        }
    }

    private function usernameExists(string $username): bool {
        $stmt = $this->pdo->prepare('SELECT 1 FROM users WHERE username = ? LIMIT 1');
        $stmt->execute([$username]);

        return (bool) $stmt->fetchColumn();
    }

    private function digestFor(string $username, string $password): string {
        $sys = is_array($this->config['system'] ?? null) ? $this->config['system'] : [];
        $realm = (string) ($sys['auth_realm'] ?? 'BaikalDAV');

        return md5($username . ':' . $realm . ':' . $password);
    }

    private function defaultCalendarComponents(): string {
        $sys = is_array($this->config['system'] ?? null) ? $this->config['system'] : [];
        $components = ['VEVENT'];
        $tasks = array_key_exists('tasks_enabled', $sys) ? (bool) $sys['tasks_enabled'] : true;
        $notes = array_key_exists('notes_enabled', $sys) ? (bool) $sys['notes_enabled'] : false;
        if ($tasks) {
            $components[] = 'VTODO';
        }
        if ($notes) {
            $components[] = 'VJOURNAL';
        }

        return implode(',', $components);
    }

    /** How many DAV users currently hold the portal Admin role. */
    private function countAdminUsers(): int {
        try {
            $stmt = $this->pdo->query('SELECT username FROM users');
        } catch (\Throwable $e) {
            return 0;
        }
        if ($stmt === false) {
            return 0;
        }
        $n = 0;
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $u = (string) ($row['username'] ?? '');
            if ($u !== '' && AdminAuth::userIsAdmin($u, $this->config)) {
                ++$n;
            }
        }

        return $n;
    }

    private function clientIp(): string {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

        return is_string($ip) && $ip !== '' ? $ip : '0.0.0.0';
    }

    private function userPasswordRatePath(): string {
        $dir = defined('PROJECT_PATH_SPECIFIC')
            ? PROJECT_PATH_SPECIFIC
            : (defined('PROJECT_PATH_ROOT') ? PROJECT_PATH_ROOT . 'Specific/' : sys_get_temp_dir() . '/');

        return rtrim($dir, '/') . '/portal_admin_user_password_rate.json';
    }

    /**
     * @return array<string, mixed>
     */
    private function loadUserPasswordRateData(): array {
        $path = $this->userPasswordRatePath();
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
    private function saveUserPasswordRateData(array $data): void {
        $path = $this->userPasswordRatePath();
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

    private function isUserPasswordChangeRateLimited(): bool {
        $ip = $this->clientIp();
        $data = $this->loadUserPasswordRateData();
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

    private function registerUserPasswordChangeAttempt(): void {
        $ip = $this->clientIp();
        $data = $this->loadUserPasswordRateData();
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
        $this->saveUserPasswordRateData($data);
    }

    /**
     * @return array<string, mixed>|null
     */
    private function fetchUserRow(string $username): ?array {
        $username = trim($username);
        if ($username === '' || str_contains($username, '/') || str_contains($username, "\0")) {
            throw new ApiException('Invalid username', 400);
        }

        $principal = 'principals/' . $username;
        $stmt = $this->pdo->prepare(
            'SELECT u.username,
                    COALESCE(p.displayname, u.username) AS displayname,
                    COALESCE(p.email, \'\') AS email,
                    COALESCE(p.uri, ?) AS principal
             FROM users u
             LEFT JOIN principals p ON p.uri = ?
             WHERE u.username = ?
             LIMIT 1'
        );
        $stmt->execute([$principal, $principal, $username]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if ($row) {
            return $row;
        }

        $stmt = $this->pdo->prepare(
            'SELECT u.username,
                    COALESCE(p.displayname, u.username) AS displayname,
                    COALESCE(p.email, \'\') AS email,
                    COALESCE(p.uri, \'principals/\' || u.username) AS principal
             FROM users u
             LEFT JOIN principals p ON p.uri = \'principals/\' || u.username
             WHERE LOWER(u.username) = LOWER(?)
             LIMIT 1'
        );
        $stmt->execute([$username]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    private function userIdForUsername(string $username): int {
        $stmt = $this->pdo->prepare('SELECT id FROM users WHERE username = ? LIMIT 1');
        $stmt->execute([$username]);
        $id = $stmt->fetchColumn();

        return $id !== false ? (int) $id : 0;
    }

    /**
     * @param array<string, mixed> $row
     *
     * @return array{username: string, displayname: string, email: string, principal: string}
     */
    private function mapListRow(array $row): array {
        $username = (string) ($row['username'] ?? '');
        $principal = (string) ($row['principal'] ?? '');
        if ($principal === '' && $username !== '') {
            $principal = 'principals/' . $username;
        }

        return [
            'username'    => $username,
            'displayname' => (string) ($row['displayname'] ?? $username),
            'email'       => (string) ($row['email'] ?? ''),
            'principal'   => $principal,
        ];
    }

    /**
     * @param list<mixed> $params
     */
    private function countWhere(string $table, string $where, array $params): int {
        $allowed = [
            'calendarinstances' => true,
            'addressbooks'      => true,
        ];
        if (!isset($allowed[$table])) {
            return 0;
        }
        try {
            $stmt = $this->pdo->prepare('SELECT COUNT(*) FROM ' . $table . ' WHERE ' . $where);
            $stmt->execute($params);

            return (int) $stmt->fetchColumn();
        } catch (\Throwable $e) {
            return 0;
        }
    }

    private function countContactsForPrincipal(string $principalUri): int {
        try {
            $stmt = $this->pdo->prepare(
                'SELECT COUNT(*) FROM cards c
                 INNER JOIN addressbooks a ON a.id = c.addressbookid
                 WHERE a.principaluri = ?'
            );
            $stmt->execute([$principalUri]);

            return (int) $stmt->fetchColumn();
        } catch (\Throwable $e) {
            return 0;
        }
    }

    private function countEventsForPrincipal(string $principalUri): int {
        try {
            $stmt = $this->pdo->prepare(
                'SELECT COUNT(*) FROM calendarobjects o
                 INNER JOIN calendarinstances i ON i.calendarid = o.calendarid
                 WHERE i.principaluri = ? AND (i.access = 1 OR i.access IS NULL)'
            );
            $stmt->execute([$principalUri]);

            return (int) $stmt->fetchColumn();
        } catch (\Throwable $e) {
            return 0;
        }
    }

    private function driverName(): string {
        try {
            return (string) $this->pdo->getAttribute(\PDO::ATTR_DRIVER_NAME);
        } catch (\Throwable $e) {
            return '';
        }
    }
}
