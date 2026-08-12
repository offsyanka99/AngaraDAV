/** Contacts/address-book save handlers (Phase 7). */
import { api } from "../../api";
import { contactFlashName, entityFlash } from "../format";
import type { ContactsHost } from "./host";
import { contactBodyFromForm } from "./form";
import { loadContacts } from "./loaders";

export async function onSaveContact(host: ContactsHost, form: HTMLFormElement) {
  if (host.state.selectedAbId === null) return;
  const body = contactBodyFromForm(host, form);
  const label = contactFlashName(body);
  host.state.busy = true;
  host.clearFlash();
  host.state.contactModalOpen = true;
  host.render();
  try {
    if (host.state.creatingContact) {
      const res = await api.createContact(host.state.selectedAbId, body);
      host.state.creatingContact = false;
      host.state.selectedContactUri = res.contact.uri;
      host.state.editingContact = null;
      host.state.contactModalOpen = false;
      host.state.photoPreview = null;
      host.state.photoBase64Pending = null;
      host.state.removePhotoPending = false;
      host.state.eventDtPicker = null;
      host.setFlash(
        "success",
        entityFlash("Contact", contactFlashName(res.contact) || label, "created"),
      );
    } else if (host.state.selectedContactUri) {
      const res = await api.updateContact(host.state.selectedAbId, host.state.selectedContactUri, body);
      host.state.selectedContactUri = res.contact.uri;
      host.state.editingContact = null;
      host.state.contactModalOpen = false;
      host.state.photoPreview = null;
      host.state.photoBase64Pending = null;
      host.state.removePhotoPending = false;
      host.state.eventDtPicker = null;
      host.setFlash(
        "success",
        entityFlash("Contact", contactFlashName(res.contact) || label, "saved"),
      );
    }
    // Reload list; keep selection if list fails
    try {
      await host.loadHome();
    } catch (reloadErr) {
      console.error(reloadErr);
      if (host.state.selectedAbId !== null) {
        try {
          await loadContacts(host, host.state.selectedAbId);
        } catch {
          /* ignore */
        }
      }
    }
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Save failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
}

export async function onCreateAb(host: ContactsHost, form: HTMLFormElement) {
  const fd = new FormData(form);
  const displayname = String(fd.get("displayname") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim();
  if (!displayname) return;
  host.state.busy = true;
  host.clearFlash();
  host.render();
  try {
    const res = await api.createAddressBook({ displayname, description });
    host.state.selectedAbId = res.addressbook.id;
    host.state.selectedContactUri = null;
    host.state.editingContact = null;
    host.state.creatingContact = false;
    host.state.contactSearch = "";
    await host.loadHome();
    host.setFlash("success", `Address book “${res.addressbook.displayname}” created`);
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Create failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
}

export async function onEditAb(host: ContactsHost, form: HTMLFormElement) {
  if (host.state.selectedAbId === null) return;
  const fd = new FormData(form);
  const displayname = String(fd.get("displayname") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim();
  host.state.abModalOpen = true;
  host.state.busy = true;
  host.clearFlash();
  host.render();
  try {
    await api.updateAddressBook(host.state.selectedAbId, { displayname, description });
    await host.loadHome();
    host.setFlash("success", entityFlash("Address book", displayname, "updated"));
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Update failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
}
