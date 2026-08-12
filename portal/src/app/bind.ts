/**
 * Post-render DOM bind. Called after every render().
 * Owned by registerPortalEvents: Escape (Step 1), click → onAction (Step 2).
 * Still re-binds: change/input/submit/keydown-rows/files drop/etc. until later steps.
 */
import type { AppOrchestrator } from "./orchestrator";
import { onAction } from "./onAction";
import * as files from "./files";
import * as admin from "./admin";
import * as calendars from "./calendars";
import { bindDtPickerOutside, unbindDtPickerOutside } from "./shell";

export function bind(o: AppOrchestrator) {
  const { state, root, render, setFlash } = o;

  // Click → onAction is delegated on root (events.ts Step 2).

  // Date picker month/year <select>s use change (not click) for onAction
  root
    .querySelectorAll<HTMLSelectElement>(
      'select[data-action="dt-set-month"], select[data-action="dt-set-year"]',
    )
    .forEach((sel) => {
      sel.addEventListener("change", (ev) => {
        ev.stopPropagation();
        void onAction(o, ev);
      });
    });
  o.unbindUserMenuOutside();
  if (state.userMenuOpen) {
    o.bindUserMenuOutside();
  }
  unbindDtPickerOutside(state);
  if (state.eventDtPicker) {
    bindDtPickerOutside(state, render);
  }
  o.unbindFilesUploadMenuOutside();
  if (state.filesUploadMenuOpen) {
    o.bindFilesUploadMenuOutside();
  }
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
    if (delSubmit) delSubmit.disabled = !delConfirm.checked || state.busy;
  });
  const delAbConfirm = root.querySelector<HTMLInputElement>("#delete-ab-confirm");
  const delAbSubmit = root.querySelector<HTMLButtonElement>("#delete-ab-submit");
  delAbConfirm?.addEventListener("change", () => {
    if (delAbSubmit) delAbSubmit.disabled = !delAbConfirm.checked || state.busy;
  });
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
  // Escape is registered once in registerPortalEvents (Step 1) — not re-bound here.

  // Forms use data-form="…" (not #id) — must match render templates
  const loginForm = root.querySelector<HTMLFormElement>('[data-form="login"]');
  loginForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    void o.onLogin(loginForm);
  });

  const shareForm = root.querySelector<HTMLFormElement>('[data-form="share"]');
  shareForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    void o.onShare(shareForm);
  });
  const eventForm = root.querySelector<HTMLFormElement>('[data-form="edit-event"]');
  eventForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    void o.onSaveEvent(eventForm);
  });
  eventForm
    ?.querySelectorAll<HTMLSelectElement>(
      'select[name="repeatFreq"], select[name="repeatEndMode"]',
    )
    .forEach((sel) => {
      sel.addEventListener("change", () => {
        if (!state.editingEvent) return;
        const fd = new FormData(eventForm);
        state.editingEvent = {
          ...state.editingEvent,
          repeat: calendars.readRepeatFromForm(fd),
          hasRrule: !!String(fd.get("repeatFreq") ?? "").trim(),
        };
        render();
      });
    });
  const editCalForm = root.querySelector<HTMLFormElement>('[data-form="edit-cal"]');
  editCalForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    void o.onEditCal(editCalForm);
  });
  if (editCalForm) o.bindColorPair(editCalForm);
  const createCalForm = root.querySelector<HTMLFormElement>('[data-form="create-cal"]');
  createCalForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    void o.onCreateCal(createCalForm);
  });
  if (createCalForm) o.bindColorPair(createCalForm);

  const contactForm = root.querySelector<HTMLFormElement>('[data-form="contact"]');
  contactForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    void o.onSaveContact(contactForm);
  });
  const createAbForm = root.querySelector<HTMLFormElement>('[data-form="create-ab"]');
  createAbForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    void o.onCreateAb(createAbForm);
  });
  const editAbForm = root.querySelector<HTMLFormElement>('[data-form="edit-ab"]');
  editAbForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    void o.onEditAb(editAbForm);
  });

  const taskForm = root.querySelector<HTMLFormElement>('[data-form="task"]');
  taskForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    void o.onSaveTask(taskForm);
  });
  // When calendar changes on create, keep draft fields and refresh parent options
  if (taskForm) {
    const calSelect = taskForm.querySelector<HTMLSelectElement>('select[name="instanceId"]');
    calSelect?.addEventListener("change", () => {
      if (!state.creatingTask || !state.editingTask) return;
      const id = Number(calSelect.value);
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
    });
  }
  const noteForm = root.querySelector<HTMLFormElement>('[data-form="note"]');
  noteForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    void o.onSaveNote(noteForm);
  });
  // Preserve note draft when calendar changes on create
  if (noteForm) {
    const calSelect = noteForm.querySelector<HTMLSelectElement>('select[name="instanceId"]');
    calSelect?.addEventListener("change", () => {
      if (!state.creatingNote || !state.editingNote) return;
      const id = Number(calSelect.value);
      if (!Number.isFinite(id) || id <= 0) return;
      o.syncEditingNoteFromForm(noteForm);
      state.editingNote = { ...state.editingNote, instanceId: id };
      render();
    });
  }

  const contactSearchInput = root.querySelector<HTMLInputElement>(
    'input[data-action="contact-search"]',
  );
  contactSearchInput?.addEventListener("input", () => {
    if (state.searchTimer) clearTimeout(state.searchTimer);
    state.searchTimer = setTimeout(() => {
      state.contactSearch = contactSearchInput.value;
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
  });
  const taskSearchInput = root.querySelector<HTMLInputElement>(
    'input[data-action="task-search"]',
  );
  taskSearchInput?.addEventListener("input", () => {
    if (state.searchTimer) clearTimeout(state.searchTimer);
    state.searchTimer = setTimeout(() => {
      state.taskSearch = taskSearchInput.value;
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
  });
  const noteSearchInput = root.querySelector<HTMLInputElement>(
    'input[data-action="note-search"]',
  );
  noteSearchInput?.addEventListener("input", () => {
    if (state.searchTimer) clearTimeout(state.searchTimer);
    state.searchTimer = setTimeout(() => {
      state.noteSearch = noteSearchInput.value;
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
  });

  const adminDbBackend = root.querySelector<HTMLSelectElement>(
    'select[data-action="admin-db-backend"]',
  );
  adminDbBackend?.addEventListener("change", () => {
    state.adminDbFormBackend = adminDbBackend.value === "pgsql" ? "pgsql" : "sqlite";
    render();
  });
  const adminDbConfirmInp = root.querySelector<HTMLInputElement>(
    'input[data-action="admin-db-confirm-input"]',
  );
  adminDbConfirmInp?.addEventListener("input", () => {
    state.adminDbConfirmText = adminDbConfirmInp.value;
    const btn = root.querySelector<HTMLButtonElement>(
      '[data-action="admin-db-confirm-save"]',
    );
    if (btn) {
      btn.disabled = state.busy || state.adminDbConfirmText.trim() !== "CONFIRM";
    }
  });
  const adminResetPw = root.querySelector<HTMLInputElement>(
    'input[data-action="admin-reset-password"]',
  );
  adminResetPw?.addEventListener("input", () => {
    state.adminResetPassword = adminResetPw.value;
    const btn = root.querySelector<HTMLButtonElement>(
      '[data-action="admin-reset-confirm"]',
    );
    if (btn) {
      btn.disabled =
        state.busy ||
        !state.adminResetConfirmChecked ||
        state.adminResetPassword.trim() === "";
    }
  });

  files.bindFilesDom(o.filesHost);
  admin.bindAdminDom(o.adminHost);
  o.bindImportInput();
  o.bindHolidaysToggle();
  o.bindContactPhotoInput();
}
