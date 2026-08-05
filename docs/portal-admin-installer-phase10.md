# Phase 10 — Portal installer (`/portal/install/`)

**Status:** **Implemented** (2.0.0) — product elevated Step 10.2  
**Product version:** 2.0.0 (`release/2.0.0-portal-admin`)  
**Scope source:** [`portal-admin-integration-scope.txt`](portal-admin-integration-scope.txt) § Phase 10  
**Related:** [`DEPLOYMENT.md`](DEPLOYMENT.md), [`portal-admin-security-checklist.md`](portal-admin-security-checklist.md)

---

## 1. Decision (updated)

| Item | Decision |
|------|----------|
| **Canonical installer URL** | **`/portal/install/`** (SPA + `/api/install/*`) |
| **Classic `/admin/install/`** | **302 redirect** to `/portal/install/` (bookmarks kept) |
| **Framework auto-redirect** | `Baikal\Framework::installTool()` → `/portal/install/` |
| **Portal Admin Reset to Default** | Redirects to `/portal/install/` |

---

## 2. Architecture

```
Browser  →  /portal/install/     (static SPA shell, same Vite bundle as portal)
         →  /api/install/*       (PHP InstallApp; BAIKAL_CONTEXT_INSTALL; no requireAdmin)

Same domain: baikal.yaml + Specific/INSTALL_DISABLED + PDO schema
```

| Endpoint | Auth | Purpose |
|----------|------|---------|
| `GET /api/install/status` | none (session CSRF issued) | Step machine + defaults + permissions |
| `POST /api/install/initialize` | CSRF + same-origin | System settings + admin password (classic hash + session for DAV bootstrap) |
| `POST /api/install/database` | CSRF + same-origin | SQLite/PgSQL + schema + **DAV user `admin`** + `INSTALL_DISABLED` |
| `POST /api/install/upgrade` | CSRF + same-origin + `confirm` | Version schema upgrade |

After a successful install, **portal login** is username **`admin`** with the same password as classic `/admin/`.  
Portal **Reset to Default** fully wipes config, database (users/data), WebDAV files, and install lock (yaml backup only).

### Steps (`status.step`)

| Step | Meaning |
|------|---------|
| `permissions` | config/ or Specific/ not writable |
| `initialize` | missing yaml / version / admin password |
| `database` | system configured; installer not locked |
| `upgrade` | `configured_version` ≠ product version |
| `done` | `INSTALL_DISABLED` present |
| `locked` | `BAIKAL_LOCK_INSTALL=1` without `BAIKAL_ALLOW_REINSTALL=1` |

### Security

- **No** portal Admin role required (first boot has no DAV users)
- Dedicated session CSRF (`baikal_install_csrf` in `BAIKALPORTAL` session)
- Same-origin check on mutating requests
- Per-IP rate limit on mutations
- Secrets never returned in status
- Lock env parity with classic installer

---

## 3. Code map

| Path | Role |
|------|------|
| `Core/Frameworks/Baikal/Portal/Install/InstallService.php` | Domain logic |
| `Core/Frameworks/Baikal/Portal/Install/InstallApp.php` | JSON router |
| `html/api/index.php` | Routes `/api/install/*` before full App bootstrap |
| `portal/src/install.ts` | SPA wizard |
| `portal/src/main.ts` | Mounts install when path is `/portal/install` |
| `Core/Frameworks/BaikalAdmin/WWWRoot/install/index.php` | Redirect to portal installer |
| `tests/php/InstallServiceTest.php` | Unit coverage |

---

## 4. Operator quick reference

| Need | Where |
|------|--------|
| First install / reinstall wizard | **`/portal/install/`** |
| Version upgrade | **`/portal/install/`** (auto-detects version skew) |
| Lock after install | `Specific/INSTALL_DISABLED` and/or `BAIKAL_LOCK_INSTALL=1` |
| Re-open when lock env set | `BAIKAL_ALLOW_REINSTALL=1` + remove marker or portal Reset to Default |
| Day-to-day admin | Portal Administration or classic `/admin/` |

---

## 5. Checklist

| Step | Status |
|------|--------|
| 10.1 keep classic (superseded) | Classic entry retained as **redirect only** |
| 10.2 portal installer migration | **Done** — SPA + bootstrap API |
| Dual-run recovery | Old URL redirects; Framework points to portal install |
