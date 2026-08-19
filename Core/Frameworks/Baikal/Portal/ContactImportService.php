<?php

namespace Baikal\Portal;

use Sabre\DAV\UUIDUtil;
use Sabre\VObject\Reader;

/**
 * Address-book vCard import/export for the portal.
 */
class ContactImportService {
    /** Soft cap on cards imported in one request (DoS / memory) */
    private const MAX_IMPORT_CARDS = 5000;

    /** Commit every N cards during import (same Phase 1 strategy as calendars). */
    private const IMPORT_TX_CHUNK = 200;

    public function __construct(
        private ContactStore $store,
        private VCardMapper $cards,
    ) {
    }

    /**
     * @return array{vcf: string, filename: string, count: int}
     */
    public function exportAddressBook(string $username, int $addressBookId): array {
        $meta = $this->store->requireOwnedAddressBook($username, $addressBookId);
        $cards = $this->store->backend()->getCards($addressBookId);
        $uris = [];
        foreach ($cards as $c) {
            if (!empty($c['uri'])) {
                $uris[] = (string) $c['uri'];
            }
        }

        $parts = [];
        $count = 0;
        if ($uris !== []) {
            foreach ($this->store->backend()->getMultipleCards($addressBookId, $uris) as $row) {
                if (empty($row['carddata'])) {
                    continue;
                }
                $data = trim((string) $row['carddata']);
                if ($data === '') {
                    continue;
                }
                $parts[] = rtrim($data, "\r\n") . "\r\n";
                ++$count;
            }
        }

        $safeName = preg_replace('/[^a-zA-Z0-9-_ ]/u', '', $meta['displayname']) ?: 'contacts';
        $safeName = trim(preg_replace('/\s+/', '-', $safeName) ?? 'contacts', '-');
        $filename = $safeName . '-' . date('Y-m-d') . '.vcf';

        return [
            'vcf'      => implode("\r\n", $parts),
            'filename' => $filename,
            'count'    => $count,
        ];
    }

    /**
     * Export a single contact as a .vcf file.
     *
     * @return array{vcf: string, filename: string}
     */
    public function exportContact(string $username, int $addressBookId, string $uri): array {
        $this->store->requireOwnedAddressBook($username, $addressBookId);
        $uri = $this->store->normalizeCardUri($uri);
        $row = $this->store->backend()->getCard($addressBookId, $uri);
        if (!$row) {
            throw new ApiException('Contact not found', 404);
        }
        $carddata = $this->store->cardDataToString($row['carddata'] ?? '');
        if ($carddata === '') {
            throw new ApiException('Contact data is empty or unreadable', 500);
        }
        $vcf = rtrim($carddata, "\r\n") . "\r\n";

        $fields = $this->cards->parseVCard($carddata);
        $label = trim((string) ($fields['fullname'] ?? ''));
        if ($label === '') {
            $label = trim(
                trim((string) ($fields['firstname'] ?? '')) . ' ' . trim((string) ($fields['lastname'] ?? ''))
            );
        }
        if ($label === '') {
            $label = pathinfo($uri, PATHINFO_FILENAME) ?: 'contact';
        }
        $safeName = preg_replace('/[^a-zA-Z0-9-_ ]/u', '', $label) ?: 'contact';
        $safeName = trim(preg_replace('/\s+/', '-', $safeName) ?? 'contact', '-');
        if ($safeName === '') {
            $safeName = 'contact';
        }
        $filename = $safeName . '-' . date('Y-m-d') . '.vcf';

        return [
            'vcf'      => $vcf,
            'filename' => $filename,
        ];
    }

    /**
     * Optional $onProgress(current, total, imported, updated, skipped) for streaming UIs.
     *
     * @param callable(int, int, int, int, int): void|null $onProgress
     *
     * @return array{imported: int, updated: int, skipped: int}
     */
    public function importAddressBook(string $username, int $addressBookId, string $vcfData, ?callable $onProgress = null): array {
        if (function_exists('set_time_limit')) {
            @set_time_limit(600);
        }
        @ini_set('max_execution_time', '600');
        @ini_set('memory_limit', '512M');

        $this->store->requireOwnedAddressBook($username, $addressBookId);

        if (strncmp($vcfData, "\xEF\xBB\xBF", 3) === 0) {
            $vcfData = substr($vcfData, 3);
        }
        $vcfData = trim($vcfData);
        if ($vcfData === '') {
            throw new ApiException('vCard data is empty', 400);
        }
        if (strlen($vcfData) > 20 * 1024 * 1024) {
            throw new ApiException('vCard file is too large (max 20 MB)', 400);
        }

        $chunks = preg_split('/(?=BEGIN:VCARD)/i', $vcfData) ?: [];
        $cards = [];
        foreach ($chunks as $chunk) {
            $chunk = trim($chunk);
            if ($chunk === '' || stripos($chunk, 'BEGIN:VCARD') === false) {
                continue;
            }
            $cards[] = $chunk;
        }

        if ($cards === []) {
            throw new ApiException('No vCard entries found (expected BEGIN:VCARD … END:VCARD)', 400);
        }
        if (count($cards) > self::MAX_IMPORT_CARDS) {
            throw new ApiException('Too many contacts in import (max ' . self::MAX_IMPORT_CARDS . '). Split the .vcf file.', 400);
        }

        $existing = $this->store->listExistingCardUris($addressBookId);
        $imported = 0;
        $updated = 0;
        $skipped = 0;
        $n = 0;
        $total = count($cards);
        $progressEvery = max(1, (int) min(25, max(1, (int) floor($total / 100))));

        if ($onProgress !== null) {
            $onProgress(0, $total, 0, 0, 0);
        }

        $ownsTx = false;
        try {
            $ownsTx = $this->store->beginImportTransaction();

            foreach ($cards as $cardRaw) {
                ++$n;
                if (($n % 50) === 0 && function_exists('set_time_limit')) {
                    @set_time_limit(600);
                }

                try {
                    $parsed = Reader::read($cardRaw, Reader::OPTION_FORGIVING);
                } catch (\Throwable $e) {
                    error_log('portal contact parse: ' . $e->getMessage());
                    ++$skipped;
                    if ($onProgress !== null && ($n === $total || ($n % $progressEvery) === 0)) {
                        $onProgress($n, $total, $imported, $updated, $skipped);
                    }
                    if ($ownsTx && $n < $total && ($n % self::IMPORT_TX_CHUNK) === 0) {
                        $this->store->commitImportTransaction($ownsTx);
                        $ownsTx = $this->store->beginImportTransaction();
                    }
                    continue;
                }

                if ($parsed->name !== 'VCARD') {
                    $parsed->destroy();
                    ++$skipped;
                    if ($onProgress !== null && ($n === $total || ($n % $progressEvery) === 0)) {
                        $onProgress($n, $total, $imported, $updated, $skipped);
                    }
                    if ($ownsTx && $n < $total && ($n % self::IMPORT_TX_CHUNK) === 0) {
                        $this->store->commitImportTransaction($ownsTx);
                        $ownsTx = $this->store->beginImportTransaction();
                    }
                    continue;
                }

                $uid = isset($parsed->UID) ? (string) $parsed->UID : '';
                if ($uid === '') {
                    $uid = UUIDUtil::getUUID();
                    $parsed->UID = $uid;
                }

                // True v3 document first, then re-encode PHOTO (no raw binary polyglots)
                $parsed = $this->cards->asVCard3($parsed);
                $this->cards->sanitizePhotoOnVCard($parsed);

                $uri = $this->store->cardUriFromUid($uid);
                $serialized = $parsed->serialize();
                $parsed->destroy();

                try {
                    if (isset($existing[$uri])) {
                        $this->store->backend()->updateCard($addressBookId, $uri, $serialized);
                        ++$updated;
                    } else {
                        $this->store->backend()->createCard($addressBookId, $uri, $serialized);
                        $existing[$uri] = true;
                        ++$imported;
                    }
                } catch (\Throwable $e) {
                    error_log('portal contact import ' . $uri . ': ' . $e->getMessage());
                    ++$skipped;
                }

                if ($onProgress !== null && ($n === $total || ($n % $progressEvery) === 0)) {
                    $onProgress($n, $total, $imported, $updated, $skipped);
                }

                if ($ownsTx && $n < $total && ($n % self::IMPORT_TX_CHUNK) === 0) {
                    $this->store->commitImportTransaction($ownsTx);
                    $ownsTx = $this->store->beginImportTransaction();
                }
            }

            $this->store->commitImportTransaction($ownsTx);
            $ownsTx = false;
        } catch (\Throwable $e) {
            $this->store->rollbackImportTransaction($ownsTx);
            throw $e;
        }

        if ($imported > 0 || $updated > 0) {
            $this->store->notifyAddressBookPush($username, $addressBookId);
        }

        return [
            'imported' => $imported,
            'updated'  => $updated,
            'skipped'  => $skipped,
        ];
    }
}
