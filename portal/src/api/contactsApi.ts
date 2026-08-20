import { ApiError, encUri, request, streamImport } from "./client";
import type {
  AddressBook,
  ContactDetail,
  ContactSummary,
  ContactWriteBody,
  ImportProgressEvent,
  ImportResult,
} from "./types";


export const contactsApi = {
  addressbooks: () =>
    request<{ addressbooks: AddressBook[] }>("/addressbooks"),
  createAddressBook: (body: {
    displayname: string;
    description?: string;
    uri?: string;
  }) =>
    request<{ addressbook: AddressBook }>("/addressbooks", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateAddressBook: (
    id: number,
    body: { displayname?: string; description?: string },
  ) =>
    request<{ addressbook: AddressBook }>(`/addressbooks/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteAddressBook: (id: number, force = false) =>
    request<{ ok: boolean }>(`/addressbooks/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ force }),
    }),
  exportAddressBook: async (
    id: number,
  ): Promise<{ blob: Blob; filename: string }> => {
    const res = await fetch(`/api/addressbooks/${id}/export`, {
      credentials: "same-origin",
    });
    if (!res.ok) {
      let msg = `Export failed (${res.status})`;
      try {
        const data = (await res.json()) as { error?: string };
        if (data.error) msg = data.error;
      } catch {
        /* ignore */
      }
      throw new ApiError(msg, res.status);
    }
    const cd = res.headers.get("Content-Disposition") || "";
    const m = /filename="([^"]+)"/i.exec(cd);
    const filename = m?.[1] || `contacts-${id}.vcf`;
    const blob = await res.blob();
    return { blob, filename };
  },
  importAddressBook: (
    id: number,
    vcf: string,
    onProgress?: (p: ImportProgressEvent) => void,
  ) =>
    streamImport<ImportResult>(
      `/addressbooks/${id}/import`,
      vcf,
      "text/vcard; charset=utf-8",
      onProgress,
    ),

  contacts: (abId: number, q = "") => {
    const qs = q.trim() ? `?q=${encodeURIComponent(q.trim())}` : "";
    return request<{ contacts: ContactSummary[] }>(
      `/addressbooks/${abId}/contacts${qs}`,
    );
  },
  getContact: (abId: number, uri: string) =>
    request<{ contact: ContactDetail }>(
      `/addressbooks/${abId}/contacts/${encUri(uri)}`,
    ),
  createContact: (abId: number, body: ContactWriteBody) =>
    request<{ contact: ContactDetail }>(`/addressbooks/${abId}/contacts`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateContact: (abId: number, uri: string, body: ContactWriteBody) =>
    request<{ contact: ContactDetail }>(
      `/addressbooks/${abId}/contacts/${encUri(uri)}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    ),
  deleteContact: (abId: number, uri: string) =>
    request<{ ok: boolean }>(
      `/addressbooks/${abId}/contacts/${encUri(uri)}`,
      { method: "DELETE" },
    ),
  exportContact: async (
    abId: number,
    uri: string,
  ): Promise<{ blob: Blob; filename: string }> => {
    const res = await fetch(
      `/api/addressbooks/${abId}/contacts/${encUri(uri)}/export`,
      { credentials: "same-origin" },
    );
    if (!res.ok) {
      let msg = `Export failed (${res.status})`;
      try {
        const data = (await res.json()) as { error?: string };
        if (data.error) msg = data.error;
      } catch {
        /* ignore */
      }
      throw new ApiError(msg, res.status);
    }
    const cd = res.headers.get("Content-Disposition") || "";
    const m = /filename="([^"]+)"/i.exec(cd);
    const filename = m?.[1] || `contact.vcf`;
    const blob = await res.blob();
    return { blob, filename };
  },
  contactPhotoUrl: (abId: number, uri: string): string =>
    `/api/addressbooks/${abId}/contacts/${encUri(uri)}/photo`,

  bulkContacts: (
    abId: number,
    body: { op: "copy" | "delete"; uris: string[] },
  ) =>
    request<{ ok: number; failed: number; errors: string[] }>(
      `/addressbooks/${abId}/contacts/bulk`,
      { method: "POST", body: JSON.stringify(body) },
    ),

  exportContacts: async (
    abId: number,
    uris: string[],
  ): Promise<{ blob: Blob; filename: string }> => {
    const data = await request<{ vcf: string; filename: string; count: number }>(
      `/addressbooks/${abId}/contacts/export`,
      { method: "POST", body: JSON.stringify({ uris }) },
    );
    const blob = new Blob([data.vcf], { type: "text/vcard;charset=utf-8" });
    return { blob, filename: data.filename || "contacts.vcf" };
  },

};
