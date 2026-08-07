<?php

/**
 * Unit checks for Baikal\Portal\ApiException payload (upgrade gate JSON body).
 *
 * Run: php tests/php/ApiExceptionTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Portal\ApiException;

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

$e = new ApiException('plain error', 400);
assert_true($e->getStatus() === 400, 'default status');
assert_true($e->getMessage() === 'plain error', 'message');
assert_true($e->getPayload() === [], 'empty payload by default');

$e2 = new ApiException(
    'Server upgrade required',
    503,
    [
        'code'               => 'upgrade_required',
        'installUrl'         => '/portal/install/',
        'productVersion'     => '2.0.2+abc',
        'configuredVersion'  => '2.0.1',
    ]
);
assert_true($e2->getStatus() === 503, 'upgrade status 503');
$p = $e2->getPayload();
assert_true(($p['code'] ?? '') === 'upgrade_required', 'payload code');
assert_true(($p['installUrl'] ?? '') === '/portal/install/', 'payload installUrl');
assert_true(($p['configuredVersion'] ?? '') === '2.0.1', 'payload configuredVersion');

// Emulate html/api/index.php merge
$body = array_merge(['error' => $e2->getMessage()], $e2->getPayload());
$json = json_encode($body, JSON_UNESCAPED_SLASHES);
assert_true(is_string($json) && str_contains($json, '"code":"upgrade_required"'), 'JSON includes code');
assert_true(str_contains((string) $json, 'Server upgrade required'), 'JSON includes error message');

echo "\n" . ($failures === 0 ? "All ApiException tests passed." : "$failures ApiException test(s) FAILED.") . "\n";
exit($failures === 0 ? 0 : 1);
