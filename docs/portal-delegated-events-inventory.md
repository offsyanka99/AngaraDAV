# Portal delegated-events inventory (Step 0)

**Date:** 2026-08-12  
**Branch:** `refactor/portal-delegated-events`  
**Depends on:** 2.2.1 onAction split (done)  
**Baseline product:** AngaraDAV **2.2.1** · `tsc --noEmit` clean on `main`  
**Code freeze for this doc:** current `portal/src` on this branch tip at Step 0 start  

This freezes **where listeners are attached today** before mount-time delegation (Steps 1+).  
Router contract for actions remains: `onAction` / `handle*Action` (unchanged by this plan).

---

## 1. Call graph (render → bind)

```text
portal/src/app.ts  mountApp()
  └── render()                         // every SPA paint
        ├── renderLoginView(...)       // if !state.user
        │     or renderHome(o)         // authenticated shell + tab body
        ├── bindApp(o)                 // portal/src/app/bind.ts → bind()
        └── rAF: positionDtPopovers, scroll selected time
```

| Call site | File:line (approx) | When |
|-----------|-------------------|------|
| `bindApp(o)` | `portal/src/app.ts` ~100 | **Every** `render()` |
| Inside `bind()` | `bind.ts` ~412–416 | Always at end of post-render bind |
| → `files.bindFilesDom` | `files/bind.ts` | Every render (listeners only if nodes exist) |
| → `admin.bindAdminDom` | `admin/bind.ts` | Every render |
| → `o.bindImportInput` | `calendars/import.ts` | Every render |
| → `o.bindHolidaysToggle` | `calendars/holidays.ts` | Every render |
| → `o.bindContactPhotoInput` | `contacts/photo.ts` | Every render |

**Note:** Full re-render sets `root.innerHTML`, so previous **element** listeners are discarded. Re-bind is intentional, not a double-fire on the same node. **Document**-level listeners use guards (`escapeBound`, menu outside bind/unbind).

**Out of scope for this plan:** `portal/src/install.ts` (separate installer SPA with its own binds).

---

## 2. Line counts (baseline)

| File | Lines | Role |
|------|------:|------|
| `app/bind.ts` | ~417 | Central post-render bind |
| `app/files/bind.ts` | ~121 | Files forms, file inputs, drop |
| `app/admin/bind.ts` | ~58 | Admin form submits |
| `app/bindColorPair.ts` | ~19 | Color picker sync (called from bind) |
| `app/calendars/import.ts` | bind ~22 | ICS/VCF file inputs |
| `app/calendars/holidays.ts` | ~32 | Create-cal holidays checkbox |
| `app/contacts/photo.ts` | bind ~25 | Contact photo file input |
| `app/shell.ts` | outside-click | User menu + DT picker doc click |
| `app/files/upload.ts` | outside-click | Upload menu doc click |

---

## 3. Complete `addEventListener` inventory

### 3.1 `app/bind.ts` — every render

| # | Event | Target / selector | Handler summary | Delegate? |
|---|-------|-------------------|-----------------|-----------|
| 1 | `click` | **each** `[data-action]` | `preventDefault`+`stopPropagation` for `info`/`info-close`; `onAction(o, ev)` | **Yes** — root click + `closest` |
| 2 | `change` | `select[data-action=dt-set-month\|dt-set-year]` | `stopPropagation`; `onAction` | **Yes** — root change |
| 3 | `click` | same DT selects | `stopPropagation` only (keep popover open) | **Yes** or keep hybrid |
| 4 | `keydown` | `tr.contact-table-row[data-action]`, `.cal-row[data-action]`, `.month-cell[data-action]` | Enter/Space → `row.click()` | **Yes** — root keydown |
| 5 | `change` | `#delete-cal-confirm` | Enable/disable `#delete-cal-submit` | **Yes** — root change by id |
| 6 | `change` | `#delete-ab-confirm` | Enable/disable `#delete-ab-submit` | **Yes** |
| 7 | `error` | `img.contact-avatar[data-avatar-fallback]` | Replace with letter span | **Hard** — no bubble; capture or post-render |
| 8 | `keydown` | `document` (once if `!escapeBound`) | Escape modal matrix (import/files/menus/modals/admin) | **Move** to mount; keep order |
| 9 | `submit` | `[data-form=login]` | `preventDefault`; `o.onLogin` | **Yes** |
| 10 | `submit` | `[data-form=share]` | `o.onShare` | **Yes** |
| 11 | `submit` | `[data-form=edit-event]` | `o.onSaveEvent` | **Yes** |
| 12 | `change` | event form `select[name=repeatFreq\|repeatEndMode]` | Sync repeat into `editingEvent`; `render` | **Yes** — root change + form context |
| 13 | `submit` | `[data-form=edit-cal]` | `o.onEditCal` | **Yes** |
| 14 | *(via)* | `bindColorPair(edit-cal)` | see §3.5 | hybrid |
| 15 | `submit` | `[data-form=create-cal]` | `o.onCreateCal` | **Yes** |
| 16 | *(via)* | `bindColorPair(create-cal)` | see §3.5 | hybrid |
| 17 | `submit` | `[data-form=contact]` | `o.onSaveContact` | **Yes** |
| 18 | `submit` | `[data-form=create-ab]` | `o.onCreateAb` | **Yes** |
| 19 | `submit` | `[data-form=edit-ab]` | `o.onEditAb` | **Yes** |
| 20 | `submit` | `[data-form=task]` | `o.onSaveTask` | **Yes** |
| 21 | `change` | task form `select[name=instanceId]` | Create-task draft + parent uid; `render` | **Yes** |
| 22 | `submit` | `[data-form=note]` | `o.onSaveNote` | **Yes** |
| 23 | `change` | note form `select[name=instanceId]` | Create-note draft; `render` | **Yes** |
| 24 | `input` | `input[data-action=contact-search]` | Debounce 250ms → `loadContacts` | **Yes** |
| 25 | `input` | `input[data-action=task-search]` | Debounce → `loadTasks` | **Yes** |
| 26 | `input` | `input[data-action=note-search]` | Debounce → `loadNotes` | **Yes** |
| 27 | `change` | `select[data-action=admin-db-backend]` | `adminDbFormBackend`; `render` | **Yes** |
| 28 | `input` | `input[data-action=admin-db-confirm-input]` | Confirm text; enable save btn | **Yes** |
| 29 | `input` | `input[data-action=admin-reset-password]` | Reset password; enable confirm btn | **Yes** |

**Also in `bind()` (not always `addEventListener` on new nodes):**

| Call | Purpose | Delegate? |
|------|---------|-----------|
| `unbindUserMenuOutside` / `bindUserMenuOutside` | Doc capture click when menu open | **Keep** helpers |
| `unbindDtPickerOutside` / `bindDtPickerOutside` | Doc capture click when DT open | **Keep** helpers |
| `unbindFilesUploadMenuOutside` / `bindFilesUploadMenuOutside` | Doc capture when upload menu open | **Keep** helpers |
| `files.bindFilesDom` | §3.2 | partial |
| `admin.bindAdminDom` | §3.3 | yes submit |
| `bindImportInput` | §3.4 | yes change |
| `bindHolidaysToggle` | §3.4 | yes change |
| `bindContactPhotoInput` | §3.4 | yes change |

---

### 3.2 `app/files/bind.ts` — every render when called

| # | Event | Target | Handler | Delegate? |
|---|-------|--------|---------|-----------|
| F1 | `submit` | `[data-form=files-rename]` | `onFilesRename` | **Yes** |
| F2 | `submit` | `[data-form=files-transfer]` | `onFilesTransfer` | **Yes** |
| F3 | `submit` | `[data-form=files-mkdir]` | `onFilesMkdir` | **Yes** |
| F4 | `change` | `input[type=file][data-action=files-upload-pick-files]` | `onFilesUploadInput(..., false)` | **Yes** (change bubbles) |
| F5 | `change` | `input[type=file][data-action=files-upload-pick-folder]` | `onFilesUploadInput(..., true)` | **Yes** |
| F6 | `dragenter` | `[data-files-drop-target]` | depth++, dragover UI | **Hybrid** — re-bind or root + depth on host |
| F7 | `dragover` | same | preventDefault, dropEffect | hybrid |
| F8 | `dragleave` | same | depth-- | hybrid |
| F9 | `drop` | same | `itemsFromDataTransfer` → `startFilesUpload` | hybrid |
| F10 | *(property)* | `input[data-action=files-select-all][data-indeterminate=1]` | set `indeterminate = true` | **Post-render only** (not a listener) |

**Guards on drop bind:** only if `activeTab === "files"` && `!busy` && `!filesUploadProgress`.

---

### 3.3 `app/admin/bind.ts`

| # | Event | Target | Handler | Delegate? |
|---|-------|--------|---------|-----------|
| A1 | `submit` | `[data-form=admin-user-create]` | `onAdminUserCreate` | **Yes** |
| A2 | `submit` | `[data-form=admin-user-edit]` | `onAdminUserEdit` | **Yes** |
| A3 | `submit` | `[data-form=admin-cal]` | `onAdminCalSave` | **Yes** |
| A4 | `submit` | `[data-form=admin-ab]` | `onAdminAbSave` | **Yes** |
| A5 | `submit` | `[data-form=admin-settings]` | `onAdminSettingsSave` | **Yes** |
| A6 | `submit` | `[data-form=admin-database]` | `onAdminDatabaseFormSubmit` | **Yes** |

---

### 3.4 Domain helpers called from `bind()`

| Function | File | Event | Selector | Delegate? |
|----------|------|-------|----------|-----------|
| `bindImportInput` | `calendars/import.ts` | `change` | `input[data-action=import-cal]` | **Yes** |
| | | `change` | `input[data-action=import-create-cal]` | **Yes** |
| | | `change` | `input[data-action=import-ab]` | **Yes** |
| `bindHolidaysToggle` | `calendars/holidays.ts` | `change` | create-cal `input[name=holidays]` | **Yes** (+ sync on bind) |
| `bindContactPhotoInput` | `contacts/photo.ts` | `change` | `input[data-action=contact-photo]` | **Yes** |

---

### 3.5 `app/bindColorPair.ts`

| Event | Target | Delegate? |
|-------|--------|-----------|
| `input` | `input[name=color_picker]` | **Yes** or keep after-render on open forms |
| `change` | `input[name=color]` | **Yes** / hybrid |

Called only when edit-cal / create-cal forms exist.

---

### 3.6 Document-level outside click (not every-node rebind)

| Module | API | Event | When registered |
|--------|-----|-------|-----------------|
| `shell.ts` | `bindUserMenuOutside` | `document` `click` capture | When `userMenuOpen` after render |
| `shell.ts` | `bindDtPickerOutside` | `document` `click` capture | When `eventDtPicker` set |
| `files/upload.ts` | `bindFilesUploadMenuOutside` | `document` `click` capture | When `filesUploadMenuOpen` |

**Strategy:** keep as today (toggle with state); optional call from `syncOutsideListeners(o)` after render instead of full bind.

---

## 4. `data-form` → submit handler map (for Step 3)

| `data-form` | Handler | Bound in |
|-------------|---------|----------|
| `login` | `o.onLogin` | bind.ts |
| `share` | `o.onShare` | bind.ts |
| `edit-event` | `o.onSaveEvent` | bind.ts |
| `edit-cal` | `o.onEditCal` | bind.ts |
| `create-cal` | `o.onCreateCal` | bind.ts |
| `contact` | `o.onSaveContact` | bind.ts |
| `create-ab` | `o.onCreateAb` | bind.ts |
| `edit-ab` | `o.onEditAb` | bind.ts |
| `task` | `o.onSaveTask` | bind.ts |
| `note` | `o.onSaveNote` | bind.ts |
| `files-rename` | `onFilesRename` | files/bind.ts |
| `files-transfer` | `onFilesTransfer` | files/bind.ts |
| `files-mkdir` | `onFilesMkdir` | files/bind.ts |
| `admin-user-create` | `onAdminUserCreate` | admin/bind.ts |
| `admin-user-edit` | `onAdminUserEdit` | admin/bind.ts |
| `admin-cal` | `onAdminCalSave` | admin/bind.ts |
| `admin-ab` | `onAdminAbSave` | admin/bind.ts |
| `admin-settings` | `onAdminSettingsSave` | admin/bind.ts |
| `admin-database` | `onAdminDatabaseFormSubmit` | admin/bind.ts |

**Total: 19 form identities** (plan estimated ~11 — undercounted admin/files).

---

## 5. Escape priority (must preserve order)

From `bind.ts` document `keydown` (first match wins):

1. Import progress **done/error** → `closeImportProgress`
2. Import progress **running** → no-op (block)
3. Files upload progress **done/error** → `closeFilesUploadProgress`
4. Files upload progress **running** → no-op
5. Files upload menu open → close + unbind outside
6. User menu open → close + unbind outside
7. Files upload **conflict** modal → resolve cancel
8. Files rename / delete / transfer / mkdir open → clear + render
9. `confirmDelete` → clear + render
10. Info modal → `closeInfoModal`
11. DT picker → clear + unbind outside
12. Event modal → clear editing event
13. Contact modal → clear contact edit/photo
14. AB modal → close
15. Cal modals / delete cal / delete ab confirms → clear
16. Admin user create/edit/delete → clear
17. Admin reset modal → clear
18. Admin DB confirm → clear pending body
19. Admin cal/ab/resource delete modals → clear

---

## 6. Delegation roadmap (map inventory → plan steps)

| Plan step | Inventory rows |
|-----------|----------------|
| Step 1 register dual path | Wire once; keep all of §3 |
| Step 2 click | #1 (+ info preventDefault) |
| Step 3 submit | #9–11,13,15,17–20,22 + F1–F3 + A1–A6 |
| Step 4 change/input | #2–3,5–6,12,21,23–29 + F4–F5 + import/holidays/photo + color pair |
| Step 5 Escape + keydown | #8, #4 |
| Step 6 drop + avatar | F6–F9, #7 |
| Step 7 shrink bind | Outside-click sync + indeterminate F10 leftovers |

---

## 7. Harness notes (optional Step 0 counter)

Not implemented in product code (optional per plan). To measure re-bind frequency later:

```ts
// temporary in bind():
log.debug("bind.afterRender", { tab: state.activeTab, n: ++bindCount });
```

Expect **one** log per `render()` today. After Step 7, post-render work should not re-attach root click/submit.

---

## 8. Smoke baseline (current 2.2.1 behavior — pre-delegation)

Manual / prior coverage (not re-run as part of Step 0 code change):

- [x] Login / logout (prior smoke)
- [x] Tabs including Admin
- [x] Calendar / DT / tasks draft / contacts / files conflict (prior 2.2.1 work)
- [ ] Full §8 of plan again after Step 1 dual-path

Step 0 is documentation-only — **no runtime change**.

---

## 9. Step 0 status

| Deliverable | Status |
|-------------|--------|
| Bind call sites documented | **Done** (§1) |
| Every `addEventListener` in bind / files / admin (+ helpers) | **Done** (§3) |
| Optional bind counter | Skipped (optional) |
| Inventory exit criteria | **Met** |

**Step 1 (done):** `registerPortalEvents(o)` — Escape live; other handlers scaffold.

**Step 2 (done):** root `click` → `onAction`; per-element `[data-action]` click re-bind removed.

**Step 3 (done):** root `submit` → 19 `data-form` handlers.

**Step 4 (done):** root `change` + `input`.

**Step 5 (done):** root row Enter/Space; Escape already at mount (Step 1).

**Step 6 (done):** root files drop + avatar error capture.

**Step 7 (done):** `bindAfterRender` in `afterRender.ts` (~35 lines); mount-time events cover interactions.

**Also:** Contacts/Tasks/Notes table rows — ArrowUp/Down focus, Enter/Space open.

**Step 8:** Automated gate green — [portal-delegated-events-verification.md](portal-delegated-events-verification.md). Manual smoke open before merge.
