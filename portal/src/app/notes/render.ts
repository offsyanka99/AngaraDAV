/** Notes tab UI (Phase 7). */
import { esc, renderModal } from "../../ui";
import { toLocalInputValue } from "../datetime";
import { renderFlashBanner } from "../flash";
import { formatWhen, sortHeader } from "../format";
import { itemKey } from "../keys";
import { infoTitle } from "../sectionInfo";
import { renderListToolbar } from "../selectionToolbar";
import { renderNoteEditor } from "./editor";
import { notePlainText } from "./html";
import type { NotesHost } from "./host";

function renderNoteModal(host: NotesHost): string {
  if (!host.state.noteModalOpen || !host.state.editingNote) return "";
  const n = host.state.editingNote;
  const creating = host.state.creatingNote;
  const readOnly = !!(n.readOnly && !creating);
  const canWrite = creating || n.canWrite;
  const calOpts = host.state.noteCalendars
    .map(
      (c) =>
        `<option value="${c.id}" ${n.instanceId === c.id ? "selected" : ""}>${esc(c.displayname)}</option>`,
    )
    .join("");
  const footer = [
    ...(!creating && n.canWrite
      ? [
          {
            label: "Delete",
            action: "delete-note",
            variant: "danger" as const,
            disabled: host.state.busy,
          },
        ]
      : []),
    { label: creating ? "Cancel" : "Close", action: "cancel-note", variant: "ghost" as const },
    ...(canWrite
      ? [
          {
            label: creating ? "Create note" : "Save note",
            type: "submit" as const,
            variant: "primary" as const,
            disabled: host.state.busy,
          },
        ]
      : []),
  ];
  return renderModal({
    id: "note-edit-modal",
    title: creating ? "New note" : "Edit note",
    titleId: "note-modal-title",
    closeAction: "cancel-note",
    size: "wide",
    cardClassName: "note-edit-modal-card",
    form: true,
    formAttrs: 'data-form="note"',
    body: `${renderFlashBanner(host.state)}
            ${
              creating
                ? `<label>Calendar
                    <select name="instanceId" required ${host.state.noteCalendars.length === 0 ? "disabled" : ""}>
                      <option value="">${host.state.noteCalendars.length ? "Select calendar…" : "No writable calendars"}</option>
                      ${calOpts}
                    </select>
                  </label>`
                : `<p class="muted small">Calendar: <strong>${esc(n.calendarName)}</strong>${n.readOnly ? " · read-only" : ""}</p>`
            }
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${esc(n.summary)}" ${readOnly ? "readonly" : ""} />
            </label>
            ${host.renderPortalDateTimeField({
              field: "dtstart",
              name: "dtstart",
              label: "Date",
              value: toLocalInputValue(n.dtstart),
              dateOnly: false,
              disabled: readOnly,
              allowClear: true,
            })}
            <div class="field">
              <span>Body</span>
              ${renderNoteEditor(n.description, readOnly)}
            </div>`,
    footer,
  });
}

export function renderNotesTab(host: NotesHost): string {
  const writableKeys = host.state.notes
    .filter((n) => n.canWrite && !n.readOnly)
    .map((n) => itemKey(n.instanceId, n.uri));
  const nChecked = host.state.checkedNoteKeys.filter((k) => writableKeys.includes(k)).length;
  const allWritableChecked =
    writableKeys.length > 0 && writableKeys.every((k) => host.state.checkedNoteKeys.includes(k));
  const someChecked = host.state.checkedNoteKeys.length > 0 && !allWritableChecked;
  const skipped = host.state.checkedNoteKeys.length - nChecked;
  const toolbar = renderListToolbar({
    searchAction: "note-search",
    searchPlaceholder: "Search notes…",
    searchValue: host.state.noteSearch,
    searchAria: "Search notes",
    busy: host.state.busy,
    addAction: "new-note",
    addLabel: "Add note",
    addDisabled: host.state.noteCalendars.length === 0,
    selection:
      host.state.checkedNoteKeys.length > 0
        ? {
            count: nChecked,
            extra: skipped > 0 ? `(${skipped} read-only skipped)` : undefined,
            clearAction: "note-clear-selection",
            actionsHtml: `
            <button type="button" class="btn btn-ghost btn-small" data-action="note-bulk-copy" ${host.state.busy || nChecked === 0 ? "disabled" : ""}>Copy</button>
            <button type="button" class="btn btn-small btn-danger" data-action="note-bulk-delete" ${host.state.busy || nChecked === 0 ? "disabled" : ""}>Delete</button>`,
          }
        : null,
  });

  const rows =
    host.state.notes.length === 0
      ? `<tr class="contacts-empty-row"><td colspan="4" class="muted">${
          host.state.noteSearch ? "No notes match your search." : "No notes yet. Use Add note."
        }</td></tr>`
      : host.state.notes
          .map((n) => {
            const key = itemKey(n.instanceId, n.uri);
            const active = !host.state.creatingNote && key === host.state.selectedNoteKey ? " is-selected" : "";
            const checked = host.state.checkedNoteKeys.includes(key);
            const canCheck = n.canWrite && !n.readOnly;
            const preview = notePlainText(n.description || "").replace(/\s+/g, " ").slice(0, 80);
            return `<tr class="contact-table-row${active}${checked ? " is-checked" : ""}" data-action="select-note" data-instance="${n.instanceId}" data-uri="${esc(n.uri)}" tabindex="0" role="button">
              <td class="contact-col-check" data-stop-row>
                <input type="checkbox" class="row-check" data-action="note-check" data-instance="${n.instanceId}" data-uri="${esc(n.uri)}"
                  ${checked ? "checked" : ""} ${canCheck ? "" : "disabled"} aria-label="Select ${esc(n.summary || n.uri)}" ${host.state.busy ? "disabled" : ""} />
              </td>
              <td class="col-note-title">
                <span class="contact-name-primary">${esc(n.summary || n.uri)}</span>
                ${preview ? `<span class="muted small contact-name-secondary">${esc(preview)}${n.description.length > 80 ? "…" : ""}</span>` : ""}
                ${n.readOnly ? '<span class="badge">read-only</span>' : ""}
              </td>
              <td class="col-note-date muted small">${esc(formatWhen(n.dtstart))}</td>
              <td class="col-note-cal muted small">${esc(n.calendarName)}</td>
            </tr>`;
          })
          .join("");

  return `<div class="portal-grid portal-grid-items">
    <section class="card contacts-main-card items-list-card">
      <div class="files-head">
        ${infoTitle("Notes", "notes", "h1")}
      </div>
      ${toolbar}
      ${
        host.state.noteCalendars.length === 0
          ? `<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>`
          : ""
      }
      <div class="contacts-table-wrap contacts-table-wrap-tall items-table-wrap">
        <table class="contacts-table">
          <thead>
            <tr>
              <th class="contact-col-check">
                <input type="checkbox" data-action="note-select-all" aria-label="Select all writable notes"
                  ${allWritableChecked ? "checked" : ""}
                  ${someChecked ? "data-indeterminate=1" : ""}
                  ${host.state.notes.length === 0 || host.state.busy ? "disabled" : ""} />
              </th>
              ${sortHeader("Title", "summary", host.state.noteSort, host.state.noteOrder, "note", "col-note-title")}
              ${sortHeader("Date", "dtstart", host.state.noteSort, host.state.noteOrder, "note", "col-note-date")}
              ${sortHeader("Calendar", "calendar", host.state.noteSort, host.state.noteOrder, "note", "col-note-cal")}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="muted small contacts-main-hint">Select a note to edit, or use <strong>Add note</strong>.</p>
    </section>
    ${renderNoteModal(host)}
  </div>`;
}
