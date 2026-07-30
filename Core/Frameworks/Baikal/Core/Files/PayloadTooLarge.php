<?php

namespace Baikal\Core\Files;

class PayloadTooLarge extends \Sabre\DAV\Exception {
    public function getHTTPCode() {
        return 413;
    }
}
