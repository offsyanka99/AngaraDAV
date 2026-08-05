<?php

namespace Baikal\Portal\Admin;

/**
 * Read-only dashboard stats for the portal Administration Overview.
 *
 * Mirrors classic BaikalAdmin\Controller\Dashboard metrics without HTML/Twig.
 * Uses PDO counts against the same tables as Baikal\Model\* (no Formal).
 */
class AdminDashboardService {
    /** @var \PDO */
    private $pdo;

    /** @var array<string, mixed> */
    private $config;

    /**
     * @param array<string, mixed> $config Full baikal.yaml array (or test fixture)
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
     *     webAdmin: bool,
     *     caldav: bool,
     *     carddav: bool,
     *     files: bool,
     *     tasks: bool,
     *     notes: bool,
     *     push: bool
     *   },
     *   links: array{docs: string, releases: string, classicDashboard: string}
     * }
     */
    public function stats(): array {
        $sys = is_array($this->config['system'] ?? null) ? $this->config['system'] : [];

        $users = $this->countTable('users');
        // Classic dashboard counts calendar *instances* via Baikal\Model\Calendar (DATATABLE calendarinstances)
        $calendars = $this->countTable('calendarinstances');
        $events = $this->countTable('calendarobjects');
        $books = $this->countTable('addressbooks');
        $contacts = $this->countTable('cards');

        return [
            'version'      => defined('BAIKAL_VERSION') ? (string) BAIKAL_VERSION : '',
            'git'          => defined('BAIKAL_GIT_SHA') ? (string) BAIKAL_GIT_SHA : '',
            'users'        => $users,
            'calendars'    => $calendars,
            'events'       => $events,
            'addressBooks' => $books,
            'contacts'     => $contacts,
            // Classic template aliases (side-by-side QA with /admin/ dashboard)
            'nbusers'      => $users,
            'nbcalendars'  => $calendars,
            'nbevents'     => $events,
            'nbbooks'      => $books,
            'nbcontacts'   => $contacts,
            'services'     => [
                // Classic dashboard always shows Web admin as On when you can see it
                'webAdmin' => true,
                'caldav'   => self::boolFlag($sys, 'cal_enabled', true),
                'carddav'  => self::boolFlag($sys, 'card_enabled', true),
                'files'    => self::boolFlag($sys, 'files_enabled', false),
                'tasks'    => self::boolFlag($sys, 'tasks_enabled', true),
                'notes'    => self::boolFlag($sys, 'notes_enabled', false),
                'push'     => self::boolFlag($sys, 'push_enabled', false),
            ],
            'links'        => [
                'docs'             => 'https://github.com/offsyanka99/AngaraDAV/tree/main/docs',
                'releases'         => 'https://github.com/offsyanka99/AngaraDAV/releases',
                'classicDashboard' => '/admin/',
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
