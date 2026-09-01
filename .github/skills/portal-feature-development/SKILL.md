---
name: portal-feature-development
description: "Develop AngaraDAV TypeScript portal features. Use when adding or changing portal tabs, pages, state, rendering, delegated actions, forms, API clients, navigation, portal Node tests, Vite builds, or generated portal assets. Trigger phrases: portal feature, TypeScript UI, admin portal, calendar UI, contacts UI, tasks UI, notes UI, files UI."
argument-hint: "Which portal feature or UI behavior should be added or changed?"
---

# Portal Feature Development

Use this workflow for the TypeScript/Vite SPA. Start with [portal/README.md](../../../portal/README.md) and edit [portal/](../../../portal/) source only; [html/portal](../../../html/portal) is generated Vite output.

## Find The Owning Domain

1. Treat [portal/src/app.ts](../../../portal/src/app.ts) as a thin orchestrator. Find the relevant feature under [portal/src/app](../../../portal/src/app) and follow its host or `AppOrchestrator` dependencies.
2. Trace existing interactions from rendered `data-action` or `data-form` attributes through [events.ts](../../../portal/src/app/events.ts) and [onAction.ts](../../../portal/src/app/onAction.ts) to the domain action router.
3. For API behavior, define types in [portal/src/api/types.ts](../../../portal/src/api/types.ts), use the matching client in [portal/src/api](../../../portal/src/api), and avoid direct `fetch()` calls.
4. Trace any new portal route or admin page through its loader/navigation code and the backend route in [Core/Frameworks/Baikal/Portal/App.php](../../../Core/Frameworks/Baikal/Portal/App.php).

## Implement Consistently

1. Keep user-visible and async state in `state.*`; update state, render loading/success/error states, and restore transient state in `finally` where applicable.
2. Escape dynamic display values with the local `esc` helper. Use the shared request client so mutation CSRF, credentials, API errors, and session handling remain centralized.
3. Keep event registration delegated and mount-time based. Add action/form handlers to the owning domain instead of growing global routing logic.
4. Follow the current UI language and existing domain patterns; do not hand-edit generated assets.

## Test And Verify

1. Add a colocated Node `node:test` test under [portal/src/app](../../../portal/src/app) for pure logic or behavior that can run without a browser.
2. Run the narrow test through `npm test` in `portal/`, then run `npm run build` or `make portal` when the feature is complete.
3. Use [test-engineer](../../agents/test-engineer.agent.md) for exact test selection and the disposable-instance requirement for Python e2e coverage.

## Guardrails

- Vite uses `/portal/` as its deployment base and emits to `html/portal`; verify changes under that base path.
- `portal/node_modules` must be user-owned. Do not change ownership or run a privileged install as part of feature work.
- For `/api/admin/*` work, also use `admin-api-development` to preserve server-side authorization and audit requirements.