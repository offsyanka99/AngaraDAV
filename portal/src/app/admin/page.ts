/**
 * Admin page activation + section shell (Phase 5).
 */
import { log } from "../../log";
import type { AdminPageId } from "../types";
import type { AdminHost } from "./host";
import { adminPageMeta } from "./meta";
import {
  loadAdminCapabilities,
  loadAdminDashboard,
  loadAdminDatabaseSettings,
  loadAdminSubscriptions,
  loadAdminSystemSettings,
  loadAdminUserDetail,
  loadAdminUserResources,
  loadAdminUsers,
} from "./loaders";
import { renderAdminOverview } from "./overview";
import { renderAdminUsersShell } from "./users";
import { renderAdminSettingsShell } from "./settings";
import { renderAdminDatabaseShell } from "./database";
import { renderAdminConfigurationShell } from "./configuration";
import { renderAdminSubscriptionsShell } from "./subscriptions";

export async function activateAdminPage(
  host: AdminHost,
  page: AdminPageId,
  opts: { clearFlash?: boolean; username?: string | null } = {},
): Promise<void> {
  if (!host.userIsAdmin()) {
    await host.activateTab("calendars", opts);
    return;
  }
  host.state.activeTab = "admin";
  host.state.adminPage = page;
  if (page !== "subscriptions") {
    host.state.adminSubscriptionSelection = [];
  }
  if (page !== "users") {
    host.state.adminSelectedUsername = null;
    host.state.adminUserDetail = null;
    host.state.adminUserDetailError = null;
  } else if (opts.username !== undefined) {
    host.state.adminSelectedUsername = opts.username;
    if (!opts.username) {
      host.state.adminUserDetail = null;
      host.state.adminUserDetailError = null;
    }
  }
  host.state.userMenuOpen = false;
  host.persistTab("admin", page, host.state.adminSelectedUsername);
  log.event("tab", { tab: "admin", adminPage: page, user: host.state.adminSelectedUsername });
  if (opts.clearFlash !== false) host.clearFlash();
  host.state.busy = true;
  host.render();
  try {
    await loadAdminCapabilities(host);
    if (!host.adminUiEnabled()) {
      host.state.activeTab = "calendars";
      host.persistTab("calendars");
      host.setFlash(
        "info",
        "Portal Administration UI is disabled.",
      );
      return;
    }
    const meta = adminPageMeta(host, page);
    if (page === "overview" && meta?.available !== false) {
      await loadAdminDashboard(host);
    } else if (page === "users" && meta?.available !== false) {
      await loadAdminUsers(host);
      if (host.state.adminSelectedUsername) {
        await loadAdminUserDetail(host, host.state.adminSelectedUsername);
        await loadAdminUserResources(host, host.state.adminSelectedUsername);
      }
    } else if (page === "settings" && meta?.available !== false) {
      await loadAdminSystemSettings(host);
    } else if (page === "database" && meta?.available !== false) {
      await loadAdminDatabaseSettings(host);
    } else if (page === "subscriptions") {
      if (meta == null || meta.available === false) {
        host.state.adminPage = "overview";
        host.state.adminSubscriptionSelection = [];
        host.persistTab("admin", "overview", host.state.adminSelectedUsername);
        host.setFlash("info", "WebDAV-Push is off.");
        await loadAdminDashboard(host);
      } else {
        await loadAdminSubscriptions(host);
      }
    }
  } catch (e) {
    log.warn("admin page load failed", e instanceof Error ? e.message : e);
    host.setFlash("error", e instanceof Error ? e.message : "Failed to load");
  } finally {
    host.state.busy = false;
    host.render();
  }
}

export function renderAdminSection(host: AdminHost): string {
  if (!host.userIsAdmin()) {
    return `<div class="card"><p class="muted">You do not have permission to view Administration.</p></div>`;
  }
  if (!host.adminUiEnabled()) {
    return `<section class="card admin-coming-soon-card">
        <div class="admin-coming-soon-head">
          <span class="badge badge-off">Disabled</span>
          <h2 class="admin-coming-soon-title">Portal Administration</h2>
        </div>
        <p class="muted">
          The Administration UI is turned off
          (<span class="mono">system.portal_admin_ui_enabled</span>).
        </p>
      </section>`;
  }
  if (host.state.adminPage === "users") return renderAdminUsersShell(host);
  if (host.state.adminPage === "subscriptions") return renderAdminSubscriptionsShell(host);
  if (host.state.adminPage === "settings") return renderAdminSettingsShell(host);
  if (host.state.adminPage === "database") return renderAdminDatabaseShell(host);
  if (host.state.adminPage === "configuration") return renderAdminConfigurationShell(host);
  return renderAdminOverview(host);
}
