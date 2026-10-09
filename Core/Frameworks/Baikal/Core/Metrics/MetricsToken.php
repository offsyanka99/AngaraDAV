<?php

namespace Baikal\Core\Metrics;

/**
 * Bearer token for /metrics.php.
 *
 * First non-empty value wins: ANGARA_METRICS_TOKEN, then METRICS_TOKEN,
 * then system.metrics_token. Empty, "0", and false are skipped.
 * A chosen value shorter than 16 bytes, or one that contains whitespace
 * or a control character, turns the endpoint off.
 */
final class MetricsToken {
    public const MIN_BYTES = 16;

    /**
     * @param array<string, mixed>|null $config
     */
    public static function resolve(?array $config, bool $allowConfig): ?string {
        $fromEnv = self::fromEnvironment();
        if ($fromEnv['chosen']) {
            return $fromEnv['token'];
        }
        if (!$allowConfig || !is_array($config)) {
            return null;
        }
        $system = is_array($config['system'] ?? null) ? $config['system'] : [];

        return self::accept($system['metrics_token'] ?? null);
    }

    /**
     * @return array{chosen: bool, token: ?string}
     */
    public static function fromEnvironment(): array {
        foreach (['ANGARA_METRICS_TOKEN', 'METRICS_TOKEN'] as $name) {
            $value = getenv($name);
            if ($value === false || $value === '' || $value === '0') {
                continue;
            }

            return ['chosen' => true, 'token' => self::accept($value)];
        }

        return ['chosen' => false, 'token' => null];
    }

    public static function headerMatches(string $token, string $header): bool {
        $parts = explode(' ', $header, 2);
        if (count($parts) !== 2 || strcasecmp($parts[0], 'Bearer') !== 0) {
            return false;
        }
        $presented = $parts[1];
        if ($presented === '' || preg_match('/\s/', $presented) === 1) {
            return false;
        }

        return hash_equals($token, $presented);
    }

    public static function authorizationHeader(): string {
        $header = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';

        return is_string($header) ? $header : '';
    }

    /**
     * @param mixed $value
     */
    private static function accept($value): ?string {
        if (!is_string($value) || $value === '' || $value === '0') {
            return null;
        }
        if (strlen($value) < self::MIN_BYTES || preg_match('/[\s\x00-\x1F\x7F]/', $value) === 1) {
            return null;
        }

        return $value;
    }
}
