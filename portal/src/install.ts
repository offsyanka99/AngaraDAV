/**
 * Portal installer wizard — /portal/install/
 */

import { log } from "./log";
import { timezoneSelectOptions } from "./timezones";
import { esc, renderFlash } from "./ui";

export type InstallStep =
  | "permissions"
  | "initialize"
  | "database"
  | "upgrade"
  | "done"
  | "locked";

export type InstallStatus = {
  step: InstallStep;
  locked: boolean;
  message?: string;
  csrfToken: string;
  productVersion: string;
  configuredVersion?: string | null;
  hasAdminPassword?: boolean;
  installUrl?: string;
  portalUrl?: string;
  portalAdminUrl?: string;
  permissions?: {
    ok: boolean;
    configWritable: boolean;
    specificWritable: boolean;
    configPath: string;
    specificPath: string;
  };
  pdoDrivers?: string[];
  defaults?: {
    timezone: string;
    cal_enabled: boolean;
    card_enabled: boolean;
    tasks_enabled: boolean;
    notes_enabled: boolean;
    files_enabled: boolean;
    invite_from: string;
    dav_auth_type: string;
    session_max_age_minutes: number;
    backend: string;
    sqlite_file: string;
    pgsql_host: string;
    pgsql_dbname: string;
    pgsql_username: string;
  };
  completed?: boolean;
  nextUrl?: string;
  messages?: string[];
};

let csrf = "";
let status: InstallStatus | null = null;
let busy = false;
let error: string | null = null;
let success: string | null = null;
let backend: "sqlite" | "pgsql" = "sqlite";
let upgradeConfirmChecked = false;

async function api<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (init.body) {
    headers["Content-Type"] = "application/json";
  }
  if (csrf && init.method && init.method !== "GET") {
    headers["X-CSRF-Token"] = csrf;
  }
  const res = await fetch(`/api/install${path}`, {
    credentials: "same-origin",
    ...init,
    headers,
  });
  let data: { error?: string; data?: T } & T;
  try {
    data = (await res.json()) as typeof data;
  } catch {
    throw new Error(`Request failed (${res.status})`);
  }
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  if (data && typeof data === "object" && "data" in data && data.data !== undefined) {
    return data.data as T;
  }
  return data as T;
}

async function loadStatus(): Promise<void> {
  status = await api<InstallStatus>("/status");
  csrf = status.csrfToken || csrf;
  if (status.defaults?.backend === "pgsql") {
    backend = "pgsql";
  } else {
    backend = "sqlite";
  }
}

function check(name: string, on: boolean, label: string): string {
  return `<label class="check-row"><input type="checkbox" name="${esc(name)}" ${on ? "checked" : ""} ${busy ? "disabled" : ""} /> ${esc(label)}</label>`;
}

function renderPermissions(): string {
  const p = status?.permissions;
  return `<section class="card">
    <h2>Permissions required</h2>
    <p class="muted">The PHP process must be able to write configuration before install can continue.</p>
    <dl class="admin-dl">
      <div><dt>config/</dt><dd class="mono">${esc(p?.configPath || "—")} ${p?.configWritable ? '<span class="badge badge-ok">writable</span>' : '<span class="badge badge-off">not writable</span>'}</dd></div>
      <div><dt>Specific/</dt><dd class="mono">${esc(p?.specificPath || "—")} ${p?.specificWritable ? '<span class="badge badge-ok">writable</span>' : '<span class="badge badge-off">not writable</span>'}</dd></div>
    </dl>
    ${renderFlash("error", status?.message || "Fix directory permissions, then reload.")}
    <button type="button" class="btn btn-primary" data-action="reload" ${busy ? "disabled" : ""}>Retry</button>
  </section>`;
}

function renderInitialize(): string {
  const d = status?.defaults;
  return `<section class="card">
    <h2>Server settings</h2>
    <p class="muted small">Step 1 of 2 — system options and admin password. After setup, log in to the portal as user <span class="mono">admin</span> with this password.</p>
    <form class="stack" data-form="initialize">
      <label>Server timezone
        <select name="timezone" required ${busy ? "disabled" : ""}>
          ${timezoneSelectOptions(d?.timezone || "UTC")}
        </select>
      </label>
      <h3 class="admin-subsection-title">DAV services</h3>
      ${check("cal_enabled", d?.cal_enabled !== false, "Enable CalDAV")}
      ${check("card_enabled", d?.card_enabled !== false, "Enable CardDAV")}
      ${check("tasks_enabled", d?.tasks_enabled !== false, "Enable Tasks (VTODO)")}
      ${check("notes_enabled", !!d?.notes_enabled, "Enable Notes (VJOURNAL)")}
      ${check("files_enabled", !!d?.files_enabled, "Enable WebDAV file storage")}
      <label>WebDAV authentication type
        <select name="dav_auth_type" ${busy ? "disabled" : ""}>
          ${["Digest", "Basic", "Apache"]
            .map(
              (t) =>
                `<option value="${t}" ${(d?.dav_auth_type || "Digest") === t ? "selected" : ""}>${t}</option>`,
            )
            .join("")}
        </select>
      </label>
      <label>Email invite sender
        <input type="text" name="invite_from" value="${esc(d?.invite_from || "")}" ${busy ? "disabled" : ""} />
      </label>
      <label>Session idle timeout (minutes)
        <input type="number" name="session_max_age_minutes" min="1" max="10080" value="${esc(String(d?.session_max_age_minutes ?? 15))}" ${busy ? "disabled" : ""} />
      </label>
      <h3 class="admin-subsection-title">Admin password</h3>
      <p class="muted small">
        One password for two uses after setup:
        (1) portal DAV user <span class="mono">admin</span> (log in at <span class="mono">/portal/</span>),
        (2) server admin hash in config (install recovery).
        Grant other operators Admin role with <span class="mono">PORTAL_ADMIN_USERS</span> if needed.
      </p>
      <label>Admin password
        <input type="password" name="admin_password" required autocomplete="new-password" minlength="8" ${busy ? "disabled" : ""} />
      </label>
      <label>Confirm admin password
        <input type="password" name="admin_password_confirm" required autocomplete="new-password" minlength="8" ${busy ? "disabled" : ""} />
      </label>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${busy ? "disabled" : ""}>Save and continue</button>
      </div>
    </form>
  </section>`;
}

function renderDatabase(): string {
  const d = status?.defaults;
  const drivers = status?.pdoDrivers || [];
  const sqliteOk = drivers.includes("sqlite");
  const pgsqlOk = drivers.includes("pgsql");
  return `<section class="card">
    <h2>Database</h2>
    <p class="muted small">Step 2 of 2 — create schema and lock the installer.</p>
    <form class="stack" data-form="database">
      <label>Database backend
        <select name="backend" data-action="backend-change" ${busy ? "disabled" : ""}>
          ${sqliteOk ? `<option value="sqlite" ${backend === "sqlite" ? "selected" : ""}>SQLite</option>` : ""}
          ${pgsqlOk ? `<option value="pgsql" ${backend === "pgsql" ? "selected" : ""}>PostgreSQL</option>` : ""}
        </select>
      </label>
      <div data-backend-panel="sqlite" style="${backend === "sqlite" ? "" : "display:none"}">
        <label>SQLite file path
          <input type="text" name="sqlite_file" value="${esc(d?.sqlite_file || "")}" class="mono" ${busy ? "disabled" : ""} />
          <span class="muted small">Absolute path. Directory must be writable.</span>
        </label>
      </div>
      <div data-backend-panel="pgsql" style="${backend === "pgsql" ? "" : "display:none"}">
        <label>PostgreSQL host
          <input type="text" name="pgsql_host" value="${esc(d?.pgsql_host || "")}" placeholder="localhost:5432" ${busy ? "disabled" : ""} />
        </label>
        <label>Database name
          <input type="text" name="pgsql_dbname" value="${esc(d?.pgsql_dbname || "")}" ${busy ? "disabled" : ""} />
        </label>
        <label>Username
          <input type="text" name="pgsql_username" value="${esc(d?.pgsql_username || "")}" autocomplete="off" ${busy ? "disabled" : ""} />
        </label>
        <label>Password
          <input type="password" name="pgsql_password" autocomplete="new-password" ${busy ? "disabled" : ""} />
        </label>
      </div>
      <h3 class="admin-subsection-title">Confirm admin password</h3>
      <p class="muted small">Re-enter the admin password from step 1. It is not stored in the browser session; it creates DAV user <span class="mono">admin</span> for portal login.</p>
      <label>Admin password
        <input type="password" name="admin_password" required autocomplete="new-password" minlength="8" ${busy ? "disabled" : ""} />
      </label>
      <label>Confirm admin password
        <input type="password" name="admin_password_confirm" required autocomplete="new-password" minlength="8" ${busy ? "disabled" : ""} />
      </label>
      <div class="form-actions-row" style="margin-top:1rem">
        <button type="submit" class="btn btn-primary" ${busy ? "disabled" : ""}>Create database and finish</button>
      </div>
    </form>
  </section>`;
}

function renderUpgrade(): string {
  return `<section class="card">
    <h2>Version upgrade</h2>
    <p>Upgrade AngaraDAV from <strong class="mono">${esc(String(status?.configuredVersion || "?"))}</strong>
      to <strong class="mono">${esc(status?.productVersion || "?")}</strong>.</p>
    <p class="muted small">Schema migrations run automatically. Back up <span class="mono">config/</span> and <span class="mono">Specific/</span> first.</p>
    <label class="admin-delete-confirm">
      <input type="checkbox" data-action="upgrade-toggle" ${upgradeConfirmChecked ? "checked" : ""} ${busy ? "disabled" : ""} />
      I have a backup and want to run the upgrade
    </label>
    <div class="form-actions-row" style="margin-top:1rem">
      <button type="button" class="btn btn-primary" data-action="upgrade-run"
        ${busy || !upgradeConfirmChecked ? "disabled" : ""}>Run upgrade</button>
    </div>
  </section>`;
}

function renderDone(): string {
  return `<section class="card">
    <h2>Installation complete</h2>
    <p>${esc(status?.message || "AngaraDAV is configured.")}</p>
    <p class="muted small">Portal login: username <span class="mono">admin</span> with the password you set during setup.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open user portal</a>
    </div>
  </section>`;
}

function renderLocked(): string {
  return `<section class="card card-danger-zone">
    <h2>Installer locked</h2>
    ${renderFlash("error", status?.message || "Installer is locked.")}
    <p class="muted small">Production hard-lock: <span class="mono">BAIKAL_LOCK_INSTALL=1</span>.
      Set <span class="mono">BAIKAL_ALLOW_REINSTALL=1</span> to re-open, or use portal Admin → Reset to Default when allowed.</p>
    <div class="form-actions-row" style="margin-top:1rem">
      <a class="btn btn-primary" href="/portal/">Open portal</a>
    </div>
  </section>`;
}

function render(): void {
  const root = document.getElementById("app");
  if (!root) return;
  const step = status?.step || "permissions";
  let body = "";
  if (!status) {
    body = `<section class="card"><p class="muted">Loading installer…</p></section>`;
  } else if (step === "permissions") {
    body = renderPermissions();
  } else if (step === "initialize") {
    body = renderInitialize();
  } else if (step === "database") {
    body = renderDatabase();
  } else if (step === "upgrade") {
    body = renderUpgrade();
  } else if (step === "done") {
    body = renderDone();
  } else if (step === "locked") {
    body = renderLocked();
  } else {
    body = `<section class="card"><p>Unknown step: ${esc(step)}</p></section>`;
  }

  root.innerHTML = `
    <div class="install-shell">
      <header class="install-header">
        <div>
          <p class="install-kicker">
            <img class="brand-logo" src="/logo.png" width="28" height="28" alt="" aria-hidden="true" />
            <span class="brand-text">Angara<span class="brand-dav">DAV</span></span>
          </p>
          <h1>Setup wizard</h1>
          <p class="muted small">Product version <span class="mono">${esc(status?.productVersion || "…")}</span>
            ${status?.configuredVersion ? ` · configured <span class="mono">${esc(String(status.configuredVersion))}</span>` : ""}
          </p>
        </div>
        ${status?.step ? `<span class="badge badge-admin">${esc(status.step)}</span>` : ""}
      </header>
      ${error ? renderFlash("error", error, { dismissible: false }) : ""}
      ${success ? renderFlash("success", success, { dismissible: false }) : ""}
      ${body}
      <p class="muted small install-footer">AngaraDAV first-time setup and upgrades.</p>
    </div>
  `;
  bind();
}

function bind(): void {
  const root = document.getElementById("app");
  if (!root) return;

  root.querySelector('[data-action="reload"]')?.addEventListener("click", () => {
    void refresh();
  });

  root.querySelector('[data-action="backend-change"]')?.addEventListener("change", (ev) => {
    const sel = ev.target as HTMLSelectElement;
    backend = sel.value === "pgsql" ? "pgsql" : "sqlite";
    render();
  });

  root.querySelector('[data-action="upgrade-toggle"]')?.addEventListener("change", (ev) => {
    upgradeConfirmChecked = !!(ev.target as HTMLInputElement).checked;
    render();
  });

  root.querySelector('[data-action="upgrade-run"]')?.addEventListener("click", () => {
    void onUpgrade();
  });

  root.querySelector<HTMLFormElement>('[data-form="initialize"]')?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    void onInitialize(ev.target as HTMLFormElement);
  });

  root.querySelector<HTMLFormElement>('[data-form="database"]')?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    void onDatabase(ev.target as HTMLFormElement);
  });
}

async function refresh(): Promise<void> {
  busy = true;
  error = null;
  render();
  try {
    await loadStatus();
    success = null;
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load installer status";
  } finally {
    busy = false;
    render();
  }
}

async function onInitialize(form: HTMLFormElement): Promise<void> {
  const fd = new FormData(form);
  const bool = (name: string) =>
    !!form.querySelector<HTMLInputElement>(`input[name="${name}"]`)?.checked;
  const body = {
    timezone: String(fd.get("timezone") ?? "").trim(),
    cal_enabled: bool("cal_enabled"),
    card_enabled: bool("card_enabled"),
    tasks_enabled: bool("tasks_enabled"),
    notes_enabled: bool("notes_enabled"),
    files_enabled: bool("files_enabled"),
    dav_auth_type: String(fd.get("dav_auth_type") ?? "Digest"),
    invite_from: String(fd.get("invite_from") ?? "").trim(),
    session_max_age_minutes: Number(fd.get("session_max_age_minutes") ?? 15),
    admin_password: String(fd.get("admin_password") ?? ""),
    admin_password_confirm: String(fd.get("admin_password_confirm") ?? ""),
  };
  busy = true;
  error = null;
  success = null;
  render();
  try {
    status = await api<InstallStatus>("/initialize", {
      method: "POST",
      body: JSON.stringify(body),
    });
    csrf = status.csrfToken || csrf;
    success = "Server settings saved. Configure the database next.";
    log.event("install.initialize");
  } catch (e) {
    error = e instanceof Error ? e.message : "Initialize failed";
  } finally {
    busy = false;
    render();
  }
}

async function onDatabase(form: HTMLFormElement): Promise<void> {
  const fd = new FormData(form);
  const be = String(fd.get("backend") ?? backend);
  const body: Record<string, unknown> = {
    backend: be,
    admin_password: String(fd.get("admin_password") ?? ""),
    admin_password_confirm: String(fd.get("admin_password_confirm") ?? ""),
  };
  if (be === "sqlite") {
    body.sqlite_file = String(fd.get("sqlite_file") ?? "").trim();
  } else {
    body.pgsql_host = String(fd.get("pgsql_host") ?? "").trim();
    body.pgsql_dbname = String(fd.get("pgsql_dbname") ?? "").trim();
    body.pgsql_username = String(fd.get("pgsql_username") ?? "").trim();
    body.pgsql_password = String(fd.get("pgsql_password") ?? "");
  }
  busy = true;
  error = null;
  success = null;
  render();
  try {
    status = await api<InstallStatus>("/database", {
      method: "POST",
      body: JSON.stringify(body),
    });
    csrf = status.csrfToken || csrf;
    success = "Database configured. Installer is locked.";
    log.event("install.database");
    if (status.completed || status.step === "done") {
      // Brief pause then offer portal
    }
  } catch (e) {
    error = e instanceof Error ? e.message : "Database setup failed";
  } finally {
    busy = false;
    render();
  }
}

async function onUpgrade(): Promise<void> {
  if (!upgradeConfirmChecked) return;
  busy = true;
  error = null;
  success = null;
  render();
  try {
    const res = await api<InstallStatus & { messages?: string[] }>("/upgrade", {
      method: "POST",
      body: JSON.stringify({ confirm: true }),
    });
    success =
      "Upgrade completed." +
      (res.messages && res.messages.length
        ? " " + res.messages.slice(0, 3).join(" · ")
        : "");
    log.event("install.upgrade");
    await loadStatus();
  } catch (e) {
    error = e instanceof Error ? e.message : "Upgrade failed";
  } finally {
    busy = false;
    render();
  }
}

export async function mountInstall(root: HTMLElement): Promise<void> {
  document.title = "AngaraDAV · Setup";
  document.body.classList.add("layout-install");
  root.innerHTML = `<section class="card"><p class="muted">Loading installer…</p></section>`;
  try {
    await loadStatus();
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load installer";
  }
  render();
}
