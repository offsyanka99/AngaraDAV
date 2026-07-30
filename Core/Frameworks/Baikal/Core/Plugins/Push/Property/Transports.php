<?php

namespace Baikal\Core\Plugins\Push\Property;

use Sabre\Xml\Writer;
use Sabre\Xml\XmlSerializable;

/**
 * Serializes the {https://bitfire.at/webdav-push}transports property.
 *
 * Within this document the only transport is web-push, optionally carrying the
 * server's VAPID public key (RFC 8292).
 */
class Transports implements XmlSerializable {
    const NS = 'https://bitfire.at/webdav-push';

    /** @var string|null base64url VAPID public key (p256ecdsa) */
    private $vapidPublicKey;

    public function __construct(?string $vapidPublicKey) {
        $this->vapidPublicKey = $vapidPublicKey;
    }

    public function xmlSerialize(Writer $writer): void {
        $writer->startElement('{' . self::NS . '}web-push');
        if ($this->vapidPublicKey !== null && $this->vapidPublicKey !== '') {
            $writer->startElement('{' . self::NS . '}vapid-public-key');
            $writer->writeAttributes(['type' => 'p256ecdsa']);
            $writer->write($this->vapidPublicKey);
            $writer->endElement();
        }
        $writer->endElement();
    }
}
