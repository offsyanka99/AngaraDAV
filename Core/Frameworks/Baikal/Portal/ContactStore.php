<?php

namespace Baikal\Portal;

use Baikal\Core\Plugins\Push\ChangeNotifier;
use Sabre\CardDAV\Backend\PDO as CarddavBackend;
use Sabre\DAV\UUIDUtil;

/**
 * Shared CardDAV backend access and address-book helpers for portal contact services.
 */
class ContactStore {
    private \PDO $pdo;
    private CarddavBackend $backend;

    public function __construct(\PDO $pdo) {
        $this->pdo = $pdo;
        $this->backend = new CarddavBackend($pdo);
    }

    public function pdo(): \PDO {
        return $this->pdo;
    }

    public function backend(): CarddavBackend {
        return $this->backend;
    }

    public function cardDataToString($carddata): string {
        if (is_resource($carddata)) {
            $data = stream_get_contents($carddata);

            return is_string($data) ? $data : '';
        }
        if (is_string($carddata)) {
            return $carddata;
        }

        return '';
    }

    public function requireOwnedAddressBook(string $username, int $addressBookId): array {
        $principal = 'principals/' . $username;
        $stmt = $this->pdo->prepare(
            'SELECT id, uri, displayname, principaluri FROM addressbooks WHERE id = ? AND principaluri = ?'
        );
        $stmt->execute([$addressBookId, $principal]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);
        if (!$row) {
            throw new ApiException('Address book not found', 404);
        }

        return [
            'id'          => (int) $row['id'],
            'displayname' => (string) ($row['displayname'] ?: $row['uri'] ?: 'Contacts'),
            'uri'         => (string) $row['uri'],
        ];
    }

    public function notifyAddressBookPush(string $username, int $addressBookId): void {
        try {
            $book = $this->requireOwnedAddressBook($username, $addressBookId);
            $uri = (string) ($book['uri'] ?? '');
            if ($uri === '') {
                return;
            }
            ChangeNotifier::addressBookContent($this->pdo, $username, $uri, $addressBookId);
        } catch (\Throwable $e) {
            error_log('portal address-book push notify failed: ' . $e->getMessage());
        }
    }

    /**
     * @return array<string, true>
     */
    public function listExistingCardUris(int $addressBookId): array {
        $stmt = $this->pdo->prepare('SELECT uri FROM cards WHERE addressbookid = ?');
        $stmt->execute([$addressBookId]);
        $map = [];
        while ($row = $stmt->fetch(\PDO::FETCH_ASSOC)) {
            if (!empty($row['uri'])) {
                $map[(string) $row['uri']] = true;
            }
        }

        return $map;
    }

    public function cardUriFromUid(string $uid): string {
        $safe = preg_replace('/[^A-Za-z0-9_.@-]+/', '-', $uid) ?? '';
        $safe = trim($safe, '-.');
        if ($safe === '') {
            $safe = UUIDUtil::getUUID();
        }
        if (strlen($safe) > 180) {
            $safe = substr($safe, 0, 180);
        }

        return $safe . '.vcf';
    }

    public function normalizeCardUri(string $uri): string {
        $uri = rawurldecode(trim($uri));
        $uri = ltrim($uri, '/');
        if ($uri === '' || str_contains($uri, '..') || str_contains($uri, '/')) {
            throw new ApiException('Invalid contact URI', 400);
        }

        return $uri;
    }

    public function sanitizeUri(string $uri): string {
        $uri = strtolower(trim($uri));
        $uri = preg_replace('/[^a-z0-9_-]+/', '-', $uri) ?? '';
        $uri = trim($uri, '-_');

        return substr($uri, 0, 64);
    }

    public function addressBookUriExists(string $username, string $uri): bool {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM addressbooks WHERE principaluri = ? AND uri = ? LIMIT 1'
        );
        $stmt->execute(['principals/' . $username, $uri]);

        return (bool) $stmt->fetchColumn();
    }

    public function uniqueAddressBookUri(string $username, string $displayname): string {
        $base = $this->sanitizeUri($displayname);
        if ($base === '') {
            $base = 'contacts';
        }
        $uri = $base;
        $n = 0;
        while ($this->addressBookUriExists($username, $uri)) {
            ++$n;
            $uri = $base . '-' . ($n > 5 ? UUIDUtil::getUUID() : (string) $n);
            if ($n > 20) {
                return $base . '-' . UUIDUtil::getUUID();
            }
        }

        return $uri;
    }

    public function beginImportTransaction(): bool {
        if ($this->pdo->inTransaction()) {
            return false;
        }
        try {
            return $this->pdo->beginTransaction();
        } catch (\Throwable $e) {
            error_log('portal contact import beginTransaction: ' . $e->getMessage());

            return false;
        }
    }

    public function commitImportTransaction(bool $ownsTx): void {
        if (!$ownsTx || !$this->pdo->inTransaction()) {
            return;
        }
        try {
            $this->pdo->commit();
        } catch (\Throwable $e) {
            error_log('portal contact import commit: ' . $e->getMessage());
            try {
                $this->pdo->rollBack();
            } catch (\Throwable $e2) {
                // ignore
            }
            throw $e;
        }
    }

    public function rollbackImportTransaction(bool $ownsTx): void {
        if (!$ownsTx || !$this->pdo->inTransaction()) {
            return;
        }
        try {
            $this->pdo->rollBack();
        } catch (\Throwable $e) {
            error_log('portal contact import rollback: ' . $e->getMessage());
        }
    }
}
