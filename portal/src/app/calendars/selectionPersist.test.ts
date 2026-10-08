import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isWeekGridView, parseCalendarView } from "./selectionPersist.ts";

describe("parseCalendarView", () => {
  it("accepts month, week, work week, and agenda", () => {
    assert.equal(parseCalendarView("month"), "month");
    assert.equal(parseCalendarView("week"), "week");
    assert.equal(parseCalendarView("workweek"), "workweek");
    assert.equal(parseCalendarView("agenda"), "agenda");
  });

  it("rejects unknown values", () => {
    assert.equal(parseCalendarView("day"), null);
    assert.equal(parseCalendarView(""), null);
    assert.equal(parseCalendarView(1), null);
  });
});

describe("isWeekGridView", () => {
  it("treats week and work week as the timed grid", () => {
    assert.equal(isWeekGridView("week"), true);
    assert.equal(isWeekGridView("workweek"), true);
    assert.equal(isWeekGridView("month"), false);
    assert.equal(isWeekGridView("agenda"), false);
  });
});

