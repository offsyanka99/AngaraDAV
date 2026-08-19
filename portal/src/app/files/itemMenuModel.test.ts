import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FileEntry } from "../../api";
import { filesItemMenuModel, selectionAfterOpeningItemMenu } from "./itemMenuModel.ts";

function entry(path: string, type: "file" | "dir"): FileEntry {
  return { name: path.split("/").pop() ?? path, path, type, size: 1, mtime: 0 };
}

describe("selectionAfterOpeningItemMenu", () => {
  it("makes an unselected row the exclusive selection", () => {
    assert.deepEqual(selectionAfterOpeningItemMenu(["a", "b"], "c"), ["c"]);
    assert.deepEqual(selectionAfterOpeningItemMenu([], "notes.txt"), ["notes.txt"]);
  });

  it("keeps the selection when the clicked row is already selected", () => {
    assert.deepEqual(selectionAfterOpeningItemMenu(["a", "b", "c"], "b"), ["a", "b", "c"]);
    assert.deepEqual(selectionAfterOpeningItemMenu(["only"], "only"), ["only"]);
  });

  it("ignores an empty clicked path", () => {
    assert.deepEqual(selectionAfterOpeningItemMenu(["a"], ""), ["a"]);
  });
});

describe("filesItemMenuModel", () => {
  const entries = [
    entry("docs", "dir"),
    entry("docs/a.txt", "file"),
    entry("docs/b.txt", "file"),
    entry("docs/photos", "dir"),
  ];

  it("hides Download for folders only and disables Rename when N>1", () => {
    const m = filesItemMenuModel(entries, ["docs", "docs/photos"]);
    assert.equal(m.count, 2);
    assert.equal(m.heading, "2 items");
    assert.equal(m.showDownload, false);
    assert.deepEqual(m.downloadItems, []);
    assert.equal(m.renameEnabled, false);
    assert.equal(m.renamePath, null);
  });

  it("offers Download for files in a mixed selection", () => {
    const m = filesItemMenuModel(entries, ["docs", "docs/a.txt", "docs/b.txt"]);
    assert.equal(m.count, 3);
    assert.equal(m.heading, "3 items");
    assert.equal(m.showDownload, true);
    assert.deepEqual(
      m.downloadItems.map((d) => d.path),
      ["docs/a.txt", "docs/b.txt"],
    );
    assert.equal(m.renameEnabled, false);
  });

  it("enables Rename for a single item", () => {
    const file = filesItemMenuModel(entries, ["docs/a.txt"]);
    assert.equal(file.count, 1);
    assert.equal(file.heading, null);
    assert.equal(file.showDownload, true);
    assert.equal(file.renameEnabled, true);
    assert.equal(file.renamePath, "docs/a.txt");
    assert.equal(file.renameName, "a.txt");

    const dir = filesItemMenuModel(entries, ["docs"]);
    assert.equal(dir.showDownload, false);
    assert.equal(dir.renameEnabled, true);
    assert.equal(dir.renamePath, "docs");
  });

  it("skips selected paths that are no longer in the listing", () => {
    const m = filesItemMenuModel(entries, ["gone", "docs/a.txt"]);
    assert.equal(m.count, 1);
    assert.equal(m.renamePath, "docs/a.txt");
  });
});
