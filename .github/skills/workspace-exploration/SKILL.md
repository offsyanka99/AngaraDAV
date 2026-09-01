---
name: workspace-exploration
description: "Read-only exploration of an AngaraDAV workspace. USE WHEN answering questions about the workspace, projects, or tasks. ALSO USE WHEN understanding repository structure, project configuration, build and test targets, frontend/backend boundaries, dependencies, Docker setup, or whether Nx metadata is present. Trigger phrases: explore workspace, inspect project, understand repository, list targets, analyze dependencies, workspace architecture."
argument-hint: "What part of the workspace should be explored?"
---

# Workspace Exploration

Use this skill to orient yourself in the repository before planning an implementation. Keep exploration read-only: inspect files, search, project metadata, and dependency graphs, but do not edit files, install dependencies, run builds, start services, or change runtime state.

## Start Here

1. Read [AGENTS.md](../../../AGENTS.md) for architecture, compatibility boundaries, and task-specific conventions.
2. Read [README.md](../../../README.md), then inspect [composer.json](../../../composer.json), [Makefile](../../../Makefile), and [portal/package.json](../../../portal/package.json) for the active toolchains and targets.
3. Use a targeted file listing such as `rg --files -g '!vendor/**'` and targeted searches such as `rg -n "<symbol-or-route>" -g '!vendor/**'` rather than broad recursive reads.
4. Check for Nx before assuming it is available: look for `nx.json`, `workspace.json`, `project.json`, `.nx/`, or an `nx` dependency. When Nx metadata is present, use the Nx MCP tools to inspect projects, targets, and dependency graphs without running tasks.

This repository does not currently use Nx. Its primary configuration surfaces are the root PHP/Composer project and the independent TypeScript/Vite project in [portal/](../../../portal/).

## Map The Relevant Surface

### PHP And DAV Backend

- Protocol entry points are [html/dav.php](../../../html/dav.php), [html/cal.php](../../../html/cal.php), and [html/card.php](../../../html/card.php).
- The portal JSON API begins at [html/api/index.php](../../../html/api/index.php); request routing is owned by [Core/Frameworks/Baikal/Portal/App.php](../../../Core/Frameworks/Baikal/Portal/App.php).
- Active portal server code belongs under [Core/Frameworks/Baikal/Portal](../../../Core/Frameworks/Baikal/Portal). Treat [Core/Frameworks/BaikalAdmin](../../../Core/Frameworks/BaikalAdmin) as legacy compatibility code; see its [README](../../../Core/Frameworks/BaikalAdmin/README.md).
- Composer uses PSR-0 autoloading, so namespace and directory alignment are a dependency boundary.

### Portal Frontend

- Start with [portal/README.md](../../../portal/README.md), then trace a UI action through [portal/src/api.ts](../../../portal/src/api.ts) into `portal/src/api/` and the corresponding backend route in `App.php`.
- [portal/vite.config.ts](../../../portal/vite.config.ts) builds source into generated [html/portal](../../../html/portal). Do not treat generated output as source.

### Runtime And Deployment

- For container behavior, inspect [Dockerfile](../../../Dockerfile), [compose.yaml](../../../compose.yaml), [docker/nginx.conf](../../../docker/nginx.conf), and [docs/local.compose.yaml](../../../docs/local.compose.yaml).
- Treat [config/baikal.yaml.dist](../../../config/baikal.yaml.dist) as the versioned configuration template. The live `config/baikal.yaml` and [Specific/](../../../Specific/) are runtime state, not application source.
- Check [patches/README.md](../../../patches/README.md) before changing Composer/SabreDAV dependencies; vendor patches are applied by [scripts/apply-vendor-patches.sh](../../../scripts/apply-vendor-patches.sh).

## Identify Targets And Dependencies

1. Read the `scripts` section in [composer.json](../../../composer.json) and the targets in [Makefile](../../../Makefile). `make php-test` runs standalone PHP scripts, while Composer scripts provide PHPStan and CS Fixer gates.
2. Read the `scripts` and dependency sections in [portal/package.json](../../../portal/package.json). Portal tests use Node's built-in test runner; Vite and TypeScript are local dev dependencies.
3. For release/runtime dependencies, inspect the build stages and copy boundaries in [Dockerfile](../../../Dockerfile).
4. For test ownership and exact commands, delegate to the [test-engineer](../../agents/test-engineer.agent.md) agent instead of duplicating its test workflow.

## Report Findings

Return a short, evidence-based map tailored to the requested area:

1. Relevant project(s), source roots, and controlling entry points.
2. Configuration files, available build/test targets, and the smallest appropriate validation command.
3. Dependency flow across the affected modules or deployment boundary.
4. Constraints, generated/runtime paths, and unresolved questions that need a focused follow-up.

Link to existing repository documentation rather than restating it. Do not claim a target, dependency, or project graph exists without confirming it in the current workspace.