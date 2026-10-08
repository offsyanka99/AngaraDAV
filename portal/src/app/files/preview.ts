/**
 * In-app file viewer for the Files tab (images, PDF, text, audio, video).
 */
import { api } from "../../api";
import { log } from "../../log";
import { esc, renderModal } from "../../ui";
import type { FilesPreview } from "../context";
import { formatBytes } from "../format";
import type { FilesHost } from "./host";
import { closeFilesItemMenu } from "./itemMenu";
import { officeBlobToHtml } from "./officePreview";
import { classifyFilesPreview } from "./previewKind";
import { previewRefreshConflict } from "./previewConflict";
import { disposeFilesPreviewState } from "./stateReset";
import { resetFilesTransferTree } from "./transfer";

export { classifyFilesPreview } from "./previewKind";
export { disposeFilesPreviewState } from "./stateReset";

const MAX_TEXT_BYTES = 2 * 1024 * 1024;
const MAX_PDF_BYTES = 50 * 1024 * 1024;

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
  closeFilesItemMenu(host);

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
    html: null,
    truncated: false,
    error: null,
    etag: entry.etag ?? null,
    ignored: null,
  };

  const needsFetch = kind === "text" || kind === "pdf" || kind === "office";
  if (!needsFetch) {
    host.state.filesPreviewConflict = null;
    host.state.filesPreview = { ...base, status: "ready" };
    log.event("files.preview", { path: entry.path, kind });
    host.render();
    return;
  }

  host.state.filesPreview = base;
  host.render();

  try {
    if (kind === "pdf" && entry.size > MAX_PDF_BYTES) {
      if (!commitPreview(host, seq, base, {
        status: "error",
        error: `This PDF is too large to preview (${formatBytes(entry.size)}). Download it instead.`,
      })) {
        return;
      }
      host.render();
      return;
    }
    const { blob } = await api.filesGetBlob(entry.path, { inline: true });
    if (host.state.filesPreviewSeq !== seq) return;
    if (kind === "office") {
      const html = await officeBlobToHtml(entry.name, blob);
      if (!commitPreview(host, seq, base, { status: "ready", html })) return;
    } else if (kind === "pdf") {
      if (host.state.filesPreviewSeq !== seq) return;
      const pdfBlob =
        blob.type && blob.type.toLowerCase().includes("pdf")
          ? blob
          : new Blob([blob], { type: "application/pdf" });
      const objectUrl = URL.createObjectURL(pdfBlob);
      if (!commitPreview(host, seq, base, { status: "ready", objectUrl })) {
        URL.revokeObjectURL(objectUrl);
        return;
      }
    } else {
      const tooBig = blob.size > MAX_TEXT_BYTES;
      const slice = tooBig ? blob.slice(0, MAX_TEXT_BYTES) : blob;
      const text = await slice.text();
      if (!commitPreview(host, seq, base, { status: "ready", text, truncated: tooBig })) return;
    }
    log.event("files.preview", { path: entry.path, kind });
  } catch (e) {
    if (!commitPreview(host, seq, base, {
      status: "error",
      error: e instanceof Error ? e.message : "Could not open file",
    })) {
      return;
    }
  }
  host.render();
}

/**
 * A refresh can adopt an etag or record Keep while this fetch is in flight.
 * Keep that choice when the bytes arrive.
 */
function commitPreview(
  host: FilesHost,
  seq: number,
  base: FilesPreview,
  patch: Partial<FilesPreview>,
): boolean {
  if (host.state.filesPreviewSeq !== seq) return false;
  const current = host.state.filesPreview;
  const carried =
    current && current.path === base.path
      ? { etag: current.etag, ignored: current.ignored }
      : { etag: base.etag, ignored: base.ignored };
  host.state.filesPreview = { ...base, ...patch, etag: carried.etag, ignored: carried.ignored };
  return true;
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
    const src = previewMediaUrl(p.path, p.etag);
    body = `<div class="files-preview-media">
      <img class="files-preview-img" src="${esc(src)}" alt="${esc(p.name)}" decoding="async" />
    </div>`;
  } else if (p.kind === "pdf" && p.objectUrl) {
    body = `<iframe class="files-preview-frame" title="${esc(p.name)}" src="${esc(p.objectUrl)}" type="application/pdf"></iframe>`;
  } else if (p.kind === "audio") {
    const src = previewMediaUrl(p.path, p.etag);
    body = `<div class="files-preview-media">
      <audio class="files-preview-audio" controls preload="metadata" src="${esc(src)}"></audio>
    </div>`;
  } else if (p.kind === "video") {
    const src = previewMediaUrl(p.path, p.etag);
    body = `<div class="files-preview-media">
      <video class="files-preview-video" controls preload="metadata" src="${esc(src)}"></video>
    </div>`;
  } else if (p.kind === "office" && p.html) {
    body = `<div class="files-preview-office">${p.html}</div>`;
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

function previewMediaUrl(path: string, etag: string | null): string {
  const url = api.filesDownloadUrl(path, { inline: true });
  if (!etag) return url;
  return `${url}&v=${encodeURIComponent(etag)}`;
}

export function applyPreviewRefreshConflict(host: FilesHost): void {
  const preview = host.state.filesPreview;
  if (!preview || host.state.filesView === "trash" || !host.state.filesStatus?.ready) {
    return;
  }
  const decision = previewRefreshConflict(preview, host.state.filesPath, host.state.filesEntries);
  if (!decision) {
    if (host.state.filesPreviewConflict?.path === preview.path) {
      host.state.filesPreviewConflict = null;
    }
    return;
  }
  if (decision.kind === "adopt") {
    host.state.filesPreview = { ...preview, etag: decision.etag };
    if (host.state.filesPreviewConflict?.path === preview.path) {
      host.state.filesPreviewConflict = null;
    }
    return;
  }
  host.state.filesPreviewConflict = {
    path: decision.path,
    name: decision.name,
    kind: decision.kind,
    etag: decision.etag,
  };
}

export function keepPreviewConflict(host: FilesHost): void {
  const preview = host.state.filesPreview;
  const conflict = host.state.filesPreviewConflict;
  host.state.filesPreviewConflict = null;
  if (!preview || !conflict || conflict.path !== preview.path) return;
  if (conflict.kind === "missing") {
    host.state.filesPreview = { ...preview, ignored: { kind: "missing" } };
    return;
  }
  if (conflict.etag) {
    host.state.filesPreview = { ...preview, ignored: { kind: "changed", etag: conflict.etag } };
  }
}

export function renderFilesPreviewConflictModal(host: FilesHost): string {
  const conflict = host.state.filesPreviewConflict;
  if (!conflict) return "";
  const changed = conflict.kind === "changed";
  return renderModal({
    id: "files-preview-conflict-modal",
    title: changed ? "File changed" : "File removed",
    titleId: "files-preview-conflict-title",
    closeAction: "files-preview-conflict-keep",
    size: "sm",
    body: changed
      ? `<p style="margin:0">${esc(conflict.name)} was updated on the server. Reload the preview, or keep what you are looking at.</p>`
      : `<p style="margin:0">${esc(conflict.name)} is no longer in this folder. Close the preview, or keep looking at this copy.</p>`,
    footer: changed
      ? [
          { label: "Keep", action: "files-preview-conflict-keep", variant: "ghost" },
          { label: "Reload", action: "files-preview-conflict-reload", variant: "primary" },
        ]
      : [
          { label: "Keep", action: "files-preview-conflict-keep", variant: "ghost" },
          { label: "Close preview", action: "files-preview-conflict-close", variant: "primary" },
        ],
  });
}
