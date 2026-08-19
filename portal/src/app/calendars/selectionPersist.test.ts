import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseCalendarView } from "./selectionPersist.ts";

describe("parseCalendarView", () => {
  it("accepts month, week, and agenda", () => {
    assert.equal(parseCalendarView("month"), "month");
    assert.equal(parseCalendarView("week"), "week");
    assert.equal(parseCalendarView("agenda"), "agenda");
  });

  it("rejects unknown values", () => {
    assert.equal(parseCalendarView("day"), null);
    assert.equal(parseCalendarView(""), null);
    assert.equal(parseCalendarView(1), null);
  });
});
