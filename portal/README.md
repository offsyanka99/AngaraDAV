# AngaraDAV user portal

**Version:** `1.0.10`

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

Section help lives under **(i)** info modals. Optional time format / week start / log level from `/api/ui` or `/api/me` (`ui`).

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
| POST | `/api/login` | — |
| POST | `/api/logout` | session |
| GET | `/api/me` | session |
| GET | `/api/calendars` | session |
| POST | `/api/calendars` | session body `{displayname, description?, color?, holidays?, holidayCountry?, readOnly?}` |
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
