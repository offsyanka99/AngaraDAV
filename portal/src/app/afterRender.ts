/**
 * Post-render hooks (delegated-events Step 7).
 * Mount-time events live in registerPortalEvents; this only syncs state that
 * must re-apply after innerHTML (outside-click, indeterminate, holidays UI).
 */
import type { AppOrchestrator } from "./orchestrator";
import * as files from "./files";
import { bindDtPickerOutside, unbindDtPickerOutside } from "./shell";

/** @deprecated use bindAfterRender — kept as alias for older imports */
export function bind(o: AppOrchestrator): void {
  bindAfterRender(o);
}

export function bindAfterRender(o: AppOrchestrator): void {
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

  // Indeterminate select-all must be re-set after each paint
  files.bindFilesDom(o.filesHost);
  // Create-cal holidays field visibility (no listener)
  o.bindHolidaysToggle();
}
