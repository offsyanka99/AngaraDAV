<?php

namespace Baikal\Core\Plugins\Push;

/**
 * Idempotently provisions WebDAV-Push tables for new and existing installs.
 */
class SchemaManager {
    /** @var array<string, string> push_queue columns added after the initial schema */
    private const QUEUE_COLUMNS_SQLITE = [
        'min_content_depth' => 'integer NOT NULL DEFAULT 1',
        'revision'          => 'integer NOT NULL DEFAULT 0',
        'hold_since'        => 'integer NOT NULL DEFAULT 0',
    ];

    /** @var array<string, string> */
    private const QUEUE_COLUMNS_PGSQL = [
        'min_content_depth' => 'SMALLINT NOT NULL DEFAULT 1',
        'revision'          => 'INTEGER NOT NULL DEFAULT 0',
        'hold_since'        => 'INTEGER NOT NULL DEFAULT 0',
    ];

    public static function ensure(\PDO $pdo): void {
        $driver = $pdo->getAttribute(\PDO::ATTR_DRIVER_NAME);
        if ($driver === 'pgsql') {
            self::pgsql($pdo);
        } elseif ($driver === 'sqlite') {
            self::sqlite($pdo);
        } else {
            throw new \RuntimeException('WebDAV-Push does not support database driver: ' . $driver);
        }
    }

    private static function sqlite(\PDO $pdo): void {
        $pdo->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id integer primary key asc NOT NULL,
    registration_token text NOT NULL UNIQUE,
    principaluri text NOT NULL,
    resource_uri text NOT NULL,
    topic text NOT NULL,
    push_resource text NOT NULL,
    push_resource_hash text NOT NULL,
    content_encoding text,
    pubkey text NOT NULL,
    auth_secret text NOT NULL,
    triggers text NOT NULL,
    created integer NOT NULL,
    expires integer NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS push_resource_uri ON push_subscriptions (resource_uri, push_resource_hash);
CREATE INDEX IF NOT EXISTS push_resource_lookup ON push_subscriptions (resource_uri);
CREATE INDEX IF NOT EXISTS push_principal_lookup ON push_subscriptions (principaluri);
CREATE TABLE IF NOT EXISTS push_queue (
    id integer primary key asc NOT NULL,
    resource_uri text NOT NULL UNIQUE,
    topic text NOT NULL,
    content_update integer NOT NULL DEFAULT 0,
    property_update integer NOT NULL DEFAULT 0,
    sync_token text,
    suppressed_ids text NOT NULL DEFAULT '[]',
    attempts integer NOT NULL DEFAULT 0,
    available_at integer NOT NULL,
    created integer NOT NULL,
    min_content_depth integer NOT NULL DEFAULT 1,
    revision integer NOT NULL DEFAULT 0,
    hold_since integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS push_queue_available ON push_queue (available_at);
SQL
        );

        $existing = [];
        foreach ($pdo->query('PRAGMA table_info(push_queue)')->fetchAll(\PDO::FETCH_ASSOC) as $column) {
            $existing[strtolower((string) $column['name'])] = true;
        }
        foreach (self::QUEUE_COLUMNS_SQLITE as $name => $definition) {
            if (isset($existing[$name])) {
                continue;
            }
            try {
                $pdo->exec('ALTER TABLE push_queue ADD COLUMN ' . $name . ' ' . $definition);
            } catch (\PDOException $e) {
                // A concurrent first request may have added it between PRAGMA and ALTER.
                if (stripos($e->getMessage(), 'duplicate column') === false) {
                    throw $e;
                }
            }
        }
    }

    private static function pgsql(\PDO $pdo): void {
        $pdo->exec(<<<'SQL'
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id SERIAL PRIMARY KEY,
    registration_token TEXT NOT NULL UNIQUE,
    principaluri TEXT NOT NULL,
    resource_uri TEXT NOT NULL,
    topic TEXT NOT NULL,
    push_resource TEXT NOT NULL,
    push_resource_hash TEXT NOT NULL,
    content_encoding TEXT,
    pubkey TEXT NOT NULL,
    auth_secret TEXT NOT NULL,
    triggers TEXT NOT NULL,
    created INTEGER NOT NULL,
    expires INTEGER NOT NULL,
    UNIQUE (resource_uri, push_resource_hash)
);
CREATE INDEX IF NOT EXISTS push_resource_lookup ON push_subscriptions (resource_uri);
CREATE INDEX IF NOT EXISTS push_principal_lookup ON push_subscriptions (principaluri);
CREATE TABLE IF NOT EXISTS push_queue (
    id SERIAL PRIMARY KEY,
    resource_uri TEXT NOT NULL UNIQUE,
    topic TEXT NOT NULL,
    content_update SMALLINT NOT NULL DEFAULT 0,
    property_update SMALLINT NOT NULL DEFAULT 0,
    sync_token TEXT,
    suppressed_ids TEXT NOT NULL DEFAULT '[]',
    attempts INTEGER NOT NULL DEFAULT 0,
    available_at INTEGER NOT NULL,
    created INTEGER NOT NULL,
    min_content_depth SMALLINT NOT NULL DEFAULT 1,
    revision INTEGER NOT NULL DEFAULT 0,
    hold_since INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS push_queue_available ON push_queue (available_at);
SQL
        );

        // Checked first because ALTER TABLE takes an exclusive lock even when IF NOT EXISTS skips it.
        $stmt = $pdo->query(
            "SELECT column_name FROM information_schema.columns
             WHERE table_schema = current_schema() AND table_name = 'push_queue'"
        );
        $existing = array_map('strtolower', $stmt->fetchAll(\PDO::FETCH_COLUMN) ?: []);
        foreach (self::QUEUE_COLUMNS_PGSQL as $name => $definition) {
            if (!in_array($name, $existing, true)) {
                $pdo->exec('ALTER TABLE push_queue ADD COLUMN IF NOT EXISTS ' . $name . ' ' . $definition);
            }
        }
    }
}
