<?php

namespace Baikal\Portal\Admin;

use Baikal\Portal\ApiException;

/**
 * Admin CRUD for another user's calendars and address books.
 *
 * Scoped by username (principaluri), not the portal session user.
 * Fields mirror classic BaikalAdmin User\Calendars / User\AddressBooks.
 *
 * Calendar: uri (token id), displayname, description, calendarcolor, todos, notes
 * Address book: uri (token id), displayname, description
 */
class AdminUserResourceService {
    /** @var \PDO */
    private $pdo;

    /** @var array<string, mixed> */
    private $config;

    /**
     * @param array<string, mixed> $config
     */
    public function __construct(\PDO $pdo, array $config = []) {
        $this->pdo = $pdo;
        $this->config = $config;
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listCalendars(string $username): array {
        $principal = $this->requirePrincipal($username);
        $stmt = $this->pdo->prepare(
            'SELECT i.id AS instanceId, i.calendarid AS calendarId, i.uri, i.displayname,
                    i.description, i.calendarcolor, i.access, c.components
             FROM calendarinstances i
             INNER JOIN calendars c ON c.id = i.calendarid
             WHERE i.principaluri = ?
             ORDER BY i.displayname COLLATE NOCASE, i.uri'
        );
        if ($this->isPgsql()) {
            $stmt = $this->pdo->prepare(
                'SELECT i.id AS instanceId, i.calendarid AS calendarId, i.uri, i.displayname,
                        i.description, i.calendarcolor, i.access, c.components
                 FROM calendarinstances i
                 INNER JOIN calendars c ON c.id = i.calendarid
                 WHERE i.principaluri = ?
                 ORDER BY LOWER(i.displayname), i.uri'
            );
        }
        $stmt->execute([$principal]);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];
        $out = [];
        foreach ($rows as $row) {
            $out[] = $this->mapCalendar($row, $username);
        }

        return $out;
    }

    /**
     * @return array<string, mixed>
     */
    public function getCalendar(string $username, int $instanceId): array {
        $principal = $this->requirePrincipal($username);
        $row = $this->fetchCalendarRow($principal, $instanceId);
        if ($row === null) {
            throw new ApiException('Calendar not found', 404);
        }

        return $this->mapCalendar($row, $username);
    }

    /**
     * @param array<string, mixed> $body
     *
     * @return array<string, mixed>
     */
    public function createCalendar(string $username, array $body): array {
        $principal = $this->requirePrincipal($username);
        $uri = $this->normalizeTokenId((string) ($body['uri'] ?? ''), true);
        $displayname = trim((string) ($body['displayname'] ?? ''));
        if ($displayname === '') {
            throw new ApiException('Display name is required', 400);
        }
        $description = trim((string) ($body['description'] ?? ''));
        $color = $this->normalizeColor(isset($body['calendarcolor']) ? (string) $body['calendarcolor'] : (isset($body['color']) ? (string) $body['color'] : ''));
        $todos = !empty($body['todos']);
        $notes = !empty($body['notes']);
        if (!$this->tasksEnabled()) {
            $todos = false;
        }
        if (!$this->notesEnabled()) {
            $notes = false;
        }
        if ($this->calendarUriExists($principal, $uri)) {
            throw new ApiException('A calendar with this URI already exists', 409);
        }

        $components = $this->componentsFromFlags($todos, $notes);

        try {
            $this->pdo->beginTransaction();
            $this->pdo->prepare(
                'INSERT INTO calendars (synctoken, components) VALUES (1, ?)'
            )->execute([$components]);
            $calendarId = (int) $this->pdo->lastInsertId();
            if ($calendarId <= 0) {
                $calendarId = (int) $this->pdo->query('SELECT MAX(id) FROM calendars')->fetchColumn();
            }
            $this->pdo->prepare(
                'INSERT INTO calendarinstances
                    (calendarid, principaluri, access, displayname, uri, description, calendarcolor, calendarorder, share_invitestatus)
                 VALUES (?, ?, 1, ?, ?, ?, ?, 0, 2)'
            )->execute([$calendarId, $principal, $displayname, $uri, $description, $color !== '' ? $color : null]);
            $instanceId = (int) $this->pdo->lastInsertId();
            if ($instanceId <= 0) {
                $instanceId = (int) $this->pdo->query('SELECT MAX(id) FROM calendarinstances')->fetchColumn();
            }
            $this->pdo->commit();
        } catch (ApiException $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw $e;
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            if ($this->calendarUriExists($principal, $uri)) {
                throw new ApiException('A calendar with this URI already exists', 409);
            }
            throw new ApiException('Unable to create calendar', 500);
        }

        return $this->getCalendar($username, $instanceId);
    }

    /**
     * @param array<string, mixed> $body
     *
     * @return array<string, mixed>
     */
    public function updateCalendar(string $username, int $instanceId, array $body): array {
        $principal = $this->requirePrincipal($username);
        $row = $this->fetchCalendarRow($principal, $instanceId);
        if ($row === null) {
            throw new ApiException('Calendar not found', 404);
        }
        $calendarId = (int) $row['calendarId'];

        $displayname = array_key_exists('displayname', $body)
            ? trim((string) $body['displayname'])
            : (string) $row['displayname'];
        if ($displayname === '') {
            throw new ApiException('Display name is required', 400);
        }
        $description = array_key_exists('description', $body)
            ? trim((string) $body['description'])
            : (string) ($row['description'] ?? '');
        $color = array_key_exists('calendarcolor', $body) || array_key_exists('color', $body)
            ? $this->normalizeColor((string) ($body['calendarcolor'] ?? $body['color'] ?? ''))
            : (string) ($row['calendarcolor'] ?? '');

        $components = (string) ($row['components'] ?? 'VEVENT');
        $hasTodos = str_contains($components, 'VTODO');
        $hasNotes = str_contains($components, 'VJOURNAL');
        if (array_key_exists('todos', $body)) {
            $hasTodos = !empty($body['todos']) && $this->tasksEnabled();
        }
        if (array_key_exists('notes', $body)) {
            $hasNotes = !empty($body['notes']) && $this->notesEnabled();
        }
        $newComponents = $this->componentsFromFlags($hasTodos, $hasNotes);

        try {
            $this->pdo->beginTransaction();
            $this->pdo->prepare(
                'UPDATE calendarinstances SET displayname = ?, description = ?, calendarcolor = ?
                 WHERE id = ? AND principaluri = ?'
            )->execute([
                $displayname,
                $description,
                $color !== '' ? $color : null,
                $instanceId,
                $principal,
            ]);
            $this->pdo->prepare('UPDATE calendars SET components = ? WHERE id = ?')
                ->execute([$newComponents, $calendarId]);
            $this->pdo->commit();
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw new ApiException('Unable to update calendar', 500);
        }

        return $this->getCalendar($username, $instanceId);
    }

    public function deleteCalendar(string $username, int $instanceId, bool $confirm): void {
        if (!$confirm) {
            throw new ApiException('Confirmation required (confirm=true)', 400);
        }
        $principal = $this->requirePrincipal($username);
        $row = $this->fetchCalendarRow($principal, $instanceId);
        if ($row === null) {
            throw new ApiException('Calendar not found', 404);
        }
        $calendarId = (int) $row['calendarId'];

        try {
            $this->pdo->beginTransaction();
            $this->pdo->prepare('DELETE FROM calendarinstances WHERE id = ? AND principaluri = ?')
                ->execute([$instanceId, $principal]);
            $left = $this->pdo->prepare('SELECT COUNT(*) FROM calendarinstances WHERE calendarid = ?');
            $left->execute([$calendarId]);
            if ((int) $left->fetchColumn() === 0) {
                $this->pdo->prepare('DELETE FROM calendarobjects WHERE calendarid = ?')->execute([$calendarId]);
                $this->tryExec('DELETE FROM calendarchanges WHERE calendarid = ?', [$calendarId]);
                $this->pdo->prepare('DELETE FROM calendars WHERE id = ?')->execute([$calendarId]);
            }
            $this->pdo->commit();
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw new ApiException('Unable to delete calendar', 500);
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function listAddressBooks(string $username): array {
        $principal = $this->requirePrincipal($username);
        $stmt = $this->pdo->prepare(
            'SELECT id, uri, displayname, description
             FROM addressbooks WHERE principaluri = ?
             ORDER BY displayname COLLATE NOCASE, uri'
        );
        if ($this->isPgsql()) {
            $stmt = $this->pdo->prepare(
                'SELECT id, uri, displayname, description
                 FROM addressbooks WHERE principaluri = ?
                 ORDER BY LOWER(displayname), uri'
            );
        }
        $stmt->execute([$principal]);
        $rows = $stmt->fetchAll(\PDO::FETCH_ASSOC) ?: [];
        $out = [];
        foreach ($rows as $row) {
            $out[] = $this->mapAddressBook($row, $username);
        }

        return $out;
    }

    /**
     * @return array<string, mixed>
     */
    public function getAddressBook(string $username, int $id): array {
        $principal = $this->requirePrincipal($username);
        $row = $this->fetchAddressBookRow($principal, $id);
        if ($row === null) {
            throw new ApiException('Address book not found', 404);
        }

        return $this->mapAddressBook($row, $username);
    }

    /**
     * @param array<string, mixed> $body
     *
     * @return array<string, mixed>
     */
    public function createAddressBook(string $username, array $body): array {
        $principal = $this->requirePrincipal($username);
        $uri = $this->normalizeTokenId((string) ($body['uri'] ?? ''), true);
        $displayname = trim((string) ($body['displayname'] ?? ''));
        if ($displayname === '') {
            throw new ApiException('Display name is required', 400);
        }
        $description = trim((string) ($body['description'] ?? ''));
        if ($this->addressBookUriExists($principal, $uri)) {
            throw new ApiException('An address book with this URI already exists', 409);
        }

        try {
            $this->pdo->prepare(
                'INSERT INTO addressbooks (principaluri, displayname, uri, description, synctoken)
                 VALUES (?, ?, ?, ?, 1)'
            )->execute([$principal, $displayname, $uri, $description]);
            $id = (int) $this->pdo->lastInsertId();
            if ($id <= 0) {
                $id = (int) $this->pdo->query('SELECT MAX(id) FROM addressbooks')->fetchColumn();
            }
        } catch (\Throwable $e) {
            if ($this->addressBookUriExists($principal, $uri)) {
                throw new ApiException('An address book with this URI already exists', 409);
            }
            throw new ApiException('Unable to create address book', 500);
        }

        return $this->getAddressBook($username, $id);
    }

    /**
     * @param array<string, mixed> $body
     *
     * @return array<string, mixed>
     */
    public function updateAddressBook(string $username, int $id, array $body): array {
        $principal = $this->requirePrincipal($username);
        $row = $this->fetchAddressBookRow($principal, $id);
        if ($row === null) {
            throw new ApiException('Address book not found', 404);
        }
        $displayname = array_key_exists('displayname', $body)
            ? trim((string) $body['displayname'])
            : (string) $row['displayname'];
        if ($displayname === '') {
            throw new ApiException('Display name is required', 400);
        }
        $description = array_key_exists('description', $body)
            ? trim((string) $body['description'])
            : (string) ($row['description'] ?? '');

        $this->pdo->prepare(
            'UPDATE addressbooks SET displayname = ?, description = ? WHERE id = ? AND principaluri = ?'
        )->execute([$displayname, $description, $id, $principal]);

        return $this->getAddressBook($username, $id);
    }

    public function deleteAddressBook(string $username, int $id, bool $confirm, bool $force = false): void {
        if (!$confirm) {
            throw new ApiException('Confirmation required (confirm=true)', 400);
        }
        $principal = $this->requirePrincipal($username);
        $row = $this->fetchAddressBookRow($principal, $id);
        if ($row === null) {
            throw new ApiException('Address book not found', 404);
        }
        $count = 0;
        try {
            $c = $this->pdo->prepare('SELECT COUNT(*) FROM cards WHERE addressbookid = ?');
            $c->execute([$id]);
            $count = (int) $c->fetchColumn();
        } catch (\Throwable $e) {
            $count = 0;
        }
        if ($count > 0 && !$force) {
            throw new ApiException('Address book is not empty (' . $count . ' contacts). Pass force=true to delete anyway.', 409);
        }

        try {
            $this->pdo->beginTransaction();
            $this->pdo->prepare('DELETE FROM cards WHERE addressbookid = ?')->execute([$id]);
            $this->tryExec('DELETE FROM addressbookchanges WHERE addressbookid = ?', [$id]);
            $this->pdo->prepare('DELETE FROM addressbooks WHERE id = ? AND principaluri = ?')
                ->execute([$id, $principal]);
            $this->pdo->commit();
        } catch (\Throwable $e) {
            if ($this->pdo->inTransaction()) {
                $this->pdo->rollBack();
            }
            throw new ApiException('Unable to delete address book', 500);
        }
    }

    private function requirePrincipal(string $username): string {
        $username = trim($username);
        if ($username === '' || str_contains($username, '/') || str_contains($username, "\0")) {
            throw new ApiException('Invalid username', 400);
        }
        $stmt = $this->pdo->prepare('SELECT username FROM users WHERE username = ? LIMIT 1');
        $stmt->execute([$username]);
        $found = $stmt->fetchColumn();
        if ($found === false) {
            $stmt = $this->pdo->prepare('SELECT username FROM users WHERE LOWER(username) = LOWER(?) LIMIT 1');
            $stmt->execute([$username]);
            $found = $stmt->fetchColumn();
        }
        if ($found === false) {
            throw new ApiException('User not found', 404);
        }

        return 'principals/' . (string) $found;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function fetchCalendarRow(string $principal, int $instanceId): ?array {
        if ($instanceId <= 0) {
            return null;
        }
        $stmt = $this->pdo->prepare(
            'SELECT i.id AS instanceId, i.calendarid AS calendarId, i.uri, i.displayname,
                    i.description, i.calendarcolor, i.access, c.components
             FROM calendarinstances i
             INNER JOIN calendars c ON c.id = i.calendarid
             WHERE i.id = ? AND i.principaluri = ?
             LIMIT 1'
        );
        $stmt->execute([$instanceId, $principal]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    /**
     * @return array<string, mixed>|null
     */
    private function fetchAddressBookRow(string $principal, int $id): ?array {
        if ($id <= 0) {
            return null;
        }
        $stmt = $this->pdo->prepare(
            'SELECT id, uri, displayname, description FROM addressbooks
             WHERE id = ? AND principaluri = ? LIMIT 1'
        );
        $stmt->execute([$id, $principal]);
        $row = $stmt->fetch(\PDO::FETCH_ASSOC);

        return $row ?: null;
    }

    /**
     * @param array<string, mixed> $row
     *
     * @return array<string, mixed>
     */
    private function mapCalendar(array $row, string $username): array {
        $instanceId = (int) ($row['instanceId'] ?? 0);
        $calendarId = (int) ($row['calendarId'] ?? 0);
        $components = (string) ($row['components'] ?? '');
        $events = 0;
        try {
            $c = $this->pdo->prepare('SELECT COUNT(*) FROM calendarobjects WHERE calendarid = ?');
            $c->execute([$calendarId]);
            $events = (int) $c->fetchColumn();
        } catch (\Throwable $e) {
            $events = 0;
        }
        $uri = (string) ($row['uri'] ?? '');

        return [
            'id'            => $instanceId,
            'instanceId'    => $instanceId,
            'calendarId'    => $calendarId,
            'uri'           => $uri,
            'displayname'   => (string) ($row['displayname'] ?? ''),
            'description'   => (string) ($row['description'] ?? ''),
            'calendarcolor' => (string) ($row['calendarcolor'] ?? ''),
            'components'    => $components,
            'todos'         => str_contains($components, 'VTODO'),
            'notes'         => str_contains($components, 'VJOURNAL'),
            'eventCount'    => $events,
            'davUri'        => '/dav.php/calendars/' . rawurlencode($username) . '/' . rawurlencode($uri) . '/',
        ];
    }

    /**
     * @param array<string, mixed> $row
     *
     * @return array<string, mixed>
     */
    private function mapAddressBook(array $row, string $username): array {
        $id = (int) ($row['id'] ?? 0);
        $uri = (string) ($row['uri'] ?? '');
        $contacts = 0;
        try {
            $c = $this->pdo->prepare('SELECT COUNT(*) FROM cards WHERE addressbookid = ?');
            $c->execute([$id]);
            $contacts = (int) $c->fetchColumn();
        } catch (\Throwable $e) {
            $contacts = 0;
        }

        return [
            'id'          => $id,
            'uri'         => $uri,
            'displayname' => (string) ($row['displayname'] ?? ''),
            'description' => (string) ($row['description'] ?? ''),
            'contactCount' => $contacts,
            'davUri'      => '/dav.php/addressbooks/' . rawurlencode($username) . '/' . rawurlencode($uri) . '/',
        ];
    }

    private function normalizeTokenId(string $uri, bool $required): string {
        $uri = strtolower(trim($uri));
        if ($uri === '') {
            if ($required) {
                throw new ApiException('URI (token id) is required', 400);
            }

            return '';
        }
        if (!preg_match('/^[a-z0-9-]+$/', $uri)) {
            throw new ApiException('URI must use lowercase letters, digits, and dashes only', 400);
        }
        if (strlen($uri) > 200) {
            throw new ApiException('URI is too long', 400);
        }

        return $uri;
    }

    private function normalizeColor(string $color): string {
        $color = trim($color);
        if ($color === '') {
            return '';
        }
        if (!preg_match('/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/', $color)) {
            throw new ApiException('Color must be #RRGGBB or #RRGGBBAA', 400);
        }

        return strtoupper($color);
    }

    private function componentsFromFlags(bool $todos, bool $notes): string {
        $parts = ['VEVENT'];
        if ($todos) {
            $parts[] = 'VTODO';
        }
        if ($notes) {
            $parts[] = 'VJOURNAL';
        }

        return implode(',', $parts);
    }

    private function tasksEnabled(): bool {
        $sys = is_array($this->config['system'] ?? null) ? $this->config['system'] : [];

        return array_key_exists('tasks_enabled', $sys) ? (bool) $sys['tasks_enabled'] : true;
    }

    private function notesEnabled(): bool {
        $sys = is_array($this->config['system'] ?? null) ? $this->config['system'] : [];

        return array_key_exists('notes_enabled', $sys) ? (bool) $sys['notes_enabled'] : false;
    }

    private function calendarUriExists(string $principal, string $uri): bool {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM calendarinstances WHERE principaluri = ? AND uri = ? LIMIT 1'
        );
        $stmt->execute([$principal, $uri]);

        return (bool) $stmt->fetchColumn();
    }

    private function addressBookUriExists(string $principal, string $uri): bool {
        $stmt = $this->pdo->prepare(
            'SELECT 1 FROM addressbooks WHERE principaluri = ? AND uri = ? LIMIT 1'
        );
        $stmt->execute([$principal, $uri]);

        return (bool) $stmt->fetchColumn();
    }

    private function isPgsql(): bool {
        try {
            return (string) $this->pdo->getAttribute(\PDO::ATTR_DRIVER_NAME) === 'pgsql';
        } catch (\Throwable $e) {
            return false;
        }
    }

    /**
     * @param list<mixed> $params
     */
    private function tryExec(string $sql, array $params = []): void {
        try {
            $this->pdo->prepare($sql)->execute($params);
        } catch (\Throwable $e) {
            // optional table
        }
    }
}
