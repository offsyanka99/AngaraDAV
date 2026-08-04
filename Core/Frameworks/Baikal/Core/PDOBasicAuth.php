<?php

namespace Baikal\Core;

/**
 * This is an authentication backend that uses a database to manage passwords.
 *
 * Format of the database tables must match to the one of \Sabre\DAV\Auth\Backend\PDO
 *
 * @copyright Copyright (C) 2013 Lukasz Janyst. All rights reserved.
 * @author Lukasz Janyst <ljanyst@buggybrain.net>
 * @license http://code.google.com/p/sabredav/wiki/License Modified BSD License
 */
class PDOBasicAuth extends \Sabre\DAV\Auth\Backend\AbstractBasic {
    /** @var int Max failed WebDAV logins per IP per window */
    const RATE_LIMIT_MAX = 20;

    /** @var int Rate-limit window (seconds) */
    const RATE_LIMIT_WINDOW = 900;

    /**
     * Reference to PDO connection.
     *
     * @var PDO
     */
    protected $pdo;

    /**
     * PDO table name we'll be using.
     *
     * @var string
     */
    protected $tableName;

    /**
     * Authentication realm.
     *
     * @var string
     */
    protected $authRealm;

    /**
     * @var string
     */
    private $currentUser;

    /**
     * Creates the backend object.
     *
     * If the filename argument is passed in, it will parse out the specified file fist.
     *
     * @param PDO $pdo
     * @param string $tableName The PDO table name to use
     */
    function __construct(\PDO $pdo, $authRealm, $tableName = 'users') {
        $this->pdo = $pdo;
        $this->tableName = $tableName;
        $this->authRealm = $authRealm;
    }

    /**
     * Validates a username and password.
     *
     * This method should return true or false depending on if login
     * succeeded.
     *
     * @param string $username
     * @param string $password
     *
     * @return bool
     */
    function validateUserPass($username, $password) {
        if ($this->isRateLimited()) {
            error_log('AngaraDAV WebDAV auth rate limit exceeded for ' . $this->clientIp());

            return false;
        }

        $stmt = $this->pdo->prepare('SELECT username, digesta1 FROM ' . $this->tableName . ' WHERE username = ?');
        $stmt->execute([$username]);
        $result = $stmt->fetchAll();

        if (!count($result)) {
            $this->registerFailedAttempt();

            return false;
        }

        $hash = md5($username . ':' . $this->authRealm . ':' . $password);
        if (hash_equals((string) $result[0]['digesta1'], $hash)) {
            $this->currentUser = $username;
            $this->clearFailedAttempts();

            return true;
        }

        $this->registerFailedAttempt();

        return false;
    }

    private function clientIp(): string {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

        return is_string($ip) && $ip !== '' ? $ip : '0.0.0.0';
    }

    private function rateLimitPath(): string {
        $dir = defined('PROJECT_PATH_SPECIFIC') ? PROJECT_PATH_SPECIFIC : (defined('PROJECT_PATH_ROOT') ? PROJECT_PATH_ROOT . 'Specific/' : sys_get_temp_dir() . '/');

        return rtrim($dir, '/') . '/webdav_auth_rate.json';
    }

    private function loadRateData(): array {
        $path = $this->rateLimitPath();
        if (!is_readable($path)) {
            return [];
        }
        $raw = file_get_contents($path);
        if ($raw === false || trim($raw) === '') {
            return [];
        }
        $data = json_decode($raw, true);

        return is_array($data) ? $data : [];
    }

    private function saveRateData(array $data): void {
        $path = $this->rateLimitPath();
        $dir = dirname($path);
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        $json = json_encode($data, JSON_UNESCAPED_SLASHES);
        if ($json === false) {
            return;
        }
        @file_put_contents($path, $json . "\n", LOCK_EX);
    }

    private function isRateLimited(): bool {
        $ip = $this->clientIp();
        $data = $this->loadRateData();
        $now = time();
        $row = $data[$ip] ?? null;
        if (!is_array($row)) {
            return false;
        }
        $start = (int) ($row['start'] ?? 0);
        $count = (int) ($row['count'] ?? 0);
        if ($start <= 0 || ($now - $start) > self::RATE_LIMIT_WINDOW) {
            return false;
        }

        return $count >= self::RATE_LIMIT_MAX;
    }

    private function registerFailedAttempt(): void {
        $ip = $this->clientIp();
        $data = $this->loadRateData();
        $now = time();
        $row = $data[$ip] ?? null;
        if (!is_array($row) || (int) ($row['start'] ?? 0) <= 0 || ($now - (int) $row['start']) > self::RATE_LIMIT_WINDOW) {
            $data[$ip] = ['start' => $now, 'count' => 1];
        } else {
            $data[$ip]['count'] = (int) ($row['count'] ?? 0) + 1;
        }
        // Prune stale IPs
        foreach ($data as $k => $v) {
            if (!is_array($v) || ($now - (int) ($v['start'] ?? 0)) > self::RATE_LIMIT_WINDOW * 2) {
                unset($data[$k]);
            }
        }
        $this->saveRateData($data);
    }

    private function clearFailedAttempts(): void {
        $ip = $this->clientIp();
        $data = $this->loadRateData();
        if (isset($data[$ip])) {
            unset($data[$ip]);
            $this->saveRateData($data);
        }
    }
}
