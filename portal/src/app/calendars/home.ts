/**
 * Calendars tab main HTML (Phase 8 extract from renderHome).
 */
import { esc, renderConfirmCheckbox, renderModal } from "../../ui";
import { infoTitle } from "../sectionInfo";
import type { AppOrchestrator } from "../orchestrator";

export function renderCalendarsHome(o: AppOrchestrator): string {
  const { state } = o;
  const own = state.calendars.filter((c) => c.canShare);
  const sharedWithMe = state.calendars.filter((c) => !c.canShare);
  const selected = state.calendars.find((c) => c.id === state.selectedId) ?? null;

  const calRows = own
    .map((c) => {
      const visible = state.selectedIds.includes(c.id);
      const active = visible ? " is-selected" : "";
      const primary = c.id === state.selectedId ? " is-primary" : "";
      const color = c.color
        ? `<span class="cal-swatch" style="background:${esc(c.color)}"></span>`
        : `<span class="cal-swatch cal-swatch-empty"></span>`;
      const badges =
        o.accessBadge(c.access) +
        (c.readOnly ? '<span class="badge">read-only</span>' : "") +
        (c.holidaysCountry
          ? `<span class="badge badge-admin">holidays ${esc(c.holidaysCountry)}</span>`
          : "");
      return `<div class="cal-row${active}${primary}" data-action="select-cal" data-id="${c.id}" role="button" tabindex="0" title="Toggle on the month grid">
        <label class="cal-row-check" title="Show events on the month grid">
          <input type="checkbox" data-action="toggle-cal" data-id="${c.id}" ${visible ? "checked" : ""} ${state.busy ? "disabled" : ""} />
        </label>
        ${color}
        <span class="cal-row-text">
          <span class="cal-row-title">${esc(c.displayname)}</span>
          <span class="cal-row-badges">${badges}</span>
          <span class="muted small mono cal-row-uri">${esc(c.uri)}</span>
        </span>
        <span class="cal-row-actions">
          <button type="button" class="btn btn-small" data-action="export-cal" data-id="${c.id}" ${state.busy ? "disabled" : ""} title="Export as .ics">Export</button>
          <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${c.id}" ${state.busy ? "disabled" : ""}>Edit</button>
          <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${c.id}" ${state.busy ? "disabled" : ""}>Delete</button>
        </span>
      </div>`;
    })
    .join("");

  const sharedRows = sharedWithMe
    .map((c) => {
      const visible = state.selectedIds.includes(c.id);
      const active = visible ? " is-selected" : "";
      const primary = c.id === state.selectedId ? " is-primary" : "";
      const color = c.color
        ? `<span class="cal-swatch" style="background:${esc(c.color)}"></span>`
        : `<span class="cal-swatch cal-swatch-empty"></span>`;
      const accessHint =
        c.access === "readwrite"
          ? "Shared with you · full access — check to show events; click to set as primary for new events"
          : "Shared with you · read-only — check to show events";
      return `<div class="cal-row${active}${primary}" data-action="select-cal" data-id="${c.id}" role="button" tabindex="0" title="${esc(accessHint)}">
        <label class="cal-row-check" title="Show events on the month grid">
          <input type="checkbox" data-action="toggle-cal" data-id="${c.id}" ${visible ? "checked" : ""} ${state.busy ? "disabled" : ""} />
        </label>
        ${color}
        <span class="cal-row-text">
          <span class="cal-row-title">${esc(c.displayname)}</span>
          <span class="cal-row-badges">${o.accessBadge(c.access)}</span>
          <span class="muted small">${c.access === "readwrite" ? "Shared · full access" : "Shared · read-only"}</span>
        </span>
        <span class="cal-row-actions">
          <button type="button" class="btn btn-small" data-action="export-cal" data-id="${c.id}" ${state.busy ? "disabled" : ""} title="Export as .ics">Export</button>
        </span>
      </div>`;
    })
    .join("");

  const userOptions = state.directory
    .map(
      (u) =>
        `<option value="${esc(u.username)}">${esc(u.displayname)} (${esc(u.username)})</option>`,
    )
    .join("");

  const shareRows =
    state.shares.length === 0
      ? `<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>`
      : state.shares
          .map(
            (s) => `<tr>
              <td>
                <strong>${esc(s.displayname || s.username || s.href)}</strong>
                <div class="muted small mono">${esc(s.username || s.href)}</div>
              </td>
              <td>${o.accessBadge(s.access)}</td>
              <td class="actions-cell">
                <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                  data-href="${esc(s.href)}" ${state.busy ? "disabled" : ""}>Revoke</button>
              </td>
            </tr>`,
          )
          .join("");

  const colorValue = selected?.color
    ? selected.color.length >= 7
      ? selected.color.slice(0, 7)
      : "#3B82F6"
    : "#3B82F6";

  const shareReadOnlyForced = !!(selected && selected.readOnly);
  const calModal =
    state.calModalOpen && selected && selected.canShare
      ? renderModal({
          id: "cal-edit-modal",
          title: "Calendar details",
          titleId: "cal-modal-title",
          closeAction: "close-cal-modal",
          body: `
              ${o.renderFlashBanner()}
              <section>
                <p class="muted small mono" style="margin:0">
                  ${esc(selected.uri)}
                  <button type="button" class="info-btn" data-action="info" data-info="calendar-details"
                    aria-label="About calendar details" title="About calendar details"
                    style="vertical-align:middle;margin-left:0.35rem">
                    <span aria-hidden="true">i</span>
                  </button>
                </p>
                <form class="stack" data-form="edit-cal" style="margin-top:1rem">
                  <label>
                    Display name
                    <input type="text" name="displayname" required maxlength="200"
                      value="${esc(selected.displayname)}" autocomplete="off" />
                  </label>
                  <label>
                    Color
                    <span class="color-field">
                      <input type="color" name="color_picker" value="${esc(colorValue)}"
                        title="Pick a color" aria-label="Calendar color picker" />
                      <input type="text" name="color" class="mono" maxlength="9"
                        value="${esc(selected.color || colorValue)}"
                        placeholder="#3B82F6" pattern="#?[0-9A-Fa-f]{3,8}" autocomplete="off" />
                    </span>
                  </label>
                  <label>
                    Description
                    <textarea name="description" rows="3" maxlength="2000"
                      placeholder="Optional notes for this calendar">${esc(selected.description)}</textarea>
                  </label>
                  <div class="form-actions-row">
                    <button type="submit" class="btn btn-primary" ${state.busy ? "disabled" : ""}>Save changes</button>
                    <span class="muted small mono">${esc(selected.uri)}</span>
                  </div>
                </form>
              </section>
              <section style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                ${infoTitle(`Share “${selected.displayname}”`, "share")}
                ${
                  shareReadOnlyForced
                    ? `<p class="muted small" style="margin-top:0.35rem"><strong>Read-only calendar:</strong> shares are always read-only.</p>`
                    : ""
                }
                <form class="form-grid" data-form="share" style="margin-top:1rem">
                  <label>
                    User
                    <select name="username" required ${state.directory.length === 0 ? "disabled" : ""}>
                      <option value="">${state.directory.length ? "Select user…" : "No other users"}</option>
                      ${userOptions}
                    </select>
                  </label>
                  <label>
                    Access
                    <select name="access" ${shareReadOnlyForced ? "disabled" : ""}>
                      <option value="read" selected>Read only</option>
                      ${shareReadOnlyForced ? "" : '<option value="readwrite">Full access</option>'}
                    </select>
                    ${shareReadOnlyForced ? '<input type="hidden" name="access" value="read" />' : ""}
                  </label>
                  <div class="form-actions">
                    <button type="submit" class="btn btn-primary" ${state.busy || state.directory.length === 0 ? "disabled" : ""}>Share</button>
                  </div>
                </form>
                <div class="table-wrap" style="margin-top:1.25rem">
                  <table>
                    <thead>
                      <tr><th>Shared with</th><th>Access</th><th></th></tr>
                    </thead>
                    <tbody>${shareRows}</tbody>
                  </table>
                </div>
              </section>
              <section class="import-export" style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                ${infoTitle("Import / export", "import-export")}
                ${
                  selected.readOnly
                    ? `<p class="muted small" style="margin-top:0.5rem"><strong>Read-only:</strong> import disabled.</p>`
                    : ""
                }
                <div class="form-actions-row" style="margin-top:0.75rem">
                  <button type="button" class="btn" data-action="export-cal" ${state.busy ? "disabled" : ""}>Export .ics</button>
                  <label class="btn btn-ghost file-btn" ${state.busy || selected.readOnly ? "aria-disabled=true" : ""}>
                    Import .ics
                    <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-cal" ${state.busy || selected.readOnly ? "disabled" : ""} hidden />
                  </label>
                </div>
              </section>`,
          footer: [{ label: "Close", action: "close-cal-modal", variant: "ghost" }],
        })
      : "";

  const deleteTarget =
    state.deleteConfirmId !== null
      ? state.calendars.find((c) => c.id === state.deleteConfirmId && c.canShare) ?? null
      : null;
  const deleteModal = deleteTarget
    ? renderModal({
        id: "cal-delete-modal",
        title: "Delete calendar",
        titleId: "cal-delete-title",
        closeAction: "cancel-delete-cal",
        size: "sm",
        body: `
            ${o.renderFlashBanner()}
            <p>You are about to permanently delete <strong>${esc(deleteTarget.displayname)}</strong>
              <span class="muted small mono">(${esc(deleteTarget.uri)})</span>.</p>
            <p class="muted small">All events, tasks, and notes in this calendar will be removed. Shares will be revoked. This cannot be undone.</p>
            ${renderConfirmCheckbox({
              action: "toggle-delete-confirm",
              label: "I understand and want to permanently delete this calendar",
              id: "delete-cal-confirm",
              style: "checkbox",
            })}`,
        footer: [
          { label: "Cancel", action: "cancel-delete-cal", variant: "ghost", disabled: state.busy },
          {
            label: "Delete permanently",
            action: "confirm-delete-cal",
            variant: "danger",
            disabled: true,
            id: "delete-cal-submit",
            attrs: `data-id="${deleteTarget.id}"`,
          },
        ],
      })
    : "";

  const createCalModal = state.createCalModalOpen
    ? renderModal({
        id: "cal-create-modal",
        title: "Add calendar",
        titleId: "cal-create-title",
        closeAction: "close-create-cal-modal",
        body: `
            ${o.renderFlashBanner()}
            <p class="muted small" style="margin:0 0 0.75rem">
              Create a personal calendar, optional holidays feed, or a read-only calendar.
              <button type="button" class="info-btn" data-action="info" data-info="add-calendar"
                aria-label="About add calendar" title="About add calendar"
                style="vertical-align:middle;margin-left:0.25rem">
                <span aria-hidden="true">i</span>
              </button>
            </p>
            <form class="stack" data-form="create-cal">
              <label>
                Display name
                <input type="text" name="displayname" id="create-displayname" maxlength="200" placeholder="Work" autocomplete="off" />
              </label>
              <label>
                Color
                <span class="color-field">
                  <input type="color" name="color_picker" value="#3B82F6" aria-label="New calendar color" />
                  <input type="text" name="color" class="mono" maxlength="9" value="#3B82F6" placeholder="#3B82F6" />
                </span>
              </label>
              <label>
                Description
                <textarea name="description" rows="2" maxlength="2000" placeholder="Optional"></textarea>
              </label>
              <label class="checkbox">
                <input type="checkbox" name="holidays" data-action="toggle-holidays" />
                Holidays calendar
              </label>
              <label class="holidays-country" id="holidays-country-wrap" hidden>
                Country
                <select name="holidayCountry" id="holiday-country">
                  <option value="">Select country…</option>
                  ${state.holidayCountries
                    .map(
                      (c) =>
                        `<option value="${esc(c.code)}">${esc(c.name)} (${esc(c.code)})</option>`,
                    )
                    .join("")}
                </select>
              </label>
              <label class="checkbox">
                <input type="checkbox" name="readOnly" />
                Read-only (for everyone)
              </label>
              <div class="form-actions-row form-actions-wrap">
                <button type="submit" class="btn btn-primary" ${state.busy ? "disabled" : ""}>Create calendar</button>
                <label class="btn btn-ghost file-btn" ${state.busy ? "aria-disabled=true" : ""} title="Create a calendar and import a .ics file">
                  Import .ics
                  <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-create-cal" ${state.busy ? "disabled" : ""} hidden />
                </label>
                <button type="button" class="btn btn-ghost" data-action="close-create-cal-modal" ${state.busy ? "disabled" : ""}>Cancel</button>
              </div>
              <p class="muted small" style="margin:0.5rem 0 0">
                <strong>Import .ics</strong> creates the calendar (name above, or the file name), then imports events. Not for holidays/read-only calendars.
              </p>
            </form>`,
      })
    : "";

  return `
    <div class="portal-grid portal-grid-calendars">
      <aside class="calendars-sidebar">
        <section class="card calendars-sidebar-card">
          <div class="calendars-sidebar-head">
            ${infoTitle("Owned", "owned")}
          </div>
          <p class="muted small" style="margin:0 0 0.65rem">
            Check one or more calendars to view events.
            Underlined name is primary for new events.
          </p>
          <div class="cal-list calendars-owned-list">
            ${calRows || '<p class="muted">No calendars yet. Create one below.</p>'}
            ${
              sharedWithMe.length
                ? `<div class="calendars-shared-block">
                     ${infoTitle("Shared with me", "shared-with-me")}
                     <div class="cal-list" style="margin-top:0.75rem">${sharedRows}</div>
                   </div>`
                : ""
            }
          </div>
          <div class="calendars-sidebar-create">
            <button type="button" class="btn btn-primary" style="width:100%" data-action="open-create-cal-modal" ${state.busy ? "disabled" : ""}>Create calendar</button>
          </div>
        </section>
      </aside>
      ${o.renderMonthGrid()}
    </div>
    ${createCalModal}
    ${calModal}
    ${deleteModal}
    ${o.renderEventModal()}`;
}

