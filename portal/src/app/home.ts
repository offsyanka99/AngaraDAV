/**
 * Shell composition: tabs + active domain home (Phase 8).
 */
import type { AppState } from "./context";
import type { AppOrchestrator } from "./orchestrator";
import * as admin from "./admin";
import { renderCalendarsHome } from "./calendars/home";
import { renderContactsHome } from "./contacts/home";
import * as files from "./files";
import * as notes from "./notes";
import { ensureAppSlots, overlayHtml, overlayStabilityKey, patchOverlays } from "./overlays";
import { isUserTabEnabled } from "./session";
import * as tasks from "./tasks";
import type { TabId } from "./types";

function userTabButton(state: AppState, tab: TabId, label: string): string {
  if (!isUserTabEnabled(state, tab)) return "";
  const active = state.activeTab === tab;
  return `<button type="button" role="tab" class="tab-btn${active ? " is-active" : ""}"
            data-action="tab" data-tab="${tab}" aria-selected="${active}">
            ${label}
          </button>`;
}

export function renderHome(o: AppOrchestrator): void {
  const { state, root } = o;
  if (!state.user) {
    o.renderLogin();
    return;
  }

  let mainTab: string;
  switch (state.activeTab) {
    case "calendars":
      mainTab = isUserTabEnabled(state, "calendars")
        ? renderCalendarsHome(o)
        : renderDisabledServicePanel("Calendar", "CalDAV");
      break;
    case "contacts":
      mainTab = isUserTabEnabled(state, "contacts")
        ? renderContactsHome(o)
        : renderDisabledServicePanel("Contacts", "CardDAV");
      break;
    case "tasks":
      mainTab = isUserTabEnabled(state, "tasks")
        ? tasks.renderTasksTab(o.tasksHost)
        : renderDisabledServicePanel("Tasks", "Tasks (VTODO)");
      break;
    case "notes":
      mainTab = isUserTabEnabled(state, "notes")
        ? notes.renderNotesTab(o.notesHost)
        : renderDisabledServicePanel("Notes", "Notes (VJOURNAL)");
      break;
    case "files":
      mainTab = isUserTabEnabled(state, "files")
        ? files.renderFilesTab(o.filesHost)
        : renderDisabledServicePanel("Files", "WebDAV file storage");
      break;
    case "admin":
      mainTab = admin.renderAdminSection(o.adminHost);
      break;
    default:
      mainTab = renderCalendarsHome(o);
  }

  const tabInfoKey =
    state.activeTab === "calendars"
      ? "my-calendars"
      : state.activeTab === "contacts"
        ? "my-contacts"
        : state.activeTab === "tasks"
          ? "tasks"
          : state.activeTab === "notes"
            ? "notes"
            : state.activeTab === "files"
              ? "files"
              : "administration";

  const tabsHtml =
    state.activeTab === "admin"
      ? `<div class="tabs" role="tablist" aria-label="Administration sections">
          ${o.adminSubnavButtons()}
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${
              state.adminPage === "overview"
                ? "admin-overview"
                : state.adminPage === "users"
                  ? "admin-users"
                  : state.adminPage === "settings"
                    ? "admin-settings"
                    : "admin-database"
            }"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`
      : `<div class="tabs" role="tablist" aria-label="Portal sections">
          ${userTabButton(state, "calendars", "Calendar")}
          ${userTabButton(state, "contacts", "Contacts")}
          ${userTabButton(state, "tasks", "Tasks")}
          ${userTabButton(state, "notes", "Notes")}
          ${userTabButton(state, "files", "Files")}
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${tabInfoKey}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`;

  const { page, overlays } = ensureAppSlots(root);
  page.innerHTML = o.shell(mainTab, { tabs: tabsHtml });
  patchOverlays(overlays, overlayHtml(o), overlayStabilityKey(state));
  document.body.classList.toggle(
    "cal-modal-open",
    state.calModalOpen ||
      state.createCalModalOpen ||
      state.deleteConfirmId !== null ||
      state.deleteAbConfirmId !== null ||
      state.eventModalOpen ||
      state.contactModalOpen ||
      state.abModalOpen ||
      state.importProgress !== null ||
      state.filesUploadProgress !== null ||
      state.filesRenamePath !== null ||
      state.filesDeletePaths !== null ||
      state.filesTransfer !== null ||
      state.filesMkdirOpen ||
      state.filesPreview !== null ||
      state.filesUploadConflict !== null ||
      state.confirmDelete !== null ||
      state.adminUserCreateOpen ||
      state.adminUserEditOpen ||
      state.adminUserDeleteUsername !== null ||
      state.adminResetModalOpen ||
      state.adminDbConfirmOpen ||
      state.adminCalModal !== null ||
      state.adminAbModal !== null ||
      state.adminResourceDelete !== null,
  );
  document.body.classList.toggle("layout-contacts", state.activeTab === "contacts");
  document.body.classList.toggle("layout-calendars", state.activeTab === "calendars");
  document.body.classList.toggle(
    "layout-tasks",
    state.activeTab === "tasks" || state.activeTab === "notes",
  );
  document.body.classList.toggle("layout-files", state.activeTab === "files");
  document.body.classList.toggle("layout-admin", state.activeTab === "admin");
}

function renderDisabledServicePanel(section: string, settingLabel: string): string {
  return `<div class="panel empty-panel">
    <h2>${section}</h2>
    <p class="muted">${section} is disabled in system settings (Enable ${settingLabel}).
    An administrator can re-enable it under Administration → System settings.</p>
  </div>`;
}
