/**
 * Shell composition: tabs + active domain home (Phase 8).
 */
import type { AppOrchestrator } from "./orchestrator";
import { renderCalendarsHome } from "./calendars/home";
import { renderContactsHome } from "./contacts/home";

export function renderHome(o: AppOrchestrator): void {
  const { state, root } = o;
  if (!state.user) {
    o.renderLogin();
    return;
  }

  let mainTab: string;
  switch (state.activeTab) {
    case "calendars":
      mainTab = renderCalendarsHome(o);
      break;
    case "contacts":
      mainTab = renderContactsHome(o);
      break;
    case "tasks":
      mainTab = o.renderTasksTab();
      break;
    case "notes":
      mainTab = o.renderNotesTab();
      break;
    case "files":
      mainTab = o.renderFilesTab();
      break;
    case "admin":
      mainTab = o.renderAdminSection();
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
          <button type="button" role="tab" class="tab-btn${state.activeTab === "calendars" ? " is-active" : ""}"
            data-action="tab" data-tab="calendars" aria-selected="${state.activeTab === "calendars"}">
            Calendar
          </button>
          <button type="button" role="tab" class="tab-btn${state.activeTab === "contacts" ? " is-active" : ""}"
            data-action="tab" data-tab="contacts" aria-selected="${state.activeTab === "contacts"}">
            Contacts
          </button>
          <button type="button" role="tab" class="tab-btn${state.activeTab === "tasks" ? " is-active" : ""}"
            data-action="tab" data-tab="tasks" aria-selected="${state.activeTab === "tasks"}">
            Tasks
          </button>
          <button type="button" role="tab" class="tab-btn${state.activeTab === "notes" ? " is-active" : ""}"
            data-action="tab" data-tab="notes" aria-selected="${state.activeTab === "notes"}">
            Notes
          </button>
          <button type="button" role="tab" class="tab-btn${state.activeTab === "files" ? " is-active" : ""}"
            data-action="tab" data-tab="files" aria-selected="${state.activeTab === "files"}">
            Files
          </button>
          <button type="button" class="info-btn tab-info" data-action="info"
            data-info="${tabInfoKey}"
            aria-label="About this tab" title="About this tab"><span aria-hidden="true">i</span></button>
        </div>`;

  root.innerHTML = o.shell(mainTab, { tabs: tabsHtml });
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
      state.filesUploadConflict !== null ||
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
