/**
 * Shared Calendar toolbar: nav, view switch, event search.
 */
import { esc } from "../../ui";
import { formatDayRange, weekRange } from "../datetime";
import type { CalendarsHost } from "./host";
import { focusDate, monthTitle } from "./eventsView";

export function calendarChrome(host: CalendarsHost): {
  calName: string;
  swatches: string;
  emptyHint: string;
  toolbar: string;
} {
  const selectedCals = host.state.calendars.filter((c) => host.state.selectedIds.includes(c.id));
  const calName =
    selectedCals.length === 0
      ? "No calendar selected"
      : selectedCals.length === 1
        ? selectedCals[0].displayname
        : `${selectedCals.length} calendars`;
  const swatches = selectedCals
    .slice(0, 6)
    .map((c) => {
      const col = c.color && c.color.length >= 7 ? c.color.slice(0, 7) : c.color || "#3B82F6";
      return `<span class="cal-swatch" style="background:${esc(col)};margin-top:0" title="${esc(c.displayname)}"></span>`;
    })
    .join("");
  const emptyHint =
    selectedCals.length === 0
      ? host.state.calendars.length === 0
        ? `<p class="muted small month-empty-hint">No calendars yet — create one on the left, or wait for someone to share with you.</p>`
        : ""
      : host.state.monthEventsLoading
        ? `<p class="muted small month-empty-hint">Loading events…</p>`
        : "";

  const view = host.state.calView;
  const focus = focusDate(host);
  let title: string;
  let prevLabel: string;
  let nextLabel: string;
  if (view === "week") {
    const w = weekRange(focus, host.localeWeekStart());
    title = formatDayRange(w.days[0], w.days[6]);
    prevLabel = "Previous week";
    nextLabel = "Next week";
  } else if (view === "agenda") {
    title = `Agenda · ${formatDayRange(focus, new Date(focus.getFullYear(), focus.getMonth(), focus.getDate() + 34))}`;
    prevLabel = "Previous period";
    nextLabel = "Next period";
  } else {
    title = monthTitle(host, host.state.monthCursor.y, host.state.monthCursor.m);
    prevLabel = "Previous month";
    nextLabel = "Next month";
  }

  const views: { id: "month" | "week" | "agenda"; label: string }[] = [
    { id: "month", label: "Month" },
    { id: "week", label: "Week" },
    { id: "agenda", label: "Agenda" },
  ];
  const viewBtns = views
    .map(
      (v) =>
        `<button type="button" class="btn btn-ghost btn-small cal-view-btn${view === v.id ? " is-active" : ""}" data-action="cal-view" data-view="${v.id}" ${host.state.busy ? "disabled" : ""}>${v.label}</button>`,
    )
    .join("");

  const toolbar = `<div class="month-cal-toolbar">
      <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${host.state.busy ? "disabled" : ""}>Today</button>
      <div class="month-nav">
        <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="${esc(prevLabel)}" ${host.state.busy ? "disabled" : ""}>‹</button>
        <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="${esc(nextLabel)}" ${host.state.busy ? "disabled" : ""}>›</button>
      </div>
      <h2 class="month-cal-title">${esc(title)}</h2>
      <div class="cal-view-toggle" role="group" aria-label="Calendar view">${viewBtns}</div>
      <input type="search" class="cal-event-search" data-action="event-search" placeholder="Search events…"
        value="${esc(host.state.eventSearch)}" aria-label="Search events" ${host.state.busy ? "disabled" : ""} />
      <span class="month-cal-name muted small" title="${esc(calName)}">
        ${swatches}
        ${esc(calName)}
      </span>
    </div>`;

  return { calName, swatches, emptyHint, toolbar };
}
