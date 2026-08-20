/** Notes tab UI (Phase 7). */
import { esc } from "../../ui";
import { toLocalInputValue } from "../datetime";
import { formatWhen, sortHeader } from "../format";
import { itemKey } from "../keys";
import { infoTitle } from "../sectionInfo";
import { renderSelectionToolbar } from "../selectionToolbar";
import { renderNoteEditor } from "./editor";
import { notePlainText } from "./html";
import type { NotesHost } from "./host";

export function renderNotesTab(host: NotesHost): string {
  const writableKeys = host.state.notes
    .filter((n) => n.canWrite && !n.readOnly)
    .map((n) => itemKey(n.instanceId, n.uri));
  const nChecked = host.state.checkedNoteKeys.filter((k) => writableKeys.includes(k)).length;
  const allWritableChecked =
    writableKeys.length > 0 && writableKeys.every((k) => host.state.checkedNoteKeys.includes(k));
  const someChecked = host.state.checkedNoteKeys.length > 0 && !allWritableChecked;
  const skipped = host.state.checkedNoteKeys.length - nChecked;
  const toolbarActions =
    host.state.checkedNoteKeys.length > 0
      ? renderSelectionToolbar({
          count: nChecked,
          extra: skipped > 0 ? `(${skipped} read-only skipped)` : undefined,
          busy: host.state.busy,
          clearAction: "note-clear-selection",
          actionsHtml: `
            <button type="button" class="btn btn-ghost btn-small" data-action="note-bulk-copy" ${host.state.busy || nChecked === 0 ? "disabled" : ""}>Copy</button>
            <button type="button" class="btn btn-small btn-danger" data-action="note-bulk-delete" ${host.state.busy || nChecked === 0 ? "disabled" : ""}>Delete</button>`,
        })
      : `<button type="button" class="btn btn-primary" data-action="new-note" ${host.state.busy || host.state.noteCalendars.length === 0 ? "disabled" : ""}>Add note</button>`;

  const rows =
    host.state.notes.length === 0
      ? `<tr class="contacts-empty-row"><td colspan="4" class="muted">${
          host.state.noteSearch ? "No notes match your search." : "No notes yet. Add one below."
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

  const n = host.state.editingNote;
  const calOpts = host.state.noteCalendars
    .map(
      (c) =>
        `<option value="${c.id}" ${n && n.instanceId === c.id ? "selected" : ""}>${esc(c.displayname)}</option>`,
    )
    .join("");
  const form =
    n
      ? `<div class="card">
          ${infoTitle(host.state.creatingNote ? "New note" : "Edit note", "notes")}
          <form class="stack" data-form="note" style="margin-top:1rem">
            ${
              host.state.creatingNote
                ? `<label>Calendar
                    <select name="instanceId" required ${host.state.noteCalendars.length === 0 ? "disabled" : ""}>
                      <option value="">${host.state.noteCalendars.length ? "Select calendar…" : "No writable calendars"}</option>
                      ${calOpts}
                    </select>
                  </label>`
                : `<p class="muted small">Calendar: <strong>${esc(n.calendarName)}</strong>${n.readOnly ? " · read-only" : ""}</p>`
            }
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${esc(n.summary)}" ${n.readOnly && !host.state.creatingNote ? "readonly" : ""} />
            </label>
            ${host.renderPortalDateTimeField({
              field: "dtstart",
              name: "dtstart",
              label: "Date",
              value: toLocalInputValue(n.dtstart),
              dateOnly: false,
              disabled: !!(n.readOnly && !host.state.creatingNote),
              allowClear: true,
            })}
            <label>Body
              ${renderNoteEditor(n.description, !!(n.readOnly && !host.state.creatingNote))}
            </label>
            <div class="form-actions-row">
              ${
                host.state.creatingNote || n.canWrite
                  ? `<button type="submit" class="btn btn-primary" ${host.state.busy ? "disabled" : ""}>${host.state.creatingNote ? "Create note" : "Save note"}</button>`
                  : ""
              }
              ${
                !host.state.creatingNote && n.canWrite
                  ? `<button type="button" class="btn btn-danger" data-action="delete-note" ${host.state.busy ? "disabled" : ""}>Delete</button>`
                  : host.state.creatingNote
                    ? `<button type="button" class="btn btn-ghost" data-action="cancel-note">Cancel</button>`
                    : ""
              }
            </div>
          </form>
        </div>`
      : `<div class="card"><p class="muted">Select a note or click <strong>Add note</strong>.</p></div>`;

  return `<div class="portal-grid portal-grid-items">
    <section class="card contacts-main-card items-list-card">
      ${infoTitle("Notes", "notes")}
      <div class="contact-toolbar" style="margin-top:0.75rem">
        <input type="search" data-action="note-search" placeholder="Search notes…" value="${esc(host.state.noteSearch)}" aria-label="Search notes" ${host.state.busy ? "disabled" : ""} />
        ${toolbarActions}
      </div>
      ${
        host.state.noteCalendars.length === 0
          ? `<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>`
          : ""
      }
      <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
        <table class="contacts-table">
          <thead>
            <tr>
              <th class="contact-col-check">
                <input type="checkbox" data-action="note-select-all" aria-label="Select all writable notes"
                  ${allWritableChecked ? "checked" : ""}
                  ${someChecked ? "data-indeterminate=1" : ""}
                  ${writableKeys.length === 0 || host.state.busy ? "disabled" : ""} />
              </th>
              ${sortHeader("Title", "summary", host.state.noteSort, host.state.noteOrder, "note", "col-note-title")}
              ${sortHeader("Date", "dtstart", host.state.noteSort, host.state.noteOrder, "note", "col-note-date")}
              ${sortHeader("Calendar", "calendar", host.state.noteSort, host.state.noteOrder, "note", "col-note-cal")}
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
    <section class="stack items-edit-panel">
      ${form}
    </section>
  </div>`;
}

/** Full re-render replaces DOM and would reset scroll; capture/restore so list clicks stay put. */
