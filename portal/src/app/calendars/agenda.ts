/**
 * Agenda (upcoming list) view for the Calendar tab.
 */
import type { CalendarEvent } from "../../api";
import { esc } from "../../ui";
import { addDays, eventDayKeys, ymd } from "../datetime";
import { focusDate, visibleCalendarEvents } from "./eventsView";
import type { CalendarsHost } from "./host";
import { calendarColor } from "./loaders";
import { formatEventChipLabel } from "./eventsView";
import { calendarChrome } from "./toolbar";

export function renderAgendaView(host: CalendarsHost): string {
  const chrome = calendarChrome(host);
  const focus = focusDate(host);
  const events = visibleCalendarEvents(host);
  const byDay = new Map<string, Array<CalendarEvent & { instanceId: number }>>();
  for (const ev of events) {
    for (const key of eventDayKeys(ev)) {
      const list = byDay.get(key) ?? [];
      list.push(ev);
      byDay.set(key, list);
    }
  }
  const todayKey = ymd(new Date());
  const sections: string[] = [];
  for (let i = 0; i < 35; i++) {
    const day = addDays(focus, i);
    const key = ymd(day);
    const list = byDay.get(key) ?? [];
    if (list.length === 0) continue;
    const heading = day.toLocaleString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const items = list
      .map((ev) => {
        const inst = ev.instanceId;
        const label = formatEventChipLabel(host, ev);
        const color = calendarColor(host, inst);
        const calTitle = host.state.calendars.find((c) => c.id === inst)?.displayname || "";
        const tip = calTitle ? `${label} · ${calTitle}` : label;
        return `<button type="button" class="agenda-event" title="${esc(tip)}" style="--ev-color:${esc(color)}"
            data-action="open-event" data-instance="${inst}" data-uri="${esc(ev.uri)}" ${host.state.busy ? "disabled" : ""}>${esc(label)}</button>`;
      })
      .join("");
    sections.push(`<section class="agenda-day${key === todayKey ? " is-today" : ""}">
      <h3 class="agenda-day-title">${esc(heading)}</h3>
      <div class="agenda-list">${items}</div>
    </section>`);
  }
  const body =
    sections.length > 0
      ? sections.join("")
      : `<p class="muted" style="margin:0.5rem 0 0">${
          host.state.eventSearch.trim()
            ? "No events match this search in the current range."
            : "No events in this period."
        }</p>`;

  return `<section class="card month-cal-card agenda-cal-card">
    ${chrome.toolbar}
    ${chrome.emptyHint}
    <div class="agenda-wrap">${body}</div>
  </section>`;
}
