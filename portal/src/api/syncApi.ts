import { request } from "./client";
import type { SyncStatus } from "./types";

export const syncApi = {
  syncStatus: (opts?: { includeFiles?: boolean; path?: string }) => {
    const p = new URLSearchParams();
    if (opts?.includeFiles) p.set("includeFiles", "1");
    if (opts?.includeFiles && opts.path) p.set("path", opts.path);
    const qs = p.toString() ? `?${p}` : "";
    return request<SyncStatus>(`/sync-status${qs}`);
  },
};
