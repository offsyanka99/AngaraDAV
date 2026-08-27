/** Pixel height of one hour row in week view (keep in sync with .week-hour / .week-slot). */
export const WEEK_HOUR_PX = 40;

/** Scroll so the hour row at (day start − 1) is the first visible timed row. */
export function weekScrollTopForDayStart(dayStartHour: number): number {
  const hour = Math.min(23, Math.max(0, dayStartHour - 1));
  return hour * WEEK_HOUR_PX;
}
