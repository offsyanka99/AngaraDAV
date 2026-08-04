<?php

/**
 * Unit checks for Baikal\Portal\FileService (portal WebDAV files).
 *
 * Run: php tests/php/FileServiceTest.php
 * Requires: composer install and pdo_sqlite.
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Portal\ApiException;
use Baikal\Portal\FileService;

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

$temporaryRoot = sys_get_temp_dir() . '/baikal-portal-files-' . bin2hex(random_bytes(6));
@mkdir($temporaryRoot, 0700, true);

$pdo = new PDO('sqlite::memory:');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec('CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE, digesta1 TEXT NOT NULL)');
$pdo->exec("INSERT INTO users (username, digesta1) VALUES ('alice', 'hash')");

$configDisabled = [
    'system' => [
        'files_enabled'      => false,
        'files_storage_path' => $temporaryRoot,
    ],
];
$svcOff = new FileService($pdo, $configDisabled);
$statusOff = $svcOff->status('alice');
assert_true($statusOff['enabled'] === false, 'status reports disabled when files_enabled is false');
assert_true($statusOff['ready'] === false, 'status not ready when disabled');
assert_true(str_contains($statusOff['davPath'], 'alice'), 'davPath includes username when disabled');

try {
    $svcOff->listEntries('alice', '');
    assert_true(false, 'listEntries should fail when disabled');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 503, 'listEntries → 503 when disabled');
}

$config = [
    'system' => [
        'files_enabled'          => true,
        'files_storage_path'     => $temporaryRoot,
        'files_max_upload_bytes' => 1024 * 1024,
        'files_quota_bytes'      => 10 * 1024 * 1024,
        'files_quarantine_days'  => 30,
    ],
];
$svc = new FileService($pdo, $config);

$status = $svc->status('alice');
assert_true($status['enabled'] === true, 'status enabled when files_enabled is true');
assert_true($status['ready'] === true, 'status ready after init');
assert_true($status['maxUploadBytes'] === 1024 * 1024, 'max upload bytes reported');
assert_true($status['quotaBytes'] === 10 * 1024 * 1024, 'quota bytes reported');
assert_true(str_contains($status['davPath'], '/dav.php/files/alice/'), 'davPath is WebDAV home URL');

$list = $svc->listEntries('alice', '');
assert_true($list['path'] === '', 'root path is empty string');
assert_true($list['entries'] === [], 'new home is empty');

$dir = $svc->createDirectory('alice', '', 'docs');
assert_true($dir['type'] === 'dir' && $dir['path'] === 'docs', 'mkdir creates docs/');

$written = $svc->writeFile('alice', 'docs', 'hello.txt', "hello portal\n", false);
assert_true($written['path'] === 'docs/hello.txt', 'upload path docs/hello.txt');
assert_true($written['size'] === strlen("hello portal\n"), 'upload size matches');
assert_true(is_string($written['etag']) && $written['etag'] !== '', 'etag present');

$listDocs = $svc->listEntries('alice', 'docs');
assert_true(count($listDocs['entries']) === 1, 'docs contains one entry');
assert_true($listDocs['entries'][0]['name'] === 'hello.txt', 'entry name hello.txt');
assert_true($listDocs['entries'][0]['type'] === 'file', 'entry is file');

$meta = $svc->openDownload('alice', 'docs/hello.txt');
assert_true(is_file($meta['absolutePath']), 'download absolute path is a file');
assert_true(file_get_contents($meta['absolutePath']) === "hello portal\n", 'download contents match');
assert_true($meta['name'] === 'hello.txt', 'download basename');

$renamed = $svc->rename('alice', 'docs/hello.txt', 'hi.txt');
assert_true($renamed['path'] === 'docs/hi.txt', 'rename within folder');

$svc->createDirectory('alice', '', 'archive');
$moved = $svc->move('alice', 'docs/hi.txt', 'archive');
assert_true($moved['path'] === 'archive/hi.txt', 'move into archive/');

$listArchive = $svc->listEntries('alice', 'archive');
assert_true(count($listArchive['entries']) === 1 && $listArchive['entries'][0]['name'] === 'hi.txt', 'archive has hi.txt');

$svc->delete('alice', 'archive/hi.txt');
$listArchive2 = $svc->listEntries('alice', 'archive');
assert_true($listArchive2['entries'] === [], 'file deleted');

try {
    $svc->delete('alice', '');
    assert_true(false, 'delete root should fail');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 403, 'delete root → 403');
}

try {
    $svc->listEntries('alice', 'no-such-folder');
    assert_true(false, 'missing folder should 404');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 404, 'missing folder → 404');
}

// Path traversal rejected
try {
    $svc->listEntries('alice', '../etc');
    assert_true(false, 'path traversal should fail');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 400, 'path traversal → 400');
}

// Create with replace=true must still create (portal always sends replace)
$createdWithReplace = $svc->writeFile('alice', 'archive', 'new-via-replace.txt', "fresh\n", true);
assert_true($createdWithReplace['path'] === 'archive/new-via-replace.txt', 'create with replace=true works for new file');

// Overwrite existing file
$svc->writeFile('alice', 'archive', 'note.txt', 'v1', false);
try {
    $svc->writeFile('alice', 'archive', 'note.txt', 'nope', false);
    assert_true(false, 'create without replace should conflict when file exists');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 409, 'duplicate without replace → 409');
}
$again = $svc->writeFile('alice', 'archive', 'note.txt', 'v2-longer', true);
assert_true($again['size'] === strlen('v2-longer'), 'overwrite updates size');
$meta2 = $svc->openDownload('alice', 'archive/note.txt');
assert_true(file_get_contents($meta2['absolutePath']) === 'v2-longer', 'overwrite content');

$status2 = $svc->status('alice');
assert_true($status2['usedBytes'] >= strlen('v2-longer'), 'used bytes includes file');

// Copy file in same folder with unique name
$copied = $svc->copy('alice', 'archive/note.txt');
assert_true($copied['name'] === 'note (copy).txt', 'copy names note (copy).txt');
assert_true($copied['path'] === 'archive/note (copy).txt', 'copy path under archive/');
$metaCopy = $svc->openDownload('alice', 'archive/note (copy).txt');
assert_true(file_get_contents($metaCopy['absolutePath']) === 'v2-longer', 'copy has same contents');

// Copy directory tree
$svc->createDirectory('alice', 'archive', 'nested');
$svc->writeFile('alice', 'archive/nested', 'leaf.txt', "leaf\n", false);
$dirCopy = $svc->copy('alice', 'archive/nested');
assert_true($dirCopy['type'] === 'dir', 'directory copy type is dir');
assert_true($dirCopy['name'] === 'nested (copy)', 'directory copy name');
$listNested = $svc->listEntries('alice', $dirCopy['path']);
assert_true(count($listNested['entries']) === 1 && $listNested['entries'][0]['name'] === 'leaf.txt', 'copied tree has leaf');

// Bulk copy + delete
$bulkCopy = $svc->bulk('alice', 'copy', ['archive/note.txt', 'archive/new-via-replace.txt']);
assert_true($bulkCopy['ok'] === 2 && $bulkCopy['failed'] === 0, 'bulk copy two files');
$bulkDel = $svc->bulk('alice', 'delete', ['archive/new-via-replace.txt']);
assert_true($bulkDel['ok'] === 1, 'bulk delete one file');

remove_tree($temporaryRoot);

if ($failures > 0) {
    echo "\n$failures failure(s)\n";
    exit(1);
}
echo "\nAll FileService checks passed.\n";
exit(0);
