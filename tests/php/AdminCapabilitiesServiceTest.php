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
assert_true($cap['classicAdminUrl'] === '/admin/', 'classicAdminUrl set');
assert_true(is_array($cap['pages']) && count($cap['pages']) >= 4, 'pages list present');

$byId = [];
foreach ($cap['pages'] as $p) {
    assert_true(isset($p['id'], $p['status'], $p['classicUrl'], $p['classicLabel']), 'page has required fields: ' . ($p['id'] ?? '?'));
    assert_true(is_string($p['classicUrl']) && $p['classicUrl'] !== '', 'classicUrl non-empty for ' . $p['id']);
    assert_true(str_starts_with($p['classicUrl'], '/admin'), 'classicUrl under /admin for ' . $p['id']);
    $byId[$p['id']] = $p;
}

assert_true(isset($byId['overview']), 'overview page defined');
assert_true($byId['overview']['available'] === true, 'overview available');
assert_true($byId['overview']['status'] === 'read-only', 'overview read-only');

assert_true(isset($byId['users']), 'users page defined');
assert_true($byId['users']['available'] === true, 'users available');
assert_true($byId['users']['status'] === 'full', 'users full CRUD');

assert_true(isset($byId['settings']) && $byId['settings']['available'] === true, 'settings available');
assert_true($byId['settings']['status'] === 'full', 'settings full');
assert_true(isset($byId['database']) && $byId['database']['available'] === true, 'database page available (read)');
assert_true($byId['database']['status'] === 'read-only', 'database read-only (writes classic-only)');

// Disable whole portal admin UI shell
$off = (new AdminCapabilitiesService([
    'system' => ['portal_admin_ui_enabled' => false],
]))->capabilities();
assert_true($off['uiEnabled'] === false, 'portal_admin_ui_enabled false honored');

$stringOff = (new AdminCapabilitiesService([
    'system' => ['portal_admin_ui_enabled' => 'off'],
]))->capabilities();
assert_true($stringOff['uiEnabled'] === false, 'portal_admin_ui_enabled string off');

// Every incomplete page must keep a classic fallback (exit criterion)
foreach ($cap['pages'] as $p) {
    if (!$p['available']) {
        assert_true($p['classicUrl'] !== '', 'incomplete page has classicUrl: ' . $p['id']);
    }
}

if ($failures > 0) {
    echo "\n$failures failure(s)\n";
    exit(1);
}
echo "\nAll AdminCapabilitiesService tests passed.\n";
exit(0);
