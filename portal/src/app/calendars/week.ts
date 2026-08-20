/**
 * Week view for the Calendar tab.
 */
import type { CalendarEvent } from "../../api";
import { esc } from "../../ui";
import { eventDayKeys, weekRange, ymd } from "../datetime";
import { eventTimedStart, focusDate, minutesFromMidnight, visibleCalendarEvents } from "./eventsView";
import type { CalendarsHost } from "./host";
import { calendarColor } from "./loaders";
import { formatEventChipLabel } from "./eventsView";
import { calendarChrome } from "./toolbar";

const HOUR_PX = 40;

function eventBlock(host: CalendarsHost, ev: CalendarEvent & { instanceId: number }, dayKey: string): string {
  const inst = ev.instanceId;
  const label = formatEventChipLabel(host, ev);
  const color = calendarColor(host, inst);
  const calTitle = host.state.calendars.find((c) => c.id === inst)?.displayname || "";
  const tip = calTitle ? `${label} · ${calTitle}` : label;
  let top = 0;
  let height = HOUR_PX;
  if (!ev.allDay && !/^\d{4}-\d{2}-\d{2}$/.test(ev.start)) {
    const start = eventTimedStart(ev);
    if (ymd(start) === dayKey) top = (minutesFromMidnight(start) / 60) * HOUR_PX;
    const end = ev.end && !/^\d{4}-\d{2}-\d{2}$/.test(ev.end) ? new Date(ev.end) : null;
    if (end && !Number.isNaN(end.getTime())) {
      const startMin = ymd(start) === dayKey ? minutesFromMidnight(start) : 0;
      const endMin = ymd(end) === dayKey ? minutesFromMidnight(end) : 24 * 60;
      height = Math.max(18, ((endMin - startMin) / 60) * HOUR_PX);
    }
  }
  const pos = ev.allDay || /^\d{4}-\d{2}-\d{2}$/.test(ev.start)
    ? `--ev-color:${esc(color)}`
    : `--ev-color:${esc(color)};top:${top}px;height:${height}px`;
  return `<button type="button" class="week-event${!ev.allDay ? " is-timed" : ""}" title="${esc(tip)}"
      style="${pos}"
      data-action="open-event" data-instance="${inst}" data-uri="${esc(ev.uri)}" ${host.state.busy ? "disabled" : ""}>${esc(label)}</button>`;
}

export function renderWeekView(host: CalendarsHost): string {
  const chrome = calendarChrome(host);
  const focus = focusDate(host);
  const { days } = weekRange(focus, host.localeWeekStart());
  const todayKey = ymd(new Date());
  const events = visibleCalendarEvents(host);
  const byDay = new Map<string, CalendarEvent[]>();
  for (const ev of events) {
    for (const key of eventDayKeys(ev)) {
      const list = byDay.get(key) ?? [];
      list.push(ev);
      byDay.set(key, list);
    }
  }

  const dayStart = host.state.userSettings.dayStartHour;
  const dayEnd = host.state.userSettings.dayEndHour;
  const hourLabels = Array.from({ length: 24 }, (_, h) => {
    const d = new Date(2024, 0, 1, h);
    const label = d.toLocaleTimeString(undefined, host.timeFormatOpts());
    const work = h >= dayStart && h < dayEnd ? " is-workhour" : "";
    return `<div class="week-hour-label${work}" style="height:${HOUR_PX}px">${esc(label)}</div>`;
  }).join("");

  const canCreate = (() => {
    const primary =
      host.state.selectedId !== null
        ? host.state.calendars.find((c) => c.id === host.state.selectedId) ?? null
        : null;
    return !!(primary && !primary.readOnly && (primary.canShare || primary.access === "readwrite"));
  })();

  const heads: string[] = [];
  const allDays: string[] = [];
  const timedCols: string[] = [];
  for (const day of days) {
    const key = ymd(day);
    const isToday = key === todayKey;
    const list = (byDay.get(key) ?? []) as Array<CalendarEvent & { instanceId: number }>;
    const allDay = list.filter((e) => e.allDay || /^\d{4}-\d{2}-\d{2}$/.test(e.start));
    const timed = list.filter((e) => !e.allDay && !/^\d{4}-\d{2}-\d{2}$/.test(e.start));
    const allDayHtml = allDay.map((ev) => eventBlock(host, ev, key)).join("");
    const timedHtml = timed.map((ev) => eventBlock(host, ev, key)).join("");
    const head = day.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric" });
    heads.push(`<div class="week-day-head${isToday ? " is-today" : ""}"${
      canCreate
        ? ` data-action="new-event-day" data-day="${esc(key)}" role="button" tabindex="0" title="Add event on ${esc(key)}"`
        : ""
    }>${esc(head)}</div>`);
    allDays.push(
      `<div class="week-allday${isToday ? " is-today" : ""}">${allDayHtml || `<span class="week-allday-empty"></span>`}</div>`,
    );
    const slots = canCreate
      ? `<div class="week-slots">${Array.from({ length: 24 }, (_, h) => {
          const hh = String(h).padStart(2, "0");
          return `<button type="button" class="week-slot" data-action="new-event-slot" data-day="${esc(key)}" data-hour="${h}" title="Add event at ${esc(key)} ${hh}:00" ${host.state.busy ? "disabled" : ""}></button>`;
        }).join("")}</div>`
      : "";
    const workBand =
      dayEnd > dayStart
        ? `<div class="week-workday" aria-hidden="true"></div>`
        : "";
    timedCols.push(
      `<div class="week-timed${isToday ? " is-today" : ""}${canCreate ? " is-clickable" : ""}" style="height:${24 * HOUR_PX}px">${workBand}${slots}${timedHtml}</div>`,
    );
  }

  return `<section class="card month-cal-card week-cal-card">
    ${chrome.toolbar}
    ${chrome.emptyHint}
    <div class="week-wrap" style="--week-hour:${HOUR_PX}px;--day-start-h:${dayStart};--day-end-h:${dayEnd}">
      <div class="week-frozen">
        <div class="week-grid-row week-head-row">
          <div class="week-gutter-head"></div>
          ${heads.join("")}
        </div>
        <div class="week-grid-row week-allday-row">
          <div class="week-gutter-allday muted small">All day</div>
          ${allDays.join("")}
        </div>
      </div>
      <div class="week-grid-row week-timed-row">
        <div class="week-hours">${hourLabels}</div>
        ${timedCols.join("")}
      </div>
    </div>
  </section>`;
}
