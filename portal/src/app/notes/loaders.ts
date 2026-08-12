/** Notes loaders (Phase 7). */
import { api } from "../../api";
import type { NotesHost } from "./host";

export async function loadNotes(host: NotesHost) {
  const res = await api.notes({ q: host.state.noteSearch, sort: host.state.noteSort, order: host.state.noteOrder });
  host.state.notes = res.notes;
  host.state.noteCalendars = res.calendars;
  if (
    host.state.selectedNoteKey !== null &&
    !host.state.notes.some((n) => `${n.instanceId}|${n.uri}` === host.state.selectedNoteKey)
  ) {
    host.state.selectedNoteKey = null;
    if (!host.state.creatingNote) host.state.editingNote = null;
  }
}
