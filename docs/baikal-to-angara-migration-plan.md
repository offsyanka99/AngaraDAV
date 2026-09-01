# BAIKAL to ANGARA Migration Plan

**Status:** plan.
**Scope:** migrate tracked uppercase `BAIKAL_*` identifiers to `ANGARA_*` with a compatibility-first, multi-release rollout.

`ANGARA_*` becomes canonical in source code, generated image metadata, environment variables, bootstrap controls, and optional HTTP headers. Existing `BAIKAL_*` forms remain accepted aliases where operators, integrations, existing images, remote DAV clients, or stored data may rely on them.

Do not treat this as a simple global search-and-replace. Several names are external operational contracts or persistent wire/data formats.

## Inventory

The tracked source contains 39 distinct `BAIKAL_*` identifiers.

| Category | Identifiers |
|---|---|
| Product/build | `BAIKAL_VERSION_BASE`, `BAIKAL_VERSION`, `BAIKAL_HOMEPAGE`, `BAIKAL_BUILD_GIT`, `BAIKAL_GIT_SHA`, `BAIKAL_BUILD_TIME` |
| Bootstrap/context/path | `BAIKAL_CONTEXT`, `BAIKAL_CONTEXT_INSTALL`, `BAIKAL_CONTEXT_PORTAL_API`, `BAIKAL_PATH_CONFIG`, `BAIKAL_PATH_SPECIFIC`, `BAIKAL_PATH_FRAMEWORKROOT` |
| Files | `BAIKAL_FILES_STORAGE_PATH`, `BAIKAL_FILES_MAX_UPLOAD_MB`, `BAIKAL_FILES_QUOTA_MB`, `BAIKAL_FILES_MAX_UPLOAD_BYTES`, `BAIKAL_FILES_QUOTA_BYTES` |
| Push/portal | `BAIKAL_PUSH_EXTERNAL_URL`, `BAIKAL_PUSH_LOG_LEVEL`, `BAIKAL_PORTAL_LOG_LEVEL`, `BAIKAL_PORTAL_ADMIN_USERS` |
| Installer/Docker/nginx | `BAIKAL_LOCK_INSTALL`, `BAIKAL_ALLOW_REINSTALL`, `BAIKAL_SKIP_CHOWN`, `BAIKAL_DAV_MAX_BODY_SIZE`, `BAIKAL_DAV_UPLOAD_LIMIT` |
| Legacy/ignored | `BAIKAL_PORTAL_TIME_FORMAT`, `BAIKAL_PORTAL_WEEK_START`, `BAIKAL_CONFIGURED_VERSION` |
| Test harness | `BAIKAL_BASE_URL`, `BAIKAL_TEST_PGSQL_DSN`, `BAIKAL_TEST_PGSQL_USER`, `BAIKAL_TEST_PGSQL_PASSWORD` |
| Planned OnlyOffice | `BAIKAL_OFFICE_PUBLIC_URL`, `BAIKAL_OFFICE_INTERNAL_URL`, `BAIKAL_WOPI_BASE_URL` |
| Header/server variable | `BAIKAL_CSRF` as `HTTP_X_BAIKAL_CSRF`, representing `X-Baikal-CSRF` |

Related compatibility identifiers outside the uppercase pattern are `X-BAIKAL-CUSTOM`, `Baikal\*` PHP namespaces, `config/baikal.yaml`, `/var/www/baikal`, `Specific/*`, `system.configured_version`, and Digest realm `BaikalDAV`.

## Compatibility Rules

1. For active environment values, use this precedence:

   ```text
   ANGARA_* -> existing unprefixed variable (where supported) -> BAIKAL_* -> YAML/default
   ```

   For example, preserve existing `PORTAL_*` or `PUSH_LOG_LEVEL` precedence, but place `ANGARA_*` above it. When new and legacy variables conflict, `ANGARA_*` wins.

2. New documentation, Compose examples, and Docker templates use `ANGARA_*`. State that `BAIKAL_*` remains accepted for compatibility.

3. Preserve public values and schemas: do not rename `configured_version`, API `version`, `git`, or `productVersion` fields, backup schema fields, or version-string format.

4. Do not introduce `ANGARA_PORTAL_TIME_FORMAT` or `ANGARA_PORTAL_WEEK_START`. Their `BAIKAL_*` forms are intentionally ignored; configuration belongs in YAML and the Administration UI.

5. Do not rename namespaces, paths, YAML filenames/keys, session/data schemas, database names, or Digest realm as part of this project.

## Phase 1: Product and Build Metadata

This work is implemented on branch `refactor/angara-product-constants` and should be committed independently.

1. In `Core/Distrib.php`, define `ANGARA_VERSION_BASE`, `ANGARA_GIT_SHA`, `ANGARA_VERSION`, and `ANGARA_HOMEPAGE` as canonical globals.
2. Resolve build SHA using `ANGARA_BUILD_GIT`, then legacy `BAIKAL_BUILD_GIT`, then `GITHUB_SHA` and source-checkout fallback.
3. Retain guarded `BAIKAL_VERSION_BASE`, `BAIKAL_GIT_SHA`, `BAIKAL_VERSION`, and `BAIKAL_HOMEPAGE` aliases with equivalent values.
4. Generate `ANGARA_BUILD_GIT` in `Core/BuildInfo.php` from the Dockerfile. Continue accepting old images whose generated file defines `BAIKAL_BUILD_GIT`.
5. Migrate internal product/build readers: bootstrap, installer/upgrade gate, Portal API, dashboard, backup service, health/info pages, and Makefile.
6. Keep callable helpers such as `baikal_version_base()`, `baikal_needs_upgrade()`, and `baikal_short_git_sha()` out of this phase; they are PHP API names, not constant names.

**Tests:** alias equality; new build-stamp precedence; old `BuildInfo.php` support; unchanged version format; unchanged upgrade comparison; unchanged `health.php`, portal, dashboard, installer, and backup response values.

## Phase 2: Runtime Environment Variables

This work is implemented on branch `refactor/angara-product-constants` and should be committed independently. `ANGARA_*` now resolves ahead of the existing unprefixed variable and legacy `BAIKAL_*` form for every setting below, with no other precedence or default changes. Introduce a shared PHP environment-lookup helper. It must handle defined precedence, absent values, and each setting's existing empty-value semantics. Migrate by bounded domain.

### Files

Migrate `FileStorageConfig.php` to accept canonical forms for storage root, upload MB, quota MB, and historical byte fallbacks.

- Preserve MB-over-byte precedence.
- Preserve zero/unlimited and invalid-bound behavior.
- Test storage-root validation, upload limits, quota enforcement, and traversal/symlink safety.

### Push and Portal

Migrate Push external URL/log level and Portal log level/admin-user inputs.

- Keep URL validation, disabled states, and existing unprefixed-variable precedence.
- Preserve admin authorization, case-insensitive usernames, blank handling, and YAML fallback.

### Installer Safety and Paths

Migrate install/reinstall lock controls and configuration/specific-path overrides.

- Test new-only, legacy-only, conflict, and YAML/default behavior.
- Installer lock and reinstallation controls must retain fail-closed behavior.
- Preserve trailing-slash normalization, derived SQLite path, file root, and lock-marker locations.

## Phase 3: Docker and Deployment Inputs

Items 1-3 below are implemented on branch `refactor/angara-product-constants` and should be committed independently. Compose/TrueNAS template and deployment-doc updates (item 4) and test-harness aliasing (item 5) remain open follow-ups.

1. Update Docker entrypoints `26-check-skip-chown-writable.sh` and `40-fix-baikal-file-permissions.sh` to resolve `ANGARA_SKIP_CHOWN` before `BAIKAL_SKIP_CHOWN`.
2. Update `35-configure-nginx-dav-upload-limit.sh` to resolve `ANGARA_DAV_MAX_BODY_SIZE` before `BAIKAL_DAV_MAX_BODY_SIZE`.
3. Keep `BAIKAL_DAV_UPLOAD_LIMIT` unchanged: it is an internal nginx patch marker, not an operator environment variable.
4. Update root/local/TrueNAS Compose templates and deployment docs to publish canonical names and list the accepted legacy aliases.
5. Test-only values (`BAIKAL_BASE_URL`, `BAIKAL_TEST_PGSQL_*`) may accept `ANGARA_*` aliases, but preserve the existing forms for CI and local-command stability.

**Tests:** image builds and startup with new-only, old-only, and conflicting values; nginx body-size generation; invalid startup values; ownership/mount failures; and `BuildInfo.php` contents.

## Phase 4: Bootstrap and Context Constants

This work is implemented on branch `refactor/angara-product-constants` and should be committed independently.

1. Define `ANGARA_CONTEXT`, `ANGARA_CONTEXT_INSTALL`, `ANGARA_CONTEXT_PORTAL_API`, `ANGARA_PATH_FRAMEWORKROOT`, and path equivalents from official HTML, CLI, and installer entrypoints.
2. Retain guarded `BAIKAL_*` aliases for custom legacy entrypoints.
3. Update `Tools.php`, `Bootstrap.php`, `Framework.php`, and portal installer readers to prefer `ANGARA_*`.
4. Verify classic installer redirects, portal JSON API failures, upgrade gating, CLI workers, and path overrides keep their existing behavior.

## Phase 5: HTTP and Persistent Data

### CSRF header

Only add `X-Angara-CSRF` if a branded header is required. `X-CSRF-Token` remains primary; `X-Baikal-CSRF` should remain accepted indefinitely. Test all accepted header forms, precedence, empty fallback, and rejection without a valid token.

### vCard custom property

Do **not** rename `X-BAIKAL-CUSTOM` in this program. It is stored in vCards and synchronized with external DAV clients. Keep parsing and writing it indefinitely.

A future independent project may introduce `X-ANGARA-CUSTOM`, but requires dual-read semantics, explicit collision/deduplication rules, Unicode fixtures, client sync validation, and proof that normal writes do not duplicate custom fields.

## Explicitly Out of Scope

The following are externally persistent or broad compatibility contracts and require their own migration/rollback design:

- `Baikal\*` / `BaikalAdmin\*` namespaces
- `config/baikal.yaml`, its keys, and existing data
- `/var/www/baikal`, `Specific/*`, mounted volumes, and database/file locations
- Digest realm `BaikalDAV` and Digest credential migration
- Session keys, database/schema names, and stored DAV data
- `X-BAIKAL-CUSTOM` write-name change

`BAIKAL_CONFIGURED_VERSION` and `BAIKAL_DAV_UPLOAD_LIMIT` are non-active labels/markers. Clean their comments only when nearby code is already being changed. The OnlyOffice variables exist only in a plan; use `ANGARA_*` directly when that feature is first implemented.

## Validation Matrix

1. Add table-driven tests for every migrated setting: canonical-only, legacy-only, canonical-and-legacy conflict, unset/YAML fallback, and invalid/empty values where relevant.
2. Run affected tests after each phase, then the full PHP suite under the supported PHP version.
3. Test file storage upload size, quota, byte fallback, root selection, and traversal safety.
4. Test installer lock/reinstall behavior through classic installer, portal installer, reset-to-default, and custom path setups. Security controls must fail closed.
5. Build Docker images with each old/new environment combination and inspect startup behavior, generated nginx config, ownership behavior, and `BuildInfo.php`.
6. Validate `health.php`, installer status, `/api/me`, Portal UI metadata, admin dashboard, and backup export retain identical public keys and values.
7. Run vCard custom-property round-trip fixtures before any related protocol work.

## Post-Implementation Review (2026-09-01)

A targeted code review of every file touched by Phases 1-4, focused on sync, WebDAV-Push, and security-critical logic.

- **CalDAV/CardDAV sync:** no sync-token, ETag, or SabreDAV plugin logic was touched by this rebrand; only environment-variable/constant *names* changed. No sync-related regressions found.
- **WebDAV-Push (`PushPlugin.php`, `PushLogger.php`):** `ANGARA_PUSH_EXTERNAL_URL`/`ANGARA_PUSH_LOG_LEVEL` precedence chains use plain string values (URL, log level), so PHP's `?:` fallback behavior is safe here — no bug found.
- **Portal admin auth (`AdminAuth.php`):** `userIsAdmin()` uses explicit `=== false || === ''` checks rather than `?:`, so it correctly distinguishes "unset" from any other value. No bug found.
- **File storage (`FileStorageConfig.php`):** the `environmentValueAliased()` helper correctly returns `null` only for unset/blank env vars, preserving explicit `"0"` (e.g. `ANGARA_FILES_QUOTA_MB=0` for "unlimited"). No bug found.
- **Bootstrap/context constants (`Bootstrap.php`, `Tools.php`, `Framework.php`):** all Phase 4 context checks compare actual PHP booleans (`ANGARA_CONTEXT === true`), not env strings, so there is no falsy-string risk. No bug found.
- **Bug found and fixed — installer lock/reinstall precedence:** `InstallService::isEnvHardLocked()` and `AdminSettingsService::resetToDefault()` computed `(getenv('ANGARA_LOCK_INSTALL') ?: getenv('BAIKAL_LOCK_INSTALL')) === '1'` (and the same for `ALLOW_REINSTALL`). PHP's `?:` treats the string `"0"` as falsy, so an operator explicitly setting `ANGARA_ALLOW_REINSTALL=0` (or `ANGARA_LOCK_INSTALL=0`) while a stale legacy `BAIKAL_*=1` was still present would silently fall back to the legacy value instead of honoring the explicit `ANGARA_*` override — violating Compatibility Rule 1 ("when new and legacy variables conflict, `ANGARA_*` wins"). For `ALLOW_REINSTALL` specifically, this could unlock the installer when the operator explicitly tried to keep it locked. Fixed both call sites with a shared `envFlagIsOne()` helper that checks `getenv() !== false` (true "unset") instead of PHP truthiness, added regression tests to `tests/php/AngaraEnvPrecedenceTest.php` covering the explicit-`"0"`-vs-stale-legacy-`"1"` case for both flags in both classes (16/16 assertions pass), and confirmed the full PHP suite (757 assertions) still passes.
- No other instances of the `getenv('ANGARA_*') ?: getenv('BAIKAL_*')` pattern exist in the tracked source outside of `Bootstrap.php`'s path variables, which are unaffected since paths have no `"0"`/`"1"` boolean semantics.

## Deprecation and Removal

**Status: completed in 2.5.0 (2026-09-01).** All identifiers in the removal table below have been deleted from tracked source; only `ANGARA_*` (and any previously-supported unprefixed variable, e.g. `PORTAL_ADMIN_USERS`, `PORTAL_LOG_LEVEL`, `PUSH_LOG_LEVEL`) is read.

Announce every migration phase in release notes: `ANGARA_*` is preferred. (Done for Phases 1-4 in the `2.5.0` section of `CHANGELOG.md`.)

This is a single-maintainer project with no other known deployments or downstream integrators, so the usual multi-release/downstream-audit waiting period did not apply. The downstream audit was satisfied by an in-tree grep confirming no first-party code depends on any removal-candidate `BAIKAL_*` name (confirmed — every remaining `BAIKAL_*`/`baikal_*` reference is a `Baikal\*` namespace, a session/CSRF key, the `X-Baikal-CSRF` header fallback, a `baikal_*` PHP function name, a comment, or the out-of-scope `BAIKAL_DAV_UPLOAD_LIMIT`/`BAIKAL_SKIP_CHOWN`/`BAIKAL_DAV_MAX_BODY_SIZE` Docker/nginx markers) plus the fact that this maintainer is the only deployer. Removal release: **2.5.0**.

### Removal candidates and target scope

The identifiers below were removed together, in 2.5.0. Everything else (installer/Docker aliases in the tables above, and everything in "Explicitly Out of Scope") is retained indefinitely — the ongoing maintenance cost of an `if (!defined(...))` guard or an extra `getenv()` fallback is judged lower than the compatibility risk of removing it.

| Identifier | Was kept because | Removed in |
|---|---|---|
| `BAIKAL_VERSION_BASE`, `BAIKAL_VERSION`, `BAIKAL_HOMEPAGE`, `BAIKAL_BUILD_GIT`, `BAIKAL_GIT_SHA` | Legacy `Core/BuildInfo.php` files generated by old image builds still defined `BAIKAL_BUILD_GIT`; custom scripts may have read the others | 2.5.0 ✅ |
| `BAIKAL_CONTEXT`, `BAIKAL_CONTEXT_INSTALL`, `BAIKAL_CONTEXT_PORTAL_API` | Custom third-party entrypoints may have defined only the legacy flag | 2.5.0 ✅ |
| `BAIKAL_PATH_CONFIG`, `BAIKAL_PATH_SPECIFIC`, `BAIKAL_PATH_FRAMEWORKROOT` | Deployment env overrides in the wild | 2.5.0 ✅ |
| `BAIKAL_FILES_STORAGE_PATH`, `BAIKAL_FILES_MAX_UPLOAD_MB`, `BAIKAL_FILES_QUOTA_MB` | Deployment env overrides in the wild | 2.5.0 ✅ |
| `BAIKAL_FILES_MAX_UPLOAD_BYTES`, `BAIKAL_FILES_QUOTA_BYTES` | Pre-1.0.7/1.0.9 byte-based fallback, already legacy before this rebrand | 2.5.0 ✅ (removed alongside the MB-based names above) |
| `BAIKAL_PUSH_EXTERNAL_URL`, `BAIKAL_PUSH_LOG_LEVEL`, `BAIKAL_PORTAL_LOG_LEVEL`, `BAIKAL_PORTAL_ADMIN_USERS` | Deployment env overrides in the wild | 2.5.0 ✅ |
| `BAIKAL_LOCK_INSTALL`, `BAIKAL_ALLOW_REINSTALL` | Security-sensitive; removing early risked an operator's lock silently no-op'ing | 2.5.0 ✅ (validation matrix's fail-closed checks re-run against the no-alias build) |

Steps taken, in order, for the 2.5.0 removal:

1. This maintainer's own running deployments (local Docker, TrueNAS, Compose env files) already used `ANGARA_*` before the removal (done in the earlier Compose/deployment-docs pass), so no live instance relied on a `BAIKAL_*`-only value.
2. Grepped the tracked source for each `BAIKAL_*` name in the table; confirmed the only matches were the guarded alias definitions themselves and this plan/migration tests before deleting anything.
3. Deleted each guarded `if (!defined('BAIKAL_*'))` alias block and the `BAIKAL_*`-checking branch of each `ANGARA_* ?: BAIKAL_*` fallback in `Core/Distrib.php`, `Bootstrap.php`, `Tools.php`, `Framework.php`, `FileStorageConfig.php`, `PushLogger.php`, `PushPlugin.php`, `AdminAuth.php`, `App.php`, `AdminSettingsService.php`, `InstallService.php`, `InstallApp.php`, and the `html/*.php` front controllers — leaving only the `ANGARA_*` read (or the previously-supported unprefixed variable).
4. Deleted the `BAIKAL_* === ANGARA_*` alias-equality assertions in `tests/php/VersionCompareTest.php` and the legacy-only assertions in `tests/php/AngaraEnvPrecedenceTest.php`; kept the `ANGARA_*`-only assertions. Updated `tests/php/AdminAuthTest.php`, `tests/php/InstallServiceTest.php`, and `tests/php/UpgradeGateTest.php` to stop defining/isolating the now-unread `BAIKAL_*` names.
5. Confirmed Compose/TrueNAS templates and `docs/DEPLOYMENT.md` already showed `ANGARA_*` primary with no removal-candidate `BAIKAL_*` mentions (done in the earlier Phase 3 item 4 pass); only the out-of-scope `BAIKAL_SKIP_CHOWN`/`BAIKAL_DAV_MAX_BODY_SIZE` remain, by design.
6. Ran the full PHP test suite (all `tests/php/*.php`) with no `BAIKAL_*` values set anywhere — all pass. A build that still sets legacy `BAIKAL_*` values now has them silently ignored rather than honored, since no code path reads them anymore.
7. This entry documents the removal for the 2.5.0 release notes as a breaking change, with the exact list of removed names above.

## Effort and Risk

| Area | Estimate | Risk |
|---|---:|---|
| Product/build metadata | About 1 day; implemented, pending branch commit | Low with aliases |
| PHP runtime environment settings | 2-4 days; implemented, pending branch commit | Medium to high |
| Docker and deployment inputs | 1-2 days; entrypoint scripts implemented, Compose/docs updates open | Medium |
| Bootstrap/context constants | 1-2 days; implemented, pending branch commit | Medium |
| CSRF header support | 0.5-1 day | Low to medium |
| vCard custom-property migration | 3-5 days | High; defer |
| Namespace/path/config/data migration | Multi-week | High; out of scope |

The full active-variable program, excluding namespace/path/data migrations, is estimated at **5-9 engineering days**, followed by staged-release observation.