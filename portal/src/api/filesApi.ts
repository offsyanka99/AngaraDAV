import { log } from "../log";
import {
  ApiError,
  getCsrfToken,
  notifySessionActivity,
  notifyUnauthorized,
  request,
  requestBlob,
} from "./client";
import type { FileEntry, FilesStatus } from "./types";


export const filesApi = {
  // --- Private WebDAV files (portal Files tab) ---
  filesStatus: () => request<FilesStatus>("/files"),
  filesList: (path = "") => {
    const p = new URLSearchParams();
    if (path) p.set("path", path);
    const qs = p.toString() ? `?${p}` : "";
    return request<{ path: string; entries: FileEntry[] }>(`/files/entries${qs}`);
  },
  filesMkdir: (path: string, name: string) =>
    request<{ entry: FileEntry }>("/files/mkdir", {
      method: "POST",
      body: JSON.stringify({ path, name }),
    }),
  /**
   * Upload a single file into path (parent folder). Uses XHR so callers can
   * report upload.progress for large files / multi-file batches.
   */
  filesUpload: (
    path: string,
    file: File,
    opts: {
      replace?: boolean;
      /** Bytes uploaded so far for this file (0…file.size). */
      onProgress?: (loaded: number, total: number) => void;
    } = {},
  ): Promise<{ entry: FileEntry }> => {
    const p = new URLSearchParams();
    if (path) p.set("path", path);
    p.set("name", file.name);
    if (opts.replace) p.set("replace", "1");
    const body = new FormData();
    body.append("file", file, file.name);
    if (path) body.append("path", path);
    const t0 =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    log.debug(
      `api → POST /files/upload path=${path || "/"} name=${file.name} size=${file.size}`,
    );

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `/api/files/upload?${p}`);
      xhr.withCredentials = true;
      const token = getCsrfToken();
      if (token) xhr.setRequestHeader("X-CSRF-Token", token);

      if (opts.onProgress) {
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            opts.onProgress?.(ev.loaded, ev.total);
          } else {
            opts.onProgress?.(ev.loaded, file.size || ev.loaded);
          }
        };
      }

      xhr.onload = () => {
        const ms = Math.round(
          (typeof performance !== "undefined" ? performance.now() : Date.now()) -
            t0,
        );
        let data: unknown = null;
        const text = xhr.responseText || "";
        if (text) {
          try {
            data = JSON.parse(text);
          } catch {
            data = { error: text };
          }
        }
        const status = xhr.status;
        if (status < 200 || status >= 300) {
          let msg = `Upload failed (${status || 0})`;
          if (
            data &&
            typeof data === "object" &&
            data !== null &&
            "error" in data &&
            typeof (data as { error: unknown }).error === "string"
          ) {
            msg = (data as { error: string }).error;
          }
          if (status === 401) {
            log.debug(`api ← POST /files/upload 401 (${ms}ms)`, msg);
            notifyUnauthorized("/files/upload", msg);
          } else if (status >= 500) {
            log.error(`api ← POST /files/upload ${status} (${ms}ms)`, msg);
          } else {
            log.warn(`api ← POST /files/upload ${status} (${ms}ms)`, msg);
          }
          reject(new ApiError(msg, status || 0));
          return;
        }
        log.info(`api ← POST /files/upload 200 (${ms}ms)`);
        notifySessionActivity("/files/upload");
        resolve(data as { entry: FileEntry });
      };

      xhr.onerror = () => {
        const ms = Math.round(
          (typeof performance !== "undefined" ? performance.now() : Date.now()) -
            t0,
        );
        log.error(`api ← POST /files/upload network error (${ms}ms)`);
        reject(new ApiError("Upload failed (network error)", 0));
      };

      xhr.onabort = () => {
        reject(new ApiError("Upload cancelled", 0));
      };

      xhr.send(body);
    });
  },
  filesDownloadUrl: (path: string, opts?: { inline?: boolean }) => {
    const p = new URLSearchParams();
    p.set("path", path);
    if (opts?.inline) p.set("inline", "1");
    return `/api/files/download?${p}`;
  },
  filesGetBlob: (path: string, opts?: { inline?: boolean }) => {
    const p = new URLSearchParams();
    p.set("path", path);
    if (opts?.inline) p.set("inline", "1");
    return requestBlob(`/files/download?${p}`);
  },
  filesDelete: (path: string) =>
    request<{ ok: boolean }>("/files/entry", {
      method: "DELETE",
      body: JSON.stringify({ path }),
    }),
  filesRename: (path: string, newName: string) =>
    request<{ entry: { path: string; name: string } }>("/files/rename", {
      method: "POST",
      body: JSON.stringify({ path, newName }),
    }),
  filesMove: (from: string, to: string, newName?: string) =>
    request<{ entry: { path: string; name: string } }>("/files/move", {
      method: "POST",
      body: JSON.stringify({ from, to, newName }),
    }),
  filesCopy: (path: string, opts: { to?: string; newName?: string } = {}) =>
    request<{ entry: FileEntry }>("/files/copy", {
      method: "POST",
      body: JSON.stringify({
        path,
        to: opts.to,
        newName: opts.newName,
      }),
    }),
  filesBulk: (op: "delete" | "copy", paths: string[]) =>
    request<{
      ok: number;
      failed: number;
      errors: string[];
      entries?: FileEntry[];
    }>("/files/bulk", {
      method: "POST",
      body: JSON.stringify({ op, paths }),
    }),
};
