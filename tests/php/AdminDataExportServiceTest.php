<?php

/**
 * Unit checks for Baikal\Portal\Admin\AdminDataExportService.
 *
 * Run: php tests/php/AdminDataExportServiceTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Portal\Admin\AdminDataExportService;
use Baikal\Portal\ApiException;

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

function assert_throws_status(callable $fn, int $status, string $needle, string $message): void {
    try {
        $fn();
    } catch (ApiException $e) {
        $ok = $e->getStatus() === $status && ($needle === '' || str_contains($e->getMessage(), $needle));
        assert_true($ok, $message . ' (status ' . $e->getStatus() . ': ' . $e->getMessage() . ')');

        return;
    } catch (Throwable $e) {
        assert_true(false, $message . ' (threw ' . get_class($e) . ': ' . $e->getMessage() . ')');

        return;
    }
    assert_true(false, $message . ' (did not throw)');
}

/**
 * @param list<string> $command
 */
function run_capture(array $command): string {
    $pipes = [];
    $proc = proc_open($command, [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ], $pipes);
    if (!is_resource($proc)) {
        throw new RuntimeException('could not run ' . $command[0]);
    }
    fclose($pipes[0]);
    $out = stream_get_contents($pipes[1]);
    $err = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);
    $code = proc_close($proc);
    if ($code !== 0) {
        throw new RuntimeException(trim(is_string($err) ? $err : 'command failed'));
    }

    return is_string($out) ? $out : '';
}

function rmtree(string $path): void {
    if (is_link($path) || is_file($path)) {
        @unlink($path);

        return;
    }
    if (!is_dir($path)) {
        return;
    }
    $items = scandir($path);
    if (!is_array($items)) {
        return;
    }
    foreach ($items as $item) {
        if ($item === '.' || $item === '..') {
            continue;
        }
        rmtree($path . '/' . $item);
    }
    @rmdir($path);
}

/**
 * @return list<string>
 */
function tar_members(string $archive): array {
    $lines = preg_split('/\r\n|\n|\r/', trim(run_capture(['tar', '--list', '--file', $archive])));
    if (!is_array($lines)) {
        return [];
    }
    $members = [];
    foreach ($lines as $line) {
        if ($line !== '') {
            $members[] = $line;
        }
    }

    return $members;
}

/** @param array<string, mixed> $database */
function export_config(string $storage, array $database): array {
    return [
        'system' => [
            'files_enabled'      => true,
            'files_storage_path' => $storage,
        ],
        'database' => $database,
    ];
}

$work = sys_get_temp_dir() . '/angaradav-data-export-test-' . bin2hex(random_bytes(4));
mkdir($work, 0700, true);
$savedStorageEnv = getenv('ANGARA_FILES_STORAGE_PATH');
putenv('ANGARA_FILES_STORAGE_PATH');
register_shutdown_function(static function () use ($work, $savedStorageEnv): void {
    rmtree($work);
    putenv('FAKE_PGDUMP_RECORD');
    putenv('FAKE_PGDUMP_PASS');
    putenv('FAKE_PGDUMP_FAIL');
    putenv('FAKE_PSQL_RECORD');
    putenv('FAKE_PSQL_PASS');
    putenv('FAKE_PSQL_FAIL_FILE');
    if (is_string($savedStorageEnv) && $savedStorageEnv !== '') {
        putenv('ANGARA_FILES_STORAGE_PATH=' . $savedStorageEnv);
    }
});

$specific = $work . '/specific';
$files = $work . '/files';
$sqlite = $work . '/db/db.sqlite';
mkdir($specific, 0700, true);
mkdir($files . '/homes/user/tmp', 0700, true);
mkdir($files . '/tmp', 0700, true);
mkdir(dirname($sqlite), 0700, true);

file_put_contents($files . '/homes/hello.txt', 'HELLO-FILE-BYTES');
file_put_contents($files . '/homes/user/tmp/keep.txt', 'KEEP-NESTED-TMP');
file_put_contents($files . '/tmp/partial.bin', 'PARTIAL-UPLOAD-BYTES');
file_put_contents($files . '/homes/database.sqlite', 'NOT-THE-DATABASE');
$secret = $work . '/secret.txt';
file_put_contents($secret, 'ANGARA-SECRET-BYTES-NOT-FOLLOWED');
symlink($secret, $files . '/homes/link');

$pdo = new PDO('sqlite:' . $sqlite);
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$pdo->exec('PRAGMA journal_mode = WAL');
$pdo->exec('CREATE TABLE sample (id INTEGER PRIMARY KEY, name TEXT)');
$pdo->exec("INSERT INTO sample (name) VALUES ('kept')");
$pdo = null;

$sqliteDb = ['backend' => 'sqlite', 'sqlite_file' => $sqlite];
$service = new AdminDataExportService(export_config($files, $sqliteDb), $specific);
$built = null;
try {
    $built = $service->build();
    assert_true(
        is_string($built['filename']) && preg_match('/^angaradav-data-\d{8}T\d{6}Z\.tar\.gz$/', $built['filename']) === 1,
        'archive filename ' . $built['filename']
    );
    $members = tar_members($built['path']);
    sort($members);
    assert_true($members === ['database.sqlite', 'files.tar'], 'outer archive members are the database and files.tar (' . implode(', ', $members) . ')');
    assert_true(!in_array('configuration.yaml', $members, true), 'configuration.yaml is not an archive member');

    $extract = $work . '/extracted';
    mkdir($extract, 0700, true);
    run_capture(['tar', '--extract', '--gzip', '--file', $built['path'], '--directory', $extract]);
    assert_true(is_file($extract . '/database.sqlite'), 'extracted database.sqlite');
    assert_true(!is_file($extract . '/configuration.yaml'), 'extracted tree has no configuration.yaml');
    $header = file_get_contents($extract . '/database.sqlite', false, null, 0, 15);
    assert_true($header === 'SQLite format 3', 'snapshot is a SQLite database');
    $copy = new PDO('sqlite:' . $extract . '/database.sqlite');
    $copy->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $name = $copy->query('SELECT name FROM sample')->fetchColumn();
    $copy = null;
    assert_true($name === 'kept', 'VACUUM INTO snapshot keeps the row');

    $listing = run_capture(['tar', '--list', '--verbose', '--file', $extract . '/files.tar']);
    $filesTar = file_get_contents($extract . '/files.tar');
    assert_true(is_string($filesTar), 'files.tar is readable');
    $filesTar = is_string($filesTar) ? $filesTar : '';
    assert_true(str_contains($listing, 'hello.txt'), 'files.tar lists homes/hello.txt');
    assert_true(str_contains($listing, 'keep.txt'), 'files.tar keeps a nested directory named tmp');
    assert_true(str_contains($filesTar, 'HELLO-FILE-BYTES'), 'files.tar stores hello.txt');
    assert_true(str_contains($filesTar, 'KEEP-NESTED-TMP'), 'files.tar stores the nested tmp file');
    assert_true(str_contains($filesTar, 'NOT-THE-DATABASE'), 'a database.sqlite inside the file store stays inside files.tar');
    assert_true(!str_contains($listing, 'partial.bin'), 'top-level tmp/ is excluded');
    assert_true(!str_contains($filesTar, 'PARTIAL-UPLOAD-BYTES'), 'excluded tmp bytes are not stored');
    assert_true(str_contains($listing, 'link ->'), 'symlink is stored as a link');
    assert_true(!str_contains($filesTar, 'ANGARA-SECRET-BYTES-NOT-FOLLOWED'), 'symlink target contents are not stored');
} catch (Throwable $e) {
    assert_true(false, 'sqlite export threw ' . get_class($e) . ': ' . $e->getMessage());
} finally {
    $service->cleanup();
}

$missingStorage = $work . '/missing-files';
$missing = new AdminDataExportService(export_config($missingStorage, $sqliteDb), $specific);
try {
    $builtMissing = $missing->build();
    $missingExtract = $work . '/missing-extracted';
    mkdir($missingExtract, 0700, true);
    run_capture(['tar', '--extract', '--gzip', '--file', $builtMissing['path'], '--directory', $missingExtract]);
    assert_true(is_file($missingExtract . '/database.sqlite'), 'missing storage still ships the database');
    assert_true(tar_members($missingExtract . '/files.tar') === [], 'missing storage ships an empty files.tar');
} catch (Throwable $e) {
    assert_true(false, 'missing storage export threw ' . get_class($e) . ': ' . $e->getMessage());
} finally {
    $missing->cleanup();
}

$realFiles = $work . '/real-files';
mkdir($realFiles, 0700, true);
$linked = $work . '/linked-files';
symlink($realFiles, $linked);
$linkedService = new AdminDataExportService(export_config($linked, $sqliteDb), $specific);
assert_throws_status(
    static function () use ($linkedService): void {
        $linkedService->build();
    },
    500,
    'symbolic link',
    'symlink storage path is refused'
);
$linkedService->cleanup();

$lockPath = $specific . '/portal_data_export.lock';
$lock = fopen($lockPath, 'c');
assert_true(is_resource($lock), 'opened export lock');
if (is_resource($lock)) {
    assert_true(flock($lock, LOCK_EX | LOCK_NB), 'held export lock');
    $busy = new AdminDataExportService(export_config($files, $sqliteDb), $specific);
    assert_throws_status(
        static function () use ($busy): void {
            $busy->build();
        },
        409,
        'already running',
        'second export is refused while the lock is held'
    );
    $busy->cleanup();
    flock($lock, LOCK_UN);
    fclose($lock);
}

$fake = $work . '/pg_dump';
file_put_contents($fake, <<<'PHP'
#!/usr/bin/env php
<?php
$args = $_SERVER['argv'];
$record = getenv('FAKE_PGDUMP_RECORD');
if (is_string($record) && $record !== '') {
    file_put_contents($record, implode("\n", $args));
}
$passFile = getenv('FAKE_PGDUMP_PASS');
$pg = getenv('PGPASSWORD');
if (is_string($passFile) && $passFile !== '') {
    file_put_contents($passFile, is_string($pg) ? $pg : '');
}
if (getenv('FAKE_PGDUMP_FAIL') === '1') {
    fwrite(STDERR, "password authentication failed for " . (is_string($pg) ? $pg : '') . "\n");
    exit(1);
}
$file = null;
foreach ($args as $i => $arg) {
    if ($arg === '--file' && isset($args[$i + 1])) {
        $file = $args[$i + 1];
    }
}
if (!is_string($file)) {
    fwrite(STDERR, "missing --file\n");
    exit(1);
}
file_put_contents($file, "-- fake dump\n");
PHP);
chmod($fake, 0700);

$record = $work . '/pg-args.txt';
$passFile = $work . '/pg-pass.txt';
putenv('FAKE_PGDUMP_RECORD=' . $record);
putenv('FAKE_PGDUMP_PASS=' . $passFile);
putenv('FAKE_PGDUMP_FAIL');
$pgFiles = $work . '/pg-files';
mkdir($pgFiles, 0700, true);
$pgConfig = export_config($pgFiles, [
    'backend'         => 'pgsql',
    'pgsql_host'      => 'db.example:5433',
    'pgsql_dbname'    => 'angaradav',
    'pgsql_username'  => 'angaradav',
    'pgsql_password'  => 's3cret-db',
]);
$pg = new AdminDataExportService($pgConfig, $specific, $fake, 'tar');
try {
    $pgBuilt = $pg->build();
    $pgExtract = $work . '/pg-extracted';
    mkdir($pgExtract, 0700, true);
    run_capture(['tar', '--extract', '--gzip', '--file', $pgBuilt['path'], '--directory', $pgExtract]);
    $pgMembers = tar_members($pgBuilt['path']);
    sort($pgMembers);
    assert_true($pgMembers === ['database.sql', 'files.tar'], 'postgres archive members (' . implode(', ', $pgMembers) . ')');
    assert_true(is_file($pgExtract . '/database.sql') && file_get_contents($pgExtract . '/database.sql') === "-- fake dump\n", 'pg_dump output is database.sql');
    $args = is_file($record) ? (string) file_get_contents($record) : '';
    assert_true(str_contains($args, "--no-owner\n"), 'pg_dump --no-owner');
    assert_true(str_contains($args, "--no-acl\n"), 'pg_dump --no-acl');
    assert_true(str_contains($args, "--no-password\n"), 'pg_dump --no-password');
    assert_true(str_contains($args, "--host\ndb.example\n"), 'pg_dump host splits the port');
    assert_true(str_contains($args, "--port\n5433\n"), 'pg_dump port is the numeric suffix');
    assert_true(str_contains($args, "--username\nangaradav\n"), 'pg_dump username');
    assert_true(str_contains($args, "--dbname\nangaradav\n"), 'pg_dump database name');
    assert_true(!str_contains($args, 's3cret-db'), 'password is not a pg_dump argument');
    $seenPass = is_file($passFile) ? (string) file_get_contents($passFile) : '';
    assert_true($seenPass === 's3cret-db', 'PGPASSWORD is the YAML password');
} catch (Throwable $e) {
    assert_true(false, 'postgres export threw ' . get_class($e) . ': ' . $e->getMessage());
} finally {
    $pg->cleanup();
}

putenv('FAKE_PGDUMP_FAIL=1');
$pgFail = new AdminDataExportService($pgConfig, $specific, $fake, 'tar');
try {
    $pgFail->build();
    assert_true(false, 'failing pg_dump did not throw');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 500, 'failing pg_dump is HTTP 500');
    assert_true(str_contains($e->getMessage(), 'pg_dump failed'), 'failing pg_dump names the tool (' . $e->getMessage() . ')');
    assert_true(!str_contains($e->getMessage(), 's3cret-db'), 'pg_dump stderr does not leak the password (' . $e->getMessage() . ')');
} catch (Throwable $e) {
    assert_true(false, 'failing pg_dump threw ' . get_class($e) . ': ' . $e->getMessage());
} finally {
    $pgFail->cleanup();
}

$missingBin = new AdminDataExportService($pgConfig, $specific, $work . '/no-such-pg_dump', 'tar');
assert_throws_status(
    static function () use ($missingBin): void {
        $missingBin->build();
    },
    500,
    'was not found',
    'missing pg_dump is reported'
);
$missingBin->cleanup();

function write_tar_member(string $archive, string $name, string $data): void {
    if (strlen($name) > 100) {
        throw new RuntimeException('tar name too long');
    }
    $header = str_pad($name, 100, "\0");
    $header .= str_pad(decoct(0644), 7, '0', STR_PAD_LEFT) . "\0";
    $header .= str_pad(decoct(0), 7, '0', STR_PAD_LEFT) . "\0";
    $header .= str_pad(decoct(0), 7, '0', STR_PAD_LEFT) . "\0";
    $header .= str_pad(decoct(strlen($data)), 11, '0', STR_PAD_LEFT) . "\0";
    $header .= str_pad(decoct(time()), 11, '0', STR_PAD_LEFT) . "\0";
    $header .= '        ';
    $header .= '0';
    $header .= str_repeat("\0", 100);
    $header .= "ustar\0";
    $header .= '00';
    $header .= str_repeat("\0", 512 - strlen($header));
    $sum = 0;
    for ($i = 0; $i < 512; ++$i) {
        $sum += ord($header[$i]);
    }
    $checksum = str_pad(decoct($sum), 6, '0', STR_PAD_LEFT) . "\0 ";
    $header = substr_replace($header, $checksum, 148, 8);
    $pad = (512 - (strlen($data) % 512)) % 512;
    file_put_contents($archive, $header . $data . str_repeat("\0", $pad), FILE_APPEND);
}

function finish_tar(string $archive): void {
    file_put_contents($archive, str_repeat("\0", 1024), FILE_APPEND);
}

$roundFiles = $work . '/round-files';
$roundSqlite = $work . '/round-db/db.sqlite';
mkdir($roundFiles . '/homes/user/tmp', 0700, true);
mkdir($roundFiles . '/tmp', 0700, true);
mkdir(dirname($roundSqlite), 0700, true);
file_put_contents($roundFiles . '/homes/hello.txt', 'HELLO-FILE-BYTES');
file_put_contents($roundFiles . '/tmp/partial.bin', 'PARTIAL-UPLOAD-BYTES');
file_put_contents($work . '/configuration.yaml', 'KEEP-CONFIG');
file_put_contents($specific . '/push_vapid.json', 'KEEP-VAPID');
$roundPdo = new PDO('sqlite:' . $roundSqlite);
$roundPdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$roundPdo->exec('PRAGMA journal_mode = WAL');
$roundPdo->exec('CREATE TABLE sample (id INTEGER PRIMARY KEY, name TEXT)');
$roundPdo->exec("INSERT INTO sample (name) VALUES ('kept')");
$roundConfig = export_config($roundFiles, ['backend' => 'sqlite', 'sqlite_file' => $roundSqlite]);
$roundExport = new AdminDataExportService($roundConfig, $specific);
$roundArchive = $work . '/roundtrip.tar.gz';
try {
    $roundBuilt = $roundExport->build();
    copy($roundBuilt['path'], $roundArchive);
} catch (Throwable $e) {
    assert_true(false, 'round-trip export threw ' . get_class($e) . ': ' . $e->getMessage());
} finally {
    $roundExport->cleanup();
}
file_put_contents($roundFiles . '/homes/hello.txt', 'CHANGED');
file_put_contents($roundFiles . '/homes/new.txt', 'NEW');
$roundPdo->exec("UPDATE sample SET name = 'changed'");
$roundRestore = new AdminDataExportService($roundConfig, $specific);
try {
    $roundResult = $roundRestore->restore($roundArchive);
    assert_true($roundResult['backend'] === 'sqlite', 'sqlite restore reports the backend');
    assert_true($roundResult['bytes'] === filesize($roundArchive), 'sqlite restore reports the archive size');
    $hello = (string) file_get_contents($roundFiles . '/homes/hello.txt');
    assert_true($hello === 'HELLO-FILE-BYTES', 'sqlite restore puts the file store back (' . $hello . ')');
    assert_true(!is_file($roundFiles . '/homes/new.txt'), 'sqlite restore removes files added after the backup');
    assert_true(!is_file($roundFiles . '/tmp/partial.bin'), 'sqlite restore does not bring back the upload tmp file');
    assert_true(is_dir($roundFiles . '/tmp'), 'sqlite restore recreates the upload tmp directory');
    assert_true(!is_dir($roundFiles . '/.angara-restore-aside'), 'sqlite restore removes the previous file store');
    $seen = $roundPdo->query('SELECT name FROM sample')->fetchColumn();
    $fresh = new PDO('sqlite:' . $roundSqlite);
    $fresh->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $freshName = $fresh->query('SELECT name FROM sample')->fetchColumn();
    $fresh = null;
    assert_true($seen === 'kept' && $freshName === 'kept', 'sqlite restore puts the open database back (' . (string) $seen . ' / ' . (string) $freshName . ')');
    assert_true((string) file_get_contents($work . '/configuration.yaml') === 'KEEP-CONFIG', 'sqlite restore leaves configuration.yaml alone');
    assert_true((string) file_get_contents($specific . '/push_vapid.json') === 'KEEP-VAPID', 'sqlite restore leaves push_vapid.json alone');
} catch (Throwable $e) {
    assert_true(false, 'sqlite restore threw ' . get_class($e) . ': ' . $e->getMessage());
} finally {
    $roundRestore->cleanup();
}
$roundPdo = null;

$insideSqlite = $roundFiles . '/inside.sqlite';
copy($roundSqlite, $insideSqlite);
$inside = new AdminDataExportService(
    export_config($roundFiles, ['backend' => 'sqlite', 'sqlite_file' => $insideSqlite]),
    $specific
);
assert_throws_status(
    static function () use ($inside, $roundArchive): void {
        $inside->restore($roundArchive);
    },
    500,
    'outside the file store',
    'sqlite file inside the file store is refused'
);
$inside->cleanup();
assert_true((string) file_get_contents($roundFiles . '/homes/hello.txt') === 'HELLO-FILE-BYTES', 'refused restore does not change the file store');

$lock = fopen($lockPath, 'c');
assert_true(is_resource($lock), 'reopened export lock');
if (is_resource($lock)) {
    assert_true(flock($lock, LOCK_EX | LOCK_NB), 'held export lock for restore');
    $busyRestore = new AdminDataExportService($roundConfig, $specific);
    assert_throws_status(
        static function () use ($busyRestore, $roundArchive): void {
            $busyRestore->restore($roundArchive);
        },
        409,
        'already running',
        'restore is refused while a data backup holds the lock'
    );
    $busyRestore->cleanup();
    flock($lock, LOCK_UN);
    fclose($lock);
}

$badOuter = $work . '/bad-outer';
mkdir($badOuter, 0700, true);
file_put_contents($badOuter . '/database.sqlite', 'not-a-database');
file_put_contents($badOuter . '/files.tar', '');
file_put_contents($badOuter . '/configuration.yaml', 'secret');
$badArchive = $work . '/bad.tar.gz';
run_capture([
    'tar', '--create', '--gzip', '--file', $badArchive, '--directory', $badOuter,
    'database.sqlite', 'files.tar', 'configuration.yaml',
]);
$bad = new AdminDataExportService($roundConfig, $specific);
assert_throws_status(
    static function () use ($bad, $badArchive): void {
        $bad->restore($badArchive);
    },
    400,
    'not a data backup',
    'an archive with configuration.yaml is refused'
);
$bad->cleanup();
assert_true((string) file_get_contents($work . '/configuration.yaml') === 'KEEP-CONFIG', 'refused archive does not write configuration.yaml');

$slipTar = $work . '/slip-files.tar';
write_tar_member($slipTar, '../escaped.txt', "esc\n");
finish_tar($slipTar);
$slipOuter = $work . '/slip-outer';
$slipSrc = $work . '/slip-src';
mkdir($slipOuter, 0700, true);
mkdir($slipSrc, 0700, true);
run_capture(['tar', '--extract', '--gzip', '--file', $roundArchive, '--directory', $slipSrc]);
$canary = $work . '/escaped.txt';
copy($slipSrc . '/database.sqlite', $slipOuter . '/database.sqlite');
copy($slipTar, $slipOuter . '/files.tar');
$slipArchive = $work . '/slip.tar.gz';
run_capture([
    'tar', '--create', '--gzip', '--file', $slipArchive, '--directory', $slipOuter,
    'database.sqlite', 'files.tar',
]);
$slip = new AdminDataExportService($roundConfig, $specific);
assert_throws_status(
    static function () use ($slip, $slipArchive): void {
        $slip->restore($slipArchive);
    },
    400,
    'unsafe path',
    'files.tar member with .. is refused'
);
$slip->cleanup();
assert_true(!is_file($canary), 'unsafe member is not written outside the file store');

$wrong = new AdminDataExportService($roundConfig, $specific);
$pgArchiveForSqlite = $work . '/pg-for-sqlite.tar.gz';
if (isset($pgBuilt['path']) && is_file($pgExtract . '/database.sql')) {
    $wrongOuter = $work . '/wrong-outer';
    mkdir($wrongOuter, 0700, true);
    copy($pgExtract . '/database.sql', $wrongOuter . '/database.sql');
    copy($pgExtract . '/files.tar', $wrongOuter . '/files.tar');
    run_capture([
        'tar', '--create', '--gzip', '--file', $pgArchiveForSqlite, '--directory', $wrongOuter,
        'database.sql', 'files.tar',
    ]);
    assert_throws_status(
        static function () use ($wrong, $pgArchiveForSqlite): void {
            $wrong->restore($pgArchiveForSqlite);
        },
        400,
        'PostgreSQL dump',
        'a postgres archive is refused on a sqlite server'
    );
} else {
    assert_true(false, 'postgres archive was not available for the backend check');
}
$wrong->cleanup();

$fakePsql = $work . '/psql';
file_put_contents($fakePsql, <<<'PHP'
#!/usr/bin/env php
<?php
$args = $_SERVER['argv'];
$record = getenv('FAKE_PSQL_RECORD');
if (is_string($record) && $record !== '') {
    file_put_contents($record, implode("\n", $args) . "\n---\n", FILE_APPEND);
}
$passFile = getenv('FAKE_PSQL_PASS');
$pg = getenv('PGPASSWORD');
if (is_string($passFile) && $passFile !== '') {
    file_put_contents($passFile, is_string($pg) ? $pg : '');
}
$failFile = getenv('FAKE_PSQL_FAIL_FILE');
$isFile = in_array('--file', $args, true);
if ($isFile && is_string($failFile) && $failFile !== '') {
    $count = is_file($failFile) ? (int) file_get_contents($failFile) : 0;
    file_put_contents($failFile, (string) ($count + 1));
    if ($count === 0) {
        fwrite(STDERR, 'restore failed for ' . (is_string($pg) ? $pg : '') . "\n");
        exit(1);
    }
}
exit(0);
PHP);
chmod($fakePsql, 0700);

$psqlRecord = $work . '/psql-args.txt';
$psqlPass = $work . '/psql-pass.txt';
$psqlFail = $work . '/psql-fail-count.txt';
putenv('FAKE_PSQL_RECORD=' . $psqlRecord);
putenv('FAKE_PSQL_PASS=' . $psqlPass);
putenv('FAKE_PSQL_FAIL_FILE');
putenv('FAKE_PGDUMP_FAIL');
$pgRestoreFiles = $work . '/pg-restore-files';
mkdir($pgRestoreFiles . '/homes', 0700, true);
file_put_contents($pgRestoreFiles . '/homes/hello.txt', 'BACKUP-FILE');
$pgRestoreConfig = export_config($pgRestoreFiles, [
    'backend'         => 'pgsql',
    'pgsql_host'      => 'db.example:5433',
    'pgsql_dbname'    => 'angaradav',
    'pgsql_username'  => 'angaradav',
    'pgsql_password'  => 's3cret-db',
]);
$pgRestoreExport = new AdminDataExportService($pgRestoreConfig, $specific, $fake, 'tar', $fakePsql);
$pgRestoreArchive = $work . '/pg-restore.tar.gz';
try {
    $pgRestoreBuilt = $pgRestoreExport->build();
    copy($pgRestoreBuilt['path'], $pgRestoreArchive);
} catch (Throwable $e) {
    assert_true(false, 'postgres restore export threw ' . get_class($e) . ': ' . $e->getMessage());
} finally {
    $pgRestoreExport->cleanup();
}
file_put_contents($pgRestoreFiles . '/homes/hello.txt', 'LIVE-FILE');
file_put_contents($psqlRecord, '');
$pgRestore = new AdminDataExportService($pgRestoreConfig, $specific, $fake, 'tar', $fakePsql);
try {
    $pgRestoreResult = $pgRestore->restore($pgRestoreArchive);
    assert_true($pgRestoreResult['backend'] === 'pgsql', 'postgres restore reports the backend');
    assert_true((string) file_get_contents($pgRestoreFiles . '/homes/hello.txt') === 'BACKUP-FILE', 'postgres restore puts the file store back');
    $psqlArgs = is_file($psqlRecord) ? (string) file_get_contents($psqlRecord) : '';
    assert_true(str_contains($psqlArgs, "--no-password\n"), 'psql --no-password');
    assert_true(str_contains($psqlArgs, "--set\nON_ERROR_STOP=1\n"), 'psql stops on the first error');
    assert_true(str_contains($psqlArgs, "--host\ndb.example\n"), 'psql host');
    assert_true(str_contains($psqlArgs, "--port\n5433\n"), 'psql port');
    assert_true(str_contains($psqlArgs, "--username\nangaradav\n"), 'psql username');
    assert_true(str_contains($psqlArgs, "--dbname\nangaradav\n"), 'psql database name');
    assert_true(str_contains($psqlArgs, 'DROP SCHEMA IF EXISTS public CASCADE'), 'psql drops the public schema before loading the dump');
    assert_true(str_contains($psqlArgs, "--file\n"), 'psql loads database.sql from --file');
    assert_true(!str_contains($psqlArgs, 's3cret-db'), 'password is not a psql argument');
    $psqlSeen = is_file($psqlPass) ? (string) file_get_contents($psqlPass) : '';
    assert_true($psqlSeen === 's3cret-db', 'PGPASSWORD is set for psql');
} catch (Throwable $e) {
    assert_true(false, 'postgres restore threw ' . get_class($e) . ': ' . $e->getMessage());
} finally {
    $pgRestore->cleanup();
}

file_put_contents($pgRestoreFiles . '/homes/hello.txt', 'LIVE-FILE');
file_put_contents($psqlRecord, '');
file_put_contents($psqlFail, '0');
putenv('FAKE_PSQL_FAIL_FILE=' . $psqlFail);
$pgFailRestore = new AdminDataExportService($pgRestoreConfig, $specific, $fake, 'tar', $fakePsql);
try {
    $pgFailRestore->restore($pgRestoreArchive);
    assert_true(false, 'failing psql did not throw');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 500, 'failing psql is HTTP 500');
    assert_true(str_contains($e->getMessage(), 'psql failed'), 'failing psql names the tool (' . $e->getMessage() . ')');
    assert_true(!str_contains($e->getMessage(), 's3cret-db'), 'psql stderr does not leak the password (' . $e->getMessage() . ')');
    assert_true((string) file_get_contents($pgRestoreFiles . '/homes/hello.txt') === 'LIVE-FILE', 'failed postgres restore puts the file store back');
    $failCount = is_file($psqlFail) ? (int) file_get_contents($psqlFail) : 0;
    assert_true($failCount === 2, 'failed load is followed by one rollback load (' . $failCount . ')');
} catch (Throwable $e) {
    assert_true(false, 'failing psql threw ' . get_class($e) . ': ' . $e->getMessage());
} finally {
    $pgFailRestore->cleanup();
}

echo $failures === 0 ? "\nAll AdminDataExportService checks passed.\n" : "\n$failures check(s) FAILED.\n";
exit($failures === 0 ? 0 : 1);
