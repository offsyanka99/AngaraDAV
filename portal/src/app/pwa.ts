/**
 * Register the network-only portal service worker so the browser can offer Install.
 * No-op outside a secure /portal/ page or when the browser has no service workers.
 */
export function registerPortalServiceWorker(): void {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  if (typeof window === "undefined" || !window.isSecureContext) return;
  if (!window.location.pathname.startsWith("/portal")) return;
  void navigator.serviceWorker.register("/portal/sw.js", { scope: "/portal/" }).catch(() => {
    /* Install stays unavailable. The portal itself still loads. */
  });
}
