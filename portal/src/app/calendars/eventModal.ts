/**
 * Event create/edit modal + RRULE helpers (Phase 6).
 */
import type { CalendarEventDetail } from "../../api";
import { esc } from "../../ui";
import {
  convertAllDaySpanToTimed,
  formatLocalDtValue,
  toDateInputValue,
  toLocalInputValue,
  ymd,
} from "../datetime";
import { defaultRepeat, readRepeatFromForm, renderRepeatFieldset, repeatEndMode } from "../repeatControl";
import type { CalendarsHost } from "./host";
import { REMINDER_PRESETS, reminderFromForm } from "./reminder";

export { defaultRepeat, readRepeatFromForm, repeatEndMode } from "../repeatControl";
export { reminderFromForm, reminderPayload } from "./reminder";

export function renderEventModal(host: CalendarsHost): string {
  if (!host.state.eventModalOpen || !host.state.editingEvent) return "";
  const e = host.state.editingEvent;
  const rep = e.repeat ?? defaultRepeat();
  const freq = (rep.freq || "").toUpperCase();
  const writableCals = host.state.calendars.filter((c) => c.canShare || c.access === "readwrite");
  const calOpts = host.state.calendars
    .filter((c) => {
      if (c.id === e.instanceId) return true;
      if (c.readOnly) return false;
      return c.canShare || c.access === "readwrite";
    })
    .map(
      (c) =>
        `<option value="${c.id}" ${c.id === e.instanceId ? "selected" : ""}>${esc(c.displayname)}</option>`,
    )
    .join("");
  const ro = e.readOnly || !e.canWrite;
  // Timed values must be datetime-local; if still date-only after toggle, use span conversion
  let startVal: string;
  let endVal: string;
  if (e.allDay) {
    startVal = toDateInputValue(e.start);
    endVal = toDateInputValue(e.end);
  } else {
    const s = e.start || "";
    const en = e.end || "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
      const conv = convertAllDaySpanToTimed(s, en || null);
      startVal = conv.start;
      endVal = conv.end || "";
    } else {
      startVal = toLocalInputValue(e.start);
      endVal = toLocalInputValue(e.end);
    }
  }
  const endMode = repeatEndMode(rep);
  // Series end date (Until) replaces the event End control; Start stays editable
  const endDisabledByRepeat = !!freq && endMode === "until";
  return `<div class="cal-modal" id="event-edit-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
    <div class="cal-modal-backdrop" data-action="close-event-modal"></div>
    <div class="cal-modal-card">
      <header class="cal-modal-header">
        <h3 id="event-modal-title">${host.state.creatingEvent ? "New event" : "Edit event"}</h3>
        <button type="button" class="info-modal-close" data-action="close-event-modal" aria-label="Close">×</button>
      </header>
      <div class="cal-modal-body">
        ${
          !host.state.creatingEvent && (e.hasRrule || freq)
            ? `<p class="muted small" style="margin:0 0 0.75rem">Repeat rules apply to the whole series (CalDAV RRULE).</p>`
            : ""
        }
        ${ro ? `<p class="muted small" style="margin:0 0 0.75rem"><strong>Read-only:</strong> you cannot edit or delete this event.</p>` : ""}
        <form class="stack" data-form="edit-event">
          <label>Calendar
            <select name="instanceId" ${ro || writableCals.length === 0 ? "disabled" : ""}>
              ${calOpts || `<option value="${e.instanceId}">${esc(e.calendarName)}</option>`}
            </select>
          </label>
          <label>Title
            <input type="text" name="summary" required maxlength="500" value="${esc(e.summary)}" ${ro ? "readonly" : ""} />
          </label>
          <label>Location
            <input type="text" name="location" maxlength="500" value="${esc(e.location)}" ${ro ? "readonly" : ""} />
          </label>
          <label>Description
            <textarea name="description" rows="4" maxlength="20000" ${ro ? "readonly" : ""}>${esc(e.description)}</textarea>
          </label>
          <label class="checkbox">
            <input type="checkbox" name="allDay" data-action="event-allday-toggle" ${e.allDay ? "checked" : ""} ${ro ? "disabled" : ""} />
            All-day event
          </label>
          <div class="form-grid form-grid-2 dt-fields-row">
            ${host.renderPortalDateTimeField({
              field: "start",
              name: "start",
              label: "Start",
              value: startVal,
              dateOnly: e.allDay,
              required: true,
              disabled: ro,
              allowClear: false,
            })}
            ${host.renderPortalDateTimeField({
              field: "end",
              name: "end",
              label: "End",
              value: endVal,
              dateOnly: e.allDay,
              disabled: ro || endDisabledByRepeat,
              allowClear: !endDisabledByRepeat,
            })}
          </div>
          <label>Reminder
            <select name="reminder" ${ro ? "disabled" : ""}>
              <option value="" ${!e.reminderCustom && (e.reminderMinutes === null || e.reminderMinutes === undefined) ? "selected" : ""}>None</option>
              ${
                e.reminderCustom
                  ? `<option value="keep" selected>Custom (kept)</option>`
                  : ""
              }
              ${REMINDER_PRESETS.map(
                (p) =>
                  `<option value="${p.minutes}" ${!e.reminderCustom && e.reminderMinutes === p.minutes ? "selected" : ""}>${esc(p.label)}</option>`,
              ).join("")}
            </select>
            <span class="muted small">Display reminder relative to the start. If this calendar is checked, the portal notifies you when it is due. Other reminders already on the event stay.</span>
          </label>
          ${renderRepeatFieldset({
            repeat: rep,
            readOnly: ro,
            untilFallback: toDateInputValue(e.start) || ymd(new Date()),
            renderUntil: (value, disabled) =>
              host.renderPortalDateTimeField({
                field: "until",
                name: "repeatUntil",
                label: "Until",
                value,
                dateOnly: true,
                disabled,
                allowClear: true,
              }),
          })}
          <div class="form-actions-row" style="margin-top:0.5rem">
            ${
              !ro
                ? `<button type="submit" class="btn btn-primary" ${host.state.busy ? "disabled" : ""}>${host.state.creatingEvent ? "Create event" : "Save event"}</button>
                   ${
                     !host.state.creatingEvent
                       ? `<button type="button" class="btn btn-danger" data-action="delete-event" ${host.state.busy ? "disabled" : ""}>Delete</button>`
                       : ""
                   }`
                : ""
            }
            <button type="button" class="btn btn-ghost" data-action="close-event-modal">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>`;
}

function blankEventBase(
  host: CalendarsHost,
  instanceId: number,
): Omit<CalendarEventDetail, "start" | "end" | "allDay"> {
  const cal = host.state.calendars.find((c) => c.id === instanceId);
  return {
    uri: "",
    instanceId,
    calendarId: cal?.calendarId ?? 0,
    calendarName: cal?.displayname ?? "Calendar",
    calendarUri: cal?.uri ?? "",
    uid: "",
    summary: "",
    description: "",
    location: "",
    hasRrule: false,
    repeat: defaultRepeat(),
    reminderMinutes: null,
    reminderCustom: false,
    readOnly: false,
    canWrite: true,
  };
}

export function blankEventForDay(host: CalendarsHost, day: string, instanceId: number): CalendarEventDetail {
  return {
    ...blankEventBase(host, instanceId),
    start: day,
    end: day,
    allDay: true,
  };
}

/** Timed event starting at `hour`:00 on `day` (local), ending one hour later. */
export function blankEventForSlot(
  host: CalendarsHost,
  day: string,
  hour: number,
  instanceId: number,
): CalendarEventDetail {
  const [ys, ms, ds] = day.split("-").map(Number);
  const h = Math.max(0, Math.min(23, Math.floor(hour)));
  const start = new Date(ys, ms - 1, ds, h, 0, 0, 0);
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  return {
    ...blankEventBase(host, instanceId),
    start: formatLocalDtValue(start),
    end: formatLocalDtValue(end),
    allDay: false,
  };
}

export function syncEditingEventFromForm(host: CalendarsHost, form: HTMLFormElement): void {
  if (!host.state.editingEvent) return;
  const fd = new FormData(form);
  const allDayEl = form.querySelector<HTMLInputElement>('input[name="allDay"]');
  host.state.editingEvent = {
    ...host.state.editingEvent,
    summary: String(fd.get("summary") ?? host.state.editingEvent.summary),
    description: String(fd.get("description") ?? host.state.editingEvent.description),
    location: String(fd.get("location") ?? host.state.editingEvent.location),
    instanceId: Number(fd.get("instanceId")) || host.state.editingEvent.instanceId,
    allDay: allDayEl?.checked ?? host.state.editingEvent.allDay,
    start: String(fd.get("start") ?? host.state.editingEvent.start ?? ""),
    end: String(fd.get("end") ?? host.state.editingEvent.end ?? "") || null,
    repeat: readRepeatFromForm(fd),
    hasRrule: !!String(fd.get("repeatFreq") ?? "").trim(),
    ...reminderFromForm(fd),
  };
}

