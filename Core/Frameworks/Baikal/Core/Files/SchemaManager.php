<?php

namespace Baikal\Core\Files;

/**
 * Idempotently provisions generic WebDAV file-home metadata.
 */
class SchemaManager {
    public static function ensure(\PDO $pdo): void {
        $driver = $pdo->getAttribute(\PDO::ATTR_DRIVER_NAME);
        if ($driver === 'pgsql') {
            self::pgsql($pdo);
        } elseif ($driver === 'sqlite') {
            self::sqlite($pdo);
        } else {
            throw new \RuntimeException('WebDAV file storage does not support database driver: ' . $driver);
        }
    }

    public static function exists(\PDO $pdo): bool {
        try {
            $pdo->query('SELECT 1 FROM file_homes WHERE 1 = 0');

            return true;
        } catch (\Throwable $e) {
            return false;
        }
    }

    private static function sqlite(\PDO $pdo): void {
        $pdo->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS file_homes (
    id integer primary key asc NOT NULL,
    user_id integer UNIQUE,
    principaluri text NOT NULL,
    storage_id text NOT NULL UNIQUE,
    status text NOT NULL,
    created_at integer NOT NULL,
    quarantined_at integer
);
CREATE INDEX IF NOT EXISTS file_homes_principal ON file_homes (principaluri);
CREATE INDEX IF NOT EXISTS file_homes_status ON file_homes (status);
CREATE TABLE IF NOT EXISTS file_trash (
    id integer primary key asc NOT NULL,
    home_id integer NOT NULL,
    token text NOT NULL,
    original_path text NOT NULL,
    name text NOT NULL,
    is_directory integer NOT NULL,
    size_bytes integer NOT NULL,
    deleted_at integer NOT NULL,
    UNIQUE (home_id, token)
);
CREATE INDEX IF NOT EXISTS file_trash_home_deleted ON file_trash (home_id, deleted_at);
SQL
        );
    }

    private static function pgsql(\PDO $pdo): void {
        $pdo->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS file_homes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER UNIQUE,
    principaluri TEXT NOT NULL,
    storage_id TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    quarantined_at INTEGER
);
CREATE INDEX IF NOT EXISTS file_homes_principal ON file_homes (principaluri);
CREATE INDEX IF NOT EXISTS file_homes_status ON file_homes (status);
CREATE TABLE IF NOT EXISTS file_trash (
    id SERIAL PRIMARY KEY,
    home_id INTEGER NOT NULL,
    token TEXT NOT NULL,
    original_path TEXT NOT NULL,
    name TEXT NOT NULL,
    is_directory INTEGER NOT NULL,
    size_bytes INTEGER NOT NULL,
    deleted_at INTEGER NOT NULL,
    UNIQUE (home_id, token)
);
CREATE INDEX IF NOT EXISTS file_trash_home_deleted ON file_trash (home_id, deleted_at);
SQL
        );
    }
}
