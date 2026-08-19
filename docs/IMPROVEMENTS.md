# AngaraDAV — improvements and refactoring plan

Engineering-debt map of the current tree, not a rewrite pitch. The product is
already a working CalDAV/CardDAV/WebDAV stack plus a domain-split portal. The
highest return is **quality gates and splitting a few god-objects**, not
replacing the SPA framework or Baïkal namespaces.

Effort scale:

| Tag | Meaning |
|-----|---------|
| **S** | 0.5–2 days |
| **M** | 3–7 days |
| **L** | 1.5–3 weeks |
| **XL** | 4+ weeks, several PRs |

---

## Where the code actually is

| Area | Size | Shape |
|------|------|--------|
| Portal SPA | ~16k TS + ~4k CSS | Domain folders (`files/`, `calendars/`, …) + one fat `AppOrchestrator` and `innerHTML` re-renders |
| Portal PHP API | ~12k | `App.php` (~1835) is the router; fat services: `ContactService` ~1810, `ShareService` ~1659, `AdminSettingsService` ~1008, `CalendarItemService` ~955, `FileService` ~767 |
| DAV / files / Push | ~5k under `Baikal\Core` | Solid, already modular |
| Tests | ~5k | PHP scripts with copy-pasted `assert_true`; Python MechanicalSoup; `portal_admin_e2e.py` **not in CI** |
| Static analysis | PHPStan **level 0**; portal `tsc --strict` locally, **not in CI** |

Already in good shape (do **not** rip out):

- SabreDAV server, file homes, Push plugin, ACL/quarantine
- Portal domain split (2.2.0) and `data-action` routers
- CSRF + same-origin + Admin `requireAdmin()` gate
- Compatibility contract: `Baikal\*` namespaces, `/dav.php/`, `baikal.yaml`, UID 101, volume paths

Do **not** do as a “refactor”: React/Vue rewrite, innerHTML → virtual DOM,
renaming DAV URLs, changing `auth_realm` without a migration story.

---

## Recommended sequence

1. **CI + test harness** (stops regressions while everything else moves)
2. **Split PHP router/services** (where bugs and reviews hurt)
3. **Portal SPA hygiene** (`api.ts`, dead state, orchestrator)
4. **Local Docker / Makefile DX**
5. **Product features** (week view, file search, etc.) as separate PRs
6. **Legacy Flake/Formal** last, and only if something still depends on it

---

## 1. Quality gates and tests — **L** total (do first)

This is the best investment. CI today runs PHP CS-Fixer, PHPStan level 0, a
list of `php tests/php/*.php` scripts, and `python run_tests.py`
(install/DAV MechanicalSoup). It does **not** typecheck or build the portal,
and does **not** run `tests/portal_admin_e2e.py`.

| Work | Effort | Why |
|------|--------|-----|
| CI: `npm ci && npm run build` in `portal/` on every PR | **S** | `api.ts` / preview / admin can ship untyped; Docker builds the SPA but PRs do not |
| Shared PHP test bootstrap (one `assert_true`, autoload, temp dirs) then PHPUnit **or** keep scripts but stop duplicating the harness in ~25 files | **M** | Every test file reimplements the same runner |
| Run `portal_admin_e2e.py` in CI against `php -S` (or a job service) | **M** | Admin/authz is currently “pytest if a server happens to be up” |
| Portal API tests for Files view/download (`inline`, MIME allowlist, HTML→text/plain) | **S** | New surface, easy to regress |
| Raise PHPStan **0 → 2** (then 4 later), fix only `Portal/` first | **M** then **L** | Level 0 is almost off; `App.php` and services are untyped `@var` properties |
| `composer test` should run unit tests, not only cs-fixer+phpstan | **S** | `composer.json` `"test"` is misleading |
| Tiny TS tests (no React needed): `classifyFilesPreview`, path helpers, datetime parse | **S** | `vitest` + existing Vite; `package.json` has no test script |

**What not to do here:** full Playwright of every portal tab in the first pass
(**L–XL**). Keyboard/focus + innerHTML makes e2e brittle until scroll/focus
restore is documented.

---

## 2. PHP API: split the god router and misnamed services — **L**

`App.php` is bootstrap + HTTP helpers + calendar routes + admin + files +
tasks/notes + streaming downloads. File and admin routes are already extracted
as `dispatchFileRoutes` / `dispatchAdminRoutes`; calendars/events/shares are
still a long `if` chain in `dispatch()`.

`ShareService` (~1659 lines) is not “sharing”: it is calendars + events +
import + holidays + directory + sharees.

| Work | Effort | Notes |
|------|--------|--------|
| Extract `CalendarRoutes` / `ContactRoutes` / `ItemRoutes` from `App::dispatch` (same pattern as files/admin) | **M** | Behavior freeze; tests are the safety net from §1 |
| Split `ShareService` → `CalendarService` + `EventService` + `ShareService` + `CalendarImportService` | **L** | Highest PHP maintainability win; keep public methods stable for one release |
| Split `ContactService` (vCard CRUD vs import/export/photo) | **M** | Parallel to calendar split |
| Typed properties / constructor promotion on Portal classes (PHP 8.2) | **M** | Enables PHPStan to actually help |
| Thin `JsonRequest` / `BinaryResponse` helpers out of `App.php` | **S** | `jsonBody`, `streamFileDownload`, CSRF, origin — reusable and testable |

Stay away from rewriting Sabre backends. Portal services should keep calling
`Sabre\CalDAV\Backend\PDO`.

---

## 3. Portal SPA — **L** (incremental, not a rewrite)

Architecture today: `mountApp` builds a ~140-field `AppOrchestrator`, domains
render **HTML strings**, `home.ts` does `root.innerHTML = …` every time. That is
why focus, PDF iframes, and indeterminate checkboxes need `afterRender.ts`. It
works; replacing it wholesale is **XL** and high risk.

| Work | Effort | Notes |
|------|--------|--------|
| Delete unused `APP_STATE_KEYS` (~100 string literals, never imported) | **S** | Leftover from identifier-rewrite |
| Split `api.ts` (~1478 lines) by domain: `api/files.ts`, `api/calendars.ts`, … | **M** | Same `request()` helper; easier reviews |
| Shrink `AppOrchestrator`: domains already have `*Host`; stop adding every loader/render onto `o` | **M** | New features should take `FilesHost`/`CalendarsHost` only |
| Isolate “destructive re-render”: preview/upload progress already fight innerHTML; optional: don’t rebuild the whole tab when only a modal changes | **M** | Biggest UX win without a framework |
| `styles.css` ~4k: split per domain (`files.css`, `admin.css`) via Vite | **S** | Cosmetic unless you are editing CSS weekly |
| A11y pass: file-row actions overflow, modal focus trap, `aria-expanded` on View | **M** | Month grid and files table are the worst |
| Vitest for `classifyFilesPreview`, `basenamePath`, holiday/date helpers | **S** | Pairs with §1 |

**Do not** migrate to React/Preact unless you budget **XL** and freeze features.
The 2.2.0 split already solved the original `app.ts` monolith.

---

## 4. Local Docker / operator DX — **M**

Typical pitfalls: image tag ≠ container name; bind dirs created as **root**;
`BAIKAL_SKIP_CHOWN=1` skips the entrypoint chown.

| Work | Effort | Notes |
|------|--------|--------|
| `docs/local.compose.yaml` (or repo-root compose) with `angaradav-local`, port 31088, named volumes **or** a `./.local-run` path + documented `chown 101:101` | **S** | Stops `docker rm angaradav` confusion |
| Entrypoint: if skip-chown and dirs not writable by 101, **fail loudly** (there is already a warning in `25-check-baikal-persistence.sh`; installer UI is the only hint today) | **S** | Matches the “Permissions required” screen |
| Makefile: `dist` still zips `baikal-$(VERSION).zip`; rename targets, add `make portal` / `make php-test` | **S** | `BUILD_DIR="build/baikal"` is leftover |
| Document: `--name` is independent of `angaradav:local`; TrueNAS recreate vs restart for `nginx.conf` | **S** | Short “Local run” in README |
| Host `portal/node_modules` must not be root-owned (blocks Vite cache) | **S** | Ops, not code |

---

## 5. Product features (not refactors) — pick by user value

Docs already list the file-home **non-goals**. Treat these as product PRs, each
with its own design:

| Feature | Effort | Notes |
|---------|--------|--------|
| Calendar **week / agenda** view | **L** | Month grid only (`listEvents` is from/to range — backend is ready-ish) |
| Calendar event **search** | **M** | Contacts already search |
| Files **search** / sort / type filter | **M** | List is path-only today |
| Files sharing / public links | **XL** | Explicitly out of scope; ACL model is owner-only |
| Files trash / versions | **L–XL** | Quarantine exists for **deleted users**, not user trash |
| WebDAV-Push for files | **L** | Push is CalDAV/CardDAV only |
| Office/doc preview | **L** | Would need extra libs; current viewer is the right scope |
| Notes rich text | **L** | VJOURNAL plain description |
| Recurring-task UX polish | **M** | RRULE exists for events |

---

## 6. Legacy and branding — **L–XL**, low priority

| Work | Effort | Risk |
|------|--------|------|
| Flake ORM + Formal forms still in tree (`Core/Frameworks/Flake`, `Formal`) after classic admin removal | **XL** to delete | DAV/install still bootstraps `Flake\Framework`; needs a dependency audit first (**M** just to map) |
| PHPStan ignores for Flake (`Exception not found`, LessPHP) | Goes away only after Flake shrink |
| Default `auth_realm` `BaikalDAV` | **S** to change for **new** installs; **L** if existing Digest hashes must keep working | Compatibility landmine — leave unless you have a migration |
| `html/` path `/var/www/baikal` | Do not change | Docker/TrueNAS contract |
| Docs still say “parallel with classic `/admin/`” in places | **S** | Classic UI is redirects only |

---

## 7. Security / ops polish — **M**

Already strong: CSRF, origin, admin role on every `/api/admin/*`, no secret
mass-assign (`AdminSecurityReviewTest`), Push SSRF allowlist, file symlink
refusal.

| Work | Effort |
|------|--------|
| Content-Security-Policy: `frame-src blob:` is required for PDF preview; document “recreate image” in DEPLOYMENT | **S** |
| Rate-limit portal file **download/view** the same way as login if session-cookie abuse is a concern | **S** |
| Health: `filesStorageReady` exists; config-writable is already reported — surface in TrueNAS app notes | **S** |
| PHP 8.6 in CI matrix is good; keep nginx image + PHP 8.2 in Docker in sync with a documented upgrade path | **M** when you bump runtime PHP |

---

## Suggested PR stack (first quarter of work)

Concrete order that stays shippable:

| PR | Title | Effort |
|----|--------|--------|
| 1 | CI: portal `tsc` + Vite build | **S** |
| 2 | Shared PHP test bootstrap; `composer test` runs `tests/php/*` | **S** |
| 3 | File preview PHP/API tests + MIME allowlist lock | **S** |
| 4 | Delete `APP_STATE_KEYS`; split `api.ts` | **M** |
| 5 | Extract calendar/contact route methods from `App.php` | **M** |
| 6 | Split `ShareService` (calendars vs import vs shares) | **L** |
| 7 | Local compose + README “how to run” + skip-chown fail | **S** |
| 8 | PHPStan level 2 on `Baikal\Portal` | **M** |
| 9 | `portal_admin_e2e` in CI | **M** |

PRs 1–4 + 7 are the cheap, high-confidence band (**~2 weeks** calendar time).
5–6–8 are the real maintainability play (**~3–5 weeks**). 9 depends on 2.

---

## Out of scope / do not put on the roadmap

- SPA framework rewrite
- Renaming `Baikal\` / `BAIKAL_*` / `/var/www/baikal`
- Deleting Flake in one shot
- File sharing / public links without a design doc
- Raising PHPStan to 8 across Flake + Twig + Sabre wrappers

Highest-leverage start: **PR 1 (portal in CI)** plus **PR 7 (local
compose/permissions)** so local image rebuilds and PRs cannot silently skip the
TypeScript app.
