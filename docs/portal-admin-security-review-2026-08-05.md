# Portal Administration & Install — Security Review

**Date:** 2026-08-05  
**Scope:** `/api/admin/*`, `/api/install/*`, portal SPA admin/install surfaces, post-Formal-cutover posture  
**Related:** [`portal-admin-security-checklist.md`](portal-admin-security-checklist.md), [`portal-admin-cutover.md`](portal-admin-cutover.md)

---

## 1. Executive summary

| Area | Verdict |
|------|---------|
| Admin API authz (`requireAdmin`) | **Strong** — single gate before all `/api/admin/*` |
| CSRF + same-origin on mutations | **Strengthened** this review (fail-closed if no Origin/Referer) |
| Secret leakage in JSON | **Strong** — allow-lists; no digesta1 / hashes / DB passwords |
| Install bootstrap (unauthenticated) | **Highest residual risk** — acceptable only with network restriction + install lock |
| Factory reset | **High impact by design** — Admin-only + confirm; wipe is complete |
| DB credential write | **Acceptable with CONFIRM** — can still brick instance if misused |

**Overall:** Day-to-day portal admin is in good shape for a self-hosted DAV product. The main residual risks are **unauthenticated install when unlocked**, **admin power tools** (reset / DB rewrite), and **DAV Digest MD5** (protocol constraint).

---

## 2. What was reviewed

| Component | Path |
|-----------|------|
| Admin route gate | `Portal/App.php` → `requireAdmin` → `dispatchAdminRoutes` |
| Admin role | `Portal/AdminAuth.php` |
| Session / CSRF / login rate limit | `Portal/Auth.php` |
| Users / resources | `Portal/Admin/AdminUserService.php`, `AdminUserResourceService.php` |
| System + DB settings + reset | `Portal/Admin/AdminSettingsService.php` |
| Install API | `Portal/Install/InstallApp.php`, `InstallService.php` |
| Schema upgrade | `Portal/Install/SchemaUpgrade.php` |
| Public entry | `html/api/index.php`, `html/index.php`, nginx |
| Automated checks | `AdminSecurityReviewTest`, `AdminAuthzRoutesTest`, install/settings unit tests |

---

## 3. Strengths (controls working)

1. **Central admin authz** — every `/api/admin/*` path goes through `AdminAuth::requireAdmin()`; dispatcher is `private`.
2. **CSRF on mutations** — session CSRF + header; install has separate CSRF session key.
3. **Mass-assignment resistance** — forbidden secret keys; editable allow-lists for system settings.
4. **No secrets in GET** — digesta1, admin_passwordhash, pgsql_password, encryption_key never returned.
5. **Confirm gates** — user/resource delete `confirm`; DB write `CONFIRM`; reset `confirm: true`.
6. **Install lock env** — `BAIKAL_LOCK_INSTALL` / `BAIKAL_ALLOW_REINSTALL` / `INSTALL_DISABLED`.
7. **Rate limits** — portal login, install mutations (30/15m/IP), admin password change via settings.
8. **Audit** — mutations logged without secrets; failures at WARN.
9. **Formal admin UI removed** — smaller attack surface; redirects only.

---

## 4. Findings (bugs & weak points)

Severity: **Critical / High / Medium / Low / Info**

### H1 — Install API is unauthenticated bootstrap (accepted product risk)

**Where:** `POST /api/install/*` when installer is open (no `INSTALL_DISABLED`, or reinstall path).

**Issue:** Anyone who can reach the HTTP port can reconfigure the instance if the installer is unlocked.

**Mitigation today:** CSRF + same-origin (hardened) + rate limit + `BAIKAL_LOCK_INSTALL=1` in production.

**Required ops:**  
- Never expose install to the internet without lock.  
- After install, ensure `INSTALL_DISABLED` and prefer `BAIKAL_LOCK_INSTALL=1`.

---

### H2 — Same-origin check previously allowed empty Origin+Referer

**Where:** `App::assertSameOrigin`, `InstallApp::assertSameOrigin`.

**Issue:** If both headers were omitted, check passed. Combined with stolen CSRF (or install session), non-browser clients could mutate more easily.

**Fix applied:** Fail closed with **403 Missing Origin or Referer** on state-changing requests when both are absent.

**Test impact:** Portal e2e helpers now send `Origin`/`Referer`.

---

### H3 — Factory reset is full wipe for any Admin-role user

**Where:** `AdminSettingsService::resetToDefault`.

**Issue:** Any portal Admin can destroy DB + files + config (yaml backup only).

**Mitigation:** confirm flag; install lock env can block re-open; UI warning.

**Recommendation:** Optional second factor (re-type password) or restrict reset to env allow-list — not implemented.

---

### H4 — DB settings write can offline the instance

**Where:** `updateDatabaseSettings` + CONFIRM.

**Issue:** No live connection test before write; wrong path/host bricks app until fixed via volume/yaml restore.

**Mitigation:** CONFIRM gate; docs; yaml backup only on full reset (not on DB patch).

**Recommendation:** Optional “test connection” before save (future).

---

### M1 — Install holds plaintext admin password in session

**Where:** `baikal_install_admin_password` session key between initialize and database.

**Issue:** Session store (files) holds cleartext until database step completes / clears.

**Mitigation:** Cleared after database step; session cookie HttpOnly + SameSite=Lax.

**Recommendation:** Prefer one-shot encrypted token or re-prompt password on database step (future).

---

### M2 — Weak encryption_key generation (fixed)

**Where:** Install + DB settings when generating new key.

**Was:** `md5(microtime() . random_int(...))` (low entropy / non-crypto).

**Fix applied:** `bin2hex(random_bytes(32))`.

---

### M3 — Last-user delete lockout (hardened)

**Where:** `AdminUserService::deleteUser`.

**Issue:** Deleting all users leaves no portal login.

**Fix applied:** Refuse delete when only one user remains (`Cannot delete the last remaining user account`).

**Residual:** Can still delete other admins if multiple users exist; no “last Admin role” check (env-based role).

---

### M4 — Admin role is env/YAML list (not capability object)

**Issue:** Mis-set `PORTAL_ADMIN_USERS` can leave only non-admin DAV users with no Administration UI (login still works).

**Mitigation:** Documented; install sets YAML `portal_admin_users: admin` when env unset.

---

### M5 — DAV Digest stores MD5 A1 digests

**Where:** Portal login + SabreDAV.

**Issue:** Protocol-level MD5; offline cracking if DB leaks.

**Mitigation:** Prefer TLS; optional Basic over HTTPS; realm not secret.

**Not a portal bug** — design of Digest DAV.

---

### L1 — Install GET status information disclosure

**Issue:** Unauthenticated `GET /api/install/status` returns paths, drivers, version, step, lock state.

**Risk:** Low reconnaissance value.

**Acceptable** for bootstrap UX.

---

### L2 — Error messages mention lock env vars

**Issue:** Messages reference `BAIKAL_LOCK_INSTALL` / `BAIKAL_ALLOW_REINSTALL`.

**Risk:** Helps attackers know which env to look for on compromised host.

**Acceptable** for operator UX.

---

### L3 — Checklist / tests were stale vs DB write

**Issue:** `AdminSecurityReviewTest` still expected `writeEnabled === false`.

**Fix applied:** Expect write enabled + CONFIRM required.

---

### I1 — No rate limit on admin user password changes

**Issue:** Only classic-admin-password-via-settings is rate-limited; per-user DAV password via admin API is not.

**Risk:** Low (requires Admin role).

---

### I2 — CSRF token also accepted in install POST body

**Where:** InstallApp reads `csrfToken` from JSON body as fallback.

**Risk:** Slightly broader CSRF surface than header-only; still needs session cookie + origin.

**Acceptable** for simple clients.

---

## 5. Fixes applied in this review

| Fix | Status |
|-----|--------|
| Fail-closed same-origin (Origin or Referer required) | Done — App + InstallApp |
| Stronger `encryption_key` generation | Done — `random_bytes(32)` |
| Block deleting last user | Done |
| Security review test updated for DB CONFIRM | Done |
| Install “classic Web Admin” message removed | Done |
| E2E helpers send Origin/Referer | Done |

---

## 6. Recommended operator hardening (production)

1. Set **`BAIKAL_LOCK_INSTALL=1`** after first successful install.  
2. Do **not** set `BAIKAL_ALLOW_REINSTALL` except during intentional recovery.  
3. Put TLS in front of the app; do not expose install to the public internet while unlocked.  
4. Restrict who is in **`PORTAL_ADMIN_USERS`**.  
5. Back up **config + Specific** before Reset to Default or DB CONFIRM saves.  
6. Run with non-root PHP (nginx user) and writable volumes only under config/Specific.

---

## 7. Recommended follow-up engineering

| Priority | Item | Status |
|----------|------|--------|
| P1 | Optional “test DB connection” before YAML write | **Done** — `POST /admin/settings/database/test` + auto-probe before CONFIRM save |
| P1 | Re-prompt password on install database step (avoid session plaintext) | **Done** — password required on database step; no longer stored across steps |
| P2 | Block deleting the last user who holds Admin role (env list aware) | **Done** — `AdminUserService::deleteUser` + env/YAML/default admin |
| P2 | Rate-limit admin user password resets | **Done** — IP rate limit on DAV user password change (10/15m) |
| P3 | Require re-auth (password) for Reset to Default | **Done** — `password` required; verified via digesta1 |
| P3 | Content-Security-Policy already on nginx — keep `connect-src 'self'` | Already in place |

---

## 8. Sign-off

| Criterion | Status |
|-----------|--------|
| Admin routes behind `requireAdmin` | ✅ |
| CSRF + same-origin on mutations | ✅ (hardened) |
| Secrets not in GET JSON | ✅ |
| Mass-assignment controls | ✅ |
| Install lock model documented | ✅ |
| Automated security tests green | ✅ (after checklist test fix) |
| Residual risks recorded | ✅ this document |

**Reviewer conclusion:** Safe to run portal-primary admin with production install lock. Treat open installer and Admin-role holders as full trust. No Critical code defects found after the hardenings above; residual High items are product/ops surface area, not silent authz bypasses.
