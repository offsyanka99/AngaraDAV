<?php

namespace Baikal\Portal;

use Sabre\DAV\Sharing\Plugin as SharingPlugin;
use Sabre\DAV\Xml\Element\Sharee;

/**
 * Calendar sharing and user directory for the portal share picker.
 */
class ShareService {
    public function __construct(
        private CalendarStore $store,
    ) {
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listShares(string $username, int $instanceId): array {
        $calId = $this->store->requireOwnedCalendarId($username, $instanceId);
        $invites = $this->store->backend()->getInvites($calId);
        $out = [];

        foreach ($invites as $sharee) {
            $access = (int) $sharee->access;
            // Skip the owner row
            if ($access === SharingPlugin::ACCESS_SHAREDOWNER || $access === SharingPlugin::ACCESS_NOTSHARED) {
                continue;
            }
            $principal = (string) ($sharee->principal ?? '');
            $shareUsername = $this->store->usernameFromPrincipal($principal);
            $out[] = [
                'href'        => (string) $sharee->href,
                'principal'   => $principal,
                'username'    => $shareUsername,
                'displayname' => (string) ($sharee->properties['{DAV:}displayname'] ?? $shareUsername),
                'access'      => $this->store->accessLabel($access),
                'accessCode'  => $access,
                'status'      => (int) ($sharee->inviteStatus ?? 0),
            ];
        }

        return $out;
    }

    public function addOrUpdateShare(string $ownerUsername, int $instanceId, string $shareUsername, string $access): array {
        $shareUsername = trim($shareUsername);
        if ($shareUsername === '') {
            throw new ApiException('Share target username is required', 400);
        }
        if (strcasecmp($shareUsername, $ownerUsername) === 0) {
            throw new ApiException('You cannot share a calendar with yourself', 400);
        }

        $accessCode = $this->store->parseAccess($access);
        // Portal "read-only for everyone" forces sharees to read-only access
        if ($this->store->meta()->isReadOnly($instanceId)) {
            $accessCode = SharingPlugin::ACCESS_READ;
        }
        $target = $this->store->resolveUser($shareUsername);
        $calId = $this->store->requireOwnedCalendarId($ownerUsername, $instanceId);

        $sharee = new Sharee([
            'href'          => $target['href'],
            'principal'     => $target['principal'],
            'access'        => $accessCode,
            'inviteStatus'  => SharingPlugin::INVITE_ACCEPTED,
            'properties'    => [
                '{DAV:}displayname' => $target['displayname'],
            ],
        ]);

        $this->store->backend()->updateInvites($calId, [$sharee]);

        return [
            'href'        => $target['href'],
            'username'    => $target['username'],
            'displayname' => $target['displayname'],
            'access'      => $this->store->accessLabel($accessCode),
            'accessCode'  => $accessCode,
        ];
    }

    public function revokeShare(string $ownerUsername, int $instanceId, string $href): void {
        $href = trim($href);
        if ($href === '') {
            throw new ApiException('Share href is required', 400);
        }
        $calId = $this->store->requireOwnedCalendarId($ownerUsername, $instanceId);

        $sharee = new Sharee([
            'href'   => $href,
            'access' => SharingPlugin::ACCESS_NOACCESS,
        ]);
        $this->store->backend()->updateInvites($calId, [$sharee]);
    }

    /**
     * Directory of other AngaraDAV users for the share picker.
     *
     * @return list<array<string, string>>
     */
    public function directory(string $currentUsername): array {
        $driver = (string) $this->store->pdo()->getAttribute(\PDO::ATTR_DRIVER_NAME);
        if ($driver === 'sqlite') {
            $sql = "SELECT p.uri, p.displayname, p.email
                    FROM principals p
                    INNER JOIN users u ON p.uri = 'principals/' || u.username
                    ORDER BY lower(coalesce(nullif(p.displayname, ''), u.username)), p.uri";
        } else {
            // PostgreSQL
            $sql = "SELECT p.uri, p.displayname, p.email
                    FROM principals p
                    INNER JOIN users u ON p.uri = CONCAT('principals/', u.username)
                    ORDER BY LOWER(COALESCE(NULLIF(p.displayname, ''), u.username)), p.uri";
        }
        $stmt = $this->store->pdo()->query($sql);

        $out = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $username = $this->store->usernameFromPrincipal((string) $row['uri']);
            if ($username === '' || strcasecmp($username, $currentUsername) === 0) {
                continue;
            }
            $out[] = [
                'username'    => $username,
                'displayname' => (string) ($row['displayname'] ?: $username),
                // Email omitted from directory for privacy (username is enough to share)
            ];
        }

        return $out;
    }
}
