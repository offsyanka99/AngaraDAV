# `onAction` inventory

**Date:** 2026-08-12 (updated for **2.2.1**)  
**Branch:** `refactor/portal-onaction-split` → release **2.2.1**  
**Source:** thin `portal/src/app/onAction.ts` (~41 lines) + domain `*actionsRouter.ts`  
**Baseline:** `tsc --noEmit` clean

Post-split **action → domain** map. Router contract: `handleXAction(o, action, t, ev) => Promise<boolean>` (`true` = handled).

---

## 1. Domain ownership

### shell → `handleShellAction` (`shellActionsRouter.ts`)

| Action | Notes |
|--------|--------|
| `close-import-progress` | Only closes when phase is done/error |
| `logout` | `api.logout`, `clearPortalSessionState` |
| `info` | `openInfoModal` (bind also stopPropagates info clicks) |
| `info-close` | `closeInfoModal` |
| `flash-close` | clearFlash + render |
| `user-menu-toggle` | **stopPropagation** |
| `user-menu-close` | |
| `tab` | `parseTabId`, admin → overview, `activateTab` |
| `confirm-delete-cancel` / `confirm-delete-ok` | Themed delete modal (event/task/note/contact/bulk-task/revoke-share) |

### admin → existing `admin.handleAdminAction`

| Action | Notes |
|--------|--------|
| `admin-*` | Prefix match |

### files → existing `files.handleFilesAction`

| Action | Notes |
|--------|--------|
| `files-*` | Prefix match |
| `close-files-upload-progress` | Explicit allow-list |

### calendars → `handleCalendarsAction` (Step 5)

| Action | Flags / notes |
|--------|----------------|
| `select-cal`, `toggle-cal` | |
| `edit-cal`, `close-cal-modal` | |
| `open-create-cal-modal`, `close-create-cal-modal` | |
| `delete-cal`, `cancel-delete-cal`, `confirm-delete-cal` | |
| `month-today`, `month-prev`, `month-next` | stopPropagation on some |
| `open-event`, `open-event-day`, `new-event-day`, `close-event-modal` | open-event stopPropagation |
| `dt-open`, `dt-month-prev/next`, `dt-set-month/year`, `dt-pick-day/time`, `dt-today`, `dt-clear` | Uses **datetimeSync** (cross-domain form sync) |
| `event-allday-toggle`, `event-repeat-freq`, `event-repeat-end` | |
| `delete-event` | |
| `revoke`, `export-cal` | stopPropagation |

### tasks → `handleTasksAction` (Step 2)

| Action | Flags |
|--------|--------|
| `sort-task` | Shared `if` with `sort-note` today — split carefully |
| `select-task` | stopPropagation + preventDefault (ignore checkbox cell) |
| `task-check` | stopPropagation + preventDefault |
| `task-select-all` | preventDefault |
| `bulk-task-clear`, `bulk-task-status`, `bulk-task-due`, `bulk-task-clear-due`, `bulk-task-percent`, `bulk-task-delete` | |
| `new-task`, `new-subtask`, `cancel-task`, `delete-task` | |

### notes → `handleNotesAction` (Step 3)

| Action | Notes |
|--------|--------|
| `sort-note` | Paired with sort-task today |
| `select-note`, `new-note`, `cancel-note`, `delete-note` | |

### contacts → `handleContactsAction` (Step 4)

| Action | Flags |
|--------|--------|
| `select-ab`, `edit-ab`, `close-ab-modal` | stopPropagation on select/edit |
| `select-contact`, `new-contact`, `cancel-contact`, `close-contact-modal` | |
| `add-email`, `add-phone`, `add-custom` | |
| `remove-email`, `remove-phone`, `remove-custom`, `remove-photo` | |
| `delete-contact`, `delete-ab`, `cancel-delete-ab`, `confirm-delete-ab` | |
| `export-ab`, `export-contact` | uses `saveBlobAsFile` |

---

## 2. Event flags (must preserve)

| Flag | Actions (confirm in code when moving) |
|------|----------------------------------------|
| `ev.stopPropagation()` | `user-menu-toggle`, `open-event`, `open-event-day`, month nav (verify), `select-task` path, `task-check`, `select-ab`, `edit-ab`, `remove-photo`, `delete-contact`, `delete-ab`, `export-ab`, `revoke`, … |
| `ev.preventDefault()` | `task-check`, `task-select-all`, select-task when clicking checkbox cell |

Bind layer also stopPropagates `info` / `info-close` clicks before `onAction`.

---

## 3. Orchestrator methods used from `onAction` (`o.*`)

| Method | Likely consumers |
|--------|------------------|
| `activateTab` | shell tab |
| `clearPortalSessionState` | shell logout |
| `closeImportProgress` | shell |
| `openInfoModal` / `closeInfoModal` | shell |
| `toggleCalendarSelected`, `loadMonthEvents`, `loadShares`, `blankEventForDay`, `defaultRepeat`, `pickDefaultCalendar` | calendars |
| `getDtFieldCurrentValue`, `setDtFieldValue`, `syncEditingEventFromForm`, `syncEditingTaskFromForm`, `syncEditingNoteFromForm` | calendars DT (+ cross-domain sync) |
| `loadTasks`, `runBulkTaskAction`, `itemKey` | tasks |
| `loadNotes` | notes |
| `loadContacts`, `openContact`, `startNewContact`, `contactsHost` | contacts |
| `loadHome`, `saveBlobAsFile` | contacts export, calendars export |
| `adminHost`, `filesHost` | admin/files routers |

**Decision (Step 0):** All new routers take **`AppOrchestrator`** (plan Option A).

---

## 4. Target chain order (after full split)

```text
shell → admin-* → files-* → calendars → tasks → notes → contacts
```

Matches `onAction.ts` after Step 5: shell first, then prefix routers, then domain bodies.

---

## 5. Baseline

| Check | Result |
|-------|--------|
| `tsc --noEmit` | clean (Step 0) |
| Unique `action ===` names | ~79 |
| Files/admin already extracted | yes |

---

## 6. Step status

| Step | Status |
|------|--------|
| 0 Inventory | **Done** (this file) |
| 1 Shell extract | **Done** (`shellActionsRouter.ts`) |
| 2 Tasks extract | **Done** (`tasks/actionsRouter.ts`) |
| 3 Notes extract | **Done** (`notes/actionsRouter.ts`) |
| 4 Contacts extract | **Done** (`contacts/actionsRouter.ts`) |
| 5 Calendars + datetimeSync | **Done** (`calendars/actionsRouter.ts`, `datetimeSync.ts`) |
| 6 Thin `onAction` | **Done** (`onAction.ts` ~41 lines) |
| 7 Verify | **Done** (tsc, vite build, import graph, Playwright + API smoke) |
