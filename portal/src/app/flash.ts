/**
 * Flash banner helpers (Phase 3 extract).
 */
import { renderFlash, type FlashType } from "../ui";
import type { AppState } from "./context";

export function setFlash(state: AppState, type: FlashType, message: string): void {
  if (state.suppressErrorFlashAfterExpiry && type === "error") {
    return;
  }
  if (type !== "error") {
    state.suppressErrorFlashAfterExpiry = false;
  }
  state.flash = { type, message };
}

export function clearFlash(state: AppState): void {
  state.flash = null;
  state.suppressErrorFlashAfterExpiry = false;
}

/** Success/error banner; shown on main page or inside open calendar modal. */
export function renderFlashBanner(state: AppState): string {
  if (!state.flash) return "";
  return renderFlash(state.flash.type, state.flash.message, { dismissible: true });
}
