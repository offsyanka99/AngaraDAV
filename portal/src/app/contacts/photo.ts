/** Contact photo helpers (Phase 7). */
import type { ContactsHost } from "./host";

export function fileToBase64(_host: ContactsHost, file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = String(reader.result ?? "");
      const comma = r.indexOf(",");
      resolve(comma >= 0 ? r.slice(comma + 1) : r);
    };
    reader.onerror = () => reject(new Error("Failed to read photo file"));
    reader.readAsDataURL(file);
  });
}

/** Handle contact photo file pick (used by root change delegation Step 4). */
export async function onContactPhotoPicked(host: ContactsHost, input: HTMLInputElement): Promise<void> {
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  if (file.size > 2.5 * 1024 * 1024) {
    host.setFlash("error", "Photo is too large (max ~2 MB)");
    host.render();
    return;
  }
  try {
    const b64 = await fileToBase64(host, file);
    host.state.photoBase64Pending = b64;
    host.state.photoPreview = `data:${file.type || "image/jpeg"};base64,${b64}`;
    host.state.removePhotoPending = false;
    host.render();
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Failed to read photo");
    host.render();
  }
}

/** Post-render: no-op — contact-photo change is delegated (events.ts Step 4). */
export function bindContactPhotoInput(_host: ContactsHost): void {
  // contact-photo handled in onRootChange
}
