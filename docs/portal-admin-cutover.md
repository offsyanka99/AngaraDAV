# Portal-only admin cutover

**Status:** Classic Formal Web Admin **UI removed** (2.0.0 branch)  
**Date:** 2026-08-05

## What was removed

| Removed | Replacement |
|---------|-------------|
| Formal day-to-day UI (`BaikalAdmin` Controllers / Views / Routes / Templates / Resources) | Portal **Administration** (`/portal/#admin…`) |
| Classic login at `/admin/` (HTML form) | Portal DAV login + Admin role |
| Classic installer wizard pages | **`/portal/install/`** + `/api/install/*` |

## What remains (on purpose)

| Path / code | Role |
|-------------|------|
| `html/admin/index.php` → redirect **302** `/portal/#admin` | Bookmarks / reverse proxies |
| `html/admin/install/` → redirect **302** `/portal/install/` | Bookmarks / upgrade links |
| `Baikal\Core\AdminPassword` | Hash/verify `admin_passwordhash` for settings/install |
| `Baikal\Portal\Install\SchemaUpgrade` | DB schema migrations on version upgrade |
| Formal package | Still used by some `Baikal\Model\Config\*` morphology helpers (not admin HTML) |
| `admin_passwordhash` in `baikal.yaml` | Still set by install / system settings (not portal DAV digesta1) |

## Product entry points (canonical)

| Need | URL |
|------|-----|
| End-user app | `/portal/` |
| Administration | `/portal/` → user menu → **Administration** (`#admin`, `#admin/settings`, `#admin/users`, `#admin/database`) |
| Install / reinstall / upgrade | `/portal/install/` |
| JSON API | `/api/…`, `/api/admin/*` (Admin role) |
| CalDAV/CardDAV/WebDAV | `/dav.php/` |

## P0–P3 status (executed)

### P0 — correctness & CI

| # | Item | Status |
|---|------|--------|
| 1 | Portal API helpers + e2e (`tests/portal_api_helpers.py`, `tests/portal_admin_e2e.py`) | **Done** (live-server pytest) |
| 2 | Authz static/route tests (`tests/php/AdminAuthzRoutesTest.php`) | **Done** |
| 3 | Install service unit tests + e2e install path | **Done** (unit); e2e when server up |
| 4 | Image rebuild | **Ops:** rebuild `angaradav:local` / release image to bake tree |

Classic MechanicalSoup suite remains **skipped** via `require_classic_admin()` in `test_helpers.py`.

### P1 — operator experience

| # | Item | Status |
|---|------|--------|
| 5 | `PORTAL_ADMIN_USERS` docs in install + DEPLOYMENT | **Done** |
| 6 | Root `/` → `/portal/` or `/portal/install/` | **Done** (`html/index.php`) |
| 7 | Nginx `location = /admin` → `/portal/` | **Done** (`docker/nginx.conf`) |
| 8 | SECURITY + compose portal-first | **Done** (prior + cutover) |

### P2 — cleanup debt

| # | Item | Status |
|---|------|--------|
| 9 | Formal morphology | **Deferred** — still used by Config model helpers; not admin HTML |
| 10 | Redirect under `html/admin/*.php` (no Formal UI) | **Done** |
| 11 | `BaikalAdmin/README.md` stub | **Done** |
| 12 | Deprecation plan marked hard cutover | **Done** |
| 13 | `services.administration` + legacy `webAdmin` | **Done** |

### P3 — hardening

| # | Item | Status |
|---|------|--------|
| 14 | Password mental model in install + system settings UI | **Done** |
| 15 | Install rate-limit + DB save audit (existing) | **Verified** |
| 16 | Reset to Default backup note in UI | **Done** |

## Verification checklist

- [x] `/admin/` → `/portal/` (PHP + nginx)
- [x] `/admin/install/` → `/portal/install/`
- [x] `/` → portal or install
- [x] No Formal controllers/templates for Users/Settings/Dashboard
- [x] Portal unit tests green
- [x] Portal e2e suite added (live)
- [ ] Rebuild production Docker image and smoke fresh install

## Risk notes

- **External monitors** that scrape classic HTML will break — switch to `/info.php` / portal.
- **Operators** with only the classic admin password and **no** DAV Admin-role user cannot manage the server until they use install Reset or fix `PORTAL_ADMIN_USERS` / create a DAV admin.
- **Schema upgrades** still run via portal install API using `SchemaUpgrade` (same migrations as before).
