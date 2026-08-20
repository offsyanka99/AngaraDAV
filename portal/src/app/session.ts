/**
 * Session idle, install/upgrade gate, and portal session wipe (Phase 3 extract).
 */
import { ApiError, type PortalUi } from "../api";
import { log, setLogLevel } from "../log";
import type { AppState } from "./context";
import type { TabId } from "./types";

export function userIsAdmin(state: AppState): boolean {
  return !!(state.user?.isAdmin || state.user?.role === "Admin");
}

/** Portal Administration section enabled (YAML portal_admin_ui_enabled). */
export function adminUiEnabled(state: AppState): boolean {
  if (!userIsAdmin(state)) return false;
  // Until capabilities load, allow Admin users into the shell (fail open for admins)
  if (state.adminCapabilities === null) return true;
  return state.adminCapabilities.uiEnabled !== false;
}

export function applyPortalUi(state: AppState, ui: PortalUi | null | undefined): void {
  if (!ui) return;
  const tf = (ui.timeFormat || "auto").toLowerCase();
  const ws = (ui.weekStart || "auto").toLowerCase();
  const prevServices = state.portalUi.services;
  let services = prevServices;
  if (ui.services && typeof ui.services === "object") {
    // When the server sends services, apply known flags; missing keys keep prior or true
    // so a partial payload cannot blank every tab. First apply: default each key open.
    const base = prevServices ?? {
      caldav: true,
      carddav: true,
      tasks: true,
      notes: true,
      files: true,
    };
    const s = ui.services;
    services = {
      caldav: typeof s.caldav === "boolean" ? s.caldav : base.caldav,
      carddav: typeof s.carddav === "boolean" ? s.carddav : base.carddav,
      tasks: typeof s.tasks === "boolean" ? s.tasks : base.tasks,
      notes: typeof s.notes === "boolean" ? s.notes : base.notes,
      files: typeof s.files === "boolean" ? s.files : base.files,
    };
  }
  state.portalUi = {
    timeFormat: tf === "12h" || tf === "24h" ? tf : "auto",
    weekStart: ws === "monday" || ws === "sunday" ? ws : "auto",
    logLevel: ui.logLevel || "off",
    services,
  };
  setLogLevel(state.portalUi.logLevel);
  if (
    typeof ui.sessionIdleSeconds === "number" &&
    Number.isFinite(ui.sessionIdleSeconds) &&
    ui.sessionIdleSeconds > 0
  ) {
    state.sessionIdleSeconds = Math.floor(ui.sessionIdleSeconds);
  }
  if (typeof ui.version === "string" && ui.version.trim() !== "") {
    state.appVersion = ui.version.trim();
  }
}

/**
 * Whether a user portal tab should be visible for current DAV service flags.
 * Admin is never gated by services. Until services load (null), fail open (show all).
 */
export function isUserTabEnabled(state: AppState, tab: TabId): boolean {
  if (tab === "admin") return true;
  const svc = state.portalUi.services;
  if (!svc) return true;
  switch (tab) {
    case "calendars":
      return svc.caldav;
    case "contacts":
      return svc.carddav;
    case "tasks":
      return svc.tasks;
    case "notes":
      return svc.notes;
    case "files":
      return svc.files;
    default:
      return true;
  }
}

/** First enabled user tab (fallback when active tab is disabled). Prefers Calendar. */
export function firstEnabledUserTab(state: AppState): TabId {
  const order: TabId[] = ["calendars", "contacts", "tasks", "notes", "files"];
  for (const t of order) {
    if (isUserTabEnabled(state, t)) return t;
  }
  // All DAV services off — still pick calendars so shell has a main panel
  return "calendars";
}

export function stopSessionIdleTimer(state: AppState): void {
  if (state.sessionIdleTimer !== null) {
    clearTimeout(state.sessionIdleTimer);
    state.sessionIdleTimer = null;
  }
}

/** Arm / re-arm client idle timer to match server session_max_age. */
export function bumpSessionIdleTimer(
  state: AppState,
  onExpired: (message: string) => void,
): void {
  stopSessionIdleTimer(state);
  if (!state.user) return;
  const ms = Math.max(30, state.sessionIdleSeconds) * 1000;
  state.sessionIdleTimer = setTimeout(() => {
    state.sessionIdleTimer = null;
    onExpired("Your session timed out. Please sign in again.");
  }, ms);
}

export type ClearSessionHooks = {
  stopImportElapsedTimer: () => void;
  stopFilesUploadElapsedTimer: () => void;
  resetFilesTransferTree: () => void;
  unbindUserMenuOutside: () => void;
  unbindFilesUploadMenuOutside: () => void;
};

/** Wipe in-memory portal state so no sensitive data stays on the login screen. */
export function clearPortalSessionState(state: AppState, hooks: ClearSessionHooks): void {
  stopSessionIdleTimer(state);
  hooks.stopImportElapsedTimer();
  state.importProgress = null;
  state.filesUploadProgress = null;
  hooks.stopFilesUploadElapsedTimer();
  state.filesUploadMenuOpen = false;
  hooks.unbindFilesUploadMenuOutside();
  state.filesUploadDropActive = false;
  state.user = null;
  state.calendars = [];
  state.shares = [];
  state.selectedId = null;
  state.selectedIds = [];
  state.calendarSelectionSeeded = false;
  state.listKeyboardFocus = false;
  state.directory = [];
  state.addressBooks = [];
  state.selectedAbId = null;
  state.contacts = [];
  state.selectedContactUri = null;
  state.editingContact = null;
  state.creatingContact = false;
  state.contactModalOpen = false;
  state.abModalOpen = false;
  state.createCalModalOpen = false;
  state.calModalOpen = false;
  state.deleteConfirmId = null;
  state.deleteAbConfirmId = null;
  state.eventModalOpen = false;
  state.userSettingsOpen = false;
  state.userSettingsError = null;
  state.editingEvent = null;
  state.creatingEvent = false;
  state.monthEvents = [];
  state.calView = "month";
  state.eventSearch = "";
  state.eventSearchFocus = false;
  {
    const n = new Date();
    state.calFocusDay = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
    state.monthCursor = { y: n.getFullYear(), m: n.getMonth() };
  }
  state.tasks = [];
  state.notes = [];
  state.taskCalendars = [];
  state.noteCalendars = [];
  state.selectedTaskKey = null;
  state.selectedNoteKey = null;
  state.editingTask = null;
  state.editingNote = null;
  state.taskFilters = { status: "open", due: "", calendar: "", percent: "" };
  state.creatingTask = false;
  state.creatingNote = false;
  state.checkedTaskKeys = [];
  state.checkedNoteKeys = [];
  state.checkedContactUris = [];
  state.filesStatus = null;
  state.filesPath = "";
  state.filesEntries = [];
  state.filesLoading = false;
  state.filesRenamePath = null;
  state.filesDeletePaths = null;
  hooks.resetFilesTransferTree();
  state.filesMkdirOpen = false;
  state.filesSearch = "";
  state.filesSearchFocus = false;
  state.filesSort = "name";
  state.filesOrder = "asc";
  state.filesTypeFilter = "all";
  state.filesItemMenu = null;
  if (state.filesItemMenuDocClick) {
    document.removeEventListener("click", state.filesItemMenuDocClick, true);
    state.filesItemMenuDocClick = null;
  }
  if (state.filesItemMenuWinClose) {
    window.removeEventListener("resize", state.filesItemMenuWinClose);
    state.filesItemMenuWinClose = null;
  }
  if (state.filesPreview?.objectUrl) {
    try {
      URL.revokeObjectURL(state.filesPreview.objectUrl);
    } catch {
      /* ignore */
    }
  }
  state.filesPreview = null;
  state.filesPreviewSeq += 1;
  state.filesUploadMenuOpen = false;
  hooks.unbindFilesUploadMenuOutside();
  state.filesUploadDropActive = false;
  state.filesUploadConflict = null;
  state.confirmDelete = null;
  state.dtPickerDocClick = null;
  state.checkedFilePaths = [];
  state.photoPreview = null;
  state.photoBase64Pending = null;
  state.removePhotoPending = false;
  state.busy = false;
  state.userMenuOpen = false;
  state.adminDashboard = null;
  state.adminDashboardLoading = false;
  state.adminDashboardError = null;
  state.adminCapabilities = null;
  state.adminCapabilitiesError = null;
  state.adminUsers = [];
  state.adminUsersLoading = false;
  state.adminUsersError = null;
  state.adminUsersQuery = "";
  state.adminSelectedUsername = null;
  state.adminUserDetail = null;
  state.adminUserDetailLoading = false;
  state.adminUserDetailError = null;
  state.adminUserCreateOpen = false;
  state.adminUserEditOpen = false;
  state.adminUserDeleteUsername = null;
  state.adminUserDeleteConfirmChecked = false;
  state.adminUserCalendars = [];
  state.adminUserAddressBooks = [];
  state.adminUserResourcesLoading = false;
  state.adminCalModal = null;
  state.adminCalEditId = null;
  state.adminAbModal = null;
  state.adminAbEditId = null;
  state.adminResourceDelete = null;
  state.adminSystemSettings = null;
  state.adminSystemSettingsLoading = false;
  state.adminSystemSettingsError = null;
  state.adminResetModalOpen = false;
  state.adminResetConfirmChecked = false;
  state.adminResetPassword = "";
  state.adminDatabaseSettings = null;
  state.adminDatabaseSettingsLoading = false;
  state.adminDatabaseSettingsError = null;
  state.adminDbFormBackend = "sqlite";
  state.adminDbConfirmOpen = false;
  state.adminDbConfirmText = "";
  state.adminDbPendingBody = null;
  hooks.unbindUserMenuOutside();
}

/**
 * Session lost (idle timeout or server 401). Leave dashboard and show login
 * with a clear message — do not leave calendars/contacts in the DOM.
 */
export function handleSessionExpired(
  state: AppState,
  opts: {
    message?: string;
    clearSession: () => void;
    render: () => void;
  },
): void {
  if (state.handlingSessionExpiry) return;
  if (!state.user) {
    stopSessionIdleTimer(state);
    return;
  }
  state.handlingSessionExpiry = true;
  try {
    log.event("session.expired");
    opts.clearSession();
    state.suppressErrorFlashAfterExpiry = true;
    state.flash = {
      type: "info",
      message:
        opts.message && opts.message.trim()
          ? opts.message
          : "Your session timed out. Please sign in again.",
    };
    opts.render();
  } finally {
    state.handlingSessionExpiry = false;
  }
}

export function applyInstallGateFromStatus(
  state: AppState,
  st: {
    step?: string;
    message?: string;
    installUrl?: string;
    productVersion?: string;
    configuredVersion?: string | null;
  },
): void {
  const step = String(st.step || "");
  if (
    step === "upgrade" ||
    step === "initialize" ||
    step === "permissions" ||
    step === "database"
  ) {
    state.installGate = {
      step,
      message:
        st.message ||
        (step === "upgrade"
          ? "Complete the upgrade wizard before signing in."
          : "Complete setup before signing in."),
      installUrl: st.installUrl || "/portal/install/",
      productVersion: st.productVersion,
      configuredVersion: st.configuredVersion ?? null,
    };
    if (typeof st.productVersion === "string" && st.productVersion.trim() !== "") {
      state.appVersion = st.productVersion.trim();
    }
  } else {
    state.installGate = null;
  }
}

export function applyInstallGateFromApiError(state: AppState, e: unknown): boolean {
  if (!(e instanceof ApiError) || e.status !== 503) return false;
  const code = typeof e.payload.code === "string" ? e.payload.code : "";
  if (
    code !== "upgrade_required" &&
    code !== "not_configured" &&
    code !== "admin_password_missing"
  ) {
    return false;
  }
  const step =
    code === "upgrade_required"
      ? "upgrade"
      : code === "admin_password_missing"
        ? "initialize"
        : "initialize";
  state.installGate = {
    step,
    message: e.message,
    installUrl:
      typeof e.payload.installUrl === "string" ? e.payload.installUrl : "/portal/install/",
    productVersion:
      typeof e.payload.productVersion === "string" ? e.payload.productVersion : undefined,
    configuredVersion:
      typeof e.payload.configuredVersion === "string" ? e.payload.configuredVersion : null,
  };
  if (state.installGate.productVersion) {
    state.appVersion = state.installGate.productVersion;
  }
  return true;
}
