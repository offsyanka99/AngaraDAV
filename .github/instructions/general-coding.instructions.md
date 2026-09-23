---
applyTo: '**'
---

# Project general coding standards

## Coding Standards

- Use camelCase for variables, functions, and methods
- Use PascalCase for component names, interfaces, and type aliases
- Use single quotes for strings.
- Use ALL_CAPS for constants
- Use 2 spaces for indentation.
- Use arrow functions for callbacks.
- Use async/await for asynchronous code.
- Use const for constants and let for variables that will be reassigned.
- Use destructuring for objects and arrays.
- Use template literals for strings that contain variables.
- Use the latest JavaScript features (ES6+) where possible.
 Don't use BAIKAL_* anymore. Use ANGARA_* instead. 

## Comments

- Default to no comments. Add one only when the code can't explain itself: a non-obvious constraint, a workaround for a specific bug, or a WHY a reader would otherwise have to dig for.
- Never explain WHAT the code does — that's what naming is for.
- Keep it short: one line, sometimes two. If a comment needs a paragraph, the code likely needs a better name or a linked doc instead.

## Testing

- Always create tests for new code — unit tests at minimum, integration tests when possible.
- Unit tests: test individual functions, hooks, and component rendering in isolation.
- Integration tests: test component interactions, data flow between composables, and user workflows that span multiple components.
- Prefer integration tests over unit tests when the value of the feature is in how pieces work together.
- Co-locate test files next to the source file: `ComponentName.spec.tsx` alongside `ComponentName.tsx`.
- Follow the testing conventions in [unit-test.instructions.md](./unit-test.instructions.md) for test structure and best practices.
- Storybook stories must be fully deterministic. Use hardcoded static values and freeze `Date.now` via a decorator when the component reads the clock at render time.

## Documentation

- Keep project `README.md` files up to date when making changes that affect architecture, routes, providers, GraphQL operations, shared library usage, or directory structure.

## Error Handling

- Use try/catch blocks for async operations
- Always log errors with contextual information



## Copilot responses

- If I tell you that you are wrong, think about whether or not you think that's true and respond with facts.
- Avoid apologizing or making conciliatory statements.
- It is not necessary to agree with the user with statements such as "You're right" or "Yes".
- Avoid hyperbole and excitement, stick to the task at hand and complete it pragmatically.

## Code Review — README Validation

- When reviewing code changes, check the `README.md` file(s) of the affected application or library.
- If the code changes invalidate, contradict, or make any section of the README outdated (e.g., setup steps, usage examples, API descriptions, architecture notes), flag it in the review and request a README update.
- This applies to any `README.md` co-located with the project — including root, app-level, and library-level READMEs.

## Commit ignore files

- Ignore pushing files with tokens, passwords, keys or secile.
