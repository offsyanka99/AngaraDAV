/**
 * Central app state + context (Phase 2 of portal app modularization).
 * Domains will take AppContext; mountApp owns create/wire for now.
 */
import {
  api,
  type AddressBook,
  type AdminCapabilities,
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
  type ContactDetail,
  type ContactSummary,
  type DirectoryUser,
  type FileEntry,
  type FilesStatus,
  type HolidayCountry,
  type ItemCalendarOption,
  type NoteItem,
  type PortalUser,
  type Share,
  type TaskItem,
} from "../api";
import type { FlashType } from "../ui";
import { APP_VERSION_FALLBACK } from "./constants";
import type { ConfirmDeleteState } from "./confirmDelete";
import type { AdminPageId, Flash, TabId } from "./types";

/** Full-screen import progress dialog state. */
export type ImportProgress = {
  kind: "calendar" | "contacts";
  fileName: string;
  fileSizeLabel: string;
  phase: "reading" | "uploading" | "processing" | "done" | "error";
  readPercent: number | null;
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

/** Files tab multi-upload progress dialog. */
export type FilesUploadProgress = {
  phase: "uploading" | "done" | "error";
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  currentName: string;
  bytesTotal: number;
  bytesSent: number;
  startedAt: number;
  elapsedSec: number;
  resultMessage: string | null;
  errorSamples: string[];
};

/** Portal-styled conflict dialog before upload (File objects held in upload.ts pending). */
export type FilesUploadConflict = {
  /** Display paths/names for the list (already sorted). */
  names: string[];
  totalFiles: number;
  conflictCount: number;
  /**
   * Dest keys (`parentPath\\0fileName`) for files that already exist on the server.
   * Skip keeps planned items whose key is NOT in this list.
   */
  conflictKeys: string[];
};

export type InstallGate = {
  step: string;
  message: string;
  installUrl: string;
  productVersion?: string;
  configuredVersion?: string | null;
};

export type EventDtPicker = {
  field: string;
  viewY: number;
  viewM: number;
  dateOnly: boolean;
  allowClear: boolean;
  name: string;
};

export type PortalUiServicesState = {
  caldav: boolean;
  carddav: boolean;
  tasks: boolean;
  notes: boolean;
  files: boolean;
};

export type PortalUiState = {
  timeFormat: "auto" | "12h" | "24h";
  weekStart: "auto" | "monday" | "sunday";
  logLevel: string;
  /**
   * null = services not yet known (fail-open: show all user tabs).
   * object = from login/me/ui; hide tabs for disabled services.
   */
  services: PortalUiServicesState | null;
};

export type AdminResourceDelete =
  | { kind: "calendar"; id: number; label: string }
  | { kind: "addressbook"; id: number; label: string; force?: boolean }
  | null;

export type AppState = {
  user: PortalUser | null;
  flash: Flash;
  activeTab: TabId;
  adminPage: AdminPageId;
  adminDashboard: AdminDashboardStats | null;
  adminDashboardLoading: boolean;
  adminDashboardError: string | null;
  adminCapabilities: AdminCapabilities | null;
  adminCapabilitiesError: string | null;
  adminUsers: AdminUserSummary[];
  adminUsersLoading: boolean;
  adminUsersError: string | null;
  adminUsersQuery: string;
  adminSelectedUsername: string | null;
  adminUserDetail: AdminUserDetail | null;
  adminUserDetailLoading: boolean;
  adminUserDetailError: string | null;
  adminUserCreateOpen: boolean;
  adminUserEditOpen: boolean;
  adminUserDeleteUsername: string | null;
  adminUserDeleteConfirmChecked: boolean;
  adminUserCalendars: AdminUserCalendar[];
  adminUserAddressBooks: AdminUserAddressBook[];
  adminUserResourcesLoading: boolean;
  adminCalModal: "create" | "edit" | null;
  adminCalEditId: number | null;
  adminAbModal: "create" | "edit" | null;
  adminAbEditId: number | null;
  adminResourceDelete: AdminResourceDelete;
  adminSystemSettings: AdminSystemSettings | null;
  adminSystemSettingsLoading: boolean;
  adminSystemSettingsError: string | null;
  adminResetModalOpen: boolean;
  adminResetConfirmChecked: boolean;
  adminResetPassword: string;
  adminDatabaseSettings: AdminDatabaseSettings | null;
  adminDatabaseSettingsLoading: boolean;
  adminDatabaseSettingsError: string | null;
  adminDbFormBackend: "sqlite" | "pgsql";
  adminDbConfirmOpen: boolean;
  adminDbConfirmText: string;
  adminDbPendingBody: Record<string, unknown> | null;
  userMenuOpen: boolean;
  userMenuDocClick: ((ev: MouseEvent) => void) | null;
  calendars: Calendar[];
  directory: DirectoryUser[];
  holidayCountries: HolidayCountry[];
  selectedId: number | null;
  selectedIds: number[];
  /**
   * After first loadHome seed of selectedIds, keep empty multi-select as intentional
   * (do not re-check the default calendar when the user unchecks everything).
   */
  calendarSelectionSeeded: boolean;
  /**
   * When true, restore focus to the selected Contacts/Tasks/Notes list row after
   * re-render so ↑/↓ keyboard navigation keeps working.
   */
  listKeyboardFocus: boolean;
  shares: Share[];
  installGate: InstallGate | null;
  calModalOpen: boolean;
  createCalModalOpen: boolean;
  deleteConfirmId: number | null;
  deleteAbConfirmId: number | null;
  monthCursor: { y: number; m: number };
  monthEvents: Array<CalendarEvent & { instanceId: number }>;
  monthEventsLoading: boolean;
  eventModalOpen: boolean;
  editingEvent: CalendarEventDetail | null;
  creatingEvent: boolean;
  eventDtPicker: EventDtPicker | null;
  bulkDueValue: string;
  monthExpandDay: string | null;
  addressBooks: AddressBook[];
  selectedAbId: number | null;
  contacts: ContactSummary[];
  contactSearch: string;
  selectedContactUri: string | null;
  editingContact: ContactDetail | null;
  creatingContact: boolean;
  contactModalOpen: boolean;
  abModalOpen: boolean;
  photoPreview: string | null;
  photoBase64Pending: string | null;
  removePhotoPending: boolean;
  busy: boolean;
  importProgress: ImportProgress | null;
  importElapsedTimer: ReturnType<typeof setInterval> | null;
  filesUploadProgress: FilesUploadProgress | null;
  filesUploadElapsedTimer: ReturnType<typeof setInterval> | null;
  filesUploadMenuOpen: boolean;
  filesUploadMenuDocClick: ((ev: MouseEvent) => void) | null;
  filesUploadDropActive: boolean;
  /** Drag depth for files panel drop (lives on state so drop listeners can be mount-time). */
  filesDropDepth: number;
  escapeBound: boolean;
  /** True after registerPortalEvents(o) at mount (delegated-events plan). */
  portalEventsBound: boolean;
  portalUi: PortalUiState;
  searchTimer: ReturnType<typeof setTimeout> | null;
  sessionIdleSeconds: number;
  sessionIdleTimer: ReturnType<typeof setTimeout> | null;
  appVersion: string;
  handlingSessionExpiry: boolean;
  suppressErrorFlashAfterExpiry: boolean;
  tasks: TaskItem[];
  notes: NoteItem[];
  taskCalendars: ItemCalendarOption[];
  noteCalendars: ItemCalendarOption[];
  taskSearch: string;
  noteSearch: string;
  taskSort: string;
  taskOrder: "asc" | "desc";
  noteSort: string;
  noteOrder: "asc" | "desc";
  selectedTaskKey: string | null;
  selectedNoteKey: string | null;
  editingTask: TaskItem | null;
  editingNote: NoteItem | null;
  creatingTask: boolean;
  creatingNote: boolean;
  checkedTaskKeys: string[];
  filesStatus: FilesStatus | null;
  filesPath: string;
  filesEntries: FileEntry[];
  filesLoading: boolean;
  filesRenamePath: string | null;
  filesDeletePaths: string[] | null;
  filesTransfer: { op: "copy" | "move"; paths: string[] } | null;
  filesTransferDest: string;
  filesTreeChildren: Record<string, FileEntry[] | "loading" | "error">;
  filesTreeExpanded: string[];
  filesMkdirOpen: boolean;
  checkedFilePaths: string[];
  filesUploadConflict: FilesUploadConflict | null;
  /** Themed delete confirm (event/task/note/contact/bulk/revoke). */
  confirmDelete: ConfirmDeleteState | null;
  /** Document click handler while datetime popover is open. */
  dtPickerDocClick: ((ev: MouseEvent) => void) | null;
};

export type AppContext = {
  root: HTMLElement;
  state: AppState;
  api: typeof api;
  render: () => void;
  setFlash: (type: FlashType, message: string) => void;
  clearFlash: () => void;
};

export type CreateAppStateOpts = {
  activeTab: TabId;
  adminPage: AdminPageId;
  adminSelectedUsername: string | null;
};

export function createAppState(opts: CreateAppStateOpts): AppState {
  const now = new Date();
  return {
    user: null,
    flash: null,
    activeTab: opts.activeTab,
    adminPage: opts.adminPage,
    adminDashboard: null,
    adminDashboardLoading: false,
    adminDashboardError: null,
    adminCapabilities: null,
    adminCapabilitiesError: null,
    adminUsers: [],
    adminUsersLoading: false,
    adminUsersError: null,
    adminUsersQuery: "",
    adminSelectedUsername: opts.adminSelectedUsername,
    adminUserDetail: null,
    adminUserDetailLoading: false,
    adminUserDetailError: null,
    adminUserCreateOpen: false,
    adminUserEditOpen: false,
    adminUserDeleteUsername: null,
    adminUserDeleteConfirmChecked: false,
    adminUserCalendars: [],
    adminUserAddressBooks: [],
    adminUserResourcesLoading: false,
    adminCalModal: null,
    adminCalEditId: null,
    adminAbModal: null,
    adminAbEditId: null,
    adminResourceDelete: null,
    adminSystemSettings: null,
    adminSystemSettingsLoading: false,
    adminSystemSettingsError: null,
    adminResetModalOpen: false,
    adminResetConfirmChecked: false,
    adminResetPassword: "",
    adminDatabaseSettings: null,
    adminDatabaseSettingsLoading: false,
    adminDatabaseSettingsError: null,
    adminDbFormBackend: "sqlite",
    adminDbConfirmOpen: false,
    adminDbConfirmText: "",
    adminDbPendingBody: null,
    userMenuOpen: false,
    userMenuDocClick: null,
    calendars: [],
    directory: [],
    holidayCountries: [],
    selectedId: null,
    selectedIds: [],
    calendarSelectionSeeded: false,
    listKeyboardFocus: false,
    shares: [],
    installGate: null,
    calModalOpen: false,
    createCalModalOpen: false,
    deleteConfirmId: null,
    deleteAbConfirmId: null,
    monthCursor: { y: now.getFullYear(), m: now.getMonth() },
    monthEvents: [],
    monthEventsLoading: false,
    eventModalOpen: false,
    editingEvent: null,
    creatingEvent: false,
    eventDtPicker: null,
    bulkDueValue: "",
    monthExpandDay: null,
    addressBooks: [],
    selectedAbId: null,
    contacts: [],
    contactSearch: "",
    selectedContactUri: null,
    editingContact: null,
    creatingContact: false,
    contactModalOpen: false,
    abModalOpen: false,
    photoPreview: null,
    photoBase64Pending: null,
    removePhotoPending: false,
    busy: false,
    importProgress: null,
    importElapsedTimer: null,
    filesUploadProgress: null,
    filesUploadElapsedTimer: null,
    filesUploadMenuOpen: false,
    filesUploadMenuDocClick: null,
    filesUploadDropActive: false,
    filesDropDepth: 0,
    escapeBound: false,
    portalEventsBound: false,
    portalUi: {
      timeFormat: "auto",
      weekStart: "auto",
      logLevel: "off",
      services: null,
    },
    searchTimer: null,
    sessionIdleSeconds: 900,
    sessionIdleTimer: null,
    appVersion: APP_VERSION_FALLBACK,
    handlingSessionExpiry: false,
    suppressErrorFlashAfterExpiry: false,
    tasks: [],
    notes: [],
    taskCalendars: [],
    noteCalendars: [],
    taskSearch: "",
    noteSearch: "",
    taskSort: "due",
    taskOrder: "asc",
    noteSort: "dtstart",
    noteOrder: "desc",
    selectedTaskKey: null,
    selectedNoteKey: null,
    editingTask: null,
    editingNote: null,
    creatingTask: false,
    creatingNote: false,
    checkedTaskKeys: [],
    filesStatus: null,
    filesPath: "",
    filesEntries: [],
    filesLoading: false,
    filesRenamePath: null,
    filesDeletePaths: null,
    filesTransfer: null,
    filesTransferDest: "",
    filesTreeChildren: {},
    filesTreeExpanded: [],
    filesMkdirOpen: false,
    checkedFilePaths: [],
    filesUploadConflict: null,
    confirmDelete: null,
    dtPickerDocClick: null,
  };
}

/** Sorted longest-first for safe identifier rewrites. */
export const APP_STATE_KEYS = [
  "adminUserDeleteConfirmChecked",
  "adminDatabaseSettingsLoading",
  "adminSystemSettingsLoading",
  "adminUserResourcesLoading",
  "adminDashboardLoading",
  "adminCapabilitiesError",
  "adminDatabaseSettingsError",
  "adminSystemSettingsError",
  "adminUserDetailLoading",
  "suppressErrorFlashAfterExpiry",
  "adminSelectedUsername",
  "adminUserDeleteUsername",
  "adminDashboardError",
  "filesUploadElapsedTimer",
  "filesUploadMenuDocClick",
  "adminUserAddressBooks",
  "adminDatabaseSettings",
  "adminSystemSettings",
  "adminUserDetailError",
  "adminUsersLoading",
  "adminResetConfirmChecked",
  "adminUserCreateOpen",
  "adminCapabilities",
  "adminDashboard",
  "adminUserCalendars",
  "adminUserEditOpen",
  "adminUsersError",
  "adminUsersQuery",
  "adminDbFormBackend",
  "adminDbPendingBody",
  "adminResetModalOpen",
  "adminResetPassword",
  "adminDbConfirmOpen",
  "adminDbConfirmText",
  "adminUserDetail",
  "adminCalEditId",
  "adminAbEditId",
  "adminResourceDelete",
  "adminCalModal",
  "adminAbModal",
  "adminUsers",
  "adminPage",
  "filesUploadDropActive",
  "filesDropDepth",
  "filesUploadMenuOpen",
  "filesUploadProgress",
  "filesTransferDest",
  "filesTreeChildren",
  "filesTreeExpanded",
  "filesDeletePaths",
  "filesRenamePath",
  "checkedFilePaths",
  "selectedContactUri",
  "photoBase64Pending",
  "removePhotoPending",
  "createCalModalOpen",
  "contactModalOpen",
  "creatingContact",
  "editingContact",
  "selectedAbId",
  "addressBooks",
  "contactSearch",
  "monthEventsLoading",
  "monthExpandDay",
  "creatingEvent",
  "editingEvent",
  "eventModalOpen",
  "eventDtPicker",
  "deleteAbConfirmId",
  "deleteConfirmId",
  "calModalOpen",
  "abModalOpen",
  "photoPreview",
  "monthCursor",
  "monthEvents",
  "holidayCountries",
  "selectedIds",
  "calendarSelectionSeeded",
  "listKeyboardFocus",
  "selectedId",
  "installGate",
  "userMenuDocClick",
  "userMenuOpen",
  "importElapsedTimer",
  "importProgress",
  "sessionIdleSeconds",
  "sessionIdleTimer",
  "handlingSessionExpiry",
  "filesTransfer",
  "filesEntries",
  "filesLoading",
  "filesMkdirOpen",
  "filesUploadConflict",
  "confirmDelete",
  "dtPickerDocClick",
  "filesStatus",
  "filesPath",
  "checkedTaskKeys",
  "selectedTaskKey",
  "selectedNoteKey",
  "taskCalendars",
  "noteCalendars",
  "creatingTask",
  "creatingNote",
  "editingTask",
  "editingNote",
  "taskSearch",
  "noteSearch",
  "taskOrder",
  "noteOrder",
  "taskSort",
  "noteSort",
  "bulkDueValue",
  "escapeBound",
  "portalEventsBound",
  "searchTimer",
  "portalUi",
  "appVersion",
  "activeTab",
  "directory",
  "calendars",
  "contacts",
  "shares",
  "tasks",
  "notes",
  "flash",
  "busy",
  "user",
] as const satisfies readonly (keyof AppState)[];
