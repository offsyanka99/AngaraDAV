/**
 * Mount-time portal event registration (delegated-events plan).
 *
 * Step 1: Escape · Step 2: click · Step 3: submit · Step 4: change + input
 * Still post-render: row keydown, files drop, avatar error, outside menus.
 */
import { log } from "../log";
import type { AppOrchestrator } from "./orchestrator";
import { onAction } from "./onAction";
import * as admin from "./admin";
import * as calendars from "./calendars";
import * as contacts from "./contacts";
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
 * Step 4: delegated change (DT, deletes, imports, photos, cal selects, color, holidays…).
 */
function onRootChange(o: AppOrchestrator, ev: Event): void {
  const el = ev.target as HTMLElement | null;
  if (!el || !o.root.contains(el)) return;
  const { state, root, render } = o;

  // --- data-action controls ---
  const actionEl = el.closest<HTMLElement>("[data-action]");
  const action = actionEl?.dataset.action ?? "";

  if (action === "dt-set-month" || action === "dt-set-year") {
    ev.stopPropagation();
    log.debug("portalEvents.change", { action });
    void onAction(o, ev);
    return;
  }

  if (action === "admin-db-backend" && el instanceof HTMLSelectElement) {
    state.adminDbFormBackend = el.value === "pgsql" ? "pgsql" : "sqlite";
    render();
    return;
  }

  if (action === "files-upload-pick-files" && el instanceof HTMLInputElement) {
    files.onFilesUploadInput(o.filesHost, el, false);
    return;
  }
  if (action === "files-upload-pick-folder" && el instanceof HTMLInputElement) {
    files.onFilesUploadInput(o.filesHost, el, true);
    return;
  }

  if (action === "import-cal" && el instanceof HTMLInputElement) {
    void calendars.onImportFile(o.calendarsHost, el);
    return;
  }
  if (action === "import-create-cal" && el instanceof HTMLInputElement) {
    void calendars.onImportCreateCal(o.calendarsHost, el);
    return;
  }
  if (action === "import-ab" && el instanceof HTMLInputElement) {
    void o.calendarsHost.onImportContacts(el);
    return;
  }
  if (action === "contact-photo" && el instanceof HTMLInputElement) {
    void contacts.onContactPhotoPicked(o.contactsHost, el);
    return;
  }

  // Delete calendar / address book confirm checkboxes
  if (el instanceof HTMLInputElement && el.id === "delete-cal-confirm") {
    const delSubmit = root.querySelector<HTMLButtonElement>("#delete-cal-submit");
    if (delSubmit) delSubmit.disabled = !el.checked || state.busy;
    return;
  }
  if (el instanceof HTMLInputElement && el.id === "delete-ab-confirm") {
    const delAbSubmit = root.querySelector<HTMLButtonElement>("#delete-ab-submit");
    if (delAbSubmit) delAbSubmit.disabled = !el.checked || state.busy;
    return;
  }

  // Event repeat selects
  if (
    el instanceof HTMLSelectElement &&
    (el.name === "repeatFreq" || el.name === "repeatEndMode")
  ) {
    const eventForm = el.closest<HTMLFormElement>('[data-form="edit-event"]');
    if (eventForm && state.editingEvent) {
      const fd = new FormData(eventForm);
      state.editingEvent = {
        ...state.editingEvent,
        repeat: calendars.readRepeatFromForm(fd),
        hasRrule: !!String(fd.get("repeatFreq") ?? "").trim(),
      };
      render();
    }
    return;
  }

  // Task / note calendar select while creating
  if (el instanceof HTMLSelectElement && el.name === "instanceId") {
    const taskForm = el.closest<HTMLFormElement>('[data-form="task"]');
    if (taskForm && state.creatingTask && state.editingTask) {
      const id = Number(el.value);
      if (!Number.isFinite(id) || id <= 0) return;
      o.syncEditingTaskFromForm(taskForm);
      const parentUid = state.editingTask.parentUid;
      state.editingTask = {
        ...state.editingTask,
        instanceId: id,
        parentUid:
          parentUid &&
          state.tasks.some((x) => x.uid === parentUid && x.instanceId === id)
            ? parentUid
            : null,
      };
      render();
      return;
    }
    const noteForm = el.closest<HTMLFormElement>('[data-form="note"]');
    if (noteForm && state.creatingNote && state.editingNote) {
      const id = Number(el.value);
      if (!Number.isFinite(id) || id <= 0) return;
      o.syncEditingNoteFromForm(noteForm);
      state.editingNote = { ...state.editingNote, instanceId: id };
      render();
      return;
    }
  }

  // Create-cal holidays checkbox
  if (
    el instanceof HTMLInputElement &&
    el.name === "holidays" &&
    el.closest('[data-form="create-cal"]')
  ) {
    calendars.syncHolidaysToggle(o.calendarsHost);
    return;
  }

  // Color hex text field
  if (el instanceof HTMLInputElement && el.name === "color") {
    const form = el.closest("form");
    const picker = form?.querySelector<HTMLInputElement>('input[name="color_picker"]');
    if (picker) {
      let v = el.value.trim();
      if (v && !v.startsWith("#")) v = `#${v}`;
      if (/^#[0-9A-Fa-f]{6}/.test(v)) {
        picker.value = v.slice(0, 7);
        el.value = v.toUpperCase();
      }
    }
    return;
  }
}

/**
 * Step 4: delegated input (search debounce, admin live fields, color picker).
 */
function onRootInput(o: AppOrchestrator, ev: Event): void {
  const el = ev.target as HTMLElement | null;
  if (!el || !o.root.contains(el)) return;
  const { state, root, render, setFlash } = o;

  // Color picker → hex text
  if (el instanceof HTMLInputElement && el.name === "color_picker") {
    const form = el.closest("form");
    const text = form?.querySelector<HTMLInputElement>('input[name="color"]');
    if (text) text.value = el.value.toUpperCase();
    return;
  }

  const action = el.closest<HTMLElement>("[data-action]")?.dataset.action ?? "";

  if (action === "contact-search" && el instanceof HTMLInputElement) {
    if (state.searchTimer) clearTimeout(state.searchTimer);
    const value = el.value;
    state.searchTimer = setTimeout(() => {
      state.contactSearch = value;
      void (async () => {
        try {
          if (state.selectedAbId !== null) await o.loadContacts(state.selectedAbId);
          render();
        } catch (e) {
          setFlash("error", e instanceof Error ? e.message : "Search failed");
          render();
        }
      })();
    }, 250);
    return;
  }

  if (action === "task-search" && el instanceof HTMLInputElement) {
    if (state.searchTimer) clearTimeout(state.searchTimer);
    const value = el.value;
    state.searchTimer = setTimeout(() => {
      state.taskSearch = value;
      void (async () => {
        try {
          await o.loadTasks();
          render();
        } catch (e) {
          setFlash("error", e instanceof Error ? e.message : "Search failed");
          render();
        }
      })();
    }, 250);
    return;
  }

  if (action === "note-search" && el instanceof HTMLInputElement) {
    if (state.searchTimer) clearTimeout(state.searchTimer);
    const value = el.value;
    state.searchTimer = setTimeout(() => {
      state.noteSearch = value;
      void (async () => {
        try {
          await o.loadNotes();
          render();
        } catch (e) {
          setFlash("error", e instanceof Error ? e.message : "Search failed");
          render();
        }
      })();
    }, 250);
    return;
  }

  if (action === "admin-db-confirm-input" && el instanceof HTMLInputElement) {
    state.adminDbConfirmText = el.value;
    const btn = root.querySelector<HTMLButtonElement>('[data-action="admin-db-confirm-save"]');
    if (btn) {
      btn.disabled = state.busy || state.adminDbConfirmText.trim() !== "CONFIRM";
    }
    return;
  }

  if (action === "admin-reset-password" && el instanceof HTMLInputElement) {
    state.adminResetPassword = el.value;
    const btn = root.querySelector<HTMLButtonElement>('[data-action="admin-reset-confirm"]');
    if (btn) {
      btn.disabled =
        state.busy ||
        !state.adminResetConfirmChecked ||
        state.adminResetPassword.trim() === "";
    }
    return;
  }
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
