/**
 * Admin post-render DOM hooks.
 * Form submits are delegated on root (events.ts Step 3) — nothing to re-bind here yet.
 */
import type { AdminHost } from "./host";

export function bindAdminDom(_host: AdminHost): void {
  // Step 3: admin form submits handled by registerPortalEvents → onRootSubmit.
}
