# AngaraDAV user portal

**Version:** `2.0.0`

TypeScript SPA for calendars, contacts, tasks, notes, and private WebDAV files.
Styled like the bookmarks-sync admin UI (dark surface cards, sticky topnav,
primary blue actions, footer pinned to the viewport bottom).

## Tabs

| Tab | Features |
|-----|----------|
| **Calendar** | Owned list with Edit (details → share → import/export), Delete (confirm checkbox), month grid; create/edit/delete VEVENT (RRULE); holidays/read-only; large `.ics` import progress modal |
| **Contacts** | Address books (create/rename/delete with confirm), contact table/search, per-contact CRUD, multi email/phone, photos, birthday/special dates, Unicode custom fields, book + single-contact `.vcf` export; large `.vcf` import progress modal |
| **Tasks** | CalDAV `VTODO` list (sortable), subtasks via `RELATED-TO;RELTYPE=PARENT`, multi-select bulk status/due/%, create/edit/delete on writable calendars |
| **Notes** | CalDAV `VJOURNAL` list (sortable), create/edit/delete on writable calendars |
| **Files** | Private WebDAV home (when `files_enabled`): browse, upload, download, new folder, rename, delete; quota bar; same data as `/dav.php/files/{username}/` |
| **Administration** | Admin role only (user menu). In-SPA shell: Overview / Users / System settings / Database (`#admin`, `#admin/users`, …). Classic `/admin/` kept as fallback. |

Section help lives under **(i)** info modals. Optional time format / week start / log level from `/api/ui` or `/api/me` (`ui`).

### Administration (Admin role)

Portal Administration runs **in parallel** with classic **`/admin/`** (same DB + `baikal.yaml`). Classic uses the **admin password**; the portal uses a **DAV user session** plus the Admin role.

#### Granting the Admin role

| Priority | Source | Example |
|----------|--------|---------|
| 1 | Env `PORTAL_ADMIN_USERS` or `BAIKAL_PORTAL_ADMIN_USERS` | `alice,bob` |
| 2 | YAML `system.portal_admin_users` | list or `"alice, bob"` |
| 3 | Default | DAV username **`admin`** (case-insensitive) if neither env nor YAML sets a list |

Env overrides YAML. Optional: `system.portal_admin_ui_enabled: false` hides the in-SPA shell (menu → classic link); `/api/admin/*` still enforces Admin server-side.

Operator guide: [`docs/DEPLOYMENT.md` — Portal Administration](../docs/DEPLOYMENT.md#portal-administration-parallel-with-classic-admin).  
Security checklist: [`docs/portal-admin-security-checklist.md`](../docs/portal-admin-security-checklist.md).

#### UI surface

- Opened from the **user menu → Administration** (hidden for non-admins).
- Hash routes: `#admin` (Overview), `#admin/users`, `#admin/users/{username}`, `#admin/settings`, `#admin/database`.
- **Overview:** classic-parity stats + service On/Off + version/releases links.
- **Users:** full CRUD; digests never returned; per-user calendars/address books under detail.
- **System settings:** form writes `baikal.yaml` (services, files, push, session, classic admin password).
- **Database:** read-only summary; password never returned; **writes classic-only**.
- **Feature gating:** `GET /api/admin/capabilities`; incomplete areas keep classic fallback links.
- Non-admins never see the menu item; `/api/admin/*` still returns **403**.

#### Portal vs classic (operators)

| Feature | Portal | Classic `/admin/` |
|---------|--------|-------------------|
| Dashboard | Yes | Yes |
| Users CRUD | Yes | Yes |
| User calendars / address books | Yes | Yes |
| System settings | Yes | Yes |
| Database settings write | No (read-only) | Yes |
| Installer / upgrade | No | Yes (`/admin/install/`) |

Large **`.ics` / `.vcf` imports** open a progress dialog (read → upload → server import, elapsed time) and show the result when finished.

### Debug logging

Set log level in `baikal.yaml` or env (env wins):

| Source | Key | Values |
|--------|-----|--------|
| YAML | `system.portal_log_level` | `off` (default), `error`, `warn`, `info`, `debug` |
| Env | `PORTAL_LOG_LEVEL` or `BAIKAL_PORTAL_LOG_LEVEL` | same |

- **Browser:** DevTools -> Console (`[angaradav-portal]` prefix). `info` = API timings + UI events; `debug` = outbound requests + raw actions.
- **Server:** all portal request traces append to `Specific/portal_debug.log` (never nginx `[error]` via FastCGI stderr).

## Develop

```bash
# API + AngaraDAV must already be running (e.g. docker on :8080)
cd portal
npm install
npm run dev     # http://127.0.0.1:5173/portal/  (proxies /api → :8080)
```

## Production build

```bash
npm run build   # → ../html/portal/
```

Docker image runs this build in a multi-stage `node` stage automatically.

## API (same origin)

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/ui` | — (public portal prefs: time format, week start, log level) |
| POST | `/api/login` | — (profile includes `isAdmin` / `role`) |
| POST | `/api/logout` | session |
| GET | `/api/me` | session (`isAdmin` / `role`) |
| GET | `/api/admin/ping` | session + **Admin** → `{ ok: true, user }` |
| GET | `/api/admin/dashboard` | session + **Admin** → `{ data }` stats |
| GET | `/api/admin/capabilities` | session + **Admin** → feature matrix |
| GET/POST | `/api/admin/users` | list / create (CSRF on POST; never digesta1) |
| GET/PATCH/DELETE | `/api/admin/users/{username}` | detail / update / delete (`confirm` on DELETE) |
| GET/POST | `/api/admin/users/{u}/calendars` | list / create calendars for user `u` |
| GET/PATCH/DELETE | `/api/admin/users/{u}/calendars/{id}` | calendar instance CRUD |
| GET/POST | `/api/admin/users/{u}/addressbooks` | list / create address books |
| GET/PATCH/DELETE | `/api/admin/users/{u}/addressbooks/{id}` | address book CRUD (`force` if non-empty) |
| GET/PATCH | `/api/admin/settings/system` | system settings (no password hash in GET) |
| GET | `/api/admin/settings/database` | DB summary read-only (mutating methods **403**) |
| GET | `/api/calendars` | session |
| POST | `/api/calendars` | session body `{displayname, description?, color?, holidays?, holidayCountry?, readOnly?}` |

### Admin API notes

- Prefix `/api/admin/*` requires a portal session **and** Admin role (`requireAdmin()`). Non-admin → **403**, anonymous → **401**.
- Mutations need same-origin + CSRF (`X-CSRF-Token`), same as the rest of the portal API.
- Admin role: env `PORTAL_ADMIN_USERS` / `BAIKAL_PORTAL_ADMIN_USERS`, or YAML `system.portal_admin_users`; default DAV user `admin` if unset.
- Mutations log to `Specific/portal_debug.log`: successes at **info**, failures at **warn** (`admin audit actor=… action=… result=ok|error:…`). Settings saves also log `admin settings save ok|failed`. See [DEPLOYMENT observability](../docs/DEPLOYMENT.md#observability-diagnose-a-failed-portal-settings-save).

| Method | Path | Auth |
|--------|------|------|
| PATCH | `/api/calendars/{instanceId}` | session body `{displayname?, description?, color?}` |
| GET | `/api/calendars/{instanceId}/export` | session → `.ics` download |
| POST | `/api/calendars/{instanceId}/import` | session body `{ics}` (merge by UID) |
| GET | `/api/calendars/{instanceId}/events` | session `?from=&to=` month list |
| POST | `/api/calendars/{instanceId}/events` | session create VEVENT |
| GET/PATCH/DELETE | `/api/calendars/{instanceId}/events/{uri}` | session get / update / delete VEVENT |
| GET | `/api/directory` | session |
| GET | `/api/calendars/{instanceId}/shares` | session |
| POST | `/api/calendars/{instanceId}/shares` | session body `{username, access}` |
| DELETE | `/api/calendars/{instanceId}/shares` | session body `{href}` |
| GET | `/api/addressbooks` | session |
| POST | `/api/addressbooks` | session body `{displayname, description?, uri?}` |
| PATCH | `/api/addressbooks/{id}` | session body `{displayname?, description?}` |
| DELETE | `/api/addressbooks/{id}` | session body `{force?}` (force required if non-empty) |
| GET | `/api/addressbooks/{id}/export` | session → `.vcf` download |
| POST | `/api/addressbooks/{id}/import` | session body `{vcf}` |
| GET | `/api/addressbooks/{id}/contacts` | session `?q=` search |
| POST | `/api/addressbooks/{id}/contacts` | session create contact JSON |
| GET | `/api/addressbooks/{id}/contacts/{uri}` | session |
| PATCH | `/api/addressbooks/{id}/contacts/{uri}` | session update (merge) |
| DELETE | `/api/addressbooks/{id}/contacts/{uri}` | session |
| GET | `/api/addressbooks/{id}/contacts/{uri}/export` | session → single-contact `.vcf` |
| GET | `/api/addressbooks/{id}/contacts/{uri}/photo` | session → JPEG |
| GET | `/api/holidays/countries` | session |
| GET | `/api/files` | session — file storage status + quota (`enabled`, `ready`, `davPath`, bytes) |
| GET | `/api/files/entries` | session `?path=` list folder (default home root) |
| POST | `/api/files/mkdir` | session body `{path, name}` |
| POST | `/api/files/upload` | session multipart `file` (+ query `path`, `name?`, `replace?`) or raw body |
| GET | `/api/files/download` | session `?path=` file download stream |
| DELETE | `/api/files/entry` | session body `{path}` |
| POST | `/api/files/rename` | session body `{path, newName}` |
| POST | `/api/files/move` | session body `{from, to, newName?}` |
| POST | `/api/files/copy` | session body `{path, to?, newName?}` — default same folder as `name (copy).ext` |
| POST | `/api/files/bulk` | session body `{op: "copy"\|"delete", paths: string[]}` |

Contact write body (create/update): `firstname`, `lastname`, `fullname`, `org`, `title`, `emails[]`, `phones[{type,value}]`, `address{street,city,region,postal,country}`, `url`, `note`, `birthday?`, `specialDate?`, `specialDateLabel?`, `custom[{label,value}]` (stored as vCard `X-*` properties), `photoBase64?`, `removePhoto?`.  
Updates merge into the existing vCard so unknown standard properties (e.g. `CATEGORIES`) are preserved. Editable custom fields are plain-text `X-*` properties.

Event write body: `summary`, `description?`, `location?`, `start`, `end?`, `allDay?`, `instanceId?` (move), `repeat?` (`freq`, `interval`, `until`, `count`, `byDay`).

`access`: `read` | `readwrite`.  
`color`: `#RGB`, `#RRGGBB`, or `#RRGGBBAA` (empty clears).
