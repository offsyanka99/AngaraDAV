/** Contacts loaders (Phase 7). */
import { api } from "../../api";
import type { ContactsHost } from "./host";

export async function loadContacts(host: ContactsHost, abId: number) {
  const res = await api.contacts(abId, host.state.contactSearch);
  host.state.contacts = res.contacts;
  const uris = new Set(res.contacts.map((c) => c.uri));
  host.state.checkedContactUris = host.state.checkedContactUris.filter((u) => uris.has(u));
  if (
    host.state.selectedContactUri !== null &&
    !host.state.contacts.some((c) => c.uri === host.state.selectedContactUri)
  ) {
    host.state.selectedContactUri = null;
    if (!host.state.creatingContact) {
      host.state.editingContact = null;
      host.state.photoPreview = null;
      host.state.photoBase64Pending = null;
      host.state.removePhotoPending = false;
    }
  }
}

export async function openContact(host: ContactsHost, uri: string) {
  if (host.state.selectedAbId === null) return;
  const res = await api.getContact(host.state.selectedAbId, uri);
  host.state.selectedContactUri = uri;
  host.state.creatingContact = false;
  const contact = res.contact;
  // Normalize optional arrays so the form never crashes on incomplete payloads
  host.state.editingContact = {
    ...contact,
    emails: Array.isArray(contact.emails) ? contact.emails : [],
    phones: Array.isArray(contact.phones) ? contact.phones : [],
    custom: Array.isArray(contact.custom) ? contact.custom : [],
    address: contact.address ?? emptyAddress(host),
    birthday: contact.birthday ?? null,
  };
  // Prefer photo endpoint over embedded data URI (smaller JSON, consistent cache)
  host.state.photoPreview =
    contact.photoDataUri ??
    (contact.hasPhoto && host.state.selectedAbId !== null
      ? `${api.contactPhotoUrl(host.state.selectedAbId, uri)}?t=${Date.now()}`
      : null);
  host.state.photoBase64Pending = null;
  host.state.removePhotoPending = false;
  host.state.contactModalOpen = true;
}

export function startNewContact(host: ContactsHost) {
  host.state.creatingContact = true;
  host.state.selectedContactUri = null;
  host.state.contactModalOpen = true;
  host.state.editingContact = {
    uri: "",
    displayname: "",
    firstname: "",
    lastname: "",
    fullname: "",
    org: "",
    title: "",
    emails: [""],
    phones: [{ type: "cell", value: "" }],
    address: { street: "", city: "", region: "", postal: "", country: "" },
    birthday: null,
    url: "",
    note: "",
    custom: [],
    hasPhoto: false,
    photoDataUri: null,
  };
  host.state.photoPreview = null;
  host.state.photoBase64Pending = null;
  host.state.removePhotoPending = false;
}

export function emptyAddress(_host: ContactsHost) {
  return { street: "", city: "", region: "", postal: "", country: "" };
}
