# Library and runtime upgrade path

Dated **2026-08-20**. Targets are the latest **stable** releases, not alphas/betas.

Do **not** change Digest `auth_realm` (`BaikalDAV`) or `/var/www/baikal`.

Product-settings / slim-YAML work is **not** a library bump — see [admin-settings-yaml.md](admin-settings-yaml.md).

---

## Done on this branch

| Wave | What landed |
|------|-------------|
| 0 | Twig / Guzzle-as-direct-require / unused String gone; dead Dockerfile bits |
| 1 | PHPStan **2.2.8**, CS-Fixer **3.95.20**, Symfony YAML **7.4.15** (later Wave 5 → 8.1) |
| 2 | Docker PHP **8.5**, Composer `php` **`^8.4`**, CI **8.4 / 8.5 / 8.6** |
| 3 | Node **24-alpine**, Vite **8.2.2**, TypeScript **6.0.3** |
| 4 | web-push **11.0.0** over Symfony HttpClient PSR-18 (Guzzle removed) |
| 5 | `symfony/yaml` **8.1.2**, `symfony/http-client` **8.1.4** (`Yaml::dump(..., 4, 2)` unchanged) |
| 6 | `composer:2.10.2`, `nginx:1.31.3-trixie`, CI Postgres **18**, Actions checkout **v7** / cache **v6** / build-push **v7** |

Formal / Flake MVC / live Flake are gone (`Baikal\Core\Bootstrap` + PDO).

---

## Current stack

| Layer | Now |
|-------|-----|
| PHP (Composer) | `^8.4` |
| PHP (image) | **8.5** (Sury `php8.5-*`) |
| CI PHP | 8.4, 8.5, 8.6 (8.6 is Beta — CI-only until GA) |
| sabre/dav | **4.7.1** (no 5.x) |
| Symfony YAML | **8.1.2** |
| web-push | **11.0.0** + `symfony/http-client` **8.1.4** + `nyholm/psr7` |
| PHPStan | **2.2.8** level **0** |
| Portal | TypeScript **6.0.3**, Vite **8.2.2**, Node **24-alpine** |
| nginx | `nginx:1.31.3-trixie` |
| Composer image | `composer:2.10.2` |
| PostgreSQL | Compose + CI: **18** |
| Autoload | PSR-0 `Baikal\` → `Core/Frameworks/` |

---

## Still open

### Wave 7 — project structure — **L** (optional)

1. **PSR-4** autoload for `Baikal\` → `Core/Frameworks/Baikal/`.
2. **PHPStan level** 0 → 2 on `Baikal\Portal` → 4. Do not jump to 8 in one PR.
3. Collapse leftover `BaikalAdmin` WWWRoot redirects if the empty framework dir confuses autoload.
4. PHPUnit for `tests/php/*.php` (optional; not required to upgrade libraries).

---

## What not to upgrade / invent

| Item | Reason |
|------|--------|
| sabre/dav 5.x | **Does not exist.** 4.7.1 is current |
| PHP 8.6 as `require` | Beta until GA. CI-only until then |
| Node 26 in Docker | Current line; prefer 24 LTS |
| TypeScript 7 with Vite 8 | Two compiler/bundler majors; split |
| Digest realm / `/var/www/baikal` | Deploy contract |
| MySQL | Removed on purpose |

---

## Verification (remaining waves)

- `composer phpstan` and CS-Fixer dry-run on CI PHP matrix
- `make php-test` (does not rewrite `composer.lock`)
- Portal: `npm test` + `npm run build` (`make portal`)
- After image changes: `make local-up`, `/health.php`, `/portal/` login
