<?php

namespace Baikal\Core\Plugins\Push;

/**
 * Validates untrusted WebDAV-Push subscription fields.
 *
 * Push endpoints are outbound request targets, so accepting arbitrary URLs
 * would turn Baikal into an authenticated SSRF primitive. Endpoints must be
 * public HTTPS services on the standard TLS port. DNS is checked both when a
 * subscription is registered and immediately before delivery.
 */
class SubscriptionValidator {
    const MAX_ENDPOINT_LENGTH = 2048;
    const MAX_PUBLIC_KEY_LENGTH = 128;
    const MAX_AUTH_SECRET_LENGTH = 64;

    /** @var array<int, string> */
    private $allowedHosts;

    /**
     * @param array<int, string> $allowedHosts optional exact host allowlist
     */
    public function __construct(array $allowedHosts = []) {
        $this->allowedHosts = array_values(array_filter(array_map(
            static function ($host) {
                return strtolower(rtrim(trim((string) $host), '.'));
            },
            $allowedHosts
        )));
    }

    /**
     * @return string|null null when valid, otherwise a client-safe reason
     */
    public function validateEndpoint(string $endpoint): ?string {
        if ($endpoint === '' || strlen($endpoint) > self::MAX_ENDPOINT_LENGTH) {
            return 'Push endpoint is empty or too long';
        }
        if (preg_match('/[\x00-\x20\x7f]/', $endpoint)) {
            return 'Push endpoint contains invalid characters';
        }

        $parts = parse_url($endpoint);
        if (!is_array($parts)
            || strtolower((string) ($parts['scheme'] ?? '')) !== 'https'
            || empty($parts['host'])
            || isset($parts['user'])
            || isset($parts['pass'])
            || isset($parts['fragment'])
            || (isset($parts['port']) && (int) $parts['port'] !== 443)
        ) {
            return 'Push endpoint must be a public HTTPS URL on port 443';
        }

        $rawHost = strtolower((string) $parts['host']);
        if (str_ends_with($rawHost, '.')) {
            return 'Push endpoint host must not have a trailing dot';
        }
        $host = $rawHost;
        if ($this->allowedHosts !== [] && !in_array($host, $this->allowedHosts, true)) {
            return 'Push endpoint host is not allowed';
        }

        $addresses = $this->resolveHost($host);
        if ($addresses === []) {
            return 'Push endpoint host did not resolve';
        }
        foreach ($addresses as $address) {
            if (!$this->isPublicIp($address)) {
                return 'Push endpoint resolves to a non-public address';
            }
        }

        return null;
    }

    /**
     * Resolve and revalidate immediately before connecting, then return a cURL
     * host/IP pin. The caller keeps the original hostname for TLS SNI and
     * certificate verification, while CURLOPT_RESOLVE prevents DNS rebinding.
     *
     * @return array{host: string, address: string}|null
     */
    public function connectionPin(string $endpoint): ?array {
        if ($this->validateEndpoint($endpoint) !== null) {
            return null;
        }
        $parts = parse_url($endpoint);
        if (!is_array($parts) || empty($parts['host'])) {
            return null;
        }
        $host = strtolower(rtrim((string) $parts['host'], '.'));
        $addresses = $this->resolveHost($host);
        if ($addresses === []) {
            return null;
        }
        foreach ($addresses as $address) {
            if (!$this->isPublicIp($address)) {
                return null;
            }
        }
        sort($addresses, SORT_STRING);

        return ['host' => $host, 'address' => $addresses[0]];
    }

    /**
     * @return string|null null when all Web Push fields are valid
     */
    public function validateSubscription(
        string $endpoint,
        string $contentEncoding,
        string $publicKey,
        string $authSecret
    ): ?string {
        $endpointError = $this->validateEndpoint($endpoint);
        if ($endpointError !== null) {
            return $endpointError;
        }
        if ($contentEncoding !== 'aes128gcm') {
            return 'Only aes128gcm content encoding is supported';
        }
        if (!$this->isBase64Url($publicKey, self::MAX_PUBLIC_KEY_LENGTH)) {
            return 'Invalid subscription public key';
        }
        if (!$this->isBase64Url($authSecret, self::MAX_AUTH_SECRET_LENGTH)) {
            return 'Invalid subscription authentication secret';
        }

        $decodedPublicKey = $this->base64UrlDecode($publicKey);
        $decodedAuthSecret = $this->base64UrlDecode($authSecret);
        if ($decodedPublicKey === null || strlen($decodedPublicKey) !== 65 || ord($decodedPublicKey[0]) !== 4) {
            return 'Subscription public key must be an uncompressed P-256 key';
        }
        if ($decodedAuthSecret === null || strlen($decodedAuthSecret) !== 16) {
            return 'Subscription authentication secret must be 16 bytes';
        }

        return null;
    }

    /**
     * @return array<int, string>
     */
    protected function resolveHost(string $host): array {
        if (filter_var($host, FILTER_VALIDATE_IP)) {
            return [$host];
        }

        $addresses = [];
        $records = @dns_get_record($host, DNS_A | DNS_AAAA);
        if (is_array($records)) {
            foreach ($records as $record) {
                if (!empty($record['ip'])) {
                    $addresses[] = (string) $record['ip'];
                }
                if (!empty($record['ipv6'])) {
                    $addresses[] = (string) $record['ipv6'];
                }
            }
        }

        return array_values(array_unique($addresses));
    }

    protected function isPublicIp(string $address): bool {
        return filter_var(
            $address,
            FILTER_VALIDATE_IP,
            FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE
        ) !== false;
    }

    protected function isBase64Url(string $value, int $maxLength): bool {
        return $value !== ''
            && strlen($value) <= $maxLength
            && preg_match('/^[A-Za-z0-9_-]+={0,2}$/D', $value) === 1;
    }

    protected function base64UrlDecode(string $value): ?string {
        $padding = (4 - strlen($value) % 4) % 4;
        $decoded = base64_decode(strtr($value . str_repeat('=', $padding), '-_', '+/'), true);

        return $decoded === false ? null : $decoded;
    }
}
