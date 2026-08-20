import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { TaskItem } from "../../api.ts";
import { DEFAULT_TASK_FILTERS, filterTasks, taskMatchesFilters } from "./listing.ts";

function task(over: Partial<TaskItem> & Pick<TaskItem, "uri">): TaskItem {
  return {
    instanceId: 1,
    calendarId: 1,
    calendarName: "Work",
    calendarUri: "work",
    uid: over.uri,
    parentUid: null,
    summary: "t",
    description: "",
    status: "NEEDS-ACTION",
    due: null,
    priority: 0,
    percent: 0,
    completed: null,
    lastmodified: 0,
    readOnly: false,
    canWrite: true,
    ...over,
  };
}

describe("task column filters", () => {
  const now = new Date(2026, 7, 20, 12, 0, 0);
  const open = task({ uri: "a", status: "NEEDS-ACTION" });
  const done = task({ uri: "b", status: "COMPLETED", percent: 100 });
  const cancelled = task({ uri: "c", status: "CANCELLED" });

  it("default open hides completed", () => {
    const listed = filterTasks([open, done, cancelled], DEFAULT_TASK_FILTERS, now);
    assert.deepEqual(
      listed.map((t) => t.uri),
      ["a", "c"],
    );
  });

  it("status Done shows only completed", () => {
    const listed = filterTasks([open, done], { ...DEFAULT_TASK_FILTERS, status: "COMPLETED" }, now);
    assert.equal(listed.length, 1);
    assert.equal(listed[0].uri, "b");
  });

  it("due today", () => {
    const due = task({ uri: "d", due: "2026-08-20T15:00:00" });
    assert.equal(taskMatchesFilters(due, { ...DEFAULT_TASK_FILTERS, due: "today" }, now), true);
    assert.equal(taskMatchesFilters(open, { ...DEFAULT_TASK_FILTERS, due: "today" }, now), false);
  });

  it("percent partial", () => {
    const mid = task({ uri: "e", percent: 40 });
    assert.equal(taskMatchesFilters(mid, { ...DEFAULT_TASK_FILTERS, percent: "partial" }, now), true);
    assert.equal(taskMatchesFilters(open, { ...DEFAULT_TASK_FILTERS, percent: "partial" }, now), false);
  });
});
