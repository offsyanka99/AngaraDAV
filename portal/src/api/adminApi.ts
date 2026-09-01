import { request, setCsrfToken } from "./client";
import type {
  AdminCapabilities,
  AdminDashboardStats,
  AdminDatabaseSettings,
  AdminSettingsBackup,
  AdminSettingsRestoreResult,
  AdminSystemSettings,
  AdminUserAddressBook,
  AdminUserCalendar,
  AdminUserDetail,
  AdminUserSummary,
  PortalUi,
  PortalUser,
} from "./types";


export const adminApi = {
  /** Admin authz smoke check (requires Admin role). */
  adminPing: () => request<{ ok: boolean; user: string }>("/admin/ping"),
  /** Read-only dashboard stats for Administration → Overview. */
  adminDashboard: () =>
    request<{ data: AdminDashboardStats }>("/admin/dashboard"),
  /** Feature gating map for Administration shell. */
  adminCapabilities: () =>
    request<{ data: AdminCapabilities }>("/admin/capabilities"),
  /** Admin users list (never digesta1). */
  adminUsers: () => request<{ users: AdminUserSummary[] }>("/admin/users"),
  /** Admin user detail. */
  adminUser: (username: string) =>
    request<{ user: AdminUserDetail }>(
      `/admin/users/${encodeURIComponent(username)}`,
    ),
  /** Create DAV user. */
  adminCreateUser: (body: {
    username: string;
    displayname: string;
    email: string;
    password: string;
    passwordConfirm: string;
  }) =>
    request<{ user: AdminUserDetail }>("/admin/users", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  /** Update displayname / email / optional password. */
  adminUpdateUser: (
    username: string,
    body: {
      displayname?: string;
      email?: string;
      password?: string;
      passwordConfirm?: string;
    },
  ) =>
    request<{ user: AdminUserDetail }>(
      `/admin/users/${encodeURIComponent(username)}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    ),
  /** Delete user (requires confirm: true). */
  adminDeleteUser: (username: string, confirm = true) =>
    request<{ ok: boolean; username: string }>(
      `/admin/users/${encodeURIComponent(username)}`,
      {
        method: "DELETE",
        body: JSON.stringify({ confirm }),
      },
    ),
  adminUserCalendars: (username: string) =>
    request<{ calendars: AdminUserCalendar[] }>(
      `/admin/users/${encodeURIComponent(username)}/calendars`,
    ),
  adminCreateUserCalendar: (
    username: string,
    body: {
      uri: string;
      displayname: string;
      description?: string;
      calendarcolor?: string;
      todos?: boolean;
      notes?: boolean;
    },
  ) =>
    request<{ calendar: AdminUserCalendar }>(
      `/admin/users/${encodeURIComponent(username)}/calendars`,
      { method: "POST", body: JSON.stringify(body) },
    ),
  adminUpdateUserCalendar: (
    username: string,
    instanceId: number,
    body: {
      displayname?: string;
      description?: string;
      calendarcolor?: string;
      todos?: boolean;
      notes?: boolean;
    },
  ) =>
    request<{ calendar: AdminUserCalendar }>(
      `/admin/users/${encodeURIComponent(username)}/calendars/${instanceId}`,
      { method: "PATCH", body: JSON.stringify(body) },
    ),
  adminDeleteUserCalendar: (
    username: string,
    instanceId: number,
    confirm = true,
  ) =>
    request<{ ok: boolean }>(
      `/admin/users/${encodeURIComponent(username)}/calendars/${instanceId}`,
      { method: "DELETE", body: JSON.stringify({ confirm }) },
    ),
  adminUserAddressBooks: (username: string) =>
    request<{ addressbooks: AdminUserAddressBook[] }>(
      `/admin/users/${encodeURIComponent(username)}/addressbooks`,
    ),
  adminCreateUserAddressBook: (
    username: string,
    body: { uri: string; displayname: string; description?: string },
  ) =>
    request<{ addressbook: AdminUserAddressBook }>(
      `/admin/users/${encodeURIComponent(username)}/addressbooks`,
      { method: "POST", body: JSON.stringify(body) },
    ),
  adminUpdateUserAddressBook: (
    username: string,
    id: number,
    body: { displayname?: string; description?: string },
  ) =>
    request<{ addressbook: AdminUserAddressBook }>(
      `/admin/users/${encodeURIComponent(username)}/addressbooks/${id}`,
      { method: "PATCH", body: JSON.stringify(body) },
    ),
  adminDeleteUserAddressBook: (
    username: string,
    id: number,
    confirm = true,
    force = false,
  ) =>
    request<{ ok: boolean }>(
      `/admin/users/${encodeURIComponent(username)}/addressbooks/${id}`,
      { method: "DELETE", body: JSON.stringify({ confirm, force }) },
    ),
  adminSystemSettings: () =>
    request<{ data: AdminSystemSettings }>("/admin/settings/system"),
  adminUpdateSystemSettings: (body: Record<string, unknown>) =>
    request<{ data: AdminSystemSettings }>("/admin/settings/system", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  /** Export the editable system settings as a portable JSON backup document. */
  adminSettingsBackup: () =>
    request<{ data: AdminSettingsBackup }>("/admin/settings/backup"),
  /**
   * Preview (dryRun: true) or apply (dryRun: false, confirm: true) a settings
   * backup document previously produced by adminSettingsBackup().
   */
  adminRestoreSettings: (
    backup: Record<string, unknown>,
    opts: { dryRun?: boolean; confirm?: boolean } = {},
  ) =>
    request<{ data: AdminSettingsRestoreResult }>("/admin/settings/restore", {
      method: "POST",
      body: JSON.stringify({
        backup,
        dryRun: !!opts.dryRun,
        confirm: !!opts.confirm,
      }),
    }),
  /** Factory reset: remove baikal.yaml + INSTALL_DISABLED; then open installer. Requires current password. */
  adminResetToDefault: (confirm = true, password = "") =>
    request<{ ok: boolean; redirectUrl: string; backupPath?: string | null }>(
      "/admin/settings/reset-to-default",
      {
        method: "POST",
        body: JSON.stringify({ confirm, password }),
      },
    ),
  /** Database connection summary (never password). */
  adminDatabaseSettings: () =>
    request<{ data: AdminDatabaseSettings }>("/admin/settings/database"),
  /** Live connection probe without writing YAML. */
  adminTestDatabaseConnection: (body: Record<string, unknown>) =>
    request<{ ok: boolean; backend: string; message: string }>(
      "/admin/settings/database/test",
      { method: "POST", body: JSON.stringify(body) },
    ),
  /** Update database settings — body must include confirm: "CONFIRM". */
  adminUpdateDatabaseSettings: (body: Record<string, unknown>) =>
    request<{ data: AdminDatabaseSettings }>("/admin/settings/database", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  me: async () => {
    const data = await request<{
      /** null when not signed in (anonymous bootstrap — HTTP 200, not 401). */
      user: PortalUser | null;
      csrfToken?: string | null;
      version: string | null;
      davPath: string;
      ui?: PortalUi;
    }>("/me");
    setCsrfToken(data.csrfToken || data.user?.csrfToken || "");
    return data;
  },
  login: async (username: string, password: string) => {
    const data = await request<{ user: PortalUser; ui?: PortalUi }>("/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    setCsrfToken(data.user?.csrfToken);
    return data;
  },
  logout: async () => {
    try {
      return await request<{ ok: boolean }>("/logout", { method: "POST" });
    } finally {
      setCsrfToken("");
    }
  },
};
