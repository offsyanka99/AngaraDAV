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
  return `<div class="selection-toolbar files-toolbar-actions" role="toolbar" aria-label="Selected items">
    <span class="selection-count files-selection-count"><strong>${opts.count}</strong> selected${extra}</span>
    <button type="button" class="btn btn-ghost btn-small" data-action="${esc(opts.clearAction)}" ${opts.busy ? "disabled" : ""}>Clear</button>
    ${opts.actionsHtml}
  </div>`;
}

/** Search + primary action, swapping to the Files multi-select chrome when items are checked. */
export function renderListToolbar(opts: {
  searchAction: string;
  searchPlaceholder: string;
  searchValue: string;
  searchAria: string;
  busy: boolean;
  addAction: string;
  addLabel: string;
  addDisabled?: boolean;
  selection: null | {
    count: number;
    extra?: string;
    clearAction: string;
    actionsHtml: string;
  };
}): string {
  const actions =
    opts.selection !== null
      ? renderSelectionToolbar({
          count: opts.selection.count,
          extra: opts.selection.extra,
          busy: opts.busy,
          clearAction: opts.selection.clearAction,
          actionsHtml: opts.selection.actionsHtml,
        })
      : `<div class="files-toolbar-actions">
          <button type="button" class="btn btn-primary" data-action="${esc(opts.addAction)}" ${
            opts.busy || opts.addDisabled ? "disabled" : ""
          }>${esc(opts.addLabel)}</button>
        </div>`;
  return `<div class="files-toolbar">
    <input type="search" class="files-search" data-action="${esc(opts.searchAction)}" placeholder="${esc(opts.searchPlaceholder)}" value="${esc(opts.searchValue)}" aria-label="${esc(opts.searchAria)}" ${opts.busy ? "disabled" : ""} />
    ${actions}
  </div>`;
}
