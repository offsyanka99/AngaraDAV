<?php

/**
 * Unit checks for Baikal\Portal\Admin\AdminCapabilitiesService.
 *
 * Run: php tests/php/AdminCapabilitiesServiceTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Portal\Admin\AdminCapabilitiesService;

$failures = 0;

function assert_true(bool $condition, string $message): void {
    global $failures;
    if ($condition) {
        echo "OK  $message\n";

        return;
    }
    echo "FAIL $message\n";
    ++$failures;
}

$svc = new AdminCapabilitiesService(['system' => []]);
$cap = $svc->capabilities();

assert_true($cap['uiEnabled'] === true, 'uiEnabled defaults true');
assert_true(($cap['portalAdminUrl'] ?? '') === '/portal/#admin', 'portalAdminUrl set');
assert_true(!array_key_exists('classicAdminUrl', $cap), 'no classicAdminUrl key');
assert_true(is_array($cap['pages']) && count($cap['pages']) >= 4, 'pages list present');

$byId = [];
$order = [];
foreach ($cap['pages'] as $p) {
    assert_true(isset($p['id'], $p['status'], $p['portalUrl'], $p['portalLabel']), 'page has required fields: ' . ($p['id'] ?? '?'));
    assert_true(is_string($p['portalUrl']) && $p['portalUrl'] !== '', 'portalUrl non-empty for ' . $p['id']);
    assert_true(str_starts_with($p['portalUrl'], '/portal/'), 'portalUrl under /portal for ' . $p['id']);
    assert_true(!array_key_exists('classicUrl', $p), 'no classicUrl on ' . $p['id']);
    $byId[$p['id']] = $p;
    $order[] = $p['id'];
}

assert_true($order === ['overview', 'settings', 'users', 'database', 'configuration'], 'tab order overview→settings→users→database→configuration');

assert_true(isset($byId['overview']), 'overview page defined');
assert_true($byId['overview']['available'] === true, 'overview available');
assert_true($byId['overview']['status'] === 'full', 'overview full');

assert_true(isset($byId['users']), 'users page defined');
assert_true($byId['users']['available'] === true, 'users available');
assert_true($byId['users']['status'] === 'full', 'users full CRUD');

assert_true(isset($byId['settings']) && $byId['settings']['available'] === true, 'settings available');
assert_true($byId['settings']['status'] === 'full', 'settings full');
assert_true(isset($byId['database']) && $byId['database']['available'] === true, 'database page available');
assert_true($byId['database']['status'] === 'full', 'database full (CONFIRM write)');

// Disable whole portal admin UI shell
$off = (new AdminCapabilitiesService([
    'system' => ['portal_admin_ui_enabled' => false],
]))->capabilities();
assert_true($off['uiEnabled'] === false, 'portal_admin_ui_enabled false honored');

$stringOff = (new AdminCapabilitiesService([
    'system' => ['portal_admin_ui_enabled' => 'off'],
]))->capabilities();
assert_true($stringOff['uiEnabled'] === false, 'portal_admin_ui_enabled string off');

// Every incomplete page must keep a portal navigation URL
foreach ($cap['pages'] as $p) {
    if (!$p['available']) {
        assert_true($p['portalUrl'] !== '', 'incomplete page has portalUrl: ' . $p['id']);
    }
}

if ($failures > 0) {
    echo "\n$failures failure(s)\n";
    exit(1);
}
echo "\nAll AdminCapabilitiesService tests passed.\n";
exit(0);
