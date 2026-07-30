AngaraDAV
=========

[![continuous-integration](https://github.com/offsyanka99/AngaraDAV/actions/workflows/ci.yml/badge.svg)](https://github.com/offsyanka99/AngaraDAV/actions/workflows/ci.yml)
[![docker](https://github.com/offsyanka99/AngaraDAV/actions/workflows/docker.yml/badge.svg)](https://github.com/offsyanka99/AngaraDAV/actions/workflows/docker.yml)

AngaraDAV is a self-hosted calendar, contacts, tasks, notes, and WebDAV file server powered by SabreDAV. It is derived from [Baïkal](https://sabre.io/baikal/) **0.11.1** and now has an independent product identity and release path.

**Compatibility version:** `0.11.1-fork.5` while the first independent AngaraDAV release is prepared.
**Docs:** [docs/](docs/) · [Deployment](docs/DEPLOYMENT.md) · [Migration](docs/MIGRATION_FROM_BAIKAL.md) · [TrueNAS compose](docs/truenas-scale.compose.yaml)

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
  - **Tasks** / **Notes** tabs: CalDAV `VTODO` / `VJOURNAL` (bulk actions on tasks)
  - Fast portal imports via **chunked SQLite transactions** (large Thunderbird calendars in seconds on NAS)
  - Info **(i)** modals; optional 12h/24h, week-start, and portal debug log level prefs
- `/dav.php/` kept as classic browser and combined CalDAV/CardDAV/WebDAV endpoint

Upstream ancestry: [sabre-io/Baikal](https://github.com/sabre-io/Baikal).

Upstream Baïkal docs: [sabre.io/baikal](https://sabre.io/baikal/).

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

Image tags: `latest`, `0.11.1-fork.5`, `sha-…`.

Quick start (Docker)
--------------------

```bash
docker pull ghcr.io/offsyanka99/angaradav:latest
docker run -d --name angaradav -p 8080:80 \
  -v angaradav-config:/var/www/baikal/config \
  -v angaradav-data:/var/www/baikal/Specific \
  ghcr.io/offsyanka99/angaradav:latest
```

Then open http://127.0.0.1:8080/ and run the installer.

TrueNAS SCALE
-------------

Use [`docs/truenas-scale.compose.yaml`](docs/truenas-scale.compose.yaml)  
(Apps → Custom App → Install via YAML). Full notes: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

Endpoints
---------

| Path | Use |
|------|-----|
| `/portal/` | **User portal** — calendars, contacts, tasks, notes |
| `/dav.php/` | CalDAV + CardDAV (clients + classic WebDAV browser) |
| `/dav.php/files/{username}/` | Private generic WebDAV file home (when enabled) |
| `/admin/` | Web admin |
| `/api/` | Portal JSON API (session cookie) |
| `/health.php` | Liveness JSON |
| `/info.php` | Public status JSON |

User portal
-----------

1. Admin creates DAV users under `/admin/`.
2. Open **`/portal/`**, sign in with **DAV** credentials.
3. **Calendar:** owned list, month view, create/edit events (repeat rules), Edit modal (details, share, import/export `.ics`).
4. **Contacts:** address books, contact search/CRUD, photos, birthday/special dates, custom fields, import/export `.vcf`.
5. **Tasks** / **Notes:** manage `VTODO` / `VJOURNAL` on your calendars.

![User portal — Calendar](docs/images/portal-my-calendars.jpg)

![User portal — Contacts](docs/images/portal-my-contacts.jpg)

![User portal — Tasks](docs/images/portal-tasks.jpg)

![User portal — Notes](docs/images/portal-notes.jpg)

More detail: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md#user-portal).  
`/dav.php/` remains available as the original sabre browser (and for all CalDAV/CardDAV clients).

Home Assistant
--------------

Point the CalDAV integration at `http(s)://host/dav.php/` (or `/cal.php/`).
AngaraDAV accepts Baïkal's plain calendar timezone ids on expand queries, so
you do **not** need ckulka’s `APPLY_HOME_ASSISTANT_FIX` env var. Details:
[`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md#home-assistant--calendar-timezone).

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

Upgrading from Baïkal
---------------------

Follow [upstream upgrade instructions](https://sabre.io/baikal/upgrade/).  
Admin passwords using the old SHA-256 scheme are upgraded automatically on next successful login.

After `composer install` / `composer update`, vendor patches (including the
calendar-timezone fix) are applied automatically via
[`scripts/apply-vendor-patches.sh`](scripts/apply-vendor-patches.sh).

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
- Automatic `push_subscriptions` / `push_queue` provisioning for existing SQLite, MySQL, and PostgreSQL installations

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
- **Session idle timeout** clears the portal UI and returns to the **Sign in** screen with a “session timed out” message (no leftover calendars/contacts in the DOM); client idle timer follows `session_max_age_minutes`
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
