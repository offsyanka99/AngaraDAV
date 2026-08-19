/**
 * Footer About dialog (logo, name, version, build, contact).
 */
import { esc } from "../ui";
import { splitAppVersion } from "./constants";
import type { AppState } from "./context";

export const ABOUT_CONTACT_EMAIL = "hummersoft@mailbox.org";
export const ABOUT_APP_NAME = "AngaraDAV";

export { splitAppVersion };

export function aboutModalHtml(state: AppState): string {
  const { version, build } = splitAppVersion(state.appVersion);
  const buildLabel = build || "—";
  return `
    <div class="info-modal" id="about-modal" hidden role="dialog" aria-modal="true" aria-labelledby="about-modal-title">
      <div class="info-modal-backdrop" data-action="about-close"></div>
      <div class="info-modal-card about-modal-card">
        <header class="info-modal-header">
          <h3 id="about-modal-title">About</h3>
          <button type="button" class="modal-close info-modal-close" data-action="about-close" aria-label="Close">×</button>
        </header>
        <div class="about-modal-body">
          <img class="about-logo" src="/logo.png" width="72" height="72" alt="" />
          <p class="about-name">${esc(ABOUT_APP_NAME)}</p>
          <dl class="about-meta">
            <div><dt>Version</dt><dd class="mono">${esc(version)}</dd></div>
            <div><dt>Build</dt><dd class="mono">${esc(buildLabel)}</dd></div>
            <div><dt>Contact</dt><dd><a href="mailto:${esc(ABOUT_CONTACT_EMAIL)}">${esc(ABOUT_CONTACT_EMAIL)}</a></dd></div>
          </dl>
        </div>
        <footer class="info-modal-footer">
          <button type="button" class="btn btn-primary" data-action="about-close">Close</button>
        </footer>
      </div>
    </div>`;
}

export function openAboutModal(root: HTMLElement): void {
  const modal = root.querySelector<HTMLElement>("#about-modal");
  if (!modal) return;
  modal.hidden = false;
  document.body.classList.add("info-modal-open");
  modal.querySelector<HTMLButtonElement>(".info-modal-close")?.focus();
}

export function closeAboutModal(root: HTMLElement): void {
  const modal = root.querySelector<HTMLElement>("#about-modal");
  if (!modal) return;
  modal.hidden = true;
  const info = root.querySelector<HTMLElement>("#info-modal");
  if (!info || info.hidden) document.body.classList.remove("info-modal-open");
}

export function aboutModalIsOpen(root: HTMLElement): boolean {
  const modal = root.querySelector<HTMLElement>("#about-modal");
  return !!modal && !modal.hidden;
}
