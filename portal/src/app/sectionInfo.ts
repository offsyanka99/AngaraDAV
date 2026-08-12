/**
 * Section (i) help copy and title row helper (Phase 1 extract from app.ts).
 */
import { esc } from "../ui";

export type SectionInfo = { title: string; paragraphs: string[] };

/** Section help texts shown in (i) info modals */
export const SECTION_INFO: Record<string, SectionInfo> = {
  "my-calendars": {
    title: "Calendar",
    paragraphs: [
      "Create and edit calendars, then share them with other AngaraDAV users.",
      "CalDAV clients (Thunderbird, Apple Calendar, DAVx⁵, Home Assistant, …) keep using /dav.php/ — this portal is for management only.",
    ],
  },
  owned: {
    title: "Owned",
    paragraphs: [
      "Calendars you own appear here. Check one or more to show events on the month grid. Underlined name is primary for new events.",
      "Use Export for a full .ics download, Edit for details/share/import, or Delete to remove a calendar.",
      "Badges show ownership, read-only mode, and holiday calendars.",
    ],
  },
  "add-calendar": {
    title: "Add calendar",
    paragraphs: [
      "Create a normal calendar, or a holidays calendar for a chosen country (public holidays for this year and next are imported automatically via Nager.Date).",
      "Import .ics creates a new calendar (using the display name, or the file name if the name is empty) and imports all events into it. Large files show a progress dialog.",
      "Read-only (for everyone) blocks import in the portal, forces shares to read-only, and rejects CalDAV writes (PUT/DELETE/…) from clients such as DAVx⁵, Thunderbird, and Home Assistant.",
    ],
  },
  "shared-with-me": {
    title: "Shared with me",
    paragraphs: [
      "Calendars other users shared with you. Check one or more to view events in the month grid.",
      "Export downloads a .ics file of that calendar. Read-only shares allow viewing only; full access also lets you create and edit events (owner still manages name, color, and sharing).",
    ],
  },
  "calendar-details": {
    title: "Calendar details",
    paragraphs: [
      "Display name, color, and description are stored on the calendar and are visible to CalDAV clients.",
      "The URI is the internal calendar path used by CalDAV; it does not change when you rename the display name.",
    ],
  },
  "import-export": {
    title: "Import / export",
    paragraphs: [
      "Export downloads a standard .ics file of the whole calendar.",
      "Import merges VEVENT, VTODO, and VJOURNAL components. The same UID updates an existing object; new UIDs create objects.",
      "Large imports show a progress dialog (read → upload → server import) with elapsed time; keep the tab open until it finishes.",
      "Read-only calendars can still be exported, but import is disabled so reference data (e.g. holidays) stays intact.",
    ],
  },
  share: {
    title: "Share",
    paragraphs: [
      "Share this calendar with another AngaraDAV user. Choose read-only or full access.",
      "This is the same sharing model as the classic /dav.php/ browser, without typing mailto: addresses.",
      "If the calendar is marked read-only, shares are always read-only for everyone.",
    ],
  },
  "my-contacts": {
    title: "Contacts",
    paragraphs: [
      "Manage address books and individual contacts for CardDAV. Clients (Thunderbird, DAVx⁵, …) keep using /dav.php/.",
      "Create or rename address books, search contacts, add/edit/delete cards, upload photos, and import/export .vcf files.",
    ],
  },
  tasks: {
    title: "Tasks",
    paragraphs: [
      "Tasks are CalDAV VTODO items stored in your calendars. They sync with Apple Reminders, Thunderbird, DAVx⁵, and other clients via /dav.php/.",
      "Subtasks use RELATED-TO;RELTYPE=PARENT (same calendar). Add a subtask from a parent, or set Parent in the form. Deleting a parent promotes its children to top-level.",
      "Click a column header to sort. Create tasks on any writable calendar that allows VTODO components.",
    ],
  },
  notes: {
    title: "Notes",
    paragraphs: [
      "Notes are CalDAV VJOURNAL items stored in your calendars. Compatible clients sync them over /dav.php/.",
      "Click a column header to sort. Pick a writable calendar when creating a note.",
    ],
  },
  files: {
    title: "Files",
    paragraphs: [
      "Browse and manage your private WebDAV file home. The same files are available to desktop clients at /dav.php/files/{username}/.",
      "Upload via the toolbar menu: Files… or Folder…. Drag-and-drop onto the file list accepts files, folders, or a mix — nested structure is recreated automatically. Large or multi-file uploads show a progress dialog — keep the tab open until it finishes.",
      "Browsers use separate pickers for files vs folders; drop can mix both. Where supported, modern pickers (File System Access API) are used with classic file inputs as fallback (Safari/Firefox).",
      "Download (files), create folders, copy, move, rename, and delete work for both files and folders. Use checkboxes to multi-select items for bulk copy, move, or delete.",
      "Copy and Move open a folder tree so you can pick the destination (Home or any subfolder) without typing a path.",
      "Same-folder copies get a “ (copy)” name so the original is never overwritten. Copies into another folder keep the original filename unless that name is already taken there.",
      "Quotas and size limits are configured by the administrator. Enable storage under Admin → AngaraDAV Settings → Enable WebDAV file storage.",
    ],
  },
  "address-books": {
    title: "Address books",
    paragraphs: [
      "Address books you own. Select one to manage its contacts.",
      "Use Export for a multi-vCard .vcf of the whole book, Edit for rename/import, or Delete to remove it. Deleting a non-empty book requires confirmation.",
    ],
  },
  contacts: {
    title: "Contacts",
    paragraphs: [
      "Search filters by name, email, phone, org, notes, and custom fields.",
      "Add or select a contact to edit fields. Multiple emails and phones are supported.",
      "Photos are resized to 256px JPEG and stored in the vCard so CardDAV clients can sync them.",
      "Custom fields support any language in the label and value (including Cyrillic). They are stored as X-BAIKAL-CUSTOM in the vCard so non-English labels work; CardDAV clients that ignore unknown properties will not show them.",
    ],
  },
  "contact-import-export": {
    title: "Import / export contacts",
    paragraphs: [
      "Export downloads a multi-vCard .vcf file of every contact in the address book.",
      "Import accepts standard .vcf files (Thunderbird, Apple Contacts, Google). Same UID updates an existing card; new UIDs create cards.",
      "Large imports show a progress dialog with elapsed time — keep the tab open until the result appears.",
    ],
  },
  administration: {
    title: "Administration",
    paragraphs: [
      "Server administration for AngaraDAV, available to portal users with the Admin role.",
      "Overview, users, system settings, and database management for operators with the Admin role.",
      "Admin API calls use your portal DAV session and require the Admin role server-side.",
    ],
  },
  "admin-overview": {
    title: "Overview",
    paragraphs: [
      "Snapshot of registered users, calendars, events, address books, contacts, and which DAV services are enabled.",
      "Version and release links help you compare installs. Counts refresh from the dashboard API.",
    ],
  },
  "admin-users": {
    title: "Users",
    paragraphs: [
      "List, create, edit, and delete DAV users from the portal. Password digests are never returned.",
      "Create seeds a default calendar and address book. Delete removes calendars, contacts, and quarantines file homes when files are enabled.",
      "Manage users, system settings, and database from these Administration tabs.",
    ],
  },
  "admin-settings": {
    title: "System settings",
    paragraphs: [
      "Edit DAV services, files, push, session timeout, portal admin role list, and admin password.",
      "Saves write config/baikal.yaml atomically. Session timeout applies to portal idle cookies.",
    ],
  },
  "admin-database": {
    title: "Database",
    paragraphs: [
      "Read-only view of backend type, SQLite path or PostgreSQL host/dbname/username.",
      "Passwords and encryption keys are never returned. Saving requires typing CONFIRM — wrong values can take the instance offline.",
    ],
  },
};

export function infoTitle(title: string, infoKey: string, tag: "h1" | "h2" = "h2"): string {
  const Tag = tag;
  return `<div class="section-title-row">
    <${Tag}>${esc(title)}</${Tag}>
    <button type="button" class="info-btn" data-action="info" data-info="${esc(infoKey)}"
      aria-label="About ${esc(title)}" title="About ${esc(title)}">
      <span aria-hidden="true">i</span>
    </button>
  </div>`;
}

export function infoModalHtml(): string {
  return `
    <div class="info-modal" id="info-modal" hidden role="dialog" aria-modal="true" aria-labelledby="info-modal-title">
      <div class="info-modal-backdrop" data-action="info-close"></div>
      <div class="info-modal-card">
        <header class="info-modal-header">
          <h3 id="info-modal-title"></h3>
          <button type="button" class="modal-close info-modal-close" data-action="info-close" aria-label="Close">×</button>
        </header>
        <div class="info-modal-body muted small" id="info-modal-body"></div>
        <footer class="info-modal-footer">
          <button type="button" class="btn btn-primary" data-action="info-close">Got it</button>
        </footer>
      </div>
    </div>`;
}
