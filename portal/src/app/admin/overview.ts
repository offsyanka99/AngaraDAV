/**
 * Admin Overview page (Phase 5).
 */
import { esc } from "../../ui";
import { infoTitle } from "../sectionInfo";
import type { AdminHost } from "./host";
import {
  adminComingSoonBanner,
  adminPageMeta,
  adminStatCard,
  adminStatusBadgeClass,
  adminStatusLabel,
  serviceBadge,
  serviceOnOff,
} from "./meta";

export function renderAdminOverview(host: AdminHost): string {
  const meta = adminPageMeta(host, "overview");
  if (meta && meta.available === false) {
    return adminComingSoonBanner(host, "overview");
  }

  const roleLine = `<p class="muted small admin-session-line">
    Signed in as <span class="mono">${esc(host.state.user?.username ?? "")}</span>
    with role <span class="badge badge-admin">Admin</span>.
  </p>`;

  let aboutBlock = "";
  let statsBlock = "";
  if (host.state.adminDashboardLoading && !host.state.adminDashboard) {
    statsBlock = `<section class="card"><p class="muted">Loading overview…</p></section>`;
  } else if (host.state.adminDashboardError && !host.state.adminDashboard) {
    statsBlock = `<section class="card">
      <p class="flash flash-error" style="margin-bottom:0.75rem">${esc(host.state.adminDashboardError)}</p>
      <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${host.state.busy ? "disabled" : ""}>Retry</button>
    </section>`;
  } else if (host.state.adminDashboard) {
    const d = host.state.adminDashboard;
    const svc = d.services;
    const links = d.links ?? {};
    const statusBadge = meta
      ? `<span class="badge ${adminStatusBadgeClass(host, meta.status)}">${esc(adminStatusLabel(host, meta.status))}</span>`
      : "";
    const versionLabel = d.version ? esc(d.version) : "—";
    const gitLabel = d.git ? esc(d.git) : "";

    aboutBlock = `
      <section class="card admin-about-card">
        <div class="section-header">
          ${infoTitle("About this system", "admin-overview")}
          <div class="section-actions">
            ${statusBadge}
            <button type="button" class="btn btn-ghost btn-small" data-action="admin-refresh" ${host.state.busy || host.state.adminDashboardLoading ? "disabled" : ""}>Refresh</button>
          </div>
        </div>
        <div class="admin-about-grid">
          <div>
            <h3 class="admin-subsection-title">Version</h3>
            <p>
              AngaraDAV <span class="badge badge-admin">v${versionLabel}</span>
              ${gitLabel ? `<span class="mono muted small"> (${gitLabel})</span>` : ""}
            </p>
            <p class="muted small admin-link-row">
              ${links.releases ? `<a href="${esc(links.releases)}" target="_blank" rel="noopener noreferrer">Releases</a>` : ""}
              ${links.docs ? `${links.releases ? `<span class="footer-sep">·</span>` : ""}<a href="${esc(links.docs)}" target="_blank" rel="noopener noreferrer">Docs</a>` : ""}
            </p>
          </div>
          <div>
            <h3 class="admin-subsection-title">Services</h3>
            <div class="admin-service-table-wrap">
              <table class="admin-kv-table">
                <tbody>
                  <tr><td>Administration</td><td>${serviceOnOff(host, svc.administration !== false && svc.webAdmin !== false)}</td></tr>
                  <tr><td>CalDAV</td><td>${serviceOnOff(host, !!svc.caldav)}</td></tr>
                  <tr><td>CardDAV</td><td>${serviceOnOff(host, !!svc.carddav)}</td></tr>
                  <tr><td>Files</td><td>${serviceOnOff(host, !!svc.files)}</td></tr>
                  <tr><td>Tasks</td><td>${serviceOnOff(host, !!svc.tasks)}</td></tr>
                  <tr><td>Notes</td><td>${serviceOnOff(host, !!svc.notes)}</td></tr>
                  <tr><td>Push</td><td>${serviceOnOff(host, !!svc.push)}</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        ${roleLine}
      </section>`;

    const nUsers = d.nbusers ?? d.users;
    const nCals = d.nbcalendars ?? d.calendars;
    const nEvents = d.nbevents ?? d.events;
    const nBooks = d.nbbooks ?? d.addressBooks;
    const nContacts = d.nbcontacts ?? d.contacts;
    statsBlock = `
      <section class="card admin-stats-card">
        <div class="section-header">
          <h2>Statistics</h2>
        </div>
        <div class="admin-stat-grid">
          ${adminStatCard(host, "Registered users", nUsers, "Users")}
          ${adminStatCard(host, "Calendars", nCals, "CalDAV")}
          ${adminStatCard(host, "Events", nEvents, "CalDAV")}
          ${adminStatCard(host, "Address books", nBooks, "CardDAV")}
          ${adminStatCard(host, "Contacts", nContacts, "CardDAV")}
        </div>
        <div class="admin-service-row">
          ${serviceBadge(host, svc.administration !== false && svc.webAdmin !== false, "Administration")}
          ${serviceBadge(host, !!svc.caldav, "CalDAV")}
          ${serviceBadge(host, !!svc.carddav, "CardDAV")}
          ${serviceBadge(host, !!svc.files, "Files")}
          ${serviceBadge(host, !!svc.tasks, "Tasks")}
          ${serviceBadge(host, !!svc.notes, "Notes")}
          ${serviceBadge(host, !!svc.push, "Push")}
        </div>
      </section>`;
  } else {
    statsBlock = `<section class="card">
      ${infoTitle("System snapshot", "admin-overview")}
      ${roleLine}
    </section>`;
  }

  return `${aboutBlock}
    ${statsBlock}`;
}
