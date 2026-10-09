<?php

/**
 * Unit checks for Baikal\Portal\Admin\AdminBackupService.
 *
 * Run: php tests/php/AdminBackupServiceTest.php
 */

declare(strict_types=1);

$root = dirname(__DIR__, 2);
require $root . '/vendor/autoload.php';

use Baikal\Portal\Admin\AdminBackupService;
use Baikal\Portal\Admin\AdminSettingsService;
use Baikal\Portal\ApiException;
use Symfony\Component\Yaml\Yaml;

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

function assert_throws(callable $fn, string $message): void {
    try {
        $fn();
    } catch (ApiException $e) {
        assert_true(true, $message . ' (status ' . $e->getStatus() . ': ' . $e->getMessage() . ')');

        return;
    }
    assert_true(false, $message . ' (did not throw)');
}

$dir = sys_get_temp_dir() . '/baikal-backup-test-' . bin2hex(random_bytes(4));
@mkdir($dir, 0700, true);
$path = $dir . '/configuration.yaml';

$initial = [
    'system' => [
        'timezone'            => 'UTC',
        'cal_enabled'         => true,
        'card_enabled'        => true,
        'files_enabled'       => false,
        'files_max_upload_mb' => 100,
        'admin_passwordhash'  => password_hash('oldadmin', PASSWORD_DEFAULT),
        'auth_realm'          => 'BaikalDAV',
    ],
    'database' => ['backend' => 'sqlite', 'sqlite_file' => $dir . '/db.sqlite'],
];
file_put_contents($path, Yaml::dump($initial, 4, 2));

$settings = new AdminSettingsService($path, $dir);
$backup = new AdminBackupService($settings, $dir);

// Export: full allow-list, no secrets
$doc = $backup->export('admin');
assert_true($doc['kind'] === 'angaradav.settings-backup', 'export kind');
assert_true(!array_key_exists('admin_passwordhash', $doc['settings']), 'export has no password hash');
assert_true(!array_key_exists('digesta1', $doc['settings']), 'export has no digest');
assert_true(!array_key_exists('pgsql_password', $doc['settings']), 'export has no pgsql password');
assert_true(!array_key_exists('encryption_key', $doc['settings']), 'export has no encryption key');
foreach ($settings->editableKeys() as $key) {
    assert_true(array_key_exists($key, $doc['settings']), 'export includes ' . $key);
}
assert_true(($doc['database']['backend'] ?? null) === 'sqlite', 'export database backend informational');

// Round trip: preview of its own export reports nothing changed
$preview = $backup->preview($doc);
assert_true($preview['changed'] === [], 'round-trip preview: no changes');
assert_true($preview['unknown'] === [], 'round-trip preview: no unknown keys');
assert_true($preview['invalid'] === [], 'round-trip preview: no invalid keys');

// Preview does not write
$mtimeBefore = filemtime($path);
clearstatcache();
$backup->preview($doc);
clearstatcache();
assert_true(filemtime($path) === $mtimeBefore, 'preview does not touch configuration.yaml');

// A changed value is reported and (on restore) applied
$doc2 = $doc;
$doc2['settings']['files_max_upload_mb'] = 512;
$doc2['settings']['timezone'] = 'America/Toronto';
unset($doc2['checksum']); // stale checksum after edit; restore must not require it
$preview2 = $backup->preview($doc2);
assert_true(count($preview2['changed']) === 2, 'preview reports 2 changed keys');
assert_true(($preview2['changed']['files_max_upload_mb']['to'] ?? null) === 512, 'preview shows new value');

$restored = $backup->restore($doc2, true, 'admin');
assert_true(in_array('files_max_upload_mb', $restored['applied'], true), 'restore applied files_max_upload_mb');
$after = $settings->getSystemSettings();
assert_true((int) $after['files_max_upload_mb'] === 512, 'restore actually wrote the new value');
assert_true($after['timezone'] === 'America/Toronto', 'restore actually wrote timezone');

$docPush = $backup->export('admin');
assert_true(($docPush['settings']['push_files_enabled'] ?? null) === false, 'export includes push_files_enabled');
$docPush['settings']['push_files_enabled'] = true;
unset($docPush['checksum']);
$restoredPush = $backup->restore($docPush, true, 'admin');
assert_true($restoredPush['applied'] === ['push_files_enabled'], 'restore applies push_files_enabled');
assert_true($settings->getSystemSettings()['push_files_enabled'] === true, 'push_files_enabled round-trips through backup');

// Unknown key: ignored, not applied, no error
$doc3 = $doc;
$doc3['settings']['totally_made_up_key'] = 'x';
unset($doc3['checksum']);
$preview3 = $backup->preview($doc3);
assert_true($preview3['unknown'] === ['totally_made_up_key'], 'unknown key bucketed, not rejected');

// Invalid value: bucketed, never applied (numeric fields clamp instead of throwing,
// so use an enum field that actually rejects an out-of-range value)
$doc4 = $doc;
$doc4['settings']['dav_auth_type'] = 'NotARealAuthType';
unset($doc4['checksum']);
$preview4 = $backup->preview($doc4);
assert_true(count($preview4['invalid']) === 1, 'invalid enum value bucketed as invalid');
assert_true($preview4['invalid'][0]['key'] === 'dav_auth_type', 'invalid bucket names the key');

// Forbidden key: whole request rejected
$doc5 = $doc;
$doc5['settings']['admin_passwordhash'] = 'nope';
unset($doc5['checksum']);
assert_throws(fn () => $backup->preview($doc5), 'forbidden key in backup is rejected');

$docToken = $doc;
$docToken['settings']['metrics_token'] = '0123456789abcdef';
unset($docToken['checksum']);
try {
    $backup->preview($docToken);
    assert_true(false, 'metrics_token in a backup is rejected');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 400, 'metrics_token backup is 400');
    assert_true(str_contains($e->getMessage(), 'metrics_token'), 'metrics_token backup names the key');
    assert_true(!str_contains($e->getMessage(), '0123456789abcdef'), 'metrics_token backup does not echo the secret');
}
$docTokenCamel = $doc;
$docTokenCamel['settings']['metricsToken'] = '0123456789abcdef';
unset($docTokenCamel['checksum']);
try {
    $backup->preview($docTokenCamel);
    assert_true(false, 'metricsToken in a backup is rejected');
} catch (ApiException $e) {
    assert_true($e->getStatus() === 400, 'metricsToken backup is 400');
    assert_true(!str_contains($e->getMessage(), '0123456789abcdef'), 'metricsToken backup does not echo the secret');
}

// Malformed documents rejected before any settings are touched
assert_throws(fn () => $backup->preview(['kind' => 'something-else', 'formatVersion' => 1, 'settings' => ['timezone' => 'UTC']]), 'wrong kind rejected');
assert_throws(fn () => $backup->preview(['kind' => 'angaradav.settings-backup', 'formatVersion' => 99, 'settings' => ['timezone' => 'UTC']]), 'future formatVersion rejected');
assert_throws(fn () => $backup->preview(['kind' => 'angaradav.settings-backup', 'formatVersion' => 1, 'settings' => []]), 'empty settings rejected');
assert_throws(fn () => $backup->preview(['kind' => 'angaradav.settings-backup', 'formatVersion' => 1, 'settings' => ['a', 'b']]), 'list-shaped settings rejected');

// Corrupt checksum rejected
$doc6 = $doc;
$doc6['checksum'] = 'sha256:' . str_repeat('0', 64);
assert_throws(fn () => $backup->preview($doc6), 'bad checksum rejected');

// Restore without confirm is rejected
assert_throws(fn () => $backup->restore($doc, false, 'admin'), 'restore requires confirm');

$rawGen = Yaml::parseFile($path);
$rawGen['system']['portal_session_generation'] = 4;
file_put_contents($path, Yaml::dump($rawGen, 4, 2));
$settingsGen = new AdminSettingsService($path, $dir);
$backupGen = new AdminBackupService($settingsGen, $dir);
assert_true(!in_array('portal_session_generation', $settingsGen->editableKeys(), true), 'generation is not editable');
$docGen = $backupGen->export('admin');
assert_true(!array_key_exists('portal_session_generation', $docGen['settings']), 'export omits session generation');
$docGen['settings']['timezone'] = 'Europe/Paris';
$docGen['settings']['portal_session_generation'] = 99;
unset($docGen['checksum']);
$previewGen = $backupGen->preview($docGen);
assert_true($previewGen['unknown'] === ['portal_session_generation'], 'generation key is unknown on restore');
$appliedGen = $backupGen->restore($docGen, true, 'admin');
assert_true(in_array('timezone', $appliedGen['applied'], true), 'restore still applies an editable key');
assert_true(!in_array('portal_session_generation', $appliedGen['applied'], true), 'restore does not apply generation');
$afterGen = Yaml::parseFile($path);
assert_true(($afterGen['system']['portal_session_generation'] ?? null) === 4, 'settings restore leaves the generation unchanged');

echo $failures === 0 ? "\nAll AdminBackupService checks passed.\n" : "\n$failures check(s) FAILED.\n";
exit($failures === 0 ? 0 : 1);
