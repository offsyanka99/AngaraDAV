<?php

/**
 * Cross-database checks for generic WebDAV file-home schema provisioning.
 *
 * Set BAIKAL_TEST_PGSQL_DSN to run the driver.
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Core\Files\FileStorageConfig;
use Baikal\Core\Files\HomeRepository;
use Baikal\Core\Files\HomeStorage;
use Baikal\Core\Files\SchemaManager;

$failures = 0;
$executed = 0;

function assert_true(bool $condition, string $message): void {
    global $failures;
    if ($condition) {
        echo "OK  $message\n";

        return;
    }
    echo "FAIL $message\n";
    ++$failures;
}

function test_driver(string $label, string $dsn, string $username, string $password): void {
    global $executed;
    ++$executed;

    $pdo = new PDO($dsn, $username, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    ]);
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS users ('
        . 'id INTEGER PRIMARY KEY, username VARCHAR(255) NOT NULL UNIQUE, digesta1 VARCHAR(64))'
    );
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS propertystorage ('
        . 'path VARCHAR(1024) NOT NULL, name VARCHAR(255) NOT NULL, valuetype INTEGER, value TEXT)'
    );
    $pdo->exec('CREATE TABLE IF NOT EXISTS locks (uri VARCHAR(1024) NOT NULL)');
    SchemaManager::ensure($pdo);
    SchemaManager::ensure($pdo);
    assert_true(SchemaManager::exists($pdo), "$label schema provisioning is idempotent");

    $storageId1 = bin2hex(random_bytes(16));
    $storageId2 = bin2hex(random_bytes(16));
    $userId = random_int(1000000000, 2000000000);
    $insert = $pdo->prepare(
        'INSERT INTO file_homes '
        . '(user_id, principaluri, storage_id, status, created_at, quarantined_at) '
        . 'VALUES (?, ?, ?, ?, ?, ?)'
    );

    try {
        $insert->execute([$userId, 'principals/schema-test', $storageId1, 'active', time(), null]);
        $quarantine = $pdo->prepare(
            "UPDATE file_homes SET user_id = NULL, status = 'quarantined', quarantined_at = ? "
            . 'WHERE storage_id = ?'
        );
        $quarantine->execute([time(), $storageId1]);
        $insert->execute([$userId, 'principals/schema-test', $storageId2, 'active', time(), null]);

        $count = $pdo->prepare('SELECT COUNT(*) FROM file_homes WHERE storage_id IN (?, ?)');
        $count->execute([$storageId1, $storageId2]);
        assert_true((int) $count->fetchColumn() === 2, "$label permits a fresh home after quarantine");
    } finally {
        $delete = $pdo->prepare('DELETE FROM file_homes WHERE storage_id IN (?, ?)');
        $delete->execute([$storageId1, $storageId2]);
    }

    $suffix = bin2hex(random_bytes(4));
    $owner = "\u{00E5}ke_" . $suffix;
    $neighbor = $owner . 'x';
    $ownerId = random_int(1000000000, 2000000000);
    $insertUser = $pdo->prepare('INSERT INTO users (id, username, digesta1) VALUES (?, ?, ?)');
    $insertUser->execute([$ownerId, $owner, str_repeat('0', 32)]);

    $storageRoot = sys_get_temp_dir() . '/baikal-schema-' . strtolower($label) . '-' . $suffix;
    $config = new FileStorageConfig([
        'system' => [
            'files_storage_path' => $storageRoot,
            'files_quarantine_days' => 0,
        ],
    ]);
    $config->prepareStorage();
    $repository = new HomeRepository($pdo, $config);

    try {
        $home = $repository->getOrCreateForPrincipal('principals/' . $owner);
        $homeStorage = new HomeStorage($config, (string) $home['storage_id']);
        $homeStorage->writeFile('private.txt', 'private', false);

        $insertProperty = $pdo->prepare(
            'INSERT INTO propertystorage (path, name, valuetype, value) VALUES (?, ?, ?, ?)'
        );
        $insertProperty->execute(['files/' . $owner . '/private.txt', '{urn:test}label', 1, 'owner']);
        $insertProperty->execute(['files/' . $neighbor . '/private.txt', '{urn:test}label', 1, 'neighbor']);
        $insertLock = $pdo->prepare('INSERT INTO locks (uri) VALUES (?)');
        $insertLock->execute(['files/' . $owner . '/private.txt']);
        $insertLock->execute(['files/' . $neighbor . '/private.txt']);

        $repository->quarantineUser($ownerId, 'principals/' . $owner);
        $ownerProperties = $pdo->prepare('SELECT COUNT(*) FROM propertystorage WHERE path = ?');
        $ownerProperties->execute(['files/' . $owner . '/private.txt']);
        $neighborProperties = $pdo->prepare('SELECT COUNT(*) FROM propertystorage WHERE path = ?');
        $neighborProperties->execute(['files/' . $neighbor . '/private.txt']);
        $ownerLocks = $pdo->prepare('SELECT COUNT(*) FROM locks WHERE uri = ?');
        $ownerLocks->execute(['files/' . $owner . '/private.txt']);
        $neighborLocks = $pdo->prepare('SELECT COUNT(*) FROM locks WHERE uri = ?');
        $neighborLocks->execute(['files/' . $neighbor . '/private.txt']);

        assert_true((int) $ownerProperties->fetchColumn() === 0, "$label removes Unicode owner properties");
        assert_true((int) $ownerLocks->fetchColumn() === 0, "$label removes Unicode owner locks");
        assert_true((int) $neighborProperties->fetchColumn() === 1, "$label preserves prefix-neighbor properties");
        assert_true((int) $neighborLocks->fetchColumn() === 1, "$label preserves prefix-neighbor locks");
    } finally {
        $deleteProperty = $pdo->prepare('DELETE FROM propertystorage WHERE path IN (?, ?)');
        $deleteProperty->execute(['files/' . $owner . '/private.txt', 'files/' . $neighbor . '/private.txt']);
        $deleteLock = $pdo->prepare('DELETE FROM locks WHERE uri IN (?, ?)');
        $deleteLock->execute(['files/' . $owner . '/private.txt', 'files/' . $neighbor . '/private.txt']);
        $deleteUser = $pdo->prepare('DELETE FROM users WHERE id = ?');
        $deleteUser->execute([$ownerId]);
        $repository->purgeExpiredQuarantine();
        @rmdir($config->homesPath());
        @rmdir($config->temporaryPath());
        @rmdir($config->quarantinePath());
        @rmdir($config->locksPath());
        @unlink($config->getStoragePath() . '/.active');
        @rmdir($config->getStoragePath());
    }
}

$pgsqlDsn = getenv('BAIKAL_TEST_PGSQL_DSN');
if ($pgsqlDsn !== false && $pgsqlDsn !== '') {
    test_driver(
        'PostgreSQL',
        $pgsqlDsn,
        getenv('BAIKAL_TEST_PGSQL_USER') ?: 'baikal',
        getenv('BAIKAL_TEST_PGSQL_PASSWORD') ?: 'baikal'
    );
}

if ($executed === 0) {
    echo "SKIP No PostgreSQL file-schema DSN configured.\n";
    exit(0);
}

if ($failures > 0) {
    fwrite(STDERR, "\n$failures failure(s)\n");
    exit(1);
}

echo "\nAll configured WebDAV file-schema driver tests passed.\n";
exit(0);
