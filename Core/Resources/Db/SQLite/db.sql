CREATE TABLE addressbooks (
    id integer primary key asc NOT NULL,
    principaluri text NOT NULL,
    displayname text,
    uri text NOT NULL,
    description text,
    synctoken integer DEFAULT 1 NOT NULL
);

CREATE TABLE cards (
    id integer primary key asc NOT NULL,
    addressbookid integer NOT NULL,
    carddata blob,
    uri text NOT NULL,
    lastmodified integer,
    etag text,
    size integer
);

CREATE TABLE addressbookchanges (
    id integer primary key asc NOT NULL,
    uri text,
    synctoken integer NOT NULL,
    addressbookid integer NOT NULL,
    operation integer NOT NULL
);

CREATE INDEX addressbookid_synctoken ON addressbookchanges (addressbookid, synctoken);
CREATE TABLE calendarobjects (
    id integer primary key asc NOT NULL,
    calendardata blob NOT NULL,
    uri text NOT NULL,
    calendarid integer NOT NULL,
    lastmodified integer NOT NULL,
    etag text NOT NULL,
    size integer NOT NULL,
    componenttype text,
    firstoccurence integer,
    lastoccurence integer,
    uid text
);

CREATE TABLE calendars (
    id integer primary key asc NOT NULL,
    synctoken integer DEFAULT 1 NOT NULL,
    components text NOT NULL
);

CREATE TABLE calendarinstances (
    id integer primary key asc NOT NULL,
    calendarid integer,
    principaluri text,
    access integer,
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

CREATE TABLE calendarchanges (
    id integer primary key asc NOT NULL,
    uri text,
    synctoken integer NOT NULL,
    calendarid integer NOT NULL,
    operation integer NOT NULL
);

CREATE INDEX calendarid_synctoken ON calendarchanges (calendarid, synctoken);

CREATE TABLE calendarsubscriptions (
    id integer primary key asc NOT NULL,
    uri text NOT NULL,
    principaluri text NOT NULL,
    source text NOT NULL,
    displayname text,
    refreshrate text,
    calendarorder integer,
    calendarcolor text,
    striptodos bool,
    stripalarms bool,
    stripattachments bool,
    lastmodified int
);

CREATE TABLE schedulingobjects (
    id integer primary key asc NOT NULL,
    principaluri text NOT NULL,
    calendardata blob,
    uri text NOT NULL,
    lastmodified integer,
    etag text NOT NULL,
    size integer NOT NULL
);

CREATE INDEX principaluri_uri ON calendarsubscriptions (principaluri, uri);
BEGIN TRANSACTION;
CREATE TABLE locks (
	id integer primary key asc NOT NULL,
	owner text,
	timeout integer,
	created integer,
	token text,
	scope integer,
	depth integer,
	uri text
);
COMMIT;
CREATE TABLE principals (
    id INTEGER PRIMARY KEY ASC NOT NULL,
    uri TEXT NOT NULL,
    email TEXT,
    displayname TEXT,
    UNIQUE(uri)
);

CREATE TABLE groupmembers (
    id INTEGER PRIMARY KEY ASC NOT NULL,
    principal_id INTEGER NOT NULL,
    member_id INTEGER NOT NULL,
    UNIQUE(principal_id, member_id)
);

CREATE TABLE propertystorage (
    id integer primary key asc NOT NULL,
    path text NOT NULL,
    name text NOT NULL,
    valuetype integer NOT NULL,
    value string
);


CREATE UNIQUE INDEX path_property ON propertystorage (path, name);
CREATE TABLE users (
	id integer primary key asc NOT NULL,
	username TEXT NOT NULL,
	digesta1 TEXT NOT NULL,
	UNIQUE(username)
);

-- Generic WebDAV file-home identities. File bytes remain on the filesystem.
CREATE TABLE file_homes (
    id integer primary key asc NOT NULL,
    user_id integer UNIQUE,
    principaluri text NOT NULL,
    storage_id text NOT NULL UNIQUE,
    status text NOT NULL,
    created_at integer NOT NULL,
    quarantined_at integer
);
CREATE INDEX file_homes_principal ON file_homes (principaluri);
CREATE INDEX file_homes_status ON file_homes (status);

-- WebDAV-Push (draft-bitfire-webdav-push) subscriptions.
CREATE TABLE push_subscriptions (
    id integer primary key asc NOT NULL,
    registration_token text NOT NULL UNIQUE,
    principaluri text NOT NULL,
    resource_uri text NOT NULL,
    topic text NOT NULL,
    push_resource text NOT NULL,
    push_resource_hash text NOT NULL,
    content_encoding text,
    pubkey text NOT NULL,
    auth_secret text NOT NULL,
    triggers text NOT NULL,
    created integer NOT NULL,
    expires integer NOT NULL
);

CREATE UNIQUE INDEX push_resource_uri ON push_subscriptions (resource_uri, push_resource_hash);
CREATE INDEX push_resource_lookup ON push_subscriptions (resource_uri);
CREATE INDEX push_principal_lookup ON push_subscriptions (principaluri);

CREATE TABLE push_queue (
    id integer primary key asc NOT NULL,
    resource_uri text NOT NULL UNIQUE,
    topic text NOT NULL,
    content_update integer NOT NULL DEFAULT 0,
    property_update integer NOT NULL DEFAULT 0,
    sync_token text,
    suppressed_ids text NOT NULL DEFAULT '[]',
    attempts integer NOT NULL DEFAULT 0,
    available_at integer NOT NULL,
    created integer NOT NULL
);

CREATE INDEX push_queue_available ON push_queue (available_at);
