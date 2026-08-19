<?php

namespace Baikal\Portal\Http;

use Baikal\Portal\ContactImportService;
use Baikal\Portal\ContactService;

/**
 * Portal JSON routes for address books, contacts, and vCard import.
 */
class ContactRoutes {
    public function __construct(
        private ContactService $contacts,
        private ContactImportService $import,
        private HttpIO $http,
    ) {
    }

    /**
     * @return array<string, mixed>|list<mixed>|null
     */
    public function dispatch(string $method, string $path, string $username) {
        if ($method === 'GET' && $path === '/addressbooks') {
            return ['addressbooks' => $this->contacts->listAddressBooks($username)];
        }

        if ($method === 'POST' && $path === '/addressbooks') {
            $body = $this->http->jsonBody();
            $ab = $this->contacts->createAddressBook($username, $body);

            return ['addressbook' => $ab];
        }

        if (preg_match('#^/addressbooks/(\d+)$#', $path, $m)) {
            $id = (int) $m[1];
            if ($method === 'PATCH' || $method === 'PUT') {
                $body = $this->http->jsonBody();
                $ab = $this->contacts->updateAddressBook($username, $id, $body);

                return ['addressbook' => $ab];
            }
            if ($method === 'DELETE') {
                $body = $this->http->jsonBody();
                $force = !empty($body['force']) || (isset($_GET['force']) && $_GET['force'] !== '0' && $_GET['force'] !== '');
                $this->contacts->deleteAddressBook($username, $id, $force);

                return ['ok' => true];
            }
        }

        if ($method === 'POST' && preg_match('#^/addressbooks/(\d+)/import$#', $path, $m)) {
            $id = (int) $m[1];
            if (function_exists('set_time_limit')) {
                @set_time_limit(600);
            }
            @ini_set('memory_limit', '512M');
            if (session_status() === PHP_SESSION_ACTIVE) {
                session_write_close();
            }
            $vcf = $this->http->readPayloadField('vcf', ['text/vcard', 'text/x-vcard', 'text/directory']);
            if ($this->http->wantsImportProgressStream()) {
                $this->http->streamImportProgress(function (?callable $onProgress) use ($username, $id, $vcf) {
                    return $this->import->importAddressBook($username, $id, $vcf, $onProgress);
                });

                return null;
            }

            return $this->import->importAddressBook($username, $id, $vcf);
        }

        if (preg_match('#^/addressbooks/(\d+)/contacts$#', $path, $m)) {
            $id = (int) $m[1];
            if ($method === 'GET') {
                $q = isset($_GET['q']) ? (string) $_GET['q'] : '';

                return ['contacts' => $this->contacts->listContacts($username, $id, $q)];
            }
            if ($method === 'POST') {
                $body = $this->http->jsonBody();
                $contact = $this->contacts->createContact($username, $id, $body);

                return ['contact' => $contact];
            }
        }

        if (preg_match('#^/addressbooks/(\d+)/contacts/([^/]+)$#', $path, $m)) {
            $id = (int) $m[1];
            $uri = rawurldecode($m[2]);
            if ($method === 'GET') {
                return ['contact' => $this->contacts->getContact($username, $id, $uri)];
            }
            if ($method === 'PATCH' || $method === 'PUT') {
                $body = $this->http->jsonBody();
                $contact = $this->contacts->updateContact($username, $id, $uri, $body);

                return ['contact' => $contact];
            }
            if ($method === 'DELETE') {
                $this->contacts->deleteContact($username, $id, $uri);

                return ['ok' => true];
            }
        }

        return null;
    }
}
