<?php

namespace Baikal\Portal;

/**
 * Shared same-origin checks for portal + install JSON APIs.
 *
 * Duplicated previously in App and InstallApp; keep one implementation so
 * Origin/Referer policy cannot drift between surfaces.
 */
final class SameOrigin {
    /**
     * Reject cross-site browser requests (defense in depth with SameSite + CSRF).
     * Fail closed when neither Origin nor Referer is present.
     *
     * Empty Host is treated as non-browser / misconfigured front-end and allowed
     * (same behaviour as the historical portal check).
     *
     * @param array<string, mixed> $server typically $_SERVER
     *
     * @throws ApiException 403 when the request must not proceed
     */
    public static function assert(array $server): void {
        $host = isset($server['HTTP_HOST']) && is_string($server['HTTP_HOST'])
            ? $server['HTTP_HOST']
            : '';
        if ($host === '') {
            return;
        }

        $origin = isset($server['HTTP_ORIGIN']) && is_string($server['HTTP_ORIGIN'])
            ? $server['HTTP_ORIGIN']
            : '';
        if ($origin !== '') {
            if (!self::hostMatches($origin, $host)) {
                throw new ApiException('Cross-origin request blocked', 403);
            }

            return;
        }

        $referer = isset($server['HTTP_REFERER']) && is_string($server['HTTP_REFERER'])
            ? $server['HTTP_REFERER']
            : '';
        if ($referer !== '') {
            // Referer with empty host: ignore and fall through (fail closed)
            $parts = parse_url($referer);
            $rh = is_array($parts) ? (string) ($parts['host'] ?? '') : '';
            if ($rh !== '' && !self::hostMatches($referer, $host)) {
                throw new ApiException('Cross-origin request blocked', 403);
            }
            if ($rh !== '') {
                return;
            }
        }

        throw new ApiException('Missing Origin or Referer on state-changing request', 403);
    }

    private static function hostMatches(string $url, string $expectedHost): bool {
        $parts = parse_url($url);
        if (!is_array($parts)) {
            return false;
        }
        $h = (string) ($parts['host'] ?? '');
        if ($h === '') {
            return false;
        }
        if (isset($parts['port'])) {
            $h .= ':' . $parts['port'];
        }

        return strcasecmp($h, $expectedHost) === 0;
    }
}
