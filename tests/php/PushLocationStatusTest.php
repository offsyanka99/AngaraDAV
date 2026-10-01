<?php

/**
 * PHP rewrites a 204 that carries Location into 302 inside header().
 * PushPlugin::handled() must leave 204, Location, and Expires on the wire.
 *
 * CLI's headers_list() stays empty, so this drives PHP's built-in server
 * and reads the status line the way a WebDAV client does.
 *
 * Run: php tests/php/PushLocationStatusTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Core\Plugins\PushPlugin;
use Sabre\HTTP\Response;
use Sabre\HTTP\ResponseInterface;

/**
 * Sends one prepared response through PushPlugin::handled().
 */
final class PushPluginStatusProbe extends PushPlugin {
    public function __construct() {
        // No database. This probe only sends a response the caller built.
    }

    public function send(ResponseInterface $response): bool {
        $this->server = new \Sabre\DAV\Server();

        return $this->handled($response);
    }
}

function push_status_response(string $mode): Response {
    $response = new Response();
    if ($mode === 'register') {
        $response->setStatus(204);
        $response->setHeader('Location', 'https://dav.example.test/dav.php/push-subscriptions/' . str_repeat('a', 43));
        $response->setHeader('Expires', 'Thu, 08 Oct 2026 17:16:11 GMT');

        return $response;
    }
    if ($mode === 'unregister') {
        $response->setStatus(204);

        return $response;
    }
    if ($mode === 'created') {
        $response->setStatus(201);
        $response->setHeader('Location', 'https://dav.example.test/created');

        return $response;
    }
    if ($mode === 'redirect') {
        $response->setStatus(302);
        $response->setHeader('Location', 'https://dav.example.test/go');

        return $response;
    }
    if ($mode === 'forbidden') {
        $response->setStatus(403);
        $response->setHeader('Content-Type', 'application/xml; charset=utf-8');
        $response->setBody('<D:error xmlns:D="DAV:"><P:push-not-available/></D:error>');

        return $response;
    }

    $response->setStatus(500);
    $response->setBody('unknown mode');

    return $response;
}

if (PHP_SAPI === 'cli-server') {
    $mode = isset($_GET['mode']) && is_string($_GET['mode']) ? $_GET['mode'] : '';
    $prepared = push_status_response($mode);
    if ($prepared->getStatus() === 500) {
        http_response_code(500);
        echo 'unknown mode';

        return true;
    }
    (new PushPluginStatusProbe())->send($prepared);

    return true;
}

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

function free_tcp_port(): int {
    $socket = stream_socket_server('tcp://127.0.0.1:0', $errno, $errstr);
    if ($socket === false) {
        throw new RuntimeException('cannot bind a local port: ' . $errstr);
    }
    $name = stream_socket_get_name($socket, false);
    fclose($socket);
    if (!is_string($name) || !str_contains($name, ':')) {
        throw new RuntimeException('cannot read the local port');
    }

    return (int) substr($name, (int) strrpos($name, ':') + 1);
}

/**
 * @return array{status: int, headers: array<string, string>, body: string, error: string}
 */
function http_exchange(string $url): array {
    $handle = curl_init($url);
    if ($handle === false) {
        return ['status' => 0, 'headers' => [], 'body' => '', 'error' => 'curl_init failed'];
    }
    curl_setopt_array($handle, [
        CURLOPT_HEADER => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => false,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CONNECTTIMEOUT => 2,
        CURLOPT_TIMEOUT => 5,
    ]);
    $raw = curl_exec($handle);
    $error = curl_error($handle);
    curl_close($handle);
    if (!is_string($raw)) {
        return ['status' => 0, 'headers' => [], 'body' => '', 'error' => $error !== '' ? $error : 'empty curl response'];
    }
    $split = preg_split("/\r\n\r\n/", $raw, 2);
    $head = $split[0] ?? '';
    $body = $split[1] ?? '';
    $lines = preg_split("/\r\n/", $head) ?: [];
    $status = 0;
    if (isset($lines[0]) && preg_match('/^HTTP\/\S+\s+(\d{3})\b/', $lines[0], $match) === 1) {
        $status = (int) $match[1];
    }
    $headers = [];
    foreach (array_slice($lines, 1) as $line) {
        $parts = explode(':', $line, 2);
        if (count($parts) !== 2) {
            continue;
        }
        $headers[strtolower(trim($parts[0]))] = trim($parts[1]);
    }

    return ['status' => $status, 'headers' => $headers, 'body' => $body, 'error' => $error];
}

$port = free_tcp_port();
$log = sys_get_temp_dir() . '/push-location-status-' . getmypid() . '.log';
$serverProc = proc_open(
    [PHP_BINARY, '-S', '127.0.0.1:' . $port, __FILE__],
    [
        0 => ['pipe', 'r'],
        1 => ['file', $log, 'a'],
        2 => ['file', $log, 'a'],
    ],
    $serverPipes,
    $root
);
if (is_resource($serverProc)) {
    fclose($serverPipes[0]);
}

register_shutdown_function(static function () use (&$serverProc, $log): void {
    if (is_resource($serverProc)) {
        proc_terminate($serverProc);
        proc_close($serverProc);
        $serverProc = null;
    }
    if (is_file($log)) {
        @unlink($log);
    }
});

$ready = false;
$deadline = microtime(true) + 5;
while (microtime(true) < $deadline) {
    $socket = @fsockopen('127.0.0.1', $port, $errno, $errstr, 0.2);
    if ($socket !== false) {
        fclose($socket);
        $ready = true;
        break;
    }
    usleep(50000);
}
assert_true($ready && is_resource($serverProc), 'built-in server accepts connections');

$base = 'http://127.0.0.1:' . $port . '/';
$location = 'https://dav.example.test/dav.php/push-subscriptions/' . str_repeat('a', 43);

if ($ready) {
    $registered = http_exchange($base . '?mode=register');
    assert_true($registered['error'] === '', 'register request completed (' . $registered['error'] . ')');
    assert_true($registered['status'] === 204, 'register is 204 on the wire, got ' . $registered['status']);
    assert_true(($registered['headers']['location'] ?? '') === $location, 'register keeps the subscription Location');
    assert_true(($registered['headers']['expires'] ?? '') === 'Thu, 08 Oct 2026 17:16:11 GMT', 'register keeps Expires');
    assert_true($registered['body'] === '', 'register body is empty');

    $removed = http_exchange($base . '?mode=unregister');
    assert_true($removed['status'] === 204, 'unregister without Location stays 204, got ' . $removed['status']);
    assert_true(!isset($removed['headers']['location']), 'unregister has no Location header');
    assert_true($removed['body'] === '', 'unregister body is empty');

    $created = http_exchange($base . '?mode=created');
    assert_true($created['status'] === 201, '201 Created with Location stays 201, got ' . $created['status']);
    assert_true(($created['headers']['location'] ?? '') === 'https://dav.example.test/created', '201 keeps Location');

    $redirect = http_exchange($base . '?mode=redirect');
    assert_true($redirect['status'] === 302, 'a real 302 redirect stays 302, got ' . $redirect['status']);
    assert_true(($redirect['headers']['location'] ?? '') === 'https://dav.example.test/go', '302 keeps Location');

    $forbidden = http_exchange($base . '?mode=forbidden');
    assert_true($forbidden['status'] === 403, '403 without Location stays 403, got ' . $forbidden['status']);
    assert_true(
        ($forbidden['headers']['content-type'] ?? '') === 'application/xml; charset=utf-8',
        '403 keeps its XML content type'
    );
    assert_true(
        $forbidden['body'] === '<D:error xmlns:D="DAV:"><P:push-not-available/></D:error>',
        '403 body is the precondition payload'
    );
}

if ($failures > 0) {
    $logText = is_file($log) ? (string) file_get_contents($log) : '';
    fwrite(STDERR, "$failures assertion(s) failed\n");
    if ($logText !== '') {
        fwrite(STDERR, "server log:\n$logText\n");
    }
    exit(1);
}
echo "All push registration status checks passed.\n";
exit(0);
