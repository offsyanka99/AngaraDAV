import { request } from "./client";
import type { InstallStatusPublic, PortalUi } from "./types";


export const sessionApi = {
  /** Public portal prefs (no session). Used early to apply log level before login. */
  ui: () =>
    request<{ ui: PortalUi; version?: string | null; git?: string | null }>(
      "/ui",
    ),
  /**
   * Installer status (public). Safe during product upgrades — uses /api/install/*
   * which does not go through the normal portal bootstrap upgrade gate.
   * Response is wrapped as { data: status } by InstallApp.
   */
  installStatus: async (): Promise<InstallStatusPublic> => {
    const res = await request<{ data: InstallStatusPublic } | InstallStatusPublic>(
      "/install/status",
    );
    if (res && typeof res === "object" && "data" in res && res.data) {
      return res.data;
    }
    return res as InstallStatusPublic;
  },
};
