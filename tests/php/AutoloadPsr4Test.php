<?php

/**
 * Composer autoload is PSR-4 for Baikal\ and has no BaikalAdmin prefix.
 *
 * Run: php tests/php/AutoloadPsr4Test.php
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

$composerPath = $root . '/composer.json';
$raw = file_get_contents($composerPath);
assert_true(is_string($raw), 'composer.json is readable');
$composer = is_string($raw) ? json_decode($raw, true) : null;
assert_true(is_array($composer), 'composer.json is JSON');

$autoload = is_array($composer) && isset($composer['autoload']) && is_array($composer['autoload'])
    ? $composer['autoload']
    : [];
$psr4 = isset($autoload['psr-4']) && is_array($autoload['psr-4']) ? $autoload['psr-4'] : [];

assert_true(!array_key_exists('psr-0', $autoload), 'autoload.psr-0 is absent');
assert_true(($psr4['Baikal\\'] ?? '') === 'Core/Frameworks/Baikal/', 'Baikal\\ maps to Core/Frameworks/Baikal/');
assert_true(!array_key_exists('BaikalAdmin\\', $psr4) && !array_key_exists('BaikalAdmin', $psr4), 'autoload has no BaikalAdmin key');

require $root . '/vendor/autoload.php';

$classes = [
    'Baikal\\Framework' => 'Core/Frameworks/Baikal/Framework.php',
    'Baikal\\Core\\Server' => 'Core/Frameworks/Baikal/Core/Server.php',
    'Baikal\\Core\\Files\\FileStorageConfig' => 'Core/Frameworks/Baikal/Core/Files/FileStorageConfig.php',
    'Baikal\\Core\\Plugins\\Push\\QueueStorage' => 'Core/Frameworks/Baikal/Core/Plugins/Push/QueueStorage.php',
    'Baikal\\Model\\Config' => 'Core/Frameworks/Baikal/Model/Config.php',
    'Baikal\\Portal\\App' => 'Core/Frameworks/Baikal/Portal/App.php',
    'Baikal\\Portal\\Admin\\AdminDashboardService' => 'Core/Frameworks/Baikal/Portal/Admin/AdminDashboardService.php',
];

foreach ($classes as $class => $relative) {
    assert_true(class_exists($class), $class . ' resolves');
    $file = (new ReflectionClass($class))->getFileName();
    assert_true(
        is_string($file) && str_ends_with(str_replace('\\', '/', $file), $relative),
        $class . ' loads from ' . $relative
    );
}

assert_true(!class_exists('BaikalAdmin\\Anything'), 'BaikalAdmin\\Anything does not resolve');

if ($failures > 0) {
    echo "\n$failures failure(s)\n";
    exit(1);
}

echo "\nAll PSR-4 autoload tests passed.\n";
exit(0);
