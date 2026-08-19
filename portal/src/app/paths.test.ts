import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { basenamePath, joinStoragePath } from "./paths.ts";

describe("joinStoragePath", () => {
  it("joins segments without leading or trailing slashes", () => {
    assert.equal(joinStoragePath("docs", "a.txt"), "docs/a.txt");
    assert.equal(joinStoragePath("/docs/", "/a.txt/"), "docs/a.txt");
  });

  it("skips empty parts", () => {
    assert.equal(joinStoragePath("", "docs", "", "x"), "docs/x");
  });
});

describe("basenamePath", () => {
  it("returns the last path segment", () => {
    assert.equal(basenamePath("docs/a.txt"), "a.txt");
    assert.equal(basenamePath("a.txt"), "a.txt");
  });
});
