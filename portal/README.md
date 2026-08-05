# AngaraDAV user portal

**Version:** `2.0.0`

TypeScript SPA for calendars, contacts, tasks, notes, private WebDAV files, and
**Administration** for operators with the Admin role.

## Tabs

| Tab | Features |
|-----|----------|
| **Calendar** | Owned list with Edit (details → share → import/export), Delete (confirm checkbox), month grid; create/edit/delete VEVENT (RRULE); holidays/read-only; large `.ics` import progress modal |
| **Contacts** | Address books (create/rename/delete with confirm), contact table/search, per-contact CRUD, multi email/phone, photos, birthday/special dates, Unicode custom fields, book + single-contact `.vcf` export; large `.vcf` import progress modal |
| **Tasks** | CalDAV `VTODO` list (sortable), subtasks via `RELATED-TO;RELTYPE=PARENT`, multi-select bulk status/due/%, create/edit/delete on writable calendars |
| **Notes** | CalDAV `VJOURNAL` list (sortable), create/edit/delete on writable calendars |
| **Files** | Private WebDAV home (when `files_enabled`): browse, upload, download, new folder, rename, delete; quota bar; same data as `/dav.php/files/{username}/` |
| **Administration** | Admin role only (user menu). Tabs: **Overview** · **System settings** · **Users** · **Database**. Installer: `/portal/install/`. |

Section help lives under **(i)** info modals. Optional time format / week start / log level from `/api/ui` or `/api/me` (`ui`).

### Administration (Admin role)

Primary admin UI is the **portal** (same DB + `baikal.yaml`). Auth is a **DAV user session** plus the Admin role.

#### Granting the Admin role

| Priority | Source | Example |
|----------|--------|---------|
| 1 | Env `PORTAL_ADMIN_USERS` or `BAIKAL_PORTAL_ADMIN_USERS` | `alice,bob` |
| 2 | YAML `system.portal_admin_users` | list or `"alice, bob"` |
| 3 | Default | DAV username **`admin`** (case-insensitive) if neither env nor YAML sets a list |

Env overrides YAML. Optional: `system.portal_admin_ui_enabled: false` hides the in-SPA Administration shell; `/api/admin/*` still enforces Admin server-side.

Operator guide: [`docs/DEPLOYMENT.md` — Portal Administration](../docs/DEPLOYMENT.md#portal-administration).  
Security checklist: [`docs/portal-admin-security-checklist.md`](../docs/portal-admin-security-checklist.md).

#### UI surface

- Opened from the **user menu → Administration** (hidden for non-admins).
- Hash routes: `#admin` (Overview), `#admin/settings`, `#admin/users`, `#admin/users/{username}`, `#admin/database`.
- **Overview:** stats + service On/Off + version/releases links.
- **System settings:** form writes `baikal.yaml` (services, files, push, session, admin password); timezone select.
- **Users:** full CRUD; digests never returned; per-user calendars/address books under detail.
- **Database:** connection form; password never returned; saves require typing **CONFIRM**.
- **Capabilities:** `GET /api/admin/capabilities` → `portalAdminUrl` + per-page `portalUrl` (all under `/portal/#admin…`).
- Non-admins never see the menu item; `/api/admin/*` still returns **403**.

#### Feature matrix

| Feature | Portal |
|---------|--------|
| Dashboard / Overview | Yes |
| Users CRUD | Yes |
| User calendars / address books | Yes |
| System settings | Yes |
| Database settings write | Yes (`confirm: "CONFIRM"`) |
| Installer / upgrade | Yes (`/portal/install/`) |

Installer details: `docs/portal-admin-installer-phase10.md`.

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
npm run dev     # Vite on :5173, proxies /api → :8080
npm run build   # emits to ../html/portal/
```
