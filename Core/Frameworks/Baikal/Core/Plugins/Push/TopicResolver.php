<?php

namespace Baikal\Core\Plugins\Push;

/**
 * WebDAV-Push topics: 22-char base64url identifiers sent in push messages and
 * the Web Push `Topic` header.
 *
 * File paths use a keyed HMAC so folder names cannot be recovered by the push
 * service (draft section 6.4). CalDAV/CardDAV paths keep the unkeyed SHA-256
 * topic so existing client registrations stay valid.
 */
class TopicResolver {
    private const FILES_DOMAIN = 'files-topic:v1:';

    /** @var SecretCipher */
    private $cipher;

    public function __construct(SecretCipher $cipher) {
        $this->cipher = $cipher;
    }

    public function forPath(string $path): string {
        $norm = trim($path, '/');
        if (FilesPushPaths::isFilesPath($norm)) {
            return self::encode($this->cipher->topicMac(self::FILES_DOMAIN . $norm));
        }

        return self::legacy($norm);
    }

    public static function legacy(string $path): string {
        return self::encode(hash('sha256', trim($path, '/'), true));
    }

    private static function encode(string $raw): string {
        return substr(rtrim(strtr(base64_encode($raw), '+/', '-_'), '='), 0, 22);
    }
}
