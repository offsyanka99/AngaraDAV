<?php

namespace Baikal\Portal;

use Baikal\Core\Plugins\Push\ChangeNotifier;
use Sabre\CalDAV\Backend\PDO as CaldavBackend;
use Sabre\DAV\Sharing\Plugin as SharingPlugin;
use Sabre\DAV\UUIDUtil;

/**
 * Shared CalDAV backend access, ACL checks, and URI helpers for portal calendar services.
 */
class CalendarStore {
    private \PDO $pdo;
    private CaldavBackend $backend;
    private PortalMeta $meta;

    public function __construct(\PDO $pdo, ?PortalMeta $meta = null) {
        $this->pdo = $pdo;
        $this->backend = new CaldavBackend($pdo);
        $this->meta = $meta ?? new PortalMeta();
    }

    public function pdo(): \PDO {
        return $this->pdo;
    }

    public function backend(): CaldavBackend {
        return $this->backend;
    }

    public function meta(): PortalMeta {
        return $this->meta;
    }

    public function normalizeObjectUri(string $uri): string {
        $uri = rawurldecode(trim($uri));
        $uri = ltrim($uri, '/');
        if ($uri === '' || str_contains($uri, '..') || str_contains($uri, '/')) {
            throw new ApiException('Invalid object URI', 400);
        }

        return $uri;
    }

    /**
     * @param mixed $data
     */
    public function calendardataToString($data): string {
        if (is_resource($data)) {
            $s = stream_get_contents($data);

            return is_string($s) ? $s : '';
        }

        return is_string($data) ? $data : '';
    }

    /**
     * @return array{0: int, 1: int}
     */
    public function requireOwnedCalendarId(string $username, int $instanceId): array {
        $row = $this->loadInstance($username, $instanceId);
        $access = (int) $row['access'];
        if ($access !== SharingPlugin::ACCESS_SHAREDOWNER && $access !== SharingPlugin::ACCESS_NOTSHARED) {
            throw new ApiException('Only the calendar owner can manage shares', 403);
        }

        return [(int) $row['calendarid'], (int) $row['id']];
    }

    /**
     * @return array{0: int, 1: int} [calendarId, instanceId]
     */
    public function requireCalendarAccess(string $username, int $instanceId, bool $write): array {
        $row = $this->loadInstance($username, $instanceId);
        $access = (int) $row['access'];
        $isOwner = $access === SharingPlugin::ACCESS_SHAREDOWNER
            || $access === SharingPlugin::ACCESS_NOTSHARED;
        $canWrite = $isOwner || $access === SharingPlugin::ACCESS_READWRITE;
        $canRead = $canWrite || $access === SharingPlugin::ACCESS_READ;

        if ($write && !$canWrite) {
            throw new ApiException('You do not have write access to this calendar', 403);
        }
        if (!$write && !$canRead) {
            throw new ApiException('You do not have access to this calendar', 403);
        }

        return [(int) $row['calendarid'], (int) $row['id']];
    }

    /**
     * @return array<string, mixed>
     */
    public function loadInstance(string $username, int $instanceId): array {
        $principal = 'principals/' . $username;
        $stmt = $this->pdo->prepare(
            'SELECT id, calendarid, access, principaluri, displayname, description, calendarcolor, uri
             FROM calendarinstances
             WHERE id = ? AND principaluri = ?'
        );
        $stmt->execute([$instanceId, $principal]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$row) {
            throw new ApiException('Calendar not found', 404);
        }

        return $row;
    }

    /**
     * @return array{displayname: string, color: string, uri: string}
     */
    public function getCalendarMeta(string $username, int $instanceId): array {
        $row = $this->loadInstance($username, $instanceId);

        return [
            'displayname' => (string) ($row['displayname'] ?: $row['uri'] ?: 'Calendar'),
            'color'       => (string) ($row['calendarcolor'] ?? ''),
            'uri'         => (string) ($row['uri'] ?? ''),
        ];
    }

    public function objectUriFromUid(string $uid): string {
        $safe = preg_replace('/[^A-Za-z0-9_.@-]+/', '-', $uid) ?? '';
        $safe = trim($safe, '-.');
        if ($safe === '') {
            $safe = UUIDUtil::getUUID();
        }
        if (strlen($safe) > 180) {
            $safe = substr($safe, 0, 180);
        }

        return $safe . '.ics';
    }

    /**
     * Enqueue WebDAV-Push for portal calendar mutations (bypasses SabreDAV hooks).
     *
     * @param array{0: int, 1: int} $calId
     */
    public function notifyCalendarPush(string $username, int $instanceId, array $calId): void {
        try {
            $meta = $this->getCalendarMeta($username, $instanceId);
            $uri = (string) ($meta['uri'] ?? '');
            if ($uri === '') {
                return;
            }
            ChangeNotifier::calendarContent($this->pdo, $username, $uri, $calId);
        } catch (\Throwable $e) {
            // Never break portal CRUD if Push notify fails.
            error_log('portal calendar push notify failed: ' . $e->getMessage());
        }
    }

    /**
     * @return array{username: string, principal: string, href: string, displayname: string, email: string}
     */
    public function resolveUser(string $username): array {
        $principal = 'principals/' . $username;
        $stmt = $this->pdo->prepare(
            'SELECT u.username, p.uri, p.email, p.displayname
             FROM users u
             LEFT JOIN principals p ON p.uri = ?
             WHERE u.username = ?'
        );
        $stmt->execute([$principal, $username]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$row) {
            throw new ApiException('User not found: ' . $username, 404);
        }
        $email = trim((string) ($row['email'] ?? ''));
        $displayname = (string) ($row['displayname'] ?: $username);

        // sabre/dav keys sharees by share_href. If two users share the same principal
        // email (or both use a placeholder like no@thank.you), the second Share call
        // UPDATES the first row instead of inserting — only one share remains.
        // Prefer a real unique email; otherwise use a username-scoped mailto href.
        $href = $this->uniqueShareHref($username, $email);

        return [
            'username'    => (string) $row['username'],
            'principal'   => $principal,
            'href'        => $href,
            'displayname' => $displayname,
            'email'       => $email !== '' ? $email : $username . '@local',
        ];
    }

    /**
     * Build a share_href that is unique per username (CalDAV mailto: style).
     *
     * Always username-scoped — never key shares by principal email alone.
     * Multiple users often share a placeholder email (e.g. no@thank.you); sabre
     * matches sharees by href, so colliding mailto: addresses made the second
     * Share overwrite the first.
     */
    public function uniqueShareHref(string $username, string $email): string {
        unset($email); // email is for display only; must not define share identity
        $safe = preg_replace('/[^a-zA-Z0-9._+-]+/', '-', $username) ?? 'user';
        $safe = trim($safe, '-') ?: 'user';

        return 'mailto:' . $safe . '@users.local';
    }

    public function parseAccess(string $access): int {
        $a = strtolower(trim($access));
        if ($a === 'read' || $a === 'readonly' || $a === 'read-only' || $a === '2') {
            return SharingPlugin::ACCESS_READ;
        }
        if ($a === 'readwrite' || $a === 'read-write' || $a === 'full' || $a === '3') {
            return SharingPlugin::ACCESS_READWRITE;
        }
        throw new ApiException('access must be "read" or "readwrite"', 400);
    }

    public function accessLabel(int $code): string {
        switch ($code) {
            case SharingPlugin::ACCESS_READ:
                return 'read';
            case SharingPlugin::ACCESS_READWRITE:
                return 'readwrite';
            case SharingPlugin::ACCESS_SHAREDOWNER:
                return 'owner';
            case SharingPlugin::ACCESS_NOTSHARED:
                return 'owner';
            default:
                return 'unknown';
        }
    }

    public function usernameFromPrincipal(string $principal): string {
        if (strpos($principal, 'principals/') === 0) {
            return substr($principal, strlen('principals/'));
        }

        return $principal;
    }

    /**
     * Normalize Apple-style calendar color (#RGB / #RRGGBB / #RRGGBBAA) or empty to clear.
     */
    public function normalizeColor(string $color): string {
        $color = trim($color);
        if ($color === '') {
            return '';
        }
        if ($color[0] !== '#') {
            $color = '#' . $color;
        }
        if (!preg_match('/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/', $color)) {
            throw new ApiException('Color must be #RGB, #RRGGBB, or #RRGGBBAA', 400);
        }

        // Expand #RGB → #RRGGBB for clients
        if (strlen($color) === 4) {
            $color = '#' . $color[1] . $color[1] . $color[2] . $color[2] . $color[3] . $color[3];
        }

        return strtoupper($color);
    }

    public function uniqueCalendarUri(string $username, string $displayname): string {
        $base = strtolower($displayname);
        $base = preg_replace('/[^a-z0-9]+/', '-', $base) ?? 'calendar';
        $base = trim($base, '-');
        if ($base === '') {
            $base = 'calendar';
        }
        $base = substr($base, 0, 40);
        $uri = $base;
        $principal = 'principals/' . $username;
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM calendarinstances WHERE principaluri = ? AND uri = ? LIMIT 1'
        );
        $n = 0;
        while (true) {
            $stmt->execute([$principal, $uri]);
            if (!$stmt->fetchColumn()) {
                return $uri;
            }
            ++$n;
            $uri = $base . '-' . ($n > 3 ? UUIDUtil::getUUID() : (string) $n);
            if ($n > 20) {
                return $base . '-' . UUIDUtil::getUUID();
            }
        }
    }
}
