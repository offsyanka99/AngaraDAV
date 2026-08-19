<?php
/**
 * PHP built-in server router for local portal testing.
 *   php -S 127.0.0.1:8080 -t html scripts/dev-server-router.php
 */
$uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$doc = rtrim($_SERVER['DOCUMENT_ROOT'] ?? dirname(__DIR__) . '/html', '/');

if (str_starts_with($uri, '/api')) {
    require $doc . '/api/index.php';
    return true;
}

$path = $doc . $uri;
if ($uri !== '/' && is_file($path)) {
    return false;
}
if (is_dir($path) && is_file($path . '/index.php')) {
    require $path . '/index.php';
    return true;
}
if (is_dir($path) && is_file($path . '/index.html')) {
    require $path . '/index.html';
    return true;
}
if (str_starts_with($uri, '/portal')) {
    require $doc . '/portal/index.html';
    return true;
}
if ($uri === '/') {
    if (is_file($doc . '/index.php')) {
        require $doc . '/index.php';
        return true;
    }
}

http_response_code(404);
header('Content-Type: text/plain; charset=utf-8');
echo "Not found\n";
return true;
