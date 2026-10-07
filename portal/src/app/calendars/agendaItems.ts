/**
 * Agenda rows: events, open tasks with a due date, and notes with a date.
 * Month and week views do not use this.
 */
import type { CalendarEvent, NoteItem, TaskItem } from "../../api";
import { eventDayKeys, ymd } from "../datetime.ts";
import { isOpenTaskStatus } from "../tasks/listing.ts";

export type AgendaHit =
  | { kind: "event"; day: string; sort: number; event: CalendarEvent & { instanceId: number } }
  | { kind: "task"; day: string; sort: number; task: TaskItem }
  | { kind: "note"; day: string; sort: number; note: NoteItem };

export function localDayKey(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const trimmed = iso.trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return ymd(d);
}

/** Minutes from local midnight, or -1 when the value is date-only or missing. */
export function agendaSortMinutes(iso: string | null | undefined, allDay = false): number {
  if (!iso || allDay || /^\d{4}-\d{2}-\d{2}$/.test(iso.trim())) return -1;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return -1;
  return d.getHours() * 60 + d.getMinutes();
}

function inRange(day: string, from: string, to: string): boolean {
  return day >= from && day <= to;
}

function matchesSearch(summary: string, q: string): boolean {
  if (!q) return true;
  return (summary || "").toLowerCase().includes(q);
}

export function agendaHits(opts: {
  events: Array<CalendarEvent & { instanceId: number }>;
  tasks: TaskItem[];
  notes: NoteItem[];
  selectedIds: number[];
  from: string;
  to: string;
  search: string;
  includeTasks: boolean;
  includeNotes: boolean;
}): AgendaHit[] {
  const selected = new Set(opts.selectedIds);
  const q = opts.search.trim().toLowerCase();
  const hits: AgendaHit[] = [];

  for (const ev of opts.events) {
    const instanceId = ev.instanceId;
    if (!selected.has(instanceId)) continue;
    if (!matchesSearch(ev.summary || "", q)) continue;
    const sort = agendaSortMinutes(ev.start, ev.allDay);
    for (const day of eventDayKeys(ev)) {
      if (!inRange(day, opts.from, opts.to)) continue;
      hits.push({ kind: "event", day, sort, event: ev });
    }
  }

  if (opts.includeTasks) {
    for (const task of opts.tasks) {
      if (!selected.has(task.instanceId)) continue;
      if (!isOpenTaskStatus(task.status)) continue;
      const day = localDayKey(task.due);
      if (!day || !inRange(day, opts.from, opts.to)) continue;
      if (!matchesSearch(task.summary || "", q)) continue;
      hits.push({ kind: "task", day, sort: agendaSortMinutes(task.due), task });
    }
  }

  if (opts.includeNotes) {
    for (const note of opts.notes) {
      if (!selected.has(note.instanceId)) continue;
      const day = localDayKey(note.dtstart);
      if (!day || !inRange(day, opts.from, opts.to)) continue;
      if (!matchesSearch(note.summary || "", q)) continue;
      hits.push({ kind: "note", day, sort: agendaSortMinutes(note.dtstart), note });
    }
  }

  const kindOrder = { event: 0, task: 1, note: 2 };
  hits.sort((a, b) => {
    if (a.day !== b.day) return a.day < b.day ? -1 : 1;
    if (a.sort !== b.sort) return a.sort - b.sort;
    if (a.kind !== b.kind) return kindOrder[a.kind] - kindOrder[b.kind];
    const ta = a.kind === "event" ? a.event.summary : a.kind === "task" ? a.task.summary : a.note.summary;
    const tb = b.kind === "event" ? b.event.summary : b.kind === "task" ? b.task.summary : b.note.summary;
    return (ta || "").localeCompare(tb || "");
  });
  return hits;
}

export function agendaItemsFingerprint(tasks: TaskItem[], notes: NoteItem[]): string {
  const taskPart = tasks
    .map((t) => [t.instanceId, t.uri, t.due ?? "", t.status, t.summary].join("\t"))
    .join("\n");
  const notePart = notes
    .map((n) => [n.instanceId, n.uri, n.dtstart ?? "", n.summary].join("\t"))
    .join("\n");
  return `${taskPart}\n--\n${notePart}`;
}
