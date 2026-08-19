/**
 * Files tab post-render hooks.
 * Drop and upload inputs are mount-time (events.ts Steps 4–6).
 * Here: indeterminate "select all" + item ⋮ menu overlay.
 */
import type { FilesHost } from "./host";
import { bindFilesItemMenuDom, bindFilesItemMenuOutside, unbindFilesItemMenuOutside } from "./itemMenu";

export function bindFilesDom(host: FilesHost): void {
  const { root } = host;

  root
    .querySelectorAll<HTMLInputElement>(
      'input[data-action="files-select-all"][data-indeterminate="1"]',
    )
    .forEach((cb) => {
      cb.indeterminate = true;
    });

  unbindFilesItemMenuOutside(host);
  if (host.state.filesItemMenu) {
    if (!root.querySelector("#files-item-menu")) {
      host.state.filesItemMenu = null;
    } else {
      bindFilesItemMenuOutside(host);
      bindFilesItemMenuDom(host);
    }
  }
}
