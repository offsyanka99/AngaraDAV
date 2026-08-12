/**
 * Portal SPA orchestrator (Phase 8).
 * Wires AppState + domain hosts; domain modules own UI/actions.
 */
import { api } from "./api";
import type { FlashType } from "./ui";
import { createAppState, type AppContext } from "./app/context";
import type { AdminPageId } from "./app/types";
import { bootstrap as bootstrapPortal, onLogin as onLoginPortal } from "./app/bootstrap";
import {
  clearFlash as clearFlashState,
  renderFlashBanner as renderFlashBannerState,
  setFlash as setFlashState,
} from "./app/flash";
import { renderLogin as renderLoginView } from "./app/login";
import {
  captureScroll as captureScrollRoot,
  restoreScroll as restoreScrollRoot,
} from "./app/scroll";
import {
  adminUiEnabled as adminUiEnabledState,
  clearPortalSessionState as clearPortalSessionStateImpl,
  handleSessionExpired as handleSessionExpiredState,
  userIsAdmin as userIsAdminState,
} from "./app/session";
import {
  bindUserMenuOutside as bindUserMenuOutsideState,
  shell as shellHtml,
  unbindUserMenuOutside as unbindUserMenuOutsideState,
} from "./app/shell";
import type { FilesHost } from "./app/files";
import * as files from "./app/files";
import type { AdminHost } from "./app/admin";
import * as admin from "./app/admin";
import type { CalendarsHost } from "./app/calendars";
import * as calendars from "./app/calendars";
import type { NotesHost } from "./app/notes";
import * as notes from "./app/notes";
import type { TasksHost } from "./app/tasks";
import * as tasks from "./app/tasks";
import type { ContactsHost } from "./app/contacts";
import * as contacts from "./app/contacts";
import { itemKey as itemKeyUtil } from "./app/keys";
import {
  parseLocationRoute,
  persistTab,
  readStoredAdminPage,
  readStoredTab,
} from "./app/routing";
import { accessBadge as accessBadgeFn, formatImportResult as formatImportResultFn } from "./app/badges";
import type { AppOrchestrator } from "./app/orchestrator";
import { renderHome } from "./app/home";
import { bind as bindApp } from "./app/bind";
import {
  activateAdminPage as activateAdminPageNav,
  activateTab as activateTabNav,
  loadHome as loadHomeNav,
  normalizeActiveTab as normalizeActiveTabNav,
} from "./app/navigation";
import * as dt from "./app/datetimeFields";
import { openInfoModal as openInfoModalFn, closeInfoModal as closeInfoModalFn } from "./app/infoModal";
import { saveBlobAsFile as saveBlobAsFileFn } from "./app/exportBlob";
import { bindColorPair as bindColorPairFn } from "./app/bindColorPair";

export function mountApp(root: HTMLElement): void {
  const state = createAppState({
    activeTab: readStoredTab(),
    adminPage: readStoredAdminPage(),
    adminSelectedUsername: parseLocationRoute().adminUsername ?? null,
  });

  let ctx: AppContext;
  let filesHost: FilesHost;
  let adminHost: AdminHost;
  let calendarsHost: CalendarsHost;
  let notesHost: NotesHost;
  let tasksHost: TasksHost;
  let contactsHost: ContactsHost;
  let o: AppOrchestrator;

  function setFlash(type: FlashType, message: string) {
    setFlashState(state, type, message);
  }
  function clearFlash() {
    clearFlashState(state);
  }

  function render() {
    const scroll = captureScrollRoot(root);
    if (!state.user) {
      renderLoginView(root, state, (body, opts) =>
        shellHtml(state, body, opts, {
          renderImportProgressModal: () => calendars.renderImportProgressModal(calendarsHost),
          renderFilesUploadProgressModal: () => files.renderFilesUploadProgressModal(filesHost),
        }),
      );
    } else {
      renderHome(o);
    }
    bindApp(o);
    restoreScrollRoot(root, scroll);
    requestAnimationFrame(() => {
      dt.positionDtPopovers(o);
      root.querySelector(".dt-time.is-selected")?.scrollIntoView({ block: "center" });
    });
  }

  function stopImportElapsedTimer(): void {
    calendars.stopImportElapsedTimer(calendarsHost);
  }
  function stopFilesUploadElapsedTimer(): void {
    files.stopFilesUploadElapsedTimer(filesHost);
  }
  function resetFilesTransferTree(): void {
    files.resetFilesTransferTree(filesHost);
  }
  function unbindUserMenuOutside(): void {
    unbindUserMenuOutsideState(state);
  }
  function unbindFilesUploadMenuOutside(): void {
    files.unbindFilesUploadMenuOutside(filesHost);
  }

  function clearPortalSessionState(): void {
    clearPortalSessionStateImpl(state, {
      stopImportElapsedTimer,
      stopFilesUploadElapsedTimer,
      resetFilesTransferTree,
      unbindUserMenuOutside,
      unbindFilesUploadMenuOutside,
    });
  }

  function handleSessionExpired(message?: string): void {
    handleSessionExpiredState(state, {
      message,
      clearSession: clearPortalSessionState,
      render,
    });
  }

  function bootstrapDeps() {
    return {
      state,
      render,
      handleSessionExpired,
      clearPortalSessionState,
      normalizeActiveTab: () => normalizeActiveTabNav(o),
      persistTab,
      loadHome: () => loadHomeNav(o),
      loadAdminCapabilities: () => admin.loadAdminCapabilities(adminHost),
      loadAdminDashboard: () => admin.loadAdminDashboard(adminHost),
      loadAdminUsers: () => admin.loadAdminUsers(adminHost),
      loadAdminUserDetail: (username: string) => admin.loadAdminUserDetail(adminHost, username),
      loadAdminUserResources: (username: string) =>
        admin.loadAdminUserResources(adminHost, username),
      loadAdminSystemSettings: () => admin.loadAdminSystemSettings(adminHost),
      loadAdminDatabaseSettings: () => admin.loadAdminDatabaseSettings(adminHost),
      adminPageMeta: (page: AdminPageId) => admin.adminPageMeta(adminHost, page),
      setFlash,
      clearFlash,
    };
  }

  // Hosts (methods assigned after render/flash exist)
  filesHost = {
    state,
    root,
    render,
    setFlash,
    clearFlash,
  };
  adminHost = {
    state,
    root,
    render,
    setFlash,
    clearFlash,
    userIsAdmin: () => userIsAdminState(state),
    adminUiEnabled: () => adminUiEnabledState(state),
    persistTab,
    activateTab: (tab, opts) => activateTabNav(o, tab, opts),
    loadHome: () => loadHomeNav(o),
    normalizeActiveTab: () => normalizeActiveTabNav(o),
  };
  calendarsHost = {
    state,
    root,
    render,
    setFlash,
    clearFlash,
    localeWeekStart: () => dt.localeWeekStart(o),
    localeDowLabels: () => dt.localeDowLabels(o),
    formatDtDisplay: (value, allDay) => dt.formatDtDisplay(o, value, allDay),
    timeFormatOpts: () => dt.timeFormatOpts(o),
    renderPortalDateTimeField: (opts) => dt.renderPortalDateTimeField(o, opts),
    getDtFieldCurrentValue: (field) => dt.getDtFieldCurrentValue(o, field),
    setDtFieldValue: (field, value) => dt.setDtFieldValue(o, field, value),
    positionDtPopovers: () => dt.positionDtPopovers(o),
    renderFlashBanner: () => renderFlashBannerState(state),
    accessBadge: accessBadgeFn,
    formatImportResult: formatImportResultFn,
    loadHome: () => loadHomeNav(o),
    onImportContacts: (input) => contacts.onImportContacts(contactsHost, input),
  };
  notesHost = {
    state,
    root,
    render,
    setFlash,
    clearFlash,
    renderPortalDateTimeField: (opts) => dt.renderPortalDateTimeField(o, opts),
  };
  tasksHost = {
    state,
    root,
    render,
    setFlash,
    clearFlash,
    renderPortalDateTimeField: (opts) => dt.renderPortalDateTimeField(o, opts),
  };
  contactsHost = {
    state,
    root,
    render,
    setFlash,
    clearFlash,
    renderPortalDateTimeField: (opts) => dt.renderPortalDateTimeField(o, opts),
    stopImportElapsedTimer: () => calendars.stopImportElapsedTimer(calendarsHost),
    startImportElapsedTimer: () => calendars.startImportElapsedTimer(calendarsHost),
    setImportPhase: (phase, extra) => calendars.setImportPhase(calendarsHost, phase, extra),
    applyServerImportProgress: (p) => calendars.applyServerImportProgress(calendarsHost, p),
    readFileTextWithProgress: (file, onProgress) =>
      calendars.readFileTextWithProgress(calendarsHost, file, onProgress),
    formatImportResult: formatImportResultFn,
    loadHome: () => loadHomeNav(o),
  };

  o = {
    state,
    root,
    render,
    setFlash,
    clearFlash,
    filesHost,
    adminHost,
    calendarsHost,
    notesHost,
    tasksHost,
    contactsHost,
    clearPortalSessionState,
    userIsAdmin: () => userIsAdminState(state),
    adminUiEnabled: () => adminUiEnabledState(state),
    normalizeActiveTab: () => normalizeActiveTabNav(o),
    persistTab,
    activateTab: (tab, opts) => activateTabNav(o, tab, opts),
    activateAdminPage: (page, opts) => activateAdminPageNav(o, page, opts),
    loadHome: () => loadHomeNav(o),
    handleSessionExpired,
    loadFiles: () => files.loadFiles(filesHost),
    loadShares: (id) => calendars.loadShares(calendarsHost, id),
    loadMonthEvents: () => calendars.loadMonthEvents(calendarsHost),
    loadContacts: (abId) => contacts.loadContacts(contactsHost, abId),
    loadTasks: () => tasks.loadTasks(tasksHost),
    loadNotes: () => notes.loadNotes(notesHost),
    loadAdminCapabilities: () => admin.loadAdminCapabilities(adminHost),
    loadAdminDashboard: () => admin.loadAdminDashboard(adminHost),
    loadAdminUsers: () => admin.loadAdminUsers(adminHost),
    loadAdminUserDetail: (username) => admin.loadAdminUserDetail(adminHost, username),
    loadAdminUserResources: (username) => admin.loadAdminUserResources(adminHost, username),
    loadAdminSystemSettings: () => admin.loadAdminSystemSettings(adminHost),
    loadAdminDatabaseSettings: () => admin.loadAdminDatabaseSettings(adminHost),
    adminPageMeta: (pageId) => admin.adminPageMeta(adminHost, pageId),
    pickDefaultCalendar: () => calendars.pickDefaultCalendar(calendarsHost),
    toggleCalendarSelected: (id) => calendars.toggleCalendarSelected(calendarsHost, id),
    blankEventForDay: (day, instanceId) =>
      calendars.blankEventForDay(calendarsHost, day, instanceId),
    defaultRepeat: () => calendars.defaultRepeat(),
    itemKey: itemKeyUtil,
    openContact: (uri) => contacts.openContact(contactsHost, uri),
    startNewContact: () => contacts.startNewContact(contactsHost),
    emptyAddress: () => contacts.emptyAddress(contactsHost),
    syncEditingEventFromForm: (form) => calendars.syncEditingEventFromForm(calendarsHost, form),
    syncEditingTaskFromForm: (form) => tasks.syncEditingTaskFromForm(tasksHost, form),
    syncEditingNoteFromForm: (form) => notes.syncEditingNoteFromForm(notesHost, form),
    runBulkTaskAction: (action) => tasks.runBulkTaskAction(tasksHost, action),
    shell: (main, opts) =>
      shellHtml(state, main, opts, {
        renderImportProgressModal: () => calendars.renderImportProgressModal(calendarsHost),
        renderFilesUploadProgressModal: () => files.renderFilesUploadProgressModal(filesHost),
      }),
    renderLogin: () =>
      renderLoginView(root, state, (body, shellOpts) =>
        shellHtml(state, body, shellOpts, {
          renderImportProgressModal: () => calendars.renderImportProgressModal(calendarsHost),
          renderFilesUploadProgressModal: () => files.renderFilesUploadProgressModal(filesHost),
        }),
      ),
    renderFlashBanner: () => renderFlashBannerState(state),
    renderMonthGrid: () => calendars.renderMonthGrid(calendarsHost),
    renderEventModal: () => calendars.renderEventModal(calendarsHost),
    renderImportProgressModal: () => calendars.renderImportProgressModal(calendarsHost),
    renderFilesUploadProgressModal: () => files.renderFilesUploadProgressModal(filesHost),
    renderTasksTab: () => tasks.renderTasksTab(tasksHost),
    renderNotesTab: () => notes.renderNotesTab(notesHost),
    renderFilesTab: () => files.renderFilesTab(filesHost),
    renderAdminSection: () => admin.renderAdminSection(adminHost),
    adminSubnavButtons: () => admin.adminSubnavButtons(adminHost),
    renderPortalDateTimeField: (opts) => dt.renderPortalDateTimeField(o, opts),
    getDtFieldCurrentValue: (field) => dt.getDtFieldCurrentValue(o, field),
    setDtFieldValue: (field, value) => dt.setDtFieldValue(o, field, value),
    positionDtPopovers: () => dt.positionDtPopovers(o),
    accessBadge: accessBadgeFn,
    formatImportResult: formatImportResultFn,
    closeImportProgress: () => calendars.closeImportProgress(calendarsHost),
    closeFilesUploadProgress: () => files.closeFilesUploadProgress(filesHost),
    resetFilesTransferTree,
    stopImportElapsedTimer,
    stopFilesUploadElapsedTimer,
    unbindUserMenuOutside,
    bindUserMenuOutside: () => bindUserMenuOutsideState(state, render),
    unbindFilesUploadMenuOutside,
    bindFilesUploadMenuOutside: () => files.bindFilesUploadMenuOutside(filesHost),
    onLogin: (form) => onLoginPortal(form, bootstrapDeps()),
    onShare: (form) => calendars.onShare(calendarsHost, form),
    onSaveEvent: (form) => calendars.onSaveEvent(calendarsHost, form),
    onEditCal: (form) => calendars.onEditCal(calendarsHost, form),
    onCreateCal: (form) => calendars.onCreateCal(calendarsHost, form),
    onSaveContact: (form) => contacts.onSaveContact(contactsHost, form),
    onCreateAb: (form) => contacts.onCreateAb(contactsHost, form),
    onEditAb: (form) => contacts.onEditAb(contactsHost, form),
    onSaveTask: (form) => tasks.onSaveTask(tasksHost, form),
    onSaveNote: (form) => notes.onSaveNote(notesHost, form),
    bindColorPair: bindColorPairFn,
    bindImportInput: () => calendars.bindImportInput(calendarsHost),
    bindHolidaysToggle: () => calendars.bindHolidaysToggle(calendarsHost),
    bindContactPhotoInput: () => contacts.bindContactPhotoInput(contactsHost),
    bindFilesDom: () => files.bindFilesDom(filesHost),
    bindAdminDom: () => admin.bindAdminDom(adminHost),
    saveBlobAsFile: saveBlobAsFileFn,
    openInfoModal: (key) => openInfoModalFn(o, key),
    closeInfoModal: () => closeInfoModalFn(o),
    captureScroll: () => captureScrollRoot(root),
    restoreScroll: (s) => restoreScrollRoot(root, s),
  };

  ctx = { root, state, api, render, setFlash, clearFlash };
  void ctx;

  void bootstrapPortal(bootstrapDeps());
}
