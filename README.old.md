> Historical README (pre-2.3.1). Current docs: [README.md](README.md).

AngaraDAV
=========

[![continuous-integration](https://github.com/offsyanka99/AngaraDAV/actions/workflows/ci.yml/badge.svg)](https://github.com/offsyanka99/AngaraDAV/actions/workflows/ci.yml)
[![docker](https://github.com/offsyanka99/AngaraDAV/actions/workflows/docker.yml/badge.svg)](https://github.com/offsyanka99/AngaraDAV/actions/workflows/docker.yml)

AngaraDAV is a self-hosted calendar, contacts, tasks, notes, and WebDAV file server powered by SabreDAV. It is derived from [Baïkal](https://sabre.io/baikal/) **0.11.1** and now has an independent product identity and release path.

**Version:** `2.3.3`
**Docs:** [docs/](docs/) · [Deployment](docs/DEPLOYMENT.md) · [Local Docker](docs/local.compose.yaml) · [TrueNAS compose](docs/truenas-scale.compose.yaml) · [Improvements plan](docs/IMPROVEMENTS.md)

**Related project:** [WebDAV-sync](https://github.com/offsyanka99/WebDAV-sync) — Android app for syncing a private WebDAV file home with AngaraDAV (and other WebDAV servers).

AngaraDAV includes:

- **Docker** image and **TrueNAS SCALE** compose
- **GHCR** multi-arch images: `ghcr.io/offsyanka99/angaradav`
- Admin hardening (`password_hash`, session timeout, login rate limit)
- System settings for **Tasks (VTODO)** and **Notes (VJOURNAL)**
- `/health.php` and `/info.php` for monitoring
- CalDAV **calendar-timezone** dual-format fix (plain Olson id + VTIMEZONE) for Home Assistant expand queries
- Optional **WebDAV-Push** for near-real-time CalDAV/CardDAV change notifications (Web Push transport; tested for DAVx⁵ interoperability), with ACL enforcement, SSRF protection, encrypted subscriptions, quotas, and a persistent delivery worker
- Optional private **generic WebDAV file homes** with owner-only ACLs, atomic streamed uploads, quotas, persistent locks/properties, and deleted-account quarantine
- **User portal** (`/portal/`) — TypeScript SPA + PHP API:
  - **Calendar** tab: owned list (Edit / Delete), month event grid, create/edit/delete events (incl. RRULE), holidays/read-only, details/share/import/export; **Add calendar → Import .ics**; large imports with live **%** progress
  - **Contacts** tab: address books (CRUD + delete confirm), contact list/search/edit, multi email/phone, photos, birthday/special dates, per-contact and book `.vcf` export (progress dialog for large `.vcf`)
  - **Tasks** / **Notes** tabs: CalDAV `VTODO` / `VJOURNAL` (bulk actions on tasks); Contacts/Tasks/Notes tables support **↑/↓/Enter** keyboard navigation
  - **Files** tab: browse/upload (toolbar **Upload ▾** Files…/Folder…, drop mix onto list)/view/download/copy/move/rename/delete private WebDAV home (`/dav.php/files/{username}/`) when file storage is enabled; in-browser preview for images, PDF, text, audio, and video; upload progress dialog; folder item counts; Copy/Move use a folder tree; same-folder copies get a ` (copy)` name, cross-folder copies keep the original filename
  - User tabs (**Calendar / Contacts / Tasks / Notes / Files**) follow Admin **DAV services** toggles (CalDAV, CardDAV, Tasks, Notes, Files); disabled services hide the matching tab
  - **Administration** (Admin-role DAV users): Overview, System settings, Users CRUD, Database (CONFIRM write), installer at **`/portal/install/`**. See [Portal Administration](docs/DEPLOYMENT.md#portal-administration).
  - Fast portal imports via **chunked SQLite transactions** (large Thunderbird calendars in seconds on NAS)
  - Info **(i)** modals; optional 12h/24h, week-start, and portal debug log level prefs
- `/dav.php/` kept as classic browser and combined CalDAV/CardDAV/WebDAV endpoint
- Day-to-day admin and install live in the **portal** (`/portal/`, `/portal/install/`)


Compatibility
-------------

Existing installations can upgrade without moving data. AngaraDAV deliberately retains the `Baikal\*` PHP namespaces, `BAIKAL_*` environment variables, `baikal.yaml`, `/var/www/baikal`, database schema, volume layout, authentication realm, and DAV endpoint URLs. These are compatibility contracts, not the active product name.

Legacy release history
----------------------

| Version | Meaning |
|---------|---------|
| `0.11.1` | Upstream Baïkal line from which AngaraDAV was derived |
| `0.11.1-fork.1` | First packaged release (portal v1, HA timezone, Docker/TrueNAS) |
| `0.11.1-fork.2` | Portal calendars/contacts polish: import/export, holidays, tabs, UI |
| `0.11.1-fork.3` | Full portal contacts CRUD, CalDAV read-only plugin, portal security hardening |
| `0.11.1-fork.4` | Portal events/RRULE, fast bulk import (SQLite tx), import progress %, Add-calendar Import .ics |
| `0.11.1-fork.5` | Secure WebDAV-Push, persistent worker queue, VAPID/Web Push, encrypted subscriptions |
| `1.0.0` | **First independent AngaraDAV release.** SQLite/PostgreSQL only (MySQL removed), `main` default branch, WebDAV auth rate limiting, admin CSP hardening |
| `1.0.1` | Fixed WebDAV-Push registration returning 401 with no `WWW-Authenticate` challenge when DAVACL disables auto-login, blocking client push subscriptions |
| `1.0.2` | Added `gmp` PHP extension and stopped promoting PHP notices/deprecations to fatal exceptions, fixing WebDAV-Push delivery failing on servers without GMP/BCMath |
| `1.0.3` | Log the underlying failure reason when a push delivery gets no HTTP response (`status: null`), to diagnose connection/DNS/TLS failures to the push service |
| `1.0.4` | Fixed push delivery pinning to an unreachable IPv6 address on hosts with broken/absent IPv6 routing (`connectionPin()` now prefers IPv4) |
| `1.0.5` | Portal **Files** tab for private WebDAV homes (browse/upload/download/rename/delete), tab persistence, user menu + Admin role Administration section |
| `1.0.6` | Files tab: copy + multi-select bulk actions, full-width layout, upload create fix; CI apt install hardening for PHP 8.5 runners |
| `1.0.7` | Admin **Maximum WebDAV file size** field now entered in MB instead of raw bytes (storage/env var `BAIKAL_FILES_MAX_UPLOAD_BYTES` unchanged, still bytes); documented that it is independent of the nginx/PHP upload ceilings |
| `1.0.8` | Unified the Maximum WebDAV file size setting on a single MB standard end to end: `baikal.yaml`'s `files_max_upload_mb` and `BAIKAL_FILES_MAX_UPLOAD_MB` now store MB directly (previously bytes), matching the admin UI; the old byte-based key/env var still work as a one-time upgrade fallback |
| `1.0.9` | Extended the MB standard to the WebDAV per-user quota setting: `files_quota_mb` / `BAIKAL_FILES_QUOTA_MB` replace the byte-based `files_quota_bytes` / `BAIKAL_FILES_QUOTA_BYTES` (old key/env var still work as a one-time upgrade fallback; `0` still means unlimited) |
| `1.0.10` | Files tab: bulk delete modal, copy/move destination modals, header select alignment, remove Clear selection; show max upload/quota in MB from app settings |
| `2.0.0` | **Portal Administration**: `/api/admin/*` + SPA shell (users, settings, DB with CONFIRM, install at `/portal/install/`); classic Formal `/admin/` UI removed (redirects to portal) |
| `2.0.1` | WebDAV-Push fan-out for **shared calendars**: content updates notify every calendar instance (owner + sharees) with the correct path/topic so DAVx⁵ on sharee devices wakes without waiting for the poll interval |
| `2.0.2` | Portal upgrade-required login banner + JSON 503 API gate; version base compare and `2.0.x+sha` display (no `git.`); multi-select calendars on the month grid |
| `2.0.3` | Security P1–P3: DB connection test, install password re-prompt, last-Admin delete block, user password rate-limit, Reset-to-Default re-auth; Files Copy/Move folder tree; same-folder-only ` (copy)` naming |
| `2.1.0` | **Mainline 2.1:** portal Administration cutover on `main`; Files Copy/Move destination **folder tree**; cross-folder copy keeps original filename; export download fix; calendar Owned empty-hint + list Export; CI skips for classic Formal admin browser tests |
| `2.1.1` | Files: single **Upload** (files, folders, or mix via drop/browse; nested trees), **upload progress** dialog, folder item-count status bar; fix files list scroll jump on multi-select; cold login after session timeout no longer shows timeout banner |
| `2.1.2` | Files: **Upload ▾** menu (Files… / Folder…), drop files/folders/mix on the panel (no upload modal), File System Access API with Safari/Firefox classic-input fallbacks; nested trees + progress unchanged |
| `2.2.0` | Portal SPA modularization (`portal/src/app/*` domains + thin orchestrator); same user-visible Files/Admin/CalDAV/CardDAV behavior as 2.1.2 |
| `2.2.1` | Portal `onAction` domain routers; multi-user calendar share href fix; Files drop merge + Skip existing; themed delete confirms; DT picker outside-click; anonymous `/api/me` 200 |
| `2.2.2` | Portal delegated event listeners; list keyboard nav; tabs gated by DAV services; calendar multi-select + Escape/modal polish |
| `2.2.3` | Portal remembers selected calendars across sessions (localStorage per user) |
| `2.3.0` | Portal Files **View**; PHP API split (calendar/contact/item routes + services); SPA overlay slot so previews survive tab re-renders; contact list/save fixes |
| `2.3.1` | Portal footer **About** dialog (logo, version, build, contact); local Docker compose/Makefile DX; Files selection size; calendar view persist |
| `2.3.2` | User settings (theme, workday hours, ISO week numbers); week-view create-from-slot; Files-style selection toolbars for Contacts/Tasks/Notes |
| `2.3.3` | Notes CalDAV interop with jtx Board: Markdown in DESCRIPTION, HTML in X-ALT-DESC |

Image tags: `latest`, `2.3.3`, `sha-…`.

Quick start (Docker)
--------------------

GHCR image (named volumes):

```bash
docker pull ghcr.io/offsyanka99/angaradav:latest
docker run -d --name angaradav -p 8080:80 \
  -v angaradav-config:/var/www/baikal/config \
  -v angaradav-data:/var/www/baikal/Specific \
  ghcr.io/offsyanka99/angaradav:latest
```

Then open http://127.0.0.1:8080/portal/install/

### Local image from this repo

`--name` (container) is independent of the image tag. This tree uses
**container** `angaradav-local` and **image** `angaradav:local` so
`docker rm angaradav` does not delete your dev container.

```bash
make local-up
# or: docker compose -f docs/local.compose.yaml up --build
```

Ubuntu’s `docker.io` package does not include the Compose v2 plugin
(`docker compose` then errors on `-f`). `make local-up` falls back to
`docker build` + `docker run`. To use the compose file directly:

```bash
sudo apt install docker-compose-v2
docker compose version
```

Portal: http://127.0.0.1:31088/portal/ · installer: http://127.0.0.1:31088/portal/install/

Leave `BAIKAL_SKIP_CHOWN` unset locally so the entrypoint can chown bind
dirs Docker created as root. If you set `BAIKAL_SKIP_CHOWN=1` without
`chown -R 101:101 .local-run`, the container **exits** (PHP cannot write
`baikal.yaml`). Changing `docker/nginx.conf` requires a **recreate** from
a new image (`up --build --force-recreate`), not `docker compose restart`.

Do not run `npm install` / `docker build` as root in `portal/` — a
root-owned `portal/node_modules` blocks Vite’s cache (EACCES on
`node_modules/.vite-temp`). `sudo chown -R "$USER:$USER" portal/node_modules`
if that already happened.

TrueNAS SCALE
-------------

Use [`docs/truenas-scale.compose.yaml`](docs/truenas-scale.compose.yaml)  
(Apps → Custom App → Install via YAML). Full notes: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

Endpoints
---------

| Path | Use |
|------|-----|
| `/portal/` | **User portal** — calendars, contacts, tasks, notes, files; **Administration** for Admin-role users |
| `/dav.php/` | CalDAV + CardDAV (clients + classic WebDAV browser) |
| `/dav.php/files/{username}/` | Private generic WebDAV file home (when enabled) |
| `/portal/install/` | Installer / upgrade SPA |
| `/api/` | Portal JSON API (session cookie; `/api/admin/*` is Admin-role only) |
| `/health.php` | Liveness JSON |
| `/info.php` | Public status JSON |

User portal
-----------

1. Complete **`/portal/install/`** (creates portal user `admin`) or create DAV users under **Administration → Users**.
2. Open **`/portal/`**, sign in with **DAV** credentials.
3. **Calendar:** owned list, month view, create/edit events (repeat rules), Edit modal (details, share, import/export `.ics`).
4. **Contacts:** address books, contact search/CRUD, photos, birthday/special dates, custom fields, import/export `.vcf`.
5. **Tasks** / **Notes:** manage `VTODO` / `VJOURNAL` on your calendars.
6. **Files:** browse your private WebDAV file home (when **Enable WebDAV file storage** is on). Upload files or whole folders with a progress dialog. Desktop clients still use `/dav.php/files/{username}/`.
7. **Administration** (Admin role only — user menu): Overview, Users, System settings; Database is read-only in the portal. Classic `/admin/` remains available in parallel.

**Portal Admin role:** env `PORTAL_ADMIN_USERS` / `BAIKAL_PORTAL_ADMIN_USERS`, or YAML `system.portal_admin_users`; if unset, DAV user `admin` is Admin. Details and portal-vs-classic matrix: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md#portal-administration-parallel-with-classic-admin).

![User portal — Calendar](docs/images/portal-my-calendars.jpg)

![User portal — Contacts](docs/images/portal-my-contacts.jpg)

![User portal — Tasks](docs/images/portal-tasks.jpg)

![User portal — Notes](docs/images/portal-notes.jpg)

More detail: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md#user-portal).  
`/dav.php/` remains available as the original sabre browser (and for all CalDAV/CardDAV clients).

Generic WebDAV file storage
---------------------------

Private per-user file homes are available at
`https://host/dav.php/files/{username}/`. The feature is disabled by default;
enable **WebDAV file storage** under Admin settings and use DAV user
credentials. HTTPS is strongly recommended.

Files are streamed to same-filesystem temporary storage and atomically
installed after size/quota checks. Homes are isolated by protected ACLs and
physical storage uses non-reusable random identifiers. Deleting a user revokes
and quarantines that home so recreating the username cannot expose old files.

The initial scope is a standards-compliant private drive. It does not include
file sharing, public links, trash/version history, RFC 6578 file Sync, or
WebDAV-Push for files. Configuration, Docker limits, external volume setup,
maintenance, and backup guidance are in
[`docs/DEPLOYMENT.md#generic-webdav-file-storage`](docs/DEPLOYMENT.md#generic-webdav-file-storage).

### Android (WebDAV files)

For phones and tablets, use **[WebDAV-sync](https://github.com/offsyanka99/WebDAV-sync)** —
an Android app that syncs local folders with a WebDAV server. Point it at your
AngaraDAV file home:

```text
https://host/dav.php/files/USERNAME/
```

Use the same **DAV username and password** as desktop clients (not the portal-only
admin password unless that account is also a DAV user). Prefer HTTPS. Details:
[WebDAV-sync on GitHub](https://github.com/offsyanka99/WebDAV-sync).

WebDAV-Push
-----------

AngaraDAV can advertise and deliver the experimental
[`draft-bitfire-webdav-push-00`](https://bitfireat.github.io/webdav-push/draft-bitfire-webdav-push-00.html)
protocol for near-real-time calendar/address-book synchronization. It is disabled by default.

1. Configure the canonical client-reachable HTTPS DAV base URL, for example
   `system.push_external_url: 'https://dav.example.com/dav.php/'`.
2. Set `system.push_enabled: true` (or use **Admin -> AngaraDAV Settings**).
3. Recreate/restart the Docker container so its bounded Push worker is running.

Push is not advertised when the canonical URL or secure storage configuration is invalid. The Docker image supervises the worker automatically; source installations must supervise `php scripts/push-worker.php`. Back up `config/` and `Specific/` together because subscription encryption uses `database.encryption_key` and the VAPID identity is stored in `Specific/push_vapid.json`.

The implementation follows an experimental draft. Keep normal CalDAV/CardDAV polling enabled at a reduced frequency; Push is a synchronization accelerator, not a replacement for WebDAV-Sync.

Configuration, allowlists, quotas, non-Docker worker setup, and troubleshooting:
[`docs/DEPLOYMENT.md#webdav-push`](docs/DEPLOYMENT.md#webdav-push).
For a LAN-only AngaraDAV host, see the [local network example](docs/DEPLOYMENT.md#local-network-example).


Changelog
---------

### Unreleased

- Optional private generic WebDAV file homes under `/dav.php/files/{username}/`
- Owner-only ACLs, persistent class-2 locks/dead properties, quotas, range reads, atomic streamed writes, and safe copy/move/delete
- Non-reusable physical home IDs with deleted-account quarantine and bounded maintenance CLI
- Docker streaming upload route, configurable nginx/app limits, storage readiness diagnostics, and Windows-checkout symlink normalization
- Automated two-user HTTP coverage and 104/104 WebDAV Litmus compliance checks
- CalDAV read-only calendars now advertise read-only DAV ACLs, preventing clients such as DAVx5 from treating protected holiday calendars as writable
- Expected DAV client responses (`401`, read-only `403`, lock/precondition `4xx`) remain in access logs without generating misleading PHP/FastCGI error stacks

### 0.11.1-fork.5

- WebDAV-Push service discovery, subscription registration/removal, content/property update notifications, Web Push encryption, and VAPID support
- Persistent deduplicating Push queue with bounded retries and a supervised unprivileged Docker worker
- Push hardening: DAV ACL checks, public-HTTPS endpoint validation with DNS pinning, request/key validation, quotas, opaque registration tokens, encrypted subscription secrets, and sanitized rotating logs
- Automatic `push_subscriptions` / `push_queue` provisioning for existing SQLite and PostgreSQL installations

### 0.11.1-fork.4

- Calendar **event CRUD** from the month grid (create / edit / delete VEVENT), including **RRULE** (daily/weekly/monthly/yearly, until/count, by-day)
- **Single-contact export** `.vcf` from the contact editor; address-book delete uses a checkbox confirmation modal (same pattern as calendars)
- Contact **birthday** and **special date** fields; Calendar details modal order: Share then Import/export
- Tasks bulk bar: green apply icons, Delete / Clear selection on a second row
- Portal UI prefs: `portal_time_format` / `portal_week_start` in `baikal.yaml` (or `TIME_FORMAT` / `BAIKAL_PORTAL_*` env)
- Portal debug logging: `portal_log_level` / `PORTAL_LOG_LEVEL` (`off`|`error`|`warn`|`info`|`debug`) — browser console + `Specific/portal_debug.log` (does not spam nginx as `[error]`)
- **Import progress modal** for large `.ics` / `.vcf` (live %, elapsed time, success/failure result)
- **Fast imports:** chunked SQLite transactions (commit every 200 objects) — e.g. ~2.7k events in ~2s on TrueNAS vs ~6 min before
- **Add calendar → Import .ics** creates a calendar and imports in one flow
- Nginx `/api` FastCGI timeouts 900s + NDJSON progress stream
- TrueNAS: `BAIKAL_SKIP_CHOWN` + entrypoint only chowns data mounts (avoids hang on full-tree `chown`)

**Bug fixes (0.11.1-fork.4):**

- **Shared calendars** under “Shared with me” can be **selected** to view events (read-only and full access); previously they appeared but were not clickable
- Full-access shares can open the month grid and edit events; read-only shares open the grid for viewing only
- Large **import** no longer dies immediately (`ob_flush` with no buffer) or at **5 minutes** (nginx FastCGI timeout raised to 900s)
- Import progress stream no longer floods docker/nginx as fake `[error]` lines (server traces → `Specific/portal_debug.log`)
- TrueNAS startup hang on recursive **chown** mitigated (`BAIKAL_SKIP_CHOWN` + chown only data mounts)
- Slow bulk import on NAS SQLite fixed via chunked transactions (~minutes → ~seconds for multi-thousand event calendars)
- After import, drop the **duplicate result banner** under Import/export in address-book and calendar details modals (progress dialog + top flash only)
- **Session idle timeout** clears the portal UI and returns to the **Sign in** screen (no leftover calendars/contacts in the DOM); if the session expires while the app is open, a “session timed out” message is shown — a cold reopen of the login page after an expired cookie stays silent; client idle timer follows `session_max_age_minutes`
- Portal SPA shell (`/portal/`) is **not cached** so rebuilds pick up new hashed JS; hashed `/portal/assets/*` are long-cached

### 0.11.1-fork.3

- Portal **My Contacts**: address book create/rename/delete; contact list (table), search, create/edit/delete
- Multi email/phone, structured address, photos (vCard 3.0 JPEG), Unicode custom fields (`X-BAIKAL-CUSTOM`)
- **ReadOnlyPlugin**: portal read-only calendars enforced on CalDAV (`PUT`/`DELETE`/… → 403)
- Portal security: login rate limit, session idle timeout, CSRF + same-origin, import quotas, UTF-8-safe API JSON
- Docker: `php8.2-gd`, CSP headers; production portal builds without source maps
- Calendar month grid, Edit/Delete + details/share modal; Tasks/Notes tabs; bulk task actions
- Docs: updated Calendar, Tasks, Notes screenshots and deployment notes

### 0.11.1-fork.2

- Portal tabs: **My Calendars** / **My Contacts**
- Calendar import/export (`.ics`), including large Thunderbird exports (timeouts raised)
- Holidays calendar option (country picker, Nager.Date) + read-only flag
- Contacts import/export (`.vcf`)
- Info **(i)** modals for section help; left column layout / badge overlap fixes
- Import result messages in the UI

### 0.11.1-fork.1

- User portal at `/portal/` (bookmarks-sync style UI) + `/api/` session API
- Calendar create/edit: display name, color, description
- Calendar sharing with other AngaraDAV users (read / full access)
- Dual-format `calendar-timezone` for Home Assistant expand queries
- Docker/GHCR multi-arch, TrueNAS compose, health/info endpoints
- Admin hardening and Tasks/Notes system flags

Credits
-------

AngaraDAV is derived from Baïkal, created by [Jérôme Schneider](https://github.com/jeromeschneider) from Net Gusto and [fruux](https://fruux.com/) and maintained upstream by volunteers. AngaraDAV preserves the original GPL license and copyright notices while developing its expanded DAV platform independently.
