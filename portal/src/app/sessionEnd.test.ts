import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DATA_RESTORE_SIGN_IN, signInMessageFor401 } from "./sessionEnd.ts";

describe("signInMessageFor401", () => {
  it("should keep the data-restore sign-in sentence", () => {
    assert.equal(signInMessageFor401(DATA_RESTORE_SIGN_IN), DATA_RESTORE_SIGN_IN);
  });

  it("should keep an idle-timeout sentence", () => {
    const message = "Session timed out. Please sign in again.";
    assert.equal(signInMessageFor401(message), message);
  });

  it("should replace other 401 text with the idle sentence", () => {
    assert.equal(
      signInMessageFor401("Not authenticated"),
      "Your session timed out. Please sign in again.",
    );
  });
});
