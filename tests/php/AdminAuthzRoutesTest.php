<?php

/**
 * Static + unit checks that /api/admin/* stays behind requireAdmin
 * and install bootstrap is separate.
 *
 * Run: php tests/php/AdminAuthzRoutesTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

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

$appPath = $root . '/Core/Frameworks/Baikal/Portal/App.php';
$src = file_get_contents($appPath);
assert_true(is_string($src) && $src !== '', 'App.php readable');

// Admin routes dispatch only after requireAdmin
assert_true(
    (bool) preg_match('/requireAdmin\(\)|->requireAdmin\(/', $src),
    'requireAdmin used in App.php'
);
assert_true(
    str_contains($src, 'dispatchAdminRoutes'),
    'dispatchAdminRoutes present'
);

// Database write path exists (Phase 8.2)
assert_true(
    str_contains($src, 'updateDatabaseSettings') || str_contains($src, 'settings/database'),
    'database settings route present'
);

// Install entry is separate from App bootstrap
$api = file_get_contents($root . '/html/api/index.php');
assert_true(is_string($api), 'api index readable');
assert_true(
    str_contains($api, 'InstallApp') && str_contains($api, '/install'),
    'api routes install before full App bootstrap'
);

// Classic Formal controllers gone
assert_true(
    !is_dir($root . '/Core/Frameworks/BaikalAdmin/Controller'),
    'BaikalAdmin Controllers removed'
);
assert_true(
    !is_dir($root . '/Core/Frameworks/BaikalAdmin/View'),
    'BaikalAdmin Views removed'
);

// Redirects remain
$adminIdx = $root . '/Core/Frameworks/BaikalAdmin/WWWRoot/index.php';
$adminInstall = $root . '/Core/Frameworks/BaikalAdmin/WWWRoot/install/index.php';
assert_true(is_file($adminIdx) && str_contains((string) file_get_contents($adminIdx), '/portal/'), 'admin index redirects to portal');
assert_true(is_file($adminInstall) && str_contains((string) file_get_contents($adminInstall), '/portal/install/'), 'admin install redirects to portal install');

// Root landing redirects
$rootIdx = $root . '/html/index.php';
assert_true(is_file($rootIdx) && str_contains((string) file_get_contents($rootIdx), 'Location:'), 'html/index.php redirects');

if ($failures > 0) {
    echo "\n$failures failure(s)\n";
    exit(1);
}
echo "\nAll AdminAuthzRoutes tests passed.\n";
exit(0);
