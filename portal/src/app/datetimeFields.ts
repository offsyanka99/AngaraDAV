/** Portal date/time field helpers on AppOrchestrator (Phase 8). */
import { esc } from "../ui";
import {
  formatDtDisplay as formatDtDisplayFor,
  localeDowLabels as localeDowLabelsFor,
  localeWeekStart as localeWeekStartFor,
  parseDtParts,
  positionDtPopovers as positionDtPopoversIn,
  renderPortalDateTimePopoverHtml,
  timeFormatOpts as timeFormatOptsFor,
  toDateInputValue,
  toLocalInputValue,
  ymd,
} from "./datetime";
import type { AppOrchestrator } from "./orchestrator";

export function timeFormatOpts(o: AppOrchestrator) {
  const { state } = o;
  return timeFormatOptsFor(state.portalUi.timeFormat);
}

export function localeWeekStart(o: AppOrchestrator) {
  const { state } = o;
  return localeWeekStartFor(state.portalUi.weekStart);
}

export function localeDowLabels(o: AppOrchestrator) {
  const { state } = o;
  return localeDowLabelsFor(state.portalUi.weekStart);
}

export function formatDtDisplay(o: AppOrchestrator, value: string, allDay: boolean): string {
  const { state } = o;
  return formatDtDisplayFor(value, allDay, state.portalUi.timeFormat);
}

export function renderPortalDateTimePopover(
  o: AppOrchestrator,
  field: string,
  value: string,
  dateOnly: boolean,
  allowClear: boolean,
): string {
  const { state } = o;
  const parts = parseDtParts(value);
  const viewY = state.eventDtPicker?.viewY ?? Number(parts.date.slice(0, 4));
  const viewM = state.eventDtPicker?.viewM ?? Number(parts.date.slice(5, 7)) - 1;
  return renderPortalDateTimePopoverHtml({
    field,
    value,
    dateOnly,
    allowClear,
    viewY,
    viewM,
    weekStart: state.portalUi.weekStart,
    timeFormat: state.portalUi.timeFormat,
  });
}

export function positionDtPopovers(o: AppOrchestrator): void {
  positionDtPopoversIn(o.root);
}

export function renderPortalDateTimeField(
  o: AppOrchestrator,
  opts: {
    field: string;
    name: string;
    label: string;
    value: string;
    dateOnly?: boolean;
    required?: boolean;
    disabled?: boolean;
    allowClear?: boolean;
  },
): string {
  const { state } = o;
  const {
    field,
    name,
    label,
    value,
    dateOnly = false,
    required,
    disabled,
    allowClear = true,
  } = opts;
  const open = state.eventDtPicker?.field === field;
  const display = formatDtDisplay(o, value, dateOnly);
  return `<div class="dt-field${open ? " is-open" : ""}" data-dt-id="${esc(field)}">
    <span class="dt-field-label">${esc(label)}</span>
    <input type="hidden" name="${esc(name)}" value="${esc(value)}" ${required ? "required" : ""} />
    <button type="button" class="dt-trigger" data-action="dt-open" data-dt-field="${esc(field)}"
      data-dt-name="${esc(name)}" data-dt-date-only="${dateOnly ? "1" : "0"}" data-dt-clear="${allowClear ? "1" : "0"}"
      ${disabled ? "disabled" : ""} aria-expanded="${open}">
      <span class="dt-trigger-text">${esc(display)}</span>
      <span class="dt-trigger-icon" aria-hidden="true">▾</span>
    </button>
    ${
      open && !disabled
        ? renderPortalDateTimePopover(o, field, value, dateOnly, allowClear)
        : ""
    }
  </div>`;
}

export function getDtFieldCurrentValue(o: AppOrchestrator, field: string): string {
  const { state } = o;
  if (field === "start") return String(state.editingEvent?.start || "");
  if (field === "end") return String(state.editingEvent?.end || "");
  if (field === "until") {
    return (
      state.editingEvent?.repeat?.until ||
      toDateInputValue(state.editingEvent?.start) ||
      ymd(new Date())
    );
  }
  if (field === "due") return toLocalInputValue(state.editingTask?.due);
  if (field === "dtstart") return toLocalInputValue(state.editingNote?.dtstart);
  if (field === "bulk-due") return state.bulkDueValue;
  if (field === "birthday") return String(state.editingContact?.birthday || "");
  return "";
}

export function setDtFieldValue(o: AppOrchestrator, field: string, value: string | null): void {
  const { state } = o;
  if (field === "start" && state.editingEvent) {
    state.editingEvent = { ...state.editingEvent, start: value || "" };
    return;
  }
  if (field === "end" && state.editingEvent) {
    state.editingEvent = { ...state.editingEvent, end: value };
    return;
  }
  if (field === "until" && state.editingEvent) {
    state.editingEvent = {
      ...state.editingEvent,
      repeat: {
        ...(state.editingEvent.repeat ?? o.defaultRepeat()),
        until: value,
        endMode: "until",
      },
    };
    return;
  }
  if (field === "due" && state.editingTask) {
    // Store ISO when timed local value set; null clears
    if (value === null || value === "") {
      state.editingTask = { ...state.editingTask, due: null };
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      state.editingTask = { ...state.editingTask, due: new Date(value + "T00:00:00").toISOString() };
    } else {
      const d = new Date(value.length === 16 ? value : value);
      state.editingTask = {
        ...state.editingTask,
        due: Number.isNaN(d.getTime()) ? value : d.toISOString(),
      };
    }
    return;
  }
  if (field === "dtstart" && state.editingNote) {
    if (value === null || value === "") {
      state.editingNote = { ...state.editingNote, dtstart: null };
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      state.editingNote = { ...state.editingNote, dtstart: new Date(value + "T00:00:00").toISOString() };
    } else {
      const d = new Date(value.length === 16 ? value : value);
      state.editingNote = {
        ...state.editingNote,
        dtstart: Number.isNaN(d.getTime()) ? value : d.toISOString(),
      };
    }
    return;
  }
  if (field === "birthday" && state.editingContact) {
    state.editingContact = {
      ...state.editingContact,
      birthday: value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null,
    };
    return;
  }
  if (field === "bulk-due") {
    state.bulkDueValue = value || "";
  }
}
