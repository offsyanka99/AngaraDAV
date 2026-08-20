/**
 * Month grid rendering (Phase 6).
 */
import type { CalendarEvent } from "../../api";
import { esc } from "../../ui";
import { eventDayKeys, isoWeekNumberForRow, ymd } from "../datetime";
import { renderAgendaView } from "./agenda";
import { formatEventChipLabel, visibleCalendarEvents } from "./eventsView";
import type { CalendarsHost } from "./host";
import { calendarColor } from "./loaders";
import { calendarChrome } from "./toolbar";
import { renderWeekView } from "./week";

export { formatEventChipLabel, monthTitle } from "./eventsView";

export function renderCalendarView(host: CalendarsHost): string {
  if (host.state.calView === "week") return renderWeekView(host);
  if (host.state.calView === "agenda") return renderAgendaView(host);
  return renderMonthGridInner(host);
}

export function renderMonthGrid(host: CalendarsHost): string {
  return renderCalendarView(host);
}

function renderMonthGridInner(host: CalendarsHost): string {
  const y = host.state.monthCursor.y;
  const m = host.state.monthCursor.m;
  const first = new Date(y, m, 1);
  const weekStart = host.localeWeekStart();
  const startPad = (first.getDay() - weekStart + 7) % 7;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const prevDays = new Date(y, m, 0).getDate();
  const today = new Date();
  const todayKey = ymd(today);
  const dowLabels = host.localeDowLabels();

  const byDay = new Map<string, CalendarEvent[]>();
  for (const ev of visibleCalendarEvents(host)) {
    for (const key of eventDayKeys(ev)) {
      const list = byDay.get(key) ?? [];
      list.push(ev);
      byDay.set(key, list);
    }
  }

  const showWeekNumbers = host.state.userSettings.showWeekNumbers;
  const cells: string[] = [];
  const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;
  for (let i = 0; i < totalCells; i++) {
    let dayNum: number;
    let inMonth = true;
    let cellDate: Date;
    if (i < startPad) {
      dayNum = prevDays - startPad + i + 1;
      inMonth = false;
      cellDate = new Date(y, m - 1, dayNum);
    } else if (i >= startPad + daysInMonth) {
      dayNum = i - (startPad + daysInMonth) + 1;
      inMonth = false;
      cellDate = new Date(y, m + 1, dayNum);
    } else {
      dayNum = i - startPad + 1;
      cellDate = new Date(y, m, dayNum);
    }
    const key = ymd(cellDate);
    const isToday = key === todayKey;
    const dayEvents = inMonth ? byDay.get(key) ?? [] : [];
    const maxShow = host.state.monthExpandDay === key ? 50 : 3;
    const shown = dayEvents.slice(0, maxShow);
    const more = dayEvents.length - shown.length;
    const chips = shown
      .map((ev) => {
        const inst = (ev as CalendarEvent & { instanceId: number }).instanceId;
        const label = formatEventChipLabel(host, ev);
        const color = calendarColor(host, inst);
        const calTitle = host.state.calendars.find((c) => c.id === inst)?.displayname || "";
        const tip = calTitle ? `${label} · ${calTitle}` : label;
        return `<button type="button" class="month-event${!ev.allDay ? " is-timed" : ""}" title="${esc(tip)}" style="--ev-color:${esc(color)}"
          data-action="open-event" data-instance="${inst}" data-uri="${esc(ev.uri)}" ${host.state.busy ? "disabled" : ""}>${esc(label)}</button>`;
      })
      .join("");
    const moreHtml =
      more > 0
        ? `<button type="button" class="month-event-more" data-action="open-event-day" data-day="${esc(key)}" title="Show all events this day" ${host.state.busy ? "disabled" : ""}>+${more} more</button>`
        : "";
    const dayLabel =
      !inMonth && (dayNum === 1 || i === startPad + daysInMonth)
        ? cellDate.toLocaleString(undefined, { month: "short", day: "numeric" })
        : String(dayNum);
    const primary =
      host.state.selectedId !== null ? host.state.calendars.find((c) => c.id === host.state.selectedId) ?? null : null;
    const canCreate = !!(
      primary &&
      !primary.readOnly &&
      (primary.canShare || primary.access === "readwrite")
    );
    if (showWeekNumbers && i % 7 === 0) {
      const wn = isoWeekNumberForRow(cellDate, weekStart);
      cells.push(
        `<div class="month-weeknum" title="ISO week ${wn}"><span>${wn}</span></div>`,
      );
    }
    cells.push(`<div class="month-cell${inMonth ? "" : " is-outside"}${isToday ? " is-today" : ""}${canCreate ? " is-clickable" : ""}"${
      canCreate
        ? ` data-action="new-event-day" data-day="${esc(key)}" role="button" tabindex="0" title="Add event on ${esc(key)}"`
        : ""
    }>
      <div class="month-daynum${isToday ? " is-today-num" : ""}">${esc(dayLabel)}</div>
      <div class="month-events">${chips}${moreHtml}</div>
    </div>`);
  }

  const chrome = calendarChrome(host);

  return `<section class="card month-cal-card">
    ${chrome.toolbar}
    ${chrome.emptyHint}
    <div class="month-grid-wrap${showWeekNumbers ? " has-weeknums" : ""}" role="grid" aria-label="Month calendar">
      <div class="month-dow-row${showWeekNumbers ? " has-weeknums" : ""}" role="row">
        ${showWeekNumbers ? `<div class="month-weeknum-hd" title="ISO week">Wk</div>` : ""}
        ${dowLabels.map((l) => `<div class="month-dow">${esc(l)}</div>`).join("")}
      </div>
      <div class="month-grid${showWeekNumbers ? " has-weeknums" : ""}" role="rowgroup">
        ${cells.join("")}
      </div>
    </div>
  </section>`;
}
