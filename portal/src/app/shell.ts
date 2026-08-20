/**
 * App chrome: topnav, tabs bar, footer, user menu (Phase 3 extract).
 */
import { esc } from "../ui";
import { aboutModalHtml } from "./about";
import { DOCS_URL } from "./constants";
import type { AppState } from "./context";
import { renderFlashBanner } from "./flash";
import { adminUiEnabled, userIsAdmin } from "./session";
import { userSettingsModalHtml } from "./userSettings";

export type ShellOpts = { auth?: boolean; tabs?: string };

export function shell(state: AppState, body: string, opts: ShellOpts = {}): string {
  const inAdmin =
    !!state.user && state.activeTab === "admin" && userIsAdmin(state) && adminUiEnabled(state);
  // Logo + wordmark: DAV blue; portal name after · is soft green (user) / soft red (admin)
  const portalName = inAdmin ? "Administration Portal" : "User Portal";
  const portalClass = inAdmin ? "brand-portal brand-portal-admin" : "brand-portal brand-portal-user";
  const brand = `
      <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
      <span class="brand-text">Angara<span class="brand-dav">DAV</span><span class="brand-sep" aria-hidden="true"> · </span><span class="${portalClass}">${esc(portalName)}</span></span>`;
  const displayName = state.user ? esc(state.user.displayname || state.user.username) : "";
  const adminMenuItem = adminUiEnabled(state)
    ? `<button type="button" class="user-menu-item${state.activeTab === "admin" ? " is-active" : ""}" role="menuitem" data-action="tab" data-tab="admin">
              Administration
            </button>`
    : "";
  const userPortalMenuItem = inAdmin
    ? `<button type="button" class="user-menu-item" role="menuitem" data-action="tab" data-tab="calendars">
              User portal
            </button>`
    : "";
  const userMenu = state.user
    ? `<div class="user-menu${state.userMenuOpen ? " is-open" : ""}">
            <button type="button" class="user-menu-trigger" data-action="user-menu-toggle"
              aria-haspopup="menu" aria-expanded="${state.userMenuOpen ? "true" : "false"}"
              title="${displayName}">
              <span class="user-menu-name">${displayName}</span>
              <span class="user-menu-caret" aria-hidden="true">▾</span>
            </button>
            <div class="user-menu-dropdown" role="menu" ${state.userMenuOpen ? "" : "hidden"}>
              ${userPortalMenuItem}
              ${adminMenuItem}
              <button type="button" class="user-menu-item" role="menuitem" data-action="user-settings-open">
                User settings
              </button>
              <div class="user-menu-sep" role="separator"></div>
              <button type="button" class="user-menu-item user-menu-item-danger" role="menuitem" data-action="logout">
                Log out
              </button>
            </div>
          </div>`
    : "";
  const nav = state.user
    ? `<nav class="topnav">
          <a class="brand" href="/portal/">${brand}</a>
          <div class="topnav-right">
            ${userMenu}
          </div>
        </nav>`
    : `<nav class="topnav">
          <a class="brand" href="/portal/">${brand}</a>
        </nav>`;

  // When calendar/event/contact/AB/files dialogs are open, keep flash off the main page
  // so banners do not appear above (or before) the modal.
  const flashOnMain = !(
    state.calModalOpen ||
    state.createCalModalOpen ||
    state.deleteConfirmId !== null ||
    state.deleteAbConfirmId !== null ||
    state.eventModalOpen ||
    state.contactModalOpen ||
    state.abModalOpen ||
    state.filesRenamePath !== null ||
    state.filesDeletePaths !== null ||
    state.filesTransfer !== null ||
    state.filesMkdirOpen ||
    state.filesPreview !== null ||
    state.filesUploadConflict !== null ||
    state.filesUploadProgress !== null ||
    state.confirmDelete !== null ||
    state.userSettingsOpen
  );
  const flashHtml = flashOnMain ? renderFlashBanner(state) : "";

  // Full-width sticky tab strip under topnav (same height for user + admin)
  const tabsBar =
    opts.tabs && opts.tabs.trim() !== ""
      ? `<div class="tabs-bar" role="presentation">
        <div class="tabs-bar-inner">
          ${opts.tabs}
        </div>
      </div>`
      : "";

  const footer = `
      <footer class="site-footer">
        <div class="container footer-inner">
          <span>AngaraDAV portal</span>
          <span class="footer-sep" aria-hidden="true">·</span>
          <button type="button" class="footer-link" data-action="about-open">About</button>
          <span class="footer-sep" aria-hidden="true">·</span>
          <a href="${esc(DOCS_URL)}" target="_blank" rel="noopener noreferrer">Docs</a>
        </div>
      </footer>
      ${aboutModalHtml(state)}
      ${userSettingsModalHtml(state)}`;

  // Preserve layout-* toggles applied after shell (e.g. layout-contacts); auth replaces them.
  if (opts.auth) {
    document.body.className = "layout-auth";
  } else {
    document.body.classList.remove("layout-auth");
  }

  // Single sticky chrome stack (topnav + tabs) so heights match user/admin
  // and content never scrolls under rounded tab corners.
  return `<div class="app-chrome">
      ${nav}
      ${tabsBar}
    </div>
      <main class="container">
        ${flashHtml}
        ${body}
      </main>
      ${footer}`;
}

export function unbindUserMenuOutside(state: AppState): void {
  if (state.userMenuDocClick) {
    document.removeEventListener("click", state.userMenuDocClick, true);
    state.userMenuDocClick = null;
  }
}

export function bindUserMenuOutside(state: AppState, render: () => void): void {
  unbindUserMenuOutside(state);
  state.userMenuDocClick = (ev: MouseEvent) => {
    const t = ev.target as HTMLElement | null;
    if (t?.closest?.(".user-menu")) return;
    state.userMenuOpen = false;
    unbindUserMenuOutside(state);
    render();
  };
  // Defer so the toggle click that opened the menu does not immediately close it
  const handler = state.userMenuDocClick;
  setTimeout(() => {
    if (state.userMenuOpen && state.userMenuDocClick === handler) {
      document.addEventListener("click", handler, true);
    }
  }, 0);
}

export function unbindDtPickerOutside(state: AppState): void {
  if (state.dtPickerDocClick) {
    document.removeEventListener("click", state.dtPickerDocClick, true);
    state.dtPickerDocClick = null;
  }
}

/** Close the portal date/time popover when the user clicks outside it. */
export function bindDtPickerOutside(state: AppState, render: () => void): void {
  unbindDtPickerOutside(state);
  if (!state.eventDtPicker) return;
  state.dtPickerDocClick = (ev: MouseEvent) => {
    const t = ev.target as HTMLElement | null;
    // Stay open for interactions inside the open field / popover (incl. month/year selects)
    if (t?.closest?.(".dt-field.is-open, .dt-popover, [data-dt-popover]")) return;
    // Opening another dt-open button is handled by onAction; don't double-close here first
    if (t?.closest?.('[data-action="dt-open"]')) return;
    state.eventDtPicker = null;
    unbindDtPickerOutside(state);
    render();
  };
  const handler = state.dtPickerDocClick;
  setTimeout(() => {
    if (state.eventDtPicker && state.dtPickerDocClick === handler) {
      document.addEventListener("click", handler, true);
    }
  }, 0);
}
