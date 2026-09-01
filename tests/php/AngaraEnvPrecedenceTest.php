<?php

/**
 * Unit checks for the ANGARA_* > (existing unprefixed var, where applicable) >
 * YAML/default env precedence introduced by the Baikal→Angara
 * runtime-variable migration (docs/baikal-to-angara-migration-plan.md, Phase 2).
 *
 * Run: php tests/php/AngaraEnvPrecedenceTest.php
 * Requires: composer install and pdo_sqlite.
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Core\Files\FileStorageConfig;
use Baikal\Portal\AdminAuth;

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
 * Run $fn with the given env vars set (string value) or unset (null), then
 * restore prior state (including $_ENV/$_SERVER superglobals FileStorageConfig
 * and AdminAuth do not read, but which some frameworks mirror getenv() from).
 *
 * @param array<string, string|null> $vars
 */
function with_env(array $vars, callable $fn): void {
    $backup = [];
    foreach ($vars as $k => $v) {
        $prev = getenv($k);
        $backup[$k] = $prev === false ? null : $prev;
        if ($v === null) {
            putenv($k);
            unset($_ENV[$k], $_SERVER[$k]);
        } else {
            putenv("$k=$v");
        }
    }

    try {
        $fn();
    } finally {
        foreach ($backup as $k => $prev) {
            if ($prev === null) {
                putenv($k);
                unset($_ENV[$k], $_SERVER[$k]);
            } else {
                putenv("$k=$prev");
            }
        }
    }
}

// --- FileStorageConfig: storage path ---

with_env([
    'ANGARA_FILES_STORAGE_PATH' => '/angara/wins',
], function () {
    $config = new FileStorageConfig(['system' => ['files_storage_path' => '/yaml/loses']]);
    assert_true($config->getStoragePath() === '/angara/wins', 'files storage path: ANGARA_* wins over YAML');
});

// --- FileStorageConfig: MB-based upload limit ---

with_env([
    'ANGARA_FILES_MAX_UPLOAD_MB' => '5',
], function () {
    $config = new FileStorageConfig(['system' => ['files_storage_path' => '/tmp']]);
    assert_true($config->getMaxUploadBytes() === 5 * 1048576, 'max upload MB: ANGARA_* env wins over YAML');
});

// --- FileStorageConfig: MB setting still takes precedence over legacy byte setting ---

with_env([
    'ANGARA_FILES_MAX_UPLOAD_MB' => null,
    'ANGARA_FILES_MAX_UPLOAD_BYTES' => '2097152',
], function () {
    $config = new FileStorageConfig(['system' => ['files_storage_path' => '/tmp']]);
    assert_true($config->getMaxUploadBytes() === 2097152, 'max upload bytes (legacy path): used only when no MB setting present');
});

// --- FileStorageConfig: quota ---

with_env([
    'ANGARA_FILES_QUOTA_MB' => '100',
], function () {
    $config = new FileStorageConfig(['system' => ['files_storage_path' => '/tmp']]);
    assert_true($config->getQuotaBytes() === 100 * 1048576, 'quota MB: ANGARA_* env wins over YAML');
});

// --- PushLogger: ANGARA_PUSH_LOG_LEVEL wins over PUSH_LOG_LEVEL ---

with_env([
    'ANGARA_PUSH_LOG_LEVEL' => 'debug',
    'PUSH_LOG_LEVEL' => 'error',
], function () {
    $logger = new \Baikal\Core\Plugins\Push\PushLogger('off', '');
    assert_true($logger->isEnabled('debug'), 'PushLogger: ANGARA_PUSH_LOG_LEVEL wins over PUSH_LOG_LEVEL');
});

// --- AdminAuth: ANGARA_PORTAL_ADMIN_USERS wins over PORTAL_ADMIN_USERS ---

with_env([
    'ANGARA_PORTAL_ADMIN_USERS' => 'zoe',
    'PORTAL_ADMIN_USERS' => 'frank',
], function () {
    $config = ['system' => ['portal_admin_users' => ['bob']]];
    assert_true(AdminAuth::userIsAdmin('zoe', $config) === true, 'AdminAuth: ANGARA_PORTAL_ADMIN_USERS wins over PORTAL_ADMIN_USERS');
    assert_true(AdminAuth::userIsAdmin('frank', $config) === false, 'AdminAuth: legacy env ignored once ANGARA_PORTAL_ADMIN_USERS is set');
});

// --- Install lock: ANGARA_LOCK_INSTALL / ANGARA_ALLOW_REINSTALL boolean-flag precedence ---
// Regression test: an explicit "0" must not be treated as unset by envFlagIsOne().

function invoke_env_flag_is_one(string $class, string $angaraKey): bool {
    $method = new \ReflectionMethod($class, 'envFlagIsOne');
    $method->setAccessible(true);

    return $method->invoke(null, $angaraKey);
}

foreach (['Baikal\Portal\Install\InstallService', 'Baikal\Portal\Admin\AdminSettingsService'] as $class) {
    with_env([
        'ANGARA_LOCK_INSTALL' => '0',
    ], function () use ($class) {
        assert_true(
            invoke_env_flag_is_one($class, 'ANGARA_LOCK_INSTALL') === false,
            "$class::envFlagIsOne: explicit ANGARA_LOCK_INSTALL=0 is honoured"
        );
    });

    with_env([
        'ANGARA_ALLOW_REINSTALL' => '1',
    ], function () use ($class) {
        assert_true(
            invoke_env_flag_is_one($class, 'ANGARA_ALLOW_REINSTALL') === true,
            "$class::envFlagIsOne: explicit ANGARA_ALLOW_REINSTALL=1 is honoured"
        );
    });

    with_env([
        'ANGARA_LOCK_INSTALL' => null,
    ], function () use ($class) {
        assert_true(
            invoke_env_flag_is_one($class, 'ANGARA_LOCK_INSTALL') === false,
            "$class::envFlagIsOne: unset ANGARA_LOCK_INSTALL is not locked"
        );
    });
}

if ($failures > 0) {
    echo "\n$failures assertion(s) FAILED.\n";
    exit(1);
}

echo "\nAll ANGARA env precedence tests passed.\n";
