<?php

/**
 * Prometheus text gauges. Nginx allows loopback only.
 * The endpoint stays off until ANGARA_METRICS_TOKEN, METRICS_TOKEN,
 * or system.metrics_token is set. This script does not call Bootstrap
 * and does not print driver errors or the token.
 */
$method = (string) ($_SERVER['REQUEST_METHOD'] ?? 'GET');
if ($method !== 'GET' && $method !== 'HEAD') {
    http_response_code(405);
    header('Allow: GET, HEAD');
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');

    return;
}

$root = is_dir(getcwd() . '/Core') ? getcwd() : dirname(getcwd());
$autoload = $root . '/vendor/autoload.php';
$autoloadOk = is_readable($autoload);
require_once $root . '/Core/Frameworks/Baikal/Core/Metrics/MetricsToken.php';
require_once $root . '/Core/Frameworks/Baikal/Core/Metrics/Exporter.php';

if ($autoloadOk) {
    require $autoload;
}

$envToken = Baikal\Core\Metrics\MetricsToken::fromEnvironment();
$config = null;
$token = null;
if ($envToken['chosen']) {
    $token = $envToken['token'];
} elseif (!$autoloadOk) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');

    return;
} else {
    $config = metrics_read_config($root);
    $token = Baikal\Core\Metrics\MetricsToken::resolve($config, true);
}

if ($token === null) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo "Not found\n";

    return;
}

$header = Baikal\Core\Metrics\MetricsToken::authorizationHeader();
if (!Baikal\Core\Metrics\MetricsToken::headerMatches($token, $header)) {
    http_response_code(401);
    header('Content-Type: text/plain; charset=utf-8');
    header('WWW-Authenticate: Bearer');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    echo "Unauthorized\n";

    return;
}

header('Content-Type: text/plain; version=0.0.4; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

if (!$autoloadOk) {
    http_response_code(503);
    if ($method === 'GET') {
        echo Baikal\Core\Metrics\Exporter::unavailable();
    }

    return;
}

if (is_readable($root . '/Core/Distrib.php')) {
    require_once $root . '/Core/Distrib.php';
}
if ($config === null) {
    $config = metrics_read_config($root);
}

$pdo = Baikal\Core\Metrics\Exporter::connect($config);
$body = (new Baikal\Core\Metrics\Exporter($root, $config, $pdo, time()))->render();
http_response_code(200);
if ($method === 'GET') {
    echo $body;
}

/**
 * @return array<string, mixed>|null
 */
function metrics_read_config(string $root): ?array {
    $configPath = $root . '/config/configuration.yaml';
    if (!is_readable($configPath)) {
        return null;
    }
    try {
        $parsed = Symfony\Component\Yaml\Yaml::parseFile($configPath);

        return is_array($parsed) ? $parsed : null;
    } catch (\Throwable) {
        return null;
    }
}
