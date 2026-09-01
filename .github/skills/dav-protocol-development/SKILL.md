---
name: dav-protocol-development
description: "Develop AngaraDAV CalDAV, CardDAV, or WebDAV protocol behavior. Use when changing DAV front controllers, SabreDAV server setup, DAV tree nodes, backends, plugins, authentication, ACL/read-only behavior, WebDAV files, push, or protocol compatibility tests. Trigger phrases: DAV protocol, CalDAV, CardDAV, WebDAV, SabreDAV, DAV plugin, DAV backend."
argument-hint: "Which DAV protocol behavior should be added, fixed, or reviewed?"
---

# DAV Protocol Development

Use this workflow for client-facing DAV behavior. Begin with [AGENTS.md](../../../AGENTS.md), then trace from the relevant entry point into [Core/Frameworks/Baikal/Core](../../../Core/Frameworks/Baikal/Core).

## Trace The Protocol Path

1. Start at [html/dav.php](../../../html/dav.php) for combined DAV, [html/cal.php](../../../html/cal.php) for CalDAV-only, or [html/card.php](../../../html/card.php) for CardDAV-only. Preserve their endpoint and base-URI behavior.
2. Follow setup through [Bootstrap.php](../../../Core/Frameworks/Baikal/Core/Bootstrap.php) and [Server.php](../../../Core/Frameworks/Baikal/Core/Server.php). `Server::initServer()` owns SabreDAV nodes and plugin registration.
3. Determine whether the behavior belongs in a SabreDAV backend, a DAV tree node, or a server plugin. Keep custom code in the matching PSR-0 `Baikal\Core` directory and namespace.
4. Check feature flags and root composition before registering a plugin. Optional file storage must not prevent CalDAV or CardDAV from starting when storage is unavailable.

## Preserve Client Compatibility

1. Use SabreDAV exception semantics for protocol errors. Expected DAV 4xx responses are intentionally handled differently from server faults.
2. Keep discovery, ACL, and mutability metadata aligned with request enforcement. For example, inspect [ReadOnlyPlugin.php](../../../Core/Frameworks/Baikal/Core/Plugins/ReadOnlyPlugin.php) alongside [ReadOnlyCalendarBackend.php](../../../Core/Frameworks/Baikal/Core/ReadOnlyCalendarBackend.php).
3. Do not rename DAV endpoint paths, change base URIs, or alter documented `BAIKAL_*` environment-variable contracts without an explicit compatibility decision.
4. Before modifying SabreDAV dependencies or vendor behavior, read [patches/README.md](../../../patches/README.md). Composer automatically applies the required patch through [scripts/apply-vendor-patches.sh](../../../scripts/apply-vendor-patches.sh).

## Test And Verify

1. Add focused standalone PHP coverage with direct plugin/backend calls and in-memory SQLite where practical. [ReadOnlyPluginTest.php](../../../tests/php/ReadOnlyPluginTest.php) is a representative protocol test.
2. Run the smallest relevant script first. Use [CalendarTimeZoneResolveTest.php](../../../tests/php/CalendarTimeZoneResolveTest.php) when changes could affect the patched timezone behavior.
3. Use [test-engineer](../../agents/test-engineer.agent.md) for the full PHP suite and quality gates. Supplement direct tests with DAV-client interoperability checks when the change affects externally visible semantics.

## Guardrails

- Keep the active portal API implementation separate from DAV protocol work; it lives under `Baikal\Portal`, not `Baikal\Core`.
- Do not add new work to [Core/Frameworks/BaikalAdmin](../../../Core/Frameworks/BaikalAdmin); it is legacy compatibility scaffolding.