<?php

namespace Baikal\Core\Plugins\Push;

/**
 * AES-256-GCM envelope encryption for Web Push subscription secrets.
 */
class SecretCipher {
    const PREFIX = 'enc:v1:';

    /** @var string 32-byte binary key */
    private $key;

    public function __construct(string $keyMaterial) {
        if (strlen(trim($keyMaterial)) < 16) {
            throw new \InvalidArgumentException('Database encryption key is too short for WebDAV-Push');
        }
        $this->key = hash('sha256', $keyMaterial, true);
    }

    public function encrypt(string $plaintext): string {
        $nonce = random_bytes(12);
        $tag = '';
        $ciphertext = openssl_encrypt(
            $plaintext,
            'aes-256-gcm',
            $this->key,
            OPENSSL_RAW_DATA,
            $nonce,
            $tag,
            'baikal-webdav-push-v1',
            16
        );
        if ($ciphertext === false || strlen($tag) !== 16) {
            throw new \RuntimeException('Unable to encrypt WebDAV-Push subscription secret');
        }

        return self::PREFIX . rtrim(strtr(base64_encode($nonce . $tag . $ciphertext), '+/', '-_'), '=');
    }

    public function decrypt(string $stored): string {
        // Allows a one-way migration from pre-encryption development rows.
        if (!str_starts_with($stored, self::PREFIX)) {
            return $stored;
        }
        $encoded = substr($stored, strlen(self::PREFIX));
        $padding = (4 - strlen($encoded) % 4) % 4;
        $raw = base64_decode(strtr($encoded . str_repeat('=', $padding), '-_', '+/'), true);
        if ($raw === false || strlen($raw) < 29) {
            throw new \RuntimeException('Invalid encrypted WebDAV-Push subscription secret');
        }

        $plaintext = openssl_decrypt(
            substr($raw, 28),
            'aes-256-gcm',
            $this->key,
            OPENSSL_RAW_DATA,
            substr($raw, 0, 12),
            substr($raw, 12, 16),
            'baikal-webdav-push-v1'
        );
        if ($plaintext === false) {
            throw new \RuntimeException('Unable to decrypt WebDAV-Push subscription secret');
        }

        return $plaintext;
    }

    public function blindIndex(string $value): string {
        return hash_hmac('sha256', $value, $this->key);
    }
}
