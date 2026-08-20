<?php

/**
 * Rate limit for portal file download/view (same ceiling as login).
 *
 * Run: php tests/php/FileDownloadRateLimiterTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Portal\ApiException;
use Baikal\Portal\Auth;
use Baikal\Portal\FileDownloadRateLimiter;

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

$dir = sys_get_temp_dir() . '/baikal-dl-rate-' . bin2hex(random_bytes(4));
@mkdir($dir, 0700, true);
$state = $dir . '/portal_file_download_rate.json';
$_SERVER['REMOTE_ADDR'] = '203.0.113.9';

$limiter = new FileDownloadRateLimiter($state);
for ($i = 0; $i < Auth::RATE_LIMIT_MAX; ++$i) {
    $limiter->assertAllowed('alice');
}
assert_true(is_file($state), 'rate-limit state file created');

try {
    $limiter->assertAllowed('alice');
    assert_true(false, '21st download should 429');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 429, 'over-limit → 429');
}

$limiter->assertAllowed('bob');
assert_true(true, 'other username on same IP has its own budget');

$_SERVER['REMOTE_ADDR'] = '203.0.113.10';
$limiter->assertAllowed('alice');
assert_true(true, 'other IP for same username has its own budget');

remove_tree($dir);

if ($failures > 0) {
    fwrite(STDERR, "$failures assertion(s) failed\n");
    exit(1);
}
echo "All FileDownloadRateLimiter checks passed.\n";
exit(0);

function remove_tree(string $path): void {
    if (is_file($path) || is_link($path)) {
        @unlink($path);

        return;
    }
    if (!is_dir($path)) {
        return;
    }
    foreach (new FilesystemIterator($path, FilesystemIterator::SKIP_DOTS) as $entry) {
        remove_tree($entry->getPathname());
    }
    @rmdir($path);
}
