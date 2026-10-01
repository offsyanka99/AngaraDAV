import type { AdminPushStats } from "../../api/types.ts";

/** Compact age for the queue backlog: "42 s", "5 min", "2 h 5 min". */
export function formatQueueAge(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  if (s < 60) {
    return `${s} s`;
  }
  if (s < 3600) {
    return `${Math.floor(s / 60)} min`;
  }
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

/** Label/value rows for the Overview WebDAV-Push table. */
export function pushStatsRows(stats: AdminPushStats): Array<[string, string]> {
  const { subscriptions: sub, queue } = stats;
  return [
    ["Calendar subscriptions", String(sub.calendars)],
    ["Address book subscriptions", String(sub.addressbooks)],
    ["File folder subscriptions", String(sub.files)],
    ["Principal subscriptions", String(sub.principals)],
    ["Queued notifications", String(queue.jobs)],
    ["Oldest queued", queue.jobs > 0 ? formatQueueAge(queue.oldestAgeSeconds) : "—"],
  ];
}
