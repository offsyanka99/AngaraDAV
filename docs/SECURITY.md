# Security Policy

Reviewed against product **2.5.8** on 2026-10-08. The reporting section and the deployment notes are the operator policy. The review and the development plan below say what is already shipped, what changed in this revision, and what is left to build.

## Reporting a Vulnerability

AngaraDAV is an independent project derived from Baïkal. It is not the upstream sabre-io project.

Please report security issues via GitHub Security Advisories on this repository:

https://github.com/offsyanka99/AngaraDAV/security/advisories/new

Or open a private report against the repository if advisories are unavailable.

For issues in the upstream code from which AngaraDAV was derived, see [sabre-io/Baikal](https://github.com/sabre-io/Baikal) and [sabre.io](https://sabre.io/).

## Deployment notes

- Terminate **TLS** in front of the container. Do not expose plain HTTP to the internet. The portal session cookie is marked `Secure` only when PHP sees HTTPS, or when `X-Forwarded-Proto` is `https`. A proxy that terminates TLS must send that header. An attacker-supplied `X-Forwarded-Proto` can only turn `Secure` on.
- Keep `Specific/INSTALL_DISABLED` in place after install, or set `ANGARA_LOCK_INSTALL=1`. PHP reads that name. The old `BAIKAL_LOCK_INSTALL` variable is ignored.
- Restrict who has the portal **Admin role** (`ANGARA_PORTAL_ADMIN_USERS` / `PORTAL_ADMIN_USERS` / `portal_admin_users`). Use a strong password for the DAV accounts that hold that role, and for the install password. Day-to-day administration is `/portal/` Administration. Install is `/portal/install/`.
- Portal sessions use the cookie `ANGARAPORTAL` (`HttpOnly`, `SameSite=Lax`). Mutations require same-origin and CSRF. Idle timeout is `session_max_age_minutes`. On expiry the SPA clears calendars and contacts from memory and shows Sign in with a timeout message.
- Failed portal logins are limited to 20 per IP per 15 minutes. Portal file download and inline view (`GET /api/files/download`) use the same numbers, counted per IP and username, and only after the file is opened. A wrong current password on `POST /api/me/password` counts toward the login limit and does not end the session.
- Users change their own DAV password in **User settings** (`POST /api/me/password`). The request needs the current password, same-origin, and CSRF. Successful changes are limited to 5 per user per 15 minutes (`Specific/portal_self_password_rate.json`). This updates `users.digesta1` only. It does not change `system.admin_passwordhash`. The **View password** control only shows or hides the field in the browser.
- Portal CSP allows `frame-src 'self' blob:` for PDF preview (`docker/nginx-security-headers.inc`). Recreate the container from a rebuilt image after an nginx CSP change.
- Keep portal debug logging off in production (`PORTAL_LOG_LEVEL` / `portal_log_level`, default `off`). A product upgrade does not reset `system.portal_log_level`, `system.portal_time_format`, or `system.portal_week_start`.
- Keep WebDAV-Push debug logging off in production (`PUSH_LOG_LEVEL` / `push_log_level`, default `off`). Push logs are sanitized, mode `0600`, and rotated. They still contain operational metadata. File paths are written only at `debug`.
- When WebDAV-Push is enabled, set the narrowest practical `push_allowed_hosts` list. Endpoints must be public HTTPS on port 443 and are pinned to the DNS result that was checked. The allowlist is an extra restriction.
- WebDAV-Push for file storage (`push_files_enabled`) is off by default. Only the owner can subscribe to their folders. File topics are an HMAC under a sub-key of `database.encryption_key`. Before each delivery the worker checks that the subscriber still owns the path: an active file home for files, the owner or a current calendar-proxy member for calendars, the owner for address books. Deleting a user removes that user's subscriptions and queued notifications, including other users' subscriptions on that user's collections.
- Back up `config/` and `Specific/` in private, and back up the WebDAV file storage directory when `files_storage_path` or `ANGARA_FILES_STORAGE_PATH` points outside `Specific/files`. `config/configuration.yaml` holds the admin password hash, the database password, and `database.encryption_key`. `Specific/push_vapid.json` is the server Push identity. The Administration data archive is the database plus the file store, including Trash. It does not contain `configuration.yaml` or `push_vapid.json`. Restoring it does not change the admin password. A successful Administration restore increments `system.portal_session_generation` in `configuration.yaml`, which is outside the archive, and the next portal request signs that browser out. The administrator signs in again. Replacing the database and file store by hand, with AngaraDAV stopped, does not increment the counter; add 1 in `configuration.yaml` when those browsers should sign out. Settings restore leaves the generation unchanged. A failed data restore leaves it unchanged. Idle timeout still uses the timeout sentence. A backup from another install can leave Push subscriptions unreadable until devices register again. Do not publish the VAPID private key. Changing `database.encryption_key` invalidates stored Push secrets.
- Optional `MSMTPRC` is written to `/etc/msmtprc` mode `0644` inside the container. Treat that file as container-local. Do not put it in an image layer or a shared volume.
- The portal service worker (`/portal/sw.js`) does not cache responses. **User settings → Background changes** uses the browser Notification API in that window. It is not Web Push, it does not subscribe to WebDAV-Push, and it does not run after the portal is closed. Permission stays in the browser.

## Review

### Still relevant, and already implemented

These notes describe controls that are in 2.5.8. They stay as operator requirements. They are not open implementation tasks.

| Note | Where it lives |
|---|---|
| Install lock | `Specific/INSTALL_DISABLED`, `ANGARA_LOCK_INSTALL` |
| Admin role | `portal_admin_users` and the `ANGARA_PORTAL_ADMIN_USERS` environment variable |
| Idle session and Sign in timeout | `Auth` and `portal/src/app/session.ts` |
| Login and download ceilings | `Auth::RATE_LIMIT_MAX` (20 / 15 minutes) and `FileDownloadRateLimiter` |
| Self-service DAV password | `POST /api/me/password`, `Auth::changePassword()` |
| CSP `frame-src` | `docker/nginx-security-headers.inc` |
| Portal and Push log levels | `portal_log_level`, `push_log_level`, `PushLogger` |
| Push endpoint checks and allowlist | `SubscriptionValidator`, `push_allowed_hosts` |
| File-push default off, owner topics, delivery re-check, delete purge | `push_files_enabled`, `PushWorker::isStillAuthorized()`, `AdminUserService` |
| Private backup of the encryption key and VAPID key | `configuration.yaml`, `Specific/push_vapid.json` |

Same-origin and CSRF on portal mutations are implemented and were not spelled out in the previous notes. The deployment list now includes them.

### Corrected in this revision

- Login limiting is per IP. Download and view limiting is per IP and username. Both use 20 attempts per 15 minutes. The old sentence called both "per IP and user".
- The backup sentence stopped at `config/` and `Specific/`. File storage may live elsewhere. The portal data archive does not include `configuration.yaml` or `push_vapid.json`. A successful data restore ends portal sessions by incrementing `system.portal_session_generation`.
- The TLS note now says the session cookie is `Secure` only when HTTPS is visible to PHP.
- `MSMTPRC` mode `0644` is stated here so operators know the container file is readable by every uid in that container.

### No longer relevant

- `BAIKAL_LOCK_INSTALL` and the other `BAIKAL_*` runtime variables. Removed in 2.5.0. This file already uses `ANGARA_LOCK_INSTALL`. There is no remaining rename task.
- A separate Baïkal HTML admin as the way to operate the server. Administration is the portal. Install remains `/portal/install/`.
- Replacing the Digest realm `BaikalDAV`, the `Baikal\` namespace, or the container path `/var/www/baikal`. Those names are compatibility contracts. They are not security defects to remove.
- Creating another user's empty file-home row before the DAV ACL check (`HomeCollection::getChildForPrincipal()`). It does not disclose files. It was left as-is when file push shipped. It is not a scheduled fix.

## Development plan

Ordered for implementation. Effort is reasoning effort for the person doing the change.

### 1. Session generation after a data restore — shipped

**Effort:** `high`.

A successful data restore increments `system.portal_session_generation` in `configuration.yaml`. `Auth` stores that integer at login (`angara_portal_generation`). A mismatch clears the session and the SPA shows Sign in. The administrator who ran the restore signs in again. Settings backup and restore do not change the counter. A failed data restore does not change it. The PHP session directory is left in place. `database.encryption_key` is left unchanged. The deployment note above is the operator description.

### 2. Security notes for in-app SMTP — when that feature is built

**Effort:** `medium` for this file, after the mail work in `docs/email-sending-plan.md`.

Do not start mail from this plan. When Notifications ships, add operator notes here:

- The SMTP password is ciphertext in `configuration.yaml`, absent from the settings JSON backup, and never returned by the admin API.
- **Enable notification** off stops both queued mail and the legacy `MSMTPRC` path. It does not delete the stored password.
- Template HTML is an allow-list. The test message is a fixed body to the signed-in admin only.
- Prefer that password store over putting a mailbox password in `MSMTPRC`.

### 3. Portal sign-in hardening — later

**Effort:** `xhigh`.

Not scheduled ahead of the restore-session fix or the mail notes. DAV clients stay on Digest or Basic. Do not change `users.digesta1` or the realm `BaikalDAV`.

1. Portal TOTP around the existing cookie session. The DAV password stays the DAV password.
2. Portal-created app passwords that are valid for DAV only.
3. OIDC for the portal only, designed against the digest hash so a portal login cannot be copied into a DAV secret.

Each of those is its own design. None of them belong in the deployment notes until they ship.
