import assert from "node:assert/strict";
import { test } from "node:test";
import { canEnableFilesPush, syncFilesPushToggle } from "./filesPushToggle.ts";

function fakeForm(push: boolean, files: boolean, withHint = true) {
  const els: Record<string, { checked: boolean; disabled: boolean } | { hidden: boolean }> = {
    'input[name="push_enabled"]': { checked: push, disabled: false },
    'input[name="files_enabled"]': { checked: files, disabled: false },
    'input[name="push_files_enabled"]': { checked: true, disabled: false },
  };
  if (withHint) {
    els["[data-files-push-hint]"] = { hidden: false };
  }
  return {
    els,
    querySelector: (selector: string) => els[selector] ?? null,
  };
}

test("canEnableFilesPush", async (t) => {
  await t.test("only when Push and file storage are both on", () => {
    assert.equal(canEnableFilesPush(true, true), true);
    assert.equal(canEnableFilesPush(true, false), false);
    assert.equal(canEnableFilesPush(false, true), false);
    assert.equal(canEnableFilesPush(false, false), false);
  });
});

test("syncFilesPushToggle", async (t) => {
  await t.test("disables the checkbox and shows the hint while a dependency is off", () => {
    for (const [push, files] of [
      [false, true],
      [true, false],
      [false, false],
    ]) {
      const form = fakeForm(push, files);
      syncFilesPushToggle(form);
      assert.equal((form.els['input[name="push_files_enabled"]'] as { disabled: boolean }).disabled, true);
      assert.equal((form.els["[data-files-push-hint]"] as { hidden: boolean }).hidden, false);
    }
  });

  await t.test("enables the checkbox and hides the hint when both are on", () => {
    const form = fakeForm(true, true);
    syncFilesPushToggle(form);
    assert.equal((form.els['input[name="push_files_enabled"]'] as { disabled: boolean }).disabled, false);
    assert.equal((form.els["[data-files-push-hint]"] as { hidden: boolean }).hidden, true);
  });

  await t.test("keeps the stored checked state", () => {
    const form = fakeForm(false, true);
    syncFilesPushToggle(form);
    assert.equal((form.els['input[name="push_files_enabled"]'] as { checked: boolean }).checked, true);
  });

  await t.test("tolerates a missing hint and a form without the checkboxes", () => {
    const form = fakeForm(true, true, false);
    syncFilesPushToggle(form);
    assert.equal((form.els['input[name="push_files_enabled"]'] as { disabled: boolean }).disabled, false);
    assert.doesNotThrow(() => syncFilesPushToggle({ querySelector: () => null }));
  });
});
