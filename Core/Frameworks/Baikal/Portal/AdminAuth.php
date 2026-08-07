<?php

namespace Baikal\Portal;

/**
 * Portal Admin role checks for /api/admin/* and profile enrichment.
 *
 * Who is Admin (first match wins):
 *   1. Env PORTAL_ADMIN_USERS or BAIKAL_PORTAL_ADMIN_USERS (comma/space list)
 *   2. YAML system.portal_admin_users (list or comma-separated string)
 *   3. If neither is set: DAV user named "admin" (case-insensitive)
 *
 * Authorization must always run server-side; UI hiding is not enough.
 */
class AdminAuth {
    /** @var Auth */
    private $auth;

    /** @var array<string, mixed> */
    private $config;

    /**
     * @param array<string, mixed> $config Full baikal.yaml array (or test fixture)
     */
    public function __construct(Auth $auth, array $config) {
        $this->auth = $auth;
        $this->config = $config;
    }

    /**
     * Whether a DAV username has the portal Admin role.
     */
    public function isAdmin(string $username): bool {
        return self::userIsAdmin($username, $this->config);
    }

    /**
     * Pure helper for tests and call sites without an Auth instance.
     *
     * @param array<string, mixed> $config Full baikal.yaml array (or test fixture)
     */
    public static function userIsAdmin(string $username, array $config): bool {
        if ($username === '') {
            return false;
        }

        $sys = is_array($config['system'] ?? null) ? $config['system'] : [];
        $raw = getenv('PORTAL_ADMIN_USERS');
        if ($raw === false || $raw === '') {
            $raw = getenv('BAIKAL_PORTAL_ADMIN_USERS');
        }
        if ($raw === false || $raw === '') {
            $raw = $sys['portal_admin_users'] ?? null;
        }

        $users = [];
        if (is_array($raw)) {
            foreach ($raw as $u) {
                if (is_string($u) || is_numeric($u)) {
                    $users[] = (string) $u;
                }
            }
        } elseif (is_string($raw) && trim($raw) !== '') {
            $parts = preg_split('/[\s,]+/', $raw) ?: [];
            foreach ($parts as $u) {
                if ($u !== '') {
                    $users[] = $u;
                }
            }
        }

        if ($users === []) {
            // Zero-config default: DAV user named "admin" has the Admin role
            return strcasecmp($username, 'admin') === 0;
        }

        foreach ($users as $u) {
            if ($u !== '' && strcasecmp($u, $username) === 0) {
                return true;
            }
        }

        return false;
    }

    /**
     * Require an authenticated portal user with Admin role.
     *
     * @return string Username of the admin
     *
     * @throws ApiException 401 if not logged in, 403 if not admin
     */
    public function requireAdmin(): string {
        $username = $this->auth->requireUser();
        if (!$this->isAdmin($username)) {
            throw new ApiException('Admin role required', 403);
        }

        return $username;
    }
}
