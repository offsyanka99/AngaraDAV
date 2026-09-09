/** Leaf resets for Files transients (no loaders/preview/transfer imports). */
import type { AppState } from "../context";

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

export function resetFilesTransferTreeState(state: AppState): void {
  state.filesTransfer = null;
  state.filesTransferDest = "";
  state.filesTreeChildren = {};
  state.filesTreeExpanded = [];
}
