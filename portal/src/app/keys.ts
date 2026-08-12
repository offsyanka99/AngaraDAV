/**
 * Shared instance|uri keys for tasks/notes (Phase 7).
 */
export function itemKey(instanceId: number, uri: string): string {
  return `${instanceId}|${uri}`;
}
