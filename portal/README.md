# AngaraDAV user portal

**Version:** `2.5.8`

TypeScript SPA for calendars, contacts, tasks, notes, private WebDAV files, and
**Administration** for operators with the Admin role.

User tabs follow Admin **DAV services** (CalDAV → Calendar, CardDAV → Contacts,
Tasks/Notes/Files toggles). Contacts, Tasks, and Notes lists support **↑/↓/Enter**
keyboard navigation. Tasks have per-column filters (Status, Due, Calendar, %);
Status defaults to Open (completed tasks hidden). Repeat uses the same rule as
calendar events and needs a due date. Completing a repeating task saves that
occurrence and moves the series to the next due date. Create/edit for **Notes** and
**Tasks** is a modal; lists are full width. Notes rich text matches jtx
Board Markdown (H1–H3, blockquote, `- [ ]` checkboxes, `~~strike~~`, `` `code` ``, `---`).
The portal can be installed as its own window. A service worker under `/portal/` makes that possible and does not cache pages or API calls. User settings validation errors stay in the settings modal. **Background changes** can also raise a browser notification when this window is open but not focused. That check still pauses while the tab is hidden. **Password** (current, new, confirm) changes the signed-in user's DAV password via `POST /api/me/password`. Leave those fields blank to keep the password. The rules are in the **(i)** next to Password. A wrong current password stays in the modal (HTTP 400) and does not sign the user out. Sign in and each of those fields have a **View password** eye; it only shows or hides that field in the browser.

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
| `app/sectionInfo.ts` | `(i)` help: registered `SECTION_INFO` copy, title rows, and standalone `infoIconHtml()` |
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
| `app/calendars/*` | Calendars: month, week, agenda (events, open tasks due, dated notes), display reminders and due-reminder notifications, import progress, ICS import |
| `app/keys.ts` | Shared `itemKey` for tasks/notes |
| `app/repeatControl.ts` | Shared Repeat fieldset for events and tasks |
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
| **Calendar** | Owned list with Edit (details → share → import/export), Delete (confirm checkbox), one view menu: month / week / work week (Monday–Friday) / agenda, Today and Jump to date (week start follows System settings); agenda also lists open tasks on their due date and notes that have a date; create/edit/delete VEVENT (RRULE) with one display reminder (a notification when it is due; click opens the event); holidays/read-only; large `.ics` import progress modal |
| **Contacts** | Address books (create/rename/delete with confirm), contact table/search, per-contact CRUD, multi email/phone, photos, birthday/special dates, Unicode custom fields, book + single-contact `.vcf` export; large `.vcf` import progress modal |
| **Tasks** | CalDAV `VTODO` list (sortable, full width), subtasks via `RELATED-TO;RELTYPE=PARENT`, repeat (`RRULE`) on the series, multi-select bulk status/due/%, create/edit modal on writable calendars |
| **Notes** | CalDAV `VJOURNAL` list (sortable, full width), create/edit modal, rich editor (H1–H3, blockquote, checkbox, strikethrough, inline code, horizontal line, lists/links) with jtx Board Markdown in `DESCRIPTION` |
| **Files** | Private WebDAV home (when `files_enabled`): browse, **View** (images, PDF, text, audio, video), **Upload ▾** (Files… / Folder…; File System Access API with classic-input fallback), drop files/folders/mix onto the list, download, new folder, copy/move (folder tree destination), rename, delete into **Trash** (restore, delete now, empty; “ (restored)” when the original name is taken); upload progress dialog; folder item count; quota bar (Trash counts); same-folder copies get ` (copy)`, cross-folder keeps original name; Refresh of the open folder compares an open preview's etag and asks before replacing that preview; same data as `/dav.php/files/{username}/`. WebDAV clients do not see Trash. Retention is **Trash retention (days)** in System settings (`files_trash_days`, default 30; 0 deletes immediately) |
| **Administration** | Admin role only (user menu). Tabs: **Overview** · **System settings** · **Users** · **Database** · **Configuration**. Installer: `/portal/install/`. |

Section help lives under **(i)** info modals. A button from `infoIconHtml()` carries its own title and paragraphs (`data-info-title`, `data-info-paragraphs`). A button with `data-info` still opens a `SECTION_INFO` entry. Time format and week start are instance-wide (**Administration → System settings**); `/api/ui` (and `/api/me` `ui`) still expose them plus log level.

While a user tab is visible, the portal polls collection revisions (`GET /api/sync-status`) and shows a sticky toast when CalDAV/CardDAV/WebDAV clients (or another browser tab) change the open view. Notes and Tasks compare that component's last-modified time, so an event edit does not toast them. A Files folder with more than 500 direct children says only the first 500 are checked. **Refresh** reloads that tab in-place. **User settings → Background changes** can also raise a browser notification when this window is open but not focused. The poll interval is **Administration → System settings → Portal sync poll interval** (default 30s) and does not extend session idle. The poll pauses while the tab is hidden.

### Administration (Admin role)

Primary admin UI is the **portal** (same DB + `configuration.yaml`). Auth is a **DAV user session** plus the Admin role.

#### Granting the Admin role

| Priority | Source | Example |
|----------|--------|---------|
| 1 | Env `PORTAL_ADMIN_USERS` | `alice,bob` |
| 2 | YAML `system.portal_admin_users` | list or `"alice, bob"` |
| 3 | Default | DAV username **`admin`** (case-insensitive) if neither env nor YAML sets a list |

Env overrides YAML. Optional: `system.portal_admin_ui_enabled: false` hides the in-SPA Administration shell; `/api/admin/*` still enforces Admin server-side.

#### UI surface

- Opened from the **user menu → Administration** (hidden for non-admins).
- Hash routes: `#admin` (Overview), `#admin/settings`, `#admin/users`, `#admin/users/{username}`, `#admin/database`, `#admin/configuration`.
- **Overview:** stats + service On/Off (including Push for files) + WebDAV-Push subscriptions per kind and queue backlog when Push is on (`app/admin/pushStats.ts`) + version/releases links.
- **System settings:** form writes `configuration.yaml` (services, files, push incl. Push for file storage and the per-user subscription limit, session, admin password); timezone select.
- **Users:** full CRUD; digests never returned; per-user calendars/address books under detail.
- **Database:** connection form; password never returned; saves require typing **CONFIRM**.
- **Configuration:** three sections. **Settings backup and restore** downloads or restores a JSON settings backup (no secrets, no user/DAV data; `GET/POST /api/admin/settings/backup|restore`); the preview shows a changed/unknown/invalid diff before applying. **Data backup and restore** downloads one archive (`POST /api/admin/data-export`) and can put it back (`POST /api/admin/data-restore`): a SQLite snapshot or a PostgreSQL `pg_dump`, plus a tarball of the WebDAV file store. Restore replaces the live database and file store. `configuration.yaml` stays on the config volume. A successful restore increments `system.portal_session_generation` and signs portal browsers out; sign in again. **Danger zone** is **Reset to Default** (full factory wipe + reopen installer).
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
| Settings backup / restore | Yes (never secrets or user/DAV data) |
| Data backup / restore | Yes (SQLite snapshot or `pg_dump`, plus the file store; restore replaces that data; config volume stays separate; a successful restore ends portal sessions) |
| Installer / upgrade | Yes (`/portal/install/`). Upgrade keeps `portal_log_level`, `portal_time_format`, and `portal_week_start` |

Large **`.ics` / `.vcf` imports** open a progress dialog (read → upload → server import, elapsed time) and show the result when finished.

### Debug logging

Set log level in `configuration.yaml` or env (env wins):

| Source | Key | Values |
|--------|-----|--------|
| YAML | `system.portal_log_level` | `off` (default), `error`, `warn`, `info`, `debug` |
| Env | `PORTAL_LOG_LEVEL` | same |

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
