# Plan: Delegated event listeners (portal SPA)

**Status:** Steps 0–8 code + automated verify done; **manual smoke pending** (then merge)  
**Date:** 2026-08-12  
**Branch:** `refactor/portal-delegated-events`  
**Depends on:** onAction split (**done** in 2.2.1). Inventory: [`portal-delegated-events-inventory.md`](portal-delegated-events-inventory.md).  
**Non-goals:** Split `onAction` domains (separate plan); change action names or UI design; rewrite Escape modal matrix.

---

## 1. Why this plan

| Today (`app/bind.ts`, ~406 lines) | Problem |
|-----------------------------------|---------|
| Every `render()` re-queries DOM and re-attaches listeners | Wasteful; easy to forget a control after HTML changes |
| Escape uses `state.escapeBound` once on `document` | OK, but lives inside re-entry `bind()` |
| Click: per-element `[data-action]` | Duplicates listeners each render (old nodes discarded with `innerHTML`, so usually no double-fire — but cost + complexity remain) |
| Change: per-select for DT month/year, confirm checkboxes, admin fields, searches | Must not miss when moving to root delegation |
| Submit: per-form `data-form="…"` | Same |

**Success:** Mount once:

- `root` → `click`, `submit`, `change`, `input` (or `keydown` where needed)  
- `document` → Escape (once, without depending on re-bind)  
- `bind()` shrinks to “refresh outside-click + indeterminate checkboxes + avatar error hooks that need element identity” or disappears for most paths  

Behavior freeze.

---

## 2. Current bind inventory (pre-flight)

**Full lock-in:** [`portal-delegated-events-inventory.md`](portal-delegated-events-inventory.md) (Step 0). Summary:

| Kind | What | Count (locked) | Delegation strategy |
|------|------|----------------|---------------------|
| **click** | All `[data-action]` → `onAction` | per-element each render | **Yes** — single `root` click |
| **change** | DT month/year, delete confirms, admin-db-backend, task/note cal, repeat | many | **Yes** — root change |
| **input** | contact/task/note search; admin confirm/reset | 5 | **Yes** — root input + debounce |
| **submit** | login/share/event/cal/contact/ab/task/note + files×3 + admin×6 | **19** forms | **Yes** — root submit |
| **keydown** | Enter/Space on contact/cal/month rows | per row | **Yes** — root keydown |
| **error** | contact avatar fallback | per img | **Hard** — capture or post-render |
| **document click** | user menu, DT picker, files upload menu outside | when open | **Keep** helpers |
| **document Escape** | modal matrix | once via `escapeBound` | **Move** to mount |
| **files** | upload inputs, drop, forms | `files/bind.ts` | **Partial** — hybrid drop |
| **admin** | form submits | `admin/bind.ts` | **Yes** |
| **helpers** | import inputs, holidays, photo, color pair | domain | change/input hybrid |

**Critical insight:** Full re-render uses `root.innerHTML = …`, so old nodes and their listeners die. Double-fire is **less** of a risk than “missed first bind after structural HTML change.” Delegation still helps cost and centralization.

---

## 3. Design rules

1. **Register once at mount** after `o` / hosts exist (`app.ts` or `bind.registerDelegates(o)`).
2. **Handlers always read current `o.state`** (closure over `o` object is fine; do not close over stale field snapshots).
3. **Use `ev.target` + `closest`**, never assume `ev.currentTarget` is the action node for bubbling.
4. **Ignore events from outside `root`** (if listening on document).
5. **Do not preventDefault on all clicks** — only where current code does (info buttons, task-check, etc. already in `onAction`).
6. **File inputs:** `change` on `input[type=file][data-action=…]` must still call `onFilesUploadInput` — works via delegation if listener is on `root` with bubble (change bubbles).
7. **Drag-and-drop:** stays on `[data-files-drop-target]` — element is recreated each render → either re-bind drop only (small) or use capture on `root` with target check.
8. **Avatar `error`:** does not bubble → keep `querySelectorAll` + `addEventListener('error')` after render **or** use `root.addEventListener('error', …, true)` capture (verify browser support for media error capture).

---

## 4. Phased steps (with effort)

Effort: **S** ≤2h · **M** half-day · **L** 1–2 days · **XL** multi-day.

### Step 0 — Baseline + harness  
**Effort: S** · **Risk: Low**

- [x] Document current bind call sites (`render()` → `bindApp(o)` in `app.ts`).
- [x] List every `addEventListener` in `bind.ts`, `files/bind.ts`, `admin/bind.ts` (+ domain helpers).
- [x] Optional bind counter — skipped (optional); method documented in inventory §7.
- [x] Smoke baseline — product baseline is 2.2.1 (prior smoke); Step 0 is docs-only.

**Exit:** Inventory complete → [`portal-delegated-events-inventory.md`](portal-delegated-events-inventory.md).  
**Status:** **Done 2026-08-12.**

---

### Step 1 — Mount-time shell: `registerPortalEvents(o)`  
**Effort: M** · **Risk: Medium**

**Create** `app/events.ts` (name flexible):

```ts
export function registerPortalEvents(o: AppOrchestrator): void {
  // idempotent guard: o.state.portalEventsBound
  o.root.addEventListener("click", onClick);
  o.root.addEventListener("submit", onSubmit);
  o.root.addEventListener("change", onChange);
  o.root.addEventListener("input", onInput);
  o.root.addEventListener("keydown", onKeydown);
  document.addEventListener("keydown", onEscape);
}
```

**Initially:** dual path without double-firing actions:

- Root/document listeners registered once in `app/events.ts`.
- Click/submit/change/input/row-keydown handlers are **scaffolds** (debug log only) until Steps 2–5.
- **Escape** is fully owned at mount (moved out of `bind.ts`) so it is not re-attached after every render.
- Post-render `bind()` still attaches all other element-level listeners.

- [x] Wire `registerPortalEvents(o)` once at end of `mountApp` after `o` is built.
- [x] `portalEventsBound` + `WeakMap<root>` prevent double registration.
- [x] Escape matrix in `events.ts`; removed from `bind.ts`.

**Stuck risk:** HMR / re-calling `mountApp` doubles listeners → **resolved** with WeakMap.  
**Readjust if stuck:** module-level `WeakMap<root, bound>` or teardown function.

**Exit:** Dual path works; no regressions; still re-binds.  
**Status:** **Done 2026-08-12** (code).

---

### Step 2 — Delegate click → drop per-element click bind  
**Effort: M** · **Risk: Medium**

- [x] Root `click` → `closest("[data-action]")` → info prevent/stop + DT select stop + `onAction`
- [x] Remove per-element `[data-action]` click re-bind from `bind.ts`
- [x] DT month/year still use **change** via post-render bind (Step 4 will move)
- [ ] Smoke: calendar day click, event chip, tabs, files row actions, admin subnav, info buttons

**Stuck risk:** Clicks on child of button (icon span) → **resolved:** `closest`.  
**Stuck risk:** Label wrapping checkbox — match prior bubble to `[data-action]`.  
**Status:** **Done 2026-08-12** (code); manual smoke remaining.

---

### Step 3 — Delegate submit  
**Effort: M** · **Risk: Medium–High**

Map `data-form` → handler (mirror current bind):

| `data-form` | Handler |
|-------------|---------|
| `login` | `o.onLogin` |
| `share` | `o.onShare` |
| `edit-event` | `o.onSaveEvent` |
| `edit-cal` / `create-cal` | edit/create + color pair (color is input, not submit) |
| `contact` / `create-ab` / `edit-ab` | contact/ab saves |
| `task` / `note` | task/note saves |
| `files-rename` / `files-mkdir` / `files-transfer` | files handlers |
| `admin-*` | admin bind handlers |

- [x] Root `submit`: `preventDefault` for portal `form[data-form]`; dispatch 19 form kinds in `events.ts`
- [x] Remove per-form submit listeners from `bind.ts`, `files/bind.ts`; `admin.bindAdminDom` no-op
- [x] Keep `bindColorPair` + task/note calendar-select + event repeat change until Step 4
- [ ] Smoke: login; create event; create task; create contact; files mkdir/rename; admin settings if admin

**Stuck risk:** `bindColorPair` — kept post-render until Step 4.  
**Stuck risk:** task/note `instanceId` change — kept post-render until Step 4.  
**Status:** **Done 2026-08-12** (code); manual smoke remaining.

---

### Step 4 — Delegate change + input  
**Effort: M–L** · **Risk: High**

- [x] `change` on root: DT month/year → onAction; admin-db-backend; delete confirms; task/note instanceId; event repeat; holidays; color text; import/photo/files upload inputs
- [x] `input` on root: contact/task/note search (250ms debounce); admin-db-confirm; admin-reset-password; color_picker
- [x] Remove matching listeners from `bind.ts` / files upload inputs; holidays change via `syncHolidaysToggle`
- [ ] Smoke: DT month/year; searches; create-cal holidays; task calendar switch on create; files upload browse; contact photo

**Stuck risk:** search debounce + re-render focus — same as before.  
**Status:** **Done 2026-08-12** (code); manual smoke remaining.

---

### Step 5 — Escape once + optional keydown delegation  
**Effort: M** · **Risk: Medium–High**

- [x] Escape matrix at mount (`events.ts` Step 1) — `escapeBound` / `portalEventsBound` guards
- [x] Root `keydown` Enter/Space on contact/cal/month rows with `[data-action]`
- [ ] Smoke: Escape matrix + keyboard activation of rows

**Stuck risk:** Escape order — preserved from bind.  
**Status:** **Done 2026-08-12** (code); manual smoke remaining.

---

### Step 6 — Files drop + avatar error  
**Effort: M** · **Risk: Medium**

- [x] **Drop:** root drag* with `closest('[data-files-drop-target]')`; depth on `state.filesDropDepth`
- [x] **Avatar error:** capture-phase `error` on `root` for `.contact-avatar[data-avatar-fallback]`
- [x] File input `change` already via Step 4

**Stuck risk:** drag depth on discarded DOM → **resolved:** `state.filesDropDepth`.  
**Status:** **Done 2026-08-12** (code); manual smoke remaining.

---

### Step 7 — Remove dual path; shrink `bind.ts`  
**Effort: S–M** · **Risk: Medium**

- [x] `render()` calls `bindAfterRender(o)` only (`app/afterRender.ts`)
- [x] Outside-click menus + indeterminate + holidays sync remain post-render
- [x] Renamed/thin after-render module (~35 lines); old `bind.ts` removed
- [ ] Full smoke checklist (§8) — with Step 8

**Status:** **Done 2026-08-12** (code).

---

### Step 8 — Verification gate  
**Effort: M** · **Risk: n/a**

- [x] `tsc --noEmit`, Vite build  
- [ ] Manual smoke (§8) — **yours** (checklist in [portal-delegated-events-verification.md](portal-delegated-events-verification.md))  
- [x] Listener count stable after 20 tab switches + modal cycles (CDP automated)  
- [x] No duplicate Escape handlers (document keydown = 1 before/after)  

**Report:** [`portal-delegated-events-verification.md`](portal-delegated-events-verification.md)  
**Status:** Automated gate **green** 2026-08-12; manual smoke open.

---

## 5. Recommended PR stack

| PR | Contents | Effort |
|----|----------|--------|
| PR1 | Steps 0–1 register + dual path | M |
| PR2 | Step 2 click only | M |
| PR3 | Step 3 submit | M–L |
| PR4 | Step 4 change/input | L |
| PR5 | Steps 5–7 Escape + cleanup + smoke | L |

**Do not** combine with onAction split PRs.

---

## 6. Pre-flight attack (where we get stuck) → plan adjustments

| Attack | Result | Plan adjustment |
|--------|--------|-----------------|
| “Replace all bind with one click listener” | Misses submit/change/input/Escape/drop/error | Multi-type delegation; hybrid for drop/error |
| “Delegation after every render is same as now” | Wrong — register **once** at mount; handlers close over `o` | Explicit `portalEventsBound` / WeakMap |
| “innerHTML kills listeners so double-fire impossible” | True for node listeners; **document** Escape can double if mount twice | Mount guard |
| “Files drop works with bubble on root” | dragleave depth is fragile | Hybrid: keep `bindFilesDom` drop or store depth on host |
| “error event bubbles” | **Does not** for media | Capture or post-render avatar bind |
| “Do this before onAction split” | 1 150-line onAction harder to debug | **Prefer split plan first**; this plan notes dependency |
| “Unit test all binds” | No harness | Manual smoke + listener-count check |

### Readjusted architecture (after attack)

```text
mountApp
  └── create o, hosts
  └── registerPortalEvents(o)     // ONCE: click/submit/change/input/keydown/Escape
  └── bootstrap → render
        └── render()
              └── maybe syncOutsideMenus(o)  // user menu / files menu doc click
              └── maybe bindFilesDrop(o)     // hybrid if needed
              └── maybe bindAvatarFallbacks(o)
```

Not: `render → full bind everything`.

---

## 7. Out of scope

- Splitting `onAction.ts` (other plan)  
- Changing `data-action` / `data-form` vocabulary  
- Virtual DOM / framework migration  
- Performance micro-benchmarks beyond listener count  

---

## 8. Smoke checklist (must pass)

- [ ] Login / logout  
- [ ] Every tab: open primary create flow and cancel  
- [ ] Calendar: month cell new event, event chip edit, DT month/year select + day + time  
- [ ] Task/note: type fields then open Due/Date (draft retained)  
- [ ] Contact: birthday picker; multi add email  
- [ ] Files: upload files/folder; **conflict modal** overwrite/skip/cancel; mkdir; rename; drop  
- [ ] Escape: closes modals in correct priority; does not kill running upload/import  
- [ ] Search boxes debounce without losing focus unexpectedly  
- [ ] Admin: open settings form submit if admin user  
- [ ] After 20 modal open/close cycles, no duplicate Escape (manual DevTools check)  

---

## 9. Effort summary

| Step | Effort | Risk |
|------|--------|------|
| 0 Inventory | S | Low |
| 1 Register dual path | M | Medium |
| 2 Click | M | Medium |
| 3 Submit | M–L | Medium–High |
| 4 Change/input | M–L | High |
| 5 Escape + keydown | M | Medium–High |
| 6 Drop + avatar | M | Medium |
| 7 Remove dual path | S–M | Medium |
| 8 Verify | M | — |
| **Total** | **~4–7 engineering days** | Staged PRs; hybrid OK |

---

## 10. Definition of done

- [x] Portal events registered once per mount  
- [x] Post-render work limited to outside-menus / indeterminate / holidays sync (`afterRender.ts`)  
- [ ] Smoke checklist green (manual)  
- [x] Listener count stable across re-renders (automated)  
- [ ] Plan status → Done when landed on main  
- [x] Cross-link from `docs/portal-app-refactor-plan.md` Phase 8 optional items  

---

## 11. Relationship to onAction split

```text
Recommended order:

  1) portal-onaction-split-plan.md   (structure)
  2) portal-delegated-events-plan.md (wiring)

Either alone is valid; together in one PR is not.
```
