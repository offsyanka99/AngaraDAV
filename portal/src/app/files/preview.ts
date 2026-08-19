/**
 * In-app file viewer for the Files tab (images, PDF, text, audio, video).
 */
import { api } from "../../api";
import { log } from "../../log";
import { esc, renderModal } from "../../ui";
import type { AppState, FilesPreview } from "../context";
import { formatBytes } from "../format";
import type { FilesHost } from "./host";
import { classifyFilesPreview } from "./previewKind";
import { resetFilesTransferTree } from "./transfer";

export { classifyFilesPreview } from "./previewKind";

const MAX_TEXT_BYTES = 2 * 1024 * 1024;
const MAX_PDF_BYTES = 50 * 1024 * 1024;

export function disposeFilesPreviewState(state: AppState): void {
  const prev = state.filesPreview;
  if (prev?.objectUrl) {
    try {
      URL.revokeObjectURL(prev.objectUrl);
    } catch {
      /* ignore */
    }
  }
  state.filesPreviewSeq += 1;
  state.filesPreview = null;
}

export function closeFilesPreview(host: FilesHost): void {
  disposeFilesPreviewState(host.state);
}

export async function openFilesPreview(host: FilesHost, path: string): Promise<void> {
  const entry = host.state.filesEntries.find((e) => e.path === path);
  if (!entry || entry.type !== "file") return;

  closeFilesPreview(host);
  host.state.filesRenamePath = null;
  host.state.filesDeletePaths = null;
  resetFilesTransferTree(host);
  host.state.filesMkdirOpen = false;
  host.state.filesUploadMenuOpen = false;

  const kind = classifyFilesPreview(entry.name);
  const seq = host.state.filesPreviewSeq + 1;
  host.state.filesPreviewSeq = seq;
  const base: FilesPreview = {
    path: entry.path,
    name: entry.name,
    size: entry.size,
    kind,
    status: "loading",
    objectUrl: null,
    text: null,
    truncated: false,
    error: null,
  };

  const needsFetch = kind === "text" || kind === "pdf";
  if (!needsFetch) {
    host.state.filesPreview = { ...base, status: "ready" };
    log.event("files.preview", { path: entry.path, kind });
    host.render();
    return;
  }

  host.state.filesPreview = base;
  host.render();

  try {
    if (kind === "pdf" && entry.size > MAX_PDF_BYTES) {
      if (host.state.filesPreviewSeq !== seq) return;
      host.state.filesPreview = {
        ...base,
        status: "error",
        error: `This PDF is too large to preview (${formatBytes(entry.size)}). Download it instead.`,
      };
      host.render();
      return;
    }
    const { blob } = await api.filesGetBlob(entry.path, { inline: true });
    if (host.state.filesPreviewSeq !== seq) return;
    if (kind === "pdf") {
      const pdfBlob =
        blob.type && blob.type.toLowerCase().includes("pdf")
          ? blob
          : new Blob([blob], { type: "application/pdf" });
      host.state.filesPreview = {
        ...base,
        status: "ready",
        objectUrl: URL.createObjectURL(pdfBlob),
      };
    } else {
      const tooBig = blob.size > MAX_TEXT_BYTES;
      const slice = tooBig ? blob.slice(0, MAX_TEXT_BYTES) : blob;
      const text = await slice.text();
      if (host.state.filesPreviewSeq !== seq) return;
      host.state.filesPreview = {
        ...base,
        status: "ready",
        text,
        truncated: tooBig,
      };
    }
    log.event("files.preview", { path: entry.path, kind });
  } catch (e) {
    if (host.state.filesPreviewSeq !== seq) return;
    host.state.filesPreview = {
      ...base,
      status: "error",
      error: e instanceof Error ? e.message : "Could not open file",
    };
  }
  host.render();
}

export function renderFilesPreviewModal(host: FilesHost): string {
  const p = host.state.filesPreview;
  if (!p) return "";

  let body: string;
  if (p.status === "loading") {
    body = `<p class="muted" style="margin:0">Loading preview…</p>`;
  } else if (p.status === "error") {
    body = `<p class="flash flash-error" style="margin:0">${esc(p.error || "Could not open file")}</p>`;
  } else if (p.kind === "image") {
    const src = api.filesDownloadUrl(p.path, { inline: true });
    body = `<div class="files-preview-media">
      <img class="files-preview-img" src="${esc(src)}" alt="${esc(p.name)}" decoding="async" />
    </div>`;
  } else if (p.kind === "pdf" && p.objectUrl) {
    body = `<iframe class="files-preview-frame" title="${esc(p.name)}" src="${esc(p.objectUrl)}" type="application/pdf"></iframe>`;
  } else if (p.kind === "audio") {
    const src = api.filesDownloadUrl(p.path, { inline: true });
    body = `<div class="files-preview-media">
      <audio class="files-preview-audio" controls preload="metadata" src="${esc(src)}"></audio>
    </div>`;
  } else if (p.kind === "video") {
    const src = api.filesDownloadUrl(p.path, { inline: true });
    body = `<div class="files-preview-media">
      <video class="files-preview-video" controls preload="metadata" src="${esc(src)}"></video>
    </div>`;
  } else if (p.kind === "text") {
    const note = p.truncated
      ? `<p class="muted small files-preview-truncated">Showing the first ${esc(formatBytes(MAX_TEXT_BYTES))} of this file.</p>`
      : "";
    body = `${note}<pre class="files-preview-text">${esc(p.text || "")}</pre>`;
  } else {
    body = `<p style="margin:0">This file type cannot be previewed in the browser. Download it to open with another app.</p>
      <p class="muted small" style="margin:0.75rem 0 0">${esc(p.name)} · ${esc(formatBytes(p.size))}</p>`;
  }

  return renderModal({
    id: "files-preview-modal",
    title: p.name,
    titleId: "files-preview-title",
    closeAction: "files-preview-close",
    size: "wide",
    cardClassName: "files-preview-card",
    className: "files-preview-modal",
    body,
    footer: [
      { label: "Download", action: "files-preview-download", variant: "ghost" },
      { label: "Close", action: "files-preview-close", variant: "primary" },
    ],
  });
}
