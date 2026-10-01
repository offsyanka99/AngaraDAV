import assert from "node:assert/strict";
import { test } from "node:test";
import { formatQueueAge, pushStatsRows } from "./pushStats.ts";

test("formatQueueAge", async (t) => {
  await t.test("seconds below a minute", () => {
    assert.equal(formatQueueAge(0), "0 s");
    assert.equal(formatQueueAge(59.9), "59 s");
  });

  await t.test("minutes below an hour", () => {
    assert.equal(formatQueueAge(60), "1 min");
    assert.equal(formatQueueAge(3599), "59 min");
  });

  await t.test("hours with optional minutes", () => {
    assert.equal(formatQueueAge(3600), "1 h");
    assert.equal(formatQueueAge(7500), "2 h 5 min");
  });

  await t.test("negative input clamps to zero", () => {
    assert.equal(formatQueueAge(-5), "0 s");
  });
});

test("pushStatsRows", async (t) => {
  const stats = {
    subscriptions: { calendars: 4, addressbooks: 2, files: 3, principals: 1 },
    queue: { jobs: 2, oldestAgeSeconds: 90 },
  };

  await t.test("lists subscriptions per kind and the queue backlog", () => {
    assert.deepEqual(pushStatsRows(stats), [
      ["Calendar subscriptions", "4"],
      ["Address book subscriptions", "2"],
      ["File folder subscriptions", "3"],
      ["Principal subscriptions", "1"],
      ["Queued notifications", "2"],
      ["Oldest queued", "1 min"],
    ]);
  });

  await t.test("shows a dash for the oldest age when the queue is empty", () => {
    const rows = pushStatsRows({ ...stats, queue: { jobs: 0, oldestAgeSeconds: 0 } });
    assert.deepEqual(rows[rows.length - 1], ["Oldest queued", "—"]);
  });
});
