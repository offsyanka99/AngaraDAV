/**
 * Admin system settings + reset modal (Phase 5).
 */
import { api } from "../../api";
import { log } from "../../log";
import { esc, renderConfirmCheckbox, renderModal } from "../../ui";
import { timezoneSelectOptions } from "../../timezones";
import { infoTitle } from "../sectionInfo";
import type { AdminHost } from "./host";
import {
  adminComingSoonBanner,
  adminPageMeta,
  adminStatusBadgeClass,
  adminStatusLabel,
} from "./meta";

export function renderAdminSettingsShell(host: AdminHost): string {
  const meta = adminPageMeta(host, "settings");
  if (meta && meta.available === false) {
    return adminComingSoonBanner(host, "settings");
  }
  if (host.state.adminSystemSettingsLoading && !host.state.adminSystemSettings) {
    return `<section class="card"><p class="muted">Loading system settings…</p></section>`;
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
  const check = (name: string, on: boolean, label: string) =>
    `<label class="check-row"><input type="checkbox" name="${esc(name)}" ${on ? "checked" : ""} ${host.state.busy || s.writable === false ? "disabled" : ""} /> ${esc(label)}</label>`;
  const num = (name: string, val: number | undefined, label: string, help = "") =>
    `<label>${esc(label)}
      <input type="number" name="${esc(name)}" value="${esc(String(val ?? 0))}" ${host.state.busy || s.writable === false ? "disabled" : ""} />
      ${help ? `<span class="muted small">${esc(help)}</span>` : ""}
    </label>`;

  return `
    <section class="card">
      <div class="section-header">
        ${infoTitle("System settings", "admin-settings")}
        <div class="section-actions">
          ${meta ? `<span class="badge ${adminStatusBadgeClass(host, meta.status)}">${esc(adminStatusLabel(host, meta.status))}</span>` : ""}
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-settings-refresh" ${host.state.busy ? "disabled" : ""}>Reload</button>
        </div>
      </div>
      <p class="muted small">
        Writes <span class="mono">config/baikal.yaml</span> atomically. Changing
        <strong>session timeout</strong> affects portal idle sessions.
        ${s.writable === false ? '<span class="flash flash-error">Config is not writable by PHP.</span>' : ""}
      </p>
      <form class="stack admin-settings-form" data-form="admin-settings">
        <h3 class="admin-subsection-title">DAV services</h3>
        ${check("cal_enabled", !!s.cal_enabled, "Enable CalDAV")}
        ${check("card_enabled", !!s.card_enabled, "Enable CardDAV")}
        ${check("tasks_enabled", !!s.tasks_enabled, "Enable Tasks (VTODO)")}
        ${check("notes_enabled", !!s.notes_enabled, "Enable Notes (VJOURNAL)")}
        <label>WebDAV authentication type
          <select name="dav_auth_type" ${host.state.busy || s.writable === false ? "disabled" : ""}>
            ${["Digest", "Basic", "Apache"]
              .map(
                (t) =>
                  `<option value="${t}" ${s.dav_auth_type === t ? "selected" : ""}>${t}</option>`,
              )
              .join("")}
          </select>
        </label>
        <label>Server timezone
          <select name="timezone" required ${host.state.busy || s.writable === false ? "disabled" : ""}>
            ${timezoneSelectOptions(s.timezone || "UTC")}
          </select>
        </label>
        <label>Email invite sender
          <input type="text" name="invite_from" value="${esc(s.invite_from || "")}" placeholder="noreply@example.com" ${host.state.busy || s.writable === false ? "disabled" : ""} />
        </label>

        <h3 class="admin-subsection-title">WebDAV files</h3>
        ${check("files_enabled", !!s.files_enabled, "Enable WebDAV file storage")}
        <label>Storage path
          <input type="text" name="files_storage_path" value="${esc(s.files_storage_path || "")}" placeholder="empty = Specific/files" ${host.state.busy || s.writable === false ? "disabled" : ""} />
        </label>
        ${num("files_max_upload_mb", s.files_max_upload_mb, "Max file size (MB)")}
        ${num("files_quota_mb", s.files_quota_mb, "Quota per user (MB)", "0 = unlimited")}
        ${num("files_quarantine_days", s.files_quarantine_days, "Deleted user file retention (days)")}

        <h3 class="admin-subsection-title">Session & portal</h3>
        ${num("session_max_age_minutes", s.session_max_age_minutes, "Session idle timeout (minutes)", "Portal session")}
        <label>Portal log level
          <select name="portal_log_level" ${host.state.busy || s.writable === false ? "disabled" : ""}>
            ${["off", "error", "warn", "info", "debug"]
              .map(
                (l) =>
                  `<option value="${l}" ${(s.portal_log_level || "off") === l ? "selected" : ""}>${l}</option>`,
              )
              .join("")}
          </select>
        </label>
        ${check("portal_admin_ui_enabled", s.portal_admin_ui_enabled !== false, "Portal Administration UI enabled")}
        <label>Portal admin users (comma-separated)
          <input type="text" name="portal_admin_users" value="${esc(
            Array.isArray(s.portal_admin_users)
              ? s.portal_admin_users.join(", ")
              : String(s.portal_admin_users || ""),
          )}" placeholder="empty = DAV user admin"
            autocomplete="off" spellcheck="false"
            ${host.state.busy || s.writable === false ? "disabled" : ""} />
        </label>

        <h3 class="admin-subsection-title">WebDAV-Push</h3>
        ${check("push_enabled", !!s.push_enabled, "Enable WebDAV-Push")}
        <label>Push external URL (HTTPS)
          <input type="url" name="push_external_url" value="${esc(s.push_external_url || "")}" placeholder="https://dav.example.com/dav.php/" ${host.state.busy || s.writable === false ? "disabled" : ""} />
        </label>
        <label>Push log level
          <select name="push_log_level" ${host.state.busy || s.writable === false ? "disabled" : ""}>
            ${["off", "error", "warn", "info", "debug"]
              .map(
                (l) =>
                  `<option value="${l}" ${(s.push_log_level || "off") === l ? "selected" : ""}>${l}</option>`,
              )
              .join("")}
          </select>
        </label>

        <h3 class="admin-subsection-title">Server admin password</h3>
        <p class="muted small">
          Stored in <span class="mono">baikal.yaml</span> for install recovery.
          Portal login uses each DAV user’s own password (e.g. user <span class="mono">admin</span> created at install).
          ${s.hasAdminPassword ? "Leave blank to keep the current server admin password." : "No server admin password set yet."}
        </p>
        <label>New server admin password
          <input type="password" name="admin_password" autocomplete="new-password" ${host.state.busy || s.writable === false ? "disabled" : ""} />
        </label>
        <label>Confirm server admin password
          <input type="password" name="admin_password_confirm" autocomplete="new-password" ${host.state.busy || s.writable === false ? "disabled" : ""} />
        </label>

        <div class="form-actions-row" style="margin-top:1rem">
          <button type="submit" class="btn btn-primary" ${host.state.busy || s.writable === false ? "disabled" : ""}>Save settings</button>
        </div>
      </form>
    </section>
    <section class="card card-danger-zone">
      <div class="section-header">
        <h2>Danger zone</h2>
      </div>
      <p class="muted small">
        <strong>Reset to Default</strong> is a full factory wipe: config, database (all users and data),
        WebDAV files, and install lock. A timestamped backup of
        <span class="mono">baikal.yaml</span> is kept next to config; <strong>back up volumes first</strong>
        if you need data recovery. Everything else is deleted, then the installer opens.
      </p>
      <div class="form-actions-row" style="margin-top:0.75rem">
        <button type="button" class="btn btn-danger" data-action="admin-reset-open" ${host.state.busy || s.writable === false ? "disabled" : ""}>
          Reset to Default
        </button>
      </div>
    </section>
    ${renderAdminResetModal(host)}`;
}

export function renderAdminResetModal(host: AdminHost): string {
  if (!host.state.adminResetModalOpen) return "";
  return renderModal({
    id: "admin-reset-modal",
    title: "Reset to Default",
    titleId: "admin-reset-title",
    closeAction: "admin-reset-close",
    size: "sm",
    body: `
        <p>This permanently wipes this AngaraDAV instance and opens the installer.</p>
        <ul class="admin-feature-list muted">
          <li>Deletes <span class="mono">config/baikal.yaml</span> (timestamped backup only)</li>
          <li>Deletes the database (all DAV users, calendars, contacts, events)</li>
          <li>Deletes WebDAV file homes and quarantine</li>
          <li>Removes <span class="mono">INSTALL_DISABLED</span> so install can run</li>
        </ul>
        <p class="muted small">This cannot be undone. You will complete setup at <span class="mono">/portal/install/</span>.</p>
        ${renderConfirmCheckbox({
          action: "admin-reset-toggle",
          label: "I understand all data will be deleted and the installer will open",
          checked: host.state.adminResetConfirmChecked,
          disabled: host.state.busy,
          style: "admin",
        })}
        <label style="margin-top:1rem">Your portal password
          <input type="password" data-action="admin-reset-password" value="${esc(host.state.adminResetPassword)}"
            autocomplete="current-password" placeholder="Re-enter password to confirm" ${host.state.busy ? "disabled" : ""} />
        </label>`,
    footer: [
      { label: "Cancel", action: "admin-reset-close", variant: "ghost", disabled: host.state.busy },
      {
        label: "Reset and open installer",
        action: "admin-reset-confirm",
        variant: "danger",
        disabled: host.state.busy || !host.state.adminResetConfirmChecked || host.state.adminResetPassword.trim() === "",
      },
    ],
  });
}

export async function onAdminSettingsSave(host: AdminHost, form: HTMLFormElement): Promise<void> {
  const fd = new FormData(form);
  const bool = (name: string) =>
    !!form.querySelector<HTMLInputElement>(`input[name="${name}"]`)?.checked;
  const body: Record<string, unknown> = {
    cal_enabled: bool("cal_enabled"),
    card_enabled: bool("card_enabled"),
    tasks_enabled: bool("tasks_enabled"),
    notes_enabled: bool("notes_enabled"),
    files_enabled: bool("files_enabled"),
    push_enabled: bool("push_enabled"),
    portal_admin_ui_enabled: bool("portal_admin_ui_enabled"),
    timezone: String(fd.get("timezone") ?? "").trim(),
    invite_from: String(fd.get("invite_from") ?? "").trim(),
    dav_auth_type: String(fd.get("dav_auth_type") ?? "Digest"),
    files_storage_path: String(fd.get("files_storage_path") ?? "").trim(),
    files_max_upload_mb: Number(fd.get("files_max_upload_mb") ?? 0),
    files_quota_mb: Number(fd.get("files_quota_mb") ?? 0),
    files_quarantine_days: Number(fd.get("files_quarantine_days") ?? 0),
    session_max_age_minutes: Number(fd.get("session_max_age_minutes") ?? 15),
    portal_log_level: String(fd.get("portal_log_level") ?? "off"),
    portal_admin_users: String(fd.get("portal_admin_users") ?? "").trim(),
    push_external_url: String(fd.get("push_external_url") ?? "").trim(),
    push_log_level: String(fd.get("push_log_level") ?? "off"),
  };
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
    // Keep user-tab visibility in sync for this session without re-login
    const d = res.data;
    host.state.portalUi = {
      ...host.state.portalUi,
      services: {
        caldav: !!d.cal_enabled,
        carddav: !!d.card_enabled,
        tasks: !!d.tasks_enabled,
        notes: !!d.notes_enabled,
        files: !!d.files_enabled,
      },
    };
    log.event("admin.settings.save");
    host.setFlash("success", "System settings saved");
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Save failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
}
