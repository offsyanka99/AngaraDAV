/**
 * Administration → Subscriptions. Shown only while WebDAV-Push is on.
 */
import { esc } from "../../ui";
import { formatMtime } from "../format";
import { infoIconHtml } from "../sectionInfo";
import type { AdminHost } from "./host";
import { adminPageMeta, adminStatusBadgeClass, adminStatusLabel } from "./meta";
import {
  endpointDisplay,
  subscriptionEmptyMessage,
  subscriptionKindLabel,
  triggerDisplay,
} from "./subscriptionsListing";

export function renderAdminSubscriptionsShell(host: AdminHost): string {
  const meta = adminPageMeta(host, "subscriptions");
  const data = host.state.adminSubscriptions;
  const rows = data?.subscriptions ?? [];
  const error = host.state.adminSubscriptionsError;
  const showExpired = host.state.adminSubscriptionsShowExpired;
  const selected = new Set(host.state.adminSubscriptionSelection);
  const busy = host.state.busy;
  const allChecked = rows.length > 0 && rows.every((row) => selected.has(row.id));
  const expiredHidden = data?.expiredHidden ?? 0;
  const expiredLabel = showExpired
    ? "Hide expired"
    : expiredHidden > 0
      ? `Show expired (${expiredHidden})`
      : "Show expired";

  const body =
    data == null && !error
      ? `<tr><td colspan="9" class="muted admin-table-empty">Loading subscriptions…</td></tr>`
      : rows.length === 0
        ? `<tr><td colspan="9" class="muted admin-table-empty">${esc(
            subscriptionEmptyMessage({ error, showExpired }),
          )}</td></tr>`
        : rows
            .map((row) => {
              const checked = selected.has(row.id) ? " checked" : "";
              return `<tr class="${row.expired ? "admin-subscription-expired" : ""}">
                <td>
                  <input type="checkbox" name="admin-subscription-check" data-id="${row.id}"${checked}
                    aria-label="Select subscription for ${esc(row.username)}" ${busy ? "disabled" : ""} />
                </td>
                <td class="mono">${esc(row.username)}</td>
                <td>${esc(subscriptionKindLabel(row.kind))}</td>
                <td class="mono">${esc(row.resourceUri)}</td>
                <td class="mono">${esc(endpointDisplay(row.endpointHost, row.endpointHint))}</td>
                <td class="hide-sm">${esc(triggerDisplay(row.contentDepth, row.propertyDepth))}</td>
                <td class="hide-sm">${esc(formatMtime(row.created))}</td>
                <td class="hide-sm">${esc(formatMtime(row.expires))}</td>
                <td>
                  <button type="button" class="btn btn-ghost btn-small btn-danger-text"
                    data-action="admin-subscription-delete" data-id="${row.id}" ${busy ? "disabled" : ""}>Remove</button>
                </td>
              </tr>`;
            })
            .join("");

  const info = infoIconHtml({
    title: "Subscriptions",
    paragraphs: [
      "Removing a row stops notifications to that device. The device registers again the next time it sets up WebDAV-Push.",
      "Rows also expire on their own.",
    ],
  });

  return `
    <section class="card">
      <div class="section-header">
        <div class="section-title-row">
          <h2>Subscriptions</h2>
          ${info}
        </div>
        <div class="section-actions">
          ${meta ? `<span class="badge ${adminStatusBadgeClass(host, meta.status)}">${esc(adminStatusLabel(host, meta.status))}</span>` : ""}
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-subscriptions-refresh" ${busy ? "disabled" : ""}>Refresh</button>
        </div>
      </div>
      <p class="muted small">WebDAV-Push registrations. The endpoint address and keys are not shown.</p>
      <div class="admin-users-toolbar">
        <button type="button" class="btn btn-ghost btn-small" data-action="admin-subscriptions-toggle-expired" ${busy ? "disabled" : ""}>${esc(expiredLabel)}</button>
        <button type="button" class="btn btn-danger btn-small" data-action="admin-subscriptions-delete-selected" ${busy || selected.size === 0 ? "disabled" : ""}>Remove selected</button>
        <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-subscriptions-purge" ${busy ? "disabled" : ""}>Remove expired</button>
        <span class="muted small">${esc(String(rows.length))} subscription${rows.length === 1 ? "" : "s"}${selected.size > 0 ? `, ${selected.size} selected` : ""}</span>
      </div>
      <div class="contacts-table-wrap admin-table-placeholder">
        <table class="contacts-table">
          <thead>
            <tr>
              <th>
                <input type="checkbox" name="admin-subscription-select-all" ${allChecked ? "checked" : ""}
                  aria-label="Select all subscriptions" ${busy || rows.length === 0 ? "disabled" : ""} />
              </th>
              <th>User</th>
              <th>Kind</th>
              <th>Resource</th>
              <th>Endpoint</th>
              <th class="hide-sm">Triggers</th>
              <th class="hide-sm">Created</th>
              <th class="hide-sm">Expires</th>
              <th></th>
            </tr>
          </thead>
          <tbody>${body}</tbody>
        </table>
      </div>
    </section>`;
}
