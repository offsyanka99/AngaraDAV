<?php

/**
 * Site root: send operators to portal (or installer when not configured).
 */

declare(strict_types=1);

ini_set('display_errors', '0');
ini_set('log_errors', '1');

define('BAIKAL_CONTEXT', true);
define('PROJECT_CONTEXT_BASEURI', '/');

if (file_exists(getcwd() . '/Core')) {
    define('PROJECT_PATH_ROOT', getcwd() . '/');
} else {
    define('PROJECT_PATH_ROOT', dirname(getcwd()) . '/');
}

$target = '/portal/';

// Prefer installer when config is missing or version skew needs the wizard
$configPath = PROJECT_PATH_ROOT . 'config/baikal.yaml';
if (!is_readable($configPath)) {
    $target = '/portal/install/';
} else {
    // Lightweight check without full framework bootstrap
    if (is_readable(PROJECT_PATH_ROOT . 'vendor/autoload.php')) {
        require PROJECT_PATH_ROOT . 'vendor/autoload.php';
        if (is_readable(PROJECT_PATH_ROOT . 'Core/Distrib.php')) {
            require_once PROJECT_PATH_ROOT . 'Core/Distrib.php';
        }
        try {
            $config = \Symfony\Component\Yaml\Yaml::parseFile($configPath);
            $sys = is_array($config['system'] ?? null) ? $config['system'] : [];
            $configured = (string) ($sys['configured_version'] ?? '');
            $product = defined('BAIKAL_VERSION') ? (string) BAIKAL_VERSION : '';
            $installDisabled = is_file(PROJECT_PATH_ROOT . 'Specific/INSTALL_DISABLED');
            if ($configured === '' || ($product !== '' && $configured !== $product) || !$installDisabled) {
                // Missing finish, upgrade pending, or reinstall open
                if ($configured === '' || !$installDisabled || ($product !== '' && $configured !== $product)) {
                    $target = '/portal/install/';
                }
            }
        } catch (\Throwable $e) {
            $target = '/portal/install/';
        }
    }
}

header('Location: ' . $target, true, 302);
header('Cache-Control: no-store');
echo 'Redirecting to <a href="' . htmlspecialchars($target, ENT_QUOTES, 'UTF-8') . '">' . htmlspecialchars($target, ENT_QUOTES, 'UTF-8') . '</a>.';
exit;
