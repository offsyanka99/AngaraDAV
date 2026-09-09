/** Confirm before Refresh discards an open editor. */
import { renderModal } from "../ui";
import type { AppState } from "./context";

export function renderConfirmRefreshModal(state: AppState): string {
  if (!state.confirmRefresh) return "";
  return renderModal({
    id: "portal-confirm-refresh-modal",
    title: "Refresh",
    titleId: "portal-confirm-refresh-title",
    closeAction: "confirm-refresh-cancel",
    size: "sm",
    body: `<p style="margin:0">Refresh and discard unsaved changes?</p>`,
    footer: [
      {
        label: "Cancel",
        action: "confirm-refresh-cancel",
        variant: "ghost",
        disabled: state.busy,
      },
      {
        label: "Refresh",
        action: "confirm-refresh-ok",
        variant: "primary",
        disabled: state.busy,
      },
    ],
  });
}
