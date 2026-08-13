/**
 * Calendar loaders (Phase 6).
 */
import { api } from "../../api";
import { log } from "../../log";
import type { Calendar } from "../../api";
import { monthRange } from "../datetime";
import type { CalendarsHost } from "./host";
import { persistCalendarSelection } from "./selectionPersist";

export async function loadShares(host: CalendarsHost, id: number) {
  const res = await api.shares(id);
  host.state.shares = res.shares;
}

export function pickDefaultCalendar(host: CalendarsHost): Calendar | null {
  const own = host.state.calendars.filter((c) => c.canShare);
  if (own.length === 0) return null;
  const isDefault = (c: Calendar) => {
    const u = c.uri.toLowerCase();
    const n = c.displayname.toLowerCase();
    return u === "default" || n === "default" || n === "default calendar";
  };
  return own.find(isDefault) ?? own[0] ?? null;
}

export async function loadMonthEvents(host: CalendarsHost) {
  const ids = host.state.selectedIds.filter((id) => host.state.calendars.some((c) => c.id === id));
  if (ids.length === 0) {
    host.state.monthEvents = [];
    return;
  }
  const { from, to } = monthRange(host.state.monthCursor.y, host.state.monthCursor.m);
  host.state.monthEventsLoading = true;
  log.debug("loadMonthEvents", { selectedIds: ids, from, to });
  try {
    const results = await Promise.all(
      ids.map(async (id) => {
        const res = await api.calendarEvents(id, from, to);
        return res.events.map((ev) => ({ ...ev, instanceId: id }));
      }),
    );
    const merged = results.flat();
    // Stable order: by start, then summary
    merged.sort((a, b) => {
      const sa = a.start || "";
      const sb = b.start || "";
      if (sa !== sb) return sa < sb ? -1 : 1;
      return (a.summary || "").localeCompare(b.summary || "");
    });
    host.state.monthEvents = merged;
    log.event("monthEvents.loaded", {
      calendarIds: ids,
      count: host.state.monthEvents.length,
      from,
      to,
    });
  } catch (e) {
    host.state.monthEvents = [];
    log.warn(
      "loadMonthEvents failed",
      e instanceof Error ? e.message : e,
    );
  } finally {
    host.state.monthEventsLoading = false;
  }
}

export function calendarColor(host: CalendarsHost, instanceId: number): string {
  const c = host.state.calendars.find((x) => x.id === instanceId);
  if (!c?.color) return "#3B82F6";
  return c.color.length >= 7 ? c.color.slice(0, 7) : c.color;
}

export function toggleCalendarSelected(host: CalendarsHost, id: number): void {
  if (host.state.selectedIds.includes(id)) {
    host.state.selectedIds = host.state.selectedIds.filter((x) => x !== id);
    if (host.state.selectedId === id) {
      host.state.selectedId = host.state.selectedIds[0] ?? null;
    }
  } else {
    host.state.selectedIds = [...host.state.selectedIds, id];
    host.state.selectedId = id;
  }
  persistCalendarSelection(host.state);
}
