/**
 * Files tab post-render hooks.
 * Drop and upload inputs are mount-time (events.ts Steps 4–6).
 * Here: indeterminate "select all" only (must re-apply after each render).
 */
import type { FilesHost } from "./host";

export function bindFilesDom(host: FilesHost): void {
  const { root } = host;

  root
    .querySelectorAll<HTMLInputElement>(
      'input[data-action="files-select-all"][data-indeterminate="1"]',
    )
    .forEach((cb) => {
      cb.indeterminate = true;
    });
}
