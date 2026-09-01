---
name: implement
description: >
  Implement a feature from a code plan, phase by phase. Reads design docs,
  follows all project standards, and verifies each phase before moving to
  the next. USE WHEN: executing a plan from docs/features/{feature}/plan/;
  resuming a partial implementation; implementing a specific phase of a plan.
  Trigger words: implement plan, execute plan, work through phases, implement feature.
agent: agent
model: Claude Opus 4.6 (copilot)
argument-hint: 'path/to/plan/README.md  [phase-number]'
---

# /implement — Execute a Feature Plan Phase by Phase

You are an expert implementer for this monorepo. Your job is to work through a code plan one phase at a time, verifying each phase before moving to the next.

**Core principle:** No phase is complete until the quality gate passes. No exceptions.

## Arguments

- `$ARGUMENTS[0]` — path to the plan README (e.g. `docs/features/add-authorization-to-tabs/plan/README.md`)
- `$ARGUMENTS[1]` — (optional) specific phase number to implement. If omitted, implement all phases in order.

If `$ARGUMENTS[0]` (the plan path) is not provided, ask the user for it before proceeding. `$ARGUMENTS[1]` is optional; if omitted, implement all phases in order without prompting.

---

## Rules

Rules are grouped by when they apply. Check only the relevant subset at each step.

### Per-Edit (every time you write or modify a file)

- **Use the `get_errors` tool on every edited file path** — call `get_errors` with the absolute file path immediately after each edit; fix all TypeScript diagnostics before moving to the next file.
- **`'use client'` first** — if a component needs hooks or browser APIs, add the directive as the very first line.

### Per-Phase (when completing any phase)

- **Never skip verification** — typecheck, lint, and tests must all pass before marking a phase done.
- **Implement ONLY files listed in the phase** — during Phase 1, do not touch files outside the phase scope, even if you see issues. If fixing a TypeScript diagnostic in an in-scope file requires changes to an out-of-scope file, note the issue and defer the fix to Phase 2. Phase 2 is the designated cross-feature cleanup step where cross-cutting fixes are permitted.
- **Use `manage_todo_list`** — track every phase as a todo item; mark in-progress before starting, completed immediately after the quality gate passes.

### Per-Feature (apply throughout the entire implementation)

- **Read standards before coding** — always load all instruction files in Phase 0 before writing any code.
- **Stop at plan/reality mismatch** — if the file you are told to edit doesn't exist or looks significantly different from what the plan describes, stop and ask the user. Do not improvise.

---

## Phase 0: Understand the Mission

### 0.1 Read ALL Project Standards

Always read these before implementing anything:

- [typescript-react.instructions.md](../instructions/typescript-react.instructions.md)
- [unit-test.instructions.md](../instructions/unit-test.instructions.md)
- [fusion.instructions.md](../instructions/fusion.instructions.md)
- [general-coding.instructions.md](../instructions/general-coding.instructions.md)
- [buildable-libraries.instructions.md](../instructions/buildable-libraries.instructions.md)
- [architecture.instructions.md](../instructions/architecture.instructions.md)

### 0.2 Read the Plan

Read the plan README at `$ARGUMENTS[0]` fully:

- All phases and their order
- Phase dependencies
- Existing completion markers — skip completed phases. A phase is considered completed if BOTH its row in the plan's phases table has a `✅` status AND the phase file contains `status: completed`. If only one signal is present, treat the phase as incomplete and report the discrepancy to the user before proceeding.
- File map (new files vs modified files)
- Success criteria

### 0.3 Read the Design Documents

Read the `design:` field from the plan README. Use that value as the absolute or relative path to the design folder. If the `design:` field is absent, fall back to the parent directory of `plan/` and notify the user that the field was missing. Read:

- `README.md` — business context and acceptance criteria
- `01-architecture.md` — module structure, dependency decisions
- `02-behavior.md` — data flow and sequence diagrams
- `03-decisions.md` — key choices and constraints
- `04-testing.md` — test strategy and coverage expectations

If any design document is missing, note which files are absent and proceed only with the documents that exist. If `README.md` or `01-architecture.md` is missing, stop and ask the user before continuing, as these are required for safe implementation.

These are your constraints. Implementation must match them.

### 0.4 Explore the Affected Codebase

Delegate codebase research to the `researcher` subagent to keep the implementation context clean. Pass it the full file map from the plan and ask it to return:

- The current contents and patterns of every file listed under **Modified Files**
- The folder structure and naming conventions of the areas where **New Files** will be created
- Any existing hooks, utilities, or components that the new code should align with or reuse
- Potential conflicts: imports, type names, or exports that overlap with the planned changes

If the subagent's report is missing any file from the plan's file map, or if the subagent returns an error, do not proceed. Read the missing files directly and notify the user that the subagent did not return a complete report.

Use the subagent's report as your reference throughout Phase 1. Only re-read a file directly if the subagent's report is more than one tool-call cycle old for that file, or if a previous edit in the same phase modified it.

### 0.5 Build the Todo List

Create a todo item for each phase in the plan using `manage_todo_list`. If `$ARGUMENTS[1]` is provided, create only one item for that specific phase. Mark all as `not-started`.

---

## Phase 1: Execute — The Implementation Loop

Repeat this loop for each phase (or the single phase if `$ARGUMENTS[1]` provided):

### Step 1 — Prepare

1. Mark the phase todo as `in-progress`.
2. Read the phase file (e.g. `plan/phase-01.md`) fully. Do not skip sections.
3. Verify the subagent's report covers the current contents of each file in this phase. If any file was not included in the subagent's report, read it now before editing.

### Step 2 — Implement

Work through the phase files in the order below (when all types apply):

1. **Types/interfaces** — add or modify type definitions first
2. **Data layer** — constants, static data, pure utilities
3. **Server functions / hooks** — async data-fetching or state logic
4. **Components** — UI; follow architecture.instructions.md server vs client rules
5. **Pages / layouts** — route-level wiring
6. **Tests** — co-located `.spec.ts` / `.spec.tsx` files

After **every file edit**, use the `get_errors` tool on the edited file path and fix any TypeScript diagnostics that can be resolved within the current phase's file scope. If a diagnostic requires changes to an out-of-scope file, note it for Phase 2 and proceed.

### Step 3 — Quality Gate

After all files in the phase are implemented, run verification. Find all affected Nx project names from the files changed (check `project.json` in the nearest parent folder or use `nx_project_details`). To enumerate all affected projects, run `yarn nx show projects --affected --files=$(git diff --name-only HEAD | tr "\n" ",") --no-tui` and use the output list. Fall back to manual `project.json` inspection only if the nx CLI is unavailable. Then run:

```bash
# Build (FIRST — only if any buildable library: spade-types, spade-api, spade-utils, spade-components was modified in this phase)
yarn nx build {project} --no-tui

# Typecheck
yarn nx run {project}:typecheck --no-tui

# Lint
yarn nx run {project}:lint --no-tui

# Tests (if the phase includes tests)
yarn nx run {project}:test --no-tui
```

If multiple projects are touched, run each target for each affected project.

**Fix all failures before marking the phase complete.** Do not move on with a red gate.

If a quality gate command fails with an infrastructure or configuration error (e.g., project not found, daemon not running, missing binary), do not attempt to fix code. Stop and report the exact error output to the user and ask them to resolve the environment issue before continuing.

#### Self-Review Checklist

After the gate is green, verify:

- [ ] **Architecture compliance** — no audience boundary violations; layers respected (no direct DB or processing calls from components)
- [ ] **Standards compliance** — naming conventions match `general-coding.instructions.md`; no `console.log`; no `any` without a `// justification: {reason}` comment on the same line explaining why the type cannot be narrowed; no inline styles
- [ ] **Security** — no secrets in source; no user-controlled data rendered unsanitized; all route guards present per design
- [ ] **Plan completeness** — every file listed in the phase file was created or modified; no listed file skipped; output matches the phase's `## Goal`
- [ ] **Test coverage** — tests written and passing for all new logic; follows `unit-test.instructions.md` conventions

If any checklist item fails, fix it now.

### Step 4 — Mark Complete

Mark the phase todo as `completed`. Report: **Phase N complete.**

---

## Phase 2: Cross-Phase Consistency Check

> **Scope:** This phase may edit any file introduced or modified by this feature to resolve cross-cutting issues. It is the only phase where changes outside a specific phase's file list are permitted.

After all phases pass their quality gates, do a final review across all changed files:

1. **No orphaned code** — no unused imports, dead functions, or unreferenced components introduced by this feature
2. **Naming consistency** — component names, hook names, and file names are consistent across all new files
3. **No duplicate logic** — no logic duplicated that should have been abstracted into a shared function
4. **All tests pass together** — run the full test suite for every affected project at once:
   ```bash
   yarn nx run-many -t typecheck lint test --projects={project1},{project2} --no-tui
   ```
5. **Acceptance criteria met** — re-read `../README.md` (feature design root); verify each acceptance criterion is satisfied by the implementation

If issues are found, fix them and re-run the gate.

---

## Phase 3: Final Report

Present a concise summary to the user:

```markdown
## Implementation Complete: {Feature Name}

### Phases

- ✅ Phase 1: {summary of what was done}
- ✅ Phase 2: {summary}
  ...

### Files Changed

- `path/to/file.ts` — new: {description}
- `path/to/file.tsx` — modified: {description}

### Quality Gates

| Phase | Typecheck | Lint | Tests | Self-Review |
| ----- | --------- | ---- | ----- | ----------- |
| 1     | ✅        | ✅   | ✅    | ✅          |
| 2     | ✅        | ✅   | ✅    | ✅          |

### Acceptance Criteria

- ✅ {criterion 1}
- ✅ {criterion 2}
  ...

### Notes

- Plan deviations: none / {description if any}
- Open questions for review: {list or none}
```

---

## If the Plan Doesn't Match Reality

Stop immediately and report to the user:

- What the plan says (exact quote from phase file)
- What you actually found in the codebase (file path, line)
- Why it matters (what would break if you guessed)
- Your proposed resolution

**Wait for the user's decision. Never improvise.**
