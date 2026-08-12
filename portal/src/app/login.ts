/**
 * Sign-in screen HTML (Phase 3 extract).
 * Submit handling lives in onLogin (bootstrap/login flow) via app.ts wiring.
 */
import { esc } from "../ui";
import type { AppState } from "./context";
import type { ShellOpts } from "./shell";

export function renderLogin(
  root: HTMLElement,
  state: AppState,
  shellFn: (body: string, opts?: ShellOpts) => string,
): void {
  const gate = state.installGate;
  const upgrade =
    gate &&
    (gate.step === "upgrade" ||
      gate.step === "initialize" ||
      gate.step === "permissions" ||
      gate.step === "database");
  const installUrl = gate?.installUrl || "/portal/install/";
  let gateBanner = "";
  if (upgrade && gate) {
    const title = gate.step === "upgrade" ? "Server upgrade required" : "Setup incomplete";
    const versions =
      gate.step === "upgrade" && (gate.configuredVersion || gate.productVersion)
        ? `<p class="muted small" style="margin:0.5rem 0 0">Configured <span class="mono">${esc(String(gate.configuredVersion || "—"))}</span>
              → product <span class="mono">${esc(String(gate.productVersion || "—"))}</span></p>`
        : "";
    gateBanner = `
        <div class="flash flash-error" role="alert" style="margin-bottom:1rem">
          <span class="flash-text">
            <strong>${esc(title)}.</strong>
            ${esc(gate.message || "Complete the installer before signing in.")}
            ${versions}
          </span>
        </div>
        <p style="margin:0 0 1rem">
          <a class="btn btn-primary" href="${esc(installUrl)}">Open installer</a>
        </p>`;
  }
  const loginDisabled = state.busy || !!upgrade;
  root.innerHTML = shellFn(
    `<div class="auth-wrap">
        <div class="card auth-card">
          <h1>Sign in</h1>
          ${gateBanner}
          <p class="muted">Use your AngaraDAV <strong>DAV user</strong> credentials.</p>
          <form class="stack" data-form="login">
            <label>
              Username
              <input type="text" name="username" autocomplete="username" required ${loginDisabled ? "disabled" : ""} />
            </label>
            <label>
              Password
              <input type="password" name="password" autocomplete="current-password" required ${loginDisabled ? "disabled" : ""} />
            </label>
            <button type="submit" class="btn btn-primary" ${loginDisabled ? "disabled" : ""}>Sign in</button>
          </form>
          <p class="muted small" style="margin-top:1rem">
            This portal is for calendars, contacts, tasks/notes and files.
          </p>
        </div>
      </div>`,
    { auth: true },
  );
}
