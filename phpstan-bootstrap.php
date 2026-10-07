<?php

declare(strict_types=1);

/**
 * Constants Bootstrap defines at runtime. PHPStan does not execute that path.
 */
$root = __DIR__ . '/';
define('PROJECT_PATH_ROOT', $root);
define('PROJECT_PATH_CORE', $root . 'Core/');
define('PROJECT_PATH_CORERESOURCES', $root . 'Core/Resources/');
define('PROJECT_PATH_CONFIG', $root . 'config/');
define('PROJECT_PATH_SPECIFIC', $root . 'Specific/');
define('PROJECT_PATH_DOCUMENTROOT', $root . 'html/');
define('PROJECT_PATH_WWWROOT', $root . 'Core/WWWRoot/');
