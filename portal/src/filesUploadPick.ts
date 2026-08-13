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
 * Synchronous capture of a drop's DataTransfer.
 *
 * Chromium invalidates DataTransferItemList after the first await (or after the
 * drop handler returns). Only the first file/folder was uploaded when we awaited
 * getAsFileSystemHandle() inside a loop. Call this **synchronously** in the drop
 * handler, then process the snapshot asynchronously.
 */
export type DropSnapshot = {
  /** One promise per file-kind item (may resolve null). Started synchronously. */
  handlePromises: Promise<FileSystemHandle | null>[];
  /** webkitGetAsEntry() results captured synchronously (parallel to handles). */
  entries: Array<FileSystemEntry | null>;
  /** FileList snapshot (may flatten multi-folder drops). */
  files: File[];
};

export function snapshotDataTransfer(dt: DataTransfer): DropSnapshot {
  const files = dt.files ? Array.from(dt.files) : [];
  const handlePromises: Promise<FileSystemHandle | null>[] = [];
  const entries: Array<FileSystemEntry | null> = [];

  const rawItems = dt.items ? Array.from(dt.items) : [];
  for (const item of rawItems) {
    if (item.kind !== "file") continue;
    const anyItem = item as DataTransferItemWithHandles;

    // Start handle resolution now — do not await between items
    if (typeof anyItem.getAsFileSystemHandle === "function") {
      handlePromises.push(
        anyItem.getAsFileSystemHandle().catch(() => null) as Promise<FileSystemHandle | null>,
      );
    } else {
      handlePromises.push(Promise.resolve(null));
    }

    // Entry API must also be called synchronously for every item
    let entry: FileSystemEntry | null = null;
    if (typeof anyItem.webkitGetAsEntry === "function") {
      try {
        entry = anyItem.webkitGetAsEntry();
      } catch {
        entry = null;
      }
    }
    entries.push(entry);
  }

  return { handlePromises, entries, files };
}

/**
 * Build upload items from a previously captured drop snapshot.
 */
export async function itemsFromDropSnapshot(snap: DropSnapshot): Promise<FilesUploadItem[]> {
  const fromItems: FilesUploadItem[] = [];
  const handles = await Promise.all(snap.handlePromises);

  for (let i = 0; i < Math.max(handles.length, snap.entries.length); i++) {
    const handle = handles[i] ?? null;
    if (handle) {
      try {
        if (handle.kind === "file") {
          const file = await (handle as FileSystemFileHandle).getFile();
          fromItems.push({ file, relativePath: file.name });
        } else if (handle.kind === "directory") {
          fromItems.push(
            ...(await walkDirectoryHandle(handle as FileSystemDirectoryHandle, "")),
          );
        }
        continue;
      } catch {
        // Fall through to entry for this index
      }
    }

    const entry = snap.entries[i];
    if (entry) {
      try {
        fromItems.push(...(await walkFileSystemEntry(entry, "")));
      } catch {
        /* skip broken entry */
      }
    }
  }

  // Merge FileList: fills root-level files that only appear there, and covers
  // browsers where handle/entry walks failed entirely.
  const fromList = itemsFromFileList(snap.files, true);

  const byRel = new Map<string, FilesUploadItem>();
  for (const it of fromList) {
    const key = normalizeRelPath(it.relativePath || it.file?.name || "");
    if (!key) continue;
    byRel.set(key, it);
  }
  for (const it of fromItems) {
    const key = normalizeRelPath(it.relativePath || it.file?.name || "");
    if (!key) continue;
    byRel.set(key, it); // prefer handle/entry tree over flat list
  }

  return Array.from(byRel.values());
}

/**
 * Resolve a live DataTransfer (snapshots first, then walks). Prefer calling
 * snapshotDataTransfer + itemsFromDropSnapshot from the sync drop handler.
 */
export async function itemsFromDataTransfer(dt: DataTransfer): Promise<FilesUploadItem[]> {
  return itemsFromDropSnapshot(snapshotDataTransfer(dt));
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
