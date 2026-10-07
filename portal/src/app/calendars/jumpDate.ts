/**
 * Jump-to-date control on the Calendar toolbar.
 * The popover is the shared date calendar, so week start follows portal UI settings.
 */
import { parseYmd, renderPortalDateTimePopoverHtml, ymd, type TimeFormatPref, type WeekStartPref } from "../datetime.ts";

export const CAL_JUMP_FIELD = "cal-jump";

export function applyCalendarJump(
  state: {
    calFocusDay: string;
    monthCursor: { y: number; m: number };
    monthExpandDay: string | null;
  },
  day: string,
): boolean {
  const parsed = parseYmd(day);
  if (!parsed) return false;
  state.calFocusDay = ymd(parsed);
  state.monthCursor = { y: parsed.getFullYear(), m: parsed.getMonth() };
  state.monthExpandDay = null;
  return true;
}

export function calendarJumpHtml(opts: {
  busy: boolean;
  open: boolean;
  focusDay: string;
  viewY: number;
  viewM: number;
  weekStart: WeekStartPref;
  timeFormat: TimeFormatPref;
}): string {
  const popover = opts.open
    ? renderPortalDateTimePopoverHtml({
        field: CAL_JUMP_FIELD,
        value: opts.focusDay,
        dateOnly: true,
        allowClear: false,
        showClear: false,
        viewY: opts.viewY,
        viewM: opts.viewM,
        weekStart: opts.weekStart,
        timeFormat: opts.timeFormat,
      })
    : "";
  return `<div class="dt-field cal-jump${opts.open ? " is-open" : ""}">
      <button type="button" class="btn btn-ghost btn-small cal-jump-btn" data-action="dt-open" data-dt-field="${CAL_JUMP_FIELD}" data-dt-date-only="1" data-dt-clear="0" aria-haspopup="dialog" aria-expanded="${opts.open ? "true" : "false"}" ${opts.busy ? "disabled" : ""}>Jump to date</button>
      ${popover}
    </div>`;
}
