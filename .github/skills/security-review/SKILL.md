---
name: security-review
description: "Review AngaraDAV changes for security regressions. Use when reviewing authentication, authorization, CSRF, sessions, admin routes, audit logs, secrets, file uploads/downloads/storage, DAV/WebDAV behavior, push subscriptions, Nginx headers, Docker configuration, or dependency updates. Trigger phrases: security review, security audit, auth review, CSRF, secrets, SSRF, path traversal, upload security."
argument-hint: "Which change, component, or threat surface should be reviewed?"
---

# Security Review

Use this skill to review a defined change or surface for concrete security regressions. Start with [SECURITY.md](../../../SECURITY.md) and [AGENTS.md](../../../AGENTS.md). Report findings first, ordered by severity, with an exploit path, affected code, and the smallest practical remediation.

## Portal API And Administration

1. Trace a request from [html/api/index.php](../../../html/api/index.php) through [App.php](../../../Core/Frameworks/Baikal/Portal/App.php). Every authenticated mutation must retain centralized same-origin and CSRF enforcement.
2. Review [SameOrigin.php](../../../Core/Frameworks/Baikal/Portal/SameOrigin.php) and [Auth.php](../../../Core/Frameworks/Baikal/Portal/Auth.php) when changing login, sessions, CSRF, cookie flags, throttling, or password verification. Preserve the existing DAV digest compatibility behavior and constant-time comparisons.
3. For `/api/admin/*`, verify the request passes `AdminAuth::requireAdmin()` before the private `dispatchAdminRoutes()` method. Hiding an action in the portal is never sufficient authorization.
4. For an admin mutation, ensure [AdminAudit.php](../../../Core/Frameworks/Baikal/Portal/Admin/AdminAudit.php) records both success and failure without exposing passwords, digests, hashes, tokens, database credentials, or encryption keys.
5. Keep request allow-lists and response redaction in [AdminSettingsService.php](../../../Core/Frameworks/Baikal/Portal/Admin/AdminSettingsService.php) and [AdminUserService.php](../../../Core/Frameworks/Baikal/Portal/Admin/AdminUserService.php). Review confirmation, reauthentication, and rate-limit gates before weakening sensitive operations.

## Files, DAV, And Push

1. Ensure portal file routes remain scoped to the authenticated username. Review [FileService.php](../../../Core/Frameworks/Baikal/Portal/FileService.php) for upload provenance, download limits, content-type handling, and safe download names.
2. Preserve path containment, symlink rejection, quota enforcement, temporary-file writes, atomic replacement, and locks in [HomeStorage.php](../../../Core/Frameworks/Baikal/Core/Files/HomeStorage.php). Do not bypass [FileStorageConfig.php](../../../Core/Frameworks/Baikal/Core/Files/FileStorageConfig.php) for storage-path validation.
3. Trace DAV changes from [html/dav.php](../../../html/dav.php) into [Server.php](../../../Core/Frameworks/Baikal/Core/Server.php). Confirm the SabreDAV auth, ACL, locking, and plugin composition remain active for the applicable endpoint.
4. For WebDAV Push, review [SubscriptionValidator.php](../../../Core/Frameworks/Baikal/Core/Plugins/Push/SubscriptionValidator.php) for authenticated SSRF defenses: HTTPS, port, credential, loopback, private, and link-local destination restrictions.

## Deployment, Secrets, And Dependencies

1. Review [docker/nginx.conf](../../../docker/nginx.conf) and [docker/nginx-security-headers.inc](../../../docker/nginx-security-headers.inc) when changing routes, headers, upload limits, or FastCGI behavior. Locations with their own `add_header` directives must re-include the security-header file.
2. Treat [config/baikal.yaml.dist](../../../config/baikal.yaml.dist) as a secret-free template. Never commit live `config/baikal.yaml`, [Specific/](../../../Specific/), password hashes, database credentials, or encryption keys.
3. When changing Composer/SabreDAV dependencies, check [patches/README.md](../../../patches/README.md) and verify the automatic patch step in [scripts/apply-vendor-patches.sh](../../../scripts/apply-vendor-patches.sh).

## Validate The Reviewed Surface

1. Run the smallest relevant standalone PHP tests first: [SameOriginTest.php](../../../tests/php/SameOriginTest.php), [AdminAuthzRoutesTest.php](../../../tests/php/AdminAuthzRoutesTest.php), [AdminSecurityReviewTest.php](../../../tests/php/AdminSecurityReviewTest.php), [AdminAuditTest.php](../../../tests/php/AdminAuditTest.php), [FileServiceTest.php](../../../tests/php/FileServiceTest.php), [FileHomeStorageTest.php](../../../tests/php/FileHomeStorageTest.php), [FileDownloadRateLimiterTest.php](../../../tests/php/FileDownloadRateLimiterTest.php), [PushPluginTest.php](../../../tests/php/PushPluginTest.php), or [NginxCspHeadersTest.php](../../../tests/php/NginxCspHeadersTest.php).
2. Use [test-engineer](../../agents/test-engineer.agent.md) for broader PHP, static-analysis, formatting, and disposable-instance e2e validation. Never run e2e tests against shared or production deployments.
3. State which attack paths were checked, which were not applicable, and any remaining risk or missing regression coverage.