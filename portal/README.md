# AngaraDAV user portal

**Version:** `2.3.3`

TypeScript SPA for calendars, contacts, tasks, notes, private WebDAV files, and
**Administration** for operators with the Admin role.

User tabs follow Admin **DAV services** (CalDAV → Calendar, CardDAV → Contacts,
Tasks/Notes/Files toggles). Contacts, Tasks, and Notes lists support **↑/↓/Enter**
keyboard navigation.

## Module layout

`src/app.ts` is the thin orchestrator (`mountApp`). Domain code lives under
`src/app/`:

| Module | Role |
|--------|------|
| `app/constants.ts` | Storage keys, version fallback, docs URL |
| `app/onAction.ts` | Thin data-action chain → domain `*actionsRouter.ts` |
| `app/events.ts` | Mount-time delegated listeners (click/submit/change/input/keydown/drag) |
| `app/afterRender.ts` | Post-render hooks (menus, indeterminate, list keyboard focus) |
| `app/types.ts` | `TabId`, `AdminPageId`, `Flash` |
| `app/sectionInfo.ts` | `(i)` help copy + title row |
| `app/format.ts` | Display formatters, sort headers |
| `app/paths.ts` | WebDAV storage path join/basename |
| `app/datetime.ts` | Pure date/time + popover HTML helpers |
| `app/context.ts` | `AppState`, `AppContext`, `createAppState` |
| `app/flash.ts` | Flash banner set/clear/render |
| `app/scroll.ts` | Scroll capture/restore across re-renders |
| `app/session.ts` | Idle timeout, install gate, session wipe, service-tab helpers |
| `app/shell.ts` | Topnav / tabs / footer chrome |
| `app/login.ts` | Sign-in screen copy and form |
| `app/bootstrap.ts` | Bootstrap + login submit flow |
| `app/files/*` | Files tab: load, transfer, upload, render, actions |
| `app/admin/*` | Administration: overview, users, settings, database |
| `app/calendars/*` | Calendars: month grid, events, import progress, ICS import |
| `app/keys.ts` | Shared `itemKey` for tasks/notes |
| `app/notes/*` | Notes tab: load, render, save |
| `app/tasks/*` | Tasks tab: tree, bulk, load, render, save |
| `app/contacts/*` | Contacts tab: loaders, form, photo, VCF import, save |
| `app/orchestrator.ts` | Shared `AppOrchestrator` bag |
| `app/home.ts` | Shell + tab switch (service-gated tab buttons) |
| `app/navigation.ts` | `loadHome` / `activateTab` / `normalizeActiveTab` |
| `app/datetimeFields.ts` | Date/time field helpers |
| `app/routing.ts` / `app/badges.ts` | Hash/tab storage + badges |

`mountApp` creates `state`, domain hosts, and one `AppOrchestrator` (`o`), registers
events once, then bootstraps. All UI state is `state.*`. Domain modules take `o` or
hosts — they do not import `app.ts`.

## Tabs

| Tab | Features |
|-----|----------|
| **Calendar** | Owned list with Edit (details → share → import/export), Delete (confirm checkbox), month grid; create/edit/delete VEVENT (RRULE); holidays/read-only; large `.ics` import progress modal |
| **Contacts** | Address books (create/rename/delete with confirm), contact table/search, per-contact CRUD, multi email/phone, photos, birthday/special dates, Unicode custom fields, book + single-contact `.vcf` export; large `.vcf` import progress modal |
| **Tasks** | CalDAV `VTODO` list (sortable), subtasks via `RELATED-TO;RELTYPE=PARENT`, multi-select bulk status/due/%, create/edit/delete on writable calendars |
| **Notes** | CalDAV `VJOURNAL` list (sortable), create/edit/delete on writable calendars |
| **Files** | Private WebDAV home (when `files_enabled`): browse, **View** (images, PDF, text, audio, video), **Upload ▾** (Files… / Folder…; File System Access API with classic-input fallback), drop files/folders/mix onto the list, download, new folder, copy/move (folder tree destination), rename, delete; upload progress dialog; folder item count; quota bar; same-folder copies get ` (copy)`, cross-folder keeps original name; same data as `/dav.php/files/{username}/` |
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
# API + AngaraDAV must already be running (e.g. docker on :31088)
#   make local-up   # or: docker compose -f docs/local.compose.yaml up --build -d --force-recreate
cd portal
npm install
npm run dev     # Vite on :5173, proxies /api → :31088 (`make local-up`)
# ANGARADAV_API=http://127.0.0.1:8080 npm run dev   # if the API is on 8080
npm run build   # emits to ../html/portal/
```

`portal/node_modules` must be owned by your user. A root-owned tree (for
example `sudo npm install`) makes Vite fail with EACCES on
`node_modules/.vite-temp`. Fix: `chown -R "$USER:$USER" node_modules`.

`make portal` from the repo root runs `npm test` then `npm run build`.
