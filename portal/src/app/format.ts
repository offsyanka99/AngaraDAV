/**
 * Display formatters (Phase 1 extract from app.ts).
 */
import { esc } from "../ui";

/** Truncate a user-facing label for flash banners (no HTML escape). */
export function flashLabel(title: string | null | undefined, maxLen = 80): string {
  const t = String(title ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return "";
  return t.length > maxLen ? `${t.slice(0, maxLen - 1)}…` : t;
}

/**
 * Success flash with optional quoted name — matches Address book style:
 * `Address book “My personal” created`
 */
export function entityFlash(
  kind: string,
  name: string | null | undefined,
  verb: "created" | "saved" | "updated" | "deleted",
): string {
  const label = flashLabel(name);
  return label ? `${kind} “${label}” ${verb}` : `${kind} ${verb}`;
}

/** Contact display name for flashes (fullname, or first+last, or fallback). */
export function contactFlashName(c: {
  displayname?: string | null;
  fullname?: string | null;
  firstname?: string | null;
  lastname?: string | null;
}): string {
  const full = flashLabel(c.displayname || c.fullname);
  if (full) return full;
  const parts = [c.firstname, c.lastname].map((p) => String(p ?? "").trim()).filter(Boolean);
  return parts.join(" ") || "Unnamed contact";
}

export function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatElapsed(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m > 0 ? `${m}m ${r}s` : `${r}s`;
}

export function formatBytes(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function formatMtime(ts: number): string {
  if (!ts) return "—";
  try {
    return new Date(ts * 1000).toLocaleString();
  } catch {
    return "—";
  }
}

export function sortHeader(
  label: string,
  col: string,
  current: string,
  order: "asc" | "desc",
  kind: "task" | "note",
  colClass = "",
): string {
  const active = current === col;
  const arrow = active ? (order === "asc" ? " ▲" : " ▼") : "";
  const cls = `sortable-th${active ? " is-sorted" : ""}${colClass ? " " + colClass : ""}`;
  return `<th class="${cls}" data-action="sort-${kind}" data-sort="${esc(col)}" role="columnheader" tabindex="0">${esc(label)}${arrow}</th>`;
}
