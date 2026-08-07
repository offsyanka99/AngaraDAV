<?php

/**
 * Unit checks for Baikal\Portal\Admin\AdminAudit (portal admin mutation log lines).
 *
 * Run: php tests/php/AdminAuditTest.php
 * Requires: composer install.
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Portal\Admin\AdminAudit;

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

$logDir = sys_get_temp_dir() . '/baikal-admin-audit-' . bin2hex(random_bytes(6));
@mkdir($logDir, 0700, true);
$logFile = $logDir . '/portal_debug.log';

try {
    // Off → no file write
    $off = new AdminAudit($logDir, 'off');
    assert_true($off->isEnabled() === false, 'audit disabled when log level off');
    $off->mutation('admin', 'create-user', 'alice', 'ok');
    assert_true(!is_file($logFile), 'no log file when level is off');

    // Info → sample create-user line (Phase 1.4 exit criterion)
    $audit = new AdminAudit($logDir, 'info');
    assert_true($audit->isEnabled() === true, 'audit enabled at info');
    $audit->mutation('admin', 'create-user', 'alice', 'ok');
    assert_true(is_file($logFile), 'portal_debug.log created');
    $body = (string) file_get_contents($logFile);
    assert_true(str_contains($body, 'admin audit'), 'line contains admin audit prefix');
    assert_true(str_contains($body, 'actor=admin'), 'line contains actor');
    assert_true(str_contains($body, 'action=create-user'), 'line contains create-user action');
    assert_true(str_contains($body, 'target=alice'), 'line contains target username');
    assert_true(str_contains($body, 'result=ok'), 'line contains result=ok');
    assert_true(str_contains($body, '[INFO]'), 'line is INFO level');
    assert_true(!str_contains(strtolower($body), 'password'), 'never logs password keyword from this call');

    // Secret context keys must be stripped
    $audit->mutation('admin', 'update-user', 'bob', 'ok', [
        'password' => 'secret-should-not-appear',
        'digesta1' => 'hash-should-not-appear',
        'fields'   => 'displayname,email',
    ]);
    $body2 = (string) file_get_contents($logFile);
    assert_true(!str_contains($body2, 'secret-should-not-appear'), 'password context value redacted');
    assert_true(!str_contains($body2, 'hash-should-not-appear'), 'digesta1 context value redacted');
    assert_true(str_contains($body2, 'fields=displayname,email') || str_contains($body2, 'fields=displayname_email'), 'safe context field kept');

    // Failures log at WARN (visible when PORTAL_LOG_LEVEL=warn) — Phase 9.4
    $warnOnly = new AdminAudit($logDir, 'warn');
    assert_true($warnOnly->isEnabled() === false, 'success audit needs info');
    assert_true($warnOnly->isFailureLoggingEnabled() === true, 'failure audit enabled at warn');
    @unlink($logFile);
    $warnOnly->mutation('admin', 'update-system-settings', 'system', 'ok');
    assert_true(!is_file($logFile), 'success line suppressed at warn level');
    $warnOnly->mutation('admin', 'update-system-settings', 'system', 'error:503', [
        'msg' => 'Config_file_is_not_writable',
    ]);
    assert_true(is_file($logFile), 'failure line written at warn');
    $failBody = (string) file_get_contents($logFile);
    assert_true(str_contains($failBody, '[WARN]'), 'failure tagged WARN');
    assert_true(str_contains($failBody, 'action=update-system-settings'), 'settings action in failure line');
    assert_true(str_contains($failBody, 'result=error:503'), 'error status in result');
    assert_true(str_contains($failBody, 'msg=Config_file_is_not_writable') || str_contains($failBody, 'Config'), 'error message context kept');
} finally {
    if (is_file($logFile)) {
        @unlink($logFile);
    }
    @rmdir($logDir);
}

if ($failures > 0) {
    echo "\n$failures failure(s)\n";
    exit(1);
}
echo "\nAll AdminAudit tests passed.\n";
exit(0);
