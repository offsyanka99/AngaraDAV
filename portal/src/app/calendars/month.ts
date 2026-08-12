/**
 * Month grid rendering (Phase 6).
 */
import type { CalendarEvent } from "../../api";
import { esc } from "../../ui";
import { eventDayKeys, ymd } from "../datetime";
import type { CalendarsHost } from "./host";
import { calendarColor } from "./loaders";

export function monthTitle(_host: CalendarsHost, y: number, m: number): string {
  return new Date(y, m, 1).toLocaleString(undefined, {
    month: "long",
    year: "numeric",
  });
}

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

export function renderMonthGrid(host: CalendarsHost): string {
  const selectedCals = host.state.calendars.filter((c) => host.state.selectedIds.includes(c.id));
  const calName =
    selectedCals.length === 0
      ? "No calendar selected"
      : selectedCals.length === 1
        ? selectedCals[0].displayname
        : `${selectedCals.length} calendars`;

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
  for (const ev of host.state.monthEvents) {
    for (const key of eventDayKeys(ev)) {
      const list = byDay.get(key) ?? [];
      list.push(ev);
      byDay.set(key, list);
    }
  }

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
    cells.push(`<div class="month-cell${inMonth ? "" : " is-outside"}${isToday ? " is-today" : ""}${canCreate ? " is-clickable" : ""}"${
      canCreate
        ? ` data-action="new-event-day" data-day="${esc(key)}" role="button" tabindex="0" title="Add event on ${esc(key)}"`
        : ""
    }>
      <div class="month-daynum${isToday ? " is-today-num" : ""}">${esc(dayLabel)}</div>
      <div class="month-events">${chips}${moreHtml}</div>
    </div>`);
  }

  // "Check one or more calendars…" lives under Owned (sidebar); keep only no-calendars / loading here.
  const emptyHint =
    selectedCals.length === 0
      ? host.state.calendars.length === 0
        ? `<p class="muted small month-empty-hint">No calendars yet — create one on the left, or wait for someone to share with you.</p>`
        : ""
      : host.state.monthEventsLoading
        ? `<p class="muted small month-empty-hint">Loading events…</p>`
        : "";

  const swatches = selectedCals
    .slice(0, 6)
    .map((c) => {
      const col = c.color && c.color.length >= 7 ? c.color.slice(0, 7) : c.color || "#3B82F6";
      return `<span class="cal-swatch" style="background:${esc(col)};margin-top:0" title="${esc(c.displayname)}"></span>`;
    })
    .join("");

  return `<section class="card month-cal-card">
    <div class="month-cal-toolbar">
      <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${host.state.busy ? "disabled" : ""}>Today</button>
      <div class="month-nav">
        <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="Previous month" ${host.state.busy ? "disabled" : ""}>‹</button>
        <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="Next month" ${host.state.busy ? "disabled" : ""}>›</button>
      </div>
      <h2 class="month-cal-title">${esc(monthTitle(host, y, m))}</h2>
      <span class="month-cal-name muted small" title="${esc(calName)}">
        ${swatches}
        ${esc(calName)}
      </span>
    </div>
    ${emptyHint}
    <div class="month-grid-wrap" role="grid" aria-label="Month calendar">
      <div class="month-dow-row" role="row">
        ${dowLabels.map((l) => `<div class="month-dow">${esc(l)}</div>`).join("")}
      </div>
      <div class="month-grid" role="rowgroup">
        ${cells.join("")}
      </div>
    </div>
  </section>`;
}
