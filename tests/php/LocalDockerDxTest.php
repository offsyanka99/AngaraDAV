<?php

/**
 * Operator DX contracts: local compose, skip-chown fail, Makefile, Vite proxy.
 *
 * Run: php tests/php/LocalDockerDxTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
$failures = 0;

function assert_true(bool $condition, string $message): void {
    global $failures;
    if ($condition) {
        echo "OK  $message\n";

        return;
    }
    echo "FAIL $message\n";
    ++$failures;
}

$compose = (string) file_get_contents($root . '/docs/local.compose.yaml');
assert_true(str_contains($compose, 'container_name: angaradav-local'), 'compose container angaradav-local');
assert_true(str_contains($compose, 'image: angaradav:local'), 'compose image angaradav:local');
assert_true(str_contains($compose, '"31088:80"'), 'compose port 31088');
assert_true(str_contains($compose, '.local-run/config'), 'compose bind .local-run/config');
assert_true(str_contains($compose, '.local-run/Specific'), 'compose bind .local-run/Specific');

$rootCompose = (string) file_get_contents($root . '/compose.yaml');
assert_true(str_contains($rootCompose, 'docs/local.compose.yaml'), 'repo-root compose.yaml includes local file');

$skip = (string) file_get_contents($root . '/docker/entrypoint.d/26-check-skip-chown-writable.sh');
$fix = (string) file_get_contents($root . '/docker/entrypoint.d/40-fix-baikal-file-permissions.sh');
assert_true(str_contains($skip, '1|true|TRUE|yes|YES|on|ON'), 'skip-chown only truthy values');
assert_true(str_contains($fix, '1|true|TRUE|yes|YES|on|ON'), 'chown script only skips on truthy values');
assert_true(str_contains($skip, 'exit 1'), 'skip-chown fails loudly');
assert_true(str_contains($skip, 'chown -R 101:101'), 'skip-chown error mentions host chown 101:101');

$make = (string) file_get_contents($root . '/Makefile');
assert_true(str_contains($make, 'BUILD_DIR=build/angaradav'), 'dist zip dir is angaradav not baikal');
assert_true(str_contains($make, 'angaradav-$(VERSION).zip'), 'dist zip name angaradav-VERSION');
assert_true(str_contains($make, "\nportal:"), 'make portal target');
assert_true(str_contains($make, "\nphp-test:"), 'make php-test target');
assert_true(str_contains($make, 'portal/node_modules is owned by root'), 'make portal refuses root-owned node_modules');
assert_true(!str_contains($make, 'composer.lock: composer.json'), 'make does not composer update from composer.json');

$script = (string) file_get_contents($root . '/scripts/local-docker.sh');
assert_true(str_contains($script, '--force-recreate'), 'local-up force-recreates');
assert_true(str_contains($script, 'health.php'), 'local-up waits on health.php');

$vite = (string) file_get_contents($root . '/portal/vite.config.ts');
assert_true(str_contains($vite, '127.0.0.1:31088'), 'Vite /api proxy defaults to local-up port');

$gitignore = (string) file_get_contents($root . '/.gitignore');
assert_true(str_contains($gitignore, '.local-run/'), '.local-run is gitignored');

$readme = (string) file_get_contents($root . '/README.md');
assert_true(str_contains($readme, 'angaradav-local'), 'README names local container');
assert_true(str_contains($readme, 'force-recreate') || str_contains($readme, 'Recreate'), 'README recreate vs restart');

if ($failures > 0) {
    fwrite(STDERR, "$failures assertion(s) failed\n");
    exit(1);
}
echo "All Local Docker DX checks passed.\n";
exit(0);
