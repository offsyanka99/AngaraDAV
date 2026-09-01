<?php

/**
 * Public service info (no secrets). Safe for status pages and companion apps.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$root = is_dir(getcwd() . '/Core') ? getcwd() . '/' : dirname(getcwd()) . '/';

$version = 'unknown';
$git = null;
if (is_readable($root . 'Core/Distrib.php')) {
    require $root . 'Core/Distrib.php';
    if (defined('ANGARA_VERSION')) {
        $version = ANGARA_VERSION;
    }
    if (defined('ANGARA_GIT_SHA') && ANGARA_GIT_SHA !== '') {
        $git = ANGARA_GIT_SHA;
    }
}

$cal = $card = $files = $tasks = $notes = null;
$authType = null;
$timezone = null;
$configured = false;
$filesConfigured = false;

$configPath = $root . 'config/baikal.yaml';
if (is_readable($configPath) && is_readable($root . 'vendor/autoload.php')) {
    require_once $root . 'vendor/autoload.php';
    try {
        if (!defined('PROJECT_PATH_ROOT')) {
            define('PROJECT_PATH_ROOT', $root);
        }
        if (!defined('PROJECT_PATH_SPECIFIC')) {
            define('PROJECT_PATH_SPECIFIC', $root . 'Specific/');
        }
        $config = \Symfony\Component\Yaml\Yaml::parseFile($configPath);
        $configured = true;
        $sys = $config['system'] ?? [];
        $cal = isset($sys['cal_enabled']) ? (bool) $sys['cal_enabled'] : null;
        $card = isset($sys['card_enabled']) ? (bool) $sys['card_enabled'] : null;
        $filesConfigured = isset($sys['files_enabled']) ? (bool) $sys['files_enabled'] : false;
        $files = false;
        if ($filesConfigured) {
            $fileConfig = new \Baikal\Core\Files\FileStorageConfig($config);
            $files = $fileConfig->isActive();
        }
        $tasks = isset($sys['tasks_enabled']) ? (bool) $sys['tasks_enabled'] : true;
        $notes = isset($sys['notes_enabled']) ? (bool) $sys['notes_enabled'] : false;
        $authType = $sys['dav_auth_type'] ?? null;
        $timezone = $sys['timezone'] ?? null;
    } catch (\Throwable $e) {
        $configured = false;
    }
}

echo json_encode([
    'name'        => 'AngaraDAV',
    'version'     => $version,
    'git'         => $git,
    'configured'  => $configured,
    'caldav'      => $cal,
    'carddav'     => $card,
    'files'       => $files,
    'filesConfigured' => $filesConfigured,
    'tasks'       => $tasks,
    'notes'       => $notes,
    'davAuthType' => $authType,
    'timezone'    => $timezone,
    'endpoints'   => [
        'dav'    => '/dav.php/',
        'files'  => '/dav.php/files/{username}/',
        'cal'    => '/cal.php/',
        'card'   => '/card.php/',
        'admin'  => '/portal/#admin',
        'install' => '/portal/install/',
        'health' => '/health.php',
    ],
], JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT) . "\n";
