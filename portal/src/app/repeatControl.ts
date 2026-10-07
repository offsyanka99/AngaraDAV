/**
 * Repeat control shared by events and tasks (CalDAV RRULE).
 */
import type { EventRepeat } from "../api";
import { esc } from "../ui.ts";

export function defaultRepeat(): {
  freq: string;
  interval: number;
  until: string | null;
  count: number | null;
  byDay: string[];
  endMode: "never" | "until" | "count";
} {
  return { freq: "", interval: 1, until: null, count: null, byDay: [], endMode: "never" };
}

export function repeatEndMode(rep: {
  until?: string | null;
  count?: number | null;
  endMode?: "never" | "until" | "count";
}): "never" | "until" | "count" {
  if (rep.endMode === "until" || rep.endMode === "count" || rep.endMode === "never") {
    return rep.endMode;
  }
  if (rep.until) return "until";
  if (rep.count) return "count";
  return "never";
}

export function readRepeatFromForm(fd: FormData): {
  freq: string;
  interval: number;
  until: string | null;
  count: number | null;
  byDay: string[];
  endMode: "never" | "until" | "count";
} {
  const freq = String(fd.get("repeatFreq") ?? "").trim().toUpperCase();
  if (!freq) {
    return { freq: "", interval: 1, until: null, count: null, byDay: [], endMode: "never" };
  }
  const interval = Math.max(1, Math.min(99, Number(fd.get("repeatInterval") ?? 1) || 1));
  const rawEnd = String(fd.get("repeatEndMode") ?? "never");
  const endMode: "never" | "until" | "count" =
    rawEnd === "until" || rawEnd === "count" ? rawEnd : "never";
  let until: string | null = null;
  let count: number | null = null;
  if (endMode === "until") {
    const u = String(fd.get("repeatUntil") ?? "").trim();
    until = u ? u.slice(0, 10) : null;
  } else if (endMode === "count") {
    const c = Number(fd.get("repeatCount") ?? 0);
    count = Number.isFinite(c) && c > 0 ? Math.min(999, Math.round(c)) : 10;
  }
  const byDay = fd
    .getAll("repeatByDay")
    .map((v) => String(v).toUpperCase())
    .filter(Boolean);
  return { freq, interval, until, count, byDay, endMode };
}

const FREQ_ONE: Record<string, string> = {
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};
const FREQ_UNIT: Record<string, string> = {
  DAILY: "days",
  WEEKLY: "weeks",
  MONTHLY: "months",
  YEARLY: "years",
};

/** Short label for a list badge. Empty when the item does not repeat. */
export function repeatLabel(
  rep: { freq?: string; interval?: number; byDay?: string[] } | null | undefined,
): string {
  const freq = (rep?.freq || "").toUpperCase();
  if (!freq) return "";
  const interval = Math.max(1, Number(rep?.interval) || 1);
  let label =
    interval === 1
      ? (FREQ_ONE[freq] ?? freq)
      : `Every ${interval} ${FREQ_UNIT[freq] ?? freq.toLowerCase()}`;
  if (freq === "WEEKLY" && rep?.byDay && rep.byDay.length > 0) {
    label += ` (${rep.byDay.join(", ")})`;
  }
  return label;
}

const WEEK_DAYS: { code: string; label: string }[] = [
  { code: "MO", label: "Mon" },
  { code: "TU", label: "Tue" },
  { code: "WE", label: "Wed" },
  { code: "TH", label: "Thu" },
  { code: "FR", label: "Fri" },
  { code: "SA", label: "Sat" },
  { code: "SU", label: "Sun" },
];

/**
 * Same Repeat fieldset for events and tasks.
 * `untilFallback` is used when Ends is "On date" and no until date is stored yet.
 */
export function renderRepeatFieldset(opts: {
  repeat: EventRepeat;
  readOnly: boolean;
  untilFallback: string;
  renderUntil: (value: string, disabled: boolean) => string;
  hintHtml?: string;
}): string {
  const rep = opts.repeat;
  const freq = (rep.freq || "").toUpperCase();
  const endMode = repeatEndMode(rep);
  const byDay = new Set((rep.byDay || []).map((d) => d.toUpperCase()));
  const untilVal = rep.until || (endMode === "until" ? opts.untilFallback : "");
  const byDayHtml =
    freq === "WEEKLY"
      ? `<div class="event-byday" role="group" aria-label="Days of week">
          ${WEEK_DAYS.map(
            (d) =>
              `<label class="checkbox event-byday-item">
                <input type="checkbox" name="repeatByDay" value="${d.code}" ${byDay.has(d.code) ? "checked" : ""} />
                ${d.label}
              </label>`,
          ).join("")}
        </div>`
      : "";
  const endsHtml = freq
    ? `<div class="form-grid form-grid-2" style="margin-top:0.5rem">
        <label>Ends
          <select name="repeatEndMode" data-action="event-repeat-end">
            <option value="never" ${endMode === "never" ? "selected" : ""}>Never</option>
            <option value="until" ${endMode === "until" ? "selected" : ""}>On date</option>
            <option value="count" ${endMode === "count" ? "selected" : ""}>After count</option>
          </select>
        </label>
        ${
          endMode === "until"
            ? opts.renderUntil(untilVal, opts.readOnly)
            : endMode === "count"
              ? `<label>Occurrences
                  <input type="number" name="repeatCount" min="1" max="999" value="${esc(String(rep.count || 10))}" />
                </label>`
              : `<span></span>`
        }
      </div>`
    : "";
  const hint = freq && opts.hintHtml ? opts.hintHtml : "";
  return `<fieldset class="event-repeat" ${opts.readOnly ? "disabled" : ""}>
    <legend class="event-repeat-legend">Repeat</legend>
    <div class="form-grid form-grid-2">
      <label>Frequency
        <select name="repeatFreq" data-action="event-repeat-freq">
          <option value="" ${!freq ? "selected" : ""}>Does not repeat</option>
          <option value="DAILY" ${freq === "DAILY" ? "selected" : ""}>Daily</option>
          <option value="WEEKLY" ${freq === "WEEKLY" ? "selected" : ""}>Weekly</option>
          <option value="MONTHLY" ${freq === "MONTHLY" ? "selected" : ""}>Monthly</option>
          <option value="YEARLY" ${freq === "YEARLY" ? "selected" : ""}>Yearly</option>
        </select>
      </label>
      <label>Every
        <input type="number" name="repeatInterval" min="1" max="99" value="${esc(String(rep.interval || 1))}" ${!freq ? "disabled" : ""} />
      </label>
    </div>
    ${byDayHtml}
    ${endsHtml}
    ${hint}
  </fieldset>`;
}
