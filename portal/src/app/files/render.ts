/**
 * Files tab UI HTML (Phase 4).
 */
import { api } from "../../api";
import { esc, renderModal } from "../../ui";
import { formatBytes, formatMtime } from "../format";
import { basenamePath } from "../paths";
import { infoTitle } from "../sectionInfo";
import type { FilesHost } from "./host";
import { isBlockedTransferDest, renderFilesFolderTree } from "./transfer";

export function filesBreadcrumb(host: FilesHost, path: string): string {
  const parts = path ? path.split("/").filter(Boolean) : [];
  let acc = "";
  const crumbs = [
    `<button type="button" class="files-crumb" data-action="files-nav" data-path="" ${host.state.busy ? "disabled" : ""}>Home</button>`,
  ];
  for (const part of parts) {
    acc = acc ? `${acc}/${part}` : part;
    const p = acc;
    crumbs.push(`<span class="files-crumb-sep" aria-hidden="true">/</span>`);
    crumbs.push(
      `<button type="button" class="files-crumb" data-action="files-nav" data-path="${esc(p)}" ${host.state.busy ? "disabled" : ""}>${esc(part)}</button>`,
    );
  }
  return `<nav class="files-breadcrumb" aria-label="Folder path">${crumbs.join("")}</nav>`;
}

export function renderFilesTab(host: FilesHost): string {
  const st = host.state.filesStatus;
  if (!st) {
    return `<div class="card"><p class="muted">${host.state.filesLoading || host.state.busy ? "Loading…" : "Unable to load file storage status."}</p></div>`;
  }
  if (!st.enabled) {
    return `<div class="portal-grid portal-grid-files">
      <section class="card">
        ${infoTitle("Files", "files", "h1")}
        <p class="muted" style="margin-top:0.75rem">
          WebDAV file storage is <strong>disabled</strong> on this server.
          An administrator can enable it under <strong>Admin → AngaraDAV Settings → Enable WebDAV file storage</strong>.
        </p>
        <p class="muted small">When enabled, desktop clients use <span class="mono">/dav.php/files/{username}/</span> with your DAV credentials.</p>
      </section>
    </div>`;
  }
  if (!st.ready) {
    return `<div class="portal-grid portal-grid-files">
      <section class="card">
        ${infoTitle("Files", "files", "h1")}
        <p class="flash flash-error" style="margin-top:0.75rem">${esc(st.error || "File storage is not available.")}</p>
        <p class="muted small">DAV path: <span class="mono">${esc(st.davPath)}</span></p>
      </section>
    </div>`;
  }

  const quotaLabel =
    st.quotaBytes > 0
      ? `${formatBytes(st.usedBytes)} used · ${formatBytes(st.availableBytes)} free of ${formatBytes(st.quotaBytes)}`
      : `${formatBytes(st.usedBytes)} used · ${formatBytes(st.availableBytes)} free (no app quota)`;
  const quotaPct =
    st.quotaBytes > 0
      ? Math.min(100, Math.round((100 * st.usedBytes) / st.quotaBytes))
      : 0;

  const nChecked = host.state.checkedFilePaths.length;
  const allChecked =
    host.state.filesEntries.length > 0 && host.state.filesEntries.every((e) => host.state.checkedFilePaths.includes(e.path));
  const someChecked = nChecked > 0;
  const nDirs = host.state.filesEntries.filter((e) => e.type === "dir").length;
  const nFiles = host.state.filesEntries.length - nDirs;
  const bulkBar =
    nChecked > 0
      ? `<div class="bulk-bar files-bulk-bar" role="toolbar" aria-label="Selected files">
          <span class="muted small">${nChecked} selected</span>
          <div class="bulk-bar-actions">
            <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-copy" ${host.state.busy ? "disabled" : ""}>Copy</button>
            <button type="button" class="btn btn-small btn-ghost" data-action="files-bulk-move" ${host.state.busy ? "disabled" : ""}>Move</button>
            <button type="button" class="btn btn-small btn-danger" data-action="files-bulk-delete" ${host.state.busy ? "disabled" : ""}>Delete</button>
          </div>
        </div>`
      : "";
  const filesCountLabel = (() => {
    if (host.state.filesLoading && host.state.filesEntries.length === 0) return "Loading…";
    if (host.state.filesEntries.length === 0) return "0 items";
    const parts: string[] = [];
    if (nDirs > 0) parts.push(`${nDirs} folder${nDirs === 1 ? "" : "s"}`);
    if (nFiles > 0) parts.push(`${nFiles} file${nFiles === 1 ? "" : "s"}`);
    const total = `${host.state.filesEntries.length} item${host.state.filesEntries.length === 1 ? "" : "s"}`;
    // Prefer breakdown when mixed; otherwise plain total is enough.
    if (parts.length === 2) return `${total} · ${parts.join(", ")}`;
    return parts[0] ?? total;
  })();

  const rows =
    host.state.filesEntries.length === 0
      ? `<tr><td colspan="5" class="muted">This folder is empty.</td></tr>`
      : host.state.filesEntries
          .map((e) => {
            const checked = host.state.checkedFilePaths.includes(e.path);
            const icon = e.type === "dir" ? "📁" : "📄";
            const nameCell =
              e.type === "dir"
                ? `<button type="button" class="files-name-btn" data-action="files-nav" data-path="${esc(e.path)}" ${host.state.busy ? "disabled" : ""}>
                    <span class="files-icon" aria-hidden="true">${icon}</span>${esc(e.name)}
                  </button>`
                : `<span class="files-name"><span class="files-icon" aria-hidden="true">${icon}</span>${esc(e.name)}</span>`;
            const size = e.type === "dir" ? "—" : formatBytes(e.size);
            return `<tr class="files-row${checked ? " is-checked" : ""}" data-path="${esc(e.path)}" data-type="${e.type}">
              <td class="files-col-check">
                <input type="checkbox" data-action="files-toggle" data-path="${esc(e.path)}"
                  ${checked ? "checked" : ""} ${host.state.busy ? "disabled" : ""}
                  aria-label="Select ${esc(e.name)}" />
              </td>
              <td class="files-col-name">${nameCell}</td>
              <td class="files-col-size mono">${size}</td>
              <td class="files-col-mtime hide-sm">${esc(formatMtime(e.mtime))}</td>
              <td class="files-col-actions">
                ${
                  e.type === "file"
                    ? `<a class="btn btn-ghost btn-small" href="${esc(api.filesDownloadUrl(e.path))}" download="${esc(e.name)}" data-action="files-download">Download</a>`
                    : ""
                }
                <button type="button" class="btn btn-ghost btn-small" data-action="files-copy" data-path="${esc(e.path)}" ${host.state.busy ? "disabled" : ""}>Copy</button>
                <button type="button" class="btn btn-ghost btn-small" data-action="files-move" data-path="${esc(e.path)}" ${host.state.busy ? "disabled" : ""}>Move</button>
                <button type="button" class="btn btn-ghost btn-small" data-action="files-rename-open" data-path="${esc(e.path)}" data-name="${esc(e.name)}" ${host.state.busy ? "disabled" : ""}>Rename</button>
                <button type="button" class="btn btn-ghost btn-small btn-danger-text" data-action="files-delete-open" data-path="${esc(e.path)}" data-name="${esc(e.name)}" ${host.state.busy ? "disabled" : ""}>Delete</button>
              </td>
            </tr>`;
          })
          .join("");

  const renameModal =
    host.state.filesRenamePath !== null
      ? (() => {
          const entry = host.state.filesEntries.find((x) => x.path === host.state.filesRenamePath);
          const current = entry?.name ?? "";
          return renderModal({
            id: "files-rename-modal",
            title: "Rename",
            titleId: "files-rename-title",
            closeAction: "files-rename-close",
            size: "sm",
            form: true,
            formAttrs: 'data-form="files-rename" id="files-rename-form"',
            body: `
                  <input type="hidden" name="path" value="${esc(host.state.filesRenamePath)}" />
                  <label>New name
                    <input type="text" name="newName" value="${esc(current)}" required maxlength="255" autocomplete="off" />
                  </label>`,
            footer: [
              { label: "Cancel", action: "files-rename-close", variant: "ghost" },
              { label: "Rename", type: "submit", variant: "primary", disabled: host.state.busy },
            ],
          });
        })()
      : "";

  const deleteModal =
    host.state.filesDeletePaths !== null && host.state.filesDeletePaths.length > 0
      ? (() => {
          const paths = host.state.filesDeletePaths;
          const multi = paths.length > 1;
          const first = host.state.filesEntries.find((x) => x.path === paths[0]);
          const title = multi
            ? `Delete ${paths.length} items`
            : `Delete ${first?.type === "dir" ? "folder" : "file"}`;
          const body = multi
            ? `<p style="margin:0 0 0.75rem">Delete <strong>${paths.length}</strong> selected items? Folders are removed with their contents. This cannot be undone.</p>
               <ul class="files-delete-list muted small">
                 ${paths
                   .slice(0, 12)
                   .map((p) => {
                     const e = host.state.filesEntries.find((x) => x.path === p);
                     return `<li><span class="mono">${esc(e?.name ?? p)}</span></li>`;
                   })
                   .join("")}
                 ${paths.length > 12 ? `<li>…and ${paths.length - 12} more</li>` : ""}
               </ul>`
            : `<p style="margin:0">Delete <strong>${esc(first?.name ?? paths[0])}</strong>?${
                first?.type === "dir"
                  ? " This removes the folder and everything inside it."
                  : ""
              }</p>`;
          return renderModal({
            id: "files-delete-modal",
            title,
            titleId: "files-delete-title",
            closeAction: "files-delete-close",
            size: "sm",
            body,
            footer: [
              { label: "Cancel", action: "files-delete-close", variant: "ghost" },
              {
                label: "Delete",
                action: "files-delete-confirm",
                variant: "danger",
                disabled: host.state.busy,
              },
            ],
          });
        })()
      : "";

  const transferModal =
    host.state.filesTransfer !== null && host.state.filesTransfer.paths.length > 0
      ? (() => {
          const op = host.state.filesTransfer.op;
          const paths = host.state.filesTransfer.paths;
          const multi = paths.length > 1;
          const first = host.state.filesEntries.find((x) => x.path === paths[0]);
          const defaultName = first?.name ?? basenamePath(paths[0]);
          const title = multi
            ? `${op === "copy" ? "Copy" : "Move"} ${paths.length} items`
            : `${op === "copy" ? "Copy" : "Move"} ${first?.type === "dir" ? "folder" : "file"}`;
          const destLabel =
            host.state.filesTransferDest === "" ? "Home" : host.state.filesTransferDest;
          const destBlocked = isBlockedTransferDest(host, host.state.filesTransferDest, paths);
          return renderModal({
            id: "files-transfer-modal",
            title,
            titleId: "files-transfer-title",
            closeAction: "files-transfer-close",
            size: "md",
            form: true,
            formAttrs: 'data-form="files-transfer"',
            body: `
                  ${
                    multi
                      ? `<p class="muted small" style="margin:0 0 0.75rem">${paths.length} items will be ${op === "copy" ? "copied" : "moved"} into the destination folder (original names kept).</p>`
                      : `<p class="muted small" style="margin:0 0 0.75rem"><span class="mono">${esc(defaultName)}</span></p>`
                  }
                  <input type="hidden" name="toPath" value="${esc(host.state.filesTransferDest)}" />
                  <div class="files-transfer-dest">
                    <div class="files-transfer-dest-head">
                      <span class="files-transfer-dest-label">Destination folder</span>
                      <span class="muted small mono files-transfer-dest-value" title="${esc(destLabel)}">${esc(destLabel)}</span>
                    </div>
                    ${renderFilesFolderTree(host)}
                    <p id="files-transfer-dest-hint" class="muted small" style="margin:0.5rem 0 0">
                      Click a folder to select it. Use ▸ to expand. Home is the host.root of your file storage.
                    </p>
                  </div>
                  ${
                    !multi
                      ? `<label style="margin-top:0.85rem">New name <span class="muted">(optional)</span>
                          <input type="text" name="newName" value="${esc(defaultName)}" maxlength="255" autocomplete="off" />
                        </label>
                        <p class="muted small" style="margin:0.35rem 0 0">
                          ${
                            op === "copy"
                              ? "Same-folder copies get a “ (copy)” name. Cross-folder copies keep the original name unless it already exists in the destination."
                              : "Leave as-is to keep the current name."
                          }
                        </p>`
                      : ""
                  }`,
            footer: [
              { label: "Cancel", action: "files-transfer-close", variant: "ghost" },
              {
                label: op === "copy" ? "Copy" : "Move",
                type: "submit",
                variant: "primary",
                disabled: host.state.busy || destBlocked,
              },
            ],
          });
        })()
      : "";

  const mkdirModal = host.state.filesMkdirOpen
    ? renderModal({
        id: "files-mkdir-modal",
        title: "New folder",
        titleId: "files-mkdir-title",
        closeAction: "files-mkdir-close",
        size: "sm",
        form: true,
        formAttrs: 'data-form="files-mkdir"',
        body: `
              <p class="muted small" style="margin:0 0 0.75rem">
                Create a folder in
                <span class="mono">${esc(host.state.filesPath === "" ? "Home" : host.state.filesPath)}</span>
              </p>
              <label>Folder name
                <input type="text" name="name" value="" required maxlength="255" autocomplete="off"
                  placeholder="e.g. Documents" autofocus />
              </label>`,
        footer: [
          { label: "Cancel", action: "files-mkdir-close", variant: "ghost" },
          { label: "Create", type: "submit", variant: "primary", disabled: host.state.busy },
        ],
      })
    : "";

  const uploadConflictModal = host.state.filesUploadConflict
    ? (() => {
        const c = host.state.filesUploadConflict;
        const n = c.conflictCount;
        const head =
          n === 1
            ? "1 file already exists in the destination."
            : `${n} of ${c.totalFiles} files already exist in the destination.`;
        const list = c.names
          .slice(0, 12)
          .map((name) => `<li><span class="mono">${esc(name)}</span></li>`)
          .join("");
        const more =
          c.names.length > 12
            ? `<li class="muted">…and ${c.names.length - 12} more</li>`
            : "";
        return renderModal({
          id: "files-upload-conflict-modal",
          title: n === 1 ? "File already exists" : "Files already exist",
          titleId: "files-upload-conflict-title",
          closeAction: "files-upload-conflict-cancel",
          size: "sm",
          body: `
              <p style="margin:0 0 0.75rem">${esc(head)}</p>
              <ul class="files-delete-list muted small" style="margin:0 0 0.85rem;max-height:12rem;overflow:auto">
                ${list}
                ${more}
              </ul>
              <p class="muted small" style="margin:0">
                Choose whether to replace the existing files, skip them, or cancel the upload.
              </p>`,
          footer: [
            { label: "Cancel", action: "files-upload-conflict-cancel", variant: "ghost" },
            { label: "Skip existing", action: "files-upload-conflict-skip", variant: "ghost" },
            {
              label: n === 1 ? "Overwrite" : "Overwrite all",
              action: "files-upload-conflict-overwrite",
              variant: "primary",
            },
          ],
        });
      })()
    : "";

  const destLabel = host.state.filesPath === "" ? "Home" : host.state.filesPath;
  const uploadMenu = `<div class="files-upload-menu${host.state.filesUploadMenuOpen ? " is-open" : ""}">
          <button type="button" class="btn btn-primary btn-small files-upload-menu-trigger"
            data-action="files-upload-menu-toggle"
            ${host.state.busy ? "disabled" : ""}
            aria-haspopup="menu"
            aria-expanded="${host.state.filesUploadMenuOpen ? "true" : "false"}"
            aria-controls="files-upload-menu-list"
            title="Upload files or a folder into this directory">
            Upload
            <span class="files-upload-menu-caret" aria-hidden="true">▾</span>
          </button>
          <div id="files-upload-menu-list" class="files-upload-menu-dropdown" role="menu"
            ${host.state.filesUploadMenuOpen ? "" : "hidden"}>
            <button type="button" class="files-upload-menu-item" role="menuitem"
              data-action="files-upload-files" ${host.state.busy ? "disabled" : ""}>
              Files…
            </button>
            <button type="button" class="files-upload-menu-item" role="menuitem"
              data-action="files-upload-folder" ${host.state.busy ? "disabled" : ""}>
              Folder…
            </button>
          </div>
        </div>
        <input type="file" data-action="files-upload-pick-files" ${host.state.busy ? "disabled" : ""} multiple hidden />
        <input type="file" data-action="files-upload-pick-folder" ${host.state.busy ? "disabled" : ""}
          multiple webkitdirectory directory hidden />`;

  return `<div class="portal-grid portal-grid-files">
    <section class="card files-panel${host.state.filesUploadDropActive ? " is-dragover" : ""}" data-files-drop-target>
      <div class="files-drop-overlay" aria-hidden="true">
        <div class="files-drop-overlay-inner">
          <p class="files-drop-overlay-title">Drop to upload</p>
          <p class="muted small mono">${esc(destLabel)}</p>
          <p class="muted small" style="margin:0.35rem 0 0">Files, folders, or a mix — structure is kept.</p>
        </div>
      </div>
      <div class="files-head">
        ${infoTitle("Files", "files", "h1")}
        <div class="files-quota muted small" title="Storage usage (application quota)">
          <div class="files-quota-bar" role="progressbar" aria-valuenow="${quotaPct}" aria-valuemin="0" aria-valuemax="100">
            <div class="files-quota-fill" style="width:${quotaPct}%"></div>
          </div>
          <span>${esc(quotaLabel)}</span>
        </div>
      </div>
      <div class="files-toolbar">
        ${filesBreadcrumb(host, host.state.filesPath)}
        <div class="files-toolbar-actions">
          <button type="button" class="btn btn-ghost btn-small" data-action="files-refresh" ${host.state.busy || host.state.filesLoading ? "disabled" : ""}>Refresh</button>
          <button type="button" class="btn btn-ghost btn-small" data-action="files-mkdir" ${host.state.busy ? "disabled" : ""}>New folder</button>
          ${uploadMenu}
        </div>
      </div>
      ${bulkBar}
      <div class="table-wrap files-table-wrap">
        <table class="files-table">
          <thead>
            <tr>
              <th class="files-col-check">
                <input type="checkbox" data-action="files-select-all"
                  ${allChecked ? "checked" : ""}
                  ${someChecked && !allChecked ? "data-indeterminate=1" : ""}
                  ${host.state.busy || host.state.filesEntries.length === 0 ? "disabled" : ""}
                  aria-label="Select all in this folder" />
              </th>
              <th class="files-col-name">Name</th>
              <th class="files-col-size">Size</th>
              <th class="files-col-mtime hide-sm">Modified</th>
              <th class="files-col-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${host.state.filesLoading && host.state.filesEntries.length === 0 ? `<tr><td colspan="5" class="muted">Loading…</td></tr>` : rows}
          </tbody>
        </table>
      </div>
      <div class="files-status-bar muted small" role="status" aria-live="polite">
        ${nChecked > 0 ? `${nChecked} of ${host.state.filesEntries.length} selected` : esc(filesCountLabel)}
      </div>
    </section>
    ${renameModal}
    ${deleteModal}
    ${transferModal}
    ${mkdirModal}
    ${uploadConflictModal}
  </div>`;
}
