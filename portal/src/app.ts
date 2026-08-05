import {
  api,
  ApiError,
  setOnSessionActivity,
  setOnUnauthorized,
  type AddressBook,
  type AdminCapabilities,
  type AdminCapabilityPage,
  type AdminDashboardStats,
  type AdminDatabaseSettings,
  type AdminSystemSettings,
  type AdminUserAddressBook,
  type AdminUserCalendar,
  type AdminUserDetail,
  type AdminUserSummary,
  type Calendar,
  type CalendarEvent,
  type CalendarEventDetail,
  type ContactCustomField,
  type ContactDetail,
  type ContactPhone,
  type ContactSummary,
  type DirectoryUser,
  type HolidayCountry,
  type ImportResult,
  type FileEntry,
  type FilesStatus,
  type ItemCalendarOption,
  type NoteItem,
  type PortalUi,
  type PortalUser,
  type Share,
  type TaskItem,
} from "./api";
import { log, setLogLevel } from "./log";
import { timezoneSelectOptions } from "./timezones";
import {
  esc,
  renderConfirmCheckbox,
  renderFlash,
  renderModal,
  renderModalFooter,
  type FlashType,
} from "./ui";

type TabId = "calendars" | "contacts" | "tasks" | "notes" | "files" | "admin";

/** Nested Administration views: #admin, #admin/users, #admin/settings, #admin/database */
type AdminPageId = "overview" | "users" | "settings" | "database";

const TAB_STORAGE_KEY = "angaradav-portal-tab";
const ADMIN_PAGE_STORAGE_KEY = "angaradav-portal-admin-page";

/** Fallback when /api/ui has not returned yet (or offline). */
const APP_VERSION_FALLBACK = "2.0.0";
const DOCS_URL = "https://github.com/offsyanka99/AngaraDAV/tree/main/docs";

function parseTabId(raw: string | null | undefined): TabId | null {
  if (
    raw === "calendars" ||
    raw === "contacts" ||
    raw === "tasks" ||
    raw === "notes" ||
    raw === "files" ||
    raw === "admin"
  ) {
    return raw;
  }
  return null;
}

function parseAdminPageId(raw: string | null | undefined): AdminPageId | null {
  if (
    raw === "overview" ||
    raw === "users" ||
    raw === "settings" ||
    raw === "database"
  ) {
    return raw;
  }
  return null;
}

/**
 * Parse location hash into portal tab + optional admin sub-page + user detail.
 * Supports #admin, #admin/overview, #admin/users, #admin/users/{username},
 * #admin/settings, #admin/database.
 */
function parseLocationRoute(): {
  tab: TabId | null;
  adminPage: AdminPageId | null;
  adminUsername: string | null;
} {
  const raw = (typeof location !== "undefined" ? location.hash : "")
    .replace(/^#/, "")
    .split(/[?&]/)[0]
    .replace(/^\/+/, "");
  if (!raw) {
    return { tab: null, adminPage: null, adminUsername: null };
  }
  if (raw === "admin" || raw.startsWith("admin/")) {
    const parts = raw.split("/").filter(Boolean);
    const sub = parts[1] ?? "overview";
    const page = parseAdminPageId(sub) ?? "overview";
    let adminUsername: string | null = null;
    if (page === "users" && parts[2]) {
      try {
        adminUsername = decodeURIComponent(parts[2]);
      } catch {
        adminUsername = parts[2];
      }
    }
    return { tab: "admin", adminPage: page, adminUsername };
  }
  return { tab: parseTabId(raw), adminPage: null, adminUsername: null };
}

/** Restore tab after F5: prefer URL hash, then sessionStorage. */
function readStoredTab(): TabId {
  const fromHash = parseLocationRoute().tab;
  if (fromHash) return fromHash;
  try {
    const fromStore = parseTabId(sessionStorage.getItem(TAB_STORAGE_KEY));
    if (fromStore) return fromStore;
  } catch {
    /* private mode / disabled storage */
  }
  return "calendars";
}

function readStoredAdminPage(): AdminPageId {
  const fromHash = parseLocationRoute().adminPage;
  if (fromHash) return fromHash;
  try {
    const fromStore = parseAdminPageId(sessionStorage.getItem(ADMIN_PAGE_STORAGE_KEY));
    if (fromStore) return fromStore;
  } catch {
    /* ignore */
  }
  return "overview";
}

function adminHash(page: AdminPageId, adminUsername: string | null = null): string {
  if (page === "overview") return "#admin";
  if (page === "users" && adminUsername) {
    return `#admin/users/${encodeURIComponent(adminUsername)}`;
  }
  return `#admin/${page}`;
}

function persistTab(
  tab: TabId,
  adminPage: AdminPageId = "overview",
  adminUsername: string | null = null,
): void {
  try {
    sessionStorage.setItem(TAB_STORAGE_KEY, tab);
    if (tab === "admin") {
      sessionStorage.setItem(ADMIN_PAGE_STORAGE_KEY, adminPage);
    }
  } catch {
    /* ignore */
  }
  if (typeof history === "undefined" || typeof location === "undefined") return;
  const desired =
    tab === "admin" ? adminHash(adminPage, adminUsername) : `#${tab}`;
  if (location.hash !== desired) {
    history.replaceState(null, "", `${location.pathname}${location.search}${desired}`);
  }
}

type Flash = { type: FlashType; message: string } | null;

function accessBadge(access: string): string {
  if (access === "readwrite") {
    return '<span class="badge badge-admin">full access</span>';
  }
  if (access === "read") {
    return '<span class="badge">read-only</span>';
  }
  if (access === "owner") {
    return '<span class="badge badge-ok">owner</span>';
  }
  return `<span class="badge">${esc(access)}</span>`;
}

function formatImportResult(r: ImportResult): string {
  const parts = [
    `${r.imported} new`,
    `${r.updated} updated`,
  ];
  if (r.skipped > 0) parts.push(`${r.skipped} skipped`);
  return parts.join(", ");
}

/** Section help texts shown in (i) info modals */
const SECTION_INFO: Record<string, { title: string; paragraphs: string[] }> = {
  "my-calendars": {
    title: "Calendar",
    paragraphs: [
      "Create and edit calendars, then share them with other AngaraDAV users.",
      "CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only.",
    ],
  },
  owned: {
    title: "Owned",
    paragraphs: [
      "Calendars you own appear here. Select one to edit details, import/export, or share.",
      "Badges show ownership, read-only mode, and holiday calendars.",
    ],
  },
  "add-calendar": {
    title: "Add calendar",
    paragraphs: [
      "Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).",
      "Import .ics creates a new calendar (using the display name, or the file name if the name is empty) and imports all events into it. Large files show a progress dialog.",
      "Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant.",
    ],
  },
  "shared-with-me": {
    title: "Shared with me",
    paragraphs: [
      "Calendars other users shared with you. Select one to view events in the month grid.",
      "Read-only shares allow viewing only. Full access also lets you create and edit events (owner still manages name, color, and sharing).",
    ],
  },
  "calendar-details": {
    title: "Calendar details",
    paragraphs: [
      "Display name, color, and description are stored on the calendar and are visible to CalDAV clients.",
      "The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name.",
    ],
  },
  "import-export": {
    title: "Import / export",
    paragraphs: [
      "Export downloads a standard .ics file of the whole calendar.",
      "Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.",
      "Large imports show a progress dialog (read → upload → server import) with elapsed time; keep the tab open until it finishes.",
      "Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact.",
    ],
  },
  share: {
    title: "Share",
    paragraphs: [
      "Share this calendar with another AngaraDAV user. Choose read-only or full access.",
      "This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.",
      "If the calendar is marked read-only, shares are always read-only for everyone.",
    ],
  },
  "my-contacts": {
    title: "Contacts",
    paragraphs: [
      "Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.",
      "Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files.",
    ],
  },
  tasks: {
    title: "Tasks",
    paragraphs: [
      "Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.",
      "Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.",
      "Click a column header to sort. Create tasks on any writable calendar that allows VTODO components.",
    ],
  },
  notes: {
    title: "Notes",
    paragraphs: [
      "Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.",
      "Click a column header to sort. Pick a writable calendar when creating a note.",
    ],
  },
  files: {
    title: "Files",
    paragraphs: [
      "Browse and manage your private WebDAV file home. The same files are available to desktop clients at /dav.php/files/{username}/.",
      "Upload, download, create folders, copy, move, rename, and delete. Use checkboxes to multi-select items for bulk copy, move, or delete.",
      "Quotas and size limits are configured by the administrator. Enable storage under Admin → AngaraDAV Settings → Enable WebDAV file storage.",
    ],
  },
  "address-books": {
    title: "Address books",
    paragraphs: [
      "Address books you own. Select one to manage its contacts.",
      "You can create, rename, or delete address books here. Deleting a non-empty book requires confirmation.",
    ],
  },
  contacts: {
    title: "Contacts",
    paragraphs: [
      "Search filters by name, email, phone, org, notes, and custom fields.",
      "Add or select a contact to edit fields. Multiple emails and phones are supported.",
      "Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.",
      "Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them.",
    ],
  },
  "contact-import-export": {
    title: "Import / export contacts",
    paragraphs: [
      "Export downloads a multi-vCard .vcf file of every contact in the address book.",
      "Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards.",
      "Large imports show a progress dialog with elapsed time — keep the tab open until the result appears.",
    ],
  },
  administration: {
    title: "Administration",
    paragraphs: [
      "Server administration for AngaraDAV, available to portal users with the Admin role.",
      "Overview, users, system settings, and database management for operators with the Admin role.",
      "Admin API calls use your portal DAV session and require the Admin role server-side.",
    ],
  },
  "admin-overview": {
    title: "Overview",
    paragraphs: [
      "Snapshot of registered users, calendars, events, address books, contacts, and which DAV services are enabled.",
      "Version and release links help you compare installs. Counts refresh from the dashboard API.",
    ],
  },
  "admin-users": {
    title: "Users",
    paragraphs: [
      "List, create, edit, and delete DAV users from the portal. Password digests are never returned.",
      "Create seeds a default calendar and address book. Delete removes calendars, contacts, and quarantines file homes when files are enabled.",
      "Manage users, system settings, and database from these Administration tabs.",
    ],
  },
  "admin-settings": {
    title: "System settings",
    paragraphs: [
      "Edit DAV services, files, push, session timeout, portal admin role list, and admin password.",
      "Saves write config/baikal.yaml atomically. Session timeout applies to portal idle cookies.",
    ],
  },
  "admin-database": {
    title: "Database",
    paragraphs: [
      "Read-only view of backend type, SQLite path or PostgreSQL host/dbname/username.",
      "Passwords and encryption keys are never returned. Saving requires typing CONFIRM — wrong values can take the instance offline.",
    ],
  },
};

function infoTitle(title: string, infoKey: string, tag: "h1" | "h2" = "h2"): string {
  const Tag = tag;
  return `<div class="section-title-row">
    <${Tag}>${esc(title)}</${Tag}>
    <button type="button" class="info-btn" data-action="info" data-info="${esc(infoKey)}"
      aria-label="About ${esc(title)}" title="About ${esc(title)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`;
}

function infoModalHtml(): string {
  return `
    <div class="info-modal" id="info-modal" hidden role="dialog" aria-modal="true" aria-labelledby="info-modal-title">
      <div class="info-modal-backdrop" data-action="info-close"></div>
      <div class="info-modal-card">
        <header class="info-modal-header">
          <h3 id="info-modal-title"></h3>
          <button type="button" class="modal-close info-modal-close" data-action="info-close" aria-label="Close">×</button>
        </header>
        <div class="info-modal-body muted small" id="info-modal-body"></div>
        <footer class="info-modal-footer">
          <button type="button" class="btn btn-primary" data-action="info-close">Got it</button>
        </footer>
      </div>
    </div>`;
}

export function mountApp(root: HTMLElement): void {
  let user: PortalUser | null = null;
  let flash: Flash = null;
  let activeTab: TabId = readStoredTab();
  /** Nested Administration page when activeTab === "admin" */
  let adminPage: AdminPageId = readStoredAdminPage();
  /** Cached Overview stats (null until first successful load) */
  let adminDashboard: AdminDashboardStats | null = null;
  let adminDashboardLoading = false;
  let adminDashboardError: string | null = null;
  /** Feature gating map from GET /api/admin/capabilities */
  let adminCapabilities: AdminCapabilities | null = null;

  let adminCapabilitiesError: string | null = null;
  /** Admin Users list / detail / write modals (Phase 4–5) */
  let adminUsers: AdminUserSummary[] = [];
  let adminUsersLoading = false;
  let adminUsersError: string | null = null;
  let adminUsersQuery = "";
  let adminSelectedUsername: string | null =
    parseLocationRoute().adminUsername ?? null;
  let adminUserDetail: AdminUserDetail | null = null;
  let adminUserDetailLoading = false;
  let adminUserDetailError: string | null = null;
  let adminUserCreateOpen = false;
  let adminUserEditOpen = false;
  let adminUserDeleteUsername: string | null = null;
  let adminUserDeleteConfirmChecked = false;
  /** Per-user calendars / address books (Phase 6) */
  let adminUserCalendars: AdminUserCalendar[] = [];
  let adminUserAddressBooks: AdminUserAddressBook[] = [];
  let adminUserResourcesLoading = false;
  let adminCalModal: "create" | "edit" | null = null;
  let adminCalEditId: number | null = null;
  let adminAbModal: "create" | "edit" | null = null;
  let adminAbEditId: number | null = null;
  let adminResourceDelete:
    | { kind: "calendar"; id: number; label: string }
    | { kind: "addressbook"; id: number; label: string; force?: boolean }
    | null = null;
  /** System settings (Phase 7) */
  let adminSystemSettings: AdminSystemSettings | null = null;
  let adminSystemSettingsLoading = false;
  let adminSystemSettingsError: string | null = null;
  /** Reset-to-default confirmation modal (factory reset → installer) */
  let adminResetModalOpen = false;
  let adminResetConfirmChecked = false;
  /** Database settings (Phase 8 / 8.2 write with CONFIRM) */
  let adminDatabaseSettings: AdminDatabaseSettings | null = null;
  let adminDatabaseSettingsLoading = false;
  let adminDatabaseSettingsError: string | null = null;
  let adminDbFormBackend: "sqlite" | "pgsql" = "sqlite";
  let adminDbConfirmOpen = false;
  let adminDbConfirmText = "";
  let adminDbPendingBody: Record<string, unknown> | null = null;
  /** User-menu dropdown (header name) open state */
  let userMenuOpen = false;
  let userMenuDocClick: ((ev: MouseEvent) => void) | null = null;
  let calendars: Calendar[] = [];
  let directory: DirectoryUser[] = [];
  let holidayCountries: HolidayCountry[] = [];
  let selectedId: number | null = null;
  let shares: Share[] = [];
  /** Calendar details + share live in a modal (not the right column). */
  let calModalOpen = false;
  /** Create calendar form lives in its own modal. */
  let createCalModalOpen = false;
  /** Owned calendar pending delete confirmation. */
  let deleteConfirmId: number | null = null;
  /** Address book delete confirmation modal (mirrors calendar delete) */
  let deleteAbConfirmId: number | null = null;
  /** Month grid cursor (local calendar). */
  let monthCursor = { y: new Date().getFullYear(), m: new Date().getMonth() };
  let monthEvents: CalendarEvent[] = [];
  let monthEventsLoading = false;
  /** VEVENT create/edit modal (day cell → new; event chip → edit) */
  let eventModalOpen = false;
  let editingEvent: CalendarEventDetail | null = null;
  let creatingEvent = false;
  /**
   * Custom portal date/time picker (events, tasks, notes, bulk due).
   * field ids: start | end | until | due | dtstart | bulk-due
   */
  let eventDtPicker: {
    field: string;
    viewY: number;
    viewM: number;
    dateOnly: boolean;
    allowClear: boolean;
    /** hidden input name attribute */
    name: string;
  } | null = null;
  /** Bulk-bar due value (survives re-render) */
  let bulkDueValue = "";
  /** YYYY-MM-DD day with “+N more” expanded to show all chips */
  let monthExpandDay: string | null = null;
  let addressBooks: AddressBook[] = [];
  let selectedAbId: number | null = null;
  let contacts: ContactSummary[] = [];
  let contactSearch = "";
  let selectedContactUri: string | null = null;
  let editingContact: ContactDetail | null = null;
  /** When true, form is for a new contact (no uri yet). */
  let creatingContact = false;
  /** Contact create/edit lives in a modal (list stays full height). */
  let contactModalOpen = false;
  /** Address book edit (details + import/export) lives in a modal. */
  let abModalOpen = false;
  let photoPreview: string | null = null;
  let photoBase64Pending: string | null = null;
  let removePhotoPending = false;
  let busy = false;
  /**
   * Full-screen import progress dialog (large .ics / .vcf can take minutes).
   * Server import is one request — UI shows phases + elapsed time, then result.
   */
  type ImportProgress = {
    kind: "calendar" | "contacts";
    fileName: string;
    fileSizeLabel: string;
    /** reading | uploading | processing | done | error */
    phase: "reading" | "uploading" | "processing" | "done" | "error";
    /** 0–100 while reading large files; null when unknown */
    readPercent: number | null;
    /** Server component progress (events/cards) */
    processPercent: number | null;
    processCurrent: number;
    processTotal: number;
    processImported: number;
    processUpdated: number;
    processSkipped: number;
    startedAt: number;
    elapsedSec: number;
    resultMessage: string | null;
    ok: boolean | null;
  };
  let importProgress: ImportProgress | null = null;
  let importElapsedTimer: ReturnType<typeof setInterval> | null = null;
  let escapeBound = false;
  /** From /ui|/me + baikal.yaml / env (TIME_FORMAT, week start, log level) */
  let portalUi: {
    timeFormat: "auto" | "12h" | "24h";
    weekStart: "auto" | "monday" | "sunday";
    logLevel: string;
  } = {
    timeFormat: "auto",
    weekStart: "auto",
    logLevel: "off",
  };
  let searchTimer: ReturnType<typeof setTimeout> | null = null;
  /** Client mirror of server idle timeout (seconds); from /api/ui or /me. */
  let sessionIdleSeconds = 900;
  let sessionIdleTimer: ReturnType<typeof setTimeout> | null = null;
  /** Server product version (…+git.<sha>); shown in footer after /api/ui. */
  let appVersion = APP_VERSION_FALLBACK;
  /** Prevent concurrent 401 handlers from double-rendering. */
  let handlingSessionExpiry = false;
  /** After session expiry, ignore follow-up API catch blocks that would flash raw 401 text. */
  let suppressErrorFlashAfterExpiry = false;

  function applyPortalUi(ui: PortalUi | null | undefined): void {
    if (!ui) return;
    const tf = (ui.timeFormat || "auto").toLowerCase();
    const ws = (ui.weekStart || "auto").toLowerCase();
    portalUi = {
      timeFormat: tf === "12h" || tf === "24h" ? tf : "auto",
      weekStart: ws === "monday" || ws === "sunday" ? ws : "auto",
      logLevel: ui.logLevel || "off",
    };
    setLogLevel(portalUi.logLevel);
    if (
      typeof ui.sessionIdleSeconds === "number" &&
      Number.isFinite(ui.sessionIdleSeconds) &&
      ui.sessionIdleSeconds > 0
    ) {
      sessionIdleSeconds = Math.floor(ui.sessionIdleSeconds);
    }
    if (typeof ui.version === "string" && ui.version.trim() !== "") {
      appVersion = ui.version.trim();
    }
  }

  function stopSessionIdleTimer(): void {
    if (sessionIdleTimer !== null) {
      clearTimeout(sessionIdleTimer);
      sessionIdleTimer = null;
    }
  }

  /** Arm / re-arm client idle timer to match server session_max_age. */
  function bumpSessionIdleTimer(): void {
    stopSessionIdleTimer();
    if (!user) return;
    const ms = Math.max(30, sessionIdleSeconds) * 1000;
    sessionIdleTimer = setTimeout(() => {
      sessionIdleTimer = null;
      handleSessionExpired("Your session timed out. Please sign in again.");
    }, ms);
  }

  /** Wipe in-memory portal state so no sensitive data stays on the login screen. */
  function clearPortalSessionState(): void {
    stopSessionIdleTimer();
    stopImportElapsedTimer();
    importProgress = null;
    user = null;
    calendars = [];
    shares = [];
    selectedId = null;
    directory = [];
    addressBooks = [];
    selectedAbId = null;
    contacts = [];
    selectedContactUri = null;
    editingContact = null;
    creatingContact = false;
    contactModalOpen = false;
    abModalOpen = false;
    createCalModalOpen = false;
    calModalOpen = false;
    deleteConfirmId = null;
    deleteAbConfirmId = null;
    eventModalOpen = false;
    editingEvent = null;
    creatingEvent = false;
    monthEvents = [];
    tasks = [];
    notes = [];
    taskCalendars = [];
    noteCalendars = [];
    selectedTaskKey = null;
    selectedNoteKey = null;
    editingTask = null;
    editingNote = null;
    creatingTask = false;
    creatingNote = false;
    checkedTaskKeys = [];
    filesStatus = null;
    filesPath = "";
    filesEntries = [];
    filesLoading = false;
    filesRenamePath = null;
    filesDeletePaths = null;
    filesTransfer = null;
    filesMkdirOpen = false;
    checkedFilePaths = [];
    photoPreview = null;
    photoBase64Pending = null;
    removePhotoPending = false;
    busy = false;
    userMenuOpen = false;
    adminDashboard = null;
    adminDashboardLoading = false;
    adminDashboardError = null;
    adminCapabilities = null;

    adminCapabilitiesError = null;
    adminUsers = [];
    adminUsersLoading = false;
    adminUsersError = null;
    adminUsersQuery = "";
    adminSelectedUsername = null;
    adminUserDetail = null;
    adminUserDetailLoading = false;
    adminUserDetailError = null;
    adminUserCreateOpen = false;
    adminUserEditOpen = false;
    adminUserDeleteUsername = null;
    adminUserDeleteConfirmChecked = false;
    adminUserCalendars = [];
    adminUserAddressBooks = [];
    adminUserResourcesLoading = false;
    adminCalModal = null;
    adminCalEditId = null;
    adminAbModal = null;
    adminAbEditId = null;
    adminResourceDelete = null;
    adminSystemSettings = null;
    adminSystemSettingsLoading = false;
    adminSystemSettingsError = null;
    adminResetModalOpen = false;
    adminResetConfirmChecked = false;
    adminDatabaseSettings = null;
    adminDatabaseSettingsLoading = false;
    adminDatabaseSettingsError = null;
    adminDbFormBackend = "sqlite";
    adminDbConfirmOpen = false;
    adminDbConfirmText = "";
    adminDbPendingBody = null;
    unbindUserMenuOutside();
  }

  function userIsAdmin(): boolean {
    return !!(user?.isAdmin || user?.role === "Admin");
  }

  /** Portal Administration section enabled (YAML portal_admin_ui_enabled). */
  function adminUiEnabled(): boolean {
    if (!userIsAdmin()) return false;
    // Until capabilities load, allow Admin users into the shell (fail open for admins)
    if (adminCapabilities === null) return true;
    return adminCapabilities.uiEnabled !== false;
  }

  function adminPageMeta(pageId: AdminPageId): AdminCapabilityPage | null {
    const pages = adminCapabilities?.pages;
    if (!pages) return null;
    return pages.find((p) => p.id === pageId) ?? null;
  }

  function adminStatusLabel(status: string): string {
    switch (status) {
      case "full":
        return "Full";
      case "read-only":
        return "Read-only";
      case "coming-soon":
        return "Coming soon";
      case "deferred":
        return "Unavailable";
      default:
        return status;
    }
  }

  function adminStatusBadgeClass(status: string): string {
    if (status === "full" || status === "read-only") return "badge-ok";
    if (status === "deferred") return "badge-off";
    return "badge-soon";
  }

  function unbindUserMenuOutside(): void {
    if (userMenuDocClick) {
      document.removeEventListener("click", userMenuDocClick, true);
      userMenuDocClick = null;
    }
  }

  function bindUserMenuOutside(): void {
    unbindUserMenuOutside();
    userMenuDocClick = (ev: MouseEvent) => {
      const t = ev.target as HTMLElement | null;
      if (t?.closest?.(".user-menu")) return;
      userMenuOpen = false;
      unbindUserMenuOutside();
      render();
    };
    // Defer so the toggle click that opened the menu does not immediately close it
    const handler = userMenuDocClick;
    setTimeout(() => {
      if (userMenuOpen && userMenuDocClick === handler) {
        document.addEventListener("click", handler, true);
      }
    }, 0);
  }

  /** Clamp tab if Administration is restored for a non-admin / disabled UI. */
  function normalizeActiveTab(): void {
    if (activeTab === "admin" && (!userIsAdmin() || !adminUiEnabled())) {
      activeTab = "calendars";
      adminPage = "overview";
      persistTab(activeTab);
    }
  }

  async function activateAdminPage(
    page: AdminPageId,
    opts: { clearFlash?: boolean; username?: string | null } = {},
  ): Promise<void> {
    if (!userIsAdmin()) {
      await activateTab("calendars", opts);
      return;
    }
    activeTab = "admin";
    adminPage = page;
    if (page !== "users") {
      adminSelectedUsername = null;
      adminUserDetail = null;
      adminUserDetailError = null;
    } else if (opts.username !== undefined) {
      adminSelectedUsername = opts.username;
      if (!opts.username) {
        adminUserDetail = null;
        adminUserDetailError = null;
      }
    }
    userMenuOpen = false;
    persistTab("admin", page, adminSelectedUsername);
    log.event("tab", { tab: "admin", adminPage: page, user: adminSelectedUsername });
    if (opts.clearFlash !== false) clearFlash();
    busy = true;
    render();
    try {
      await loadAdminCapabilities();
      if (!adminUiEnabled()) {
        activeTab = "calendars";
        persistTab("calendars");
        setFlash(
          "info",
          "Portal Administration UI is disabled.",
        );
        return;
      }
      const meta = adminPageMeta(page);
      if (page === "overview" && meta?.available !== false) {
        await loadAdminDashboard();
      } else if (page === "users" && meta?.available !== false) {
        await loadAdminUsers();
        if (adminSelectedUsername) {
          await loadAdminUserDetail(adminSelectedUsername);
          await loadAdminUserResources(adminSelectedUsername);
        }
      } else if (page === "settings" && meta?.available !== false) {
        await loadAdminSystemSettings();
      } else if (page === "database" && meta?.available !== false) {
        await loadAdminDatabaseSettings();
      }
    } catch (e) {
      log.warn("admin page load failed", e instanceof Error ? e.message : e);
      setFlash("error", e instanceof Error ? e.message : "Failed to load");
    } finally {
      busy = false;
      render();
    }
  }

  async function loadAdminCapabilities(): Promise<void> {
    adminCapabilitiesError = null;
    try {
      const res = await api.adminCapabilities();
      adminCapabilities = res.data;
      log.debug("admin.capabilities", {
        uiEnabled: adminCapabilities.uiEnabled,
        pages: adminCapabilities.pages?.length ?? 0,
      });
    } catch (e) {
      adminCapabilitiesError = e instanceof Error ? e.message : "Failed to load capabilities";
      adminCapabilities = {
        uiEnabled: true,
        portalAdminUrl: "/portal/#admin",
        pages: [
          {
            id: "overview",
            label: "Overview",
            status: "full",
            available: true,
            portalUrl: "/portal/#admin",
            portalLabel: "Overview",
            summary: "Live counts and service flags.",
          },
          {
            id: "settings",
            label: "System settings",
            status: "full",
            available: true,
            portalUrl: "/portal/#admin/settings",
            portalLabel: "System settings",
            summary: "Edit system flags and admin password in the portal.",
          },
          {
            id: "users",
            label: "Users",
            status: "full",
            available: true,
            portalUrl: "/portal/#admin/users",
            portalLabel: "Users",
            summary: "Full DAV user CRUD plus calendars and address books.",
          },
          {
            id: "database",
            label: "Database",
            status: "full",
            available: true,
            portalUrl: "/portal/#admin/database",
            portalLabel: "Database",
            summary: "Connection settings; saves require typing CONFIRM.",
          },
        ],
      };
      log.warn("admin.capabilities fallback", adminCapabilitiesError);
    }
  }

  async function loadAdminDashboard(): Promise<void> {
    adminDashboardLoading = true;
    adminDashboardError = null;
    try {
      const res = await api.adminDashboard();
      adminDashboard = res.data;
      log.debug("admin.dashboard", {
        users: adminDashboard.users,
        calendars: adminDashboard.calendars,
      });
    } catch (e) {
      adminDashboard = null;
      adminDashboardError = e instanceof Error ? e.message : "Failed to load dashboard";
      throw e;
    } finally {
      adminDashboardLoading = false;
    }
  }

  async function loadAdminUsers(): Promise<void> {
    adminUsersLoading = true;
    adminUsersError = null;
    try {
      const res = await api.adminUsers();
      adminUsers = res.users ?? [];
      log.debug("admin.users", { count: adminUsers.length });
    } catch (e) {
      adminUsers = [];
      adminUsersError = e instanceof Error ? e.message : "Failed to load users";
      throw e;
    } finally {
      adminUsersLoading = false;
    }
  }

  async function loadAdminUserDetail(username: string): Promise<void> {
    adminUserDetailLoading = true;
    adminUserDetailError = null;
    try {
      const res = await api.adminUser(username);
      adminUserDetail = res.user;
      adminSelectedUsername = res.user.username;
      log.debug("admin.user", { username: res.user.username });
    } catch (e) {
      adminUserDetail = null;
      adminUserDetailError = e instanceof Error ? e.message : "Failed to load user";
      throw e;
    } finally {
      adminUserDetailLoading = false;
    }
  }

  async function loadAdminUserResources(username: string): Promise<void> {
    adminUserResourcesLoading = true;
    try {
      const [cals, abs] = await Promise.all([
        api.adminUserCalendars(username),
        api.adminUserAddressBooks(username),
      ]);
      adminUserCalendars = cals.calendars ?? [];
      adminUserAddressBooks = abs.addressbooks ?? [];
    } catch (e) {
      adminUserCalendars = [];
      adminUserAddressBooks = [];
      throw e;
    } finally {
      adminUserResourcesLoading = false;
    }
  }

  async function loadAdminSystemSettings(): Promise<void> {
    adminSystemSettingsLoading = true;
    adminSystemSettingsError = null;
    try {
      const res = await api.adminSystemSettings();
      adminSystemSettings = res.data;
    } catch (e) {
      adminSystemSettings = null;
      adminSystemSettingsError =
        e instanceof Error ? e.message : "Failed to load settings";
      throw e;
    } finally {
      adminSystemSettingsLoading = false;
    }
  }

  async function loadAdminDatabaseSettings(): Promise<void> {
    adminDatabaseSettingsLoading = true;
    adminDatabaseSettingsError = null;
    try {
      const res = await api.adminDatabaseSettings();
      adminDatabaseSettings = res.data;
      const b = (res.data.backend || "sqlite").toLowerCase();
      adminDbFormBackend = b === "pgsql" ? "pgsql" : "sqlite";
    } catch (e) {
      adminDatabaseSettings = null;
      adminDatabaseSettingsError =
        e instanceof Error ? e.message : "Failed to load database settings";
      throw e;
    } finally {
      adminDatabaseSettingsLoading = false;
    }
  }

  async function onAdminUserCreate(form: HTMLFormElement): Promise<void> {
    const fd = new FormData(form);
    const username = String(fd.get("username") ?? "").trim();
    const displayname = String(fd.get("displayname") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const passwordConfirm = String(fd.get("passwordConfirm") ?? "");
    if (!username || !displayname || !email || !password) {
      setFlash("error", "Username, display name, email, and password are required");
      render();
      return;
    }
    if (password !== passwordConfirm) {
      setFlash("error", "Password confirmation does not match");
      render();
      return;
    }
    busy = true;
    clearFlash();
    render();
    try {
      const res = await api.adminCreateUser({
        username,
        displayname,
        email,
        password,
        passwordConfirm,
      });
      log.event("admin.user.create", { username: res.user.username });
      adminUserCreateOpen = false;
      adminSelectedUsername = res.user.username;
      adminUserDetail = res.user;
      persistTab("admin", "users", res.user.username);
      await loadAdminUsers();
      setFlash("success", `Created user “${res.user.username}”`);
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Create failed");
    } finally {
      busy = false;
      render();
    }
  }

  async function onAdminCalSave(form: HTMLFormElement): Promise<void> {
    if (!adminSelectedUsername) return;
    const uname = adminSelectedUsername;
    const fd = new FormData(form);
    const displayname = String(fd.get("displayname") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const calendarcolor = String(fd.get("calendarcolor") ?? "").trim();
    const todos = form.querySelector<HTMLInputElement>('input[name="todos"]')?.checked ?? false;
    const notes = form.querySelector<HTMLInputElement>('input[name="notes"]')?.checked ?? false;
    busy = true;
    clearFlash();
    render();
    try {
      if (adminCalModal === "create") {
        const uri = String(fd.get("uri") ?? "").trim().toLowerCase();
        await api.adminCreateUserCalendar(uname, {
          uri,
          displayname,
          description,
          calendarcolor: calendarcolor || undefined,
          todos,
          notes,
        });
        setFlash("success", `Created calendar “${displayname}”`);
      } else {
        const instanceId = Number(fd.get("instanceId"));
        await api.adminUpdateUserCalendar(uname, instanceId, {
          displayname,
          description,
          calendarcolor,
          todos,
          notes,
        });
        setFlash("success", `Updated calendar “${displayname}”`);
      }
      adminCalModal = null;
      adminCalEditId = null;
      await loadAdminUserResources(uname);
      await loadAdminUserDetail(uname);
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Save failed");
    } finally {
      busy = false;
      render();
    }
  }

  async function onAdminAbSave(form: HTMLFormElement): Promise<void> {
    if (!adminSelectedUsername) return;
    const uname = adminSelectedUsername;
    const fd = new FormData(form);
    const displayname = String(fd.get("displayname") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    busy = true;
    clearFlash();
    render();
    try {
      if (adminAbModal === "create") {
        const uri = String(fd.get("uri") ?? "").trim().toLowerCase();
        await api.adminCreateUserAddressBook(uname, { uri, displayname, description });
        setFlash("success", `Created address book “${displayname}”`);
      } else {
        const id = Number(fd.get("id"));
        await api.adminUpdateUserAddressBook(uname, id, { displayname, description });
        setFlash("success", `Updated address book “${displayname}”`);
      }
      adminAbModal = null;
      adminAbEditId = null;
      await loadAdminUserResources(uname);
      await loadAdminUserDetail(uname);
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Save failed");
    } finally {
      busy = false;
      render();
    }
  }

  function onAdminDatabaseFormSubmit(form: HTMLFormElement): void {
    const fd = new FormData(form);
    const backend = String(fd.get("backend") ?? adminDbFormBackend).toLowerCase() === "pgsql" ? "pgsql" : "sqlite";
    const body: Record<string, unknown> = { backend };
    if (backend === "sqlite") {
      body.sqlite_file = String(fd.get("sqlite_file") ?? "").trim();
    } else {
      body.pgsql_host = String(fd.get("pgsql_host") ?? "").trim();
      body.pgsql_dbname = String(fd.get("pgsql_dbname") ?? "").trim();
      body.pgsql_username = String(fd.get("pgsql_username") ?? "").trim();
      body.pgsql_password = String(fd.get("pgsql_password") ?? "");
    }
    adminDbPendingBody = body;
    adminDbConfirmText = "";
    adminDbConfirmOpen = true;
    clearFlash();
    render();
  }

  async function onAdminSettingsSave(form: HTMLFormElement): Promise<void> {
    const fd = new FormData(form);
    const bool = (name: string) =>
      !!form.querySelector<HTMLInputElement>(`input[name="${name}"]`)?.checked;
    const body: Record<string, unknown> = {
      cal_enabled: bool("cal_enabled"),
      card_enabled: bool("card_enabled"),
      tasks_enabled: bool("tasks_enabled"),
      notes_enabled: bool("notes_enabled"),
      files_enabled: bool("files_enabled"),
      push_enabled: bool("push_enabled"),
      portal_admin_ui_enabled: bool("portal_admin_ui_enabled"),
      timezone: String(fd.get("timezone") ?? "").trim(),
      invite_from: String(fd.get("invite_from") ?? "").trim(),
      dav_auth_type: String(fd.get("dav_auth_type") ?? "Digest"),
      files_storage_path: String(fd.get("files_storage_path") ?? "").trim(),
      files_max_upload_mb: Number(fd.get("files_max_upload_mb") ?? 0),
      files_quota_mb: Number(fd.get("files_quota_mb") ?? 0),
      files_quarantine_days: Number(fd.get("files_quarantine_days") ?? 0),
      session_max_age_minutes: Number(fd.get("session_max_age_minutes") ?? 15),
      portal_log_level: String(fd.get("portal_log_level") ?? "off"),
      portal_admin_users: String(fd.get("portal_admin_users") ?? "").trim(),
      push_external_url: String(fd.get("push_external_url") ?? "").trim(),
      push_log_level: String(fd.get("push_log_level") ?? "off"),
    };
    const pw = String(fd.get("admin_password") ?? "");
    const pwc = String(fd.get("admin_password_confirm") ?? "");
    if (pw !== "" || pwc !== "") {
      body.admin_password = pw;
      body.admin_password_confirm = pwc;
    }
    busy = true;
    clearFlash();
    render();
    try {
      const res = await api.adminUpdateSystemSettings(body);
      adminSystemSettings = res.data;
      log.event("admin.settings.save");
      setFlash("success", "System settings saved");
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Save failed");
    } finally {
      busy = false;
      render();
    }
  }

  async function onAdminUserEdit(form: HTMLFormElement): Promise<void> {
    const fd = new FormData(form);
    const username = String(fd.get("username") ?? "").trim();
    const displayname = String(fd.get("displayname") ?? "").trim();
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const passwordConfirm = String(fd.get("passwordConfirm") ?? "");
    if (!username) {
      setFlash("error", "Username is required");
      render();
      return;
    }
    if (!displayname || !email) {
      setFlash("error", "Display name and email are required");
      render();
      return;
    }
    if (password !== "" || passwordConfirm !== "") {
      if (password === "" || passwordConfirm === "") {
        setFlash("error", "Password and confirmation are required to change password");
        render();
        return;
      }
      if (password !== passwordConfirm) {
        setFlash("error", "Password confirmation does not match");
        render();
        return;
      }
    }
    busy = true;
    clearFlash();
    render();
    try {
      const body: {
        displayname: string;
        email: string;
        password?: string;
        passwordConfirm?: string;
      } = { displayname, email };
      if (password !== "") {
        body.password = password;
        body.passwordConfirm = passwordConfirm;
      }
      const res = await api.adminUpdateUser(username, body);
      log.event("admin.user.update", {
        username: res.user.username,
        passwordChanged: password !== "",
      });
      adminUserEditOpen = false;
      adminUserDetail = res.user;
      adminSelectedUsername = res.user.username;
      await loadAdminUsers();
      setFlash(
        "success",
        password !== ""
          ? `Updated “${res.user.username}” (password changed)`
          : `Updated “${res.user.username}”`,
      );
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Update failed");
    } finally {
      busy = false;
      render();
    }
  }

  async function activateTab(tab: TabId, opts: { clearFlash?: boolean } = {}): Promise<void> {
    if (tab === "admin" && (!userIsAdmin() || !adminUiEnabled())) {
      if (userIsAdmin() && adminCapabilities && !adminCapabilities.uiEnabled) {
        setFlash("info", "Portal Administration UI is disabled (portal_admin_ui_enabled).");
      }
      tab = "calendars";
    }
    if (tab === "admin") {
      // Entering Administration from the user menu → Overview (or last hash page)
      await activateAdminPage(adminPage || "overview", {
        ...opts,
        username: adminPage === "users" ? adminSelectedUsername : null,
      });
      return;
    }
    activeTab = tab;
    userMenuOpen = false;
    persistTab(tab);
    log.event("tab", { tab });
    if (tab !== "calendars") {
      calModalOpen = false;
      deleteConfirmId = null;
    }
    if (tab !== "contacts") {
      deleteAbConfirmId = null;
    }
    if (opts.clearFlash !== false) clearFlash();
    busy = true;
    render();
    try {
      if (tab === "contacts" && selectedAbId !== null) {
        await loadContacts(selectedAbId);
      } else if (tab === "calendars") {
        await loadMonthEvents();
      } else if (tab === "tasks") {
        await loadTasks();
      } else if (tab === "notes") {
        await loadNotes();
      } else if (tab === "files") {
        await loadFiles();
      }
    } catch (e) {
      log.warn("tab load failed", e instanceof Error ? e.message : e);
      setFlash("error", e instanceof Error ? e.message : "Failed to load");
    } finally {
      busy = false;
      render();
    }
  }

  async function loadFiles(): Promise<void> {
    filesLoading = true;
    try {
      log.debug("loadFiles", { path: filesPath });
      const [status, list] = await Promise.all([
        api.filesStatus(),
        api.filesList(filesPath).catch((e) => {
          // If disabled/not ready, status still loads; list may 503
          if (e instanceof ApiError && (e.status === 503 || e.status === 404)) {
            return { path: filesPath, entries: [] as FileEntry[] };
          }
          throw e;
        }),
      ]);
      filesStatus = status;
      if (status.ready) {
        filesPath = list.path;
        filesEntries = list.entries;
        const valid = new Set(filesEntries.map((e) => e.path));
        checkedFilePaths = checkedFilePaths.filter((p) => valid.has(p));
      } else {
        filesEntries = [];
        checkedFilePaths = [];
      }
      log.event("loadFiles", {
        path: filesPath,
        count: filesEntries.length,
        enabled: status.enabled,
        ready: status.ready,
      });
    } finally {
      filesLoading = false;
    }
  }

  /**
   * Session lost (idle timeout or server 401). Leave dashboard and show login
   * with a clear message — do not leave calendars/contacts in the DOM.
   */
  function handleSessionExpired(message?: string): void {
    if (handlingSessionExpiry) return;
    if (!user) {
      stopSessionIdleTimer();
      return;
    }
    handlingSessionExpiry = true;
    try {
      log.event("session.expired");
      clearPortalSessionState();
      suppressErrorFlashAfterExpiry = true;
      flash = {
        type: "info",
        message:
          message && message.trim()
            ? message
            : "Your session timed out. Please sign in again.",
      };
      render();
    } finally {
      handlingSessionExpiry = false;
    }
  }

  // Tasks / Notes (CalDAV VTODO / VJOURNAL)
  let tasks: TaskItem[] = [];
  let notes: NoteItem[] = [];
  let taskCalendars: ItemCalendarOption[] = [];
  let noteCalendars: ItemCalendarOption[] = [];
  let taskSearch = "";
  let noteSearch = "";
  let taskSort = "due";
  let taskOrder: "asc" | "desc" = "asc";
  let noteSort = "dtstart";
  let noteOrder: "asc" | "desc" = "desc";
  let selectedTaskKey: string | null = null; // instanceId|uri
  let selectedNoteKey: string | null = null;
  let editingTask: TaskItem | null = null;
  let editingNote: NoteItem | null = null;
  let creatingTask = false;
  let creatingNote = false;
  /** Multi-select keys (instanceId|uri) for bulk actions on Tasks */
  let checkedTaskKeys: string[] = [];

  // Files (private WebDAV home)
  let filesStatus: FilesStatus | null = null;
  let filesPath = "";
  let filesEntries: FileEntry[] = [];
  let filesLoading = false;
  let filesRenamePath: string | null = null;
  /** One or more paths pending delete confirmation (UI modal). */
  let filesDeletePaths: string[] | null = null;
  /** Copy/move destination modal (one or more source paths). */
  let filesTransfer: { op: "copy" | "move"; paths: string[] } | null = null;
  /** New-folder modal open. */
  let filesMkdirOpen = false;
  /** Selected entry paths in the current folder (multi-select). */
  let checkedFilePaths: string[] = [];

  function setFlash(type: Flash extends null ? never : NonNullable<Flash>["type"], message: string) {
    if (suppressErrorFlashAfterExpiry && type === "error") {
      return;
    }
    if (type !== "error") {
      suppressErrorFlashAfterExpiry = false;
    }
    flash = { type, message };
  }

  function clearFlash() {
    flash = null;
    suppressErrorFlashAfterExpiry = false;
  }

  async function bootstrap() {
    log.event("bootstrap.start");
    setOnUnauthorized((msg) => {
      handleSessionExpired(
        /timed\s*out|session expired/i.test(msg)
          ? msg
          : "Your session timed out. Please sign in again.",
      );
    });
    setOnSessionActivity(() => {
      bumpSessionIdleTimer();
    });
    // Public prefs first so log level works on the login screen
    try {
      const pub = await api.ui();
      applyPortalUi(pub.ui);
      if (typeof pub.version === "string" && pub.version.trim() !== "") {
        appVersion = pub.version.trim();
      } else if (pub.ui && typeof pub.ui.version === "string" && pub.ui.version.trim() !== "") {
        appVersion = pub.ui.version.trim();
      }
    } catch (e) {
      log.debug("bootstrap: /api/ui failed", e instanceof Error ? e.message : e);
    }
    try {
      const me = await api.me();
      user = me.user;
      applyPortalUi(me.ui);
      if (typeof me.version === "string" && me.version.trim() !== "") {
        appVersion = me.version.trim();
      }
      log.event("bootstrap.session", { username: user?.username ?? null });
      bumpSessionIdleTimer();
      if (userIsAdmin()) {
        try {
          await loadAdminCapabilities();
        } catch (e) {
          log.warn("admin.capabilities bootstrap", e instanceof Error ? e.message : e);
        }
      }
      normalizeActiveTab();
      persistTab(activeTab, adminPage);
      await loadHome();
      if (activeTab === "admin" && userIsAdmin() && adminUiEnabled()) {
        try {
          if (adminPage === "overview" && adminPageMeta("overview")?.available !== false) {
            await loadAdminDashboard();
          } else if (adminPage === "users" && adminPageMeta("users")?.available !== false) {
            await loadAdminUsers();
            if (adminSelectedUsername) {
              await loadAdminUserDetail(adminSelectedUsername);
              await loadAdminUserResources(adminSelectedUsername);
            }
          } else if (adminPage === "settings" && adminPageMeta("settings")?.available !== false) {
            await loadAdminSystemSettings();
          } else if (adminPage === "database" && adminPageMeta("database")?.available !== false) {
            await loadAdminDatabaseSettings();
          }
        } catch (e) {
          log.warn("admin bootstrap load", e instanceof Error ? e.message : e);
        }
      }
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        // Anonymous visit or expired cookie on first paint — never keep a stale shell
        clearPortalSessionState();
        if (/timed\s*out|session expired/i.test(e.message)) {
          setFlash("info", e.message);
        }
        log.event("bootstrap.anonymous");
      } else {
        log.error("bootstrap failed", e instanceof Error ? e.message : e);
        setFlash("error", e instanceof Error ? e.message : "Failed to load");
      }
    }
    render();
  }

  async function loadHome() {
    log.debug("loadHome");
    const [cals, dir, abs] = await Promise.all([
      api.calendars(),
      api.directory().catch(() => ({ users: [] as DirectoryUser[] })),
      api.addressbooks(),
    ]);
    calendars = cals.calendars;
    directory = dir.users;
    addressBooks = abs.addressbooks;
    log.event("loadHome", {
      calendars: calendars.length,
      addressBooks: addressBooks.length,
      directory: directory.length,
    });
    if (holidayCountries.length === 0) {
      try {
        const hc = await api.holidayCountries();
        holidayCountries = hc.countries;
      } catch {
        holidayCountries = [];
      }
    }
    if (selectedId !== null && !calendars.some((c) => c.id === selectedId)) {
      selectedId = null;
      shares = [];
      calModalOpen = false;
      deleteConfirmId = null;
    }
    if (selectedId === null) {
      const def = pickDefaultCalendar();
      if (def) {
        selectedId = def.id;
      }
    }
    if (selectedId !== null && calModalOpen) {
      await loadShares(selectedId);
    } else if (selectedId !== null) {
      shares = [];
    }
    if (activeTab === "calendars") {
      await loadMonthEvents();
    }
    if (selectedAbId !== null && !addressBooks.some((a) => a.id === selectedAbId)) {
      selectedAbId = null;
      contacts = [];
      selectedContactUri = null;
      editingContact = null;
      creatingContact = false;
    }
    if (
      deleteAbConfirmId !== null &&
      !addressBooks.some((a) => a.id === deleteAbConfirmId)
    ) {
      deleteAbConfirmId = null;
    }
    if (selectedAbId === null && addressBooks.length > 0) {
      selectedAbId = addressBooks[0].id;
    }
    if (selectedAbId !== null && activeTab === "contacts") {
      await loadContacts(selectedAbId);
    }
    if (activeTab === "tasks") {
      await loadTasks();
    }
    if (activeTab === "notes") {
      await loadNotes();
    }
    if (activeTab === "files") {
      await loadFiles();
    }
  }

  async function loadShares(id: number) {
    const res = await api.shares(id);
    shares = res.shares;
  }

  /** Prefer uri/name "default", else first owned calendar. */
  function pickDefaultCalendar(): Calendar | null {
    const own = calendars.filter((c) => c.canShare);
    if (own.length === 0) return null;
    const isDefault = (c: Calendar) => {
      const u = c.uri.toLowerCase();
      const n = c.displayname.toLowerCase();
      return u === "default" || n === "default" || n === "default calendar";
    };
    return own.find(isDefault) ?? own[0] ?? null;
  }

  function ymd(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }

  function monthRange(y: number, m: number): { from: string; to: string } {
    const from = new Date(y, m, 1);
    const to = new Date(y, m + 1, 0);
    return { from: ymd(from), to: ymd(to) };
  }

  /** Local calendar date of an event start/end string. */
  function eventLocalDate(iso: string): Date {
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      const [ys, ms, ds] = iso.split("-").map(Number);
      return new Date(ys, ms - 1, ds);
    }
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
      const [ys, ms, ds] = iso.slice(0, 10).split("-").map(Number);
      return new Date(ys, (ms || 1) - 1, ds || 1);
    }
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }

  /**
   * Days an event occupies (inclusive). All-day end from API is inclusive last day.
   * Timed events span every local day from start through end.
   */
  function eventDayKeys(ev: CalendarEvent): string[] {
    const startD = eventLocalDate(ev.start);
    if (!ev.end) return [ymd(startD)];
    let endD = eventLocalDate(ev.end);
    // Timed: if end is midnight exclusive of next day, still count previous day
    if (!ev.allDay && !/^\d{4}-\d{2}-\d{2}$/.test(ev.end)) {
      const endFull = new Date(ev.end);
      if (
        !Number.isNaN(endFull.getTime()) &&
        endFull.getHours() === 0 &&
        endFull.getMinutes() === 0 &&
        endFull.getSeconds() === 0 &&
        endFull.getTime() > new Date(ev.start).getTime()
      ) {
        endD = new Date(endD.getFullYear(), endD.getMonth(), endD.getDate() - 1);
      }
    }
    if (endD < startD) return [ymd(startD)];
    const keys: string[] = [];
    const cur = new Date(startD.getFullYear(), startD.getMonth(), startD.getDate());
    const last = new Date(endD.getFullYear(), endD.getMonth(), endD.getDate());
    let guard = 0;
    while (cur <= last && guard++ < 370) {
      keys.push(ymd(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return keys.length ? keys : [ymd(startD)];
  }

  /** When leaving all-day: same calendar day(s) with rounded-up times (or 09:00 on other days). */
  function convertAllDaySpanToTimed(
    startDate: string,
    endDate: string | null,
  ): { start: string; end: string | null } {
    const s = startDate.slice(0, 10);
    const e = (endDate || s).slice(0, 10);
    if (s === e) {
      const range = defaultTimedRange(s);
      return { start: range.start, end: range.end };
    }
    // Multi-day: start 09:00 first day → 17:00 last day
    const [ys, ms, ds] = s.split("-").map(Number);
    const [ye, me, de] = e.split("-").map(Number);
    const start = formatLocalDtValue(new Date(ys, ms - 1, ds, 9, 0, 0, 0));
    const end = formatLocalDtValue(new Date(ye, me - 1, de, 17, 0, 0, 0));
    return { start, end };
  }

  function convertTimedSpanToAllDay(
    startIso: string,
    endIso: string | null,
  ): { start: string; end: string | null } {
    const s = toDateInputValue(startIso);
    let e = endIso ? toDateInputValue(endIso) : s;
    if (endIso && !/^\d{4}-\d{2}-\d{2}$/.test(endIso)) {
      const endFull = new Date(endIso);
      if (
        !Number.isNaN(endFull.getTime()) &&
        endFull.getHours() === 0 &&
        endFull.getMinutes() === 0 &&
        endFull.getTime() > new Date(startIso).getTime()
      ) {
        // exclusive midnight → previous inclusive day
        const d = eventLocalDate(endIso);
        d.setDate(d.getDate() - 1);
        e = ymd(d);
      }
    }
    return { start: s, end: e };
  }

  async function loadMonthEvents() {
    if (selectedId === null) {
      monthEvents = [];
      return;
    }
    const { from, to } = monthRange(monthCursor.y, monthCursor.m);
    monthEventsLoading = true;
    log.debug("loadMonthEvents", { selectedId, from, to });
    try {
      const res = await api.calendarEvents(selectedId, from, to);
      monthEvents = res.events;
      log.event("monthEvents.loaded", {
        calendarId: selectedId,
        count: monthEvents.length,
        from,
        to,
      });
    } catch (e) {
      monthEvents = [];
      log.warn(
        "loadMonthEvents failed",
        e instanceof Error ? e.message : e,
      );
    } finally {
      monthEventsLoading = false;
    }
  }

  function monthTitle(y: number, m: number): string {
    return new Date(y, m, 1).toLocaleString(undefined, {
      month: "long",
      year: "numeric",
    });
  }

  /** Chip text: "10:45 Title" for timed events; title only for all-day. */
  function formatEventChipLabel(ev: CalendarEvent): string {
    const title = ev.summary || "(No title)";
    if (ev.allDay || /^\d{4}-\d{2}-\d{2}$/.test(ev.start)) {
      return title;
    }
    const d = new Date(ev.start);
    if (Number.isNaN(d.getTime())) return title;
    const time = d.toLocaleTimeString(undefined, timeFormatOpts());
    return `${time} ${title}`;
  }

  function renderMonthGrid(): string {
    const selected = selectedId !== null ? calendars.find((c) => c.id === selectedId) : null;
    const calName = selected?.displayname ?? "Calendar";
    const color = selected?.color
      ? selected.color.length >= 7
        ? selected.color.slice(0, 7)
        : selected.color
      : "#3B82F6";

    const y = monthCursor.y;
    const m = monthCursor.m;
    const first = new Date(y, m, 1);
    const weekStart = localeWeekStart();
    const startPad = (first.getDay() - weekStart + 7) % 7;
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const prevDays = new Date(y, m, 0).getDate();
    const today = new Date();
    const todayKey = ymd(today);
    const dowLabels = localeDowLabels();

    const byDay = new Map<string, CalendarEvent[]>();
    for (const ev of monthEvents) {
      for (const key of eventDayKeys(ev)) {
        const list = byDay.get(key) ?? [];
        list.push(ev);
        byDay.set(key, list);
      }
    }

    const cells: string[] = [];
    const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;
    for (let i = 0; i < totalCells; i++) {
      let dayNum: number;
      let inMonth = true;
      let cellDate: Date;
      if (i < startPad) {
        dayNum = prevDays - startPad + i + 1;
        inMonth = false;
        cellDate = new Date(y, m - 1, dayNum);
      } else if (i >= startPad + daysInMonth) {
        dayNum = i - (startPad + daysInMonth) + 1;
        inMonth = false;
        cellDate = new Date(y, m + 1, dayNum);
      } else {
        dayNum = i - startPad + 1;
        cellDate = new Date(y, m, dayNum);
      }
      const key = ymd(cellDate);
      const isToday = key === todayKey;
      const dayEvents = inMonth ? byDay.get(key) ?? [] : [];
      const maxShow = monthExpandDay === key ? 50 : 3;
      const shown = dayEvents.slice(0, maxShow);
      const more = dayEvents.length - shown.length;
      const chips = shown
        .map((ev) => {
          const inst = selectedId ?? 0;
          const label = formatEventChipLabel(ev);
          return `<button type="button" class="month-event${!ev.allDay ? " is-timed" : ""}" title="${esc(label)}" style="--ev-color:${esc(color)}"
            data-action="open-event" data-instance="${inst}" data-uri="${esc(ev.uri)}" ${busy ? "disabled" : ""}>${esc(label)}</button>`;
        })
        .join("");
      const moreHtml =
        more > 0
          ? `<button type="button" class="month-event-more" data-action="open-event-day" data-day="${esc(key)}" title="Show all events this day" ${busy ? "disabled" : ""}>+${more} more</button>`
          : "";
      const dayLabel =
        !inMonth && (dayNum === 1 || i === startPad + daysInMonth)
          ? cellDate.toLocaleString(undefined, { month: "short", day: "numeric" })
          : String(dayNum);
      const canCreate = !!(
        selected &&
        !selected.readOnly &&
        (selected.canShare || selected.access === "readwrite")
      );
      cells.push(`<div class="month-cell${inMonth ? "" : " is-outside"}${isToday ? " is-today" : ""}${canCreate ? " is-clickable" : ""}"${
        canCreate
          ? ` data-action="new-event-day" data-day="${esc(key)}" role="button" tabindex="0" title="Add event on ${esc(key)}"`
          : ""
      }>
        <div class="month-daynum${isToday ? " is-today-num" : ""}">${esc(dayLabel)}</div>
        <div class="month-events">${chips}${moreHtml}</div>
      </div>`);
    }

    const emptyHint =
      !selected
        ? calendars.length === 0
          ? `<p class="muted small month-empty-hint">No calendars yet — create one on the left, or wait for someone to share with you.</p>`
          : `<p class="muted small month-empty-hint">Select a calendar on the left (owned or shared) to view events.</p>`
        : monthEventsLoading
          ? `<p class="muted small month-empty-hint">Loading events…</p>`
          : "";

    return `<section class="card month-cal-card">
      <div class="month-cal-toolbar">
        <button type="button" class="btn btn-ghost btn-small" data-action="month-today" ${busy ? "disabled" : ""}>Today</button>
        <div class="month-nav">
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-prev" aria-label="Previous month" ${busy ? "disabled" : ""}>‹</button>
          <button type="button" class="btn btn-ghost btn-small month-nav-btn" data-action="month-next" aria-label="Next month" ${busy ? "disabled" : ""}>›</button>
        </div>
        <h2 class="month-cal-title">${esc(monthTitle(y, m))}</h2>
        <span class="month-cal-name muted small" title="${esc(calName)}">
          <span class="cal-swatch" style="background:${esc(color)};margin-top:0"></span>
          ${esc(calName)}
        </span>
      </div>
      ${emptyHint}
      <div class="month-grid-wrap" role="grid" aria-label="Month calendar">
        <div class="month-dow-row" role="row">
          ${dowLabels.map((l) => `<div class="month-dow">${esc(l)}</div>`).join("")}
        </div>
        <div class="month-grid" role="rowgroup">
          ${cells.join("")}
        </div>
      </div>
    </section>`;
  }

  function toDateInputValue(iso: string | null | undefined): string {
    if (!iso) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
    return ymd(d);
  }

  /** Prefer 12-hour clock? Uses portal YAML/env override, then browser hourCycle. */
  function preferHour12(): boolean {
    if (portalUi.timeFormat === "24h") return false;
    if (portalUi.timeFormat === "12h") return true;
    try {
      const ro = new Intl.DateTimeFormat(undefined, { hour: "numeric" }).resolvedOptions() as {
        hourCycle?: string;
        hour12?: boolean;
      };
      if (ro.hourCycle === "h23" || ro.hourCycle === "h24") return false;
      if (ro.hourCycle === "h11" || ro.hourCycle === "h12") return true;
      if (typeof ro.hour12 === "boolean") return ro.hour12;
    } catch {
      /* fall through */
    }
    // If browser still reports US English with system 24h clocks, many still get h12 —
    // default to 24h when language is not a known 12h region.
    const lang = (navigator.language || "").toLowerCase();
    return /^(en-us|en-ca|en-ph|en-au|en-nz)\b/.test(lang);
  }

  function timeFormatOpts(): Intl.DateTimeFormatOptions {
    return preferHour12()
      ? { hour: "numeric", minute: "2-digit", hour12: true }
      : { hour: "2-digit", minute: "2-digit", hour12: false };
  }

  /** Locale first day of week: 0=Sunday … 6=Saturday (Date.getDay() style). */
  function localeWeekStart(): number {
    if (portalUi.weekStart === "monday") return 1;
    if (portalUi.weekStart === "sunday") return 0;
    const tags = [...(navigator.languages?.length ? navigator.languages : []), navigator.language].filter(
      Boolean,
    ) as string[];
    for (const tag of tags) {
      try {
        const loc = new Intl.Locale(tag);
        const wi =
          typeof (loc as Intl.Locale & { getWeekInfo?: () => { firstDay: number } }).getWeekInfo ===
          "function"
            ? (loc as Intl.Locale & { getWeekInfo: () => { firstDay: number } }).getWeekInfo()
            : (loc as Intl.Locale & { weekInfo?: { firstDay?: number } }).weekInfo;
        // weekInfo.firstDay: 1=Monday … 7=Sunday
        const fd = wi?.firstDay;
        if (typeof fd === "number") {
          return fd === 7 ? 0 : fd;
        }
      } catch {
        /* try next tag */
      }
    }
    // Fallback by language/region (not browser clock settings)
    const lang = (navigator.language || "en").toLowerCase();
    if (/^(en-us|en-ca|en-ph|ja|zh|ko|he|ar)\b/.test(lang)) return 0;
    return 1; // Monday default (EU and most of world)
  }

  function localeDowLabels(): string[] {
    // Short weekday names in locale order starting at localeWeekStart
    const start = localeWeekStart();
    // 2024-01-07 is a Sunday
    const base = new Date(2024, 0, 7 + start);
    const labels: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      labels.push(d.toLocaleDateString(undefined, { weekday: "short" }));
    }
    return labels;
  }

  /** Round date up to next stepMinutes boundary (default 15). */
  function roundUpTime(d: Date, stepMinutes = 15): Date {
    const step = stepMinutes * 60 * 1000;
    const t = d.getTime();
    if (t % step === 0) return new Date(t);
    return new Date(Math.ceil(t / step) * step);
  }

  function formatLocalDtValue(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function formatDtDisplay(value: string, allDay: boolean): string {
    if (!value) return "Select…";
    if (allDay || /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const day = value.slice(0, 10);
      const [ys, ms, ds] = day.split("-").map(Number);
      const d = new Date(ys, ms - 1, ds);
      return d.toLocaleDateString(undefined, {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
    const d = new Date(value.includes("T") && value.length === 16 ? value : value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      ...timeFormatOpts(),
    });
  }

  function parseDtParts(value: string): { date: string; hm: string } {
    if (!value) {
      const n = roundUpTime(new Date());
      return { date: ymd(n), hm: `${String(n.getHours()).padStart(2, "0")}:${String(n.getMinutes()).padStart(2, "0")}` };
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return { date: value, hm: "09:00" };
    }
    const d = new Date(value.length === 16 ? value : value);
    if (Number.isNaN(d.getTime())) {
      return { date: value.slice(0, 10), hm: "09:00" };
    }
    return {
      date: ymd(d),
      hm: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
    };
  }

  /** Default timed range: now rounded up → +1 hour (or 09:00–10:00 on another day). */
  function defaultTimedRange(dayYmd?: string): { start: string; end: string } {
    const now = new Date();
    const today = ymd(now);
    if (dayYmd && dayYmd !== today) {
      const [ys, ms, ds] = dayYmd.split("-").map(Number);
      const s = new Date(ys, ms - 1, ds, 9, 0, 0, 0);
      const e = new Date(ys, ms - 1, ds, 10, 0, 0, 0);
      return { start: formatLocalDtValue(s), end: formatLocalDtValue(e) };
    }
    const s = roundUpTime(now, 15);
    const e = new Date(s.getTime() + 60 * 60 * 1000);
    return { start: formatLocalDtValue(s), end: formatLocalDtValue(e) };
  }

  function timeSlotList(): string[] {
    const slots: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
      }
    }
    return slots;
  }

  function renderPortalDateTimeField(opts: {
    field: string;
    name: string;
    label: string;
    value: string;
    dateOnly?: boolean;
    required?: boolean;
    disabled?: boolean;
    allowClear?: boolean;
  }): string {
    const {
      field,
      name,
      label,
      value,
      dateOnly = false,
      required,
      disabled,
      allowClear = true,
    } = opts;
    const open = eventDtPicker?.field === field;
    const display = formatDtDisplay(value, dateOnly);
    return `<div class="dt-field${open ? " is-open" : ""}" data-dt-id="${esc(field)}">
      <span class="dt-field-label">${esc(label)}</span>
      <input type="hidden" name="${esc(name)}" value="${esc(value)}" ${required ? "required" : ""} />
      <button type="button" class="dt-trigger" data-action="dt-open" data-dt-field="${esc(field)}"
        data-dt-name="${esc(name)}" data-dt-date-only="${dateOnly ? "1" : "0"}" data-dt-clear="${allowClear ? "1" : "0"}"
        ${disabled ? "disabled" : ""} aria-expanded="${open}">
        <span class="dt-trigger-text">${esc(display)}</span>
        <span class="dt-trigger-icon" aria-hidden="true">▾</span>
      </button>
      ${
        open && !disabled
          ? renderPortalDateTimePopover(field, value, dateOnly, allowClear)
          : ""
      }
    </div>`;
  }

  function getDtFieldCurrentValue(field: string): string {
    if (field === "start") return String(editingEvent?.start || "");
    if (field === "end") return String(editingEvent?.end || "");
    if (field === "until") {
      return (
        editingEvent?.repeat?.until ||
        toDateInputValue(editingEvent?.start) ||
        ymd(new Date())
      );
    }
    if (field === "due") return toLocalInputValue(editingTask?.due);
    if (field === "dtstart") return toLocalInputValue(editingNote?.dtstart);
    if (field === "bulk-due") return bulkDueValue;
    if (field === "birthday") return String(editingContact?.birthday || "");
    return "";
  }

  function setDtFieldValue(field: string, value: string | null): void {
    if (field === "start" && editingEvent) {
      editingEvent = { ...editingEvent, start: value || "" };
      return;
    }
    if (field === "end" && editingEvent) {
      editingEvent = { ...editingEvent, end: value };
      return;
    }
    if (field === "until" && editingEvent) {
      editingEvent = {
        ...editingEvent,
        repeat: {
          ...(editingEvent.repeat ?? defaultRepeat()),
          until: value,
          endMode: "until",
        },
      };
      return;
    }
    if (field === "due" && editingTask) {
      // Store ISO when timed local value set; null clears
      if (value === null || value === "") {
        editingTask = { ...editingTask, due: null };
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        editingTask = { ...editingTask, due: new Date(value + "T00:00:00").toISOString() };
      } else {
        const d = new Date(value.length === 16 ? value : value);
        editingTask = {
          ...editingTask,
          due: Number.isNaN(d.getTime()) ? value : d.toISOString(),
        };
      }
      return;
    }
    if (field === "dtstart" && editingNote) {
      if (value === null || value === "") {
        editingNote = { ...editingNote, dtstart: null };
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        editingNote = { ...editingNote, dtstart: new Date(value + "T00:00:00").toISOString() };
      } else {
        const d = new Date(value.length === 16 ? value : value);
        editingNote = {
          ...editingNote,
          dtstart: Number.isNaN(d.getTime()) ? value : d.toISOString(),
        };
      }
      return;
    }
    if (field === "birthday" && editingContact) {
      editingContact = {
        ...editingContact,
        birthday: value && /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : null,
      };
      return;
    }
    if (field === "bulk-due") {
      bulkDueValue = value || "";
    }
  }

  function renderPortalDateTimePopover(
    field: string,
    value: string,
    dateOnly: boolean,
    allowClear: boolean,
  ): string {
    const parts = parseDtParts(value);
    const viewY = eventDtPicker?.viewY ?? Number(parts.date.slice(0, 4));
    const viewM = eventDtPicker?.viewM ?? Number(parts.date.slice(5, 7)) - 1;
    const weekStart = localeWeekStart();
    const dowLabels = localeDowLabels();
    const first = new Date(viewY, viewM, 1);
    const startPad = (first.getDay() - weekStart + 7) % 7;
    const daysInMonth = new Date(viewY, viewM + 1, 0).getDate();
    const prevDays = new Date(viewY, viewM, 0).getDate();
    const selectedDate = parts.date;
    const selectedHm = parts.hm;
    const title = new Date(viewY, viewM, 1).toLocaleString(undefined, {
      month: "long",
      year: "numeric",
    });
    const cells: string[] = [];
    const total = Math.ceil((startPad + daysInMonth) / 7) * 7;
    for (let i = 0; i < total; i++) {
      let dayNum: number;
      let cellDate: Date;
      let outside = false;
      if (i < startPad) {
        dayNum = prevDays - startPad + i + 1;
        cellDate = new Date(viewY, viewM - 1, dayNum);
        outside = true;
      } else if (i >= startPad + daysInMonth) {
        dayNum = i - (startPad + daysInMonth) + 1;
        cellDate = new Date(viewY, viewM + 1, dayNum);
        outside = true;
      } else {
        dayNum = i - startPad + 1;
        cellDate = new Date(viewY, viewM, dayNum);
      }
      const key = ymd(cellDate);
      const isSel = key === selectedDate;
      const isToday = key === ymd(new Date());
      cells.push(
        `<button type="button" class="dt-day${outside ? " is-outside" : ""}${isSel ? " is-selected" : ""}${isToday ? " is-today" : ""}" data-action="dt-pick-day" data-dt-field="${field}" data-day="${esc(key)}">${dayNum}</button>`,
      );
    }
    const timeList = dateOnly
      ? ""
      : `<div class="dt-times" role="listbox" aria-label="Time">
          ${timeSlotList()
            .map((hm) => {
              const label = (() => {
                const [h, m] = hm.split(":").map(Number);
                const d = new Date(2000, 0, 1, h, m);
                return d.toLocaleTimeString(undefined, timeFormatOpts());
              })();
              return `<button type="button" class="dt-time${hm === selectedHm ? " is-selected" : ""}" data-action="dt-pick-time" data-dt-field="${field}" data-hm="${hm}" role="option" aria-selected="${hm === selectedHm}">${esc(label)}</button>`;
            })
            .join("")}
        </div>`;
    // Fixed position is applied after render (positionDtPopovers) so it isn't clipped by the modal
    return `<div class="dt-popover" data-dt-popover="${field}" role="dialog" aria-label="Choose date${dateOnly ? "" : " and time"}">
      <div class="dt-popover-inner${dateOnly ? " is-date-only" : ""}">
        <div class="dt-cal">
          <div class="dt-cal-toolbar">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-prev" data-dt-field="${field}" aria-label="Previous month">‹</button>
            <span class="dt-cal-title">${esc(title)}</span>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-month-next" data-dt-field="${field}" aria-label="Next month">›</button>
          </div>
          <div class="dt-dow-row">${dowLabels.map((l) => `<span class="dt-dow">${esc(l)}</span>`).join("")}</div>
          <div class="dt-days">${cells.join("")}</div>
          <div class="dt-cal-footer">
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-clear" data-dt-field="${esc(field)}" ${allowClear ? "" : "disabled"}>Clear</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="dt-today" data-dt-field="${field}">Today</button>
          </div>
        </div>
        ${timeList}
      </div>
    </div>`;
  }

  /** Place open date/time popovers in the viewport (avoid modal overflow clipping). */
  function positionDtPopovers() {
    root.querySelectorAll<HTMLElement>(".dt-field.is-open").forEach((field) => {
      const trigger = field.querySelector<HTMLElement>(".dt-trigger");
      const pop = field.querySelector<HTMLElement>(".dt-popover");
      if (!trigger || !pop) return;
      const r = trigger.getBoundingClientRect();
      const margin = 8;
      // Measure after making visible with fixed coords
      pop.style.position = "fixed";
      pop.style.visibility = "hidden";
      pop.style.top = "0";
      pop.style.left = "0";
      const pw = pop.offsetWidth || 320;
      const ph = pop.offsetHeight || 300;
      let top = r.bottom + 6;
      if (top + ph > window.innerHeight - margin) {
        top = Math.max(margin, r.top - ph - 6);
      }
      let left = r.left;
      if (left + pw > window.innerWidth - margin) {
        left = Math.max(margin, window.innerWidth - pw - margin);
      }
      if (left < margin) left = margin;
      pop.style.top = `${Math.round(top)}px`;
      pop.style.left = `${Math.round(left)}px`;
      pop.style.right = "auto";
      pop.style.visibility = "visible";
      pop.style.zIndex = "200";
    });
  }

  function defaultRepeat(): {
    freq: string;
    interval: number;
    until: string | null;
    count: number | null;
    byDay: string[];
    endMode: "never" | "until" | "count";
  } {
    return { freq: "", interval: 1, until: null, count: null, byDay: [], endMode: "never" };
  }

  function repeatEndMode(rep: {
    until?: string | null;
    count?: number | null;
    endMode?: "never" | "until" | "count";
  }): "never" | "until" | "count" {
    if (rep.endMode === "until" || rep.endMode === "count" || rep.endMode === "never") {
      return rep.endMode;
    }
    if (rep.until) return "until";
    if (rep.count) return "count";
    return "never";
  }

  function renderEventModal(): string {
    if (!eventModalOpen || !editingEvent) return "";
    const e = editingEvent;
    const rep = e.repeat ?? defaultRepeat();
    const freq = (rep.freq || "").toUpperCase();
    const writableCals = calendars.filter((c) => c.canShare || c.access === "readwrite");
    const calOpts = calendars
      .filter((c) => {
        if (c.id === e.instanceId) return true;
        if (c.readOnly) return false;
        return c.canShare || c.access === "readwrite";
      })
      .map(
        (c) =>
          `<option value="${c.id}" ${c.id === e.instanceId ? "selected" : ""}>${esc(c.displayname)}</option>`,
      )
      .join("");
    const ro = e.readOnly || !e.canWrite;
    // Timed values must be datetime-local; if still date-only after toggle, use span conversion
    let startVal: string;
    let endVal: string;
    if (e.allDay) {
      startVal = toDateInputValue(e.start);
      endVal = toDateInputValue(e.end);
    } else {
      const s = e.start || "";
      const en = e.end || "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        const conv = convertAllDaySpanToTimed(s, en || null);
        startVal = conv.start;
        endVal = conv.end || "";
      } else {
        startVal = toLocalInputValue(e.start);
        endVal = toLocalInputValue(e.end);
      }
    }
    const weekDays: { code: string; label: string }[] = [
      { code: "MO", label: "Mon" },
      { code: "TU", label: "Tue" },
      { code: "WE", label: "Wed" },
      { code: "TH", label: "Thu" },
      { code: "FR", label: "Fri" },
      { code: "SA", label: "Sat" },
      { code: "SU", label: "Sun" },
    ];
    const byDay = new Set((rep.byDay || []).map((d) => d.toUpperCase()));
    const endMode = repeatEndMode(rep);
    // Series end date (Until) replaces the event End control; Start stays editable
    const endDisabledByRepeat = !!freq && endMode === "until";
    const untilVal = rep.until || (endMode === "until" ? toDateInputValue(e.start) || ymd(new Date()) : "");
    return `<div class="cal-modal" id="event-edit-modal" role="dialog" aria-modal="true" aria-labelledby="event-modal-title">
      <div class="cal-modal-backdrop" data-action="close-event-modal"></div>
      <div class="cal-modal-card">
        <header class="cal-modal-header">
          <h3 id="event-modal-title">${creatingEvent ? "New event" : "Edit event"}</h3>
          <button type="button" class="info-modal-close" data-action="close-event-modal" aria-label="Close">×</button>
        </header>
        <div class="cal-modal-body">
          ${renderFlashBanner()}
          ${
            !creatingEvent && (e.hasRrule || freq)
              ? `<p class="muted small" style="margin:0 0 0.75rem">Repeat rules apply to the whole series (CalDAV RRULE).</p>`
              : ""
          }
          ${ro ? `<p class="muted small" style="margin:0 0 0.75rem"><strong>Read-only:</strong> you cannot edit or delete this event.</p>` : ""}
          <form class="stack" data-form="edit-event">
            <label>Calendar
              <select name="instanceId" ${ro || writableCals.length === 0 ? "disabled" : ""}>
                ${calOpts || `<option value="${e.instanceId}">${esc(e.calendarName)}</option>`}
              </select>
            </label>
            <label>Title
              <input type="text" name="summary" required maxlength="500" value="${esc(e.summary)}" ${ro ? "readonly" : ""} />
            </label>
            <label>Location
              <input type="text" name="location" maxlength="500" value="${esc(e.location)}" ${ro ? "readonly" : ""} />
            </label>
            <label>Description
              <textarea name="description" rows="4" maxlength="20000" ${ro ? "readonly" : ""}>${esc(e.description)}</textarea>
            </label>
            <label class="checkbox">
              <input type="checkbox" name="allDay" data-action="event-allday-toggle" ${e.allDay ? "checked" : ""} ${ro ? "disabled" : ""} />
              All-day event
            </label>
            <div class="form-grid form-grid-2 dt-fields-row">
              ${renderPortalDateTimeField({
                field: "start",
                name: "start",
                label: "Start",
                value: startVal,
                dateOnly: e.allDay,
                required: true,
                disabled: ro,
                allowClear: false,
              })}
              ${renderPortalDateTimeField({
                field: "end",
                name: "end",
                label: "End",
                value: endVal,
                dateOnly: e.allDay,
                disabled: ro || endDisabledByRepeat,
                allowClear: !endDisabledByRepeat,
              })}
            </div>
            <fieldset class="event-repeat" ${ro ? "disabled" : ""}>
              <legend class="event-repeat-legend">Repeat</legend>
              <div class="form-grid form-grid-2">
                <label>Frequency
                  <select name="repeatFreq" data-action="event-repeat-freq">
                    <option value="" ${!freq ? "selected" : ""}>Does not repeat</option>
                    <option value="DAILY" ${freq === "DAILY" ? "selected" : ""}>Daily</option>
                    <option value="WEEKLY" ${freq === "WEEKLY" ? "selected" : ""}>Weekly</option>
                    <option value="MONTHLY" ${freq === "MONTHLY" ? "selected" : ""}>Monthly</option>
                    <option value="YEARLY" ${freq === "YEARLY" ? "selected" : ""}>Yearly</option>
                  </select>
                </label>
                <label>Every
                  <input type="number" name="repeatInterval" min="1" max="99" value="${esc(String(rep.interval || 1))}" ${!freq ? "disabled" : ""} />
                </label>
              </div>
              ${
                freq === "WEEKLY"
                  ? `<div class="event-byday" role="group" aria-label="Days of week">
                      ${weekDays
                        .map(
                          (d) =>
                            `<label class="checkbox event-byday-item">
                              <input type="checkbox" name="repeatByDay" value="${d.code}" ${byDay.has(d.code) ? "checked" : ""} />
                              ${d.label}
                            </label>`,
                        )
                        .join("")}
                    </div>`
                  : ""
              }
              ${
                freq
                  ? `<div class="form-grid form-grid-2" style="margin-top:0.5rem">
                      <label>Ends
                        <select name="repeatEndMode" data-action="event-repeat-end">
                          <option value="never" ${endMode === "never" ? "selected" : ""}>Never</option>
                          <option value="until" ${endMode === "until" ? "selected" : ""}>On date</option>
                          <option value="count" ${endMode === "count" ? "selected" : ""}>After count</option>
                        </select>
                      </label>
                      ${
                        endMode === "until"
                          ? renderPortalDateTimeField({
                              field: "until",
                              name: "repeatUntil",
                              label: "Until",
                              value: untilVal,
                              dateOnly: true,
                              disabled: ro,
                              allowClear: true,
                            })
                          : endMode === "count"
                            ? `<label>Occurrences
                                <input type="number" name="repeatCount" min="1" max="999" value="${esc(String(rep.count || 10))}" />
                              </label>`
                            : `<span></span>`
                      }
                    </div>`
                  : ""
              }
            </fieldset>
            <div class="form-actions-row" style="margin-top:0.5rem">
              ${
                !ro
                  ? `<button type="submit" class="btn btn-primary" ${busy ? "disabled" : ""}>${creatingEvent ? "Create event" : "Save event"}</button>
                     ${
                       !creatingEvent
                         ? `<button type="button" class="btn btn-danger" data-action="delete-event" ${busy ? "disabled" : ""}>Delete</button>`
                         : ""
                     }`
                  : ""
              }
              <button type="button" class="btn btn-ghost" data-action="close-event-modal">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>`;
  }

  function blankEventForDay(day: string, instanceId: number): CalendarEventDetail {
    const cal = calendars.find((c) => c.id === instanceId);
    return {
      uri: "",
      instanceId,
      calendarId: cal?.calendarId ?? 0,
      calendarName: cal?.displayname ?? "Calendar",
      calendarUri: cal?.uri ?? "",
      uid: "",
      summary: "",
      description: "",
      location: "",
      start: day,
      end: day,
      allDay: true,
      hasRrule: false,
      repeat: defaultRepeat(),
      readOnly: false,
      canWrite: true,
    };
  }

  async function loadContacts(abId: number) {
    const res = await api.contacts(abId, contactSearch);
    contacts = res.contacts;
    if (
      selectedContactUri !== null &&
      !contacts.some((c) => c.uri === selectedContactUri)
    ) {
      selectedContactUri = null;
      if (!creatingContact) {
        editingContact = null;
        photoPreview = null;
        photoBase64Pending = null;
        removePhotoPending = false;
      }
    }
  }

  async function loadTasks() {
    const res = await api.tasks({ q: taskSearch, sort: taskSort, order: taskOrder });
    tasks = res.tasks;
    taskCalendars = res.calendars;
    const keySet = new Set(tasks.map((t) => itemKey(t.instanceId, t.uri)));
    checkedTaskKeys = checkedTaskKeys.filter((k) => keySet.has(k));
    if (
      selectedTaskKey !== null &&
      !tasks.some((t) => `${t.instanceId}|${t.uri}` === selectedTaskKey)
    ) {
      selectedTaskKey = null;
      if (!creatingTask) editingTask = null;
    }
  }

  async function loadNotes() {
    const res = await api.notes({ q: noteSearch, sort: noteSort, order: noteOrder });
    notes = res.notes;
    noteCalendars = res.calendars;
    if (
      selectedNoteKey !== null &&
      !notes.some((n) => `${n.instanceId}|${n.uri}` === selectedNoteKey)
    ) {
      selectedNoteKey = null;
      if (!creatingNote) editingNote = null;
    }
  }

  function itemKey(instanceId: number, uri: string): string {
    return `${instanceId}|${uri}`;
  }

  function formatWhen(iso: string | null | undefined): string {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return iso;
      return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  }

  function toLocalInputValue(iso: string | null | undefined): string {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return "";
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return "";
    }
  }

  function sortHeader(
    label: string,
    col: string,
    current: string,
    order: "asc" | "desc",
    kind: "task" | "note",
    colClass = "",
  ): string {
    const active = current === col;
    const arrow = active ? (order === "asc" ? " ▲" : " ▼") : "";
    const cls = `sortable-th${active ? " is-sorted" : ""}${colClass ? " " + colClass : ""}`;
    return `<th class="${cls}" data-action="sort-${kind}" data-sort="${esc(col)}" role="columnheader" tabindex="0">${esc(label)}${arrow}</th>`;
  }

  async function openContact(uri: string) {
    if (selectedAbId === null) return;
    const res = await api.getContact(selectedAbId, uri);
    selectedContactUri = uri;
    creatingContact = false;
    const contact = res.contact;
    // Normalize optional arrays so the form never crashes on incomplete payloads
    editingContact = {
      ...contact,
      emails: Array.isArray(contact.emails) ? contact.emails : [],
      phones: Array.isArray(contact.phones) ? contact.phones : [],
      custom: Array.isArray(contact.custom) ? contact.custom : [],
      address: contact.address ?? emptyAddress(),
      birthday: contact.birthday ?? null,
    };
    // Prefer photo endpoint over embedded data URI (smaller JSON, consistent cache)
    photoPreview =
      contact.photoDataUri ??
      (contact.hasPhoto && selectedAbId !== null
        ? `${api.contactPhotoUrl(selectedAbId, uri)}?t=${Date.now()}`
        : null);
    photoBase64Pending = null;
    removePhotoPending = false;
    contactModalOpen = true;
  }

  function startNewContact() {
    creatingContact = true;
    selectedContactUri = null;
    contactModalOpen = true;
    editingContact = {
      uri: "",
      displayname: "",
      firstname: "",
      lastname: "",
      fullname: "",
      org: "",
      title: "",
      emails: [""],
      phones: [{ type: "cell", value: "" }],
      address: { street: "", city: "", region: "", postal: "", country: "" },
      birthday: null,
      url: "",
      note: "",
      custom: [],
      hasPhoto: false,
      photoDataUri: null,
    };
    photoPreview = null;
    photoBase64Pending = null;
    removePhotoPending = false;
  }

  function emptyAddress() {
    return { street: "", city: "", region: "", postal: "", country: "" };
  }

  function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const r = String(reader.result ?? "");
        const comma = r.indexOf(",");
        resolve(comma >= 0 ? r.slice(comma + 1) : r);
      };
      reader.onerror = () => reject(new Error("Failed to read photo file"));
      reader.readAsDataURL(file);
    });
  }

  function shell(
    body: string,
    opts: { auth?: boolean; tabs?: string } = {},
  ): string {
    const inAdmin = !!user && activeTab === "admin" && userIsAdmin() && adminUiEnabled();
    // Logo + wordmark: DAV blue; portal name after · is soft green (user) / soft red (admin)
    const portalName = inAdmin ? "Administration Portal" : "User Portal";
    const portalClass = inAdmin ? "brand-portal brand-portal-admin" : "brand-portal brand-portal-user";
    const brand = `
      <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
      <span class="brand-text">Angara<span class="brand-dav">DAV</span><span class="brand-sep" aria-hidden="true"> · </span><span class="${portalClass}">${esc(portalName)}</span></span>`;
    const displayName = user ? esc(user.displayname || user.username) : "";
    const adminMenuItem = adminUiEnabled()
      ? `<button type="button" class="user-menu-item${activeTab === "admin" ? " is-active" : ""}" role="menuitem" data-action="tab" data-tab="admin">
              Administration
            </button>`
      : "";
    const userPortalMenuItem =
      inAdmin
        ? `<button type="button" class="user-menu-item" role="menuitem" data-action="tab" data-tab="calendars">
              User portal
            </button>`
        : "";
    const userMenu = user
      ? `<div class="user-menu${userMenuOpen ? " is-open" : ""}">
            <button type="button" class="user-menu-trigger" data-action="user-menu-toggle"
              aria-haspopup="menu" aria-expanded="${userMenuOpen ? "true" : "false"}"
              title="${displayName}">
              <span class="user-menu-name">${displayName}</span>
              <span class="user-menu-caret" aria-hidden="true">▾</span>
            </button>
            <div class="user-menu-dropdown" role="menu" ${userMenuOpen ? "" : "hidden"}>
              ${userPortalMenuItem}
              ${adminMenuItem}
              <button type="button" class="user-menu-item user-menu-item-danger" role="menuitem" data-action="logout">
                Log out
              </button>
            </div>
          </div>`
      : "";
    const nav = user
      ? `<nav class="topnav">
          <a class="brand" href="/portal/">${brand}</a>
          <div class="topnav-right">
            ${userMenu}
          </div>
        </nav>`
      : `<nav class="topnav">
          <a class="brand" href="/portal/">${brand}</a>
        </nav>`;

    // When calendar/event/contact/AB modals are open, flash is rendered inside the modal instead
    const flashOnMain = !(
      calModalOpen ||
      createCalModalOpen ||
      deleteConfirmId !== null ||
      deleteAbConfirmId !== null ||
      eventModalOpen ||
      contactModalOpen ||
      abModalOpen
    );
    const flashHtml = flashOnMain ? renderFlashBanner() : "";

    // Full-width sticky tab strip under topnav (same height for user + admin)
    const tabsBar =
      opts.tabs && opts.tabs.trim() !== ""
        ? `<div class="tabs-bar" role="presentation">
        <div class="tabs-bar-inner">
          ${opts.tabs}
        </div>
      </div>`
        : "";

    const footer = `
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>AngaraDAV portal <span class="mono">v${esc(appVersion)}</span></span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="/dav.php/">DAV browser</a>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${esc(DOCS_URL)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>`;

    // Preserve layout-* toggles applied after shell (e.g. layout-contacts); auth replaces them.
    if (opts.auth) {
      document.body.className = "layout-auth";
    } else {
      document.body.classList.remove("layout-auth");
    }

    // Single sticky chrome stack (topnav + tabs) so heights match user/admin
    // and content never scrolls under rounded tab corners.
    return `<div class="app-chrome">
      ${nav}
      ${tabsBar}
    </div>
      <main class="container">
        ${flashHtml}
        ${body}
      </main>
      ${footer}
      ${infoModalHtml()}
      ${renderImportProgressModal()}`;
  }

  /** Success/error banner; shown on main page or inside open calendar modal. */
  function renderFlashBanner(): string {
    if (!flash) return "";
    return renderFlash(flash.type, flash.message, { dismissible: true });
  }

  function formatFileSize(bytes: number): string {
    if (!Number.isFinite(bytes) || bytes < 0) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function formatElapsed(sec: number): string {
    const s = Math.max(0, Math.floor(sec));
    const m = Math.floor(s / 60);
    const r = s % 60;
    return m > 0 ? `${m}m ${r}s` : `${r}s`;
  }

  function stopImportElapsedTimer(): void {
    if (importElapsedTimer !== null) {
      clearInterval(importElapsedTimer);
      importElapsedTimer = null;
    }
  }

  function startImportElapsedTimer(): void {
    stopImportElapsedTimer();
    importElapsedTimer = setInterval(() => {
      if (!importProgress || importProgress.phase === "done" || importProgress.phase === "error") {
        stopImportElapsedTimer();
        return;
      }
      importProgress = {
        ...importProgress,
        elapsedSec: Math.floor((Date.now() - importProgress.startedAt) / 1000),
      };
      // Light update: status + bar without full re-render
      if (importProgress.phase === "processing") {
        updateImportProgressDom(importProgress);
      }
    }, 1000);
  }

  function setImportPhase(
    phase: ImportProgress["phase"],
    extra: Partial<ImportProgress> = {},
  ): void {
    if (!importProgress) return;
    importProgress = {
      ...importProgress,
      phase,
      elapsedSec: Math.floor((Date.now() - importProgress.startedAt) / 1000),
      ...extra,
    };
    render();
  }

  function closeImportProgress(): void {
    stopImportElapsedTimer();
    importProgress = null;
    render();
  }

  function applyServerImportProgress(p: {
    percent: number;
    current: number;
    total: number;
    imported: number;
    updated: number;
    skipped: number;
  }): void {
    if (!importProgress || importProgress.phase === "done" || importProgress.phase === "error") {
      return;
    }
    importProgress = {
      ...importProgress,
      phase: "processing",
      processPercent: p.percent,
      processCurrent: p.current,
      processTotal: p.total,
      processImported: p.imported,
      processUpdated: p.updated,
      processSkipped: p.skipped,
      elapsedSec: Math.floor((Date.now() - importProgress.startedAt) / 1000),
    };
    updateImportProgressDom(importProgress);
  }

  function updateImportProgressDom(p: ImportProgress): void {
    const status = root.querySelector<HTMLElement>("[data-import-status-line]");
    const bar = root.querySelector<HTMLElement>(".import-progress-bar");
    const track = root.querySelector<HTMLElement>(".import-progress-track");
    const counts = root.querySelector<HTMLElement>("[data-import-counts]");
    const unit = p.kind === "calendar" ? "items" : "contacts";
    let statusLine: string;
    if (p.phase === "processing" && p.processTotal > 0) {
      statusLine = `Importing ${p.processCurrent.toLocaleString()} / ${p.processTotal.toLocaleString()} ${unit} (${p.processPercent ?? 0}%) · ${formatElapsed(p.elapsedSec)}`;
    } else if (p.phase === "processing") {
      statusLine = `Importing on server… ${formatElapsed(p.elapsedSec)}`;
    } else {
      return;
    }
    if (status) status.textContent = statusLine;
    if (counts) {
      counts.textContent = `${p.processImported} new · ${p.processUpdated} updated${p.processSkipped ? ` · ${p.processSkipped} skipped` : ""}`;
    }
    if (bar && p.processPercent !== null) {
      bar.classList.remove("is-indeterminate");
      bar.style.width = `${Math.min(100, Math.max(0, p.processPercent))}%`;
    }
    if (track && p.processPercent !== null) {
      track.setAttribute("aria-valuenow", String(p.processPercent));
      track.removeAttribute("aria-valuetext");
    }
  }

  function renderImportProgressModal(): string {
    if (!importProgress) return "";
    const p = importProgress;
    const running = p.phase !== "done" && p.phase !== "error";
    const kindLabel = p.kind === "calendar" ? "calendar (.ics)" : "contacts (.vcf)";
    const title =
      p.phase === "done"
        ? "Import finished"
        : p.phase === "error"
          ? "Import failed"
          : "Importing…";

    const stepsHtml = (() => {
      const order: Array<{ id: ImportProgress["phase"]; label: string }> = [
        { id: "reading", label: "Reading file" },
        { id: "uploading", label: "Uploading to server" },
        { id: "processing", label: "Importing on server" },
      ];
      const phaseRank: Record<string, number> = {
        reading: 0,
        uploading: 1,
        processing: 2,
        done: 3,
        error: 2,
      };
      const cur = phaseRank[p.phase] ?? 0;
      return order
        .map((s, i) => {
          let state: "pending" | "active" | "done" = "pending";
          if (p.phase === "done") state = "done";
          else if (i < cur) state = "done";
          else if (i === cur) state = p.phase === "error" ? "active" : "active";
          const icon = state === "done" ? "✓" : state === "active" ? "●" : "○";
          return `<li class="import-step import-step-${state}"><span class="import-step-icon" aria-hidden="true">${icon}</span> ${esc(s.label)}</li>`;
        })
        .join("");
    })();

    let body = "";
    if (running) {
      let barPct: number | null = null;
      if (p.phase === "reading" && p.readPercent !== null) {
        barPct = Math.min(100, Math.max(0, p.readPercent));
      } else if (p.phase === "processing" && p.processPercent !== null) {
        barPct = Math.min(100, Math.max(0, p.processPercent));
      }
      const barClass =
        barPct === null ? "import-progress-bar is-indeterminate" : "import-progress-bar";
      const barStyle = barPct !== null ? ` style="width:${barPct}%"` : "";
      const unit = p.kind === "calendar" ? "items" : "contacts";
      let statusLine: string;
      if (p.phase === "reading") {
        statusLine =
          p.readPercent !== null ? `Reading file… ${p.readPercent}%` : "Reading file…";
      } else if (p.phase === "uploading") {
        statusLine = "Uploading to server…";
      } else if (p.processTotal > 0) {
        statusLine = `Importing ${p.processCurrent.toLocaleString()} / ${p.processTotal.toLocaleString()} ${unit} (${p.processPercent ?? 0}%) · ${formatElapsed(p.elapsedSec)}`;
      } else {
        statusLine = `Importing on server… ${formatElapsed(p.elapsedSec)}`;
      }
      const countsLine =
        p.phase === "processing" && p.processTotal > 0
          ? `<p class="muted small" data-import-counts style="margin:0 0 0.5rem">${p.processImported} new · ${p.processUpdated} updated${p.processSkipped ? ` · ${p.processSkipped} skipped` : ""}</p>`
          : `<p class="muted small" data-import-counts style="margin:0 0 0.5rem;display:none"></p>`;
      body = `
        <p class="muted small" style="margin:0 0 0.75rem">
          Importing <strong>${esc(kindLabel)}</strong> from
          <span class="mono">${esc(p.fileName)}</span>
          ${p.fileSizeLabel ? ` <span class="muted">(${esc(p.fileSizeLabel)})</span>` : ""}
        </p>
        <ul class="import-steps">${stepsHtml}</ul>
        <div class="import-progress-track" role="progressbar"
          aria-valuemin="0" aria-valuemax="100"
          ${barPct !== null ? `aria-valuenow="${barPct}"` : 'aria-valuetext="In progress"'}
          aria-label="Import progress">
          <div class="${barClass}"${barStyle}></div>
        </div>
        <p class="import-status-line" data-import-status-line>${esc(statusLine)}</p>
        ${countsLine}
        <p class="muted small">Keep this tab open until the import finishes.
          ${p.kind === "calendar" ? "Each event is written separately — ~1&nbsp;MB calendars can take several minutes on a NAS." : ""}
        </p>`;
    } else if (p.phase === "done") {
      body = `
        ${renderFlash("success", `Success. ${p.resultMessage || "Import completed."}`, {
          className: "import-result",
          style: "margin:0 0 1rem",
        })}
        <p class="muted small" style="margin:0">
          File: <span class="mono">${esc(p.fileName)}</span>
          · Took ${esc(formatElapsed(p.elapsedSec))}
        </p>`;
    } else {
      body = `
        ${renderFlash("error", `Failed. ${p.resultMessage || "Import failed."}`, {
          className: "import-result",
          style: "margin:0 0 1rem",
        })}
        <p class="muted small" style="margin:0">
          File: <span class="mono">${esc(p.fileName)}</span>
          · After ${esc(formatElapsed(p.elapsedSec))}
        </p>
        <p class="muted small">Large imports can time out; try again — already-imported items update faster.</p>`;
    }

    const footer = running
      ? `<p class="muted small" style="margin:0">Please wait…</p>`
      : renderModalFooter([
          { label: "Close", action: "close-import-progress", variant: "primary" },
        ]);

    return renderModal({
      title,
      titleId: "import-progress-title",
      closeAction: "close-import-progress",
      size: "sm",
      className: "import-progress-modal",
      cardClassName: "import-progress-card",
      rootAttrs: "data-import-progress",
      hideClose: running,
      lockBackdrop: running,
      body,
      footer,
    });
  }

  function readFileTextWithProgress(
    file: File,
    onProgress: (pct: number | null) => void,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onprogress = (ev) => {
        if (ev.lengthComputable && ev.total > 0) {
          onProgress(Math.min(100, Math.round((ev.loaded / ev.total) * 100)));
        } else {
          onProgress(null);
        }
      };
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () =>
        reject(reader.error ?? new Error("Failed to read file"));
      reader.readAsText(file);
    });
  }

  function renderLogin() {
    root.innerHTML = shell(
      `<div class="auth-wrap">
        <div class="card auth-card">
          <h1>Sign in</h1>
          <p class="muted">Use your AngaraDAV <strong>DAV user</strong> credentials (not the admin password).</p>
          <form class="stack" data-form="login">
            <label>
              Username
              <input type="text" name="username" autocomplete="username" required />
            </label>
            <label>
              Password
              <input type="password" name="password" autocomplete="current-password" required />
            </label>
            <button type="submit" class="btn btn-primary" ${busy ? "disabled" : ""}>Sign in</button>
          </form>
          <p class="muted small" style="margin-top:1rem">
            CalDAV/CardDAV clients keep using <span class="mono">/dav.php/</span>. This portal is for calendars, sharing, and contacts.
          </p>
        </div>
      </div>`,
      { auth: true },
    );
  }

  function renderHome() {
    if (!user) {
      renderLogin();
      return;
    }

    const own = calendars.filter((c) => c.canShare);
    const sharedWithMe = calendars.filter((c) => !c.canShare);
    const selected = calendars.find((c) => c.id === selectedId) ?? null;

    const calRows = own
      .map((c) => {
        const active = c.id === selectedId ? " is-selected" : "";
        const color = c.color
          ? `<span class="cal-swatch" style="background:${esc(c.color)}"></span>`
          : `<span class="cal-swatch cal-swatch-empty"></span>`;
        const badges =
          accessBadge(c.access) +
          (c.readOnly ? '<span class="badge">read-only</span>' : "") +
          (c.holidaysCountry
            ? `<span class="badge badge-admin">holidays ${esc(c.holidaysCountry)}</span>`
            : "");
        return `<div class="cal-row${active}" data-action="select-cal" data-id="${c.id}" role="button" tabindex="0">
          ${color}
          <span class="cal-row-text">
            <span class="cal-row-title">${esc(c.displayname)}</span>
            <span class="cal-row-badges">${badges}</span>
            <span class="muted small mono cal-row-uri">${esc(c.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="edit-cal" data-id="${c.id}" ${busy ? "disabled" : ""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-cal" data-id="${c.id}" ${busy ? "disabled" : ""}>Delete</button>
          </span>
        </div>`;
      })
      .join("");

    const sharedRows = sharedWithMe
      .map((c) => {
        const active = c.id === selectedId ? " is-selected" : "";
        const color = c.color
          ? `<span class="cal-swatch" style="background:${esc(c.color)}"></span>`
          : `<span class="cal-swatch cal-swatch-empty"></span>`;
        const accessHint =
          c.access === "readwrite"
            ? "Shared with you · full access — select to view and edit events"
            : "Shared with you · read-only — select to view events";
        return `<div class="cal-row${active}" data-action="select-cal" data-id="${c.id}" role="button" tabindex="0" title="${esc(accessHint)}">
          ${color}
          <span class="cal-row-text">
            <span class="cal-row-title">${esc(c.displayname)}</span>
            <span class="cal-row-badges">${accessBadge(c.access)}</span>
            <span class="muted small">${c.access === "readwrite" ? "Shared · full access" : "Shared · read-only"}</span>
          </span>
        </div>`;
      })
      .join("");

    const userOptions = directory
      .map(
        (u) =>
          `<option value="${esc(u.username)}">${esc(u.displayname)} (${esc(u.username)})</option>`,
      )
      .join("");

    const shareRows =
      shares.length === 0
        ? `<tr><td colspan="3" class="muted">Not shared with anyone yet.</td></tr>`
        : shares
            .map(
              (s) => `<tr>
                <td>
                  <strong>${esc(s.displayname || s.username || s.href)}</strong>
                  <div class="muted small mono">${esc(s.username || s.href)}</div>
                </td>
                <td>${accessBadge(s.access)}</td>
                <td class="actions-cell">
                  <button type="button" class="btn btn-small btn-danger" data-action="revoke"
                    data-href="${esc(s.href)}" ${busy ? "disabled" : ""}>Revoke</button>
                </td>
              </tr>`,
            )
            .join("");

    const colorValue = selected?.color
      ? selected.color.length >= 7
        ? selected.color.slice(0, 7)
        : "#3B82F6"
      : "#3B82F6";

    const shareReadOnlyForced = !!(selected && selected.readOnly);
    const calModal =
      calModalOpen && selected && selected.canShare
        ? renderModal({
            id: "cal-edit-modal",
            title: "Calendar details",
            titleId: "cal-modal-title",
            closeAction: "close-cal-modal",
            body: `
                ${renderFlashBanner()}
                <section>
                  <p class="muted small mono" style="margin:0">
                    ${esc(selected.uri)}
                    <button type="button" class="info-btn" data-action="info" data-info="calendar-details"
                      aria-label="About calendar details" title="About calendar details"
                      style="vertical-align:middle;margin-left:0.35rem">
                      <span aria-hidden="true">i</span>
                    </button>
                  </p>
                  <form class="stack" data-form="edit-cal" style="margin-top:1rem">
                    <label>
                      Display name
                      <input type="text" name="displayname" required maxlength="200"
                        value="${esc(selected.displayname)}" autocomplete="off" />
                    </label>
                    <label>
                      Color
                      <span class="color-field">
                        <input type="color" name="color_picker" value="${esc(colorValue)}"
                          title="Pick a color" aria-label="Calendar color picker" />
                        <input type="text" name="color" class="mono" maxlength="9"
                          value="${esc(selected.color || colorValue)}"
                          placeholder="#3B82F6" pattern="#?[0-9A-Fa-f]{3,8}" autocomplete="off" />
                      </span>
                    </label>
                    <label>
                      Description
                      <textarea name="description" rows="3" maxlength="2000"
                        placeholder="Optional notes for this calendar">${esc(selected.description)}</textarea>
                    </label>
                    <div class="form-actions-row">
                      <button type="submit" class="btn btn-primary" ${busy ? "disabled" : ""}>Save changes</button>
                      <span class="muted small mono">${esc(selected.uri)}</span>
                    </div>
                  </form>
                </section>
                <section style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                  ${infoTitle(`Share “${selected.displayname}”`, "share")}
                  ${
                    shareReadOnlyForced
                      ? `<p class="muted small" style="margin-top:0.35rem"><strong>Read-only calendar:</strong> shares are always read-only.</p>`
                      : ""
                  }
                  <form class="form-grid" data-form="share" style="margin-top:1rem">
                    <label>
                      User
                      <select name="username" required ${directory.length === 0 ? "disabled" : ""}>
                        <option value="">${directory.length ? "Select user…" : "No other users"}</option>
                        ${userOptions}
                      </select>
                    </label>
                    <label>
                      Access
                      <select name="access" ${shareReadOnlyForced ? "disabled" : ""}>
                        <option value="read" selected>Read only</option>
                        ${shareReadOnlyForced ? "" : '<option value="readwrite">Full access</option>'}
                      </select>
                      ${shareReadOnlyForced ? '<input type="hidden" name="access" value="read" />' : ""}
                    </label>
                    <div class="form-actions">
                      <button type="submit" class="btn btn-primary" ${busy || directory.length === 0 ? "disabled" : ""}>Share</button>
                    </div>
                  </form>
                  <div class="table-wrap" style="margin-top:1.25rem">
                    <table>
                      <thead>
                        <tr><th>Shared with</th><th>Access</th><th></th></tr>
                      </thead>
                      <tbody>${shareRows}</tbody>
                    </table>
                  </div>
                </section>
                <section class="import-export" style="margin-top:1.5rem;padding-top:1.25rem;border-top:1px solid var(--border)">
                  ${infoTitle("Import / export", "import-export")}
                  ${
                    selected.readOnly
                      ? `<p class="muted small" style="margin-top:0.5rem"><strong>Read-only:</strong> import disabled.</p>`
                      : ""
                  }
                  <div class="form-actions-row" style="margin-top:0.75rem">
                    <button type="button" class="btn" data-action="export-cal" ${busy ? "disabled" : ""}>Export .ics</button>
                    <label class="btn btn-ghost file-btn" ${busy || selected.readOnly ? "aria-disabled=true" : ""}>
                      Import .ics
                      <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-cal" ${busy || selected.readOnly ? "disabled" : ""} hidden />
                    </label>
                  </div>
                </section>`,
            footer: [{ label: "Close", action: "close-cal-modal", variant: "ghost" }],
          })
        : "";

    const deleteTarget =
      deleteConfirmId !== null
        ? calendars.find((c) => c.id === deleteConfirmId && c.canShare) ?? null
        : null;
    const deleteModal = deleteTarget
      ? renderModal({
          id: "cal-delete-modal",
          title: "Delete calendar",
          titleId: "cal-delete-title",
          closeAction: "cancel-delete-cal",
          size: "sm",
          body: `
              ${renderFlashBanner()}
              <p>You are about to permanently delete <strong>${esc(deleteTarget.displayname)}</strong>
                <span class="muted small mono">(${esc(deleteTarget.uri)})</span>.</p>
              <p class="muted small">All events, tasks, and notes in this calendar will be removed. Shares will be revoked. This cannot be undone.</p>
              ${renderConfirmCheckbox({
                action: "toggle-delete-confirm",
                label: "I understand and want to permanently delete this calendar",
                id: "delete-cal-confirm",
                style: "checkbox",
              })}`,
          footer: [
            { label: "Cancel", action: "cancel-delete-cal", variant: "ghost", disabled: busy },
            {
              label: "Delete permanently",
              action: "confirm-delete-cal",
              variant: "danger",
              disabled: true,
              id: "delete-cal-submit",
              attrs: `data-id="${deleteTarget.id}"`,
            },
          ],
        })
      : "";

    const createCalModal = createCalModalOpen
      ? renderModal({
          id: "cal-create-modal",
          title: "Add calendar",
          titleId: "cal-create-title",
          closeAction: "close-create-cal-modal",
          body: `
              ${renderFlashBanner()}
              <p class="muted small" style="margin:0 0 0.75rem">
                Create a personal calendar, optional holidays feed, or a read-only calendar.
                <button type="button" class="info-btn" data-action="info" data-info="add-calendar"
                  aria-label="About add calendar" title="About add calendar"
                  style="vertical-align:middle;margin-left:0.25rem">
                  <span aria-hidden="true">i</span>
                </button>
              </p>
              <form class="stack" data-form="create-cal">
                <label>
                  Display name
                  <input type="text" name="displayname" id="create-displayname" maxlength="200" placeholder="Work" autocomplete="off" />
                </label>
                <label>
                  Color
                  <span class="color-field">
                    <input type="color" name="color_picker" value="#3B82F6" aria-label="New calendar color" />
                    <input type="text" name="color" class="mono" maxlength="9" value="#3B82F6" placeholder="#3B82F6" />
                  </span>
                </label>
                <label>
                  Description
                  <textarea name="description" rows="2" maxlength="2000" placeholder="Optional"></textarea>
                </label>
                <label class="checkbox">
                  <input type="checkbox" name="holidays" data-action="toggle-holidays" />
                  Holidays calendar
                </label>
                <label class="holidays-country" id="holidays-country-wrap" hidden>
                  Country
                  <select name="holidayCountry" id="holiday-country">
                    <option value="">Select country…</option>
                    ${holidayCountries
                      .map(
                        (c) =>
                          `<option value="${esc(c.code)}">${esc(c.name)} (${esc(c.code)})</option>`,
                      )
                      .join("")}
                  </select>
                </label>
                <label class="checkbox">
                  <input type="checkbox" name="readOnly" />
                  Read-only (for everyone)
                </label>
                <div class="form-actions-row form-actions-wrap">
                  <button type="submit" class="btn btn-primary" ${busy ? "disabled" : ""}>Create calendar</button>
                  <label class="btn btn-ghost file-btn" ${busy ? "aria-disabled=true" : ""} title="Create a calendar and import a .ics file">
                    Import .ics
                    <input type="file" accept=".ics,text/calendar,text/plain" data-action="import-create-cal" ${busy ? "disabled" : ""} hidden />
                  </label>
                  <button type="button" class="btn btn-ghost" data-action="close-create-cal-modal" ${busy ? "disabled" : ""}>Cancel</button>
                </div>
                <p class="muted small" style="margin:0.5rem 0 0">
                  <strong>Import .ics</strong> creates the calendar (name above, or the file name), then imports events. Not for holidays/read-only calendars.
                </p>
              </form>`,
        })
      : "";

    const calendarsTab = `
      <div class="portal-grid portal-grid-calendars">
        <aside class="calendars-sidebar">
          <section class="card calendars-sidebar-card">
            <div class="calendars-sidebar-head">
              ${infoTitle("Owned", "owned")}
            </div>
            <div class="cal-list calendars-owned-list">
              ${calRows || '<p class="muted">No calendars yet. Create one below.</p>'}
              ${
                sharedWithMe.length
                  ? `<div class="calendars-shared-block">
                       ${infoTitle("Shared with me", "shared-with-me")}
                       <div class="cal-list" style="margin-top:0.75rem">${sharedRows}</div>
                     </div>`
                  : ""
              }
            </div>
            <div class="calendars-sidebar-create">
              <button type="button" class="btn btn-primary" style="width:100%" data-action="open-create-cal-modal" ${busy ? "disabled" : ""}>Create calendar</button>
            </div>
          </section>
        </aside>
        ${renderMonthGrid()}
      </div>
      ${createCalModal}
      ${calModal}
      ${deleteModal}
      ${renderEventModal()}`;

    const abRows = addressBooks
      .map((a) => {
        const active = a.id === selectedAbId ? " is-selected" : "";
        return `<div class="cal-row${active}" data-action="select-ab" data-id="${a.id}" role="button" tabindex="0">
          <span class="cal-swatch cal-swatch-empty"></span>
          <span class="cal-row-text">
            <span class="cal-row-title">${esc(a.displayname)}</span>
            <span class="muted small">${a.cardCount} contact${a.cardCount === 1 ? "" : "s"}</span>
            <span class="muted small mono cal-row-uri">${esc(a.uri)}</span>
          </span>
          <span class="cal-row-actions">
            <button type="button" class="btn btn-small" data-action="edit-ab" data-id="${a.id}" ${busy ? "disabled" : ""}>Edit</button>
            <button type="button" class="btn btn-small btn-danger" data-action="delete-ab" data-id="${a.id}" ${busy ? "disabled" : ""}>Delete</button>
          </span>
        </div>`;
      })
      .join("");

    const selectedAb = addressBooks.find((a) => a.id === selectedAbId) ?? null;

    const contactTableBody =
      contacts.length === 0
        ? `<tr class="contacts-empty-row"><td colspan="4" class="muted">${
            contactSearch
              ? "No contacts match your search."
              : "No contacts yet. Add one or import a .vcf file."
          }</td></tr>`
        : contacts
            .map((ct) => {
              const active =
                !creatingContact && ct.uri === selectedContactUri
                  ? " is-selected"
                  : "";
              const initial = esc((ct.displayname || "?").slice(0, 1).toUpperCase());
              const avatar =
                ct.hasPhoto && selectedAbId !== null
                  ? `<img class="contact-avatar" src="${esc(api.contactPhotoUrl(selectedAbId, ct.uri))}" alt="" loading="lazy" data-avatar-fallback="${initial}" />`
                  : `<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${initial}</span>`;
              return `<tr class="contact-table-row${active}" data-action="select-contact" data-uri="${esc(ct.uri)}" tabindex="0" role="button">
                <td class="contact-col-name">
                  <span class="contact-name-cell">
                    ${avatar}
                    <span class="contact-name-text">
                      <span class="contact-name-primary">${esc(ct.displayname)}</span>
                      ${ct.org ? `<span class="muted small contact-name-secondary">${esc(ct.org)}</span>` : ""}
                    </span>
                  </span>
                </td>
                <td class="contact-col-email"><span class="contact-cell-clip">${esc(ct.email || "—")}</span></td>
                <td class="contact-col-phone"><span class="contact-cell-clip">${esc(ct.phone || "—")}</span></td>
                <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${esc(ct.org || "—")}</span></td>
              </tr>`;
            })
            .join("");

    const c = editingContact;
    const emails = Array.isArray(c?.emails) && c.emails.length > 0 ? c.emails : [""];
    const phones: ContactPhone[] =
      Array.isArray(c?.phones) && c.phones.length > 0
        ? c.phones
        : [{ type: "cell", value: "" }];
    const addr = c?.address ?? emptyAddress();

    const emailRows = emails
      .map(
        (e, i) => `<div class="multi-row" data-multi="email" data-idx="${i}">
          <input type="email" name="email_${i}" value="${esc(e ?? "")}" placeholder="email@example.com" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${i}" ${emails.length <= 1 ? "disabled" : ""} title="Remove">×</button>
        </div>`,
      )
      .join("");

    const phoneRows = phones
      .map(
        (p, i) => `<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${i}">
          <select name="phone_type_${i}" aria-label="Phone type">
            ${(["cell", "work", "home", "other"] as const)
              .map(
                (t) =>
                  `<option value="${t}" ${(p?.type ?? "other") === t ? "selected" : ""}>${t}</option>`,
              )
              .join("")}
          </select>
          <input type="tel" name="phone_value_${i}" value="${esc(p?.value ?? "")}" placeholder="+1…" autocomplete="off" />
          <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${i}" ${phones.length <= 1 ? "disabled" : ""} title="Remove">×</button>
        </div>`,
      )
      .join("");

    const customFields: ContactCustomField[] = Array.isArray(c?.custom) ? c.custom : [];
    const customRows =
      customFields.length === 0
        ? `<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>`
        : customFields
            .map(
              (cf, i) => `<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${i}">
                <input type="text" name="custom_label_${i}" value="${esc(cf.label || "")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
                <input type="text" name="custom_value_${i}" value="${esc(cf.value || "")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
                <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${i}" title="Remove">×</button>
              </div>`,
            )
            .join("");

    const contactModal =
      contactModalOpen && c && selectedAb
        ? `<div class="cal-modal" id="contact-edit-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
            <div class="cal-modal-backdrop" data-action="close-contact-modal"></div>
            <div class="cal-modal-card cal-modal-card-wide">
              <header class="cal-modal-header">
                <h3 id="contact-modal-title">${creatingContact ? "New contact" : "Edit contact"}</h3>
                <button type="button" class="info-modal-close" data-action="close-contact-modal" aria-label="Close">×</button>
              </header>
              <div class="cal-modal-body">
                ${renderFlashBanner()}
                <form class="stack" data-form="contact">
                  <div class="contact-photo-row">
                    <div class="contact-photo-preview">
                      ${
                        photoPreview
                          ? `<img src="${esc(photoPreview)}" alt="Contact photo" />`
                          : `<span class="contact-avatar contact-avatar-fallback contact-avatar-lg" aria-hidden="true">${esc((c.fullname || c.firstname || "?").slice(0, 1).toUpperCase())}</span>`
                      }
                    </div>
                    <div class="stack stack-tight" style="flex:1">
                      <label class="btn btn-ghost file-btn" ${busy ? "aria-disabled=true" : ""}>
                        ${photoPreview ? "Change photo" : "Upload photo"}
                        <input type="file" accept="image/*" data-action="contact-photo" ${busy ? "disabled" : ""} hidden />
                      </label>
                      ${
                        photoPreview || c.hasPhoto
                          ? `<button type="button" class="btn btn-ghost btn-small" data-action="remove-photo" ${busy ? "disabled" : ""}>Remove photo</button>`
                          : ""
                      }
                      <span class="muted small">JPEG/PNG, resized to 256px on save.</span>
                    </div>
                  </div>
                  <div class="form-grid form-grid-2">
                    <label>First name
                      <input type="text" name="firstname" value="${esc(c.firstname)}" maxlength="200" autocomplete="off" />
                    </label>
                    <label>Last name
                      <input type="text" name="lastname" value="${esc(c.lastname)}" maxlength="200" autocomplete="off" />
                    </label>
                  </div>
                  <label>Full name
                    <input type="text" name="fullname" value="${esc(c.fullname)}" maxlength="200" placeholder="Auto from first/last if empty" autocomplete="off" />
                  </label>
                  <div class="form-grid form-grid-2">
                    <label>Organization
                      <input type="text" name="org" value="${esc(c.org)}" maxlength="200" autocomplete="off" />
                    </label>
                    <label>Title
                      <input type="text" name="title" value="${esc(c.title)}" maxlength="200" autocomplete="off" />
                    </label>
                  </div>
                  <div class="form-grid form-grid-2 contact-email-phone">
                    <fieldset class="fieldset">
                      <legend>Emails</legend>
                      ${emailRows}
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-email" ${emails.length >= 10 ? "disabled" : ""}>+ Email</button>
                    </fieldset>
                    <fieldset class="fieldset">
                      <legend>Phones</legend>
                      ${phoneRows}
                      <button type="button" class="btn btn-ghost btn-small" data-action="add-phone" ${phones.length >= 10 ? "disabled" : ""}>+ Phone</button>
                    </fieldset>
                  </div>
                  <fieldset class="fieldset fieldset-address">
                    <legend>Address</legend>
                    <label>Street
                      <input type="text" name="street" value="${esc(addr.street)}" maxlength="300" autocomplete="off" />
                    </label>
                    <div class="form-grid form-grid-2">
                      <label>City
                        <input type="text" name="city" value="${esc(addr.city)}" maxlength="120" autocomplete="off" />
                      </label>
                      <label>Region
                        <input type="text" name="region" value="${esc(addr.region)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                    <div class="form-grid form-grid-2">
                      <label>Postal code
                        <input type="text" name="postal" value="${esc(addr.postal)}" maxlength="40" autocomplete="off" />
                      </label>
                      <label>Country
                        <input type="text" name="country" value="${esc(addr.country)}" maxlength="120" autocomplete="off" />
                      </label>
                    </div>
                  </fieldset>
                  <label>Website
                    <input type="url" name="url" value="${esc(c.url)}" maxlength="500" placeholder="https://" autocomplete="off" />
                  </label>
                  ${renderPortalDateTimeField({
                    field: "birthday",
                    name: "birthday",
                    label: "Birthday",
                    value: c.birthday || "",
                    dateOnly: true,
                    allowClear: true,
                  })}
                  <fieldset class="fieldset fieldset-custom">
                    <legend>Custom fields</legend>
                    ${customRows}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${customFields.length >= 30 ? "disabled" : ""}>+ Custom field</button>
                  </fieldset>
                  <label>Notes
                    <textarea name="note" rows="3" maxlength="4000">${esc(c.note)}</textarea>
                  </label>
                  <div class="form-actions-row form-actions-wrap">
                    <button type="submit" class="btn btn-primary" ${busy ? "disabled" : ""}>${creatingContact ? "Create contact" : "Save contact"}</button>
                    ${
                      !creatingContact && c.uri
                        ? `<button type="button" class="btn" data-action="export-contact" ${busy ? "disabled" : ""}>Export .vcf</button>`
                        : ""
                    }
                    ${
                      !creatingContact
                        ? `<button type="button" class="btn btn-danger" data-action="delete-contact" ${busy ? "disabled" : ""}>Delete</button>`
                        : ""
                    }
                    <button type="button" class="btn btn-ghost" data-action="close-contact-modal" ${busy ? "disabled" : ""}>Cancel</button>
                    ${
                      !creatingContact && c.uri
                        ? `<span class="muted small mono">${esc(c.uri)}</span>`
                        : ""
                    }
                  </div>
                </form>
              </div>
            </div>
          </div>`
        : "";

    const abModal =
      abModalOpen && selectedAb
        ? renderModal({
            id: "ab-edit-modal",
            title: "Address book details",
            titleId: "ab-modal-title",
            closeAction: "close-ab-modal",
            body: `
                ${renderFlashBanner()}
                <section>
                  <p class="muted small mono" style="margin:0">
                    ${esc(selectedAb.uri)} · ${selectedAb.cardCount} contact${selectedAb.cardCount === 1 ? "" : "s"}
                    <button type="button" class="info-btn" data-action="info" data-info="address-books"
                      aria-label="About address books" title="About address books"
                      style="vertical-align:middle;margin-left:0.35rem">
                      <span aria-hidden="true">i</span>
                    </button>
                  </p>
                  <form class="stack" data-form="edit-ab" style="margin-top:1rem">
                    <label>Display name
                      <input type="text" name="displayname" required maxlength="200" value="${esc(selectedAb.displayname)}" autocomplete="off" />
                    </label>
                    <label>Description
                      <textarea name="description" rows="3" maxlength="2000" placeholder="Optional notes for this address book">${esc(selectedAb.description)}</textarea>
                    </label>
                    <div class="form-actions-row">
                      <button type="submit" class="btn btn-primary" ${busy ? "disabled" : ""}>Save changes</button>
                      <span class="muted small mono">${esc(selectedAb.uri)}</span>
                    </div>
                  </form>
                  <div class="import-export" style="margin-top:1.35rem">
                    ${infoTitle("Import / export", "contact-import-export")}
                    <div class="form-actions-row form-actions-wrap" style="margin-top:0.75rem">
                      <button type="button" class="btn" data-action="export-ab" ${busy ? "disabled" : ""}>Export .vcf</button>
                      <label class="btn btn-ghost file-btn" ${busy ? "aria-disabled=true" : ""}>
                        Import .vcf
                        <input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" data-action="import-ab" ${busy ? "disabled" : ""} hidden />
                      </label>
                    </div>
                  </div>
                </section>`,
            footer: [{ label: "Close", action: "close-ab-modal", variant: "ghost" }],
          })
        : "";

    const deleteAbTarget =
      deleteAbConfirmId !== null
        ? addressBooks.find((a) => a.id === deleteAbConfirmId) ?? null
        : null;
    const abDeleteModal = deleteAbTarget
      ? renderModal({
          id: "ab-delete-modal",
          title: "Delete address book",
          titleId: "ab-delete-title",
          closeAction: "cancel-delete-ab",
          size: "sm",
          body: `
              ${renderFlashBanner()}
              <p>You are about to permanently delete <strong>${esc(deleteAbTarget.displayname)}</strong>
                <span class="muted small mono">(${esc(deleteAbTarget.uri)})</span>.</p>
              <p class="muted small">${
                (deleteAbTarget.cardCount ?? 0) > 0
                  ? `All ${deleteAbTarget.cardCount} contact${deleteAbTarget.cardCount === 1 ? "" : "s"} in this address book will be removed. This cannot be undone.`
                  : "This address book is empty. This cannot be undone."
              }</p>
              ${renderConfirmCheckbox({
                action: "toggle-delete-ab-confirm",
                label: "I understand and want to permanently delete this address book",
                id: "delete-ab-confirm",
                style: "checkbox",
              })}`,
          footer: [
            { label: "Cancel", action: "cancel-delete-ab", variant: "ghost", disabled: busy },
            {
              label: "Delete permanently",
              action: "confirm-delete-ab",
              variant: "danger",
              disabled: true,
              id: "delete-ab-submit",
              attrs: `data-id="${deleteAbTarget.id}"`,
            },
          ],
        })
      : "";

    const contactsTab = `
      <div class="portal-grid portal-grid-contacts">
        <aside class="contacts-sidebar">
          <section class="card contacts-sidebar-card">
            <div class="contacts-sidebar-head">
              ${infoTitle("Address books", "address-books")}
            </div>
            <div class="cal-list contacts-ab-list">
              ${abRows || '<p class="muted">No address books yet. Create one below.</p>'}
            </div>
            <div class="contacts-sidebar-create">
              <h3 class="h3-inline">Add address book</h3>
              <form class="stack stack-tight" data-form="create-ab" style="margin-top:0.5rem">
                <label>Display name
                  <input type="text" name="displayname" required maxlength="200" placeholder="Personal" autocomplete="off" />
                </label>
                <label>Description
                  <input type="text" name="description" maxlength="2000" placeholder="Optional" />
                </label>
                <button type="submit" class="btn btn-primary" ${busy ? "disabled" : ""}>Create</button>
              </form>
            </div>
          </section>
        </aside>
        <section class="contacts-main-col">
          ${
            selectedAb
              ? `<div class="card contacts-main-card">
                  <div class="contacts-main-head">
                    ${infoTitle("Contacts", "contacts")}
                    <div class="contact-toolbar" style="margin-top:0.75rem">
                      <input type="search" name="contact-search" data-action="contact-search" placeholder="Search contacts…"
                        value="${esc(contactSearch)}" aria-label="Search contacts" ${busy ? "disabled" : ""} />
                      <button type="button" class="btn btn-primary" data-action="new-contact" ${busy ? "disabled" : ""}>Add contact</button>
                    </div>
                  </div>
                  <div class="contacts-table-wrap contacts-table-wrap-tall">
                    <table class="contacts-table">
                      <thead>
                        <tr>
                          <th class="contact-col-name">Name</th>
                          <th class="contact-col-email">Email</th>
                          <th class="contact-col-phone">Phone</th>
                          <th class="contact-col-org hide-sm">Organization</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${contactTableBody}
                      </tbody>
                    </table>
                  </div>
                  <p class="muted small contacts-main-hint">Select a contact to edit, or use <strong>Add contact</strong>.</p>
                </div>`
              : `<div class="card contacts-main-card contacts-main-empty"><p class="muted">Select an address book to manage contacts.</p></div>`
          }
        </section>
      </div>
      ${abDeleteModal}
      ${abModal}
      ${contactModal}`;

    const tabInfoKey =
      activeTab === "calendars"
        ? "my-calendars"
        : activeTab === "contacts"
          ? "my-contacts"
          : activeTab === "tasks"
            ? "tasks"
            : activeTab === "notes"
              ? "notes"
              : activeTab === "files"
                ? "files"
                : "administration";

    const tasksTab = renderTasksTab();
    const notesTab = renderNotesTab();
    const filesTab = renderFilesTab();
    const adminTab = renderAdminSection();
    const mainTab =
      activeTab === "calendars"
        ? calendarsTab
        : activeTab === "contacts"
          ? contactsTab
          : activeTab === "tasks"
            ? tasksTab
            : activeTab === "notes"
              ? notesTab
              : activeTab === "files"
                ? filesTab
                : adminTab;

    const tabsHtml =
      activeTab === "admin"
        ? `<div class="tabs" role="tablist" aria-label="Administration sections">
          ${adminSubnavButtons()}
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${
              adminPage === "overview"
                ? "admin-overview"
                : adminPage === "users"
                  ? "admin-users"
                  : adminPage === "settings"
                    ? "admin-settings"
                    : "admin-database"
            }"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`
        : `<div class="tabs" role="tablist" aria-label="Portal sections">
          <button type="button" role="tab" class="tab-btn${activeTab === "calendars" ? " is-active" : ""}"
            data-action="tab" data-tab="calendars" aria-selected="${activeTab === "calendars"}">
            Calendar
          </button>
          <button type="button" role="tab" class="tab-btn${activeTab === "contacts" ? " is-active" : ""}"
            data-action="tab" data-tab="contacts" aria-selected="${activeTab === "contacts"}">
            Contacts
          </button>
          <button type="button" role="tab" class="tab-btn${activeTab === "tasks" ? " is-active" : ""}"
            data-action="tab" data-tab="tasks" aria-selected="${activeTab === "tasks"}">
            Tasks
          </button>
          <button type="button" role="tab" class="tab-btn${activeTab === "notes" ? " is-active" : ""}"
            data-action="tab" data-tab="notes" aria-selected="${activeTab === "notes"}">
            Notes
          </button>
          <button type="button" role="tab" class="tab-btn${activeTab === "files" ? " is-active" : ""}"
            data-action="tab" data-tab="files" aria-selected="${activeTab === "files"}">
            Files
          </button>
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${tabInfoKey}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`;

    root.innerHTML = shell(mainTab, { tabs: tabsHtml });
    document.body.classList.toggle(
      "cal-modal-open",
      calModalOpen ||
        createCalModalOpen ||
        deleteConfirmId !== null ||
        deleteAbConfirmId !== null ||
        eventModalOpen ||
        contactModalOpen ||
        abModalOpen ||
        importProgress !== null ||
        filesRenamePath !== null ||
        filesDeletePaths !== null ||
        filesTransfer !== null ||
        filesMkdirOpen ||
        adminUserCreateOpen ||
        adminUserEditOpen ||
        adminUserDeleteUsername !== null ||
        adminResetModalOpen ||
        adminDbConfirmOpen ||
        adminCalModal !== null ||
        adminAbModal !== null ||
        adminResourceDelete !== null,
    );
    document.body.classList.toggle("layout-contacts", activeTab === "contacts");
    document.body.classList.toggle("layout-calendars", activeTab === "calendars");
    document.body.classList.toggle(
      "layout-tasks",
      activeTab === "tasks" || activeTab === "notes",
    );
    document.body.classList.toggle("layout-files", activeTab === "files");
    document.body.classList.toggle("layout-admin", activeTab === "admin");
  }

  function filesBreadcrumb(path: string): string {
    const parts = path ? path.split("/").filter(Boolean) : [];
    let acc = "";
    const crumbs = [
      `<button type="button" class="files-crumb" data-action="files-nav" data-path="" ${busy ? "disabled" : ""}>Home</button>`,
    ];
    for (const part of parts) {
      acc = acc ? `${acc}/${part}` : part;
      const p = acc;
      crumbs.push(`<span class="files-crumb-sep" aria-hidden="true">/</span>`);
      crumbs.push(
        `<button type="button" class="files-crumb" data-action="files-nav" data-path="${esc(p)}" ${busy ? "disabled" : ""}>${esc(part)}</button>`,
      );
    }
    return `<nav class="files-breadcrumb" aria-label="Folder path">${crumbs.join("")}</nav>`;
  }

  function formatBytes(n: number): string {
    if (!Number.isFinite(n) || n < 0) return "—";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
    return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  }

  function formatMtime(ts: number): string {
    if (!ts) return "—";
    try {
      return new Date(ts * 1000).toLocaleString();
    } catch {
      return "—";
    }
  }

  function renderFilesTab(): string {
    const st = filesStatus;
    if (!st) {
      return `<div class="card"><p class="muted">${filesLoading || busy ? "Loading…" : "Unable to load file storage status."}</p></div>`;
    }
    if (!st.enabled) {
      return `<div class="portal-grid portal-grid-files">
        <section class="card">
          ${infoTitle("Files", "files", "h1")}
          <p class="muted" style="margin-top:0.75rem">
            WebDAV file storage is <strong>disabled</strong> on this server.
            An administrator can enable it under <strong>Admin → AngaraDAV Settings → Enable WebDAV file storage</strong>.
          </p>
          <p class="muted small">When enabled, desktop clients use <span class="mono">/dav.php/files/{username}/</span> with your DAV credentials.</p>
        </section>
      </div>`;
    }
    if (!st.ready) {
      return `<div class="portal-grid portal-grid-files">
        <section class="card">
          ${infoTitle("Files", "files", "h1")}
          <p class="flash flash-error" style="margin-top:0.75rem">${esc(st.error || "File storage is not available.")}</p>
          <p class="muted small">DAV path: <span class="mono">${esc(st.davPath)}</span></p>
        </section>
      </div>`;
    }

    const quotaLabel =
      st.quotaBytes > 0
        ? `${formatBytes(st.usedBytes)} used · ${formatBytes(st.availableBytes)} free of ${formatBytes(st.quotaBytes)}`
        : `${formatBytes(st.usedBytes)} used · ${formatBytes(st.availableBytes)} free (no app quota)`;
    const quotaPct =
      st.quotaBytes > 0
        ? Math.min(100, Math.round((100 * st.usedBytes) / st.quotaBytes))
        : 0;

    const nChecked = checkedFilePaths.length;
    const allChecked =
      filesEntries.length > 0 && filesEntries.every((e) => checkedFilePaths.includes(e.path));
    const someChecked = nChecked > 0;
    const bulkBar =
      nChecked > 0
        ? `<div class="bulk-bar files-bulk-bar" role="toolbar" aria-label="Selected files">
            <span class="muted small">${nChecked} selected</span>
            <div class="bulk-bar-actions">
              <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-copy" ${busy ? "disabled" : ""}>Copy</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-move" ${busy ? "disabled" : ""}>Move</button>
              <button type="button" class="btn btn-small btn-danger" data-action="files-bulk-delete" ${busy ? "disabled" : ""}>Delete</button>
            </div>
          </div>`
        : "";

    const rows =
      filesEntries.length === 0
        ? `<tr><td colspan="5" class="muted">This folder is empty.</td></tr>`
        : filesEntries
            .map((e) => {
              const checked = checkedFilePaths.includes(e.path);
              const icon = e.type === "dir" ? "📁" : "📄";
              const nameCell =
                e.type === "dir"
                  ? `<button type="button" class="files-name-btn" data-action="files-nav" data-path="${esc(e.path)}" ${busy ? "disabled" : ""}>
                      <span class="files-icon" aria-hidden="true">${icon}</span>${esc(e.name)}
                    </button>`
                  : `<span class="files-name"><span class="files-icon" aria-hidden="true">${icon}</span>${esc(e.name)}</span>`;
              const size = e.type === "dir" ? "—" : formatBytes(e.size);
              return `<tr class="files-row${checked ? " is-checked" : ""}" data-path="${esc(e.path)}" data-type="${e.type}">
                <td class="files-col-check">
                  <input type="checkbox" data-action="files-toggle" data-path="${esc(e.path)}"
                    ${checked ? "checked" : ""} ${busy ? "disabled" : ""}
                    aria-label="Select ${esc(e.name)}" />
                </td>
                <td class="files-col-name">${nameCell}</td>
                <td class="files-col-size mono">${size}</td>
                <td class="files-col-mtime hide-sm">${esc(formatMtime(e.mtime))}</td>
                <td class="files-col-actions">
                  ${
                    e.type === "file"
                      ? `<a class="btn btn-ghost btn-small" href="${esc(api.filesDownloadUrl(e.path))}" download="${esc(e.name)}" data-action="files-download">Download</a>`
                      : ""
                  }
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-copy" data-path="${esc(e.path)}" ${busy ? "disabled" : ""}>Copy</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-move" data-path="${esc(e.path)}" ${busy ? "disabled" : ""}>Move</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="files-rename-open" data-path="${esc(e.path)}" data-name="${esc(e.name)}" ${busy ? "disabled" : ""}>Rename</button>
                  <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="files-delete-open" data-path="${esc(e.path)}" data-name="${esc(e.name)}" ${busy ? "disabled" : ""}>Delete</button>
                </td>
              </tr>`;
            })
            .join("");

    const renameModal =
      filesRenamePath !== null
        ? (() => {
            const entry = filesEntries.find((x) => x.path === filesRenamePath);
            const current = entry?.name ?? "";
            return renderModal({
              id: "files-rename-modal",
              title: "Rename",
              titleId: "files-rename-title",
              closeAction: "files-rename-close",
              size: "sm",
              form: true,
              formAttrs: 'data-form="files-rename" id="files-rename-form"',
              body: `
                    <input type="hidden" name="path" value="${esc(filesRenamePath)}" />
                    <label>New name
                      <input type="text" name="newName" value="${esc(current)}" required maxlength="255" autocomplete="off" />
                    </label>`,
              footer: [
                { label: "Cancel", action: "files-rename-close", variant: "ghost" },
                { label: "Rename", type: "submit", variant: "primary", disabled: busy },
              ],
            });
          })()
        : "";

    const deleteModal =
      filesDeletePaths !== null && filesDeletePaths.length > 0
        ? (() => {
            const paths = filesDeletePaths;
            const multi = paths.length > 1;
            const first = filesEntries.find((x) => x.path === paths[0]);
            const title = multi
              ? `Delete ${paths.length} items`
              : `Delete ${first?.type === "dir" ? "folder" : "file"}`;
            const body = multi
              ? `<p style="margin:0 0 0.75rem">Delete <strong>${paths.length}</strong> selected items? Folders are removed with their contents. This cannot be undone.</p>
                 <ul class="files-delete-list muted small">
                   ${paths
                     .slice(0, 12)
                     .map((p) => {
                       const e = filesEntries.find((x) => x.path === p);
                       return `<li><span class="mono">${esc(e?.name ?? p)}</span></li>`;
                     })
                     .join("")}
                   ${paths.length > 12 ? `<li>…and ${paths.length - 12} more</li>` : ""}
                 </ul>`
              : `<p style="margin:0">Delete <strong>${esc(first?.name ?? paths[0])}</strong>?${
                  first?.type === "dir"
                    ? " This removes the folder and everything inside it."
                    : ""
                }</p>`;
            return renderModal({
              id: "files-delete-modal",
              title,
              titleId: "files-delete-title",
              closeAction: "files-delete-close",
              size: "sm",
              body,
              footer: [
                { label: "Cancel", action: "files-delete-close", variant: "ghost" },
                {
                  label: "Delete",
                  action: "files-delete-confirm",
                  variant: "danger",
                  disabled: busy,
                },
              ],
            });
          })()
        : "";

    const transferModal =
      filesTransfer !== null && filesTransfer.paths.length > 0
        ? (() => {
            const op = filesTransfer.op;
            const paths = filesTransfer.paths;
            const multi = paths.length > 1;
            const first = filesEntries.find((x) => x.path === paths[0]);
            const defaultName = first?.name ?? basenamePath(paths[0]);
            const title = multi
              ? `${op === "copy" ? "Copy" : "Move"} ${paths.length} items`
              : `${op === "copy" ? "Copy" : "Move"} ${first?.type === "dir" ? "folder" : "file"}`;
            const defaultDest = filesPath;
            return renderModal({
              id: "files-transfer-modal",
              title,
              titleId: "files-transfer-title",
              closeAction: "files-transfer-close",
              size: "sm",
              form: true,
              formAttrs: 'data-form="files-transfer"',
              body: `
                    ${
                      multi
                        ? `<p class="muted small" style="margin:0 0 0.75rem">${paths.length} items will be ${op === "copy" ? "copied" : "moved"} into the destination folder (original names kept).</p>`
                        : `<p class="muted small" style="margin:0 0 0.75rem"><span class="mono">${esc(defaultName)}</span></p>`
                    }
                    <label>Destination folder
                      <input type="text" name="toPath" value="${esc(defaultDest)}" maxlength="1024"
                        placeholder="Leave empty for Home (root)" autocomplete="off"
                        aria-describedby="files-transfer-dest-hint" />
                    </label>
                    <p id="files-transfer-dest-hint" class="muted small" style="margin:0.35rem 0 0">
                      Path relative to your file home. Examples: empty = Home, <span class="mono">docs</span>, <span class="mono">archive/2026</span>
                    </p>
                    ${
                      !multi
                        ? `<label style="margin-top:0.85rem">New name <span class="muted">(optional)</span>
                            <input type="text" name="newName" value="${esc(defaultName)}" maxlength="255" autocomplete="off" />
                          </label>
                          <p class="muted small" style="margin:0.35rem 0 0">
                            ${
                              op === "copy"
                                ? "Leave as-is to keep the name (a “ (copy)” suffix is added if it already exists in the destination)."
                                : "Leave as-is to keep the current name."
                            }
                          </p>`
                        : ""
                    }`,
              footer: [
                { label: "Cancel", action: "files-transfer-close", variant: "ghost" },
                {
                  label: op === "copy" ? "Copy" : "Move",
                  type: "submit",
                  variant: "primary",
                  disabled: busy,
                },
              ],
            });
          })()
        : "";

    const mkdirModal = filesMkdirOpen
      ? renderModal({
          id: "files-mkdir-modal",
          title: "New folder",
          titleId: "files-mkdir-title",
          closeAction: "files-mkdir-close",
          size: "sm",
          form: true,
          formAttrs: 'data-form="files-mkdir"',
          body: `
                <p class="muted small" style="margin:0 0 0.75rem">
                  Create a folder in
                  <span class="mono">${esc(filesPath === "" ? "Home" : filesPath)}</span>
                </p>
                <label>Folder name
                  <input type="text" name="name" value="" required maxlength="255" autocomplete="off"
                    placeholder="e.g. Documents" autofocus />
                </label>`,
          footer: [
            { label: "Cancel", action: "files-mkdir-close", variant: "ghost" },
            { label: "Create", type: "submit", variant: "primary", disabled: busy },
          ],
        })
      : "";

    return `<div class="portal-grid portal-grid-files">
      <section class="card files-panel">
        <div class="files-head">
          ${infoTitle("Files", "files", "h1")}
          <div class="files-quota muted small" title="Storage usage (application quota)">
            <div class="files-quota-bar" role="progressbar" aria-valuenow="${quotaPct}" aria-valuemin="0" aria-valuemax="100">
              <div class="files-quota-fill" style="width:${quotaPct}%"></div>
            </div>
            <span>${esc(quotaLabel)}</span>
          </div>
        </div>
        <div class="files-toolbar">
          ${filesBreadcrumb(filesPath)}
          <div class="files-toolbar-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="files-refresh" ${busy || filesLoading ? "disabled" : ""}>Refresh</button>
            <button type="button" class="btn btn-ghost btn-small" data-action="files-mkdir" ${busy ? "disabled" : ""}>New folder</button>
            <label class="btn btn-primary btn-small files-upload-btn" ${busy ? "aria-disabled=true" : ""}>
              Upload
              <input type="file" data-action="files-upload" ${busy ? "disabled" : ""} multiple hidden />
            </label>
          </div>
        </div>
        ${bulkBar}
        <div class="table-wrap files-table-wrap">
          <table class="files-table">
            <thead>
              <tr>
                <th class="files-col-check">
                  <input type="checkbox" data-action="files-select-all"
                    ${allChecked ? "checked" : ""}
                    ${someChecked && !allChecked ? "data-indeterminate=1" : ""}
                    ${busy || filesEntries.length === 0 ? "disabled" : ""}
                    aria-label="Select all in this folder" />
                </th>
                <th class="files-col-name">Name</th>
                <th class="files-col-size">Size</th>
                <th class="files-col-mtime hide-sm">Modified</th>
                <th class="files-col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filesLoading && filesEntries.length === 0 ? `<tr><td colspan="5" class="muted">Loading…</td></tr>` : rows}
            </tbody>
          </table>
        </div>
      </section>
      ${renameModal}
      ${deleteModal}
      ${transferModal}
      ${mkdirModal}
    </div>`;
  }

  function basenamePath(path: string): string {
    const parts = path.replace(/\\/g, "/").split("/").filter(Boolean);
    return parts[parts.length - 1] || path;
  }

  function adminSubnavButtons(): string {
    /** Fixed UI order: Overview → System settings → Users → Database */
    const order: AdminPageId[] = ["overview", "settings", "users", "database"];
    const labels: Record<AdminPageId, string> = {
      overview: "Overview",
      settings: "System settings",
      users: "Users",
      database: "Database",
    };
    const fromApi = adminCapabilities?.pages;
    const byId = new Map<string, AdminCapabilityPage>();
    if (fromApi) {
      for (const p of fromApi) {
        if (parseAdminPageId(p.id)) byId.set(p.id, p);
      }
    }

    return order
      .map((id) => {
        const p = byId.get(id);
        const label = p?.label || labels[id];
        const status = p?.status ?? (id === "overview" ? "read-only" : "full");
        const gated = p?.available === false;
        return `<button type="button" role="tab" class="tab-btn${adminPage === id ? " is-active" : ""}${gated ? " is-gated" : ""}"
            data-action="admin-page" data-admin-page="${id}"
            aria-selected="${adminPage === id}"
            title="${esc(label)}${gated ? " — " + adminStatusLabel(status) : ""}">
            ${esc(label)}
          </button>`;
      })
      .join("");
  }

  /**
   * Banner for incomplete admin pages.
   */
  function adminComingSoonBanner(pageId: AdminPageId): string {
    const meta = adminPageMeta(pageId);
    const status = meta?.status ?? "coming-soon";
    const label = meta?.label ?? pageId;
    const summary =
      meta?.summary || "This area is not available in portal Administration yet.";
    const statusText = adminStatusLabel(status);

    return `<section class="card admin-coming-soon-card">
      <div class="admin-coming-soon-head">
        <span class="badge ${adminStatusBadgeClass(status)}">${esc(statusText)}</span>
        <h2 class="admin-coming-soon-title">${esc(label)}</h2>
      </div>
      <p class="muted">${esc(summary)}</p>
    </section>`;
  }

  function serviceBadge(on: boolean, label: string): string {
    return `<span class="badge ${on ? "badge-ok" : "badge-off"}">${esc(label)}: ${on ? "On" : "Off"}</span>`;
  }

  function serviceOnOff(on: boolean): string {
    return `<span class="badge ${on ? "badge-ok" : "badge-off"}">${on ? "On" : "Off"}</span>`;
  }

  function adminStatCard(label: string, value: string | number, hint?: string): string {
    return `<div class="admin-stat-card">
      <div class="admin-stat-value mono">${esc(String(value))}</div>
      <div class="admin-stat-label">${esc(label)}</div>
      ${hint ? `<div class="admin-stat-hint muted small">${esc(hint)}</div>` : ""}
    </div>`;
  }

  function renderAdminOverview(): string {
    const meta = adminPageMeta("overview");
    if (meta && meta.available === false) {
      return adminComingSoonBanner("overview");
    }

    const roleLine = `<p class="muted small admin-session-line">
      Signed in as <span class="mono">${esc(user?.username ?? "")}</span>
      with role <span class="badge badge-admin">Admin</span>.
    </p>`;

    let aboutBlock = "";
    let statsBlock = "";
    if (adminDashboardLoading && !adminDashboard) {
      statsBlock = `<section class="card"><p class="muted">Loading overview…</p></section>`;
    } else if (adminDashboardError && !adminDashboard) {
      statsBlock = `<section class="card">
        <p class="flash flash-error" style="margin-bottom:0.75rem">${esc(adminDashboardError)}</p>
        <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${busy ? "disabled" : ""}>Retry</button>
      </section>`;
    } else if (adminDashboard) {
      const d = adminDashboard;
      const svc = d.services;
      const links = d.links ?? {};
      const statusBadge = meta
        ? `<span class="badge ${adminStatusBadgeClass(meta.status)}">${esc(adminStatusLabel(meta.status))}</span>`
        : "";
      const versionLabel = d.version ? esc(d.version) : "—";
      const gitLabel = d.git ? esc(d.git) : "";

      aboutBlock = `
        <section class="card admin-about-card">
          <div class="section-header">
            ${infoTitle("About this system", "admin-overview")}
            <div class="section-actions">
              ${statusBadge}
              <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${busy || adminDashboardLoading ? "disabled" : ""}>Refresh</button>
            </div>
          </div>
          <div class="admin-about-grid">
            <div>
              <h3 class="admin-subsection-title">Version</h3>
              <p>
                AngaraDAV <span class="badge badge-admin">v${versionLabel}</span>
                ${gitLabel ? `<span class="mono muted small"> (${gitLabel})</span>` : ""}
              </p>
              <p class="muted small admin-link-row">
                ${links.releases ? `<a href="${esc(links.releases)}" target="_blank" rel="noopener noreferrer">Releases</a>` : ""}
                ${links.docs ? `${links.releases ? `<span class="footer-sep">·</span>` : ""}<a href="${esc(links.docs)}" target="_blank" rel="noopener noreferrer">Docs</a>` : ""}
              </p>
            </div>
            <div>
              <h3 class="admin-subsection-title">Services</h3>
              <div class="admin-service-table-wrap">
                <table class="admin-kv-table">
                  <tbody>
                    <tr><td>Administration</td><td>${serviceOnOff(svc.administration !== false && svc.webAdmin !== false)}</td></tr>
                    <tr><td>CalDAV</td><td>${serviceOnOff(!!svc.caldav)}</td></tr>
                    <tr><td>CardDAV</td><td>${serviceOnOff(!!svc.carddav)}</td></tr>
                    <tr><td>Files</td><td>${serviceOnOff(!!svc.files)}</td></tr>
                    <tr><td>Tasks</td><td>${serviceOnOff(!!svc.tasks)}</td></tr>
                    <tr><td>Notes</td><td>${serviceOnOff(!!svc.notes)}</td></tr>
                    <tr><td>Push</td><td>${serviceOnOff(!!svc.push)}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          ${roleLine}
        </section>`;

      const nUsers = d.nbusers ?? d.users;
      const nCals = d.nbcalendars ?? d.calendars;
      const nEvents = d.nbevents ?? d.events;
      const nBooks = d.nbbooks ?? d.addressBooks;
      const nContacts = d.nbcontacts ?? d.contacts;
      statsBlock = `
        <section class="card admin-stats-card">
          <div class="section-header">
            <h2>Statistics</h2>
          </div>
          <div class="admin-stat-grid">
            ${adminStatCard("Registered users", nUsers, "Users")}
            ${adminStatCard("Calendars", nCals, "CalDAV")}
            ${adminStatCard("Events", nEvents, "CalDAV")}
            ${adminStatCard("Address books", nBooks, "CardDAV")}
            ${adminStatCard("Contacts", nContacts, "CardDAV")}
          </div>
          <div class="admin-service-row">
            ${serviceBadge(svc.administration !== false && svc.webAdmin !== false, "Administration")}
            ${serviceBadge(!!svc.caldav, "CalDAV")}
            ${serviceBadge(!!svc.carddav, "CardDAV")}
            ${serviceBadge(!!svc.files, "Files")}
            ${serviceBadge(!!svc.tasks, "Tasks")}
            ${serviceBadge(!!svc.notes, "Notes")}
            ${serviceBadge(!!svc.push, "Push")}
          </div>
        </section>`;
    } else {
      statsBlock = `<section class="card">
        ${infoTitle("System snapshot", "admin-overview")}
        ${roleLine}
      </section>`;
    }

    return `${aboutBlock}
      ${statsBlock}`;
  }

  function filteredAdminUsers(): AdminUserSummary[] {
    const q = adminUsersQuery.trim().toLowerCase();
    if (!q) return adminUsers;
    return adminUsers.filter((u) => {
      return (
        u.username.toLowerCase().includes(q) ||
        (u.displayname || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q)
      );
    });
  }

  function renderAdminUserCreateModal(): string {
    if (!adminUserCreateOpen) return "";
    return renderModal({
      id: "admin-user-create-modal",
      title: "Add user",
      titleId: "admin-user-create-title",
      closeAction: "admin-user-create-close",
      size: "sm",
      form: true,
      formAttrs: 'data-form="admin-user-create"',
      body: `
          <p class="muted small">Creates a DAV account with a default calendar and address book.</p>
            <label>Username
              <input type="text" name="username" required maxlength="255" autocomplete="off" placeholder="alice" ${busy ? "disabled" : ""} />
            </label>
            <label>Display name
              <input type="text" name="displayname" required maxlength="255" autocomplete="off" ${busy ? "disabled" : ""} />
            </label>
            <label>Email
              <input type="email" name="email" required maxlength="255" autocomplete="off" ${busy ? "disabled" : ""} />
            </label>
            <label>Password
              <input type="password" name="password" required autocomplete="new-password" ${busy ? "disabled" : ""} />
            </label>
            <label>Confirm password
              <input type="password" name="passwordConfirm" required autocomplete="new-password" ${busy ? "disabled" : ""} />
            </label>`,
      footer: [
        { label: "Cancel", action: "admin-user-create-close", variant: "ghost", disabled: busy },
        { label: "Create user", type: "submit", variant: "primary", disabled: busy },
      ],
    });
  }

  function renderAdminUserEditModal(): string {
    if (!adminUserEditOpen || !adminUserDetail) return "";
    const u = adminUserDetail;
    return renderModal({
      id: "admin-user-edit-modal",
      title: "Edit user",
      titleId: "admin-user-edit-title",
      closeAction: "admin-user-edit-close",
      size: "sm",
      form: true,
      formAttrs: 'data-form="admin-user-edit"',
      body: `
          <p class="muted small">Username <span class="mono">${esc(u.username)}</span> cannot be changed. Leave password fields empty to keep the current password.</p>
            <input type="hidden" name="username" value="${esc(u.username)}" />
            <label>Display name
              <input type="text" name="displayname" required maxlength="255" value="${esc(u.displayname)}" autocomplete="off" ${busy ? "disabled" : ""} />
            </label>
            <label>Email
              <input type="email" name="email" required maxlength="255" value="${esc(u.email)}" autocomplete="off" ${busy ? "disabled" : ""} />
            </label>
            <label>New password
              <input type="password" name="password" autocomplete="new-password" placeholder="Leave empty to keep current" ${busy ? "disabled" : ""} />
            </label>
            <label>Confirm new password
              <input type="password" name="passwordConfirm" autocomplete="new-password" ${busy ? "disabled" : ""} />
            </label>`,
      footer: [
        { label: "Cancel", action: "admin-user-edit-close", variant: "ghost", disabled: busy },
        { label: "Save changes", type: "submit", variant: "primary", disabled: busy },
      ],
    });
  }

  function renderAdminUserDeleteModal(): string {
    if (!adminUserDeleteUsername) return "";
    const uname = adminUserDeleteUsername;
    const u =
      adminUserDetail && adminUserDetail.username.toLowerCase() === uname.toLowerCase()
        ? adminUserDetail
        : adminUsers.find((x) => x.username.toLowerCase() === uname.toLowerCase()) ?? null;
    const label = u ? `${u.displayname || u.username} (${u.username})` : uname;
    return renderModal({
      id: "admin-user-delete-modal",
      title: "Delete user",
      titleId: "admin-user-delete-title",
      closeAction: "admin-user-delete-close",
      size: "sm",
      body: `
          <p>You are about to permanently delete <strong>${esc(label)}</strong>.</p>
          <ul class="admin-feature-list muted">
            <li>All calendars, events, tasks, and notes for this user</li>
            <li>All address books and contacts</li>
            <li>WebDAV file home (moved to quarantine when files storage is enabled)</li>
          </ul>
          <p class="muted small">This cannot be undone from the portal.</p>
          ${renderConfirmCheckbox({
            action: "admin-user-delete-toggle",
            label: "I understand and want to delete this user",
            checked: adminUserDeleteConfirmChecked,
            disabled: busy,
            style: "admin",
          })}`,
      footer: [
        { label: "Cancel", action: "admin-user-delete-close", variant: "ghost", disabled: busy },
        {
          label: "Delete permanently",
          action: "admin-user-delete-confirm",
          variant: "danger",
          disabled: busy || !adminUserDeleteConfirmChecked,
          attrs: `data-username="${esc(uname)}"`,
        },
      ],
    });
  }

  function renderAdminUserDetailPanel(): string {
    if (!adminSelectedUsername) return "";
    if (adminUserDetailLoading && !adminUserDetail) {
      return `<section class="card admin-user-detail">
        <p class="muted">Loading user <span class="mono">${esc(adminSelectedUsername)}</span>…</p>
      </section>`;
    }
    if (adminUserDetailError && !adminUserDetail) {
      return `<section class="card admin-user-detail">
        <div class="section-header">
          <h2>User detail</h2>
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-close">Close</button>
        </div>
        <p class="flash flash-error">${esc(adminUserDetailError)}</p>
      </section>`;
    }
    if (!adminUserDetail) return "";
    const u = adminUserDetail;
    const calRows =
      adminUserResourcesLoading && adminUserCalendars.length === 0
        ? `<tr><td colspan="5" class="muted">Loading calendars…</td></tr>`
        : adminUserCalendars.length === 0
          ? `<tr><td colspan="5" class="muted">No calendars.</td></tr>`
          : adminUserCalendars
              .map(
                (c) => `<tr>
          <td class="mono">${esc(c.uri)}</td>
          <td>${esc(c.displayname)}</td>
          <td class="hide-sm">${esc(String(c.eventCount))}${c.todos ? ' <span class="badge badge-admin">tasks</span>' : ""}${c.notes ? ' <span class="badge badge-admin">notes</span>' : ""}</td>
          <td class="hide-sm mono small">${esc(c.davUri)}</td>
          <td class="admin-user-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-cal-edit" data-id="${c.instanceId}" ${busy ? "disabled" : ""}>Edit</button>
            <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-cal-delete" data-id="${c.instanceId}" data-label="${esc(c.displayname)}" ${busy ? "disabled" : ""}>Delete</button>
          </td>
        </tr>`,
              )
              .join("");
    const abRows =
      adminUserResourcesLoading && adminUserAddressBooks.length === 0
        ? `<tr><td colspan="4" class="muted">Loading address books…</td></tr>`
        : adminUserAddressBooks.length === 0
          ? `<tr><td colspan="4" class="muted">No address books.</td></tr>`
          : adminUserAddressBooks
              .map(
                (a) => `<tr>
          <td class="mono">${esc(a.uri)}</td>
          <td>${esc(a.displayname)}</td>
          <td class="hide-sm">${esc(String(a.contactCount))}</td>
          <td class="admin-user-actions">
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-ab-edit" data-id="${a.id}" ${busy ? "disabled" : ""}>Edit</button>
            <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-ab-delete" data-id="${a.id}" data-label="${esc(a.displayname)}" ${busy ? "disabled" : ""}>Delete</button>
          </td>
        </tr>`,
              )
              .join("");

    const editCal =
      adminCalEditId !== null
        ? adminUserCalendars.find((c) => c.instanceId === adminCalEditId) ?? null
        : null;
    const editAb =
      adminAbEditId !== null
        ? adminUserAddressBooks.find((a) => a.id === adminAbEditId) ?? null
        : null;

    const calModal =
      adminCalModal === "create" || (adminCalModal === "edit" && editCal)
        ? renderModal({
            title: adminCalModal === "create" ? "Add calendar" : "Edit calendar",
            closeAction: "admin-cal-close",
            size: "sm",
            form: true,
            formAttrs: 'data-form="admin-cal"',
            body: `
            <input type="hidden" name="instanceId" value="${editCal ? editCal.instanceId : ""}" />
            ${
              adminCalModal === "create"
                ? `<label>URI token id
              <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="work" ${busy ? "disabled" : ""} />
              <span class="muted small">Lowercase letters, digits, dashes.</span>
            </label>`
                : `<p class="muted small">URI <span class="mono">${esc(editCal!.uri)}</span> (read-only)</p>`
            }
            <label>Display name
              <input type="text" name="displayname" required value="${esc(editCal?.displayname ?? "")}" ${busy ? "disabled" : ""} />
            </label>
            <label>Description
              <textarea name="description" rows="2" ${busy ? "disabled" : ""}>${esc(editCal?.description ?? "")}</textarea>
            </label>
            <label>Color (#RRGGBB)
              <input type="text" name="calendarcolor" placeholder="#3B82F6" value="${esc(editCal?.calendarcolor ?? "")}" ${busy ? "disabled" : ""} />
            </label>
            <label class="check-row"><input type="checkbox" name="todos" ${editCal?.todos || adminCalModal === "create" ? "checked" : ""} ${busy ? "disabled" : ""} /> Tasks (VTODO)</label>
            <label class="check-row"><input type="checkbox" name="notes" ${editCal?.notes ? "checked" : ""} ${busy ? "disabled" : ""} /> Notes (VJOURNAL)</label>`,
            footer: [
              { label: "Cancel", action: "admin-cal-close", variant: "ghost", disabled: busy },
              { label: "Save", type: "submit", variant: "primary", disabled: busy },
            ],
          })
        : "";

    const abModal =
      adminAbModal === "create" || (adminAbModal === "edit" && editAb)
        ? renderModal({
            title: adminAbModal === "create" ? "Add address book" : "Edit address book",
            closeAction: "admin-ab-close",
            size: "sm",
            form: true,
            formAttrs: 'data-form="admin-ab"',
            body: `
            <input type="hidden" name="id" value="${editAb ? editAb.id : ""}" />
            ${
              adminAbModal === "create"
                ? `<label>URI token id
              <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="personal" ${busy ? "disabled" : ""} />
            </label>`
                : `<p class="muted small">URI <span class="mono">${esc(editAb!.uri)}</span> (read-only)</p>`
            }
            <label>Display name
              <input type="text" name="displayname" required value="${esc(editAb?.displayname ?? "")}" ${busy ? "disabled" : ""} />
            </label>
            <label>Description
              <textarea name="description" rows="2" ${busy ? "disabled" : ""}>${esc(editAb?.description ?? "")}</textarea>
            </label>`,
            footer: [
              { label: "Cancel", action: "admin-ab-close", variant: "ghost", disabled: busy },
              { label: "Save", type: "submit", variant: "primary", disabled: busy },
            ],
          })
        : "";

    const resDeleteModal = adminResourceDelete
      ? renderModal({
          title: `Delete ${adminResourceDelete.kind === "calendar" ? "calendar" : "address book"}`,
          closeAction: "admin-resource-delete-close",
          size: "sm",
          body: `
          <p>Delete <strong>${esc(adminResourceDelete.label)}</strong> for <span class="mono">${esc(u.username)}</span>?</p>
          ${
            adminResourceDelete.kind === "addressbook"
              ? `<label class="check-row"><input type="checkbox" data-action="admin-ab-force-toggle" ${adminResourceDelete.force ? "checked" : ""} /> Force delete even if contacts exist</label>`
              : `<p class="muted small">Events on this calendar will be removed if this is the only instance.</p>`
          }`,
          footer: [
            { label: "Cancel", action: "admin-resource-delete-close", variant: "ghost" },
            {
              label: "Delete",
              action: "admin-resource-delete-confirm",
              variant: "danger",
              disabled: busy,
            },
          ],
        })
      : "";

    return `<section class="card admin-user-detail">
      <div class="section-header">
        <h2>User <span class="mono">${esc(u.username)}</span></h2>
        <div class="section-actions">
          <button type="button" class="btn btn-small" data-action="admin-user-edit-open" data-username="${esc(u.username)}" ${busy ? "disabled" : ""}>Edit</button>
          <button type="button" class="btn btn-small btn-danger" data-action="admin-user-delete-open" data-username="${esc(u.username)}" ${busy ? "disabled" : ""}>Delete</button>
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-close">Close</button>
        </div>
      </div>
      <p class="muted small admin-breadcrumb">Users → <span class="mono">${esc(u.username)}</span></p>
      <dl class="admin-dl">
        <div><dt>Username</dt><dd class="mono">${esc(u.username)}</dd></div>
        <div><dt>Display name</dt><dd>${esc(u.displayname || "—")}</dd></div>
        <div><dt>Email</dt><dd>${u.email ? `<a href="mailto:${esc(u.email)}">${esc(u.email)}</a>` : "—"}</dd></div>
        <div><dt>Principal</dt><dd class="mono">${esc(u.principal)}</dd></div>
        <div><dt>Calendars</dt><dd>${esc(String(u.calendarCount))}</dd></div>
        <div><dt>Events / objects</dt><dd>${esc(String(u.eventCount))}</dd></div>
        <div><dt>Address books</dt><dd>${esc(String(u.addressBookCount))}</dd></div>
        <div><dt>Contacts</dt><dd>${esc(String(u.contactCount))}</dd></div>
      </dl>
    </section>
    <section class="card">
      <div class="section-header">
        <h2>Calendars</h2>
        <div class="section-actions">
          <button type="button" class="btn btn-primary btn-small" data-action="admin-cal-create" ${busy ? "disabled" : ""}>Add calendar</button>
        </div>
      </div>
      <div class="contacts-table-wrap admin-table-placeholder">
        <table class="contacts-table">
          <thead><tr><th>URI</th><th>Name</th><th class="hide-sm">Objects</th><th class="hide-sm">DAV path</th><th>Actions</th></tr></thead>
          <tbody>${calRows}</tbody>
        </table>
      </div>
    </section>
    <section class="card">
      <div class="section-header">
        <h2>Address books</h2>
        <div class="section-actions">
          <button type="button" class="btn btn-primary btn-small" data-action="admin-ab-create" ${busy ? "disabled" : ""}>Add address book</button>
        </div>
      </div>
      <div class="contacts-table-wrap admin-table-placeholder">
        <table class="contacts-table">
          <thead><tr><th>URI</th><th>Name</th><th class="hide-sm">Contacts</th><th>Actions</th></tr></thead>
          <tbody>${abRows}</tbody>
        </table>
      </div>
    </section>
    ${calModal}${abModal}${resDeleteModal}`;
  }

  function renderAdminUsersShell(): string {
    const meta = adminPageMeta("users");
    if (meta && meta.available === false) {
      return adminComingSoonBanner("users");
    }

    const list = filteredAdminUsers();
    const rows =
      adminUsersLoading && adminUsers.length === 0
        ? `<tr><td colspan="4" class="muted admin-table-empty">Loading users…</td></tr>`
        : list.length === 0
          ? `<tr><td colspan="4" class="muted admin-table-empty">${
              adminUsersError
                ? esc(adminUsersError)
                : adminUsersQuery.trim()
                  ? "No users match this filter."
                  : "No users found."
            }</td></tr>`
          : list
              .map((u) => {
                const active =
                  adminSelectedUsername &&
                  adminSelectedUsername.toLowerCase() === u.username.toLowerCase()
                    ? " is-selected"
                    : "";
                return `<tr class="contact-table-row${active}" data-action="admin-user-view" data-username="${esc(u.username)}" tabindex="0" role="button">
                  <td class="mono">${esc(u.username)}</td>
                  <td class="hide-sm">${esc(u.displayname || "—")}</td>
                  <td class="hide-sm">${esc(u.email || "—")}</td>
                  <td class="admin-user-actions">
                    <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-view" data-username="${esc(u.username)}" ${busy ? "disabled" : ""}>View</button>
                    <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-edit-open" data-username="${esc(u.username)}" ${busy ? "disabled" : ""}>Edit</button>
                    <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-user-delete-open" data-username="${esc(u.username)}" ${busy ? "disabled" : ""}>Delete</button>
                  </td>
                </tr>`;
              })
              .join("");

    return `
      <section class="card">
        <div class="section-header">
          ${infoTitle("Users", "admin-users")}
          <div class="section-actions">
            ${meta ? `<span class="badge ${adminStatusBadgeClass(meta.status)}">${esc(adminStatusLabel(meta.status))}</span>` : ""}
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-users-refresh" ${busy || adminUsersLoading ? "disabled" : ""}>Refresh</button>
            <button type="button" class="btn btn-primary btn-small" data-action="admin-user-create-open" ${busy ? "disabled" : ""}>Add user</button>
          </div>
        </div>
        <p class="muted small">
          DAV user accounts. Passwords and digests are never returned by the API.
        </p>
        <div class="admin-users-toolbar">
          <input type="search" data-action="admin-users-search" placeholder="Filter by username, name, email…"
            value="${esc(adminUsersQuery)}" aria-label="Filter users" ${busy ? "disabled" : ""} />
          <span class="muted small">${esc(String(list.length))}${adminUsersQuery.trim() ? ` / ${adminUsers.length}` : ""} user${list.length === 1 ? "" : "s"}</span>
        </div>
        ${adminUsersError && adminUsers.length > 0 ? `<p class="flash flash-error" style="margin:0.75rem 0">${esc(adminUsersError)}</p>` : ""}
        <div class="contacts-table-wrap admin-table-placeholder">
          <table class="contacts-table">
            <thead>
              <tr>
                <th>Username</th>
                <th class="hide-sm">Display name</th>
                <th class="hide-sm">Email</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
      ${renderAdminUserDetailPanel()}
      ${renderAdminUserCreateModal()}
      ${renderAdminUserEditModal()}
      ${renderAdminUserDeleteModal()}`;
  }

  function renderAdminSettingsShell(): string {
    const meta = adminPageMeta("settings");
    if (meta && meta.available === false) {
      return adminComingSoonBanner("settings");
    }
    if (adminSystemSettingsLoading && !adminSystemSettings) {
      return `<section class="card"><p class="muted">Loading system settings…</p></section>`;
    }
    if (adminSystemSettingsError && !adminSystemSettings) {
      return `<section class="card">
        <p class="flash flash-error">${esc(adminSystemSettingsError)}</p>
        <button type="button" class="btn btn-ghost" data-action="admin-settings-refresh">Retry</button>
      </section>`;
    }
    const s = adminSystemSettings;
    if (!s) {
      return `<section class="card"><p class="muted">No settings loaded.</p></section>`;
    }
    const check = (name: string, on: boolean, label: string) =>
      `<label class="check-row"><input type="checkbox" name="${esc(name)}" ${on ? "checked" : ""} ${busy || s.writable === false ? "disabled" : ""} /> ${esc(label)}</label>`;
    const num = (name: string, val: number | undefined, label: string, help = "") =>
      `<label>${esc(label)}
        <input type="number" name="${esc(name)}" value="${esc(String(val ?? 0))}" ${busy || s.writable === false ? "disabled" : ""} />
        ${help ? `<span class="muted small">${esc(help)}</span>` : ""}
      </label>`;

    return `
      <section class="card">
        <div class="section-header">
          ${infoTitle("System settings", "admin-settings")}
          <div class="section-actions">
            ${meta ? `<span class="badge ${adminStatusBadgeClass(meta.status)}">${esc(adminStatusLabel(meta.status))}</span>` : ""}
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-settings-refresh" ${busy ? "disabled" : ""}>Reload</button>
          </div>
        </div>
        <p class="muted small">
          Writes <span class="mono">config/baikal.yaml</span> atomically. Changing
          <strong>session timeout</strong> affects portal idle sessions.
          ${s.writable === false ? '<span class="flash flash-error">Config is not writable by PHP.</span>' : ""}
        </p>
        <form class="stack admin-settings-form" data-form="admin-settings">
          <h3 class="admin-subsection-title">DAV services</h3>
          ${check("cal_enabled", !!s.cal_enabled, "Enable CalDAV")}
          ${check("card_enabled", !!s.card_enabled, "Enable CardDAV")}
          ${check("tasks_enabled", !!s.tasks_enabled, "Enable Tasks (VTODO)")}
          ${check("notes_enabled", !!s.notes_enabled, "Enable Notes (VJOURNAL)")}
          <label>WebDAV authentication type
            <select name="dav_auth_type" ${busy || s.writable === false ? "disabled" : ""}>
              ${["Digest", "Basic", "Apache"]
                .map(
                  (t) =>
                    `<option value="${t}" ${s.dav_auth_type === t ? "selected" : ""}>${t}</option>`,
                )
                .join("")}
            </select>
          </label>
          <label>Server timezone
            <select name="timezone" required ${busy || s.writable === false ? "disabled" : ""}>
              ${timezoneSelectOptions(s.timezone || "UTC")}
            </select>
          </label>
          <label>Email invite sender
            <input type="text" name="invite_from" value="${esc(s.invite_from || "")}" placeholder="noreply@example.com" ${busy || s.writable === false ? "disabled" : ""} />
          </label>

          <h3 class="admin-subsection-title">WebDAV files</h3>
          ${check("files_enabled", !!s.files_enabled, "Enable WebDAV file storage")}
          <label>Storage path
            <input type="text" name="files_storage_path" value="${esc(s.files_storage_path || "")}" placeholder="empty = Specific/files" ${busy || s.writable === false ? "disabled" : ""} />
          </label>
          ${num("files_max_upload_mb", s.files_max_upload_mb, "Max file size (MB)")}
          ${num("files_quota_mb", s.files_quota_mb, "Quota per user (MB)", "0 = unlimited")}
          ${num("files_quarantine_days", s.files_quarantine_days, "Deleted user file retention (days)")}

          <h3 class="admin-subsection-title">Session & portal</h3>
          ${num("session_max_age_minutes", s.session_max_age_minutes, "Session idle timeout (minutes)", "Portal session")}
          <label>Portal log level
            <select name="portal_log_level" ${busy || s.writable === false ? "disabled" : ""}>
              ${["off", "error", "warn", "info", "debug"]
                .map(
                  (l) =>
                    `<option value="${l}" ${(s.portal_log_level || "off") === l ? "selected" : ""}>${l}</option>`,
                )
                .join("")}
            </select>
          </label>
          ${check("portal_admin_ui_enabled", s.portal_admin_ui_enabled !== false, "Portal Administration UI enabled")}
          <label>Portal admin users (comma-separated)
            <input type="text" name="portal_admin_users" value="${esc(
              Array.isArray(s.portal_admin_users)
                ? s.portal_admin_users.join(", ")
                : String(s.portal_admin_users || ""),
            )}" placeholder="empty = DAV user admin" ${busy || s.writable === false ? "disabled" : ""} />
          </label>

          <h3 class="admin-subsection-title">WebDAV-Push</h3>
          ${check("push_enabled", !!s.push_enabled, "Enable WebDAV-Push")}
          <label>Push external URL (HTTPS)
            <input type="url" name="push_external_url" value="${esc(s.push_external_url || "")}" placeholder="https://dav.example.com/dav.php/" ${busy || s.writable === false ? "disabled" : ""} />
          </label>
          <label>Push log level
            <select name="push_log_level" ${busy || s.writable === false ? "disabled" : ""}>
              ${["off", "error", "warn", "info", "debug"]
                .map(
                  (l) =>
                    `<option value="${l}" ${(s.push_log_level || "off") === l ? "selected" : ""}>${l}</option>`,
                )
                .join("")}
            </select>
          </label>

          <h3 class="admin-subsection-title">Server admin password</h3>
          <p class="muted small">
            Stored in <span class="mono">baikal.yaml</span> for install recovery.
            Portal login uses each DAV user’s own password (e.g. user <span class="mono">admin</span> created at install).
            ${s.hasAdminPassword ? "Leave blank to keep the current server admin password." : "No server admin password set yet."}
          </p>
          <label>New server admin password
            <input type="password" name="admin_password" autocomplete="new-password" ${busy || s.writable === false ? "disabled" : ""} />
          </label>
          <label>Confirm server admin password
            <input type="password" name="admin_password_confirm" autocomplete="new-password" ${busy || s.writable === false ? "disabled" : ""} />
          </label>

          <div class="form-actions-row" style="margin-top:1rem">
            <button type="submit" class="btn btn-primary" ${busy || s.writable === false ? "disabled" : ""}>Save settings</button>
          </div>
        </form>
      </section>
      <section class="card card-danger-zone">
        <div class="section-header">
          <h2>Danger zone</h2>
        </div>
        <p class="muted small">
          <strong>Reset to Default</strong> is a full factory wipe: config, database (all users and data),
          WebDAV files, and install lock. A timestamped backup of
          <span class="mono">baikal.yaml</span> is kept next to config; <strong>back up volumes first</strong>
          if you need data recovery. Everything else is deleted, then the installer opens.
        </p>
        <div class="form-actions-row" style="margin-top:0.75rem">
          <button type="button" class="btn btn-danger" data-action="admin-reset-open" ${busy || s.writable === false ? "disabled" : ""}>
            Reset to Default
          </button>
        </div>
      </section>
      ${renderAdminResetModal()}`;
  }

  function renderAdminResetModal(): string {
    if (!adminResetModalOpen) return "";
    return renderModal({
      id: "admin-reset-modal",
      title: "Reset to Default",
      titleId: "admin-reset-title",
      closeAction: "admin-reset-close",
      size: "sm",
      body: `
          <p>This permanently wipes this AngaraDAV instance and opens the installer.</p>
          <ul class="admin-feature-list muted">
            <li>Deletes <span class="mono">config/baikal.yaml</span> (timestamped backup only)</li>
            <li>Deletes the database (all DAV users, calendars, contacts, events)</li>
            <li>Deletes WebDAV file homes and quarantine</li>
            <li>Removes <span class="mono">INSTALL_DISABLED</span> so install can run</li>
          </ul>
          <p class="muted small">This cannot be undone. You will complete setup at <span class="mono">/portal/install/</span>.</p>
          ${renderConfirmCheckbox({
            action: "admin-reset-toggle",
            label: "I understand all data will be deleted and the installer will open",
            checked: adminResetConfirmChecked,
            disabled: busy,
            style: "admin",
          })}`,
      footer: [
        { label: "Cancel", action: "admin-reset-close", variant: "ghost", disabled: busy },
        {
          label: "Reset and open installer",
          action: "admin-reset-confirm",
          variant: "danger",
          disabled: busy || !adminResetConfirmChecked,
        },
      ],
    });
  }

  function renderAdminDatabaseShell(): string {
    const meta = adminPageMeta("database");
    if (meta && meta.available === false) {
      return adminComingSoonBanner("database");
    }
    if (adminDatabaseSettingsLoading && !adminDatabaseSettings) {
      return `<section class="card"><p class="muted">Loading database settings…</p></section>`;
    }
    if (adminDatabaseSettingsError && !adminDatabaseSettings) {
      return `<section class="card">
        <p class="flash flash-error">${esc(adminDatabaseSettingsError)}</p>
        <button type="button" class="btn btn-ghost" data-action="admin-database-refresh">Retry</button>
      </section>`;
    }
    const d = adminDatabaseSettings;
    if (!d) {
      return `<section class="card"><p class="muted">No database settings loaded.</p></section>`;
    }
    const backend = adminDbFormBackend;
    const notWritable = d.writable === false;

    return `
      <section class="card">
        <div class="section-header">
          ${infoTitle("Database", "admin-database")}
          <div class="section-actions">
            ${meta ? `<span class="badge ${adminStatusBadgeClass(meta.status)}">${esc(adminStatusLabel(meta.status))}</span>` : ""}
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-database-refresh" ${busy ? "disabled" : ""}>Refresh</button>
          </div>
        </div>
        <p class="flash flash-info" style="margin-bottom:1rem">${esc(d.warning)}</p>
        <dl class="admin-dl admin-dl-stack">
          <div>
            <dt>Current backend</dt>
            <dd><span class="badge badge-admin">${esc((d.backend || "—").toUpperCase())}</span></dd>
          </div>
          ${
            d.backend === "sqlite" || d.sqlite_file
              ? `<div>
            <dt>SQLite file</dt>
            <dd class="mono admin-dl-path">${esc(d.sqlite_file || "—")}</dd>
          </div>`
              : ""
          }
          ${
            d.backend === "pgsql" || d.pgsql_host
              ? `<div>
            <dt>PostgreSQL</dt>
            <dd class="mono admin-dl-path">${esc(d.pgsql_host || "—")} / ${esc(d.pgsql_dbname || "—")} · ${esc(d.pgsql_username || "—")}</dd>
          </div>
          <div>
            <dt>Password</dt>
            <dd>${d.hasPassword ? '<span class="badge badge-ok">Set</span> <span class="muted small">(never shown)</span>' : '<span class="badge badge-off">Not set</span>'}</dd>
          </div>`
              : ""
          }
          <div>
            <dt>Encryption key</dt>
            <dd>${d.hasEncryptionKey ? '<span class="badge badge-ok">Configured</span> <span class="muted small">(never shown)</span>' : '<span class="badge badge-off">Not set</span>'}</dd>
          </div>
        </dl>

        <h3 class="admin-subsection-title">Edit connection</h3>
        ${notWritable ? `<p class="flash flash-error">Config is not writable by PHP.</p>` : ""}
        <form class="stack admin-database-form" data-form="admin-database">
          <label>Backend
            <select name="backend" data-action="admin-db-backend" ${busy || notWritable ? "disabled" : ""}>
              <option value="sqlite" ${backend === "sqlite" ? "selected" : ""}>SQLite</option>
              <option value="pgsql" ${backend === "pgsql" ? "selected" : ""}>PostgreSQL</option>
            </select>
          </label>
          <div data-admin-db-panel="sqlite" style="${backend === "sqlite" ? "" : "display:none"}">
            <label>SQLite file path
              <input type="text" name="sqlite_file" class="mono" value="${esc(d.sqlite_file || "")}" ${busy || notWritable ? "disabled" : ""} />
            </label>
          </div>
          <div data-admin-db-panel="pgsql" style="${backend === "pgsql" ? "" : "display:none"}">
            <label>PostgreSQL host
              <input type="text" name="pgsql_host" class="mono" value="${esc(d.pgsql_host || "")}" placeholder="localhost:5432" ${busy || notWritable ? "disabled" : ""} />
            </label>
            <label>Database name
              <input type="text" name="pgsql_dbname" class="mono" value="${esc(d.pgsql_dbname || "")}" ${busy || notWritable ? "disabled" : ""} />
            </label>
            <label>Username
              <input type="text" name="pgsql_username" class="mono" value="${esc(d.pgsql_username || "")}" autocomplete="off" ${busy || notWritable ? "disabled" : ""} />
            </label>
            <label>Password
              <input type="password" name="pgsql_password" autocomplete="new-password" placeholder="${d.hasPassword ? "Leave blank to keep current" : ""}" ${busy || notWritable ? "disabled" : ""} />
            </label>
          </div>
          <div class="form-actions-row" style="margin-top:1rem">
            <button type="submit" class="btn btn-primary" ${busy || notWritable ? "disabled" : ""}>Save database settings…</button>
          </div>
        </form>
      </section>
      ${renderAdminDbConfirmModal()}`;
  }

  function renderAdminDbConfirmModal(): string {
    if (!adminDbConfirmOpen) return "";
    const canSave = adminDbConfirmText.trim() === "CONFIRM";
    return renderModal({
      id: "admin-db-confirm-modal",
      title: "Confirm database change",
      titleId: "admin-db-confirm-title",
      closeAction: "admin-db-confirm-close",
      size: "sm",
      body: `
          <p>Wrong values can take the instance offline. Type <strong class="mono">CONFIRM</strong> to save.</p>
          <label>Confirmation
            <input type="text" data-action="admin-db-confirm-input" value="${esc(adminDbConfirmText)}"
              autocomplete="off" spellcheck="false" placeholder="CONFIRM" ${busy ? "disabled" : ""} />
          </label>`,
      footer: [
        { label: "Cancel", action: "admin-db-confirm-close", variant: "ghost", disabled: busy },
        {
          label: "Save database settings",
          action: "admin-db-confirm-save",
          variant: "danger",
          disabled: busy || !canSave,
        },
      ],
    });
  }

  /** Admin-only Administration shell (opened from the user menu). */
  function renderAdminSection(): string {
    if (!userIsAdmin()) {
      return `<div class="card"><p class="muted">You do not have permission to view Administration.</p></div>`;
    }
    if (!adminUiEnabled()) {
      return `<section class="card admin-coming-soon-card">
          <div class="admin-coming-soon-head">
            <span class="badge badge-off">Disabled</span>
            <h2 class="admin-coming-soon-title">Portal Administration</h2>
          </div>
          <p class="muted">
            The Administration UI is turned off
            (<span class="mono">system.portal_admin_ui_enabled</span>).
          </p>
        </section>`;
    }
    if (adminPage === "users") return renderAdminUsersShell();
    if (adminPage === "settings") return renderAdminSettingsShell();
    if (adminPage === "database") return renderAdminDatabaseShell();
    return renderAdminOverview();
  }

  /** Flatten tasks as a tree (subtasks under parent via RELATED-TO parentUid). */
  function tasksInTreeOrder(list: TaskItem[]): { task: TaskItem; depth: number }[] {
    const byUid = new Map<string, TaskItem>();
    for (const t of list) {
      if (t.uid) byUid.set(t.uid, t);
    }
    const orderIndex = new Map(list.map((t, i) => [itemKey(t.instanceId, t.uri), i]));
    const children = new Map<string, TaskItem[]>();
    const roots: TaskItem[] = [];
    for (const t of list) {
      const p = t.parentUid;
      if (p && byUid.has(p) && p !== t.uid) {
        const arr = children.get(p) ?? [];
        arr.push(t);
        children.set(p, arr);
      } else {
        roots.push(t);
      }
    }
    const byOrder = (a: TaskItem, b: TaskItem) =>
      (orderIndex.get(itemKey(a.instanceId, a.uri)) ?? 0) -
      (orderIndex.get(itemKey(b.instanceId, b.uri)) ?? 0);
    roots.sort(byOrder);
    for (const [, kids] of children) kids.sort(byOrder);

    const out: { task: TaskItem; depth: number }[] = [];
    const visiting = new Set<string>();
    const walk = (t: TaskItem, depth: number) => {
      const id = t.uid || itemKey(t.instanceId, t.uri);
      if (visiting.has(id)) return;
      visiting.add(id);
      out.push({ task: t, depth: Math.min(depth, 8) });
      for (const c of children.get(t.uid) ?? []) {
        walk(c, depth + 1);
      }
      visiting.delete(id);
    };
    for (const r of roots) walk(r, 0);
    // Any unvisited (shouldn't happen) — append flat
    for (const t of list) {
      if (!out.some((x) => x.task === t)) out.push({ task: t, depth: 0 });
    }
    return out;
  }

  /** UIDs that cannot be chosen as parent of `self` (self + descendants). */
  function taskDescendantUids(selfUid: string): Set<string> {
    const blocked = new Set<string>([selfUid]);
    if (!selfUid) return blocked;
    let grew = true;
    while (grew) {
      grew = false;
      for (const t of tasks) {
        if (t.parentUid && blocked.has(t.parentUid) && t.uid && !blocked.has(t.uid)) {
          blocked.add(t.uid);
          grew = true;
        }
      }
    }
    return blocked;
  }

  function parentTaskOptions(forTask: TaskItem, creating: boolean): string {
    const calInstance = forTask.instanceId;
    const blocked = creating || !forTask.uid ? new Set<string>() : taskDescendantUids(forTask.uid);
    const candidates = tasks.filter(
      (x) =>
        x.uid &&
        x.instanceId === calInstance &&
        !blocked.has(x.uid) &&
        x.uid !== forTask.uid,
    );
    const selected = forTask.parentUid || "";
    const opts = [
      `<option value="">None (top-level)</option>`,
      ...candidates.map(
        (x) =>
          `<option value="${esc(x.uid)}" ${x.uid === selected ? "selected" : ""}>${esc(x.summary || x.uid)}</option>`,
      ),
    ];
    // Keep selected parent visible even if filtered out of list (e.g. other calendar)
    if (selected && !candidates.some((x) => x.uid === selected)) {
      const orphan = tasks.find((x) => x.uid === selected);
      opts.push(
        `<option value="${esc(selected)}" selected>${esc(orphan?.summary || selected)} (current)</option>`,
      );
    }
    return opts.join("");
  }

  function writableCheckedTasks(): TaskItem[] {
    const set = new Set(checkedTaskKeys);
    return tasks.filter((t) => set.has(itemKey(t.instanceId, t.uri)) && t.canWrite && !t.readOnly);
  }

  function renderTasksTab(): string {
    const statusLabel = (s: string) => {
      const m: Record<string, string> = {
        "NEEDS-ACTION": "To do",
        "IN-PROCESS": "In progress",
        COMPLETED: "Done",
        CANCELLED: "Cancelled",
      };
      return m[s] || s;
    };
    const tree = tasksInTreeOrder(tasks);
    const writableKeys = tasks
      .filter((t) => t.canWrite && !t.readOnly)
      .map((t) => itemKey(t.instanceId, t.uri));
    const allWritableChecked =
      writableKeys.length > 0 && writableKeys.every((k) => checkedTaskKeys.includes(k));
    const someChecked = checkedTaskKeys.length > 0;
    const checkedWritable = writableCheckedTasks();
    const nChecked = checkedWritable.length;

    const rows =
      tasks.length === 0
        ? `<tr class="contacts-empty-row"><td colspan="6" class="muted">${
            taskSearch ? "No tasks match your search." : "No tasks yet. Add one below."
          }</td></tr>`
        : tree
            .map(({ task: t, depth }) => {
              const key = itemKey(t.instanceId, t.uri);
              const active = !creatingTask && key === selectedTaskKey ? " is-selected" : "";
              const checked = checkedTaskKeys.includes(key);
              const st = t.status === "COMPLETED" ? "badge-ok" : t.status === "CANCELLED" ? "" : "badge-admin";
              const indent = depth > 0 ? ` style="--task-depth:${depth}"` : "";
              const marker =
                depth > 0
                  ? `<span class="task-subtask-marker" aria-hidden="true">↳</span>`
                  : "";
              const canCheck = t.canWrite && !t.readOnly;
              return `<tr class="contact-table-row task-row${depth > 0 ? " is-subtask" : ""}${active}${checked ? " is-checked" : ""}" data-action="select-task" data-instance="${t.instanceId}" data-uri="${esc(t.uri)}" tabindex="0" role="button"${indent}>
                <td class="col-task-check" data-stop-row>
                  <input type="checkbox" class="task-check" data-action="task-check" data-instance="${t.instanceId}" data-uri="${esc(t.uri)}"
                    ${checked ? "checked" : ""} ${canCheck ? "" : "disabled"} aria-label="Select ${esc(t.summary || t.uri)}" ${busy ? "disabled" : ""} />
                </td>
                <td class="col-task-title"><span class="task-title-inner">${marker}<span class="contact-name-primary">${esc(t.summary || t.uri)}</span></span>
                  ${t.readOnly ? '<span class="badge">read-only</span>' : ""}</td>
                <td class="col-task-status"><span class="badge ${st}">${esc(statusLabel(t.status))}</span></td>
                <td class="col-task-due muted small">${esc(formatWhen(t.due))}</td>
                <td class="col-task-cal muted small">${esc(t.calendarName)}</td>
                <td class="col-task-pct muted small">${t.percent ? esc(String(t.percent)) + "%" : "—"}</td>
              </tr>`;
            })
            .join("");

    const applyIcon = `<svg class="bulk-apply-icon" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">
      <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    const bulkApplyBtn = (action: string, label: string) =>
      `<button type="button" class="btn btn-small bulk-apply-btn" data-action="${action}"
        title="${esc(label)}" aria-label="${esc(label)}" ${busy || nChecked === 0 ? "disabled" : ""}>${applyIcon}</button>`;
    const bulkBar =
      someChecked
        ? `<div class="bulk-bar" style="margin-top:0.75rem">
            <div class="bulk-bar-row">
              <div class="bulk-bar-count">
                <strong>${nChecked}</strong><span class="bulk-bar-count-label">selected</span>${
                  checkedTaskKeys.length !== nChecked
                    ? `<span class="muted small bulk-bar-count-extra">(${checkedTaskKeys.length - nChecked} read-only skipped)</span>`
                    : ""
                }
              </div>
              <div class="bulk-group">
                <label class="bulk-field">Status
                  <select id="bulk-task-status" ${busy || nChecked === 0 ? "disabled" : ""}>
                    <option value="">—</option>
                    <option value="NEEDS-ACTION">To do</option>
                    <option value="IN-PROCESS">In progress</option>
                    <option value="COMPLETED">Done</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </label>
                ${bulkApplyBtn("bulk-task-status", "Apply status")}
              </div>
              <div class="bulk-group bulk-group-due">
                ${renderPortalDateTimeField({
                  field: "bulk-due",
                  name: "bulkDue",
                  label: "Due",
                  value: bulkDueValue,
                  dateOnly: false,
                  disabled: busy || nChecked === 0,
                  allowClear: true,
                })}
                ${bulkApplyBtn("bulk-task-due", "Apply due")}
                <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear-due" ${busy || nChecked === 0 ? "disabled" : ""} title="Clear due date">Clear due</button>
              </div>
              <div class="bulk-group">
                <label class="bulk-field bulk-field-pct">%
                  <input type="number" id="bulk-task-percent" min="0" max="100" placeholder="0–100" ${busy || nChecked === 0 ? "disabled" : ""} />
                </label>
                ${bulkApplyBtn("bulk-task-percent", "Apply %")}
              </div>
            </div>
            <div class="bulk-bar-actions">
              <button type="button" class="btn btn-small btn-danger" data-action="bulk-task-delete" ${busy || nChecked === 0 ? "disabled" : ""}>Delete</button>
              <button type="button" class="btn btn-small btn-ghost" data-action="bulk-task-clear" ${busy ? "disabled" : ""}>Clear selection</button>
            </div>
          </div>`
        : "";

    const t = editingTask;
    const calOpts = taskCalendars
      .map(
        (c) =>
          `<option value="${c.id}" ${t && t.instanceId === c.id ? "selected" : ""}>${esc(c.displayname)}</option>`,
      )
      .join("");
    const form =
      t
        ? `<div class="card">
            ${infoTitle(creatingTask ? (t.parentUid ? "New subtask" : "New task") : "Edit task", "tasks")}
            <form class="stack" data-form="task" style="margin-top:1rem">
              ${
                creatingTask
                  ? `<label>Calendar
                      <select name="instanceId" required ${taskCalendars.length === 0 ? "disabled" : ""}>
                        <option value="">${taskCalendars.length ? "Select calendar…" : "No writable calendars"}</option>
                        ${calOpts}
                      </select>
                    </label>`
                  : `<p class="muted small">Calendar: <strong>${esc(t.calendarName)}</strong>${t.readOnly ? " · read-only" : ""}</p>`
              }
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${esc(t.summary)}" ${t.readOnly && !creatingTask ? "readonly" : ""} />
              </label>
              <label>Description
                <textarea name="description" rows="4" maxlength="20000" ${t.readOnly && !creatingTask ? "readonly" : ""}>${esc(t.description)}</textarea>
              </label>
              <label>Parent task
                <select name="parentUid" ${t.readOnly && !creatingTask ? "disabled" : ""}>
                  ${parentTaskOptions(t, creatingTask)}
                </select>
                <span class="muted small">Subtasks must use a parent on the same calendar (CalDAV RELATED-TO).</span>
              </label>
              <div class="form-grid form-grid-2">
                <label>Status
                  <select name="status" ${t.readOnly && !creatingTask ? "disabled" : ""}>
                    ${["NEEDS-ACTION", "IN-PROCESS", "COMPLETED", "CANCELLED"]
                      .map(
                        (s) =>
                          `<option value="${s}" ${t.status === s ? "selected" : ""}>${esc(statusLabel(s))}</option>`,
                      )
                      .join("")}
                  </select>
                </label>
                ${renderPortalDateTimeField({
                  field: "due",
                  name: "due",
                  label: "Due",
                  value: toLocalInputValue(t.due),
                  dateOnly: false,
                  disabled: !!(t.readOnly && !creatingTask),
                  allowClear: true,
                })}
              </div>
              <div class="form-grid form-grid-2">
                <label>Priority (0–9)
                  <input type="number" name="priority" min="0" max="9" value="${esc(String(t.priority || 0))}" ${t.readOnly && !creatingTask ? "readonly" : ""} />
                </label>
                <label>% complete
                  <input type="number" name="percent" min="0" max="100" value="${esc(String(t.percent || 0))}" ${t.readOnly && !creatingTask ? "readonly" : ""} />
                </label>
              </div>
              <div class="form-actions-row">
                ${
                  creatingTask || t.canWrite
                    ? `<button type="submit" class="btn btn-primary" ${busy ? "disabled" : ""}>${creatingTask ? "Create task" : "Save task"}</button>`
                    : ""
                }
                ${
                  !creatingTask && t.canWrite
                    ? `<button type="button" class="btn btn-ghost" data-action="new-subtask" ${busy ? "disabled" : ""}>Add subtask</button>
                       <button type="button" class="btn btn-danger" data-action="delete-task" ${busy ? "disabled" : ""}>Delete</button>`
                    : creatingTask
                      ? `<button type="button" class="btn btn-ghost" data-action="cancel-task">Cancel</button>`
                      : ""
                }
              </div>
            </form>
          </div>`
        : `<div class="card"><p class="muted">Select a task or click <strong>Add task</strong>.</p></div>`;

    return `<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${infoTitle("Tasks", "tasks")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="task-search" placeholder="Search tasks…" value="${esc(taskSearch)}" aria-label="Search tasks" ${busy ? "disabled" : ""} />
          <button type="button" class="btn btn-primary" data-action="new-task" ${busy || taskCalendars.length === 0 ? "disabled" : ""}>Add task</button>
        </div>
        ${bulkBar}
        ${
          taskCalendars.length === 0
            ? `<p class="muted small" style="margin-top:0.75rem">No writable calendars with tasks (VTODO) enabled. Create a calendar under <strong>Calendar</strong> (system Tasks setting must be on).</p>`
            : ""
        }
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                <th class="col-task-check">
                  <input type="checkbox" data-action="task-select-all" aria-label="Select all writable tasks"
                    ${allWritableChecked ? "checked" : ""} ${writableKeys.length === 0 || busy ? "disabled" : ""} />
                </th>
                ${sortHeader("Title", "summary", taskSort, taskOrder, "task", "col-task-title")}
                ${sortHeader("Status", "status", taskSort, taskOrder, "task", "col-task-status")}
                ${sortHeader("Due", "due", taskSort, taskOrder, "task", "col-task-due")}
                ${sortHeader("Calendar", "calendar", taskSort, taskOrder, "task", "col-task-cal")}
                ${sortHeader("%", "percent", taskSort, taskOrder, "task", "col-task-pct")}
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${form}
      </section>
    </div>`;
  }

  function renderNotesTab(): string {
    const rows =
      notes.length === 0
        ? `<tr class="contacts-empty-row"><td colspan="3" class="muted">${
            noteSearch ? "No notes match your search." : "No notes yet. Add one below."
          }</td></tr>`
        : notes
            .map((n) => {
              const key = itemKey(n.instanceId, n.uri);
              const active = !creatingNote && key === selectedNoteKey ? " is-selected" : "";
              const preview = (n.description || "").replace(/\s+/g, " ").slice(0, 80);
              return `<tr class="contact-table-row${active}" data-action="select-note" data-instance="${n.instanceId}" data-uri="${esc(n.uri)}" tabindex="0" role="button">
                <td class="col-note-title">
                  <span class="contact-name-primary">${esc(n.summary || n.uri)}</span>
                  ${preview ? `<span class="muted small contact-name-secondary">${esc(preview)}${n.description.length > 80 ? "…" : ""}</span>` : ""}
                  ${n.readOnly ? '<span class="badge">read-only</span>' : ""}
                </td>
                <td class="col-note-date muted small">${esc(formatWhen(n.dtstart))}</td>
                <td class="col-note-cal muted small">${esc(n.calendarName)}</td>
              </tr>`;
            })
            .join("");

    const n = editingNote;
    const calOpts = noteCalendars
      .map(
        (c) =>
          `<option value="${c.id}" ${n && n.instanceId === c.id ? "selected" : ""}>${esc(c.displayname)}</option>`,
      )
      .join("");
    const form =
      n
        ? `<div class="card">
            ${infoTitle(creatingNote ? "New note" : "Edit note", "notes")}
            <form class="stack" data-form="note" style="margin-top:1rem">
              ${
                creatingNote
                  ? `<label>Calendar
                      <select name="instanceId" required ${noteCalendars.length === 0 ? "disabled" : ""}>
                        <option value="">${noteCalendars.length ? "Select calendar…" : "No writable calendars"}</option>
                        ${calOpts}
                      </select>
                    </label>`
                  : `<p class="muted small">Calendar: <strong>${esc(n.calendarName)}</strong>${n.readOnly ? " · read-only" : ""}</p>`
              }
              <label>Title
                <input type="text" name="summary" required maxlength="500" value="${esc(n.summary)}" ${n.readOnly && !creatingNote ? "readonly" : ""} />
              </label>
              ${renderPortalDateTimeField({
                field: "dtstart",
                name: "dtstart",
                label: "Date",
                value: toLocalInputValue(n.dtstart),
                dateOnly: false,
                disabled: !!(n.readOnly && !creatingNote),
                allowClear: true,
              })}
              <label>Body
                <textarea name="description" rows="8" maxlength="20000" ${n.readOnly && !creatingNote ? "readonly" : ""}>${esc(n.description)}</textarea>
              </label>
              <div class="form-actions-row">
                ${
                  creatingNote || n.canWrite
                    ? `<button type="submit" class="btn btn-primary" ${busy ? "disabled" : ""}>${creatingNote ? "Create note" : "Save note"}</button>`
                    : ""
                }
                ${
                  !creatingNote && n.canWrite
                    ? `<button type="button" class="btn btn-danger" data-action="delete-note" ${busy ? "disabled" : ""}>Delete</button>`
                    : creatingNote
                      ? `<button type="button" class="btn btn-ghost" data-action="cancel-note">Cancel</button>`
                      : ""
                }
              </div>
            </form>
          </div>`
        : `<div class="card"><p class="muted">Select a note or click <strong>Add note</strong>.</p></div>`;

    return `<div class="portal-grid portal-grid-items">
      <section class="card contacts-main-card items-list-card">
        ${infoTitle("Notes", "notes")}
        <div class="contact-toolbar" style="margin-top:0.75rem">
          <input type="search" data-action="note-search" placeholder="Search notes…" value="${esc(noteSearch)}" aria-label="Search notes" ${busy ? "disabled" : ""} />
          <button type="button" class="btn btn-primary" data-action="new-note" ${busy || noteCalendars.length === 0 ? "disabled" : ""}>Add note</button>
        </div>
        ${
          noteCalendars.length === 0
            ? `<p class="muted small" style="margin-top:0.75rem">No writable calendars with notes (VJOURNAL) enabled. Enable Notes in Admin settings and ensure calendars include VJOURNAL.</p>`
            : ""
        }
        <div class="contacts-table-wrap items-table-wrap" style="margin-top:0.75rem">
          <table class="contacts-table">
            <thead>
              <tr>
                ${sortHeader("Title", "summary", noteSort, noteOrder, "note", "col-note-title")}
                ${sortHeader("Date", "dtstart", noteSort, noteOrder, "note", "col-note-date")}
                ${sortHeader("Calendar", "calendar", noteSort, noteOrder, "note", "col-note-cal")}
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </section>
      <section class="stack items-edit-panel">
        ${form}
      </section>
    </div>`;
  }

  /** Full re-render replaces DOM and would reset scroll; capture/restore so list clicks stay put. */
  function captureScroll() {
    const table = root.querySelector<HTMLElement>(".contacts-table-wrap");
    const abList = root.querySelector<HTMLElement>(".contacts-ab-list");
    const calList = root.querySelector<HTMLElement>(".calendars-owned-list");
    return {
      windowX: window.scrollX,
      windowY: window.scrollY,
      tableTop: table?.scrollTop ?? null,
      abListTop: abList?.scrollTop ?? null,
      calListTop: calList?.scrollTop ?? null,
    };
  }

  function restoreScroll(s: {
    windowX: number;
    windowY: number;
    tableTop: number | null;
    abListTop: number | null;
    calListTop: number | null;
  }) {
    // Double rAF: after layout of the newly injected form/list
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.scrollTo(s.windowX, s.windowY);
        if (s.tableTop !== null) {
          const table = root.querySelector<HTMLElement>(".contacts-table-wrap");
          if (table) table.scrollTop = s.tableTop;
        }
        if (s.abListTop !== null) {
          const abList = root.querySelector<HTMLElement>(".contacts-ab-list");
          if (abList) abList.scrollTop = s.abListTop;
        }
        if (s.calListTop !== null) {
          const calList = root.querySelector<HTMLElement>(".calendars-owned-list");
          if (calList) calList.scrollTop = s.calListTop;
        }
      });
    });
  }

  function render() {
    const scroll = captureScroll();
    if (!user) {
      renderLogin();
    } else {
      renderHome();
    }
    bind();
    restoreScroll(scroll);
    requestAnimationFrame(() => {
      positionDtPopovers();
      root.querySelector(".dt-time.is-selected")?.scrollIntoView({ block: "center" });
    });
  }

  function bindColorPair(form: HTMLFormElement) {
    const picker = form.querySelector<HTMLInputElement>('input[name="color_picker"]');
    const text = form.querySelector<HTMLInputElement>('input[name="color"]');
    if (!picker || !text) return;
    picker.addEventListener("input", () => {
      text.value = picker.value.toUpperCase();
    });
    text.addEventListener("change", () => {
      let v = text.value.trim();
      if (v && !v.startsWith("#")) v = `#${v}`;
      if (/^#[0-9A-Fa-f]{6}/.test(v)) {
        picker.value = v.slice(0, 7);
        text.value = v.toUpperCase();
      }
    });
  }

  function bind() {
    root.querySelectorAll("[data-action]").forEach((el) => {
      el.addEventListener("click", (ev) => {
        // Don't let info button clicks select calendar rows etc.
        const target = (ev.target as HTMLElement).closest<HTMLElement>("[data-action]");
        if (target?.dataset.action === "info" || target?.dataset.action === "info-close") {
          ev.preventDefault();
          ev.stopPropagation();
        }
        void onAction(ev);
      });
    });
    // Close user menu when clicking outside (single listener per open cycle)
    unbindUserMenuOutside();
    if (userMenuOpen) {
      bindUserMenuOutside();
    }
    // Keyboard activation for contacts table rows, calendar list rows, month day cells
    root
      .querySelectorAll<HTMLElement>(
        "tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]",
      )
      .forEach((row) => {
        row.addEventListener("keydown", (ev: KeyboardEvent) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            row.click();
          }
        });
      });
    const delConfirm = root.querySelector<HTMLInputElement>("#delete-cal-confirm");
    const delSubmit = root.querySelector<HTMLButtonElement>("#delete-cal-submit");
    delConfirm?.addEventListener("change", () => {
      if (delSubmit) delSubmit.disabled = !delConfirm.checked || busy;
    });
    const delAbConfirm = root.querySelector<HTMLInputElement>("#delete-ab-confirm");
    const delAbSubmit = root.querySelector<HTMLButtonElement>("#delete-ab-submit");
    delAbConfirm?.addEventListener("change", () => {
      if (delAbSubmit) delAbSubmit.disabled = !delAbConfirm.checked || busy;
    });
    // Avatar photo 404 → initials (no inline onerror — CSP script-src 'self')
    root.querySelectorAll<HTMLImageElement>("img.contact-avatar[data-avatar-fallback]").forEach((img) => {
      img.addEventListener("error", () => {
        const letter = img.dataset.avatarFallback || "?";
        const span = document.createElement("span");
        span.className = "contact-avatar contact-avatar-fallback";
        span.setAttribute("aria-hidden", "true");
        span.textContent = letter;
        img.replaceWith(span);
      });
    });
    if (!escapeBound) {
      document.addEventListener("keydown", (ev: KeyboardEvent) => {
        if (ev.key !== "Escape") return;
        if (
          importProgress &&
          (importProgress.phase === "done" || importProgress.phase === "error")
        ) {
          closeImportProgress();
          return;
        }
        if (importProgress) return; // block Escape while import is running
        if (userMenuOpen) {
          userMenuOpen = false;
          unbindUserMenuOutside();
          render();
          return;
        }
        if (
          filesRenamePath !== null ||
          filesDeletePaths !== null ||
          filesTransfer !== null ||
          filesMkdirOpen
        ) {
          filesRenamePath = null;
          filesDeletePaths = null;
          filesTransfer = null;
          filesMkdirOpen = false;
          render();
          return;
        }
        closeInfoModal();
      });
      escapeBound = true;
    }
    const loginForm = root.querySelector<HTMLFormElement>('[data-form="login"]');
    loginForm?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      void onLogin(loginForm);
    });
    const filesRenameForm = root.querySelector<HTMLFormElement>('[data-form="files-rename"]');
    filesRenameForm?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      void onFilesRename(filesRenameForm);
    });
    const filesTransferForm = root.querySelector<HTMLFormElement>('[data-form="files-transfer"]');
    filesTransferForm?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      void onFilesTransfer(filesTransferForm);
    });
    const filesMkdirForm = root.querySelector<HTMLFormElement>('[data-form="files-mkdir"]');
    filesMkdirForm?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      void onFilesMkdir(filesMkdirForm);
    });
    // Focus new-folder name field when the modal opens
    if (filesMkdirOpen) {
      requestAnimationFrame(() => {
        filesMkdirForm?.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
      });
    }
    root.querySelectorAll<HTMLInputElement>('input[type="file"][data-action="files-upload"]').forEach((input) => {
      input.addEventListener("change", () => {
        void onFilesUpload(input);
      });
    });
    // Indeterminate "select all" for files multi-select
    root.querySelectorAll<HTMLInputElement>('input[data-action="files-select-all"][data-indeterminate="1"]').forEach((cb) => {
      cb.indeterminate = true;
    });
    const shareForm = root.querySelector<HTMLFormElement>('[data-form="share"]');
    shareForm?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      void onShare(shareForm);
    });
    const editForm = root.querySelector<HTMLFormElement>('[data-form="edit-cal"]');
    if (editForm) {
      bindColorPair(editForm);
      editForm.addEventListener("submit", (ev) => {
        ev.preventDefault();
        void onEditCal(editForm);
      });
    }
    const eventForm = root.querySelector<HTMLFormElement>('[data-form="edit-event"]');
    eventForm?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      void onSaveEvent(eventForm);
    });
    // Selects use "change" (not only click) for repeat UI
    root
      .querySelectorAll<HTMLSelectElement>(
        'select[data-action="event-repeat-freq"], select[data-action="event-repeat-end"]',
      )
      .forEach((sel) => {
        sel.addEventListener("change", () => {
          if (!editingEvent) return;
          const form = root.querySelector<HTMLFormElement>('[data-form="edit-event"]');
          if (!form) return;
          const fd = new FormData(form);
          const allDayEl = form.querySelector<HTMLInputElement>('input[name="allDay"]');
          const nextRepeat = readRepeatFromForm(fd);
          // Default Until to event start / today when switching to "On date"
          if (nextRepeat.endMode === "until" && !nextRepeat.until) {
            nextRepeat.until =
              toDateInputValue(String(fd.get("start") ?? editingEvent.start ?? "")) ||
              ymd(new Date());
          }
          editingEvent = {
            ...editingEvent,
            summary: String(fd.get("summary") ?? editingEvent.summary),
            description: String(fd.get("description") ?? editingEvent.description),
            location: String(fd.get("location") ?? editingEvent.location),
            instanceId: Number(fd.get("instanceId")) || editingEvent.instanceId,
            allDay: allDayEl?.checked ?? editingEvent.allDay,
            start: String(fd.get("start") ?? editingEvent.start ?? ""),
            end: String(fd.get("end") ?? editingEvent.end ?? "") || null,
            repeat: nextRepeat,
            hasRrule: !!String(fd.get("repeatFreq") ?? "").trim(),
          };
          // End control is disabled when series Ends on a date — close its picker
          if (
            nextRepeat.freq &&
            nextRepeat.endMode === "until" &&
            eventDtPicker?.field === "end"
          ) {
            eventDtPicker = null;
          }
          render();
          if (nextRepeat.endMode === "until") {
            requestAnimationFrame(() => {
              const until = root.querySelector<HTMLInputElement>('input[name="repeatUntil"]');
              until?.focus();
              // Open native picker when the browser supports it
              try {
                (
                  until as HTMLInputElement & { showPicker?: () => void }
                )?.showPicker?.();
              } catch {
                /* ignore — not all browsers allow programmatic open */
              }
            });
          }
        });
      });
    const createForm = root.querySelector<HTMLFormElement>('[data-form="create-cal"]');
    if (createForm) {
      bindColorPair(createForm);
      createForm.addEventListener("submit", (ev) => {
        ev.preventDefault();
        void onCreateCal(createForm);
      });
    }
    const createAb = root.querySelector<HTMLFormElement>('[data-form="create-ab"]');
    createAb?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      void onCreateAb(createAb);
    });
    const editAb = root.querySelector<HTMLFormElement>('[data-form="edit-ab"]');
    editAb?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      void onEditAb(editAb);
    });
    const contactForm = root.querySelector<HTMLFormElement>('[data-form="contact"]');
    contactForm?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      void onSaveContact(contactForm);
    });
    const taskForm = root.querySelector<HTMLFormElement>('[data-form="task"]');
    taskForm?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      void onSaveTask(taskForm);
    });
    // When calendar changes on create, refresh parent options for that calendar
    if (taskForm) {
      const calSelect = taskForm.querySelector<HTMLSelectElement>('select[name="instanceId"]');
      calSelect?.addEventListener("change", () => {
        if (!creatingTask || !editingTask) return;
        const id = Number(calSelect.value);
        if (!Number.isFinite(id) || id <= 0) return;
        const fd = new FormData(taskForm);
        const dueLocal = String(fd.get("due") ?? "").trim();
        editingTask = {
          ...editingTask,
          instanceId: id,
          // Parent must be on the same calendar — clear if mismatch
          parentUid:
            editingTask.parentUid &&
            tasks.some((x) => x.uid === editingTask!.parentUid && x.instanceId === id)
              ? editingTask.parentUid
              : null,
          summary: String(fd.get("summary") ?? ""),
          description: String(fd.get("description") ?? ""),
          status: String(fd.get("status") ?? "NEEDS-ACTION"),
          due: dueLocal ? new Date(dueLocal).toISOString() : null,
          priority: Number(fd.get("priority") ?? 0),
          percent: Number(fd.get("percent") ?? 0),
        };
        render();
      });
    }
    const noteForm = root.querySelector<HTMLFormElement>('[data-form="note"]');
    noteForm?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      void onSaveNote(noteForm);
    });
    const searchInput = root.querySelector<HTMLInputElement>('input[data-action="contact-search"]');
    searchInput?.addEventListener("input", () => {
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        contactSearch = searchInput.value;
        if (selectedAbId === null) return;
        void (async () => {
          try {
            await loadContacts(selectedAbId);
            render();
          } catch (e) {
            setFlash("error", e instanceof Error ? e.message : "Search failed");
            render();
          }
        })();
      }, 250);
    });
    const taskSearchInput = root.querySelector<HTMLInputElement>('input[data-action="task-search"]');
    taskSearchInput?.addEventListener("input", () => {
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        taskSearch = taskSearchInput.value;
        void (async () => {
          try {
            await loadTasks();
            render();
          } catch (e) {
            setFlash("error", e instanceof Error ? e.message : "Search failed");
            render();
          }
        })();
      }, 250);
    });
    const adminUsersSearch = root.querySelector<HTMLInputElement>(
      'input[data-action="admin-users-search"]',
    );
    adminUsersSearch?.addEventListener("input", () => {
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        adminUsersQuery = adminUsersSearch.value;
        render();
      }, 150);
    });
    const adminCreateForm = root.querySelector<HTMLFormElement>(
      '[data-form="admin-user-create"]',
    );
    adminCreateForm?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      void onAdminUserCreate(adminCreateForm);
    });
    const adminEditForm = root.querySelector<HTMLFormElement>(
      '[data-form="admin-user-edit"]',
    );
    adminEditForm?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      void onAdminUserEdit(adminEditForm);
    });
    const adminCalForm = root.querySelector<HTMLFormElement>('[data-form="admin-cal"]');
    adminCalForm?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      void onAdminCalSave(adminCalForm);
    });
    const adminAbForm = root.querySelector<HTMLFormElement>('[data-form="admin-ab"]');
    adminAbForm?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      void onAdminAbSave(adminAbForm);
    });
    const adminSettingsForm = root.querySelector<HTMLFormElement>(
      '[data-form="admin-settings"]',
    );
    adminSettingsForm?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      void onAdminSettingsSave(adminSettingsForm);
    });
    const adminDbForm = root.querySelector<HTMLFormElement>('[data-form="admin-database"]');
    adminDbForm?.addEventListener("submit", (ev) => {
      ev.preventDefault();
      onAdminDatabaseFormSubmit(adminDbForm);
    });
    const adminDbBackend = root.querySelector<HTMLSelectElement>(
      'select[data-action="admin-db-backend"]',
    );
    adminDbBackend?.addEventListener("change", () => {
      adminDbFormBackend = adminDbBackend.value === "pgsql" ? "pgsql" : "sqlite";
      render();
    });
    const adminDbConfirmInp = root.querySelector<HTMLInputElement>(
      'input[data-action="admin-db-confirm-input"]',
    );
    adminDbConfirmInp?.addEventListener("input", () => {
      adminDbConfirmText = adminDbConfirmInp.value;
      const btn = root.querySelector<HTMLButtonElement>('[data-action="admin-db-confirm-save"]');
      if (btn) {
        btn.disabled = busy || adminDbConfirmText.trim() !== "CONFIRM";
      }
    });
    const noteSearchInput = root.querySelector<HTMLInputElement>('input[data-action="note-search"]');
    noteSearchInput?.addEventListener("input", () => {
      if (searchTimer) clearTimeout(searchTimer);
      searchTimer = setTimeout(() => {
        noteSearch = noteSearchInput.value;
        void (async () => {
          try {
            await loadNotes();
            render();
          } catch (e) {
            setFlash("error", e instanceof Error ? e.message : "Search failed");
            render();
          }
        })();
      }, 250);
    });
    bindImportInput();
    bindHolidaysToggle();
    bindContactPhotoInput();
  }

  async function runBulkTaskAction(
    action:
      | "bulk-task-status"
      | "bulk-task-due"
      | "bulk-task-clear-due"
      | "bulk-task-percent"
      | "bulk-task-delete",
  ) {
    const selected = writableCheckedTasks();
    if (selected.length === 0) {
      setFlash("error", "No writable tasks selected");
      render();
      return;
    }
    const items = selected.map((t) => ({ instanceId: t.instanceId, uri: t.uri }));

    if (action === "bulk-task-delete") {
      if (
        !confirm(
          `Delete ${selected.length} task${selected.length === 1 ? "" : "s"}? CalDAV clients will sync the removal.`,
        )
      ) {
        return;
      }
      busy = true;
      clearFlash();
      render();
      try {
        const res = await api.bulkTasks({ op: "delete", items });
        checkedTaskKeys = [];
        if (selectedTaskKey && selected.some((t) => itemKey(t.instanceId, t.uri) === selectedTaskKey)) {
          selectedTaskKey = null;
          editingTask = null;
          creatingTask = false;
        }
        await loadTasks();
        if (res.failed > 0) {
          setFlash(
            "error",
            `Deleted ${res.ok}, failed ${res.failed}${res.errors[0] ? `: ${res.errors[0]}` : ""}`,
          );
        } else {
          setFlash("success", `Deleted ${res.ok} task${res.ok === 1 ? "" : "s"}`);
        }
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Bulk delete failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }

    let fields: { status?: string; due?: string | null; percent?: number } = {};
    if (action === "bulk-task-status") {
      const sel = root.querySelector<HTMLSelectElement>("#bulk-task-status");
      const status = sel?.value?.trim() ?? "";
      if (!status) {
        setFlash("error", "Choose a status to apply");
        render();
        return;
      }
      fields = { status };
    } else if (action === "bulk-task-due") {
      const raw = bulkDueValue.trim();
      if (!raw) {
        setFlash("error", "Choose a due date to apply");
        render();
        return;
      }
      const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(raw)
        ? new Date(raw + "T00:00:00")
        : new Date(raw.length === 16 ? raw : raw);
      if (Number.isNaN(dueDate.getTime())) {
        setFlash("error", "Invalid due date");
        render();
        return;
      }
      fields = { due: dueDate.toISOString() };
    } else if (action === "bulk-task-clear-due") {
      fields = { due: null };
    } else if (action === "bulk-task-percent") {
      const input = root.querySelector<HTMLInputElement>("#bulk-task-percent");
      const raw = input?.value?.trim() ?? "";
      if (raw === "") {
        setFlash("error", "Enter a percent complete (0–100)");
        render();
        return;
      }
      const pct = Number(raw);
      if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
        setFlash("error", "Percent must be between 0 and 100");
        render();
        return;
      }
      fields = { percent: Math.round(pct) };
    }

    busy = true;
    clearFlash();
    render();
    try {
      const res = await api.bulkTasks({ op: "update", items, fields });
      await loadTasks();
      // Refresh open editor if it was in the bulk set
      if (editingTask && !creatingTask) {
        const key = itemKey(editingTask.instanceId, editingTask.uri);
        const refreshed = tasks.find((x) => itemKey(x.instanceId, x.uri) === key);
        if (refreshed) editingTask = { ...refreshed };
      }
      const label =
        action === "bulk-task-status"
          ? "status"
          : action === "bulk-task-due"
            ? "due date"
            : action === "bulk-task-clear-due"
              ? "due date"
              : "percent";
      if (res.failed > 0) {
        setFlash(
          "error",
          `Updated ${label} on ${res.ok}, failed ${res.failed}${res.errors[0] ? `: ${res.errors[0]}` : ""}`,
        );
      } else {
        setFlash(
          "success",
          `Updated ${label} on ${res.ok} task${res.ok === 1 ? "" : "s"}`,
        );
      }
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Bulk update failed");
    } finally {
      busy = false;
      render();
    }
  }

  async function onSaveTask(form: HTMLFormElement) {
    const fd = new FormData(form);
    const summary = String(fd.get("summary") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const status = String(fd.get("status") ?? "NEEDS-ACTION");
    const dueLocal = String(fd.get("due") ?? "").trim();
    const due = dueLocal ? new Date(dueLocal).toISOString() : null;
    const priority = Number(fd.get("priority") ?? 0);
    const percent = Number(fd.get("percent") ?? 0);
    const parentRaw = String(fd.get("parentUid") ?? "").trim();
    const parentUid = parentRaw === "" ? null : parentRaw;
    busy = true;
    clearFlash();
    render();
    try {
      if (creatingTask) {
        const instanceId = Number(fd.get("instanceId"));
        if (!Number.isFinite(instanceId) || instanceId <= 0) {
          throw new Error("Select a calendar");
        }
        const res = await api.createTask({
          instanceId,
          summary,
          description,
          status,
          due,
          priority,
          percent,
          parentUid,
        });
        creatingTask = false;
        selectedTaskKey = itemKey(res.task.instanceId, res.task.uri);
        editingTask = res.task;
        setFlash("success", parentUid ? "Subtask created" : "Task created");
      } else if (editingTask) {
        const res = await api.updateTask(editingTask.instanceId, editingTask.uri, {
          summary,
          description,
          status,
          due,
          priority,
          percent,
          parentUid,
        });
        editingTask = res.task;
        selectedTaskKey = itemKey(res.task.instanceId, res.task.uri);
        setFlash("success", "Task saved");
      }
      await loadTasks();
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Save failed");
    } finally {
      busy = false;
      render();
    }
  }

  async function onSaveNote(form: HTMLFormElement) {
    const fd = new FormData(form);
    const summary = String(fd.get("summary") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const dtLocal = String(fd.get("dtstart") ?? "").trim();
    const dtstart = dtLocal ? new Date(dtLocal).toISOString() : null;
    busy = true;
    clearFlash();
    render();
    try {
      if (creatingNote) {
        const instanceId = Number(fd.get("instanceId"));
        if (!Number.isFinite(instanceId) || instanceId <= 0) {
          throw new Error("Select a calendar");
        }
        const res = await api.createNote({
          instanceId,
          summary,
          description,
          dtstart,
        });
        creatingNote = false;
        selectedNoteKey = itemKey(res.note.instanceId, res.note.uri);
        editingNote = res.note;
        setFlash("success", "Note created");
      } else if (editingNote) {
        const res = await api.updateNote(editingNote.instanceId, editingNote.uri, {
          summary,
          description,
          dtstart,
        });
        editingNote = res.note;
        selectedNoteKey = itemKey(res.note.instanceId, res.note.uri);
        setFlash("success", "Note saved");
      }
      await loadNotes();
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Save failed");
    } finally {
      busy = false;
      render();
    }
  }

  function bindContactPhotoInput() {
    const input = root.querySelector<HTMLInputElement>('input[data-action="contact-photo"]');
    if (!input) return;
    input.addEventListener("change", () => {
      void (async () => {
        const file = input.files?.[0];
        input.value = "";
        if (!file) return;
        if (file.size > 2.5 * 1024 * 1024) {
          setFlash("error", "Photo is too large (max ~2 MB)");
          render();
          return;
        }
        try {
          const b64 = await fileToBase64(file);
          photoBase64Pending = b64;
          photoPreview = `data:${file.type || "image/jpeg"};base64,${b64}`;
          removePhotoPending = false;
          render();
        } catch (e) {
          setFlash("error", e instanceof Error ? e.message : "Failed to read photo");
          render();
        }
      })();
    });
  }

  function bindHolidaysToggle() {
    const form = root.querySelector<HTMLFormElement>('[data-form="create-cal"]');
    if (!form) return;
    const cb = form.querySelector<HTMLInputElement>('input[name="holidays"]');
    const wrap = form.querySelector<HTMLElement>("#holidays-country-wrap");
    const nameInput = form.querySelector<HTMLInputElement>('input[name="displayname"]');
    const readOnly = form.querySelector<HTMLInputElement>('input[name="readOnly"]');
    if (!cb || !wrap) return;

    const sync = () => {
      const on = cb.checked;
      wrap.hidden = !on;
      if (nameInput) {
        nameInput.required = !on;
        if (on && !nameInput.value.trim()) {
          nameInput.placeholder = "Auto: Holidays (XX)";
        } else if (!on) {
          nameInput.placeholder = "Work";
        }
      }
      if (on && readOnly) {
        readOnly.checked = true;
      }
    };
    cb.addEventListener("change", sync);
    sync();
  }

  async function onLogin(form: HTMLFormElement) {
    const fd = new FormData(form);
    const username = String(fd.get("username") ?? "");
    const password = String(fd.get("password") ?? "");
    busy = true;
    clearFlash();
    render();
    log.event("login.attempt", { username });
    try {
      const res = await api.login(username, password);
      user = res.user;
      applyPortalUi(res.ui);
      log.event("login.ok", { username: user?.username ?? username });
      bumpSessionIdleTimer();
      if (userIsAdmin()) {
        try {
          await loadAdminCapabilities();
        } catch (e) {
          log.warn("admin.capabilities login", e instanceof Error ? e.message : e);
        }
      }
      normalizeActiveTab();
      persistTab(activeTab, adminPage);
      await loadHome();
      if (activeTab === "admin" && userIsAdmin() && adminUiEnabled()) {
        try {
          if (adminPage === "overview" && adminPageMeta("overview")?.available !== false) {
            await loadAdminDashboard();
          } else if (adminPage === "users" && adminPageMeta("users")?.available !== false) {
            await loadAdminUsers();
            if (adminSelectedUsername) {
              await loadAdminUserDetail(adminSelectedUsername);
              await loadAdminUserResources(adminSelectedUsername);
            }
          } else if (adminPage === "settings" && adminPageMeta("settings")?.available !== false) {
            await loadAdminSystemSettings();
          } else if (adminPage === "database" && adminPageMeta("database")?.available !== false) {
            await loadAdminDatabaseSettings();
          }
        } catch (e) {
          log.warn("admin login load", e instanceof Error ? e.message : e);
        }
      }
      setFlash("success", "Signed in");
    } catch (e) {
      log.warn("login.failed", e instanceof Error ? e.message : e);
      setFlash("error", e instanceof Error ? e.message : "Login failed");
    } finally {
      busy = false;
      render();
    }
  }

  async function onFilesRename(form: HTMLFormElement) {
    const fd = new FormData(form);
    const path = String(fd.get("path") ?? "");
    const newName = String(fd.get("newName") ?? "").trim();
    if (!path || !newName) {
      setFlash("error", "Name is required");
      render();
      return;
    }
    busy = true;
    clearFlash();
    render();
    try {
      await api.filesRename(path, newName);
      log.event("files.rename", { path, newName });
      filesRenamePath = null;
      await loadFiles();
      setFlash("success", `Renamed to “${newName}”`);
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Rename failed");
    } finally {
      busy = false;
      render();
    }
  }

  async function onFilesMkdir(form: HTMLFormElement) {
    const fd = new FormData(form);
    const name = String(fd.get("name") ?? "").trim();
    if (!name) {
      setFlash("error", "Folder name is required");
      render();
      return;
    }
    busy = true;
    clearFlash();
    render();
    try {
      await api.filesMkdir(filesPath, name);
      log.event("files.mkdir", { path: filesPath, name });
      filesMkdirOpen = false;
      await loadFiles();
      setFlash("success", `Created folder “${name}”`);
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Could not create folder");
    } finally {
      busy = false;
      render();
    }
  }

  async function onFilesTransfer(form: HTMLFormElement) {
    if (!filesTransfer || filesTransfer.paths.length === 0) return;
    const fd = new FormData(form);
    const toPath = String(fd.get("toPath") ?? "").trim().replace(/^\/+|\/+$/g, "");
    const newNameRaw = String(fd.get("newName") ?? "").trim();
    const op = filesTransfer.op;
    const paths = [...filesTransfer.paths];
    const multi = paths.length > 1;
    busy = true;
    clearFlash();
    render();
    let ok = 0;
    const errors: string[] = [];
    try {
      for (const path of paths) {
        try {
          if (op === "copy") {
            // Omit newName when unchanged so the server can append " (copy)"
            // if the destination already has that name.
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
      filesTransfer = null;
      checkedFilePaths = [];
      await loadFiles();
      const verb = op === "copy" ? "Copied" : "Moved";
      if (ok > 0 && errors.length === 0) {
        setFlash("success", ok === 1 ? `${verb} 1 item` : `${verb} ${ok} items`);
      } else if (ok > 0) {
        setFlash("info", `${verb} ${ok}; ${errors.length} failed. ${errors[0]}`);
      } else {
        setFlash("error", errors[0] || `${op === "copy" ? "Copy" : "Move"} failed`);
      }
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Operation failed");
    } finally {
      busy = false;
      render();
    }
  }

  async function onFilesUpload(input: HTMLInputElement) {
    const list = input.files;
    if (!list || list.length === 0) return;
    const files = Array.from(list);
    input.value = "";
    busy = true;
    clearFlash();
    render();
    let ok = 0;
    const errors: string[] = [];
    try {
      for (const file of files) {
        try {
          await api.filesUpload(filesPath, file, { replace: true });
          log.event("files.upload", { path: filesPath, name: file.name, size: file.size });
          ok += 1;
        } catch (e) {
          errors.push(`${file.name}: ${e instanceof Error ? e.message : "failed"}`);
        }
      }
      await loadFiles();
      if (ok > 0 && errors.length === 0) {
        setFlash("success", ok === 1 ? "Uploaded 1 file" : `Uploaded ${ok} files`);
      } else if (ok > 0) {
        setFlash("info", `Uploaded ${ok}; ${errors.length} failed. ${errors[0]}`);
      } else {
        setFlash("error", errors[0] || "Upload failed");
      }
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Upload failed");
    } finally {
      busy = false;
      render();
    }
  }

  async function onShare(form: HTMLFormElement) {
    if (selectedId === null) return;
    const fd = new FormData(form);
    const username = String(fd.get("username") ?? "");
    const access = String(fd.get("access") ?? "read") as "read" | "readwrite";
    calModalOpen = true;
    busy = true;
    clearFlash();
    render();
    try {
      await api.share(selectedId, username, access);
      await loadShares(selectedId);
      setFlash("success", `Shared with ${username}`);
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Share failed");
    } finally {
      busy = false;
      render();
    }
  }

  function syncEditingEventFromForm(form: HTMLFormElement): void {
    if (!editingEvent) return;
    const fd = new FormData(form);
    const allDayEl = form.querySelector<HTMLInputElement>('input[name="allDay"]');
    editingEvent = {
      ...editingEvent,
      summary: String(fd.get("summary") ?? editingEvent.summary),
      description: String(fd.get("description") ?? editingEvent.description),
      location: String(fd.get("location") ?? editingEvent.location),
      instanceId: Number(fd.get("instanceId")) || editingEvent.instanceId,
      allDay: allDayEl?.checked ?? editingEvent.allDay,
      start: String(fd.get("start") ?? editingEvent.start ?? ""),
      end: String(fd.get("end") ?? editingEvent.end ?? "") || null,
      repeat: readRepeatFromForm(fd),
      hasRrule: !!String(fd.get("repeatFreq") ?? "").trim(),
    };
  }

  function readRepeatFromForm(fd: FormData): {
    freq: string;
    interval: number;
    until: string | null;
    count: number | null;
    byDay: string[];
    endMode: "never" | "until" | "count";
  } {
    const freq = String(fd.get("repeatFreq") ?? "").trim().toUpperCase();
    if (!freq) {
      return { freq: "", interval: 1, until: null, count: null, byDay: [], endMode: "never" };
    }
    const interval = Math.max(1, Math.min(99, Number(fd.get("repeatInterval") ?? 1) || 1));
    const rawEnd = String(fd.get("repeatEndMode") ?? "never");
    const endMode: "never" | "until" | "count" =
      rawEnd === "until" || rawEnd === "count" ? rawEnd : "never";
    let until: string | null = null;
    let count: number | null = null;
    if (endMode === "until") {
      const u = String(fd.get("repeatUntil") ?? "").trim();
      // Keep endMode=until even if date empty so the date field stays visible
      until = u ? u.slice(0, 10) : null;
    } else if (endMode === "count") {
      const c = Number(fd.get("repeatCount") ?? 0);
      count = Number.isFinite(c) && c > 0 ? Math.min(999, Math.round(c)) : 10;
    }
    const byDay = fd
      .getAll("repeatByDay")
      .map((v) => String(v).toUpperCase())
      .filter(Boolean);
    return { freq, interval, until, count, byDay, endMode };
  }

  async function onSaveEvent(form: HTMLFormElement) {
    if (!editingEvent || !editingEvent.canWrite) return;
    const fd = new FormData(form);
    const summary = String(fd.get("summary") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    const location = String(fd.get("location") ?? "").trim();
    const allDay = fd.get("allDay") === "on";
    const startRaw = String(fd.get("start") ?? "").trim();
    const endRaw = String(fd.get("end") ?? "").trim();
    const targetInstanceId = Number(fd.get("instanceId")) || editingEvent.instanceId;
    const repeat = readRepeatFromForm(fd);
    if (!summary) {
      setFlash("error", "Title is required");
      render();
      return;
    }
    if (!startRaw) {
      setFlash("error", "Start is required");
      render();
      return;
    }
    let start: string;
    let end: string | null;
    if (allDay) {
      start = startRaw.slice(0, 10);
      // Inclusive last day for multi-day all-day events
      end = endRaw ? endRaw.slice(0, 10) : start;
    } else {
      // datetime-local → ISO; date-only fallback keeps multi-day span
      if (/^\d{4}-\d{2}-\d{2}$/.test(startRaw)) {
        const conv = convertAllDaySpanToTimed(startRaw, endRaw || null);
        start = new Date(conv.start).toISOString();
        end = conv.end ? new Date(conv.end).toISOString() : null;
      } else {
        start = new Date(startRaw).toISOString();
        end = endRaw ? new Date(endRaw).toISOString() : null;
      }
    }
    const sourceId = editingEvent.instanceId;
    const uri = editingEvent.uri;
    const isCreate = creatingEvent;
    busy = true;
    clearFlash();
    eventModalOpen = true;
    render();
    log.event(isCreate ? "event.create" : "event.update", {
      instanceId: targetInstanceId,
      uri: isCreate ? null : uri,
      allDay,
      summary,
    });
    try {
      const body = {
        summary,
        description,
        location,
        allDay,
        start,
        end,
        instanceId: targetInstanceId,
        repeat,
      };
      const res = isCreate
        ? await api.createEvent(targetInstanceId, body)
        : await api.updateEvent(sourceId, uri, body);
      if (selectedId === null || res.event.instanceId !== selectedId) {
        selectedId = res.event.instanceId;
      }
      await loadMonthEvents();
      // Close modal after successful create/save; flash shows on main page
      eventModalOpen = false;
      editingEvent = null;
      creatingEvent = false;
      eventDtPicker = null;
      log.event(isCreate ? "event.created" : "event.saved", {
        uri: res.event.uri,
        instanceId: res.event.instanceId,
      });
      setFlash("success", isCreate ? "Event created" : "Event saved");
    } catch (e) {
      // Keep modal open so the user can fix errors
      log.warn("event.save failed", e instanceof Error ? e.message : e);
      setFlash("error", e instanceof Error ? e.message : "Save failed");
    } finally {
      busy = false;
      render();
    }
  }

  async function onEditCal(form: HTMLFormElement) {
    if (selectedId === null) return;
    const fd = new FormData(form);
    const displayname = String(fd.get("displayname") ?? "").trim();
    const description = String(fd.get("description") ?? "");
    const color = String(fd.get("color") ?? "").trim();
    busy = true;
    clearFlash();
    render();
    try {
      const res = await api.updateCalendar(selectedId, {
        displayname,
        description,
        color,
      });
      calModalOpen = true;
      await loadHome();
      selectedId = res.calendar.id;
      await loadShares(selectedId);
      await loadMonthEvents();
      setFlash("success", "Calendar updated");
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Update failed");
    } finally {
      busy = false;
      render();
    }
  }

  async function onCreateCal(form: HTMLFormElement) {
    const fd = new FormData(form);
    const displayname = String(fd.get("displayname") ?? "").trim();
    const description = String(fd.get("description") ?? "");
    const color = String(fd.get("color") ?? "").trim();
    const holidays = fd.get("holidays") === "on";
    const holidayCountry = String(fd.get("holidayCountry") ?? "").trim();
    const readOnly = fd.get("readOnly") === "on";

    createCalModalOpen = true;
    if (holidays && !holidayCountry) {
      setFlash("error", "Select a country for the holidays calendar");
      render();
      return;
    }
    if (!holidays && !displayname) {
      setFlash("error", "Display name is required");
      render();
      return;
    }

    busy = true;
    clearFlash();
    render();
    try {
      const res = await api.createCalendar({
        displayname,
        description,
        color,
        holidays,
        holidayCountry: holidays ? holidayCountry : undefined,
        readOnly,
      });
      selectedId = res.calendar.id;
      createCalModalOpen = false;
      await loadHome();
      let msg = `Created “${res.calendar.displayname}”`;
      const hi = res.holidayImport ?? res.calendar.holidayImport;
      if (hi) {
        msg += `. Holidays imported: ${formatImportResult(hi)}.`;
      }
      if (readOnly) {
        msg += " Calendar is read-only.";
      }
      setFlash("success", msg);
    } catch (e) {
      createCalModalOpen = true;
      setFlash("error", e instanceof Error ? e.message : "Create failed");
    } finally {
      busy = false;
      render();
    }
  }

  async function onAction(ev: Event) {
    const t = (ev.target as HTMLElement).closest<HTMLElement>("[data-action]");
    if (!t) return;
    const action = t.dataset.action;
    if (action) {
      log.debug(`action:${action}`, {
        id: t.dataset.id,
        tab: t.dataset.tab,
        uri: t.dataset.uri,
      });
    }
    if (action === "close-import-progress") {
      if (importProgress && (importProgress.phase === "done" || importProgress.phase === "error")) {
        closeImportProgress();
      }
      return;
    }
    if (action === "logout") {
      busy = true;
      log.event("logout");
      try {
        await api.logout();
      } catch {
        /* ignore */
      }
      clearPortalSessionState();
      clearFlash();
      render();
      return;
    }
    if (action === "select-cal") {
      const id = Number(t.dataset.id);
      if (!Number.isFinite(id)) return;
      selectedId = id;
      busy = true;
      clearFlash();
      render();
      try {
        await loadMonthEvents();
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Failed to load calendar");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "edit-cal") {
      const id = Number(t.dataset.id);
      if (!Number.isFinite(id)) return;
      const cal = calendars.find((c) => c.id === id && c.canShare);
      if (!cal) return;
      selectedId = id;
      calModalOpen = true;
      deleteConfirmId = null;
      busy = true;
      clearFlash();
      render();
      try {
        await loadShares(id);
        await loadMonthEvents();
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Failed to open calendar");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "close-cal-modal") {
      calModalOpen = false;
      render();
      return;
    }
    if (action === "open-create-cal-modal") {
      createCalModalOpen = true;
      calModalOpen = false;
      deleteConfirmId = null;
      clearFlash();
      render();
      return;
    }
    if (action === "close-create-cal-modal") {
      createCalModalOpen = false;
      clearFlash();
      render();
      return;
    }
    if (action === "delete-cal") {
      const id = Number(t.dataset.id);
      if (!Number.isFinite(id)) return;
      const cal = calendars.find((c) => c.id === id && c.canShare);
      if (!cal) return;
      deleteConfirmId = id;
      calModalOpen = false;
      clearFlash();
      render();
      return;
    }
    if (action === "cancel-delete-cal") {
      deleteConfirmId = null;
      render();
      return;
    }
    if (action === "confirm-delete-cal") {
      const id = Number(t.dataset.id);
      const cb = root.querySelector<HTMLInputElement>("#delete-cal-confirm");
      if (!Number.isFinite(id) || !cb?.checked) return;
      busy = true;
      clearFlash();
      render();
      try {
        await api.deleteCalendar(id);
        if (selectedId === id) selectedId = null;
        deleteConfirmId = null;
        calModalOpen = false;
        shares = [];
        monthEvents = [];
        await loadHome();
        if (selectedId === null) {
          const def = pickDefaultCalendar();
          if (def) {
            selectedId = def.id;
            await loadMonthEvents();
          }
        }
        setFlash("success", "Calendar deleted");
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Delete failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "month-today") {
      const n = new Date();
      monthCursor = { y: n.getFullYear(), m: n.getMonth() };
      monthExpandDay = null;
      busy = true;
      render();
      try {
        await loadMonthEvents();
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "month-prev" || action === "month-next") {
      const delta = action === "month-prev" ? -1 : 1;
      const d = new Date(monthCursor.y, monthCursor.m + delta, 1);
      monthCursor = { y: d.getFullYear(), m: d.getMonth() };
      monthExpandDay = null;
      busy = true;
      render();
      try {
        await loadMonthEvents();
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "open-event") {
      ev.stopPropagation();
      const instanceId = Number(t.dataset.instance);
      const uri = t.dataset.uri ?? "";
      if (!Number.isFinite(instanceId) || !uri) return;
      busy = true;
      clearFlash();
      render();
      try {
        const res = await api.getEvent(instanceId, uri);
        editingEvent = {
          ...res.event,
          repeat: res.event.repeat ?? defaultRepeat(),
        };
        creatingEvent = false;
        eventModalOpen = true;
        eventDtPicker = null;
        calModalOpen = false;
        deleteConfirmId = null;
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Failed to open event");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "open-event-day") {
      ev.stopPropagation();
      const day = t.dataset.day ?? "";
      monthExpandDay = monthExpandDay === day ? null : day;
      render();
      return;
    }
    if (action === "new-event-day") {
      // Ignore if click originated on an event chip / +more (bubbling)
      const raw = ev.target as HTMLElement | null;
      if (raw?.closest?.(".month-event, .month-event-more")) return;
      const day = t.dataset.day ?? "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
      if (selectedId === null) {
        setFlash("error", "Select a calendar first");
        render();
        return;
      }
      const cal = calendars.find((c) => c.id === selectedId);
      if (!cal || cal.readOnly || !(cal.canShare || cal.access === "readwrite")) {
        setFlash("error", "This calendar is read-only");
        render();
        return;
      }
      creatingEvent = true;
      editingEvent = blankEventForDay(day, selectedId);
      eventModalOpen = true;
      eventDtPicker = null;
      calModalOpen = false;
      deleteConfirmId = null;
      clearFlash();
      render();
      return;
    }
    if (action === "close-event-modal") {
      eventModalOpen = false;
      editingEvent = null;
      creatingEvent = false;
      eventDtPicker = null;
      clearFlash();
      render();
      return;
    }
    if (action === "dt-open") {
      const field = t.dataset.dtField || "";
      if (!field) return;
      // Sync event form fields if that form is open
      const eventForm = root.querySelector<HTMLFormElement>('[data-form="edit-event"]');
      if (eventForm && editingEvent) syncEditingEventFromForm(eventForm);
      if (eventDtPicker?.field === field) {
        eventDtPicker = null;
      } else {
        const dateOnly = t.dataset.dtDateOnly === "1";
        const allowClear = t.dataset.dtClear !== "0";
        const name = t.dataset.dtName || field;
        let raw = getDtFieldCurrentValue(field);
        if (!raw && (field === "due" || field === "dtstart" || field === "bulk-due")) {
          raw = defaultTimedRange().start;
        }
        const parts = parseDtParts(raw || ymd(new Date()));
        const [ys, ms] = parts.date.split("-").map(Number);
        eventDtPicker = {
          field,
          viewY: ys,
          viewM: (ms || 1) - 1,
          dateOnly,
          allowClear,
          name,
        };
      }
      render();
      return;
    }
    if (action === "dt-month-prev" || action === "dt-month-next") {
      if (!eventDtPicker) return;
      const delta = action === "dt-month-prev" ? -1 : 1;
      const d = new Date(eventDtPicker.viewY, eventDtPicker.viewM + delta, 1);
      eventDtPicker = { ...eventDtPicker, viewY: d.getFullYear(), viewM: d.getMonth() };
      render();
      return;
    }
    if (action === "dt-pick-day") {
      if (!eventDtPicker) return;
      const field = eventDtPicker.field;
      const day = t.dataset.day ?? "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
      const eventForm = root.querySelector<HTMLFormElement>('[data-form="edit-event"]');
      if (eventForm && editingEvent) syncEditingEventFromForm(eventForm);
      const dateOnly = eventDtPicker.dateOnly;
      if (dateOnly) {
        setDtFieldValue(field, day);
        eventDtPicker = null;
      } else {
        const cur = getDtFieldCurrentValue(field);
        const hm = parseDtParts(cur || defaultTimedRange(day).start).hm;
        setDtFieldValue(field, `${day}T${hm}`);
        // Keep open so user can pick time; update month view
        eventDtPicker = {
          ...eventDtPicker,
          viewY: Number(day.slice(0, 4)),
          viewM: Number(day.slice(5, 7)) - 1,
        };
      }
      // Event start/end: bump end if needed when changing start day
      if (field === "start" && editingEvent && !dateOnly && editingEvent.end) {
        const s = new Date(String(editingEvent.start));
        const e = new Date(String(editingEvent.end));
        if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime()) && e <= s) {
          setDtFieldValue("end", formatLocalDtValue(new Date(s.getTime() + 60 * 60 * 1000)));
        }
      }
      render();
      return;
    }
    if (action === "dt-pick-time") {
      if (!eventDtPicker || eventDtPicker.dateOnly) return;
      const field = eventDtPicker.field;
      const hm = t.dataset.hm ?? "";
      if (!/^\d{2}:\d{2}$/.test(hm)) return;
      const eventForm = root.querySelector<HTMLFormElement>('[data-form="edit-event"]');
      if (eventForm && editingEvent) syncEditingEventFromForm(eventForm);
      const cur = getDtFieldCurrentValue(field) || defaultTimedRange().start;
      const day = parseDtParts(cur).date;
      const next = `${day}T${hm}`;
      setDtFieldValue(field, next);
      if (field === "start" && editingEvent) {
        editingEvent = { ...editingEvent, allDay: false };
        const endCur = editingEvent.end ? parseDtParts(String(editingEvent.end)) : null;
        const startD = new Date(next);
        if (!endCur || new Date(`${endCur.date}T${endCur.hm}`) <= startD) {
          setDtFieldValue("end", formatLocalDtValue(new Date(startD.getTime() + 60 * 60 * 1000)));
        }
      }
      eventDtPicker = null;
      render();
      return;
    }
    if (action === "dt-today") {
      if (!eventDtPicker) return;
      const field = eventDtPicker.field;
      const eventForm = root.querySelector<HTMLFormElement>('[data-form="edit-event"]');
      if (eventForm && editingEvent) syncEditingEventFromForm(eventForm);
      const today = ymd(new Date());
      if (eventDtPicker.dateOnly) {
        setDtFieldValue(field, today);
      } else {
        const range = defaultTimedRange(today);
        if (field === "start") {
          setDtFieldValue("start", range.start);
          if (editingEvent && !editingEvent.end) setDtFieldValue("end", range.end);
        } else if (field === "end") {
          setDtFieldValue("end", range.end);
        } else {
          // due / dtstart / bulk-due
          setDtFieldValue(field, range.start);
        }
      }
      eventDtPicker = null;
      render();
      return;
    }
    if (action === "dt-clear") {
      if (!eventDtPicker || !eventDtPicker.allowClear) return;
      const field = eventDtPicker.field;
      const eventForm = root.querySelector<HTMLFormElement>('[data-form="edit-event"]');
      if (eventForm && editingEvent) syncEditingEventFromForm(eventForm);
      setDtFieldValue(field, null);
      eventDtPicker = null;
      render();
      return;
    }
    if (action === "event-allday-toggle") {
      if (!editingEvent) return;
      const form = root.querySelector<HTMLFormElement>('[data-form="edit-event"]');
      const goingAllDay = (t as HTMLInputElement).checked;
      if (form) {
        const fd = new FormData(form);
        const startRaw = String(fd.get("start") ?? editingEvent.start ?? "");
        const endRaw = String(fd.get("end") ?? editingEvent.end ?? "") || null;
        let start = startRaw;
        let end = endRaw;
        if (goingAllDay) {
          const conv = convertTimedSpanToAllDay(startRaw, endRaw);
          start = conv.start;
          end = conv.end;
        } else {
          const sDate = startRaw.slice(0, 10);
          const eDate = (endRaw || startRaw).slice(0, 10);
          const conv = convertAllDaySpanToTimed(sDate, eDate);
          start = conv.start;
          end = conv.end;
        }
        editingEvent = {
          ...editingEvent,
          summary: String(fd.get("summary") ?? editingEvent.summary),
          description: String(fd.get("description") ?? editingEvent.description),
          location: String(fd.get("location") ?? editingEvent.location),
          instanceId: Number(fd.get("instanceId")) || editingEvent.instanceId,
          allDay: goingAllDay,
          start,
          end,
          repeat: readRepeatFromForm(fd),
        };
      } else {
        editingEvent = { ...editingEvent, allDay: goingAllDay };
      }
      eventDtPicker = null;
      render();
      return;
    }
    if (action === "event-repeat-freq" || action === "event-repeat-end") {
      if (!editingEvent) return;
      const form = root.querySelector<HTMLFormElement>('[data-form="edit-event"]');
      if (!form) return;
      const fd = new FormData(form);
      // Keep checkbox state in sync when re-rendering
      const allDayEl = form.querySelector<HTMLInputElement>('input[name="allDay"]');
      const nextRepeat = readRepeatFromForm(fd);
      editingEvent = {
        ...editingEvent,
        summary: String(fd.get("summary") ?? editingEvent.summary),
        description: String(fd.get("description") ?? editingEvent.description),
        location: String(fd.get("location") ?? editingEvent.location),
        instanceId: Number(fd.get("instanceId")) || editingEvent.instanceId,
        allDay: allDayEl?.checked ?? editingEvent.allDay,
        start: String(fd.get("start") ?? editingEvent.start ?? ""),
        end: String(fd.get("end") ?? editingEvent.end ?? "") || null,
        repeat: nextRepeat,
        hasRrule: !!String(fd.get("repeatFreq") ?? "").trim(),
      };
      if (
        nextRepeat.freq &&
        nextRepeat.endMode === "until" &&
        eventDtPicker?.field === "end"
      ) {
        eventDtPicker = null;
      }
      render();
      return;
    }
    if (action === "delete-event") {
      if (!editingEvent || !editingEvent.canWrite || creatingEvent) return;
      if (!confirm("Delete this event? CalDAV clients will sync the removal.")) return;
      const inst = editingEvent.instanceId;
      const uri = editingEvent.uri;
      busy = true;
      clearFlash();
      render();
      try {
        await api.deleteEvent(inst, uri);
        eventModalOpen = false;
        editingEvent = null;
        await loadMonthEvents();
        setFlash("success", "Event deleted");
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Delete failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "info") {
      const key = t.dataset.info ?? "";
      openInfoModal(key);
      return;
    }
    if (action === "info-close") {
      closeInfoModal();
      return;
    }
    if (action === "flash-close") {
      clearFlash();
      render();
      return;
    }
    if (action === "user-menu-toggle") {
      ev.stopPropagation();
      userMenuOpen = !userMenuOpen;
      render();
      return;
    }
    if (action === "user-menu-close") {
      if (userMenuOpen) {
        userMenuOpen = false;
        render();
      }
      return;
    }
    if (action === "tab") {
      const tab = parseTabId(t.dataset.tab);
      if (tab) {
        if (tab === "admin") {
          // User menu → Administration: land on Overview
          adminPage = "overview";
        }
        await activateTab(tab);
      }
      return;
    }
    if (action === "admin-page") {
      const page = parseAdminPageId(t.dataset.adminPage);
      if (page) {
        await activateAdminPage(page);
      }
      return;
    }
    if (action === "admin-refresh") {
      if (!userIsAdmin() || activeTab !== "admin") return;
      busy = true;
      clearFlash();
      render();
      try {
        await loadAdminDashboard();
        setFlash("success", "Overview refreshed");
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Refresh failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "admin-users-refresh") {
      if (!userIsAdmin() || activeTab !== "admin") return;
      busy = true;
      clearFlash();
      render();
      try {
        await loadAdminUsers();
        if (adminSelectedUsername) {
          await loadAdminUserDetail(adminSelectedUsername);
        }
        setFlash("success", "Users refreshed");
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Refresh failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "admin-user-view") {
      const username = t.dataset.username ?? "";
      if (!username || !userIsAdmin()) return;
      busy = true;
      clearFlash();
      adminSelectedUsername = username;
      adminPage = "users";
      persistTab("admin", "users", username);
      render();
      try {
        await loadAdminUserDetail(username);
        await loadAdminUserResources(username);
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Failed to load user");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "admin-user-close") {
      adminSelectedUsername = null;
      adminUserDetail = null;
      adminUserDetailError = null;
      adminUserEditOpen = false;
      persistTab("admin", "users", null);
      render();
      return;
    }
    if (action === "admin-user-create-open") {
      if (!userIsAdmin()) return;
      adminUserCreateOpen = true;
      adminUserEditOpen = false;
      adminUserDeleteUsername = null;
      clearFlash();
      render();
      return;
    }
    if (action === "admin-user-create-close") {
      adminUserCreateOpen = false;
      render();
      return;
    }
    if (action === "admin-user-edit-open") {
      if (!userIsAdmin()) return;
      const username = t.dataset.username ?? adminSelectedUsername ?? "";
      if (!username) return;
      busy = true;
      clearFlash();
      adminUserCreateOpen = false;
      adminUserDeleteUsername = null;
      adminSelectedUsername = username;
      adminPage = "users";
      persistTab("admin", "users", username);
      render();
      try {
        if (!adminUserDetail || adminUserDetail.username.toLowerCase() !== username.toLowerCase()) {
          await loadAdminUserDetail(username);
        }
        adminUserEditOpen = true;
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Failed to load user");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "admin-user-edit-close") {
      adminUserEditOpen = false;
      render();
      return;
    }
    if (action === "admin-user-delete-open") {
      if (!userIsAdmin()) return;
      const username = t.dataset.username ?? adminSelectedUsername ?? "";
      if (!username) return;
      adminUserDeleteUsername = username;
      adminUserDeleteConfirmChecked = false;
      adminUserCreateOpen = false;
      adminUserEditOpen = false;
      clearFlash();
      render();
      return;
    }
    if (action === "admin-user-delete-close") {
      adminUserDeleteUsername = null;
      adminUserDeleteConfirmChecked = false;
      render();
      return;
    }
    if (action === "admin-user-delete-toggle") {
      const cb = t as HTMLInputElement;
      adminUserDeleteConfirmChecked = !!cb.checked;
      render();
      return;
    }
    if (action === "admin-user-delete-confirm") {
      if (!userIsAdmin()) return;
      const username = t.dataset.username ?? adminUserDeleteUsername ?? "";
      if (!username || !adminUserDeleteConfirmChecked) return;
      busy = true;
      clearFlash();
      render();
      try {
        await api.adminDeleteUser(username, true);
        log.event("admin.user.delete", { username });
        adminUserDeleteUsername = null;
        adminUserDeleteConfirmChecked = false;
        adminUserEditOpen = false;
        if (adminSelectedUsername?.toLowerCase() === username.toLowerCase()) {
          adminSelectedUsername = null;
          adminUserDetail = null;
          adminUserCalendars = [];
          adminUserAddressBooks = [];
          persistTab("admin", "users", null);
        }
        await loadAdminUsers();
        setFlash("success", `Deleted user “${username}”`);
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Delete failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "admin-cal-create") {
      adminCalModal = "create";
      adminCalEditId = null;
      render();
      return;
    }
    if (action === "admin-cal-edit") {
      adminCalModal = "edit";
      adminCalEditId = Number(t.dataset.id);
      render();
      return;
    }
    if (action === "admin-cal-close") {
      adminCalModal = null;
      adminCalEditId = null;
      render();
      return;
    }
    if (action === "admin-cal-delete") {
      adminResourceDelete = {
        kind: "calendar",
        id: Number(t.dataset.id),
        label: t.dataset.label ?? "calendar",
      };
      render();
      return;
    }
    if (action === "admin-ab-create") {
      adminAbModal = "create";
      adminAbEditId = null;
      render();
      return;
    }
    if (action === "admin-ab-edit") {
      adminAbModal = "edit";
      adminAbEditId = Number(t.dataset.id);
      render();
      return;
    }
    if (action === "admin-ab-close") {
      adminAbModal = null;
      adminAbEditId = null;
      render();
      return;
    }
    if (action === "admin-ab-delete") {
      adminResourceDelete = {
        kind: "addressbook",
        id: Number(t.dataset.id),
        label: t.dataset.label ?? "address book",
        force: false,
      };
      render();
      return;
    }
    if (action === "admin-ab-force-toggle") {
      if (adminResourceDelete?.kind === "addressbook") {
        adminResourceDelete = {
          ...adminResourceDelete,
          force: !!(t as HTMLInputElement).checked,
        };
        render();
      }
      return;
    }
    if (action === "admin-resource-delete-close") {
      adminResourceDelete = null;
      render();
      return;
    }
    if (action === "admin-resource-delete-confirm") {
      if (!adminSelectedUsername || !adminResourceDelete) return;
      const uname = adminSelectedUsername;
      const del = adminResourceDelete;
      busy = true;
      clearFlash();
      render();
      try {
        if (del.kind === "calendar") {
          await api.adminDeleteUserCalendar(uname, del.id, true);
        } else {
          await api.adminDeleteUserAddressBook(uname, del.id, true, !!del.force);
        }
        adminResourceDelete = null;
        await loadAdminUserResources(uname);
        await loadAdminUserDetail(uname);
        setFlash("success", "Deleted");
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Delete failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "admin-settings-refresh") {
      busy = true;
      clearFlash();
      render();
      try {
        await loadAdminSystemSettings();
        setFlash("success", "Settings reloaded");
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Reload failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "admin-reset-open") {
      adminResetModalOpen = true;
      adminResetConfirmChecked = false;
      clearFlash();
      render();
      return;
    }
    if (action === "admin-reset-close") {
      adminResetModalOpen = false;
      adminResetConfirmChecked = false;
      render();
      return;
    }
    if (action === "admin-reset-toggle") {
      const cb = t as HTMLInputElement;
      adminResetConfirmChecked = !!cb.checked;
      render();
      return;
    }
    if (action === "admin-reset-confirm") {
      if (!adminResetConfirmChecked) return;
      busy = true;
      clearFlash();
      render();
      try {
        const res = await api.adminResetToDefault(true);
        log.event("admin.settings.reset-to-default");
        adminResetModalOpen = false;
        adminResetConfirmChecked = false;
        const dest =
          res.redirectUrl && res.redirectUrl.startsWith("/")
            ? res.redirectUrl
            : "/portal/install/";
        window.location.assign(dest);
        return;
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Reset failed");
        busy = false;
        render();
      }
      return;
    }
    if (action === "admin-database-refresh") {
      busy = true;
      clearFlash();
      render();
      try {
        await loadAdminDatabaseSettings();
        setFlash("success", "Database settings reloaded");
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Reload failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "admin-db-backend") {
      const sel = t as HTMLSelectElement;
      adminDbFormBackend = sel.value === "pgsql" ? "pgsql" : "sqlite";
      render();
      return;
    }
    if (action === "admin-db-confirm-close") {
      adminDbConfirmOpen = false;
      adminDbConfirmText = "";
      adminDbPendingBody = null;
      render();
      return;
    }
    if (action === "admin-db-confirm-input") {
      const inp = t as HTMLInputElement;
      adminDbConfirmText = inp.value;
      // Re-render only the button state lightly via full render
      render();
      // restore focus/cursor on the confirm field
      const el = root.querySelector<HTMLInputElement>('[data-action="admin-db-confirm-input"]');
      if (el) {
        el.focus();
        const len = el.value.length;
        el.setSelectionRange(len, len);
      }
      return;
    }
    if (action === "admin-db-confirm-save") {
      if (adminDbConfirmText.trim() !== "CONFIRM" || !adminDbPendingBody) return;
      busy = true;
      clearFlash();
      render();
      try {
        const body = { ...adminDbPendingBody, confirm: "CONFIRM" };
        const res = await api.adminUpdateDatabaseSettings(body);
        adminDatabaseSettings = res.data;
        adminDbConfirmOpen = false;
        adminDbConfirmText = "";
        adminDbPendingBody = null;
        const b = (res.data.backend || "sqlite").toLowerCase();
        adminDbFormBackend = b === "pgsql" ? "pgsql" : "sqlite";
        log.event("admin.database.save", { backend: res.data.backend });
        setFlash("success", "Database settings saved");
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Database save failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    // --- Files tab ---
    if (action === "files-nav") {
      const path = t.dataset.path ?? "";
      filesPath = path;
      filesRenamePath = null;
      filesDeletePaths = null;
      filesTransfer = null;
      filesMkdirOpen = false;
      checkedFilePaths = [];
      busy = true;
      clearFlash();
      render();
      try {
        await loadFiles();
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Failed to open folder");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "files-toggle") {
      ev.stopPropagation();
      const path = t.dataset.path ?? "";
      if (!path) return;
      const on = (t as HTMLInputElement).checked;
      if (on) {
        if (!checkedFilePaths.includes(path)) checkedFilePaths = [...checkedFilePaths, path];
      } else {
        checkedFilePaths = checkedFilePaths.filter((p) => p !== path);
      }
      render();
      return;
    }
    if (action === "files-select-all") {
      ev.stopPropagation();
      const on = (t as HTMLInputElement).checked;
      checkedFilePaths = on ? filesEntries.map((e) => e.path) : [];
      render();
      return;
    }
    if (action === "files-copy") {
      const path = t.dataset.path ?? "";
      if (!path) return;
      filesTransfer = { op: "copy", paths: [path] };
      filesRenamePath = null;
      filesDeletePaths = null;
      render();
      return;
    }
    if (action === "files-move") {
      const path = t.dataset.path ?? "";
      if (!path) return;
      filesTransfer = { op: "move", paths: [path] };
      filesRenamePath = null;
      filesDeletePaths = null;
      render();
      return;
    }
    if (action === "files-bulk-copy") {
      if (checkedFilePaths.length === 0) return;
      filesTransfer = { op: "copy", paths: [...checkedFilePaths] };
      filesRenamePath = null;
      filesDeletePaths = null;
      render();
      return;
    }
    if (action === "files-bulk-move") {
      if (checkedFilePaths.length === 0) return;
      filesTransfer = { op: "move", paths: [...checkedFilePaths] };
      filesRenamePath = null;
      filesDeletePaths = null;
      render();
      return;
    }
    if (action === "files-transfer-close") {
      filesTransfer = null;
      render();
      return;
    }
    if (action === "files-bulk-delete") {
      if (checkedFilePaths.length === 0) return;
      filesDeletePaths = [...checkedFilePaths];
      filesRenamePath = null;
      filesTransfer = null;
      render();
      return;
    }
    if (action === "files-refresh") {
      busy = true;
      clearFlash();
      render();
      try {
        await loadFiles();
        setFlash("success", "Refreshed");
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Refresh failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "files-mkdir") {
      filesMkdirOpen = true;
      filesRenamePath = null;
      filesDeletePaths = null;
      filesTransfer = null;
      clearFlash();
      render();
      return;
    }
    if (action === "files-mkdir-close") {
      filesMkdirOpen = false;
      render();
      return;
    }
    if (action === "files-rename-open") {
      filesRenamePath = t.dataset.path ?? null;
      filesDeletePaths = null;
      filesTransfer = null;
      render();
      return;
    }
    if (action === "files-rename-close") {
      filesRenamePath = null;
      render();
      return;
    }
    if (action === "files-delete-open") {
      const path = t.dataset.path ?? "";
      filesDeletePaths = path ? [path] : null;
      filesRenamePath = null;
      filesTransfer = null;
      render();
      return;
    }
    if (action === "files-delete-close") {
      filesDeletePaths = null;
      render();
      return;
    }
    if (action === "files-delete-confirm") {
      const paths = filesDeletePaths ? [...filesDeletePaths] : [];
      if (paths.length === 0) return;
      busy = true;
      clearFlash();
      render();
      try {
        if (paths.length === 1) {
          await api.filesDelete(paths[0]);
          log.event("files.delete", { path: paths[0] });
          setFlash("success", "Deleted");
        } else {
          const res = await api.filesBulk("delete", paths);
          log.event("files.bulk-delete", { ok: res.ok, failed: res.failed });
          if (res.failed === 0) {
            setFlash("success", res.ok === 1 ? "Deleted 1 item" : `Deleted ${res.ok} items`);
          } else if (res.ok > 0) {
            setFlash("info", `Deleted ${res.ok}; ${res.failed} failed. ${res.errors[0] || ""}`);
          } else {
            setFlash("error", res.errors[0] || "Delete failed");
          }
        }
        filesDeletePaths = null;
        checkedFilePaths = [];
        await loadFiles();
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Delete failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "files-download") {
      // Let the browser follow the download link; still count as activity
      log.event("files.download", { path: t.getAttribute("href") ?? "" });
      return;
    }
    if (action === "sort-task" || action === "sort-note") {
      const col = t.dataset.sort || "";
      if (!col) return;
      if (action === "sort-task") {
        if (taskSort === col) taskOrder = taskOrder === "asc" ? "desc" : "asc";
        else {
          taskSort = col;
          taskOrder = col === "due" || col === "summary" ? "asc" : "desc";
        }
        busy = true;
        render();
        try {
          await loadTasks();
        } catch (e) {
          setFlash("error", e instanceof Error ? e.message : "Sort failed");
        } finally {
          busy = false;
          render();
        }
      } else {
        if (noteSort === col) noteOrder = noteOrder === "asc" ? "desc" : "asc";
        else {
          noteSort = col;
          noteOrder = "asc";
        }
        busy = true;
        render();
        try {
          await loadNotes();
        } catch (e) {
          setFlash("error", e instanceof Error ? e.message : "Sort failed");
        } finally {
          busy = false;
          render();
        }
      }
      return;
    }
    if (action === "select-task") {
      // Ignore clicks on the checkbox cell
      if ((ev.target as HTMLElement).closest("[data-stop-row], .task-check")) return;
      const instanceId = Number(t.dataset.instance);
      const uri = t.dataset.uri ?? "";
      if (!Number.isFinite(instanceId) || !uri) return;
      const found = tasks.find((x) => x.instanceId === instanceId && x.uri === uri) ?? null;
      creatingTask = false;
      selectedTaskKey = itemKey(instanceId, uri);
      editingTask = found ? { ...found } : null;
      clearFlash();
      render();
      return;
    }
    if (action === "task-check") {
      ev.preventDefault();
      ev.stopPropagation();
      const instanceId = Number(t.dataset.instance);
      const uri = t.dataset.uri ?? "";
      if (!Number.isFinite(instanceId) || !uri) return;
      const key = itemKey(instanceId, uri);
      const task = tasks.find((x) => itemKey(x.instanceId, x.uri) === key);
      if (!task || !task.canWrite || task.readOnly) return;
      if (checkedTaskKeys.includes(key)) {
        checkedTaskKeys = checkedTaskKeys.filter((k) => k !== key);
      } else {
        checkedTaskKeys = [...checkedTaskKeys, key];
      }
      render();
      return;
    }
    if (action === "task-select-all") {
      ev.preventDefault();
      const writable = tasks.filter((x) => x.canWrite && !x.readOnly);
      const allOn =
        writable.length > 0 &&
        writable.every((x) => checkedTaskKeys.includes(itemKey(x.instanceId, x.uri)));
      if (allOn) {
        checkedTaskKeys = [];
      } else {
        checkedTaskKeys = writable.map((x) => itemKey(x.instanceId, x.uri));
      }
      render();
      return;
    }
    if (action === "bulk-task-clear") {
      checkedTaskKeys = [];
      render();
      return;
    }
    if (
      action === "bulk-task-status" ||
      action === "bulk-task-due" ||
      action === "bulk-task-clear-due" ||
      action === "bulk-task-percent" ||
      action === "bulk-task-delete"
    ) {
      void runBulkTaskAction(action);
      return;
    }
    if (action === "select-note") {
      const instanceId = Number(t.dataset.instance);
      const uri = t.dataset.uri ?? "";
      if (!Number.isFinite(instanceId) || !uri) return;
      const found = notes.find((x) => x.instanceId === instanceId && x.uri === uri) ?? null;
      creatingNote = false;
      selectedNoteKey = itemKey(instanceId, uri);
      editingNote = found ? { ...found } : null;
      clearFlash();
      render();
      return;
    }
    if (action === "new-task") {
      creatingTask = true;
      selectedTaskKey = null;
      editingTask = {
        uri: "",
        instanceId: taskCalendars[0]?.id ?? 0,
        calendarId: 0,
        calendarName: "",
        calendarUri: "",
        uid: "",
        parentUid: null,
        summary: "",
        description: "",
        status: "NEEDS-ACTION",
        due: null,
        priority: 0,
        percent: 0,
        completed: null,
        lastmodified: 0,
        readOnly: false,
        canWrite: true,
      };
      clearFlash();
      render();
      return;
    }
    if (action === "new-subtask") {
      if (!editingTask || creatingTask || !editingTask.uid) return;
      if (!editingTask.canWrite) return;
      const parent = editingTask;
      creatingTask = true;
      selectedTaskKey = null;
      editingTask = {
        uri: "",
        instanceId: parent.instanceId,
        calendarId: parent.calendarId,
        calendarName: parent.calendarName,
        calendarUri: parent.calendarUri,
        uid: "",
        parentUid: parent.uid,
        summary: "",
        description: "",
        status: "NEEDS-ACTION",
        due: null,
        priority: 0,
        percent: 0,
        completed: null,
        lastmodified: 0,
        readOnly: false,
        canWrite: true,
      };
      clearFlash();
      render();
      return;
    }
    if (action === "new-note") {
      creatingNote = true;
      selectedNoteKey = null;
      editingNote = {
        uri: "",
        instanceId: noteCalendars[0]?.id ?? 0,
        calendarId: 0,
        calendarName: "",
        calendarUri: "",
        summary: "",
        description: "",
        dtstart: new Date().toISOString(),
        lastmodified: 0,
        readOnly: false,
        canWrite: true,
      };
      clearFlash();
      render();
      return;
    }
    if (action === "cancel-task") {
      creatingTask = false;
      editingTask = null;
      selectedTaskKey = null;
      render();
      return;
    }
    if (action === "cancel-note") {
      creatingNote = false;
      editingNote = null;
      selectedNoteKey = null;
      render();
      return;
    }
    if (action === "delete-task") {
      if (!editingTask || creatingTask) return;
      if (!confirm("Delete this task? CalDAV clients will sync the removal.")) return;
      busy = true;
      clearFlash();
      render();
      try {
        await api.deleteTask(editingTask.instanceId, editingTask.uri);
        selectedTaskKey = null;
        editingTask = null;
        await loadTasks();
        setFlash("success", "Task deleted");
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Delete failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "delete-note") {
      if (!editingNote || creatingNote) return;
      if (!confirm("Delete this note? CalDAV clients will sync the removal.")) return;
      busy = true;
      clearFlash();
      render();
      try {
        await api.deleteNote(editingNote.instanceId, editingNote.uri);
        selectedNoteKey = null;
        editingNote = null;
        await loadNotes();
        setFlash("success", "Note deleted");
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Delete failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "select-ab") {
      const id = Number(t.dataset.id);
      if (!Number.isFinite(id)) return;
      selectedAbId = id;
      abModalOpen = false;
      selectedContactUri = null;
      editingContact = null;
      creatingContact = false;
      contactModalOpen = false;
      contactSearch = "";
      // Clear list immediately so we never paint previous AB contacts with the new AB id
      // (that caused /addressbooks/{newId}/contacts/{oldUri}/photo → 404).
      contacts = [];
      photoPreview = null;
      photoBase64Pending = null;
      removePhotoPending = false;
      clearFlash();
      busy = true;
      render();
      try {
        await loadContacts(id);
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Failed to load contacts");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "edit-ab") {
      ev.stopPropagation();
      const id = Number(t.dataset.id);
      if (!Number.isFinite(id)) return;
      const ab = addressBooks.find((a) => a.id === id);
      if (!ab) return;
      const switched = selectedAbId !== id;
      selectedAbId = id;
      abModalOpen = true;
      contactModalOpen = false;
      clearFlash();
      if (switched) {
        selectedContactUri = null;
        editingContact = null;
        creatingContact = false;
        contactSearch = "";
        contacts = [];
        photoPreview = null;
        photoBase64Pending = null;
        removePhotoPending = false;
      }
      busy = true;
      render();
      try {
        if (switched) {
          await loadContacts(id);
        }
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Failed to open address book");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "close-ab-modal") {
      abModalOpen = false;
      render();
      return;
    }
    if (action === "select-contact") {
      const uri = t.dataset.uri ?? "";
      if (!uri) return;
      // Avoid intermediate busy re-render (that jumps scroll); load then paint once.
      clearFlash();
      try {
        await openContact(uri);
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Failed to load contact");
      }
      render();
      return;
    }
    if (action === "new-contact") {
      if (selectedAbId === null) return;
      startNewContact();
      clearFlash();
      render();
      return;
    }
    if (action === "cancel-contact" || action === "close-contact-modal") {
      creatingContact = false;
      contactModalOpen = false;
      editingContact = null;
      selectedContactUri = null;
      photoPreview = null;
      photoBase64Pending = null;
      removePhotoPending = false;
      eventDtPicker = null;
      clearFlash();
      render();
      return;
    }
    if (action === "add-email" || action === "add-phone" || action === "add-custom") {
      if (!editingContact) return;
      syncContactFormFromDom();
      if (!Array.isArray(editingContact.emails)) editingContact.emails = [""];
      if (!Array.isArray(editingContact.phones)) {
        editingContact.phones = [{ type: "cell", value: "" }];
      }
      if (!Array.isArray(editingContact.custom)) editingContact.custom = [];
      if (action === "add-email") {
        if (editingContact.emails.length < 10) editingContact.emails.push("");
      } else if (action === "add-phone") {
        if (editingContact.phones.length < 10) {
          editingContact.phones.push({ type: "other", value: "" });
        }
      } else if (editingContact.custom.length < 30) {
        editingContact.custom.push({ label: "", value: "" });
      }
      render();
      return;
    }
    if (action === "remove-email") {
      if (!editingContact) return;
      syncContactFormFromDom();
      const idx = Number(t.dataset.idx);
      if (!Number.isFinite(idx)) return;
      const list = Array.isArray(editingContact.emails) ? editingContact.emails : [""];
      editingContact.emails = list.filter((_, i) => i !== idx);
      if (editingContact.emails.length === 0) editingContact.emails = [""];
      render();
      return;
    }
    if (action === "remove-phone") {
      if (!editingContact) return;
      syncContactFormFromDom();
      const idx = Number(t.dataset.idx);
      if (!Number.isFinite(idx)) return;
      const list = Array.isArray(editingContact.phones)
        ? editingContact.phones
        : [{ type: "cell", value: "" }];
      editingContact.phones = list.filter((_, i) => i !== idx);
      if (editingContact.phones.length === 0) {
        editingContact.phones = [{ type: "cell", value: "" }];
      }
      render();
      return;
    }
    if (action === "remove-custom") {
      if (!editingContact) return;
      syncContactFormFromDom();
      const idx = Number(t.dataset.idx);
      if (!Number.isFinite(idx)) return;
      editingContact.custom = (Array.isArray(editingContact.custom) ? editingContact.custom : []).filter(
        (_, i) => i !== idx,
      );
      render();
      return;
    }
    if (action === "remove-photo") {
      photoPreview = null;
      photoBase64Pending = null;
      removePhotoPending = true;
      if (editingContact) editingContact.hasPhoto = false;
      render();
      return;
    }
    if (action === "delete-contact") {
      if (selectedAbId === null || !selectedContactUri) return;
      if (!confirm("Delete this contact? CardDAV clients will sync the removal.")) return;
      busy = true;
      clearFlash();
      contactModalOpen = true;
      render();
      try {
        await api.deleteContact(selectedAbId, selectedContactUri);
        selectedContactUri = null;
        editingContact = null;
        creatingContact = false;
        contactModalOpen = false;
        eventDtPicker = null;
        photoPreview = null;
        await loadHome();
        setFlash("success", "Contact deleted");
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Delete failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "delete-ab") {
      ev.stopPropagation();
      const id = Number(t.dataset.id ?? selectedAbId);
      if (!Number.isFinite(id)) return;
      const ab = addressBooks.find((a) => a.id === id);
      if (!ab) return;
      deleteAbConfirmId = id;
      abModalOpen = false;
      contactModalOpen = false;
      clearFlash();
      render();
      return;
    }
    if (action === "cancel-delete-ab") {
      deleteAbConfirmId = null;
      render();
      return;
    }
    if (action === "confirm-delete-ab") {
      const id = Number(t.dataset.id);
      const cb = root.querySelector<HTMLInputElement>("#delete-ab-confirm");
      if (!Number.isFinite(id) || !cb?.checked) return;
      const ab = addressBooks.find((a) => a.id === id);
      if (!ab) return;
      const force = (ab.cardCount ?? 0) > 0;
      busy = true;
      clearFlash();
      render();
      try {
        await api.deleteAddressBook(id, force);
        if (selectedAbId === id) {
          selectedAbId = null;
          contacts = [];
          editingContact = null;
          selectedContactUri = null;
          creatingContact = false;
        }
        deleteAbConfirmId = null;
        abModalOpen = false;
        contactModalOpen = false;
        await loadHome();
        if (selectedAbId === null && addressBooks.length > 0) {
          selectedAbId = addressBooks[0].id;
          await loadContacts(selectedAbId);
        }
        setFlash("success", "Address book deleted");
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Delete failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "export-ab") {
      if (selectedAbId === null) return;
      abModalOpen = true;
      busy = true;
      clearFlash();
      render();
      try {
        const { blob, filename } = await api.exportAddressBook(selectedAbId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        setFlash("success", `Exported ${filename}`);
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Export failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "export-contact") {
      if (selectedAbId === null || !selectedContactUri || creatingContact) return;
      contactModalOpen = true;
      busy = true;
      clearFlash();
      render();
      try {
        const { blob, filename } = await api.exportContact(
          selectedAbId,
          selectedContactUri,
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        setFlash("success", `Exported ${filename}`);
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Export failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "revoke") {
      const href = t.dataset.href ?? "";
      if (!href || selectedId === null) return;
      if (!confirm("Revoke access for this user?")) return;
      calModalOpen = true;
      busy = true;
      clearFlash();
      render();
      try {
        await api.revoke(selectedId, href);
        await loadShares(selectedId);
        setFlash("success", "Share revoked");
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Revoke failed");
      } finally {
        busy = false;
        render();
      }
      return;
    }
    if (action === "export-cal") {
      if (selectedId === null) return;
      calModalOpen = true;
      busy = true;
      clearFlash();
      render();
      try {
        const { blob, filename } = await api.exportCalendar(selectedId);
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        setFlash("success", `Exported ${filename}`);
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Export failed");
      } finally {
        busy = false;
        render();
      }
    }
  }

  function bindImportInput() {
    const input = root.querySelector<HTMLInputElement>('input[data-action="import-cal"]');
    if (input) {
      input.addEventListener("change", () => {
        void onImportFile(input);
      });
    }
    const createImport = root.querySelector<HTMLInputElement>(
      'input[data-action="import-create-cal"]',
    );
    if (createImport) {
      createImport.addEventListener("change", () => {
        void onImportCreateCal(createImport);
      });
    }
    const abInput = root.querySelector<HTMLInputElement>('input[data-action="import-ab"]');
    if (abInput) {
      abInput.addEventListener("change", () => {
        void onImportContacts(abInput);
      });
    }
  }

  async function onImportContacts(input: HTMLInputElement) {
    if (selectedAbId === null) return;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    const abId = selectedAbId;
    abModalOpen = true;
    busy = true;
    clearFlash();
    stopImportElapsedTimer();
    importProgress = {
      kind: "contacts",
      fileName: file.name,
      fileSizeLabel: formatFileSize(file.size),
      phase: "reading",
      readPercent: 0,
      processPercent: null,
      processCurrent: 0,
      processTotal: 0,
      processImported: 0,
      processUpdated: 0,
      processSkipped: 0,
      startedAt: Date.now(),
      elapsedSec: 0,
      resultMessage: null,
      ok: null,
    };
    startImportElapsedTimer();
    render();
    try {
      const vcf = await readFileTextWithProgress(file, (pct) => {
        if (!importProgress || importProgress.phase !== "reading") return;
        importProgress = { ...importProgress, readPercent: pct };
        const bar = root.querySelector<HTMLElement>(".import-progress-bar");
        const status = root.querySelector<HTMLElement>("[data-import-status-line]");
        if (bar && pct !== null) {
          bar.classList.remove("is-indeterminate");
          bar.style.width = `${pct}%`;
        }
        if (status && pct !== null) status.textContent = `Reading file… ${pct}%`;
      });
      setImportPhase("uploading", { readPercent: 100 });
      setImportPhase("processing", { processPercent: 0 });
      log.event("import.contacts.start", {
        file: file.name,
        bytes: file.size,
        abId,
      });
      const res = await api.importAddressBook(abId, vcf, (prog) => {
        applyServerImportProgress(prog);
      });
      const detail = formatImportResult(res);
      await loadHome();
      if (selectedAbId === abId) await loadContacts(abId);
      stopImportElapsedTimer();
      setImportPhase("done", {
        ok: true,
        resultMessage: `${detail} (from “${file.name}”)`,
      });
      setFlash("success", `Import finished for “${file.name}”: ${detail}.`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Import failed";
      stopImportElapsedTimer();
      setImportPhase("error", { ok: false, resultMessage: msg });
      setFlash("error", msg);
    } finally {
      busy = false;
      render();
    }
  }

  /** Pull live form values into editingContact before re-render (multi email/phone). */
  function syncContactFormFromDom() {
    if (!editingContact) return;
    const form = root.querySelector<HTMLFormElement>('[data-form="contact"]');
    if (!form) return;
    const fd = new FormData(form);
    editingContact.firstname = String(fd.get("firstname") ?? "");
    editingContact.lastname = String(fd.get("lastname") ?? "");
    editingContact.fullname = String(fd.get("fullname") ?? "");
    editingContact.org = String(fd.get("org") ?? "");
    editingContact.title = String(fd.get("title") ?? "");
    editingContact.url = String(fd.get("url") ?? "");
    editingContact.note = String(fd.get("note") ?? "");
    const bday = String(fd.get("birthday") ?? "").trim();
    editingContact.birthday = bday && /^\d{4}-\d{2}-\d{2}/.test(bday) ? bday.slice(0, 10) : null;
    editingContact.address = {
      street: String(fd.get("street") ?? ""),
      city: String(fd.get("city") ?? ""),
      region: String(fd.get("region") ?? ""),
      postal: String(fd.get("postal") ?? ""),
      country: String(fd.get("country") ?? ""),
    };
    const emails: string[] = [];
    let i = 0;
    while (fd.has(`email_${i}`)) {
      emails.push(String(fd.get(`email_${i}`) ?? ""));
      i++;
    }
    if (emails.length) editingContact.emails = emails;
    const phones: ContactPhone[] = [];
    i = 0;
    while (fd.has(`phone_value_${i}`)) {
      phones.push({
        type: String(fd.get(`phone_type_${i}`) ?? "other"),
        value: String(fd.get(`phone_value_${i}`) ?? ""),
      });
      i++;
    }
    if (phones.length) editingContact.phones = phones;
    const custom: ContactCustomField[] = [];
    i = 0;
    while (fd.has(`custom_label_${i}`) || fd.has(`custom_value_${i}`)) {
      custom.push({
        label: String(fd.get(`custom_label_${i}`) ?? ""),
        value: String(fd.get(`custom_value_${i}`) ?? ""),
      });
      i++;
    }
    editingContact.custom = custom;
  }

  function contactBodyFromForm(form: HTMLFormElement) {
    const fd = new FormData(form);
    const emails: string[] = [];
    let i = 0;
    while (fd.has(`email_${i}`)) {
      const v = String(fd.get(`email_${i}`) ?? "").trim();
      if (v) emails.push(v);
      i++;
    }
    const phones: ContactPhone[] = [];
    i = 0;
    while (fd.has(`phone_value_${i}`)) {
      const value = String(fd.get(`phone_value_${i}`) ?? "").trim();
      if (value) {
        phones.push({
          type: String(fd.get(`phone_type_${i}`) ?? "other"),
          value,
        });
      }
      i++;
    }
    const custom: ContactCustomField[] = [];
    i = 0;
    while (fd.has(`custom_label_${i}`) || fd.has(`custom_value_${i}`)) {
      const label = String(fd.get(`custom_label_${i}`) ?? "").trim();
      const value = String(fd.get(`custom_value_${i}`) ?? "").trim();
      if (label || value) {
        custom.push({ label, value });
      }
      i++;
    }
    const body: Parameters<typeof api.createContact>[1] = {
      firstname: String(fd.get("firstname") ?? "").trim(),
      lastname: String(fd.get("lastname") ?? "").trim(),
      fullname: String(fd.get("fullname") ?? "").trim(),
      org: String(fd.get("org") ?? "").trim(),
      title: String(fd.get("title") ?? "").trim(),
      emails,
      phones,
      address: {
        street: String(fd.get("street") ?? "").trim(),
        city: String(fd.get("city") ?? "").trim(),
        region: String(fd.get("region") ?? "").trim(),
        postal: String(fd.get("postal") ?? "").trim(),
        country: String(fd.get("country") ?? "").trim(),
      },
      url: String(fd.get("url") ?? "").trim(),
      note: String(fd.get("note") ?? "").trim(),
      birthday: (() => {
        const v = String(fd.get("birthday") ?? "").trim();
        return v && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null;
      })(),
      custom,
    };
    if (removePhotoPending) {
      body.removePhoto = true;
    } else if (photoBase64Pending) {
      body.photoBase64 = photoBase64Pending;
    }
    return body;
  }

  async function onSaveContact(form: HTMLFormElement) {
    if (selectedAbId === null) return;
    const body = contactBodyFromForm(form);
    busy = true;
    clearFlash();
    contactModalOpen = true;
    render();
    try {
      if (creatingContact) {
        const res = await api.createContact(selectedAbId, body);
        creatingContact = false;
        selectedContactUri = res.contact.uri;
        editingContact = null;
        contactModalOpen = false;
        photoPreview = null;
        photoBase64Pending = null;
        removePhotoPending = false;
        eventDtPicker = null;
        setFlash("success", "Contact created");
      } else if (selectedContactUri) {
        const res = await api.updateContact(selectedAbId, selectedContactUri, body);
        selectedContactUri = res.contact.uri;
        editingContact = null;
        contactModalOpen = false;
        photoPreview = null;
        photoBase64Pending = null;
        removePhotoPending = false;
        eventDtPicker = null;
        setFlash("success", "Contact saved");
      }
      // Reload list; keep selection if list fails
      try {
        await loadHome();
      } catch (reloadErr) {
        console.error(reloadErr);
        if (selectedAbId !== null) {
          try {
            await loadContacts(selectedAbId);
          } catch {
            /* ignore */
          }
        }
      }
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Save failed");
    } finally {
      busy = false;
      render();
    }
  }

  async function onCreateAb(form: HTMLFormElement) {
    const fd = new FormData(form);
    const displayname = String(fd.get("displayname") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    if (!displayname) return;
    busy = true;
    clearFlash();
    render();
    try {
      const res = await api.createAddressBook({ displayname, description });
      selectedAbId = res.addressbook.id;
      selectedContactUri = null;
      editingContact = null;
      creatingContact = false;
      contactSearch = "";
      await loadHome();
      setFlash("success", `Address book “${res.addressbook.displayname}” created`);
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Create failed");
    } finally {
      busy = false;
      render();
    }
  }

  async function onEditAb(form: HTMLFormElement) {
    if (selectedAbId === null) return;
    const fd = new FormData(form);
    const displayname = String(fd.get("displayname") ?? "").trim();
    const description = String(fd.get("description") ?? "").trim();
    abModalOpen = true;
    busy = true;
    clearFlash();
    render();
    try {
      await api.updateAddressBook(selectedAbId, { displayname, description });
      await loadHome();
      setFlash("success", "Address book updated");
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Update failed");
    } finally {
      busy = false;
      render();
    }
  }

  function openInfoModal(key: string) {
    const info = SECTION_INFO[key];
    if (!info) return;
    const modal = root.querySelector<HTMLElement>("#info-modal");
    const titleEl = root.querySelector<HTMLElement>("#info-modal-title");
    const bodyEl = root.querySelector<HTMLElement>("#info-modal-body");
    if (!modal || !titleEl || !bodyEl) return;
    titleEl.textContent = info.title;
    bodyEl.innerHTML = info.paragraphs
      .map((p) => `<p>${esc(p)}</p>`)
      .join("");
    modal.hidden = false;
    document.body.classList.add("info-modal-open");
    const closeBtn = modal.querySelector<HTMLButtonElement>(".info-modal-close");
    closeBtn?.focus();
  }

  function closeInfoModal() {
    const modal = root.querySelector<HTMLElement>("#info-modal");
    if (!modal) return;
    modal.hidden = true;
    document.body.classList.remove("info-modal-open");
  }

  /** Import .ics into an existing calendar (from calendar Edit modal). */
  async function onImportFile(input: HTMLInputElement) {
    if (selectedId === null) return;
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    calModalOpen = true;
    await runCalendarImport(selectedId, file, { keepEditModalOpen: true });
  }

  /**
   * Create a new calendar from the Add calendar form, then import .ics into it.
   * Display name optional — falls back to file name without extension.
   */
  async function onImportCreateCal(input: HTMLInputElement) {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;

    const form = root.querySelector<HTMLFormElement>('[data-form="create-cal"]');
    const fd = form ? new FormData(form) : new FormData();
    const holidays = fd.get("holidays") === "on";
    const readOnly = fd.get("readOnly") === "on";
    if (holidays) {
      setFlash(
        "error",
        "Turn off “Holidays calendar” to import a .ics file into a new calendar.",
      );
      createCalModalOpen = true;
      render();
      return;
    }
    if (readOnly) {
      setFlash(
        "error",
        "Turn off “Read-only” before importing — import cannot write to a read-only calendar.",
      );
      createCalModalOpen = true;
      render();
      return;
    }

    let displayname = String(fd.get("displayname") ?? "").trim();
    if (!displayname) {
      displayname = file.name.replace(/\.ics$/i, "").trim() || "Imported calendar";
    }
    const description = String(fd.get("description") ?? "");
    const color = String(fd.get("color") ?? "").trim();

    busy = true;
    clearFlash();
    createCalModalOpen = true;
    render();
    try {
      const res = await api.createCalendar({
        displayname,
        description,
        color,
        readOnly: false,
      });
      selectedId = res.calendar.id;
      createCalModalOpen = false;
      await loadHome();
      setFlash("success", `Created “${res.calendar.displayname}” — importing…`);
      // Import with progress (busy cleared/restored inside)
      await runCalendarImport(res.calendar.id, file, {
        keepEditModalOpen: false,
        successPrefix: `Calendar “${res.calendar.displayname}” created. `,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Create or import failed";
      createCalModalOpen = true;
      setFlash("error", msg);
      busy = false;
      render();
    }
  }

  async function runCalendarImport(
    calId: number,
    file: File,
    opts: { keepEditModalOpen?: boolean; successPrefix?: string } = {},
  ): Promise<void> {
    busy = true;
    clearFlash();
    stopImportElapsedTimer();
    importProgress = {
      kind: "calendar",
      fileName: file.name,
      fileSizeLabel: formatFileSize(file.size),
      phase: "reading",
      readPercent: 0,
      processPercent: null,
      processCurrent: 0,
      processTotal: 0,
      processImported: 0,
      processUpdated: 0,
      processSkipped: 0,
      startedAt: Date.now(),
      elapsedSec: 0,
      resultMessage: null,
      ok: null,
    };
    startImportElapsedTimer();
    render();
    try {
      const ics = await readFileTextWithProgress(file, (pct) => {
        if (!importProgress || importProgress.phase !== "reading") return;
        importProgress = { ...importProgress, readPercent: pct };
        const bar = root.querySelector<HTMLElement>(".import-progress-bar");
        const status = root.querySelector<HTMLElement>("[data-import-status-line]");
        if (bar && pct !== null) {
          bar.classList.remove("is-indeterminate");
          bar.style.width = `${pct}%`;
        }
        if (status && pct !== null) status.textContent = `Reading file… ${pct}%`;
      });
      setImportPhase("uploading", { readPercent: 100 });
      setImportPhase("processing", { processPercent: 0 });
      log.event("import.calendar.start", {
        file: file.name,
        bytes: file.size,
        calId,
      });
      const res = await api.importCalendar(calId, ics, (prog) => {
        applyServerImportProgress(prog);
      });
      const detail = formatImportResult(res);
      if (selectedId === calId) await loadMonthEvents();
      stopImportElapsedTimer();
      setImportPhase("done", {
        ok: true,
        resultMessage: `${detail} (from “${file.name}”)`,
      });
      setFlash(
        "success",
        `${opts.successPrefix || ""}Import finished for “${file.name}”: ${detail}.`,
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Import failed";
      stopImportElapsedTimer();
      setImportPhase("error", { ok: false, resultMessage: msg });
      setFlash("error", msg);
    } finally {
      if (opts.keepEditModalOpen) calModalOpen = true;
      busy = false;
      render();
    }
  }

  void bootstrap();
}
