/** Tasks tab UI (Phase 7). */
import { esc } from "../../ui";
import { toLocalInputValue } from "../datetime";
import { formatWhen, sortHeader } from "../format";
import { itemKey } from "../keys";
import { infoTitle } from "../sectionInfo";
import { renderSelectionToolbar } from "../selectionToolbar";
import type { TasksHost } from "./host";
import { filterTasks, normalizeTaskFilters } from "./listing";
import {
  parentTaskOptions,
  tasksInTreeOrder,
  writableCheckedTasks,
} from "./tree";

function taskFilterSelect(
  col: "status" | "due" | "calendar" | "percent",
  value: string,
  options: [string, string][],
  busy: boolean,
): string {
  const opts = options
    .map(([v, label]) => `<option value="${esc(v)}" ${v === value ? "selected" : ""}>${esc(label)}</option>`)
    .join("");
  return `<select class="task-col-filter" data-action="task-filter" data-col="${col}" aria-label="Filter by ${col}" ${busy ? "disabled" : ""}>${opts}</select>`;
}

export function renderTasksTab(host: TasksHost): string {
  const statusLabel = (s: string) => {
    const m: Record<string, string> = {
      "NEEDS-ACTION": "To do",
      "IN-PROCESS": "In progress",
      COMPLETED: "Done",
      CANCELLED: "Cancelled",
    };
    return m[s] || s;
  };
  const filters = normalizeTaskFilters(host.state.taskFilters);
  const listed = filterTasks(host.state.tasks, filters);
  const tree = tasksInTreeOrder(host, listed);
  const writableKeys = listed
    .filter((t) => t.canWrite && !t.readOnly)
    .map((t) => itemKey(t.instanceId, t.uri));
  const allWritableChecked =
    writableKeys.length > 0 && writableKeys.every((k) => host.state.checkedTaskKeys.includes(k));
  const someChecked = host.state.checkedTaskKeys.length > 0 && !allWritableChecked;
  const checkedWritable = writableCheckedTasks(host);
  const nChecked = checkedWritable.length;

  const rows =
    listed.length === 0
      ? `<tr class="contacts-empty-row"><td colspan="6" class="muted">${
          host.state.taskSearch
            ? "No tasks match your search."
            : host.state.tasks.length > 0
              ? "No tasks match these column filters."
              : "No tasks yet. Add one below."
        }</td></tr>`
      : tree
          .map(({ task: t, depth }) => {
            const key = itemKey(t.instanceId, t.uri);
            const active = !host.state.creatingTask && key === host.state.selectedTaskKey ? " is-selected" : "";
            const checked = host.state.checkedTaskKeys.includes(key);
            const st = t.status === "COMPLETED" ? "badge-ok" : t.status === "CANCELLED" ? "" : "badge-admin";
            const indent = depth > 0 ? ` style="--task-depth:${depth}"` : "";
            const marker =
              depth > 0
                ? `<span class="task-subtask-marker" aria-hidden="true">↳</span>`
                : "";
            const canCheck = t.canWrite && !t.readOnly;
            return `<tr class="contact-table-row task-row${depth > 0 ? " is-subtask" : ""}${active}${checked ? " is-checked" : ""}" data-action="select-task" data-instance="${t.instanceId}" data-uri="${esc(t.uri)}" tabindex="0" role="button"${indent}>
              <td class="col-task-check" data-stop-row>
                <input type="checkbox" class="task-check" data-action="task-check" data-instance="${t.instanceId}" data-uri="${esc(t.uri)}"
                  ${checked ? "checked" : ""} ${canCheck ? "" : "disabled"} aria-label="Select ${esc(t.summary || t.uri)}" ${host.state.busy ? "disabled" : ""} />
              </td>
              <td class="col-task-title"><span class="task-title-inner">${marker}<span class="contact-name-primary">${esc(t.summary || t.uri)}</span></span>
                ${t.readOnly ? '<span class="badge">read-only</span>' : ""}</td>
              <td class="col-task-status"><span class="badge ${st}">${esc(statusLabel(t.status))}</span></td>
              <td class="col-task-due muted small">${esc(formatWhen(t.due))}</td>
              <td class="col-task-cal muted small">${esc(t.calendarName)}</td>
              <td class="col-task-pct muted small">${t.percent ? esc(String(t.percent)) + "%" : "—"}</td>
            </tr>`;
          })
          .join("");

  const applyIcon = `<svg class="bulk-apply-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
  const bulkApplyBtn = (action: string, label: string) =>
    `<button type="button" class="btn btn-small bulk-apply-btn" data-action="${action}"
      title="${esc(label)}" aria-label="${esc(label)}" ${host.state.busy || nChecked === 0 ? "disabled" : ""}>${applyIcon}</button>`;
  const skipped = host.state.checkedTaskKeys.length - nChecked;
  const hasSelection = host.state.checkedTaskKeys.length > 0;
  const toolbarActions = hasSelection
    ? renderSelectionToolbar({
        count: nChecked,
        extra: skipped > 0 ? `(${skipped} read-only skipped)` : undefined,
        busy: host.state.busy,
        clearAction: "bulk-task-clear",
        actionsHtml: `<button type="button" class="btn btn-small btn-danger" data-action="bulk-task-delete" ${host.state.busy || nChecked === 0 ? "disabled" : ""}>Delete</button>`,
      })
    : `<button type="button" class="btn btn-primary" data-action="new-task" ${host.state.busy || host.state.taskCalendars.length === 0 ? "disabled" : ""}>Add task</button>`;
  const bulkFields = hasSelection
    ? `<div class="task-bulk-fields" role="group" aria-label="Edit selected tasks">
        <div class="bulk-group">
          <label class="bulk-field">Status
            <select id="bulk-task-status" ${host.state.busy || nChecked === 0 ? "disabled" : ""}>
              <option value="">—</option>
              <option value="NEEDS-ACTION">To do</option>
              <option value="IN-PROCESS">In progress</option>
              <option value="COMPLETED">Done</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>
          ${bulkApplyBtn("bulk-task-status", "Apply status")}
        </div>
        <div class="bulk-group bulk-group-due">
          ${host.renderPortalDateTimeField({
            field: "bulk-due",
            name: "bulkDue",
            label: "Due",
            value: host.state.bulkDueValue,
            dateOnly: false,
            disabled: host.state.busy || nChecked === 0,
            allowClear: true,
          })}
          ${bulkApplyBtn("bulk-task-due", "Apply due")}
          <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear-due" ${host.state.busy || nChecked === 0 ? "disabled" : ""} title="Clear due date">Clear due</button>
        </div>
        <div class="bulk-group">
          <label class="bulk-field bulk-field-pct">%
            <input type="number" id="bulk-task-percent" min="0" max="100" placeholder="0–100" ${host.state.busy || nChecked === 0 ? "disabled" : ""} />
          </label>
          ${bulkApplyBtn("bulk-task-percent", "Apply %")}
        </div>
      </div>`
    : "";

  const t = host.state.editingTask;
  const calOpts = host.state.taskCalendars
    .map(
      (c) =>
        `<option value="${c.id}" ${t && t.instanceId === c.id ? "selected" : ""}>${esc(c.displayname)}</option>`,
    )
    .join("");
  const form =
    t
      ? `<div class="card">
          ${infoTitle(host.state.creatingTask ? (t.parentUid ? "New subtask" : "New task") : "Edit task", "tasks")}
          <form class="stack" data-form="task" style="margin-top:1rem">
            ${
              host.state.creatingTask
                ? `<label>Calendar
                    <select name="instanceId" required ${host.state.taskCalendars.length === 0 ? "disabled" : ""}>
                      <option value="">${host.state.taskCalendars.length ? "Select calendar…" : "No writable calendars"}</option>
                      ${calOpts}
                    </select>
                  </label>`
                : `<p class="muted small">Calendar: <strong>${esc(t.calendarName)}</strong>${t.readOnly ? " · read-only" : ""}</p>`
            }
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${esc(t.summary)}" ${t.readOnly && !host.state.creatingTask ? "readonly" : ""} />
            </label>
            <label>Description
              <textarea name="description" rows="4" maxlength="20000" ${t.readOnly && !host.state.creatingTask ? "readonly" : ""}>${esc(t.description)}</textarea>
            </label>
            <label>Parent task
              <select name="parentUid" ${t.readOnly && !host.state.creatingTask ? "disabled" : ""}>
                ${parentTaskOptions(host, t, host.state.creatingTask)}
              </select>
              <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
            </label>
            <div class="form-grid form-grid-2">
              <label>Status
                <select name="status" ${t.readOnly && !host.state.creatingTask ? "disabled" : ""}>
                  ${["NEEDS-ACTION", "IN-PROCESS", "COMPLETED", "CANCELLED"]
                    .map(
                      (s) =>
                        `<option value="${s}" ${t.status === s ? "selected" : ""}>${esc(statusLabel(s))}</option>`,
                    )
                    .join("")}
                </select>
              </label>
              ${host.renderPortalDateTimeField({
                field: "due",
                name: "due",
                label: "Due",
                value: toLocalInputValue(t.due),
                dateOnly: false,
                disabled: !!(t.readOnly && !host.state.creatingTask),
                allowClear: true,
              })}
            </div>
            <div class="form-grid form-grid-2">
              <label>Priority (0–9)
                <input type="number" name="priority" min="0" max="9" value="${esc(String(t.priority || 0))}" ${t.readOnly && !host.state.creatingTask ? "readonly" : ""} />
              </label>
              <label>% complete
                <input type="number" name="percent" min="0" max="100" value="${esc(String(t.percent || 0))}" ${t.readOnly && !host.state.creatingTask ? "readonly" : ""} />
              </label>
            </div>
            <div class="form-actions-row">
              ${
                host.state.creatingTask || t.canWrite
                  ? `<button type="submit" class="btn btn-primary" ${host.state.busy ? "disabled" : ""}>${host.state.creatingTask ? "Create task" : "Save task"}</button>`
                  : ""
              }
              ${
                !host.state.creatingTask && t.canWrite
                  ? `<button type="button" class="btn btn-ghost" data-action="new-subtask" ${host.state.busy ? "disabled" : ""}>Add subtask</button>
                     <button type="button" class="btn btn-danger" data-action="delete-task" ${host.state.busy ? "disabled" : ""}>Delete</button>`
                  : host.state.creatingTask
                    ? `<button type="button" class="btn btn-ghost" data-action="cancel-task">Cancel</button>`
                    : ""
              }
            </div>
          </form>
        </div>`
      : `<div class="card"><p class="muted">Select a task or click <strong>Add task</strong>.</p></div>`;

  return `<div class="portal-grid portal-grid-items">
    <section class="card contacts-main-card items-list-card">
      ${infoTitle("Tasks", "tasks")}
      <div class="contact-toolbar" style="margin-top:0.75rem">
        <input type="search" data-action="task-search" placeholder="Search tasks…" value="${esc(host.state.taskSearch)}" aria-label="Search tasks" ${host.state.busy ? "disabled" : ""} />
        ${toolbarActions}
      </div>
      ${bulkFields}
      ${
        host.state.taskCalendars.length === 0
          ? `<p class="muted small" style="margin-top:0.75rem">No writable calendars with tasks (VTODO) enabled. Create a calendar under <strong>Calendar</strong> (system Tasks setting must be on).</p>`
          : ""
      }
      <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
        <table class="contacts-table">
          <thead>
            <tr>
              <th class="col-task-check">
                <input type="checkbox" data-action="task-select-all" aria-label="Select all writable tasks"
                  ${allWritableChecked ? "checked" : ""}
                  ${someChecked ? "data-indeterminate=1" : ""}
                  ${writableKeys.length === 0 || host.state.busy ? "disabled" : ""} />
              </th>
              ${sortHeader("Title", "summary", host.state.taskSort, host.state.taskOrder, "task", "col-task-title")}
              ${sortHeader("Status", "status", host.state.taskSort, host.state.taskOrder, "task", "col-task-status")}
              ${sortHeader("Due", "due", host.state.taskSort, host.state.taskOrder, "task", "col-task-due")}
              ${sortHeader("Calendar", "calendar", host.state.taskSort, host.state.taskOrder, "task", "col-task-cal")}
              ${sortHeader("%", "percent", host.state.taskSort, host.state.taskOrder, "task", "col-task-pct")}
            </tr>
            <tr class="task-filter-row">
              <th class="col-task-check"></th>
              <th class="col-task-title"></th>
              <th class="col-task-status">${taskFilterSelect("status", filters.status, [
                ["open", "Open"],
                ["", "All"],
                ["NEEDS-ACTION", "To do"],
                ["IN-PROCESS", "In progress"],
                ["COMPLETED", "Done"],
                ["CANCELLED", "Cancelled"],
              ], host.state.busy)}</th>
              <th class="col-task-due">${taskFilterSelect("due", filters.due, [
                ["", "All"],
                ["overdue", "Overdue"],
                ["today", "Today"],
                ["upcoming", "Upcoming"],
                ["none", "No date"],
              ], host.state.busy)}</th>
              <th class="col-task-cal">${taskFilterSelect(
                "calendar",
                filters.calendar,
                [
                  ["", "All"],
                  ...[...new Set(host.state.tasks.map((t) => t.calendarName).filter(Boolean))]
                    .sort((a, b) => a.localeCompare(b))
                    .map((name) => [name, name] as [string, string]),
                ],
                host.state.busy,
              )}</th>
              <th class="col-task-pct">${taskFilterSelect("percent", filters.percent, [
                ["", "All"],
                ["0", "0%"],
                ["partial", "1–99%"],
                ["100", "100%"],
              ], host.state.busy)}</th>
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
