import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeUserSettings, parseHour, readUserSettingsFromForm } from "./userSettings.ts";

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

describe("readUserSettingsFromForm", () => {
  it("rejects day end at or before day start", () => {
    const form = { elements: {} } as unknown as HTMLFormElement;
    const orig = FormData;
    class FakeFormData {
      constructor(_form?: unknown) {}
      get(name: string) {
        const v: Record<string, string> = {
          theme: "dark",
          dayStartHour: "12",
          dayEndHour: "12",
        };
        return v[name] ?? null;
      }
    }
    globalThis.FormData = FakeFormData as unknown as typeof FormData;
    try {
      const r = readUserSettingsFromForm(form);
      assert.ok("error" in r);
      if ("error" in r) assert.match(r.error, /after day start/i);
    } finally {
      globalThis.FormData = orig;
    }
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
