/**
 * Persistent overlay slot so PDF/media previews (and progress dialogs) are not
 * torn down by the SPA's innerHTML re-render of the page chrome + tab.
 */
import { infoModalHtml } from "./sectionInfo";
import { renderConfirmDeleteModal } from "./confirmDelete";
import type { AppState } from "./context";
import type { AppOrchestrator } from "./orchestrator";
import * as calendars from "./calendars";
import * as files from "./files";
import { renderFilesPreviewModal } from "./files/preview";

const PAGE_ID = "portal-page";
const OVERLAYS_ID = "portal-overlays";

export function ensureAppSlots(root: HTMLElement): {
  page: HTMLElement;
  overlays: HTMLElement;
} {
  let page = root.querySelector<HTMLElement>(`#${PAGE_ID}`);
  let overlays = root.querySelector<HTMLElement>(`#${OVERLAYS_ID}`);
  if (!page || !overlays) {
    root.replaceChildren();
    page = document.createElement("div");
    page.id = PAGE_ID;
    overlays = document.createElement("div");
    overlays.id = OVERLAYS_ID;
    root.append(page, overlays);
  }
  return { page, overlays };
}

/** Key of overlay content that should survive unrelated tab re-renders. */
export function overlayStabilityKey(state: AppState): string {
  const preview = state.filesPreview;
  const previewKey = preview
    ? [
        preview.path,
        preview.status,
        preview.kind,
        preview.objectUrl ?? "",
        preview.truncated ? "1" : "0",
        String((preview.text ?? "").length),
        preview.error ?? "",
      ].join("|")
    : "";
  const upload = state.filesUploadProgress;
  const uploadKey = upload
    ? [upload.phase, upload.completedFiles, upload.failedFiles, upload.bytesSent, upload.currentName].join("|")
    : "";
  const imp = state.importProgress;
  const importKey = imp
    ? [imp.phase, imp.readPercent ?? "", imp.processPercent ?? "", imp.processCurrent, imp.ok ?? ""].join("|")
    : "";
  const confirm = state.confirmDelete ? state.confirmDelete.scope : "";
  return `p:${previewKey};u:${uploadKey};i:${importKey};c:${confirm}`;
}

export function overlayHtml(o: AppOrchestrator): string {
  return `${infoModalHtml()}
      ${renderConfirmDeleteModal(o.state)}
      ${calendars.renderImportProgressModal(o.calendarsHost)}
      ${files.renderFilesUploadProgressModal(o.filesHost)}
      ${renderFilesPreviewModal(o.filesHost)}`;
}

/**
 * Replace overlay HTML only when the stable key changes, so a files checkbox
 * toggle does not remount a PDF iframe / media element.
 */
export function patchOverlays(overlays: HTMLElement, html: string, key: string): void {
  if (overlays.dataset.overlayKey === key && overlays.childElementCount > 0) {
    return;
  }
  overlays.dataset.overlayKey = key;
  overlays.innerHTML = html;
}

export function clearAppSlots(root: HTMLElement): void {
  const overlays = root.querySelector<HTMLElement>(`#${OVERLAYS_ID}`);
  if (overlays) overlays.dataset.overlayKey = "";
}
