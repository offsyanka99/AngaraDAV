/**
 * Post-render DOM hooks after every render().
 *
 * Mount-time (registerPortalEvents): Escape, click, submit, change/input,
 * row keydown, files drop, avatar error.
 * Here: outside-click menus, indeterminate checkboxes, holidays initial sync.
 */
import type { AppOrchestrator } from "./orchestrator";
import * as files from "./files";
import * as admin from "./admin";
import { bindDtPickerOutside, unbindDtPickerOutside } from "./shell";

export function bind(o: AppOrchestrator) {
  const { state, render } = o;

  o.unbindUserMenuOutside();
  if (state.userMenuOpen) {
    o.bindUserMenuOutside();
  }
  unbindDtPickerOutside(state);
  if (state.eventDtPicker) {
    bindDtPickerOutside(state, render);
  }
  o.unbindFilesUploadMenuOutside();
  if (state.filesUploadMenuOpen) {
    o.bindFilesUploadMenuOutside();
  }

  // Indeterminate select-all + no-op hooks (submits/drop/photo/import delegated)
  files.bindFilesDom(o.filesHost);
  admin.bindAdminDom(o.adminHost);
  o.bindHolidaysToggle();
  o.bindImportInput();
  o.bindContactPhotoInput();
}
