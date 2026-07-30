<?php

namespace Baikal\Core\Plugins\Push;

/**
 * Leveled debug logger for WebDAV-Push.
 *
 * Mirrors the portal logging convention (see \Baikal\Portal\App): all output
 * goes to a dedicated file under Specific/ (push_debug.log), NEVER to PHP
 * error_log(). php-fpm sends error_log() to stderr, which nginx then records as
 * [error] for every line — even successful requests. A dedicated file keeps the
 * DAV error stream clean while still giving operators a verbose trace on demand.
 *
 * Level is resolved from (first wins):
 *   env PUSH_LOG_LEVEL, env BAIKAL_PUSH_LOG_LEVEL, system.push_log_level.
 * Allowed: off | error | warn | info | debug (default off).
 */
class PushLogger {
    const LEVELS = ['off' => 0, 'error' => 1, 'warn' => 2, 'info' => 3, 'debug' => 4];
    const MAX_LOG_BYTES = 5242880;

    /** @var int resolved numeric level */
    private $level;

    /** @var string absolute log file path ('' disables file output) */
    private $path;

    /**
     * @param string|null $configLevel value of system.push_log_level (may be null)
     * @param string|null $path        override log file path (tests)
     */
    public function __construct(?string $configLevel = null, ?string $path = null) {
        $level = strtolower(trim((string) (
            getenv('PUSH_LOG_LEVEL')
            ?: getenv('BAIKAL_PUSH_LOG_LEVEL')
            ?: ($configLevel ?? 'off')
        )));
        if (!isset(self::LEVELS[$level])) {
            $level = 'off';
        }
        $this->level = self::LEVELS[$level];

        if ($path === null) {
            $dir = defined('PROJECT_PATH_SPECIFIC')
                ? PROJECT_PATH_SPECIFIC
                : (defined('PROJECT_PATH_ROOT') ? PROJECT_PATH_ROOT . 'Specific/' : '');
            $path = $dir === '' ? '' : rtrim($dir, '/') . '/push_debug.log';
        }
        $this->path = $path;
    }

    public function isEnabled(string $min = 'info'): bool {
        return $this->level >= (self::LEVELS[$min] ?? 3);
    }

    public function error(string $message, array $context = []): void {
        $this->write('error', $message, $context);
    }

    public function warn(string $message, array $context = []): void {
        $this->write('warn', $message, $context);
    }

    public function info(string $message, array $context = []): void {
        $this->write('info', $message, $context);
    }

    public function debug(string $message, array $context = []): void {
        $this->write('debug', $message, $context);
    }

    /**
     * @param array<string, mixed> $context
     */
    private function write(string $level, string $message, array $context): void {
        if (!$this->isEnabled($level) || $this->path === '') {
            return;
        }
        $dir = \dirname($this->path);
        if (!is_dir($dir) || !is_writable($dir)) {
            return;
        }
        if (!$this->secureLogFile()) {
            return;
        }
        $this->rotateIfNeeded();
        $line = '[' . date('Y-m-d H:i:s') . '] [' . strtoupper($level) . '] Baikal push: '
            . $this->sanitizeString($message);
        if ($context !== []) {
            $line .= ' ' . $this->encodeContext($context);
        }
        @file_put_contents($this->path, $line . "\n", FILE_APPEND | LOCK_EX);
    }

    /**
     * JSON-encode context, redacting anything that could leak subscriber secrets.
     *
     * @param array<string, mixed> $context
     */
    private function encodeContext(array $context): string {
        $context = $this->sanitizeContext($context);
        $json = json_encode($context, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        return $json === false ? '{}' : $json;
    }

    /**
     * @param array<string, mixed> $context
     *
     * @return array<string, mixed>
     */
    private function sanitizeContext(array $context): array {
        foreach ($context as $key => $value) {
            if (preg_match('/(secret|token|password|authorization|private.?key|pubkey|endpoint)/i', (string) $key)) {
                $context[$key] = '[redacted]';
            } elseif (is_array($value)) {
                $context[$key] = $this->sanitizeContext($value);
            } elseif (is_string($value)) {
                $context[$key] = $this->sanitizeString($value);
            }
        }

        return $context;
    }

    private function sanitizeString(string $value): string {
        $value = preg_replace('/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/', '?', $value) ?? '';
        $value = preg_replace_callback('#https?://[^\s"\'<>]+#i', static function ($match) {
            $parts = parse_url($match[0]);
            if (!is_array($parts) || empty($parts['host'])) {
                return '[url]';
            }

            return strtolower((string) ($parts['scheme'] ?? 'https')) . '://' . $parts['host'] . '/…';
        }, $value) ?? '';

        return strlen($value) > 1024 ? substr($value, 0, 1024) . '…' : $value;
    }

    private function secureLogFile(): bool {
        if (!file_exists($this->path)) {
            $handle = @fopen($this->path, 'x');
            if ($handle === false) {
                return false;
            }
            @fclose($handle);
        }
        if (!@chmod($this->path, 0600)) {
            return false;
        }

        return PHP_OS_FAMILY === 'Windows' || ((int) @fileperms($this->path) & 077) === 0;
    }

    private function rotateIfNeeded(): void {
        clearstatcache(true, $this->path);
        if ((int) @filesize($this->path) < self::MAX_LOG_BYTES) {
            return;
        }
        $rotated = $this->path . '.1';
        @unlink($rotated);
        if (@rename($this->path, $rotated)) {
            @chmod($rotated, 0600);
            $handle = @fopen($this->path, 'x');
            if ($handle !== false) {
                @fclose($handle);
                @chmod($this->path, 0600);
            }
        }
    }
}
