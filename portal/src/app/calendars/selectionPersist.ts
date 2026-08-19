/**
 * Persist month-grid calendar multi-select across browser sessions (localStorage).
 * Scoped per DAV username so shared browsers do not mix preferences.
 */
import { CAL_SELECTION_STORAGE_KEY } from "../constants.ts";
import type { AppState } from "../context";

export type CalendarViewId = "month" | "week" | "agenda";

export type StoredCalendarSelection = {
  ids: number[];
  selectedId: number | null;
  view?: CalendarViewId;
};

export function parseCalendarView(raw: unknown): CalendarViewId | null {
  return raw === "month" || raw === "week" || raw === "agenda" ? raw : null;
}

function storageKey(username: string): string {
  return `${CAL_SELECTION_STORAGE_KEY}:${username}`;
}

/** Read stored selection for username. null = never saved for this user. */
export function readStoredCalendarSelection(
  username: string | null | undefined,
): StoredCalendarSelection | null {
  if (!username) return null;
  try {
    const raw = localStorage.getItem(storageKey(username));
    if (raw == null || raw === "") return null;
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") return null;
    const obj = data as Record<string, unknown>;
    let ids: number[] = [];
    if (Array.isArray(obj.ids)) {
      ids = obj.ids
        .map((x) => Number(x))
        .filter((n) => Number.isFinite(n) && n > 0)
        .map((n) => Math.floor(n));
    }
    let selectedId: number | null = null;
    if (obj.selectedId === null || obj.selectedId === undefined) {
      selectedId = null;
    } else {
      const n = Number(obj.selectedId);
      selectedId = Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
    }
    const view = parseCalendarView(obj.view) ?? undefined;
    return { ids, selectedId, view };
  } catch {
    return null;
  }
}

/** Write current selection (including empty list) for the logged-in user. */
export function persistCalendarSelection(state: AppState): void {
  const username = state.user?.username;
  if (!username) return;
  try {
    const payload: StoredCalendarSelection = {
      ids: state.selectedIds.slice(),
      selectedId: state.selectedId,
      view: parseCalendarView(state.calView) ?? "month",
    };
    localStorage.setItem(storageKey(username), JSON.stringify(payload));
  } catch {
    /* private mode / quota */
  }
}
