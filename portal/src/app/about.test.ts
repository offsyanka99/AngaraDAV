import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { splitAppVersion } from "./constants.ts";

describe("splitAppVersion", () => {
  it("splits base version and build metadata", () => {
    assert.deepEqual(splitAppVersion("2.3.1+0cf73b7"), { version: "2.3.1", build: "0cf73b7" });
  });

  it("returns the whole string when there is no build", () => {
    assert.deepEqual(splitAppVersion("2.3.1"), { version: "2.3.1", build: "" });
  });
});
