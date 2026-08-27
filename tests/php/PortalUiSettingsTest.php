<?php

/**
 * Portal /api/ui time format and week start follow Admin YAML; compose env is ignored.
 *
 * Run: php tests/php/PortalUiSettingsTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Portal\App;

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

$prevTime = getenv('TIME_FORMAT');
$prevAlias = getenv('BAIKAL_PORTAL_TIME_FORMAT');
$prevWeek = getenv('BAIKAL_PORTAL_WEEK_START');

putenv('TIME_FORMAT=12h');
putenv('BAIKAL_PORTAL_TIME_FORMAT=12h');
putenv('BAIKAL_PORTAL_WEEK_START=sunday');

try {
    $sys = [
        'portal_time_format' => '24h',
        'portal_week_start'  => 'monday',
    ];
    assert_true(App::portalTimeFormatFromSystem($sys) === '24h', 'YAML 24h wins over env 12h');
    assert_true(App::portalWeekStartFromSystem($sys) === 'monday', 'YAML monday wins over env sunday');

    assert_true(App::portalTimeFormatFromSystem([]) === 'auto', 'missing time format → auto');
    assert_true(App::portalWeekStartFromSystem([]) === 'auto', 'missing week start → auto');
    assert_true(App::portalTimeFormatFromSystem(['portal_time_format' => 'nope']) === 'auto', 'invalid time → auto');
    assert_true(App::portalWeekStartFromSystem(['portal_week_start' => 'friday']) === 'auto', 'invalid week → auto');
    assert_true(App::portalTimeFormatFromSystem(['portal_time_format' => '12h']) === '12h', 'YAML 12h');
    assert_true(App::portalWeekStartFromSystem(['portal_week_start' => 'sunday']) === 'sunday', 'YAML sunday');

    $src = file_get_contents($root . '/Core/Frameworks/Baikal/Portal/App.php');
    assert_true(is_string($src) && $src !== '', 'App.php readable');
    assert_true(
        is_string($src) && !preg_match(
            "/getenv\\('(TIME_FORMAT|BAIKAL_PORTAL_TIME_FORMAT|BAIKAL_PORTAL_WEEK_START)'\\)/",
            $src
        ),
        'App.php does not getenv locale env'
    );
} finally {
    $restore = static function (string $name, $prev): void {
        if ($prev === false) {
            putenv($name);
        } else {
            putenv($name . '=' . $prev);
        }
    };
    $restore('TIME_FORMAT', $prevTime);
    $restore('BAIKAL_PORTAL_TIME_FORMAT', $prevAlias);
    $restore('BAIKAL_PORTAL_WEEK_START', $prevWeek);
}

if ($failures > 0) {
    echo "\n$failures failure(s)\n";
    exit(1);
}
echo "\nAll PortalUiSettings tests passed.\n";
exit(0);
