/**
 * Storage path helpers (Phase 1 extract from app.ts).
 */

/** Join parent + relative segments into a storage path (no leading/trailing slash). */
export function joinStoragePath(...parts: string[]): string {
  return parts
    .map((p) => p.replace(/\\/g, "/").replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
}

export function basenamePath(path: string): string {
  const parts = path.replace(/\\/g, "/").split("/").filter(Boolean);
  return parts[parts.length - 1] || path;
}
