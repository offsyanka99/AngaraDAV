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

use Baikal\Core\Files\File;
use Baikal\Core\Files\FileStorageConfig;
use Baikal\Core\Files\HomeRepository;
use Baikal\Core\Files\HomeStorage;
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
$pdo->exec('CREATE TABLE propertystorage (path TEXT NOT NULL)');
$pdo->exec('CREATE TABLE locks (uri TEXT NOT NULL)');
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
assert_true($statusOff['trashDays'] === 0, 'disabled status reports trashDays 0');
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
        'files_max_upload_mb'    => 1,
        'files_quota_mb'         => 10,
        'files_quarantine_days'  => 30,
    ],
];
$svc = new FileService($pdo, $config);

$status = $svc->status('alice');
assert_true($status['enabled'] === true, 'status enabled when files_enabled is true');
assert_true($status['ready'] === true, 'status ready after init');
assert_true($status['maxUploadBytes'] === 1024 * 1024, 'max upload bytes reported');
assert_true($status['quotaBytes'] === 10 * 1024 * 1024, 'quota bytes reported');
assert_true($status['trashDays'] === 30, 'trash retention defaults to 30 days');
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

assert_true(
    FileService::contentTypeForInline('notes.html', 'text/html') === 'text/plain; charset=utf-8',
    'inline HTML is forced to text/plain'
);
assert_true(
    FileService::contentTypeForInline('icon.svg', 'image/svg+xml') === 'text/plain; charset=utf-8',
    'inline SVG is forced to text/plain'
);
assert_true(
    FileService::contentTypeForInline('photo.jpg', 'application/octet-stream') === 'image/jpeg',
    'inline JPEG uses extension when detection is generic'
);
assert_true(
    FileService::contentTypeForInline('report.pdf', 'application/pdf') === 'application/pdf',
    'inline PDF keeps application/pdf'
);
assert_true(
    FileService::contentTypeForInline('blob.bin', 'application/octet-stream') === 'application/octet-stream',
    'inline unknown stays octet-stream'
);

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

// Cross-folder copy keeps the original name (no " (copy)" when free)
$svc->createDirectory('alice', '', 'inbox');
$cross = $svc->copy('alice', 'archive/note.txt', 'inbox');
assert_true($cross['name'] === 'note.txt', 'cross-folder copy keeps original name');
assert_true($cross['path'] === 'inbox/note.txt', 'cross-folder copy path is inbox/note.txt');
$metaCross = $svc->openDownload('alice', 'inbox/note.txt');
assert_true(file_get_contents($metaCross['absolutePath']) === 'v2-longer', 'cross-folder copy has same contents');

// Cross-folder copy when destination name exists → unique " (copy)" only then
$cross2 = $svc->copy('alice', 'archive/note.txt', 'inbox');
assert_true($cross2['name'] === 'note (copy).txt', 'cross-folder name collision uses (copy)');
assert_true($cross2['path'] === 'inbox/note (copy).txt', 'collision path under inbox/');

// Copy directory tree (same folder → " (copy)")
$svc->createDirectory('alice', 'archive', 'nested');
$svc->writeFile('alice', 'archive/nested', 'leaf.txt', "leaf\n", false);
$dirCopy = $svc->copy('alice', 'archive/nested');
assert_true($dirCopy['type'] === 'dir', 'directory copy type is dir');
assert_true($dirCopy['name'] === 'nested (copy)', 'directory copy name');
$listNested = $svc->listEntries('alice', $dirCopy['path']);
assert_true(count($listNested['entries']) === 1 && $listNested['entries'][0]['name'] === 'leaf.txt', 'copied tree has leaf');

// Directory cross-folder copy keeps original name
$svc->createDirectory('alice', '', 'export');
$dirCross = $svc->copy('alice', 'archive/nested', 'export');
assert_true($dirCross['name'] === 'nested', 'cross-folder dir copy keeps name');
assert_true($dirCross['path'] === 'export/nested', 'cross-folder dir path');

// Bulk copy + delete
$bulkCopy = $svc->bulk('alice', 'copy', ['archive/note.txt', 'archive/new-via-replace.txt']);
assert_true($bulkCopy['ok'] === 2 && $bulkCopy['failed'] === 0, 'bulk copy two files');
$bulkDel = $svc->bulk('alice', 'delete', ['archive/new-via-replace.txt']);
assert_true($bulkDel['ok'] === 1, 'bulk delete one file');

/**
 * @param list<array<string, mixed>> $items
 *
 * @return array<string, mixed>|null
 */
function trash_named(array $items, string $path): ?array {
    foreach ($items as $item) {
        if (($item['path'] ?? '') === $path) {
            return $item;
        }
    }

    return null;
}

$svc->writeFile('alice', 'docs', 'hello.txt', "hello portal\n", false);
$svc->delete('alice', 'docs/hello.txt');
$docsAfterDelete = $svc->listEntries('alice', 'docs');
$docsNames = array_column($docsAfterDelete['entries'], 'name');
assert_true(!in_array('hello.txt', $docsNames, true), 'trashed file leaves the folder');
$trashedHello = trash_named($svc->listTrash('alice')['items'], 'docs/hello.txt');
assert_true($trashedHello !== null && $trashedHello['directory'] === false, 'trashed file is listed');
assert_true((int) $trashedHello['expiresAt'] > (int) $trashedHello['deletedAt'], 'trash expiry is after deletion');
$restoredHello = $svc->restoreTrash('alice', (int) $trashedHello['id']);
assert_true($restoredHello['path'] === 'docs/hello.txt' && $restoredHello['renamed'] === false, 'restore returns the original path');
$helloMeta = $svc->openDownload('alice', 'docs/hello.txt');
assert_true(file_get_contents($helloMeta['absolutePath']) === "hello portal\n", 'restored file contents match');

$svc->delete('alice', 'docs/hello.txt');
$svc->writeFile('alice', 'docs', 'hello.txt', "newer\n", false);
$clash = trash_named($svc->listTrash('alice')['items'], 'docs/hello.txt');
assert_true($clash !== null, 'name clash still has a trash row');
$restoredClash = $svc->restoreTrash('alice', (int) $clash['id']);
assert_true($restoredClash['renamed'] === true, 'restore renames when the original name is taken');
assert_true($restoredClash['name'] === 'hello (restored).txt', 'restore suffix is (restored)');
$keptMeta = $svc->openDownload('alice', 'docs/hello.txt');
$suffixMeta = $svc->openDownload('alice', 'docs/hello (restored).txt');
assert_true(file_get_contents($keptMeta['absolutePath']) === "newer\n", 'existing file stays in place');
assert_true(file_get_contents($suffixMeta['absolutePath']) === "hello portal\n", 'restored copy keeps its contents');

$svc->createDirectory('alice', '', 'box');
$svc->writeFile('alice', 'box', 'inside.txt', "in\n", false);
$svc->delete('alice', 'box');
try {
    $svc->listEntries('alice', 'box');
    assert_true(false, 'trashed folder should be missing');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 404, 'trashed folder → 404');
}
$boxRows = array_values(array_filter(
    $svc->listTrash('alice')['items'],
    static function (array $item): bool {
        return $item['path'] === 'box';
    }
));
assert_true(count($boxRows) === 1 && $boxRows[0]['directory'] === true, 'folder delete is one trash row');
$restoredBox = $svc->restoreTrash('alice', (int) $boxRows[0]['id']);
assert_true($restoredBox['path'] === 'box' && $restoredBox['renamed'] === false, 'folder restores to its original path');
$boxList = $svc->listEntries('alice', 'box');
assert_true(count($boxList['entries']) === 1 && $boxList['entries'][0]['name'] === 'inside.txt', 'restored folder keeps its contents');

$svc->createDirectory('alice', '', 'restore-parent');
$svc->writeFile('alice', 'restore-parent', 'leaf.txt', "leaf\n", false);
$svc->delete('alice', 'restore-parent/leaf.txt');
$svc->delete('alice', 'restore-parent');
$leaf = trash_named($svc->listTrash('alice')['items'], 'restore-parent/leaf.txt');
assert_true($leaf !== null, 'file inside a later-deleted folder stays its own trash row');
$restoredLeaf = $svc->restoreTrash('alice', (int) $leaf['id']);
assert_true($restoredLeaf['path'] === 'restore-parent/leaf.txt', 'restore recreates a missing parent folder');
$leafMeta = $svc->openDownload('alice', 'restore-parent/leaf.txt');
assert_true(file_get_contents($leafMeta['absolutePath']) === "leaf\n", 'file restored under the recreated folder');

$svc->writeFile('alice', '', 'perm.txt', 'zz', false);
$usedBeforePerm = $svc->status('alice')['usedBytes'];
$svc->delete('alice', 'perm.txt');
assert_true($svc->status('alice')['usedBytes'] === $usedBeforePerm, 'trash keeps the file in the quota');
$perm = trash_named($svc->listTrash('alice')['items'], 'perm.txt');
assert_true($perm !== null, 'permanent-delete target is in trash');
$svc->deleteTrash('alice', (int) $perm['id']);
assert_true(trash_named($svc->listTrash('alice')['items'], 'perm.txt') === null, 'delete now removes the trash row');
assert_true($svc->status('alice')['usedBytes'] === $usedBeforePerm - 2, 'delete now frees the quota bytes');

$svc->writeFile('alice', '', 'empty-a.txt', 'aa', false);
$svc->writeFile('alice', '', 'empty-b.txt', 'bbb', false);
$svc->delete('alice', 'empty-a.txt');
$svc->delete('alice', 'empty-b.txt');
$usedBeforeEmpty = $svc->status('alice')['usedBytes'];
$emptied = $svc->emptyTrash('alice');
assert_true($emptied['removed'] >= 2, 'empty trash removes the rows');
assert_true($svc->listTrash('alice')['items'] === [], 'empty trash clears the list');
assert_true($svc->status('alice')['usedBytes'] < $usedBeforeEmpty, 'empty trash frees quota bytes');

$svc->writeFile('alice', '', 'old-trash.txt', 'old', false);
$svc->delete('alice', 'old-trash.txt');
$svc->writeFile('alice', '', 'fresh-trash.txt', 'new', false);
$svc->delete('alice', 'fresh-trash.txt');
$pdo->exec("UPDATE file_trash SET deleted_at = 1 WHERE name = 'old-trash.txt'");
$purgeRepo = new HomeRepository($pdo, new FileStorageConfig($config));
$purged = $purgeRepo->purgeExpiredTrash();
assert_true($purged >= 1, 'maintenance purges trash older than retention');
assert_true(trash_named($svc->listTrash('alice')['items'], 'old-trash.txt') === null, 'expired trash row is gone');
assert_true(trash_named($svc->listTrash('alice')['items'], 'fresh-trash.txt') !== null, 'fresh trash row stays');

$configNow = $config;
$configNow['system']['files_trash_days'] = 0;
$svcNow = new FileService($pdo, $configNow);
assert_true($svcNow->status('alice')['trashDays'] === 0, 'trashDays reports 0');
$svcNow->writeFile('alice', '', 'immediate.txt', 'gone', false);
$svcNow->delete('alice', 'immediate.txt');
$rootNames = array_column($svcNow->listEntries('alice', '')['entries'], 'name');
assert_true(!in_array('immediate.txt', $rootNames, true), 'zero retention removes the file');
assert_true(trash_named($svcNow->listTrash('alice')['items'], 'immediate.txt') === null, 'zero retention does not trash the file');

$svc->writeFile('alice', '', 'dav.txt', 'dav', false);
$davConfig = new FileStorageConfig($config);
$davRepo = new HomeRepository($pdo, $davConfig);
$davHome = $davRepo->getOrCreateForPrincipal('principals/alice');
$davStorage = new HomeStorage($davConfig, (string) $davHome['storage_id']);
$davRepo->attachTrash($davStorage, $davHome);
$davNode = new File($davStorage, 'dav.txt', [], 'principals/alice');
$davNode->delete();
$afterDav = array_column($svc->listEntries('alice', '')['entries'], 'name');
assert_true(!in_array('dav.txt', $afterDav, true), 'WebDAV delete leaves the home');
assert_true(trash_named($svc->listTrash('alice')['items'], 'dav.txt') !== null, 'WebDAV delete moves the file to trash');

$svc->writeFile('alice', '', 'link-target.txt', 't', false);
symlink($davStorage->getPath('link-target.txt'), $davStorage->getPath('link.txt'));
$svc->delete('alice', 'link.txt');
assert_true(!is_link($davStorage->getPath('link.txt')), 'symlink delete unlinks the link');
assert_true(trash_named($svc->listTrash('alice')['items'], 'link.txt') === null, 'symlink delete does not create a trash row');

$svc->writeFile('alice', '', 'quarantine-me.txt', 'keep', false);
$svc->delete('alice', 'quarantine-me.txt');
$activeStorageId = $pdo->query("SELECT storage_id FROM file_homes WHERE user_id = 1 AND status = 'active'")->fetchColumn();
assert_true(is_string($activeStorageId) && $activeStorageId !== '', 'active home has a storage id');
$davRepo->quarantineUser(1, 'principals/alice');
$left = (int) $pdo->query("SELECT COUNT(*) FROM file_trash WHERE name = 'quarantine-me.txt'")->fetchColumn();
assert_true($left === 0, 'user quarantine drops trash rows');
$tucked = $temporaryRoot . '/quarantine/' . $activeStorageId . '/.angara-trash';
$orphan = $temporaryRoot . '/trash/' . $activeStorageId;
assert_true(is_dir($tucked), 'user quarantine tucks trash into the quarantined home');
assert_true(!file_exists($orphan) && !is_link($orphan), 'user quarantine leaves no trash directory behind');

remove_tree($temporaryRoot);

if ($failures > 0) {
    echo "\n$failures failure(s)\n";
    exit(1);
}
echo "\nAll FileService checks passed.\n";
exit(0);
