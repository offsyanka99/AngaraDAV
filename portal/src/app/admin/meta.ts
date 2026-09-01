/**
 * Admin chrome helpers (Phase 5).
 */
import type { AdminCapabilityPage } from "../../api";
import { esc } from "../../ui";
import type { AdminPageId } from "../types";
import type { AdminHost } from "./host";

function parseAdminPageId(raw: string | null | undefined): AdminPageId | null {
  if (
    raw === "overview" ||
    raw === "users" ||
    raw === "settings" ||
    raw === "database" ||
    raw === "configuration"
  ) {
    return raw;
  }
  return null;
}

export function adminPageMeta(host: AdminHost, pageId: AdminPageId): AdminCapabilityPage | null {
  const pages = host.state.adminCapabilities?.pages;
  if (!pages) return null;
  return pages.find((p) => p.id === pageId) ?? null;
}

export function adminStatusLabel(_host: AdminHost, status: string): string {
  switch (status) {
    case "full":
      return "Full";
    case "read-only":
      return "Read-only";
    case "coming-soon":
      return "Coming soon";
    case "deferred":
      return "Unavailable";
    default:
      return status;
  }
}

export function adminStatusBadgeClass(_host: AdminHost, status: string): string {
  if (status === "full" || status === "read-only") return "badge-ok";
  if (status === "deferred") return "badge-off";
  return "badge-soon";
}

export function adminSubnavButtons(host: AdminHost): string {
  /** Fixed UI order: Overview → System settings → Users → Database → Configuration */
  const order: AdminPageId[] = ["overview", "settings", "users", "database", "configuration"];
  const labels: Record<AdminPageId, string> = {
    overview: "Overview",
    settings: "System settings",
    users: "Users",
    database: "Database",
    configuration: "Configuration",
  };
  const fromApi = host.state.adminCapabilities?.pages;
  const byId = new Map<string, AdminCapabilityPage>();
  if (fromApi) {
    for (const p of fromApi) {
      if (parseAdminPageId(p.id)) byId.set(p.id, p);
    }
  }

  return order
    .map((id) => {
      const p = byId.get(id);
      const label = p?.label || labels[id];
      const status = p?.status ?? (id === "overview" ? "read-only" : "full");
      const gated = p?.available === false;
      return `<button type="button" role="tab" class="tab-btn${host.state.adminPage === id ? " is-active" : ""}${gated ? " is-gated" : ""}"
          data-action="admin-page" data-admin-page="${id}"
          aria-selected="${host.state.adminPage === id}"
          title="${esc(label)}${gated ? " — " + adminStatusLabel(host, status) : ""}">
          ${esc(label)}
        </button>`;
    })
    .join("");
}

export function adminComingSoonBanner(host: AdminHost, pageId: AdminPageId): string {
  const meta = adminPageMeta(host, pageId);
  const status = meta?.status ?? "coming-soon";
  const label = meta?.label ?? pageId;
  const summary =
    meta?.summary || "This area is not available in portal Administration yet.";
  const statusText = adminStatusLabel(host, status);

  return `<section class="card admin-coming-soon-card">
    <div class="admin-coming-soon-head">
      <span class="badge ${adminStatusBadgeClass(host, status)}">${esc(statusText)}</span>
      <h2 class="admin-coming-soon-title">${esc(label)}</h2>
    </div>
    <p class="muted">${esc(summary)}</p>
  </section>`;
}

export function adminStatCard(
  _host: AdminHost,
  label: string,
  value: string | number,
  hint?: string,
): string {
  return `<div class="admin-stat-card">
    <div class="admin-stat-value mono">${esc(String(value))}</div>
    <div class="admin-stat-label">${esc(label)}</div>
    ${hint ? `<div class="admin-stat-hint muted small">${esc(hint)}</div>` : ""}
  </div>`;
}

export function serviceBadge(_host: AdminHost, on: boolean, label: string): string {
  return `<span class="badge ${on ? "badge-ok" : "badge-off"}">${esc(label)}: ${on ? "On" : "Off"}</span>`;
}

export function serviceOnOff(_host: AdminHost, on: boolean): string {
  return `<span class="badge ${on ? "badge-ok" : "badge-off"}">${on ? "On" : "Off"}</span>`;
}
