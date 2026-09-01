<?php

/**
 * Product version string + upgrade-base comparison (baikal_version_base / baikal_needs_upgrade).
 *
 * Run: php tests/php/VersionCompareTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/Core/Distrib.php';

$failures = 0;

function assert_true(bool $cond, string $msg): void {
    global $failures;
    if ($cond) {
        echo "OK  $msg\n";

        return;
    }
    echo "FAIL $msg\n";
    ++$failures;
}

assert_true(
    !str_contains(ANGARA_VERSION, '+git.'),
    'ANGARA_VERSION must not contain +git. prefix'
);
if (ANGARA_GIT_SHA !== '') {
    assert_true(
        ANGARA_VERSION === ANGARA_VERSION_BASE . '+' . ANGARA_GIT_SHA,
        'ANGARA_VERSION is base+sha when git SHA is known'
    );
} else {
    assert_true(ANGARA_VERSION === ANGARA_VERSION_BASE, 'ANGARA_VERSION equals base without SHA');
}

assert_true(baikal_version_base('2.0.1+fef872a') === '2.0.1', 'strip +sha build metadata');
assert_true(baikal_version_base('2.0.1+git.fef872a') === '2.0.1', 'strip legacy +git.sha metadata');
assert_true(baikal_version_base('2.0.0') === '2.0.0', 'plain base unchanged');
assert_true(baikal_version_base('') === '', 'empty stays empty');

// Product base is ANGARA_VERSION_BASE.
$product = ANGARA_VERSION_BASE;
assert_true(baikal_needs_upgrade('2.0.0') === true, 'older configured requires upgrade');
assert_true(baikal_needs_upgrade('2.0.0+git.abc') === true, 'older +legacy-git requires upgrade');
assert_true(baikal_needs_upgrade($product) === false, 'same base does not require upgrade');
assert_true(baikal_needs_upgrade($product . '+deadbeef') === false, 'same base different sha does not upgrade');
assert_true(baikal_needs_upgrade($product . '+git.deadbeef') === false, 'same base legacy git suffix does not upgrade');
assert_true(baikal_needs_upgrade('') === false, 'empty configured is not “upgrade” (separate not_configured path)');
assert_true(baikal_needs_upgrade('99.0.0') === false, 'newer configured does not require upgrade');

echo "\n" . ($failures === 0 ? "All version compare tests passed." : "$failures version test(s) FAILED.") . "\n";
exit($failures === 0 ? 0 : 1);
