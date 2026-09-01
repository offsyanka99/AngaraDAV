---
name: admin-api-development
description: "Develop AngaraDAV admin API features end to end. Use when adding or changing /api/admin routes, admin PHP services, admin authorization, CSRF-protected mutations, audit logging, typed portal admin clients, or standalone PHP admin tests. Trigger phrases: admin API, admin endpoint, admin route, admin service, admin settings, user administration."
argument-hint: "Which admin API behavior should be added or changed?"
---

# Admin API Development

Use this workflow for changes that alter the portal administration API. Read [AGENTS.md](../../../AGENTS.md) before editing; it defines the architectural boundary and compatibility constraints.

## Implement The Server Change

1. Locate the closest focused service under [Core/Frameworks/Baikal/Portal/Admin](../../../Core/Frameworks/Baikal/Portal/Admin). Put new validation and domain logic there, not in the PHP front controller or router.
2. Parse JSON request bodies through `HttpIO::jsonBody()` and report client failures with `ApiException` and an appropriate status.
3. Construct a new service in [App.php](../../../Core/Frameworks/Baikal/Portal/App.php) only when needed, then wire its route in `App::dispatchAdminRoutes()`.
4. Preserve the existing admin route pipeline: same-origin and CSRF validation, `AdminAuth::requireAdmin()`, then route dispatch. Do not introduce a path that bypasses it.
5. Audit every mutation with `AdminAudit`; redact passwords, digests, tokens, hashes, connection strings, and other secrets from logs and responses.

## Complete The Portal Contract

1. Add or update the typed client call in [portal/src/api/adminApi.ts](../../../portal/src/api/adminApi.ts) and expose it from [portal/src/api.ts](../../../portal/src/api.ts).
2. Use the shared API client rather than direct `fetch()` so same-origin credentials, CSRF headers, error handling, and session behavior stay consistent.
3. If the feature changes a portal screen, use the `portal-feature-development` skill for the UI workflow.

## Test And Verify

1. Add a standalone PHP script in [tests/php](../../../tests/php) following [AdminSettingsServiceTest.php](../../../tests/php/AdminSettingsServiceTest.php). Tests construct fixtures directly; do not introduce PHPUnit or a shared base class.
2. Add route/authorization coverage when route access changes; [AdminAuthzRoutesTest.php](../../../tests/php/AdminAuthzRoutesTest.php) is the nearest pattern.
3. Run the smallest affected test first, then use the [test-engineer](../../agents/test-engineer.agent.md) agent for the appropriate broader PHP, portal, static-analysis, and formatting checks.

## Guardrails

- The installer API is handled before `App::bootstrap()` in [html/api/index.php](../../../html/api/index.php); do not fold installer behavior into admin routing.
- Preserve unknown configuration values and exclude secrets from read endpoints when editing settings behavior.
- Keep PSR-0 namespace-to-directory alignment under `Baikal\Portal\Admin`.