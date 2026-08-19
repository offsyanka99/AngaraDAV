/**
 * Client-side Files list search, sort, and type filter.
 */
import type { FileEntry } from "../../api";
import { classifyFilesPreview, extensionOf } from "./previewKind.ts";

export type FilesTypeFilter =
  | "all"
  | "folder"
  | "file"
  | "image"
  | "document"
  | "audio"
  | "video"
  | "archive"
  | "other";

export type FilesSort = "name" | "size" | "mtime";

const ARCHIVE_EXT = new Set(["zip", "tar", "gz", "tgz", "bz2", "7z", "rar", "xz"]);

export const FILES_TYPE_FILTERS: { value: FilesTypeFilter; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "folder", label: "Folders" },
  { value: "file", label: "Files" },
  { value: "image", label: "Images" },
  { value: "document", label: "Documents" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
  { value: "archive", label: "Archives" },
  { value: "other", label: "Other" },
];

export function fileTypeBucket(entry: FileEntry): Exclude<FilesTypeFilter, "all" | "file"> {
  if (entry.type === "dir") return "folder";
  const kind = classifyFilesPreview(entry.name);
  if (kind === "image") return "image";
  if (kind === "pdf" || kind === "office" || kind === "text") return "document";
  if (kind === "audio") return "audio";
  if (kind === "video") return "video";
  if (ARCHIVE_EXT.has(extensionOf(entry.name))) return "archive";
  return "other";
}

export function entryMatchesType(entry: FileEntry, filter: FilesTypeFilter): boolean {
  if (filter === "all") return true;
  if (filter === "file") return entry.type === "file";
  return fileTypeBucket(entry) === filter;
}

export function filterAndSortEntries(
  entries: FileEntry[],
  opts: {
    search: string;
    type: FilesTypeFilter;
    sort: FilesSort;
    order: "asc" | "desc";
  },
): FileEntry[] {
  const q = opts.search.trim().toLowerCase();
  let out = entries.filter((e) => {
    if (!entryMatchesType(e, opts.type)) return false;
    if (q && !e.name.toLowerCase().includes(q)) return false;
    return true;
  });
  const dir = opts.order === "desc" ? -1 : 1;
  out = out.slice().sort((a, b) => {
    if (opts.sort === "name") {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return dir * a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    }
    if (opts.sort === "size") {
      if (a.type !== b.type) return a.type === "dir" ? 1 : -1;
      if (a.size !== b.size) return dir * (a.size - b.size);
      return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
    }
    if (a.mtime !== b.mtime) return dir * (a.mtime - b.mtime);
    return a.name.localeCompare(b.name, undefined, { sensitivity: "base" });
  });
  return out;
}
