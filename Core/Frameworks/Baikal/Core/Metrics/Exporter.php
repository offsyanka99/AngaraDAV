<?php

namespace Baikal\Core\Metrics;

use Baikal\Core\Files\FileStorageConfig;

/**
 * Prometheus text gauges for one scrape. Values are computed here.
 * Nothing in this class is a per-request counter.
 */
final class Exporter {
    /**
     * @param array<string, mixed>|null $config parsed configuration.yaml, or null when it cannot be read
     */
    public function __construct(
        private string $projectRoot,
        private ?array $config,
        private ?\PDO $pdo,
        private int $now,
    ) {
    }

    public static function unavailable(): string {
        return self::gauge('angaradav_up', '1 when gauge collection finished.', null, 0);
    }

    /**
     * Open the configured database for a read. Null when there is no database
     * or the driver refuses. Never returns an error string.
     *
     * @param array<string, mixed>|null $config
     */
    public static function connect(?array $config): ?\PDO {
        if (!is_array($config) || !is_array($config['database'] ?? null)) {
            return null;
        }
        $database = $config['database'];
        try {
            if (($database['backend'] ?? '') === 'pgsql') {
                $host = (string) ($database['pgsql_host'] ?? '');
                $dbname = (string) ($database['pgsql_dbname'] ?? '');
                if ($host === '' || $dbname === '') {
                    return null;
                }
                $pdo = new \PDO(
                    'pgsql:host=' . $host . ';dbname=' . $dbname . ';connect_timeout=2',
                    (string) ($database['pgsql_username'] ?? ''),
                    isset($database['pgsql_password']) ? (string) $database['pgsql_password'] : null,
                    [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]
                );
                $pdo->exec("SET NAMES 'UTF8'");

                return $pdo;
            }
            $file = (string) ($database['sqlite_file'] ?? '');
            if ($file === '' || !is_file($file) || !is_readable($file)) {
                return null;
            }
            $pdo = new \PDO('sqlite:' . $file, null, null, [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
            ]);
            $pdo->exec('PRAGMA busy_timeout = 2000');

            return $pdo;
        } catch (\Throwable) {
            return null;
        }
    }

    public function render(): string {
        $system = is_array($this->config['system'] ?? null) ? $this->config['system'] : [];
        $filesEnabled = self::flagOn($system, 'files_enabled');
        $databaseUp = 0;
        if ($this->pdo instanceof \PDO) {
            try {
                $this->pdo->query('SELECT 1');
                $databaseUp = 1;
            } catch (\Throwable) {
                $databaseUp = 0;
            }
        }
        $push = $databaseUp === 1 ? $this->pushGauges() : self::emptyPush();
        $lines = [];
        $lines[] = self::gauge('angaradav_up', '1 when gauge collection finished.', null, 1);
        $lines[] = self::gauge(
            'angaradav_build_info',
            'Build identity. The value is always 1.',
            [
                'version' => defined('ANGARA_VERSION') ? (string) ANGARA_VERSION : 'unknown',
                'revision' => defined('ANGARA_GIT_SHA') && ANGARA_GIT_SHA !== '' ? (string) ANGARA_GIT_SHA : 'unknown',
            ],
            1
        );
        $lines[] = self::gauge(
            'angaradav_install_locked',
            '1 when Specific/INSTALL_DISABLED exists or ANGARA_LOCK_INSTALL is 1.',
            null,
            $this->installLocked() ? 1 : 0
        );
        $lines[] = self::gauge(
            'angaradav_config_writable',
            '1 when config/ or configuration.yaml is writable.',
            null,
            $this->configWritable() ? 1 : 0
        );
        $lines[] = self::gauge(
            'angaradav_specific_writable',
            '1 when Specific/ is a writable directory.',
            null,
            $this->specificWritable() ? 1 : 0
        );
        $lines[] = self::gauge(
            'angaradav_files_enabled',
            '1 when system.files_enabled is on.',
            null,
            $filesEnabled ? 1 : 0
        );
        $lines[] = self::gauge(
            'angaradav_files_storage_ready',
            '1 when files are enabled and file storage is active.',
            null,
            $this->filesStorageReady($filesEnabled) ? 1 : 0
        );
        $lines[] = self::gauge(
            'angaradav_database_up',
            '1 when SELECT 1 succeeds.',
            null,
            $databaseUp
        );
        $lines[] = self::gauge(
            'angaradav_push_queue_jobs',
            'Jobs in push_queue by readiness. 0 when the database is down or the table is missing.',
            ['state' => 'ready'],
            $push['ready']
        );
        $lines[] = self::sample('angaradav_push_queue_jobs', ['state' => 'delayed'], $push['delayed']);
        $lines[] = self::gauge(
            'angaradav_push_queue_oldest_age_seconds',
            'Age in seconds of the oldest push_queue row. 0 when empty or the database is down.',
            null,
            $push['oldestAge']
        );
        $lines[] = self::gauge(
            'angaradav_push_queue_max_attempts',
            'Highest push_queue attempts value. 0 when empty or the database is down.',
            null,
            $push['maxAttempts']
        );
        $lines[] = self::gauge(
            'angaradav_push_subscriptions',
            'Unexpired push subscriptions by collection kind. other is a count and never a path.',
            ['kind' => 'calendars'],
            $push['kinds']['calendars']
        );
        foreach (['addressbooks', 'files', 'principals', 'other'] as $kind) {
            $lines[] = self::sample('angaradav_push_subscriptions', ['kind' => $kind], $push['kinds'][$kind]);
        }

        return implode('', $lines);
    }

    /**
     * @param array<string, string>|null $labels
     */
    private static function gauge(string $name, string $help, ?array $labels, int $value): string {
        $safeHelp = str_replace(["\n", "\r"], ' ', $help);

        return '# HELP ' . $name . ' ' . $safeHelp . "\n"
            . '# TYPE ' . $name . " gauge\n"
            . self::sample($name, $labels, $value);
    }

    /**
     * @param array<string, string>|null $labels
     */
    private static function sample(string $name, ?array $labels, int $value): string {
        $rendered = $name;
        if ($labels !== null && $labels !== []) {
            $pairs = [];
            foreach ($labels as $label => $labelValue) {
                $pairs[] = $label . '="' . self::escapeLabel($labelValue) . '"';
            }
            $rendered .= '{' . implode(',', $pairs) . '}';
        }

        return $rendered . ' ' . $value . "\n";
    }

    private static function escapeLabel(string $value): string {
        return str_replace(['\\', "\n", '"'], ['\\\\', '\\n', '\\"'], $value);
    }

    /**
     * @param array<string, mixed> $system
     */
    private static function flagOn(array $system, string $key): bool {
        if (!array_key_exists($key, $system)) {
            return false;
        }
        $value = $system[$key];
        if (is_bool($value)) {
            return $value;
        }
        if (is_int($value) || is_float($value)) {
            return (int) $value !== 0;
        }
        if (is_string($value)) {
            return !in_array(strtolower(trim($value)), ['', '0', 'false', 'off', 'no'], true);
        }

        return (bool) $value;
    }

    private function installLocked(): bool {
        if (is_file($this->specificDir() . '/INSTALL_DISABLED')) {
            return true;
        }

        return getenv('ANGARA_LOCK_INSTALL') === '1';
    }

    private function configWritable(): bool {
        $dir = $this->projectRoot . '/config';
        $file = $dir . '/configuration.yaml';

        return (is_dir($dir) && is_writable($dir)) || (is_file($file) && is_writable($file));
    }

    private function specificWritable(): bool {
        $dir = $this->specificDir();

        return is_dir($dir) && is_writable($dir);
    }

    private function specificDir(): string {
        return $this->projectRoot . '/Specific';
    }

    private function filesStorageReady(bool $filesEnabled): bool {
        if (!$filesEnabled || !is_array($this->config)) {
            return false;
        }
        try {
            if (!defined('PROJECT_PATH_SPECIFIC')) {
                define('PROJECT_PATH_SPECIFIC', $this->specificDir() . '/');
            }

            return (new FileStorageConfig($this->config))->isActive();
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * @return array{ready: int, delayed: int, oldestAge: int, maxAttempts: int, kinds: array{calendars: int, addressbooks: int, files: int, principals: int, other: int}}
     */
    private function pushGauges(): array {
        $out = self::emptyPush();
        if (!$this->pdo instanceof \PDO) {
            return $out;
        }
        try {
            $stmt = $this->pdo->prepare(
                'SELECT SUM(CASE WHEN available_at <= ? THEN 1 ELSE 0 END) AS ready,'
                . ' SUM(CASE WHEN available_at > ? THEN 1 ELSE 0 END) AS delayed,'
                . ' MIN(created) AS oldest, MAX(attempts) AS max_attempts FROM push_queue'
            );
            $stmt->execute([$this->now, $this->now]);
            $row = $stmt->fetch(\PDO::FETCH_ASSOC);
            if (is_array($row)) {
                $out['ready'] = (int) ($row['ready'] ?? 0);
                $out['delayed'] = (int) ($row['delayed'] ?? 0);
                $out['oldestAge'] = $row['oldest'] === null ? 0 : max(0, $this->now - (int) $row['oldest']);
                $out['maxAttempts'] = (int) ($row['max_attempts'] ?? 0);
            }
        } catch (\Throwable) {
            $out['ready'] = 0;
            $out['delayed'] = 0;
            $out['oldestAge'] = 0;
            $out['maxAttempts'] = 0;
        }
        try {
            $stmt = $this->pdo->prepare(
                "SELECT CASE
                    WHEN resource_uri LIKE 'calendars/%' THEN 'calendars'
                    WHEN resource_uri LIKE 'addressbooks/%' THEN 'addressbooks'
                    WHEN resource_uri LIKE 'files/%' THEN 'files'
                    WHEN resource_uri LIKE 'principals/%' THEN 'principals'
                    ELSE 'other' END AS kind, COUNT(*) AS n
                 FROM push_subscriptions WHERE expires > ? GROUP BY kind"
            );
            $stmt->execute([$this->now]);
            foreach ($stmt->fetchAll(\PDO::FETCH_ASSOC) as $row) {
                $kind = (string) ($row['kind'] ?? '');
                if (isset($out['kinds'][$kind])) {
                    $out['kinds'][$kind] = (int) $row['n'];
                }
            }
        } catch (\Throwable) {
            $out['kinds'] = self::emptyPush()['kinds'];
        }

        return $out;
    }

    /**
     * @return array{ready: int, delayed: int, oldestAge: int, maxAttempts: int, kinds: array{calendars: int, addressbooks: int, files: int, principals: int, other: int}}
     */
    private static function emptyPush(): array {
        return [
            'ready' => 0,
            'delayed' => 0,
            'oldestAge' => 0,
            'maxAttempts' => 0,
            'kinds' => [
                'calendars' => 0,
                'addressbooks' => 0,
                'files' => 0,
                'principals' => 0,
                'other' => 0,
            ],
        ];
    }
}
