/**
 * Tab / admin hash routing helpers (Phase 8).
 */
import { ADMIN_PAGE_STORAGE_KEY, TAB_STORAGE_KEY } from "./constants";
import type { AdminPageId, TabId } from "./types";

export function parseTabId(raw: string | null | undefined): TabId | null {
  if (
    raw === "calendars" ||
    raw === "contacts" ||
    raw === "tasks" ||
    raw === "notes" ||
    raw === "files" ||
    raw === "admin"
  ) {
    return raw;
  }
  return null;
}

export function parseAdminPageId(raw: string | null | undefined): AdminPageId | null {
  if (
    raw === "overview" ||
    raw === "users" ||
    raw === "settings" ||
    raw === "database"
  ) {
    return raw;
  }
  return null;
}

/**
 * Parse location hash into portal tab + optional admin sub-page + user detail.
 * Supports #admin, #admin/overview, #admin/users, #admin/users/{username},
 * #admin/settings, #admin/database.
 */
export function parseLocationRoute(): {
  tab: TabId | null;
  adminPage: AdminPageId | null;
  adminUsername: string | null;
} {
  const raw = (typeof location !== "undefined" ? location.hash : "")
    .replace(/^#/, "")
    .split(/[?&]/)[0]
    .replace(/^\/+/, "");
  if (!raw) {
    return { tab: null, adminPage: null, adminUsername: null };
  }
  if (raw === "admin" || raw.startsWith("admin/")) {
    const parts = raw.split("/").filter(Boolean);
    const sub = parts[1] ?? "overview";
    const page = parseAdminPageId(sub) ?? "overview";
    let adminUsername: string | null = null;
    if (page === "users" && parts[2]) {
      try {
        adminUsername = decodeURIComponent(parts[2]);
      } catch {
        adminUsername = parts[2];
      }
    }
    return { tab: "admin", adminPage: page, adminUsername };
  }
  return { tab: parseTabId(raw), adminPage: null, adminUsername: null };
}

/** Restore tab after F5: prefer URL hash, then sessionStorage. */
export function readStoredTab(): TabId {
  const fromHash = parseLocationRoute().tab;
  if (fromHash) return fromHash;
  try {
    const fromStore = parseTabId(sessionStorage.getItem(TAB_STORAGE_KEY));
    if (fromStore) return fromStore;
  } catch {
    /* private mode / disabled storage */
  }
  return "calendars";
}

export function readStoredAdminPage(): AdminPageId {
  const fromHash = parseLocationRoute().adminPage;
  if (fromHash) return fromHash;
  try {
    const fromStore = parseAdminPageId(sessionStorage.getItem(ADMIN_PAGE_STORAGE_KEY));
    if (fromStore) return fromStore;
  } catch {
    /* ignore */
  }
  return "overview";
}

export function adminHash(page: AdminPageId, adminUsername: string | null = null): string {
  if (page === "overview") return "#admin";
  if (page === "users" && adminUsername) {
    return `#admin/users/${encodeURIComponent(adminUsername)}`;
  }
  return `#admin/${page}`;
}

export function persistTab(
  tab: TabId,
  adminPage: AdminPageId = "overview",
  adminUsername: string | null = null,
): void {
  try {
    sessionStorage.setItem(TAB_STORAGE_KEY, tab);
    if (tab === "admin") {
      sessionStorage.setItem(ADMIN_PAGE_STORAGE_KEY, adminPage);
    }
  } catch {
    /* ignore */
  }
  if (typeof history === "undefined" || typeof location === "undefined") return;
  const desired =
    tab === "admin" ? adminHash(adminPage, adminUsername) : `#${tab}`;
  if (location.hash !== desired) {
    history.replaceState(null, "", `${location.pathname}${location.search}${desired}`);
  }
}

