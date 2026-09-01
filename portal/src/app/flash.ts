/**
 * System messages: transient results go to the toast stack (notify.ts); the
 * persistent sign-in banner stays in state.flash.
 */
import { renderFlash, type FlashType } from "../ui";
import type { AppState } from "./context";
import { notify } from "./notify";

export function setFlash(type: FlashType, message: string): void {
  notify.show(type, message);
}

/** Drop the sign-in banner and any toast still on screen. */
export function clearFlash(state: AppState): void {
  state.flash = null;
  notify.setErrorsSuppressed(false);
  notify.dismissAll();
}

/** Persistent banner on the sign-in screen (session expired / install gate). */
export function renderAuthFlash(state: AppState): string {
  if (!state.flash) return "";
  return renderFlash(state.flash.type, state.flash.message, { dismissible: true });
}
