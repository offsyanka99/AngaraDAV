/**
 * Admin database settings + CONFIRM modal (Phase 5).
 */
import { api } from "../../api";
import { log } from "../../log";
import { esc, renderModal } from "../../ui";
import { infoTitle } from "../sectionInfo";
import type { AdminHost } from "./host";
import {
  adminComingSoonBanner,
  adminPageMeta,
  adminStatusBadgeClass,
  adminStatusLabel,
} from "./meta";

export function collectAdminDatabaseFormBody(host: AdminHost, form: HTMLFormElement): Record<string, unknown> {
  const fd = new FormData(form);
  const backend = String(fd.get("backend") ?? host.state.adminDbFormBackend).toLowerCase() === "pgsql" ? "pgsql" : "sqlite";
  const body: Record<string, unknown> = { backend };
  if (backend === "sqlite") {
    body.sqlite_file = String(fd.get("sqlite_file") ?? "").trim();
  } else {
    body.pgsql_host = String(fd.get("pgsql_host") ?? "").trim();
    body.pgsql_dbname = String(fd.get("pgsql_dbname") ?? "").trim();
    body.pgsql_username = String(fd.get("pgsql_username") ?? "").trim();
    body.pgsql_password = String(fd.get("pgsql_password") ?? "");
  }
  return body;
}

export function onAdminDatabaseFormSubmit(host: AdminHost, form: HTMLFormElement): void {
  host.state.adminDbPendingBody = collectAdminDatabaseFormBody(host, form);
  host.state.adminDbConfirmText = "";
  host.state.adminDbConfirmOpen = true;
  host.clearFlash();
  host.render();
}

export async function onAdminDatabaseTest(host: AdminHost, form: HTMLFormElement | null): Promise<void> {
  if (!form) {
    form = host.root.querySelector<HTMLFormElement>('[data-form="admin-database"]');
  }
  if (!form) {
    host.setFlash("error", "Database form not found");
    host.render();
    return;
  }
  const body = collectAdminDatabaseFormBody(host, form);
  host.state.busy = true;
  host.clearFlash();
  host.render();
  try {
    const res = await api.adminTestDatabaseConnection(body);
    host.setFlash("success", res.message || "Connection successful");
    log.event("admin.database.test", { backend: res.backend });
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Connection test failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
}

export function renderAdminDatabaseShell(host: AdminHost): string {
  const meta = adminPageMeta(host, "database");
  if (meta && meta.available === false) {
    return adminComingSoonBanner(host, "database");
  }
  if (host.state.adminDatabaseSettingsLoading && !host.state.adminDatabaseSettings) {
    return `<section class="card"><p class="muted">Loading database settings…</p></section>`;
  }
  if (host.state.adminDatabaseSettingsError && !host.state.adminDatabaseSettings) {
    return `<section class="card">
      <p class="flash flash-error">${esc(host.state.adminDatabaseSettingsError)}</p>
      <button type="button" class="btn btn-ghost" data-action="admin-database-refresh">Retry</button>
    </section>`;
  }
  const d = host.state.adminDatabaseSettings;
  if (!d) {
    return `<section class="card"><p class="muted">No database settings loaded.</p></section>`;
  }
  const backend = host.state.adminDbFormBackend;
  const notWritable = d.writable === false;

  return `
    <section class="card">
      <div class="section-header">
        ${infoTitle("Database", "admin-database")}
        <div class="section-actions">
          ${meta ? `<span class="badge ${adminStatusBadgeClass(host, meta.status)}">${esc(adminStatusLabel(host, meta.status))}</span>` : ""}
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-database-refresh" ${host.state.busy ? "disabled" : ""}>Refresh</button>
        </div>
      </div>
      <p class="flash flash-info" style="margin-bottom:1rem">${esc(d.warning)}</p>
      <dl class="admin-dl admin-dl-stack">
        <div>
          <dt>Current backend</dt>
          <dd><span class="badge badge-admin">${esc((d.backend || "—").toUpperCase())}</span></dd>
        </div>
        ${
          d.backend === "sqlite" || d.sqlite_file
            ? `<div>
          <dt>SQLite file</dt>
          <dd class="mono admin-dl-path">${esc(d.sqlite_file || "—")}</dd>
        </div>`
            : ""
        }
        ${
          d.backend === "pgsql" || d.pgsql_host
            ? `<div>
          <dt>PostgreSQL</dt>
          <dd class="mono admin-dl-path">${esc(d.pgsql_host || "—")} / ${esc(d.pgsql_dbname || "—")} · ${esc(d.pgsql_username || "—")}</dd>
        </div>
        <div>
          <dt>Password</dt>
          <dd>${d.hasPassword ? '<span class="badge badge-ok">Set</span> <span class="muted small">(never shown)</span>' : '<span class="badge badge-off">Not set</span>'}</dd>
        </div>`
            : ""
        }
        <div>
          <dt>Encryption key</dt>
          <dd>${d.hasEncryptionKey ? '<span class="badge badge-ok">Configured</span> <span class="muted small">(never shown)</span>' : '<span class="badge badge-off">Not set</span>'}</dd>
        </div>
      </dl>

      <h3 class="admin-subsection-title">Edit connection</h3>
      ${notWritable ? `<p class="flash flash-error">Config is not writable by PHP.</p>` : ""}
      <form class="stack admin-database-form" data-form="admin-database">
        <label>Backend
          <select name="backend" data-action="admin-db-backend" ${host.state.busy || notWritable ? "disabled" : ""}>
            <option value="sqlite" ${backend === "sqlite" ? "selected" : ""}>SQLite</option>
            <option value="pgsql" ${backend === "pgsql" ? "selected" : ""}>PostgreSQL</option>
          </select>
        </label>
        <div data-admin-db-panel="sqlite" style="${backend === "sqlite" ? "" : "display:none"}">
          <label>SQLite file path
            <input type="text" name="sqlite_file" class="mono" value="${esc(d.sqlite_file || "")}" ${host.state.busy || notWritable ? "disabled" : ""} />
          </label>
        </div>
        <div data-admin-db-panel="pgsql" style="${backend === "pgsql" ? "" : "display:none"}">
          <label>PostgreSQL host
            <input type="text" name="pgsql_host" class="mono" value="${esc(d.pgsql_host || "")}" placeholder="localhost:5432" ${host.state.busy || notWritable ? "disabled" : ""} />
          </label>
          <label>Database name
            <input type="text" name="pgsql_dbname" class="mono" value="${esc(d.pgsql_dbname || "")}" ${host.state.busy || notWritable ? "disabled" : ""} />
          </label>
          <label>Username
            <input type="text" name="pgsql_username" class="mono" value="${esc(d.pgsql_username || "")}" autocomplete="off" ${host.state.busy || notWritable ? "disabled" : ""} />
          </label>
          <label>Password
            <input type="password" name="pgsql_password" autocomplete="new-password" placeholder="${d.hasPassword ? "Leave blank to keep current" : ""}" ${host.state.busy || notWritable ? "disabled" : ""} />
          </label>
        </div>
        <div class="form-actions-row" style="margin-top:1rem">
          <button type="button" class="btn btn-ghost" data-action="admin-db-test" ${host.state.busy || notWritable ? "disabled" : ""}>Test connection</button>
          <button type="submit" class="btn btn-primary" ${host.state.busy || notWritable ? "disabled" : ""}>Save database settings…</button>
        </div>
      </form>
    </section>
    ${renderAdminDbConfirmModal(host)}`;
}

export function renderAdminDbConfirmModal(host: AdminHost): string {
  if (!host.state.adminDbConfirmOpen) return "";
  const canSave = host.state.adminDbConfirmText.trim() === "CONFIRM";
  return renderModal({
    id: "admin-db-confirm-modal",
    title: "Confirm database change",
    titleId: "admin-db-confirm-title",
    closeAction: "admin-db-confirm-close",
    size: "sm",
    body: `
        <p>Wrong values can take the instance offline. Type <strong class="mono">CONFIRM</strong> to save.</p>
        <label>Confirmation
          <input type="text" data-action="admin-db-confirm-input" value="${esc(host.state.adminDbConfirmText)}"
            autocomplete="off" spellcheck="false" placeholder="CONFIRM" ${host.state.busy ? "disabled" : ""} />
        </label>`,
    footer: [
      { label: "Cancel", action: "admin-db-confirm-close", variant: "ghost", disabled: host.state.busy },
      {
        label: "Save database settings",
        action: "admin-db-confirm-save",
        variant: "danger",
        disabled: host.state.busy || !canSave,
      },
    ],
  });
}
