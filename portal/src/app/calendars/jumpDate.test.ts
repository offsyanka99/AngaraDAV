import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { localeDowLabels } from "../datetime.ts";
import { applyCalendarJump, calendarJumpHtml } from "./jumpDate.ts";

const base = {
  busy: false,
  focusDay: "2026-03-15",
  viewY: 2026,
  viewM: 2,
  timeFormat: "24h" as const,
};

describe("calendarJumpHtml", () => {
  it("should show a closed Jump to date button", () => {
    const html = calendarJumpHtml({ ...base, open: false, weekStart: "monday" });
    assert.match(html, /Jump to date/);
    assert.match(html, /data-action="dt-open"/);
    assert.match(html, /data-dt-field="cal-jump"/);
    assert.match(html, /data-dt-date-only="1"/);
    assert.match(html, /aria-expanded="false"/);
    assert.equal(html.includes("dt-popover"), false);
  });

  it("should open a date calendar that starts on the configured week day", () => {
    const monday = calendarJumpHtml({ ...base, open: true, weekStart: "monday" });
    const sunday = calendarJumpHtml({ ...base, open: true, weekStart: "sunday" });
    const mondayDow = monday.match(/class="dt-dow">([^<]+)/)?.[1];
    const sundayDow = sunday.match(/class="dt-dow">([^<]+)/)?.[1];
    assert.equal(mondayDow, localeDowLabels("monday")[0]);
    assert.equal(sundayDow, localeDowLabels("sunday")[0]);
    assert.notEqual(mondayDow, sundayDow);
    assert.match(monday, /class="dt-popover"/);
    assert.match(monday, /data-day="2026-03-15"/);
    assert.match(monday, /is-selected/);
    assert.match(monday, /data-dt-clear="0"/);
    assert.equal(monday.includes('data-action="dt-clear"'), false);
    assert.equal(monday.includes(">Clear<"), false);
    assert.match(monday, />Today</);
  });

  it("should disable the button while the calendar is busy", () => {
    const html = calendarJumpHtml({ ...base, busy: true, open: false, weekStart: "auto" });
    assert.match(html, /cal-jump-btn[^>]*disabled/);
  });
});

describe("applyCalendarJump", () => {
  it("should move month, week, and agenda focus to the chosen day", () => {
    const state = {
      calFocusDay: "2026-03-15",
      monthCursor: { y: 2026, m: 2 },
      monthExpandDay: "2026-03-15",
    };
    assert.equal(applyCalendarJump(state, "2024-11-02"), true);
    assert.equal(state.calFocusDay, "2024-11-02");
    assert.deepEqual(state.monthCursor, { y: 2024, m: 10 });
    assert.equal(state.monthExpandDay, null);
  });

  it("should refuse a value that is not a calendar day", () => {
    const state = {
      calFocusDay: "2026-03-15",
      monthCursor: { y: 2026, m: 2 },
      monthExpandDay: null,
    };
    assert.equal(applyCalendarJump(state, "March"), false);
    assert.equal(state.calFocusDay, "2026-03-15");
  });
});
