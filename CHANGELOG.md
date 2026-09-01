# Changelog

## 2.4.5 — 2026-09-01

### Portal
- **Administration → Configuration.** New tab to back up and restore system settings, and the new home for **Reset to Default** (moved off System settings).
  - **Backup** downloads a JSON snapshot of the editable settings (services, files, push, session, locale, admin roles). It never includes passwords, secrets, database credentials, or user/DAV data.
  - **Restore** reads a backup file client-side and previews a diff (changed / unchanged / unknown / invalid keys) before writing anything; applying reuses the same validation as the System settings form, so an out-of-range or malformed value is rejected rather than silently written.
  - Restore is rate-limited per admin and audited (key names only, never values).
- New endpoints `GET /api/admin/settings/backup`, `POST /api/admin/settings/restore` (`dryRun` for preview, `confirm: true` to apply).

Digest realm `BaikalDAV` and Docker path `/var/www/baikal` are unchanged.

## 2.4.4 — 2026-08-31

### Portal
- **System messages are now toasts.** Action results appear in a stack at the bottom right (top on narrow screens) instead of pushing the page down. Success and info messages fade after 5–10 seconds (longer for wordy ones); errors stay until dismissed. Repeated identical messages collapse into one with a `×N` badge, and at most four are shown at a time.
- Auto-dismiss pauses while the pointer or keyboard focus is on a toast and while the browser tab is hidden.
- Toasts float above dialogs, so messages raised while a modal is open are no longer hidden or dropped. Screen readers get them through dedicated live regions (assertive for errors, polite otherwise).
- The sign-in screen keeps its inline banner for the session-timeout and setup/upgrade notices.

Digest realm `BaikalDAV` and Docker path `/var/www/baikal` are unchanged.

## 2.4.3 — 2026-08-27

### Portal
- **Time format** and **week start** are set in Administration → System settings (24-hour / 12-hour / auto; Monday / Sunday / auto). They apply to every portal user. Stored events and CalDAV clients are unchanged.
- Compose env `TIME_FORMAT` and `BAIKAL_PORTAL_WEEK_START` is ignored. After upgrade, set the two fields in System settings if you previously relied on compose (default is browser `auto`).
- **Week view** opens scrolled to one hour before User settings **Day starts at** (e.g. day start 6:00 → first row 5:00). Returning to Calendar keeps that scroll and no longer flashes a full reload when events are unchanged.
- Portal HTML `<meta>` CSP no longer includes `frame-ancestors` (browsers ignore it in meta; nginx still sends `frame-ancestors 'none'`).
- **Tasks:** deleting a parent promotes subtasks by stripping `RELATED-TO` (they become real top-level tasks). **Delete with subtasks** removes the whole tree only after confirm. Parent-task picker lists open tasks only (not Done or Cancelled).

Digest realm `BaikalDAV` and Docker path `/var/www/baikal` are unchanged.

## 2.4.2 — 2026-08-26

### WebDAV-Push
- Symfony HttpClient 8 rejects Guzzle `extra.curl` `CURLOPT_*`. Push delivery now uses `max_connect_duration`, empty `proxy` (ignore env proxies), and `resolve` for the DNS pin. Fixes `Cannot set "CURLOPT_CONNECTTIMEOUT" with "extra.curl"`.

Digest realm `BaikalDAV` and Docker path `/var/www/baikal` are unchanged.

## 2.4.1 — 2026-08-26

### Portal
- **Notes and Tasks** create/edit moved into a wide modal. Lists are full width (same content width as Calendar/Contacts/Files). Title uses `h1`; multi-select chrome matches Files (*N selected*, Clear, actions).
- **New note:** Date starts empty and stays empty on save if you do not pick one (no automatic “now”).
- **Notes editor:** H1, strikethrough (`~~text~~`), and inline code (`` `shell.ts` ``), plus existing H2/H3, quote, lists, checkboxes, and links. Formatting round-trips through jtx Board Markdown in `DESCRIPTION`.
- Toolbar styles **toggle off** on a second click. Body text is normal weight by default (not inherited label bold). Clicks in the body no longer activate Bold (editor is not wrapped in a `<label>`).
- Heading/quote commands retag the current line (Chrome `formatBlock` workaround). Checklists omit extra bullets; list indent is tighter. Note modal Body field grows with a taller dialog.
- **Select all** on Notes and Tasks follows the Files checkbox (read native `.checked`; do not `preventDefault` too late).

### Docs
- README / portal README describe modal lists and the extra note formats.

Digest realm `BaikalDAV` and Docker path `/var/www/baikal` are unchanged.

## 2.4.0 — 2026-08-20

### Platform
- Removed Formal forms, Flake MVC, and live Flake bootstrap/ORM. DAV, portal, and install boot through `Baikal\Core\Bootstrap` and PDO.
- PHP **8.5** in the Docker image; Composer `php` **`^8.4`**; CI **8.4 / 8.5 / 8.6** (8.6 CI-only until GA).
- Symfony YAML and HttpClient **8.1**.
- Portal: Node **24**, Vite **8.2**, TypeScript **6**.
- WebDAV-Push: **minishlink/web-push 11** over Symfony HttpClient PSR-18 (Guzzle removed).
- Images pinned: `composer:2.10.2`, `nginx:1.31.3-trixie`; CI Postgres **18**; GitHub Actions majors updated.

### Security
- Portal CSP applied on HTML/asset locations (`frame-src 'self' blob:` for PDF preview). Recreate the container after image rebuilds.
- Portal file download/view rate-limited the same way as login.
- `/health.php` documents `filesStorageReady` / `configWritable` for TrueNAS.

### Portal
- **User settings:** invalid day start/end (end same as or before start) shows the error **inside the modal**, not as a main-page flash.
- **Tasks:** column filters (Status, Due, Calendar, %) instead of a Show Done checkbox. Status defaults to **Open** (hides Done). Title is search-only.
- **Notes:** jtx Board Markdown interop for **H2/H3**, **blockquote**, **horizontal rule** (`---`), and **checkboxes** (`- [ ]` / `- [x]`) in the rich editor (stored as Markdown in `DESCRIPTION`).

### Operator DX
- `make local-up` force-recreates `angaradav-local` on **:31088**, waits on `/health.php`.
- `BAIKAL_SKIP_CHOWN` only skips on `1`/`true`/`yes`; otherwise uid 101 must be able to write or the container exits.
- Vite `/api` proxy defaults to `:31088`; `make portal` refuses a root-owned `portal/node_modules`.

### Docs
- [Upgrade path](docs/upgrade-path.md) (Wave 7 PSR-4 / PHPStan 2 still optional).
- [Admin-only settings / slim YAML](docs/admin-settings-yaml.md) (plan, not implemented).

Digest realm `BaikalDAV` and Docker path `/var/www/baikal` are unchanged.

## 2.3.3 — 2026-08-20

### Notes / CalDAV
- **jtx Board rich-text interop:** portal HTML notes store Markdown in `DESCRIPTION` (what jtx Board renders) and keep HTML in `X-ALT-DESC;FMTTYPE=text/html`. Notes that only have Markdown in `DESCRIPTION` (jtx → DAVx⁵) are converted to HTML in the portal editor. Plain text is left unchanged. Re-save existing rich notes in the portal once so `DESCRIPTION` is rewritten.

## 2.3.2 — 2026-08-20

### Portal
- **User settings** (user menu): Dark/Light theme, calendar day start/end hours, ISO week numbers on the month grid.
- **Week view:** frozen day headers and all-day row; click a time slot to create an event with that start; work-hour band from day start to day end.
- **Selection toolbars** (Files pattern): Contacts (copy / export / delete), Notes (copy / delete), Tasks (Clear / Delete plus a second row for Status, Due, %).
- Footer **About** includes a GitHub link.

### Docs
- README documents optional **WebDAV-Push** (CalDAV/CardDAV, not file homes).

## 2.3.1 — 2026-08-19

Portal About dialog, Files and Calendar UX, notes rich text, local Docker DX. See the [v2.3.1 release](https://github.com/offsyanka99/AngaraDAV/releases/tag/v2.3.1).
