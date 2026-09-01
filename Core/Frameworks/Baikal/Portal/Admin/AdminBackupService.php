<?php

namespace Baikal\Portal\Admin;

use Baikal\Portal\ApiException;

/**
 * Export/restore a JSON snapshot of the editable system settings.
 *
 * Deliberately narrow: no secrets, no database DSN restore, no user/DAV data.
 * All validation is delegated to AdminSettingsService (same allow-list, same
 * coercion, same atomic YAML write) so a restore is never a weaker path than
 * a normal PATCH /admin/settings/system.
 */
class AdminBackupService {
    private const KIND = 'angaradav.settings-backup';
    private const FORMAT_VERSION = 1;
    private const MAX_BYTES = 256 * 1024;
    private const MAX_KEYS = 200;

    /** Max restores per admin username per window (abuse guard on baikal.yaml churn). */
    private const RESTORE_RATE_MAX = 10;
    private const RESTORE_RATE_WINDOW = 900;

    private AdminSettingsService $settings;
    private string $specificDir;

    public function __construct(AdminSettingsService $settings, string $specificDir) {
        $this->settings = $settings;
        $this->specificDir = rtrim($specificDir, '/');
    }

    /**
     * @return array<string, mixed>
     */
    public function export(string $actor): array {
        $current = $this->settings->getSystemSettings();
        $editable = [];
        foreach ($this->settings->editableKeys() as $key) {
            $editable[$key] = $current[$key] ?? null;
        }

        $db = $this->settings->getDatabaseSettings();
        $database = ['backend' => $db['backend'] ?? ''];
        if (($db['backend'] ?? '') === 'pgsql') {
            $database['pgsql_host'] = $db['pgsql_host'] ?? '';
            $database['pgsql_dbname'] = $db['pgsql_dbname'] ?? '';
        } else {
            $database['sqlite_file'] = $db['sqlite_file'] ?? '';
        }

        return [
            'kind'           => self::KIND,
            'formatVersion'  => self::FORMAT_VERSION,
            'productVersion' => defined('BAIKAL_VERSION') ? BAIKAL_VERSION : '',
            'createdAt'      => gmdate('Y-m-d\TH:i:s\Z'),
            'createdBy'      => $actor,
            'settings'       => $editable,
            'database'       => $database,
            'checksum'       => $this->checksum($editable),
        ];
    }

    /**
     * Dry run: report what a restore would change, without writing anything.
     *
     * @param array<string, mixed> $document
     *
     * @return array<string, mixed>
     */
    public function preview(array $document): array {
        return $this->analyze($document, false, '');
    }

    /**
     * Apply the "changed" keys from $document via AdminSettingsService::updateSystemSettings().
     *
     * @param array<string, mixed> $document
     *
     * @return array<string, mixed>
     */
    public function restore(array $document, bool $confirm, string $actor): array {
        if (!$confirm) {
            throw new ApiException('Confirmation required to restore settings', 400);
        }
        if ($this->isRestoreRateLimited($actor)) {
            throw new ApiException('Too many restore attempts. Please try again later.', 429);
        }
        $this->registerRestoreAttempt($actor);

        return $this->analyze($document, true, $actor);
    }

    /**
     * @param array<string, mixed> $document
     *
     * @return array<string, mixed>
     */
    private function analyze(array $document, bool $apply, string $actor): array {
        $settingsIn = $this->assertDocumentShape($document);
        $current = $this->settings->getSystemSettings();
        $editableKeys = array_flip($this->settings->editableKeys());

        $changed = [];
        $unchanged = [];
        $invalid = [];
        $unknown = [];

        foreach ($settingsIn as $key => $value) {
            if ($this->settings->isForbiddenKey($key)) {
                throw new ApiException('Backup contains a forbidden field: ' . $key, 400);
            }
            if (!isset($editableKeys[$key])) {
                $unknown[] = $key;
                continue;
            }
            try {
                $coerced = $this->settings->coerceSettingValue($key, $value);
            } catch (ApiException $e) {
                $invalid[] = ['key' => $key, 'reason' => $e->getMessage()];
                continue;
            }
            if (($current[$key] ?? null) === $coerced) {
                $unchanged[] = $key;
            } else {
                $changed[$key] = ['from' => $current[$key] ?? null, 'to' => $coerced];
            }
        }

        $productVersion = is_string($document['productVersion'] ?? null) ? $document['productVersion'] : '';
        $result = [
            'changed'         => $changed,
            'unchanged'       => $unchanged,
            'invalid'         => $invalid,
            'unknown'         => $unknown,
            'productVersion'  => $productVersion,
            'versionMismatch' => defined('BAIKAL_VERSION') && $productVersion !== '' && $productVersion !== BAIKAL_VERSION,
            'applied'         => [],
        ];

        if ($apply && $changed !== []) {
            $body = [];
            foreach (array_keys($changed) as $key) {
                $body[$key] = $settingsIn[$key];
            }
            $this->settings->updateSystemSettings($body);
            $result['applied'] = array_keys($changed);
        }

        return $result;
    }

    /**
     * @param array<string, mixed> $document
     *
     * @return array<string, mixed> the "settings" map, already shape-checked
     */
    private function assertDocumentShape(array $document): array {
        if (($document['kind'] ?? null) !== self::KIND) {
            throw new ApiException('Not an AngaraDAV settings backup', 400);
        }
        $formatVersion = $document['formatVersion'] ?? null;
        if (!is_int($formatVersion) || $formatVersion < 1 || $formatVersion > self::FORMAT_VERSION) {
            throw new ApiException('Backup was written by a newer AngaraDAV; upgrade before restoring', 400);
        }
        $settings = $document['settings'] ?? null;
        if (!is_array($settings) || $settings === [] || array_is_list($settings)) {
            throw new ApiException('Backup settings section is missing or invalid', 400);
        }
        if (count($settings) > self::MAX_KEYS) {
            throw new ApiException('Backup contains too many settings keys', 400);
        }
        foreach ($settings as $key => $value) {
            if (!is_string($key) || $key === '' || is_array($value)) {
                throw new ApiException('Backup settings must be a flat map of scalar values', 400);
            }
        }
        $encoded = json_encode($document);
        if ($encoded === false || strlen($encoded) > self::MAX_BYTES) {
            throw new ApiException('Backup file is too large', 400);
        }
        if (isset($document['checksum']) && is_string($document['checksum'])
            && !hash_equals($this->checksum($settings), $document['checksum'])
        ) {
            throw new ApiException('Backup file is corrupt (checksum mismatch)', 400);
        }

        return $settings;
    }

    /**
     * @param array<string, mixed> $settings
     */
    private function checksum(array $settings): string {
        $encoded = json_encode($settings, JSON_UNESCAPED_SLASHES);

        return 'sha256:' . hash('sha256', $encoded === false ? '' : $encoded);
    }

    private function restoreRatePath(): string {
        return ($this->specificDir !== '' ? $this->specificDir : sys_get_temp_dir()) . '/portal_admin_restore_rate.json';
    }

    /**
     * @return array<string, mixed>
     */
    private function loadRestoreRateData(): array {
        $path = $this->restoreRatePath();
        if (!is_readable($path)) {
            return [];
        }
        $raw = file_get_contents($path);
        if ($raw === false || trim($raw) === '') {
            return [];
        }
        $data = json_decode($raw, true);

        return is_array($data) ? $data : [];
    }

    private function isRestoreRateLimited(string $actor): bool {
        $row = $this->loadRestoreRateData()[$actor] ?? null;
        if (!is_array($row)) {
            return false;
        }
        $start = (int) ($row['start'] ?? 0);
        $count = (int) ($row['count'] ?? 0);
        if ($start <= 0 || (time() - $start) > self::RESTORE_RATE_WINDOW) {
            return false;
        }

        return $count >= self::RESTORE_RATE_MAX;
    }

    private function registerRestoreAttempt(string $actor): void {
        $data = $this->loadRestoreRateData();
        $now = time();
        $row = $data[$actor] ?? null;
        if (!is_array($row) || (int) ($row['start'] ?? 0) <= 0 || ($now - (int) $row['start']) > self::RESTORE_RATE_WINDOW) {
            $data[$actor] = ['start' => $now, 'count' => 1];
        } else {
            $data[$actor]['count'] = (int) ($row['count'] ?? 0) + 1;
        }
        foreach ($data as $k => $v) {
            if (!is_array($v) || ($now - (int) ($v['start'] ?? 0)) > self::RESTORE_RATE_WINDOW * 2) {
                unset($data[$k]);
            }
        }
        $path = $this->restoreRatePath();
        $dir = dirname($path);
        if (!is_dir($dir)) {
            @mkdir($dir, 0755, true);
        }
        $json = json_encode($data, JSON_UNESCAPED_SLASHES);
        if ($json !== false) {
            @file_put_contents($path, $json . "\n", LOCK_EX);
        }
    }
}
