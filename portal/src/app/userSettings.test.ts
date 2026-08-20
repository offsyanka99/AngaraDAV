import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeUserSettings, parseHour } from "./userSettings.ts";

describe("parseHour", () => {
  it("accepts 0–23", () => {
    assert.equal(parseHour(0), 0);
    assert.equal(parseHour("8"), 8);
    assert.equal(parseHour(23), 23);
  });

  it("rejects out of range", () => {
    assert.equal(parseHour(-1), null);
    assert.equal(parseHour(24), null);
    assert.equal(parseHour("x"), null);
  });
});

describe("normalizeUserSettings", () => {
  it("fills defaults", () => {
    const s = normalizeUserSettings({});
    assert.equal(s.theme, "dark");
    assert.equal(s.dayStartHour, 8);
    assert.equal(s.dayEndHour, 18);
    assert.equal(s.showWeekNumbers, false);
  });
});
