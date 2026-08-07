<?php

namespace Baikal\Portal\Admin;

/**
 * Structured audit lines for portal admin mutations.
 *
 * Writes to Specific/portal_debug.log (same file as general portal request
 * traces). Success lines need log level ≥ info; failure lines (result=error:*)
 * are written at warn so ops can see failed settings saves with
 * PORTAL_LOG_LEVEL=warn without enabling full info noise.
 *
 * Convention (single line, no secrets):
 *   admin audit actor={user} action={verb} target={id} result={ok|error:…}
 *
 * Never pass passwords, digesta1, or other secrets into $action / $target /
 * $result / $context. Callers are responsible for redaction.
 */
class AdminAudit {
    /** @var string Absolute directory for portal_debug.log (usually PROJECT_PATH_SPECIFIC) */
    private $logDir;

    /** @var string off|error|warn|info|debug */
    private $logLevel;

    public function __construct(string $logDir, string $logLevel = 'off') {
        $this->logDir = rtrim($logDir, '/');
        $level = strtolower(trim($logLevel));
        if (!in_array($level, ['off', 'error', 'warn', 'info', 'debug'], true)) {
            $level = 'off';
        }
        $this->logLevel = $level;
    }

    /**
     * Log an admin mutation (or attempted mutation).
     *
     * Example (create user):
     *   $audit->mutation('admin', 'create-user', 'alice', 'ok');
     * → admin audit actor=admin action=create-user target=alice result=ok
     *
     * Failures use result like error:400 / error:503 and log at WARN.
     *
     * @param array<string, scalar|null> $context Optional extra key=value pairs (no secrets)
     */
    public function mutation(
        string $actor,
        string $action,
        string $target = '',
        string $result = 'ok',
        array $context = []
    ): void {
        $parts = [
            'admin audit',
            'actor=' . self::safeToken($actor),
            'action=' . self::safeToken($action),
            'target=' . self::safeToken($target),
            'result=' . self::safeToken($result),
        ];
        foreach ($context as $k => $v) {
            if (!is_string($k) || $k === '') {
                continue;
            }
            if ($v === null) {
                continue;
            }
            if (!is_scalar($v)) {
                continue;
            }
            // Never allow common secret field names through
            if (preg_match('/pass|digest|secret|token|hash|csrf/i', $k)) {
                continue;
            }
            $parts[] = self::safeToken($k) . '=' . self::safeToken((string) $v);
        }
        // Failures at warn so PORTAL_LOG_LEVEL=warn still surfaces ops issues
        $min = str_starts_with(strtolower($result), 'error') ? 'warn' : 'info';
        $this->write($min, implode(' ', $parts));
    }

    /**
     * Whether success (info) audit lines would be written at the current log level.
     */
    public function isEnabled(): bool {
        return $this->levelEnabled('info');
    }

    /**
     * Whether failure (warn) audit lines would be written.
     */
    public function isFailureLoggingEnabled(): bool {
        return $this->levelEnabled('warn');
    }

    private function levelEnabled(string $min): bool {
        $order = ['off' => 0, 'error' => 1, 'warn' => 2, 'info' => 3, 'debug' => 4];
        $cur = $order[$this->logLevel] ?? 0;
        $need = $order[$min] ?? 3;

        return $cur >= $need;
    }

    private function write(string $min, string $message): void {
        if (!$this->levelEnabled($min)) {
            return;
        }
        if ($this->logDir === '' || !is_dir($this->logDir) || !is_writable($this->logDir)) {
            return;
        }
        $path = $this->logDir . '/portal_debug.log';
        $ts = date('Y-m-d H:i:s');
        $level = strtoupper($min);
        @file_put_contents(
            $path,
            '[' . $ts . '] [' . $level . '] AngaraDAV portal: ' . $message . "\n",
            FILE_APPEND | LOCK_EX
        );
    }

    /**
     * Collapse control chars and whitespace so one audit event stays one log line.
     */
    private static function safeToken(string $value): string {
        $value = preg_replace('/[\x00-\x1F\x7F]+/', ' ', $value) ?? '';
        $value = preg_replace('/\s+/', ' ', trim($value)) ?? '';
        if ($value === '') {
            return '-';
        }

        // Avoid breaking key=value parsing
        return str_replace([' ', '='], ['_', '_'], $value);
    }
}
