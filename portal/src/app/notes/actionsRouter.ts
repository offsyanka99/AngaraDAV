/**
 * Notes tab data-action router (onAction split Step 3).
 * Owns: sort-note, select/new/cancel/delete note.
 */
import type { AppOrchestrator } from "../orchestrator";
import { applyNoteFormat } from "./editor";
import { runBulkNoteAction } from "./actions";

/**
 * Handle note actions. Returns true if the action was recognized
 * (including early no-ops).
 */
export async function handleNotesAction(
  o: AppOrchestrator,
  action: string,
  t: HTMLElement,
  ev: Event,
): Promise<boolean> {
  const { state, render, setFlash, clearFlash } = o;

  if (action === "note-fmt") {
    ev.preventDefault();
    applyNoteFormat(t.dataset.cmd || "", t.dataset.value);
    return true;
  }

  if (action === "sort-note") {
    const col = t.dataset.sort || "";
    if (!col) return true;
    if (state.noteSort === col) state.noteOrder = state.noteOrder === "asc" ? "desc" : "asc";
    else {
      state.noteSort = col;
      state.noteOrder = "asc";
    }
    state.busy = true;
    render();
    try {
      await o.loadNotes();
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Sort failed");
    } finally {
      state.busy = false;
      render();
    }
    return true;
  }

  if (action === "note-check") {
    ev.stopPropagation();
    const instanceId = Number(t.dataset.instance);
    const uri = t.dataset.uri ?? "";
    if (!Number.isFinite(instanceId) || !uri) return true;
    const key = o.itemKey(instanceId, uri);
    const note = state.notes.find((x) => o.itemKey(x.instanceId, x.uri) === key);
    if (!note || note.readOnly || note.canWrite === false) return true;
    const on = t instanceof HTMLInputElement ? t.checked : !state.checkedNoteKeys.includes(key);
    if (on) {
      if (!state.checkedNoteKeys.includes(key)) state.checkedNoteKeys = [...state.checkedNoteKeys, key];
    } else {
      state.checkedNoteKeys = state.checkedNoteKeys.filter((k) => k !== key);
    }
    render();
    return true;
  }

  if (action === "note-select-all") {
    ev.stopPropagation();
    const writable = state.notes.filter((x) => !x.readOnly && x.canWrite !== false);
    const on =
      t instanceof HTMLInputElement
        ? t.checked
        : writable.length > 0 && writable.length !== state.checkedNoteKeys.length;
    state.checkedNoteKeys = on ? writable.map((x) => o.itemKey(x.instanceId, x.uri)) : [];
    render();
    return true;
  }

  if (action === "note-clear-selection") {
    state.checkedNoteKeys = [];
    render();
    return true;
  }

  if (action === "note-bulk-copy") {
    await runBulkNoteAction(o.notesHost, "copy");
    return true;
  }

  if (action === "note-bulk-delete") {
    const n = state.notes.filter(
      (x) => x.canWrite && !x.readOnly && state.checkedNoteKeys.includes(o.itemKey(x.instanceId, x.uri)),
    ).length;
    if (n === 0) {
      setFlash("error", "No writable notes selected");
      render();
      return true;
    }
    state.confirmDelete = {
      scope: "bulk-note",
      title: n === 1 ? "Delete note" : `Delete ${n} notes`,
      message: n === 1 ? "Delete the selected note?" : `Delete ${n} selected notes?`,
      detail: "CalDAV clients will sync the removal. This cannot be undone.",
    };
    render();
    return true;
  }

  if (action === "select-note") {
    if ((ev.target as HTMLElement).closest("[data-stop-row], .row-check")) return true;
    const instanceId = Number(t.dataset.instance);
    const uri = t.dataset.uri ?? "";
    if (!Number.isFinite(instanceId) || !uri) return true;
    const found = state.notes.find((x) => x.instanceId === instanceId && x.uri === uri) ?? null;
    state.creatingNote = false;
    state.selectedNoteKey = o.itemKey(instanceId, uri);
    state.editingNote = found ? { ...found } : null;
    state.noteModalOpen = !!found;
    clearFlash();
    render();
    return true;
  }

  if (action === "new-note") {
    state.creatingNote = true;
    state.selectedNoteKey = null;
    state.noteModalOpen = true;
    state.editingNote = {
      uri: "",
      instanceId: state.noteCalendars[0]?.id ?? 0,
      calendarId: 0,
      calendarName: "",
      calendarUri: "",
      summary: "",
      description: "",
      dtstart: null,
      lastmodified: 0,
      readOnly: false,
      canWrite: true,
    };
    clearFlash();
    render();
    return true;
  }

  if (action === "cancel-note") {
    state.creatingNote = false;
    state.editingNote = null;
    state.noteModalOpen = false;
    render();
    return true;
  }

  if (action === "delete-note") {
    if (!state.editingNote || state.creatingNote) return true;
    const title = String(state.editingNote.summary || "this note").trim() || "this note";
    state.confirmDelete = {
      scope: "note",
      title: "Delete note",
      message: `Delete “${title}”?`,
      detail: "CalDAV clients will sync the removal. This cannot be undone.",
    };
    render();
    return true;
  }

  return false;
}
