/** Tab navigation + loadHome (Phase 8). */
import { api } from "../api";
import type { DirectoryUser } from "../api";
import { log } from "../log";
import type { AdminPageId, TabId } from "./types";
import type { AppOrchestrator } from "./orchestrator";
import * as admin from "./admin";

export function normalizeActiveTab(o: AppOrchestrator): void {
  const { state } = o;
  if (state.activeTab === "admin" && (!o.userIsAdmin() || !o.adminUiEnabled())) {
    state.activeTab = "calendars";
    state.adminPage = "overview";
    o.persistTab(state.activeTab);
  }
}

export async function activateAdminPage(
  o: AppOrchestrator,
  page: AdminPageId,
  opts: { clearFlash?: boolean; username?: string | null } = {},
): Promise<void> {
  return admin.activateAdminPage(o.adminHost, page, opts);
}

export async function activateTab(
  o: AppOrchestrator,
  tab: TabId,
  opts: { clearFlash?: boolean } = {},
): Promise<void> {
  const { state, render, setFlash, clearFlash } = o;
  if (tab === "admin" && (!o.userIsAdmin() || !o.adminUiEnabled())) {
    if (o.userIsAdmin() && state.adminCapabilities && !state.adminCapabilities.uiEnabled) {
      setFlash("info", "Portal Administration UI is disabled (portal_admin_ui_enabled).");
    }
    tab = "calendars";
  }
  if (tab === "admin") {
    // Entering Administration from the user menu → Overview (or last hash page)
    await o.activateAdminPage(state.adminPage || "overview", {
      ...opts,
      username: state.adminPage === "users" ? state.adminSelectedUsername : null,
    });
    return;
  }
  state.activeTab = tab;
  state.userMenuOpen = false;
  o.persistTab(tab);
  log.event("tab", { tab });
  if (tab !== "calendars") {
    state.calModalOpen = false;
    state.deleteConfirmId = null;
  }
  if (tab !== "contacts") {
    state.deleteAbConfirmId = null;
  }
  if (opts.clearFlash !== false) clearFlash();
  state.busy = true;
  render();
  try {
    if (tab === "contacts" && state.selectedAbId !== null) {
      await o.loadContacts(state.selectedAbId);
    } else if (tab === "calendars") {
      await o.loadMonthEvents();
    } else if (tab === "tasks") {
      await o.loadTasks();
    } else if (tab === "notes") {
      await o.loadNotes();
    } else if (tab === "files") {
      await o.loadFiles();
    }
  } catch (e) {
    log.warn("tab load failed", e instanceof Error ? e.message : e);
    setFlash("error", e instanceof Error ? e.message : "Failed to load");
  } finally {
    state.busy = false;
    render();
  }
}

export async function loadHome(o: AppOrchestrator): Promise<void> {
  const { state } = o;
  log.debug("loadHome");
  const [cals, dir, abs] = await Promise.all([
    api.calendars(),
    api.directory().catch(() => ({ users: [] as DirectoryUser[] })),
    api.addressbooks(),
  ]);
  state.calendars = cals.calendars;
  state.directory = dir.users;
  state.addressBooks = abs.addressbooks;
  log.event("loadHome", {
    calendars: state.calendars.length,
    addressBooks: state.addressBooks.length,
    directory: state.directory.length,
  });
  if (state.holidayCountries.length === 0) {
    try {
      const hc = await api.holidayCountries();
      state.holidayCountries = hc.countries;
    } catch {
      state.holidayCountries = [];
    }
  }
  // Drop selections for calendars that no longer exist
  state.selectedIds = state.selectedIds.filter((id) => state.calendars.some((c) => c.id === id));
  if (state.selectedId !== null && !state.calendars.some((c) => c.id === state.selectedId)) {
    state.selectedId = null;
    state.shares = [];
    state.calModalOpen = false;
    state.deleteConfirmId = null;
  }
  if (state.selectedIds.length === 0) {
    const def = o.pickDefaultCalendar();
    if (def) {
      state.selectedIds = [def.id];
      state.selectedId = def.id;
    } else if (state.calendars.length > 0) {
      state.selectedIds = [state.calendars[0].id];
      state.selectedId = state.calendars[0].id;
    }
  }
  if (state.selectedId === null && state.selectedIds.length > 0) {
    state.selectedId = state.selectedIds[0];
  }
  if (state.selectedId !== null && state.calModalOpen) {
    await o.loadShares(state.selectedId);
  } else if (state.selectedId !== null) {
    state.shares = [];
  }
  if (state.activeTab === "calendars") {
    await o.loadMonthEvents();
  }
  if (state.selectedAbId !== null && !state.addressBooks.some((a) => a.id === state.selectedAbId)) {
    state.selectedAbId = null;
    state.contacts = [];
    state.selectedContactUri = null;
    state.editingContact = null;
    state.creatingContact = false;
  }
  if (
    state.deleteAbConfirmId !== null &&
    !state.addressBooks.some((a) => a.id === state.deleteAbConfirmId)
  ) {
    state.deleteAbConfirmId = null;
  }
  if (state.selectedAbId === null && state.addressBooks.length > 0) {
    state.selectedAbId = state.addressBooks[0].id;
  }
  if (state.selectedAbId !== null && state.activeTab === "contacts") {
    await o.loadContacts(state.selectedAbId);
  }
  if (state.activeTab === "tasks") {
    await o.loadTasks();
  }
  if (state.activeTab === "notes") {
    await o.loadNotes();
  }
  if (state.activeTab === "files") {
    await o.loadFiles();
  }
}
