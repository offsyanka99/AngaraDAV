<?php

namespace Baikal\Portal;

/**
 * Numbers for the portal and WebDAV Basic source-address limit, and for the
 * portal username cool-down. Missing or invalid YAML values use the defaults.
 */
final class LoginRatePolicy {
    public const IP_MAX_DEFAULT = 20;

    public const IP_WINDOW_MINUTES_DEFAULT = 15;

    public const USER_MAX_DEFAULT = 10;

    public const USER_WINDOW_MINUTES_DEFAULT = 15;

    public const USER_COOLDOWN_MINUTES_DEFAULT = 15;

    public function __construct(
        private int $ipMax = self::IP_MAX_DEFAULT,
        private int $ipWindowSeconds = self::IP_WINDOW_MINUTES_DEFAULT * 60,
        private int $userMax = self::USER_MAX_DEFAULT,
        private int $userWindowSeconds = self::USER_WINDOW_MINUTES_DEFAULT * 60,
        private int $userCooldownSeconds = self::USER_COOLDOWN_MINUTES_DEFAULT * 60,
    ) {
    }

    /**
     * @param array<string, mixed> $system
     */
    public static function fromSystem(array $system): self {
        return new self(
            self::clamp($system['auth_ip_max_failures'] ?? null, 1, 1000, self::IP_MAX_DEFAULT),
            self::clamp($system['auth_ip_window_minutes'] ?? null, 1, 1440, self::IP_WINDOW_MINUTES_DEFAULT) * 60,
            self::clamp($system['auth_user_max_failures'] ?? null, 1, 1000, self::USER_MAX_DEFAULT),
            self::clamp($system['auth_user_window_minutes'] ?? null, 1, 1440, self::USER_WINDOW_MINUTES_DEFAULT) * 60,
            self::clamp($system['auth_user_cooldown_minutes'] ?? null, 1, 1440, self::USER_COOLDOWN_MINUTES_DEFAULT) * 60,
        );
    }

    public function ipMax(): int {
        return $this->ipMax;
    }

    public function ipWindowSeconds(): int {
        return $this->ipWindowSeconds;
    }

    public function userMax(): int {
        return $this->userMax;
    }

    public function userWindowSeconds(): int {
        return $this->userWindowSeconds;
    }

    public function userCooldownSeconds(): int {
        return $this->userCooldownSeconds;
    }

    /**
     * @param mixed $value
     */
    private static function clamp($value, int $min, int $max, int $default): int {
        if (!is_numeric($value)) {
            return $default;
        }
        $n = (int) $value;
        if ($n < $min) {
            return $min;
        }
        if ($n > $max) {
            return $max;
        }

        return $n;
    }
}
