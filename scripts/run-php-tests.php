<?php

declare(strict_types=1);

/**
 * Run every standalone tests/php script. Stops on the first non-zero exit.
 * PostgreSQL scripts skip with exit 0 when their DSN is unset.
 */
$root = dirname(__DIR__);
$files = glob($root . '/tests/php/*.php');
if ($files === false) {
    fwrite(STDERR, "No tests/php scripts found\n");
    exit(1);
}
sort($files);

foreach ($files as $file) {
    $label = 'tests/php/' . basename($file);
    echo '== ' . $label . PHP_EOL;
    passthru('php ' . escapeshellarg($file), $code);
    if ($code !== 0) {
        exit($code);
    }
}

exit(0);
