<?php

namespace Baikal\Core\Plugins\Push;

/**
 * Parses a WebDAV-Push <push-register> request body (application/xml).
 *
 * Kept transport/DOM-only (no server dependencies) so it can be unit-tested.
 * Validation of "is this usable" (preconditions invalid-subscription /
 * no-trigger-supported) is left to the caller, which has the resource context.
 */
class RegisterParser {
    const NS_PUSH = 'https://bitfire.at/webdav-push';
    const NS_DAV = 'DAV:';
    const MAX_BODY_BYTES = 65536;

    /**
     * @return array{
     *   pushResource: ?string,
     *   contentEncoding: string,
     *   pubkey: ?string,
     *   authSecret: ?string,
     *   requestedContentDepth: ?string,
     *   requestedPropertyDepth: ?string,
     *   expires: ?int
     * }|null null when the body is not a push-register document
     */
    public static function parse(string $body): ?array {
        $body = trim($body);
        if ($body === ''
            || strlen($body) > self::MAX_BODY_BYTES
            || stripos($body, 'push-register') === false
            || preg_match('/<!DOCTYPE\b/i', $body)
        ) {
            return null;
        }

        $prev = libxml_use_internal_errors(true);
        $dom = new \DOMDocument();
        $ok = $dom->loadXML($body, LIBXML_NONET | LIBXML_NOERROR | LIBXML_NOWARNING);
        libxml_clear_errors();
        libxml_use_internal_errors($prev);
        if (!$ok || $dom->documentElement === null) {
            return null;
        }
        if ($dom->documentElement->localName !== 'push-register') {
            return null;
        }

        $xpath = new \DOMXPath($dom);
        $xpath->registerNamespace('P', self::NS_PUSH);
        $xpath->registerNamespace('D', self::NS_DAV);

        $result = [
            'pushResource'           => self::text($xpath, '//P:subscription/P:web-push-subscription/P:push-resource'),
            'contentEncoding'        => self::text($xpath, '//P:subscription/P:web-push-subscription/P:content-encoding') ?? 'aes128gcm',
            'pubkey'                 => self::text($xpath, '//P:subscription/P:web-push-subscription/P:subscription-public-key'),
            'authSecret'             => self::text($xpath, '//P:subscription/P:web-push-subscription/P:auth-secret'),
            'requestedContentDepth'  => self::depth($xpath, '//P:trigger/P:content-update/D:depth'),
            'requestedPropertyDepth' => self::depth($xpath, '//P:trigger/P:property-update/D:depth'),
            'expires'                => self::expires(self::text($xpath, '//P:expires')),
        ];

        return $result;
    }

    private static function text(\DOMXPath $xpath, string $query): ?string {
        $node = $xpath->query($query)?->item(0);
        if ($node === null) {
            return null;
        }
        $value = trim($node->textContent);

        return $value === '' ? null : $value;
    }

    /**
     * A present depth element defaults to '0' when empty; unknown values are
     * clamped to a valid token. Returns null when the trigger is absent.
     */
    private static function depth(\DOMXPath $xpath, string $query): ?string {
        // Determine whether the parent trigger element exists at all.
        $triggerQuery = preg_replace('#/D:depth$#', '', $query);
        $triggerNode = $triggerQuery !== null ? ($xpath->query($triggerQuery)?->item(0)) : null;
        if ($triggerNode === null) {
            return null;
        }

        $depth = self::text($xpath, $query) ?? '0';
        $depth = strtolower($depth);
        if (!in_array($depth, ['0', '1', 'infinity'], true)) {
            $depth = '0';
        }

        return $depth;
    }

    private static function expires(?string $value): ?int {
        if ($value === null) {
            return null;
        }
        $ts = strtotime($value);

        return $ts === false ? null : $ts;
    }
}
