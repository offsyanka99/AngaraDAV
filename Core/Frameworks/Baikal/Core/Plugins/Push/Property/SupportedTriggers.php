<?php

namespace Baikal\Core\Plugins\Push\Property;

use Sabre\Xml\Writer;
use Sabre\Xml\XmlSerializable;

/**
 * Serializes the {https://bitfire.at/webdav-push}supported-triggers property.
 *
 * Each supported trigger carries the maximum {DAV:}depth the resource supports.
 * A null depth means the trigger is not supported and is omitted.
 */
class SupportedTriggers implements XmlSerializable {
    const NS = 'https://bitfire.at/webdav-push';

    /** @var string|null '0'|'1'|'infinity' or null when unsupported */
    private $contentDepth;

    /** @var string|null '0'|'1'|'infinity' or null when unsupported */
    private $propertyDepth;

    public function __construct(?string $contentDepth, ?string $propertyDepth) {
        $this->contentDepth = $contentDepth;
        $this->propertyDepth = $propertyDepth;
    }

    public function xmlSerialize(Writer $writer): void {
        if ($this->contentDepth !== null) {
            $writer->startElement('{' . self::NS . '}content-update');
            $writer->writeElement('{DAV:}depth', $this->contentDepth);
            $writer->endElement();
        }
        if ($this->propertyDepth !== null) {
            $writer->startElement('{' . self::NS . '}property-update');
            $writer->writeElement('{DAV:}depth', $this->propertyDepth);
            $writer->endElement();
        }
    }
}
