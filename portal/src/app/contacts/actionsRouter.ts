/**
 * Contacts / address-book data-action router (onAction split Step 4).
 * Owns: AB select/edit/delete/export; contact select/new/fields/photo/export.
 */
import { api } from "../../api";
import type { AppOrchestrator } from "../orchestrator";
import { runBulkContactAction } from "./actions";
import { syncContactFormFromDom } from "./form";

/**
 * Handle contacts-tab actions. Returns true if the action was recognized
 * (including early no-ops).
 */
export async function handleContactsAction(
  o: AppOrchestrator,
  action: string,
  t: HTMLElement,
  ev: Event,
): Promise<boolean> {
  const { state, root, render, setFlash, clearFlash } = o;

  if (action === "select-ab") {
    const id = Number(t.dataset.id);
    if (!Number.isFinite(id)) return true;
    state.selectedAbId = id;
    state.abModalOpen = false;
    state.selectedContactUri = null;
    state.editingContact = null;
    state.creatingContact = false;
    state.contactModalOpen = false;
    state.contactSearch = "";
    // Clear list immediately so we never paint previous AB contacts with the new AB id
    // (that caused /addressbooks/{newId}/contacts/{oldUri}/photo → 404).
    state.contacts = [];
    state.checkedContactUris = [];
    state.photoPreview = null;
    state.photoBase64Pending = null;
    state.removePhotoPending = false;
    clearFlash();
    state.busy = true;
    render();
    try {
      await o.loadContacts(id);
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Failed to load contacts");
    } finally {
      state.busy = false;
      render();
    }
    return true;
  }

  if (action === "edit-ab") {
    ev.stopPropagation();
    const id = Number(t.dataset.id);
    if (!Number.isFinite(id)) return true;
    const ab = state.addressBooks.find((a) => a.id === id);
    if (!ab) return true;
    const switched = state.selectedAbId !== id;
    state.selectedAbId = id;
    state.abModalOpen = true;
    state.contactModalOpen = false;
    clearFlash();
    if (switched) {
      state.selectedContactUri = null;
      state.editingContact = null;
      state.creatingContact = false;
      state.contactSearch = "";
      state.contacts = [];
      state.checkedContactUris = [];
      state.photoPreview = null;
      state.photoBase64Pending = null;
      state.removePhotoPending = false;
    }
    state.busy = true;
    render();
    try {
      if (switched) {
        await o.loadContacts(id);
      }
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Failed to open address book");
    } finally {
      state.busy = false;
      render();
    }
    return true;
  }

  if (action === "close-ab-modal") {
    state.abModalOpen = false;
    render();
    return true;
  }

  if (action === "contact-check") {
    ev.preventDefault();
    ev.stopPropagation();
    const uri = t.dataset.uri ?? "";
    if (!uri) return true;
    if (state.checkedContactUris.includes(uri)) {
      state.checkedContactUris = state.checkedContactUris.filter((u) => u !== uri);
    } else {
      state.checkedContactUris = [...state.checkedContactUris, uri];
    }
    render();
    return true;
  }

  if (action === "contact-select-all") {
    ev.preventDefault();
    const allOn =
      state.contacts.length > 0 &&
      state.contacts.every((c) => state.checkedContactUris.includes(c.uri));
    state.checkedContactUris = allOn ? [] : state.contacts.map((c) => c.uri);
    render();
    return true;
  }

  if (action === "contact-clear-selection") {
    state.checkedContactUris = [];
    render();
    return true;
  }

  if (action === "contact-bulk-copy") {
    await runBulkContactAction(o.contactsHost, "copy");
    return true;
  }

  if (action === "contact-bulk-delete") {
    const n = state.checkedContactUris.length;
    if (n === 0) {
      setFlash("error", "No contacts selected");
      render();
      return true;
    }
    state.confirmDelete = {
      scope: "bulk-contact",
      title: n === 1 ? "Delete contact" : `Delete ${n} contacts`,
      message: n === 1 ? "Delete the selected contact?" : `Delete ${n} selected contacts?`,
      detail: "CardDAV clients will sync the removal. This cannot be undone.",
    };
    render();
    return true;
  }

  if (action === "contact-bulk-export") {
    const uris = [...state.checkedContactUris];
    if (state.selectedAbId === null || uris.length === 0) {
      setFlash("error", "No contacts selected");
      render();
      return true;
    }
    state.busy = true;
    clearFlash();
    render();
    try {
      const { blob, filename } = await api.exportContacts(state.selectedAbId, uris);
      const outcome = await o.saveBlobAsFile(blob, filename);
      if (outcome === "cancelled") setFlash("info", "Export cancelled");
      else if (outcome === "saved") setFlash("success", `Saved ${filename}`);
      else setFlash("success", `Download started: ${filename}`);
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Export failed");
    } finally {
      state.busy = false;
      render();
    }
    return true;
  }

  if (action === "select-contact") {
    if ((ev.target as HTMLElement).closest("[data-stop-row], .row-check")) return true;
    const uri = t.dataset.uri ?? "";
    if (!uri) return true;
    // Avoid intermediate busy re-render (that jumps scroll); load then paint once.
    clearFlash();
    try {
      await o.openContact(uri);
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Failed to load contact");
    }
    render();
    return true;
  }

  if (action === "new-contact") {
    if (state.selectedAbId === null) return true;
    o.startNewContact();
    clearFlash();
    render();
    return true;
  }

  if (action === "cancel-contact" || action === "close-contact-modal") {
    state.creatingContact = false;
    state.contactModalOpen = false;
    state.editingContact = null;
    state.selectedContactUri = null;
    state.photoPreview = null;
    state.photoBase64Pending = null;
    state.removePhotoPending = false;
    state.eventDtPicker = null;
    clearFlash();
    render();
    return true;
  }

  if (action === "add-email" || action === "add-phone" || action === "add-custom") {
    if (!state.editingContact) return true;
    syncContactFormFromDom(o.contactsHost);
    if (!Array.isArray(state.editingContact.emails)) state.editingContact.emails = [""];
    if (!Array.isArray(state.editingContact.phones)) {
      state.editingContact.phones = [{ type: "cell", value: "" }];
    }
    if (!Array.isArray(state.editingContact.custom)) state.editingContact.custom = [];
    if (action === "add-email") {
      if (state.editingContact.emails.length < 10) state.editingContact.emails.push("");
    } else if (action === "add-phone") {
      if (state.editingContact.phones.length < 10) {
        state.editingContact.phones.push({ type: "other", value: "" });
      }
    } else if (state.editingContact.custom.length < 30) {
      state.editingContact.custom.push({ label: "", value: "" });
    }
    render();
    return true;
  }

  if (action === "remove-email") {
    if (!state.editingContact) return true;
    syncContactFormFromDom(o.contactsHost);
    const idx = Number(t.dataset.idx);
    if (!Number.isFinite(idx)) return true;
    const list = Array.isArray(state.editingContact.emails) ? state.editingContact.emails : [""];
    state.editingContact.emails = list.filter((_, i) => i !== idx);
    if (state.editingContact.emails.length === 0) state.editingContact.emails = [""];
    render();
    return true;
  }

  if (action === "remove-phone") {
    if (!state.editingContact) return true;
    syncContactFormFromDom(o.contactsHost);
    const idx = Number(t.dataset.idx);
    if (!Number.isFinite(idx)) return true;
    const list = Array.isArray(state.editingContact.phones)
      ? state.editingContact.phones
      : [{ type: "cell", value: "" }];
    state.editingContact.phones = list.filter((_, i) => i !== idx);
    if (state.editingContact.phones.length === 0) {
      state.editingContact.phones = [{ type: "cell", value: "" }];
    }
    render();
    return true;
  }

  if (action === "remove-custom") {
    if (!state.editingContact) return true;
    syncContactFormFromDom(o.contactsHost);
    const idx = Number(t.dataset.idx);
    if (!Number.isFinite(idx)) return true;
    state.editingContact.custom = (
      Array.isArray(state.editingContact.custom) ? state.editingContact.custom : []
    ).filter((_, i) => i !== idx);
    render();
    return true;
  }

  if (action === "remove-photo") {
    state.photoPreview = null;
    state.photoBase64Pending = null;
    state.removePhotoPending = true;
    if (state.editingContact) state.editingContact.hasPhoto = false;
    render();
    return true;
  }

  if (action === "delete-contact") {
    if (state.selectedAbId === null || !state.selectedContactUri) return true;
    const title =
      String(
        state.editingContact?.fullname ||
          state.editingContact?.displayname ||
          "this contact",
      ).trim() || "this contact";
    state.confirmDelete = {
      scope: "contact",
      title: "Delete contact",
      message: `Delete “${title}”?`,
      detail: "CardDAV clients will sync the removal. This cannot be undone.",
    };
    render();
    return true;
  }

  if (action === "delete-ab") {
    ev.stopPropagation();
    const id = Number(t.dataset.id ?? state.selectedAbId);
    if (!Number.isFinite(id)) return true;
    const ab = state.addressBooks.find((a) => a.id === id);
    if (!ab) return true;
    state.deleteAbConfirmId = id;
    state.abModalOpen = false;
    state.contactModalOpen = false;
    clearFlash();
    render();
    return true;
  }

  if (action === "cancel-delete-ab") {
    state.deleteAbConfirmId = null;
    render();
    return true;
  }

  if (action === "confirm-delete-ab") {
    const id = Number(t.dataset.id);
    const cb = root.querySelector<HTMLInputElement>("#delete-ab-confirm");
    if (!Number.isFinite(id) || !cb?.checked) return true;
    const ab = state.addressBooks.find((a) => a.id === id);
    if (!ab) return true;
    const force = (ab.cardCount ?? 0) > 0;
    state.busy = true;
    clearFlash();
    render();
    try {
      await api.deleteAddressBook(id, force);
      if (state.selectedAbId === id) {
        state.selectedAbId = null;
        state.contacts = [];
        state.editingContact = null;
        state.selectedContactUri = null;
        state.creatingContact = false;
      }
      state.deleteAbConfirmId = null;
      state.abModalOpen = false;
      state.contactModalOpen = false;
      await o.loadHome();
      if (state.selectedAbId === null && state.addressBooks.length > 0) {
        state.selectedAbId = state.addressBooks[0].id;
        await o.loadContacts(state.selectedAbId);
      }
      setFlash("success", "Address book deleted");
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Delete failed");
    } finally {
      state.busy = false;
      render();
    }
    return true;
  }

  if (action === "export-ab") {
    ev.stopPropagation();
    const idRaw = t.dataset.id;
    const abId =
      idRaw !== undefined && idRaw !== "" ? Number(idRaw) : state.selectedAbId;
    if (abId === null || Number.isNaN(abId)) return true;
    state.busy = true;
    clearFlash();
    render();
    try {
      const { blob, filename } = await api.exportAddressBook(abId);
      const outcome = await o.saveBlobAsFile(blob, filename);
      if (outcome === "cancelled") {
        setFlash("info", "Export cancelled");
      } else if (outcome === "saved") {
        setFlash("success", `Saved ${filename}`);
      } else {
        setFlash("success", `Download started: ${filename}`);
      }
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Export failed");
    } finally {
      state.busy = false;
      render();
    }
    return true;
  }

  if (action === "export-contact") {
    if (state.selectedAbId === null || !state.selectedContactUri || state.creatingContact) {
      return true;
    }
    state.contactModalOpen = true;
    state.busy = true;
    clearFlash();
    render();
    try {
      const { blob, filename } = await api.exportContact(
        state.selectedAbId,
        state.selectedContactUri,
      );
      const outcome = await o.saveBlobAsFile(blob, filename);
      if (outcome === "cancelled") {
        setFlash("info", "Export cancelled");
      } else if (outcome === "saved") {
        setFlash("success", `Saved ${filename}`);
      } else {
        setFlash("success", `Download started: ${filename}`);
      }
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Export failed");
    } finally {
      state.busy = false;
      render();
    }
    return true;
  }

  return false;
}
