---
description: Unit-test best practices
applyTo: '**/*.spec.ts,**/*.spec.tsx'
---

# Unit-Test Best Practices

1. **Test behaviour, not implementation** – interact like a real user and assert visible outcomes.
2. **Mock sparingly** – stub only true boundaries (network, time, randomness). Prefer spies over stubs; let real collaborators run.
3. **Accessible queries first** – use Testing Library’s `getByRole`, `getByLabelText`, `getByText`; fall back to `getByTestId` only when necessary.
4. **One logical concern per `test`** – multiple related assertions are OK if they verify a single behaviour.
5. **Flat structure** – limit `describe` nesting; group only genuinely distinct contexts.
6. **Use `it(...)` consistently**. Start test names with "should" or "should not" to clarify intent.
7. **Arrange → Act → Assert** – keep these sections visually distinct.
8. **Await user interactions** – `await userEvent...`; use `findBy*`/`waitFor` for async state.
9. **Isolate state** – clear mocks and side-effects in `afterEach`.
10. **Readable names** – imperative, user-centric: `"should <behaviour> upon <action>"`.
11. **Targeted assertions over broad snapshots** – snapshot only tiny, stable values.
12. **Use `RenderBuilder` for all component renders** – never call `render` / `renderHook` from `@testing-library/react` directly. Use `new RenderBuilder()` from `@ps/web-spade-test-utils/client` and chain only the providers you need (`.withIntlProvider()`, `.withFeatureFlagProvider()`, `.withApolloProvider()`, etc.). Extract a top-level `render` helper that wraps children in the necessary providers and repeated component boilerplate — tests should only pass the varying content.
13. **Deterministic time** – use fake timers and `advanceTimersByTime`.
14. **Use `beforeEach` / `afterEach` for spies and shared setup** – declare spies (e.g. `vi.spyOn(console, 'log')`) in `beforeEach` and restore them in `afterEach`. Avoid repeating spy setup/teardown in every test body.
15. **Avoid `waitFor` unless necessary** – prefer `findBy*` queries for async elements.
16. **Module-level test constants** – define shared test data as top-level `const` declarations with `as const` for type narrowing.
17. **Scope test runs during development** – pass `--testFiles=<path>` when running `nx run <project>:test` to execute only the file under development. Example: `yarn nx run spade-components:test --no-tui --testFiles=libs/spade/player/components/src/lib/providers/FusionProviders/ButtonProvider.spec.tsx`.
18. **Prefer real providers over mocking hooks/components** – wiring a hook's real provider gives far more confidence than mocking the hook. Reach for the purpose-built provider (query-state testing adapters, intl/theme/apollo render-builder providers, etc.) before a `vi.mock`. Only mock genuine boundaries (network, server actions, time, randomness); never mock a shared UI component just to skip wiring its provider, and don't re-test a collaborator whose own spec already covers that behaviour.
19. **Integration-test server data components** – an async server component that fetches data should have a co-located `*.integration.spec.tsx` that mocks **only** the data-layer boundary it calls, then renders the resolved output (`render(await Component())`). Cover the branching the component owns — e.g. gating, the fetch call, and empty/fallback handling.
