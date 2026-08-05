# BaikalAdmin (removed)

The Formal Web Admin UI was removed. Canonical surfaces:

- Day-to-day admin: `/portal/` → Administration
- Installer: `/portal/install/`
- Redirects: `html/admin/index.php`, `html/admin/install/index.php`

Shared password helpers live in `Baikal\Core\AdminPassword`.
Schema upgrades: `Baikal\Portal\Install\SchemaUpgrade`.
