import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SyncStatus } from "../api/types.ts";
import {
  clampPollSeconds,
  DEFAULT_POLL_SECONDS,
  domainNoun,
  hasComponent,
  hasOpenEditor,
  isCompoundBusy,
  isDomainStale,
  MAX_POLL_SECONDS,
  MIN_POLL_SECONDS,
  shouldShowStaleToast,
} from "./backgroundSyncDiff.ts";

const baseFiles = {
  enabled: true,
  ready: true,
  path: "",
  fingerprint: "abc",
  missing: false,
} as const;

function status(over: Partial<SyncStatus> = {}): SyncStatus {
  return {
    pollSeconds: 30,
    calendars: [
      { instanceId: 12, calendarId: 4, synctoken: 88, components: "VEVENT,VTODO" },
      { instanceId: 20, calendarId: 5, synctoken: 3, components: "VJOURNAL" },
      { instanceId: 21, calendarId: 6, synctoken: 10, components: "VEVENT" },
    ],
    addressBooks: [{ id: 3, synctoken: 14 }],
    files: { ...baseFiles },
    ...over,
  };
}

describe("clampPollSeconds", () => {
  it("should fall back to 30 when the value is missing", () => {
    assert.equal(clampPollSeconds(undefined), DEFAULT_POLL_SECONDS);
    assert.equal(clampPollSeconds(null), DEFAULT_POLL_SECONDS);
    assert.equal(clampPollSeconds("nope"), DEFAULT_POLL_SECONDS);
  });

  it("should clamp below 10 and above 300", () => {
    assert.equal(clampPollSeconds(1), MIN_POLL_SECONDS);
    assert.equal(clampPollSeconds(999), MAX_POLL_SECONDS);
  });

  it("should keep a value already in range", () => {
    assert.equal(clampPollSeconds(45), 45);
    assert.equal(clampPollSeconds("60"), 60);
  });
});

describe("isDomainStale", () => {
  it("should not toast before the first snapshot", () => {
    assert.equal(isDomainStale("notes", null, status(), []), false);
  });

  it("should diff calendars only for selected instanceIds", () => {
    const snap = status();
    const next = status({
      calendars: [
        { instanceId: 12, calendarId: 4, synctoken: 89, components: "VEVENT,VTODO" },
        { instanceId: 20, calendarId: 5, synctoken: 3, components: "VJOURNAL" },
        { instanceId: 21, calendarId: 6, synctoken: 10, components: "VEVENT" },
      ],
    });
    assert.equal(isDomainStale("calendars", snap, next, [12]), true);
    assert.equal(isDomainStale("calendars", snap, next, [21]), false);
    assert.equal(isDomainStale("calendars", snap, next, []), false);
  });

  it("should treat a newly selected calendar instance as stale", () => {
    const snap = status({
      calendars: [{ instanceId: 12, calendarId: 4, synctoken: 88, components: "VEVENT" }],
    });
    const next = status({
      calendars: [
        { instanceId: 12, calendarId: 4, synctoken: 88, components: "VEVENT" },
        { instanceId: 99, calendarId: 9, synctoken: 1, components: "VEVENT" },
      ],
    });
    assert.equal(isDomainStale("calendars", snap, next, [12, 99]), true);
  });

  it("should diff all VTODO calendars for tasks, ignoring calendar selection", () => {
    const snap = status();
    const next = status({
      calendars: [
        { instanceId: 12, calendarId: 4, synctoken: 89, components: "VEVENT,VTODO" },
        { instanceId: 20, calendarId: 5, synctoken: 3, components: "VJOURNAL" },
        { instanceId: 21, calendarId: 6, synctoken: 10, components: "VEVENT" },
      ],
    });
    assert.equal(isDomainStale("tasks", snap, next, []), true);
    assert.equal(isDomainStale("notes", snap, next, []), false);
    assert.equal(isDomainStale("calendars", snap, next, [21]), false);
  });

  it("should diff all VJOURNAL calendars for notes", () => {
    const snap = status();
    const next = status({
      calendars: [
        { instanceId: 12, calendarId: 4, synctoken: 88, components: "VEVENT,VTODO" },
        { instanceId: 20, calendarId: 5, synctoken: 4, components: "VJOURNAL" },
        { instanceId: 21, calendarId: 6, synctoken: 10, components: "VEVENT" },
      ],
    });
    assert.equal(isDomainStale("notes", snap, next, [12]), true);
    assert.equal(isDomainStale("tasks", snap, next, [12]), false);
  });

  it("should match VTODO components case-insensitively", () => {
    assert.equal(hasComponent("vevent,vtodo", "VTODO"), true);
    const snap = status({
      calendars: [{ instanceId: 1, calendarId: 1, synctoken: 1, components: "vevent,vtodo" }],
    });
    const next = status({
      calendars: [{ instanceId: 1, calendarId: 1, synctoken: 2, components: "VEVENT,VTODO" }],
    });
    assert.equal(isDomainStale("tasks", snap, next, []), true);
  });

  it("should diff every address book synctoken for contacts", () => {
    const snap = status();
    const bumped = status({ addressBooks: [{ id: 3, synctoken: 15 }] });
    const added = status({
      addressBooks: [
        { id: 3, synctoken: 14 },
        { id: 4, synctoken: 1 },
      ],
    });
    assert.equal(isDomainStale("contacts", snap, bumped, []), true);
    assert.equal(isDomainStale("contacts", snap, added, []), true);
    assert.equal(isDomainStale("contacts", snap, status(), []), false);
  });

  it("should treat files fingerprint, path, and missing as stale", () => {
    const snap = status();
    assert.equal(
      isDomainStale("files", snap, status({ files: { ...baseFiles, fingerprint: "zzz" } }), []),
      true,
    );
    assert.equal(
      isDomainStale("files", snap, status({ files: { ...baseFiles, missing: true, fingerprint: null } }), []),
      true,
    );
    assert.equal(
      isDomainStale("files", snap, status({ files: { ...baseFiles, path: "docs" } }), []),
      true,
    );
    assert.equal(isDomainStale("files", snap, status(), []), false);
  });

  it("should not toast when a missing folder stays missing", () => {
    const missing = {
      enabled: true,
      ready: true,
      path: "gone",
      fingerprint: null,
      missing: true,
    };
    const snap = status({ files: missing });
    assert.equal(isDomainStale("files", snap, status({ files: missing }), []), false);
    assert.equal(
      isDomainStale("files", snap, status({ files: { ...missing, path: "other" } }), []),
      true,
    );
    assert.equal(
      isDomainStale("files", snap, status({ files: { ...baseFiles, missing: false } }), []),
      true,
    );
  });

  it("should skip the admin tab", () => {
    const snap = status();
    const next = status({
      calendars: [{ instanceId: 12, calendarId: 4, synctoken: 999, components: "VEVENT,VTODO" }],
    });
    assert.equal(isDomainStale("admin", snap, next, [12]), false);
  });
});

describe("shouldShowStaleToast", () => {
  it("should skip while compound busy", () => {
    assert.equal(shouldShowStaleToast({ staleToastId: null, stale: true, busy: true }), false);
  });

  it("should skip when a stale toast id is already held", () => {
    assert.equal(shouldShowStaleToast({ staleToastId: 7, stale: true, busy: false }), false);
  });

  it("should show once per stale episode", () => {
    assert.equal(shouldShowStaleToast({ staleToastId: null, stale: true, busy: false }), true);
    assert.equal(shouldShowStaleToast({ staleToastId: null, stale: false, busy: false }), false);
  });

  it("should allow a new toast when the held id is no longer visible", () => {
    assert.equal(
      shouldShowStaleToast({ staleToastId: 7, stale: true, busy: false, toastVisible: false }),
      true,
    );
    assert.equal(
      shouldShowStaleToast({ staleToastId: 7, stale: true, busy: false, toastVisible: true }),
      false,
    );
  });
});

describe("isCompoundBusy", () => {
  it("should be true when busy, import, files upload, or refresh confirm is set", () => {
    const base = { busy: false, importProgress: null, filesUploadProgress: null };
    assert.equal(isCompoundBusy(base), false);
    assert.equal(isCompoundBusy({ ...base, busy: true }), true);
    assert.equal(isCompoundBusy({ ...base, importProgress: { phase: "processing" } }), true);
    assert.equal(isCompoundBusy({ ...base, filesUploadProgress: { phase: "uploading" } }), true);
    assert.equal(isCompoundBusy({ ...base, confirmRefresh: true }), true);
  });
});

describe("hasOpenEditor", () => {
  const closed = {
    editingNote: null,
    editingTask: null,
    editingEvent: null,
    editingContact: null,
    filesRenamePath: null,
  };

  it("should treat mkdir, transfer, calendar, and address-book modals as unsaved UI", () => {
    assert.equal(hasOpenEditor(closed), false);
    assert.equal(hasOpenEditor({ ...closed, filesMkdirOpen: true }), true);
    assert.equal(hasOpenEditor({ ...closed, filesTransfer: { op: "copy", paths: ["a"] } }), true);
    assert.equal(hasOpenEditor({ ...closed, filesDeletePaths: ["a"] }), true);
    assert.equal(hasOpenEditor({ ...closed, filesPreview: { path: "a" } }), true);
    assert.equal(hasOpenEditor({ ...closed, calModalOpen: true }), true);
    assert.equal(hasOpenEditor({ ...closed, createCalModalOpen: true }), true);
    assert.equal(hasOpenEditor({ ...closed, abModalOpen: true }), true);
  });
});

describe("domainNoun", () => {
  it("should use events for the calendars tab", () => {
    assert.equal(domainNoun("calendars"), "events");
    assert.equal(domainNoun("notes"), "notes");
    assert.equal(domainNoun("files"), "files");
  });
});
