/**
 * Files upload menu, progress, and batch upload (Phase 4).
 */
import { api, ApiError } from "../../api";
import { log } from "../../log";
import { esc, renderFlash, renderModal, renderModalFooter } from "../../ui";
import {
  itemsFromFileList,
  pickFilesForUpload,
  pickFolderForUpload,
  type FilesUploadItem,
} from "../../filesUploadPick";
import type { FilesUploadProgress } from "../context";
import { formatElapsed, formatFileSize } from "../format";
import { joinStoragePath } from "../paths";
import type { FilesHost } from "./host";
import { loadFiles } from "./loaders";
import { closeFilesPreview } from "./preview";
import { resetFilesTransferTree } from "./transfer";

export function unbindFilesUploadMenuOutside(host: FilesHost): void {
  if (host.state.filesUploadMenuDocClick) {
    document.removeEventListener("click", host.state.filesUploadMenuDocClick, true);
    host.state.filesUploadMenuDocClick = null;
  }
}

export function bindFilesUploadMenuOutside(host: FilesHost): void {
  unbindFilesUploadMenuOutside(host);
  host.state.filesUploadMenuDocClick = (ev: MouseEvent) => {
    const t = ev.target as HTMLElement | null;
    if (t?.closest?.(".files-upload-menu")) return;
    host.state.filesUploadMenuOpen = false;
    unbindFilesUploadMenuOutside(host);
    host.render();
  };
  const handler = host.state.filesUploadMenuDocClick;
  setTimeout(() => {
    if (host.state.filesUploadMenuOpen && host.state.filesUploadMenuDocClick === handler) {
      document.addEventListener("click", handler, true);
    }
  }, 0);
}

export function stopFilesUploadElapsedTimer(host: FilesHost): void {
  if (host.state.filesUploadElapsedTimer !== null) {
    clearInterval(host.state.filesUploadElapsedTimer);
    host.state.filesUploadElapsedTimer = null;
  }
}

export function startFilesUploadElapsedTimer(host: FilesHost): void {
  stopFilesUploadElapsedTimer(host);
  host.state.filesUploadElapsedTimer = setInterval(() => {
    if (
      !host.state.filesUploadProgress ||
      host.state.filesUploadProgress.phase === "done" ||
      host.state.filesUploadProgress.phase === "error"
    ) {
      stopFilesUploadElapsedTimer(host);
      return;
    }
    host.state.filesUploadProgress = {
      ...host.state.filesUploadProgress,
      elapsedSec: Math.floor((Date.now() - host.state.filesUploadProgress.startedAt) / 1000),
    };
    updateFilesUploadProgressDom(host, host.state.filesUploadProgress);
  }, 1000);
}

export function closeFilesUploadProgress(host: FilesHost): void {
  stopFilesUploadElapsedTimer(host);
  host.state.filesUploadProgress = null;
  host.render();
}

export function filesUploadBarPercent(_host: FilesHost, p: FilesUploadProgress): number | null {
  if (p.bytesTotal > 0) {
    return Math.min(100, Math.max(0, Math.round((100 * p.bytesSent) / p.bytesTotal)));
  }
  if (p.totalFiles > 0) {
    return Math.min(
      100,
      Math.max(0, Math.round((100 * p.completedFiles) / p.totalFiles)),
    );
  }
  return null;
}

export function updateFilesUploadProgressDom(host: FilesHost, p: FilesUploadProgress): void {
  if (!host.root.querySelector("[data-files-upload-progress]")) return;
  const bar = host.root.querySelector<HTMLElement>(".files-upload-progress-bar");
  const track = host.root.querySelector<HTMLElement>(".files-upload-progress-track");
  const status = host.root.querySelector<HTMLElement>("[data-files-upload-status]");
  const current = host.root.querySelector<HTMLElement>("[data-files-upload-current]");
  const pct = filesUploadBarPercent(host, p);
  const statusLine =
    p.phase === "uploading"
      ? `Uploading ${p.completedFiles.toLocaleString()} / ${p.totalFiles.toLocaleString()} file${p.totalFiles === 1 ? "" : "s"}${
          p.failedFiles ? ` · ${p.failedFiles} failed` : ""
        }${pct !== null ? ` (${pct}%)` : ""} · ${formatElapsed(p.elapsedSec)}`
      : status?.textContent || "";
  if (status && p.phase === "uploading") status.textContent = statusLine;
  if (current && p.phase === "uploading") {
    current.textContent = p.currentName || "";
    current.title = p.currentName || "";
  }
  if (bar && pct !== null) {
    bar.classList.remove("is-indeterminate");
    bar.style.width = `${pct}%`;
  }
  if (track && pct !== null) {
    track.setAttribute("aria-valuenow", String(pct));
    track.removeAttribute("aria-valuetext");
  }
}

export function renderFilesUploadProgressModal(host: FilesHost): string {
  if (!host.state.filesUploadProgress) return "";
  const p = host.state.filesUploadProgress;
  const running = p.phase === "uploading";
  const title =
    p.phase === "done"
      ? "Upload finished"
      : p.phase === "error"
        ? "Upload failed"
        : "Uploading…";
  const pct = filesUploadBarPercent(host, p);
  const barClass =
    pct === null ? "files-upload-progress-bar is-indeterminate" : "files-upload-progress-bar";
  const barStyle = pct !== null ? ` style="width:${pct}%"` : "";
  let body = "";
  if (running) {
    const statusLine = `Uploading ${p.completedFiles.toLocaleString()} / ${p.totalFiles.toLocaleString()} file${
      p.totalFiles === 1 ? "" : "s"
    }${p.failedFiles ? ` · ${p.failedFiles} failed` : ""}${
      pct !== null ? ` (${pct}%)` : ""
    } · ${formatElapsed(p.elapsedSec)}`;
    const sizeLine =
      p.bytesTotal > 0
        ? `${formatFileSize(p.bytesSent)} / ${formatFileSize(p.bytesTotal)}`
        : "";
    body = `
      <p class="muted small" style="margin:0 0 0.75rem">
        Uploading to
        <span class="mono">${esc(host.state.filesPath === "" ? "Home" : host.state.filesPath)}</span>
        ${sizeLine ? ` · <span class="muted">${esc(sizeLine)}</span>` : ""}
      </p>
      <div class="import-progress-track files-upload-progress-track" role="progressbar"
        aria-valuemin="0" aria-valuemax="100"
        ${pct !== null ? `aria-valuenow="${pct}"` : 'aria-valuetext="In progress"'}
        aria-label="Upload progress">
        <div class="${barClass}"${barStyle}></div>
      </div>
      <p class="import-status-line" data-files-upload-status>${esc(statusLine)}</p>
      <p class="muted small mono files-upload-current" data-files-upload-current title="${esc(p.currentName)}">${esc(p.currentName)}</p>
      <p class="muted small">Keep this tab open until the upload finishes.</p>`;
  } else if (p.phase === "done") {
    body = `
      ${renderFlash("success", p.resultMessage || "Upload completed.", {
        className: "import-result",
        style: "margin:0 0 1rem",
      })}
      <p class="muted small" style="margin:0">Took ${esc(formatElapsed(p.elapsedSec))}</p>`;
  } else {
    const samples =
      p.errorSamples.length > 0
        ? `<ul class="files-upload-error-list muted small">${p.errorSamples
            .slice(0, 8)
            .map((e) => `<li>${esc(e)}</li>`)
            .join("")}${
            p.errorSamples.length > 8
              ? `<li>…and ${p.errorSamples.length - 8} more</li>`
              : ""
          }</ul>`
        : "";
    body = `
      ${renderFlash("error", p.resultMessage || "Upload failed.", {
        className: "import-result",
        style: "margin:0 0 1rem",
      })}
      ${samples}
      <p class="muted small" style="margin:0.75rem 0 0">After ${esc(formatElapsed(p.elapsedSec))}</p>`;
  }
  const footer = running
    ? `<p class="muted small" style="margin:0">Please wait…</p>`
    : renderModalFooter([
        { label: "Close", action: "close-files-upload-progress", variant: "primary" },
      ]);
  return renderModal({
    title,
    titleId: "files-upload-progress-title",
    closeAction: "close-files-upload-progress",
    size: "sm",
    className: "import-progress-modal files-upload-progress-modal",
    cardClassName: "import-progress-card",
    rootAttrs: "data-files-upload-progress",
    hideClose: running,
    lockBackdrop: running,
    body,
    footer,
  });
}

export async function ensureNestedDirectories(
  _host: FilesHost,
  basePath: string,
  relativeDir: string,
  created: Set<string>,
): Promise<void> {
  const segments = relativeDir
    .replace(/\\/g, "/")
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean);
  let parent = basePath;
  for (const name of segments) {
    const full = joinStoragePath(parent, name);
    if (created.has(full)) {
      parent = full;
      continue;
    }
    try {
      await api.filesMkdir(parent, name);
      log.event("files.mkdir", { path: parent, name, via: "upload-folder" });
    } catch (e) {
      // Folder already present from a previous upload or concurrent create
      if (!(e instanceof ApiError && e.status === 409)) {
        throw e;
      }
    }
    created.add(full);
    parent = full;
  }
}

export function clickHiddenUploadInput(host: FilesHost, kind: "files" | "folder"): void {
  const sel =
    kind === "files"
      ? 'input[type="file"][data-action="files-upload-pick-files"]'
      : 'input[type="file"][data-action="files-upload-pick-folder"]';
  host.root.querySelector<HTMLInputElement>(sel)?.click();
}

export async function startFilesUploadBrowse(host: FilesHost, kind: "files" | "folder"): Promise<void> {
  if (host.state.busy || host.state.filesUploadProgress) return;
  host.state.filesUploadMenuOpen = false;
  unbindFilesUploadMenuOutside(host);
  // Close other files dialogs so pickers are not stacked under modals
  host.state.filesRenamePath = null;
  host.state.filesDeletePaths = null;
  resetFilesTransferTree(host);
  host.state.filesMkdirOpen = false;
  closeFilesPreview(host);

  const pick = kind === "files" ? pickFilesForUpload : pickFolderForUpload;
  try {
    const result = await pick();
    if (result.kind === "cancel") {
      host.render();
      return;
    }
    if (result.kind === "items") {
      if (result.items.length === 0) {
        host.setFlash("info", kind === "folder" ? "Folder is empty" : "No files selected");
        host.render();
        return;
      }
      await startFilesUpload(host, result.items);
      return;
    }
    // fallback: classic input (Safari/Firefox and restricted contexts)
    host.render();
    // Defer so the re-render commits before the OS dialog opens
    requestAnimationFrame(() => {
      clickHiddenUploadInput(host, kind);
    });
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Could not open picker");
    host.render();
  }
}

/** Destination key: parentPath + "\0" + fileName (parentPath may be ""). */
function uploadDestKey(parentPath: string, fileName: string): string {
  return `${parentPath}\0${fileName}`;
}

type PlannedUpload = {
  item: FilesUploadItem;
  file: File;
  fileName: string;
  parentPath: string;
  displayName: string;
  relDir: string;
};

function planFileUploads(destBase: string, fileItems: FilesUploadItem[]): PlannedUpload[] {
  return fileItems.map((item) => {
    const file = item.file!;
    const rel = (item.relativePath || file.name).replace(/\\/g, "/");
    const parts = rel.split("/").filter(Boolean);
    const fileName = parts.pop() || file.name;
    const relDir = parts.join("/");
    const parentPath = joinStoragePath(destBase, relDir);
    return {
      item,
      file,
      fileName,
      parentPath,
      displayName: rel || fileName,
      relDir,
    };
  });
}

/**
 * Drop duplicate destinations within the same batch (keep first).
 * Flat drops of two folders can yield the same basename at the same parent.
 */
function dedupePlannedByDest(planned: PlannedUpload[]): PlannedUpload[] {
  const seen = new Set<string>();
  const out: PlannedUpload[] = [];
  for (const p of planned) {
    const key = uploadDestKey(p.parentPath, p.fileName);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

/**
 * List which planned uploads would overwrite an existing **file**
 * (or clash with an existing folder name at the same path).
 *
 * Important: only names in the **same parent folder** count. Nested files under
 * `Folder/` must list `Folder/`, not the current view root — otherwise every
 * basename that also exists at root is a false conflict and "Skip existing"
 * drops the whole batch.
 */
export async function findUploadConflicts(
  _destBase: string,
  planned: PlannedUpload[],
): Promise<PlannedUpload[]> {
  if (planned.length === 0) return [];
  const byParent = new Map<string, PlannedUpload[]>();
  for (const p of planned) {
    const list = byParent.get(p.parentPath) ?? [];
    list.push(p);
    byParent.set(p.parentPath, list);
  }
  const conflicts: PlannedUpload[] = [];
  for (const [parentPath, group] of byParent) {
    /** name → "file" | "dir" in this parent only */
    let byName = new Map<string, "file" | "dir">();
    try {
      const res = await api.filesList(parentPath);
      byName = new Map();
      for (const e of res.entries) {
        if (e.type === "file" || e.type === "dir") {
          byName.set(e.name, e.type);
        }
      }
    } catch {
      // Parent may not exist yet (nested folder upload) → no conflicts there
      byName = new Map();
    }
    for (const p of group) {
      // Server conflict only when that name already exists in this parent folder
      if (byName.has(p.fileName)) {
        conflicts.push(p);
      }
    }
  }
  conflicts.sort((a, b) => a.displayName.localeCompare(b.displayName));
  return conflicts;
}

/** Holds File objects between conflict modal and upload start (not serializable into AppState). */
type PendingUploadConflict = {
  planned: PlannedUpload[];
  emptyDirs: FilesUploadItem[];
  destBase: string;
  /** Dest keys that already exist (same as state.filesUploadConflict.conflictKeys). */
  conflictKeys: string[];
};

/** Keyed by AppState so re-renders / HMR never orphan the File batch. */
const pendingByState = new WeakMap<object, PendingUploadConflict>();

function clearPendingUploadConflict(host?: FilesHost): void {
  if (host) {
    pendingByState.delete(host.state);
    host.state.filesUploadConflict = null;
  }
}

/**
 * User chose a conflict resolution from the portal modal.
 */
export function resolveFilesUploadConflict(
  host: FilesHost,
  choice: "overwrite" | "skip" | "cancel",
): void {
  const pending = pendingByState.get(host.state);
  const conflictMeta = host.state.filesUploadConflict;

  if (choice === "cancel") {
    clearPendingUploadConflict(host);
    host.setFlash("info", "Upload cancelled");
    host.render();
    return;
  }

  if (!pending) {
    // Modal open but File batch lost (should not happen) — close cleanly
    host.state.filesUploadConflict = null;
    host.setFlash("error", "Upload session expired — drop or choose the files again");
    host.render();
    return;
  }

  // Prefer keys stored on state (survives identity issues); fall back to pending
  const conflictKeys = new Set(
    (conflictMeta?.conflictKeys?.length ? conflictMeta.conflictKeys : pending.conflictKeys) ?? [],
  );

  let planned = pending.planned;
  let overwriteKeys = new Set<string>();
  let skipped = 0;

  if (choice === "overwrite") {
    overwriteKeys = new Set(conflictKeys);
  } else {
    // Skip ONLY destinations that already exist — keep every other planned file.
    const kept: PlannedUpload[] = [];
    for (const p of pending.planned) {
      const key = uploadDestKey(p.parentPath, p.fileName);
      if (conflictKeys.has(key)) {
        skipped += 1;
      } else {
        kept.push(p);
      }
    }
    planned = kept;
    log.event("files.upload.skip_existing", {
      skipped,
      remaining: planned.length,
      total: pending.planned.length,
      conflictKeys: conflictKeys.size,
    });
    if (planned.length === 0 && pending.emptyDirs.length === 0) {
      clearPendingUploadConflict(host);
      host.setFlash(
        "info",
        skipped === 1
          ? "Nothing to upload — the selected file already exists"
          : `Nothing to upload — all ${skipped} selected files already exist`,
      );
      host.render();
      return;
    }
  }

  const destBase = pending.destBase;
  const emptyDirs = pending.emptyDirs;
  clearPendingUploadConflict(host);
  void executeFilesUpload(host, planned, emptyDirs, destBase, overwriteKeys);
}

export async function startFilesUpload(host: FilesHost, items: FilesUploadItem[]): Promise<void> {
  if (items.length === 0) return;
  if (host.state.filesUploadProgress || host.state.filesUploadConflict) return;
  host.state.filesUploadMenuOpen = false;
  unbindFilesUploadMenuOutside(host);
  host.state.filesUploadDropActive = false;
  closeFilesPreview(host);

  const fileItems = items.filter((it) => it.file && !it.isEmptyDir);
  const emptyDirs = items.filter((it) => it.isEmptyDir && it.relativePath);
  const destBase = host.state.filesPath;
  const planned = dedupePlannedByDest(planFileUploads(destBase, fileItems));

  log.event("files.upload.plan", {
    destBase: destBase || "/",
    files: planned.length,
    emptyDirs: emptyDirs.length,
    sample: planned.slice(0, 5).map((p) => ({
      display: p.displayName,
      parent: p.parentPath || "/",
      name: p.fileName,
    })),
  });

  // Verify destinations before starting progress / network work.
  // Clear banners first so a leftover success/error flash does not appear
  // above the conflict modal while we list the destination.
  if (planned.length > 0) {
    host.state.busy = true;
    host.clearFlash();
    host.render();
    try {
      const conflicts = await findUploadConflicts(destBase, planned);
      if (conflicts.length > 0) {
        const conflictKeys = conflicts.map((c) => uploadDestKey(c.parentPath, c.fileName));
        pendingByState.set(host.state, {
          planned,
          emptyDirs,
          destBase,
          conflictKeys,
        });
        host.state.filesUploadConflict = {
          names: conflicts.map((c) => c.displayName),
          totalFiles: planned.length,
          conflictCount: conflicts.length,
          conflictKeys,
        };
        log.event("files.upload.conflicts", {
          total: planned.length,
          conflicts: conflicts.length,
          names: conflicts.slice(0, 12).map((c) => c.displayName),
        });
        host.state.busy = false;
        host.render();
        return;
      }
    } catch (e) {
      host.state.busy = false;
      host.setFlash("error", e instanceof Error ? e.message : "Could not check existing files");
      host.render();
      return;
    }
  }

  await executeFilesUpload(host, planned, emptyDirs, destBase, new Set());
}

async function executeFilesUpload(
  host: FilesHost,
  planned: PlannedUpload[],
  emptyDirs: FilesUploadItem[],
  destBase: string,
  overwriteKeys: Set<string>,
): Promise<void> {
  const bytesTotal = planned.reduce((sum, p) => sum + (p.file.size || 0), 0);
  const startedAt = Date.now();
  const totalWork = planned.length + emptyDirs.length;
  host.state.filesUploadProgress = {
    phase: "uploading",
    totalFiles: Math.max(planned.length, 1),
    completedFiles: 0,
    failedFiles: 0,
    currentName: planned[0]?.displayName || emptyDirs[0]?.relativePath || "",
    bytesTotal,
    bytesSent: 0,
    startedAt,
    elapsedSec: 0,
    resultMessage: null,
    errorSamples: [],
  };
  host.state.busy = true;
  host.clearFlash();
  startFilesUploadElapsedTimer(host);
  host.render();

  let ok = 0;
  const errors: string[] = [];
  const createdDirs = new Set<string>();
  let bytesCompleted = 0;
  let overwritten = 0;

  try {
    // Empty folders first (mkdir only)
    for (const dir of emptyDirs) {
      const rel = dir.relativePath.replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
      if (!rel) continue;
      if (host.state.filesUploadProgress) {
        host.state.filesUploadProgress = {
          ...host.state.filesUploadProgress,
          currentName: rel + "/",
          elapsedSec: Math.floor((Date.now() - startedAt) / 1000),
        };
        updateFilesUploadProgressDom(host, host.state.filesUploadProgress);
      }
      try {
        await ensureNestedDirectories(host, destBase, rel, createdDirs);
      } catch (e) {
        errors.push(`${rel}/: ${e instanceof Error ? e.message : "failed"}`);
      }
    }

    for (const plan of planned) {
      const { file, fileName, parentPath, displayName, relDir } = plan;

      if (host.state.filesUploadProgress) {
        host.state.filesUploadProgress = {
          ...host.state.filesUploadProgress,
          currentName: displayName,
          bytesSent: bytesCompleted,
          elapsedSec: Math.floor((Date.now() - startedAt) / 1000),
        };
        updateFilesUploadProgressDom(host, host.state.filesUploadProgress);
      }

      try {
        if (relDir) {
          await ensureNestedDirectories(host, destBase, relDir, createdDirs);
        }
        const replace = overwriteKeys.has(uploadDestKey(parentPath, fileName));
        await api.filesUpload(parentPath, file, {
          // Only overwrite when the user confirmed a conflict; never force-replace unknowns
          // (server rejects replace=true when the file is missing).
          replace,
          onProgress: (loaded, total) => {
            if (!host.state.filesUploadProgress || host.state.filesUploadProgress.phase !== "uploading") return;
            const fileTotal = total > 0 ? total : file.size;
            host.state.filesUploadProgress = {
              ...host.state.filesUploadProgress,
              currentName: displayName,
              bytesSent: bytesCompleted + Math.min(loaded, fileTotal || loaded),
              elapsedSec: Math.floor((Date.now() - startedAt) / 1000),
            };
            updateFilesUploadProgressDom(host, host.state.filesUploadProgress);
          },
        });
        log.event("files.upload", {
          path: parentPath,
          name: fileName,
          size: file.size,
          relativePath: displayName,
          replace,
        });
        ok += 1;
        if (replace) overwritten += 1;
        bytesCompleted += file.size || 0;
        if (host.state.filesUploadProgress) {
          host.state.filesUploadProgress = {
            ...host.state.filesUploadProgress,
            completedFiles: ok,
            failedFiles: errors.length,
            bytesSent: bytesCompleted,
          };
          updateFilesUploadProgressDom(host, host.state.filesUploadProgress);
        }
      } catch (e) {
        const msg = `${displayName}: ${e instanceof Error ? e.message : "failed"}`;
        errors.push(msg);
        bytesCompleted += file.size || 0;
        if (host.state.filesUploadProgress) {
          host.state.filesUploadProgress = {
            ...host.state.filesUploadProgress,
            completedFiles: ok,
            failedFiles: errors.length,
            bytesSent: bytesCompleted,
            errorSamples: errors.slice(0, 12),
          };
          updateFilesUploadProgressDom(host, host.state.filesUploadProgress);
        }
      }
    }

    await loadFiles(host);
    stopFilesUploadElapsedTimer(host);
    const elapsedSec = Math.floor((Date.now() - startedAt) / 1000);
    const totalFiles = planned.length;

    if (ok > 0 && errors.length === 0) {
      let msg =
        ok === 1
          ? "Uploaded 1 file"
          : `Uploaded ${ok} files`;
      if (overwritten > 0) {
        msg +=
          overwritten === 1
            ? " (1 overwritten)"
            : ` (${overwritten} overwritten)`;
      }
      host.state.filesUploadProgress = {
        phase: "done",
        totalFiles: Math.max(totalFiles, 1),
        completedFiles: ok,
        failedFiles: 0,
        currentName: "",
        bytesTotal,
        bytesSent: bytesTotal,
        startedAt,
        elapsedSec,
        resultMessage: msg,
        errorSamples: [],
      };
      host.setFlash("success", msg);
    } else if (ok > 0) {
      const msg = `Uploaded ${ok}; ${errors.length} failed. ${errors[0]}`;
      host.state.filesUploadProgress = {
        phase: "done",
        totalFiles: Math.max(totalFiles, 1),
        completedFiles: ok,
        failedFiles: errors.length,
        currentName: "",
        bytesTotal,
        bytesSent: bytesTotal,
        startedAt,
        elapsedSec,
        resultMessage: msg,
        errorSamples: errors.slice(0, 12),
      };
      host.setFlash("info", msg);
    } else if (totalWork > 0 && errors.length === 0 && emptyDirs.length > 0) {
      const msg =
        emptyDirs.length === 1
          ? "Created 1 empty folder"
          : `Created ${emptyDirs.length} empty folders`;
      host.state.filesUploadProgress = {
        phase: "done",
        totalFiles: 1,
        completedFiles: 0,
        failedFiles: 0,
        currentName: "",
        bytesTotal: 0,
        bytesSent: 0,
        startedAt,
        elapsedSec,
        resultMessage: msg,
        errorSamples: [],
      };
      host.setFlash("success", msg);
    } else {
      const msg = errors[0] || "Upload failed";
      host.state.filesUploadProgress = {
        phase: "error",
        totalFiles: Math.max(totalFiles, 1),
        completedFiles: 0,
        failedFiles: errors.length,
        currentName: "",
        bytesTotal,
        bytesSent: 0,
        startedAt,
        elapsedSec,
        resultMessage: msg,
        errorSamples: errors.slice(0, 12),
      };
      host.setFlash("error", msg);
    }
  } catch (e) {
    stopFilesUploadElapsedTimer(host);
    const msg = e instanceof Error ? e.message : "Upload failed";
    host.state.filesUploadProgress = {
      phase: "error",
      totalFiles: Math.max(planned.length, 1),
      completedFiles: ok,
      failedFiles: Math.max(errors.length, 1),
      currentName: "",
      bytesTotal,
      bytesSent: bytesCompleted,
      startedAt,
      elapsedSec: Math.floor((Date.now() - startedAt) / 1000),
      resultMessage: msg,
      errorSamples: errors.length ? errors.slice(0, 12) : [msg],
    };
    host.setFlash("error", msg);
  } finally {
    host.state.busy = false;
    host.render();
  }
}

export function onFilesUploadInput(host: FilesHost, input: HTMLInputElement, preferRelative: boolean): void {
  const list = input.files;
  if (!list || list.length === 0) return;
  const items = itemsFromFileList(list, preferRelative);
  input.value = "";
  void startFilesUpload(host, items);
}
