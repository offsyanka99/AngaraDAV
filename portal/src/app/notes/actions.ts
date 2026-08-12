/** Notes save handler (Phase 7). */
import { api } from "../../api";
import { entityFlash } from "../format";
import { itemKey } from "../keys";
import type { NotesHost } from "./host";
import { loadNotes } from "./loaders";

/**
 * Pull live form values into editingNote before re-render (e.g. Date picker).
 */
export function syncEditingNoteFromForm(host: NotesHost, form: HTMLFormElement): void {
  if (!host.state.editingNote) return;
  const fd = new FormData(form);
  const dtLocal = String(fd.get("dtstart") ?? "").trim();
  const instanceRaw = fd.get("instanceId");
  const instanceId =
    instanceRaw !== null && String(instanceRaw) !== ""
      ? Number(instanceRaw)
      : host.state.editingNote.instanceId;
  host.state.editingNote = {
    ...host.state.editingNote,
    instanceId: Number.isFinite(instanceId) && instanceId > 0 ? instanceId : host.state.editingNote.instanceId,
    summary: String(fd.get("summary") ?? host.state.editingNote.summary),
    description: String(fd.get("description") ?? host.state.editingNote.description),
    dtstart: dtLocal ? new Date(dtLocal).toISOString() : null,
  };
}

export async function onSaveNote(host: NotesHost, form: HTMLFormElement) {
  const fd = new FormData(form);
  const summary = String(fd.get("summary") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim();
  const dtLocal = String(fd.get("dtstart") ?? "").trim();
  const dtstart = dtLocal ? new Date(dtLocal).toISOString() : null;
  host.state.busy = true;
  host.clearFlash();
  host.render();
  try {
    if (host.state.creatingNote) {
      const instanceId = Number(fd.get("instanceId"));
      if (!Number.isFinite(instanceId) || instanceId <= 0) {
        throw new Error("Select a calendar");
      }
      const res = await api.createNote({
        instanceId,
        summary,
        description,
        dtstart,
      });
      host.state.creatingNote = false;
      host.state.selectedNoteKey = itemKey(res.note.instanceId, res.note.uri);
      host.state.editingNote = res.note;
      host.setFlash("success", entityFlash("Note", res.note.summary || summary, "created"));
    } else if (host.state.editingNote) {
      const res = await api.updateNote(host.state.editingNote.instanceId, host.state.editingNote.uri, {
        summary,
        description,
        dtstart,
      });
      host.state.editingNote = res.note;
      host.state.selectedNoteKey = itemKey(res.note.instanceId, res.note.uri);
      host.setFlash("success", entityFlash("Note", res.note.summary || summary, "saved"));
    }
    await loadNotes(host);
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Save failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
}
