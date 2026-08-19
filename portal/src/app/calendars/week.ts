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
  return `<button type="button" class="week-event${!ev.allDay ? " is-timed" : ""}" title="${esc(tip)}"
      style="--ev-color:${esc(color)};top:${top}px;height:${height}px"
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

  const hourLabels = Array.from({ length: 24 }, (_, h) => {
    const d = new Date(2024, 0, 1, h);
    const label = d.toLocaleTimeString(undefined, host.timeFormatOpts());
    return `<div class="week-hour-label" style="height:${HOUR_PX}px">${esc(label)}</div>`;
  }).join("");

  const dayCols = days
    .map((day) => {
      const key = ymd(day);
      const isToday = key === todayKey;
      const list = (byDay.get(key) ?? []) as Array<CalendarEvent & { instanceId: number }>;
      const allDay = list.filter((e) => e.allDay || /^\d{4}-\d{2}-\d{2}$/.test(e.start));
      const timed = list.filter((e) => !e.allDay && !/^\d{4}-\d{2}-\d{2}$/.test(e.start));
      const allDayHtml = allDay.map((ev) => eventBlock(host, ev, key)).join("");
      const timedHtml = timed.map((ev) => eventBlock(host, ev, key)).join("");
      const head = day.toLocaleString(undefined, { weekday: "short", month: "short", day: "numeric" });
      const canCreate = (() => {
        const primary =
          host.state.selectedId !== null
            ? host.state.calendars.find((c) => c.id === host.state.selectedId) ?? null
            : null;
        return !!(primary && !primary.readOnly && (primary.canShare || primary.access === "readwrite"));
      })();
      return `<div class="week-day${isToday ? " is-today" : ""}">
        <div class="week-day-head${isToday ? " is-today" : ""}"${
          canCreate
            ? ` data-action="new-event-day" data-day="${esc(key)}" role="button" tabindex="0" title="Add event on ${esc(key)}"`
            : ""
        }>${esc(head)}</div>
        <div class="week-allday">${allDayHtml || `<span class="week-allday-empty"></span>`}</div>
        <div class="week-timed" style="height:${24 * HOUR_PX}px">${timedHtml}</div>
      </div>`;
    })
    .join("");

  return `<section class="card month-cal-card week-cal-card">
    ${chrome.toolbar}
    ${chrome.emptyHint}
    <div class="week-wrap">
      <div class="week-gutter">
        <div class="week-gutter-head"></div>
        <div class="week-gutter-allday muted small">All day</div>
        <div class="week-hours">${hourLabels}</div>
      </div>
      <div class="week-days">${dayCols}</div>
    </div>
  </section>`;
}
