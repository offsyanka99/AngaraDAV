# Portal `app.ts` modularization plan

**Status:** Phase 0–8 done on branch `refactor/portal-app-modules`  
**Date:** 2026-08-10  
**Scope:** `portal/src/app.ts` (~10 030 at plan start; ~350 after Phase 8) and related SPA modules  
**Goal:** Split the monolith into logical modules without changing user-visible behavior  
**Non-goals (this effort):** React/Vue rewrite, new UI design, API redesign, CSS overhaul  

---

## 1. Problem statement

`portal/src/app.ts` is a single `mountApp(root)` closure that owns:

- all application state (`let` bindings)
- all tab renderers
- all loaders and form/action handlers
- one giant `onAction` dispatcher (~1 750 lines)
- one large `bind()` function (~466 lines)
- shared shell, flash, session, and install-gate logic

That makes Sign-in copy, Files upload, Admin, and Calendar work hard to find, review, and change safely. Related pieces already live outside (`api.ts`, `ui.ts`, `filesUploadPick.ts`, `install.ts`); the next step is to apply the same pattern to domain UI.

### 1.1 Current inventory (approx.)

| Domain | Functions | Est. lines (functions only) | Notes |
|--------|-----------|-----------------------------|--------|
| `onAction` + `bind` | 2 | ~2 200 | Cross-cutting; must thin last |
| `renderHome` | 1 | ~830 | Tab switch + composes tab renderers |
| Admin | ~36 | ~1 450 | Self-contained surface |
| Files (+ upload progress helpers) | ~27 | ~1 230 | Partially extracted (`filesUploadPick.ts`) |
| Calendar / events / month | ~25 | ~930 | Dense date/event logic |
| Shell / tabs / flash / scroll | ~14 | ~1 100 | Includes `shell`, `renderHome` |
| Tasks | ~8 | ~530 | Tree + bulk |
| Session / login / bootstrap | ~9 | ~470 | Auth + install gate |
| DateTime fields | ~17 | ~400 | Good pure-ish extract |
| Contacts | ~9 | ~340 | + import helpers elsewhere |
| Import progress (ICS/VCF) | ~8 | ~250 | Shared by calendars/contacts |
| Notes | ~3 | ~170 | Smallest tab |
| Other utilities | various | remainder | paths, formatters, RRULE helpers |

**Target after full refactor:**

| File / area | Soft size goal |
|-------------|----------------|
| `app.ts` (orchestrator only) | 300–600 lines |
| Domain modules | 300–900 lines each |
| Pure helpers | small, ideally unit-testable |

---

## 2. Design principles

1. **Behavior freeze first** — each phase is a move/rename with no intentional UX or API changes. Visual diffs should be empty; network traffic and action names stay the same.
2. **Incremental PRs** — one domain (or one pure-helper package) per PR when possible. Prefer stackable merges over a big-bang rewrite.
3. **Shared context, not globals** — replace the implicit closure with an explicit `AppContext` (or equivalent) passed into domain modules.
4. **Keep the stack** — stay on vanilla TS + Vite. No framework migration in this plan.
5. **`api.ts` / `ui.ts` stay shared infrastructure** — domains call `api.*` and `renderModal` / `esc`; they do not reimplement transport or modal HTML primitives.
6. **Action ownership** — each domain owns its `data-action` handlers and returns whether it handled the event.
7. **Render ownership** — each domain owns its tab/modal HTML string builders; `renderHome` / `render()` only compose.
8. **State stays centralized initially** — one `AppState` object (or still fields on context). Avoid multiple competing stores until the split is stable.
9. **Tests gate risky moves** — use existing portal/API tests where present; add focused pure-function tests for extracted utils.

---

## 3. Target architecture

```text
portal/src/
  main.ts                 # entry (unchanged role)
  app.ts                  # mountApp, createContext, render(), thin onAction/bind
  api.ts                  # HTTP (unchanged role)
  ui.ts                   # modal/flash helpers (unchanged role)
  log.ts
  timezones.ts
  filesUploadPick.ts      # already extracted
  install.ts              # installer SPA (leave alone unless needed)

  app/
    context.ts            # AppState + AppContext types, createAppContext()
    types.ts              # TabId, AdminPageId, shared domain types
    constants.ts          # storage keys, APP_VERSION_FALLBACK, DOCS_URL
    sectionInfo.ts        # SECTION_INFO help copy
    shell.ts              # shell(), footer, user menu chrome helpers
    flash.ts              # setFlash / clearFlash / renderFlashBanner
    session.ts            # idle timer, clearPortalSessionState, handleSessionExpired, install gate
    bootstrap.ts          # bootstrap(), loadHome orchestration hooks
    login.ts              # renderLogin(), onLogin()
    datetime.ts           # portal date/time field + popover
    importProgress.ts     # ICS/VCF import progress modal
    scroll.ts             # captureScroll / restoreScroll
    format.ts             # formatBytes, formatElapsed, formatWhen, etc.
    paths.ts              # joinStoragePath, basenamePath (files helpers if not in files/)

    calendars/
      index.ts            # public API for tab
      render.ts           # month grid, calendar list pieces inside home
      eventModal.ts
      loaders.ts
      actions.ts          # create/edit/delete cal, save event, import
      holidays.ts

    contacts/
      index.ts
      render.ts           # (or pieces used by renderHome)
      loaders.ts
      actions.ts
      form.ts             # contactBodyFromForm, photo

    tasks/
      index.ts
      render.ts
      tree.ts             # tasksInTreeOrder, descendants
      actions.ts

    notes/
      index.ts
      render.ts
      actions.ts

    files/
      index.ts
      render.ts           # renderFilesTab, breadcrumb, status
      loaders.ts
      transfer.ts         # folder tree copy/move
      upload.ts           # startFilesUpload, progress modal, browse wiring
      actions.ts          # rename/delete/mkdir/bulk

    admin/
      index.ts
      overview.ts
      users.ts
      settings.ts
      database.ts
      loaders.ts
      actions.ts
```

Exact filenames can be adjusted during implementation; the **domain boundaries** matter more than the folder names.

### 3.1 `AppContext` sketch

```ts
// app/context.ts (illustrative)
export type AppState = {
  // all current mountApp `let` fields move here
  user: PortalUser | null;
  busy: boolean;
  flash: Flash;
  activeTab: TabId;
  // calendars, contacts, files, admin, ...
};

export type AppContext = {
  root: HTMLElement;
  state: AppState;
  api: typeof api;

  /** Full re-render of the app into root */
  render: () => void;
  setFlash: (type: FlashType, message: string) => void;
  clearFlash: () => void;

  /** Optional: requestAnimationFrame helpers, log, etc. */
};
```

**Rules:**

- Modules **read/write `ctx.state`** for their fields; they do not import a singleton state module that other modules mutate opaquely (easier testing and tracing).
- `render` is owned by the orchestrator so domains never call `root.innerHTML = ...` for the whole app (except login/shell composition via returned strings).
- Domains may update **in-place DOM** for progress bars (existing pattern) via `ctx.root.querySelector`, same as today.

### 3.2 Action routing sketch

```ts
// app.ts
async function onAction(ev: Event): Promise<void> {
  const t = (ev.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!t) return;
  const action = t.dataset.action;
  if (!action) return;

  if (await handleShellAction(ctx, action, t, ev)) return;
  if (await handleLoginAction(ctx, action, t, ev)) return;
  if (await handleFilesAction(ctx, action, t, ev)) return;
  if (await handleCalendarsAction(ctx, action, t, ev)) return;
  if (await handleContactsAction(ctx, action, t, ev)) return;
  if (await handleTasksAction(ctx, action, t, ev)) return;
  if (await handleNotesAction(ctx, action, t, ev)) return;
  if (await handleAdminAction(ctx, action, t, ev)) return;
}
```

Each handler returns `true` if the action was recognized (even if it no-ops due to `busy`).

### 3.3 Bind routing sketch

Today `bind()` attaches many listeners after every render. Target:

```ts
function bind(): void {
  bindShell(ctx);
  bindLogin(ctx);          // no-op if not on login
  if (state.user) {
    bindCalendars(ctx);
    bindContacts(ctx);
    bindTasks(ctx);
    bindNotes(ctx);
    bindFiles(ctx);
    bindAdmin(ctx);
  }
  bindImportProgress(ctx);
  bindGlobalKeys(ctx);     // Escape, etc. — once per mount if possible
}
```

**Improvement opportunity (optional, later phase):** attach stable delegated listeners once on `root` instead of re-binding every render. Not required for the first extract PRs; document as Phase 8 optimization.

**Status (2026-08-12):** Implemented on branch `refactor/portal-delegated-events` — see [portal-delegated-events-plan.md](portal-delegated-events-plan.md) and [portal-delegated-events-verification.md](portal-delegated-events-verification.md). Mount-time `registerPortalEvents` + thin `bindAfterRender`; automated listener stability green; manual smoke before merge.

---

## 4. Recommended reasoning level (AI / agent work)

When implementing a phase with an AI coding agent (or when reviewing how much scrutiny to apply), use the **reasoning level** below. Levels scale with **risk of silent breakage**, **size of mechanical refactors**, and **number of edge cases** — not with “how smart the model is.”

| Level | When to use | Agent posture |
|-------|-------------|----------------|
| **Low** | Pure moves, docs, checklist, obvious renames | Follow the plan; minimal exploration; run `tsc` / build |
| **Medium** | Cross-file wiring, shared state touch, session/auth | Read call sites; preserve behavior; targeted smoke; avoid drive-by refactors |
| **High** | Large state migrations, calendar/datetime, upload pipelines, bind redesign | Map all callers first; small commits; explicit edge-case checklist; prefer move-only diffs |
| **Very high** | Optional: full delegated-event rewrite + multi-domain cutover in one go | **Avoid** — split work; do not combine with feature changes |

**Summary by phase**

| Phase | Risk | **Reasoning level** | Why |
|-------|------|---------------------|-----|
| **0 — Prep** | none | **Low** | Checklist, build verify, plan acceptance only |
| **1 — Pure extracts** | low | **Low** (datetime: **Medium**) | Mechanical file moves; datetime helpers have subtle format/locale edge cases |
| **2 — AppContext / state object** | medium | **High** | Touches nearly every binding in `mountApp`; dual-state bugs are silent |
| **3 — Shell / session / login** | medium | **Medium** | Install gate + idle timeout + unauthorized paths; fewer files than Phase 2 |
| **4 — Files** | medium–high | **High** | Upload/FSA/drop/progress + copy/move tree; multi-modal state |
| **5 — Admin** | medium | **Medium** | Large surface but clear boundaries; CONFIRM/password edge cases need care |
| **6 — Calendars** | high | **High** | All-day/timed conversion, RRULE, multi-select month grid, import |
| **7 — Contacts / tasks / notes** | medium | **Medium** overall; contacts **High** if photo+import in same PR | Notes/tasks simpler; contacts form/photo/import denser |
| **8 — Thin orchestrator** | low–medium | **Medium** (composition only); **High** if delegated bind rewrite | Composition is wiring; one-shot event delegation is easy to get subtly wrong |

**Rules of thumb**

1. Prefer the **lower** level that still covers the phase’s edge cases; raise only when the PR mixes concerns (e.g. Phase 2 + Phase 4 in one go → **Very high**, and **don’t**).
2. If a phase is split into sub-PRs (recommended for 4–7), each sub-PR can drop one notch (e.g. Files *render-only* extract → **Medium**; Files *upload* extract → **High**).
3. Human review should match the level: Low = spot-check; High = smoke checklist + diff focus on state/action wiring.

---

## 5. Phased plan

### Phase 0 — Prep (no behavior change)

**Reasoning level:** **Low**  
**Why:** No production code moves; validate tooling and agree scope. Overthinking adds no safety.

**Deliverables**

- [x] This plan reviewed/accepted (this document).
- [x] Confirm `tsc --noEmit` works in `portal/` (Vite full build may need writable `node_modules` if root-owned).
- [x] Note any flaky manual smoke paths (login, Files upload, Admin users, calendar create event).
- [x] Optional: add a short `portal/README.md` section “Module layout (WIP)” pointing here.

**Manual smoke notes (Phase 0):** After each extract PR, prefer checking Sign-in copy, Files size/mtime display, open event date/time popover, and one Admin page load. Upload/FSA and calendar RRULE remain higher-risk for later phases.

**Exit criteria:** team agrees on domain boundaries and `AppContext` approach.

---

### Phase 1 — Pure extracts (lowest risk)

**Reasoning level:** **Low** for constants / types / `sectionInfo` / `format` / `paths`; **Medium** for `datetime.ts`  
**Why:** Most extracts are pure cut-paste + imports. Date/time helpers affect event create/edit and locale; worth checking call sites and one event-modal smoke.

**Move with zero/minimal state coupling:**

| Extract to | Contents |
|------------|----------|
| `app/constants.ts` | `TAB_STORAGE_KEY`, `ADMIN_PAGE_STORAGE_KEY`, `APP_VERSION_FALLBACK`, `DOCS_URL` |
| `app/types.ts` | `TabId`, `AdminPageId`, flash type aliases if shared |
| `app/sectionInfo.ts` | `SECTION_INFO` (+ any `infoTitle` helper if pure enough) |
| `app/format.ts` | `formatBytes`, `formatElapsed`, `formatFileSize`, `formatWhen`, `formatMtime`, `sortHeader` (if pure) |
| `app/paths.ts` | `joinStoragePath`, `basenamePath` (or keep files-local) |
| `app/datetime.ts` | All portal date/time field + popover helpers (~400 lines) |

**Steps**

1. Create files; re-export from `app.ts` temporarily if needed to keep diffs small.
2. Replace local functions with imports.
3. Build + smoke Sign-in, open event modal (datetime), Files size display.

**Risk:** low  
**PR size:** small–medium  
**Rollback:** trivial revert

**Phase 1 status (2026-08-10):** Done on `refactor/portal-app-modules`.

- Created `portal/src/app/{constants,types,sectionInfo,format,paths,datetime}.ts`.
- `app.ts` imports pure helpers; thin wrappers remain for `portalUi`-dependent datetime prefs and popover open state.
- Stateful DT field get/set (`getDtFieldCurrentValue` / `setDtFieldValue`) still in `app.ts` (Phase 6).
- `tsc --noEmit` clean.

---

### Phase 2 — Context skeleton

**Reasoning level:** **High**  
**Why:** Nearly every `let` in `mountApp` becomes `state.*`. Missed references, stale closures, or dual writes (`let` + `state`) cause intermittent UI bugs that typecheck may not catch. Stay mechanical: no domain file moves in this PR.

**Deliverables**

- [x] `app/context.ts` with `AppState` / `AppContext` types + `createAppState()` + `APP_STATE_KEYS`.
- [x] `mountApp` creates `const state = createAppState(...)` and assigns `ctx: AppContext = { root, state, api, render, setFlash, clearFlash }`.
- [x] **2b:** all former `let` fields live on `state`; references use `state.*` (no dual-write aliases).

Recommended: **one PR that only introduces `state` object + `ctx`**, updating references inside `app.ts` without extracting domains yet. Use search-and-replace carefully; run `tsc`.

**Exit criteria:** app runs identically; `ctx` exists and is ready for domain modules.

**Risk:** medium (mechanical but large diff)  
**Mitigation:** no file moves in the same PR as the state object migration.

**Phase 2 status (2026-08-10):** Done on `refactor/portal-app-modules`.

- Moved `ImportProgress` / `FilesUploadProgress` types into `context.ts`.
- Identifier rewrite: skip property access (`.foo`) and object keys; fixed `...spread` false negatives (spread was mistaken for property access).
- Local form field `notes` kept bare (must not map to `state.notes`).
- `tsc --noEmit` clean; domain modules not yet extracted (Phase 3+).

---

### Phase 3 — Shell, flash, session, login

**Reasoning level:** **Medium**  
**Why:** Moderate surface area, but auth/session/install-gate paths are security- and UX-sensitive. Need careful read of unauthorized handlers and upgrade banner; not as wide as the full state migration.

**Extract**

| Module | Functions / concerns |
|--------|----------------------|
| `app/flash.ts` | `setFlash`, `clearFlash`, `renderFlashBanner` |
| `app/session.ts` | idle timer, `clearPortalSessionState`, `handleSessionExpired`, install gate helpers |
| `app/shell.ts` | `shell()`, user menu open/outside click helpers |
| `app/login.ts` | `renderLogin()`, `onLogin()` |
| `app/scroll.ts` | `captureScroll` / `restoreScroll` |
| `app/bootstrap.ts` | `bootstrap()`, initial `/api/ui` + session restore flow pieces |

**Why early:** Sign-in text and session UX become editable without opening a 10k-line file.

**Exit criteria:** logged-out and logged-in chrome match before/after; session timeout still redirects to login with correct messaging; install/upgrade gate banner still works.

**Risk:** medium (session edge cases)  
**Smoke:** cold login, failed login, idle timeout, upgrade-required gate.

**Phase 3 status (2026-08-10):** Done on `refactor/portal-app-modules`.

| Module | Contents |
|--------|----------|
| `app/flash.ts` | `setFlash`, `clearFlash`, `renderFlashBanner` |
| `app/scroll.ts` | `captureScroll`, `restoreScroll` |
| `app/session.ts` | idle timer, install gate, `clearPortalSessionState`, `handleSessionExpired`, `userIsAdmin` / `adminUiEnabled`, `applyPortalUi` |
| `app/shell.ts` | chrome HTML + user-menu outside click |
| `app/login.ts` | Sign-in screen HTML (edit copy here) |
| `app/bootstrap.ts` | `bootstrap` + `onLogin` (with deps for loaders still in `app.ts`) |

`app.ts` keeps thin wrappers that pass `state` / `render` / progress modals. Sign-in text lives in `login.ts`. `tsc --noEmit` clean.

---

### Phase 4 — Files domain

**Reasoning level:** **High** (or **Medium** per sub-PR if split: render → actions → upload/drop)  
**Why:** Upload progress, FSA vs input fallbacks, panel drop, transfer tree, and multi-modal state interact. Easy to break folder structure, empty dirs, or busy/progress locking. Prefer sub-PRs to keep each review at Medium–High, not one Very high blob.

**Extract** `app/files/*` using existing `filesUploadPick.ts`.

| File | Responsibility |
|------|----------------|
| `render.ts` | `renderFilesTab`, breadcrumb, quota, bulk bar, modals HTML |
| `loaders.ts` | `loadFiles` |
| `transfer.ts` | folder tree, `openFilesTransfer`, `onFilesTransfer`, blocked dest |
| `upload.ts` | progress modal, `startFilesUpload`, browse menu wiring |
| `actions.ts` | rename, delete, mkdir, refresh, nav, select, bulk |
| `index.ts` | `renderFilesTab(ctx)`, `handleFilesAction`, `bindFiles` |

**Preserve behavior**

- Upload ▾ Files… / Folder… + FSA fallbacks  
- Panel drop  
- Copy/move/rename/delete for files **and** folders  
- Progress dialog  

**Exit criteria:** full Files tab manual smoke + existing backend files tests still pass.

**Risk:** medium–high (upload + multi-modal state)  
**PR:** can be split (render first, then actions, then upload).

**Phase 4 status (2026-08-10):** Done on `refactor/portal-app-modules`.

| Module | Role |
|--------|------|
| `app/files/host.ts` | `FilesHost` (`state`, `root`, `render`, flash) |
| `app/files/loaders.ts` | `loadFiles` |
| `app/files/transfer.ts` | copy/move tree + `onFilesTransfer` |
| `app/files/upload.ts` | menu, progress, FSA/browse, `startFilesUpload` |
| `app/files/render.ts` | `renderFilesTab` + breadcrumb/modals HTML |
| `app/files/actions.ts` | rename/mkdir form handlers |
| `app/files/actionsRouter.ts` | `handleFilesAction` for all `files-*` actions |
| `app/files/bind.ts` | upload inputs + panel drop + select-all indeterminate |
| `app/files/index.ts` | public re-exports |

`app.ts` builds `filesHost` next to `ctx` and keeps thin wrappers for loaders/render/shell/session hooks. `tsc --noEmit` clean.

---

### Phase 5 — Admin domain

**Reasoning level:** **Medium**  
**Why:** Large but well-bounded (admin-only routes/actions). Watch password fields, last-admin rules, and database CONFIRM. Less temporal/state coupling than Files or Calendars.

**Extract** `app/admin/*`.

| File | Responsibility |
|------|----------------|
| `overview.ts` | dashboard cards |
| `users.ts` | list, detail, create/edit/delete modals, cal/ab sub-resources |
| `settings.ts` | system settings form + reset modal |
| `database.ts` | DB form + CONFIRM modal |
| `loaders.ts` | all `loadAdmin*` |
| `actions.ts` | save handlers, page activation |
| `index.ts` | `renderAdminSection`, `handleAdminAction`, `bindAdmin` |

**Exit criteria:** Admin Overview / Users / Settings / Database behave as before; capabilities gating unchanged.

**Risk:** medium  
**Smoke:** create user, edit password, settings save, database CONFIRM blocked without text.

**Phase 5 status (2026-08-10):** Done on `refactor/portal-app-modules`.

| Module | Role |
|--------|------|
| `app/admin/host.ts` | `AdminHost` (+ `userIsAdmin`, `activateTab`, `persistTab`, …) |
| `app/admin/meta.ts` | Subnav, status badges, coming-soon banner |
| `app/admin/loaders.ts` | All `loadAdmin*` API loaders |
| `app/admin/overview.ts` | Overview dashboard HTML |
| `app/admin/users.ts` | Users shell/detail/modals + user/cal/ab save |
| `app/admin/settings.ts` | System settings + reset modal + save |
| `app/admin/database.ts` | Database form, test, CONFIRM modal |
| `app/admin/page.ts` | `activateAdminPage`, `renderAdminSection` |
| `app/admin/actionsRouter.ts` | All `admin-*` actions |
| `app/admin/bind.ts` | Admin form submit listeners |
| `app/admin/index.ts` | Public re-exports |

`app.ts` builds `adminHost` and thin wrappers for bootstrap/tabs (`loadAdmin*`, `activateAdminPage`, `renderAdminSection`, `adminSubnavButtons`). `tsc --noEmit` clean.

---

### Phase 6 — Calendars + datetime already extracted

**Reasoning level:** **High**  
**Why:** Highest density of edge cases (all-day vs timed, RRULE, multi-calendar month grid, shares, import). Behavior freezes are hard to verify from types alone; require deliberate smoke and careful move order (modals/actions before peeling `renderHome`).

**Extract** `app/calendars/*` + ensure `app/datetime.ts` is used by event modal.

| File | Responsibility |
|------|----------------|
| `render.ts` | month grid pieces, calendar list fragments used by `renderHome` |
| `eventModal.ts` | `renderEventModal`, blank event, RRULE UI helpers |
| `loaders.ts` | `loadMonthEvents`, `loadShares`, default calendar |
| `actions.ts` | save event, create/edit/delete calendar, import |
| `holidays.ts` | holidays toggle binding |
| `index.ts` | public handlers |

**Note:** `renderHome` currently mixes calendars + contacts chrome (~830 lines). Prefer:

1. Extract calendar **modals/actions** first.  
2. Later peel list/grid sections out of `renderHome` into `calendars/render.ts` returning HTML fragments.

**Exit criteria:** month navigation, multi-select calendars, create/edit event (timed + all-day), RRULE, share, import progress.

**Risk:** high (datetime edge cases, all-day conversion)  
**Smoke:** create timed event, all-day, recurring, import medium `.ics`.

**Phase 6 status (2026-08-10):** Done on `refactor/portal-app-modules`.

| Module | Role |
|--------|------|
| `app/calendars/host.ts` | `CalendarsHost` (+ datetime helpers, `loadHome`, `onImportContacts`) |
| `app/calendars/loaders.ts` | shares, month events, selection, colors |
| `app/calendars/month.ts` | Month grid HTML |
| `app/calendars/eventModal.ts` | Event modal, RRULE helpers, blank event |
| `app/calendars/importProgress.ts` | Shared ICS/VCF progress UI |
| `app/calendars/import.ts` | `.ics` import + bind import inputs |
| `app/calendars/actions.ts` | share, save event, create/edit calendar |
| `app/calendars/holidays.ts` | Holidays form toggle |
| `app/calendars/index.ts` | Public re-exports |

`renderHome` still composes calendar lists inline (peel later if needed). DT field open/set stays in `app.ts` (stateful). Contacts `.vcf` import remains in `app.ts` via `calendarsHost.onImportContacts`. `tsc --noEmit` clean.

---

### Phase 7 — Contacts, tasks, notes

**Reasoning level:** **Medium** for notes and tasks; **High** for contacts if form + photo + import move together (else **Medium** if contacts split)  
**Why:** Notes are small and low-coupling. Tasks add tree/bulk logic but are localized. Contacts touch multi-field forms, photos, and VCF import — raise reasoning if done as one PR.

**Order:** notes (smallest) → tasks → contacts (forms + photo + import).

| Domain | Key extract |
|--------|-------------|
| Notes | `renderNotesTab`, `onSaveNote`, `loadNotes` |
| Tasks | tree order, bulk actions, `renderTasksTab`, `onSaveTask` |
| Contacts | loaders, form body builders, photo, import, save |

Shared import progress stays in `app/importProgress.ts`.

**Exit criteria:** each tab CRUD smoke; contact photo; task bulk complete; note create.

**Risk:** medium  
**Contacts risk slightly higher** (photo base64, multi email/phone).

**Phase 7 status (2026-08-10):** Done on `refactor/portal-app-modules`.

| Module | Role |
|--------|------|
| `app/keys.ts` | Shared `itemKey(instanceId, uri)` for tasks/notes |
| `app/notes/host.ts` | `NotesHost` |
| `app/notes/loaders.ts` | `loadNotes` |
| `app/notes/render.ts` | `renderNotesTab` |
| `app/notes/actions.ts` | `onSaveNote` |
| `app/tasks/host.ts` | `TasksHost` |
| `app/tasks/tree.ts` | Tree order, parent options, writable selection |
| `app/tasks/loaders.ts` | `loadTasks` |
| `app/tasks/render.ts` | `renderTasksTab` |
| `app/tasks/actions.ts` | bulk actions + `onSaveTask` |
| `app/contacts/host.ts` | `ContactsHost` (+ import progress hooks) |
| `app/contacts/loaders.ts` | load/open/new contact, empty address |
| `app/contacts/photo.ts` | photo base64 + bind input |
| `app/contacts/form.ts` | form sync / body builder |
| `app/contacts/import.ts` | VCF import via shared progress |
| `app/contacts/actions.ts` | save contact, create/edit address book |

`app.ts` keeps thin wrappers + hosts; `onAction`/`bind` still own task/note/contact click paths and form wiring. `tsc --noEmit` clean; Vite build ok.

---

### Phase 8 — Thin orchestrator + bind optimization

**Reasoning level:** **Medium** for composition-only thinning; **High** if implementing one-time delegated `click`/`submit`/`change` on `root`  
**Why:** Wiring domains into a thin `app.ts` is mostly structural. Replacing re-bind-every-render with delegated listeners can miss dynamic controls, double-fire handlers, or break Escape/modals — treat that as a separate high-care step.

**Deliverables**

- [x] `app.ts` only: `mountApp`, host/`AppOrchestrator` wiring, thin `render()`, bootstrap call.
- [x] `renderHome` becomes a thin switch (`app/home.ts` → calendars/contacts homes + tab renderers).
- [ ] Optional: **single delegated** `click` / `submit` / `change` listeners on `root` registered once at mount (deferred — still re-bind after render via `app/bind.ts`).  
  → detailed plan: [`docs/portal-delegated-events-plan.md`](portal-delegated-events-plan.md)
- [ ] Optional: Escape key handler registered once (still inside `bind`).  
  → covered in delegated-events plan Step 5
- [x] Import direction: `app.ts` → `app/*` domains; domains do not import `app.ts`.
- [ ] Optional follow-up: split huge `onAction.ts` into domain routers.  
  → detailed plan: [`docs/portal-onaction-split-plan.md`](portal-onaction-split-plan.md)

**Exit criteria:** `app.ts` under ~600 lines; no circular deps; full smoke checklist green.

**Risk:** medium if doing delegated events; low if only thinning composition.

**Phase 8 status (2026-08-10):** Done (composition thinning; delegated bind + onAction split left optional with dedicated plans).

| Module | Role |
|--------|------|
| `app/orchestrator.ts` | `AppOrchestrator` runtime bag |
| `app/home.ts` | Tab switch + shell chrome |
| `app/calendars/home.ts` | Calendars tab HTML |
| `app/contacts/home.ts` | Contacts tab HTML |
| `app/onAction.ts` | Central `data-action` dispatcher |
| `app/bind.ts` | Post-render DOM listeners |
| `app/navigation.ts` | `loadHome`, `activateTab`, normalize |
| `app/datetimeFields.ts` | DT field helpers on orchestrator |
| `app/routing.ts` | Tab/hash storage helpers |
| `app/badges.ts` | Access badges + import result labels |
| `app/infoModal.ts` | Section (i) modal |
| `app/exportBlob.ts` | Save/download blob |
| `app/bindColorPair.ts` | Color picker sync |

`app.ts` ≈ 350 lines. `tsc --noEmit` clean; Vite build ok. Delegated one-shot listeners not implemented (behavior freeze).

---

## 6. Dependency rules

```text
main.ts
  └── app.ts (orchestrator)
        ├── app/context.ts
        ├── app/login.ts, shell.ts, session.ts, ...
        ├── app/calendars|contacts|tasks|notes|files|admin
        ├── filesUploadPick.ts
        ├── api.ts
        ├── ui.ts
        ├── log.ts
        └── timezones.ts

install.ts  (independent mount; do not couple to app/ domains)
```

- Domain modules **may** import siblings only for truly shared pure helpers (`format`, `datetime`, `importProgress`).
- Prefer **not** importing `admin` from `files` (etc.).
- `filesUploadPick.ts` stays free of `AppContext` (pure I/O helpers).

---

## 7. Testing strategy

### 6.1 Automated (existing)

- Portal/API PHP tests and e2e where available (`tests/`, `tests/portal_*`).
- `cd portal && npx tsc --noEmit` on every PR.
- `vite build` (or CI docker build) for asset compile.

### 6.2 Pure unit tests (add when extracting)

Good candidates once pure:

- path join / basename  
- `tasksInTreeOrder` / descendant sets  
- datetime parse/format helpers  
- transfer dest blocking (`isBlockedTransferDest`)

Place under `portal/` only if a lightweight test runner is introduced; otherwise keep logic pure and cover via existing Python/PHP integration tests. **Do not block Phase 1 on a new test harness.**

### 6.3 Manual smoke checklist (every domain PR)

| Area | Checks |
|------|--------|
| Auth | Login success/fail; logout; session timeout message |
| Calendars | Month nav; multi-select; create/edit/delete event; import |
| Contacts | List/search; edit; photo; book export/import |
| Tasks | Create; parent/subtask; bulk status |
| Notes | Create/edit/delete |
| Files | Upload files; upload folder; drop mix; copy/move/rename/delete file+folder; bulk |
| Admin | Overview; user CRUD; settings; database CONFIRM |
| Install gate | If upgrade required, login shows banner + installer link |

---

## 8. PR / commit conventions

- One domain (or one pure-helper package) per PR when possible.
- Commit message examples:
  - `Portal: extract sectionInfo and format helpers from app.ts`
  - `Portal: introduce AppContext and centralize state object`
  - `Portal: move Files tab into app/files modules`
- Do **not** mix refactors with feature work (upload UX, version bumps, etc.).
- Rebuild `html/portal/assets` in the same PR when TS changes affect the shipped SPA (project convention).

---

## 9. Risks and mitigations

| Risk | Mitigation |
|------|------------|
| Dual state (let + state object) diverges | Migrate to `state` in one PR; ban parallel `let` mirrors |
| Circular imports | Orchestrator imports domains; domains only import `context` + utils |
| Missed `data-action` after split | Keep action string list in domain `actions.ts`; grep for `data-action=` vs handlers |
| Progress modal in-place DOM breaks | Keep existing `update*ProgressDom` APIs; test long upload/import |
| Review fatigue on large moves | Prefer “move only” PRs; formatting-only changes separate |
| `bind()` order dependencies | Document required order; later move to delegation |
| Merge conflicts with parallel feature work | Finish or pause features mid-domain; land Phase 1–2 early |

---

## 10. Success metrics

- [ ] `portal/src/app.ts` ≤ ~600 lines (orchestrator).
- [ ] No domain file ≥ ~1 200 lines without a follow-up split plan.
- [ ] Sign-in copy lives in `app/login.ts` (or equivalent) only.
- [ ] Files upload/browse/drop live under `app/files/` + `filesUploadPick.ts`.
- [ ] Admin UI under `app/admin/`.
- [ ] `tsc --noEmit` clean; production build succeeds.
- [ ] Manual smoke checklist passes on `main`.

---

## 11. Suggested timeline (indicative)

Assuming focused sequential work (adjust to capacity):

| Phase | Effort (indicative) |
|-------|---------------------|
| 0 Prep | 0.5 day |
| 1 Pure extracts | 0.5–1 day |
| 2 AppContext / state object | 1–2 days |
| 3 Shell / session / login | 1 day |
| 4 Files | 1–2 days |
| 5 Admin | 1–2 days |
| 6 Calendars | 2–3 days |
| 7 Contacts / tasks / notes | 1–2 days |
| 8 Thin orchestrator + optional bind once | 1 day |

**Total:** roughly 1.5–2.5 weeks calendar time for a single developer, not including wait on review.

---

## 12. Immediate next action

1. Accept this plan (or annotate open questions below).  
2. Open **Phase 1 PR** at **Low/Medium** reasoning: `app/constants.ts`, `app/types.ts`, `app/sectionInfo.ts`, `app/format.ts`, `app/datetime.ts` with imports from `app.ts`.  
3. Then **Phase 2** state/`AppContext` PR at **High** reasoning — no domain moves in that PR.

---

## 13. Open questions

1. Prefer `portal/src/app/` subdirectory vs flat `portal/src/filesTab.ts` files? (**Recommendation:** `app/` subdirectory.)  
2. Should pure helpers get a minimal Vitest setup now, or later? (**Recommendation:** later; don’t block extracts.)  
3. Is delegated event binding (Phase 8) in-scope for the first milestone, or only file split? (**Recommendation:** split first; delegate as a separate optimization.)  
4. Keep shipped assets rebuild (`html/portal`) required on every intermediate PR, or only on release branches? (**Follow existing repo convention:** rebuild when portal source changes.)

---

## 14. Reference: large symbols to relocate

| Symbol | Approx. lines | Destination phase |
|--------|---------------|-------------------|
| `onAction` | ~1750 | Phase 8 (split into domain handlers earlier) |
| `renderHome` | ~830 | Phases 4–7 (peel tabs), Phase 8 thin |
| `bind` | ~466 | Phases 3–8 |
| `renderFilesTab` | ~354 | Phase 4 |
| `startFilesUpload` | ~225 | Phase 4 |
| `renderTasksTab` | ~228 | Phase 7 |
| `renderAdminUserDetailPanel` | ~207 | Phase 5 |
| `renderEventModal` | ~186 | Phase 6 |
| `runBulkTaskAction` | ~137 | Phase 7 |
| `renderMonthGrid` | ~132 | Phase 6 |
| `renderImportProgressModal` | ~127 | Phase 1/3 (`importProgress`) |
| `renderLogin` | ~59 | Phase 3 |
| `SECTION_INFO` | large data | Phase 1 |

---

## 15. Document history

| Date | Change |
|------|--------|
| 2026-08-10 | Initial detailed plan from `app.ts` inventory (~10k lines) |
| 2026-08-10 | Added recommended reasoning level (Low/Medium/High) per phase + summary table |
| 2026-08-10 | Phase 0–1 implemented on `refactor/portal-app-modules` |
| 2026-08-10 | Phase 2: `AppState` / `AppContext` + `state.*` migration |
| 2026-08-10 | Phase 3: flash, scroll, session, shell, login, bootstrap modules |
| 2026-08-10 | Phase 4: Files domain under `app/files/*` |
| 2026-08-10 | Phase 5: Admin domain under `app/admin/*` |
| 2026-08-10 | Phase 6: Calendars domain under `app/calendars/*` |
