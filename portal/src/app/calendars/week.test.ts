import assert from "node:assert/strict";
import { describe, it } from "node:test";
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
