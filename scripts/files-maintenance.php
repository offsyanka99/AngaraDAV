<?php

declare(strict_types=1);

use Baikal\Core\Files\FileStorageConfig;
use Baikal\Core\Files\HomeRepository;
use Baikal\Core\Files\SchemaManager;
use Symfony\Component\Yaml\Yaml;

$root = dirname(__DIR__) . '/';
define('BAIKAL_CONTEXT', true);
define('PROJECT_CONTEXT_BASEURI', '/');
define('PROJECT_PATH_ROOT', $root);

$_SERVER['SERVER_PORT'] = $_SERVER['SERVER_PORT'] ?? '80';
$_SERVER['HTTP_HOST'] = $_SERVER['HTTP_HOST'] ?? 'localhost';
$_SERVER['REQUEST_URI'] = $_SERVER['REQUEST_URI'] ?? '/scripts/files-maintenance.php';
$_SERVER['SCRIPT_FILENAME'] = $_SERVER['SCRIPT_FILENAME'] ?? __FILE__;
$_SERVER['DOCUMENT_ROOT'] = $_SERVER['DOCUMENT_ROOT'] ?? $root;

require $root . 'vendor/autoload.php';

\Flake\Framework::bootstrap();
\Baikal\Framework::bootstrap();

$config = Yaml::parseFile(PROJECT_PATH_CONFIG . 'baikal.yaml');
$fileConfig = new FileStorageConfig($config);
$fileConfig->prepareStorage();
$pdo = $GLOBALS['DB']->getPDO();
if (!SchemaManager::exists($pdo)) {
    exit(0);
}

$lockPath = rtrim($fileConfig->getStoragePath(), '/\\') . '/maintenance.lock';
$lockHandle = @fopen($lockPath, 'c');
if ($lockHandle === false || !@chmod($lockPath, 0600) || !@flock($lockHandle, LOCK_EX | LOCK_NB)) {
    fwrite(STDERR, "WebDAV file maintenance is already running or cannot acquire its lock.\n");
    exit(1);
}

$purge = in_array('--purge-quarantine', $argv, true);
$cleanup = in_array('--cleanup-temporary', $argv, true);
if (!$purge && !$cleanup) {
    $purge = true;
    $cleanup = true;
}

$repository = new HomeRepository($pdo, $fileConfig);
$purged = $purge ? $repository->purgeExpiredQuarantine() : 0;
$removed = $cleanup ? $repository->cleanupTemporaryFiles() : 0;

echo 'Purged homes: ' . $purged . PHP_EOL;
echo 'Removed temporary uploads: ' . $removed . PHP_EOL;
