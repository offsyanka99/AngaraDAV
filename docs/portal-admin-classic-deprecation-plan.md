# Classic Web Admin (`/admin/`) — deprecation plan

**Status:** Planning only — **no code removal** under this document.  
**Product version:** 2.0.0 (`release/2.0.0-portal-admin`)  
**Related:** [`portal-admin-integration-scope.txt`](portal-admin-integration-scope.txt),  
[`DEPLOYMENT.md` — Portal Administration](DEPLOYMENT.md#portal-administration-parallel-with-classic-admin),  
[`portal-admin-security-checklist.md`](portal-admin-security-checklist.md)

---

## 1. Intent

AngaraDAV **2.0.0** ships **dual admin**:

| Surface | Role |
|---------|------|
| **Portal Administration** (`/portal/` → Administration, `/api/admin/*`) | Day-to-day ops for Admin-role DAV users |
| **Classic Web Admin** (`/admin/`) | Full Formal/Twig UI; recovery path; sole writer for high-risk items until criteria below are met |
| **Installer** (`/admin/install/`) | Bootstrap / upgrade — **out of day-to-day deprecation** (Phase 10) |

Deprecation means: **announce → dual-run → optionally hide classic day-to-day UI** — not delete the stack in the same release as announcement.

**Non-goals (this plan):**

- Removing `/admin/install/`
- Merging classic admin password into DAV credentials
- Forcing a cutover in 2.0.0

---

## 2. Current parity (baseline for “green”)

| Area | Portal 2.0.0 | Classic `/admin/` | Deprecation-ready? |
|------|--------------|-------------------|--------------------|
| Dashboard / overview | Yes (read) | Yes | Yes if metrics stay aligned |
| Users list / create / edit / delete | Yes | Yes | Yes if e2e + authz CI green |
| Per-user calendars | Yes | Yes | Yes if e2e green |
| Per-user address books | Yes | Yes | Yes if e2e green |
| System settings (YAML) | Yes | Yes | Yes if save/load e2e + audit ops path known |
| Database settings **write** | **No** (read-only; writes **403**) | **Yes** | **No** — product must either ship portal write (gated) **or** permanently keep classic for DB write |
| Installer / version upgrade | No | Yes (`/admin/install/`) | **Keep classic permanently** (or Phase 10 later) |
| Login for classic password | N/A | Yes | Keep while classic UI exists |

**Product decision already recorded (Phase 8):** portal database **write is deferred / classic-only**. That is an acceptable permanent split **if** operators are told DB credential changes stay on classic forever (or until a later program).

---

## 3. Exit criteria before announcing classic day-to-day deprecation

All boxes must be checked **before** any release notes that say “classic day-to-day admin is deprecated”.

### 3.1 Feature matrix

- [ ] Dashboard numbers match classic for a reference install (documented QA or automated compare)
- [ ] Users full CRUD via portal only (create / password change / delete + file quarantine)
- [ ] Per-user calendars + address books CRUD via portal only
- [ ] System settings full save cycle via portal (no YAML corruption; `configWritable` OK)
- [ ] Database: **either** portal write shipped with CONFIRM gate **or** explicit “classic-only forever” decision in release notes
- [ ] Installer path documented as remaining on `/admin/install/`

### 3.2 Automated tests

- [ ] Unit: `AdminAuth`, users, resources, settings, security review (already in tree)
- [ ] **Authz e2e (required):** anonymous → 401, non-admin → 403, admin → 200 for representative `/api/admin/*` routes (Python or PHP HTTP suite in CI)
- [ ] **Critical write e2e (required):** create user, change password, delete user (quarantine path if files enabled); toggle a low-risk system flag (e.g. `notes_enabled`) and re-read YAML
- [ ] Classic MechanicalSoup `/admin/` suite still green (regression guard during dual-run)
- [ ] Optional: portal SPA smoke (login as Admin, open `#admin/users`)

### 3.3 Dual-run period

- [ ] At least **one full release cycle** (e.g. 2.0.0 dual → 2.x.y still dual) with portal admin as **recommended** path and classic as **supported fallback**
- [ ] No open P0 on portal admin (authz bypass, data loss on user delete, YAML brick)
- [ ] Ops can diagnose failed settings save (`PORTAL_LOG_LEVEL=warn|info`, `portal_debug.log`) — see DEPLOYMENT observability section

### 3.4 Documentation & announcement

- [ ] RELEASE NOTES draft prepared (see §5)
- [ ] DEPLOYMENT.md still documents both UIs and Admin role grant
- [ ] TrueNAS compose comments still mention classic recovery URL
- [ ] Security checklist still required for any remaining `/api/admin/*` changes

### 3.5 Safety / flags (optional before full hide)

- [ ] Optional flag to **hide** classic day-to-day nav (e.g. env / `system.classic_admin_ui_enabled`) while leaving `/admin/` and install reachable for recovery — **not implemented yet**
- [ ] Portal `portal_admin_ui_enabled` remains the switch for portal shell only

---

## 4. Phased deprecation timeline (no code yet)

| Phase | When | What ships |
|-------|------|------------|
| **A — Dual-run (now, 2.0.0)** | Current | Both UIs fully supported. Portal recommended for day-to-day. Classic required for DB **write** and install. |
| **B — Soft deprecation announce** | Next release **after** §3 green | Release notes: “classic day-to-day UI deprecated; still supported this cycle.” Portal is default in docs. No route removal. |
| **C — Soft hide (optional)** | Following cycle if B went well | Classic day-to-day screens behind flag or footer-only “legacy admin”; install + recovery still documented. |
| **D — Hard deprecation (optional, separate decision)** | Only after C + zero support load | Remove day-to-day classic controllers/templates **except** `/admin/install/` (and possibly a minimal recovery login). **Not scheduled.** |

**Installer policy:** Prefer **keep `/admin/install/` permanently** on the classic stack (Phase 10 default). Do not block deprecation of day-to-day admin on an SPA installer.

---

## 5. Announcement draft (copy when §3 is green)

> **Classic Web Admin day-to-day UI — soft deprecation**  
>  
> Starting with AngaraDAV *X.Y.Z*, the recommended way to manage users, calendars, address books, and system settings is the **portal Administration** section (`/portal/`, Admin-role DAV user).  
>  
> Classic `/admin/` remains **fully supported** in this release as a fallback.  
> Database connection **writes** and the **installer** (`/admin/install/`) stay on the classic stack.  
>  
> Grant portal Admin role with `PORTAL_ADMIN_USERS` or `system.portal_admin_users` (default: DAV user `admin`).  
> See docs/DEPLOYMENT.md § Portal Administration.

Do **not** publish this text until §3 checkboxes are done.

---

## 6. Rollback / recovery during dual-run

| Issue | Action |
|-------|--------|
| Portal admin bug / 403 | Use classic `/admin/` (admin password); fix Admin role env/YAML |
| Portal settings save fails | Classic System Settings; check `health.php` `configWritable`; see observability playbook |
| Portal user delete incomplete | Classic Users; verify file quarantine; file issue with audit log lines |
| Need install/upgrade | Always `/admin/install/` (or image re-deploy policy) |

---

## 7. Explicit non-removal list (until Phase D)

Do **not** delete without a new ADR:

- `Core/Frameworks/BaikalAdmin/**` day-to-day controllers
- `/admin/` and `/admin/install/` entrypoints
- Classic session/CSRF for admin password login
- MechanicalSoup tests against classic HTML (until portal e2e replaces them)

---

## 8. Checklist summary (Step 9.3 exit criteria)

| Deliverable | Status |
|-------------|--------|
| Written deprecation checklist (this file) | **Done** |
| Criteria: matrix green + CI e2e + dual-run cycle | **Defined** (not yet all checked — dual-run starts at 2.0.0) |
| Installer remains classic unless Phase 10 | **Recorded** |
| No code removal of classic `/admin/` | **Confirmed** |

---

## 9. Open decisions (track before Phase B)

1. **Database write:** permanent classic-only vs future gated portal write.  
2. **Soft-hide flag:** implement `classic_admin_ui_enabled` or rely on docs only.  
3. **E2E ownership:** Python HTTP tests vs PHP integration vs both in CI.

When decisions land, update this file’s open list and the feature matrix in DEPLOYMENT.md.
