/**
 * Pure compare/clamp helpers for portal background-sync (no API client).
 */
import type { SyncStatus } from "../api/types.ts";
import type { TabId } from "./types.ts";

export const DEFAULT_POLL_SECONDS = 30;
export const MIN_POLL_SECONDS = 10;
export const MAX_POLL_SECONDS = 300;

export function clampPollSeconds(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
      return clampPollSeconds(Number(value));
    }
    return DEFAULT_POLL_SECONDS;
  }
  return Math.max(MIN_POLL_SECONDS, Math.min(MAX_POLL_SECONDS, Math.floor(value)));
}

export function isCompoundBusy(state: {
  busy: boolean;
  importProgress: unknown;
  filesUploadProgress: unknown;
  confirmRefresh?: boolean;
}): boolean {
  return !!(
    state.busy ||
    state.importProgress ||
    state.filesUploadProgress ||
    state.confirmRefresh
  );
}

export function hasOpenEditor(state: {
  editingNote: unknown;
  editingTask: unknown;
  editingEvent: unknown;
  editingContact: unknown;
  filesRenamePath: unknown;
  filesMkdirOpen?: unknown;
  filesTransfer?: unknown;
  filesDeletePaths?: unknown;
  filesPreview?: unknown;
  calModalOpen?: unknown;
  createCalModalOpen?: unknown;
  abModalOpen?: unknown;
}): boolean {
  return !!(
    state.editingNote ||
    state.editingTask ||
    state.editingEvent ||
    state.editingContact ||
    state.filesRenamePath ||
    state.filesMkdirOpen ||
    state.filesTransfer ||
    state.filesDeletePaths ||
    state.filesPreview ||
    state.calModalOpen ||
    state.createCalModalOpen ||
    state.abModalOpen
  );
}

export function hasComponent(components: string, name: string): boolean {
  return components
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .includes(name.toUpperCase());
}

function tokenMap<T extends { synctoken: number }>(
  rows: T[],
  keyOf: (row: T) => number,
): Map<number, number> {
  const map = new Map<number, number>();
  for (const row of rows) map.set(keyOf(row), row.synctoken);
  return map;
}

function tokensDiffer(
  prev: Map<number, number>,
  next: Map<number, number>,
  keys?: Iterable<number>,
): boolean {
  const ids = keys ? [...keys] : [...new Set([...prev.keys(), ...next.keys()])];
  for (const id of ids) {
    const a = prev.get(id);
    const b = next.get(id);
    if (a === undefined && b === undefined) continue;
    if (a === undefined || b === undefined || a !== b) return true;
  }
  return false;
}

export function isDomainStale(
  tab: TabId,
  snapshot: SyncStatus | null,
  next: SyncStatus,
  selectedIds: number[],
): boolean {
  if (!snapshot) return false;
  if (tab === "admin") return false;
  if (tab === "calendars") {
    if (selectedIds.length === 0) return false;
    return tokensDiffer(
      tokenMap(snapshot.calendars, (c) => c.instanceId),
      tokenMap(next.calendars, (c) => c.instanceId),
      selectedIds,
    );
  }
  if (tab === "tasks") {
    const prev = snapshot.calendars.filter((c) => hasComponent(c.components, "VTODO"));
    const cur = next.calendars.filter((c) => hasComponent(c.components, "VTODO"));
    return tokensDiffer(
      tokenMap(prev, (c) => c.instanceId),
      tokenMap(cur, (c) => c.instanceId),
    );
  }
  if (tab === "notes") {
    const prev = snapshot.calendars.filter((c) => hasComponent(c.components, "VJOURNAL"));
    const cur = next.calendars.filter((c) => hasComponent(c.components, "VJOURNAL"));
    return tokensDiffer(
      tokenMap(prev, (c) => c.instanceId),
      tokenMap(cur, (c) => c.instanceId),
    );
  }
  if (tab === "contacts") {
    return tokensDiffer(
      tokenMap(snapshot.addressBooks, (b) => b.id),
      tokenMap(next.addressBooks, (b) => b.id),
    );
  }
  if (tab === "files") {
    const prev = snapshot.files;
    const cur = next.files;
    return (
      prev.missing !== cur.missing ||
      prev.path !== cur.path ||
      prev.fingerprint !== cur.fingerprint ||
      prev.enabled !== cur.enabled ||
      prev.ready !== cur.ready
    );
  }
  return false;
}

export function shouldShowStaleToast(opts: {
  staleToastId: number | null;
  stale: boolean;
  busy: boolean;
  /** When false, a held id whose toast was dismissed (× / trim) may be shown again. */
  toastVisible?: boolean;
}): boolean {
  if (!opts.stale || opts.busy) return false;
  if (opts.staleToastId === null) return true;
  return opts.toastVisible === false;
}

export function domainNoun(tab: TabId): string {
  switch (tab) {
    case "calendars":
      return "events";
    case "tasks":
      return "tasks";
    case "notes":
      return "notes";
    case "contacts":
      return "contacts";
    case "files":
      return "files";
    default:
      return "data";
  }
}
