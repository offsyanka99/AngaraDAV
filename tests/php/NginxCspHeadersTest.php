<?php

/**
 * Portal CSP must allow blob: iframes (PDF preview) on every location that
 * sets Cache-Control (nginx does not inherit parent add_header).
 *
 * Run: php tests/php/NginxCspHeadersTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
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

$inc = $root . '/docker/nginx-security-headers.inc';
$conf = $root . '/docker/nginx.conf';
$incBody = file_get_contents($inc);
$confBody = file_get_contents($conf);
assert_true(is_string($incBody) && is_string($confBody), 'nginx files readable');
assert_true(str_contains((string) $incBody, "frame-src 'self' blob:"), 'CSP includes frame-src blob:');
assert_true(str_contains((string) $incBody, "media-src 'self' blob:"), 'CSP includes media-src blob:');
assert_true(str_contains((string) $confBody, 'include /etc/nginx/security-headers.inc;'), 'server includes security headers');
assert_true(substr_count((string) $confBody, 'include /etc/nginx/security-headers.inc;') >= 4, 'portal locations re-include security headers');

$html = file_get_contents($root . '/portal/index.html');
assert_true(is_string($html) && str_contains($html, "frame-src 'self' blob:"), 'portal HTML meta CSP has frame-src blob:');
assert_true(is_string($html) && str_contains($html, 'theme-init.js'), 'theme init is an external script (CSP script-src self)');

if ($failures > 0) {
    fwrite(STDERR, "$failures assertion(s) failed\n");
    exit(1);
}
echo "All Nginx CSP checks passed.\n";
exit(0);
