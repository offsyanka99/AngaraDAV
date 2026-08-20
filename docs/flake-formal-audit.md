# Flake / Formal dependency map

Audit of the former Flake/Formal stack after classic Formal `/admin/` became redirects (`html/admin/*.php` → `/portal/`).

**Formal is gone.** **Flake MVC is gone.** **Live Flake (bootstrap + `$GLOBALS['DB']` + ORM models) is gone.**

DAV, portal API, install/upgrade, and CLI workers boot through `Baikal\Core\Bootstrap` and use PDO directly.

---

## What replaced `\Flake\Framework::bootstrap()`

| Caller | Now |
|--------|-----|
| `html/dav.php`, `html/cal.php`, `html/card.php` | `\Baikal\Core\Bootstrap::bootstrap()` then `Baikal\Framework` + `\Baikal\Core\Bootstrap::pdo()` |
| `Baikal\Portal\App::bootstrap()` | Same, then portal JSON API |
| `Baikal\Portal\Install\InstallApp` | Same, then installer |
| `scripts/push-worker.php` | Same, then PDO for WebDAV-Push |
| `scripts/files-maintenance.php` | Same, then PDO for file-home maintenance |

`html/index.php` and `html/admin/**` do not bootstrap (redirects only). `html/health.php` / `html/info.php` do not bootstrap.

`Baikal\Core\Bootstrap` defines `PROJECT_PATH_*` / `PROJECT_URI`, starts the PHP session (or no-op if portal `Auth` already started it), seeds `$_SESSION['CSRF_TOKEN']`, and opens SQLite or PostgreSQL from `config/baikal.yaml`.

---

## Config + user delete (no Flake ORM)

| Piece | Now |
|-------|-----|
| `Baikal\Model\Config\Standard` | Installer persist of `baikal.yaml` system section (no Flake parent) |
| `Baikal\Model\Config\Database` | Installer + `SchemaUpgrade` persist of `database` section |
| `AdminUserService::deleteUser()` | PDO cascade: file-home quarantine, calendars/ABs, `propertystorage`/`locks` path prefixes, `groupmembers` |

Deleted with the ORM: `Baikal\Model\User`, `Principal`, `Calendar`, `AddressBook`, and nested Event/Contact models.

`AdminDashboardService` / `AdminSettingsService` already used PDO / YAML.

---

## Formal: removed

The Formal HTML form stack is deleted. Installer and portal admin write YAML/SQL without Formal widgets.

---

## Flake: removed

`Core/Frameworks/Flake` is deleted (MVC, Database wrappers, ORM, Tools, sample User models). Composer no longer maps `Flake\`.

Do not change Digest `auth_realm` or `/var/www/baikal` as part of this shrink.
