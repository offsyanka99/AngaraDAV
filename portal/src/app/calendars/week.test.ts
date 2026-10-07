import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CalendarEvent, NoteItem, TaskItem } from "../../api.ts";
import { agendaHits } from "./agendaItems.ts";
import { reminderFromForm, reminderPayload } from "./reminder.ts";
import { WEEK_HOUR_PX, weekScrollTopForDayStart } from "./weekScroll.ts";

describe("weekScrollTopForDayStart", () => {
  it("scrolls to one hour before day start", () => {
    assert.equal(weekScrollTopForDayStart(6), 5 * WEEK_HOUR_PX);
    assert.equal(weekScrollTopForDayStart(8), 7 * WEEK_HOUR_PX);
  });

  it("clamps at midnight and end of day", () => {
    assert.equal(weekScrollTopForDayStart(0), 0);
    assert.equal(weekScrollTopForDayStart(1), 0);
    assert.equal(weekScrollTopForDayStart(24), 23 * WEEK_HOUR_PX);
  });
});

const RANGE = { from: "2030-06-01", to: "2030-07-05" };

function task(over: Partial<TaskItem> & Pick<TaskItem, "uri">): TaskItem {
  return {
    instanceId: 1,
    calendarId: 1,
    calendarName: "Work",
    calendarUri: "work",
    uid: over.uri,
    parentUid: null,
    summary: "Task",
    description: "",
    status: "NEEDS-ACTION",
    due: "2030-06-02",
    priority: 0,
    percent: 0,
    completed: null,
    hasRrule: false,
    repeat: { freq: "", interval: 1, until: null, count: null, byDay: [] },
    lastmodified: 0,
    readOnly: false,
    canWrite: true,
    ...over,
  };
}

function note(over: Partial<NoteItem> & Pick<NoteItem, "uri">): NoteItem {
  return {
    instanceId: 1,
    calendarId: 1,
    calendarName: "Work",
    calendarUri: "work",
    summary: "Note",
    description: "",
    dtstart: "2030-06-02",
    lastmodified: 0,
    readOnly: false,
    canWrite: true,
    ...over,
  };
}

function event(
  over: Partial<CalendarEvent> & Pick<CalendarEvent, "uri" | "start">,
): CalendarEvent & { instanceId: number } {
  return {
    instanceId: 1,
    uid: over.uri,
    summary: "Event",
    end: null,
    allDay: false,
    reminderMinutes: null,
    ...over,
  };
}

describe("agendaHits", () => {
  const base = {
    events: [] as Array<CalendarEvent & { instanceId: number }>,
    tasks: [] as TaskItem[],
    notes: [] as NoteItem[],
    selectedIds: [1],
    ...RANGE,
    search: "",
    includeTasks: true,
    includeNotes: true,
  };

  it("includes an open task on its date-only due date", () => {
    const hits = agendaHits({
      ...base,
      tasks: [task({ uri: "t1", summary: "Pay rent", due: "2030-06-02" })],
    });
    assert.equal(hits.length, 1);
    assert.equal(hits[0]?.kind, "task");
    assert.equal(hits[0]?.day, "2030-06-02");
  });

  it("keeps one row for a repeating task on the stored due date", () => {
    const hits = agendaHits({
      ...base,
      tasks: [
        task({
          uri: "series",
          summary: "Weekly",
          due: "2030-06-02T09:00:00",
          hasRrule: true,
          repeat: { freq: "WEEKLY", interval: 1, until: null, count: null, byDay: ["MO"] },
        }),
      ],
    });
    assert.equal(hits.length, 1);
    assert.equal(hits[0]?.day, "2030-06-02");
  });

  it("excludes completed and cancelled tasks", () => {
    const hits = agendaHits({
      ...base,
      tasks: [
        task({ uri: "done", status: "COMPLETED" }),
        task({ uri: "cancelled", status: "CANCELLED" }),
      ],
    });
    assert.equal(hits.length, 0);
  });

  it("excludes a task or note on an unchecked calendar", () => {
    const hits = agendaHits({
      ...base,
      tasks: [task({ uri: "other", instanceId: 2 })],
      notes: [note({ uri: "other-note", instanceId: 2, summary: "Elsewhere" })],
    });
    assert.equal(hits.length, 0);
  });

  it("excludes a note without a date and includes one with a date", () => {
    const hits = agendaHits({
      ...base,
      notes: [
        note({ uri: "undated", dtstart: null, summary: "Scratch" }),
        note({ uri: "dated", dtstart: "2030-06-03", summary: "Dentist" }),
      ],
    });
    assert.equal(hits.length, 1);
    assert.equal(hits[0]?.kind, "note");
    assert.equal(hits[0]?.day, "2030-06-03");
  });

  it("filters events, tasks, and notes by summary", () => {
    const hits = agendaHits({
      ...base,
      events: [event({ uri: "e1", summary: "Standup", start: "2030-06-02T15:00:00" })],
      tasks: [task({ uri: "t1", summary: "Pay rent" })],
      notes: [note({ uri: "n1", summary: "Dentist" })],
      search: "rent",
    });
    assert.equal(hits.length, 1);
    assert.equal(hits[0]?.kind, "task");
  });

  it("sorts an untimed item before a timed item on the same day", () => {
    const hits = agendaHits({
      ...base,
      events: [event({ uri: "e1", summary: "Standup", start: "2030-06-02T15:00:00" })],
      tasks: [task({ uri: "t1", summary: "Pay rent", due: "2030-06-02" })],
    });
    assert.deepEqual(
      hits.map((hit) => hit.kind),
      ["task", "event"],
    );
    assert.equal(hits[0]?.sort, -1);
    assert.ok((hits[1]?.sort ?? 0) > 0);
  });
});

describe("reminderFromForm", () => {
  it("reads none, keep, and a preset", () => {
    const none = new FormData();
    none.set("reminder", "");
    assert.deepEqual(reminderFromForm(none), { reminderMinutes: null, reminderCustom: false });
    assert.equal(reminderPayload(none), null);

    const keep = new FormData();
    keep.set("reminder", "keep");
    assert.deepEqual(reminderFromForm(keep), { reminderMinutes: null, reminderCustom: true });
    assert.equal(reminderPayload(keep), "keep");

    const fifteen = new FormData();
    fifteen.set("reminder", "15");
    assert.deepEqual(reminderFromForm(fifteen), { reminderMinutes: 15, reminderCustom: false });
    assert.equal(reminderPayload(fifteen), 15);
  });
});
