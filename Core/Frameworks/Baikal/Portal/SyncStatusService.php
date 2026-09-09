<?php

namespace Baikal\Portal;

use Sabre\DAV\Sharing\Plugin as SharingPlugin;

/**
 * Cheap collection-revision snapshot for the portal background-sync poller.
 */
class SyncStatusService {
    public const DEFAULT_POLL_SECONDS = 30;
    public const MIN_POLL_SECONDS = 10;
    public const MAX_POLL_SECONDS = 300;

    /**
     * @param array<string, mixed> $config Full baikal.yaml document
     */
    public function __construct(
        private \PDO $pdo,
        private FileService $files,
        private array $config,
    ) {
    }

    /**
     * Clamp system.portal_sync_poll_seconds (default 30, bounds 10–300).
     *
     * @param array<string, mixed> $config Full baikal.yaml document
     */
    public static function pollSecondsFromConfig(array $config): int {
        $sys = is_array($config['system'] ?? null) ? $config['system'] : [];

        return self::clampPollSeconds($sys['portal_sync_poll_seconds'] ?? self::DEFAULT_POLL_SECONDS);
    }

    /**
     * @param mixed $value
     */
    public static function clampPollSeconds($value): int {
        if (!is_numeric($value)) {
            return self::DEFAULT_POLL_SECONDS;
        }

        return max(self::MIN_POLL_SECONDS, min(self::MAX_POLL_SECONDS, (int) $value));
    }

    /**
     * @return array{
     *   pollSeconds: int,
     *   calendars: list<array{instanceId: int, calendarId: int, synctoken: int, components: string}>,
     *   addressBooks: list<array{id: int, synctoken: int}>,
     *   files: array{enabled: bool, ready: bool, path: string, fingerprint: string|null, missing: bool, capped?: bool}
     * }
     */
    public function get(string $username, bool $includeFiles, string $path = ''): array {
        return [
            'pollSeconds'  => self::pollSecondsFromConfig($this->config),
            'calendars'    => $this->listCalendarRevisions($username),
            'addressBooks' => $this->listAddressBookRevisions($username),
            'files'        => $this->filesPayload($username, $includeFiles, $path),
        ];
    }

    /**
     * @return list<array{instanceId: int, calendarId: int, synctoken: int, components: string}>
     */
    private function listCalendarRevisions(string $username): array {
        $principal = 'principals/' . $username;
        $stmt = $this->pdo->prepare(
            'SELECT ci.id AS instance_id, ci.calendarid AS calendar_id, c.synctoken, c.components
             FROM calendarinstances ci
             INNER JOIN calendars c ON c.id = ci.calendarid
             WHERE ci.principaluri = ?
               AND ci.access IN (?, ?, ?, ?)
             ORDER BY ci.id'
        );
        $stmt->execute([
            $principal,
            SharingPlugin::ACCESS_NOTSHARED,
            SharingPlugin::ACCESS_SHAREDOWNER,
            SharingPlugin::ACCESS_READ,
            SharingPlugin::ACCESS_READWRITE,
        ]);
        $out = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $out[] = [
                'instanceId' => (int) $row['instance_id'],
                'calendarId' => (int) $row['calendar_id'],
                'synctoken'  => (int) ($row['synctoken'] ?? 0),
                'components' => (string) ($row['components'] ?? ''),
            ];
        }

        return $out;
    }

    /**
     * @return list<array{id: int, synctoken: int}>
     */
    private function listAddressBookRevisions(string $username): array {
        $principal = 'principals/' . $username;
        $stmt = $this->pdo->prepare(
            'SELECT id, synctoken FROM addressbooks WHERE principaluri = ? ORDER BY id'
        );
        $stmt->execute([$principal]);
        $out = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            $out[] = [
                'id'        => (int) $row['id'],
                'synctoken' => (int) ($row['synctoken'] ?? 0),
            ];
        }

        return $out;
    }

    /**
     * @return array{enabled: bool, ready: bool, path: string, fingerprint: string|null, missing: bool, capped?: bool}
     */
    private function filesPayload(string $username, bool $includeFiles, string $path): array {
        $status = $this->files->status($username);
        $enabled = !empty($status['enabled']);
        $ready = !empty($status['ready']);
        $empty = [
            'enabled'     => $enabled,
            'ready'       => $ready,
            'path'        => '',
            'fingerprint' => null,
            'missing'     => false,
        ];
        if (!$includeFiles) {
            return $empty;
        }
        if (!$enabled || !$ready) {
            return $empty;
        }

        try {
            $fp = $this->files->directoryFingerprint($username, $path);
        } catch (ApiException $e) {
            if ($e->getStatus() === 400) {
                throw $e;
            }

            return [
                'enabled'     => true,
                'ready'       => true,
                'path'        => $path,
                'fingerprint' => null,
                'missing'     => true,
            ];
        } catch (\Throwable $e) {
            return [
                'enabled'     => true,
                'ready'       => true,
                'path'        => $path,
                'fingerprint' => null,
                'missing'     => true,
            ];
        }

        $out = [
            'enabled'     => true,
            'ready'       => true,
            'path'        => (string) $fp['path'],
            'fingerprint' => $fp['fingerprint'],
            'missing'     => !empty($fp['missing']),
        ];
        if (!empty($fp['capped'])) {
            $out['capped'] = true;
        }

        return $out;
    }
}
