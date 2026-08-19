/**
 * Files tab per-row ⋮ / right-click menu (shared with selection actions).
 */
import { api } from "../../api";
import { log } from "../../log";
import { esc } from "../../ui";
import type { AppState, FilesItemMenu } from "../context";
import type { FilesHost } from "./host";
import { filesItemMenuModel, selectionAfterOpeningItemMenu } from "./itemMenuModel";

export function filesItemMenuBlocked(state: AppState): boolean {
  return !!(
    state.busy ||
    state.filesRenamePath ||
    state.filesDeletePaths ||
    state.filesTransfer ||
    state.filesMkdirOpen ||
    state.filesPreview ||
    state.filesUploadConflict ||
    state.filesUploadProgress
  );
}

export function closeFilesItemMenu(host: FilesHost): void {
  unbindFilesItemMenuOutside(host);
  host.state.filesItemMenu = null;
}

export function openFilesItemMenu(
  host: FilesHost,
  path: string,
  pos: { x: number; y: number; origin: FilesItemMenu["origin"] },
): void {
  if (!path || filesItemMenuBlocked(host.state)) return;
  if (!host.state.filesEntries.some((e) => e.path === path)) return;
  host.state.checkedFilePaths = selectionAfterOpeningItemMenu(host.state.checkedFilePaths, path);
  host.state.filesItemMenu = { path, x: pos.x, y: pos.y, origin: pos.origin };
  host.state.filesUploadMenuOpen = false;
  host.render();
}

export function unbindFilesItemMenuOutside(host: FilesHost): void {
  if (host.state.filesItemMenuDocClick) {
    document.removeEventListener("click", host.state.filesItemMenuDocClick, true);
    host.state.filesItemMenuDocClick = null;
  }
  if (host.state.filesItemMenuWinClose) {
    window.removeEventListener("resize", host.state.filesItemMenuWinClose);
    host.state.filesItemMenuWinClose = null;
  }
}

export function bindFilesItemMenuOutside(host: FilesHost): void {
  unbindFilesItemMenuOutside(host);
  host.state.filesItemMenuDocClick = (ev: MouseEvent) => {
    const t = ev.target as HTMLElement | null;
    if (t?.closest?.("#files-item-menu")) return;
    if (t?.closest?.('[data-action="files-item-menu-toggle"]')) return;
    closeFilesItemMenu(host);
    host.render();
  };
  const handler = host.state.filesItemMenuDocClick;
  setTimeout(() => {
    if (host.state.filesItemMenu && host.state.filesItemMenuDocClick === handler) {
      document.addEventListener("click", handler, true);
    }
  }, 0);

  host.state.filesItemMenuWinClose = () => {
    if (!host.state.filesItemMenu) return;
    closeFilesItemMenu(host);
    host.render();
  };
  window.addEventListener("resize", host.state.filesItemMenuWinClose);
}

export function bindFilesItemMenuDom(host: FilesHost): void {
  const menu = host.root.querySelector<HTMLElement>("#files-item-menu");
  if (!menu || !host.state.filesItemMenu) return;

  positionFilesItemMenu(host);
  requestAnimationFrame(() => positionFilesItemMenu(host));

  const wrap = host.root.querySelector(".files-table-wrap");
  const onWrapScroll = host.state.filesItemMenuWinClose;
  if (wrap && onWrapScroll) {
    wrap.addEventListener("scroll", onWrapScroll, { passive: true });
  }

  const items = [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])')];
  const stealFocus = host.state.filesItemMenu.origin === "button";
  if (stealFocus && items.length > 0 && !menu.contains(document.activeElement)) {
    items[0].focus();
  }

  menu.addEventListener("keydown", (ev) => {
    if (ev.key !== "ArrowDown" && ev.key !== "ArrowUp" && ev.key !== "Home" && ev.key !== "End") {
      return;
    }
    const live = [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])')];
    if (live.length === 0) return;
    ev.preventDefault();
    const active = document.activeElement as HTMLElement | null;
    const idx = active ? live.indexOf(active) : -1;
    let next = 0;
    if (ev.key === "ArrowDown") next = idx < 0 ? 0 : (idx + 1) % live.length;
    else if (ev.key === "ArrowUp") next = idx < 0 ? live.length - 1 : (idx - 1 + live.length) % live.length;
    else if (ev.key === "End") next = live.length - 1;
    live[next]?.focus();
  });
}

export function positionFilesItemMenu(host: FilesHost): void {
  const menu = host.root.querySelector<HTMLElement>("#files-item-menu");
  const st = host.state.filesItemMenu;
  if (!menu || !st) return;

  let x = st.x;
  let y = st.y;
  if (st.origin === "button") {
    const btn = host.root.querySelector<HTMLElement>(
      `.files-row-menu-btn[data-path="${CSS.escape(st.path)}"]`,
    );
    if (btn) {
      const r = btn.getBoundingClientRect();
      x = r.right;
      y = r.bottom + 4;
    }
  }

  menu.style.left = `${x}px`;
  menu.style.top = `${y}px`;
  const rect = menu.getBoundingClientRect();
  const pad = 8;
  let left = st.origin === "button" ? x - rect.width : x;
  let top = y;
  if (left + rect.width > window.innerWidth - pad) left = window.innerWidth - pad - rect.width;
  if (left < pad) left = pad;
  if (top + rect.height > window.innerHeight - pad) {
    top = y - rect.height - (st.origin === "button" ? 8 : 0);
  }
  if (top < pad) top = pad;
  menu.style.left = `${Math.round(left)}px`;
  menu.style.top = `${Math.round(top)}px`;
}

export function renderFilesItemMenu(host: FilesHost): string {
  const st = host.state.filesItemMenu;
  if (!st) return "";
  const model = filesItemMenuModel(host.state.filesEntries, host.state.checkedFilePaths);
  if (model.count === 0) return "";
  const busy = host.state.busy ? "disabled" : "";
  const download = model.showDownload
    ? `<button type="button" class="files-item-menu-item" role="menuitem"
          data-action="files-bulk-download" ${busy}>Download</button>
       <div class="files-item-menu-sep" role="separator"></div>`
    : "";
  const renameDis = host.state.busy || !model.renameEnabled;
  const renamePath = model.renamePath ?? "";
  const renameName = model.renameName ?? "";
  const heading = model.heading
    ? `<div class="files-item-menu-heading" id="files-item-menu-label">${esc(model.heading)}</div>`
    : "";
  const labelledBy = model.heading ? ` aria-labelledby="files-item-menu-label"` : "";
  return `<div id="files-item-menu" class="files-item-menu" role="menu"${labelledBy}
            style="left:${st.x}px;top:${st.y}px">
    ${heading}
    ${download}
    <button type="button" class="files-item-menu-item" role="menuitem"
      data-action="files-bulk-copy" ${busy}>Copy</button>
    <button type="button" class="files-item-menu-item" role="menuitem"
      data-action="files-bulk-move" ${busy}>Move</button>
    <button type="button" class="files-item-menu-item" role="menuitem"
      data-action="files-rename-open" data-path="${esc(renamePath)}" data-name="${esc(renameName)}"
      ${renameDis ? "disabled" : ""}
      title="${model.renameEnabled ? "Rename" : "Select a single item to rename"}">Rename</button>
    <div class="files-item-menu-sep" role="separator"></div>
    <button type="button" class="files-item-menu-item is-danger" role="menuitem"
      data-action="files-bulk-delete" ${busy}>Delete</button>
  </div>`;
}

export function downloadSelectedFiles(items: { path: string; name: string }[]): void {
  items.forEach((item, i) => {
    window.setTimeout(() => {
      const a = document.createElement("a");
      a.href = api.filesDownloadUrl(item.path);
      a.download = item.name;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      log.event("files.download", { path: item.path, via: "selection" });
    }, i * 100);
  });
}
