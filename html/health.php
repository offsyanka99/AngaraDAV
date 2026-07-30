<?php

/**
 * Lightweight liveness endpoint for reverse proxies / TrueNAS / orchestrators.
 * Does not require a completed install or database connection.
 */
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

$root = is_dir(getcwd() . '/Core') ? getcwd() . '/' : dirname(getcwd()) . '/';

$version = 'unknown';
$git = null;
if (is_readable($root . 'Core/Distrib.php')) {
    require $root . 'Core/Distrib.php';
    if (defined('BAIKAL_VERSION')) {
        $version = BAIKAL_VERSION;
    }
    if (defined('BAIKAL_GIT_SHA') && BAIKAL_GIT_SHA !== '') {
        $git = BAIKAL_GIT_SHA;
    }
}

$vendorOk = is_dir($root . 'vendor/sabre');
$configDir = $root . 'config';
$specificDir = $root . 'Specific';
$configPath = $configDir . '/baikal.yaml';
$configured = is_readable($configPath);
$installLocked = is_file($specificDir . '/INSTALL_DISABLED');
$configWritable = (is_dir($configDir) && is_writable($configDir))
    || (is_file($configPath) && is_writable($configPath));
$specificWritable = is_dir($specificDir) && is_writable($specificDir);
$filesStorageReady = null;

/**
 * Best-effort: detect whether a path is a mount, and whether it looks like a
 * Docker anonymous volume (settings reset on app recreate) vs host bind.
 *
 * @return array{mounted: bool, bindLikely: bool|null, source: string|null}
 */
$mountInfo = static function (string $path): array {
    $mounted = false;
    $bindLikely = null;
    $source = null;
    $mountinfo = @file('/proc/self/mountinfo', FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    if (!is_array($mountinfo)) {
        return ['mounted' => false, 'bindLikely' => null, 'source' => null];
    }
    $normalized = rtrim($path, '/');
    foreach ($mountinfo as $line) {
        // mountinfo: id parent major:minor root mountpoint options [optional fields] - fstype source super
        $parts = explode(' ', $line);
        if (count($parts) < 10) {
            continue;
        }
        $mountPoint = $parts[4] ?? '';
        if (rtrim($mountPoint, '/') !== $normalized) {
            continue;
        }
        $mounted = true;
        $dash = array_search('-', $parts, true);
        if ($dash !== false && isset($parts[$dash + 2])) {
            $source = $parts[$dash + 2];
        }
        if ($source !== null) {
            $anonymous = (bool) preg_match(
                '#/(docker/volumes|containerd/io\.containerd|var/lib/kubelet)/#',
                $source
            );
            $bindLikely = !$anonymous;
        }
        break;
    }

    return ['mounted' => $mounted, 'bindLikely' => $bindLikely, 'source' => $source];
};

$configMount = $mountInfo($configDir);
$specificMount = $mountInfo($specificDir);

$status = 'ok';
$code = 200;
if (!$vendorOk) {
    $status = 'incomplete';
    $code = 503;
} elseif (!$configWritable || !$specificWritable) {
    // Settings/DB cannot be persisted — common TrueNAS ownership mistake.
    $status = 'degraded';
} elseif ($configured && is_readable($root . 'vendor/autoload.php')) {
    require_once $root . 'vendor/autoload.php';
    try {
        if (!defined('PROJECT_PATH_ROOT')) {
            define('PROJECT_PATH_ROOT', $root);
        }
        if (!defined('PROJECT_PATH_SPECIFIC')) {
            define('PROJECT_PATH_SPECIFIC', $root . 'Specific/');
        }
        $config = \Symfony\Component\Yaml\Yaml::parseFile($configPath);
        $system = is_array($config['system'] ?? null) ? $config['system'] : [];
        if (!empty($system['files_enabled'])) {
            $fileConfig = new \Baikal\Core\Files\FileStorageConfig($config);
            $filesStorageReady = $fileConfig->isActive();
            if (!$filesStorageReady) {
                $status = 'degraded';
            }
        }
    } catch (\Throwable $e) {
        $filesStorageReady = false;
        $status = 'degraded';
    }
}

// Hint when mounts look ephemeral (do not fail liveness solely for this).
$persistenceWarning = null;
if ($configMount['mounted'] && $configMount['bindLikely'] === false) {
    $persistenceWarning = 'config mount looks like an anonymous volume; settings may reset on recreate';
} elseif ($specificMount['mounted'] && $specificMount['bindLikely'] === false) {
    $persistenceWarning = 'Specific mount looks like an anonymous volume; database may reset on recreate';
} elseif (!$configMount['mounted'] || !$specificMount['mounted']) {
    $persistenceWarning = 'config and/or Specific is not a mount; data may be lost on container recreate';
}

http_response_code($code);
echo json_encode([
    'status'        => $status,
    'name'          => 'AngaraDAV',
    'version'       => $version,
    'git'           => $git,
    'configured'    => $configured,
    'installLocked' => $installLocked,
    'configWritable' => $configWritable,
    'specificWritable' => $specificWritable,
    'configMount'   => $configMount,
    'specificMount' => $specificMount,
    'persistenceWarning' => $persistenceWarning,
    'filesStorageReady' => $filesStorageReady,
], JSON_UNESCAPED_SLASHES) . "\n";
