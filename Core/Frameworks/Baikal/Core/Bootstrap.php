<?php

namespace Baikal\Core;

use Symfony\Component\Yaml\Yaml;

/**
 * Application bootstrap: paths, session/CSRF, YAML → PDO.
 *
 * Replaces Flake\Framework for DAV, portal, install, and CLI workers.
 */
class Bootstrap {
    /** @var \PDO|null */
    private static $pdo;

    /**
     * @return \PDO
     */
    public static function pdo() {
        if (!(self::$pdo instanceof \PDO)) {
            throw new \RuntimeException('Database is not available');
        }

        return self::$pdo;
    }

    public static function isDbInitialized(): bool {
        return self::$pdo instanceof \PDO;
    }

    public static function isCli(): bool {
        return strtolower((string) php_sapi_name()) === 'cli';
    }

    public static function currentProtocol(): string {
        if (!empty($_SERVER['HTTP_X_FORWARDED_PROTO'])) {
            return (string) $_SERVER['HTTP_X_FORWARDED_PROTO'];
        }

        if ((!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || (int) ($_SERVER['SERVER_PORT'] ?? 0) === 443) {
            return 'https';
        }

        return 'http';
    }

    public static function bootstrap(): void {
        if (!defined('PROJECT_PATH_ROOT')) {
            throw new \RuntimeException('PROJECT_PATH_ROOT is not defined');
        }

        if (array_key_exists('REDIRECT_HTTP_AUTHORIZATION', $_SERVER)) {
            $_SERVER['HTTP_AUTHORIZATION'] = $_SERVER['REDIRECT_HTTP_AUTHORIZATION'];
        }

        self::definePath('PROJECT_PATH_CORE', PROJECT_PATH_ROOT . 'Core/');
        self::definePath('PROJECT_PATH_CORERESOURCES', PROJECT_PATH_CORE . 'Resources/');
        self::definePath('PROJECT_PATH_FRAMEWORKS', PROJECT_PATH_CORE . 'Frameworks/');
        self::definePath('PROJECT_PATH_WWWROOT', PROJECT_PATH_CORE . 'WWWRoot/');

        $configDir = getenv('ANGARA_PATH_CONFIG');
        if ($configDir !== false && $configDir !== '') {
            self::definePath('PROJECT_PATH_CONFIG', $configDir);
        } else {
            self::definePath('PROJECT_PATH_CONFIG', PROJECT_PATH_ROOT . 'config/');
        }

        $specificDir = getenv('ANGARA_PATH_SPECIFIC');
        if ($specificDir !== false && $specificDir !== '') {
            self::definePath('PROJECT_PATH_SPECIFIC', $specificDir);
        } else {
            self::definePath('PROJECT_PATH_SPECIFIC', PROJECT_PATH_ROOT . 'Specific/');
        }

        require_once PROJECT_PATH_CORE . 'Distrib.php';

        self::definePath('PROJECT_PATH_DOCUMENTROOT', PROJECT_PATH_ROOT . 'html/');

        if (!defined('PROJECT_CONTEXT_BASEURI')) {
            define('PROJECT_CONTEXT_BASEURI', '/');
        }

        self::defineBaseUri();

        if (!self::isCli()) {
            ini_set('html_errors', '1');
            if (class_exists(AdminPassword::class)) {
                AdminPassword::configureSession();
            }
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            if (!isset($_SESSION['CSRF_TOKEN'])) {
                $_SESSION['CSRF_TOKEN'] = bin2hex(random_bytes(20));
            }
        }

        $locale = defined('PROJECT_LOCALE') ? PROJECT_LOCALE : 'fr_FR.UTF-8';
        setlocale(LC_ALL, $locale);
        $timezone = defined('PROJECT_TIMEZONE') ? PROJECT_TIMEZONE : 'Europe/Paris';
        date_default_timezone_set($timezone);

        self::initDb();
    }

    /**
     * @param mixed $value
     */
    private static function definePath(string $name, $value): void {
        if (!defined($name)) {
            define($name, $value);
        }
    }

    private static function defineBaseUri(): void {
        if (defined('PROJECT_BASEURI') && defined('PROJECT_URI')) {
            return;
        }

        $host = (string) ($_SERVER['HTTP_HOST'] ?? 'localhost');

        try {
            $config = Yaml::parseFile(PROJECT_PATH_CONFIG . 'baikal.yaml');
            if (isset($config['system']['base_uri']) && $config['system']['base_uri'] !== '') {
                if (!defined('PROJECT_BASEURI')) {
                    define('PROJECT_BASEURI', self::prependSlash(self::appendSlash((string) $config['system']['base_uri'])));
                }
                if (!defined('PROJECT_URI')) {
                    define('PROJECT_URI', self::currentProtocol() . '://' . $host . PROJECT_BASEURI);
                }

                return;
            }
        } catch (\Exception $e) {
            error_log($e->getMessage());
        }

        $scriptFilename = (string) ($_SERVER['SCRIPT_FILENAME'] ?? '');
        $documentRoot = (string) ($_SERVER['DOCUMENT_ROOT'] ?? '');
        if ($scriptFilename === '' || $documentRoot === '') {
            if (!defined('PROJECT_BASEURI')) {
                define('PROJECT_BASEURI', '/');
            }
            if (!defined('PROJECT_URI')) {
                define('PROJECT_URI', self::currentProtocol() . '://' . $host . PROJECT_BASEURI);
            }

            return;
        }

        $sScript = substr($scriptFilename, strlen($documentRoot));
        $sDirName = str_replace('\\', '/', dirname($sScript));
        if ($sDirName !== '.') {
            $sDirName = self::appendSlash($sDirName);
        } else {
            $sDirName = '/';
        }

        $sBaseUrl = self::rmBeginSlash(self::rmProjectContext($sDirName));
        if (!defined('PROJECT_BASEURI')) {
            define('PROJECT_BASEURI', self::prependSlash($sBaseUrl));
        }

        $sHttpBaseUrl = (string) ($_SERVER['REQUEST_URI'] ?? '/');
        $sHttpBaseUrl = self::rmQuery($sHttpBaseUrl);
        $sHttpBaseUrl = self::rmScriptName($sHttpBaseUrl, $sScript);
        $sHttpBaseUrl = self::rmProjectContext($sHttpBaseUrl);
        if (!defined('PROJECT_URI')) {
            define('PROJECT_URI', self::currentProtocol() . '://' . $host . $sHttpBaseUrl);
        }
    }

    private static function initDb(): void {
        try {
            $config = Yaml::parseFile(PROJECT_PATH_CONFIG . 'baikal.yaml');
        } catch (\Exception $e) {
            error_log('Error reading baikal.yaml file : ' . $e->getMessage());

            return;
        }

        if (!is_array($config)) {
            return;
        }

        // Skip DB on install unless this is an upgrade (configured_version differs).
        $inInstallContext = defined('ANGARA_CONTEXT_INSTALL') && ANGARA_CONTEXT_INSTALL === true;
        if ($inInstallContext
            && (!isset($config['system']['configured_version'])
                || $config['system']['configured_version'] === ANGARA_VERSION)
        ) {
            return;
        }

        if (!isset($config['database']) || !is_array($config['database'])) {
            return;
        }

        if (array_key_exists('backend', $config['database']) && $config['database']['backend'] === 'pgsql') {
            self::initDbPgsql($config);
        } else {
            self::initDbSqlite($config);
        }
    }

    /**
     * @param array<string, mixed> $config
     */
    private static function initDbSqlite(array $config): bool {
        $file = $config['database']['sqlite_file'] ?? '';
        if (!$file) {
            return false;
        }

        if (file_exists($file) && !is_writable($file)) {
            exit('<h3>DB file is not writable. Please give write permissions on file \'<span style=\'font-family: monospace; background: yellow;\'>' . htmlspecialchars((string) $file) . '</span>\'</h3>');
        }

        if (!is_writable(dirname($file))) {
            exit('<h3>The <em>FOLDER</em> containing the DB file is not writable, and it has to.<br />Please give write permissions on folder \'<span style=\'font-family: monospace; background: yellow;\'>' . htmlspecialchars(dirname($file)) . '</span>\'</h3>');
        }

        if (file_exists($file) && is_readable($file) && !(self::$pdo instanceof \PDO)) {
            self::setPdo(new \PDO('sqlite:' . $file, null, null, [
                \PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION,
            ]));

            return true;
        }

        return false;
    }

    /**
     * @param array<string, mixed> $config
     */
    private static function initDbPgsql(array $config): void {
        $host = $config['database']['pgsql_host'] ?? '';
        $dbname = $config['database']['pgsql_dbname'] ?? '';
        $username = $config['database']['pgsql_username'] ?? '';
        $password = $config['database']['pgsql_password'] ?? null;

        if (!$host) {
            exit('<h3>The constant PROJECT_DB_PGSQL_HOST, containing the PostgreSQL host name, is not set.<br />You should set it in config/baikal.yaml</h3>');
        }

        if (!$dbname) {
            exit('<h3>The constant PROJECT_DB_PGSQL_DBNAME, containing the PostgreSQL database name, is not set.<br />You should set it in config/baikal.yaml</h3>');
        }

        try {
            $pdo = new \PDO(
                'pgsql:host=' . $host . ';dbname=' . $dbname,
                (string) $username,
                $password === null ? null : (string) $password,
                [\PDO::ATTR_ERRMODE => \PDO::ERRMODE_EXCEPTION]
            );
            $pdo->exec("SET NAMES 'UTF8'");
            self::setPdo($pdo);
        } catch (\Exception $e) {
            $message = 'AngaraDAV was not able to establish a connection to the configured PostgreSQL database (as configured in config/baikal.yaml).';
            if (!$username) {
                exit('<h3>' . $message . ' Note: The constant PROJECT_DB_PGSQL_USERNAME, containing the PostgreSQL database username, is not set. If your database requires a username you should set it in config/baikal.yaml.</h3>');
            }

            if ($password === null) {
                exit('<h3>' . $message . ' Note: The constant PROJECT_DB_PGSQL_PASSWORD, containing the PostgreSQL database password, is not set. If your database requires a password you should set it in config/baikal.yaml.</h3>');
            }

            exit('<h3>' . $message . '</h3>');
        }
    }

    private static function setPdo(\PDO $pdo): void {
        self::$pdo = $pdo;
        $GLOBALS['pdo'] = $pdo;
    }

    private static function rmBeginSlash(string $sString): string {
        if (substr($sString, 0, 1) === '/') {
            $sString = substr($sString, 1);
        }

        return $sString;
    }

    private static function appendSlash(string $sString): string {
        if (substr($sString, -1) !== '/') {
            $sString .= '/';
        }

        return $sString;
    }

    private static function prependSlash(string $sString): string {
        if (substr($sString, 0, 1) !== '/') {
            $sString = '/' . $sString;
        }

        return $sString;
    }

    private static function rmQuery(string $sString): string {
        $iStart = strpos($sString, '?');

        return ($iStart === false) ? $sString : substr($sString, 0, $iStart);
    }

    private static function rmScriptName(string $sString, string $sScriptName): string {
        $sScriptBaseName = basename($sScriptName);
        if ($sScriptBaseName !== '' && self::endsWith($sString, $sScriptBaseName)) {
            return substr($sString, 0, -strlen($sScriptBaseName));
        }

        return $sString;
    }

    private static function rmProjectContext(string $sString): string {
        $context = defined('PROJECT_CONTEXT_BASEURI') ? (string) PROJECT_CONTEXT_BASEURI : '/';

        return self::appendSlash(
            substr($sString, 0, -1 * strlen($context))
        );
    }

    private static function endsWith(string $sString, string $sTest): bool {
        $iTestLen = strlen($sTest);
        if ($iTestLen === 0 || $iTestLen > strlen($sString)) {
            return false;
        }

        return substr_compare($sString, $sTest, -$iTestLen) === 0;
    }
}
