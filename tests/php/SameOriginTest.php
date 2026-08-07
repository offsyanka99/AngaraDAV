<?php

/**
 * Unit checks for Baikal\Portal\SameOrigin (portal + install CSRF companion).
 *
 * Run: php tests/php/SameOriginTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Portal\ApiException;
use Baikal\Portal\SameOrigin;

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

function expect_ok(array $server, string $msg): void {
    try {
        SameOrigin::assert($server);
        assert_true(true, $msg);
    } catch (ApiException $e) {
        assert_true(false, $msg . ' (got ' . $e->getMessage() . ')');
    }
}

function expect_403(array $server, string $needle, string $msg): void {
    try {
        SameOrigin::assert($server);
        assert_true(false, $msg . ' (expected 403)');
    } catch (ApiException $e) {
        assert_true($e->getStatus() === 403, $msg . ' status 403');
        assert_true(str_contains($e->getMessage(), $needle), $msg . ' message contains ' . $needle);
    }
}

// Empty host: allow (historical non-browser / misconfigured front-end)
expect_ok([], 'empty Host allowed');
expect_ok(['HTTP_HOST' => ''], 'blank Host allowed');

// Matching Origin
expect_ok(
    ['HTTP_HOST' => 'dav.example.com', 'HTTP_ORIGIN' => 'https://dav.example.com'],
    'matching Origin allowed'
);
expect_ok(
    ['HTTP_HOST' => 'dav.example.com:8443', 'HTTP_ORIGIN' => 'https://dav.example.com:8443'],
    'matching Origin with port allowed'
);

// Cross-origin Origin
expect_403(
    ['HTTP_HOST' => 'dav.example.com', 'HTTP_ORIGIN' => 'https://evil.example'],
    'Cross-origin',
    'mismatched Origin blocked'
);
expect_403(
    ['HTTP_HOST' => 'dav.example.com', 'HTTP_ORIGIN' => 'https://dav.example.com.evil'],
    'Cross-origin',
    'suffix Origin blocked'
);

// Matching Referer (no Origin)
expect_ok(
    ['HTTP_HOST' => 'dav.example.com', 'HTTP_REFERER' => 'https://dav.example.com/portal/'],
    'matching Referer allowed'
);

// Mismatched Referer
expect_403(
    ['HTTP_HOST' => 'dav.example.com', 'HTTP_REFERER' => 'https://evil.example/x'],
    'Cross-origin',
    'mismatched Referer blocked'
);

// Missing both
expect_403(
    ['HTTP_HOST' => 'dav.example.com'],
    'Missing Origin or Referer',
    'missing Origin and Referer fail closed'
);

// Origin wins over bad Referer
expect_ok(
    [
        'HTTP_HOST'    => 'dav.example.com',
        'HTTP_ORIGIN'  => 'https://dav.example.com',
        'HTTP_REFERER' => 'https://evil.example/',
    ],
    'valid Origin preferred over bad Referer'
);

echo "\n" . ($failures === 0 ? "All SameOrigin tests passed." : "$failures SameOrigin test(s) FAILED.") . "\n";
exit($failures === 0 ? 0 : 1);
