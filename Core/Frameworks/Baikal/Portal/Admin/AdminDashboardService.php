<?php

namespace Baikal\Portal\Admin;

/**
 * Read-only dashboard stats for the portal Administration Overview.
 *
 * Dashboard metrics for portal Administration Overview.
 * Uses PDO counts against the same tables as Baikal\Model\* (no Formal).
 */
class AdminDashboardService {
    /** @var \PDO */
    private $pdo;

    /** @var array<string, mixed> */
    private $config;

    /**
     * @param array<string, mixed> $config Full configuration.yaml array (or test fixture)
     */
    public function __construct(\PDO $pdo, array $config) {
        $this->pdo = $pdo;
        $this->config = $config;
    }

    /**
     * Snapshot of system stats and service flags.
     *
     * Field names align with classic BaikalAdmin\Controller\Dashboard /
     * Dashboard.html (nbusers, nbcalendars, …) plus portal-friendly aliases.
     *
     * @return array{
     *   version: string,
     *   git: string,
     *   users: int,
     *   calendars: int,
     *   events: int,
     *   addressBooks: int,
     *   contacts: int,
     *   nbusers: int,
     *   nbcalendars: int,
     *   nbevents: int,
     *   nbbooks: int,
     *   nbcontacts: int,
     *   services: array{
     *     administration: bool,
     *     webAdmin: bool,
     *     caldav: bool,
     *     carddav: bool,
     *     files: bool,
     *     tasks: bool,
     *     notes: bool,
     *     push: bool,
     *     filesPush: bool
     *   },
     *   pushStats: array{
     *     subscriptions: array{calendars: int, addressbooks: int, files: int, principals: int},
     *     queue: array{jobs: int, oldestAgeSeconds: int}
     *   },
     *   links: array{docs: string, releases: string, administration: string}
     * }
     */
    public function stats(): array {
        $sys = is_array($this->config['system'] ?? null) ? $this->config['system'] : [];

        $users = $this->countTable('users');
        // Calendar *instances* (same basis as historical Baikal dashboard)
        $calendars = $this->countTable('calendarinstances');
        $events = $this->countTable('calendarobjects');
        $books = $this->countTable('addressbooks');
        $contacts = $this->countTable('cards');

        return [
            'version'      => defined('ANGARA_VERSION') ? (string) ANGARA_VERSION : '',
            'git'          => defined('ANGARA_GIT_SHA') ? (string) ANGARA_GIT_SHA : '',
            'users'        => $users,
            'calendars'    => $calendars,
            'events'       => $events,
            'addressBooks' => $books,
            'contacts'     => $contacts,
            // Compact aliases used by the portal Overview cards
            'nbusers'      => $users,
            'nbcalendars'  => $calendars,
            'nbevents'     => $events,
            'nbbooks'      => $books,
            'nbcontacts'   => $contacts,
            'services'     => [
                // Portal Administration surface is available when the API can answer
                'administration' => true,
                // Legacy alias kept for older SPA builds
                'webAdmin'       => true,
                'caldav'         => self::boolFlag($sys, 'cal_enabled', true),
                'carddav'        => self::boolFlag($sys, 'card_enabled', true),
                'files'          => self::boolFlag($sys, 'files_enabled', false),
                'tasks'          => self::boolFlag($sys, 'tasks_enabled', true),
                'notes'          => self::boolFlag($sys, 'notes_enabled', false),
                'push'           => self::boolFlag($sys, 'push_enabled', false),
                // Effective only with Push and file storage both on
                'filesPush'      => self::boolFlag($sys, 'push_enabled', false)
                    && self::boolFlag($sys, 'files_enabled', false)
                    && self::boolFlag($sys, 'push_files_enabled', false),
            ],
            'pushStats'    => $this->pushStats(),
            'links'        => [
                'docs'           => 'https://github.com/offsyanka99/AngaraDAV/tree/main/docs',
                'releases'       => 'https://github.com/offsyanka99/AngaraDAV/releases',
                'administration' => '/portal/#admin',
            ],
        ];
    }

    private function countTable(string $table): int {
        // Table names are fixed constants from Baikal models — never user input
        $allowed = [
            'users'              => true,
            'calendarinstances'  => true,
            'calendarobjects'    => true,
            'addressbooks'       => true,
            'cards'              => true,
        ];
        if (!isset($allowed[$table])) {
            return 0;
        }
        try {
            $n = $this->pdo->query('SELECT COUNT(*) FROM ' . $table)->fetchColumn();

            return (int) $n;
        } catch (\Throwable $e) {
            return 0;
        }
    }

    /**
     * Aggregate WebDAV-Push counts only (no usernames or paths); zeros when the push tables do not exist.
     *
     * @return array{
     *   subscriptions: array{calendars: int, addressbooks: int, files: int, principals: int},
     *   queue: array{jobs: int, oldestAgeSeconds: int}
     * }
     */
    private function pushStats(): array {
        $subscriptions = ['calendars' => 0, 'addressbooks' => 0, 'files' => 0, 'principals' => 0];
        $queue = ['jobs' => 0, 'oldestAgeSeconds' => 0];
        $now = time();
        try {
            $stmt = $this->pdo->prepare(
                "SELECT CASE
                    WHEN resource_uri LIKE 'calendars/%' THEN 'calendars'
                    WHEN resource_uri LIKE 'addressbooks/%' THEN 'addressbooks'
                    WHEN resource_uri LIKE 'files/%' THEN 'files'
                    WHEN resource_uri LIKE 'principals/%' THEN 'principals'
                    ELSE 'other' END AS kind, COUNT(*) AS n
                 FROM push_subscriptions WHERE expires > ? GROUP BY kind"
            );
            $stmt->execute([$now]);
            foreach ($stmt->fetchAll(\PDO::FETCH_ASSOC) as $row) {
                $kind = (string) $row['kind'];
                if (isset($subscriptions[$kind])) {
                    $subscriptions[$kind] = (int) $row['n'];
                }
            }
        } catch (\Throwable $e) {
            // Push never enabled: no subscriptions table yet.
        }
        try {
            $row = $this->pdo->query('SELECT COUNT(*) AS jobs, MIN(created) AS oldest FROM push_queue')
                ->fetch(\PDO::FETCH_ASSOC);
            if (is_array($row)) {
                $queue['jobs'] = (int) $row['jobs'];
                $queue['oldestAgeSeconds'] = $row['oldest'] === null ? 0 : max(0, $now - (int) $row['oldest']);
            }
        } catch (\Throwable $e) {
            // Push never enabled: no queue table yet.
        }

        return ['subscriptions' => $subscriptions, 'queue' => $queue];
    }

    /**
     * @param array<string, mixed> $sys
     */
    private static function boolFlag(array $sys, string $key, bool $default): bool {
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
}
