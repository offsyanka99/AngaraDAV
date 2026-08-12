/** Access badges + import result labels (Phase 8). */
import type { ImportResult } from "../api";
import { esc } from "../ui";

export function accessBadge(access: string): string {
  if (access === "readwrite") {
    return '<span class="badge badge-admin">full access</span>';
  }
  if (access === "read") {
    return '<span class="badge">read-only</span>';
  }
  if (access === "owner") {
    return '<span class="badge badge-ok">owner</span>';
  }
  return `<span class="badge">${esc(access)}</span>`;
}

export function formatImportResult(r: ImportResult): string {
  const parts = [
    `${r.imported} new`,
    `${r.updated} updated`,
  ];
  if (r.skipped > 0) parts.push(`${r.skipped} skipped`);
  return parts.join(", ");
}

