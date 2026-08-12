/**
 * Admin Users UI + user/cal/ab save handlers (Phase 5).
 */
import { api } from "../../api";
import { log } from "../../log";
import { esc, renderConfirmCheckbox, renderModal } from "../../ui";
import type { AdminUserSummary } from "../../api";
import { infoTitle } from "../sectionInfo";
import type { AdminHost } from "./host";
import {
  adminComingSoonBanner,
  adminPageMeta,
  adminStatusBadgeClass,
  adminStatusLabel,
} from "./meta";
import {
  loadAdminUserDetail,
  loadAdminUserResources,
  loadAdminUsers,
} from "./loaders";

export function filteredAdminUsers(host: AdminHost): AdminUserSummary[] {
  const q = host.state.adminUsersQuery.trim().toLowerCase();
  if (!q) return host.state.adminUsers;
  return host.state.adminUsers.filter((u) => {
    return (
      u.username.toLowerCase().includes(q) ||
      (u.displayname || "").toLowerCase().includes(q) ||
      (u.email || "").toLowerCase().includes(q)
    );
  });
}

export function renderAdminUserCreateModal(host: AdminHost): string {
  if (!host.state.adminUserCreateOpen) return "";
  return renderModal({
    id: "admin-user-create-modal",
    title: "Add user",
    titleId: "admin-user-create-title",
    closeAction: "admin-user-create-close",
    size: "sm",
    form: true,
    formAttrs: 'data-form="admin-user-create"',
    body: `
        <p class="muted small">Creates a DAV account with a default calendar and address book.</p>
          <label>Username
            <input type="text" name="username" required maxlength="255" autocomplete="off" placeholder="alice" ${host.state.busy ? "disabled" : ""} />
          </label>
          <label>Display name
            <input type="text" name="displayname" required maxlength="255" autocomplete="off" ${host.state.busy ? "disabled" : ""} />
          </label>
          <label>Email
            <input type="email" name="email" required maxlength="255" autocomplete="off" ${host.state.busy ? "disabled" : ""} />
          </label>
          <label>Password
            <input type="password" name="password" required autocomplete="new-password" ${host.state.busy ? "disabled" : ""} />
          </label>
          <label>Confirm password
            <input type="password" name="passwordConfirm" required autocomplete="new-password" ${host.state.busy ? "disabled" : ""} />
          </label>`,
    footer: [
      { label: "Cancel", action: "admin-user-create-close", variant: "ghost", disabled: host.state.busy },
      { label: "Create user", type: "submit", variant: "primary", disabled: host.state.busy },
    ],
  });
}

export function renderAdminUserEditModal(host: AdminHost): string {
  if (!host.state.adminUserEditOpen || !host.state.adminUserDetail) return "";
  const u = host.state.adminUserDetail;
  return renderModal({
    id: "admin-user-edit-modal",
    title: "Edit user",
    titleId: "admin-user-edit-title",
    closeAction: "admin-user-edit-close",
    size: "sm",
    form: true,
    formAttrs: 'data-form="admin-user-edit"',
    body: `
        <p class="muted small">Username <span class="mono">${esc(u.username)}</span> cannot be changed. Leave password fields empty to keep the current password.</p>
          <input type="hidden" name="username" value="${esc(u.username)}" />
          <label>Display name
            <input type="text" name="displayname" required maxlength="255" value="${esc(u.displayname)}" autocomplete="off" ${host.state.busy ? "disabled" : ""} />
          </label>
          <label>Email
            <input type="email" name="email" required maxlength="255" value="${esc(u.email)}" autocomplete="off" ${host.state.busy ? "disabled" : ""} />
          </label>
          <label>New password
            <input type="password" name="password" autocomplete="new-password" placeholder="Leave empty to keep current" ${host.state.busy ? "disabled" : ""} />
          </label>
          <label>Confirm new password
            <input type="password" name="passwordConfirm" autocomplete="new-password" ${host.state.busy ? "disabled" : ""} />
          </label>`,
    footer: [
      { label: "Cancel", action: "admin-user-edit-close", variant: "ghost", disabled: host.state.busy },
      { label: "Save changes", type: "submit", variant: "primary", disabled: host.state.busy },
    ],
  });
}

export function renderAdminUserDeleteModal(host: AdminHost): string {
  if (!host.state.adminUserDeleteUsername) return "";
  const uname = host.state.adminUserDeleteUsername;
  const u =
    host.state.adminUserDetail && host.state.adminUserDetail.username.toLowerCase() === uname.toLowerCase()
      ? host.state.adminUserDetail
      : host.state.adminUsers.find((x) => x.username.toLowerCase() === uname.toLowerCase()) ?? null;
  const label = u ? `${u.displayname || u.username} (${u.username})` : uname;
  return renderModal({
    id: "admin-user-delete-modal",
    title: "Delete user",
    titleId: "admin-user-delete-title",
    closeAction: "admin-user-delete-close",
    size: "sm",
    body: `
        <p>You are about to permanently delete <strong>${esc(label)}</strong>.</p>
        <ul class="admin-feature-list muted">
          <li>All calendars, events, tasks, and notes for this user</li>
          <li>All address books and contacts</li>
          <li>WebDAV file home (moved to quarantine when files storage is enabled)</li>
        </ul>
        <p class="muted small">This cannot be undone from the portal.</p>
        ${renderConfirmCheckbox({
          action: "admin-user-delete-toggle",
          label: "I understand and want to delete this user",
          checked: host.state.adminUserDeleteConfirmChecked,
          disabled: host.state.busy,
          style: "admin",
        })}`,
    footer: [
      { label: "Cancel", action: "admin-user-delete-close", variant: "ghost", disabled: host.state.busy },
      {
        label: "Delete permanently",
        action: "admin-user-delete-confirm",
        variant: "danger",
        disabled: host.state.busy || !host.state.adminUserDeleteConfirmChecked,
        attrs: `data-username="${esc(uname)}"`,
      },
    ],
  });
}

export function renderAdminUserDetailPanel(host: AdminHost): string {
  if (!host.state.adminSelectedUsername) return "";
  if (host.state.adminUserDetailLoading && !host.state.adminUserDetail) {
    return `<section class="card admin-user-detail">
      <p class="muted">Loading user <span class="mono">${esc(host.state.adminSelectedUsername)}</span>…</p>
    </section>`;
  }
  if (host.state.adminUserDetailError && !host.state.adminUserDetail) {
    return `<section class="card admin-user-detail">
      <div class="section-header">
        <h2>User detail</h2>
        <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-close">Close</button>
      </div>
      <p class="flash flash-error">${esc(host.state.adminUserDetailError)}</p>
    </section>`;
  }
  if (!host.state.adminUserDetail) return "";
  const u = host.state.adminUserDetail;
  const calRows =
    host.state.adminUserResourcesLoading && host.state.adminUserCalendars.length === 0
      ? `<tr><td colspan="5" class="muted">Loading calendars…</td></tr>`
      : host.state.adminUserCalendars.length === 0
        ? `<tr><td colspan="5" class="muted">No calendars.</td></tr>`
        : host.state.adminUserCalendars
            .map(
              (c) => `<tr>
        <td class="mono">${esc(c.uri)}</td>
        <td>${esc(c.displayname)}</td>
        <td class="hide-sm">${esc(String(c.eventCount))}${c.todos ? ' <span class="badge badge-admin">tasks</span>' : ""}${c.notes ? ' <span class="badge badge-admin">notes</span>' : ""}</td>
        <td class="hide-sm mono small">${esc(c.davUri)}</td>
        <td class="admin-user-actions">
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-cal-edit" data-id="${c.instanceId}" ${host.state.busy ? "disabled" : ""}>Edit</button>
          <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-cal-delete" data-id="${c.instanceId}" data-label="${esc(c.displayname)}" ${host.state.busy ? "disabled" : ""}>Delete</button>
        </td>
      </tr>`,
            )
            .join("");
  const abRows =
    host.state.adminUserResourcesLoading && host.state.adminUserAddressBooks.length === 0
      ? `<tr><td colspan="4" class="muted">Loading address books…</td></tr>`
      : host.state.adminUserAddressBooks.length === 0
        ? `<tr><td colspan="4" class="muted">No address books.</td></tr>`
        : host.state.adminUserAddressBooks
            .map(
              (a) => `<tr>
        <td class="mono">${esc(a.uri)}</td>
        <td>${esc(a.displayname)}</td>
        <td class="hide-sm">${esc(String(a.contactCount))}</td>
        <td class="admin-user-actions">
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-ab-edit" data-id="${a.id}" ${host.state.busy ? "disabled" : ""}>Edit</button>
          <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-ab-delete" data-id="${a.id}" data-label="${esc(a.displayname)}" ${host.state.busy ? "disabled" : ""}>Delete</button>
        </td>
      </tr>`,
            )
            .join("");

  const editCal =
    host.state.adminCalEditId !== null
      ? host.state.adminUserCalendars.find((c) => c.instanceId === host.state.adminCalEditId) ?? null
      : null;
  const editAb =
    host.state.adminAbEditId !== null
      ? host.state.adminUserAddressBooks.find((a) => a.id === host.state.adminAbEditId) ?? null
      : null;

  const calModal =
    host.state.adminCalModal === "create" || (host.state.adminCalModal === "edit" && editCal)
      ? renderModal({
          title: host.state.adminCalModal === "create" ? "Add calendar" : "Edit calendar",
          closeAction: "admin-cal-close",
          size: "sm",
          form: true,
          formAttrs: 'data-form="admin-cal"',
          body: `
          <input type="hidden" name="instanceId" value="${editCal ? editCal.instanceId : ""}" />
          ${
            host.state.adminCalModal === "create"
              ? `<label>URI token id
            <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="work" ${host.state.busy ? "disabled" : ""} />
            <span class="muted small">Lowercase letters, digits, dashes.</span>
          </label>`
              : `<p class="muted small">URI <span class="mono">${esc(editCal!.uri)}</span> (read-only)</p>`
          }
          <label>Display name
            <input type="text" name="displayname" required value="${esc(editCal?.displayname ?? "")}" ${host.state.busy ? "disabled" : ""} />
          </label>
          <label>Description
            <textarea name="description" rows="2" ${host.state.busy ? "disabled" : ""}>${esc(editCal?.description ?? "")}</textarea>
          </label>
          <label>Color (#RRGGBB)
            <input type="text" name="calendarcolor" placeholder="#3B82F6" value="${esc(editCal?.calendarcolor ?? "")}" ${host.state.busy ? "disabled" : ""} />
          </label>
          <label class="check-row"><input type="checkbox" name="todos" ${editCal?.todos || host.state.adminCalModal === "create" ? "checked" : ""} ${host.state.busy ? "disabled" : ""} /> Tasks (VTODO)</label>
          <label class="check-row"><input type="checkbox" name="notes" ${editCal?.notes ? "checked" : ""} ${host.state.busy ? "disabled" : ""} /> Notes (VJOURNAL)</label>`,
          footer: [
            { label: "Cancel", action: "admin-cal-close", variant: "ghost", disabled: host.state.busy },
            { label: "Save", type: "submit", variant: "primary", disabled: host.state.busy },
          ],
        })
      : "";

  const abModal =
    host.state.adminAbModal === "create" || (host.state.adminAbModal === "edit" && editAb)
      ? renderModal({
          title: host.state.adminAbModal === "create" ? "Add address book" : "Edit address book",
          closeAction: "admin-ab-close",
          size: "sm",
          form: true,
          formAttrs: 'data-form="admin-ab"',
          body: `
          <input type="hidden" name="id" value="${editAb ? editAb.id : ""}" />
          ${
            host.state.adminAbModal === "create"
              ? `<label>URI token id
            <input type="text" name="uri" required pattern="[a-z0-9-]+" placeholder="personal" ${host.state.busy ? "disabled" : ""} />
          </label>`
              : `<p class="muted small">URI <span class="mono">${esc(editAb!.uri)}</span> (read-only)</p>`
          }
          <label>Display name
            <input type="text" name="displayname" required value="${esc(editAb?.displayname ?? "")}" ${host.state.busy ? "disabled" : ""} />
          </label>
          <label>Description
            <textarea name="description" rows="2" ${host.state.busy ? "disabled" : ""}>${esc(editAb?.description ?? "")}</textarea>
          </label>`,
          footer: [
            { label: "Cancel", action: "admin-ab-close", variant: "ghost", disabled: host.state.busy },
            { label: "Save", type: "submit", variant: "primary", disabled: host.state.busy },
          ],
        })
      : "";

  const resDeleteModal = host.state.adminResourceDelete
    ? renderModal({
        title: `Delete ${host.state.adminResourceDelete.kind === "calendar" ? "calendar" : "address book"}`,
        closeAction: "admin-resource-delete-close",
        size: "sm",
        body: `
        <p>Delete <strong>${esc(host.state.adminResourceDelete.label)}</strong> for <span class="mono">${esc(u.username)}</span>?</p>
        ${
          host.state.adminResourceDelete.kind === "addressbook"
            ? `<label class="check-row"><input type="checkbox" data-action="admin-ab-force-toggle" ${host.state.adminResourceDelete.force ? "checked" : ""} /> Force delete even if contacts exist</label>`
            : `<p class="muted small">Events on this calendar will be removed if this is the only instance.</p>`
        }`,
        footer: [
          { label: "Cancel", action: "admin-resource-delete-close", variant: "ghost" },
          {
            label: "Delete",
            action: "admin-resource-delete-confirm",
            variant: "danger",
            disabled: host.state.busy,
          },
        ],
      })
    : "";

  return `<section class="card admin-user-detail">
    <div class="section-header">
      <h2>User <span class="mono">${esc(u.username)}</span></h2>
      <div class="section-actions">
        <button type="button" class="btn btn-small" data-action="admin-user-edit-open" data-username="${esc(u.username)}" ${host.state.busy ? "disabled" : ""}>Edit</button>
        <button type="button" class="btn btn-small btn-danger" data-action="admin-user-delete-open" data-username="${esc(u.username)}" ${host.state.busy ? "disabled" : ""}>Delete</button>
        <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-close">Close</button>
      </div>
    </div>
    <p class="muted small admin-breadcrumb">Users → <span class="mono">${esc(u.username)}</span></p>
    <dl class="admin-dl">
      <div><dt>Username</dt><dd class="mono">${esc(u.username)}</dd></div>
      <div><dt>Display name</dt><dd>${esc(u.displayname || "—")}</dd></div>
      <div><dt>Email</dt><dd>${u.email ? `<a href="mailto:${esc(u.email)}">${esc(u.email)}</a>` : "—"}</dd></div>
      <div><dt>Principal</dt><dd class="mono">${esc(u.principal)}</dd></div>
      <div><dt>Calendars</dt><dd>${esc(String(u.calendarCount))}</dd></div>
      <div><dt>Events / objects</dt><dd>${esc(String(u.eventCount))}</dd></div>
      <div><dt>Address books</dt><dd>${esc(String(u.addressBookCount))}</dd></div>
      <div><dt>Contacts</dt><dd>${esc(String(u.contactCount))}</dd></div>
    </dl>
  </section>
  <section class="card">
    <div class="section-header">
      <h2>Calendars</h2>
      <div class="section-actions">
        <button type="button" class="btn btn-primary btn-small" data-action="admin-cal-create" ${host.state.busy ? "disabled" : ""}>Add calendar</button>
      </div>
    </div>
    <div class="contacts-table-wrap admin-table-placeholder">
      <table class="contacts-table">
        <thead><tr><th>URI</th><th>Name</th><th class="hide-sm">Objects</th><th class="hide-sm">DAV path</th><th>Actions</th></tr></thead>
        <tbody>${calRows}</tbody>
      </table>
    </div>
  </section>
  <section class="card">
    <div class="section-header">
      <h2>Address books</h2>
      <div class="section-actions">
        <button type="button" class="btn btn-primary btn-small" data-action="admin-ab-create" ${host.state.busy ? "disabled" : ""}>Add address book</button>
      </div>
    </div>
    <div class="contacts-table-wrap admin-table-placeholder">
      <table class="contacts-table">
        <thead><tr><th>URI</th><th>Name</th><th class="hide-sm">Contacts</th><th>Actions</th></tr></thead>
        <tbody>${abRows}</tbody>
      </table>
    </div>
  </section>
  ${calModal}${abModal}${resDeleteModal}`;
}

export function renderAdminUsersShell(host: AdminHost): string {
  const meta = adminPageMeta(host, "users");
  if (meta && meta.available === false) {
    return adminComingSoonBanner(host, "users");
  }

  const list = filteredAdminUsers(host);
  const rows =
    host.state.adminUsersLoading && host.state.adminUsers.length === 0
      ? `<tr><td colspan="4" class="muted admin-table-empty">Loading users…</td></tr>`
      : list.length === 0
        ? `<tr><td colspan="4" class="muted admin-table-empty">${
            host.state.adminUsersError
              ? esc(host.state.adminUsersError)
              : host.state.adminUsersQuery.trim()
                ? "No users match this filter."
                : "No users found."
          }</td></tr>`
        : list
            .map((u) => {
              const active =
                host.state.adminSelectedUsername &&
                host.state.adminSelectedUsername.toLowerCase() === u.username.toLowerCase()
                  ? " is-selected"
                  : "";
              return `<tr class="contact-table-row${active}" data-action="admin-user-view" data-username="${esc(u.username)}" tabindex="0" role="button">
                <td class="mono">${esc(u.username)}</td>
                <td class="hide-sm">${esc(u.displayname || "—")}</td>
                <td class="hide-sm">${esc(u.email || "—")}</td>
                <td class="admin-user-actions">
                  <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-view" data-username="${esc(u.username)}" ${host.state.busy ? "disabled" : ""}>View</button>
                  <button type="button" class="btn btn-ghost btn-small" data-action="admin-user-edit-open" data-username="${esc(u.username)}" ${host.state.busy ? "disabled" : ""}>Edit</button>
                  <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="admin-user-delete-open" data-username="${esc(u.username)}" ${host.state.busy ? "disabled" : ""}>Delete</button>
                </td>
              </tr>`;
            })
            .join("");

  return `
    <section class="card">
      <div class="section-header">
        ${infoTitle("Users", "admin-users")}
        <div class="section-actions">
          ${meta ? `<span class="badge ${adminStatusBadgeClass(host, meta.status)}">${esc(adminStatusLabel(host, meta.status))}</span>` : ""}
          <button type="button" class="btn btn-ghost btn-small" data-action="admin-users-refresh" ${host.state.busy || host.state.adminUsersLoading ? "disabled" : ""}>Refresh</button>
          <button type="button" class="btn btn-primary btn-small" data-action="admin-user-create-open" ${host.state.busy ? "disabled" : ""}>Add user</button>
        </div>
      </div>
      <p class="muted small">
        DAV user accounts. Passwords and digests are never returned by the API.
      </p>
      <div class="admin-users-toolbar">
        <input type="search" data-action="admin-users-search" placeholder="Filter by username, name, email…"
          value="${esc(host.state.adminUsersQuery)}" aria-label="Filter users" ${host.state.busy ? "disabled" : ""} />
        <span class="muted small">${esc(String(list.length))}${host.state.adminUsersQuery.trim() ? ` / ${host.state.adminUsers.length}` : ""} user${list.length === 1 ? "" : "s"}</span>
      </div>
      ${host.state.adminUsersError && host.state.adminUsers.length > 0 ? `<p class="flash flash-error" style="margin:0.75rem 0">${esc(host.state.adminUsersError)}</p>` : ""}
      <div class="contacts-table-wrap admin-table-placeholder">
        <table class="contacts-table">
          <thead>
            <tr>
              <th>Username</th>
              <th class="hide-sm">Display name</th>
              <th class="hide-sm">Email</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </section>
    ${renderAdminUserDetailPanel(host)}
    ${renderAdminUserCreateModal(host)}
    ${renderAdminUserEditModal(host)}
    ${renderAdminUserDeleteModal(host)}`;
}

export async function onAdminUserCreate(host: AdminHost, form: HTMLFormElement): Promise<void> {
  const fd = new FormData(form);
  const username = String(fd.get("username") ?? "").trim();
  const displayname = String(fd.get("displayname") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  const passwordConfirm = String(fd.get("passwordConfirm") ?? "");
  if (!username || !displayname || !email || !password) {
    host.setFlash("error", "Username, display name, email, and password are required");
    host.render();
    return;
  }
  if (password !== passwordConfirm) {
    host.setFlash("error", "Password confirmation does not match");
    host.render();
    return;
  }
  host.state.busy = true;
  host.clearFlash();
  host.render();
  try {
    const res = await api.adminCreateUser({
      username,
      displayname,
      email,
      password,
      passwordConfirm,
    });
    log.event("admin.user.create", { username: res.user.username });
    host.state.adminUserCreateOpen = false;
    host.state.adminSelectedUsername = res.user.username;
    host.state.adminUserDetail = res.user;
    host.persistTab("admin", "users", res.user.username);
    await loadAdminUsers(host);
    host.setFlash("success", `Created user “${res.user.username}”`);
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Create failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
}

export async function onAdminUserEdit(host: AdminHost, form: HTMLFormElement): Promise<void> {
  const fd = new FormData(form);
  const username = String(fd.get("username") ?? "").trim();
  const displayname = String(fd.get("displayname") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim();
  const password = String(fd.get("password") ?? "");
  const passwordConfirm = String(fd.get("passwordConfirm") ?? "");
  if (!username) {
    host.setFlash("error", "Username is required");
    host.render();
    return;
  }
  if (!displayname || !email) {
    host.setFlash("error", "Display name and email are required");
    host.render();
    return;
  }
  if (password !== "" || passwordConfirm !== "") {
    if (password === "" || passwordConfirm === "") {
      host.setFlash("error", "Password and confirmation are required to change password");
      host.render();
      return;
    }
    if (password !== passwordConfirm) {
      host.setFlash("error", "Password confirmation does not match");
      host.render();
      return;
    }
  }
  host.state.busy = true;
  host.clearFlash();
  host.render();
  try {
    const body: {
      displayname: string;
      email: string;
      password?: string;
      passwordConfirm?: string;
    } = { displayname, email };
    if (password !== "") {
      body.password = password;
      body.passwordConfirm = passwordConfirm;
    }
    const res = await api.adminUpdateUser(username, body);
    log.event("admin.user.update", {
      username: res.user.username,
      passwordChanged: password !== "",
    });
    host.state.adminUserEditOpen = false;
    host.state.adminUserDetail = res.user;
    host.state.adminSelectedUsername = res.user.username;
    await loadAdminUsers(host);
    host.setFlash(
      "success",
      password !== ""
        ? `Updated “${res.user.username}” (password changed)`
        : `Updated “${res.user.username}”`,
    );
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Update failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
}

export async function onAdminCalSave(host: AdminHost, form: HTMLFormElement): Promise<void> {
  if (!host.state.adminSelectedUsername) return;
  const uname = host.state.adminSelectedUsername;
  const fd = new FormData(form);
  const displayname = String(fd.get("displayname") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim();
  const calendarcolor = String(fd.get("calendarcolor") ?? "").trim();
  const todos = form.querySelector<HTMLInputElement>('input[name="todos"]')?.checked ?? false;
  const notes = form.querySelector<HTMLInputElement>('input[name="notes"]')?.checked ?? false;
  host.state.busy = true;
  host.clearFlash();
  host.render();
  try {
    if (host.state.adminCalModal === "create") {
      const uri = String(fd.get("uri") ?? "").trim().toLowerCase();
      await api.adminCreateUserCalendar(uname, {
        uri,
        displayname,
        description,
        calendarcolor: calendarcolor || undefined,
        todos,
        notes,
      });
      host.setFlash("success", `Created calendar “${displayname}”`);
    } else {
      const instanceId = Number(fd.get("instanceId"));
      await api.adminUpdateUserCalendar(uname, instanceId, {
        displayname,
        description,
        calendarcolor,
        todos,
        notes,
      });
      host.setFlash("success", `Updated calendar “${displayname}”`);
    }
    host.state.adminCalModal = null;
    host.state.adminCalEditId = null;
    await loadAdminUserResources(host, uname);
    await loadAdminUserDetail(host, uname);
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Save failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
}

export async function onAdminAbSave(host: AdminHost, form: HTMLFormElement): Promise<void> {
  if (!host.state.adminSelectedUsername) return;
  const uname = host.state.adminSelectedUsername;
  const fd = new FormData(form);
  const displayname = String(fd.get("displayname") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim();
  host.state.busy = true;
  host.clearFlash();
  host.render();
  try {
    if (host.state.adminAbModal === "create") {
      const uri = String(fd.get("uri") ?? "").trim().toLowerCase();
      await api.adminCreateUserAddressBook(uname, { uri, displayname, description });
      host.setFlash("success", `Created address book “${displayname}”`);
    } else {
      const id = Number(fd.get("id"));
      await api.adminUpdateUserAddressBook(uname, id, { displayname, description });
      host.setFlash("success", `Updated address book “${displayname}”`);
    }
    host.state.adminAbModal = null;
    host.state.adminAbEditId = null;
    await loadAdminUserResources(host, uname);
    await loadAdminUserDetail(host, uname);
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Save failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
}
