# Admin-only settings; YAML as bootstrap only

Dated **2026-08-20**. Effort scale: **S** 0.5–2 days · **M** 3–7 days · **L** 1.5–3 weeks.

**Status:** plan only (not implemented).

All **application** settings are configured in the portal Administration UI. `config/baikal.yaml` holds only what is required to **boot** (database, secrets, version, Digest realm). PHP supplies defaults for omitted keys. Admin saves write **sparse** YAML (keys the operator set), not the full morphology.

Do **not** change Digest `auth_realm` (`BaikalDAV`) or `/var/www/baikal`. Do **not** move settings into SQLite/PostgreSQL (operators cannot edit settings if the DB is down).

Related remaining library work: [upgrade-path.md](upgrade-path.md) (Wave 7: PSR-4 / PHPStan 2). Symfony 8 YAML/HttpClient is done (`Yaml::dump(..., 4, 2)` unchanged).

---

## Goal

| Store | Role |
|-------|------|
| **`baikal.yaml`** | Bootstrap only: DB, secrets, `configured_version`, `auth_realm` |
| **Admin → System settings** | Every product setting (DAV services, files, Push, session, locale, auth type, …) |
| **Environment / compose** | Infrastructure only (`BAIKAL_SKIP_CHOWN`, install lock, nginx body size, process `TZ`) |

---

## YAML that must remain (initial launch)

DAV and PHP need these before anyone logs in:

```yaml
system:
  configured_version: "2.4.0"     # upgrade gate
  admin_passwordhash: "$2y$…"     # installer + Reset-to-Default
  auth_realm: BaikalDAV           # Digest A1 contract — read-only in Admin
database:
  backend: sqlite                 # or pgsql + host/db/user/password
  sqlite_file: …                  # or pgsql_*
  encryption_key: …               # generated once; never in Admin request bodies
```

**Omit at install** (PHP defaults until Admin saves): `cal_enabled`, `card_enabled`, `tasks_enabled`, `notes_enabled`, `files_*`, `push_*`, `session_max_age_minutes`, `dav_auth_type`, `invite_from`, `portal_log_level`, `portal_time_format`, `portal_week_start`, `failed_access_message`, `base_uri`, `timezone` (seed the installer form from `TZ`; persist only if the operator picks a value), `portal_admin_users` (unset → DAV user `admin` is Admin).

---

## What is wrong today

1. **`Baikal\Model\Config::persist()`** writes the full `$aData` map. Install `initialize()` then dumps Push defaults, file quotas, timezone, service flags, etc.
2. **Installer UI** (`portal/src/install.ts`) asks for CalDAV/CardDAV/Tasks/Notes/Files, DAV auth type, invite, session timeout — that belongs in Admin.
3. **`html/dav.php` / `cal.php` / `card.php`** index `$config['system']['cal_enabled']` (and siblings) with **no default**. Sparse YAML would 500 until readers are fixed.
4. **Env wins over YAML** for files path/quota, Push URL/log, portal time/week/log, `PORTAL_ADMIN_USERS`. TrueNAS compose even **sets** `TIME_FORMAT` and `BAIKAL_PORTAL_WEEK_START`, so Admin cannot be source of truth.
5. **Admin gaps:** `auth_realm` should be read-only; `push_allowed_hosts` is not in the form. Enabling Files does not always `prepareStorage` / `markActive`, so `/health.php` can stay `degraded` with `filesStorageReady: false`.

---

## Policy (decisions for implementers)

**Application settings:** Admin only. Saving a field writes that key into YAML. Missing key = PHP default. Env must **not** override once a key exists.

**Environment — keep:**

| Keep | Why |
|------|-----|
| `BAIKAL_SKIP_CHOWN` | Host mounts / uid 101 |
| `BAIKAL_LOCK_INSTALL` / `BAIKAL_ALLOW_REINSTALL` | Orchestrator, not a portal toggle |
| `BAIKAL_DAV_MAX_BODY_SIZE` | nginx, not PHP |
| `TZ` | PHP/OS clock; **seeds** timezone default only |

**Environment — stop using for product** (after one-release deprecation): `BAIKAL_FILES_MAX_UPLOAD_MB`, `BAIKAL_FILES_QUOTA_MB`, `BAIKAL_PUSH_EXTERNAL_URL`, `PUSH_LOG_LEVEL`, `PORTAL_LOG_LEVEL`, `TIME_FORMAT`, `BAIKAL_PORTAL_WEEK_START`, `PORTAL_ADMIN_USERS`.

For one release, env may apply **only if the YAML key is absent**. After Admin saves, YAML wins. Compose must drop baked-in `TIME_FORMAT` / week-start.

**`PORTAL_ADMIN_USERS`:** today env **always** beats Admin. Change to: env only when `system.portal_admin_users` is unset. If env is set and YAML empty on first boot after this change, copy env into YAML once, then ignore env.

**`BAIKAL_FILES_STORAGE_PATH`:** keep as the one **infra** override for a separately mounted dataset, **or** drop it and require Admin path + compose volume. Prefer keeping the env as path-only (not quotas).

Do **not:** settings table in the DB; Admin edit of `encryption_key`; changing `auth_realm`; putting nginx `client_max_body_size` in the portal.

---

## Waves

### Wave 1 — Safe defaults at every read site — **M**

So sparse YAML does not crash DAV.

- Central helper, e.g. `Baikal\Core\AppConfig`, wrapping parsed YAML + one `defaultFor()` list (today Standard / AdminSettings / App duplicate defaults).
- `html/dav.php`, `cal.php`, `card.php`, `Server`, `Tools` (tasks/notes), `health.php` (`files_enabled` off → `filesStorageReady` null).
- Tests: boot DAV with YAML that has **only** bootstrap keys; CalDAV/CardDAV on, Files/Push/Notes off.

### Wave 2 — Sparse persist — **M** (depends on 1)

- `Config::persist()` / `AdminSettingsService::writeDocument()`: merge; **do not** expand missing keys to defaults.
- Install `initialize()`: write only `configured_version`, `admin_passwordhash`, `auth_realm` (`BaikalDAV`), plus timezone if submitted.
- Database step unchanged (still bootstrap).
- `config/baikal.yaml.dist`: bootstrap skeleton + comments pointing at Admin.
- Tests: after install, YAML has no `push_*` / `files_quota_mb` / `cal_enabled`; Admin GET still returns defaults.

### Wave 3 — Slim installer UI — **S** (depends on 2)

- Keep: admin password (+ confirm), timezone (pre-filled from `TZ`), database (SQLite/Postgres).
- Remove from wizard: service checkboxes, DAV auth type, invite, session minutes, files.
- Copy: “CalDAV, files, Push, and session timeout are in Administration after the first login.”
- First Admin user remains DAV `admin`.

### Wave 4 — Env no longer shadows Admin — **M** (depends on 2)

- Files quotas / Push / portal locale / log / admin-user list: env only if YAML key missing.
- TrueNAS compose: remove default `TIME_FORMAT` / `BAIKAL_PORTAL_WEEK_START`; document “set in Admin”.
- Admin GET shows **effective** value and `source: yaml | default | env`.
- Tests: env set + YAML key set → YAML wins; env set + key absent → env.

### Wave 5 — Admin completeness — **S–M** (depends on 1)

Already in Admin: services, files, Push, session, locale, log, admin users, admin password, database (CONFIRM).

| Field | UI |
|--------|-----|
| `auth_realm` | Read-only + “changing this breaks Digest passwords” |
| `dav_auth_type` | Keep in Admin (remove from installer) |
| `push_allowed_hosts` | Optional list (SSRF allowlist) |
| `failed_access_message` / `base_uri` | Skip unless still used |

When Files is enabled, Admin save must call `prepareStorage` / `markActive` so `/health.php` is not `degraded` with `filesStorageReady: false`.

### Wave 6 — Existing installs — **S** (depends on 2)

- Upgrade: **do not** rewrite YAML automatically (preserves operator edits).
- Optional Admin action or `scripts/` one-shot: drop keys whose values equal PHP defaults (sparse-ify).
- Old fat YAML stays valid; readers treat present keys as overrides.

### Wave 7 — Docs + compose — **S** (depends on 3–4)

README / TrueNAS comments / DEPLOYMENT: installer = password + DB; everything else Admin; env = infra.

---

## Effort

| Wave | Effort | Depends on |
|------|--------|------------|
| 1 Defaults at readers | **M** | — |
| 2 Sparse persist + slim YAML write | **M** | 1 |
| 3 Slim installer UI | **S** | 2 |
| 4 Env policy | **M** | 2 |
| 5 Admin gaps + Files activation | **S–M** | 1 |
| 6 Migration / prune | **S** | 2 |
| 7 Docs | **S** | 3–4 |
| **Total** | **M–L** (~1.5–2.5 weeks) | Ship **1 → 2 → 3** first; env/compose as a follow-up |

---

## Risks

- Sparse YAML + unpatched `dav.php` → white screen. Wave 1 first.
- Env-first TrueNAS users lose compose `TIME_FORMAT` until they set it in Admin — call out in release notes.
- `PORTAL_ADMIN_USERS` in compose can lock operators out if YAML also lists users after the precedence flip — migrate by copying env into YAML once.
- Files enabled without a ready path → `degraded` health; Wave 5 prepares storage on save.

## Suggested first PR

Waves **1 + 2 + 3** (DAV defaults + installer no longer writes product flags). Wave 4 in a second PR so TrueNAS compose does not change in the same drop.
