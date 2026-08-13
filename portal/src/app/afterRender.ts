/**
 * Post-render hooks (delegated-events Step 7).
 * Mount-time events live in registerPortalEvents; this only syncs state that
 * must re-apply after innerHTML (outside-click, indeterminate, holidays UI,
 * list keyboard focus).
 */
import type { AppOrchestrator } from "./orchestrator";
import * as files from "./files";
import { bindDtPickerOutside, unbindDtPickerOutside } from "./shell";

/** @deprecated use bindAfterRender — kept as alias for older imports */
export function bind(o: AppOrchestrator): void {
  bindAfterRender(o);
}

export function bindAfterRender(o: AppOrchestrator): void {
  const { state, render } = o;

  o.unbindUserMenuOutside();
  if (state.userMenuOpen) {
    o.bindUserMenuOutside();
  }
  unbindDtPickerOutside(state);
  if (state.eventDtPicker) {
    bindDtPickerOutside(state, render);
  }
  o.unbindFilesUploadMenuOutside();
  if (state.filesUploadMenuOpen) {
    o.bindFilesUploadMenuOutside();
  }

  // Indeterminate select-all must be re-set after each paint
  files.bindFilesDom(o.filesHost);
  // Create-cal holidays field visibility (no listener)
  o.bindHolidaysToggle();

  // Keep ↑/↓/Enter working after re-render (innerHTML clears focus)
  restoreListKeyboardFocus(o);
}

/** Focus the selected Contacts/Tasks/Notes row so keyboard nav continues after paint. */
function restoreListKeyboardFocus(o: AppOrchestrator): void {
  const { state, root } = o;
  if (!state.listKeyboardFocus) return;
  if (state.activeTab !== "contacts" && state.activeTab !== "tasks" && state.activeTab !== "notes") {
    return;
  }

  const active = document.activeElement as HTMLElement | null;
  // Don't steal focus from a live form field the user is editing
  if (
    active &&
    root.contains(active) &&
    active.matches("input:not([type=checkbox]), textarea, select") &&
    !active.closest("tr.contact-table-row[data-action]")
  ) {
    return;
  }
  // Already on a list row
  if (active?.closest?.("tr.contact-table-row[data-action]")) {
    return;
  }

  let row: HTMLElement | null = null;
  if (state.activeTab === "contacts" && state.selectedContactUri) {
    row = root.querySelector(
      `tr[data-action="select-contact"][data-uri="${CSS.escape(state.selectedContactUri)}"]`,
    );
  } else if (state.activeTab === "tasks" && state.selectedTaskKey) {
    const pipe = state.selectedTaskKey.indexOf("|");
    if (pipe > 0) {
      const inst = state.selectedTaskKey.slice(0, pipe);
      const uri = state.selectedTaskKey.slice(pipe + 1);
      row = root.querySelector(
        `tr[data-action="select-task"][data-instance="${CSS.escape(inst)}"][data-uri="${CSS.escape(uri)}"]`,
      );
    }
  } else if (state.activeTab === "notes" && state.selectedNoteKey) {
    const pipe = state.selectedNoteKey.indexOf("|");
    if (pipe > 0) {
      const inst = state.selectedNoteKey.slice(0, pipe);
      const uri = state.selectedNoteKey.slice(pipe + 1);
      row = root.querySelector(
        `tr[data-action="select-note"][data-instance="${CSS.escape(inst)}"][data-uri="${CSS.escape(uri)}"]`,
      );
    }
  }

  if (!row) {
    // Fall back to first row so arrows still work after open/close
    const action =
      state.activeTab === "contacts"
        ? "select-contact"
        : state.activeTab === "tasks"
          ? "select-task"
          : "select-note";
    row = root.querySelector(`tr.contact-table-row[data-action="${action}"]`);
  }
  if (row) {
    row.focus({ preventScroll: true });
  }
}
