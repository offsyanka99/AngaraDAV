<?php

declare(strict_types=1);

/**
 * Refuse PHP builds that predate the 2026-10-21 php2shell fixes
 * (CVE-2026-109618, CVE-2026-109619).
 *
 * Patched lines: 8.4.27+, 8.5.12+, and 8.6.0RC4+ (the first 8.6 build
 * that includes the same fixes). Compare each minor line on its own:
 * 8.6.0RC3 is less than 8.6.0, so an upper bound of 8.6.0 would accept it.
 * CI installs PHP 8.6 as a nightly that still reports 8.6.0-dev. That
 * string sorts before RC4, but the nightly contains the RC4 fixes.
 *
 * Run: php scripts/check-php-security-floor.php
 * Optional: php scripts/check-php-security-floor.php 8.5.11
 */
function angara_php_meets_security_floor(string $version): bool {
    if (!preg_match('/^(\d+)\.(\d+)/', $version, $match)) {
        return false;
    }
    $major = (int) $match[1];
    $minor = (int) $match[2];
    if ($major === 8 && $minor === 4) {
        return version_compare($version, '8.4.27', '>=');
    }
    if ($major === 8 && $minor === 5) {
        return version_compare($version, '8.5.12', '>=');
    }
    if ($major === 8 && $minor >= 6) {
        if (preg_match('/^8\.6\.0-dev$/i', $version)) {
            return true;
        }

        return version_compare($version, '8.6.0RC4', '>=');
    }

    return $major > 8;
}

if (PHP_SAPI === 'cli' && isset($argv[0]) && realpath((string) $argv[0]) === realpath(__FILE__)) {
    $version = $argv[1] ?? PHP_VERSION;
    if (!is_string($version) || !angara_php_meets_security_floor($version)) {
        $shown = is_string($version) ? $version : PHP_VERSION;
        fwrite(STDERR, "PHP {$shown} is below the php2shell floor (8.4.27, 8.5.12, 8.6.0RC4, or 8.6.0-dev).\n");
        exit(1);
    }
    fwrite(STDOUT, "PHP {$version} meets the php2shell floor.\n");
}
