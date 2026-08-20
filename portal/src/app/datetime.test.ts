import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isoWeekNumber, isoWeekNumberForRow } from "./datetime.ts";

describe("isoWeekNumber", () => {
  it("uses ISO-8601 (week 1 contains 4 Jan)", () => {
    assert.equal(isoWeekNumber(new Date(2026, 0, 1)), 1);
    assert.equal(isoWeekNumber(new Date(2026, 0, 4)), 1);
    assert.equal(isoWeekNumber(new Date(2026, 0, 5)), 2);
  });

  it("numbers a mid-year Monday correctly", () => {
    assert.equal(isoWeekNumber(new Date(2026, 7, 17)), 34);
  });
});

describe("isoWeekNumberForRow", () => {
  it("uses the Thursday of a Sunday-start row", () => {
    // Sun 16 Aug 2026 … Thu 20 Aug 2026 → ISO week 34
    assert.equal(isoWeekNumberForRow(new Date(2026, 7, 16), 0), 34);
  });

  it("uses the Thursday of a Monday-start row", () => {
    assert.equal(isoWeekNumberForRow(new Date(2026, 7, 17), 1), 34);
  });
});
