import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseTheme } from "./theme.ts";

describe("parseTheme", () => {
  it("accepts dark and light", () => {
    assert.equal(parseTheme("dark"), "dark");
    assert.equal(parseTheme("light"), "light");
  });

  it("rejects other values", () => {
    assert.equal(parseTheme("auto"), null);
    assert.equal(parseTheme(""), null);
    assert.equal(parseTheme(null), null);
  });
});
