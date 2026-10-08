/**
 * When the in-app stale banner may also raise a browser Notification.
 * The tab must be visible and the window must not be focused.
 */

export const STALE_NOTIFICATION_TAG = "angaradav-stale";

export function shouldShowStaleNotification(opts: {
  enabled: boolean;
  permission: string;
  visible: boolean;
  focused: boolean;
}): boolean {
  return opts.enabled && opts.permission === "granted" && opts.visible && !opts.focused;
}

export function notificationsSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext === true &&
    typeof Notification !== "undefined"
  );
}
