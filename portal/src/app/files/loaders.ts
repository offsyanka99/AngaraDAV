/**
 * Files loaders (Phase 4).
 */
import { api, ApiError, type FileEntry } from "../../api";
import { log } from "../../log";
import type { FilesHost } from "./host";

export async function loadFiles(host: FilesHost): Promise<void> {
  host.state.filesLoading = true;
  try {
    log.debug("loadFiles", { path: host.state.filesPath });
    const [status, list] = await Promise.all([
      api.filesStatus(),
      api.filesList(host.state.filesPath).catch((e) => {
        // If disabled/not ready, status still loads; list may 503
        if (e instanceof ApiError && (e.status === 503 || e.status === 404)) {
          return { path: host.state.filesPath, entries: [] as FileEntry[] };
        }
        throw e;
      }),
    ]);
    host.state.filesStatus = status;
    if (status.ready) {
      host.state.filesPath = list.path;
      host.state.filesEntries = list.entries;
      const valid = new Set(host.state.filesEntries.map((e) => e.path));
      host.state.checkedFilePaths = host.state.checkedFilePaths.filter((p) => valid.has(p));
    } else {
      host.state.filesEntries = [];
      host.state.checkedFilePaths = [];
    }
    log.event("loadFiles", {
      path: host.state.filesPath,
      count: host.state.filesEntries.length,
      enabled: status.enabled,
      ready: status.ready,
    });
  } finally {
    host.state.filesLoading = false;
  }
}
