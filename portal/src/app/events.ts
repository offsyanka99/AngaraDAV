/**
 * Mount-time portal event registration (delegated-events plan).
 *
 * Step 1: Escape on document.
 * Step 2: click → onAction (no per-element re-bind).
 * Later: submit / change / input / row keydown still post-render bind until enabled.
 */
import { log } from "../log";
import type { AppOrchestrator } from "./orchestrator";
import { onAction } from "./onAction";
import * as admin from "./admin";
import * as files from "./files";
import { unbindDtPickerOutside } from "./shell";

/** Prevent double registration when mountApp runs twice on the same root (e.g. HMR). */
const boundRoots = new WeakMap<HTMLElement, true>();

/**
 * Register once after `AppOrchestrator` is fully wired. Idempotent per root element.
 */
export function registerPortalEvents(o: AppOrchestrator): void {
  if (boundRoots.has(o.root)) {
    log.debug("portalEvents: already bound for root");
    return;
  }
  boundRoots.set(o.root, true);
  o.state.portalEventsBound = true;
  // Escape lives on document for the life of this mount (not re-bound after render).
  o.state.escapeBound = true;

  const { root } = o;

  root.addEventListener("click", (ev) => onRootClick(o, ev));
  root.addEventListener("submit", (ev) => onRootSubmit(o, ev));
  root.addEventListener("change", (ev) => onRootChange(o, ev));
  root.addEventListener("input", (ev) => onRootInput(o, ev));
  root.addEventListener("keydown", (ev) => onRootKeydown(o, ev));
  document.addEventListener("keydown", (ev) => onDocumentKeydown(o, ev));

  log.event("portalEvents.registered");
}

/**
 * Step 2: delegated click → onAction (replaces per-element [data-action] click bind).
 */
function onRootClick(o: AppOrchestrator, ev: Event): void {
  const t = (ev.target as HTMLElement | null)?.closest?.<HTMLElement>("[data-action]");
  if (!t || !o.root.contains(t)) return;

  const action = t.dataset.action ?? "";
  // Match prior bind.ts: info buttons must not bubble into other handlers
  if (action === "info" || action === "info-close") {
    ev.preventDefault();
    ev.stopPropagation();
  }
  // DT month/year <select>: stop bubble so document "outside" does not close the popover
  // (same as former per-select click stopPropagation). Change still drives onAction via bind.
  if (action === "dt-set-month" || action === "dt-set-year") {
    ev.stopPropagation();
  }

  log.debug("portalEvents.click", { action });
  void onAction(o, ev);
}

/**
 * Step 3: delegated submit → data-form dispatch (replaces per-form submit re-bind).
 */
function onRootSubmit(o: AppOrchestrator, ev: Event): void {
  const form = (ev.target as HTMLElement | null)?.closest?.<HTMLFormElement>("form[data-form]");
  if (!form || !o.root.contains(form)) return;

  const kind = form.dataset.form ?? "";
  if (!kind) return;

  // Always prevent native navigation for portal forms
  ev.preventDefault();
  log.debug("portalEvents.submit", { form: kind });

  switch (kind) {
    case "login":
      void o.onLogin(form);
      return;
    case "share":
      void o.onShare(form);
      return;
    case "edit-event":
      void o.onSaveEvent(form);
      return;
    case "edit-cal":
      void o.onEditCal(form);
      return;
    case "create-cal":
      void o.onCreateCal(form);
      return;
    case "contact":
      void o.onSaveContact(form);
      return;
    case "create-ab":
      void o.onCreateAb(form);
      return;
    case "edit-ab":
      void o.onEditAb(form);
      return;
    case "task":
      void o.onSaveTask(form);
      return;
    case "note":
      void o.onSaveNote(form);
      return;
    case "files-rename":
      void files.onFilesRename(o.filesHost, form);
      return;
    case "files-transfer":
      void files.onFilesTransfer(o.filesHost, form);
      return;
    case "files-mkdir":
      void files.onFilesMkdir(o.filesHost, form);
      return;
    case "admin-user-create":
      void admin.onAdminUserCreate(o.adminHost, form);
      return;
    case "admin-user-edit":
      void admin.onAdminUserEdit(o.adminHost, form);
      return;
    case "admin-cal":
      void admin.onAdminCalSave(o.adminHost, form);
      return;
    case "admin-ab":
      void admin.onAdminAbSave(o.adminHost, form);
      return;
    case "admin-settings":
      void admin.onAdminSettingsSave(o.adminHost, form);
      return;
    case "admin-database":
      admin.onAdminDatabaseFormSubmit(o.adminHost, form);
      return;
    default:
      log.debug("portalEvents.submit.unknown", { form: kind });
  }
}

/**
 * Step 1 scaffold — real change map in Step 4.
 */
function onRootChange(o: AppOrchestrator, ev: Event): void {
  const el = ev.target as HTMLElement | null;
  if (!el || !o.root.contains(el)) return;
  const action = el.closest<HTMLElement>("[data-action]")?.dataset.action;
  if (action) log.debug("portalEvents.change.scaffold", { action });
  // Step 4: DT selects, delete confirms, admin-db-backend, task/note cal, etc.
}

/**
 * Step 1 scaffold — real input map in Step 4.
 */
function onRootInput(o: AppOrchestrator, ev: Event): void {
  const el = ev.target as HTMLElement | null;
  if (!el || !o.root.contains(el)) return;
  const action = el.closest<HTMLElement>("[data-action]")?.dataset.action;
  if (action) log.debug("portalEvents.input.scaffold", { action });
  // Step 4: search debounce, admin confirm/reset fields
}

/**
 * Step 1 scaffold — Enter/Space on rows in Step 5.
 */
function onRootKeydown(o: AppOrchestrator, ev: KeyboardEvent): void {
  if (ev.key !== "Enter" && ev.key !== " ") return;
  const row = (ev.target as HTMLElement | null)?.closest?.(
    "tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]",
  );
  if (!row || !o.root.contains(row as Node)) return;
  log.debug("portalEvents.keydown.scaffold", { action: (row as HTMLElement).dataset.action });
  // Step 5: preventDefault + row.click()
}

/**
 * Escape matrix — previously registered once inside bind() via escapeBound.
 * Priority order must match bind.ts (inventory §5).
 */
function onDocumentKeydown(o: AppOrchestrator, ev: KeyboardEvent): void {
  if (ev.key !== "Escape") return;
  const { state, render } = o;

  if (
    state.importProgress &&
    (state.importProgress.phase === "done" || state.importProgress.phase === "error")
  ) {
    o.closeImportProgress();
    return;
  }
  if (state.importProgress) return;
  if (
    state.filesUploadProgress &&
    (state.filesUploadProgress.phase === "done" || state.filesUploadProgress.phase === "error")
  ) {
    o.closeFilesUploadProgress();
    return;
  }
  if (state.filesUploadProgress) return;
  if (state.filesUploadMenuOpen) {
    state.filesUploadMenuOpen = false;
    o.unbindFilesUploadMenuOutside();
    render();
    return;
  }
  if (state.userMenuOpen) {
    state.userMenuOpen = false;
    o.unbindUserMenuOutside();
    render();
    return;
  }
  if (state.filesUploadConflict !== null) {
    files.resolveFilesUploadConflict(o.filesHost, "cancel");
    return;
  }
  if (
    state.filesRenamePath !== null ||
    state.filesDeletePaths !== null ||
    state.filesTransfer !== null ||
    state.filesMkdirOpen
  ) {
    state.filesRenamePath = null;
    state.filesDeletePaths = null;
    o.resetFilesTransferTree();
    state.filesMkdirOpen = false;
    render();
    return;
  }
  if (state.confirmDelete) {
    state.confirmDelete = null;
    render();
    return;
  }
  o.closeInfoModal();
  if (state.eventDtPicker) {
    state.eventDtPicker = null;
    unbindDtPickerOutside(state);
    render();
    return;
  }
  if (state.eventModalOpen) {
    state.eventModalOpen = false;
    state.editingEvent = null;
    state.creatingEvent = false;
    state.eventDtPicker = null;
    render();
    return;
  }
  if (state.contactModalOpen) {
    state.contactModalOpen = false;
    state.editingContact = null;
    state.creatingContact = false;
    state.photoPreview = null;
    state.photoBase64Pending = null;
    state.removePhotoPending = false;
    render();
    return;
  }
  if (state.abModalOpen) {
    state.abModalOpen = false;
    render();
    return;
  }
  if (
    state.calModalOpen ||
    state.createCalModalOpen ||
    state.deleteConfirmId !== null ||
    state.deleteAbConfirmId !== null
  ) {
    state.calModalOpen = false;
    state.createCalModalOpen = false;
    state.deleteConfirmId = null;
    state.deleteAbConfirmId = null;
    render();
    return;
  }
  if (
    state.adminUserCreateOpen ||
    state.adminUserEditOpen ||
    state.adminUserDeleteUsername !== null
  ) {
    state.adminUserCreateOpen = false;
    state.adminUserEditOpen = false;
    state.adminUserDeleteUsername = null;
    render();
    return;
  }
  if (state.adminResetModalOpen) {
    state.adminResetModalOpen = false;
    render();
    return;
  }
  if (state.adminDbConfirmOpen) {
    state.adminDbConfirmOpen = false;
    state.adminDbConfirmText = "";
    state.adminDbPendingBody = null;
    render();
    return;
  }
  if (
    state.adminCalModal !== null ||
    state.adminAbModal !== null ||
    state.adminResourceDelete !== null
  ) {
    state.adminCalModal = null;
    state.adminAbModal = null;
    state.adminResourceDelete = null;
    render();
  }
}
