# Portal Admin API — Security review checklist (Phase 9.1)

**Status:** Complete (2026-08-05)  
**Scope:** All `/api/admin/*` routes under `Baikal\Portal\App::dispatchAdminRoutes`  
**Related:** threat model in `docs/portal-admin-integration-scope.txt` §0.4  

Use this checklist for every PR that touches `Core/Frameworks/Baikal/Portal/App.php` (admin routes), `AdminAuth`, or `Portal/Admin/*`.

---

## 1. Authorization (privilege escalation)

| Check | Status | Notes |
|-------|--------|--------|
| Every `/api/admin/*` path requires `AdminAuth::requireAdmin()` | ✅ | Single gate in `App::dispatch()` before `dispatchAdminRoutes()` |
| Non-admin authenticated DAV user → **403** | ✅ | `AdminAuth::requireAdmin()` |
| Anonymous / expired session → **401** | ✅ | Via `Auth::requireUser()` inside `requireAdmin()` |
| UI hiding is **not** the only control | ✅ | SPA hides nav; API still enforces |
| No second public entry into `dispatchAdminRoutes` | ✅ | `private`; only called after `requireAdmin` |
| Grep for new admin handlers outside the gate | ✅ | No other `/admin` JSON handlers under `Portal/` |

**PR rule:** Never register an admin path after `$username = $this->auth->requireUser()` without also calling `requireAdmin()`. Prefer only adding routes inside `dispatchAdminRoutes()`.

---

## 2. CSRF & same-origin (mutations)

| Check | Status | Notes |
|-------|--------|--------|
| POST/PUT/PATCH/DELETE require same-origin | ✅ | `assertSameOrigin()` before admin branch |
| POST/PUT/PATCH/DELETE require CSRF when session exists | ✅ | `assertCsrf()` for all mutations with session |
| GET admin routes do not require CSRF | ✅ | Read-only |
| SPA sends `X-CSRF-Token` on mutations | ✅ | `portal/src/api.ts` |

---

## 3. Secret disclosure (responses)

| Secret | Must not appear in JSON | Status |
|--------|-------------------------|--------|
| `users.digesta1` | Never | ✅ `AdminUserService` list/get map only public fields |
| User password | Never | ✅ Write-only body fields |
| `system.admin_passwordhash` | Never | ✅ `hasAdminPassword` only |
| `database.pgsql_password` | Never | ✅ `hasPassword` only |
| `database.encryption_key` | Never | ✅ `hasEncryptionKey` only |
| Audit log passwords | Never | ✅ `AdminAudit` strips pass/digest/secret/token/hash keys |

**PR rule:** Any new “get” serializer must use an explicit allow-list of fields (not `SELECT *` → json).

---

## 4. Mass-assignment (PATCH/POST bodies)

| Endpoint | Allowed body surface | Status |
|----------|----------------------|--------|
| `POST /admin/users` | username, displayname, email, password, passwordConfirm | ✅ |
| `PATCH /admin/users/{u}` | displayname, email, password*, passwordConfirm* | ✅ Username immutable; digesta1 rejected |
| `POST/PATCH …/calendars` | uri (create), displayname, description, color, todos, notes | ✅ |
| `POST/PATCH …/addressbooks` | uri (create), displayname, description | ✅ |
| `PATCH /admin/settings/system` | Allow-list `EDITABLE_KEYS` + password pair | ✅ Forbidden secret keys → **400** |
| `PATCH/PUT/POST /admin/settings/database` | N/A | ✅ Always **403** (write deferred) |

\* Empty password = leave unchanged.

**PR rule:** Do not loop `foreach ($body as $k => $v)` into config/DB without an allow-list.

---

## 5. Input validation & path safety

| Check | Status |
|-------|--------|
| Username charset / no path separators | ✅ |
| Email validation | ✅ |
| Calendar/AB URI token (`[a-z0-9-]+`) | ✅ |
| Color `#RRGGBB` / `#RRGGBBAA` | ✅ |
| Push external URL HTTPS when push enabled | ✅ |
| `files_storage_path` absolute, no `..` / NUL | ✅ (Phase 9.1) |
| Delete requires `confirm=true` | ✅ Users, calendars, ABs |

---

## 6. Rate limiting

| Surface | Status |
|---------|--------|
| Portal login | ✅ Existing `Auth` IP rate limit |
| Classic admin password change via portal settings | ✅ **Phase 9.1:** 10 / 15 min / IP → `Specific/portal_admin_password_rate.json` (**429**) |
| DAV user password change via admin API | Not rate-limited separately (admin-only; consider later) |

---

## 7. Audit logging

| Check | Status |
|-------|--------|
| Mutations log actor/action/target/result | ✅ `AdminAudit` on create/update/delete user, resources, settings |
| Failures also audited (error:status) | ✅ At **WARN** (visible with `PORTAL_LOG_LEVEL=warn`) |
| Successes at INFO | ✅ Needs `info` or `debug` |
| Settings save extra ops lines | ✅ `admin settings save ok|failed` (+ non-secret `keys=`) |
| No secrets in audit lines | ✅ |
| `/health.php` / `/info.php` unchanged | ✅ No audit data on public endpoints |

Enable: `PORTAL_LOG_LEVEL=warn` (failures) or `info` (success+failures) → `Specific/portal_debug.log`.  
Ops playbook: [DEPLOYMENT.md — Observability](DEPLOYMENT.md#observability-diagnose-a-failed-portal-settings-save).

---

## 8. Route inventory (authz = requireAdmin for all)

| Method | Path | Authz | CSRF | Notes |
|--------|------|-------|------|-------|
| GET | `/api/admin/ping` | Admin | — | Smoke |
| GET | `/api/admin/dashboard` | Admin | — | Stats |
| GET | `/api/admin/capabilities` | Admin | — | Feature matrix |
| GET | `/api/admin/settings/system` | Admin | — | No password hash |
| PATCH/PUT | `/api/admin/settings/system` | Admin | Yes | Allow-list + rate-limit password |
| GET | `/api/admin/settings/database` | Admin | — | Read-only; no password |
| POST/PUT/PATCH/DELETE | `/api/admin/settings/database` | Admin | Yes | **403** write deferred |
| GET | `/api/admin/users` | Admin | — | No digesta1 |
| POST | `/api/admin/users` | Admin | Yes | Create |
| GET | `/api/admin/users/{u}` | Admin | — | Detail |
| PATCH/PUT | `/api/admin/users/{u}` | Admin | Yes | Update |
| DELETE | `/api/admin/users/{u}` | Admin | Yes | `confirm` required |
| GET/POST | `/api/admin/users/{u}/calendars` | Admin | POST yes | Per-user cal |
| GET/PATCH/DELETE | `/api/admin/users/{u}/calendars/{id}` | Admin | mut yes | |
| GET/POST | `/api/admin/users/{u}/addressbooks` | Admin | POST yes | Per-user AB |
| GET/PATCH/DELETE | `/api/admin/users/{u}/addressbooks/{id}` | Admin | mut yes | `force` for non-empty |

Unknown admin paths → **404** (not 403).

---

## 9. Automated regression

```bash
php tests/php/AdminAuthTest.php
php tests/php/AdminSecurityReviewTest.php
php tests/php/AdminUserServiceTest.php
php tests/php/AdminSettingsServiceTest.php
```

---

## 10. Residual risks (accepted / deferred)

| Risk | Mitigation / decision |
|------|------------------------|
| Dual UI config races (portal + classic settings) | Documented last-write-wins |
| Admin can delete own DAV account | Classic behavior; no self-delete block |
| DB settings write | Deferred classic-only (Phase 8) |
| SSRF via `push_external_url` | HTTPS-only; URL not fetched by settings save |
| Installer unauthenticated bootstrap | Out of scope (Phase 10) |

---

## Sign-off (Step 9.1 exit criteria)

- [x] Grep: all admin routes behind `requireAdmin`
- [x] Mass-assignment reviewed (allow-lists + forbidden secret keys)
- [x] Optional rate-limit for admin password change implemented
- [x] Checklist recorded for PR reviews (`docs/portal-admin-security-checklist.md`)
