/**
 * Pure selection / menu-content helpers for the Files item ⋮ menu.
 */
import type { FileEntry } from "../../api";

export type FilesItemMenuModel = {
  count: number;
  heading: string | null;
  showDownload: boolean;
  downloadItems: { path: string; name: string }[];
  renameEnabled: boolean;
  renamePath: string | null;
  renameName: string | null;
};

/** Unselected row becomes the exclusive selection; a selected row keeps the set. */
export function selectionAfterOpeningItemMenu(checked: string[], clickedPath: string): string[] {
  if (!clickedPath) return checked;
  if (checked.includes(clickedPath)) return checked;
  return [clickedPath];
}

export function filesItemMenuModel(
  entries: FileEntry[],
  selectedPaths: string[],
): FilesItemMenuModel {
  const byPath = new Map(entries.map((e) => [e.path, e]));
  const selected: FileEntry[] = [];
  for (const p of selectedPaths) {
    const e = byPath.get(p);
    if (e) selected.push(e);
  }
  const files = selected.filter((e) => e.type === "file");
  const count = selected.length;
  return {
    count,
    heading: count > 1 ? `${count} items` : null,
    showDownload: files.length > 0,
    downloadItems: files.map((e) => ({ path: e.path, name: e.name })),
    renameEnabled: count === 1,
    renamePath: count === 1 ? selected[0].path : null,
    renameName: count === 1 ? selected[0].name : null,
  };
}
