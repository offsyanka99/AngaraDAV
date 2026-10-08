/**
 * Decide whether a Files refresh should ask about an open preview.
 * A DAV PUT changes the file etag without closing the preview.
 */

export type PreviewStamp = {
  path: string;
  name: string;
  etag: string | null;
  /** Server version the user chose to keep viewing. */
  ignored: { kind: "changed"; etag: string } | { kind: "missing" } | null;
};

export type ListedPreviewFile = {
  path: string;
  type: string;
  etag?: string | null;
};

export type PreviewConflict =
  | { kind: "changed"; path: string; name: string; etag: string }
  | { kind: "missing"; path: string; name: string; etag: null }
  | { kind: "adopt"; path: string; etag: string };

function folderOf(path: string): string {
  const slash = path.lastIndexOf("/");
  return slash < 0 ? "" : path.slice(0, slash);
}

function sameFolder(folderPath: string, filePath: string): boolean {
  const folder = folderPath.replace(/\/+$/, "");
  return folderOf(filePath) === folder;
}

/**
 * Compare an open preview with the folder listing just loaded.
 * Returns null when the preview is for another folder, or the etag still matches.
 * `adopt` means the preview had no etag yet and should store the listing's.
 */
export function previewRefreshConflict(
  preview: PreviewStamp,
  folderPath: string,
  entries: ListedPreviewFile[],
): PreviewConflict | null {
  if (!sameFolder(folderPath, preview.path)) return null;
  const entry = entries.find((item) => item.path === preview.path && item.type === "file");
  if (!entry) {
    if (preview.ignored?.kind === "missing") return null;
    return { kind: "missing", path: preview.path, name: preview.name, etag: null };
  }
  const etag = typeof entry.etag === "string" && entry.etag !== "" ? entry.etag : null;
  if (preview.etag === null || preview.etag === "") {
    return etag ? { kind: "adopt", path: preview.path, etag } : null;
  }
  if (etag === null || etag === preview.etag) return null;
  if (preview.ignored?.kind === "changed" && preview.ignored.etag === etag) return null;
  return { kind: "changed", path: preview.path, name: preview.name, etag };
}
