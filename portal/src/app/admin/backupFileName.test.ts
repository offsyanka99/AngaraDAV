import assert from "node:assert/strict";
import { test } from "node:test";
import { backupFileName } from "./backupFileName.ts";

test("backupFileName", async (t) => {
  await t.test("includes product version and a filesystem-safe timestamp", () => {
    const name = backupFileName({ productVersion: "2.4.4", createdAt: "2026-08-31T12:00:00Z" });
    assert.equal(name, "angaradav-settings-backup-2.4.4-2026-08-31T12-00-00Z.json");
  });

  await t.test("omits the version segment when absent", () => {
    const name = backupFileName({ createdAt: "2026-08-31T12:00:00Z" });
    assert.equal(name, "angaradav-settings-backup-2026-08-31T12-00-00Z.json");
  });
});
