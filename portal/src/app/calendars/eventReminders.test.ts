import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { REMINDER_SEEN_STORAGE_KEY } from "../constants.ts";
import {
  dueReminders,
  isReminderDue,
  MAX_REMINDER_TOASTS,
  MAX_SEEN_REMINDERS,
  occurrenceBounds,
  pickReminderKeys,
  readSeenKeys,
  reminderInstanceId,
  reminderKey,
  reminderKeysToDismiss,
  reminderMessage,
  reminderWindow,
  writeSeenKeys,
  type ReminderOccurrence,
} from "./eventReminders.ts";

function localIso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

function occ(over: Partial<ReminderOccurrence> = {}): ReminderOccurrence {
  const start = new Date(2030, 5, 2, 15, 0, 0);
  const end = new Date(2030, 5, 2, 15, 30, 0);
  return {
    instanceId: 10,
    uri: "standup.ics",
    summary: "Standup",
    start: localIso(start),
    end: localIso(end),
    allDay: false,
    reminderMinutes: 15,
    ...over,
  };
}

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = { ...initial };
  return {
    get length() {
      return Object.keys(data).length;
    },
    clear: () => {
      for (const key of Object.keys(data)) delete data[key];
    },
    getItem: (key: string) => (key in data ? data[key] : null),
    key: (index: number) => Object.keys(data)[index] ?? null,
    removeItem: (key: string) => {
      delete data[key];
    },
    setItem: (key: string, value: string) => {
      data[key] = value;
    },
  };
}

describe("isReminderDue", () => {
  it("is due from the fire time until the event ends", () => {
    const event = occ();
    assert.equal(isReminderDue(event, new Date(2030, 5, 2, 14, 44, 0)), false);
    assert.equal(isReminderDue(event, new Date(2030, 5, 2, 14, 45, 0)), true);
    assert.equal(isReminderDue(event, new Date(2030, 5, 2, 15, 10, 0)), true);
    assert.equal(isReminderDue(event, new Date(2030, 5, 2, 15, 30, 0)), false);
  });

  it("treats a missing timed end as one hour", () => {
    const event = occ({ end: null, reminderMinutes: 0 });
    assert.equal(isReminderDue(event, new Date(2030, 5, 2, 15, 59, 0)), true);
    assert.equal(isReminderDue(event, new Date(2030, 5, 2, 16, 0, 0)), false);
  });

  it("fires an all-day reminder at local midnight and ends after the inclusive last day", () => {
    const event = occ({
      allDay: true,
      start: "2030-06-02",
      end: "2030-06-04",
      reminderMinutes: 0,
    });
    assert.equal(isReminderDue(event, new Date(2030, 5, 1, 23, 59, 0)), false);
    assert.equal(isReminderDue(event, new Date(2030, 5, 2, 0, 0, 0)), true);
    assert.equal(isReminderDue(event, new Date(2030, 5, 4, 23, 0, 0)), true);
    assert.equal(isReminderDue(event, new Date(2030, 5, 5, 0, 0, 0)), false);
  });

  it("fires a one-week all-day reminder seven local days before the start", () => {
    const event = occ({
      allDay: true,
      start: "2030-06-09",
      end: "2030-06-09",
      reminderMinutes: 10080,
    });
    assert.equal(isReminderDue(event, new Date(2030, 5, 1, 23, 59, 0)), false);
    assert.equal(isReminderDue(event, new Date(2030, 5, 2, 0, 0, 0)), true);
  });

  it("skips none, custom, and minutes outside the presets", () => {
    const now = new Date(2030, 5, 2, 14, 50, 0);
    assert.equal(isReminderDue(occ({ reminderMinutes: null }), now), false);
    assert.equal(isReminderDue(occ({ reminderMinutes: 10 }), now), false);
    assert.equal(isReminderDue(occ({ uri: "" }), now), false);
  });
});

describe("reminderMessage", () => {
  it("names the start before it, and says the event has started after", () => {
    const event = occ();
    const sameDay = reminderMessage(event, new Date(2030, 5, 2, 14, 50, 0), "12h");
    assert.match(sameDay, /^Standup starts at /);
    assert.match(sameDay, /3:00/);
    assert.match(sameDay, /PM|pm/);
    const otherDay = reminderMessage(event, new Date(2030, 5, 1, 9, 0, 0), "12h");
    assert.match(otherDay, /^Standup starts Jun 2 at /);
    assert.match(otherDay, /3:00/);
    assert.match(otherDay, /PM|pm/);
    assert.equal(reminderMessage(event, new Date(2030, 5, 2, 15, 5, 0), "12h"), "Standup has started");
    const half = reminderMessage(
      occ({ start: localIso(new Date(2030, 5, 2, 15, 30, 0)) }),
      new Date(2030, 5, 2, 14, 0, 0),
      "12h",
    );
    assert.match(half, /^Standup starts at /);
    assert.match(half, /3:30/);
    assert.match(half, /PM|pm/);
  });

  it("uses the System settings clock, including a 24-hour setting saved after the event", () => {
    const event = occ();
    const afternoon = reminderMessage(event, new Date(2030, 5, 2, 14, 50, 0), "24h");
    assert.match(afternoon, /^Standup starts at /);
    assert.match(afternoon, /15:00/);
    assert.doesNotMatch(afternoon, /AM|PM|am|pm/);
    const afterMidnight = occ({ start: localIso(new Date(2030, 5, 2, 0, 30, 0)) });
    const early = reminderMessage(afterMidnight, new Date(2030, 5, 2, 0, 0, 0), "24h");
    assert.match(early, /^Standup starts at /);
    assert.match(early, /00:30/);
    assert.doesNotMatch(early, /AM|PM|am|pm/);
    const early12 = reminderMessage(afterMidnight, new Date(2030, 5, 2, 0, 0, 0), "12h");
    assert.match(early12, /12:30/);
    assert.match(early12, /AM|am/);
  });

  it("uses today, tomorrow, or a date for all-day events", () => {
    const event = occ({ allDay: true, start: "2030-06-02", end: "2030-06-02", summary: "Offsite" });
    assert.equal(reminderMessage(event, new Date(2030, 5, 1, 12, 0, 0), "24h"), "Offsite starts tomorrow");
    assert.equal(reminderMessage(event, new Date(2030, 5, 2, 8, 0, 0), "24h"), "Offsite has started");
    const later = occ({ allDay: true, start: "2030-06-04", end: "2030-06-04", summary: "  " });
    assert.equal(reminderMessage(later, new Date(2030, 5, 1, 12, 0, 0), "24h"), "Event starts Jun 4");
    const untitled = reminderMessage(occ({ summary: "(No title)" }), new Date(2030, 5, 2, 14, 50, 0), "12h");
    assert.match(untitled, /^Event starts at /);
    assert.match(untitled, /3:00/);
    assert.match(untitled, /PM|pm/);
  });
});

describe("reminder selection", () => {
  it("scans seven days either side of today", () => {
    assert.deepEqual(reminderWindow(new Date(2030, 5, 15, 18, 0, 0)), {
      from: "2030-06-08",
      to: "2030-06-22",
    });
  });

  it("changes the key when the reminder minutes change", () => {
    const event = occ();
    assert.notEqual(
      reminderKey("alice", event.instanceId, event.uri, event.start, 15),
      reminderKey("alice", event.instanceId, event.uri, event.start, 30),
    );
    assert.equal(
      reminderInstanceId(reminderKey("alice", 10, event.uri, event.start, 15)),
      10,
    );
  });

  it("skips seen reminders and orders by fire time", () => {
    const early = occ({ uri: "early.ics", summary: "Early", reminderMinutes: 30 });
    const late = occ({ uri: "late.ics", summary: "Late", reminderMinutes: 5 });
    const seen = new Set([reminderKey("alice", early.instanceId, early.uri, early.start, 30)]);
    const now = new Date(2030, 5, 2, 15, 0, 0);
    const due = dueReminders([late, early], now, seen, "alice");
    assert.deepEqual(
      due.map((item) => item.uri),
      ["late.ics"],
    );
    const both = dueReminders([late, early], now, new Set(), "alice");
    assert.deepEqual(
      both.map((item) => item.uri),
      ["early.ics", "late.ics"],
    );
  });

  it("fills only the free reminder slots", () => {
    const keys = ["a", "b", "c", "d", "e"];
    assert.deepEqual(pickReminderKeys(keys, new Set(["b"]), MAX_REMINDER_TOASTS), ["a", "c", "d"]);
    assert.deepEqual(pickReminderKeys(keys, new Set(["a", "b", "c", "d"]), MAX_REMINDER_TOASTS), []);
  });

  it("keeps a toast when that calendar failed to load", () => {
    const key = reminderKey("alice", 10, "standup.ics", "2030-06-02T15:00:00", 15);
    const other = reminderKey("alice", 11, "other.ics", "2030-06-02T15:00:00", 15);
    assert.deepEqual(
      reminderKeysToDismiss([key, other], new Set(), new Set([11]), new Set([10, 11])),
      [other],
    );
    assert.deepEqual(
      reminderKeysToDismiss([key], new Set(), new Set([10]), new Set()),
      [key],
    );
  });
});

describe("seen reminders", () => {
  it("keeps the newest keys and ignores a bad payload", () => {
    const storage = memoryStorage();
    assert.deepEqual(readSeenKeys(storage), []);
    const written = writeSeenKeys(
      storage,
      Array.from({ length: MAX_SEEN_REMINDERS + 5 }, (_, i) => `k${i}`),
    );
    assert.equal(written.length, MAX_SEEN_REMINDERS);
    assert.equal(written[0], "k5");
    assert.deepEqual(readSeenKeys(storage), written);
    assert.equal(storage.getItem(REMINDER_SEEN_STORAGE_KEY)?.includes("k5"), true);
    storage.setItem(REMINDER_SEEN_STORAGE_KEY, "{");
    assert.deepEqual(readSeenKeys(storage), []);
    storage.setItem(REMINDER_SEEN_STORAGE_KEY, JSON.stringify(["ok", 4, ""]));
    assert.deepEqual(readSeenKeys(storage), ["ok"]);
  });
});

describe("occurrenceBounds", () => {
  it("uses local midnight for an all-day start", () => {
    const bounds = occurrenceBounds({ start: "2030-06-02", end: "2030-06-02", allDay: true });
    assert.ok(bounds);
    assert.equal(bounds.startMs, new Date(2030, 5, 2).getTime());
    assert.equal(bounds.endMs, new Date(2030, 5, 3).getTime());
  });
});
