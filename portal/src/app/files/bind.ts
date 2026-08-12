/**
 * Files tab DOM listeners (upload inputs, panel drop, form submits) (Phase 4).
 */
import {
  dataTransferHasFiles,
  itemsFromDataTransfer,
} from "../../filesUploadPick";
import type { FilesHost } from "./host";
import { onFilesMkdir, onFilesRename } from "./actions";
import { onFilesTransfer } from "./transfer";
import {
  onFilesUploadInput,
  startFilesUpload,
  unbindFilesUploadMenuOutside,
} from "./upload";

export function bindFilesDom(host: FilesHost): void {
  const { root, state } = host;

  const filesRenameForm = root.querySelector<HTMLFormElement>('[data-form="files-rename"]');
  filesRenameForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    void onFilesRename(host, filesRenameForm);
  });
  const filesTransferForm = root.querySelector<HTMLFormElement>(
    '[data-form="files-transfer"]',
  );
  filesTransferForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    void onFilesTransfer(host, filesTransferForm);
  });
  const filesMkdirForm = root.querySelector<HTMLFormElement>('[data-form="files-mkdir"]');
  filesMkdirForm?.addEventListener("submit", (ev) => {
    ev.preventDefault();
    void onFilesMkdir(host, filesMkdirForm);
  });

  root
    .querySelectorAll<HTMLInputElement>(
      'input[type="file"][data-action="files-upload-pick-files"]',
    )
    .forEach((input) => {
      input.addEventListener("change", () => {
        onFilesUploadInput(host, input, false);
      });
    });
  root
    .querySelectorAll<HTMLInputElement>(
      'input[type="file"][data-action="files-upload-pick-folder"]',
    )
    .forEach((input) => {
      input.addEventListener("change", () => {
        onFilesUploadInput(host, input, true);
      });
    });
  // Drag-and-drop on the files panel: files, folders, or a mix
  const dropTarget = root.querySelector<HTMLElement>("[data-files-drop-target]");
  if (dropTarget && state.activeTab === "files" && !state.busy && !state.filesUploadProgress) {
    let dragDepth = 0;
    const setDrag = (on: boolean) => {
      if (state.filesUploadDropActive === on) return;
      state.filesUploadDropActive = on;
      dropTarget.classList.toggle("is-dragover", on);
    };
    dropTarget.addEventListener("dragenter", (ev) => {
      if (!dataTransferHasFiles(ev.dataTransfer)) return;
      ev.preventDefault();
      ev.stopPropagation();
      dragDepth += 1;
      setDrag(true);
    });
    dropTarget.addEventListener("dragover", (ev) => {
      if (!dataTransferHasFiles(ev.dataTransfer)) return;
      ev.preventDefault();
      ev.stopPropagation();
      if (ev.dataTransfer) ev.dataTransfer.dropEffect = "copy";
      setDrag(true);
    });
    dropTarget.addEventListener("dragleave", (ev) => {
      if (!dataTransferHasFiles(ev.dataTransfer)) return;
      ev.preventDefault();
      ev.stopPropagation();
      dragDepth = Math.max(0, dragDepth - 1);
      if (dragDepth === 0) setDrag(false);
    });
    dropTarget.addEventListener("drop", (ev) => {
      if (!dataTransferHasFiles(ev.dataTransfer)) return;
      ev.preventDefault();
      ev.stopPropagation();
      dragDepth = 0;
      setDrag(false);
      const dt = ev.dataTransfer;
      if (!dt || state.busy || state.filesUploadProgress) return;
      state.filesUploadMenuOpen = false;
      unbindFilesUploadMenuOutside(host);
      void (async () => {
        try {
          const items = await itemsFromDataTransfer(dt);
          if (items.length === 0) {
            host.setFlash("info", "Nothing to upload from that drop");
            host.render();
            return;
          }
          await startFilesUpload(host, items);
        } catch (e) {
          host.setFlash("error", e instanceof Error ? e.message : "Drop failed");
          host.render();
        }
      })();
    });
  }

  // Indeterminate "select all" for files multi-select
  root
    .querySelectorAll<HTMLInputElement>(
      'input[data-action="files-select-all"][data-indeterminate="1"]',
    )
    .forEach((cb) => {
      cb.indeterminate = true;
    });
}
