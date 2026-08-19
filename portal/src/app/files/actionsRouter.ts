/**
 * Files tab data-action router (Phase 4).
 */
import { api } from "../../api";
import { log } from "../../log";
import type { FilesHost } from "./host";
import { loadFiles } from "./loaders";
import {
  ensureFilesTreeChildren,
  isBlockedTransferDest,
  openFilesTransfer,
  resetFilesTransferTree,
} from "./transfer";
import {
  closeFilesItemMenu,
  downloadSelectedFiles,
  filesItemMenuBlocked,
  openFilesItemMenu,
} from "./itemMenu";
import { filesItemMenuModel } from "./itemMenuModel";
import { filterAndSortEntries } from "./listing";
import { closeFilesPreview, openFilesPreview } from "./preview";
import {
  closeFilesUploadProgress,
  resolveFilesUploadConflict,
  startFilesUploadBrowse,
  unbindFilesUploadMenuOutside,
} from "./upload";

/**
 * Handle a Files-tab action. Returns true if the action was recognized.
 */
export async function handleFilesAction(
  host: FilesHost,
  action: string,
  t: HTMLElement,
  ev: Event,
): Promise<boolean> {
  const { state } = host;

  if (action === "files-upload-menu-toggle") {
    if (state.busy || state.filesUploadProgress) return true;
    state.filesUploadMenuOpen = !state.filesUploadMenuOpen;
    if (state.filesUploadMenuOpen) {
      state.filesRenamePath = null;
      state.filesDeletePaths = null;
      resetFilesTransferTree(host);
      state.filesMkdirOpen = false;
      closeFilesItemMenu(host);
    }
    host.render();
    return true;
  }
  if (action === "files-item-menu-toggle") {
    ev.stopPropagation();
    const path = t.dataset.path ?? "";
    if (!path || filesItemMenuBlocked(state)) return true;
    if (state.filesItemMenu?.path === path) {
      closeFilesItemMenu(host);
      host.render();
      return true;
    }
    const rect = t.getBoundingClientRect();
    openFilesItemMenu(host, path, { x: rect.right, y: rect.bottom + 4, origin: "button" });
    return true;
  }
  if (action === "sort-file") {
    const col = (t.dataset.sort || "") as typeof state.filesSort;
    if (col !== "name" && col !== "size" && col !== "mtime") return true;
    if (state.filesSort === col) state.filesOrder = state.filesOrder === "asc" ? "desc" : "asc";
    else {
      state.filesSort = col;
      state.filesOrder = col === "name" ? "asc" : "desc";
    }
    host.render();
    return true;
  }
  if (action === "files-type-filter") {
    const v = (t as HTMLSelectElement).value;
    state.filesTypeFilter =
      v === "folder" ||
      v === "file" ||
      v === "image" ||
      v === "document" ||
      v === "audio" ||
      v === "video" ||
      v === "archive" ||
      v === "other"
        ? v
        : "all";
    host.render();
    return true;
  }
  if (action === "files-clear-selection") {
    state.checkedFilePaths = [];
    closeFilesItemMenu(host);
    host.render();
    return true;
  }
  if (action === "files-upload-files") {
    void startFilesUploadBrowse(host, "files");
    return true;
  }
  if (action === "files-upload-folder") {
    void startFilesUploadBrowse(host, "folder");
    return true;
  }
  if (action === "files-nav") {
    const path = t.dataset.path ?? "";
    state.filesPath = path;
    state.filesRenamePath = null;
    state.filesDeletePaths = null;
    state.filesTransfer = null;
    state.filesMkdirOpen = false;
    closeFilesPreview(host);
    closeFilesItemMenu(host);
    state.checkedFilePaths = [];
    state.busy = true;
    host.clearFlash();
    host.render();
    try {
      await loadFiles(host);
    } catch (e) {
      host.setFlash("error", e instanceof Error ? e.message : "Failed to open folder");
    } finally {
      state.busy = false;
      host.render();
    }
    return true;
  }
  if (action === "files-toggle") {
    ev.stopPropagation();
    const path = t.dataset.path ?? "";
    if (!path) return true;
    const on = (t as HTMLInputElement).checked;
    if (on) {
      if (!state.checkedFilePaths.includes(path)) {
        state.checkedFilePaths = [...state.checkedFilePaths, path];
      }
    } else {
      state.checkedFilePaths = state.checkedFilePaths.filter((p) => p !== path);
    }
    if (state.filesItemMenu && !state.checkedFilePaths.includes(state.filesItemMenu.path)) {
      closeFilesItemMenu(host);
    }
    host.render();
    return true;
  }
  if (action === "files-select-all") {
    ev.stopPropagation();
    const on = (t as HTMLInputElement).checked;
    const visible = filterAndSortEntries(state.filesEntries, {
      search: state.filesSearch,
      type: state.filesTypeFilter,
      sort: state.filesSort,
      order: state.filesOrder,
    });
    state.checkedFilePaths = on ? visible.map((e) => e.path) : [];
    if (state.filesItemMenu && !state.checkedFilePaths.includes(state.filesItemMenu.path)) {
      closeFilesItemMenu(host);
    }
    host.render();
    return true;
  }
  if (action === "files-copy") {
    const path = t.dataset.path ?? "";
    if (!path) return true;
    closeFilesPreview(host);
    closeFilesItemMenu(host);
    void openFilesTransfer(host, "copy", [path]);
    return true;
  }
  if (action === "files-move") {
    const path = t.dataset.path ?? "";
    if (!path) return true;
    closeFilesPreview(host);
    closeFilesItemMenu(host);
    void openFilesTransfer(host, "move", [path]);
    return true;
  }
  if (action === "files-bulk-copy") {
    if (state.checkedFilePaths.length === 0) return true;
    closeFilesPreview(host);
    closeFilesItemMenu(host);
    void openFilesTransfer(host, "copy", [...state.checkedFilePaths]);
    return true;
  }
  if (action === "files-bulk-move") {
    if (state.checkedFilePaths.length === 0) return true;
    closeFilesPreview(host);
    closeFilesItemMenu(host);
    void openFilesTransfer(host, "move", [...state.checkedFilePaths]);
    return true;
  }
  if (action === "files-bulk-download") {
    const model = filesItemMenuModel(state.filesEntries, state.checkedFilePaths);
    if (model.downloadItems.length === 0) return true;
    closeFilesItemMenu(host);
    downloadSelectedFiles(model.downloadItems);
    host.render();
    return true;
  }
  if (action === "files-tree-select") {
    ev.preventDefault();
    ev.stopPropagation();
    if (!state.filesTransfer) return true;
    const path = t.dataset.path ?? "";
    if (isBlockedTransferDest(host, path, state.filesTransfer.paths)) return true;
    state.filesTransferDest = path;
    host.render();
    return true;
  }
  if (action === "files-tree-toggle" || action === "files-tree-retry") {
    ev.preventDefault();
    ev.stopPropagation();
    if (!state.filesTransfer) return true;
    const path = t.dataset.path ?? "";
    if (action === "files-tree-retry") {
      const next = { ...state.filesTreeChildren };
      delete next[path];
      state.filesTreeChildren = next;
      if (!state.filesTreeExpanded.includes(path)) {
        state.filesTreeExpanded = [...state.filesTreeExpanded, path];
      }
      void ensureFilesTreeChildren(host, path);
      return true;
    }
    const isOpen = state.filesTreeExpanded.includes(path);
    if (isOpen) {
      state.filesTreeExpanded = state.filesTreeExpanded.filter((p) => p !== path);
      host.render();
    } else {
      state.filesTreeExpanded = [...state.filesTreeExpanded, path];
      void ensureFilesTreeChildren(host, path);
    }
    return true;
  }
  if (action === "files-transfer-close") {
    resetFilesTransferTree(host);
    host.render();
    return true;
  }
  if (action === "files-bulk-delete") {
    if (state.checkedFilePaths.length === 0) return true;
    state.filesDeletePaths = [...state.checkedFilePaths];
    state.filesRenamePath = null;
    resetFilesTransferTree(host);
    closeFilesPreview(host);
    closeFilesItemMenu(host);
    host.render();
    return true;
  }
  if (action === "files-refresh") {
    closeFilesItemMenu(host);
    state.busy = true;
    host.clearFlash();
    host.render();
    try {
      await loadFiles(host);
      host.setFlash("success", "Refreshed");
    } catch (e) {
      host.setFlash("error", e instanceof Error ? e.message : "Refresh failed");
    } finally {
      state.busy = false;
      host.render();
    }
    return true;
  }
  if (action === "files-mkdir") {
    state.filesMkdirOpen = true;
    state.filesUploadMenuOpen = false;
    unbindFilesUploadMenuOutside(host);
    state.filesUploadDropActive = false;
    state.filesRenamePath = null;
    state.filesDeletePaths = null;
    resetFilesTransferTree(host);
    closeFilesPreview(host);
    closeFilesItemMenu(host);
    host.clearFlash();
    host.render();
    return true;
  }
  if (action === "files-mkdir-close") {
    state.filesMkdirOpen = false;
    host.render();
    return true;
  }
  if (action === "files-rename-open") {
    const path = t.dataset.path || (state.checkedFilePaths.length === 1 ? state.checkedFilePaths[0] : "");
    if (!path) return true;
    state.filesRenamePath = path;
    state.filesDeletePaths = null;
    resetFilesTransferTree(host);
    state.filesUploadMenuOpen = false;
    unbindFilesUploadMenuOutside(host);
    closeFilesPreview(host);
    closeFilesItemMenu(host);
    host.render();
    return true;
  }
  if (action === "files-rename-close") {
    state.filesRenamePath = null;
    host.render();
    return true;
  }
  if (action === "files-delete-open") {
    const path = t.dataset.path ?? "";
    state.filesDeletePaths = path ? [path] : null;
    state.filesRenamePath = null;
    resetFilesTransferTree(host);
    state.filesUploadMenuOpen = false;
    unbindFilesUploadMenuOutside(host);
    closeFilesPreview(host);
    closeFilesItemMenu(host);
    host.render();
    return true;
  }
  if (action === "files-delete-close") {
    state.filesDeletePaths = null;
    host.render();
    return true;
  }
  if (action === "files-delete-confirm") {
    const paths = state.filesDeletePaths ? [...state.filesDeletePaths] : [];
    if (paths.length === 0) return true;
    state.busy = true;
    host.clearFlash();
    host.render();
    try {
      if (paths.length === 1) {
        await api.filesDelete(paths[0]);
        log.event("files.delete", { path: paths[0] });
        host.setFlash("success", "Deleted");
      } else {
        const res = await api.filesBulk("delete", paths);
        log.event("files.bulk-delete", { ok: res.ok, failed: res.failed });
        if (res.failed === 0) {
          host.setFlash(
            "success",
            res.ok === 1 ? "Deleted 1 item" : `Deleted ${res.ok} items`,
          );
        } else if (res.ok > 0) {
          host.setFlash(
            "info",
            `Deleted ${res.ok}; ${res.failed} failed. ${res.errors[0] || ""}`,
          );
        } else {
          host.setFlash("error", res.errors[0] || "Delete failed");
        }
      }
      state.filesDeletePaths = null;
      state.checkedFilePaths = [];
      await loadFiles(host);
    } catch (e) {
      host.setFlash("error", e instanceof Error ? e.message : "Delete failed");
    } finally {
      state.busy = false;
      host.render();
    }
    return true;
  }
  if (action === "files-download") {
    log.event("files.download", { path: t.getAttribute("href") ?? "" });
    return true;
  }
  if (action === "files-preview-open") {
    const path = t.dataset.path ?? "";
    if (!path) return true;
    void openFilesPreview(host, path);
    return true;
  }
  if (action === "files-preview-close") {
    closeFilesPreview(host);
    host.render();
    return true;
  }
  if (action === "files-preview-download") {
    const preview = state.filesPreview;
    if (!preview) return true;
    const a = document.createElement("a");
    a.href = api.filesDownloadUrl(preview.path);
    a.download = preview.name;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    log.event("files.download", { path: preview.path, via: "preview" });
    return true;
  }
  if (action === "close-files-upload-progress") {
    if (
      state.filesUploadProgress &&
      (state.filesUploadProgress.phase === "done" || state.filesUploadProgress.phase === "error")
    ) {
      closeFilesUploadProgress(host);
    }
    return true;
  }
  if (action === "files-upload-conflict-cancel") {
    resolveFilesUploadConflict(host, "cancel");
    return true;
  }
  if (action === "files-upload-conflict-skip") {
    resolveFilesUploadConflict(host, "skip");
    return true;
  }
  if (action === "files-upload-conflict-overwrite") {
    resolveFilesUploadConflict(host, "overwrite");
    return true;
  }

  return false;
}
