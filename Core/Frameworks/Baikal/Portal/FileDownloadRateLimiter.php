<?php

namespace Baikal\Portal;

/**
 * IP + username rate limit for portal file download/view (stolen session cookie).
 *
 * Same window as portal login ({@see Auth::RATE_LIMIT_WINDOW}); the ceiling
 * matches login ({@see Auth::RATE_LIMIT_MAX}) so a cookie cannot bulk-exfiltrate
 * a home faster than a brute-force login is already throttled.
 */
class FileDownloadRateLimiter {
    /** @var string */
    private $stateFile;

    public function __construct(string $stateFile) {
        $this->stateFile = $stateFile;
    }

    /**
     * Count one successful download/view. Throws 429 when the window is full.
     */
    public function assertAllowed(string $username): void {
        $key = $this->clientIp() . '|' . $username;
        if ($this->isRateLimited($key)) {
            error_log('AngaraDAV portal file download rate limit exceeded for ' . $this->clientIp());
            throw new ApiException('Too many file downloads. Please try again later.', 429);
        }
        $this->registerAttempt($key);
    }

    private function clientIp(): string {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';

        return is_string($ip) && $ip !== '' ? $ip : '0.0.0.0';
    }

    /**
     * @return array<string, array{start: int, count: int}>
     */
    private function load(): array {
        if (!is_readable($this->stateFile)) {
            return [];
        }
        $raw = file_get_contents($this->stateFile);
        if ($raw === false || trim($raw) === '') {
            return [];
        }
        $data = json_decode($raw, true);

        return is_array($data) ? $data : [];
    }

    /**
     * @param array<string, mixed> $data
     */
    private function save(array $data): void {
        $dir = dirname($this->stateFile);
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        $json = json_encode($data, JSON_UNESCAPED_SLASHES);
        if ($json === false) {
            return;
        }
        @file_put_contents($this->stateFile, $json . "\n", LOCK_EX);
    }

    private function isRateLimited(string $key): bool {
        $data = $this->load();
        $now = time();
        $row = $data[$key] ?? null;
        if (!is_array($row)) {
            return false;
        }
        $start = (int) ($row['start'] ?? 0);
        $count = (int) ($row['count'] ?? 0);
        if ($start <= 0 || ($now - $start) > Auth::RATE_LIMIT_WINDOW) {
            return false;
        }

        return $count >= Auth::RATE_LIMIT_MAX;
    }

    private function registerAttempt(string $key): void {
        $data = $this->load();
        $now = time();
        $row = $data[$key] ?? null;
        if (!is_array($row) || (int) ($row['start'] ?? 0) <= 0 || ($now - (int) $row['start']) > Auth::RATE_LIMIT_WINDOW) {
            $data[$key] = ['start' => $now, 'count' => 1];
        } else {
            $data[$key]['count'] = (int) ($row['count'] ?? 0) + 1;
        }
        foreach ($data as $k => $v) {
            if (!is_array($v) || ($now - (int) ($v['start'] ?? 0)) > Auth::RATE_LIMIT_WINDOW * 2) {
                unset($data[$k]);
            }
        }
        $this->save($data);
    }
}
