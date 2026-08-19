<?php

namespace Baikal\Portal;

use Sabre\DAV\PropPatch;
use Sabre\DAV\UUIDUtil;
use Sabre\VObject\Component\VCard;
use Sabre\VObject\Reader;

/**
 * Address books and per-contact CRUD via sabre/dav CardDAV backend.
 *
 * Contact form fields are mapped onto vCard properties; unknown properties are
 * preserved on update (merge strategy). Writes go through createCard/updateCard/
 * deleteCard so synctoken / addressbookchanges stay correct for CardDAV clients.
 */
class ContactService {
    private ContactStore $store;
    private VCardMapper $cards;

    /**
     * @param \PDO|ContactStore $pdoOrStore PDO (tests / older call sites) or a ContactStore
     */
    public function __construct(\PDO|ContactStore $pdoOrStore, ?VCardMapper $cards = null) {
        $this->store = $pdoOrStore instanceof ContactStore ? $pdoOrStore : new ContactStore($pdoOrStore);
        $this->cards = $cards ?? new VCardMapper();
    }

    public function parseVCard(string $carddata): array {
        return $this->cards->parseVCard($carddata);
    }

    public function buildVCardFromFields(array $fields, ?string $uid = null): string {
        return $this->cards->buildVCardFromFields($fields, $uid);
    }

    public function processPhotoInput(string $input, bool $isBase64 = true): string {
        return $this->cards->processPhotoInput($input, $isBase64);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listAddressBooks(string $username): array {
        $principal = 'principals/' . $username;
        $raw = $this->store->backend()->getAddressBooksForUser($principal);
        $out = [];

        foreach ($raw as $ab) {
            $id = (int) ($ab['id'] ?? 0);
            if ($id <= 0) {
                continue;
            }
            $cards = $this->store->backend()->getCards($id);
            $out[] = [
                'id'          => $id,
                'uri'         => (string) ($ab['uri'] ?? ''),
                'displayname' => (string) ($ab['{DAV:}displayname'] ?? $ab['uri'] ?? 'Contacts'),
                'description' => (string) ($ab['{urn:ietf:params:xml:ns:carddav}addressbook-description'] ?? ''),
                'cardCount'   => count($cards),
            ];
        }

        usort($out, static function ($a, $b) {
            return strcasecmp($a['displayname'], $b['displayname']);
        });

        return $out;
    }

    /**
     * @param array{displayname?: string, description?: string, uri?: string} $fields
     *
     * @return array<string, mixed>
     */
    public function createAddressBook(string $username, array $fields): array {
        $displayname = trim((string) ($fields['displayname'] ?? ''));
        if ($displayname === '') {
            throw new ApiException('Display name is required', 400);
        }
        $description = trim((string) ($fields['description'] ?? ''));
        $uri = trim((string) ($fields['uri'] ?? ''));
        if ($uri === '') {
            $uri = $this->store->uniqueAddressBookUri($username, $displayname);
        } else {
            $uri = $this->store->sanitizeUri($uri);
            if ($uri === '') {
                throw new ApiException('URI is not valid (use letters, numbers, dash, underscore)', 400);
            }
            if ($this->store->addressBookUriExists($username, $uri)) {
                throw new ApiException('An address book with this URI already exists', 409);
            }
        }

        $properties = [
            '{DAV:}displayname' => $displayname,
            '{urn:ietf:params:xml:ns:carddav}addressbook-description' => $description,
        ];
        $id = (int) $this->store->backend()->createAddressBook('principals/' . $username, $uri, $properties);

        return [
            'id'          => $id,
            'uri'         => $uri,
            'displayname' => $displayname,
            'description' => $description,
            'cardCount'   => 0,
        ];
    }

    /**
     * @param array{displayname?: string, description?: string} $fields
     *
     * @return array<string, mixed>
     */
    public function updateAddressBook(string $username, int $addressBookId, array $fields): array {
        $this->store->requireOwnedAddressBook($username, $addressBookId);
        $mutations = [];
        if (array_key_exists('displayname', $fields)) {
            $name = trim((string) $fields['displayname']);
            if ($name === '') {
                throw new ApiException('Display name cannot be empty', 400);
            }
            $mutations['{DAV:}displayname'] = $name;
        }
        if (array_key_exists('description', $fields)) {
            $mutations['{urn:ietf:params:xml:ns:carddav}addressbook-description'] = trim((string) $fields['description']);
        }
        if ($mutations === []) {
            throw new ApiException('No fields to update', 400);
        }

        $propPatch = new PropPatch($mutations);
        $this->store->backend()->updateAddressBook($addressBookId, $propPatch);
        if (!$propPatch->commit()) {
            throw new ApiException('Failed to update address book properties', 500);
        }

        foreach ($this->listAddressBooks($username) as $ab) {
            if ((int) $ab['id'] === $addressBookId) {
                return $ab;
            }
        }

        throw new ApiException('Address book not found after update', 404);
    }

    public function deleteAddressBook(string $username, int $addressBookId, bool $force = false): void {
        $meta = $this->store->requireOwnedAddressBook($username, $addressBookId);
        $cards = $this->store->backend()->getCards($addressBookId);
        if (count($cards) > 0 && !$force) {
            throw new ApiException('Address book is not empty (' . count($cards) . ' contacts). Pass force=true to delete anyway.', 409);
        }
        $this->store->backend()->deleteAddressBook($addressBookId);
        // silence unused
        unset($meta);
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listContacts(string $username, int $addressBookId, string $query = ''): array {
        $this->store->requireOwnedAddressBook($username, $addressBookId);
        $metaRows = $this->store->backend()->getCards($addressBookId);
        if ($metaRows === []) {
            return [];
        }

        $uris = [];
        foreach ($metaRows as $c) {
            if (!empty($c['uri'])) {
                $uris[] = (string) $c['uri'];
            }
        }

        $q = mb_strtolower(trim($query));
        $out = [];
        foreach ($this->store->backend()->getMultipleCards($addressBookId, $uris) as $row) {
            $uri = (string) ($row['uri'] ?? '');
            if ($uri === '') {
                continue;
            }
            $carddata = $this->store->cardDataToString($row['carddata'] ?? '');
            $fields = [];
            // Keep the row even if carddata is missing/corrupt so contacts never "vanish" from the UI
            if ($carddata === '') {
                $summary = [
                    'uri'         => $uri,
                    'displayname' => $uri,
                    'firstname'   => '',
                    'lastname'    => '',
                    'org'         => '',
                    'email'       => '',
                    'phone'       => '',
                    'hasPhoto'    => false,
                    'etag'        => (string) ($row['etag'] ?? ''),
                ];
            } else {
                $fields = $this->cards->parseVCard($carddata);
                $summary = $this->cards->toSummary($uri, $fields, $carddata);
            }
            if ($q !== '' && !$this->cards->matchesSearch($summary, $fields, $q)) {
                continue;
            }
            $out[] = $summary;
        }

        usort($out, static function ($a, $b) {
            return strcasecmp((string) $a['displayname'], (string) $b['displayname']);
        });

        return $out;
    }

    /**
     * @return array<string, mixed>
     */
    public function getContact(string $username, int $addressBookId, string $uri, bool $includePhotoData = false): array {
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
        $fields = $this->cards->parseVCard($carddata);
        $detail = $this->cards->toDetail($uri, $fields);
        // Default: clients use GET …/photo — avoid huge JSON payloads
        if (!$includePhotoData) {
            unset($detail['photoDataUri']);
        }

        return $detail;
    }

    /**
     * @param array<string, mixed> $fields
     *
     * @return array<string, mixed>
     */
    public function createContact(string $username, int $addressBookId, array $fields): array {
        $this->store->requireOwnedAddressBook($username, $addressBookId);
        $normalized = $this->cards->normalizeFormFields($fields, true);
        $uid = UUIDUtil::getUUID();
        $uri = $this->store->cardUriFromUid($uid);

        $vcard = new VCard([
            'VERSION' => '3.0',
            'UID'     => $uid,
        ]);
        $this->cards->applyFormFieldsToVCard($vcard, $normalized, true);
        // Convert to real v3 document BEFORE PHOTO — v4 docType stores PHOTO as raw binary
        $vcard = $this->cards->asVCard3($vcard);
        $this->cards->applyPhotoFromFields($vcard, $fields, true);

        $serialized = $vcard->serialize();
        $vcard->destroy();
        $this->store->backend()->createCard($addressBookId, $uri, $serialized);
        $this->store->notifyAddressBookPush($username, $addressBookId);

        return $this->getContact($username, $addressBookId, $uri);
    }

    /**
     * Merge form fields into existing vCard (preserves unknown properties).
     *
     * @param array<string, mixed> $fields
     *
     * @return array<string, mixed>
     */
    public function updateContact(string $username, int $addressBookId, string $uri, array $fields): array {
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

        try {
            $vcard = Reader::read($carddata, Reader::OPTION_FORGIVING);
        } catch (\Throwable $e) {
            throw new ApiException('Existing contact has invalid vCard data', 500);
        }
        if (!$vcard instanceof VCard) {
            throw new ApiException('Existing contact is not a vCard', 500);
        }

        $normalized = $this->cards->normalizeFormFields($fields, false);
        $this->cards->applyFormFieldsToVCard($vcard, $normalized, false);

        if (!isset($vcard->UID) || (string) $vcard->UID === '') {
            $vcard->UID = pathinfo($uri, PATHINFO_FILENAME) ?: UUIDUtil::getUUID();
        }
        // Must rebuild as a real v3 document BEFORE PHOTO: setting VERSION alone leaves
        // docType=v4, and VObject then serializes PHOTO as raw binary (VALUE=URI).
        $vcard = $this->cards->asVCard3($vcard);
        $this->cards->applyPhotoFromFields($vcard, $fields, false);

        $serialized = $vcard->serialize();
        $vcard->destroy();
        $this->store->backend()->updateCard($addressBookId, $uri, $serialized);
        $this->store->notifyAddressBookPush($username, $addressBookId);

        return $this->getContact($username, $addressBookId, $uri);
    }

    public function deleteContact(string $username, int $addressBookId, string $uri): void {
        $this->store->requireOwnedAddressBook($username, $addressBookId);
        $uri = $this->store->normalizeCardUri($uri);
        $row = $this->store->backend()->getCard($addressBookId, $uri);
        if (!$row) {
            throw new ApiException('Contact not found', 404);
        }
        $this->store->backend()->deleteCard($addressBookId, $uri);
        $this->store->notifyAddressBookPush($username, $addressBookId);
    }

    /**
     * Binary JPEG photo for a contact, or null if none.
     *
     * @return array{bytes: string, contentType: string}|null
     */
    public function getContactPhoto(string $username, int $addressBookId, string $uri): ?array {
        $this->store->requireOwnedAddressBook($username, $addressBookId);
        $uri = $this->store->normalizeCardUri($uri);
        $row = $this->store->backend()->getCard($addressBookId, $uri);
        if (!$row) {
            throw new ApiException('Contact not found', 404);
        }
        $fields = $this->cards->parseVCard($this->store->cardDataToString($row['carddata'] ?? ''));
        if (empty($fields['photoBinary']) || !is_string($fields['photoBinary'])) {
            return null;
        }

        return [
            'bytes'       => $fields['photoBinary'],
            'contentType' => 'image/jpeg',
        ];
    }
}
