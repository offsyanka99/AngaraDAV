import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatUnixDateTime, isoWeekNumber, isoWeekNumberForRow } from "./datetime.ts";

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

describe("formatUnixDateTime", () => {
  const ts = Math.floor(new Date(2026, 0, 15, 15, 4, 0).getTime() / 1000);

  it("uses a 12-hour clock when System settings ask for it", () => {
    const formatted = formatUnixDateTime(ts, "12h");
    assert.match(formatted, /3:04/);
    assert.match(formatted, /PM|pm|午後/);
    assert.doesNotMatch(formatted, /15:04/);
  });

  it("uses a 24-hour clock when System settings ask for it", () => {
    const formatted = formatUnixDateTime(ts, "24h");
    assert.match(formatted, /15:04/);
    assert.doesNotMatch(formatted, /PM|pm/);
  });

  it("returns a dash for an empty timestamp", () => {
    assert.equal(formatUnixDateTime(0, "24h"), "—");
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
