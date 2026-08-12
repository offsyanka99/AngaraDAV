/**
 * Pure date/time helpers for the portal SPA (Phase 1 extract from app.ts).
 *
 * Prefs (12h/24h, week start) are passed in so this module stays free of App state.
 * Stateful DT field open/set (editingEvent, etc.) remains in app.ts until Phase 6.
 */
import type { CalendarEvent } from "../api";
import { esc } from "../ui";

export type TimeFormatPref = "auto" | "12h" | "24h";
export type WeekStartPref = "auto" | "monday" | "sunday";

export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function monthRange(y: number, m: number): { from: string; to: string } {
  const from = new Date(y, m, 1);
  const to = new Date(y, m + 1, 0);
  return { from: ymd(from), to: ymd(to) };
}

/** Local calendar date of an event start/end string. */
export function eventLocalDate(iso: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [ys, ms, ds] = iso.split("-").map(Number);
    return new Date(ys, ms - 1, ds);
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    const [ys, ms, ds] = iso.slice(0, 10).split("-").map(Number);
    return new Date(ys, (ms || 1) - 1, ds || 1);
  }
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Days an event occupies (inclusive). All-day end from API is inclusive last day.
 * Timed events span every local day from start through end.
 */
export function eventDayKeys(ev: CalendarEvent): string[] {
  const startD = eventLocalDate(ev.start);
  if (!ev.end) return [ymd(startD)];
  let endD = eventLocalDate(ev.end);
  // Timed: if end is midnight exclusive of next day, still count previous day
  if (!ev.allDay && !/^\d{4}-\d{2}-\d{2}$/.test(ev.end)) {
    const endFull = new Date(ev.end);
    if (
      !Number.isNaN(endFull.getTime()) &&
      endFull.getHours() === 0 &&
      endFull.getMinutes() === 0 &&
      endFull.getSeconds() === 0 &&
      endFull.getTime() > new Date(ev.start).getTime()
    ) {
      endD = new Date(endD.getFullYear(), endD.getMonth(), endD.getDate() - 1);
    }
  }
  if (endD < startD) return [ymd(startD)];
  const keys: string[] = [];
  const cur = new Date(startD.getFullYear(), startD.getMonth(), startD.getDate());
  const last = new Date(endD.getFullYear(), endD.getMonth(), endD.getDate());
  let guard = 0;
  while (cur <= last && guard++ < 370) {
    keys.push(ymd(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return keys.length ? keys : [ymd(startD)];
}

export function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return ymd(d);
}

/** Prefer 12-hour clock? Uses portal YAML/env override, then browser hourCycle. */
export function preferHour12(timeFormat: TimeFormatPref): boolean {
  if (timeFormat === "24h") return false;
  if (timeFormat === "12h") return true;
  try {
    const ro = new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions() as {
      hourCycle?: string;
      hour12?: boolean;
    };
    if (ro.hourCycle === "h23" || ro.hourCycle === "h24") return false;
    if (ro.hourCycle === "h11" || ro.hourCycle === "h12") return true;
    if (typeof ro.hour12 === "boolean") return ro.hour12;
  } catch {
    /* fall through */
  }
  const lang = (navigator.language || "").toLowerCase();
  return /^(en-us|en-ca|en-ph|en-au|en-nz)\b/.test(lang);
}

export function timeFormatOpts(timeFormat: TimeFormatPref): Intl.DateTimeFormatOptions {
  return preferHour12(timeFormat)
    ? { hour: "numeric", minute: "2-digit", hour12: true }
    : { hour: "2-digit", minute: "2-digit", hour12: false };
}

/** Locale first day of week: 0=Sunday … 6=Saturday (Date.getDay() style). */
export function localeWeekStart(weekStart: WeekStartPref): number {
  if (weekStart === "monday") return 1;
  if (weekStart === "sunday") return 0;
  const tags = [...(navigator.languages?.length ? navigator.languages : []), navigator.language].filter(
    Boolean,
  ) as string[];
  for (const tag of tags) {
    try {
      const loc = new Intl.Locale(tag);
      const wi =
        typeof (loc as Intl.Locale & { getWeekInfo?: () => { firstDay: number } }).getWeekInfo ===
        "function"
          ? (loc as Intl.Locale & { getWeekInfo: () => { firstDay: number } }).getWeekInfo()
          : (loc as Intl.Locale & { weekInfo?: { firstDay?: number } }).weekInfo;
      const fd = wi?.firstDay;
      if (typeof fd === "number") {
        return fd === 7 ? 0 : fd;
      }
    } catch {
      /* try next tag */
    }
  }
  const lang = (navigator.language || "en").toLowerCase();
  if (/^(en-us|en-ca|en-ph|ja|zh|ko|he|ar)\b/.test(lang)) return 0;
  return 1;
}

export function localeDowLabels(weekStart: WeekStartPref): string[] {
  const start = localeWeekStart(weekStart);
  const base = new Date(2024, 0, 7 + start);
  const labels: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    labels.push(d.toLocaleDateString(undefined, { weekday: "short" }));
  }
  return labels;
}

/** Round date up to next stepMinutes boundary (default 15). */
export function roundUpTime(d: Date, stepMinutes = 15): Date {
  const step = stepMinutes * 60 * 1000;
  const t = d.getTime();
  if (t % step === 0) return new Date(t);
  return new Date(Math.ceil(t / step) * step);
}

export function formatLocalDtValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDtDisplay(
  value: string,
  allDay: boolean,
  timeFormat: TimeFormatPref,
): string {
  if (!value) return "Select…";
  if (allDay || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const day = value.slice(0, 10);
    const [ys, ms, ds] = day.split("-").map(Number);
    const d = new Date(ys, ms - 1, ds);
    return d.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }
  const d = new Date(value.includes("T") && value.length === 16 ? value : value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
    ...timeFormatOpts(timeFormat),
  });
}

export function parseDtParts(value: string): { date: string; hm: string } {
  if (!value) {
    const n = roundUpTime(new Date());
    return {
      date: ymd(n),
      hm: `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}`,
    };
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return { date: value, hm: "09:00" };
  }
  const d = new Date(value.length === 16 ? value : value);
  if (Number.isNaN(d.getTime())) {
    return { date: value.slice(0, 10), hm: "09:00" };
  }
  return {
    date: ymd(d),
    hm: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  };
}

/** Default timed range: now rounded up → +1 hour (or 09:00–10:00 on another day). */
export function defaultTimedRange(dayYmd?: string): { start: string; end: string } {
  const now = new Date();
  const today = ymd(now);
  if (dayYmd && dayYmd !== today) {
    const [ys, ms, ds] = dayYmd.split("-").map(Number);
    const s = new Date(ys, ms - 1, ds, 9, 0, 0, 0);
    const e = new Date(ys, ms - 1, ds, 10, 0, 0, 0);
    return { start: formatLocalDtValue(s), end: formatLocalDtValue(e) };
  }
  const s = roundUpTime(now, 15);
  const e = new Date(s.getTime() + 60 * 60 * 1000);
  return { start: formatLocalDtValue(s), end: formatLocalDtValue(e) };
}

export function timeSlotList(): string[] {
  const slots: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return slots;
}

/** When leaving all-day: same calendar day(s) with rounded-up times (or 09:00 on other days). */
export function convertAllDaySpanToTimed(
  startDate: string,
  endDate: string | null,
): { start: string; end: string | null } {
  const s = startDate.slice(0, 10);
  const e = (endDate || s).slice(0, 10);
  if (s === e) {
    const range = defaultTimedRange(s);
    return { start: range.start, end: range.end };
  }
  const [ys, ms, ds] = s.split("-").map(Number);
  const [ye, me, de] = e.split("-").map(Number);
  const start = formatLocalDtValue(new Date(ys, ms - 1, ds, 9, 0, 0, 0));
  const end = formatLocalDtValue(new Date(ye, me - 1, de, 17, 0, 0, 0));
  return { start, end };
}

export function convertTimedSpanToAllDay(
  startIso: string,
  endIso: string | null,
): { start: string; end: string | null } {
  const s = toDateInputValue(startIso);
  let e = endIso ? toDateInputValue(endIso) : s;
  if (endIso && !/^\d{4}-\d{2}-\d{2}$/.test(endIso)) {
    const endFull = new Date(endIso);
    if (
      !Number.isNaN(endFull.getTime()) &&
      endFull.getHours() === 0 &&
      endFull.getMinutes() === 0 &&
      endFull.getTime() > new Date(startIso).getTime()
    ) {
      const d = eventLocalDate(endIso);
      d.setDate(d.getDate() - 1);
      e = ymd(d);
    }
  }
  return { start: s, end: e };
}

export function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

/**
 * Build the fixed-position date/time popover markup (pure HTML).
 * Caller supplies viewY/viewM (open picker state) and pref for labels.
 */
export function renderPortalDateTimePopoverHtml(opts: {
  field: string;
  value: string;
  dateOnly: boolean;
  allowClear: boolean;
  viewY: number;
  viewM: number;
  weekStart: WeekStartPref;
  timeFormat: TimeFormatPref;
}): string {
  const { field, value, dateOnly, allowClear, viewY, viewM, weekStart, timeFormat } = opts;
  const parts = parseDtParts(value);
  const weekStartN = localeWeekStart(weekStart);
  const dowLabels = localeDowLabels(weekStart);
  const first = new Date(viewY, viewM, 1);
  const startPad = (first.getDay() - weekStartN + 7) % 7;
  const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
  const prevDays = new Date(viewY, viewM, 0).getDate();
  const selectedDate = parts.date;
  const selectedHm = parts.hm;
  const cells: string[] = [];
  const total = Math.ceil((startPad + daysInMonth) / 7) * 7;
  for (let i = 0; i < total; i++) {
    let dayNum: number;
    let cellDate: Date;
    let outside = false;
    if (i < startPad) {
      dayNum = prevDays - startPad + i + 1;
      cellDate = new Date(viewY, viewM - 1, dayNum);
      outside = true;
    } else if (i >= startPad + daysInMonth) {
      dayNum = i - (startPad + daysInMonth) + 1;
      cellDate = new Date(viewY, viewM + 1, dayNum);
      outside = true;
    } else {
      dayNum = i - startPad + 1;
      cellDate = new Date(viewY, viewM, dayNum);
    }
    const key = ymd(cellDate);
    const isSel = key === selectedDate;
    const isToday = key === ymd(new Date());
    cells.push(
      `<button type="button" class="dt-day${outside ? " is-outside" : ""}${isSel ? " is-selected" : ""}${isToday ? " is-today" : ""}" data-action="dt-pick-day" data-dt-field="${field}" data-day="${esc(key)}">${dayNum}</button>`,
    );
  }

  // Month + year selects for quick jump (birthdays, far-future due dates, etc.)
  const nowY = new Date().getFullYear();
  const yearMin = Math.min(1900, viewY);
  const yearMax = Math.max(nowY + 30, viewY);
  const monthOpts = Array.from({ length: 12 }, (_, m) => {
    const label = new Date(2000, m, 1).toLocaleString(undefined, { month: "short" });
    return `<option value="${m}" ${m === viewM ? "selected" : ""}>${esc(label)}</option>`;
  }).join("");
  const yearOpts: string[] = [];
  for (let y = yearMin; y <= yearMax; y++) {
    yearOpts.push(`<option value="${y}" ${y === viewY ? "selected" : ""}>${y}</option>`);
  }

  const timeList = dateOnly
    ? ""
    : `<div class="dt-times" role="listbox" aria-label="Time">
          ${timeSlotList()
            .map((hm) => {
              const label = (() => {
                const [h, m] = hm.split(":").map(Number);
                const d = new Date(2000, 0, 1, h, m);
                return d.toLocaleTimeString(undefined, timeFormatOpts(timeFormat));
              })();
              return `<button type="button" class="dt-time${hm === selectedHm ? " is-selected" : ""}" data-action="dt-pick-time" data-dt-field="${field}" data-hm="${hm}" role="option" aria-selected="${hm === selectedHm}">${esc(label)}</button>`;
            })
            .join("")}
        </div>`;
  return `<div class="dt-popover" data-dt-popover="${field}" role="dialog" aria-label="Choose date${dateOnly ? "" : " and time"}">
      <div class="dt-popover-inner${dateOnly ? " is-date-only" : ""}">
        <div class="dt-cal">
          <div class="dt-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-prev" data-dt-field="${field}" aria-label="Previous month">‹</button>
            <div class="dt-cal-jump" role="group" aria-label="Month and year">
              <select class="dt-month-select" data-action="dt-set-month" data-dt-field="${esc(field)}" aria-label="Month">${monthOpts}</select>
              <select class="dt-year-select" data-action="dt-set-year" data-dt-field="${esc(field)}" aria-label="Year">${yearOpts.join("")}</select>
            </div>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-next" data-dt-field="${field}" aria-label="Next month">›</button>
          </div>
          <div class="dt-dow-row">${dowLabels.map((l) => `<span class="dt-dow">${esc(l)}</span>`).join("")}</div>
          <div class="dt-days">${cells.join("")}</div>
          <div class="dt-cal-footer">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-clear" data-dt-field="${esc(field)}" ${allowClear ? "" : "disabled"}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-today" data-dt-field="${field}">Today</button>
          </div>
        </div>
        ${timeList}
      </div>
    </div>`;
}

/** Place open date/time popovers in the viewport (avoid modal overflow clipping). */
export function positionDtPopovers(container: ParentNode = document): void {
  container.querySelectorAll<HTMLElement>(".dt-field.is-open").forEach((field) => {
    const trigger = field.querySelector<HTMLElement>(".dt-trigger");
    const pop = field.querySelector<HTMLElement>(".dt-popover");
    if (!trigger || !pop) return;
    const r = trigger.getBoundingClientRect();
    const margin = 8;
    pop.style.position = "fixed";
    pop.style.visibility = "hidden";
    pop.style.top = "0";
    pop.style.left = "0";
    const pw = pop.offsetWidth || 320;
    const ph = pop.offsetHeight || 300;
    let top = r.bottom + 6;
    if (top + ph > window.innerHeight - margin) {
      top = Math.max(margin, r.top - ph - 6);
    }
    let left = r.left;
    if (left + pw > window.innerWidth - margin) {
      left = Math.max(margin, window.innerWidth - pw - margin);
    }
    if (left < margin) left = margin;
    pop.style.top = `${Math.round(top)}px`;
    pop.style.left = `${Math.round(left)}px`;
    pop.style.right = "auto";
    pop.style.visibility = "visible";
    pop.style.zIndex = "200";
  });
}
