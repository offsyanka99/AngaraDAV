/**
 * Files form handlers (rename, mkdir) (Phase 4).
 */
import { api } from "../../api";
import { log } from "../../log";
import type { FilesHost } from "./host";
import { loadFiles } from "./loaders";

export async function onFilesRename(host: FilesHost, form: HTMLFormElement) {
  const fd = new FormData(form);
  const path = String(fd.get("path") ?? "");
  const newName = String(fd.get("newName") ?? "").trim();
  if (!path || !newName) {
    host.setFlash("error", "Name is required");
    host.render();
    return;
  }
  host.state.busy = true;
  host.clearFlash();
  host.render();
  try {
    await api.filesRename(path, newName);
    log.event("files.rename", { path, newName });
    host.state.filesRenamePath = null;
    await loadFiles(host);
    host.setFlash("success", `Renamed to “${newName}”`);
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Rename failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
}

export async function onFilesMkdir(host: FilesHost, form: HTMLFormElement) {
  const fd = new FormData(form);
  const name = String(fd.get("name") ?? "").trim();
  if (!name) {
    host.setFlash("error", "Folder name is required");
    host.render();
    return;
  }
  host.state.busy = true;
  host.clearFlash();
  host.render();
  try {
    await api.filesMkdir(host.state.filesPath, name);
    log.event("files.mkdir", { path: host.state.filesPath, name });
    host.state.filesMkdirOpen = false;
    await loadFiles(host);
    host.setFlash("success", `Created folder “${name}”`);
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Could not create folder");
  } finally {
    host.state.busy = false;
    host.render();
  }
}
