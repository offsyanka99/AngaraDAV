/**
 * Cross-domain form draft sync before datetime-picker re-renders.
 * Neutral helper so calendars router does not import tasks/notes/contacts modules
 * for sibling domain form sync (onAction split Step 5).
 */
import type { AppOrchestrator } from "./orchestrator";
import { syncContactFormFromDom } from "./contacts/form";

/** Keep draft form fields when DT/date picker re-renders the page. */
export function syncOpenItemFormsBeforeDtRender(o: AppOrchestrator): void {
  const { state, root } = o;
  const eventForm = root.querySelector<HTMLFormElement>('[data-form="edit-event"]');
  if (eventForm && state.editingEvent) o.syncEditingEventFromForm(eventForm);
  const taskForm = root.querySelector<HTMLFormElement>('[data-form="task"]');
  if (taskForm && state.editingTask) o.syncEditingTaskFromForm(taskForm);
  const noteForm = root.querySelector<HTMLFormElement>('[data-form="note"]');
  if (noteForm && state.editingNote) o.syncEditingNoteFromForm(noteForm);
  // Contact Birthday (and any future contact date fields)
  if (state.editingContact) {
    syncContactFormFromDom(o.contactsHost);
  }
}
