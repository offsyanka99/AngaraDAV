# AngaraDAV deployment guide

**Compatibility version:** `1.0.0` (derived from Baïkal 0.11.1)

AngaraDAV packages a self-hosted calendar, contacts, tasks, notes, and file server for Docker and TrueNAS SCALE. It is derived from [Baïkal](https://sabre.io/baikal/) and powered by SabreDAV.

## Images

| Image | When |
|-------|------|
| `ghcr.io/offsyanka99/angaradav:latest` | Default tracking `main` (GitHub Actions) |
| `ghcr.io/offsyanka99/angaradav:2.2.3` | Product release pin |
| `ghcr.io/offsyanka99/angaradav:sha-…` | Pin to a tested git SHA |
| Build from `Dockerfile` | Dev / offline packaging |

Multi-arch: `linux/amd64`, `linux/arm64`.

## TrueNAS SCALE

See [`truenas-scale.compose.yaml`](truenas-scale.compose.yaml) for the SQLite variant, or
[`truenas-scale-postgres.compose.yaml`](truenas-scale-postgres.compose.yaml) to bundle a
PostgreSQL 18 container instead. AngaraDAV supports only **SQLite** and **PostgreSQL**
backends — MySQL is not supported.

1. Create dataset dirs and `chown -R 101:101` (nginx UID in the image).
2. Install via Custom App YAML. Prefer **`image: …:latest`** (or a pinned tag) — pull only; do not use the `build:` block on the NAS.
3. Set **`BAIKAL_SKIP_CHOWN=1`** after host `chown 101:101` so startup does not re-chown mounts (avoids hanging on `40-fix-baikal-file-permissions.sh`).
4. Complete the web installer once.
5. Put **HTTPS** in front (TrueNAS proxy, Caddy, Traefik). Do not expose plain HTTP to the internet.
6. After install, ensure `Specific/INSTALL_DISABLED` exists, or set env **`BAIKAL_LOCK_INSTALL=1`** so the installer cannot reopen if the marker is deleted.

### Stuck on `40-fix-baikal-file-permissions.sh`?

The entrypoint was doing a recursive `chown` that can take a very long time on TrueNAS bind mounts. Current images only chown `config/` + `Specific/`, and log start/done. If it still hangs:

```bash
# On the NAS host (adjust path):
chown -R 101:101 /mnt/tank/apps/angaradav
```

Then in compose:

```yaml
environment:
  BAIKAL_SKIP_CHOWN: "1"
```

Redeploy / recreate the container (not only restart).

### Volumes to back up

| Mount | Contents |
|-------|----------|
| `/var/www/baikal/config` | `baikal.yaml` (admin password hash, DAV feature flags, auth, file limits) |
| `/var/www/baikal/Specific` | SQLite DB, private WebDAV file homes/quarantine, `INSTALL_DISABLED`, rate-limit state, portal metadata, WebDAV-Push VAPID identity |

### Settings reset after restart (TrueNAS / Docker)

All admin system settings live in **`config/baikal.yaml`**. The SQLite database and install lock live under **`Specific/`**. Nothing else stores them.

If settings (or the whole install) return to defaults after a container restart/recreate, the host paths are almost never actually persisting. Typical causes:

1. **Host Path volumes not applied** — TrueNAS Custom App fell back to anonymous Docker volumes. Data survives a simple process restart of the *same* container id, but is lost when the app is edited/upgraded/recreated.
2. **Wrong host directories** — compose still points at an empty or different path than the dataset you inspect.
3. **Ownership** — with `BAIKAL_SKIP_CHOWN=1`, the host dirs must be `chown -R 101:101`. If PHP cannot write, the UI now surfaces an error instead of a silent fake “saved”.

**Verify on the NAS after install / after saving settings:**

```bash
# Host dataset must contain the live config (not empty)
ls -la /mnt/tank/apps/angaradav/config/
# expect: baikal.yaml (and usually .htaccess)

ls -la /mnt/tank/apps/angaradav/Specific/
# expect: INSTALL_DISABLED, db/db.sqlite (SQLite installs)

# Confirm the running container's mounts
docker inspect angaradav --format '{{range .Mounts}}{{.Source}} -> {{.Destination}} ({{.Type}}){{println}}{{end}}'
# Destination paths must be host binds, e.g.:
#   /mnt/tank/apps/angaradav/config -> /var/www/baikal/config (bind)
#   /mnt/tank/apps/angaradav/Specific -> /var/www/baikal/Specific (bind)
```

**Health check fields** (`/health.php`):

| Field | Healthy value |
|-------|----------------|
| `configured` | `true` after install |
| `configWritable` / `specificWritable` | `true` |
| `configMount.bindLikely` / `specificMount.bindLikely` | `true` (host bind, not anonymous volume) |
| `persistenceWarning` | `null` |
| `installLocked` | `true` after wizard finishes |

If `bindLikely` is `false` or `persistenceWarning` is set, fix the Custom App **Host Path** volumes and reinstall/migrate data before treating the app as production.

Entrypoint also logs mount warnings at container start (`25-check-baikal-persistence.sh`).

## Endpoints

| Path | Purpose |
|------|---------|
| `/portal/` | **User portal** (calendars, contacts, tasks, notes, files; DAV user login) |
| `/api/` | Portal JSON API (session cookie; same origin as SPA) |
| `/health.php` | Liveness JSON (`status`, `version` with `+git.<sha>`, `git`, install lock, mount hints) |
| `/info.php` | Public feature flags (no secrets); same `version` / `git` fields |
| `/dav.php/` | Combined CalDAV + CardDAV + generic WebDAV + classic browser UI |
| `/dav.php/files/{username}/` | Private generic WebDAV file home (when enabled) |
| `/portal/` → **Files** tab | Browser UI for the same private WebDAV home (list/upload files or folders with progress/download/rename/delete) |
| `/cal.php/` | CalDAV only |
| `/card.php/` | CardDAV only |
| `/portal/install/` | Installer / upgrade SPA |
| `/portal/` → **Administration** | Day-to-day admin (Admin-role DAV users): Overview, System settings, Users, Database |

## User portal

Modern UI (TypeScript SPA) for **end users** and, for designated operators, **administration**.  
Tabs: **Calendar** · **Contacts** · **Tasks** · **Notes** · **Files**. Section help is under **(i)** icons. Operators with the **Admin role** also get **Administration** (Overview · System settings · Users · Database).

| Step | Action |
|------|--------|
| 1 | Open `http://NAS-IP:31088/portal/` (first boot: `/portal/install/`) |
| 2 | Sign in with a **DAV user** (install creates `admin`; more users under Administration → Users) |
| 3 | **Calendar:** owned list (Edit / Delete), month grid with create/edit/delete events (RRULE), holidays/read-only; details, share, import/export `.ics`; **select shared calendars** (read-only or full access) to view/edit events; **Add calendar → Import .ics**; large imports show **live %** (chunked SQLite txs keep NAS imports fast) |
| 4 | **Contacts:** address books (delete confirm), contact search/CRUD, photos, birthday/special dates, custom fields, book + single-contact `.vcf` export (progress dialog with **live %** of cards + result) |
| 5 | **Tasks / Notes:** CalDAV `VTODO` / `VJOURNAL` on writable calendars (bulk actions on tasks) |
| 6 | **Files:** private WebDAV home when enabled (same data as `/dav.php/files/{username}/`); upload files or a whole folder (nested dirs created automatically); progress dialog for large/multi-file uploads; item count under the list |
| 7 | **Administration** (Admin role only): Overview, System settings, Users CRUD, Database (CONFIRM gate on write) |

### Screenshots

**Calendar** — owned calendars (Edit / Delete), badges (owner, read-only, holidays), add form, and month view of the selected calendar’s events:

![User portal — Calendar](images/portal-my-calendars.jpg)

**Calendar details** — edit name/color/description, share with other users, then import/export `.ics` (modal):

![User portal — Calendar details](images/portal-calendar-edit.jpg)

**Contacts** — address books (create/rename/delete), Google-style contact table, search, edit form with photo, import/export `.vcf`:

![User portal — Contacts](images/portal-my-contacts.jpg)

**Tasks** — sortable `VTODO` list (subtasks indented), multi-select bulk status/due/%, create/edit form with parent task:

![User portal — Tasks](images/portal-tasks.jpg)

**Notes** — sortable `VJOURNAL` list with preview, create/edit form (title, date, body) on a writable calendar:

![User portal — Notes](images/portal-notes.jpg)

- Backend: PHP API under `/api/` (session cookie; sabre CalDAV/CardDAV backends).
- Frontend source: [`portal/`](../portal/) (Vite + TypeScript); image build compiles into `html/portal/`.
- Footer **Docs** -> [github.com/offsyanka99/AngaraDAV/tree/main/docs](https://github.com/offsyanka99/AngaraDAV/tree/main/docs).
- **`/dav.php/` remains the combined endpoint** for CalDAV/CardDAV clients, optional private file homes, and the classic browser.
- Portal meta (read-only / holidays flags): `Specific/portal_meta.json` (include in backups).
- **Read-only calendars** are enforced on CalDAV (`/dav.php/`, `/cal.php/`) via `ReadOnlyPlugin` — clients get **403** on write methods, not only a portal import block.
- Contact photos require **PHP GD** (`php8.2-gd` in the Docker image); stored as **vCard 3.0** `PHOTO;ENCODING=b` JPEG (avoids vCard 4 raw-binary corruption).
- Portal sessions: idle timeout from `session_max_age_minutes` (same as admin, default **15** minutes). When the session expires **while the portal is open**, the SPA **clears all in-memory data**, shows the **Sign in** screen, and a banner: *“Your session timed out. Please sign in again.”* (server 401 + client idle timer aligned via `sessionIdleSeconds` from `/api/ui`). Opening the login screen after the browser was closed (or a cold load with an already-expired cookie) shows a clean Sign in form without that banner. Login rate-limited; CSRF + same-origin checks on mutations.
- Optional portal locale helpers in `baikal.yaml` / env (override browser auto-detect):
  - `system.portal_time_format` or `TIME_FORMAT` / `BAIKAL_PORTAL_TIME_FORMAT`: `auto` | `12h` | `24h`
  - `system.portal_week_start` or `BAIKAL_PORTAL_WEEK_START`: `auto` | `monday` | `sunday`
- Portal debug logging (`off` by default; enable while troubleshooting):
  - `system.portal_log_level` or `PORTAL_LOG_LEVEL` / `BAIKAL_PORTAL_LOG_LEVEL`: `off` | `error` | `warn` | `info` | `debug`
  - **Browser:** open DevTools -> Console; messages are prefixed `[angaradav-portal]`
  - **Server:** all portal request tracing → `Specific/portal_debug.log` (never nginx `[error]`)
  - If Docker logs show `FastCGI sent in stderr: "PHP message: AngaraDAV portal: ..."`, request tracing was routed to stderr unexpectedly. Current images write portal traces to `Specific/portal_debug.log`.
  - Public `GET /api/ui` returns prefs (including log level and `sessionIdleSeconds`) without a session

### Portal Administration

Primary administration surface for AngaraDAV (same `baikal.yaml` + database):

| Surface | Auth | URL |
|---------|------|-----|
| **Portal Administration** | DAV user session + **Admin role** | `/portal/` → user menu → **Administration** (`#admin`, `#admin/settings`, `#admin/users`, `#admin/database`) |
| **Installer / upgrade** | Unauthenticated bootstrap SPA | `/portal/install/` |

#### How the portal Admin role is granted

1. **Env (highest priority):** `PORTAL_ADMIN_USERS` or `BAIKAL_PORTAL_ADMIN_USERS` — comma- or space-separated **DAV usernames**.
2. **YAML:** `system.portal_admin_users` — list or comma-separated string in `baikal.yaml`.
3. **Default if neither is set:** DAV user named **`admin`** (case-insensitive).

**Install note:** `/portal/install/` creates DAV user `admin` with the password you choose, and sets YAML `portal_admin_users: admin` when env is unset. If you set `PORTAL_ADMIN_USERS` to another name (e.g. `yurik`), user `admin` can still log into the portal but will **not** see Administration until the env list includes `admin` (or you clear the env).

Examples:

```yaml
# config/baikal.yaml
system:
  portal_admin_users: "alice, bob"   # or YAML list: [alice, bob]
  portal_admin_ui_enabled: true      # false hides in-portal shell; APIs still exist
```

```yaml
# compose / TrueNAS environment
PORTAL_ADMIN_USERS: "alice,bob"
# BAIKAL_PORTAL_ADMIN_USERS: "alice"   # alias
```

- Env **overrides** YAML.
- Every `/api/admin/*` call requires a portal session **and** Admin role (anonymous → **401**, non-admin → **403**). Hiding the menu is not enough; the API enforces the role.
- `system.portal_admin_ui_enabled` (default **true**): set `false` to hide the Administration UI in the SPA. Routes under `/api/admin/*` remain; capability map is still `GET /api/admin/capabilities` (`portalAdminUrl` + per-page `portalUrl`).

#### Feature matrix

| Capability | Portal Administration |
|------------|----------------------|
| Dashboard / Overview stats | Yes |
| Users list / create / edit / delete | Yes (full CRUD; digesta1 never returned) |
| Per-user calendars & address books | Yes (under Users → user detail) |
| System settings (`baikal.yaml` system) | Yes (services, files, push, session, admin password) |
| Database settings (backend, credentials) | Yes (password never shown; write requires typing **CONFIRM**) |
| Installer / version upgrade | Yes (`/portal/install/` + `/api/install/*`) |
| Reset to Default | Yes (full wipe → `/portal/install/`; backs up `baikal.yaml` only — snapshot volumes first) |

**Passwords:** Portal login always uses **DAV** credentials. The **server admin password** in System settings is the `baikal.yaml` hash used at install/recovery — distinct from other users’ DAV passwords (install reuses one password for both the server hash and the DAV user `admin`).

Security review notes: [`portal-admin-security-checklist.md`](portal-admin-security-checklist.md). Program scope: [`portal-admin-integration-scope.txt`](portal-admin-integration-scope.txt). Installer details: [`portal-admin-installer-phase10.md`](portal-admin-installer-phase10.md).

#### Admin audit log

Mutations under `/api/admin/*` append to **`Specific/portal_debug.log`** (never nginx/docker error streams):

| Result | Log level required | Line tag |
|--------|--------------------|----------|
| Success (`result=ok`) | `info` or `debug` | `[INFO]` |
| Failure (`result=error:…`) | **`warn`**, `info`, or `debug` | `[WARN]` |

```text
admin audit actor={user} action={verb} target={id} result={ok|error:…} [keys=…|msg=…]
```

Examples:

```text
[INFO] AngaraDAV portal: admin audit actor=alice action=update-system-settings target=system result=ok keys=files_enabled,session_max_age_minutes
[WARN] AngaraDAV portal: admin audit actor=alice action=update-system-settings target=system result=error:503 msg=Config_file_is_not_writable
[WARN] AngaraDAV portal: admin settings save failed user=alice status=503 error=Config file is not writable
```

Passwords and hashes are never logged. Grep:

```bash
# Host bind of Specific/ or docker exec:
grep 'admin audit' /path/to/Specific/portal_debug.log
grep 'admin settings save' /path/to/Specific/portal_debug.log
docker exec angaradav tail -n 50 /var/www/baikal/Specific/portal_debug.log
```

#### Observability: diagnose a failed portal settings save

1. **UI message** — portal flashes the API `error` string (e.g. “Config file is not writable”).
2. **Enable logging temporarily** — set `PORTAL_LOG_LEVEL=warn` (failures only) or `info` (success + failures) in compose / `system.portal_log_level`, recreate or wait for next request.
3. **Read `Specific/portal_debug.log`** — look for `update-system-settings` or `admin settings save failed` (see samples above). HTTP status is in `result=error:NNN` / `status=`.
4. **Check mounts (unchanged public endpoints)** — `curl -sS http://host/health.php` still reports only liveness fields (`status`, `configWritable`, `specificWritable`, mount hints). **Do not** expect admin audit data on `/health.php` or `/info.php` (no secrets, schema unchanged).
5. **Common causes**
   - `configWritable: false` / 503 “not writable” → host path ownership (uid **101**), or config not a real bind mount
   - 400 with field name → validation (push URL must be HTTPS, bad timezone, forbidden mass-assignment keys)
   - 429 on admin password change → rate limit (`Specific/portal_admin_password_rate.json`)
   - 403 on `/api/admin/*` → user lacks portal Admin role (`PORTAL_ADMIN_USERS` / `portal_admin_users`)
6. **Turn logging back to `off`** after troubleshooting.

`/health.php` and `/info.php` remain **unchanged** for orchestrators: no new required fields, no admin-session data.

- Large calendar/contact **import**: progress streams as NDJSON; nginx `/api` allows **900s** FastCGI read. Writes use **chunked SQLite transactions** (every 200 objects) so bulk imports on TrueNAS/ZFS finish in seconds rather than minutes. **Add calendar → Import .ics** creates a calendar and imports in one step.
- Portal static caching (nginx): `/portal/` HTML shell is `no-cache` so new image builds pick up hashed JS; `/portal/assets/*` may be cached long-term (content-hashed filenames).

### API (summary)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/ui` | Public portal prefs (`timeFormat`, `weekStart`, `logLevel`, `sessionIdleSeconds`) |
| POST | `/api/login` | DAV user session (+ `ui` prefs; profile includes `isAdmin` / `role`) |
| GET | `/api/me` | Session profile + `ui` prefs (`isAdmin` / `role`) |
| GET | `/api/admin/ping` | Admin authz smoke check → `{ ok: true, user }` (Admin only) |
| GET | `/api/admin/dashboard` | Read-only dashboard stats → `{ data: { users, calendars, events, addressBooks, contacts, nbusers…, services, links } }` (Admin only) |
| GET | `/api/admin/capabilities` | Admin UI feature matrix → `{ data: { uiEnabled, portalAdminUrl, pages[] } }` (Admin only; pages use `portalUrl`) |
| GET | `/api/admin/users` | List DAV users → `{ users: [{ username, displayname, email, principal }] }` (Admin only; no digesta1) |
| POST | `/api/admin/users` | Create user (Admin + CSRF); seeds default calendar + address book |
| GET | `/api/admin/users/{username}` | User detail + resource counts (Admin only; **404** if missing) |
| PATCH | `/api/admin/users/{username}` | Update displayname/email/password (Admin + CSRF; empty password = leave unchanged) |
| DELETE | `/api/admin/users/{username}` | Delete user (Admin + CSRF; requires `confirm: true`; file home quarantine when model path available) |
| GET/POST | `/api/admin/users/{u}/calendars` | List / create calendars for user `u` (Admin) |
| GET/PATCH/DELETE | `/api/admin/users/{u}/calendars/{id}` | Get / update / delete calendar instance (DELETE needs `confirm`) |
| GET/POST | `/api/admin/users/{u}/addressbooks` | List / create address books |
| GET/PATCH/DELETE | `/api/admin/users/{u}/addressbooks/{id}` | Get / update / delete (`force` for non-empty) |
| GET/PATCH | `/api/admin/settings/system` | Read / update system settings (never returns password hash; use `admin_password` + confirm to change) |
| GET/PATCH | `/api/admin/settings/database` | DB summary / update (never password; PATCH requires `confirm: "CONFIRM"`) |
| GET | `/api/calendars` | List calendars |
| POST | `/api/calendars` | Create (`displayname`, `color?`, `description?`, `holidays?`, `holidayCountry?`, `readOnly?`) |
| PATCH | `/api/calendars/{id}` | Update name / color / description |
| GET | `/api/calendars/{id}/export` | Download `.ics` |
| POST | `/api/calendars/{id}/import` | Import `.ics` body `{ics}` |
| GET | `/api/calendars/{id}/events` | List events (`?from=&to=`) |
| POST | `/api/calendars/{id}/events` | Create VEVENT |
| GET/PATCH/DELETE | `/api/calendars/{id}/events/{uri}` | Get / update / delete VEVENT |
| POST/DELETE | `/api/calendars/{id}/shares` | Share / revoke |
| GET | `/api/addressbooks` | List address books |
| POST | `/api/addressbooks` | Create address book |
| PATCH | `/api/addressbooks/{id}` | Rename / description |
| DELETE | `/api/addressbooks/{id}` | Delete (`force` if non-empty) |
| GET | `/api/addressbooks/{id}/export` | Download `.vcf` |
| POST | `/api/addressbooks/{id}/import` | Import `.vcf` body `{vcf}` |
| GET | `/api/addressbooks/{id}/contacts` | List/search contacts (`?q=`) |
| POST | `/api/addressbooks/{id}/contacts` | Create contact |
| GET/PATCH/DELETE | `/api/addressbooks/{id}/contacts/{uri}` | Get / update / delete contact |
| GET | `/api/addressbooks/{id}/contacts/{uri}/export` | Download single contact `.vcf` |
| GET | `/api/addressbooks/{id}/contacts/{uri}/photo` | Contact photo JPEG |
| GET | `/api/holidays/countries` | Country list for holidays calendars |

See [`portal/README.md`](../portal/README.md).

Local SPA rebuild after UI edits:

```bash
cd portal && npm install && npm run build
# outputs to html/portal/
```

## Home Assistant / calendar-timezone

The inherited Baïkal schema stores each calendar's timezone as a **plain Olson id** (e.g. `America/Toronto`).
Stock sabre/dav expects a full iCalendar `VCALENDAR`/`VTIMEZONE` blob when clients
request `calendar-query` with `<C:expand/>` (Home Assistant does this). That
mismatch produced HTTP 500 / `ParseException` ([sabre-io/dav#1318](https://github.com/sabre-io/dav/issues/1318)).

AngaraDAV always applies a **dual-format** resolver after `composer install` (and
in the Docker image build): plain ids and RFC 4791 VTIMEZONE blobs both work.
No env flag required (unlike `ckulka/baikal`’s `APPLY_HOME_ASSISTANT_FIX`).
See [`patches/README.md`](../patches/README.md).

### Connecting Home Assistant

| Field | Example |
|-------|---------|
| URL | `https://nas.example/dav.php/` or `http://NAS-IP:31088/dav.php/` |
| Username / password | An AngaraDAV **DAV user** (not the admin account) |
| Calendar | Path under that user (HA discovers calendars after auth) |

Prefer **HTTPS** (TrueNAS reverse proxy / Caddy / Traefik) when HA and AngaraDAV
are not on a trusted LAN-only path. Digest auth is fine on LAN; for internet
exposure use TLS and consider Basic over HTTPS (see auth notes below).

## Authentication

### Portal Administration auth

Day-to-day admin and install use the **portal** ([Portal Administration](#portal-administration)):

- **DAV user** login on `/portal/` with **Admin role** (`PORTAL_ADMIN_USERS` / `portal_admin_users` / default username `admin`).
- System settings can set the **admin password** (bcrypt hash in `baikal.yaml`) used for install-time and optional recovery paths.
- Rolling idle session (default **15 minutes**, configurable as session timeout in System settings).
- Failed portal login rate limit applies (file under `Specific/`).

### CalDAV / CardDAV users

| Mode | Storage | Recommendation |
|------|---------|----------------|
| **Digest** (default) | MD5 A1 hash `md5(user:realm:pass)` | LAN OK; weak if DB leaks — **use TLS** |
| **Basic** | Same digest hash table today | Prefer **only over HTTPS** |
| **Apache** | Web server auth | When reverse proxy handles users |

There is no separate “TasksDAV” / “NotesDAV”: tasks are **VTODO**, notes are **VJOURNAL** on CalDAV calendars.

Digest clients normally receive an HTTP `401` challenge and retry the same
request with credentials. A sequence such as `401` followed by `207` for
`PROPFIND` or `REPORT` is successful authentication negotiation, not a failed
sync. Expected DAV `4xx` responses remain visible in nginx access logs but are
not copied to PHP/FastCGI error logs. Configure Fail2Ban for DAV endpoints from
repeated terminal `401` access-log entries; `failed_access_message` remains an
admin-login hook.

Calendars marked read-only in the portal advertise a native read-only DAV ACL
to clients and also reject writes as defense in depth. A `PUT` returning `403`
for such a calendar means the client had a local change queued for a collection
that the server intentionally protects. Refresh the account's collection list
after upgrading. Clear the portal read-only flag only if clients should be
allowed to modify that calendar.

## System settings (admin)

| Setting | Effect |
|---------|--------|
| Enable CardDAV / CalDAV | Protocol roots and plugins |
| Enable WebDAV file storage | Owner-only private file homes under `/dav.php/files/` |
| WebDAV file storage path | Absolute path outside the web root; empty uses `Specific/files` |
| WebDAV maximum file size / quota | Per-file upload ceiling in **MB** (`files_max_upload_mb` / `BAIKAL_FILES_MAX_UPLOAD_MB`) and per-user application quota, also in **MB** (`files_quota_mb` / `BAIKAL_FILES_QUOTA_MB`); `0` quota means unlimited |
| Deleted user file retention | Days before quarantined homes become eligible for purge |
| Enable Tasks (VTODO) | Default calendars + UI checkbox for todos |
| Enable Notes (VJOURNAL) | Default calendars + UI checkbox for notes |
| Admin session timeout | Idle minutes for admin **and portal** cookie sessions (portal clears UI and shows Sign in on expiry) |
| WebDAV auth type | Digest / Basic / Apache |

## Environment variables (Docker / compose)

| Env | Values / default | Effect |
|-----|------------------|--------|
| `TZ` | e.g. `America/Toronto` | Container timezone (logs, PHP defaults). Also seeds the installer's default **Server Time zone** (`system.timezone`) when no `baikal.yaml` value exists yet — one-time default, not a live override; change it in Admin -> AngaraDAV Settings afterward if needed |
| `BAIKAL_LOCK_INSTALL` | `1` | Force installer lock even if `INSTALL_DISABLED` is missing |
| `BAIKAL_ALLOW_REINSTALL` | `1` | Allow re-opening the installer when lock env is set |
| `BAIKAL_SKIP_CHOWN` | `1` | Skip entrypoint chown of `config/` + `Specific/` (use after host `chown 101:101`; recommended on TrueNAS) |
| `BAIKAL_FILES_STORAGE_PATH` | absolute container path | Override `system.files_storage_path`; mount it persistently and make it writable by UID 101 |
| `BAIKAL_FILES_MAX_UPLOAD_MB` | `1024` | Maximum completed file size (in MB) enforced while streaming PUT/COPY bodies |
| `BAIKAL_FILES_QUOTA_MB` | `10240` | Per-user application quota, in MB; `0` disables the application quota |
| `BAIKAL_DAV_MAX_BODY_SIZE` | `1G` | Nginx request-body ceiling; nginx size syntax such as `512M` or `2G` |
| `TIME_FORMAT` / `BAIKAL_PORTAL_TIME_FORMAT` | `auto` (default), `12h`, `24h` | Portal time display |
| `BAIKAL_PORTAL_WEEK_START` | `auto` (default), `monday`, `sunday` | Portal calendar week start |
| `PORTAL_LOG_LEVEL` / `BAIKAL_PORTAL_LOG_LEVEL` | `off` (default), `error`, `warn`, `info`, `debug` | Portal debug: browser console + `Specific/portal_debug.log` (includes admin audit at info+) |
| `PORTAL_ADMIN_USERS` / `BAIKAL_PORTAL_ADMIN_USERS` | comma/space list of DAV usernames | Portal Admin role for `/api/admin/*` (overrides `system.portal_admin_users`; default if unset: DAV user `admin`) |
| — | YAML `system.portal_admin_ui_enabled` | `true` (default) / `false` — hide in-portal Administration shell only; classic `/admin/` unchanged |
| `PUSH_LOG_LEVEL` / `BAIKAL_PUSH_LOG_LEVEL` | `off` (default), `error`, `warn`, `info`, `debug` | WebDAV-Push debug: `Specific/push_debug.log` |
| `BAIKAL_PUSH_EXTERNAL_URL` | e.g. `https://dav.example.com/dav.php/` | Canonical client-reachable HTTPS DAV base URL for Push registration URLs |

YAML equivalents under `system.*` in `baikal.yaml`: `files_storage_path`, `files_max_upload_mb`, `files_quota_mb`, `portal_time_format`, `portal_week_start`, `portal_log_level`, `portal_admin_users`, `portal_admin_ui_enabled`, `push_external_url`, and `push_log_level`. **Env overrides YAML** (except `portal_admin_ui_enabled`, which is YAML/UI-only today). (`TZ` is the one exception for timezone: it only seeds the installer's initial `timezone` default and is not read again afterward.)

Leave `PORTAL_LOG_LEVEL` at `off` in production; use `debug` only while troubleshooting (verbose UI/API lines; no passwords). Request traces go to **`Specific/portal_debug.log`**, not nginx/docker error streams.

### Common deployment mistakes

- **Setting `BAIKAL_FILES_STORAGE_PATH` without mounting it.** The env var only tells AngaraDAV *where inside the container* to store WebDAV files — it does not create persistence. If that path isn't also bind-mounted (e.g. add `- type: bind, source: /mnt/tank/apps/angaradav/files, target: /var/lib/baikal-files`) and `chown`'d to UID 101 like the other two mounts, every file uploaded there is lost the next time the container is recreated.
- **`BAIKAL_FILES_STORAGE_PATH` / `BAIKAL_PUSH_EXTERNAL_URL` don't enable their features by themselves.** They only configure the path/URL to use *once* the corresponding feature is turned on in Admin → AngaraDAV Settings (**Enable WebDAV file storage**, **Enable WebDAV-Push**). Setting the env var alone does nothing until that admin checkbox is also checked.
- **Debug log files are not visible in Dozzle, `docker logs`, or any other stdout/stderr-based log viewer.** `Specific/portal_debug.log` and `Specific/push_debug.log` are deliberately written to files, not stdout/stderr, specifically so routine activity doesn't flood the container's general log stream (see the Portal/Push logging notes above). To read them: `docker exec <container> tail -f /var/www/baikal/Specific/push_debug.log`, or `tail -f` the equivalent path on the host's bind-mounted `Specific/` dataset.
- **Forgetting to turn `PORTAL_LOG_LEVEL`/`PUSH_LOG_LEVEL` back to `off`** after troubleshooting — both are meant to be temporary.
- **Raising "Maximum WebDAV file size" in the admin UI without also raising the nginx/PHP upload ceilings.** That field (entered in MB) only enforces the application-level limit while streaming a PUT/COPY body. It is independent of nginx's `client_max_body_size` (`BAIKAL_DAV_MAX_BODY_SIZE`, default `1G`) and PHP's `upload_max_filesize`/`post_max_size` (baked into the image at `1G`). Raising only the admin setting above those still gets uploads rejected by nginx/PHP first.

### Generic WebDAV file storage

Enable private mounted-drive storage with **Admin -> AngaraDAV Settings -> Enable
WebDAV file storage**, or configure YAML:

```yaml
system:
  files_enabled: true
  # Empty uses /var/www/baikal/Specific/files.
  files_storage_path: ''
  files_max_upload_mb: 1024        # 1024 MB per file
  files_quota_mb: 10240            # 10240 MB (10 GiB) per user; 0 = unlimited
  files_quarantine_days: 30
```

Connect each client to:

```text
https://baikal.example/dav.php/files/USERNAME/
```

Use that user's DAV credentials, not the admin account. Use HTTPS for Basic or
Digest authentication. `/cal.php/` remains CalDAV-only and `/card.php/`
remains CardDAV-only; generic files are exposed only through `/dav.php/`.

#### Android client (WebDAV-sync)

**[WebDAV-sync](https://github.com/offsyanka99/WebDAV-sync)** is an Android app
for syncing files with a private WebDAV home (compatible with AngaraDAV when
file storage is enabled).

| Setting | Value |
|---------|--------|
| Server URL | `https://baikal.example/dav.php/files/USERNAME/` |
| Username / password | AngaraDAV **DAV user** credentials |
| Auth | Prefer **HTTPS**; Basic over TLS or Digest as configured in AngaraDAV |

Project and releases: <https://github.com/offsyanka99/WebDAV-sync>.  
CalDAV/CardDAV on Android remains the usual choice (e.g. DAVx⁵) against
`/dav.php/` — WebDAV-sync targets **file** homes, not calendars/contacts.

The **User portal** (`/portal/`) includes a **Files** tab that uses the same
private home (session cookie + CSRF). Portal file operations are logged to
`Specific/portal_debug.log` when `PORTAL_LOG_LEVEL` / `system.portal_log_level`
is `info` or `debug` (list/upload/download/mkdir/rename/delete/copy/move).

**Upload:** a single **Upload** button opens a dialog. Drop files and/or folders
(mixed selections keep nested structure), or use **Choose files…** /
**Choose folder…** (browsers need separate pickers; drag-and-drop supports both
at once). A **progress dialog** shows file count, bytes, and current name — keep
the tab open until it finishes. A status line under the table shows item counts
(and selection counts when checkboxes are used).

**Copy / Move:** the SPA opens a destination **folder tree** (Home + subfolders;
expand on demand). You do not need to type a path.

**Copy naming:**

| Destination | Default name |
|-------------|--------------|
| **Same folder** as the source | Original name with a unique ` (copy)` / ` (copy N)` suffix so the original is never overwritten |
| **Another folder** | **Keeps the original filename** when free; only adds ` (copy)` if that name already exists in the destination |

Optional “New name” in the single-item dialog still overrides the default.

**Upload size limits:** the UI “max upload” value is the AngaraDAV app quota
(`files_max_upload_mb`, in MB). Multipart portal uploads also need matching
**PHP** (`upload_max_filesize` / `post_max_size`, set to **1G** in the Docker
image) and **nginx** `/api/` `client_max_body_size` (default **1G**, same
`BAIKAL_DAV_MAX_BODY_SIZE` override as DAV). A 4 MB file failing with
“exceeds the server size limit” usually means PHP/nginx still at the old 2 M
defaults — pull a rebuild that includes the 1G PHP/nginx settings.

#### Storage and limits

The default `Specific/files` tree is already part of the packaged persistent
volume. It contains random-ID home directories, same-filesystem upload
temporaries, quarantine, and mutation locks. Physical directory names do not
contain usernames. The nginx route streams PUT bodies to PHP instead of first
buffering a second complete copy.

For a separate TrueNAS dataset or large external volume:

```yaml
services:
  baikal:
    environment:
      BAIKAL_FILES_STORAGE_PATH: /var/lib/baikal-files
      BAIKAL_FILES_MAX_UPLOAD_MB: "2048"
      BAIKAL_FILES_QUOTA_MB: "20480"
      BAIKAL_DAV_MAX_BODY_SIZE: 2G
    volumes:
      - /mnt/tank/apps/baikal/files:/var/lib/baikal-files
```

Create the host dataset and set ownership before starting the container:

```bash
chown -R 101:101 /mnt/tank/apps/baikal/files
chmod 700 /mnt/tank/apps/baikal/files
```

The admin UI's **Maximum WebDAV file size** field, `system.files_max_upload_mb`
in `baikal.yaml`, and `BAIKAL_FILES_MAX_UPLOAD_MB` all use the **same single
unit: MB**. It is **not** derived from, or synchronized with, the nginx/PHP
upload ceilings below — the nginx `BAIKAL_DAV_MAX_BODY_SIZE` and the image's
PHP `upload_max_filesize`/`post_max_size` must be set at least as large
separately, or uploads will be rejected by nginx/PHP before this application
limit is ever checked. Filesystem/ZFS quotas remain the strongest final
backstop; the application quota provides per-user reporting and `507
Insufficient Storage` responses.

#### Data integrity and account deletion

- PUT bodies are written to private temporary files, flushed, and atomically
  renamed only after file-size and quota checks pass.
- Per-home mutation locks serialize quota-sensitive writes, copies, moves, and
  deletes. Symbolic links are never exposed or followed.
- Persistent WebDAV locks use the existing database `locks` table; dead
  properties use `propertystorage`.
- A deleted user is detached from its random storage ID before the principal is
  removed. The physical home moves to quarantine and a recreated username gets
  a new empty home.
- `/health.php` reports `filesStorageReady` without revealing the configured
  path. An unavailable enabled mount produces status `degraded` while the
  liveness response remains HTTP 200.

Run bounded cleanup daily from cron or a systemd timer:

```bash
docker exec angaradav php scripts/files-maintenance.php
# Source install:
php scripts/files-maintenance.php
```

Use `--purge-quarantine` or `--cleanup-temporary` to run only one operation.
The command purges homes older than `files_quarantine_days` and upload
temporaries older than 24 hours. A mode-`0600` lock prevents overlapping runs.

Back up the database and file-storage tree as one consistency set. The
`file_homes` database table maps principals to random directories; restoring
only the database or only file bytes is incomplete. Disabling the feature does
not delete homes or metadata.

#### Initial scope

This is a private class-2 WebDAV drive with properties, locks, quotas, ranges,
and standard copy/move behavior. It passed all 104 tests in WebDAV Litmus 0.13.
The initial release intentionally does not provide user-to-user sharing,
public links, trash/version history, full-text search, vendor chunk protocols,
RFC 6578 file Sync, or WebDAV-Push for files.

### WebDAV-Push

Enable server-initiated CalDAV/CardDAV change notifications (over Web Push, e.g. for DAVx5) with `system.push_enabled: true` in `baikal.yaml` (admin UI: *AngaraDAV Settings -> Enable WebDAV-Push*). Set `system.push_external_url` (or `BAIKAL_PUSH_EXTERNAL_URL`) to the canonical client-reachable HTTPS DAV base URL. Push is not advertised until this URL is valid. Requires the `minishlink/web-push` and `guzzlehttp/guzzle` composer packages plus PHP `curl`, `mbstring`, and `openssl` extensions.

Minimal `baikal.yaml` configuration:

```yaml
system:
  push_enabled: true
  push_external_url: 'https://dav.example.com/dav.php/'
  push_log_level: 'off'
  # Strongly recommended when all clients use known Push services:
  # push_allowed_hosts:
  #   - updates.push.services.mozilla.com
  #   - fcm.googleapis.com
  push_max_subscriptions_per_principal: 20
  push_max_subscriptions_per_resource: 100
  push_max_registrations_per_hour: 30
  push_worker_batch_size: 20
  push_worker_poll_ms: 2000
  push_max_delivery_attempts: 5
```

`push_external_url` must be the client-reachable **HTTPS DAV base URL**, including `dav.php/` and its trailing slash. It is intentionally never inferred from `Host` or `X-Forwarded-*` headers. `BAIKAL_PUSH_EXTERNAL_URL` overrides the YAML value and is convenient behind reverse proxies.

- The `push_subscriptions` and `push_queue` tables are created idempotently when Push starts. DAV writes only enqueue merged jobs; the Docker image supervises a bounded unprivileged CLI worker that performs outbound delivery with retries.
- Push endpoints must use public HTTPS on port 443 and are resolved/checked again immediately before delivery. For strongest SSRF protection, configure `system.push_allowed_hosts` as an exact YAML host list for the push services you permit.
- Default limits are 20 subscriptions per principal, 100 per resource, and 30 new registrations per principal/hour. Tune the `system.push_max_*` settings conservatively.
- A server VAPID key pair is generated once in **`Specific/push_vapid.json`** with mode `0600`. Unsafe or malformed key files make Push fail closed instead of silently rotating keys.
- Subscriber endpoint/key material is encrypted in the database with authenticated AES-256-GCM using `database.encryption_key`; endpoint deduplication uses a keyed blind index.
- Debug tracing (`PUSH_LOG_LEVEL` / `system.push_log_level` = `debug`, or `info` for less noise) goes to **`Specific/push_debug.log`**, not nginx/docker error streams. The log is mode `0600`, rotated at 5 MiB, and strips secrets and URL paths. Keep it `off` in production.
- At `info` level, enqueued notifications log a `source` (`dav` for CalDAV/CardDAV clients such as a phone or desktop app, `portal` for `/portal/` writes) and, for `dav`, the client's `User-Agent` as `client`, so you can tell what actually triggered a given change.

#### Local network example

AngaraDAV itself may remain LAN-only. It does not need an inbound internet port when all DAV clients can reach it locally (or through a VPN). It does need a stable HTTPS name that those clients trust, and the Push worker needs outbound DNS and HTTPS access to the client's public Web Push/UnifiedPush provider.

Example local DNS and TLS setup:

- `angaradav.home.arpa` resolves to `192.168.1.20` only on the local DNS server.
- A reverse proxy terminates HTTPS and forwards to AngaraDAV.
- The reverse proxy certificate is issued by an internal CA installed as trusted on every DAV client. Alternatively, use split DNS with a real domain and a publicly trusted certificate.

Configure `baikal.yaml`:

```yaml
system:
  push_enabled: true
  push_external_url: 'https://angaradav.home.arpa/dav.php/'
  push_log_level: 'off'
```

For Docker/Compose, the environment variable can provide the canonical URL without rewriting YAML (Push must still be enabled in YAML or the admin UI):

```yaml
services:
  angaradav:
    environment:
      BAIKAL_PUSH_EXTERNAL_URL: 'https://angaradav.home.arpa/dav.php/'
```

Notification flow:

1. The CalDAV/CardDAV client registers its public Push endpoint while connected to the LAN.
2. A DAV (or portal) change creates local database queue job(s). For **shared calendars**, one content update fans out to every sharee/owner instance path so each client’s registered topic is notified (2.0.1+).
3. The AngaraDAV worker sends an encrypted notification outbound over HTTPS port 443 to the public Push provider.
4. The client receives the hint and connects directly to `https://angaradav.home.arpa/dav.php/` to synchronize.

Important limitations:

- Plain HTTP is not supported for WebDAV-Push, even on a trusted LAN.
- A fully offline network cannot use the Web Push transport because the public Push provider is unreachable. Continue using normal WebDAV polling.
- Private/local Push gateways are currently rejected: registered Push endpoints must resolve only to public, non-reserved addresses on HTTPS port 443. This is an intentional SSRF safeguard.
- A client away from the LAN can receive a Push hint, but it cannot synchronize until the LAN URL is reachable again (for example through a VPN).

#### Worker operation

The repository Docker image starts one unprivileged worker automatically. For a source/package installation, supervise this long-running command with systemd, runit, s6, or an equivalent process manager:

```bash
php scripts/push-worker.php
```

Example systemd unit (adjust paths and the service account to your installation):

```ini
[Unit]
Description=AngaraDAV WebDAV-Push worker
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/baikal
ExecStart=/usr/bin/php /var/www/baikal/scripts/push-worker.php
Restart=on-failure
RestartSec=5s
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Enable it with `systemctl enable --now angaradav-push.service`. After upgrading AngaraDAV or changing Push configuration, restart both PHP-FPM/the container and this worker so they use the same code and settings.

For diagnostics or a cron-style bounded invocation, process one available batch and exit:

```bash
php scripts/push-worker.php --once
```

Only one worker should run against a given `Specific/` directory; a mode-`0600` lock file prevents accidental duplicates on one installation. Database queue locking also protects concurrent DAV writers.

#### Upgrade and backup

- Existing installations do not need manual SQL: enabling Push idempotently creates the two Push tables for SQLite or PostgreSQL.
- Run `composer install` after updating a source installation, then restart the supervised worker. Docker users should recreate the container from the updated image; the packaged entrypoint starts the worker automatically.
- Back up **both** `config/baikal.yaml` and **all** of `Specific/`. The database `encryption_key` decrypts subscription endpoints/key material; `Specific/push_vapid.json` is the stable VAPID server identity.
- Do not rotate or replace either key casually. Losing `database.encryption_key` makes existing subscription records unusable. Losing the VAPID key requires clients to create new restricted subscriptions.
- Keep `Specific/push_vapid.json`, `push_worker.lock`, and Push logs inaccessible to the web server and other local users. The packaged nginx configuration denies `Specific/`.

#### Troubleshooting

1. Confirm `push_enabled: true` and a valid `https://.../dav.php/` `push_external_url`.
2. Run `php scripts/push-worker.php --once`; inspect `Specific/push_debug.log` after temporarily setting `push_log_level: debug`.
3. Send `OPTIONS` to a readable DAV collection and confirm the `DAV` header contains `webdav-push`.
4. Use `PROPFIND` for `transports`, `topic`, and `supported-triggers` in the `https://bitfire.at/webdav-push` namespace.
5. If registrations are rejected, verify the endpoint uses public HTTPS port 443, its DNS records contain no private/reserved addresses, and its host is in `push_allowed_hosts` when an allowlist is configured.
6. **Portal vs DAV:** changes made in `/portal/` (or `/api/`) write the calendar/contact DB directly. They update CalDAV/CardDAV sync tokens, and (when Push is enabled) enqueue the same WebDAV-Push jobs as `/dav.php/` writes. Older images only enqueued Push for SabreDAV (`/dav.php/`) mutations — portal creates would not wake DAVx5 until the next poll.
7. **`registration rejected {"condition":"no-trigger-supported"}`:** older images rejected DAVx5 registrations that omit `<trigger>` (DAVx5 often sends only subscription + expires). Current images default omitted triggers to the collection’s supported content/property depths. Redeploy, then in DAVx5 disable/enable UnifiedPush or refresh collections so subscriptions re-register. Expect `subscription registered` in `Specific/push_debug.log`.
8. **Shared calendar, second phone never wakes:** before **2.0.1**, content-update jobs used only the changed DAV path (usually the owner’s `calendars/{owner}/{uri}`). Sharees register push on their own instance path (`calendars/{sharee}/…`) with a different topic, so they only learned of changes on the next DAVx5 poll. From **2.0.1**, calendar content updates fan out to **every** `calendarinstances` row for that `calendarid` (owner + sharees), each with its own `resource_uri` and topic. Confirm with `push_log_level: info` that one write produces multiple `content notification enqueued` lines (`trigger` = original path, `resource` = each instance). Restart the push worker after upgrade.

Keep normal client polling enabled at a reduced frequency. The experimental specification explicitly requires clients not to rely solely on Push.

## Installer lock

After a normal install, `Specific/INSTALL_DISABLED` is created and `/portal/install/` reports step **done** / locked.

| Env | Effect |
|-----|--------|
| `BAIKAL_LOCK_INSTALL=1` | Force lock even if the marker file is missing |
| `BAIKAL_ALLOW_REINSTALL=1` | Allow re-opening the wizard when lock env is set |

## Local Docker

```bash
docker build -t angaradav:local .
docker run --rm -p 8080:80 \
  -v angaradav-config:/var/www/baikal/config \
  -v angaradav-data:/var/www/baikal/Specific \
  angaradav:local
```

Open http://127.0.0.1:8080/ and complete setup.

### From source (without Docker)

```bash
composer install
# post-install applies patches/ (calendar-timezone, …)
php tests/php/CalendarTimeZoneResolveTest.php   # optional smoke check
php tests/php/AdminAuthTest.php                 # portal Admin role + requireAdmin
php tests/php/AdminDashboardServiceTest.php     # admin dashboard stats service
php tests/php/AdminAuditTest.php                # admin mutation audit log lines
php tests/php/AdminCapabilitiesServiceTest.php  # admin UI feature gating matrix
php tests/php/AdminUserServiceTest.php          # admin users list/detail (no digesta1)
php tests/php/AdminUserResourceServiceTest.php  # per-user calendars / address books
php tests/php/AdminSettingsServiceTest.php      # system settings YAML read/write
php tests/php/AdminSecurityReviewTest.php       # Phase 9.1 authz/mass-assignment guards
```

Security review checklist for `/api/admin/*` PRs:
[`docs/portal-admin-security-checklist.md`](portal-admin-security-checklist.md).

Portal Admin operator guide (this file):
[Portal Administration (parallel with classic `/admin/`)](#portal-administration-parallel-with-classic-admin).

Requires the `patch` command on `PATH`. Re-run after `composer update` if you
upgrade `sabre/dav` and the patch still applies; refresh
[`patches/sabre-dav-calendar-timezone.patch`](../patches/sabre-dav-calendar-timezone.patch)
if a new sabre/dav release changes those files.

## Upstream

Core CalDAV/CardDAV remains based on [sabre-io/Baikal](https://github.com/sabre-io/Baikal) **0.11.1**.  
AngaraDAV `1.0.0` is the first independent release, replacing the inherited fork-version scheme. Compatibility identifiers and data paths remain stable for upgrades.

## Release notes

### 2.2.3

- **Product version** `2.2.3`.
- **Calendar selection:** month-grid multi-select and primary calendar are remembered across browser sessions and re-login via `localStorage` (per DAV username).

### 2.2.2

- **Product version** `2.2.2`.
- **Portal — delegated events:** mount-time root listeners (`portal/src/app/events.ts`) for click/submit/change/input/keydown/drag; post-render hooks in `afterRender.ts` only.
- **List keyboard nav:** Contacts, Tasks, and Notes tables — **↑/↓/Home/End** move focus, **Enter/Space** open the row; focus restored after re-render.
- **Service-gated tabs:** Calendar / Contacts / Tasks / Notes / Files visibility follows Admin System settings (`cal_enabled`, `card_enabled`, `tasks_enabled`, `notes_enabled`, `files_enabled`). Flags are included in login/`/api/me`/`/api/ui` as `ui.services` (not secrets; same idea as `/info.php`). Disabled active tab redirects to the first enabled section.
- **Calendar UX:** multi-select visibility and selection persistence; Escape closes only the top info modal; calendar details modal border polish; brand **DAV** label gray.

### 2.2.1

- **Product version** `2.2.1`.
- **Portal — `onAction` split:** thin dispatcher (`portal/src/app/onAction.ts`) chains domain routers (`shellActionsRouter`, `calendars` / `tasks` / `notes` / `contacts` / files / admin `actionsRouter`); cross-domain DT form drafts via `datetimeSync.ts`.
- **Calendar share:** multi-user share no longer overwrites when principal emails collide; share href is unique per username (`mailto:{user}@users.local`). Share UI remains one user + access per Share click; table lists all sharees.
- **Files upload:** mixed drag-and-drop merges folder walks with root-level `FileList` entries; **Skip existing** only skips true server conflicts (not the whole batch).
- **UX:** themed delete confirm modal (events/tasks/notes/contacts/bulk/revoke); datetime picker closes on outside click; anonymous `GET /api/me` returns **200** with `user: null` (no console 401 on login screen); admin System settings `portal_admin_users` uses `autocomplete="off"`.

### 2.2.0

- **Product version** `2.2.0`.
- **Portal SPA modularization:** split `portal/src/app.ts` into domain modules (`app/files`, `admin`, `calendars`, `contacts`, `tasks`, `notes`, shell/session/login) with a thin orchestrator (`AppOrchestrator`). Intended as a behavior-freeze refactor for maintainability.
- User-visible Files / Calendar / Contacts / Tasks / Notes / Admin features match **2.1.2**.

### 2.1.2

- **Product version** `2.1.2`.
- **Files — Upload UX:** toolbar **Upload ▾** with **Files…** and **Folder…** (two browse modes; browsers have no single mixed picker). Drop files, folders, or a mix onto the **files panel** (upload modal removed). Nested folder trees and multi-file **progress** dialog unchanged.
- **Files — Progressive enhancement:** File System Access API (`showOpenFilePicker` / `showDirectoryPicker` / drop handles) when available; classic `<input type="file">` / `webkitdirectory` and `webkitGetAsEntry` fallbacks for Safari/Firefox and restricted contexts.
- **Files — Ops:** copy, move, rename, and delete remain available for both files and folders (row actions + bulk bar).

### 2.1.1

- **Product version** `2.1.1`.
- **Files — Upload:** single **Upload** dialog — drop files and/or folders (nested trees preserved), or browse files/folder; multi-file **progress** dialog (count, bytes, current file).
- **Files — Status bar:** item count under the table (`N items · X folders, Y files`; selection shows `k of N selected`).
- **Files — Multi-select scroll:** selecting checkboxes no longer jumps the list back to the top.
- **Session timeout UX:** mid-session idle expiry still shows *“Your session timed out…”*; a cold open of Sign in after browser close / expired cookie stays silent.

### 2.1.0

- **Product version** `2.1.0` (upgrade wizard compares version base only; rebuilds that only change the build SHA do not force upgrade).
- **Portal Administration** is the day-to-day admin path on `main` (classic Formal `/admin/` removed; redirects to `/portal/`).
- **Files — Copy/Move:** destination **folder tree** (Home + lazy expand); no need to type a path.
- **Files — copy naming:** same-folder copies get a unique ` (copy)` name; **cross-folder** copies keep the original filename when free (only add ` (copy)` on name conflict).
- **Calendar:** empty-state hint under **Owned**; list **Export** for calendars and address books; export download revoke-race fixed (honest cancel messaging).
- **CI:** PHP CS-Fixer / PHPStan clean after admin cutover; MechanicalSoup Formal-admin browser tests correctly `[SKIP]` without pytest.

### 2.0.3

- **Admin / install security follow-ups (P1–P3):** optional + pre-save DB connection test; re-prompt admin password on install database step (no session plaintext); block deleting the last portal Admin (env/YAML aware); rate-limit DAV user password changes; require password re-auth for Reset to Default.

### 2.0.2

- **Upgrade gate UX:** portal login shows a clear message when `/portal/install/` upgrade (or first setup) is required; portal `/api/*` returns **JSON 503** (`code: upgrade_required`) instead of an HTML 302 to the installer.
- **Version compare** uses product **base** only, so image rebuilds that only change the build SHA do not force the wizard. Display format is `2.0.x+<sha>` (no `git.` segment).
- **Calendar multi-select:** check multiple calendars to show combined events on the month grid (each calendar’s colour).
- Security: upgrade `guzzlehttp/guzzle` to **7.15.3** (CVE-2026-69245 / CVE-2026-69246). Deduplicate portal/install same-origin checks into `Baikal\Portal\SameOrigin` with unit tests.

### 2.0.1

- **WebDAV-Push shared-calendar fan-out:** when a calendar’s contents change (DAV or portal), enqueue a content-update job for **every** `calendarinstances` path that points at the same `calendarid` (owner + sharees), each with its own topic. Sharee DAVx⁵ clients now receive push instead of waiting for the scheduled poll only.
- Tests cover path expansion and dual queue jobs for owner/sharee URIs.

### 2.0.0

- **Portal Administration:** `/api/admin/*` + SPA shell (users, settings, database with CONFIRM, installer at `/portal/install/`)
- Classic Formal `/admin/` UI removed (redirects to portal)

### 1.0.0

- First independent AngaraDAV release (previously versioned as `0.11.1-fork.*`)
- Supported database backends: **SQLite** and **PostgreSQL**. MySQL support has been removed
- New `docs/truenas-scale-postgres.compose.yaml` for deploying with a bundled PostgreSQL 18 container
- `main` is now the default Git branch (`master` removed)
- WebDAV Basic/Digest auth (`/dav.php/`, `/cal.php/`, `/card.php/`) now has IP-based rate limiting, matching the admin and portal logins; digest comparison uses constant-time `hash_equals()`
- Admin panel CSP hardened with explicit `object-src 'none'; frame-src 'none'`

### 0.11.1-fork.5

- Experimental WebDAV-Push service discovery and subscription management for CalDAV/CardDAV clients such as DAVx⁵
- Encrypted `aes128gcm` Web Push delivery with a stable VAPID identity
- Persistent, deduplicating SQLite/PostgreSQL queue with bounded retries and a supervised unprivileged Docker worker
- DAV ACL enforcement, opaque registration tokens, registration quotas, strict input/key validation, and caller-scoped `Push-Dont-Notify`
- SSRF protection: public HTTPS port 443 only, private/reserved IP rejection, delivery-time DNS revalidation and cURL connection pinning, disabled redirects/proxies, optional exact host allowlist
- Subscription endpoints and key material encrypted at rest with AES-256-GCM; rotating sanitized mode-`0600` diagnostics
- Idempotent Push schema provisioning for existing installations; no manual SQL migration required
- New deployment, source-worker/systemd, backup, TrueNAS, security, and troubleshooting documentation
- Config save: atomic `baikal.yaml` write with hard failure if the volume is not writable; health/entrypoint mount diagnostics for TrueNAS “settings reset after restart”
- Portal `/api` calendar and contact writes enqueue WebDAV-Push (same as `/dav.php/`) so DAVx5 wakes when events are created in the user portal
- Accept DAVx5 push-register bodies that omit `<trigger>` (default to collection-supported content/property depths instead of `no-trigger-supported`)
- Product version includes build git SHA (`0.11.1-fork.5+git.<sha>`): Docker `GIT_SHA` build-arg → `Core/BuildInfo.php`; shown on `/health.php`, `/info.php`, and portal footer

### 0.11.1-fork.4

- Portal calendar **event CRUD** (create/edit/delete VEVENT from month view) with **RRULE** support
- Single-contact `.vcf` export; address-book delete confirmation modal; contact birthday / special date
- Tasks bulk-bar UX (green apply icons; Delete / Clear selection on second row); Calendar details: Share before Import/export
- Portal time format / week start prefs (`portal_time_format`, `portal_week_start` or env overrides)
- Portal debug log level (`portal_log_level` / `PORTAL_LOG_LEVEL`: off|error|warn|info|debug) → browser + `Specific/portal_debug.log`
- **Import progress modal** for large calendar (`.ics`) and contact (`.vcf`) files (live %, elapsed time, result)
- **Import performance (Phase 1):** chunked SQLite transactions (commit every 200 objects) for calendar + contact portal imports
- **Add calendar → Import .ics** one-shot create + import
- Nginx `/api` FastCGI timeouts **900s** + unbuffered NDJSON streaming
- TrueNAS hardening: `BAIKAL_SKIP_CHOWN`, entrypoint chown limited to `config/` + `Specific/`
- Public `GET /api/ui` for portal prefs before login

#### Bug fixes in this release

| Issue | Fix |
|-------|-----|
| Shared calendars listed but **not selectable** (read-only or full access) | “Shared with me” rows use `select-cal`; month grid loads events |
| Full-access share could not be used in portal | Same selection fix; write rules already allowed readwrite |
| Import fails **immediately** on first progress line | Stop calling `ob_flush()` with no output buffer |
| Import **504** after ~5 minutes | `fastcgi_read_timeout` / `send_timeout` **900s** on `/api` |
| Docker/nginx full of fake `[error]` during portal debug | Request traces → `Specific/portal_debug.log`, not PHP stderr |
| Container **stuck** on `40-fix-baikal-file-permissions.sh` | Skip/chown only `config`+`Specific`; `BAIKAL_SKIP_CHOWN` |
| Large `.ics` import **~6 min** for ~2.7k events on TrueNAS | Chunked SQLite transactions (~**2s** measured) |
| Import success shown **three times** (progress dialog, modal top flash, sticky banner under Import/export) | Removed sticky bottom import-result banner from address-book and calendar details modals |
| After idle timeout, **dashboard still visible** with calendars/contacts | SPA clears state, shows Sign in + “session timed out” message when expiry happens mid-session (server 401 + client timer); cold login after browser close stays silent |
| Stale portal JS after image upgrade (browser cache) | nginx: no-cache on `/portal/` HTML; long-cache only on hashed `/portal/assets/*` |

### 0.11.1-fork.3

- Full portal contacts: address book CRUD, contact table/search/edit, photos, multi email/phone, Unicode custom fields
- CalDAV `ReadOnlyPlugin` for portal read-only calendars
- Portal auth hardening (rate limit, idle timeout, CSRF/same-origin), import quotas, GD photos, CSP
- Calendar tab: month event grid, Edit/Delete on owned calendars, details/share modal; Tasks/Notes tabs; bulk task actions
- Updated portal screenshots (Calendar, Calendar details, Contacts, Tasks, Notes)

### 0.11.1-fork.2

- Portal tabs: My Calendars / My Contacts
- Calendar import/export (`.ics`), holidays calendars, read-only flag
- Contacts import/export (`.vcf`)
- Info (i) modals; import result UI; large-import timeout handling

### 0.11.1-fork.1

- User portal: create/edit calendars (name, color, description), share/revoke
- HA-friendly dual-format calendar-timezone (no `APPLY_HOME_ASSISTANT_FIX`)
- Docker/GHCR multi-arch, TrueNAS compose, `/health.php` + `/info.php`
