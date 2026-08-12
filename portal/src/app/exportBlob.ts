/** Save blob via File System Access API or download fallback (Phase 8). */

export async function saveBlobAsFile(
  blob: Blob,
  filename: string,
): Promise<"saved" | "cancelled" | "started"> {
  const w = window as Window & {
    showSaveFilePicker?: (opts: {
      suggestedName?: string;
    }) => Promise<FileSystemFileHandle>;
  };
  if (typeof w.showSaveFilePicker === "function") {
    try {
      const handle = await w.showSaveFilePicker({ suggestedName: filename });
      const writable = await handle.createWritable();
      try {
        await writable.write(blob);
      } finally {
        await writable.close();
      }
      return "saved";
    } catch (e) {
      // User cancelled the save dialog
      if (e instanceof DOMException && e.name === "AbortError") {
        return "cancelled";
      }
      // No user activation / unsupported context → fall through to <a download>
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  // Keep the blob URL alive until the browser has started reading it.
  // Immediate revokeObjectURL often aborts the download (looks like Cancel).
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 60_000);
  return "started";
}
