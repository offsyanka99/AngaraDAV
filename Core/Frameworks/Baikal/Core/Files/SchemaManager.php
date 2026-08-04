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
SQL
        );
    }
}
