**Пока не выполнять!** The server already answers the dav4jvm calls that WebDAV-sync would start sending. The redirect and 204 registration rules are handled in the WebDAV-sync app when it switches libraries. The only AngaraDAV item in that doc is an optional regression test, and the file sync-collection work is a separate project that this migration does not need.
# dav4jvm calls against AngaraDAV

dav4jvm 4.1.0 does not extend AngaraDAV. It is a client library (`at.bitfire.dav4jvm.ktor`). Putting it in WebDAV-sync adds no method, plugin, URL, or setting on the server. AngaraDAV already answers the calls below through SabreDAV, wired in `Core/Frameworks/Baikal/Core/Server.php`. A client has to send them. Switching libraries does not send them by itself.

Product version inspected with this note: 2.5.7 (`Core/Distrib.php`). SabreDAV is `sabre/dav ~4.7.0`. Conventions and contracts are the ones in [architecture-and-conventions.md](architecture-and-conventions.md), especially §4 (server wiring) and §9 (compatibility boundaries).

## Safety

Using dav4jvm 4.1.0 against the current server is safe. The calls it needs for files, calendars, address books, and WebDAV-Push are already implemented. A WebDAV-sync migration does not need an AngaraDAV release, a new plugin, a new URL, a YAML key, or a sabre/dav patch.

Changing the server so that every dav4jvm method succeeds is not safe. The methods that fail today fail on purpose. They sit on contracts that live clients, stored passwords, and the file-push design already depend on.

| Proposed server change | Safety | Why it stays as it is |
|---|---|---|
| Load a SEARCH plugin (RFC 5323) so `DavResource.search` succeeds | Unsafe | New query surface over calendars, cards, and file names. Nothing in AngaraDAV or WebDAV-sync sends SEARCH. |
| Set `Sabre\DAV\Server::$enablePropfindDepthInfinity = true` | Unsafe | Sabre leaves it false because one `PROPFIND` can walk the whole tree. `Server.php` does not set it. `Depth: infinity` is answered as depth 1. |
| RFC 6578 `sync-collection` on file homes | Unsafe inside this work | `Files\Directory` is not `Sabre\DAV\Sync\ISyncCollection`. A token has to come from a real change log. The file-push plan omits `{DAV:}sync-token` on file messages so clients do not send an invented token back. |
| Remove `Sabre\DAV\Locks\Plugin` because dav4jvm 4.1.0 has no lock method | Unsafe | Other clients take locks. A locked file answers `423`. That is the correct response to a client that cannot lock. |
| Rename `/dav.php/`, `/cal.php/`, `/card.php/`, or the Digest realm `BaikalDAV` | Unsafe | Endpoints are stored in clients. `digesta1` is `md5(username:realm:password)`. A new realm invalidates every DAV password. |
| Drop the push status-line fix, or treat a followed redirect as a successful registration | Unsafe | dav4jvm follows 301, 302, 307, and 308, up to five times. PHP turns a `Location` header into 302 unless the status is already 201 or 3xx. A registration is 204. |
| Client call rules plus regression tests that lock the behavior above | Safe | No new protocol surface. Optional file storage and push stay inside their existing `try/catch (\Throwable)` blocks. |

`Files` and `PushPlugin` init stay in those `try/catch` blocks. A dav4jvm client must not become a reason for a file-storage or push failure to take down CalDAV or CardDAV.

## Calls the server already accepts

These are calls dav4jvm can make that the current WebDAV-sync client does not make. No server change is required for a client to start sending them.

| dav4jvm call | What it sends | Where AngaraDAV answers |
|---|---|---|
| `options` | `OPTIONS`, `Content-Length: 0`, `Accept-Encoding: identity`. Redirects off unless the caller passes `followRedirects = true` | Sabre core. The `DAV:` header lists 1, 3, extended-mkcol, and the features of the enabled plugins. |
| `propfind` | `PROPFIND` with the named properties only. `Depth` is the integer, or `infinity` when the caller passes `-1` | Sabre core. File homes, calendars, and address books. `Depth: infinity` is stored as depth 1 while `enablePropfindDepthInfinity` is false. |
| `proppatch` | `PROPPATCH` | `Sabre\DAV\PropertyStorage\Plugin`. Dead properties are stored in the database. The library expects 207. |
| `head` | `HEAD` | Sabre core. |
| `get` | `GET`, with `Accept-Encoding: identity` unless the caller turns that off | Sabre core. |
| `getRange` | `GET` with `Range: bytes=` | Sabre core, when the node reports a size. The client must accept either 206 or a full 200. |
| `put` | `PUT`, including a streaming body. `If-Match` and `If-None-Match` travel as extra headers | Sabre core. On file homes, `If` preconditions go through `IfHeaderPreconditionPlugin`. |
| `post` | `POST` | Used for WebDAV-Push registration when push is on. A generic POST to a file is not a new file API. |
| `delete` | `DELETE` | Sabre core. The library treats 207 as an error. |
| `mkCol` | `MKCOL`, or `MKCALENDAR` when the method name is passed. A collection URL gains a trailing slash | `MKCOL` is Sabre core. `MKCALENDAR` needs CalDAV enabled. 207 is an error for this client. |
| `copy` | `COPY` with `Destination` and optional `Overwrite: F` | Sabre core. Default overwrite is true when the client omits the header. 207 is an error. |
| `move` | `MOVE` with the same destination rules. On success the library sets its URL from `Location`, or from the destination when `Location` is absent | Sabre core. Same overwrite default. 207 is an error. |
| `DavCollection.reportChanges` | `REPORT` `sync-collection` (RFC 6578), `Depth: 0`, sync-level `1` or `infinite` | `Sabre\DAV\Sync\Plugin` is always installed. It advertises and runs the report only when the node implements `ISyncCollection` and `getSyncToken()` is non-empty. Calendars and address books do. File directories do not. |
| `DavCalendar` query and multiget | CalDAV `REPORT` | `Sabre\CalDAV\Plugin` when CalDAV is enabled for that server. `calendar-query` plus expand depends on the sabre/dav timezone patch. |
| `DavAddressBook` query and multiget | CardDAV `REPORT` | `Sabre\CardDAV\Plugin` when CardDAV is enabled. |
| Push property `PROPFIND`, `POST` of `<push-register>`, `DELETE` of the registration URL | draft-bitfire-webdav-push. 4.1.0 sends `{DAV:}depth` on triggers and `content-encoding` (AngaraDAV accepts `aes128gcm`) | `PushPlugin` when `system.push_enabled` is set. File homes also need `system.push_files_enabled`. |

File homes are mounted only when `system.files_enabled` is set and storage starts. Calendars and address books follow their own enable flags. A disabled service still returns 404. That is existing behavior, not a gap dav4jvm opens.

`LOCK` is the other direction. File homes load `Sabre\DAV\Locks\Plugin`. dav4jvm 4.1.0 has no lock or unlock method, so a dav4jvm client does not use the locks the server already offers. A locked resource still answers `423` to `PUT` and `DELETE`.

## Calls the server does not implement

`DavResource.search` sends `SEARCH` (RFC 5323). `Server.php` does not load a SEARCH plugin. The server rejects that method. Leave SEARCH unimplemented. Nothing in AngaraDAV or WebDAV-sync needs it.

`reportChanges` on a file directory is `{DAV:}sync-collection` against a node that is not `ISyncCollection`. `Sync\Plugin::getSupportedReportSet()` returns an empty list there, and `syncCollection()` throws `ReportNotSupported`. A file client lists with `PROPFIND` at depth 0 or 1. Building a file change log is a separate project, described as step 12 below, and is not required to adopt the library.

## Redirects

dav4jvm follows 301, 302, 307, and 308 itself, up to five times, and it refuses only an HTTPS to HTTP downgrade. The Ktor client must be created with `followRedirects = false`, because the library follows redirects on its own. WebDAV-sync today follows none. A dav4jvm client can therefore leave the URL the user saved whenever AngaraDAV emits a 3xx `Location`.

Account URLs stay on `/dav.php/`, `/cal.php/`, and `/card.php/`. `/.well-known/caldav` and `/.well-known/carddav` remain nginx redirects to `/dav.php` for discovery. The saved account URL is the front controller, after discovery has finished.

Push registration must stay HTTP 204 with `Location` and `Expires`. PHP turns a `Location` header into 302 unless the status is already 201 or 3xx. A 302 is not a new push feature, and a client that follows it is not a successful registration. `DavResource.post` follows 302, so a rewritten status would walk the registration URL and then report whatever that second response was. Keep `PushPlugin::restoreStatusRewrittenByPhpLocation()` after `sapi->sendResponse()`. Real 302, 201, and responses without `Location` stay unchanged. `tests/php/PushLocationStatusTest.php` drives `php -S` because a fake SAPI that never calls `header()` cannot see the rewrite.

## What does not change

Accounts, the `dav.php` / `cal.php` / `card.php` URLs, Basic and Digest, the realm `BaikalDAV`, private certificates, quota properties, the upload ceiling (`ANGARA_DAV_MAX_BODY_SIZE`, PHP `upload_max_filesize` / `post_max_size`, and `files_max_upload_mb`), and the push draft stay as they are. A WebDAV-sync migration to dav4jvm does not need an AngaraDAV release.

## Implementation steps

Each step is work that makes dav4jvm a supported client of the server that already exists. Complexity is the chance of breaking a live contract, and the amount of machinery the step adds.

| Level | Meaning |
|---|---|
| Low | One existing pattern. No protocol, schema, plugin, or config change. |
| Medium | Several call sites and interacting rules, still inside the current contracts. |
| High | A security or protocol rule that is easy to invert even when a test is green. |
| Extra High | A new change log, retention on both databases, or a token live clients will store and send back. |

### 1. Leave the server wiring alone

**Complexity: Low.**

`Server::initServer()` stays the only place nodes and plugins are assembled. Do not register a plugin, route, or YAML key for dav4jvm. Do not add a file under `patches/` for this client. Do not bump `ANGARA_VERSION_BASE`.

Plugin order stays: Auth, DAVACL, Browser, PropertyStorage, then Locks and `IfHeaderPreconditionPlugin` when files started, then Sync, then the CalDAV set, then the CardDAV set, then `PushPlugin` when `push_enabled` is set. File-storage init and push init stay in `try/catch (\Throwable)` plus `error_log`, so CalDAV and CardDAV still start when those subsystems fail.

Auth stays `PDOBasicAuth` for `Basic`, Sabre's Apache backend for `Apache`, and Sabre's PDO Digest backend otherwise. The realm stays `BaikalDAV` unless the operator already changed `system.auth_realm`. A code change that rewrites the realm invalidates every stored `digesta1`.

### 2. Configure the client HTTP stack

**Complexity: Low.**

In the WebDAV-sync process that constructs the Ktor `HttpClient`:

- Set `followRedirects = false`. dav4jvm follows 301, 302, 307, and 308 itself (`DavResource.MAX_REDIRECTS` is 5) and throws when an HTTPS URL redirects to HTTP.
- Send credentials with the auth plugin. Digest uses the realm from `WWW-Authenticate`. The client stores the realm it was challenged with. It does not hard-code a second realm.
- Save the account on `/dav.php/`, `/cal.php/`, or `/card.php/`, including the trailing base path Sabre is mounted at. Discovery may start at `/.well-known/caldav` or `/.well-known/carddav`. The URL written into the account is the front controller those redirects land on.
- Trust a private certificate in the client trust store. The server does not gain a certificate setting for this library.

`options()` keeps its default `followRedirects = false`, so a capability check does not silently move the account to another host.

### 3. Gate features from OPTIONS and the collection URL

**Complexity: Low.**

Call `options()` on the saved collection URL. Read the `DAV:` header. Tokens `1` and `3` mean the node is a WebDAV collection Sabre is serving. Further tokens appear only for plugins that loaded on that front controller: CalDAV on `dav.php` when `cal_enabled` is set and on `cal.php`, CardDAV the same way for `card_enabled` / `card.php`, `webdav-push` only when push started and `push_external_url` is valid HTTPS.

A missing token means that service is off. The matching collection URL returns 404. The client shows that as "this server does not offer that service". It does not retry with a different method, and it does not require an AngaraDAV change.

File homes exist only when `system.files_enabled` is set and `FileStorageConfig` started. The client uses `/dav.php/files/{username}/`. `HomeCollection` sets `disableListing`, so a `PROPFIND` of `/dav.php/files/` does not enumerate other users. The home root refuses `DELETE` and rename (`Directory` throws `Forbidden`).

### 4. Read and write properties

**Complexity: Low.**

`propfind` asks for named properties at depth 0 or 1. Depth `-1` (`infinity`) is sent as the header `infinity`. Sabre rewrites every depth other than 0 to 1 while `enablePropfindDepthInfinity` is false (`CorePlugin` and `Server::getPropertiesIteratorForPath`). The response is still 207. The client treats that body as one level of children, which is what the server returned. Leave the flag false. Turning it on lets one request walk every calendar, address book, and file the account can read.

`proppatch` sets and removes dead properties. They persist through `Sabre\DAV\PropertyStorage\Backend\PDO`. The library expects a 207 multistatus. Sabre already sends `Content-Type: application/xml; charset=utf-8`, which dav4jvm accepts.

Quota is `Directory::getQuotaInfo()`, already exposed as the quota properties. Trash bytes count toward that quota. The trash directory is not a DAV collection. The client does not look for `trash/` under the home.

### 5. Download bytes

**Complexity: Low.**

`get` leaves `disableCompression` at its default `true`, so the request sends `Accept-Encoding: identity`. Compression can change the ETag the next conditional `PUT` will send.

`head` reads size, type, and ETag without a body.

`getRange(offset, size)` sends `Range: bytes={offset}-{offset+size-1}`. In the callback, accept 206 with `Content-Range` and also a full 200. Sabre returns 206 when the node advertised `Content-Length` and the range fits (`CorePlugin::httpGet`). A node without a size is a 200 of the whole body. The client does not require a new range plugin.

### 6. Upload and preconditions

**Complexity: Medium.**

`put` may stream. The body is an `OutgoingContent` whose `readFrom` can be called again if the library repeats the request. Sabre writes it through `File::put` / `Directory::createFile` into `HomeStorage::writeFile`. The effective size is the minimum of the nginx body limit on `/dav.php`, the baked PHP `upload_max_filesize` and `post_max_size`, and `files_max_upload_mb`. Over the app limit, the client sees `413` (`PayloadTooLarge`).

Conditional writes use the headers the library already forwards:

- `If-Match` and `If-None-Match` go through `Sabre\DAV\Server::checkPreconditions`. A mismatch is `412`. The comparison is against `File::getETag()` for file nodes.
- An `If:` header on a URL under `files/` goes through `IfHeaderPreconditionPlugin`, the SabreDAV 4.7 workaround scoped to file homes. Leave that plugin's scope on `files/`. A calendar `PUT` does not need it.
- A calendar marked read-only in `Specific/portal_meta.json` is rejected by `ReadOnlyPlugin` for DAV writes and by the portal for API writes. A `412` or a read-only `403` stays a client error. The plugin is not relaxed so a dav4jvm upload can succeed.

Calendar and address-book object `PUT` stays on the Sabre backends so `synctoken` and the change tables move together. Portal writes already do the same. A dav4jvm upload uses the DAV URL, not `/api/`.

### 7. Create, delete, copy, and move

**Complexity: Medium.**

`delete` treats 207 as failure. The client surfaces that as "the collection was not fully deleted" and does not mark the local tree clean.

`mkCol` sends `MKCOL`. Pass method name `MKCALENDAR` and the extended body only when step 3 saw CalDAV. 207 is a failure for both.

`copy` and `move` send `Destination`. Send `Overwrite: F` when the destination must be left in place. Omitting the header overwrites, because that is the RFC 4918 default and the library's default. `move` then points the local resource at `Location` when the response has one, otherwise at the destination URL.

`Directory::moveInto` returns false unless the source is a `File` or `Directory` in the same home. A move between two users' homes stays unsupported. The home root still cannot be deleted or renamed.

`DELETE` of a file or folder inside a home moves it to Trash when `files_trash_days` is greater than 0. The DAV URL is gone. Restore, delete-now, and empty are portal APIs. The dav4jvm client does not gain a trash collection.

### 8. Collection sync where the server has a token

**Complexity: Medium.**

Call `DavCollection.reportChanges` on a calendar or an address book. Send `Depth: 0` and sync-level `1` or `infinite`. The token in the multistatus uses the prefix `http://sabre.io/ns/sync/` (`Sabre\DAV\Sync\Plugin::SYNCTOKEN_PREFIX`). The client stores that string and sends it back unchanged. A token with any other prefix is `InvalidSyncToken` on the next report.

Before the first report, `PROPFIND` `{DAV:}supported-report-set`. `sync-collection` is listed only when `getSupportedReportSet` saw an `ISyncCollection` with a non-empty token. On a file directory the set does not contain it. The client lists that directory with `propfind` at depth 1 and remembers etags locally. It does not call `reportChanges` on `files/{username}/…`.

File push messages omit `{DAV:}sync-token` (`<content-update/>` with no token). The client must not invent one and must not pass a missing token into `reportChanges` as if the server had issued it. Calendar and address-book push messages may carry the real token. That token is valid for `reportChanges` on that collection.

### 9. CalDAV and CardDAV reports

**Complexity: Medium.**

`DavCalendar` query and multiget run only after step 3 saw CalDAV, and only against a calendar collection URL. A query that sends `<C:expand/>` depends on `Sabre\CalDAV\Plugin::resolveCalendarTimeZone()` from `patches/`. AngaraDAV stores `{urn:ietf:params:xml:ns:caldav}calendar-timezone` as an Olson id. Stock sabre/dav 4.7 parses that property as a `VCALENDAR` and returns 500 on expand. The patch accepts both forms. If a dav4jvm expand query starts returning 500, repair the patch and `scripts/apply-vendor-patches.sh`. Do not fork sabre inside `Core/`.

`ReadOnlyPlugin` still applies to those reports' writes. Sharing stays the Sabre CalDAV sharing plugins plus the portal `ShareService`. CardDAV does not gain a sharing plugin because a dav4jvm address book can query it.

`DavAddressBook` query and multiget run only when CardDAV is enabled. Stored cards keep `X-BAIKAL-CUSTOM`. A client that rewrites a card sends the properties it does not understand back unchanged, so custom fields survive a round trip through the library.

### 10. WebDAV-Push registration

**Complexity: High.**

This is the step most likely to look green and still be wrong. dav4jvm will follow a 302. A registration that has been rewritten to 302 is then a second request to the `Location` URL, not a stored subscription.

Server side, keep the current sequence in `PushPlugin`:

1. Registration response is 204 with `Location` and `Expires`.
2. `handled()` calls `sapi->sendResponse()`.
3. `restoreStatusRewrittenByPhpLocation()` runs when `Location` is set, the intended status is neither 201 nor 3xx, headers are still replaceable, and `http_response_code()` is 302. It writes the original status line back.
4. A genuine 302, a 201, and a response with no `Location` are left alone.

Prove that with `php tests/php/PushLocationStatusTest.php` (it uses PHP's built-in server). `RecordingSapi` never calls `header()`, so a unit double that only records Sabre's response still shows 204 and cannot catch the rewrite.

Client side, in the WebDAV-sync code that calls `post` for `<push-register>`:

- Accept only 200, 201, and 204 before reading `Location`.
- Treat 302 as `PushRegistrationResult.Failed`. Do not read `Location` from a 302 and do not store a subscription from it.
- Send `content-encoding` `aes128gcm`. `SubscriptionValidator` rejects anything else.
- Send triggers with `{DAV:}depth` (`0`, `1`, or `infinity`). `RegisterParser` already reads that element. An empty depth defaults to `0`. An unknown depth is stored as `0`.
- Subscribe file directories only when `system.push_files_enabled` is on. Otherwise the directory answers `403` `push-not-available`. `files/` itself and individual files stay non-capable.
- Unregister with `DELETE` on the registration URL. An unknown token and a token owned by someone else both answer 404.

After a server deploy that restored 204, existing devices toggle push off and on so they register again. Rows stored while the status was 302 expire on their own. They have no `Location` the client can `DELETE`.

### 11. Lock the methods that stay unimplemented

**Complexity: High.**

The work in this step is a regression test, not a feature. The failure mode is a later change that "finishes" dav4jvm support by opening one of the unsafe rows in the safety table.

Add one standalone script `tests/php/Dav4jvmContractTest.php` in the usual shape: `declare(strict_types=1)`, require `vendor/autoload.php`, local `$failures`, `assert_true`, exit 0 or 1. Wire it into `Server` the way `tests/php/PushFilesPluginTest.php` does, with an in-memory SQLite PDO. Assert all of the following on that server:

- `OPTIONS` on a file home does not advertise a SEARCH capability, and a `SEARCH` request is rejected.
- `Server` was constructed without setting `enablePropfindDepthInfinity`. A `PROPFIND` with `Depth: infinity` returns the same member set as `Depth: 1`.
- `PROPFIND` of `{DAV:}supported-report-set` on a file directory does not list `{DAV:}sync-collection`. The same property on a calendar collection does, when CalDAV was enabled for that server.
- `REPORT` `sync-collection` on the file directory is `ReportNotSupported`.
- With the locks plugin loaded, the file node tree still exposes the lock methods Sabre advertises. The test does not call `LOCK` through a dav4jvm-shaped client and does not remove the plugin.
- `COPY` and `MOVE` without `Overwrite` replace an existing destination. With `Overwrite: F` they leave it.
- `GET` with a satisfiable `Range` on a file that has a size returns 206. A range that starts past the end returns 416.
- `PUT` with a non-matching `If-Match` returns 412 and leaves the bytes in place.
- `DELETE` of the home root returns 403.

Register the script as its own named step in `.github/workflows/ci.yml`. `code-analysis` lists scripts one by one. A new file that is not listed does not run there. Keep PHPStan at level 0 on `Core`. Do not add a PHPUnit case.

While writing the assertions, leave `IfHeaderPreconditionPlugin` and `ReadOnlyPlugin` on their current paths. A test that only passes after those plugins are bypassed is the rule being inverted.

### 12. File sync-collection, as its own project

**Complexity: Extra High.**

Do not start this step in order to adopt dav4jvm. File clients are fully supported by step 8's `PROPFIND` path. This step exists so a later change is sized honestly before anyone adds `ISyncCollection` to `Directory`.

The report can be advertised only after a durable change log exists. Sabre calls `getChanges($syncToken, $syncLevel, $limit)` and then emits `http://sabre.io/ns/sync/` plus `getSyncToken()`. A token that is a timestamp, a hash of the directory listing, or a constant will be stored by dav4jvm and sent back. The next report then lies about what changed. The file-push plan already refuses to put such a token in `<content-update/>`.

A real log has to record every mutation that changes what a `PROPFIND` depth 1 would see:

- DAV `PUT`, `MKCOL`, `DELETE`, `MOVE`, `COPY`, and `PROPPATCH` on file homes, via `HomeStorage`.
- Portal `FileService` writes on the same homes, including `bulk`.
- Trash capture when `files_trash_days` is greater than 0, restore, delete-now, and empty. The live URL disappears or reappears. The trash directory itself stays out of the report.
- Quarantine when an admin deletes the user. That home's sync state ends. A recreated username gets a new storage id and an empty log.

The log needs retention, a monotonic token, and the same schema on SQLite and PostgreSQL (`SchemaManager`, plus the optional `FileSchemaDriverTest` path). Depth `1` reports direct children. Depth `infinite` reports the subtree. Both levels are what `reportChanges` can ask for. Portal and DAV writes share one log so the token a CalDAV-style client sees matches the tree the portal shows.

Only after that report is real does file push gain `{DAV:}sync-token`. Until then, file push messages stay `<content-update/>` with the token omitted.

This step touches ordering between the request, the filesystem rename, and the log row, and it touches both databases. It is larger than the client migration and ships on its own, with its own tests. It does not ride along with steps 1–11.

### 13. Ship the client migration separately from any server test

**Complexity: Low.**

WebDAV-sync can switch its HTTP calls to dav4jvm 4.1.0 using steps 2 through 10 without an AngaraDAV tag. The server behavior those steps rely on is already in 2.5.7.

Step 11 is the only AngaraDAV diff this work should produce, and only when that regression script is wanted in tree. It does not change runtime behavior. Step 12 stays unscheduled until a file-sync design says the change log is in scope.

After a server deploy that includes the push 204 fix, devices re-register as step 10 describes. No account URL, realm, or certificate change is part of the migration.
