/**
 * Contacts tab main HTML (Phase 8 extract from renderHome).
 */
import { api, type ContactCustomField, type ContactPhone } from "../../api";
import { esc, renderConfirmCheckbox, renderModal } from "../../ui";
import { infoTitle } from "../sectionInfo";
import type { AppOrchestrator } from "../orchestrator";

export function renderContactsHome(o: AppOrchestrator): string {
  const { state } = o;
  const abRows = state.addressBooks
    .map((a) => {
      const active = a.id === state.selectedAbId ? " is-selected" : "";
      return `<div class="cal-row${active}" data-action="select-ab" data-id="${a.id}" role="button" tabindex="0">
        <span class="cal-swatch cal-swatch-empty"></span>
        <span class="cal-row-text">
          <span class="cal-row-title">${esc(a.displayname)}</span>
          <span class="muted small">${a.cardCount} contact${a.cardCount === 1 ? "" : "s"}</span>
          <span class="muted small mono cal-row-uri">${esc(a.uri)}</span>
        </span>
        <span class="cal-row-actions">
          <button type="button" class="btn btn-small" data-action="export-ab" data-id="${a.id}" ${state.busy ? "disabled" : ""} title="Export as .vcf">Export</button>
          <button type="button" class="btn btn-small" data-action="edit-ab" data-id="${a.id}" ${state.busy ? "disabled" : ""}>Edit</button>
          <button type="button" class="btn btn-small btn-danger" data-action="delete-ab" data-id="${a.id}" ${state.busy ? "disabled" : ""}>Delete</button>
        </span>
      </div>`;
    })
    .join("");

  const selectedAb = state.addressBooks.find((a) => a.id === state.selectedAbId) ?? null;

  const contactTableBody =
    state.contacts.length === 0
      ? `<tr class="contacts-empty-row"><td colspan="4" class="muted">${
          state.contactSearch
            ? "No contacts match your search."
            : "No contacts yet. Add one or import a .vcf file."
        }</td></tr>`
      : state.contacts
          .map((ct) => {
            const active =
              !state.creatingContact && ct.uri === state.selectedContactUri
                ? " is-selected"
                : "";
            const initial = esc((ct.displayname || "?").slice(0, 1).toUpperCase());
            const avatar =
              ct.hasPhoto && state.selectedAbId !== null
                ? `<img class="contact-avatar" src="${esc(api.contactPhotoUrl(state.selectedAbId, ct.uri))}" alt="" loading="lazy" data-avatar-fallback="${initial}" />`
                : `<span class="contact-avatar contact-avatar-fallback" aria-hidden="true">${initial}</span>`;
            return `<tr class="contact-table-row${active}" data-action="select-contact" data-uri="${esc(ct.uri)}" tabindex="0" role="button">
              <td class="contact-col-name">
                <span class="contact-name-cell">
                  ${avatar}
                  <span class="contact-name-text">
                    <span class="contact-name-primary">${esc(ct.displayname)}</span>
                    ${ct.org ? `<span class="muted small contact-name-secondary">${esc(ct.org)}</span>` : ""}
                  </span>
                </span>
              </td>
              <td class="contact-col-email"><span class="contact-cell-clip">${esc(ct.email || "—")}</span></td>
              <td class="contact-col-phone"><span class="contact-cell-clip">${esc(ct.phone || "—")}</span></td>
              <td class="contact-col-org hide-sm"><span class="contact-cell-clip">${esc(ct.org || "—")}</span></td>
            </tr>`;
          })
          .join("");

  const c = state.editingContact;
  const emails = Array.isArray(c?.emails) && c.emails.length > 0 ? c.emails : [""];
  const phones: ContactPhone[] =
    Array.isArray(c?.phones) && c.phones.length > 0
      ? c.phones
      : [{ type: "cell", value: "" }];
  const addr = c?.address ?? o.emptyAddress();

  const emailRows = emails
    .map(
      (e, i) => `<div class="multi-row" data-multi="email" data-idx="${i}">
        <input type="email" name="email_${i}" value="${esc(e ?? "")}" placeholder="email@example.com" autocomplete="off" />
        <button type="button" class="btn btn-ghost btn-small" data-action="remove-email" data-idx="${i}" ${emails.length <= 1 ? "disabled" : ""} title="Remove">×</button>
      </div>`,
    )
    .join("");

  const phoneRows = phones
    .map(
      (p, i) => `<div class="multi-row multi-row-phone" data-multi="phone" data-idx="${i}">
        <select name="phone_type_${i}" aria-label="Phone type">
          ${(["cell", "work", "home", "other"] as const)
            .map(
              (t) =>
                `<option value="${t}" ${(p?.type ?? "other") === t ? "selected" : ""}>${t}</option>`,
            )
            .join("")}
        </select>
        <input type="tel" name="phone_value_${i}" value="${esc(p?.value ?? "")}" placeholder="+1…" autocomplete="off" />
        <button type="button" class="btn btn-ghost btn-small" data-action="remove-phone" data-idx="${i}" ${phones.length <= 1 ? "disabled" : ""} title="Remove">×</button>
      </div>`,
    )
    .join("");

  const customFields: ContactCustomField[] = Array.isArray(c?.custom) ? c.custom : [];
  const customRows =
    customFields.length === 0
      ? `<p class="muted small" style="margin:0 0 0.5rem">No custom fields yet. Labels and values can use any language (e.g. Супруг, 日本語).</p>`
      : customFields
          .map(
            (cf, i) => `<div class="multi-row multi-row-custom" data-multi="custom" data-idx="${i}">
              <input type="text" name="custom_label_${i}" value="${esc(cf.label || "")}" placeholder="Label (any language)" maxlength="64" autocomplete="off" aria-label="Custom field label" />
              <input type="text" name="custom_value_${i}" value="${esc(cf.value || "")}" placeholder="Value" maxlength="2000" autocomplete="off" aria-label="Custom field value" />
              <button type="button" class="btn btn-ghost btn-small" data-action="remove-custom" data-idx="${i}" title="Remove">×</button>
            </div>`,
          )
          .join("");

  const contactModal =
    state.contactModalOpen && c && selectedAb
      ? `<div class="cal-modal" id="contact-edit-modal" role="dialog" aria-modal="true" aria-labelledby="contact-modal-title">
          <div class="cal-modal-backdrop" data-action="close-contact-modal"></div>
          <div class="cal-modal-card cal-modal-card-wide">
            <header class="cal-modal-header">
              <h3 id="contact-modal-title">${state.creatingContact ? "New contact" : "Edit contact"}</h3>
              <button type="button" class="info-modal-close" data-action="close-contact-modal" aria-label="Close">×</button>
            </header>
            <div class="cal-modal-body">
              ${o.renderFlashBanner()}
              <form class="stack" data-form="contact">
                <div class="contact-photo-row">
                  <div class="contact-photo-preview">
                    ${
                      state.photoPreview
                        ? `<img src="${esc(state.photoPreview)}" alt="Contact photo" />`
                        : `<span class="contact-avatar contact-avatar-fallback contact-avatar-lg" aria-hidden="true">${esc((c.fullname || c.firstname || "?").slice(0, 1).toUpperCase())}</span>`
                    }
                  </div>
                  <div class="stack stack-tight" style="flex:1">
                    <label class="btn btn-ghost file-btn" ${state.busy ? "aria-disabled=true" : ""}>
                      ${state.photoPreview ? "Change photo" : "Upload photo"}
                      <input type="file" accept="image/*" data-action="contact-photo" ${state.busy ? "disabled" : ""} hidden />
                    </label>
                    ${
                      state.photoPreview || c.hasPhoto
                        ? `<button type="button" class="btn btn-ghost btn-small" data-action="remove-photo" ${state.busy ? "disabled" : ""}>Remove photo</button>`
                        : ""
                    }
                    <span class="muted small">JPEG/PNG, resized to 256px on save.</span>
                  </div>
                </div>
                <div class="form-grid form-grid-2">
                  <label>First name
                    <input type="text" name="firstname" value="${esc(c.firstname)}" maxlength="200" autocomplete="off" />
                  </label>
                  <label>Last name
                    <input type="text" name="lastname" value="${esc(c.lastname)}" maxlength="200" autocomplete="off" />
                  </label>
                </div>
                <label>Full name
                  <input type="text" name="fullname" value="${esc(c.fullname)}" maxlength="200" placeholder="Auto from first/last if empty" autocomplete="off" />
                </label>
                <div class="form-grid form-grid-2">
                  <label>Organization
                    <input type="text" name="org" value="${esc(c.org)}" maxlength="200" autocomplete="off" />
                  </label>
                  <label>Title
                    <input type="text" name="title" value="${esc(c.title)}" maxlength="200" autocomplete="off" />
                  </label>
                </div>
                <div class="form-grid form-grid-2 contact-email-phone">
                  <fieldset class="fieldset">
                    <legend>Emails</legend>
                    ${emailRows}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-email" ${emails.length >= 10 ? "disabled" : ""}>+ Email</button>
                  </fieldset>
                  <fieldset class="fieldset">
                    <legend>Phones</legend>
                    ${phoneRows}
                    <button type="button" class="btn btn-ghost btn-small" data-action="add-phone" ${phones.length >= 10 ? "disabled" : ""}>+ Phone</button>
                  </fieldset>
                </div>
                <fieldset class="fieldset fieldset-address">
                  <legend>Address</legend>
                  <label>Street
                    <input type="text" name="street" value="${esc(addr.street)}" maxlength="300" autocomplete="off" />
                  </label>
                  <div class="form-grid form-grid-2">
                    <label>City
                      <input type="text" name="city" value="${esc(addr.city)}" maxlength="120" autocomplete="off" />
                    </label>
                    <label>Region
                      <input type="text" name="region" value="${esc(addr.region)}" maxlength="120" autocomplete="off" />
                    </label>
                  </div>
                  <div class="form-grid form-grid-2">
                    <label>Postal/ZIP code
                      <input type="text" name="postal" value="${esc(addr.postal)}" maxlength="40" autocomplete="off" />
                    </label>
                    <label>Country
                      <input type="text" name="country" value="${esc(addr.country)}" maxlength="120" autocomplete="off" />
                    </label>
                  </div>
                </fieldset>
                <label>Website
                  <input type="url" name="url" value="${esc(c.url)}" maxlength="500" placeholder="https://" autocomplete="off" />
                </label>
                ${o.renderPortalDateTimeField({
                  field: "birthday",
                  name: "birthday",
                  label: "Birthday",
                  value: c.birthday || "",
                  dateOnly: true,
                  allowClear: true,
                })}
                <fieldset class="fieldset fieldset-custom">
                  <legend>Custom fields</legend>
                  ${customRows}
                  <button type="button" class="btn btn-ghost btn-small" data-action="add-custom" ${customFields.length >= 30 ? "disabled" : ""}>+ Custom field</button>
                </fieldset>
                <label>Notes
                  <textarea name="note" rows="3" maxlength="4000">${esc(c.note)}</textarea>
                </label>
                <div class="form-actions-row form-actions-wrap">
                  <button type="submit" class="btn btn-primary" ${state.busy ? "disabled" : ""}>${state.creatingContact ? "Create contact" : "Save contact"}</button>
                  ${
                    !state.creatingContact && c.uri
                      ? `<button type="button" class="btn" data-action="export-contact" ${state.busy ? "disabled" : ""}>Export .vcf</button>`
                      : ""
                  }
                  ${
                    !state.creatingContact
                      ? `<button type="button" class="btn btn-danger" data-action="delete-contact" ${state.busy ? "disabled" : ""}>Delete</button>`
                      : ""
                  }
                  <button type="button" class="btn btn-ghost" data-action="close-contact-modal" ${state.busy ? "disabled" : ""}>Cancel</button>
                  ${
                    !state.creatingContact && c.uri
                      ? `<span class="muted small mono">${esc(c.uri)}</span>`
                      : ""
                  }
                </div>
              </form>
            </div>
          </div>
        </div>`
      : "";

  const abModal =
    state.abModalOpen && selectedAb
      ? renderModal({
          id: "ab-edit-modal",
          title: "Address book details",
          titleId: "ab-modal-title",
          closeAction: "close-ab-modal",
          body: `
              ${o.renderFlashBanner()}
              <section>
                <p class="muted small mono" style="margin:0">
                  ${esc(selectedAb.uri)} · ${selectedAb.cardCount} contact${selectedAb.cardCount === 1 ? "" : "s"}
                  <button type="button" class="info-btn" data-action="info" data-info="address-books"
                    aria-label="About address books" title="About address books"
                    style="vertical-align:middle;margin-left:0.35rem">
                    <span aria-hidden="true">i</span>
                  </button>
                </p>
                <form class="stack" data-form="edit-ab" style="margin-top:1rem">
                  <label>Display name
                    <input type="text" name="displayname" required maxlength="200" value="${esc(selectedAb.displayname)}" autocomplete="off" />
                  </label>
                  <label>Description
                    <textarea name="description" rows="3" maxlength="2000" placeholder="Optional notes for this address book">${esc(selectedAb.description)}</textarea>
                  </label>
                  <div class="form-actions-row">
                    <button type="submit" class="btn btn-primary" ${state.busy ? "disabled" : ""}>Save changes</button>
                    <span class="muted small mono">${esc(selectedAb.uri)}</span>
                  </div>
                </form>
                <div class="import-export" style="margin-top:1.35rem">
                  ${infoTitle("Import / export", "contact-import-export")}
                  <div class="form-actions-row form-actions-wrap" style="margin-top:0.75rem">
                    <button type="button" class="btn" data-action="export-ab" ${state.busy ? "disabled" : ""}>Export .vcf</button>
                    <label class="btn btn-ghost file-btn" ${state.busy ? "aria-disabled=true" : ""}>
                      Import .vcf
                      <input type="file" accept=".vcf,text/vcard,text/x-vcard,text/plain" data-action="import-ab" ${state.busy ? "disabled" : ""} hidden />
                    </label>
                  </div>
                </div>
              </section>`,
          footer: [{ label: "Close", action: "close-ab-modal", variant: "ghost" }],
        })
      : "";

  const deleteAbTarget =
    state.deleteAbConfirmId !== null
      ? state.addressBooks.find((a) => a.id === state.deleteAbConfirmId) ?? null
      : null;
  const abDeleteModal = deleteAbTarget
    ? renderModal({
        id: "ab-delete-modal",
        title: "Delete address book",
        titleId: "ab-delete-title",
        closeAction: "cancel-delete-ab",
        size: "sm",
        body: `
            ${o.renderFlashBanner()}
            <p>You are about to permanently delete <strong>${esc(deleteAbTarget.displayname)}</strong>
              <span class="muted small mono">(${esc(deleteAbTarget.uri)})</span>.</p>
            <p class="muted small">${
              (deleteAbTarget.cardCount ?? 0) > 0
                ? `All ${deleteAbTarget.cardCount} contact${deleteAbTarget.cardCount === 1 ? "" : "s"} in this address book will be removed. This cannot be undone.`
                : "This address book is empty. This cannot be undone."
            }</p>
            ${renderConfirmCheckbox({
              action: "toggle-delete-ab-confirm",
              label: "I understand and want to permanently delete this address book",
              id: "delete-ab-confirm",
              style: "checkbox",
            })}`,
        footer: [
          { label: "Cancel", action: "cancel-delete-ab", variant: "ghost", disabled: state.busy },
          {
            label: "Delete permanently",
            action: "confirm-delete-ab",
            variant: "danger",
            disabled: true,
            id: "delete-ab-submit",
            attrs: `data-id="${deleteAbTarget.id}"`,
          },
        ],
      })
    : "";

  return `
    <div class="portal-grid portal-grid-contacts">
      <aside class="contacts-sidebar">
        <section class="card contacts-sidebar-card">
          <div class="contacts-sidebar-head">
            ${infoTitle("Address books", "address-books")}
          </div>
          <div class="cal-list contacts-ab-list">
            ${abRows || '<p class="muted">No address books yet. Create one below.</p>'}
          </div>
          <div class="contacts-sidebar-create">
            <h3 class="h3-inline">Add address book</h3>
            <form class="stack stack-tight" data-form="create-ab" style="margin-top:0.5rem">
              <label>Display name
                <input type="text" name="displayname" required maxlength="200" placeholder="Personal" autocomplete="off" />
              </label>
              <label>Description
                <input type="text" name="description" maxlength="2000" placeholder="Optional" />
              </label>
              <button type="submit" class="btn btn-primary" ${state.busy ? "disabled" : ""}>Create</button>
            </form>
          </div>
        </section>
      </aside>
      <section class="contacts-main-col">
        ${
          selectedAb
            ? `<div class="card contacts-main-card">
                <div class="contacts-main-head">
                  ${infoTitle("Contacts", "contacts")}
                  <div class="contact-toolbar" style="margin-top:0.75rem">
                    <input type="search" name="contact-search" data-action="contact-search" placeholder="Search contacts…"
                      value="${esc(state.contactSearch)}" aria-label="Search contacts" ${state.busy ? "disabled" : ""} />
                    <button type="button" class="btn btn-primary" data-action="new-contact" ${state.busy ? "disabled" : ""}>Add contact</button>
                  </div>
                </div>
                <div class="contacts-table-wrap contacts-table-wrap-tall">
                  <table class="contacts-table">
                    <thead>
                      <tr>
                        <th class="contact-col-name">Name</th>
                        <th class="contact-col-email">Email</th>
                        <th class="contact-col-phone">Phone</th>
                        <th class="contact-col-org hide-sm">Organization</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${contactTableBody}
                    </tbody>
                  </table>
                </div>
                <p class="muted small contacts-main-hint">Select a contact to edit, or use <strong>Add contact</strong>.</p>
              </div>`
            : `<div class="card contacts-main-card contacts-main-empty"><p class="muted">Select an address book to manage contacts.</p></div>`
        }
      </section>
    </div>
    ${abDeleteModal}
    ${abModal}
    ${contactModal}`;

}

