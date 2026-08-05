<?php

/**
 * Classic Formal Web Admin removed — redirect to portal Administration.
 */

declare(strict_types=1);

// Location must not include a URL fragment (RFC 7231); SPA opens Administration after login.
header('Location: /portal/', true, 302);
header('Cache-Control: no-store');
echo 'Web Admin moved to <a href="/portal/">/portal/</a> (user menu → Administration).';
exit;
