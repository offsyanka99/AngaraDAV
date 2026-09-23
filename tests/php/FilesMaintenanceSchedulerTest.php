<?php

/**
 * Entrypoint DX contract: files-maintenance.php must be scheduled, not orphaned.
 *
 * Run: php tests/php/FilesMaintenanceSchedulerTest.php
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

$scriptPath = $root . '/docker/entrypoint.d/46-webdav-files-maintenance.sh';
assert_true(is_file($scriptPath), 'scheduler entrypoint script exists');

$script = (string) file_get_contents($scriptPath);
assert_true(str_contains($script, 'scripts/files-maintenance.php'), 'scheduler invokes files-maintenance.php');
assert_true(str_contains($script, 'su -s /bin/sh'), 'scheduler runs as unprivileged nginx user, like the push worker');
assert_true(str_contains($script, 'ANGARA_FILES_MAINTENANCE_INTERVAL_SECONDS'), 'scheduler interval is configurable');
assert_true(str_contains($script, "[ ! -f \"\$SCRIPT\" ]"), 'scheduler no-ops when the maintenance script is absent from the image');

assert_true(is_executable($scriptPath), 'scheduler entrypoint script is executable in the working tree');

if ($failures > 0) {
    fwrite(STDERR, "$failures assertion(s) failed\n");
    exit(1);
}
echo "All Files Maintenance Scheduler checks passed.\n";
exit(0);
