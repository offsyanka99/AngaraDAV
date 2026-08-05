<?php

#################################################################
#  Copyright notice
#
#  (c) 2013 Jérôme Schneider <mail@jeromeschneider.fr>
#  All rights reserved
#
#  http://sabre.io/baikal
#
#  This script is part of the Baïkal Server project. The Baïkal
#  Server project is free software; you can redistribute it
#  and/or modify it under the terms of the GNU General Public
#  License as published by the Free Software Foundation; either
#  version 2 of the License, or (at your option) any later version.
#
#  The GNU General Public License can be found at
#  http://www.gnu.org/copyleft/gpl.html.
#
#  This script is distributed in the hope that it will be useful,
#  but WITHOUT ANY WARRANTY; without even the implied warranty of
#  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
#  GNU General Public License for more details.
#
#  This copyright notice MUST APPEAR in all copies of the script!
#################################################################

namespace Baikal\Portal\Install;

use Symfony\Component\Yaml\Yaml;

/**
 * Schema migrations previously driven by the classic Formal upgrade wizard.
 * Invoked by portal install API (POST /api/install/upgrade).
 */
class SchemaUpgrade {
    /** @var list<string> */
    protected $aErrors = [];
    /** @var list<string> */
    protected $aSuccess = [];

    /**
     * @param array<string, mixed> $databaseConfig
     *
     * @return array{ok: bool, errors: list<string>, success: list<string>}
     */
    public function run(array $databaseConfig, string $from, string $to): array {
        try {
            $ok = $this->upgrade($databaseConfig, $from, $to);
        } catch (\Throwable $e) {
            $this->aErrors[] = 'Uncaught exception during upgrade: ' . $e->getMessage();
            $ok = false;
        }

        return [
            'ok'      => $ok === true,
            'errors'  => $this->aErrors,
            'success' => $this->aSuccess,
        ];
    }

    /**
     * @param array<string, mixed> $databaseConfig
     */
    protected function upgrade($databaseConfig, $sVersionFrom, $sVersionTo) {
        if (version_compare($sVersionFrom, '0.2.3', '<=')) {
            throw new \Exception('This version of AngaraDAV does not support upgrading from Baikal 0.2.3 and older. Please request help on GitHub if this is a problem.');
        }

        $this->assertConfigWritable();

        $pdo = $GLOBALS['DB']->getPDO();
        if (version_compare($sVersionFrom, '0.3.0', '<')) {
            // Upgrading from sabre/dav 1.8 schema to 3.1 schema.

            // SQLite upgrade (MySQL is no longer supported; see the guard in render())

            // sabre/dav 2.0 changes
            foreach (['calendar', 'addressbook'] as $dataType) {
                $tableName = $dataType . 's';
                // Note: we can't remove the ctag field in sqlite :(;
                $pdo->exec("ALTER TABLE $tableName ADD synctoken integer");
                $this->aSuccess[] = 'synctoken was added to ' . $tableName;

                $changesTable = $dataType . 'changes';
                $pdo->exec("
                        CREATE TABLE $changesTable (
                            id integer primary key asc,
                            uri text,
                            synctoken integer,
                            {$dataType}id integer,
                            operation bool
                        );
                    ");
                $this->aSuccess[] = $changesTable . ' was created';
            }
            $pdo->exec("
                    CREATE TABLE calendarsubscriptions (
                        id integer primary key asc,
                        uri text,
                        principaluri text,
                        source text,
                        displayname text,
                        refreshrate text,
                        calendarorder integer,
                        calendarcolor text,
                        striptodos bool,
                        stripalarms bool,
                        stripattachments bool,
                        lastmodified int
                    );
                ");
            $this->aSuccess[] = 'calendarsubscriptions was created';
            $pdo->exec("CREATE INDEX principaluri_uri ON calendarsubscriptions (principaluri, uri);");

            $pdo->exec("
                    ALTER TABLE cards ADD etag text;
                    ALTER TABLE cards ADD size integer;
                ");
            $this->aSuccess[] = 'etag and size were added to cards';

            // sabre/dav 2.1 changes;
            $pdo->exec('ALTER TABLE calendarobjects ADD uid TEXT');
            $this->aSuccess[] = 'uid was added to calendarobjects';

            $pdo->exec('
                    CREATE TABLE IF NOT EXISTS schedulingobjects (
                        id integer primary key asc,
                        principaluri text,
                        calendardata blob,
                        uri text,
                        lastmodified integer,
                        etag text,
                        size integer
                    )
                ');
            $this->aSuccess[] = 'schedulingobjects was created';

            // sabre/dav 3.0 changes
            $pdo->exec("
                    CREATE TABLE propertystorage (
                        id integer primary key asc,
                        path text,
                        name text,
                        valuetype integer,
                        value blob
                    );
                ");
            $pdo->exec('CREATE UNIQUE INDEX path_property ON propertystorage (path, name);');
            $this->aSuccess[] = 'propertystorage was created';

            // Statements for SQLite
            $result = $pdo->query('SELECT id, carddata FROM cards');
            $stmt = $pdo->prepare('UPDATE cards SET etag = ?, size = ? WHERE id = ?');
            while ($row = $result->fetch(\PDO::FETCH_ASSOC)) {
                $stmt->execute([
                    md5($row['carddata']),
                    strlen($row['carddata']),
                    $row['id'],
                ]);
            }
            $this->aSuccess[] = 'etag and size was recalculated for cards';
            $result = $pdo->query('SELECT id, calendardata FROM calendarobjects');
            $stmt = $pdo->prepare('UPDATE calendarobjects SET uid = ? WHERE id = ?');
            $counter = 0;

            while ($row = $result->fetch(\PDO::FETCH_ASSOC)) {
                try {
                    $vobj = \Sabre\VObject\Reader::read($row['calendardata']);
                } catch (\Exception $e) {
                    $this->aSuccess[] = 'warning: skipped record ' . $row['id'] . '. Error: ' . $e->getMessage();
                    continue;
                }
                $uid = null;
                $item = $vobj->getBaseComponent();
                if (!isset($item->UID)) {
                    $vobj->destroy();
                    continue;
                }
                $uid = (string) $item->UID;
                $stmt->execute([$uid, $row['id']]);
                ++$counter;
                $vobj->destroy();
            }
            $this->aSuccess[] = 'uid was recalculated for calendarobjects';

            $result = $pdo->query('SELECT id, uri, vcardurl FROM principals WHERE vcardurl IS NOT NULL');
            $stmt1 = $pdo->prepare('INSERT INTO propertystorage (path, name, valuetype, value) VALUES (?, ?, 3, ?)');

            while ($row = $result->fetch(\PDO::FETCH_ASSOC)) {
                // Inserting the new record
                $stmt1->execute([
                    'addressbooks/' . basename($row['uri']),
                    '{http://calendarserver.org/ns/}me-card',
                    serialize(new \Sabre\DAV\Xml\Property\Href($row['vcardurl'])),
                ]);
            }
            $this->aSuccess[] = 'vcardurl was migrated to the propertystorage system';
        }
        if (version_compare($sVersionFrom, '0.4.0', '<')) {
            // The sqlite schema had issues with both the calendar and
            // addressbooks tables. The tables didn't have a DEFAULT '1' for
            // the synctoken column. So we're adding it now.
            if ($databaseConfig['mysql'] === false) {
                $pdo->exec('UPDATE calendars SET synctoken = 1 WHERE synctoken IS NULL');

                $tmpTable = '_' . time();
                $pdo->exec('ALTER TABLE calendars RENAME TO calendars' . $tmpTable);

                $pdo->exec('
CREATE TABLE calendars (
    id integer primary key asc NOT NULL,
    principaluri text NOT NULL,
    displayname text,
    uri text NOT NULL,
    synctoken integer DEFAULT 1 NOT NULL,
    description text,
    calendarorder integer,
    calendarcolor text,
    timezone text,
    components text NOT NULL,
    transparent bool
);');

                $pdo->exec('INSERT INTO calendars SELECT id, principaluri, displayname, uri, synctoken, description, calendarorder, calendarcolor, timezone, components, transparent FROM calendars' . $tmpTable);

                $this->aSuccess[] = 'Updated calendars table';
            }
        }
        if (version_compare($sVersionFrom, '0.4.5', '<=')) {
            // Similar to upgrading from older than 0.4.5, there were still
            // issues with a missing DEFAULT 1 for sthe synctoken field in the
            // addressbook.
            if ($databaseConfig['mysql'] === false) {
                $pdo->exec('UPDATE addressbooks SET synctoken = 1 WHERE synctoken IS NULL');

                $tmpTable = '_' . time();
                $pdo->exec('ALTER TABLE addressbooks RENAME TO addressbooks' . $tmpTable);

                $pdo->exec('
CREATE TABLE addressbooks (
    id integer primary key asc NOT NULL,
    principaluri text NOT NULL,
    displayname text,
    uri text NOT NULL,
    description text,
    synctoken integer DEFAULT 1 NOT NULL
);
                ');

                $pdo->exec('INSERT INTO addressbooks SELECT id, principaluri, displayname, uri, description, synctoken FROM addressbooks' . $tmpTable);
                $this->aSuccess[] = 'Updated addressbooks table';
            }
        }
        if (version_compare($sVersionFrom, '0.5.1', '<')) {
            if ($databaseConfig['mysql'] === false) {
                $pdo->exec(<<<SQL
CREATE TABLE calendarinstances (
    id integer primary key asc NOT NULL,
    calendarid integer,
    principaluri text,
    access integer COMMENT '1 = owner, 2 = read, 3 = readwrite' NOT NULL DEFAULT '1',
    displayname text,
    uri text NOT NULL,
    description text,
    calendarorder integer,
    calendarcolor text,
    timezone text,
    transparent bool,
    share_href text,
    share_displayname text,
    share_invitestatus integer DEFAULT '2',
    UNIQUE (principaluri, uri),
    UNIQUE (calendarid, principaluri),
    UNIQUE (calendarid, share_href)
);
SQL
                );
                $this->aSuccess[] = 'Created calendarinstances table';
                $pdo->exec('
INSERT INTO calendarinstances
    (
        calendarid,
        principaluri,
        access,
        displayname,
        uri,
        description,
        calendarorder,
        calendarcolor,
        transparent
    )
SELECT
    id,
    principaluri,
    1,
    displayname,
    uri,
    description,
    calendarorder,
    calendarcolor,
    transparent
FROM calendars
');
                $this->aSuccess[] = 'Migrated calendarinstances table';
                $calendarBackup = 'calendars_3_1';
                $pdo->exec('ALTER TABLE calendars RENAME TO ' . $calendarBackup);
                $this->aSuccess[] = 'Did calendars backup';

                $pdo->exec(<<<SQL
CREATE TABLE calendars (
    id integer primary key asc NOT NULL,
    synctoken integer DEFAULT 1 NOT NULL,
    components text NOT NULL
);
SQL
                );
                $this->aSuccess[] = 'Created new calendars table';
            }

            $pdo->exec(<<<SQL
INSERT INTO calendars (id, synctoken, components) SELECT id, COALESCE(synctoken,1) as synctoken, COALESCE(components,"VEVENT,VTODO,VJOURNAL") as components FROM $calendarBackup
SQL
            );
            $this->aSuccess[] = 'Migrated calendars table';
        }
        if (version_compare($sVersionFrom, '0.9.4', '<')) {
            $pdo->exec("UPDATE calendarinstances SET access = 1 WHERE access IS NULL");
            $pdo->exec("UPDATE calendarinstances SET share_invitestatus = 2 WHERE share_invitestatus IS NULL");
            $this->aSuccess[] = 'Updated default values in calendarinstances table';
        }

        if (version_compare($sVersionFrom, '0.10.0', '<')) {
            $config = Yaml::parseFile(PROJECT_PATH_CONFIG . "baikal.yaml");

            $oConfig = new \Baikal\Model\Config\Database();
            // Legacy boolean 'mysql' flag is guarded off in render(); anything reaching
            // here predates the 'backend' key and was SQLite.
            $oConfig->set("backend", 'sqlite');
            $oConfig->persist();
        }

        $this->updateConfiguredVersion($sVersionTo);

        return true;
    }

    protected function updateConfiguredVersion($sVersionTo) {
        # Update BAIKAL_CONFIGURED_VERSION
        $oConfig = new \Baikal\Model\Config\Standard();
        $oConfig->set("configured_version", $sVersionTo);
        $oConfig->persist();
    }

    protected function assertConfigWritable() {
        # Parsing the config also makes sure that it is not malformed
        $oConfig = new \Baikal\Model\Config\Standard();
        if ($oConfig->writable() === false) {
            throw new \Exception(PROJECT_PATH_CONFIG . "baikal.yaml is not writable");
        }
    }
}
