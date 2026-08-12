/**
 * Post-render DOM bind. Called after every render().
 *
 * Owned by registerPortalEvents:
 *   Escape (1), click (2), submit (3), change+input (4).
 * Still re-bound here: row keydown, avatar error, files drop, outside menus,
 * holidays initial sync (no listener).
 */
import type { AppOrchestrator } from "./orchestrator";
import * as files from "./files";
import * as admin from "./admin";
import { bindDtPickerOutside, unbindDtPickerOutside } from "./shell";

export function bind(o: AppOrchestrator) {
  const { state, root, render } = o;

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

  // Step 5 will move row Enter/Space to root keydown
  root
    .querySelectorAll<HTMLElement>(
      "tr.contact-table-row[data-action], .cal-row[data-action], .month-cell[data-action]",
    )
    .forEach((row) => {
      row.addEventListener("keydown", (ev: KeyboardEvent) => {
        if (ev.key === "Enter" || ev.key === " ") {
          ev.preventDefault();
          row.click();
        }
      });
    });

  // Avatar error does not bubble — keep post-render until Step 6
  root.querySelectorAll<HTMLImageElement>("img.contact-avatar[data-avatar-fallback]").forEach((img) => {
    img.addEventListener("error", () => {
      const letter = img.dataset.avatarFallback || "?";
      const span = document.createElement("span");
      span.className = "contact-avatar contact-avatar-fallback";
      span.setAttribute("aria-hidden", "true");
      span.textContent = letter;
      img.replaceWith(span);
    });
  });

  // Files drop + indeterminate (upload inputs are delegated change)
  files.bindFilesDom(o.filesHost);
  admin.bindAdminDom(o.adminHost);
  // Initial holidays UI sync only (change is delegated)
  o.bindHolidaysToggle();
  // import / contact photo: no-ops (change delegated)
  o.bindImportInput();
  o.bindContactPhotoInput();
}
