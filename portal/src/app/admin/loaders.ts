/**
 * Admin API loaders (Phase 5).
 */
import { api } from "../../api";
import { log } from "../../log";
import type { AdminHost } from "./host";

export async function loadAdminCapabilities(host: AdminHost): Promise<void> {
  host.state.adminCapabilitiesError = null;
  try {
    const res = await api.adminCapabilities();
    host.state.adminCapabilities = res.data;
    log.debug("admin.capabilities", {
      uiEnabled: host.state.adminCapabilities.uiEnabled,
      pages: host.state.adminCapabilities.pages?.length ?? 0,
    });
  } catch (e) {
    host.state.adminCapabilitiesError = e instanceof Error ? e.message : "Failed to load capabilities";
    host.state.adminCapabilities = {
      uiEnabled: true,
      portalAdminUrl: "/portal/#admin",
      pages: [
        {
          id: "overview",
          label: "Overview",
          status: "full",
          available: true,
          portalUrl: "/portal/#admin",
          portalLabel: "Overview",
          summary: "Live counts and service flags.",
        },
        {
          id: "settings",
          label: "System settings",
          status: "full",
          available: true,
          portalUrl: "/portal/#admin/settings",
          portalLabel: "System settings",
          summary: "Edit system flags and admin password in the portal.",
        },
        {
          id: "users",
          label: "Users",
          status: "full",
          available: true,
          portalUrl: "/portal/#admin/users",
          portalLabel: "Users",
          summary: "Full DAV user CRUD plus calendars and address books.",
        },
        {
          id: "database",
          label: "Database",
          status: "full",
          available: true,
          portalUrl: "/portal/#admin/database",
          portalLabel: "Database",
          summary: "Connection settings; saves require typing CONFIRM.",
        },
      ],
    };
    log.warn("admin.capabilities fallback", host.state.adminCapabilitiesError);
  }
}

export async function loadAdminDashboard(host: AdminHost): Promise<void> {
  host.state.adminDashboardLoading = true;
  host.state.adminDashboardError = null;
  try {
    const res = await api.adminDashboard();
    host.state.adminDashboard = res.data;
    log.debug("admin.dashboard", {
      users: host.state.adminDashboard.users,
      calendars: host.state.adminDashboard.calendars,
    });
  } catch (e) {
    host.state.adminDashboard = null;
    host.state.adminDashboardError = e instanceof Error ? e.message : "Failed to load dashboard";
    throw e;
  } finally {
    host.state.adminDashboardLoading = false;
  }
}

export async function loadAdminUsers(host: AdminHost): Promise<void> {
  host.state.adminUsersLoading = true;
  host.state.adminUsersError = null;
  try {
    const res = await api.adminUsers();
    host.state.adminUsers = res.users ?? [];
    log.debug("admin.users", { count: host.state.adminUsers.length });
  } catch (e) {
    host.state.adminUsers = [];
    host.state.adminUsersError = e instanceof Error ? e.message : "Failed to load users";
    throw e;
  } finally {
    host.state.adminUsersLoading = false;
  }
}

export async function loadAdminUserDetail(host: AdminHost, username: string): Promise<void> {
  host.state.adminUserDetailLoading = true;
  host.state.adminUserDetailError = null;
  try {
    const res = await api.adminUser(username);
    host.state.adminUserDetail = res.user;
    host.state.adminSelectedUsername = res.user.username;
    log.debug("admin.user", { username: res.user.username });
  } catch (e) {
    host.state.adminUserDetail = null;
    host.state.adminUserDetailError = e instanceof Error ? e.message : "Failed to load user";
    throw e;
  } finally {
    host.state.adminUserDetailLoading = false;
  }
}

export async function loadAdminUserResources(host: AdminHost, username: string): Promise<void> {
  host.state.adminUserResourcesLoading = true;
  try {
    const [cals, abs] = await Promise.all([
      api.adminUserCalendars(username),
      api.adminUserAddressBooks(username),
    ]);
    host.state.adminUserCalendars = cals.calendars ?? [];
    host.state.adminUserAddressBooks = abs.addressbooks ?? [];
  } catch (e) {
    host.state.adminUserCalendars = [];
    host.state.adminUserAddressBooks = [];
    throw e;
  } finally {
    host.state.adminUserResourcesLoading = false;
  }
}

export async function loadAdminSystemSettings(host: AdminHost): Promise<void> {
  host.state.adminSystemSettingsLoading = true;
  host.state.adminSystemSettingsError = null;
  try {
    const res = await api.adminSystemSettings();
    host.state.adminSystemSettings = res.data;
  } catch (e) {
    host.state.adminSystemSettings = null;
    host.state.adminSystemSettingsError =
      e instanceof Error ? e.message : "Failed to load settings";
    throw e;
  } finally {
    host.state.adminSystemSettingsLoading = false;
  }
}

export async function loadAdminDatabaseSettings(host: AdminHost): Promise<void> {
  host.state.adminDatabaseSettingsLoading = true;
  host.state.adminDatabaseSettingsError = null;
  try {
    const res = await api.adminDatabaseSettings();
    host.state.adminDatabaseSettings = res.data;
    const b = (res.data.backend || "sqlite").toLowerCase();
    host.state.adminDbFormBackend = b === "pgsql" ? "pgsql" : "sqlite";
  } catch (e) {
    host.state.adminDatabaseSettings = null;
    host.state.adminDatabaseSettingsError =
      e instanceof Error ? e.message : "Failed to load database settings";
    throw e;
  } finally {
    host.state.adminDatabaseSettingsLoading = false;
  }
}
