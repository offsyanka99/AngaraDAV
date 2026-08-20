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

## Dead / unused (safe to ignore until a shrink PR)

| Tree | Role |
|------|------|
| `Flake\Controller\*` (`Page`, `HtmlBlock`, `Rpc`, `Cli`) | MVC page renderer; no remaining HTML page uses it |
| `Flake\Core\Template`, `View`, `Route`, `Util\Router*` | Same |
| `Flake\Util\Frameworks` + LessPHP phpstan ignores | `Page.php` Less compile; unused |
| `Core/Frameworks/TwitterBootstrap/` | Linked from leftover `Baikal\Resources\Templates\Page\index.html` |
| `Baikal\Controller\*`, `Baikal\View\*`, `Baikal\WWWRoot\index.php` | Duplicate/old site chrome; live root is `html/index.php` (redirect) |
PHPStan (`phpstan.neon`) still ignores `Flake\Core\Exception` (missing) and `Frameworks\LessPHP\Delegate` on `Flake\Controller\Page.php`. Those ignores go away only if that unused `Page` path is deleted.

Composer autoload still maps `Flake\` to `Core/Frameworks/`.

---

## How to shrink (not done here)

1. **Formal:** **done** (this branch).
2. **Flake MVC (M):** delete unused Controller/Template/Router/TwitterBootstrap/Baikal Controller+View+WWWRoot. Keep `Framework::bootstrap`, Database, Model, Collection, Tools.
3. **Flake bootstrap + ORM (L–XL):** introduce a small `Baikal\Core\Bootstrap` that sets paths + PDO from YAML; rewrite `Baikal\Model\Config\*` and `User::destroy()` to PDO (portal already does most user CRUD that way). Then Flake can go.

Do not change Digest `auth_realm` or `/var/www/baikal` as part of a Flake shrink.
