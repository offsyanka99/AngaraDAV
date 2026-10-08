import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatUnixDateTime, isoWeekNumber, isoWeekNumberForRow, workWeekRange, ymd } from "./datetime.ts";

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

describe("workWeekRange", () => {
  it("keeps Monday through Friday of a Monday-start week", () => {
    const range = workWeekRange(new Date(2026, 9, 8), 1);
    assert.deepEqual(range.days.map(ymd), [
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
    ]);
    assert.equal(range.from, "2026-10-05");
    assert.equal(range.to, "2026-10-09");
  });

  it("hides the Sunday and Saturday of a Sunday-start week", () => {
    const range = workWeekRange(new Date(2026, 9, 8), 0);
    assert.deepEqual(range.days.map(ymd), [
      "2026-10-05",
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
    ]);
    assert.ok(range.days.every((d) => d.getDay() >= 1 && d.getDay() <= 5));
  });

  it("uses the week that contains a weekend focus day", () => {
    const saturday = workWeekRange(new Date(2026, 9, 10), 1);
    assert.equal(saturday.from, "2026-10-05");
    assert.equal(saturday.to, "2026-10-09");
    const sunday = workWeekRange(new Date(2026, 9, 11), 0);
    assert.equal(sunday.from, "2026-10-12");
    assert.equal(sunday.to, "2026-10-16");
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
