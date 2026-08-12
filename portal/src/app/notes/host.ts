/**
 * Host surface for Notes tab (Phase 7).
 */
import type { FlashType } from "../../ui";
import type { AppState } from "../context";

export type NotesHost = {
  state: AppState;
  root: HTMLElement;
  render: () => void;
  setFlash: (type: FlashType, message: string) => void;
  clearFlash: () => void;
  renderPortalDateTimeField: (opts: {
    field: string;
    name: string;
    label: string;
    value: string;
    dateOnly?: boolean;
    required?: boolean;
    disabled?: boolean;
    allowClear?: boolean;
  }) => string;
};
