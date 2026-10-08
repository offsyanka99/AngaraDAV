import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldShowStaleNotification } from "./staleNotification.ts";

const granted = {
  enabled: true,
  permission: "granted",
  visible: true,
  focused: false,
};

describe("shouldShowStaleNotification", () => {
  it("notifies only when enabled, allowed, visible, and unfocused", () => {
    assert.equal(shouldShowStaleNotification(granted), true);
  });

  it("stays quiet while the window is focused or the tab is hidden", () => {
    assert.equal(shouldShowStaleNotification({ ...granted, focused: true }), false);
    assert.equal(shouldShowStaleNotification({ ...granted, visible: false }), false);
  });

  it("stays quiet until the user turns it on and the browser allows it", () => {
    assert.equal(shouldShowStaleNotification({ ...granted, enabled: false }), false);
    assert.equal(shouldShowStaleNotification({ ...granted, permission: "default" }), false);
    assert.equal(shouldShowStaleNotification({ ...granted, permission: "denied" }), false);
  });
});
