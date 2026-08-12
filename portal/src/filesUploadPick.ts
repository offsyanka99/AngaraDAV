/**
 * Files tab upload picking helpers.
 *
 * Strategy (progressive enhancement):
 * 1. File System Access API when available (Chromium; growing Safari support)
 * 2. Classic <input type="file"> / webkitdirectory (Safari, Firefox, all others)
 * 3. Drag-and-drop: prefer getAsFileSystemHandle(), then webkitGetAsEntry(), then FileList
 *
 * Browsers still have no single native dialog for mixed loose files + folder trees;
 * browse stays two modes; drop can mix both.
 */

export type FilesUploadItem = {
  file: File | null;
  /** Path relative to current folder, e.g. "docs/a.txt" or "docs/sub" for empty dir. */
  relativePath: string;
  /** When true, only ensure the directory exists (no file body). */
  isEmptyDir?: boolean;
};

/** Result of an FSA / picker attempt before falling back to <input>. */
export type FilesPickResult =
  | { kind: "items"; items: FilesUploadItem[] }
  | { kind: "cancel" }
  | { kind: "fallback" };

type WindowWithPickers = Window & {
  showOpenFilePicker?: (options?: {
    multiple?: boolean;
    excludeAcceptAllOption?: boolean;
    types?: Array<{ description?: string; accept: Record<string, string[]> }>;
  }) => Promise<FileSystemFileHandle[]>;
  showDirectoryPicker?: (options?: {
    id?: string;
    mode?: "read" | "readwrite";
    startIn?: "desktop" | "documents" | "downloads" | "music" | "pictures" | "videos";
  }) => Promise<FileSystemDirectoryHandle>;
};

type DataTransferItemWithHandles = DataTransferItem & {
  getAsFileSystemHandle?: () => Promise<FileSystemHandle | null>;
  webkitGetAsEntry?: () => FileSystemEntry | null;
};

function joinRel(...parts: string[]): string {
  return parts
    .map((p) => p.replace(/\\/g, "/").replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
}

export function supportsShowOpenFilePicker(): boolean {
  return typeof (window as WindowWithPickers).showOpenFilePicker === "function";
}

export function supportsShowDirectoryPicker(): boolean {
  return typeof (window as WindowWithPickers).showDirectoryPicker === "function";
}

function isAbortError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const name = (e as { name?: string }).name;
  return name === "AbortError" || name === "NotAllowedError";
}

/** Build upload items from a plain multi-file picker (no relative tree). */
export function itemsFromFileList(
  list: FileList | File[],
  _preferRelative: boolean = true,
): FilesUploadItem[] {
  const files = Array.from(list);
  return files.map((file) => {
    // Always prefer webkitRelativePath when the browser provides it (folder picks /
    // some drops). Ignoring it flattens trees to basenames and causes false
    // "already exists" conflicts against unrelated root files with the same name.
    const fromWebkit = (file.webkitRelativePath || "").replace(/\\/g, "/").replace(/^\/+/, "");
    const rel = fromWebkit || file.name;
    return { file, relativePath: rel || file.name };
  });
}

/** Read all entries from a directory reader (Chrome returns batches). */
function readAllDirectoryEntries(reader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const all: FileSystemEntry[] = [];
    const readBatch = () => {
      reader.readEntries(
        (batch) => {
          if (!batch.length) {
            resolve(all);
            return;
          }
          all.push(...batch);
          readBatch();
        },
        (err) => reject(err),
      );
    };
    readBatch();
  });
}

function fileFromEntry(entry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    entry.file(resolve, reject);
  });
}

/**
 * Walk a dropped FileSystemEntry tree into upload items with relative paths.
 * Empty directories become mkdir-only markers so the tree is preserved.
 */
async function walkFileSystemEntry(
  entry: FileSystemEntry,
  parentRel: string,
): Promise<FilesUploadItem[]> {
  const rel = joinRel(parentRel, entry.name);
  if (entry.isFile) {
    const file = await fileFromEntry(entry as FileSystemFileEntry);
    return [{ file, relativePath: rel || entry.name }];
  }
  if (entry.isDirectory) {
    const reader = (entry as FileSystemDirectoryEntry).createReader();
    const children = await readAllDirectoryEntries(reader);
    if (children.length === 0) {
      return [{ file: null, relativePath: rel, isEmptyDir: true }];
    }
    const out: FilesUploadItem[] = [];
    for (const child of children) {
      out.push(...(await walkFileSystemEntry(child, rel)));
    }
    return out;
  }
  return [];
}

/**
 * Async iteration over a directory handle.
 * DOM lib typings vary (values/entries may be missing); runtime feature-detect.
 */
type DirHandleIterable = FileSystemDirectoryHandle & {
  values?: () => AsyncIterableIterator<FileSystemHandle>;
  entries?: () => AsyncIterableIterator<[string, FileSystemHandle]>;
};

async function* iterateDirectoryHandles(
  dirHandle: FileSystemDirectoryHandle,
): AsyncGenerator<FileSystemHandle> {
  const h = dirHandle as DirHandleIterable;
  if (typeof h.values === "function") {
    for await (const entry of h.values()) {
      yield entry;
    }
    return;
  }
  if (typeof h.entries === "function") {
    for await (const [, entry] of h.entries()) {
      yield entry;
    }
  }
}

/**
 * Walk a FileSystemDirectoryHandle (File System Access API) into upload items.
 * Includes the directory's own name as the top segment (matches webkitRelativePath).
 */
export async function walkDirectoryHandle(
  dirHandle: FileSystemDirectoryHandle,
  parentRel: string,
): Promise<FilesUploadItem[]> {
  const thisRel = joinRel(parentRel, dirHandle.name);
  const out: FilesUploadItem[] = [];
  let childCount = 0;

  for await (const entry of iterateDirectoryHandles(dirHandle)) {
    childCount += 1;
    if (entry.kind === "file") {
      const file = await (entry as FileSystemFileHandle).getFile();
      out.push({ file, relativePath: joinRel(thisRel, entry.name) || file.name });
    } else if (entry.kind === "directory") {
      out.push(...(await walkDirectoryHandle(entry as FileSystemDirectoryHandle, thisRel)));
    }
  }

  if (childCount === 0) {
    // Empty folder, or handle without iterable API — still create the dir.
    out.push({ file: null, relativePath: thisRel, isEmptyDir: true });
  }
  return out;
}

/**
 * Prefer FSA file picker; returns "fallback" when unavailable or security-blocked
 * so the caller can open a classic <input type="file" multiple>.
 */
export async function pickFilesForUpload(): Promise<FilesPickResult> {
  const w = window as WindowWithPickers;
  if (typeof w.showOpenFilePicker !== "function") {
    return { kind: "fallback" };
  }
  try {
    const handles = await w.showOpenFilePicker({ multiple: true });
    if (!handles || handles.length === 0) return { kind: "cancel" };
    const items: FilesUploadItem[] = [];
    for (const handle of handles) {
      const file = await handle.getFile();
      items.push({ file, relativePath: file.name });
    }
    return { kind: "items", items };
  } catch (e) {
    if (isAbortError(e)) return { kind: "cancel" };
    // SecurityError / TypeError in restricted contexts → classic input
    return { kind: "fallback" };
  }
}

/**
 * Prefer FSA directory picker; returns "fallback" for Safari/Firefox without it.
 */
export async function pickFolderForUpload(): Promise<FilesPickResult> {
  const w = window as WindowWithPickers;
  if (typeof w.showDirectoryPicker !== "function") {
    return { kind: "fallback" };
  }
  try {
    const dir = await w.showDirectoryPicker({ mode: "read" });
    const items = await walkDirectoryHandle(dir, "");
    if (items.length === 0) return { kind: "cancel" };
    return { kind: "items", items };
  } catch (e) {
    if (isAbortError(e)) return { kind: "cancel" };
    return { kind: "fallback" };
  }
}

function normalizeRelPath(rel: string): string {
  return rel.replace(/\\/g, "/").replace(/^\/+/, "").replace(/\/+$/, "");
}

/**
 * Resolve a DataTransfer drop into upload items.
 *
 * Chromium often yields directory handles for selected folders via `items`, while
 * sibling loose files only appear reliably on `dt.files`. Returning early after
 * walking the folder used to drop those root-level files — merge both sources.
 */
export async function itemsFromDataTransfer(dt: DataTransfer): Promise<FilesUploadItem[]> {
  const rawItems = dt.items ? Array.from(dt.items) : [];
  const fromItems: FilesUploadItem[] = [];

  for (const item of rawItems) {
    if (item.kind !== "file") continue;
    const anyItem = item as DataTransferItemWithHandles;

    // 1) File System Access handles (Chromium; some Safari builds)
    if (typeof anyItem.getAsFileSystemHandle === "function") {
      try {
        const handle = await anyItem.getAsFileSystemHandle();
        if (handle) {
          if (handle.kind === "file") {
            const file = await (handle as FileSystemFileHandle).getFile();
            fromItems.push({ file, relativePath: file.name });
          } else if (handle.kind === "directory") {
            fromItems.push(...(await walkDirectoryHandle(handle as FileSystemDirectoryHandle, "")));
          }
          continue;
        }
      } catch {
        // Fall through to entry path
      }
    }

    // 2) Legacy directory entries (widely supported, including Firefox/Safari)
    if (typeof anyItem.webkitGetAsEntry === "function") {
      const entry = anyItem.webkitGetAsEntry();
      if (entry) {
        fromItems.push(...(await walkFileSystemEntry(entry, "")));
        continue;
      }
    }
  }

  // 3) Always merge FileList — loose files next to a dropped folder often only
  // appear here (and folder children may also appear with webkitRelativePath).
  const fromList =
    dt.files && dt.files.length > 0 ? itemsFromFileList(dt.files, true) : [];

  // Prefer handle/entry walks (full tree + empty dirs); fill gaps from FileList
  // (root-level files that never got a DataTransferItem handle).
  const byRel = new Map<string, FilesUploadItem>();
  for (const it of fromList) {
    const key = normalizeRelPath(it.relativePath || it.file?.name || "");
    if (!key) continue;
    byRel.set(key, it);
  }
  for (const it of fromItems) {
    const key = normalizeRelPath(it.relativePath || it.file?.name || "");
    if (!key && it.isEmptyDir) {
      // keep empty-dir markers under their path
      const k = normalizeRelPath(it.relativePath);
      if (k) byRel.set(k, it);
      continue;
    }
    if (!key) continue;
    byRel.set(key, it);
  }

  return Array.from(byRel.values());
}

/** True when a drag event may carry files (for drop-target highlighting). */
export function dataTransferHasFiles(dt: DataTransfer | null): boolean {
  if (!dt) return false;
  if (dt.types && typeof dt.types.includes === "function") {
    return dt.types.includes("Files");
  }
  // Legacy DOMStringList
  try {
    for (let i = 0; i < dt.types.length; i++) {
      if (dt.types[i] === "Files") return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}
