<?php

/**
 * /health.php liveness JSON includes config-writable and filesStorageReady.
 *
 * Run: php tests/php/HealthEndpointTest.php
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

$cmd = 'php ' . escapeshellarg($root . '/html/health.php');
$proc = proc_open(
    $cmd,
    [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ],
    $pipes,
    $root
);
assert_true(is_resource($proc), 'spawned health.php');
if (is_resource($proc)) {
    fclose($pipes[0]);
    $out = stream_get_contents($pipes[1]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    proc_close($proc);
} else {
    $out = false;
}

assert_true(is_string($out) && $out !== '', 'health.php printed JSON');
$data = is_string($out) ? json_decode($out, true) : null;
assert_true(is_array($data), 'health.php JSON decodes');
if (!is_array($data)) {
    echo "output: " . (string) $out . "\n";
} else {
    assert_true(array_key_exists('configWritable', $data), 'configWritable present');
    assert_true(array_key_exists('specificWritable', $data), 'specificWritable present');
    assert_true(array_key_exists('filesStorageReady', $data), 'filesStorageReady present');
    assert_true(isset($data['status']) && is_string($data['status']), 'status string');
    assert_true(array_key_exists('persistenceWarning', $data), 'persistenceWarning present');
}

if ($failures > 0) {
    fwrite(STDERR, "$failures assertion(s) failed\n");
    exit(1);
}
echo "All health endpoint checks passed.\n";
exit(0);
