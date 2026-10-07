/**
 * Admin Configuration: settings backup/restore, data backup/restore, and Danger zone.
 */
import { api } from "../../api";
import type { AdminSettingsBackup } from "../../api";
import { log } from "../../log";
import { esc, renderConfirmCheckbox, renderModal } from "../../ui";
import { infoTitle } from "../sectionInfo";
import { DATA_RESTORE_NOTICE_KEY } from "../sessionEnd";
import { saveBlobAsFile } from "../exportBlob";
import { backupFileName } from "./backupFileName";
import type { AdminHost } from "./host";
import {
  adminComingSoonBanner,
  adminPageMeta,
  adminStatusBadgeClass,
  adminStatusLabel,
} from "./meta";

export function renderAdminConfigurationShell(host: AdminHost): string {
  const meta = adminPageMeta(host, "configuration");
  if (meta && meta.available === false) {
    return adminComingSoonBanner(host, "configuration");
  }
  const dataBusy = host.state.adminDataExportBusy || host.state.adminDataRestoreBusy;
  const dataFile = host.state.adminDataRestoreFile;
  const canRestoreData = !!dataFile && host.state.adminDataRestoreConfirm && !dataBusy;
  return `
    <section class="card">
      <div class="section-header">
        ${infoTitle("Settings backup and restore", "admin-configuration")}
        ${meta ? `<span class="badge ${adminStatusBadgeClass(host, meta.status)}">${esc(adminStatusLabel(host, meta.status))}</span>` : ""}
      </div>
      <p class="muted small">
        Download a JSON snapshot of the current system settings (<span class="mono">config/configuration.yaml</span>).
        It never contains passwords, secrets, or user/DAV data — only the settings shown on
        the System settings page.
      </p>
      ${host.state.adminBackupError ? `<p class="flash flash-error">${esc(host.state.adminBackupError)}</p>` : ""}
      <div class="form-actions-row" style="margin-top:0.75rem">
        <button type="button" class="btn btn-primary" data-action="admin-backup-download" ${host.state.adminBackupBusy ? "disabled" : ""}>
          ${host.state.adminBackupBusy ? "Preparing…" : "Download backup"}
        </button>
      </div>
      <p style="margin-top:1.25rem"><strong>Restore settings</strong></p>
      <p class="muted small">
        Choose a settings backup to preview the changes it would make. Nothing is written until you
        review the diff and confirm.
      </p>
      <div class="form-actions-row" style="margin-top:0.75rem">
        <label class="btn btn-ghost btn-small" style="cursor:pointer">
          Choose settings backup…
          <input type="file" accept="application/json,.json" data-action="admin-restore-file"
            style="position:absolute;width:1px;height:1px;opacity:0;overflow:hidden" ${host.state.adminRestoreApplying ? "disabled" : ""} />
        </label>
        ${host.state.adminRestoreFileName ? `<span class="muted small">${esc(host.state.adminRestoreFileName)}</span>` : ""}
        ${
          host.state.adminRestoreDoc
            ? `<button type="button" class="btn btn-ghost btn-small" data-action="admin-restore-discard" ${host.state.adminRestoreApplying ? "disabled" : ""}>Discard</button>`
            : ""
        }
      </div>
      ${host.state.adminRestoreError ? `<p class="flash flash-error">${esc(host.state.adminRestoreError)}</p>` : ""}
      ${renderAdminRestorePreview(host)}
    </section>

    <section class="card">
      <div class="section-header">
        <h2>Data backup and restore</h2>
      </div>
      <p class="muted small">
        Download one archive of the database and the WebDAV file store.
        SQLite is a consistent copy of the database file. PostgreSQL is a
        <span class="mono">pg_dump</span>. The file store is a tarball of the
        configured storage directory (usually <span class="mono">Specific/files</span>),
        without the upload temporary folder.
      </p>
      <p class="muted small">
        <span class="mono">configuration.yaml</span> stays on the server. It holds the admin password
        and the encryption key. A successful restore adds 1 to the portal session generation in that
        file and signs portal browsers out. Restoring a data backup replaces the live database and
        the file store with that archive.
      </p>
      ${host.state.adminDataExportError ? `<p class="flash flash-error">${esc(host.state.adminDataExportError)}</p>` : ""}
      <div class="form-actions-row" style="margin-top:0.75rem">
        <button type="button" class="btn btn-primary" data-action="admin-data-export-download" ${dataBusy ? "disabled" : ""}>
          ${host.state.adminDataExportBusy ? "Preparing…" : "Download data backup"}
        </button>
      </div>
      <p style="margin-top:1.25rem"><strong>Restore data</strong></p>
      <p class="muted small">
        Choose a data backup. This replaces users, calendars, contacts, and WebDAV files.
        The admin password stays in <span class="mono">configuration.yaml</span>.
        A successful restore signs every portal browser out, including this one. Sign in again.
      </p>
      ${host.state.adminDataRestoreError ? `<p class="flash flash-error">${esc(host.state.adminDataRestoreError)}</p>` : ""}
      <div class="form-actions-row" style="margin-top:0.75rem">
        <label class="btn btn-ghost btn-small" style="cursor:pointer">
          Choose data backup…
          <input type="file" accept=".tar.gz,application/gzip,application/x-gzip" data-action="admin-data-restore-file"
            style="position:absolute;width:1px;height:1px;opacity:0;overflow:hidden" ${dataBusy ? "disabled" : ""} />
        </label>
        ${dataFile ? `<span class="muted small">${esc(dataFile.name)}</span>` : ""}
        ${
          dataFile
            ? `<button type="button" class="btn btn-ghost btn-small" data-action="admin-data-restore-discard" ${dataBusy ? "disabled" : ""}>Discard</button>`
            : ""
        }
      </div>
      ${renderConfirmCheckbox({
        action: "admin-data-restore-toggle",
        label: "Replace the current database and WebDAV file store",
        checked: host.state.adminDataRestoreConfirm,
        disabled: dataBusy || !dataFile,
      })}
      <div class="form-actions-row" style="margin-top:0.75rem">
        <button type="button" class="btn btn-danger" data-action="admin-data-restore" ${canRestoreData ? "" : "disabled"}>
          ${host.state.adminDataRestoreBusy ? "Restoring…" : "Restore data backup"}
        </button>
      </div>
    </section>

    <section class="card card-danger-zone">
      <div class="section-header">
        <h2>Danger zone</h2>
      </div>
      <p class="muted small">
        <strong>Reset to Default</strong> is a full factory wipe: config, database (all users and data),
        WebDAV files, and install lock. A timestamped backup of
        <span class="mono">configuration.yaml</span> is kept next to config; <strong>back up volumes first</strong>
        if you need data recovery. Everything else is deleted, then the installer opens.
      </p>
      <div class="form-actions-row" style="margin-top:0.75rem">
        <button type="button" class="btn btn-danger" data-action="admin-reset-open" ${host.state.busy ? "disabled" : ""}>
          Reset to Default
        </button>
      </div>
    </section>
    ${renderAdminResetModal(host)}`;
}

function renderAdminRestorePreview(host: AdminHost): string {
  const preview = host.state.adminRestorePreview;
  if (!preview) return "";
  const changedKeys = Object.keys(preview.changed);
  const rows = changedKeys
    .map((key) => {
      const c = preview.changed[key];
      return `<tr>
        <td class="mono">${esc(key)}</td>
        <td class="mono">${esc(String(c.from ?? "—"))}</td>
        <td class="mono">${esc(String(c.to ?? "—"))}</td>
      </tr>`;
    })
    .join("");

  return `
    <div class="stack" style="margin-top:1rem">
      ${preview.versionMismatch ? `<p class="flash flash-info">Backup was exported from a different AngaraDAV version (${esc(preview.productVersion || "unknown")}). Values will still be validated before applying.</p>` : ""}
      ${
        changedKeys.length
          ? `<div class="contacts-table-wrap admin-table-placeholder">
              <table class="contacts-table">
                <thead><tr><th>Setting</th><th>Current</th><th>New</th></tr></thead>
                <tbody>${rows}</tbody>
              </table>
            </div>`
          : `<p class="muted small">No changes — this backup matches the current settings.</p>`
      }
      ${preview.unknown.length ? `<p class="muted small">Ignored (unknown keys): ${esc(preview.unknown.join(", "))}</p>` : ""}
      ${
        preview.invalid.length
          ? `<p class="flash flash-error">Rejected (invalid values): ${esc(preview.invalid.map((i) => `${i.key} (${i.reason})`).join("; "))}</p>`
          : ""
      }
      <div class="form-actions-row">
        <button type="button" class="btn btn-primary" data-action="admin-restore-apply"
          ${host.state.adminRestoreApplying || changedKeys.length === 0 ? "disabled" : ""}>
          ${host.state.adminRestoreApplying ? "Applying…" : "Apply changes"}
        </button>
      </div>
    </div>`;
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
          <li>Deletes <span class="mono">config/configuration.yaml</span> (timestamped backup only)</li>
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

export async function onAdminBackupDownload(host: AdminHost): Promise<void> {
  host.state.adminBackupBusy = true;
  host.state.adminBackupError = null;
  host.render();
  try {
    const res = await api.adminSettingsBackup();
    const doc = res.data;
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    await saveBlobAsFile(blob, backupFileName(doc));
    log.event("admin.settings.backup-download");
    host.setFlash("success", "Backup downloaded");
  } catch (e) {
    host.state.adminBackupError = e instanceof Error ? e.message : "Backup failed";
  } finally {
    host.state.adminBackupBusy = false;
    host.render();
  }
}

export async function onAdminDataExportDownload(host: AdminHost): Promise<void> {
  host.state.adminDataExportBusy = true;
  host.state.adminDataExportError = null;
  host.render();
  try {
    const res = await api.adminDataExport();
    await saveBlobAsFile(res.blob, res.filename || "angaradav-data.tar.gz");
    log.event("admin.data.export-download");
    host.setFlash("success", "Data backup downloaded");
  } catch (e) {
    host.state.adminDataExportError = e instanceof Error ? e.message : "Data backup failed";
  } finally {
    host.state.adminDataExportBusy = false;
    host.render();
  }
}

export async function onAdminRestoreFileSelected(host: AdminHost, file: File): Promise<void> {
  host.state.adminRestoreFileName = file.name;
  host.state.adminRestoreDoc = null;
  host.state.adminRestorePreview = null;
  host.state.adminRestoreError = null;
  host.render();
  let parsed: unknown;
  try {
    const text = await file.text();
    parsed = JSON.parse(text);
  } catch {
    host.state.adminRestoreError = "That file is not valid JSON.";
    host.render();
    return;
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    host.state.adminRestoreError = "That file is not a settings backup.";
    host.render();
    return;
  }
  const doc = parsed as Record<string, unknown> & Partial<AdminSettingsBackup>;
  host.state.adminRestoreDoc = doc;
  host.render();
  try {
    const res = await api.adminRestoreSettings(doc, { dryRun: true });
    host.state.adminRestorePreview = res.data;
    log.event("admin.settings.restore-preview");
  } catch (e) {
    host.state.adminRestoreError = e instanceof Error ? e.message : "Could not read that backup";
  } finally {
    host.render();
  }
}

export function onAdminRestoreDiscard(host: AdminHost): void {
  host.state.adminRestoreFileName = null;
  host.state.adminRestoreDoc = null;
  host.state.adminRestorePreview = null;
  host.state.adminRestoreError = null;
  host.render();
}

export async function onAdminRestoreApply(host: AdminHost): Promise<void> {
  const doc = host.state.adminRestoreDoc;
  if (!doc) return;
  host.state.adminRestoreApplying = true;
  host.state.adminRestoreError = null;
  host.render();
  try {
    const res = await api.adminRestoreSettings(doc, { dryRun: false, confirm: true });
    host.state.adminRestoreFileName = null;
    host.state.adminRestoreDoc = null;
    host.state.adminRestorePreview = null;
    log.event("admin.settings.restore-apply");
    host.setFlash(
      "success",
      res.data.applied.length ? `Restored ${res.data.applied.length} setting(s)` : "Nothing to apply",
    );
    // Settings changed on disk: force a fresh read next time System settings is opened.
    host.state.adminSystemSettings = null;
  } catch (e) {
    host.state.adminRestoreError = e instanceof Error ? e.message : "Restore failed";
  } finally {
    host.state.adminRestoreApplying = false;
    host.render();
  }
}

export function onAdminDataRestoreFileSelected(host: AdminHost, file: File): void {
  host.state.adminDataRestoreFile = file;
  host.state.adminDataRestoreError = null;
  host.render();
}

export function onAdminDataRestoreDiscard(host: AdminHost): void {
  host.state.adminDataRestoreFile = null;
  host.state.adminDataRestoreConfirm = false;
  host.state.adminDataRestoreError = null;
  host.render();
}

export async function onAdminDataRestore(host: AdminHost): Promise<void> {
  const file = host.state.adminDataRestoreFile;
  if (!file || !host.state.adminDataRestoreConfirm || host.state.adminDataRestoreBusy) return;
  host.state.adminDataRestoreBusy = true;
  host.state.adminDataRestoreError = null;
  host.render();
  let reloading = false;
  try {
    await api.adminDataRestore(file);
    log.event("admin.data.restore");
    try {
      sessionStorage.setItem(DATA_RESTORE_NOTICE_KEY, "1");
    } catch {
      /* the restored data still loads after a manual reload */
    }
    reloading = true;
    window.location.reload();
  } catch (e) {
    host.state.adminDataRestoreError = e instanceof Error ? e.message : "Data restore failed";
  } finally {
    if (!reloading) {
      host.state.adminDataRestoreBusy = false;
      host.render();
    }
  }
}
