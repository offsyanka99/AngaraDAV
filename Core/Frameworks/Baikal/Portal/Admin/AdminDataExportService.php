<?php

namespace Baikal\Portal\Admin;

use Baikal\Core\Files\FileStorageConfig;
use Baikal\Portal\ApiException;

/**
 * One-shot backup of the database and the WebDAV file store.
 *
 * The archive is angaradav-data-<UTC>.tar.gz with two members:
 * database.sqlite (SQLite VACUUM INTO) or database.sql (pg_dump), and
 * files.tar of the configured file-storage root. configuration.yaml is not
 * included. The top-level storage tmp/ directory is left out of files.tar.
 * Symbolic links inside the store are archived as links.
 *
 * Restore reads that same archive and replaces the live database and file
 * store. configuration.yaml is not read and is not written.
 */
class AdminDataExportService {
    /** @var array<string, mixed> */
    private array $config;

    private string $specificDir;

    private string $pgDumpBinary;

    private string $psqlBinary;

    private string $tarBinary;

    /** @var resource|null */
    private $lockHandle;

    private ?string $stagingDir = null;

    private ?string $archivePath = null;

    private ?string $fileStoreAside = null;

    private bool $fileStoreSwapped = false;

    private bool $databaseTouched = false;

    private bool $sqliteHadLive = false;

    /**
     * @param array<string, mixed> $config
     */
    public function __construct(
        array $config,
        string $specificDir,
        ?string $pgDumpBinary = null,
        ?string $tarBinary = null,
        ?string $psqlBinary = null
    ) {
        $this->config = $config;
        $this->specificDir = rtrim($specificDir, '/');
        $this->pgDumpBinary = $pgDumpBinary !== null && $pgDumpBinary !== '' ? $pgDumpBinary : 'pg_dump';
        $this->tarBinary = $tarBinary !== null && $tarBinary !== '' ? $tarBinary : 'tar';
        $this->psqlBinary = $psqlBinary !== null && $psqlBinary !== '' ? $psqlBinary : 'psql';
    }

    public function __destruct() {
        $this->cleanup();
    }

    /**
     * Build the archive. The caller streams it, then calls cleanup().
     * A second call while the lock is held throws 409.
     *
     * @return array{path: string, filename: string, size: int, backend: string}
     */
    public function build(): array {
        ignore_user_abort(true);
        set_time_limit(0);

        try {
            $storage = $this->storagePath();
            $this->assertNoSymlinkComponents($storage, 'File storage path must not contain a symbolic link');
            $this->acquireLock($storage);
            $staging = $this->makeStaging($storage);
            $dbMember = $this->writeDatabase($staging);
            $this->writeFilesTar($staging . '/files.tar', $storage, $staging);
            $archive = $staging . '.tar.gz';
            $this->archivePath = $archive;
            $this->run([
                $this->tarBinary,
                '--create',
                '--gzip',
                '--file',
                $archive,
                '--directory',
                $staging,
                $dbMember,
                'files.tar',
            ], false, '');
            $size = filesize($archive);
            if ($size === false || $size < 1) {
                throw new ApiException('Unable to read the data export', 500);
            }

            return [
                'path'     => $archive,
                'filename' => 'angaradav-data-' . gmdate('Ymd\THis\Z') . '.tar.gz',
                'size'     => $size,
                'backend'  => $this->backend(),
            ];
        } catch (ApiException $e) {
            $this->cleanup();
            throw $e;
        } catch (\Throwable $e) {
            $this->cleanup();
            throw new ApiException('Data export failed', 500);
        }
    }

    /**
     * Delete the staging directory and the archive, and release the lock.
     */
    public function cleanup(): void {
        $staging = $this->stagingDir;
        $archive = $this->archivePath;
        $this->stagingDir = null;
        $this->archivePath = null;
        $this->deleteExportPath($archive);
        $this->deleteExportPath($staging);
        $this->releaseLock();
    }

    /**
     * Replace the live database and file store from an angaradav-data archive.
     * configuration.yaml is left untouched. A second backup or restore while
     * the lock is held throws 409.
     *
     * @return array{backend: string, bytes: int}
     */
    public function restore(string $archivePath): array {
        ignore_user_abort(true);
        set_time_limit(0);
        $this->fileStoreAside = null;
        $this->fileStoreSwapped = false;
        $this->databaseTouched = false;
        $this->sqliteHadLive = false;
        $storage = '';
        $staging = '';

        try {
            if ($archivePath === '' || !is_file($archivePath) || is_link($archivePath)) {
                throw new ApiException('Choose a data backup file', 400);
            }
            $bytes = filesize($archivePath);
            if ($bytes === false || $bytes < 1) {
                throw new ApiException('That data backup is empty', 400);
            }

            $storage = $this->storagePath();
            $this->assertNoSymlinkComponents($storage, 'File storage path must not contain a symbolic link');
            if ($this->pathsOverlap($archivePath, $storage)) {
                throw new ApiException('Data backup overlaps the file store', 500);
            }
            $this->assertSqliteOutsideStorage($storage);
            $this->assertRestoreWorkspaceClear($storage);
            $this->acquireLock($storage);
            $staging = $this->makeStaging($storage);
            $dbMember = $this->extractOuterArchive($archivePath, $staging);
            $outer = $staging . '/outer';
            $this->assertDatabaseMember($outer . '/' . $dbMember);
            $this->assertFilesTarMembers($outer . '/files.tar');

            try {
                $this->snapshotDatabase($staging);
                $this->replaceFileStore($outer . '/files.tar', $storage);
                $this->applyDatabase($outer . '/' . $dbMember);
                $this->commitFileStore();
            } catch (\Throwable $e) {
                $this->revertLiveChanges($storage, $staging);
                if ($e instanceof ApiException) {
                    throw $e;
                }
                throw new ApiException('Data restore failed', 500);
            }

            try {
                $this->ensureStorageLayout();
            } catch (\Throwable $e) {
                throw new ApiException('Data restore could not prepare the file store', 500);
            }

            return [
                'backend' => $this->backend(),
                'bytes'   => $bytes,
            ];
        } catch (ApiException $e) {
            throw $e;
        } catch (\Throwable $e) {
            throw new ApiException('Data restore failed', 500);
        } finally {
            $this->cleanup();
        }
    }

    private function storagePath(): string {
        try {
            $files = new FileStorageConfig($this->config);
        } catch (\InvalidArgumentException $e) {
            throw new ApiException($e->getMessage(), 500);
        } catch (\RuntimeException $e) {
            throw new ApiException($e->getMessage(), 500);
        }

        return $files->getStoragePath();
    }

    /**
     * Data-export flock path. build() and restore() take it non-blocking.
     * The session-generation bump takes it blocking so two restores cannot
     * both write the same next integer.
     */
    public function exportLockPath(): string {
        return $this->lockFilePath($this->storagePath());
    }

    private function acquireLock(string $storage): void {
        $path = $this->lockFilePath($storage);
        $handle = fopen($path, 'c');
        if ($handle === false) {
            throw new ApiException('Unable to lock the data export', 500);
        }
        if (!flock($handle, LOCK_EX | LOCK_NB)) {
            fclose($handle);
            throw new ApiException('A data backup is already running.', 409);
        }
        @chmod($path, 0600);
        $this->lockHandle = $handle;
    }

    private function lockFilePath(string $storage): string {
        $fallback = rtrim(sys_get_temp_dir(), '/') . '/angaradav-data-export.lock';
        if ($this->specificDir === '' || !is_dir($this->specificDir)) {
            return $fallback;
        }
        $candidate = $this->specificDir . '/portal_data_export.lock';
        if ($this->pathsOverlap($candidate, $storage)) {
            return $fallback;
        }

        return $candidate;
    }

    private function releaseLock(): void {
        if (is_resource($this->lockHandle)) {
            flock($this->lockHandle, LOCK_UN);
            fclose($this->lockHandle);
        }
        $this->lockHandle = null;
    }

    private function makeStaging(string $storage): string {
        $staging = rtrim(sys_get_temp_dir(), '/') . '/angaradav-data-' . bin2hex(random_bytes(8));
        if ($this->pathsOverlap($staging, $storage)) {
            throw new ApiException('File storage path overlaps the export workspace', 500);
        }
        if (!mkdir($staging, 0700, true) && !is_dir($staging)) {
            throw new ApiException('Unable to prepare the data export', 500);
        }
        $this->stagingDir = $staging;

        return $staging;
    }

    private function writeDatabase(string $staging): string {
        if ($this->backend() === 'pgsql') {
            $this->writePostgresDump($staging . '/database.sql');

            return 'database.sql';
        }
        $this->writeSqliteSnapshot($staging . '/database.sqlite');

        return 'database.sqlite';
    }

    private function writeSqliteSnapshot(string $destination): void {
        $db = $this->databaseConfig();
        $file = trim((string) ($db['sqlite_file'] ?? ''));
        if ($file === '') {
            throw new ApiException('SQLite database file is not configured', 500);
        }
        $this->rejectControlChars($file, 'SQLite database path');
        $this->assertNoSymlinkComponents($file, 'SQLite database path must not contain a symbolic link');
        if (!is_file($file)) {
            throw new ApiException('SQLite database file was not found', 500);
        }
        $real = realpath($file);
        if ($real === false || !is_file($real)) {
            throw new ApiException('SQLite database file was not found', 500);
        }
        if (is_file($destination)) {
            throw new ApiException('Unable to snapshot the SQLite database', 500);
        }

        try {
            $pdo = new \PDO('sqlite:' . $real, null, null, [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
            ]);
            $pdo->exec('PRAGMA busy_timeout = 5000');
            $quoted = $pdo->quote($destination);
            if (!is_string($quoted) || $quoted === '') {
                throw new ApiException('Unable to snapshot the SQLite database', 500);
            }
            $pdo->exec('VACUUM INTO ' . $quoted);
            $pdo = null;
        } catch (ApiException $e) {
            throw $e;
        } catch (\Throwable $e) {
            throw new ApiException('Unable to snapshot the SQLite database', 500);
        }

        if (!is_file($destination)) {
            throw new ApiException('Unable to snapshot the SQLite database', 500);
        }
    }

    private function writePostgresDump(string $destination): void {
        $db = $this->databaseConfig();
        [$host, $port] = $this->splitPostgresHost((string) ($db['pgsql_host'] ?? ''));
        $dbname = trim((string) ($db['pgsql_dbname'] ?? ''));
        $username = trim((string) ($db['pgsql_username'] ?? ''));
        $password = array_key_exists('pgsql_password', $db) && $db['pgsql_password'] !== null
            ? (string) $db['pgsql_password']
            : '';
        if ($dbname === '') {
            throw new ApiException('PostgreSQL database name is not configured', 500);
        }
        $this->rejectControlChars($host, 'PostgreSQL host');
        $this->rejectControlChars($dbname, 'PostgreSQL database name');
        $this->rejectControlChars($username, 'PostgreSQL username');
        $this->rejectControlChars($password, 'PostgreSQL password');

        $command = [
            $this->pgDumpBinary,
            '--no-owner',
            '--no-acl',
            '--no-password',
            '--host',
            $host,
            '--port',
            $port,
        ];
        if ($username !== '') {
            $command[] = '--username';
            $command[] = $username;
        }
        $command[] = '--dbname';
        $command[] = $dbname;
        $command[] = '--file';
        $command[] = $destination;
        $this->run($command, true, $password);

        if (!is_file($destination)) {
            throw new ApiException('pg_dump did not write a database dump', 500);
        }
    }

    /**
     * Last ":port" when the suffix is numeric and the host has no other colon.
     * Bracketed IPv6 may carry a port. Anything else keeps port 5432.
     *
     * @return array{0: string, 1: string}
     */
    private function splitPostgresHost(string $raw): array {
        $raw = trim($raw);
        if ($raw === '') {
            throw new ApiException('PostgreSQL host is not configured', 500);
        }
        if (preg_match('/^\[([^\]\r\n]+)\]:(\d+)$/', $raw, $bracketPort) === 1) {
            return $this->validatedPortHost($bracketPort[1], $bracketPort[2]);
        }
        if (preg_match('/^\[([^\]\r\n]+)\]$/', $raw, $bracket) === 1) {
            return [$bracket[1], '5432'];
        }
        if (preg_match('/^(.*):(\d+)$/', $raw, $hostPort) === 1 && substr_count($hostPort[1], ':') === 0) {
            return $this->validatedPortHost($hostPort[1], $hostPort[2]);
        }

        return [$raw, '5432'];
    }

    /**
     * @return array{0: string, 1: string}
     */
    private function validatedPortHost(string $host, string $port): array {
        $host = trim($host);
        if ($host === '') {
            throw new ApiException('PostgreSQL host is not configured', 500);
        }
        if (preg_match('/^\d+$/', $port) !== 1) {
            throw new ApiException('PostgreSQL port is not configured', 500);
        }
        $number = (int) $port;
        if ($number < 1 || $number > 65535) {
            throw new ApiException('PostgreSQL port is not configured', 500);
        }

        return [$host, (string) $number];
    }

    private function writeFilesTar(string $destination, string $storage, string $staging): void {
        $this->assertNoSymlinkComponents($storage, 'File storage path must not contain a symbolic link');
        if ($this->pathsOverlap($storage, $staging) || $this->pathsOverlap($storage, $destination)) {
            throw new ApiException('File storage path overlaps the export workspace', 500);
        }
        if (!file_exists($storage)) {
            $this->run([
                $this->tarBinary,
                '--create',
                '--file',
                $destination,
                '--files-from',
                '/dev/null',
            ], false, '');

            return;
        }
        if (!is_dir($storage)) {
            throw new ApiException('File storage path is not a directory', 500);
        }
        $this->run([
            $this->tarBinary,
            '--create',
            '--file',
            $destination,
            '--directory',
            $storage,
            '--exclude=./tmp',
            '.',
        ], false, '');
    }

    /**
     * @param list<string> $command
     */
    private function run(array $command, bool $withPassword, string $secret): string {
        $binary = $command[0];
        $label = $this->commandLabel($binary);
        $this->assertBinary($binary, $label);

        $pipes = [];
        $process = proc_open($command, [
            0 => ['pipe', 'r'],
            1 => ['pipe', 'w'],
            2 => ['pipe', 'w'],
        ], $pipes, null, $this->environment($withPassword, $secret));
        if (!is_resource($process)) {
            throw new ApiException($label . ' could not be started', 500);
        }
        $stdin = $pipes[0] ?? null;
        $stdout = $pipes[1] ?? null;
        $stderr = $pipes[2] ?? null;
        if (!is_resource($stdin) || !is_resource($stdout) || !is_resource($stderr)) {
            proc_close($process);
            throw new ApiException($label . ' could not be started', 500);
        }
        fclose($stdin);
        stream_set_blocking($stdout, false);
        stream_set_blocking($stderr, false);

        $out = '';
        $err = '';
        while (true) {
            $status = proc_get_status($process);
            $chunkOut = stream_get_contents($stdout);
            $chunkErr = stream_get_contents($stderr);
            if (is_string($chunkOut) && $chunkOut !== '') {
                $out .= $chunkOut;
            }
            if (is_string($chunkErr) && $chunkErr !== '') {
                $err .= $chunkErr;
                if (strlen($err) > 8192) {
                    $err = substr($err, 0, 8192);
                }
            }
            if (!$status['running']) {
                break;
            }
            usleep(20000);
        }
        $restErr = stream_get_contents($stderr);
        $restOut = stream_get_contents($stdout);
        if (is_string($restOut) && $restOut !== '') {
            $out .= $restOut;
        }
        if (is_string($restErr) && $restErr !== '') {
            $err .= $restErr;
        }
        fclose($stdout);
        fclose($stderr);
        $code = proc_close($process);
        if ($code !== 0) {
            $detail = $this->redact($err, $secret);
            $message = $label . ' failed';
            if ($detail !== '') {
                $message .= ': ' . $detail;
            }
            throw new ApiException($message, 500);
        }

        return $out;
    }

    private function assertBinary(string $binary, string $label): void {
        if ($binary === '' || str_contains($binary, "\0")) {
            throw new ApiException($label . ' was not found', 500);
        }
        if (str_contains($binary, '/')) {
            if (!is_executable($binary)) {
                throw new ApiException($label . ' was not found', 500);
            }

            return;
        }
        $path = getenv('PATH');
        $dirs = is_string($path) ? explode(PATH_SEPARATOR, $path) : [];
        foreach ($dirs as $dir) {
            if ($dir !== '' && is_executable($dir . DIRECTORY_SEPARATOR . $binary)) {
                return;
            }
        }
        throw new ApiException($label . ' was not found', 500);
    }

    /**
     * @return array<string, string>
     */
    private function environment(bool $withPassword, string $password): array {
        $env = [];
        $current = getenv();
        if (is_array($current)) {
            foreach ($current as $key => $value) {
                if (!is_string($key) || !is_string($value)) {
                    continue;
                }
                $env[$key] = $value;
            }
        }
        if (!isset($env['PATH'])) {
            $path = getenv('PATH');
            if (is_string($path) && $path !== '') {
                $env['PATH'] = $path;
            }
        }
        if ($withPassword) {
            $env['PGPASSWORD'] = $password;
        } else {
            unset($env['PGPASSWORD']);
        }

        return $env;
    }

    private function redact(string $text, string $secret): string {
        $text = str_replace(["\r", "\n"], ' ', $text);
        if ($secret !== '') {
            $text = str_replace($secret, '***', $text);
        }
        $text = trim(preg_replace('/\s+/', ' ', $text) ?? '');
        if (strlen($text) > 300) {
            $text = substr($text, 0, 300) . '...';
        }

        return $text;
    }

    private function commandLabel(string $binary): string {
        $base = basename(str_replace('\\', '/', $binary));

        return $base !== '' ? $base : 'command';
    }

    private function backend(): string {
        $db = $this->databaseConfig();

        return (string) ($db['backend'] ?? 'sqlite') === 'pgsql' ? 'pgsql' : 'sqlite';
    }

    /**
     * @return array<string, mixed>
     */
    private function databaseConfig(): array {
        $db = $this->config['database'] ?? null;

        return is_array($db) ? $db : [];
    }

    private function rejectControlChars(string $value, string $label): void {
        if (preg_match('/[\r\n\0]/', $value) === 1) {
            throw new ApiException($label . ' contains a control character', 500);
        }
    }

    private function assertNoSymlinkComponents(string $path, string $message): void {
        $current = $path;
        while (true) {
            if (is_link($current)) {
                throw new ApiException($message, 500);
            }
            $parent = dirname($current);
            if ($parent === $current) {
                break;
            }
            $current = $parent;
        }
    }

    private function pathsOverlap(string $left, string $right): bool {
        $left = $this->normalizePath($left);
        $right = $this->normalizePath($right);
        if ($left === '/' || $right === '/') {
            return true;
        }

        return $left === $right
            || str_starts_with($left, $right . '/')
            || str_starts_with($right, $left . '/');
    }

    private function normalizePath(string $path): string {
        $path = str_replace('\\', '/', trim($path));
        if ($path !== '/' && !is_link($path)) {
            $real = realpath($path);
            if (is_string($real) && $real !== '') {
                $path = str_replace('\\', '/', $real);
            }
        }
        $path = rtrim($path, '/');

        return $path === '' ? '/' : $path;
    }

    private function extractOuterArchive(string $archivePath, string $staging): string {
        try {
            $members = $this->tarMembers($archivePath, true);
        } catch (ApiException $e) {
            if (str_contains($e->getMessage(), 'was not found')) {
                throw $e;
            }
            throw new ApiException('That file is not a data backup.', 400);
        }

        $names = [];
        foreach ($members as $member) {
            $this->assertSafeTarMember($member);
            $normalized = $this->normalizeTarMember($member);
            if ($normalized === '' || $normalized === '.') {
                continue;
            }
            $names[] = $normalized;
        }
        sort($names);
        $dbMember = $this->expectedDatabaseMember($names);
        $outer = $staging . '/outer';
        if (!mkdir($outer, 0700, true) && !is_dir($outer)) {
            throw new ApiException('Unable to prepare the data restore', 500);
        }
        $this->run([
            $this->tarBinary,
            '--extract',
            '--gzip',
            '--file',
            $archivePath,
            '--directory',
            $outer,
            '--no-same-owner',
        ], false, '');
        $this->assertOuterFiles($outer, $dbMember);

        return $dbMember;
    }

    /**
     * @param list<string> $names
     */
    private function expectedDatabaseMember(array $names): string {
        $hasSqlite = in_array('database.sqlite', $names, true);
        $hasSql = in_array('database.sql', $names, true);
        $hasFiles = in_array('files.tar', $names, true);
        if ($hasSqlite && $hasSql) {
            throw new ApiException('That file is not a data backup.', 400);
        }
        if ($hasFiles && count($names) === 2 && ($hasSqlite || $hasSql)) {
            $member = $hasSqlite ? 'database.sqlite' : 'database.sql';
            if ($member === 'database.sqlite' && $this->backend() !== 'sqlite') {
                throw new ApiException('This data backup is a SQLite snapshot, but this server uses PostgreSQL.', 400);
            }
            if ($member === 'database.sql' && $this->backend() !== 'pgsql') {
                throw new ApiException('This data backup is a PostgreSQL dump, but this server uses SQLite.', 400);
            }

            return $member;
        }

        throw new ApiException('That file is not a data backup.', 400);
    }

    private function assertOuterFiles(string $outer, string $dbMember): void {
        $found = [];
        $items = scandir($outer);
        if (!is_array($items)) {
            throw new ApiException('That file is not a data backup.', 400);
        }
        foreach ($items as $name) {
            if ($name === '.' || $name === '..') {
                continue;
            }
            $path = $outer . '/' . $name;
            if (is_link($path) || !is_file($path)) {
                throw new ApiException('Data backup contains an unsafe path', 400);
            }
            $found[] = $name;
        }
        sort($found);
        $expected = [$dbMember, 'files.tar'];
        sort($expected);
        if ($found !== $expected) {
            throw new ApiException('That file is not a data backup.', 400);
        }
    }

    private function assertDatabaseMember(string $path): void {
        if (is_link($path) || !is_file($path)) {
            throw new ApiException('That file is not a data backup.', 400);
        }
        if ($this->backend() === 'pgsql') {
            $size = filesize($path);
            $head = file_get_contents($path, false, null, 0, 16);
            if ($size === false || $size < 1 || !is_string($head)) {
                throw new ApiException('database.sql is empty', 400);
            }
            if (str_starts_with($head, "SQLite format 3") || str_starts_with($head, "\x1f\x8b")) {
                throw new ApiException('database.sql is not a PostgreSQL dump', 400);
            }

            return;
        }
        if (!class_exists(\SQLite3::class)) {
            throw new ApiException('SQLite3 extension is not available', 500);
        }
        $header = file_get_contents($path, false, null, 0, 16);
        if ($header !== "SQLite format 3\0") {
            throw new ApiException('database.sqlite is not a SQLite database', 400);
        }
        $db = new \SQLite3($path, SQLITE3_OPEN_READONLY);
        try {
            $db->busyTimeout(5000);
            $check = $db->querySingle('PRAGMA quick_check(1)');
            if ($check !== 'ok') {
                throw new ApiException('database.sqlite failed its integrity check', 400);
            }
        } finally {
            $db->close();
        }
    }

    private function assertFilesTarMembers(string $archive): void {
        if (is_link($archive) || !is_file($archive)) {
            throw new ApiException('That file is not a data backup.', 400);
        }
        foreach ($this->tarMembers($archive, false) as $member) {
            $this->assertSafeTarMember($member);
        }
    }

    /**
     * @return list<string>
     */
    private function tarMembers(string $archive, bool $gzip): array {
        $command = [$this->tarBinary, '--list', '--file', $archive];
        if ($gzip) {
            array_splice($command, 1, 0, ['--gzip']);
        }
        $out = $this->run($command, false, '');
        $members = [];
        foreach (preg_split('/\r\n|\n|\r/', $out) ?: [] as $line) {
            if ($line !== '') {
                $members[] = $line;
            }
        }

        return $members;
    }

    private function assertSafeTarMember(string $name): void {
        if ($name === '' || str_contains($name, "\0") || str_contains($name, '\\')) {
            throw new ApiException('Data backup contains an unsafe path', 400);
        }
        if (str_starts_with($name, '/')) {
            throw new ApiException('Data backup contains an unsafe path', 400);
        }
        $normalized = $this->normalizeTarMember($name);
        if ($normalized === '' || $normalized === '.') {
            return;
        }
        $parts = explode('/', $normalized);
        foreach ($parts as $part) {
            if ($part === '' || $part === '.' || $part === '..') {
                throw new ApiException('Data backup contains an unsafe path', 400);
            }
        }
        if (
            $parts[0] === '.angara-restore-incoming'
            || $parts[0] === '.angara-restore-aside'
            || $parts[0] === '.angara-restore-failed'
        ) {
            throw new ApiException('Data backup contains an unsafe path', 400);
        }
    }

    private function normalizeTarMember(string $name): string {
        $name = str_replace('\\', '/', $name);
        if (str_starts_with($name, './')) {
            $name = substr($name, 2);
        }

        return rtrim($name, '/');
    }

    private function assertSqliteOutsideStorage(string $storage): void {
        if ($this->backend() !== 'sqlite') {
            return;
        }
        $file = $this->sqliteLivePath();
        if ($this->pathsOverlap($file, $storage)) {
            throw new ApiException('SQLite database file must be outside the file store', 500);
        }
    }

    private function assertRestoreWorkspaceClear(string $storage): void {
        if (!is_dir($storage)) {
            return;
        }
        $aside = $storage . '/.angara-restore-aside';
        if (file_exists($aside) || is_link($aside)) {
            throw new ApiException('A previous data restore did not finish. The previous file store is still in .angara-restore-aside inside the file storage directory.', 500);
        }
        $incoming = $storage . '/.angara-restore-incoming';
        if (file_exists($incoming) || is_link($incoming)) {
            $this->deleteTree($incoming);
        }
        $failed = $storage . '/.angara-restore-failed';
        if (file_exists($failed) || is_link($failed)) {
            $this->deleteTree($failed);
        }
    }

    private function snapshotDatabase(string $staging): void {
        if ($this->backend() === 'pgsql') {
            $this->writePostgresDump($staging . '/rollback.sql');

            return;
        }
        $live = $this->sqliteLivePath();
        if (!is_file($live)) {
            $this->sqliteHadLive = false;

            return;
        }
        $this->sqliteHadLive = true;
        $this->writeSqliteSnapshot($staging . '/rollback.sqlite');
    }

    private function applyDatabase(string $member): void {
        $this->databaseTouched = true;
        if ($this->backend() === 'pgsql') {
            $this->psql([
                '--command',
                'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;',
            ]);
            $this->psql([
                '--file',
                $member,
            ]);

            return;
        }
        $this->copySqlite($member, $this->sqliteLivePath());
    }

    private function rollbackDatabase(string $staging): void {
        if ($this->backend() === 'pgsql') {
            $rollback = $staging . '/rollback.sql';
            if (!is_file($rollback)) {
                throw new ApiException('Data restore failed, and the previous database could not be put back', 500);
            }
            $this->psql([
                '--command',
                'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;',
            ]);
            $this->psql([
                '--file',
                $rollback,
            ]);

            return;
        }
        $live = $this->sqliteLivePath();
        if (!$this->sqliteHadLive) {
            if (is_file($live) && !is_link($live)) {
                @unlink($live);
            }
            @unlink($live . '-wal');
            @unlink($live . '-shm');

            return;
        }
        $rollback = $staging . '/rollback.sqlite';
        if (!is_file($rollback)) {
            throw new ApiException('Data restore failed, and the previous database could not be put back', 500);
        }
        $this->copySqlite($rollback, $live);
    }

    private function copySqlite(string $source, string $destination): void {
        if (!class_exists(\SQLite3::class)) {
            throw new ApiException('SQLite3 extension is not available', 500);
        }
        $parent = dirname($destination);
        if (!is_dir($parent) && !mkdir($parent, 0700, true) && !is_dir($parent)) {
            throw new ApiException('Unable to restore the SQLite database', 500);
        }
        $src = new \SQLite3($source, SQLITE3_OPEN_READONLY);
        $dst = new \SQLite3($destination, SQLITE3_OPEN_READWRITE | SQLITE3_OPEN_CREATE);
        try {
            $src->busyTimeout(5000);
            $dst->busyTimeout(30000);
            $dst->exec('PRAGMA busy_timeout = 30000');
            if (!$src->backup($dst)) {
                throw new ApiException('Unable to restore the SQLite database', 500);
            }
        } finally {
            $src->close();
            $dst->close();
        }
    }

    private function sqliteLivePath(): string {
        $db = $this->databaseConfig();
        $file = trim((string) ($db['sqlite_file'] ?? ''));
        if ($file === '') {
            throw new ApiException('SQLite database file is not configured', 500);
        }
        $this->rejectControlChars($file, 'SQLite database path');
        $this->assertNoSymlinkComponents($file, 'SQLite database path must not contain a symbolic link');

        return $file;
    }

    /**
     * @param list<string> $extra
     */
    private function psql(array $extra): void {
        $db = $this->databaseConfig();
        [$host, $port] = $this->splitPostgresHost((string) ($db['pgsql_host'] ?? ''));
        $dbname = trim((string) ($db['pgsql_dbname'] ?? ''));
        $username = trim((string) ($db['pgsql_username'] ?? ''));
        $password = array_key_exists('pgsql_password', $db) && $db['pgsql_password'] !== null
            ? (string) $db['pgsql_password']
            : '';
        if ($dbname === '') {
            throw new ApiException('PostgreSQL database name is not configured', 500);
        }
        $this->rejectControlChars($host, 'PostgreSQL host');
        $this->rejectControlChars($dbname, 'PostgreSQL database name');
        $this->rejectControlChars($username, 'PostgreSQL username');
        $this->rejectControlChars($password, 'PostgreSQL password');

        $command = [
            $this->psqlBinary,
            '--no-password',
            '--set',
            'ON_ERROR_STOP=1',
            '--host',
            $host,
            '--port',
            $port,
        ];
        if ($username !== '') {
            $command[] = '--username';
            $command[] = $username;
        }
        $command[] = '--dbname';
        $command[] = $dbname;
        foreach ($extra as $arg) {
            $command[] = $arg;
        }
        $this->run($command, true, $password);
    }

    private function replaceFileStore(string $filesTar, string $storage): void {
        if (is_link($storage)) {
            throw new ApiException('File storage path must not contain a symbolic link', 500);
        }
        if (!is_dir($storage) && !mkdir($storage, 0700, true) && !is_dir($storage)) {
            throw new ApiException('Unable to create the file store', 500);
        }
        if (!is_dir($storage)) {
            throw new ApiException('File storage path is not a directory', 500);
        }
        @chmod($storage, 0700);

        $incoming = $storage . '/.angara-restore-incoming';
        $aside = $storage . '/.angara-restore-aside';
        if (!mkdir($incoming, 0700) && !is_dir($incoming)) {
            throw new ApiException('Unable to prepare the data restore', 500);
        }
        try {
            $this->run([
                $this->tarBinary,
                '--extract',
                '--file',
                $filesTar,
                '--directory',
                $incoming,
                '--no-same-owner',
            ], false, '');
        } catch (\Throwable $e) {
            $this->deleteTree($incoming);
            throw $e;
        }
        if (!mkdir($aside, 0700) && !is_dir($aside)) {
            $this->deleteTree($incoming);
            throw new ApiException('Unable to prepare the data restore', 500);
        }
        $this->fileStoreAside = $aside;

        $moved = [];
        $items = scandir($storage);
        if (!is_array($items)) {
            $this->deleteTree($incoming);
            $this->deleteTree($aside);
            $this->fileStoreAside = null;
            throw new ApiException('Unable to replace the file store', 500);
        }
        foreach ($items as $item) {
            if ($item === '.' || $item === '..' || $item === '.angara-restore-incoming' || $item === '.angara-restore-aside') {
                continue;
            }
            if (!rename($storage . '/' . $item, $aside . '/' . $item)) {
                $this->abortFileReplace($storage, $aside, $incoming, $moved);
                throw new ApiException('Unable to replace the file store', 500);
            }
            $moved[] = $item;
        }

        $placed = [];
        $incomingItems = scandir($incoming);
        if (!is_array($incomingItems)) {
            $this->abortFileReplace($storage, $aside, $incoming, $moved);
            throw new ApiException('Unable to replace the file store', 500);
        }
        foreach ($incomingItems as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            if (!rename($incoming . '/' . $item, $storage . '/' . $item)) {
                foreach ($placed as $name) {
                    @rename($storage . '/' . $name, $incoming . '/' . $name);
                }
                $this->abortFileReplace($storage, $aside, $incoming, $moved);
                throw new ApiException('Unable to replace the file store', 500);
            }
            $placed[] = $item;
        }
        $this->deleteTree($incoming);
        $this->fileStoreSwapped = true;
    }

    /**
     * @param list<string> $moved
     */
    private function abortFileReplace(string $storage, string $aside, string $incoming, array $moved): void {
        foreach ($moved as $name) {
            @rename($aside . '/' . $name, $storage . '/' . $name);
        }
        $this->deleteTree($incoming);
        $this->deleteTree($aside);
        $this->fileStoreAside = null;
        $this->fileStoreSwapped = false;
    }

    private function rollbackFileStore(string $storage): void {
        $aside = $this->fileStoreAside;
        if (!$this->fileStoreSwapped || $aside === null) {
            return;
        }
        $holding = $storage . '/.angara-restore-failed';
        if (!mkdir($holding, 0700) && !is_dir($holding)) {
            throw new ApiException('Data restore failed, and the previous file store could not be put back', 500);
        }
        $current = scandir($storage);
        if (!is_array($current)) {
            throw new ApiException('Data restore failed, and the previous file store could not be put back', 500);
        }
        foreach ($current as $item) {
            if ($item === '.' || $item === '..' || $item === '.angara-restore-aside' || $item === '.angara-restore-failed') {
                continue;
            }
            if (!rename($storage . '/' . $item, $holding . '/' . $item)) {
                throw new ApiException('Data restore failed, and the previous file store could not be put back', 500);
            }
        }
        $previous = scandir($aside);
        if (!is_array($previous)) {
            throw new ApiException('Data restore failed, and the previous file store could not be put back', 500);
        }
        foreach ($previous as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }
            if (!rename($aside . '/' . $item, $storage . '/' . $item)) {
                throw new ApiException('Data restore failed, and the previous file store could not be put back', 500);
            }
        }
        $this->deleteTree($holding);
        $this->deleteTree($aside);
        $this->fileStoreAside = null;
        $this->fileStoreSwapped = false;
    }

    private function commitFileStore(): void {
        if ($this->fileStoreAside !== null) {
            $this->deleteTree($this->fileStoreAside);
        }
        $this->fileStoreAside = null;
        $this->fileStoreSwapped = false;
    }

    private function revertLiveChanges(string $storage, string $staging): void {
        $failed = false;
        if ($this->fileStoreSwapped) {
            try {
                $this->rollbackFileStore($storage);
            } catch (\Throwable) {
                $failed = true;
            }
        }
        if ($this->databaseTouched) {
            try {
                $this->rollbackDatabase($staging);
            } catch (\Throwable) {
                $failed = true;
            }
        }
        if ($failed) {
            throw new ApiException('Data restore failed, and the previous database and file store could not be put back', 500);
        }
    }

    private function ensureStorageLayout(): void {
        $files = new FileStorageConfig($this->config);
        $files->prepareStorage();
    }

    private function deleteExportPath(?string $path): void {
        if ($path === null || $path === '') {
            return;
        }
        $base = basename($path);
        if (!str_starts_with($base, 'angaradav-data-')) {
            return;
        }
        $this->deleteTree($path);
    }

    private function deleteTree(string $path): void {
        if ($path === '' || $path === '/' || $path === '.') {
            return;
        }
        if (is_link($path) || is_file($path)) {
            @unlink($path);

            return;
        }
        if (!is_dir($path)) {
            return;
        }
        $items = scandir($path);
        if (is_array($items)) {
            foreach ($items as $item) {
                if ($item === '.' || $item === '..') {
                    continue;
                }
                $this->deleteTree($path . '/' . $item);
            }
        }
        @rmdir($path);
    }
}
