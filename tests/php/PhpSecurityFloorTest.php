<?php

/**
 * php2shell floor for the image build and CI (CVE-2026-109618, CVE-2026-109619).
 *
 * Run: php tests/php/PhpSecurityFloorTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/scripts/check-php-security-floor.php';

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

$accepted = ['8.4.27', '8.4.28', '8.5.12', '8.5.13', '8.6.0-dev', '8.6.0RC4', '8.6.0', '8.6.1', '8.7.0', '8.7.0-dev'];
$rejected = ['8.4.26', '8.5.0', '8.5.11', '8.6.0RC3', '8.6.0beta3', '8.3.36', '8.2.35', '7.4.33'];

foreach ($accepted as $version) {
    assert_true(angara_php_meets_security_floor($version), "{$version} meets the floor");
}
foreach ($rejected as $version) {
    assert_true(!angara_php_meets_security_floor($version), "{$version} is below the floor");
}
assert_true(angara_php_meets_security_floor(PHP_VERSION), 'this interpreter meets the floor (' . PHP_VERSION . ')');

$dockerfile = (string) file_get_contents($root . '/Dockerfile');
assert_true(str_contains($dockerfile, 'COPY scripts/check-php-security-floor.php'), 'image build copies the floor check');
assert_true(str_contains($dockerfile, 'php${PHP_VERSION} /tmp/check-php-security-floor.php'), 'image build runs the floor check on the installed PHP');
assert_true(str_contains($dockerfile, 'ARG PHP_VERSION=8.5'), 'image runtime stays on PHP 8.5');

$action = (string) file_get_contents($root . '/.github/actions/build/action.yaml');
assert_true(str_contains($action, 'php scripts/check-php-security-floor.php'), 'CI refuses a PHP below the floor');

if ($failures > 0) {
    fwrite(STDERR, "{$failures} failed\n");
    exit(1);
}
echo "All php2shell floor checks passed\n";
