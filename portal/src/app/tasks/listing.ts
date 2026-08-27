/**
 * Client-side Tasks table column filters (Status, Due, Calendar, %).
 */
import type { TaskItem } from "../../api";

export type TaskColumnFilters = {
  status: string;
  due: string;
  calendar: string;
  percent: string;
};

export const DEFAULT_TASK_FILTERS: TaskColumnFilters = {
  status: "open",
  due: "",
  calendar: "",
  percent: "",
};

const STATUS_VALUES = new Set(["", "open", "NEEDS-ACTION", "IN-PROCESS", "COMPLETED", "CANCELLED"]);
const DUE_VALUES = new Set(["", "overdue", "today", "upcoming", "none"]);
const PERCENT_VALUES = new Set(["", "0", "partial", "100"]);

export function normalizeTaskFilters(partial: Partial<TaskColumnFilters> | null | undefined): TaskColumnFilters {
  const status = String(partial?.status ?? DEFAULT_TASK_FILTERS.status);
  const due = String(partial?.due ?? "");
  const calendar = String(partial?.calendar ?? "");
  const percent = String(partial?.percent ?? "");
  return {
    status: STATUS_VALUES.has(status) ? status : DEFAULT_TASK_FILTERS.status,
    due: DUE_VALUES.has(due) ? due : "",
    calendar,
    percent: PERCENT_VALUES.has(percent) ? percent : "",
  };
}

function startOfLocalDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

function dueBucket(iso: string | null | undefined, now = new Date()): "none" | "overdue" | "today" | "upcoming" {
  if (!iso) return "none";
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return "none";
  const day = startOfLocalDay(t);
  const today = startOfLocalDay(now);
  if (day < today) return "overdue";
  if (day === today) return "today";
  return "upcoming";
}

/** Open = not Done and not Cancelled (To do / In progress). */
export function isOpenTaskStatus(status: string): boolean {
  const s = status.toUpperCase();
  return s !== "COMPLETED" && s !== "CANCELLED";
}

export function taskMatchesFilters(t: TaskItem, f: TaskColumnFilters, now = new Date()): boolean {
  if (f.status === "open") {
    if (t.status === "COMPLETED") return false;
  } else if (f.status && t.status !== f.status) {
    return false;
  }
  if (f.due && dueBucket(t.due, now) !== f.due) return false;
  if (f.calendar && t.calendarName !== f.calendar) return false;
  if (f.percent === "0") {
    if ((t.percent || 0) !== 0) return false;
  } else if (f.percent === "100") {
    if (t.percent !== 100) return false;
  } else if (f.percent === "partial") {
    const p = t.percent || 0;
    if (p <= 0 || p >= 100) return false;
  }
  return true;
}

export function filterTasks(list: TaskItem[], f: TaskColumnFilters, now = new Date()): TaskItem[] {
  return list.filter((t) => taskMatchesFilters(t, f, now));
}
