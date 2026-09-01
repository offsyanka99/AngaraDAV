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
import type { CalendarsHost } from "./host";

export function defaultRepeat(): {
  freq: string;
  interval: number;
  until: string | null;
  count: number | null;
  byDay: string[];
  endMode: "never" | "until" | "count";
} {
  return { freq: "", interval: 1, until: null, count: null, byDay: [], endMode: "never" };
}

export function repeatEndMode(rep: {
  until?: string | null;
  count?: number | null;
  endMode?: "never" | "until" | "count";
}): "never" | "until" | "count" {
  if (rep.endMode === "until" || rep.endMode === "count" || rep.endMode === "never") {
    return rep.endMode;
  }
  if (rep.until) return "until";
  if (rep.count) return "count";
  return "never";
}

export function readRepeatFromForm(fd: FormData): {
  freq: string;
  interval: number;
  until: string | null;
  count: number | null;
  byDay: string[];
  endMode: "never" | "until" | "count";
} {
  const freq = String(fd.get("repeatFreq") ?? "").trim().toUpperCase();
  if (!freq) {
    return { freq: "", interval: 1, until: null, count: null, byDay: [], endMode: "never" };
  }
  const interval = Math.max(1, Math.min(99, Number(fd.get("repeatInterval") ?? 1) || 1));
  const rawEnd = String(fd.get("repeatEndMode") ?? "never");
  const endMode: "never" | "until" | "count" =
    rawEnd === "until" || rawEnd === "count" ? rawEnd : "never";
  let until: string | null = null;
  let count: number | null = null;
  if (endMode === "until") {
    const u = String(fd.get("repeatUntil") ?? "").trim();
    until = u ? u.slice(0, 10) : null;
  } else if (endMode === "count") {
    const c = Number(fd.get("repeatCount") ?? 0);
    count = Number.isFinite(c) && c > 0 ? Math.min(999, Math.round(c)) : 10;
  }
  const byDay = fd
    .getAll("repeatByDay")
    .map((v) => String(v).toUpperCase())
    .filter(Boolean);
  return { freq, interval, until, count, byDay, endMode };
}

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
  const weekDays: { code: string; label: string }[] = [
    { code: "MO", label: "Mon" },
    { code: "TU", label: "Tue" },
    { code: "WE", label: "Wed" },
    { code: "TH", label: "Thu" },
    { code: "FR", label: "Fri" },
    { code: "SA", label: "Sat" },
    { code: "SU", label: "Sun" },
  ];
  const byDay = new Set((rep.byDay || []).map((d) => d.toUpperCase()));
  const endMode = repeatEndMode(rep);
  // Series end date (Until) replaces the event End control; Start stays editable
  const endDisabledByRepeat = !!freq && endMode === "until";
  const untilVal = rep.until || (endMode === "until" ? toDateInputValue(e.start) || ymd(new Date()) : "");
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
          <fieldset class="event-repeat" ${ro ? "disabled" : ""}>
            <legend class="event-repeat-legend">Repeat</legend>
            <div class="form-grid form-grid-2">
              <label>Frequency
                <select name="repeatFreq" data-action="event-repeat-freq">
                  <option value="" ${!freq ? "selected" : ""}>Does not repeat</option>
                  <option value="DAILY" ${freq === "DAILY" ? "selected" : ""}>Daily</option>
                  <option value="WEEKLY" ${freq === "WEEKLY" ? "selected" : ""}>Weekly</option>
                  <option value="MONTHLY" ${freq === "MONTHLY" ? "selected" : ""}>Monthly</option>
                  <option value="YEARLY" ${freq === "YEARLY" ? "selected" : ""}>Yearly</option>
                </select>
              </label>
              <label>Every
                <input type="number" name="repeatInterval" min="1" max="99" value="${esc(String(rep.interval || 1))}" ${!freq ? "disabled" : ""} />
              </label>
            </div>
            ${
              freq === "WEEKLY"
                ? `<div class="event-byday" role="group" aria-label="Days of week">
                    ${weekDays
                      .map(
                        (d) =>
                          `<label class="checkbox event-byday-item">
                            <input type="checkbox" name="repeatByDay" value="${d.code}" ${byDay.has(d.code) ? "checked" : ""} />
                            ${d.label}
                          </label>`,
                      )
                      .join("")}
                  </div>`
                : ""
            }
            ${
              freq
                ? `<div class="form-grid form-grid-2" style="margin-top:0.5rem">
                    <label>Ends
                      <select name="repeatEndMode" data-action="event-repeat-end">
                        <option value="never" ${endMode === "never" ? "selected" : ""}>Never</option>
                        <option value="until" ${endMode === "until" ? "selected" : ""}>On date</option>
                        <option value="count" ${endMode === "count" ? "selected" : ""}>After count</option>
                      </select>
                    </label>
                    ${
                      endMode === "until"
                        ? host.renderPortalDateTimeField({
                            field: "until",
                            name: "repeatUntil",
                            label: "Until",
                            value: untilVal,
                            dateOnly: true,
                            disabled: ro,
                            allowClear: true,
                          })
                        : endMode === "count"
                          ? `<label>Occurrences
                              <input type="number" name="repeatCount" min="1" max="999" value="${esc(String(rep.count || 10))}" />
                            </label>`
                          : `<span></span>`
                    }
                  </div>`
                : ""
            }
          </fieldset>
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
  };
}

