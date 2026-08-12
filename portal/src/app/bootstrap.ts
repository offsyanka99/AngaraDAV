/**
 * Portal bootstrap + post-login session restore (Phase 3 extract).
 */
import { api, ApiError, setOnSessionActivity, setOnUnauthorized } from "../api";
import { log } from "../log";
import type { FlashType } from "../ui";
import type { AppState } from "./context";
import { setFlash } from "./flash";
import {
  adminUiEnabled,
  applyInstallGateFromApiError,
  applyInstallGateFromStatus,
  applyPortalUi,
  bumpSessionIdleTimer,
  userIsAdmin,
} from "./session";
import type { AdminPageId, TabId } from "./types";

export type BootstrapDeps = {
  state: AppState;
  render: () => void;
  handleSessionExpired: (message?: string) => void;
  clearPortalSessionState: () => void;
  normalizeActiveTab: () => void;
  persistTab: (tab: TabId, adminPage?: AdminPageId, username?: string | null) => void;
  loadHome: () => Promise<void>;
  loadAdminCapabilities: () => Promise<void>;
  loadAdminDashboard: () => Promise<void>;
  loadAdminUsers: () => Promise<void>;
  loadAdminUserDetail: (username: string) => Promise<void>;
  loadAdminUserResources: (username: string) => Promise<void>;
  loadAdminSystemSettings: () => Promise<void>;
  loadAdminDatabaseSettings: () => Promise<void>;
  adminPageMeta: (page: AdminPageId) => { available?: boolean } | null;
};

async function loadAdminForActivePage(deps: BootstrapDeps): Promise<void> {
  const { state } = deps;
  if (!(state.activeTab === "admin" && userIsAdmin(state) && adminUiEnabled(state))) {
    return;
  }
  try {
    if (state.adminPage === "overview" && deps.adminPageMeta("overview")?.available !== false) {
      await deps.loadAdminDashboard();
    } else if (state.adminPage === "users" && deps.adminPageMeta("users")?.available !== false) {
      await deps.loadAdminUsers();
      if (state.adminSelectedUsername) {
        await deps.loadAdminUserDetail(state.adminSelectedUsername);
        await deps.loadAdminUserResources(state.adminSelectedUsername);
      }
    } else if (state.adminPage === "settings" && deps.adminPageMeta("settings")?.available !== false) {
      await deps.loadAdminSystemSettings();
    } else if (state.adminPage === "database" && deps.adminPageMeta("database")?.available !== false) {
      await deps.loadAdminDatabaseSettings();
    }
  } catch (e) {
    log.warn("admin page load", e instanceof Error ? e.message : e);
  }
}

export async function bootstrap(deps: BootstrapDeps): Promise<void> {
  const { state } = deps;
  log.event("bootstrap.start");
  setOnUnauthorized((msg) => {
    deps.handleSessionExpired(
      /timed\s*out|session expired/i.test(msg)
        ? msg
        : "Your session timed out. Please sign in again.",
    );
  });
  setOnSessionActivity(() => {
    bumpSessionIdleTimer(state, (m) => deps.handleSessionExpired(m));
  });
  // Install/upgrade status first (works even when /api/ui is blocked by upgrade gate)
  try {
    const st = await api.installStatus();
    applyInstallGateFromStatus(state, st);
  } catch (e) {
    log.debug("bootstrap: /api/install/status failed", e instanceof Error ? e.message : e);
  }
  // Public prefs first so log level works on the login screen
  try {
    const pub = await api.ui();
    applyPortalUi(state, pub.ui);
    if (typeof pub.version === "string" && pub.version.trim() !== "") {
      state.appVersion = pub.version.trim();
    } else if (pub.ui && typeof pub.ui.version === "string" && pub.ui.version.trim() !== "") {
      state.appVersion = pub.ui.version.trim();
    }
  } catch (e) {
    log.debug("bootstrap: /api/ui failed", e instanceof Error ? e.message : e);
    applyInstallGateFromApiError(state, e);
  }
  if (state.installGate && state.installGate.step !== "done" && state.installGate.step !== "locked") {
    // Block session restore until setup/upgrade finishes
    deps.clearPortalSessionState();
    log.event("bootstrap.installGate", { step: state.installGate.step });
    deps.render();
    return;
  }
  try {
    const me = await api.me();
    // Anonymous bootstrap returns HTTP 200 with user:null (no console 401).
    if (!me.user) {
      deps.clearPortalSessionState();
      applyPortalUi(state, me.ui);
      if (typeof me.version === "string" && me.version.trim() !== "") {
        state.appVersion = me.version.trim();
      }
      log.event("bootstrap.anonymous");
    } else {
      state.user = me.user;
      applyPortalUi(state, me.ui);
      if (typeof me.version === "string" && me.version.trim() !== "") {
        state.appVersion = me.version.trim();
      }
      log.event("bootstrap.session", { username: state.user?.username ?? null });
      bumpSessionIdleTimer(state, (m) => deps.handleSessionExpired(m));
      if (userIsAdmin(state)) {
        try {
          await deps.loadAdminCapabilities();
        } catch (e) {
          log.warn("admin.capabilities bootstrap", e instanceof Error ? e.message : e);
        }
      }
      deps.normalizeActiveTab();
      deps.persistTab(state.activeTab, state.adminPage);
      await deps.loadHome();
      await loadAdminForActivePage(deps);
    }
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) {
      // Legacy servers may still 401; treat as anonymous (no session-timeout flash).
      deps.clearPortalSessionState();
      log.event("bootstrap.anonymous");
    } else {
      log.error("bootstrap failed", e instanceof Error ? e.message : e);
      setFlash(state, "error", e instanceof Error ? e.message : "Failed to load");
    }
  }
  deps.render();
}

export type LoginDeps = BootstrapDeps & {
  setFlash: (type: FlashType, message: string) => void;
  clearFlash: () => void;
};

export async function onLogin(form: HTMLFormElement, deps: LoginDeps): Promise<void> {
  const { state } = deps;
  const fd = new FormData(form);
  const username = String(fd.get("username") ?? "");
  const password = String(fd.get("password") ?? "");
  state.busy = true;
  deps.clearFlash();
  deps.render();
  log.event("login.attempt", { username });
  try {
    const res = await api.login(username, password);
    state.user = res.user;
    applyPortalUi(state, res.ui);
    log.event("login.ok", { username: state.user?.username ?? username });
    bumpSessionIdleTimer(state, (m) => deps.handleSessionExpired(m));
    if (userIsAdmin(state)) {
      try {
        await deps.loadAdminCapabilities();
      } catch (e) {
        log.warn("admin.capabilities login", e instanceof Error ? e.message : e);
      }
    }
    deps.normalizeActiveTab();
    deps.persistTab(state.activeTab, state.adminPage);
    await deps.loadHome();
    await loadAdminForActivePage(deps);
    deps.setFlash("success", "Signed in");
  } catch (e) {
    log.warn("login.failed", e instanceof Error ? e.message : e);
    deps.setFlash("error", e instanceof Error ? e.message : "Login failed");
  } finally {
    state.busy = false;
    deps.render();
  }
}
