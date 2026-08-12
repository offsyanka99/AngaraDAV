# Plan: Split `onAction.ts` into domain routers

**Status:** Planning (not started)  
**Date:** 2026-08-12  
**Branch recommendation:** `refactor/portal-onaction-split` (from current modularization branch or `main` after merge)  
**Depends on:** Modularization Phases 0–8 (done). Prefer **before** delegated-events plan.  
**Non-goals:** Change user-visible behavior; delegated one-shot listeners (separate plan); new features.

---

## 1. Why this plan

| Today | Problem |
|-------|---------|
| `portal/src/app/onAction.ts` ≈ **1 152 lines** | Hard to review, easy to break unrelated tabs when editing one action |
| Files + Admin already use `handle*Action` routers | Calendars / tasks / notes / contacts / shell still monolithic |
| Plan Phase 8 left this optional | Still the largest remaining maintainability debt |

**Success:** `onAction.ts` becomes a thin chain (~80–150 lines). Domain action logic lives next to domain code. Behavior freeze.

---

## 2. Current inventory (pre-flight measurement)

| Area | Approx lines in `onAction.ts` | Already extracted? | Target router |
|------|-------------------------------|--------------------|---------------|
| Calendars (incl. DT picker, events, shares, export-cal) | ~550 | Partial (`handle` only files/admin) | `app/calendars/actionsRouter.ts` |
| Contacts (AB + contact modal + multi-field) | ~270 | No | `app/contacts/actionsRouter.ts` |
| Tasks | ~180 (interleaved with notes) | No | `app/tasks/actionsRouter.ts` |
| Notes | ~60 (interleaved with tasks) | No | `app/notes/actionsRouter.ts` |
| Shell (logout, tab, info, flash, user-menu, import progress close) | ~50 | No | `app/shell/actionsRouter.ts` or `app/actions/shell.ts` |
| Admin / Files | ~10 (delegates) | Yes | keep `admin.handleAdminAction` / `files.handleFilesAction` |

**Exact action checks today:** ~84 (`action === "…"`), ~79 unique names.

**Import direction (must keep):**

```text
app.ts → app/bind.ts → app/onAction.ts → app/{domain}/actionsRouter.ts → domain modules
domains must not import app.ts or onAction.ts
```

---

## 3. Design rules

1. **Behavior freeze** — same `data-action` names, same order of checks where order matters (e.g. `stopPropagation` on event chips).
2. **Router contract** (match existing Files/Admin):

   ```ts
   export async function handleCalendarsAction(
     host: CalendarsHost | AppOrchestrator, // prefer host + only use o when needed
     action: string,
     t: HTMLElement,
     ev: Event,
   ): Promise<boolean>; // true = handled (stop chain)
   ```

3. **Host vs orchestrator stuck point (see §6):** calendars/tasks handlers need more than domain hosts (e.g. `loadHome`, `saveBlobAsFile`, DT helpers). Options:
   - **A (recommended):** pass `AppOrchestrator` into routers (same as today); hosts stay for loaders/render.
   - **B:** expand each Host type with missing methods (larger type churn).
4. **Return `false`** only for actions this domain does not own — do not swallow unknown actions silently unless current code did.
5. **One domain per PR** when possible; calendars is large enough alone.

---

## 4. Phased steps (with effort)

Effort scale: **S** ≤2h · **M** half-day · **L** 1–2 days · **XL** multi-day / high risk.

### Step 0 — Inventory lock-in  
**Effort: S** · **Risk: Low**

- [ ] Freeze action → domain map (spreadsheet or table in this doc).
- [ ] Mark actions that need `ev.stopPropagation()` / `preventDefault()`.
- [ ] List orchestrator methods used only by calendars vs contacts vs tasks.
- [ ] Confirm `tsc --noEmit` + Vite build baseline green.

**Exit:** Written action map; no code moves yet.

---

### Step 1 — Extract shell actions  
**Effort: S–M** · **Risk: Low–Medium**

**Move:** `close-import-progress`, `logout`, `info`, `info-close`, `flash-close`, `user-menu-toggle`, `user-menu-close`, `tab`.

**Deliverables**

- [ ] `app/shell/actionsRouter.ts` (or `app/actions/shellRouter.ts`) with `handleShellAction(o, action, t, ev): Promise<boolean>`.
- [ ] `onAction` calls it first (or after close-import if order matters — match current order).
- [ ] Smoke: login → logout; tab switch; (i) modal open/close; flash dismiss; user menu.

**Stuck risk:** `tab` + admin landing (`adminPage = overview`) needs orchestrator `activateTab`.  
**Readjust if stuck:** keep shell router taking full `AppOrchestrator`.

---

### Step 2 — Extract tasks router  
**Effort: M** · **Risk: Medium**

**Move:** all `*task*` actions + shared `sort-task` branch; bulk actions; new/cancel/delete/select/check.

**Deliverables**

- [ ] `app/tasks/actionsRouter.ts` → `handleTasksAction(o, …): Promise<boolean>`.
- [ ] Re-export from `app/tasks/index.ts`.
- [ ] Smoke: create task, due picker still keeps draft fields, bulk complete, subtask, delete, sort/search.

**Stuck risk:** `sort-task || sort-note` currently one `if` — split carefully so notes still work.  
**Readjust if stuck:** extract `sort-note` in same PR as notes, leave a tiny shared `handleItemsSort` helper.

---

### Step 3 — Extract notes router  
**Effort: S–M** · **Risk: Low–Medium**

**Move:** `select-note`, `new-note`, `cancel-note`, `delete-note`, `sort-note`.

**Deliverables**

- [ ] `app/notes/actionsRouter.ts`.
- [ ] Smoke: create/edit note, date picker draft sync, delete, sort/search.

**Stuck risk:** interleaved with tasks in current file — extract by action name, not by contiguous line ranges.  
**Readjust if stuck:** use a temporary script that cuts by `action === "…"` blocks rather than manual line ranges.

---

### Step 4 — Extract contacts router  
**Effort: M–L** · **Risk: Medium–High**

**Move:** AB select/edit/create/delete/export; contact select/new/save paths that are click actions; multi email/phone/custom/photo; export contact.

**Deliverables**

- [ ] `app/contacts/actionsRouter.ts`.
- [ ] Keep using `contacts.syncContactFormFromDom` before re-renders (birthday picker).
- [ ] Smoke: new contact + birthday month/year; multi email; photo; AB delete confirm; VCF export.

**Stuck risk:** export uses `saveBlobAsFile` on orchestrator; delete AB uses confirm checkbox DOM.  
**Readjust if stuck:** contacts router takes `AppOrchestrator` for export only.

---

### Step 5 — Extract calendars + datetime router  
**Effort: L** · **Risk: High**

**Move:** calendar list/modals, month nav, event open/create/delete, **all `dt-*` actions**, share revoke, export-cal. Largest block (~500+ lines).

**Deliverables**

- [ ] `app/calendars/actionsRouter.ts` (or split `dtRouter.ts` if file still huge).
- [ ] Preserve `syncOpenItemFormsBeforeDtRender` (events + tasks + notes + contacts).
- [ ] Smoke: timed + all-day event; RRULE; month prev/next; multi-select calendars; share revoke; export; DT month/year selects + day pick.

**Stuck risk:**

1. DT sync currently calls task/note/contact modules — calendars router would depend on contacts/tasks/notes (wrong direction).  
2. **Readjust (required):** move `syncOpenItemFormsBeforeDtRender` to a neutral helper:

   ```text
   app/datetimeSync.ts  // uses o + contacts/tasks/notes/calendars form sync
   ```

   Calendars router imports that helper; domains stay free of each other.

---

### Step 6 — Thin `onAction.ts` + cleanup  
**Effort: S** · **Risk: Low**

**Target shape:**

```ts
export async function onAction(o: AppOrchestrator, ev: Event) {
  const t = (ev.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!t) return;
  const action = t.dataset.action;
  if (!action) return;
  log.debug(...);

  if (await handleShellAction(o, action, t, ev)) return;
  if (action.startsWith("admin-") && await admin.handleAdminAction(...)) return;
  if ((action.startsWith("files-") || action === "close-files-upload-progress")
      && await files.handleFilesAction(...)) return;
  if (await handleCalendarsAction(o, action, t, ev)) return;
  if (await handleTasksAction(o, action, t, ev)) return;
  if (await handleNotesAction(o, action, t, ev)) return;
  if (await handleContactsAction(o, action, t, ev)) return;
}
```

- [ ] `onAction.ts` ≤ ~150 lines.
- [ ] No unused imports; `tsc` clean.
- [ ] Optional: delete dead comments / empty branches.

---

### Step 7 — Verification gate  
**Effort: M** · **Risk: n/a**

| Check | Effort |
|-------|--------|
| `tsc --noEmit` | S |
| Vite build | S |
| Manual smoke checklist (§8) | M |
| Grep: no domain imports `onAction` | S |

---

## 5. Recommended PR stack

| PR | Contents | Effort |
|----|----------|--------|
| PR1 | Step 0–1 shell | S–M |
| PR2 | Steps 2–3 tasks + notes | M |
| PR3 | Step 4 contacts | M–L |
| PR4 | Step 5 calendars + `datetimeSync` | L |
| PR5 | Step 6–7 thin chain + smoke | M |

Do **not** combine with delegated-events plan.

---

## 6. Pre-flight attack (where we get stuck) → plan adjustments

| Attack | Result | Plan adjustment |
|--------|--------|-----------------|
| “Cut contiguous line ranges by domain” | Tasks/notes/contacts/**calendars export** interleaved | Extract by **action name blocks**, not file order |
| “Routers take only `*Host`” | Many actions need `loadHome`, `saveBlobAsFile`, DT, `activateTab` | Routers take **`AppOrchestrator`** (Option A) |
| “Put DT inside calendars only” | DT sync must touch tasks/notes/contacts forms | Neutral **`datetimeSync.ts`** helper |
| “One PR for whole split” | ~1 100 lines move + high bisect cost | **4–5 PRs** by domain |
| “Match files `handleFilesAction` return bool” | Works; unknown actions return false | Chain order: shell → admin → files → calendars → tasks → notes → contacts |

---

## 7. Out of scope (do not mix in)

- Delegated `click`/`change` on `root` (see `docs/portal-delegated-events-plan.md`)
- Rewriting action names or HTML `data-action` attributes
- New features (upload UX, etc.)

---

## 8. Smoke checklist (must pass)

- [ ] Logout / login  
- [ ] Tab switch including Admin (if admin user)  
- [ ] Calendar: select, create timed + all-day event, RRULE, export, delete  
- [ ] DT picker: month/year select, day, time, clear; draft fields preserved on task/note/contact  
- [ ] Tasks: create, bulk, subtask, sort  
- [ ] Notes: create, date, delete  
- [ ] Contacts: create with birthday + multi email, AB delete confirm  
- [ ] Files: upload conflict modal still works (already in files router)  
- [ ] Info (i) + flash dismiss  

---

## 9. Effort summary

| Step | Effort | Risk |
|------|--------|------|
| 0 Inventory | S | Low |
| 1 Shell | S–M | Low–Medium |
| 2 Tasks | M | Medium |
| 3 Notes | S–M | Low–Medium |
| 4 Contacts | M–L | Medium–High |
| 5 Calendars + datetimeSync | L | High |
| 6 Thin onAction | S | Low |
| 7 Verify | M | — |
| **Total** | **~3–6 engineering days** | Staged PRs |

---

## 10. Definition of done

- [ ] `onAction.ts` thin dispatcher only  
- [ ] Domain routers under `app/{domain}/`  
- [ ] No circular imports  
- [ ] Smoke checklist green  
- [ ] Plan status updated to Done when landed  
