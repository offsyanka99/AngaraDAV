/**
 * When a preset event display reminder is due.
 * All-day dates use local midnights. A date-only string is not UTC midnight.
 */
import { REMINDER_SEEN_STORAGE_KEY } from "../constants.ts";
import { addDays, parseYmd, timeFormatOpts, ymd, type TimeFormatPref } from "../datetime.ts";
import { REMINDER_PRESETS } from "./reminder.ts";

const PRESET_MINUTES = new Set(REMINDER_PRESETS.map((preset) => preset.minutes));
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const MAX_REMINDER_TOASTS = 4;
export const MAX_SEEN_REMINDERS = 200;

export type ReminderOccurrence = {
  instanceId: number;
  uri: string;
  summary: string;
  start: string;
  end: string | null;
  allDay: boolean;
  reminderMinutes: number | null;
};

export function isPresetReminder(minutes: number | null | undefined): minutes is number {
  return typeof minutes === "number" && PRESET_MINUTES.has(minutes);
}

export function reminderKey(
  username: string,
  instanceId: number,
  uri: string,
  start: string,
  minutes: number,
): string {
  return [username, String(instanceId), uri, start, String(minutes)].join("\t");
}

export function reminderInstanceId(key: string): number | null {
  const id = Number(key.split("\t")[1]);
  return Number.isInteger(id) ? id : null;
}

/** Checked calendars are scanned across this local-date window (within the API cap). */
export function reminderWindow(now: Date): { from: string; to: string } {
  return { from: ymd(addDays(now, -7)), to: ymd(addDays(now, 7)) };
}

export function occurrenceBounds(occ: {
  start: string;
  end: string | null;
  allDay: boolean;
}): { startMs: number; endMs: number } | null {
  const dateOnly = occ.allDay || /^\d{4}-\d{2}-\d{2}$/.test(occ.start);
  let startMs: number;
  if (dateOnly) {
    const day = parseYmd(occ.start.slice(0, 10));
    if (!day) return null;
    startMs = day.getTime();
  } else {
    const start = new Date(occ.start);
    if (Number.isNaN(start.getTime())) return null;
    startMs = start.getTime();
  }

  if (dateOnly) {
    const endKey =
      occ.end && /^\d{4}-\d{2}-\d{2}/.test(occ.end) ? occ.end.slice(0, 10) : occ.start.slice(0, 10);
    const endDay = parseYmd(endKey);
    const startDay = parseYmd(occ.start.slice(0, 10));
    if (!endDay || !startDay) return null;
    const exclusive = addDays(endDay, 1).getTime();
    const fallback = addDays(startDay, 1).getTime();
    return { startMs, endMs: exclusive > startMs ? exclusive : fallback };
  }

  let endMs = startMs + 60 * 60 * 1000;
  if (occ.end) {
    const end = new Date(occ.end);
    if (!Number.isNaN(end.getTime()) && end.getTime() > startMs) endMs = end.getTime();
  }
  return { startMs, endMs };
}

export function isReminderDue(occ: ReminderOccurrence, now: Date): boolean {
  if (!isPresetReminder(occ.reminderMinutes)) return false;
  if (!occ.uri || !Number.isFinite(occ.instanceId)) return false;
  const bounds = occurrenceBounds(occ);
  if (!bounds) return false;
  const fireAt = bounds.startMs - occ.reminderMinutes * 60 * 1000;
  const t = now.getTime();
  return t >= fireAt && t < bounds.endMs;
}

export function reminderTitle(summary: string): string {
  const title = summary.trim();
  if (title === "" || title === "(No title)") return "Event";
  return title;
}

/** Same clock as the calendar. Read at show time so a later System settings change applies. */
function formatClock(d: Date, timeFormat: TimeFormatPref): string {
  return d.toLocaleTimeString(undefined, timeFormatOpts(timeFormat));
}

function formatMonthDay(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

export function reminderMessage(
  occ: ReminderOccurrence,
  now: Date,
  timeFormat: TimeFormatPref,
): string {
  const title = reminderTitle(occ.summary);
  const bounds = occurrenceBounds(occ);
  if (!bounds) return title;
  if (now.getTime() >= bounds.startMs) return `${title} has started`;
  const start = new Date(bounds.startMs);
  if (occ.allDay || /^\d{4}-\d{2}-\d{2}$/.test(occ.start)) {
    const startDay = ymd(start);
    if (startDay === ymd(now)) return `${title} starts today`;
    if (startDay === ymd(addDays(now, 1))) return `${title} starts tomorrow`;
    return `${title} starts ${formatMonthDay(start)}`;
  }
  const clock = formatClock(start, timeFormat);
  if (ymd(now) === ymd(start)) return `${title} starts at ${clock}`;
  return `${title} starts ${formatMonthDay(start)} at ${clock}`;
}

export function dueReminders(
  occurrences: readonly ReminderOccurrence[],
  now: Date,
  seen: ReadonlySet<string>,
  username: string,
): ReminderOccurrence[] {
  return occurrences
    .filter((occ) => isReminderDue(occ, now) && isPresetReminder(occ.reminderMinutes))
    .filter(
      (occ) =>
        !seen.has(
          reminderKey(username, occ.instanceId, occ.uri, occ.start, occ.reminderMinutes as number),
        ),
    )
    .sort((a, b) => {
      const aFire =
        occurrenceBounds(a)!.startMs - (a.reminderMinutes as number) * 60 * 1000;
      const bFire =
        occurrenceBounds(b)!.startMs - (b.reminderMinutes as number) * 60 * 1000;
      if (aFire !== bFire) return aFire - bFire;
      const byTitle = reminderTitle(a.summary).localeCompare(reminderTitle(b.summary));
      if (byTitle !== 0) return byTitle;
      return a.uri.localeCompare(b.uri);
    });
}

/** Keys to show now, oldest fire time first, leaving room for ones already on screen. */
export function pickReminderKeys(
  dueKeysInOrder: readonly string[],
  shown: ReadonlySet<string>,
  maxVisible: number,
): string[] {
  let visible = 0;
  for (const key of dueKeysInOrder) {
    if (shown.has(key)) visible += 1;
  }
  const room = Math.max(0, maxVisible - visible);
  const fresh: string[] = [];
  for (const key of dueKeysInOrder) {
    if (shown.has(key)) continue;
    if (fresh.length >= room) break;
    fresh.push(key);
  }
  return fresh;
}

/**
 * Drop a shown reminder when its calendar is unchecked or its event is no longer due.
 * A calendar whose fetch failed stays on screen.
 */
export function reminderKeysToDismiss(
  shown: Iterable<string>,
  due: ReadonlySet<string>,
  fetchedInstanceIds: ReadonlySet<number>,
  selectedInstanceIds: ReadonlySet<number>,
): string[] {
  const drop: string[] = [];
  for (const key of shown) {
    const instanceId = reminderInstanceId(key);
    if (instanceId === null || !selectedInstanceIds.has(instanceId)) {
      drop.push(key);
      continue;
    }
    if (!fetchedInstanceIds.has(instanceId)) continue;
    if (!due.has(key)) drop.push(key);
  }
  return drop;
}

export function readSeenKeys(storage: Storage | null): string[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(REMINDER_SEEN_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string" && item !== "")
      .slice(-MAX_SEEN_REMINDERS);
  } catch {
    return [];
  }
}

export function writeSeenKeys(storage: Storage | null, keys: readonly string[]): string[] {
  const next = keys.filter((key) => key !== "").slice(-MAX_SEEN_REMINDERS);
  if (!storage) return next;
  try {
    storage.setItem(REMINDER_SEEN_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* Private mode or a full quota. The in-memory set still suppresses this tick. */
  }
  return next;
}
