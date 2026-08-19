import { log } from "../log";
import type { ImportProgressEvent, ImportResult } from "./types";

export class ApiError extends Error {
  status: number;
  /** Extra fields from the JSON error body (e.g. code, installUrl). */
  payload: Record<string, unknown>;
  constructor(message: string, status: number, payload: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

/** Session CSRF token (set from login /me responses) */
let csrfToken = "";

/** Called when an authenticated API call returns 401 (idle timeout / lost session). */
let onUnauthorized: ((message: string) => void) | null = null;
/** Called after a successful authenticated API call (extends client idle timer). */
let onSessionActivity: (() => void) | null = null;

export function setCsrfToken(token: string | null | undefined): void {
  csrfToken = token && typeof token === "string" ? token : "";
}

export function getCsrfToken(): string {
  return csrfToken;
}

/**
 * Register a handler for session loss (401 on authenticated routes).
 * Login failures and public routes do not fire this.
 */
export function setOnUnauthorized(handler: ((message: string) => void) | null): void {
  onUnauthorized = handler;
}

/** Register a handler for successful authenticated API activity (client idle timer). */
export function setOnSessionActivity(handler: (() => void) | null): void {
  onSessionActivity = handler;
}

export function notifySessionActivity(path: string): void {
  if (isAuthExemptPath(path)) return;
  try {
    onSessionActivity?.();
  } catch {
    /* ignore */
  }
}

/** Paths that may return 401 without meaning “session expired while using the app”. */
function isAuthExemptPath(path: string): boolean {
  return (
    path === "/login" ||
    path === "/ui" ||
    path === "/logout" ||
    path === "/install/status" ||
    path.startsWith("/install/")
  );
}

export function notifyUnauthorized(path: string, message: string): void {
  if (isAuthExemptPath(path)) return;
  setCsrfToken("");
  try {
    onUnauthorized?.(message || "Session timed out. Please sign in again.");
  } catch {
    /* never break API error path */
  }
}

/** Binary GET (portal file viewer / downloads that are not JSON). */
export async function requestBlob(
  path: string,
): Promise<{ blob: Blob; contentType: string }> {
  const t0 =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  log.debug(`api → GET ${path}`);
  const res = await fetch(`/api${path}`, { credentials: "same-origin" });
  const ms = Math.round(
    (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0,
  );
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    let payload: Record<string, unknown> = {};
    try {
      const data = (await res.json()) as Record<string, unknown>;
      payload = { ...data };
      if (typeof data.error === "string") {
        msg = data.error;
      }
    } catch {
      /* ignore */
    }
    if (res.status >= 500) {
      log.error(`api ← GET ${path} ${res.status} (${ms}ms)`, msg);
    } else if (res.status !== 401) {
      log.warn(`api ← GET ${path} ${res.status} (${ms}ms)`, msg);
    } else {
      log.debug(`api ← GET ${path} 401 (${ms}ms)`);
      notifyUnauthorized(path, msg);
    }
    throw new ApiError(msg, res.status, payload);
  }
  log.info(`api ← GET ${path} ${res.status} (${ms}ms)`);
  notifySessionActivity(path);
  const contentType = res.headers.get("Content-Type") || "application/octet-stream";
  const blob = await res.blob();
  return { blob, contentType };
}

export async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const method = (init.method || "GET").toUpperCase();
  if (method !== "GET" && method !== "HEAD" && method !== "OPTIONS" && csrfToken) {
    headers.set("X-CSRF-Token", csrfToken);
  }
  const t0 =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  log.debug(`api → ${method} ${path}`);
  const res = await fetch(`/api${path}`, {
    ...init,
    headers,
    credentials: "same-origin",
  });
  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }
  }
  const ms = Math.round(
    (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0,
  );
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    let payload: Record<string, unknown> = {};
    if (data && typeof data === "object" && data !== null) {
      const obj = data as Record<string, unknown>;
      payload = { ...obj };
      if (typeof obj.error === "string") {
        msg = obj.error;
      }
    } else if (res.status === 500 || res.status === 504) {
      msg =
        "Server error during import (often a timeout on large calendars). Try again — already imported events update faster.";
    }
    if (res.status >= 500) {
      log.error(`api ← ${method} ${path} ${res.status} (${ms}ms)`, msg);
    } else if (res.status !== 401) {
      log.warn(`api ← ${method} ${path} ${res.status} (${ms}ms)`, msg);
    } else {
      log.debug(`api ← ${method} ${path} 401 (${ms}ms)`);
      notifyUnauthorized(path, msg);
    }
    throw new ApiError(msg, res.status, payload);
  }
  log.info(`api ← ${method} ${path} ${res.status} (${ms}ms)`);
  notifySessionActivity(path);
  return data as T;
}

export function encUri(uri: string): string {
  return encodeURIComponent(uri);
}

/**
 * Long calendar/contact imports stream NDJSON progress lines when
 * Accept: application/x-ndjson is sent (portal import modal).
 *
 * Body is sent as raw text/calendar or text/vcard (not JSON) so large
 * Thunderbird exports with non-UTF-8 bytes do not fail JSON encoding.
 */
export async function streamImport<T extends ImportResult>(
  path: string,
  rawBody: string,
  contentType: string,
  onProgress?: (p: ImportProgressEvent) => void,
): Promise<T> {
  const headers = new Headers({
    "Content-Type": contentType,
    Accept: "application/x-ndjson, application/json;q=0.9",
  });
  if (csrfToken) {
    headers.set("X-CSRF-Token", csrfToken);
  }
  const t0 =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  log.debug(`api → POST ${path} (stream, ${contentType}, ${rawBody.length} bytes)`);
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: "POST",
      headers,
      credentials: "same-origin",
      body: rawBody,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    log.error(`api ← POST ${path} network fail`, msg);
    throw new ApiError(
      `Import request failed to start (${msg}). Check connectivity and container logs.`,
      0,
    );
  }

  // Non-stream error (auth/CSRF before body) — may still be JSON
  const ct = (res.headers.get("Content-Type") || "").toLowerCase();
  const isNdjson = ct.includes("ndjson") || ct.includes("x-ndjson");
  if (!res.ok && !isNdjson) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) msg = data.error;
    } catch {
      /* ignore */
    }
    if (res.status === 504 || res.status === 502) {
      msg =
        "Gateway timeout during import. Pull the latest image (nginx 900s timeout) and recreate the container. Large calendars can take several minutes.";
    }
    if (res.status === 401) {
      log.debug(`api ← POST ${path} 401`, msg);
      notifyUnauthorized(path, msg);
    } else {
      log.warn(`api ← POST ${path} ${res.status}`, msg);
    }
    throw new ApiError(msg, res.status);
  }

  // Server returned plain JSON (legacy / unexpected) — accept final result shape
  if (!isNdjson && res.ok) {
    try {
      const data = (await res.json()) as T & { error?: string };
      if (data && typeof data.error === "string") {
        throw new ApiError(data.error, res.status || 500);
      }
      if (
        data &&
        typeof data.imported === "number" &&
        typeof data.updated === "number"
      ) {
        log.info(`api ← POST ${path} json done`);
        return data;
      }
    } catch (e) {
      if (e instanceof ApiError) throw e;
    }
    throw new ApiError("Unexpected import response from server", 500);
  }

  if (!res.body) {
    throw new ApiError("Import stream unavailable", 500);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  const state: {
    final: T | null;
    error: { message: string; status: number } | null;
    sawProgress: boolean;
  } = { final: null, error: null, sawProgress: false };

  const handleLine = (trimmed: string): void => {
    let msg: {
      type?: string;
      percent?: number;
      current?: number;
      total?: number;
      imported?: number;
      updated?: number;
      skipped?: number;
      result?: T;
      error?: string;
      status?: number;
    };
    try {
      msg = JSON.parse(trimmed) as typeof msg;
    } catch {
      log.debug("import stream non-JSON line", trimmed.slice(0, 80));
      return;
    }
    if (msg.type === "progress") {
      state.sawProgress = true;
      const total = Number(msg.total) || 0;
      const current = Number(msg.current) || 0;
      const percent =
        typeof msg.percent === "number"
          ? msg.percent
          : total > 0
            ? Math.round((100 * current) / total)
            : 0;
      onProgress?.({
        percent,
        current,
        total,
        imported: Number(msg.imported) || 0,
        updated: Number(msg.updated) || 0,
        skipped: Number(msg.skipped) || 0,
      });
    } else if (msg.type === "done" && msg.result) {
      state.final = msg.result;
    } else if (msg.type === "error") {
      state.error = {
        message: msg.error || "Import failed",
        status: msg.status || 500,
      };
    }
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      handleLine(trimmed);
    }
  }

  // Trailing line without newline
  if (buf.trim()) {
    handleLine(buf.trim());
  }

  const ms = Math.round(
    (typeof performance !== "undefined" ? performance.now() : Date.now()) - t0,
  );

  if (state.error) {
    if (state.error.status === 401) {
      log.debug(`api ← POST ${path} stream 401 (${ms}ms)`, state.error.message);
      notifyUnauthorized(path, state.error.message);
    } else {
      log.warn(`api ← POST ${path} stream error (${ms}ms)`, state.error.message);
    }
    throw new ApiError(state.error.message, state.error.status);
  }
  if (!state.final) {
    log.error(`api ← POST ${path} stream incomplete (${ms}ms)`, {
      sawProgress: state.sawProgress,
    });
    throw new ApiError(
      state.sawProgress
        ? "Import stopped before finishing (server crash, out of memory, or gateway timeout). On TrueNAS, set memory limit to at least 1G, pull latest image, and recreate the app."
        : "Import failed to start on the server. Check container logs and that you are on the latest image.",
      500,
    );
  }
  log.info(`api ← POST ${path} stream done (${ms}ms)`);
  notifySessionActivity(path);
  return state.final;
}
