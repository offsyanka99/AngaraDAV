<?php

/**
 * /metrics.php bearer token. Loopback is nginx, not this script.
 *
 * Run: php tests/php/MetricsEndpointTest.php
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

/**
 * @param array{method?: string, angara?: string, metrics?: string, auth?: string, query?: string, cwd?: string} $options
 *
 * @return array{status: int, body: string, headers: string}
 */
function run_metrics(string $repo, array $options): array {
    $code = 'putenv("ANGARA_METRICS_TOKEN"); putenv("METRICS_TOKEN");'
        . 'if (getenv("M_ANGARA") !== false) { putenv("ANGARA_METRICS_TOKEN=" . getenv("M_ANGARA")); }'
        . 'if (getenv("M_METRICS") !== false) { putenv("METRICS_TOKEN=" . getenv("M_METRICS")); }'
        . '$_SERVER["REQUEST_METHOD"] = getenv("M_METHOD") ?: "GET";'
        . 'unset($_SERVER["HTTP_AUTHORIZATION"], $_SERVER["REDIRECT_HTTP_AUTHORIZATION"], $_GET);'
        . '$auth = getenv("M_AUTH"); if ($auth !== false) { $_SERVER["HTTP_AUTHORIZATION"] = $auth; }'
        . '$query = getenv("M_QUERY"); if ($query !== false) { parse_str((string) $query, $_GET); }'
        . 'include getenv("M_SCRIPT");'
        . 'fwrite(STDERR, "STATUS:" . http_response_code() . "\n");'
        . 'foreach (headers_list() as $header) { fwrite(STDERR, "H:" . $header . "\n"); }';
    $env = getenv();
    if (!is_array($env)) {
        $env = [];
    }
    unset($env['ANGARA_METRICS_TOKEN'], $env['METRICS_TOKEN'], $env['M_ANGARA'], $env['M_METRICS'], $env['M_AUTH'], $env['M_QUERY']);
    $env['M_SCRIPT'] = $repo . '/html/metrics.php';
    $env['M_METHOD'] = $options['method'] ?? 'GET';
    foreach (['angara' => 'M_ANGARA', 'metrics' => 'M_METRICS', 'auth' => 'M_AUTH', 'query' => 'M_QUERY'] as $option => $name) {
        if (array_key_exists($option, $options)) {
            $env[$name] = $options[$option];
        }
    }
    $proc = proc_open(
        'php -r ' . escapeshellarg($code),
        [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
        $pipes,
        $options['cwd'] ?? $repo,
        $env
    );
    if (!is_resource($proc)) {
        return ['status' => 0, 'body' => '', 'headers' => ''];
    }
    fclose($pipes[0]);
    $body = (string) stream_get_contents($pipes[1]);
    $err = (string) stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    proc_close($proc);
    $status = 0;
    if (preg_match('/STATUS:(\d+)/', $err, $match)) {
        $status = (int) $match[1];
    }

    return ['status' => $status, 'body' => $body, 'headers' => $err];
}

function make_tree(string $repo, ?string $token, bool $withVendor = true): string {
    $dir = sys_get_temp_dir() . '/angara-metrics-http-' . bin2hex(random_bytes(4));
    mkdir($dir . '/config', 0700, true);
    symlink($repo . '/Core', $dir . '/Core');
    if ($withVendor) {
        symlink($repo . '/vendor', $dir . '/vendor');
    }
    $system = [];
    if ($token !== null) {
        $system['metrics_token'] = $token;
    }
    file_put_contents($dir . '/config/configuration.yaml', Symfony\Component\Yaml\Yaml::dump(['system' => $system], 4, 2));

    return $dir;
}

require $root . '/vendor/autoload.php';

$token = '0123456789abcdef';
$other = 'fedcba9876543210';
$yamlToken = 'abcdef0123456789';

$off = run_metrics($root, ['cwd' => make_tree($root, null)]);
assert_true($off['status'] === 404, 'no token is 404');
assert_true($off['body'] === "Not found\n", '404 body is Not found');
assert_true(!str_contains($off['body'], 'angaradav_'), '404 body has no series');

$short = run_metrics($root, ['cwd' => make_tree($root, null), 'angara' => 'short-token']);
assert_true($short['status'] === 404, 'token shorter than 16 bytes is 404');
assert_true(!str_contains($short['body'], 'angaradav_'), 'short token does not reveal series');

$noHeader = run_metrics($root, ['cwd' => make_tree($root, null), 'angara' => $token]);
assert_true($noHeader['status'] === 401, 'missing Authorization is 401');
assert_true($noHeader['body'] === "Unauthorized\n", '401 body is Unauthorized');
$listen = stream_socket_server('tcp://127.0.0.1:0', $errno, $errstr);
assert_true(is_resource($listen), 'reserved a loopback port');
$port = 0;
if (is_resource($listen)) {
    $name = (string) stream_socket_get_name($listen, false);
    $port = (int) substr($name, (int) strrpos($name, ':') + 1);
    fclose($listen);
}
$serverEnv = getenv();
if (!is_array($serverEnv)) {
    $serverEnv = [];
}
unset($serverEnv['ANGARA_METRICS_TOKEN'], $serverEnv['METRICS_TOKEN']);
$serverEnv['ANGARA_METRICS_TOKEN'] = $token;
$server = proc_open(
    'php -S 127.0.0.1:' . $port . ' -t ' . escapeshellarg($root . '/html'),
    [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
    $serverPipes,
    $root,
    $serverEnv
);
assert_true(is_resource($server), 'started the loopback metrics server');
$challenge = '';
if (is_resource($server) && $port > 0) {
    $ready = false;
    for ($i = 0; $i < 50; ++$i) {
        $probe = @fsockopen('127.0.0.1', $port, $errno, $errstr, 0.1);
        if (is_resource($probe)) {
            fclose($probe);
            $ready = true;
            break;
        }
        usleep(20000);
    }
    assert_true($ready, 'loopback metrics server accepted a connection');
    if ($ready) {
        $challenge = (string) shell_exec('curl -sS -D - -o /dev/null http://127.0.0.1:' . $port . '/metrics.php');
    }
    proc_terminate($server);
    fclose($serverPipes[0]);
    fclose($serverPipes[1]);
    fclose($serverPipes[2]);
    proc_close($server);
}
assert_true(stripos($challenge, 'WWW-Authenticate: Bearer') !== false, '401 sends Bearer challenge');
assert_true(!str_contains($noHeader['body'], 'angaradav_'), '401 body has no series');

$wrong = run_metrics($root, ['cwd' => make_tree($root, null), 'angara' => $token, 'auth' => 'Bearer ' . $other]);
assert_true($wrong['status'] === 401, 'wrong bearer is 401');
assert_true(!str_contains($wrong['body'], $token) && !str_contains($wrong['body'], $other), '401 does not echo tokens');

$query = run_metrics($root, [
    'cwd' => make_tree($root, null),
    'angara' => $token,
    'query' => 'token=' . $token,
]);
assert_true($query['status'] === 401, 'token in the query string is ignored');

$post = run_metrics($root, [
    'cwd' => make_tree($root, null),
    'method' => 'POST',
    'angara' => $token,
    'auth' => 'Bearer ' . $token,
]);
assert_true($post['status'] === 405, 'POST with a valid bearer is 405');
assert_true(!str_contains($post['body'], 'angaradav_'), '405 body has no series');

$angaraWins = run_metrics($root, [
    'cwd' => make_tree($root, $yamlToken),
    'angara' => $token,
    'metrics' => $other,
    'auth' => 'Bearer ' . $token,
]);
assert_true($angaraWins['status'] === 200 && str_contains($angaraWins['body'], "angaradav_up 1\n"), 'ANGARA_METRICS_TOKEN is accepted');
$angaraRejectsOther = run_metrics($root, [
    'cwd' => make_tree($root, $yamlToken),
    'angara' => $token,
    'metrics' => $other,
    'auth' => 'Bearer ' . $other,
]);
assert_true($angaraRejectsOther['status'] === 401, 'METRICS_TOKEN does not override ANGARA_METRICS_TOKEN');
$angaraRejectsYaml = run_metrics($root, [
    'cwd' => make_tree($root, $yamlToken),
    'angara' => $token,
    'metrics' => $other,
    'auth' => 'Bearer ' . $yamlToken,
]);
assert_true($angaraRejectsYaml['status'] === 401, 'YAML token does not override ANGARA_METRICS_TOKEN');

$metricsWins = run_metrics($root, [
    'cwd' => make_tree($root, $yamlToken),
    'metrics' => $other,
    'auth' => 'Bearer ' . $other,
]);
assert_true($metricsWins['status'] === 200, 'METRICS_TOKEN is used when ANGARA_METRICS_TOKEN is unset');
$metricsRejectsYaml = run_metrics($root, [
    'cwd' => make_tree($root, $yamlToken),
    'metrics' => $other,
    'auth' => 'Bearer ' . $yamlToken,
]);
assert_true($metricsRejectsYaml['status'] === 401, 'YAML token does not override METRICS_TOKEN');

$yamlOnly = run_metrics($root, [
    'cwd' => make_tree($root, $yamlToken),
    'auth' => 'Bearer ' . $yamlToken,
]);
assert_true($yamlOnly['status'] === 200 && str_contains($yamlOnly['body'], "angaradav_up 1\n"), 'YAML system.metrics_token is used when both env vars are unset');

$zeroFallsThrough = run_metrics($root, [
    'cwd' => make_tree($root, $yamlToken),
    'angara' => '0',
    'auth' => 'Bearer ' . $yamlToken,
]);
assert_true($zeroFallsThrough['status'] === 200, 'ANGARA_METRICS_TOKEN=0 is unset and YAML is used');

$head = run_metrics($root, [
    'cwd' => make_tree($root, null),
    'method' => 'HEAD',
    'angara' => $token,
    'auth' => 'Bearer ' . $token,
]);
assert_true($head['status'] === 200, 'HEAD is 200');
assert_true($head['body'] === '', 'HEAD body is empty');

$brokenYaml = make_tree($root, null);
file_put_contents($brokenYaml . '/config/configuration.yaml', "system: [\n");
$yamlError = run_metrics($root, ['cwd' => $brokenYaml]);
assert_true($yamlError['status'] === 404, 'a YAML parse error leaves the token unset');
assert_true($yamlError['body'] === "Not found\n", 'a YAML parse error is not a 500 body');
assert_true(!str_contains($yamlError['body'], 'parse'), 'the parser message is not returned');

$noAutoload = run_metrics($root, ['cwd' => make_tree($root, $yamlToken, false)]);
assert_true($noAutoload['status'] === 503, 'YAML token with no autoload is 503');
assert_true($noAutoload['body'] === '', 'YAML token with no autoload has an empty body');

$envNoAutoload = run_metrics($root, [
    'cwd' => make_tree($root, null, false),
    'angara' => $token,
    'auth' => 'Bearer ' . $token,
]);
$missingDir = make_tree($root, null);
$missingFile = $missingDir . '/no-such.sqlite';
file_put_contents(
    $missingDir . '/config/configuration.yaml',
    Symfony\Component\Yaml\Yaml::dump([
        'system' => ['metrics_token' => $token],
        'database' => ['backend' => 'sqlite', 'sqlite_file' => $missingFile],
    ], 4, 2)
);
$missingHttp = run_metrics($root, [
    'cwd' => $missingDir,
    'angara' => $token,
    'auth' => 'Bearer ' . $token,
]);
assert_true($missingHttp['status'] === 200, 'a missing SQLite file is still HTTP 200');
assert_true(str_contains($missingHttp['body'], "angaradav_database_up 0\n"), 'missing SQLite file sets database_up 0');
assert_true(str_contains($missingHttp['body'], "angaradav_push_queue_jobs{state=\"ready\"} 0\n"), 'missing SQLite file zeros ready jobs');
assert_true(str_contains($missingHttp['body'], "angaradav_push_queue_jobs{state=\"delayed\"} 0\n"), 'missing SQLite file zeros delayed jobs');
assert_true(!str_contains($missingHttp['body'], 'no-such.sqlite'), 'the HTTP body does not contain the SQLite path');

assert_true($envNoAutoload['status'] === 503, 'env token with no autoload is 503');
assert_true(str_contains($envNoAutoload['body'], "angaradav_up 0\n"), 'env token with no autoload reports angaradav_up 0');
assert_true(!str_contains($envNoAutoload['body'], 'angaradav_database_up'), 'env token with no autoload has no other series');

if ($failures > 0) {
    echo "\n$failures failure(s)\n";
    exit(1);
}
echo "\nAll metrics token tests passed.\n";
exit(0);
