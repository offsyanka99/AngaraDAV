/**
 * Administration → Security. Source-address limit and portal username cool-down.
 */
import { api } from "../../api";
import { log } from "../../log";
import { esc } from "../../ui";
import { infoTitle } from "../sectionInfo";
import type { AdminHost } from "./host";
import {
  adminComingSoonBanner,
  adminPageMeta,
  adminStatusBadgeClass,
  adminStatusLabel,
} from "./meta";

export function renderAdminSecurityShell(host: AdminHost): string {
  const meta = adminPageMeta(host, "security");
  if (meta && meta.available === false) {
    return adminComingSoonBanner(host, "security");
  }
  if (host.state.adminSystemSettingsLoading && !host.state.adminSystemSettings) {
    return `<section class="card"><p class="muted">Loading security settings…</p></section>`;
  }
  if (host.state.adminSystemSettingsError && !host.state.adminSystemSettings) {
    return `<section class="card">
      <p class="flash flash-error">${esc(host.state.adminSystemSettingsError)}</p>
      <button type="button" class="btn btn-ghost" data-action="admin-settings-refresh">Retry</button>
    </section>`;
  }
  const s = host.state.adminSystemSettings;
  if (!s) {
    return `<section class="card"><p class="muted">No settings loaded.</p></section>`;
  }
  const locked = host.state.busy || s.writable === false;
  const num = (name: string, val: number, label: string, help: string) =>
    `<label>${esc(label)}
      <input type="number" name="${esc(name)}" min="1" max="${name.includes("minutes") ? "1440" : "1000"}" value="${esc(String(val))}" ${locked ? "disabled" : ""} />
      <span class="muted small">${esc(help)}</span>
    </label>`;

  return `
    <section class="card">
      <div class="section-header">
        ${infoTitle("Security", "admin-security")}
        <div class="section-actions">
          ${meta ? `<span class="badge ${adminStatusBadgeClass(host, meta.status)}">${esc(adminStatusLabel(host, meta.status))}</span>` : ""}
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-settings-refresh" ${host.state.busy ? "disabled" : ""}>Reload</button>
        </div>
      </div>
      <p class="muted small">
        Writes <span class="mono">config/configuration.yaml</span>.
        ${s.writable === false ? '<span class="flash flash-error">Config is not writable by PHP.</span>' : ""}
      </p>
      <form class="stack admin-settings-form" data-form="admin-security">
        <h3 class="admin-subsection-title">Address limit</h3>
        <p class="muted small">Portal sign-in and WebDAV Basic share this limit. Digest is unchanged. File download stays at 20 requests per 15 minutes.</p>
        ${num("auth_ip_max_failures", s.auth_ip_max_failures ?? 20, "Failures from one address", "1–1000. Default 20.")}
        ${num("auth_ip_window_minutes", s.auth_ip_window_minutes ?? 15, "Minutes", "1–1440. Default 15. The address may try again when this time has passed.")}

        <h3 class="admin-subsection-title">Portal username cool-down</h3>
        <p class="muted small">Portal sign-in only. A cooled-down username is refused with the same message as a wrong password limit. CalDAV and CardDAV keep working, and the account is not disabled.</p>
        ${num("auth_user_max_failures", s.auth_user_max_failures ?? 10, "Failures for one username", "1–1000. Default 10.")}
        ${num("auth_user_window_minutes", s.auth_user_window_minutes ?? 15, "Counting minutes", "1–1440. Default 15. Failures older than this are forgotten.")}
        ${num("auth_user_cooldown_minutes", s.auth_user_cooldown_minutes ?? 15, "Cool-down minutes", "1–1440. Default 15. Portal sign-in for that username waits this long, then works again.")}

        <h3 class="admin-subsection-title">Server admin password</h3>
        <p class="muted small">
          Stored in <span class="mono">configuration.yaml</span> for install recovery.
          Portal login uses each DAV user’s own password (e.g. user <span class="mono">admin</span> created at install).
          ${s.hasAdminPassword ? "Leave blank to keep the current server admin password." : "No server admin password set yet."}
        </p>
        <label>New server admin password
          <input type="password" name="admin_password" autocomplete="new-password" ${locked ? "disabled" : ""} />
        </label>
        <label>Confirm server admin password
          <input type="password" name="admin_password_confirm" autocomplete="new-password" ${locked ? "disabled" : ""} />
        </label>

        <div class="form-actions-row" style="margin-top:1rem">
          <button type="submit" class="btn btn-primary" ${locked ? "disabled" : ""}>Save security</button>
        </div>
      </form>
    </section>`;
}

export async function onAdminSecuritySave(host: AdminHost, form: HTMLFormElement): Promise<void> {
  const fd = new FormData(form);
  const body = {
    auth_ip_max_failures: Number(fd.get("auth_ip_max_failures") ?? 20),
    auth_ip_window_minutes: Number(fd.get("auth_ip_window_minutes") ?? 15),
    auth_user_max_failures: Number(fd.get("auth_user_max_failures") ?? 10),
    auth_user_window_minutes: Number(fd.get("auth_user_window_minutes") ?? 15),
    auth_user_cooldown_minutes: Number(fd.get("auth_user_cooldown_minutes") ?? 15),
  } as Record<string, unknown>;
  const pw = String(fd.get("admin_password") ?? "");
  const pwc = String(fd.get("admin_password_confirm") ?? "");
  if (pw !== "" || pwc !== "") {
    body.admin_password = pw;
    body.admin_password_confirm = pwc;
  }
  host.state.busy = true;
  host.clearFlash();
  host.render();
  try {
    const res = await api.adminUpdateSystemSettings(body);
    host.state.adminSystemSettings = res.data;
    log.event("admin.security.save");
    host.setFlash("success", "Security settings saved");
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Save failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
}
