# AngaraDAV deployment guide

Operator guide for running AngaraDAV in Docker, on TrueNAS SCALE, or from source.
Product overview, endpoints, and a first `docker run`: [README.md](../README.md).
Hardening and vulnerability reporting: [SECURITY.md](SECURITY.md). Release history: [CHANGELOG.md](../CHANGELOG.md).

## Images

| Image | When |
|-------|------|
| `ghcr.io/offsyanka99/angaradav:latest` | Tracks the default branch |
| `ghcr.io/offsyanka99/angaradav:<version>` (e.g. `2.5.3`) | Product release pin |
| `ghcr.io/offsyanka99/angaradav:sha-…` | Pin to a tested git commit |
| Build from `Dockerfile` | Offline packaging |

Multi-arch: `linux/amd64`, `linux/arm64`. Databases: **SQLite** or **PostgreSQL** only (no MySQL).

The image serves on port 80 as nginx UID/GID **101**. The app lives at `/var/www/baikal`.

## Persistent data and backup

| Mount | Contents |
|-------|----------|
| `/var/www/baikal/config` | `configuration.yaml`: all system settings, admin password hash, database settings, `database.encryption_key` |
| `/var/www/baikal/Specific` | SQLite DB (`db/db.sqlite`), `INSTALL_DISABLED`, `portal_meta.json` (read-only / holiday flags), rate-limit files, WebDAV file homes (`files/`), `push_vapid.json`, debug logs |
| `ANGARA_FILES_STORAGE_PATH` (optional) | WebDAV file homes when stored outside `Specific/` |
| PostgreSQL data dir (PostgreSQL variant) | Users, calendars, contacts. Prefer `pg_dump` over raw file copies |

Back up **all** of these together as one consistency set:

- The `file_homes` table maps users to random directory names. Restoring only the database or only the file tree is incomplete.
- `database.encryption_key` decrypts stored WebDAV-Push subscriptions. `Specific/push_vapid.json` is the server's Push identity. Do not rotate either casually.

**Administration → Configuration** can export/restore a JSON backup of the editable system settings. It contains no secrets, database credentials, users, or DAV data, so it does not replace a volume backup.

## TrueNAS SCALE

Templates: [truenas-scale.compose.yaml](truenas-scale.compose.yaml) (SQLite) or
[truenas-scale-postgres.compose.yaml](truenas-scale-postgres.compose.yaml) (bundled PostgreSQL 18).

1. Create the dataset directories and `chown -R 101:101` them.
2. Install via **Custom App → Install via YAML**. Use `image: …:latest` or a pinned tag. Do not use the `build:` block on the NAS.
3. Set **`ANGARA_SKIP_CHOWN=1`** so startup does not re-chown the mounts (avoids a long hang in `40-fix-baikal-file-permissions.sh`).
4. Open `/portal/install/` and complete the installer once.
5. Put **HTTPS** in front (TrueNAS proxy, Caddy, Traefik). Do not expose plain HTTP to the internet.
6. Keep `Specific/INSTALL_DISABLED`, or set `ANGARA_LOCK_INSTALL=1` so the installer cannot reopen if the marker is deleted.

Updating the image or `nginx.conf` needs a **recreate** of the app/container. A process restart keeps the old container filesystem.

### Stuck on `40-fix-baikal-file-permissions.sh`

The entrypoint only chowns `config/` and `Specific/`, but that can still be slow on large bind mounts. Chown once on the host, then skip it:

```bash
chown -R 101:101 /mnt/tank/apps/angaradav
```

```yaml
environment:
  ANGARA_SKIP_CHOWN: "1"
```

With skip-chown enabled, the entrypoint **exits** if `config/` or `Specific/` is not writable by UID 101 (instead of starting with an unwritable config). Only `1`/`true`/`yes`/`on` enable it.

### Settings or install reset after a restart

Settings live only in `config/configuration.yaml`; the SQLite DB and install lock live only under `Specific/`. If they reset after a recreate, the host paths are not persisting. Typical causes:

1. **Host Path volumes not applied.** The Custom App fell back to anonymous Docker volumes, which survive a restart but not an edit/upgrade/recreate.
2. **Wrong host directories.** Compose points at a different path than the dataset you inspect.
3. **Ownership.** With `ANGARA_SKIP_CHOWN=1` the host dirs must be owned by `101:101`. If PHP cannot write, the admin UI shows an error.

Verify on the NAS:

```bash
ls -la /mnt/tank/apps/angaradav/config/     # expect configuration.yaml
ls -la /mnt/tank/apps/angaradav/Specific/   # expect INSTALL_DISABLED, db/db.sqlite (SQLite)

docker inspect angaradav --format '{{range .Mounts}}{{.Source}} -> {{.Destination}} ({{.Type}}){{println}}{{end}}'
# expect bind mounts:
#   /mnt/tank/apps/angaradav/config   -> /var/www/baikal/config (bind)
#   /mnt/tank/apps/angaradav/Specific -> /var/www/baikal/Specific (bind)
```

The entrypoint also logs mount warnings at start (`25-check-baikal-persistence.sh`).

## Health check

`GET /health.php` needs no database and no install. HTTP **200** with `status: ok` or `degraded`; HTTP **503** with `status: incomplete` when PHP dependencies are missing.

| Field | Healthy value |
|-------|---------------|
| `configured` | `true` after install |
| `installLocked` | `true` after install |
| `configWritable` / `specificWritable` | `true` (otherwise `degraded`; settings/DB cannot persist) |
| `configMount.bindLikely` / `specificMount.bindLikely` | `true` (host bind, not an anonymous volume) |
| `persistenceWarning` | `null` |
| `filesStorageReady` | `true` when Files is enabled and usable; `null` when Files is off; `false` (`degraded`) when the storage path is missing |

`degraded` is a config/mount problem, not an outage. `/info.php` returns public feature flags and version only.

## Environment variables

| Env | Default | Effect |
|-----|---------|--------|
| `TZ` | — | Container timezone. Also seeds the installer's default server time zone (one-time; change later in System settings) |
| `ANGARA_SKIP_CHOWN` | unset | Skip entrypoint chown of `config/` + `Specific/` (after host `chown 101:101`) |
| `ANGARA_LOCK_INSTALL` | unset | `1` forces the installer lock even if `INSTALL_DISABLED` is missing |
| `ANGARA_ALLOW_REINSTALL` | unset | `1` allows reopening the installer while `ANGARA_LOCK_INSTALL=1` |
| `ANGARA_PORTAL_ADMIN_USERS` / `PORTAL_ADMIN_USERS` | unset | DAV usernames with the portal Admin role (comma/space list) |
| `ANGARA_PORTAL_LOG_LEVEL` / `PORTAL_LOG_LEVEL` | `off` | `off`/`error`/`warn`/`info`/`debug`: browser console + `Specific/portal_debug.log` |
| `ANGARA_PUSH_LOG_LEVEL` / `PUSH_LOG_LEVEL` | `off` | Same levels for `Specific/push_debug.log` |
| `ANGARA_PUSH_EXTERNAL_URL` | unset | Canonical client-reachable HTTPS DAV base URL for WebDAV-Push |
| `ANGARA_FILES_STORAGE_PATH` | `Specific/files` | Absolute container path for WebDAV file homes |
| `ANGARA_FILES_MAX_UPLOAD_MB` | `1024` | Per-file upload limit (MB) |
| `ANGARA_FILES_QUOTA_MB` | `10240` | Per-user quota (MB); `0` = unlimited |
| `ANGARA_FILES_MAINTENANCE_INTERVAL_SECONDS` | `3600` | Interval of the in-container file maintenance loop |
| `ANGARA_DAV_MAX_BODY_SIZE` | `1G` | nginx `client_max_body_size` for `/dav.php` and `/api/` (nginx syntax: `512M`, `2G`; `256MB` is invalid) |
| `MSMTPRC` | unset | Contents of `/etc/msmtprc` for outgoing mail (iMIP invitations) |

**Precedence:** `ANGARA_*` → unprefixed name → `configuration.yaml` → default.
Exceptions: `TZ` only seeds the installer; time format and week start are set only in **Administration → System settings**. The old `BAIKAL_*` variables were removed in 2.5.0 and are ignored. Rename them to `ANGARA_*`.

YAML equivalents under `system.*`: `files_storage_path`, `files_max_upload_mb`, `files_quota_mb`, `portal_log_level`, `portal_admin_users`, `push_external_url`, `push_log_level`.

### Common mistakes

- **Setting `ANGARA_FILES_STORAGE_PATH` without mounting it.** The variable only picks a path inside the container. Bind-mount it and `chown 101:101` it, or uploads are lost on recreate.
- **Expecting an env var to enable a feature.** `ANGARA_FILES_STORAGE_PATH` and `ANGARA_PUSH_EXTERNAL_URL` only configure a feature. Turn it on in **System settings** (**Enable WebDAV file storage**, **Enable WebDAV-Push**).
- **Looking for debug logs in `docker logs` / Dozzle.** `portal_debug.log` and `push_debug.log` are files in `Specific/`, not stdout. Use `docker exec angaradav tail -f /var/www/baikal/Specific/push_debug.log`.
- **Leaving log levels on.** Set `PORTAL_LOG_LEVEL` / `PUSH_LOG_LEVEL` back to `off` after troubleshooting.
- **Raising only the app upload limit.** See [upload limits](#storage-and-limits).

## Administration

Administration is part of the portal: `/portal/` → user menu → **Administration** (Overview · System settings · Users · Database · Configuration). `/admin/` only redirects to `/portal/`.

### Admin role

First match wins:

1. Env `ANGARA_PORTAL_ADMIN_USERS`, then `PORTAL_ADMIN_USERS`.
2. YAML `system.portal_admin_users` (list or comma-separated string).
3. Neither set → the DAV user named `admin` (case-insensitive).

The installer creates DAV user `admin` and writes `portal_admin_users: admin` when the env is unset. If the env names other users, `admin` can still sign in but gets no Administration.

```yaml
# config/configuration.yaml
system:
  portal_admin_users: "alice, bob"   # or [alice, bob]
  portal_admin_ui_enabled: true      # false hides the Administration UI; /api/admin/* still enforces the role
```

Every `/api/admin/*` call requires a session **and** the Admin role (anonymous **401**, non-admin **403**).

### Passwords

- Portal sign-in always uses **DAV** credentials.
- The **server admin password** (System settings) is a separate bcrypt hash in `configuration.yaml`, used by the installer/upgrade. The installer sets it and user `admin`'s DAV password to the same value.
- Users change their own DAV password under **User settings** (5 successful changes per user per 15 minutes).

### Destructive actions

- **Database** writes require typing `CONFIRM`. Passwords are never shown.
- **Reset to Default** (Configuration) needs the admin password and confirmation. It wipes the install and returns to `/portal/install/`. Only `configuration.yaml` is copied (to `configuration.yaml.bak.*`). **Snapshot the volumes first.**

## Logging and troubleshooting

Portal request tracing and the admin audit log go to `Specific/portal_debug.log`, never to nginx/Docker error streams. Leave the level at `off` in production.

Admin mutations are audited:

| Result | Needs level | Tag |
|--------|-------------|-----|
| Success | `info` or `debug` | `[INFO]` |
| Failure | `warn`, `info`, or `debug` | `[WARN]` |

```text
[INFO] AngaraDAV portal: admin audit actor=alice action=update-system-settings target=system result=ok keys=files_enabled,session_max_age_minutes
[WARN] AngaraDAV portal: admin audit actor=alice action=update-system-settings target=system result=error:503 msg=Config_file_is_not_writable
```

Passwords and hashes are never logged.

```bash
docker exec angaradav grep 'admin audit' /var/www/baikal/Specific/portal_debug.log
```

### A settings save fails

1. Read the error the portal shows (e.g. "Config file is not writable").
2. Set `PORTAL_LOG_LEVEL=warn` (failures) or `info` (all), then recreate.
3. Look for `update-system-settings` / `admin settings save failed` in `portal_debug.log`.
4. Check `/health.php` for `configWritable` and mount hints.
5. Common causes:
   - **503 not writable**: host ownership (UID 101) or config is not a real bind mount.
   - **400 with a field name**: validation (Push URL must be HTTPS, bad timezone, forbidden keys).
   - **429**: admin password change rate limit (`Specific/portal_admin_password_rate.json`) or self-service limit (`Specific/portal_self_password_rate.json`).
   - **403 on `/api/admin/*`**: the user lacks the Admin role.
6. Set the level back to `off`.

## Authentication

### DAV clients

| `dav_auth_type` | Storage | Use |
|-----------------|---------|-----|
| **Digest** (default) | `md5(user:realm:password)` | LAN; weak if the DB leaks. Use TLS |
| **Basic** | Same digest table | Only over HTTPS |
| **Apache** | Web server auth | When a reverse proxy authenticates users |

Tasks are **VTODO** and notes are **VJOURNAL** on CalDAV calendars; there is no separate endpoint.

- A `401` followed by `207` on `PROPFIND`/`REPORT` is normal Digest negotiation, not a failed sync.
- Expected DAV `4xx` responses appear in the nginx access log but not in PHP/FastCGI error logs. Build Fail2Ban rules for DAV from repeated terminal `401`s in the access log.
- Calendars marked read-only in the portal advertise a read-only ACL and reject writes. A client `PUT` getting `403` there had a local change queued for a protected calendar. Refresh the account's collections, or clear the read-only flag if writes should be allowed.

### Portal sessions

- Idle timeout: **Session timeout** in System settings (`session_max_age_minutes`, default **15**). An expired session clears the SPA and returns to Sign in.
- Failed logins are rate-limited per IP (20 per 15 minutes); file download/view uses the same ceiling.
- Mutations require same-origin + CSRF.

## Clients

### Home Assistant

| Field | Value |
|-------|-------|
| URL | `https://nas.example/dav.php/` (or `http://NAS-IP:31088/dav.php/` on a trusted LAN) |
| Username / password | An AngaraDAV DAV user |

The image includes a sabre/dav patch so Home Assistant's `calendar-query` with `<C:expand/>` works with Baïkal-style calendar timezones. No env flag is needed. See [patches/README.md](../patches/README.md).

### Android and desktop

- Calendars/contacts: DAVx⁵ or any CalDAV/CardDAV client against `https://host/dav.php/`.
- Files: [WebDAV-sync](https://github.com/offsyanka99/WebDAV-sync) or any WebDAV client against `https://host/dav.php/files/USERNAME/` with that user's DAV credentials.

## WebDAV file storage

Enable **System settings → Enable WebDAV file storage**, or in YAML:

```yaml
system:
  files_enabled: true
  files_storage_path: ''          # empty = /var/www/baikal/Specific/files
  files_max_upload_mb: 1024
  files_quota_mb: 10240           # 0 = unlimited
  files_quarantine_days: 30
```

Clients connect to `https://host/dav.php/files/USERNAME/`. `/cal.php/` and `/card.php/` never expose files. The portal **Files** tab uses the same home.

### Storage and limits

For a separate dataset:

```yaml
services:
  angaradav:
    environment:
      ANGARA_FILES_STORAGE_PATH: /var/lib/angaradav-files
      ANGARA_FILES_MAX_UPLOAD_MB: "2048"
      ANGARA_FILES_QUOTA_MB: "20480"
      ANGARA_DAV_MAX_BODY_SIZE: 2G
    volumes:
      - /mnt/tank/apps/angaradav/files:/var/lib/angaradav-files
```

```bash
chown -R 101:101 /mnt/tank/apps/angaradav/files
chmod 700 /mnt/tank/apps/angaradav/files
```

The storage path must be absolute, outside `html/`, and free of symlinks.

Three independent upload ceilings apply; the smallest wins:

| Ceiling | Default | Set by |
|---------|---------|--------|
| nginx `client_max_body_size` (`/dav.php`, `/api/`) | `1G` | `ANGARA_DAV_MAX_BODY_SIZE` |
| PHP `upload_max_filesize` / `post_max_size` | `1G` | Baked into the image (not configurable at runtime) |
| App per-file limit | `1024` MB | System settings / `files_max_upload_mb` / `ANGARA_FILES_MAX_UPLOAD_MB` |

Raising only the admin setting does nothing past the nginx/PHP ceilings. Filesystem/ZFS quotas remain the strongest backstop; the app quota adds per-user reporting and `507 Insufficient Storage`.

### Data integrity and user deletion

- Uploads go to private temp files and are renamed into place only after size and quota checks.
- Per-home locks serialize quota-sensitive writes, copies, moves, and deletes. Symlinks are never followed.
- Deleting a user moves the home to quarantine; a recreated username gets a new empty home.
- Disabling the feature does not delete homes or metadata.

### Maintenance

The Docker image purges expired quarantine (`files_quarantine_days`) and upload temporaries older than 24 hours every `ANGARA_FILES_MAINTENANCE_INTERVAL_SECONDS` (default hourly). On source installs, schedule it yourself:

```bash
php scripts/files-maintenance.php                  # both tasks
php scripts/files-maintenance.php --purge-quarantine
php scripts/files-maintenance.php --cleanup-temporary
```

A lock file prevents overlapping runs.

### Scope

Private class-2 WebDAV drive: properties, locks, quotas, ranges, copy/move (passes WebDAV Litmus 0.13). Not provided: sharing between users, public links, trash/versions, full-text search, chunked-upload protocols, or RFC 6578 sync for files. WebDAV-Push for file folders is optional; see [WebDAV-Push](#webdav-push).

## WebDAV-Push

Server-initiated change notifications over Web Push (e.g. DAVx⁵) for calendars, address books, and, if you opt in, WebDAV file folders. Enable **System settings → Enable WebDAV-Push** and set the external URL:

```yaml
system:
  push_enabled: true
  push_external_url: 'https://dav.example.com/dav.php/'
  # Also notify on WebDAV file changes (needs files_enabled too)
  push_files_enabled: false
  push_log_level: 'off'
  # Strongly recommended: exact list of permitted push services (YAML only)
  # push_allowed_hosts:
  #   - updates.push.services.mozilla.com
  #   - fcm.googleapis.com
  push_max_subscriptions_per_principal: 50
  push_max_subscriptions_per_resource: 100
  push_max_registrations_per_hour: 30
  push_worker_batch_size: 20
  push_worker_poll_ms: 2000
  push_max_delivery_attempts: 5
```

- `push_external_url` (or `ANGARA_PUSH_EXTERNAL_URL`) must be the client-reachable **HTTPS** DAV base including `dav.php/`. It is never inferred from `Host`/`X-Forwarded-*`. Push is not advertised until it is valid.
- Tables are created automatically when Push starts. No manual SQL on upgrade.
- DAV and portal writes enqueue jobs; a worker delivers them with retries. For shared calendars, one change notifies every owner/sharee instance.
- Push endpoints must be public HTTPS on port 443 and are re-resolved before delivery (SSRF protection). Private/local push gateways are rejected.
- Subscription material is encrypted with `database.encryption_key`. The VAPID key pair is generated once in `Specific/push_vapid.json` (mode `0600`); malformed key files make Push fail closed.
- `push_debug.log` is mode `0600`, rotated at 5 MiB, and strips secrets and URL paths. At `info` it logs the change `source` (`dav` or `portal`) and, for DAV, the client `User-Agent`. File paths appear only at `debug`; below that, file jobs are identified by their topic.
- **File storage.** **System settings → Enable WebDAV-Push for file storage** (`push_files_enabled`) adds Push to every folder under `/dav.php/files/{user}/`. The checkbox is available only while **Enable WebDAV-Push** and **Enable WebDAV file storage** are both on. A client subscribes to a folder (usually its sync root) and is notified about changes anywhere below it, made by DAV clients or the portal. Only the owner can subscribe; files themselves are not push-capable. Notifications are grouped per folder: about 5 seconds after a burst of changes ends, at most one every 30 seconds while changes continue. Changes made directly on disk under the storage path are not detected.
- **Subscription limit.** `push_max_subscriptions_per_principal` (**System settings → Max push subscriptions per user**, 1–1000) is shared by all of a user's devices, calendars, address books, and file folders. New installs default to 50. Installs from before 2.5.3 keep the `20` written in their `configuration.yaml`; raise it if clients get HTTP 429 when registering. Two phones with several calendars and a synced folder can already pass 20.
- **Monitoring.** **Administration → Overview** shows whether Push for files is active, active subscriptions per kind, and the delivery queue (count and oldest age). An oldest queued notification that keeps getting older than a minute or two usually means the worker is not running.
- Deleting a user removes their subscriptions and queued notifications, including other users' subscriptions on that user's collections.

### LAN-only servers

AngaraDAV needs no inbound internet port, but it needs:

- A stable HTTPS name that clients trust (internal CA or split DNS with a public certificate), e.g. `https://angaradav.home.arpa/dav.php/`.
- Outbound DNS and HTTPS from the worker to the client's public push provider.

Flow: the client registers its push endpoint → a change enqueues a job → the worker sends an encrypted hint to the provider → the client syncs directly with AngaraDAV.
Plain HTTP is not supported. Fully offline networks cannot use Push. A client off the LAN receives the hint but cannot sync until it reaches the server (e.g. via VPN). Keep normal client polling enabled at a reduced frequency.

### Worker

The Docker image supervises one unprivileged worker automatically (exit code 2 = permanent config error; it is not restarted). For source installs, supervise it yourself:

```ini
[Unit]
Description=AngaraDAV WebDAV-Push worker
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/baikal
ExecStart=/usr/bin/php /var/www/baikal/scripts/push-worker.php
Restart=on-failure
RestartSec=5s
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Run only one worker per `Specific/` directory (a lock file enforces this). Restart the worker together with PHP-FPM after upgrades or config changes. `php scripts/push-worker.php --once` processes one batch and exits.

### Troubleshooting

1. Confirm `push_enabled: true` and a valid `https://…/dav.php/` URL.
2. Set `push_log_level: debug`, run `php scripts/push-worker.php --once`, read `Specific/push_debug.log`.
3. `OPTIONS` on a DAV collection must list `webdav-push` in the `DAV` header.
4. `PROPFIND` `transports`, `topic`, `supported-triggers` in the `https://bitfire.at/webdav-push` namespace.
5. Rejected registrations: check the endpoint is public HTTPS:443, resolves to no private addresses, and is in `push_allowed_hosts` if configured.
6. A second device on a shared calendar never wakes: at `info`, one write should log several `content notification enqueued` lines (one per instance). If not, update the image and restart the worker, then re-register Push in the client (e.g. toggle UnifiedPush in DAVx⁵).
7. File folders show no Push properties: `PROPFIND` (Depth 0) on `/dav.php/files/{user}/` must return `supported-triggers` with `content-update` depth `infinity`. If it does not, check that **Enable WebDAV-Push**, **Enable WebDAV file storage**, and **Enable WebDAV-Push for file storage** are all on. Subscribe to a folder, not a file.
8. Registration returns HTTP 429: the per-user subscription limit is reached. Raise **Max push subscriptions per user**.
9. File topics are derived from `database.encryption_key`. Changing the key changes every file topic, and clients must register again.

## Installer lock

After install, `Specific/INSTALL_DISABLED` exists and `/portal/install/` reports locked.

| Env | Effect |
|-----|--------|
| `ANGARA_LOCK_INSTALL=1` | Lock even if the marker file is missing |
| `ANGARA_ALLOW_REINSTALL=1` | Allow reopening while `ANGARA_LOCK_INSTALL=1` |

## Upgrades

- **Docker/TrueNAS:** pull the new image and **recreate** the container. Open `/portal/install/` if an upgrade is pending and confirm it. The upgrade updates `configured_version` and keeps the rest of `configuration.yaml`.
- **From 2.4.x or older:** rename any `BAIKAL_*` env vars to `ANGARA_*` (see [Environment variables](#environment-variables)).
- **To 2.5.3:** the push queue gains three columns automatically on first use (SQLite and PostgreSQL); no manual SQL. If you plan to use Push for file storage, raise **Max push subscriptions per user** (see [WebDAV-Push](#webdav-push)).
- **Source installs:** `composer install` (requires the `patch` command; it applies [patches/](../patches/README.md)), rebuild the portal (`make portal`), then restart PHP-FPM and the Push worker.

## Source installs

Requirements: PHP 8.4+ with `curl`, `dom`, `mbstring`, `openssl`, `pdo` (+ `pdo_sqlite` or `pdo_pgsql`), `zlib`, `gd` (contact photos); `gmp` recommended for Push.

```bash
composer install --no-dev
cd portal && npm install && npm run build   # outputs to html/portal/
```

- Serve `html/` as the document root, and deny web access to `Core/`, `config/`, `Specific/` (see [docker/nginx.conf](../docker/nginx.conf)).
- Run the Push worker under a supervisor ([Worker](#worker)) and schedule `scripts/files-maintenance.php` ([Maintenance](#maintenance)).
- Config and runtime directories can be moved with `ANGARA_PATH_CONFIG` / `ANGARA_PATH_SPECIFIC`.
