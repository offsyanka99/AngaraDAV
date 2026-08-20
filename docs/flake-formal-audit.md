# Flake / Formal dependency map

Audit of what still needs `Core/Frameworks/Flake` after classic Formal `/admin/` was reduced to redirects (`html/admin/*.php` → `/portal/`).

**Formal is gone** (`Core/Frameworks/Formal` deleted; installer no longer bootstraps it; `formMorphology*` methods removed). Flake **cannot be deleted** until bootstrap + `$GLOBALS['DB']` + `Baikal\Model\*` are replaced.

Deleting Flake today would still break DAV, portal API, install/upgrade, and CLI workers.

---

## Entry points that still call `\Flake\Framework::bootstrap()`

| Caller | Why |
|--------|-----|
| `html/dav.php`, `html/cal.php`, `html/card.php` | Paths, YAML, **`$GLOBALS['DB']`**, then `Baikal\Core\Server` + `$GLOBALS['DB']->getPDO()` |
| `Baikal\Portal\App::bootstrap()` | Same, then portal JSON API |
| `Baikal\Portal\Install\InstallApp` | Same, then installer |
| `scripts/push-worker.php` | Same, then PDO for WebDAV-Push |
| `scripts/files-maintenance.php` | Same, then PDO for file-home maintenance |

`html/index.php` and `html/admin/**` do **not** bootstrap Flake (redirects only). `html/health.php` / `html/info.php` do not bootstrap Flake.

What bootstrap actually does (live):

- Defines `PROJECT_PATH_*`, `PROJECT_URI`, locale/timezone
- Starts PHP session (or no-op if portal `Auth` already started it)
- Seeds `$_SESSION['CSRF_TOKEN']`
- Reads `config/baikal.yaml` and constructs `\Flake\Core\Database\Sqlite` or `\Flake\Core\Database\Pgsql` as `$GLOBALS['DB']`

What bootstrap also wires but **nothing in the current product uses**: `$GLOBALS['ROUTER']`, `TEMPLATESTACK`, LessPHP / `Flake\Controller\Page`.

---

## Still live: Flake database + ORM

Portal and DAV take a **PDO** from `$GLOBALS['DB']->getPDO()`. The wrapper classes (`Flake\Core\Database\*`) are the only place that opens SQLite/PostgreSQL from YAML.

`Baikal\Model\*` extends Flake ORM (`Flake\Core\Model\Db` / `NoDb`) and still runs:

| Model | Used by |
|-------|---------|
| `Baikal\Model\Config\Standard` | Installer (`InstallService`) persist of `baikal.yaml` system section |
| `Baikal\Model\Config\Database` | Installer + `SchemaUpgrade` persist of `database` section |
| `Baikal\Model\User` | `AdminUserService::deleteUser()` prefers `$model->destroy()` when `$GLOBALS['DB']` is up (file-home quarantine + cascade). Create/update users on the portal path is raw PDO. |
| `Calendar`, `AddressBook`, `Principal`, `Calendar\Event`, `AddressBook\Contact` | Loaded as part of `User::persist` / `destroy` (default calendar/AB, counts, cascade) |

`AdminDashboardService` / `AdminSettingsService` use PDO / YAML. They still run **after** Flake bootstrap so `PROJECT_PATH_CONFIG` and `$GLOBALS['DB']` exist.

---

## Formal: removed

The Formal HTML form stack is deleted. Installer and portal admin write YAML/SQL without Formal widgets.

---

## Dead / unused

Flake MVC, Twitter Bootstrap, leftover `Baikal\Controller`/`View`/`WWWRoot`, and Baikal HTML templates are **deleted** (this branch). Remaining Flake is bootstrap + Database + ORM (`Model`, `Collection`, `Requester`, `Tools`).
PHPStan LessPHP / `Flake\Core\Exception` ignores for `Page.php` / `Frameworks.php` were removed with that unused path.

Composer autoload still maps `Flake\` to `Core/Frameworks/`.

---

## How to shrink (not done here)

1. **Formal:** **done**.
2. **Flake MVC:** **done** (Page/Router/templates/Twitter Bootstrap/`Baikal\Controller`/`View`).
3. **Flake bootstrap + ORM (L–XL):** introduce a small `Baikal\Core\Bootstrap` that sets paths + PDO from YAML; rewrite `Baikal\Model\Config\*` and `User::destroy()` to PDO (portal already does most user CRUD that way). Then Flake can go.

Do not change Digest `auth_realm` or `/var/www/baikal` as part of a Flake shrink.
