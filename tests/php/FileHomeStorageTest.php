<?php

/**
 * Unit checks for private generic WebDAV file homes.
 *
 * Run: php tests/php/FileHomeStorageTest.php
 * Requires: composer install and pdo_sqlite.
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Core\Files\Directory;
use Baikal\Core\Files\FileStorageConfig;
use Baikal\Core\Files\HomeRepository;
use Baikal\Core\Files\HomeStorage;
use Baikal\Core\Files\PayloadTooLarge;
use Baikal\Core\Files\SchemaManager;
use Sabre\DAV\Exception\Forbidden;
use Sabre\DAV\Exception\InsufficientStorage;

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

function remove_tree(string $path): void {
    if (is_link($path) || is_file($path)) {
        @unlink($path);

        return;
    }
    if (!is_dir($path)) {
        return;
    }
    $iterator = new FilesystemIterator($path, FilesystemIterator::CURRENT_AS_FILEINFO | FilesystemIterator::SKIP_DOTS);
    foreach ($iterator as $entry) {
        remove_tree($entry->getPathname());
    }
    @rmdir($path);
}

$temporaryRoot = sys_get_temp_dir() . '/baikal-files-test-' . bin2hex(random_bytes(6));
$rootRejected = false;
try {
    $rootConfig = new FileStorageConfig([
        'system' => ['files_storage_path' => DIRECTORY_SEPARATOR],
    ]);
    $rootConfig->prepareStorage();
} catch (RuntimeException $e) {
    $rootRejected = true;
}
assert_true($rootRejected, 'filesystem root is rejected before storage preparation');

$symlinkTarget = sys_get_temp_dir() . '/baikal-files-target-' . bin2hex(random_bytes(6));
$symlinkPath = sys_get_temp_dir() . '/baikal-files-link-' . bin2hex(random_bytes(6));
mkdir($symlinkTarget, 0755);
if (function_exists('symlink') && @symlink($symlinkTarget, $symlinkPath)) {
    $symlinkRejected = false;
    try {
        $symlinkConfig = new FileStorageConfig([
            'system' => ['files_storage_path' => $symlinkPath],
        ]);
        $symlinkConfig->prepareStorage();
    } catch (RuntimeException $e) {
        $symlinkRejected = true;
    }
    assert_true($symlinkRejected, 'symlinked storage path is rejected before mutation');
    assert_true(!is_dir($symlinkTarget . '/homes'), 'symlink target remains unmodified');
    @unlink($symlinkPath);
}
@rmdir($symlinkTarget);

$config = new FileStorageConfig([
    'system' => [
        'files_enabled'          => true,
        'files_storage_path'     => $temporaryRoot,
        'files_max_upload_mb'    => 1,
        'files_quota_bytes'      => 10,
        'files_quarantine_days'  => 30,
    ],
]);
$config->prepareStorage();
assert_true($config->isStorageReady(), 'prepared storage reports ready');
assert_true(!$config->isActive(), 'storage is not active before backend initialization');
$config->markActive();
assert_true($config->isActive(), 'backend activation marker is reported');

$storageId = bin2hex(random_bytes(16));
$storage = new HomeStorage($config, $storageId);
$etag1 = $storage->writeFile('hello.txt', 'hello', false);
assert_true(file_get_contents($storage->getPath('hello.txt')) === 'hello', 'new file is written');
assert_true($storage->usage() === 5, 'usage counts stored file bytes');

$etag2 = $storage->writeFile('hello.txt', 'world', true);
assert_true($etag2 !== $etag1, 'atomic overwrite changes the ETag');
assert_true(file_get_contents($storage->getPath('hello.txt')) === 'world', 'overwrite replaces content');

$storage->createDirectory('docs');
$storage->writeFile('docs/note.txt', '12345', false);
assert_true($storage->usage() === 10, 'nested files count toward quota');

$quotaRejected = false;
try {
    $storage->writeFile('over-quota.txt', 'x', false);
} catch (InsufficientStorage $e) {
    $quotaRejected = true;
}
assert_true($quotaRejected, 'quota overflow returns insufficient storage');
assert_true(!file_exists($storage->getPath('over-quota.txt')), 'quota failure leaves no visible file');

$largeRejected = false;
try {
    $storage->writeFile('hello.txt', str_repeat('x', 1048577), true);
} catch (PayloadTooLarge $e) {
    $largeRejected = $e->getHTTPCode() === 413;
}
assert_true($largeRejected, 'maximum file size returns HTTP 413');
assert_true(file_get_contents($storage->getPath('hello.txt')) === 'world', 'failed overwrite preserves old content');

$storage->rename('docs/note.txt', 'docs/renamed.txt');
assert_true(file_exists($storage->getPath('docs/renamed.txt')), 'file rename stays within the home');
$storage->delete('docs');
assert_true(!file_exists($storage->getPath('docs')), 'directory delete removes its subtree');

$unsafeRejected = false;
try {
    $storage->childPath('', '../outside');
} catch (Forbidden $e) {
    $unsafeRejected = true;
}
assert_true($unsafeRejected, 'unsafe resource names are rejected');

if (function_exists('symlink') && @symlink('/etc/passwd', $storage->getPath('leak'))) {
    assert_true(!$storage->isVisibleChild('leak'), 'symbolic links are hidden');
    @unlink($storage->getPath('leak'));
}

$acl = [[
    'principal' => '{DAV:}owner',
    'privilege' => '{DAV:}all',
    'protected' => true,
]];
$homeNode = new Directory($storage, '', $acl, 'principals/alice', true);
assert_true($homeNode->getName() === 'alice', 'DAV home name does not expose physical storage ID');
$quotaInfo = $homeNode->getQuotaInfo();
assert_true($quotaInfo[0] === 5 && $quotaInfo[1] === 5, 'DAV quota reports used and available bytes');

// Home metadata is stable for an account and non-reusable after quarantine.
$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec('CREATE TABLE users (id INTEGER PRIMARY KEY ASC, username TEXT NOT NULL UNIQUE)');
$pdo->exec('CREATE TABLE propertystorage (path TEXT NOT NULL)');
$pdo->exec('CREATE TABLE locks (uri TEXT NOT NULL)');
$pdo->exec("INSERT INTO users (username) VALUES ('alice')");
SchemaManager::ensure($pdo);
SchemaManager::ensure($pdo);

$repository = new HomeRepository($pdo, $config);
$home1 = $repository->getOrCreateForPrincipal('principals/alice');
$home1Again = $repository->getOrCreateForPrincipal('principals/alice');
assert_true($home1['storage_id'] === $home1Again['storage_id'], 'home identity is stable for an account');

$oldStorage = new HomeStorage($config, (string) $home1['storage_id']);
$oldStorage->writeFile('private.txt', 'old', false);
$pdo->exec("INSERT INTO propertystorage (path) VALUES ('files/alice/private.txt')");
$pdo->exec("INSERT INTO locks (uri) VALUES ('files/alice/private.txt')");
$pdo->exec("INSERT INTO propertystorage (path) VALUES ('files/alicia/must-remain.txt')");
$pdo->exec("INSERT INTO locks (uri) VALUES ('files/alicia/must-remain.txt')");
$repository->quarantineUser(1, 'principals/alice');
assert_true(
    is_file($config->quarantinedHomePath((string) $home1['storage_id']) . '/private.txt'),
    'deleted account home is moved to quarantine'
);
assert_true(
    !is_dir($config->homeTemporaryPath((string) $home1['storage_id'])),
    'deleted account temporary directory is removed'
);
assert_true(
    !file_exists($config->homeLockPath((string) $home1['storage_id'])),
    'deleted account mutation lock is removed'
);
assert_true((int) $pdo->query("SELECT COUNT(*) FROM propertystorage WHERE path LIKE 'files/alice/%'")->fetchColumn() === 0, 'file properties are removed on quarantine');
assert_true((int) $pdo->query("SELECT COUNT(*) FROM locks WHERE uri LIKE 'files/alice/%'")->fetchColumn() === 0, 'file locks are removed on quarantine');
assert_true((int) $pdo->query("SELECT COUNT(*) FROM propertystorage WHERE path = 'files/alicia/must-remain.txt'")->fetchColumn() === 1, 'property cleanup does not cross username prefix boundary');
assert_true((int) $pdo->query("SELECT COUNT(*) FROM locks WHERE uri = 'files/alicia/must-remain.txt'")->fetchColumn() === 1, 'lock cleanup does not cross username prefix boundary');

$pdo->exec("INSERT INTO users (username) VALUES ('\u{00E5}ke')");
$unicodeUserId = (int) $pdo->query("SELECT id FROM users WHERE username = '\u{00E5}ke'")->fetchColumn();
$unicodeHome = $repository->getOrCreateForPrincipal("principals/\u{00E5}ke");
$unicodeStorage = new HomeStorage($config, (string) $unicodeHome['storage_id']);
$unicodeStorage->writeFile('private.txt', 'utf8', false);
$pdo->exec("INSERT INTO propertystorage (path) VALUES ('files/\u{00E5}ke/private.txt')");
$repository->quarantineUser($unicodeUserId, "principals/\u{00E5}ke");
assert_true((int) $pdo->query("SELECT COUNT(*) FROM propertystorage WHERE path = 'files/\u{00E5}ke/private.txt'")->fetchColumn() === 0, 'Unicode username property cleanup is character-safe');

$pdo->exec("DELETE FROM users WHERE username = 'alice'");
$pdo->exec("INSERT INTO users (username) VALUES ('alice')");
$home2 = $repository->getOrCreateForPrincipal('principals/alice');
assert_true($home2['storage_id'] !== $home1['storage_id'], 'recreated username receives a new physical home');

$purgeConfig = new FileStorageConfig([
    'system' => [
        'files_enabled'          => true,
        'files_storage_path'     => $temporaryRoot,
        'files_max_upload_mb'    => 1,
        'files_quota_bytes'      => 10,
        'files_quarantine_days'  => 0,
    ],
]);
$purgeConfig->prepareStorage();
$maintenance = new HomeRepository($pdo, $purgeConfig);
assert_true($maintenance->purgeExpiredQuarantine() === 2, 'expired quarantined homes are purged');
assert_true(
    !file_exists($purgeConfig->quarantinedHomePath((string) $home1['storage_id'])),
    'quarantine purge removes physical file bytes'
);
assert_true(
    !file_exists($purgeConfig->quarantinedHomePath((string) $unicodeHome['storage_id'])),
    'quarantine purge removes Unicode account file bytes'
);

$orphanDirectory = $purgeConfig->temporaryPath() . '/orphan';
mkdir($orphanDirectory, 0700);
$orphanFile = $orphanDirectory . '/abandoned.upload';
file_put_contents($orphanFile, 'partial');
touch($orphanFile, time() - 7200);
assert_true($maintenance->cleanupTemporaryFiles(3600) === 1, 'abandoned temporary upload is removed');

remove_tree($temporaryRoot);

if ($failures > 0) {
    fwrite(STDERR, "\n$failures failure(s)\n");
    exit(1);
}

echo "\nAll WebDAV file-home tests passed.\n";
exit(0);
