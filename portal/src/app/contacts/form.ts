/** Contact form sync/body builders (Phase 7). */
import { api, type ContactCustomField, type ContactPhone } from "../../api";
import type { ContactsHost } from "./host";

export function syncContactFormFromDom(host: ContactsHost) {
  if (!host.state.editingContact) return;
  const form = host.root.querySelector<HTMLFormElement>('[data-form="contact"]');
  if (!form) return;
  const fd = new FormData(form);
  host.state.editingContact.firstname = String(fd.get("firstname") ?? "");
  host.state.editingContact.lastname = String(fd.get("lastname") ?? "");
  host.state.editingContact.fullname = String(fd.get("fullname") ?? "");
  host.state.editingContact.org = String(fd.get("org") ?? "");
  host.state.editingContact.title = String(fd.get("title") ?? "");
  host.state.editingContact.url = String(fd.get("url") ?? "");
  host.state.editingContact.note = String(fd.get("note") ?? "");
  const bday = String(fd.get("birthday") ?? "").trim();
  host.state.editingContact.birthday = bday && /^\d{4}-\d{2}-\d{2}/.test(bday) ? bday.slice(0, 10) : null;
  host.state.editingContact.address = {
    street: String(fd.get("street") ?? ""),
    city: String(fd.get("city") ?? ""),
    region: String(fd.get("region") ?? ""),
    postal: String(fd.get("postal") ?? ""),
    country: String(fd.get("country") ?? ""),
  };
  const emails: string[] = [];
  let i = 0;
  while (fd.has(`email_${i}`)) {
    emails.push(String(fd.get(`email_${i}`) ?? ""));
    i++;
  }
  if (emails.length) host.state.editingContact.emails = emails;
  const phones: ContactPhone[] = [];
  i = 0;
  while (fd.has(`phone_value_${i}`)) {
    phones.push({
      type: String(fd.get(`phone_type_${i}`) ?? "other"),
      value: String(fd.get(`phone_value_${i}`) ?? ""),
    });
    i++;
  }
  if (phones.length) host.state.editingContact.phones = phones;
  const custom: ContactCustomField[] = [];
  i = 0;
  while (fd.has(`custom_label_${i}`) || fd.has(`custom_value_${i}`)) {
    custom.push({
      label: String(fd.get(`custom_label_${i}`) ?? ""),
      value: String(fd.get(`custom_value_${i}`) ?? ""),
    });
    i++;
  }
  host.state.editingContact.custom = custom;
}
export function contactBodyFromForm(host: ContactsHost, form: HTMLFormElement) {
  const fd = new FormData(form);
  const emails: string[] = [];
  let i = 0;
  while (fd.has(`email_${i}`)) {
    const v = String(fd.get(`email_${i}`) ?? "").trim();
    if (v) emails.push(v);
    i++;
  }
  const phones: ContactPhone[] = [];
  i = 0;
  while (fd.has(`phone_value_${i}`)) {
    const value = String(fd.get(`phone_value_${i}`) ?? "").trim();
    if (value) {
      phones.push({
        type: String(fd.get(`phone_type_${i}`) ?? "other"),
        value,
      });
    }
    i++;
  }
  const custom: ContactCustomField[] = [];
  i = 0;
  while (fd.has(`custom_label_${i}`) || fd.has(`custom_value_${i}`)) {
    const label = String(fd.get(`custom_label_${i}`) ?? "").trim();
    const value = String(fd.get(`custom_value_${i}`) ?? "").trim();
    if (label || value) {
      custom.push({ label, value });
    }
    i++;
  }
  const body: Parameters<typeof api.createContact>[1] = {
    firstname: String(fd.get("firstname") ?? "").trim(),
    lastname: String(fd.get("lastname") ?? "").trim(),
    fullname: String(fd.get("fullname") ?? "").trim(),
    org: String(fd.get("org") ?? "").trim(),
    title: String(fd.get("title") ?? "").trim(),
    emails,
    phones,
    address: {
      street: String(fd.get("street") ?? "").trim(),
      city: String(fd.get("city") ?? "").trim(),
      region: String(fd.get("region") ?? "").trim(),
      postal: String(fd.get("postal") ?? "").trim(),
      country: String(fd.get("country") ?? "").trim(),
    },
    url: String(fd.get("url") ?? "").trim(),
    note: String(fd.get("note") ?? "").trim(),
    birthday: (() => {
      const v = String(fd.get("birthday") ?? "").trim();
      return v && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null;
    })(),
    custom,
  };
  if (host.state.removePhotoPending) {
    body.removePhoto = true;
  } else if (host.state.photoBase64Pending) {
    body.photoBase64 = host.state.photoBase64Pending;
  }
  return body;
}
