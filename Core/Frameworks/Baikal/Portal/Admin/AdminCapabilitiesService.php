<?php

namespace Baikal\Portal\Admin;

/**
 * Capability map for the portal Administration UI (feature gating).
 *
 * Status values (parity matrix language):
 *   full        — portal feature complete
 *   read-only   — portal read path available
 *   coming-soon — shell visible; use classic admin for the real work
 *   deferred    — intentionally classic-only for now
 *
 * Optional YAML: system.portal_admin_ui_enabled (default true) hides the
 * in-portal Administration section when false; /api/admin/* routes remain.
 */
class AdminCapabilitiesService {
    /** @var array<string, mixed> */
    private $config;

    /**
     * @param array<string, mixed> $config Full baikal.yaml array (or test fixture)
     */
    public function __construct(array $config) {
        $this->config = $config;
    }

    /**
     * @return array{
     *   uiEnabled: bool,
     *   classicAdminUrl: string,
     *   pages: list<array{
     *     id: string,
     *     label: string,
     *     status: string,
     *     available: bool,
     *     classicUrl: string,
     *     classicLabel: string,
     *     summary: string
     *   }>
     * }
     */
    public function capabilities(): array {
        $sys = is_array($this->config['system'] ?? null) ? $this->config['system'] : [];
        $uiEnabled = self::boolFlag($sys, 'portal_admin_ui_enabled', true);

        // Living matrix — flip status/available as portal admin phases ship.
        // Keep classicUrl always set so the UI never dead-ends.
        $pages = [
            [
                'id'           => 'overview',
                'label'        => 'Overview',
                'status'       => 'read-only',
                'available'    => true,
                'classicUrl'   => '/admin/',
                'classicLabel' => 'Open classic Dashboard',
                'summary'      => 'Live counts and service flags from the portal session.',
            ],
            [
                'id'           => 'users',
                'label'        => 'Users',
                'status'       => 'full',
                'available'    => true,
                'classicUrl'   => '/admin/?/users',
                'classicLabel' => 'Open classic Users',
                'summary'      => 'Full DAV user CRUD plus per-user calendars and address books.',
            ],
            [
                'id'           => 'settings',
                'label'        => 'System settings',
                'status'       => 'full',
                'available'    => true,
                'classicUrl'   => '/admin/?/settings/standard',
                'classicLabel' => 'Open classic System Settings',
                'summary'      => 'Edit system flags and admin password; writes baikal.yaml atomically.',
            ],
            [
                'id'           => 'database',
                'label'        => 'Database',
                'status'       => 'read-only',
                'available'    => true,
                'classicUrl'   => '/admin/?/settings/database',
                'classicLabel' => 'Open classic Database settings',
                'summary'      => 'Read-only view (no password). Writes stay classic-only by design.',
            ],
        ];

        return [
            'uiEnabled'       => $uiEnabled,
            'classicAdminUrl' => '/admin/',
            'pages'           => $pages,
        ];
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
