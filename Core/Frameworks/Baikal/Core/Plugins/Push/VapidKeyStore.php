<?php

namespace Baikal\Core\Plugins\Push;

/**
 * Persists the server's VAPID (RFC 8292) key pair used for Web Push.
 *
 * Stored as JSON in Specific/push_vapid.json (like portal_meta.json) rather than
 * baikal.yaml, so it can be generated lazily on first use without rewriting the
 * main config file. The key pair is server-wide (the same for every resource,
 * as recommended by the spec).
 *
 * The public key is advertised to clients (transports property); the private key
 * never leaves the server and is redacted from logs.
 */
class VapidKeyStore {
    /** @var string */
    private $path;

    /** @var PushLogger|null */
    private $logger;

    /** @var array{publicKey?: string, privateKey?: string}|null */
    private $keys;

    public function __construct(?string $path = null, ?PushLogger $logger = null) {
        if ($path === null) {
            $dir = defined('PROJECT_PATH_SPECIFIC') ? PROJECT_PATH_SPECIFIC : '';
            $path = $dir . 'push_vapid.json';
        }
        $this->path = $path;
        $this->logger = $logger;
    }

    /**
     * Base64url (uncompressed, p256) VAPID public key, or null if unavailable.
     */
    public function getPublicKey(): ?string {
        $keys = $this->load();

        return $keys['publicKey'] ?? null;
    }

    /**
     * @return array{publicKey: string, privateKey: string}|null
     */
    public function getKeys(): ?array {
        $keys = $this->load();
        if (!isset($keys['publicKey'], $keys['privateKey'])) {
            return null;
        }

        return ['publicKey' => $keys['publicKey'], 'privateKey' => $keys['privateKey']];
    }

    /**
     * Load existing keys, or generate + persist them on first call.
     *
     * @return array{publicKey?: string, privateKey?: string}
     */
    private function load(): array {
        if ($this->keys !== null) {
            return $this->keys;
        }

        if (file_exists($this->path)) {
            if (!is_readable($this->path) || !$this->hasSecurePermissions($this->path)) {
                $this->logger?->error('VAPID key file is unreadable or has unsafe permissions');

                return $this->keys = [];
            }
            $raw = @file_get_contents($this->path);
            $decoded = is_string($raw) ? json_decode($raw, true) : null;
            if (is_array($decoded) && isset($decoded['publicKey'], $decoded['privateKey'])) {
                return $this->keys = [
                    'publicKey'  => (string) $decoded['publicKey'],
                    'privateKey' => (string) $decoded['privateKey'],
                ];
            }
            $this->logger?->error('VAPID key file is malformed; refusing automatic rotation');

            return $this->keys = [];
        }

        return $this->keys = $this->generate();
    }

    /**
     * @return array{publicKey?: string, privateKey?: string}
     */
    private function generate(): array {
        if (!class_exists(\Minishlink\WebPush\VAPID::class)) {
            $this->logger?->error('cannot generate VAPID keys: minishlink/web-push not installed');

            return [];
        }
        try {
            $generated = \Minishlink\WebPush\VAPID::createVapidKeys();
        } catch (\Throwable $e) {
            $this->logger?->error('VAPID key generation failed', ['error' => $e->getMessage()]);

            return [];
        }

        $keys = [
            'publicKey'  => (string) $generated['publicKey'],
            'privateKey' => (string) $generated['privateKey'],
        ];

        $dir = \dirname($this->path);
        if (!is_dir($dir) || !is_writable($dir)) {
            $this->logger?->error('cannot persist VAPID keys: Specific/ not writable', ['dir' => $dir]);

            return [];
        }

        $json = json_encode($keys, JSON_UNESCAPED_SLASHES);
        if ($json === false || !$this->atomicWrite($json)) {
            $this->logger?->error('failed to persist VAPID key pair securely');

            return [];
        }
        $this->logger?->info('generated new VAPID key pair');

        return $keys;
    }

    private function atomicWrite(string $json): bool {
        $tmp = $this->path . '.tmp-' . bin2hex(random_bytes(6));
        $handle = @fopen($tmp, 'x+b');
        if ($handle === false) {
            return false;
        }
        $ok = @chmod($tmp, 0600)
            && @flock($handle, LOCK_EX)
            && @fwrite($handle, $json) === strlen($json)
            && @fflush($handle);
        if (function_exists('fsync')) {
            $ok = @fsync($handle) && $ok;
        }
        @flock($handle, LOCK_UN);
        @fclose($handle);

        if (!$ok || !$this->hasSecurePermissions($tmp) || !@rename($tmp, $this->path)) {
            @unlink($tmp);

            return false;
        }

        return $this->hasSecurePermissions($this->path);
    }

    private function hasSecurePermissions(string $path): bool {
        if (PHP_OS_FAMILY === 'Windows') {
            return true;
        }
        clearstatcache(true, $path);
        $permissions = @fileperms($path);

        return $permissions !== false && ((int) $permissions & 077) === 0;
    }
}
