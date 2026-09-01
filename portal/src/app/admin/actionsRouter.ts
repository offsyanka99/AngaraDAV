/**
 * Admin data-action router (Phase 5).
 */
import { api } from "../../api";
import { log } from "../../log";
import type { AdminPageId } from "../types";
import type { AdminHost } from "./host";
import { activateAdminPage } from "./page";
import {
  loadAdminDashboard,
  loadAdminDatabaseSettings,
  loadAdminSystemSettings,
  loadAdminUserDetail,
  loadAdminUserResources,
  loadAdminUsers,
} from "./loaders";
import { onAdminDatabaseTest } from "./database";
import {
  onAdminBackupDownload,
  onAdminRestoreApply,
  onAdminRestoreDiscard,
} from "./configuration";

function parseAdminPageId(raw: string | null | undefined): AdminPageId | null {
  if (
    raw === "overview" ||
    raw === "users" ||
    raw === "settings" ||
    raw === "database" ||
    raw === "configuration"
  ) {
    return raw;
  }
  return null;
}

/**
 * Handle an Administration action. Returns true if recognized.
 */
export async function handleAdminAction(
  host: AdminHost,
  action: string,
  t: HTMLElement,
  _ev: Event,
): Promise<boolean> {
  if (!action.startsWith("admin-")) return false;

if (action === "admin-page") {
  const page = parseAdminPageId(t.dataset.adminPage);
  if (page) {
    await activateAdminPage(host, page);
  }
  return true;
}
if (action === "admin-refresh") {
  if (!host.userIsAdmin() || host.state.activeTab !== "admin") return true;
  host.state.busy = true;
  host.clearFlash();
  host.render();
  try {
    await loadAdminDashboard(host);
    host.setFlash("success", "Overview refreshed");
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Refresh failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
  return true;
}
if (action === "admin-users-refresh") {
  if (!host.userIsAdmin() || host.state.activeTab !== "admin") return true;
  host.state.busy = true;
  host.clearFlash();
  host.render();
  try {
    await loadAdminUsers(host);
    if (host.state.adminSelectedUsername) {
      await loadAdminUserDetail(host, host.state.adminSelectedUsername);
    }
    host.setFlash("success", "Users refreshed");
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Refresh failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
  return true;
}
if (action === "admin-user-view") {
  const username = t.dataset.username ?? "";
  if (!username || !host.userIsAdmin()) return true;
  host.state.busy = true;
  host.clearFlash();
  host.state.adminSelectedUsername = username;
  host.state.adminPage = "users";
  host.persistTab("admin", "users", username);
  host.render();
  try {
    await loadAdminUserDetail(host, username);
    await loadAdminUserResources(host, username);
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Failed to load user");
  } finally {
    host.state.busy = false;
    host.render();
  }
  return true;
}
if (action === "admin-user-close") {
  host.state.adminSelectedUsername = null;
  host.state.adminUserDetail = null;
  host.state.adminUserDetailError = null;
  host.state.adminUserEditOpen = false;
  host.persistTab("admin", "users", null);
  host.render();
  return true;
}
if (action === "admin-user-create-open") {
  if (!host.userIsAdmin()) return true;
  host.state.adminUserCreateOpen = true;
  host.state.adminUserEditOpen = false;
  host.state.adminUserDeleteUsername = null;
  host.clearFlash();
  host.render();
  return true;
}
if (action === "admin-user-create-close") {
  host.state.adminUserCreateOpen = false;
  host.render();
  return true;
}
if (action === "admin-user-edit-open") {
  if (!host.userIsAdmin()) return true;
  const username = t.dataset.username ?? host.state.adminSelectedUsername ?? "";
  if (!username) return true;
  host.state.busy = true;
  host.clearFlash();
  host.state.adminUserCreateOpen = false;
  host.state.adminUserDeleteUsername = null;
  host.state.adminSelectedUsername = username;
  host.state.adminPage = "users";
  host.persistTab("admin", "users", username);
  host.render();
  try {
    if (!host.state.adminUserDetail || host.state.adminUserDetail.username.toLowerCase() !== username.toLowerCase()) {
      await loadAdminUserDetail(host, username);
    }
    host.state.adminUserEditOpen = true;
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Failed to load user");
  } finally {
    host.state.busy = false;
    host.render();
  }
  return true;
}
if (action === "admin-user-edit-close") {
  host.state.adminUserEditOpen = false;
  host.render();
  return true;
}
if (action === "admin-user-delete-open") {
  if (!host.userIsAdmin()) return true;
  const username = t.dataset.username ?? host.state.adminSelectedUsername ?? "";
  if (!username) return true;
  host.state.adminUserDeleteUsername = username;
  host.state.adminUserDeleteConfirmChecked = false;
  host.state.adminUserCreateOpen = false;
  host.state.adminUserEditOpen = false;
  host.clearFlash();
  host.render();
  return true;
}
if (action === "admin-user-delete-close") {
  host.state.adminUserDeleteUsername = null;
  host.state.adminUserDeleteConfirmChecked = false;
  host.render();
  return true;
}
if (action === "admin-user-delete-toggle") {
  const cb = t as HTMLInputElement;
  host.state.adminUserDeleteConfirmChecked = !!cb.checked;
  host.render();
  return true;
}
if (action === "admin-user-delete-confirm") {
  if (!host.userIsAdmin()) return true;
  const username = t.dataset.username ?? host.state.adminUserDeleteUsername ?? "";
  if (!username || !host.state.adminUserDeleteConfirmChecked) return true;
  host.state.busy = true;
  host.clearFlash();
  host.render();
  try {
    await api.adminDeleteUser(username, true);
    log.event("admin.user.delete", { username });
    host.state.adminUserDeleteUsername = null;
    host.state.adminUserDeleteConfirmChecked = false;
    host.state.adminUserEditOpen = false;
    if (host.state.adminSelectedUsername?.toLowerCase() === username.toLowerCase()) {
      host.state.adminSelectedUsername = null;
      host.state.adminUserDetail = null;
      host.state.adminUserCalendars = [];
      host.state.adminUserAddressBooks = [];
      host.persistTab("admin", "users", null);
    }
    await loadAdminUsers(host);
    host.setFlash("success", `Deleted user “${username}”`);
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Delete failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
  return true;
}
if (action === "admin-cal-create") {
  host.state.adminCalModal = "create";
  host.state.adminCalEditId = null;
  host.render();
  return true;
}
if (action === "admin-cal-edit") {
  host.state.adminCalModal = "edit";
  host.state.adminCalEditId = Number(t.dataset.id);
  host.render();
  return true;
}
if (action === "admin-cal-close") {
  host.state.adminCalModal = null;
  host.state.adminCalEditId = null;
  host.render();
  return true;
}
if (action === "admin-cal-delete") {
  host.state.adminResourceDelete = {
    kind: "calendar",
    id: Number(t.dataset.id),
    label: t.dataset.label ?? "calendar",
  };
  host.render();
  return true;
}
if (action === "admin-ab-create") {
  host.state.adminAbModal = "create";
  host.state.adminAbEditId = null;
  host.render();
  return true;
}
if (action === "admin-ab-edit") {
  host.state.adminAbModal = "edit";
  host.state.adminAbEditId = Number(t.dataset.id);
  host.render();
  return true;
}
if (action === "admin-ab-close") {
  host.state.adminAbModal = null;
  host.state.adminAbEditId = null;
  host.render();
  return true;
}
if (action === "admin-ab-delete") {
  host.state.adminResourceDelete = {
    kind: "addressbook",
    id: Number(t.dataset.id),
    label: t.dataset.label ?? "address book",
    force: false,
  };
  host.render();
  return true;
}
if (action === "admin-ab-force-toggle") {
  if (host.state.adminResourceDelete?.kind === "addressbook") {
    host.state.adminResourceDelete = {
      ...host.state.adminResourceDelete,
      force: !!(t as HTMLInputElement).checked,
    };
    host.render();
  }
  return true;
}
if (action === "admin-resource-delete-close") {
  host.state.adminResourceDelete = null;
  host.render();
  return true;
}
if (action === "admin-resource-delete-confirm") {
  if (!host.state.adminSelectedUsername || !host.state.adminResourceDelete) return true;
  const uname = host.state.adminSelectedUsername;
  const del = host.state.adminResourceDelete;
  host.state.busy = true;
  host.clearFlash();
  host.render();
  try {
    if (del.kind === "calendar") {
      await api.adminDeleteUserCalendar(uname, del.id, true);
    } else {
      await api.adminDeleteUserAddressBook(uname, del.id, true, !!del.force);
    }
    host.state.adminResourceDelete = null;
    await loadAdminUserResources(host, uname);
    await loadAdminUserDetail(host, uname);
    host.setFlash("success", "Deleted");
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Delete failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
  return true;
}
if (action === "admin-settings-refresh") {
  host.state.busy = true;
  host.clearFlash();
  host.render();
  try {
    await loadAdminSystemSettings(host);
    host.setFlash("success", "Settings reloaded");
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Reload failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
  return true;
}
if (action === "admin-reset-open") {
  host.state.adminResetModalOpen = true;
  host.state.adminResetConfirmChecked = false;
  host.state.adminResetPassword = "";
  host.clearFlash();
  host.render();
  return true;
}
if (action === "admin-reset-close") {
  host.state.adminResetModalOpen = false;
  host.state.adminResetConfirmChecked = false;
  host.state.adminResetPassword = "";
  host.render();
  return true;
}
if (action === "admin-reset-toggle") {
  const cb = t as HTMLInputElement;
  host.state.adminResetConfirmChecked = !!cb.checked;
  host.render();
  return true;
}
if (action === "admin-reset-password") {
  host.state.adminResetPassword = (t as HTMLInputElement).value;
  // Avoid full re-render on every keystroke; enable button via live value next confirm
  const btn = host.root.querySelector<HTMLButtonElement>(
    '[data-action="admin-reset-confirm"]',
  );
  if (btn) {
    btn.disabled = host.state.busy || !host.state.adminResetConfirmChecked || host.state.adminResetPassword.trim() === "";
  }
  return true;
}
if (action === "admin-reset-confirm") {
  if (!host.state.adminResetConfirmChecked) return true;
  if (host.state.adminResetPassword.trim() === "") {
    host.setFlash("error", "Re-enter your password to confirm Reset to Default");
    host.render();
    return true;
  }
  host.state.busy = true;
  host.clearFlash();
  host.render();
  try {
    const res = await api.adminResetToDefault(true, host.state.adminResetPassword);
    log.event("admin.settings.reset-to-default");
    host.state.adminResetModalOpen = false;
    host.state.adminResetConfirmChecked = false;
    host.state.adminResetPassword = "";
    const dest =
      res.redirectUrl && res.redirectUrl.startsWith("/")
        ? res.redirectUrl
        : "/portal/install/";
    window.location.assign(dest);
    return true;
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Reset failed");
    host.state.busy = false;
    host.render();
  }
  return true;
}
if (action === "admin-backup-download") {
  await onAdminBackupDownload(host);
  return true;
}
if (action === "admin-restore-discard") {
  onAdminRestoreDiscard(host);
  return true;
}
if (action === "admin-restore-apply") {
  await onAdminRestoreApply(host);
  return true;
}
if (action === "admin-database-refresh") {
  host.state.busy = true;
  host.clearFlash();
  host.render();
  try {
    await loadAdminDatabaseSettings(host);
    host.setFlash("success", "Database settings reloaded");
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Reload failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
  return true;
}
if (action === "admin-db-backend") {
  const sel = t as HTMLSelectElement;
  host.state.adminDbFormBackend = sel.value === "pgsql" ? "pgsql" : "sqlite";
  host.render();
  return true;
}
if (action === "admin-db-test") {
  const form = t.closest("form") as HTMLFormElement | null;
  void onAdminDatabaseTest(host, form);
  return true;
}
if (action === "admin-db-confirm-close") {
  host.state.adminDbConfirmOpen = false;
  host.state.adminDbConfirmText = "";
  host.state.adminDbPendingBody = null;
  host.render();
  return true;
}
if (action === "admin-db-confirm-input") {
  const inp = t as HTMLInputElement;
  host.state.adminDbConfirmText = inp.value;
  // Re-render only the button state lightly via full render
  host.render();
  // restore focus/cursor on the confirm field
  const el = host.root.querySelector<HTMLInputElement>('[data-action="admin-db-confirm-input"]');
  if (el) {
    el.focus();
    const len = el.value.length;
    el.setSelectionRange(len, len);
  }
  return true;
}
if (action === "admin-db-confirm-save") {
  if (host.state.adminDbConfirmText.trim() !== "CONFIRM" || !host.state.adminDbPendingBody) return true;
  host.state.busy = true;
  host.clearFlash();
  host.render();
  try {
    const body = { ...host.state.adminDbPendingBody, confirm: "CONFIRM" };
    const res = await api.adminUpdateDatabaseSettings(body);
    host.state.adminDatabaseSettings = res.data;
    host.state.adminDbConfirmOpen = false;
    host.state.adminDbConfirmText = "";
    host.state.adminDbPendingBody = null;
    const b = (res.data.backend || "sqlite").toLowerCase();
    host.state.adminDbFormBackend = b === "pgsql" ? "pgsql" : "sqlite";
    log.event("admin.database.save", { backend: res.data.backend });
    host.setFlash("success", "Database settings saved");
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Database save failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
  return true;
}

  return false;
}
