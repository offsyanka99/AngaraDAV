/**
 * Shared selection toolbar chrome (Files is the visual standard).
 */
import { esc } from "../ui.ts";

export function renderSelectionToolbar(opts: {
  count: number;
  extra?: string;
  busy: boolean;
  clearAction: string;
  actionsHtml: string;
}): string {
  const extra = opts.extra
    ? `<span class="muted small selection-count-extra">${opts.extra}</span>`
    : "";
  return `<div class="selection-toolbar" role="toolbar" aria-label="Selected items">
    <span class="selection-count"><strong>${opts.count}</strong> selected${extra}</span>
    <button type="button" class="btn btn-ghost btn-small" data-action="${esc(opts.clearAction)}" ${opts.busy ? "disabled" : ""}>Clear</button>
    ${opts.actionsHtml}
  </div>`;
}
