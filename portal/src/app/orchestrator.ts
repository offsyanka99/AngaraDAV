/**
 * Shared runtime bag for Phase 8 orchestrator modules.
 * Built once in mountApp after hosts and core helpers exist.
 */
import type { FlashType } from "../ui";
import type { AppState } from "./context";
import type { AdminPageId, TabId } from "./types";
import type { FilesHost } from "./files";
import type { AdminHost } from "./admin";
import type { CalendarsHost } from "./calendars";
import type { NotesHost } from "./notes";
import type { TasksHost } from "./tasks";
import type { ContactsHost } from "./contacts";
import type { CalendarEventDetail } from "../api";
import type { ScrollSnapshot } from "./scroll";

export type AppOrchestrator = {
  state: AppState;
  root: HTMLElement;
  render: () => void;
  setFlash: (type: FlashType, message: string) => void;
  clearFlash: () => void;

  filesHost: FilesHost;
  adminHost: AdminHost;
  calendarsHost: CalendarsHost;
  notesHost: NotesHost;
  tasksHost: TasksHost;
  contactsHost: ContactsHost;

  // session / nav
  clearPortalSessionState: () => void;
  userIsAdmin: () => boolean;
  adminUiEnabled: () => boolean;
  normalizeActiveTab: () => void;
  persistTab: (tab: TabId, adminPage?: AdminPageId, username?: string | null) => void;
  activateTab: (tab: TabId, opts?: { clearFlash?: boolean }) => Promise<void>;
  activateAdminPage: (
    page: AdminPageId,
    opts?: { clearFlash?: boolean; username?: string | null },
  ) => Promise<void>;
  loadHome: () => Promise<void>;
  handleSessionExpired: (message?: string) => void;

  // domain thin calls
  loadFiles: () => Promise<void>;
  loadShares: (id: number) => Promise<void>;
  loadMonthEvents: () => Promise<void>;
  loadContacts: (abId: number) => Promise<void>;
  loadTasks: () => Promise<void>;
  loadNotes: () => Promise<void>;
  loadAdminCapabilities: () => Promise<void>;
  loadAdminDashboard: () => Promise<void>;
  loadAdminUsers: () => Promise<void>;
  loadAdminUserDetail: (username: string) => Promise<void>;
  loadAdminUserResources: (username: string) => Promise<void>;
  loadAdminSystemSettings: () => Promise<void>;
  loadAdminDatabaseSettings: () => Promise<void>;
  adminPageMeta: (pageId: AdminPageId) => { available?: boolean } | null;
  pickDefaultCalendar: () => import("../api").Calendar | null;
  toggleCalendarSelected: (id: number) => void;
  blankEventForDay: (day: string, instanceId: number) => CalendarEventDetail;
  defaultRepeat: () => NonNullable<CalendarEventDetail["repeat"]>;
  itemKey: (instanceId: number, uri: string) => string;
  openContact: (uri: string) => Promise<void>;
  startNewContact: () => void;
  emptyAddress: () => import("../api").ContactDetail["address"];
  syncEditingEventFromForm: (form: HTMLFormElement) => void;
  syncEditingTaskFromForm: (form: HTMLFormElement) => void;
  syncEditingNoteFromForm: (form: HTMLFormElement) => void;
  runBulkTaskAction: (
    action:
      | "bulk-task-status"
      | "bulk-task-due"
      | "bulk-task-clear-due"
      | "bulk-task-percent"
      | "bulk-task-delete",
  ) => Promise<void>;

  // UI helpers
  shell: (main: string, opts: { tabs: string }) => string;
  renderLogin: () => void;
  renderFlashBanner: () => string;
  renderMonthGrid: () => string;
  renderEventModal: () => string;
  renderImportProgressModal: () => string;
  renderFilesUploadProgressModal: () => string;
  renderTasksTab: () => string;
  renderNotesTab: () => string;
  renderFilesTab: () => string;
  renderAdminSection: () => string;
  adminSubnavButtons: () => string;
  renderPortalDateTimeField: (opts: {
    field: string;
    name: string;
    label: string;
    value: string;
    dateOnly?: boolean;
    required?: boolean;
    disabled?: boolean;
    allowClear?: boolean;
  }) => string;
  getDtFieldCurrentValue: (field: string) => string;
  setDtFieldValue: (field: string, value: string | null) => void;
  positionDtPopovers: () => void;
  accessBadge: (access: string) => string;
  formatImportResult: (r: import("../api").ImportResult) => string;

  // timers / progress
  closeImportProgress: () => void;
  closeFilesUploadProgress: () => void;
  resetFilesTransferTree: () => void;
  stopImportElapsedTimer: () => void;
  stopFilesUploadElapsedTimer: () => void;
  unbindUserMenuOutside: () => void;
  bindUserMenuOutside: () => void;
  unbindFilesUploadMenuOutside: () => void;
  bindFilesUploadMenuOutside: () => void;

  // forms
  onLogin: (form: HTMLFormElement) => Promise<void>;
  onShare: (form: HTMLFormElement) => Promise<void>;
  onSaveEvent: (form: HTMLFormElement) => Promise<void>;
  onEditCal: (form: HTMLFormElement) => Promise<void>;
  onCreateCal: (form: HTMLFormElement) => Promise<void>;
  onSaveContact: (form: HTMLFormElement) => Promise<void>;
  onCreateAb: (form: HTMLFormElement) => Promise<void>;
  onEditAb: (form: HTMLFormElement) => Promise<void>;
  onSaveTask: (form: HTMLFormElement) => Promise<void>;
  onSaveNote: (form: HTMLFormElement) => Promise<void>;
  bindColorPair: (form: HTMLFormElement) => void;
  bindImportInput: () => void;
  bindHolidaysToggle: () => void;
  bindContactPhotoInput: () => void;
  bindFilesDom: () => void;
  bindAdminDom: () => void;

  saveBlobAsFile: (blob: Blob, filename: string) => Promise<"saved" | "cancelled" | "started">;
  openInfoModal: (key: string) => void;
  closeInfoModal: () => void;
  captureScroll: () => ScrollSnapshot;
  restoreScroll: (s: ScrollSnapshot) => void;
};
