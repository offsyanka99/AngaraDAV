/**
 * Shared calendar view helpers (month / week / agenda).
 */
import type { CalendarEvent } from "../../api";
import { addDays, parseYmd, weekRange, ymd } from "../datetime";
import type { CalendarsHost } from "./host";

export function formatEventChipLabel(host: CalendarsHost, ev: CalendarEvent): string {
  const title = ev.summary || "(No title)";
  if (ev.allDay || /^\d{4}-\d{2}-\d{2}$/.test(ev.start)) {
    return title;
  }
  const d = new Date(ev.start);
  if (Number.isNaN(d.getTime())) return title;
  const time = d.toLocaleTimeString(undefined, host.timeFormatOpts());
  return `${time} ${title}`;
}

export function monthTitle(_host: CalendarsHost, y: number, m: number): string {
  return new Date(y, m, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function focusDate(host: CalendarsHost): Date {
  return parseYmd(host.state.calFocusDay) ?? new Date();
}

export function visibleCalendarEvents(host: CalendarsHost): Array<CalendarEvent & { instanceId: number }> {
  const q = host.state.eventSearch.trim().toLowerCase();
  if (!q) return host.state.monthEvents;
  return host.state.monthEvents.filter((ev) => (ev.summary || "").toLowerCase().includes(q));
}

export function eventsRangeForView(
  host: CalendarsHost,
): { from: string; to: string } {
  const weekStart = host.localeWeekStart();
  const focus = focusDate(host);
  if (host.state.calView === "week") {
    const w = weekRange(focus, weekStart);
    return { from: w.from, to: w.to };
  }
  if (host.state.calView === "agenda") {
    const to = addDays(focus, 34);
    return { from: ymd(focus), to: ymd(to) };
  }
  const y = host.state.monthCursor.y;
  const m = host.state.monthCursor.m;
  const from = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  return { from: ymd(from), to: ymd(end) };
}

export function syncCursorFromFocus(host: CalendarsHost): void {
  const d = focusDate(host);
  host.state.calFocusDay = ymd(d);
  host.state.monthCursor = { y: d.getFullYear(), m: d.getMonth() };
}

export function eventTimedStart(ev: CalendarEvent): Date {
  if (ev.allDay || /^\d{4}-\d{2}-\d{2}$/.test(ev.start)) {
    return parseYmd(ev.start.slice(0, 10)) ?? new Date(NaN);
  }
  return new Date(ev.start);
}

export function minutesFromMidnight(d: Date): number {
  return d.getHours() * 60 + d.getMinutes();
}
