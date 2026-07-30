<?php

/**
 * Checks that expected DAV client responses do not pollute PHP error logs.
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Core\Server;
use Sabre\DAV\Exception\Forbidden;
use Sabre\DAV\Exception\NotAuthenticated;

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

$logPath = sys_get_temp_dir() . '/baikal-server-errors-' . bin2hex(random_bytes(6)) . '.log';
$oldErrorLog = ini_get('error_log');
$oldLogErrors = ini_get('log_errors');
ini_set('error_log', $logPath);
ini_set('log_errors', '1');

$reflection = new ReflectionClass(Server::class);
/** @var Server $server */
$server = $reflection->newInstanceWithoutConstructor();

$server->exception(new NotAuthenticated('Username or password was incorrect'));
$server->exception(new Forbidden('This calendar is marked read-only'));
assert_true(!file_exists($logPath), 'expected DAV 401/403 responses are not error-logged');

$server->exception(new RuntimeException('server-side failure'));
$contents = file_exists($logPath) ? (string) file_get_contents($logPath) : '';
assert_true(str_contains($contents, 'server-side failure'), 'server-side exceptions remain error-logged');

ini_set('error_log', (string) $oldErrorLog);
ini_set('log_errors', (string) $oldLogErrors);
@unlink($logPath);

if ($failures > 0) {
    fwrite(STDERR, "\n$failures failure(s)\n");
    exit(1);
}

echo "\nAll server exception logging tests passed.\n";
exit(0);
