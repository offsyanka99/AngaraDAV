# Security Policy

## Reporting a Vulnerability

AngaraDAV is an independent project derived from Baïkal. It is not the upstream sabre-io project.

Please report security issues via GitHub Security Advisories on this repository:

https://github.com/offsyanka99/AngaraDAV/security/advisories/new

Or open a private report against the repository if advisories are unavailable.

For issues in the upstream code from which AngaraDAV was derived, see [sabre-io/Baikal](https://github.com/sabre-io/Baikal) and [sabre.io](https://sabre.io/).

## Deployment notes

- Terminate **TLS** in front of the container (do not expose plain HTTP to the internet).
- Keep `Specific/INSTALL_DISABLED` in place after install, or set `BAIKAL_LOCK_INSTALL=1`.
- Restrict who has the portal **Admin role** (`PORTAL_ADMIN_USERS` / `portal_admin_users`); use a strong password for DAV admin and install. Day-to-day admin is `/portal/` Administration; install is `/portal/install/`.
- Portal DAV-user sessions respect `session_max_age_minutes` (idle timeout) and login rate limits. On expiry the SPA clears calendars/contacts from memory and shows the Sign in screen with a timeout message (not a stale dashboard).
- Keep portal debug logging off in production (`PORTAL_LOG_LEVEL` / `portal_log_level` default `off`). Enable only temporarily when debugging.
- Keep WebDAV-Push debug logging off in production (`PUSH_LOG_LEVEL` / `push_log_level` default `off`). Push logs are sanitized, mode `0600`, and rotated, but still contain operational metadata.
- When WebDAV-Push is enabled, configure the narrowest practical `push_allowed_hosts` list. Endpoints are restricted to public HTTPS port 443 and pinned to validated DNS results, but an allowlist further reduces outbound-request exposure.
- Back up `config/` and `Specific/` privately (database, password hashes, `database.encryption_key`, and `push_vapid.json`). Never publish the VAPID private key or change the database encryption key without invalidating/re-registering Push subscriptions.
