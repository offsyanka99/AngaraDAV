import assert from "node:assert/strict";
import { test } from "node:test";
import {
  endpointDisplay,
  subscriptionEmptyMessage,
  subscriptionKindLabel,
} from "./subscriptionsListing.ts";

test("subscriptionKindLabel", () => {
  assert.equal(subscriptionKindLabel("calendars"), "Calendar");
  assert.equal(subscriptionKindLabel("addressbooks"), "Address book");
  assert.equal(subscriptionKindLabel("files"), "File folder");
  assert.equal(subscriptionKindLabel("principals"), "Principal");
  assert.equal(subscriptionKindLabel("other"), "Other");
  assert.equal(subscriptionKindLabel("nope"), "Other");
});

test("endpointDisplay", () => {
  assert.equal(endpointDisplay("fcm.googleapis.com", "ab12cd"), "fcm.googleapis.com …ab12cd");
  assert.equal(endpointDisplay("fcm.googleapis.com", ""), "fcm.googleapis.com");
  assert.equal(endpointDisplay("", "ab12cd"), "…ab12cd");
  assert.equal(endpointDisplay("", ""), "—");
  assert.equal(endpointDisplay("  ", "  "), "—");
});

test("subscriptionEmptyMessage", () => {
  assert.equal(
    subscriptionEmptyMessage({ error: null, showExpired: false }),
    "No active subscriptions.",
  );
  assert.equal(
    subscriptionEmptyMessage({ error: null, showExpired: true }),
    "No subscriptions.",
  );
  assert.equal(
    subscriptionEmptyMessage({ error: "WebDAV-Push is off.", showExpired: false }),
    "WebDAV-Push is off.",
  );
});
