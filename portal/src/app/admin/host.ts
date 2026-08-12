/**
 * Shared host surface for the Admin domain (Phase 5).
 */
import type { AdminPageId } from "../types";
import type { AppState } from "../context";
import type { FlashType } from "../../ui";
import type { TabId } from "../types";

export type AdminHost = {
  state: AppState;
  root: HTMLElement;
  render: () => void;
  setFlash: (type: FlashType, message: string) => void;
  clearFlash: () => void;
  userIsAdmin: () => boolean;
  adminUiEnabled: () => boolean;
  persistTab: (tab: TabId, adminPage?: AdminPageId, username?: string | null) => void;
  activateTab: (tab: TabId, opts?: { clearFlash?: boolean }) => Promise<void>;
  loadHome: () => Promise<void>;
  normalizeActiveTab: () => void;
};
