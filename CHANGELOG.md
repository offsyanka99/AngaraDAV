# Changelog

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
