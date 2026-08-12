/**
 * Files copy/move destination tree (Phase 4).
 */
import { api, type FileEntry } from "../../api";
import { log } from "../../log";
import { esc } from "../../ui";
import { basenamePath } from "../paths";
import type { FilesHost } from "./host";
import { loadFiles } from "./loaders";

export function isBlockedTransferDest(_host: FilesHost, dest: string, sources: string[]): boolean {
  for (const src of sources) {
    if (!src) continue;
    if (dest === src || dest.startsWith(`${src}/`)) return true;
  }
  return false;
}

export function resetFilesTransferTree(host: FilesHost): void {
  host.state.filesTransfer = null;
  host.state.filesTransferDest = "";
  host.state.filesTreeChildren = {};
  host.state.filesTreeExpanded = [];
}

export async function openFilesTransfer(host: FilesHost, op: "copy" | "move", paths: string[]): Promise<void> {
  if (paths.length === 0) return;
  host.state.filesTransfer = { op, paths: [...paths] };
  host.state.filesTransferDest = host.state.filesPath;
  host.state.filesTreeChildren = {};
  // Expand Home + every ancestor of the current folder (and the folder itself if it is a dir path)
  const expanded = new Set<string>([""]);
  if (host.state.filesPath) {
    const parts = host.state.filesPath.split("/").filter(Boolean);
    let acc = "";
    for (const part of parts) {
      acc = acc ? `${acc}/${part}` : part;
      expanded.add(acc);
    }
  }
  host.state.filesTreeExpanded = [...expanded];
  host.state.filesRenamePath = null;
  host.state.filesDeletePaths = null;
  host.state.filesMkdirOpen = false;
  host.state.filesUploadMenuOpen = false;
  // Close upload menu without importing upload.ts (avoid circular deps)
  if (host.state.filesUploadMenuDocClick) {
    document.removeEventListener("click", host.state.filesUploadMenuDocClick, true);
    host.state.filesUploadMenuDocClick = null;
  }
  host.clearFlash();
  host.render();
  // Load children for every expanded path so the tree is usable immediately
  await Promise.all([...expanded].map((p) => ensureFilesTreeChildren(host, p)));
}

export async function ensureFilesTreeChildren(host: FilesHost, parentPath: string): Promise<void> {
  const cached = host.state.filesTreeChildren[parentPath];
  if (cached && cached !== "error") return;
  host.state.filesTreeChildren = { ...host.state.filesTreeChildren, [parentPath]: "loading" };
  host.render();
  try {
    const list = await api.filesList(parentPath);
    const dirs = list.entries
      .filter((e) => e.type === "dir")
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
    // Ignore stale loads if the modal was closed
    if (!host.state.filesTransfer) return;
    host.state.filesTreeChildren = { ...host.state.filesTreeChildren, [parentPath]: dirs };
  } catch (e) {
    if (!host.state.filesTransfer) return;
    host.state.filesTreeChildren = { ...host.state.filesTreeChildren, [parentPath]: "error" };
    log.warn("files.tree", {
      path: parentPath || "/",
      error: e instanceof Error ? e.message : String(e),
    });
  }
  host.render();
}

export function renderFilesFolderTree(host: FilesHost): string {
  if (!host.state.filesTransfer) return "";
  const sources = host.state.filesTransfer.paths;
  const lines: string[] = [];

  const walk = (path: string, depth: number): void => {
    const selected = host.state.filesTransferDest === path;
    const blocked = isBlockedTransferDest(host, path, sources);
    const expanded = host.state.filesTreeExpanded.includes(path);
    const children = host.state.filesTreeChildren[path];
    const hasLoadedKids = Array.isArray(children);
    // Root and unloaded nodes show a chevron so the user can expand; empty leaves hide it after load.
    const showToggle =
      path === "" ||
      children === "loading" ||
      children === "error" ||
      !hasLoadedKids ||
      (children as FileEntry[]).length > 0;
    const label = path === "" ? "Home" : basenamePath(path);
    const title = blocked
      ? "Cannot use a selected item (or a folder inside it) as the destination"
      : path === ""
        ? "File home host.root"
        : path;
    const chevron = expanded ? "▾" : "▸";
    lines.push(`<div class="files-tree-row${selected ? " is-selected" : ""}${blocked ? " is-blocked" : ""}" style="--depth:${depth}" role="treeitem" aria-selected="${selected}" aria-expanded="${expanded}" aria-disabled="${blocked}">
      ${
        showToggle
          ? `<button type="button" class="files-tree-toggle" data-action="files-tree-toggle" data-path="${esc(path)}"
              aria-label="${expanded ? "Collapse" : "Expand"} ${esc(label)}" ${host.state.busy ? "disabled" : ""}>${chevron}</button>`
          : `<span class="files-tree-toggle-spacer" aria-hidden="true"></span>`
      }
      <button type="button" class="files-tree-select${selected ? " is-selected" : ""}" data-action="files-tree-select" data-path="${esc(path)}"
        title="${esc(title)}" ${host.state.busy || blocked ? "disabled" : ""}>
        <span class="files-icon" aria-hidden="true">📁</span>
        <span class="files-tree-label">${esc(label)}</span>
      </button>
    </div>`);

    if (!expanded) return;
    if (children === "loading") {
      lines.push(
        `<div class="files-tree-status muted small" style="--depth:${depth + 1}">Loading…</div>`,
      );
      return;
    }
    if (children === "error") {
      lines.push(
        `<div class="files-tree-status muted small" style="--depth:${depth + 1}">Could not load folders.
          <button type="button" class="btn btn-ghost btn-small" data-action="files-tree-retry" data-path="${esc(path)}" ${host.state.busy ? "disabled" : ""}>Retry</button>
        </div>`,
      );
      return;
    }
    if (hasLoadedKids) {
      for (const dir of children as FileEntry[]) {
        walk(dir.path, depth + 1);
      }
      if ((children as FileEntry[]).length === 0 && path === "") {
        lines.push(
          `<div class="files-tree-status muted small" style="--depth:${depth + 1}">No subfolders yet — destination will be Home.</div>`,
        );
      }
    }
  };

  walk("", 0);
  return `<div class="files-folder-tree" role="tree" aria-label="Destination folder">${lines.join("")}</div>`;
}

export async function onFilesTransfer(host: FilesHost, form: HTMLFormElement) {
  if (!host.state.filesTransfer || host.state.filesTransfer.paths.length === 0) return;
  const fd = new FormData(form);
  // Prefer the tree selection (state); hidden input is the form fallback.
  const toPath = (host.state.filesTransferDest || String(fd.get("toPath") ?? ""))
    .trim()
    .replace(/^\/+|\/+$/g, "");
  const newNameRaw = String(fd.get("newName") ?? "").trim();
  const op = host.state.filesTransfer.op;
  const paths = [...host.state.filesTransfer.paths];
  const multi = paths.length > 1;
  if (isBlockedTransferDest(host, toPath, paths)) {
    host.setFlash("error", "Choose a different destination folder");
    host.render();
    return;
  }
  host.state.busy = true;
  host.clearFlash();
  host.render();
  let ok = 0;
  const errors: string[] = [];
  try {
    for (const path of paths) {
      try {
        if (op === "copy") {
          // Omit newName when unchanged so the server applies same-folder
          // " (copy)" vs cross-folder keep-name rules.
          const sourceBase = basenamePath(path);
          const copyName =
            multi || !newNameRaw || newNameRaw === sourceBase ? undefined : newNameRaw;
          const res = await api.filesCopy(path, {
            to: toPath,
            newName: copyName,
          });
          log.event("files.copy", { path, to: res.entry.path });
        } else {
          const sourceBase = basenamePath(path);
          const moveName =
            multi || !newNameRaw || newNameRaw === sourceBase ? undefined : newNameRaw;
          await api.filesMove(path, toPath, moveName);
          log.event("files.move", { path, to: toPath });
        }
        ok += 1;
      } catch (e) {
        errors.push(`${basenamePath(path)}: ${e instanceof Error ? e.message : "failed"}`);
      }
    }
    resetFilesTransferTree(host);
    host.state.checkedFilePaths = [];
    await loadFiles(host);
    const verb = op === "copy" ? "Copied" : "Moved";
    if (ok > 0 && errors.length === 0) {
      host.setFlash("success", ok === 1 ? `${verb} 1 item` : `${verb} ${ok} items`);
    } else if (ok > 0) {
      host.setFlash("info", `${verb} ${ok}; ${errors.length} failed. ${errors[0]}`);
    } else {
      host.setFlash("error", errors[0] || `${op === "copy" ? "Copy" : "Move"} failed`);
    }
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Operation failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
}
