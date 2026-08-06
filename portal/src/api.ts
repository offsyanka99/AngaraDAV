import { log } from "./log";

export type PortalUser = {
  username: string;
  displayname: string;
  email: string;
  principal: string;
  csrfToken?: string;
  /** True when the DAV user has the portal Admin role. */
  isAdmin?: boolean;
  /** Role label from the API (e.g. "Admin" | "User"). */
  role?: string;
};

/** GET /api/admin/dashboard payload (Administration Overview). */
export type AdminDashboardStats = {
  version: string;
  git?: string;
  users: number;
  calendars: number;
  events: number;
  addressBooks: number;
  contacts: number;
  /** Classic dashboard aliases */
  nbusers?: number;
  nbcalendars?: number;
  nbevents?: number;
  nbbooks?: number;
  nbcontacts?: number;
  services: {
    /** Portal Administration available */
    administration?: boolean;
    /** @deprecated use administration */
    webAdmin?: boolean;
    caldav: boolean;
    carddav: boolean;
    files: boolean;
    tasks: boolean;
    notes: boolean;
    push: boolean;
  };
  links?: {
    docs?: string;
    releases?: string;
    /** Portal Administration overview */
    administration?: string;
  };
};

/** GET /api/admin/users list item (never includes digesta1). */
export type AdminUserSummary = {
  username: string;
  displayname: string;
  email: string;
  principal: string;
};

/** GET /api/admin/users/{username} detail. */
export type AdminUserDetail = AdminUserSummary & {
  calendarCount: number;
  addressBookCount: number;
  contactCount: number;
  eventCount: number;
};

/** Admin-managed calendar for another user. */
export type AdminUserCalendar = {
  id: number;
  instanceId: number;
  calendarId: number;
  uri: string;
  displayname: string;
  description: string;
  calendarcolor: string;
  components: string;
  todos: boolean;
  notes: boolean;
  eventCount: number;
  davUri: string;
};

/** Admin-managed address book for another user. */
export type AdminUserAddressBook = {
  id: number;
  uri: string;
  displayname: string;
  description: string;
  contactCount: number;
  davUri: string;
};

/** GET/PATCH /api/admin/settings/database (never includes password; write needs confirm: "CONFIRM"). */
export type AdminDatabaseSettings = {
  backend: string;
  sqlite_file: string;
  pgsql_host: string;
  pgsql_dbname: string;
  pgsql_username: string;
  hasPassword: boolean;
  hasEncryptionKey: boolean;
  writeEnabled: boolean;
  writable?: boolean;
  warning: string;
};

/** GET/PATCH /api/admin/settings/system */
export type AdminSystemSettings = {
  timezone: string;
  card_enabled: boolean;
  cal_enabled: boolean;
  files_enabled: boolean;
  files_storage_path: string;
  files_max_upload_mb: number;
  files_quota_mb: number;
  files_quarantine_days: number;
  tasks_enabled: boolean;
  notes_enabled: boolean;
  invite_from: string;
  dav_auth_type: string;
  session_max_age_minutes: number;
  push_enabled: boolean;
  push_external_url: string;
  push_log_level: string;
  push_max_subscriptions_per_principal?: number;
  push_max_subscriptions_per_resource?: number;
  push_max_registrations_per_hour?: number;
  push_worker_batch_size?: number;
  push_worker_poll_ms?: number;
  push_max_delivery_attempts?: number;
  portal_log_level?: string;
  portal_time_format?: string;
  portal_week_start?: string;
  portal_admin_users?: string | string[];
  portal_admin_ui_enabled?: boolean;
  hasAdminPassword: boolean;
  configured_version?: string;
  auth_realm?: string;
  writable?: boolean;
};

/** Feature status from GET /api/admin/capabilities (parity matrix). */
export type AdminFeatureStatus = "full" | "read-only" | "coming-soon" | "deferred" | string;

export type AdminCapabilityPage = {
  id: string;
  label: string;
  status: AdminFeatureStatus;
  /** When false, page is gated in the Administration shell. */
  available: boolean;
  /** Deep link into portal Administration (e.g. /portal/#admin/users). */
  portalUrl: string;
  portalLabel: string;
  summary: string;
};

/** GET /api/admin/capabilities payload. */
export type AdminCapabilities = {
  uiEnabled: boolean;
  /** Portal Administration entry (/portal/#admin). */
  portalAdminUrl: string;
  pages: AdminCapabilityPage[];
};

export type Calendar = {
  id: number;
  calendarId: number;
  instanceId: number;
  uri: string;
  displayname: string;
  description: string;
  color: string;
  access: string;
  accessCode: number;
  canShare: boolean;
  components: string;
  readOnly?: boolean;
  holidaysCountry?: string | null;
  holidayImport?: { imported: number; updated: number; skipped: number };
};

export type HolidayCountry = {
  code: string;
  name: string;
};

export type ImportResult = {
  imported: number;
  updated: number;
  skipped: number;
};

/** Live import progress (NDJSON stream from server). */
export type ImportProgressEvent = {
  percent: number;
  current: number;
  total: number;
  imported: number;
  updated: number;
  skipped: number;
};

/** VEVENT occurrence for the month grid (from GET /calendars/{id}/events) */
export type CalendarEvent = {
  uid: string;
  uri: string;
  summary: string;
  /** ISO datetime or YYYY-MM-DD for all-day */
  start: string;
  end: string | null;
  allDay: boolean;
  /** Set client-side when merging multi-calendar month views */
  instanceId?: number;
};

export type EventRepeat = {
  freq: "" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | string;
  interval: number;
  until: string | null;
  count: number | null;
  byDay: string[];
  /** UI-only: keep Ends=On date even before a date is chosen */
  endMode?: "never" | "until" | "count";
};

/** Full VEVENT for the edit modal */
export type CalendarEventDetail = {
  uri: string;
  instanceId: number;
  calendarId: number;
  calendarName: string;
  calendarUri: string;
  uid: string;
  summary: string;
  description: string;
  location: string;
  start: string | null;
  end: string | null;
  allDay: boolean;
  hasRrule: boolean;
  repeat: EventRepeat;
  readOnly: boolean;
  canWrite: boolean;
};

export type EventWriteBody = {
  summary?: string;
  description?: string;
  location?: string;
  start?: string | null;
  end?: string | null;
  allDay?: boolean;
  /** Move to another calendar (instance id) */
  instanceId?: number;
  repeat?: EventRepeat | null;
};

export type Share = {
  href: string;
  principal: string;
  username: string;
  displayname: string;
  access: string;
  accessCode: number;
  status: number;
};

export type DirectoryUser = {
  username: string;
  displayname: string;
  email?: string;
};

export type AddressBook = {
  id: number;
  uri: string;
  displayname: string;
  description: string;
  cardCount: number;
};

export type ContactPhone = {
  type: "cell" | "work" | "home" | "other" | string;
  value: string;
};

export type ContactAddress = {
  street: string;
  city: string;
  region: string;
  postal: string;
  country: string;
};

/** vCard X-* extension properties (custom fields) */
export type ContactCustomField = {
  name?: string;
  label: string;
  value: string;
};

export type ContactSummary = {
  uri: string;
  displayname: string;
  firstname: string;
  lastname: string;
  org: string;
  email: string;
  phone: string;
  hasPhoto: boolean;
  etag?: string;
};

export type ContactDetail = {
  uri: string;
  displayname: string;
  firstname: string;
  lastname: string;
  fullname: string;
  org: string;
  title: string;
  emails: string[];
  phones: ContactPhone[];
  address: ContactAddress;
  url: string;
  note: string;
  /** YYYY-MM-DD (vCard BDAY) */
  birthday?: string | null;
  /** YYYY-MM-DD (vCard ANNIVERSARY / special) */
  specialDate?: string | null;
  specialDateLabel?: string;
  custom: ContactCustomField[];
  hasPhoto: boolean;
  photoDataUri?: string | null;
};

export type ContactWriteBody = {
  firstname?: string;
  lastname?: string;
  fullname?: string;
  org?: string;
  title?: string;
  emails?: string[];
  phones?: ContactPhone[];
  address?: ContactAddress;
  url?: string;
  note?: string;
  birthday?: string | null;
  specialDate?: string | null;
  specialDateLabel?: string;
  custom?: ContactCustomField[];
  photoBase64?: string | null;
  removePhoto?: boolean;
};

export type TaskItem = {
  uri: string;
  instanceId: number;
  calendarId: number;
  calendarName: string;
  calendarUri: string;
  /** VTODO UID — used for subtask parent links (RELATED-TO) */
  uid: string;
  /** Parent task UID when this is a subtask; null for top-level */
  parentUid: string | null;
  summary: string;
  description: string;
  status: string;
  due: string | null;
  priority: number;
  percent: number;
  completed: string | null;
  lastmodified: number;
  readOnly: boolean;
  canWrite: boolean;
};

export type NoteItem = {
  uri: string;
  instanceId: number;
  calendarId: number;
  calendarName: string;
  calendarUri: string;
  summary: string;
  description: string;
  dtstart: string | null;
  lastmodified: number;
  readOnly: boolean;
  canWrite: boolean;
};

export type ItemCalendarOption = {
  id: number;
  displayname: string;
  color: string;
  components: string;
};

export type TaskWriteBody = {
  instanceId?: number;
  summary?: string;
  description?: string;
  status?: string;
  due?: string | null;
  priority?: number;
  percent?: number;
  /** Parent VTODO UID (same calendar); null/"" for top-level */
  parentUid?: string | null;
};

export type NoteWriteBody = {
  instanceId?: number;
  summary?: string;
  description?: string;
  dtstart?: string | null;
};

/** Portal Files tab — private WebDAV home status */
export type FilesStatus = {
  enabled: boolean;
  ready: boolean;
  error: string | null;
  davPath: string;
  maxUploadBytes: number;
  quotaBytes: number;
  usedBytes: number;
  availableBytes: number;
};

export type FileEntry = {
  name: string;
  path: string;
  type: "file" | "dir";
  size: number;
  mtime: number;
  etag?: string | null;
};

class ApiError extends Error {
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

function notifySessionActivity(path: string): void {
  if (isAuthExemptPath(path)) return;
  try {
    onSessionActivity?.();
  } catch {
    /* ignore */
  }
}

export type PortalUi = {
  timeFormat?: string;
  weekStart?: string;
  logLevel?: string;
  /** Server idle session lifetime in seconds (matches session_max_age_minutes). */
  sessionIdleSeconds?: number;
  /** Full product version including +sha when known (from server), e.g. 2.0.1+fef872a. */
  version?: string;
  /** Short git SHA only. */
  git?: string;
};

/** Install/upgrade wizard status (public; works while portal API is blocked for upgrades). */
export type InstallStatusPublic = {
  step: string;
  locked?: boolean;
  message?: string;
  productVersion?: string;
  configuredVersion?: string | null;
  installUrl?: string;
  portalUrl?: string;
  csrfToken?: string;
};

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

function notifyUnauthorized(path: string, message: string): void {
  if (isAuthExemptPath(path)) return;
  setCsrfToken("");
  try {
    onUnauthorized?.(message || "Session timed out. Please sign in again.");
  } catch {
    /* never break API error path */
  }
}

async function request<T>(
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

function encUri(uri: string): string {
  return encodeURIComponent(uri);
}

/**
 * Long calendar/contact imports stream NDJSON progress lines when
 * Accept: application/x-ndjson is sent (portal import modal).
 *
 * Body is sent as raw text/calendar or text/vcard (not JSON) so large
 * Thunderbird exports with non-UTF-8 bytes do not fail JSON encoding.
 */
async function streamImport<T extends ImportResult>(
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

export const api = {
  /** Public portal prefs (no session). Used early to apply log level before login. */
  ui: () =>
    request<{ ui: PortalUi; version?: string | null; git?: string | null }>(
      "/ui",
    ),
  /**
   * Installer status (public). Safe during product upgrades — uses /api/install/*
   * which does not go through the normal portal bootstrap upgrade gate.
   * Response is wrapped as { data: status } by InstallApp.
   */
  installStatus: async (): Promise<InstallStatusPublic> => {
    const res = await request<{ data: InstallStatusPublic } | InstallStatusPublic>(
      "/install/status",
    );
    if (res && typeof res === "object" && "data" in res && res.data) {
      return res.data;
    }
    return res as InstallStatusPublic;
  },
  /** Admin authz smoke check (requires Admin role). */
  adminPing: () => request<{ ok: boolean; user: string }>("/admin/ping"),
  /** Read-only dashboard stats for Administration → Overview. */
  adminDashboard: () =>
    request<{ data: AdminDashboardStats }>("/admin/dashboard"),
  /** Feature gating map for Administration shell. */
  adminCapabilities: () =>
    request<{ data: AdminCapabilities }>("/admin/capabilities"),
  /** Admin users list (never digesta1). */
  adminUsers: () => request<{ users: AdminUserSummary[] }>("/admin/users"),
  /** Admin user detail. */
  adminUser: (username: string) =>
    request<{ user: AdminUserDetail }>(
      `/admin/users/${encodeURIComponent(username)}`,
    ),
  /** Create DAV user. */
  adminCreateUser: (body: {
    username: string;
    displayname: string;
    email: string;
    password: string;
    passwordConfirm: string;
  }) =>
    request<{ user: AdminUserDetail }>("/admin/users", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  /** Update displayname / email / optional password. */
  adminUpdateUser: (
    username: string,
    body: {
      displayname?: string;
      email?: string;
      password?: string;
      passwordConfirm?: string;
    },
  ) =>
    request<{ user: AdminUserDetail }>(
      `/admin/users/${encodeURIComponent(username)}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    ),
  /** Delete user (requires confirm: true). */
  adminDeleteUser: (username: string, confirm = true) =>
    request<{ ok: boolean; username: string }>(
      `/admin/users/${encodeURIComponent(username)}`,
      {
        method: "DELETE",
        body: JSON.stringify({ confirm }),
      },
    ),
  adminUserCalendars: (username: string) =>
    request<{ calendars: AdminUserCalendar[] }>(
      `/admin/users/${encodeURIComponent(username)}/calendars`,
    ),
  adminCreateUserCalendar: (
    username: string,
    body: {
      uri: string;
      displayname: string;
      description?: string;
      calendarcolor?: string;
      todos?: boolean;
      notes?: boolean;
    },
  ) =>
    request<{ calendar: AdminUserCalendar }>(
      `/admin/users/${encodeURIComponent(username)}/calendars`,
      { method: "POST", body: JSON.stringify(body) },
    ),
  adminUpdateUserCalendar: (
    username: string,
    instanceId: number,
    body: {
      displayname?: string;
      description?: string;
      calendarcolor?: string;
      todos?: boolean;
      notes?: boolean;
    },
  ) =>
    request<{ calendar: AdminUserCalendar }>(
      `/admin/users/${encodeURIComponent(username)}/calendars/${instanceId}`,
      { method: "PATCH", body: JSON.stringify(body) },
    ),
  adminDeleteUserCalendar: (
    username: string,
    instanceId: number,
    confirm = true,
  ) =>
    request<{ ok: boolean }>(
      `/admin/users/${encodeURIComponent(username)}/calendars/${instanceId}`,
      { method: "DELETE", body: JSON.stringify({ confirm }) },
    ),
  adminUserAddressBooks: (username: string) =>
    request<{ addressbooks: AdminUserAddressBook[] }>(
      `/admin/users/${encodeURIComponent(username)}/addressbooks`,
    ),
  adminCreateUserAddressBook: (
    username: string,
    body: { uri: string; displayname: string; description?: string },
  ) =>
    request<{ addressbook: AdminUserAddressBook }>(
      `/admin/users/${encodeURIComponent(username)}/addressbooks`,
      { method: "POST", body: JSON.stringify(body) },
    ),
  adminUpdateUserAddressBook: (
    username: string,
    id: number,
    body: { displayname?: string; description?: string },
  ) =>
    request<{ addressbook: AdminUserAddressBook }>(
      `/admin/users/${encodeURIComponent(username)}/addressbooks/${id}`,
      { method: "PATCH", body: JSON.stringify(body) },
    ),
  adminDeleteUserAddressBook: (
    username: string,
    id: number,
    confirm = true,
    force = false,
  ) =>
    request<{ ok: boolean }>(
      `/admin/users/${encodeURIComponent(username)}/addressbooks/${id}`,
      { method: "DELETE", body: JSON.stringify({ confirm, force }) },
    ),
  adminSystemSettings: () =>
    request<{ data: AdminSystemSettings }>("/admin/settings/system"),
  adminUpdateSystemSettings: (body: Record<string, unknown>) =>
    request<{ data: AdminSystemSettings }>("/admin/settings/system", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  /** Factory reset: remove baikal.yaml + INSTALL_DISABLED; then open installer. Requires current password. */
  adminResetToDefault: (confirm = true, password = "") =>
    request<{ ok: boolean; redirectUrl: string; backupPath?: string | null }>(
      "/admin/settings/reset-to-default",
      {
        method: "POST",
        body: JSON.stringify({ confirm, password }),
      },
    ),
  /** Database connection summary (never password). */
  adminDatabaseSettings: () =>
    request<{ data: AdminDatabaseSettings }>("/admin/settings/database"),
  /** Live connection probe without writing YAML. */
  adminTestDatabaseConnection: (body: Record<string, unknown>) =>
    request<{ ok: boolean; backend: string; message: string }>(
      "/admin/settings/database/test",
      { method: "POST", body: JSON.stringify(body) },
    ),
  /** Update database settings — body must include confirm: "CONFIRM". */
  adminUpdateDatabaseSettings: (body: Record<string, unknown>) =>
    request<{ data: AdminDatabaseSettings }>("/admin/settings/database", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  me: async () => {
    const data = await request<{
      user: PortalUser;
      csrfToken?: string;
      version: string | null;
      davPath: string;
      ui?: PortalUi;
    }>("/me");
    setCsrfToken(data.csrfToken || data.user?.csrfToken);
    return data;
  },
  login: async (username: string, password: string) => {
    const data = await request<{ user: PortalUser; ui?: PortalUi }>("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setCsrfToken(data.user?.csrfToken);
    return data;
  },
  logout: async () => {
    try {
      return await request<{ ok: boolean }>("/logout", { method: "POST" });
    } finally {
      setCsrfToken("");
    }
  },
  calendars: () => request<{ calendars: Calendar[] }>("/calendars"),
  createCalendar: (body: {
    displayname: string;
    description?: string;
    color?: string;
    readOnly?: boolean;
    holidays?: boolean;
    holidayCountry?: string;
  }) =>
    request<{ calendar: Calendar; holidayImport?: ImportResult | null }>(
      "/calendars",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),
  holidayCountries: () =>
    request<{ countries: HolidayCountry[] }>("/holidays/countries"),
  updateCalendar: (
    instanceId: number,
    body: { displayname?: string; description?: string; color?: string },
  ) =>
    request<{ calendar: Calendar }>(`/calendars/${instanceId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteCalendar: (instanceId: number) =>
    request<{ ok: boolean }>(`/calendars/${instanceId}`, { method: "DELETE" }),
  calendarEvents: (instanceId: number, from: string, to: string) => {
    const qs = new URLSearchParams({ from, to }).toString();
    return request<{ events: CalendarEvent[] }>(
      `/calendars/${instanceId}/events?${qs}`,
    );
  },
  getEvent: (instanceId: number, uri: string) =>
    request<{ event: CalendarEventDetail }>(
      `/calendars/${instanceId}/events/${encUri(uri)}`,
    ),
  createEvent: (instanceId: number, body: EventWriteBody) =>
    request<{ event: CalendarEventDetail }>(`/calendars/${instanceId}/events`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateEvent: (instanceId: number, uri: string, body: EventWriteBody) =>
    request<{ event: CalendarEventDetail }>(
      `/calendars/${instanceId}/events/${encUri(uri)}`,
      { method: "PATCH", body: JSON.stringify(body) },
    ),
  deleteEvent: (instanceId: number, uri: string) =>
    request<{ ok: boolean }>(`/calendars/${instanceId}/events/${encUri(uri)}`, {
      method: "DELETE",
    }),
  exportCalendar: async (instanceId: number): Promise<{ blob: Blob; filename: string }> => {
    const res = await fetch(`/api/calendars/${instanceId}/export`, {
      credentials: "same-origin",
    });
    if (!res.ok) {
      let msg = `Export failed (${res.status})`;
      try {
        const data = (await res.json()) as { error?: string };
        if (data.error) msg = data.error;
      } catch {
        /* ignore */
      }
      throw new ApiError(msg, res.status);
    }
    const cd = res.headers.get("Content-Disposition") || "";
    const m = /filename="([^"]+)"/i.exec(cd);
    const filename = m?.[1] || `calendar-${instanceId}.ics`;
    const blob = await res.blob();
    return { blob, filename };
  },
  importCalendar: (
    instanceId: number,
    ics: string,
    onProgress?: (p: ImportProgressEvent) => void,
  ) =>
    streamImport<ImportResult>(
      `/calendars/${instanceId}/import`,
      ics,
      "text/calendar; charset=utf-8",
      onProgress,
    ),
  directory: () => request<{ users: DirectoryUser[] }>("/directory"),
  shares: (instanceId: number) =>
    request<{ shares: Share[] }>(`/calendars/${instanceId}/shares`),
  share: (instanceId: number, username: string, access: "read" | "readwrite") =>
    request<{ share: Share }>(`/calendars/${instanceId}/shares`, {
      method: "POST",
      body: JSON.stringify({ username, access }),
    }),
  revoke: (instanceId: number, href: string) =>
    request<{ ok: boolean }>(`/calendars/${instanceId}/shares`, {
      method: "DELETE",
      body: JSON.stringify({ href }),
    }),

  addressbooks: () =>
    request<{ addressbooks: AddressBook[] }>("/addressbooks"),
  createAddressBook: (body: {
    displayname: string;
    description?: string;
    uri?: string;
  }) =>
    request<{ addressbook: AddressBook }>("/addressbooks", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateAddressBook: (
    id: number,
    body: { displayname?: string; description?: string },
  ) =>
    request<{ addressbook: AddressBook }>(`/addressbooks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteAddressBook: (id: number, force = false) =>
    request<{ ok: boolean }>(`/addressbooks/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ force }),
    }),
  exportAddressBook: async (
    id: number,
  ): Promise<{ blob: Blob; filename: string }> => {
    const res = await fetch(`/api/addressbooks/${id}/export`, {
      credentials: "same-origin",
    });
    if (!res.ok) {
      let msg = `Export failed (${res.status})`;
      try {
        const data = (await res.json()) as { error?: string };
        if (data.error) msg = data.error;
      } catch {
        /* ignore */
      }
      throw new ApiError(msg, res.status);
    }
    const cd = res.headers.get("Content-Disposition") || "";
    const m = /filename="([^"]+)"/i.exec(cd);
    const filename = m?.[1] || `contacts-${id}.vcf`;
    const blob = await res.blob();
    return { blob, filename };
  },
  importAddressBook: (
    id: number,
    vcf: string,
    onProgress?: (p: ImportProgressEvent) => void,
  ) =>
    streamImport<ImportResult>(
      `/addressbooks/${id}/import`,
      vcf,
      "text/vcard; charset=utf-8",
      onProgress,
    ),

  contacts: (abId: number, q = "") => {
    const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
    return request<{ contacts: ContactSummary[] }>(
      `/addressbooks/${abId}/contacts${qs}`,
    );
  },
  getContact: (abId: number, uri: string) =>
    request<{ contact: ContactDetail }>(
      `/addressbooks/${abId}/contacts/${encUri(uri)}`,
    ),
  createContact: (abId: number, body: ContactWriteBody) =>
    request<{ contact: ContactDetail }>(`/addressbooks/${abId}/contacts`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateContact: (abId: number, uri: string, body: ContactWriteBody) =>
    request<{ contact: ContactDetail }>(
      `/addressbooks/${abId}/contacts/${encUri(uri)}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    ),
  deleteContact: (abId: number, uri: string) =>
    request<{ ok: boolean }>(
      `/addressbooks/${abId}/contacts/${encUri(uri)}`,
      { method: "DELETE" },
    ),
  exportContact: async (
    abId: number,
    uri: string,
  ): Promise<{ blob: Blob; filename: string }> => {
    const res = await fetch(
      `/api/addressbooks/${abId}/contacts/${encUri(uri)}/export`,
      { credentials: "same-origin" },
    );
    if (!res.ok) {
      let msg = `Export failed (${res.status})`;
      try {
        const data = (await res.json()) as { error?: string };
        if (data.error) msg = data.error;
      } catch {
        /* ignore */
      }
      throw new ApiError(msg, res.status);
    }
    const cd = res.headers.get("Content-Disposition") || "";
    const m = /filename="([^"]+)"/i.exec(cd);
    const filename = m?.[1] || `contact.vcf`;
    const blob = await res.blob();
    return { blob, filename };
  },
  contactPhotoUrl: (abId: number, uri: string): string =>
    `/api/addressbooks/${abId}/contacts/${encUri(uri)}/photo`,

  tasks: (opts: { q?: string; sort?: string; order?: string } = {}) => {
    const p = new URLSearchParams();
    if (opts.q) p.set("q", opts.q);
    if (opts.sort) p.set("sort", opts.sort);
    if (opts.order) p.set("order", opts.order);
    const qs = p.toString() ? `?${p}` : "";
    return request<{ tasks: TaskItem[]; calendars: ItemCalendarOption[] }>(
      `/tasks${qs}`,
    );
  },
  createTask: (body: TaskWriteBody) =>
    request<{ task: TaskItem }>("/tasks", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateTask: (instanceId: number, uri: string, body: TaskWriteBody) =>
    request<{ task: TaskItem }>(`/tasks/${instanceId}/${encUri(uri)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteTask: (instanceId: number, uri: string) =>
    request<{ ok: boolean }>(`/tasks/${instanceId}/${encUri(uri)}`, {
      method: "DELETE",
    }),
  /** Bulk delete or update selected tasks (status / due / percent). */
  bulkTasks: (body: {
    op: "delete" | "update";
    items: { instanceId: number; uri: string }[];
    fields?: { status?: string; due?: string | null; percent?: number };
  }) =>
    request<{ ok: number; failed: number; errors: string[] }>("/tasks/bulk", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  notes: (opts: { q?: string; sort?: string; order?: string } = {}) => {
    const p = new URLSearchParams();
    if (opts.q) p.set("q", opts.q);
    if (opts.sort) p.set("sort", opts.sort);
    if (opts.order) p.set("order", opts.order);
    const qs = p.toString() ? `?${p}` : "";
    return request<{ notes: NoteItem[]; calendars: ItemCalendarOption[] }>(
      `/notes${qs}`,
    );
  },
  createNote: (body: NoteWriteBody) =>
    request<{ note: NoteItem }>("/notes", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateNote: (instanceId: number, uri: string, body: NoteWriteBody) =>
    request<{ note: NoteItem }>(`/notes/${instanceId}/${encUri(uri)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteNote: (instanceId: number, uri: string) =>
    request<{ ok: boolean }>(`/notes/${instanceId}/${encUri(uri)}`, {
      method: "DELETE",
    }),

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
  filesUpload: async (
    path: string,
    file: File,
    opts: { replace?: boolean } = {},
  ): Promise<{ entry: FileEntry }> => {
    const p = new URLSearchParams();
    if (path) p.set("path", path);
    p.set("name", file.name);
    if (opts.replace) p.set("replace", "1");
    const headers = new Headers();
    if (csrfToken) headers.set("X-CSRF-Token", csrfToken);
    const body = new FormData();
    body.append("file", file, file.name);
    if (path) body.append("path", path);
    const t0 =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    log.debug(`api → POST /files/upload path=${path || "/"} name=${file.name} size=${file.size}`);
    const res = await fetch(`/api/files/upload?${p}`, {
      method: "POST",
      headers,
      credentials: "same-origin",
      body,
    });
    const text = await res.text();
    let data: unknown = null;
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
      let msg = `Upload failed (${res.status})`;
      if (
        data &&
        typeof data === "object" &&
        data !== null &&
        "error" in data &&
        typeof (data as { error: unknown }).error === "string"
      ) {
        msg = (data as { error: string }).error;
      }
      if (res.status === 401) {
        log.debug(`api ← POST /files/upload 401 (${ms}ms)`, msg);
        notifyUnauthorized("/files/upload", msg);
      } else if (res.status >= 500) {
        log.error(`api ← POST /files/upload ${res.status} (${ms}ms)`, msg);
      } else {
        log.warn(`api ← POST /files/upload ${res.status} (${ms}ms)`, msg);
      }
      throw new ApiError(msg, res.status);
    }
    log.info(`api ← POST /files/upload 200 (${ms}ms)`);
    notifySessionActivity("/files/upload");
    return data as { entry: FileEntry };
  },
  filesDownloadUrl: (path: string) => {
    const p = new URLSearchParams();
    p.set("path", path);
    return `/api/files/download?${p}`;
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

export { ApiError };
