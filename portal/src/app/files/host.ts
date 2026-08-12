/**
 * Shared host surface for the Files domain (Phase 4).
 * mountApp builds a FilesHost and passes it into files modules.
 */
import type { FlashType } from "../../ui";
import type { AppState } from "../context";

export type FilesHost = {
  state: AppState;
  root: HTMLElement;
  render: () => void;
  setFlash: (type: FlashType, message: string) => void;
  clearFlash: () => void;
};
