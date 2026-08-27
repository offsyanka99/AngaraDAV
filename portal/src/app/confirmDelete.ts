/**
 * Themed portal delete confirmation (replaces window.confirm for item deletes).
 * Matches files-delete modal styling via renderModal.
 */
import { esc, renderModal } from "../ui";
import type { AppState } from "./context";

export type ConfirmDeleteScope =
  | "event"
  | "task"
  | "note"
  | "contact"
  | "bulk-task"
  | "bulk-note"
  | "bulk-contact"
  | "revoke-share";

export type ConfirmDeleteState = {
  scope: ConfirmDeleteScope;
  title: string;
  /** Plain-text primary sentence (entity name embedded by caller). */
  message: string;
  /** Optional secondary muted note (e.g. CalDAV sync). */
  detail?: string;
  /** For revoke-share */
  href?: string;
  /** For bulk-task */
  count?: number;
  /** Direct + nested subtasks of a parent being deleted (exclude self). */
  taskDescendantCount?: number;
};

export function renderConfirmDeleteModal(state: AppState): string {
  const d = state.confirmDelete;
  if (!d) return "";
  const detail = d.detail
    ? `<p class="muted small" style="margin:0.75rem 0 0">${esc(d.detail)}</p>`
    : "";
  const hasSubs = (d.taskDescendantCount ?? 0) > 0;
  const footer = hasSubs
    ? [
        {
          label: "Cancel",
          action: "confirm-delete-cancel",
          variant: "ghost" as const,
          disabled: state.busy,
        },
        {
          label: "Delete task",
          action: "confirm-delete-ok",
          variant: "danger" as const,
          disabled: state.busy,
        },
        {
          label: "Delete with subtasks",
          action: "confirm-delete-cascade",
          variant: "danger" as const,
          disabled: state.busy,
        },
      ]
    : [
        {
          label: "Cancel",
          action: "confirm-delete-cancel",
          variant: "ghost" as const,
          disabled: state.busy,
        },
        {
          label: "Delete",
          action: "confirm-delete-ok",
          variant: "danger" as const,
          disabled: state.busy,
        },
      ];
  return renderModal({
    id: "portal-confirm-delete-modal",
    title: d.title,
    titleId: "portal-confirm-delete-title",
    closeAction: "confirm-delete-cancel",
    size: "sm",
    body: `<p style="margin:0">${esc(d.message)}</p>${detail}`,
    footer,
  });
}

export function openConfirmDelete(state: AppState, spec: ConfirmDeleteState): void {
  state.confirmDelete = spec;
}

export function closeConfirmDelete(state: AppState): void {
  state.confirmDelete = null;
}
