/**
 * Mount-time portal event registration (delegated-events plan).
 *
 * Steps 1–6: Escape, click, submit, change/input, row keydown, files drop, avatar error.
 * Still post-render: outside menus, indeterminate select-all, holidays initial sync.
 */
import { log } from "../log";
import {
  dataTransferHasFiles,
  itemsFromDropSnapshot,
  snapshotDataTransfer,
} from "../filesUploadPick";
import type { AppOrchestrator } from "./orchestrator";
import { onAction } from "./onAction";
import * as admin from "./admin";
import * as calendars from "./calendars";
import * as contacts from "./contacts";
import * as files from "./files";
import { aboutModalIsOpen, closeAboutModal } from "./about";
import { unbindDtPickerOutside } from "./shell";
import { closeUserSettings, persistUserSettings, readUserSettingsFromForm } from "./userSettings";
import { applyTheme } from "./theme";

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
  root.addEventListener("contextmenu", (ev) => onRootContextMenu(o, ev));
  root.addEventListener("submit", (ev) => onRootSubmit(o, ev));
  root.addEventListener("change", (ev) => onRootChange(o, ev));
  root.addEventListener("input", (ev) => onRootInput(o, ev));
  root.addEventListener("keydown", (ev) => onRootKeydown(o, ev));
  document.addEventListener("keydown", (ev) => onDocumentKeydown(o, ev));

  // Step 6: files drop (depth on state) + avatar error (capture)
  root.addEventListener("dragenter", (ev) => onRootDrag(o, "enter", ev as DragEvent));
  root.addEventListener("dragover", (ev) => onRootDrag(o, "over", ev as DragEvent));
  root.addEventListener("dragleave", (ev) => onRootDrag(o, "leave", ev as DragEvent));
  root.addEventListener("drop", (ev) => onRootDrag(o, "drop", ev as DragEvent));
  root.addEventListener("error", (ev) => onRootErrorCapture(o, ev), true);

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
  if (
    action === "info" ||
    action === "info-close" ||
    action === "about-open" ||
    action === "about-close" ||
    action === "user-settings-open" ||
    action === "user-settings-close"
  ) {
    ev.preventDefault();
    ev.stopPropagation();
  }
  // DT month/year <select>: stop bubble so document "outside" does not close the popover
  // (same as former per-select click stopPropagation). Change still drives onAction via bind.
  if (action === "dt-set-month" || action === "dt-set-year") {
    ev.stopPropagation();
  }

  if (
    action === "select-contact" ||
    action === "select-task" ||
    action === "select-note"
  ) {
    o.state.listKeyboardFocus = true;
  }

  log.debug("portalEvents.click", { action });
  void onAction(o, ev);
}

function onRootContextMenu(o: AppOrchestrator, ev: MouseEvent): void {
  const target = ev.target as HTMLElement | null;
  if (!target || !o.root.contains(target)) return;
  if (target.closest("#files-item-menu")) {
    ev.preventDefault();
    return;
  }
  const row = target.closest("tr.files-row") as HTMLElement | null;
  if (!row || !o.root.contains(row)) return;
  const path = row.dataset.path ?? "";
  if (!path || files.filesItemMenuBlocked(o.state)) return;
  ev.preventDefault();
  files.openFilesItemMenu(o.filesHost, path, { x: ev.clientX, y: ev.clientY, origin: "context" });
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
    case "user-settings": {
      const next = readUserSettingsFromForm(form);
      if ("error" in next) {
        o.state.userSettingsError = next.error;
        o.render();
        return;
      }
      persistUserSettings(next, o.state.user?.username ?? null);
      o.state.userSettings = next;
      o.state.userSettingsOpen = false;
      o.state.userSettingsError = null;
      applyTheme(next.theme);
      o.clearFlash();
      o.render();
      return;
    }
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
  if (action === "files-type-filter") {
    log.debug("portalEvents.change", { action });
    void onAction(o, ev);
    return;
  }
  if (action === "task-filter") {
    ev.stopPropagation();
    log.debug("portalEvents.change", { action });
    void onAction(o, ev);
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
    state.listKeyboardFocus = false;
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
    state.listKeyboardFocus = false;
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

  if (action === "files-search" && el instanceof HTMLInputElement) {
    if (state.searchTimer) clearTimeout(state.searchTimer);
    const value = el.value;
    state.searchTimer = setTimeout(() => {
      state.filesSearch = value;
      state.filesSearchFocus = true;
      render();
    }, 150);
    return;
  }

  if (action === "event-search" && el instanceof HTMLInputElement) {
    if (state.searchTimer) clearTimeout(state.searchTimer);
    const value = el.value;
    state.searchTimer = setTimeout(() => {
      state.eventSearch = value;
      state.eventSearchFocus = true;
      render();
    }, 150);
    return;
  }

  if (action === "note-search" && el instanceof HTMLInputElement) {
    state.listKeyboardFocus = false;
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

const LIST_ROW_SEL =
  'tr.contact-table-row[data-action="select-contact"], tr.contact-table-row[data-action="select-task"], tr.contact-table-row[data-action="select-note"]';
const ACTION_ROW_SEL =
  "tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]";

function listRowsForActiveTab(o: AppOrchestrator): HTMLElement[] {
  const { state, root } = o;
  let action = "";
  if (state.activeTab === "contacts") action = "select-contact";
  else if (state.activeTab === "tasks") action = "select-task";
  else if (state.activeTab === "notes") action = "select-note";
  else return [];
  return Array.from(
    root.querySelectorAll<HTMLElement>(`tr.contact-table-row[data-action="${action}"]`),
  );
}

function focusListRow(row: HTMLElement): void {
  row.focus({ preventScroll: false });
  row.scrollIntoView({ block: "nearest" });
}

/**
 * Contacts / Tasks / Notes: ↑↓ move focus, Enter/Space open record.
 * Also works from the list search box (↓ enters the table).
 */
function onRootKeydown(o: AppOrchestrator, ev: KeyboardEvent): void {
  const target = ev.target as HTMLElement | null;
  if (!target || !o.root.contains(target)) return;

  if (
    (ev.key === "ContextMenu" || (ev.key === "F10" && ev.shiftKey)) &&
    o.state.activeTab === "files"
  ) {
    const row = target.closest("tr.files-row") as HTMLElement | null;
    if (row && o.root.contains(row)) {
      const path = row.dataset.path ?? "";
      if (path) {
        ev.preventDefault();
        const btn = row.querySelector<HTMLElement>(".files-row-menu-btn");
        const r = (btn ?? row).getBoundingClientRect();
        files.openFilesItemMenu(o.filesHost, path, {
          x: r.right,
          y: r.bottom + 4,
          origin: "button",
        });
        return;
      }
    }
  }

  const tab = o.state.activeTab;
  const onListTab = tab === "contacts" || tab === "tasks" || tab === "notes";
  const inSearch =
    target instanceof HTMLInputElement &&
    (target.dataset.action === "contact-search" ||
      target.dataset.action === "task-search" ||
      target.dataset.action === "note-search");

  // Nested form fields (except list search) keep default keyboard behavior
  if (
    !inSearch &&
    target.closest("button, a, input, select, textarea, [contenteditable=true]") &&
    !target.matches(ACTION_ROW_SEL) &&
    !target.matches(LIST_ROW_SEL)
  ) {
    return;
  }

  // --- List table navigation ---
  if (
    onListTab &&
    (ev.key === "ArrowDown" ||
      ev.key === "ArrowUp" ||
      ev.key === "Home" ||
      ev.key === "End")
  ) {
    const rows = listRowsForActiveTab(o);
    if (rows.length === 0) return;

    const listRow = target.closest(LIST_ROW_SEL) as HTMLElement | null;
    o.state.listKeyboardFocus = true;
    ev.preventDefault();

    if (!listRow || inSearch) {
      // Enter table from search / outside: ↓/Home → first, ↑/End → last
      if (ev.key === "ArrowDown" || ev.key === "Home") {
        focusListRow(rows[0]);
      } else {
        focusListRow(rows[rows.length - 1]);
      }
      return;
    }

    const idx = rows.indexOf(listRow);
    if (idx < 0) return;
    if (ev.key === "Home") {
      focusListRow(rows[0]);
      return;
    }
    if (ev.key === "End") {
      focusListRow(rows[rows.length - 1]);
      return;
    }
    const next = ev.key === "ArrowDown" ? rows[idx + 1] : rows[idx - 1];
    if (next) focusListRow(next);
    return;
  }

  if (ev.key !== "Enter" && ev.key !== " ") return;
  const row = target.closest(ACTION_ROW_SEL) as HTMLElement | null;
  if (!row || !o.root.contains(row)) return;
  // Only when focus is on the row itself (not a nested button/input)
  if (
    ev.target !== row &&
    (ev.target as HTMLElement).closest("button, a, input, select, textarea")
  ) {
    return;
  }
  ev.preventDefault();
  if (
    row.dataset.action === "select-contact" ||
    row.dataset.action === "select-task" ||
    row.dataset.action === "select-note"
  ) {
    o.state.listKeyboardFocus = true;
  }
  log.debug("portalEvents.keydown.row", { action: row.dataset.action, key: ev.key });
  row.click();
}

/**
 * Step 6: files panel drag-and-drop on root (depth counter on state).
 */
function onRootDrag(o: AppOrchestrator, kind: "enter" | "over" | "leave" | "drop", ev: DragEvent): void {
  const { state, root } = o;
  if (state.activeTab !== "files" || state.busy || state.filesUploadProgress) return;
  if (!dataTransferHasFiles(ev.dataTransfer)) return;

  const zone = (ev.target as HTMLElement | null)?.closest?.<HTMLElement>("[data-files-drop-target]");
  if (!zone || !root.contains(zone)) {
    // Left the drop zone entirely
    if (kind === "leave" && state.filesDropDepth > 0) {
      const related = ev.relatedTarget as Node | null;
      const stillInside =
        related &&
        related instanceof Node &&
        root.querySelector("[data-files-drop-target]")?.contains(related);
      if (!stillInside) {
        state.filesDropDepth = 0;
        clearFilesDragUi(o);
      }
    }
    return;
  }

  if (kind === "enter") {
    ev.preventDefault();
    ev.stopPropagation();
    state.filesDropDepth += 1;
    setFilesDragUi(o, zone, true);
    return;
  }

  if (kind === "over") {
    ev.preventDefault();
    ev.stopPropagation();
    if (ev.dataTransfer) ev.dataTransfer.dropEffect = "copy";
    setFilesDragUi(o, zone, true);
    return;
  }

  if (kind === "leave") {
    ev.preventDefault();
    ev.stopPropagation();
    const related = ev.relatedTarget as Node | null;
    if (related && zone.contains(related)) {
      // Moving between children inside the drop target
      return;
    }
    state.filesDropDepth = Math.max(0, state.filesDropDepth - 1);
    if (state.filesDropDepth === 0) {
      setFilesDragUi(o, zone, false);
    }
    return;
  }

  // drop
  ev.preventDefault();
  ev.stopPropagation();
  state.filesDropDepth = 0;
  setFilesDragUi(o, zone, false);
  const dt = ev.dataTransfer;
  if (!dt || state.busy || state.filesUploadProgress) return;
  state.filesUploadMenuOpen = false;
  o.unbindFilesUploadMenuOutside();
  files.closeFilesItemMenu(o.filesHost);
  // CRITICAL: snapshot DataTransferItemList synchronously before any await —
  // Chromium drops all but the first item once the drop handler yields.
  const snap = snapshotDataTransfer(dt);
  log.event("files.drop.snapshot", {
    handles: snap.handlePromises.length,
    entries: snap.entries.filter(Boolean).length,
    files: snap.files.length,
  });
  void (async () => {
    try {
      const items = await itemsFromDropSnapshot(snap);
      log.event("files.drop.items", {
        count: items.length,
        sample: items.slice(0, 8).map((it) => it.relativePath),
      });
      if (items.length === 0) {
        o.setFlash("info", "Nothing to upload from that drop");
        o.render();
        return;
      }
      await files.startFilesUpload(o.filesHost, items);
    } catch (e) {
      o.setFlash("error", e instanceof Error ? e.message : "Drop failed");
      o.render();
    }
  })();
}

function setFilesDragUi(o: AppOrchestrator, dropTarget: HTMLElement, on: boolean): void {
  if (o.state.filesUploadDropActive === on) {
    dropTarget.classList.toggle("is-dragover", on);
    return;
  }
  o.state.filesUploadDropActive = on;
  dropTarget.classList.toggle("is-dragover", on);
}

function clearFilesDragUi(o: AppOrchestrator): void {
  o.state.filesUploadDropActive = false;
  o.root.querySelectorAll("[data-files-drop-target].is-dragover").forEach((el) => {
    el.classList.remove("is-dragover");
  });
}

/**
 * Step 6: contact avatar load error (capture — error does not bubble).
 */
function onRootErrorCapture(_o: AppOrchestrator, ev: Event): void {
  const img = ev.target;
  if (!(img instanceof HTMLImageElement)) return;
  if (!img.classList.contains("contact-avatar")) return;
  if (!img.dataset.avatarFallback) return;
  if (!img.isConnected) return;

  const letter = img.dataset.avatarFallback || "?";
  const span = document.createElement("span");
  span.className = "contact-avatar contact-avatar-fallback";
  span.setAttribute("aria-hidden", "true");
  span.textContent = letter;
  img.replaceWith(span);
}

/**
 * Escape matrix — previously registered once inside bind() via escapeBound.
 * Priority order must match bind.ts (inventory §5).
 */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapTabInOpenModal(root: HTMLElement, ev: KeyboardEvent): void {
  if (ev.key !== "Tab") return;
  const modal = root.querySelector<HTMLElement>(".cal-modal[data-focus-trap]");
  if (!modal) return;
  const nodes = [...modal.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    (el) => el.offsetParent !== null || el === document.activeElement,
  );
  if (nodes.length === 0) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  const active = document.activeElement as HTMLElement | null;
  if (!ev.shiftKey && active === last) {
    ev.preventDefault();
    first.focus();
  } else if (ev.shiftKey && (active === first || !modal.contains(active))) {
    ev.preventDefault();
    last.focus();
  }
}

function onDocumentKeydown(o: AppOrchestrator, ev: KeyboardEvent): void {
  trapTabInOpenModal(o.root, ev);
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
  if (state.filesItemMenu) {
    files.closeFilesItemMenu(o.filesHost);
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
  if (state.filesPreview !== null) {
    files.closeFilesPreview(o.filesHost);
    render();
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
  // About / info modals stack above other dialogs — close only them first
  if (state.userSettingsOpen) {
    closeUserSettings(state);
    render();
    return;
  }
  if (aboutModalIsOpen(o.root)) {
    closeAboutModal(o.root);
    return;
  }
  const infoModal = o.root.querySelector<HTMLElement>("#info-modal");
  if (infoModal && !infoModal.hidden) {
    o.closeInfoModal();
    return;
  }
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
