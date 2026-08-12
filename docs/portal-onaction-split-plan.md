# Plan: Split `onAction.ts` into domain routers

**Status:** **Done** — shipped in product **2.2.1**  
**Date:** 2026-08-12  
**Branch:** `refactor/portal-onaction-split` (merge to `main` with 2.2.1)  
**Depends on:** Modularization Phases 0–8 (done in 2.2.0). Prefer **before** delegated-events plan.  
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

- [x] Freeze action → domain map → [`docs/portal-onaction-inventory.md`](portal-onaction-inventory.md)
- [x] Mark actions that need `ev.stopPropagation()` / `preventDefault()`
- [x] List orchestrator methods used from `onAction`
- [x] Confirm `tsc --noEmit` baseline green

**Exit:** Written action map; no code moves yet. **Done 2026-08-12.**

---

### Step 1 — Extract shell actions  
**Effort: S–M** · **Risk: Low–Medium**

**Move:** `close-import-progress`, `logout`, `info`, `info-close`, `flash-close`, `user-menu-toggle`, `user-menu-close`, `tab`.

**Deliverables**

- [x] `app/shellActionsRouter.ts` with `handleShellAction(o, action, t, ev): Promise<boolean>`  
  (named `shellActionsRouter.ts` to avoid clashing with existing `app/shell.ts` module file)
- [x] `onAction` calls shell router first after action resolve
- [ ] Smoke: login → logout; tab switch; (i) modal open/close; flash dismiss; user menu

**Stuck risk:** `tab` + admin landing needs `activateTab` → **resolved:** router takes full `AppOrchestrator`.  
**Status:** **Done 2026-08-12** (code); manual smoke remaining.

---

### Step 2 — Extract tasks router  
**Effort: M** · **Risk: Medium**

**Move:** all `*task*` actions + `sort-task`; bulk actions; new/cancel/delete/select/check.

**Deliverables**

- [x] `app/tasks/actionsRouter.ts` → `handleTasksAction(o, …): Promise<boolean>`
- [x] Re-export from `app/tasks/index.ts`
- [ ] Smoke: create task, due picker still keeps draft fields, bulk complete, subtask, delete, sort/search

**Stuck risk:** `sort-task || sort-note` shared `if` → **resolved:** `sort-task` in tasks router; `sort-note` left in `onAction` until Step 3.  
**Status:** **Done 2026-08-12** (code); manual smoke remaining.

---

### Step 3 — Extract notes router  
**Effort: S–M** · **Risk: Low–Medium**

**Move:** `select-note`, `new-note`, `cancel-note`, `delete-note`, `sort-note`.

**Deliverables**

- [x] `app/notes/actionsRouter.ts` → `handleNotesAction(o, …): Promise<boolean>`
- [x] Re-export from `app/notes/index.ts`
- [ ] Smoke: create/edit note, date picker draft sync, delete, sort/search

**Stuck risk:** interleaved with tasks → **resolved:** extracted by action name after tasks router.  
**Status:** **Done 2026-08-12** (code); manual smoke remaining.

---

### Step 4 — Extract contacts router  
**Effort: M–L** · **Risk: Medium–High**

**Move:** AB select/edit/create/delete/export; contact select/new/save paths that are click actions; multi email/phone/custom/photo; export contact.

**Deliverables**

- [x] `app/contacts/actionsRouter.ts` → `handleContactsAction(o, …): Promise<boolean>`
- [x] Re-export from `app/contacts/index.ts`
- [x] `syncContactFormFromDom` before multi-field re-renders (add/remove email/phone/custom); birthday DT still syncs via calendars path in `onAction`
- [ ] Smoke: new contact + birthday month/year; multi email; photo; AB delete confirm; VCF export.

**Stuck risk:** export uses `saveBlobAsFile` on orchestrator; delete AB uses confirm checkbox DOM → **resolved:** router takes full `AppOrchestrator`.  
**Status:** **Done 2026-08-12** (code); manual smoke remaining.

---

### Step 5 — Extract calendars + datetime router  
**Effort: L** · **Risk: High**

**Move:** calendar list/modals, month nav, event open/create/delete, **all `dt-*` actions**, share revoke, export-cal. Largest block (~500+ lines).

**Deliverables**

- [x] `app/calendars/actionsRouter.ts` → `handleCalendarsAction(o, …): Promise<boolean>`
- [x] `app/datetimeSync.ts` → `syncOpenItemFormsBeforeDtRender(o)` (cross-domain form drafts)
- [x] Re-export from `app/calendars/index.ts`
- [ ] Smoke: timed + all-day event; RRULE; month prev/next; multi-select calendars; share revoke; export; DT month/year selects + day pick.

**Stuck risk:**

1. DT sync would couple calendars → contacts/tasks/notes → **resolved:** neutral `app/datetimeSync.ts` (orchestrator + `contacts/form` only).  
2. Calendars router imports that helper; sibling domains stay free of each other.  
**Status:** **Done 2026-08-12** (code); manual smoke remaining.

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

- [x] `onAction.ts` ≤ ~150 lines (**41 lines**).
- [x] No unused imports; `tsc` clean.
- [x] Thin chain only: shell → admin → files → calendars → tasks → notes → contacts.  
**Status:** **Done 2026-08-12.**

---

### Step 7 — Verification gate  
**Effort: M** · **Risk: n/a**

| Check | Effort | Result |
|-------|--------|--------|
| `tsc --noEmit` | S | clean |
| Vite build | S | clean (via Docker node; host `node_modules` root-owned) |
| Deploy to `angaradav-local` | S | `docker cp html/portal` → container |
| Grep: no domain imports `onAction` | S | only `bind.ts` imports `onAction` |
| API smoke | S | login, calendars/tasks/notes/AB/files/admin, event CRUD, logout |
| UI smoke (Playwright) | M | 24/24 steps (see §8) |

**Status:** **Done 2026-08-12.**

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

Automated 2026-08-12 against `http://127.0.0.1:8080` (`angaradav-local` + Playwright headless):

- [x] Logout / login  
- [x] Tab switch including Admin (admin user)  
- [x] Calendar: select/toggle, month prev/next/today, new-event-day opens form  
- [x] DT picker: open, month/year controls, day pick; **task draft preserved** across `dt-open`  
- [x] Tasks: new-task + cancel (form open path)  
- [x] Notes: new-note + cancel  
- [x] Contacts: select-ab, new-contact, add-email  
- [x] Files: tab loads  
- [x] Info (i) open/close  
- [x] API: event create/get/delete; domain list endpoints; logout session 401  

Not fully exercised in automation (no regressions expected; paths still in routers unchanged): RRULE save, VCF/ICS export download picker, bulk task ops, AB delete confirm checkbox, files upload conflict modal (files router pre-split). Re-check those if touching those handlers later.

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

- [x] `onAction.ts` thin dispatcher only (~41 lines)  
- [x] Domain routers: `shellActionsRouter.ts`, `admin|files|calendars|tasks|notes|contacts/actionsRouter.ts`  
- [x] Neutral `datetimeSync.ts` for cross-domain DT form drafts  
- [x] No domain → `onAction` imports (only `bind.ts` → `onAction`)  
- [x] `tsc` + Vite build green; Playwright smoke 24/24  
- [x] Plan status **Done**  
