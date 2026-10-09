<?php

/**
 * Prometheus exposition for /metrics.php. Token and settings rules are later.
 *
 * Run: php tests/php/MetricsExpositionTest.php
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

require $root . '/vendor/autoload.php';

/**
 * @return array<string, string>
 */
function metrics_exposition_env(?string $authorization): array {
    $env = getenv();
    if (!is_array($env)) {
        $env = [];
    }
    unset($env['ANGARA_METRICS_TOKEN'], $env['METRICS_TOKEN']);
    $env['ANGARA_METRICS_TOKEN'] = '0123456789abcdef';
    if ($authorization !== null) {
        $env['HTTP_AUTHORIZATION'] = $authorization;
    }

    return $env;
}
require_once $root . '/Core/Distrib.php';

function seriesValue(string $body, string $sample): ?int {
    if (!preg_match('/^' . preg_quote($sample, '/') . ' (\d+)$/m', $body, $match)) {
        return null;
    }

    return (int) $match[1];
}

$now = 1_700_000_000;
$pdo = new PDO('sqlite::memory:', null, null, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
$pdo->exec(
    'CREATE TABLE push_queue (resource_uri text, available_at integer, created integer, attempts integer)'
);
$pdo->exec(
    'CREATE TABLE push_subscriptions (resource_uri text, expires integer)'
);
$insertQueue = $pdo->prepare('INSERT INTO push_queue (resource_uri, available_at, created, attempts) VALUES (?, ?, ?, ?)');
$insertQueue->execute(['files/alice/secret-name.jpg', $now - 10, $now - 100, 2]);
$insertQueue->execute(['files/alice/later.jpg', $now + 50, $now - 40, 7]);
$insertSub = $pdo->prepare('INSERT INTO push_subscriptions (resource_uri, expires) VALUES (?, ?)');
$insertSub->execute(['calendars/alice/default', $now + 100]);
$insertSub->execute(['calendars/alice/old', $now - 1]);
$insertSub->execute(['addressbooks/alice/book', $now + 100]);
$insertSub->execute(['files/alice/Photos', $now + 100]);
$insertSub->execute(['principals/alice', $now + 100]);
$insertSub->execute(['unknown/alice/secret-path', $now + 100]);

$project = sys_get_temp_dir() . '/angara-metrics-' . bin2hex(random_bytes(4));
mkdir($project . '/config', 0700, true);
mkdir($project . '/Specific', 0700, true);
$config = [
    'system' => ['files_enabled' => false],
    'database' => ['backend' => 'sqlite', 'sqlite_file' => $project . '/missing.sqlite'],
];
$body = (new Baikal\Core\Metrics\Exporter($project, $config, $pdo, $now))->render();

foreach ([
    'angaradav_up',
    'angaradav_build_info',
    'angaradav_install_locked',
    'angaradav_config_writable',
    'angaradav_specific_writable',
    'angaradav_files_enabled',
    'angaradav_files_storage_ready',
    'angaradav_database_up',
    'angaradav_push_queue_jobs',
    'angaradav_push_queue_oldest_age_seconds',
    'angaradav_push_queue_max_attempts',
    'angaradav_push_subscriptions',
] as $name) {
    assert_true(str_contains($body, '# HELP ' . $name . ' '), $name . ' has HELP');
    assert_true(str_contains($body, '# TYPE ' . $name . ' gauge'), $name . ' is a gauge');
}
assert_true(!preg_match('/\} \d+ \d+$/m', $body), 'samples have no timestamps');
assert_true(seriesValue($body, 'angaradav_up') === 1, 'up is 1');
assert_true(str_contains($body, 'angaradav_build_info{version="' . ANGARA_VERSION . '"'), 'build version label');
assert_true(seriesValue($body, 'angaradav_push_queue_jobs{state="ready"}') === 1, 'one ready job');
assert_true(seriesValue($body, 'angaradav_push_queue_jobs{state="delayed"}') === 1, 'one delayed job');
assert_true(seriesValue($body, 'angaradav_push_queue_oldest_age_seconds') === 100, 'oldest age uses the earlier created time');
assert_true(seriesValue($body, 'angaradav_push_queue_max_attempts') === 7, 'max attempts');
assert_true(seriesValue($body, 'angaradav_push_subscriptions{kind="calendars"}') === 1, 'expired calendar subscription is absent');
assert_true(seriesValue($body, 'angaradav_push_subscriptions{kind="addressbooks"}') === 1, 'address book kind');
assert_true(seriesValue($body, 'angaradav_push_subscriptions{kind="files"}') === 1, 'files kind');
assert_true(seriesValue($body, 'angaradav_push_subscriptions{kind="principals"}') === 1, 'principals kind');
assert_true(seriesValue($body, 'angaradav_push_subscriptions{kind="other"}') === 1, 'other is a count');
assert_true(!str_contains($body, 'secret-name') && !str_contains($body, 'secret-path') && !str_contains($body, 'alice'), 'paths and usernames are not labels');
assert_true(seriesValue($body, 'angaradav_files_enabled') === 0, 'files off');
assert_true(seriesValue($body, 'angaradav_files_storage_ready') === 0, 'storage not ready when files are off');
assert_true(seriesValue($body, 'angaradav_install_locked') === 0, 'install is not locked in the temp root');

$down = (new Baikal\Core\Metrics\Exporter($project, $config, null, $now))->render();
assert_true(seriesValue($down, 'angaradav_database_up') === 0, 'missing database is database_up 0');
assert_true(seriesValue($down, 'angaradav_push_queue_jobs{state="ready"}') === 0, 'push ready is 0 when the database is down');
assert_true(seriesValue($down, 'angaradav_push_queue_jobs{state="delayed"}') === 0, 'push delayed is 0 when the database is down');
assert_true(seriesValue($down, 'angaradav_push_subscriptions{kind="other"}') === 0, 'subscription kinds are 0 when the database is down');
assert_true(str_starts_with(Baikal\Core\Metrics\Exporter::unavailable(), "# HELP angaradav_up "), 'autoload failure text starts with the up series');
$unavailable = Baikal\Core\Metrics\Exporter::unavailable();
assert_true(substr_count($unavailable, 'angaradav_up') === 3, 'autoload failure names only angaradav_up');
assert_true(!str_contains($unavailable, 'angaradav_database_up'), 'autoload failure has no other series');

$filesOn = $config;
$filesOn['system']['files_enabled'] = true;
$filesOn['system']['files_storage_path'] = 'relative/not-absolute';
if (!defined('PROJECT_PATH_SPECIFIC')) {
    define('PROJECT_PATH_SPECIFIC', $project . '/Specific/');
}
$inactive = (new Baikal\Core\Metrics\Exporter($project, $filesOn, null, $now))->render();
assert_true(seriesValue($inactive, 'angaradav_files_enabled') === 1, 'files enabled');
assert_true(seriesValue($inactive, 'angaradav_files_storage_ready') === 0, 'inactive storage is 0 and the path is not rendered');
assert_true(!str_contains($inactive, 'relative/not-absolute'), 'storage path is not in the exposition');

putenv('ANGARA_LOCK_INSTALL=1');
$locked = (new Baikal\Core\Metrics\Exporter($project, $config, null, $now))->render();
putenv('ANGARA_LOCK_INSTALL');
assert_true(seriesValue($locked, 'angaradav_install_locked') === 1, 'ANGARA_LOCK_INSTALL=1 locks the gauge');

putenv('BAIKAL_LOCK_INSTALL=1');
$legacyLock = (new Baikal\Core\Metrics\Exporter($project, $config, null, $now))->render();
putenv('BAIKAL_LOCK_INSTALL');
assert_true(seriesValue($legacyLock, 'angaradav_install_locked') === 0, 'BAIKAL_LOCK_INSTALL does not lock the gauge');

$missingFile = $project . '/missing.sqlite';
$connected = Baikal\Core\Metrics\Exporter::connect([
    'database' => ['backend' => 'sqlite', 'sqlite_file' => $missingFile],
]);
assert_true($connected === null, 'a missing SQLite file does not open');
$missingBody = (new Baikal\Core\Metrics\Exporter($project, $config, $connected, $now))->render();
assert_true(seriesValue($missingBody, 'angaradav_database_up') === 0, 'missing SQLite file is database_up 0');
assert_true(seriesValue($missingBody, 'angaradav_push_queue_jobs{state="ready"}') === 0, 'missing SQLite file zeros the push gauges');
assert_true(!str_contains($missingBody, 'missing.sqlite'), 'the SQLite path is not in the exposition');

$getCmd = 'php -r ' . escapeshellarg('$_SERVER["REQUEST_METHOD"]="GET"; $_SERVER["HTTP_AUTHORIZATION"]="Bearer 0123456789abcdef"; include ' . var_export($root . '/html/metrics.php', true) . ';');
$get = proc_open(
    $getCmd,
    [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
    $pipes,
    $root,
    metrics_exposition_env(null)
);
assert_true(is_resource($get), 'spawned metrics.php');
if (is_resource($get)) {
    fclose($pipes[0]);
    $out = (string) stream_get_contents($pipes[1]);
    $err = (string) stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    proc_close($get);
    assert_true(str_contains($out, "angaradav_up 1\n"), 'GET metrics.php renders up');
    assert_true(!str_contains($out, 'SQLSTATE') && !str_contains($err, 'SQLSTATE'), 'driver errors are not printed');
}

$postCmd = 'php -r ' . escapeshellarg('$_SERVER["REQUEST_METHOD"]="POST"; $_SERVER["HTTP_AUTHORIZATION"]="Bearer 0123456789abcdef"; include ' . var_export($root . '/html/metrics.php', true) . ';');
$post = proc_open($postCmd, [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $postPipes, $root, metrics_exposition_env(null));
assert_true(is_resource($post), 'spawned POST metrics.php');
if (is_resource($post)) {
    fclose($postPipes[0]);
    $postOut = (string) stream_get_contents($postPipes[1]);
    fclose($postPipes[1]);
    fclose($postPipes[2]);
    proc_close($post);
    assert_true(!str_contains($postOut, 'angaradav_'), 'POST body has no metrics');
}

$health = proc_open(
    'php ' . escapeshellarg($root . '/html/health.php'),
    [0 => ['pipe', 'r'], 1 => ['pipe', 'w'], 2 => ['pipe', 'w']],
    $healthPipes,
    $root
);
assert_true(is_resource($health), 'spawned health.php');
if (is_resource($health)) {
    fclose($healthPipes[0]);
    $healthOut = (string) stream_get_contents($healthPipes[1]);
    fclose($healthPipes[1]);
    fclose($healthPipes[2]);
    proc_close($health);
    assert_true(!str_contains($healthOut, 'angaradav_'), 'health.php is not the metrics exposition');
    $healthJson = json_decode($healthOut, true);
    assert_true(is_array($healthJson) && isset($healthJson['status']), 'health.php stays a JSON status document');
}

$nginx = (string) file_get_contents($root . '/docker/nginx.conf');
$start = strpos($nginx, 'location = /metrics.php {');
$end = $start === false ? false : strpos($nginx, "\n  }", $start);
$block = ($start !== false && $end !== false) ? substr($nginx, $start, $end - $start) : '';
assert_true(str_contains($block, 'allow 127.0.0.1;'), 'metrics location allows ipv4 loopback');
assert_true(str_contains($block, 'allow ::1;'), 'metrics location allows ipv6 loopback');
assert_true(str_contains($block, 'deny all;'), 'metrics location denies everyone else');
assert_true(!str_contains($block, 'add_header') && !str_contains($block, 'X-Forwarded-For'), 'metrics location does not drop security headers or trust forwarded addresses');

if ($failures > 0) {
    echo "\n$failures failure(s)\n";
    exit(1);
}
echo "\nAll metrics exposition tests passed.\n";
exit(0);
