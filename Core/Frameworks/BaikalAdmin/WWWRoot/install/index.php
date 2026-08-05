<?php

/**
 * Classic Formal installer removed — redirect to portal installer.
 */

declare(strict_types=1);

$target = '/portal/install/';
$qs = $_SERVER['QUERY_STRING'] ?? '';
if (is_string($qs) && $qs !== '') {
    if (str_contains($qs, 'upgradeConfirmed')) {
        $target .= '#upgrade';
    } elseif (str_contains($qs, 'database')) {
        $target .= '#database';
    }
}

header('Location: ' . $target, true, 302);
header('Cache-Control: no-store');
echo 'Installer moved to <a href="' . htmlspecialchars($target, ENT_QUOTES, 'UTF-8') . '">/portal/install/</a>.';
exit;
