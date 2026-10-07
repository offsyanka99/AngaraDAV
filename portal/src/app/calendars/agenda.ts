/**
 * Agenda (upcoming list) view for the Calendar tab.
 */
import { esc } from "../../ui";
import { addDays, ymd } from "../datetime";
import { isUserTabEnabled } from "../session";
import { repeatLabel } from "../repeatControl";
import { agendaHits, type AgendaHit } from "./agendaItems";
import { eventsRangeForView, focusDate, formatEventChipLabel } from "./eventsView";
import type { CalendarsHost } from "./host";
import { calendarColor } from "./loaders";
import { calendarChrome } from "./toolbar";

function agendaTimePrefix(host: CalendarsHost, iso: string | null | undefined): string {
  if (!iso || /^\d{4}-\d{2}-\d{2}$/.test(iso.trim())) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, host.timeFormatOpts());
}

function agendaButton(host: CalendarsHost, hit: AgendaHit): string {
  const busy = host.state.busy ? "disabled" : "";
  if (hit.kind === "event") {
    const ev = hit.event;
    const label = formatEventChipLabel(host, ev);
    const color = calendarColor(host, ev.instanceId);
    const calTitle = host.state.calendars.find((c) => c.id === ev.instanceId)?.displayname || "";
    const tip = calTitle ? `${label} · ${calTitle}` : label;
    return `<button type="button" class="agenda-event" title="${esc(tip)}" style="--ev-color:${esc(color)}"
        data-action="open-event" data-instance="${ev.instanceId}" data-uri="${esc(ev.uri)}" ${busy}>${esc(label)}</button>`;
  }
  if (hit.kind === "task") {
    const task = hit.task;
    const time = agendaTimePrefix(host, task.due);
    const title = task.summary || "(No title)";
    const repeat = task.hasRrule ? repeatLabel(task.repeat) : "";
    const label = [time, title].filter(Boolean).join(" ");
    const color = calendarColor(host, task.instanceId);
    const tip = [label, repeat, task.calendarName].filter(Boolean).join(" · ");
    const repeatHtml = repeat ? ` <span class="badge task-repeat-badge">${esc(repeat)}</span>` : "";
    return `<button type="button" class="agenda-event" title="${esc(tip)}" style="--ev-color:${esc(color)}"
        data-action="open-agenda-task" data-instance="${task.instanceId}" data-uri="${esc(task.uri)}" ${busy}><span class="badge agenda-kind">Task</span>${esc(label)}${repeatHtml}</button>`;
  }
  const note = hit.note;
  const time = agendaTimePrefix(host, note.dtstart);
  const title = note.summary || "(No title)";
  const label = [time, title].filter(Boolean).join(" ");
  const color = calendarColor(host, note.instanceId);
  const tip = [label, note.calendarName].filter(Boolean).join(" · ");
  return `<button type="button" class="agenda-event" title="${esc(tip)}" style="--ev-color:${esc(color)}"
      data-action="open-agenda-note" data-instance="${note.instanceId}" data-uri="${esc(note.uri)}" ${busy}><span class="badge agenda-kind">Note</span>${esc(label)}</button>`;
}

export function renderAgendaView(host: CalendarsHost): string {
  const chrome = calendarChrome(host);
  const focus = focusDate(host);
  const range = eventsRangeForView(host);
  const hits = agendaHits({
    events: host.state.monthEvents,
    tasks: host.state.agendaTasks,
    notes: host.state.agendaNotes,
    selectedIds: host.state.selectedIds,
    from: range.from,
    to: range.to,
    search: host.state.eventSearch,
    includeTasks: isUserTabEnabled(host.state, "tasks"),
    includeNotes: isUserTabEnabled(host.state, "notes"),
  });
  const byDay = new Map<string, AgendaHit[]>();
  for (const hit of hits) {
    const list = byDay.get(hit.day) ?? [];
    list.push(hit);
    byDay.set(hit.day, list);
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
    const items = list.map((hit) => agendaButton(host, hit)).join("");
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
            ? "Nothing matches this search in the current range."
            : "Nothing in this period."
        }</p>`;

  return `<section class="card month-cal-card agenda-cal-card">
    ${chrome.toolbar}
    ${chrome.emptyHint}
    <div class="agenda-wrap">${body}</div>
  </section>`;
}
