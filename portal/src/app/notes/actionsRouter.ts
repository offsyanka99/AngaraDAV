/**
 * Notes tab data-action router (onAction split Step 3).
 * Owns: sort-note, select/new/cancel/delete note.
 */
import type { AppOrchestrator } from "../orchestrator";
import { applyNoteFormat } from "./editor";

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

  if (action === "select-note") {
    const instanceId = Number(t.dataset.instance);
    const uri = t.dataset.uri ?? "";
    if (!Number.isFinite(instanceId) || !uri) return true;
    const found = state.notes.find((x) => x.instanceId === instanceId && x.uri === uri) ?? null;
    state.creatingNote = false;
    state.selectedNoteKey = o.itemKey(instanceId, uri);
    state.editingNote = found ? { ...found } : null;
    clearFlash();
    render();
    return true;
  }

  if (action === "new-note") {
    state.creatingNote = true;
    state.selectedNoteKey = null;
    state.editingNote = {
      uri: "",
      instanceId: state.noteCalendars[0]?.id ?? 0,
      calendarId: 0,
      calendarName: "",
      calendarUri: "",
      summary: "",
      description: "",
      dtstart: new Date().toISOString(),
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
    state.selectedNoteKey = null;
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
