/**
 * Shell / chrome data-action router (onAction split Step 1).
 * Owns: import progress close, logout, info, flash, user menu, tabs,
 * themed confirm-delete (event/task/note/contact/bulk/revoke).
 */
import { api } from "../api";
import { log } from "../log";
import { closeAboutModal, openAboutModal } from "./about";
import { closeConfirmDelete } from "./confirmDelete";
import type { AppOrchestrator } from "./orchestrator";
import { parseTabId } from "./routing";
import * as contacts from "./contacts";
import * as notes from "./notes";
import { applyTheme, parseTheme } from "./theme";
import { closeUserSettings } from "./userSettings";
/**
 * Handle shell-level actions. Returns true if the action was recognized
 * (even when it is a no-op, e.g. close-import-progress while import is running).
 */
export async function handleShellAction(
  o: AppOrchestrator,
  action: string,
  t: HTMLElement,
  ev: Event,
): Promise<boolean> {
  const { state, render, clearFlash, setFlash } = o;

  if (action === "confirm-delete-cancel") {
    closeConfirmDelete(state);
    render();
    return true;
  }

  if (action === "confirm-delete-ok") {
    const pending = state.confirmDelete;
    if (!pending) {
      render();
      return true;
    }
    const scope = pending.scope;
    closeConfirmDelete(state);

    if (scope === "event") {
      if (!state.editingEvent || !state.editingEvent.canWrite || state.creatingEvent) {
        render();
        return true;
      }
      const inst = state.editingEvent.instanceId;
      const uri = state.editingEvent.uri;
      state.busy = true;
      clearFlash();
      render();
      try {
        await api.deleteEvent(inst, uri);
        state.eventModalOpen = false;
        state.editingEvent = null;
        await o.loadMonthEvents();
        setFlash("success", "Event deleted");
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Delete failed");
      } finally {
        state.busy = false;
        render();
      }
      return true;
    }

    if (scope === "task") {
      if (!state.editingTask || state.creatingTask) {
        render();
        return true;
      }
      state.busy = true;
      clearFlash();
      render();
      try {
        await api.deleteTask(state.editingTask.instanceId, state.editingTask.uri);
        state.selectedTaskKey = null;
        state.editingTask = null;
        state.creatingTask = false;
        state.taskModalOpen = false;
        await o.loadTasks();
        setFlash("success", "Task deleted");
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Delete failed");
      } finally {
        state.busy = false;
        render();
      }
      return true;
    }

    if (scope === "note") {
      if (!state.editingNote || state.creatingNote) {
        render();
        return true;
      }
      state.busy = true;
      clearFlash();
      render();
      try {
        await api.deleteNote(state.editingNote.instanceId, state.editingNote.uri);
        state.selectedNoteKey = null;
        state.editingNote = null;
        state.creatingNote = false;
        state.noteModalOpen = false;
        await o.loadNotes();
        setFlash("success", "Note deleted");
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Delete failed");
      } finally {
        state.busy = false;
        render();
      }
      return true;
    }

    if (scope === "contact") {
      if (state.selectedAbId === null || !state.selectedContactUri) {
        render();
        return true;
      }
      state.busy = true;
      clearFlash();
      state.contactModalOpen = true;
      render();
      try {
        await api.deleteContact(state.selectedAbId, state.selectedContactUri);
        state.selectedContactUri = null;
        state.editingContact = null;
        state.creatingContact = false;
        state.contactModalOpen = false;
        state.eventDtPicker = null;
        state.photoPreview = null;
        await o.loadHome();
        setFlash("success", "Contact deleted");
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Delete failed");
      } finally {
        state.busy = false;
        render();
      }
      return true;
    }

    if (scope === "bulk-task") {
      await o.runBulkTaskAction("bulk-task-delete");
      return true;
    }

    if (scope === "bulk-note") {
      await notes.runBulkNoteAction(o.notesHost, "delete");
      return true;
    }

    if (scope === "bulk-contact") {
      await contacts.runBulkContactAction(o.contactsHost, "delete");
      return true;
    }

    if (scope === "revoke-share") {
      const href = pending.href ?? "";
      if (!href || state.selectedId === null) {
        render();
        return true;
      }
      state.calModalOpen = true;
      state.busy = true;
      clearFlash();
      render();
      try {
        await api.revoke(state.selectedId, href);
        await o.loadShares(state.selectedId);
        setFlash("success", "Share revoked");
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Revoke failed");
      } finally {
        state.busy = false;
        render();
      }
      return true;
    }

    render();
    return true;
  }

  if (action === "close-import-progress") {
    if (
      state.importProgress &&
      (state.importProgress.phase === "done" || state.importProgress.phase === "error")
    ) {
      o.closeImportProgress();
    }
    return true;
  }

  if (action === "logout") {
    state.busy = true;
    log.event("logout");
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    o.clearPortalSessionState();
    clearFlash();
    render();
    return true;
  }

  if (action === "info") {
    const key = t.dataset.info ?? "";
    o.openInfoModal(key);
    return true;
  }

  if (action === "info-close") {
    o.closeInfoModal();
    return true;
  }

  if (action === "about-open") {
    ev.preventDefault();
    openAboutModal(o.root);
    return true;
  }

  if (action === "about-close") {
    ev.preventDefault();
    closeAboutModal(o.root);
    return true;
  }

  if (action === "flash-close") {
    clearFlash();
    render();
    return true;
  }

  if (action === "user-settings-open") {
    state.userMenuOpen = false;
    state.userSettingsOpen = true;
    state.userSettingsError = null;
    render();
    return true;
  }

  if (action === "user-settings-close") {
    closeUserSettings(state);
    render();
    return true;
  }

  if (action === "set-theme") {
    const theme = parseTheme(t.dataset.theme);
    if (theme) {
      applyTheme(theme);
      if (state.userSettingsOpen) {
        return true;
      }
      render();
    }
    return true;
  }

  if (action === "user-menu-toggle") {
    ev.stopPropagation();
    state.userMenuOpen = !state.userMenuOpen;
    render();
    return true;
  }

  if (action === "user-menu-close") {
    if (state.userMenuOpen) {
      state.userMenuOpen = false;
      render();
    }
    return true;
  }

  if (action === "tab") {
    const tab = parseTabId(t.dataset.tab);
    if (tab) {
      if (tab === "admin") {
        // User menu → Administration: land on Overview
        state.adminPage = "overview";
      }
      await o.activateTab(tab);
    }
    return true;
  }

  return false;
}
