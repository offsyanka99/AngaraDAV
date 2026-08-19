import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { FileEntry } from "../../api";
import { fileTypeBucket, filterAndSortEntries } from "./listing.ts";

function e(name: string, type: "file" | "dir", extra: Partial<FileEntry> = {}): FileEntry {
  return { name, path: name, type, size: extra.size ?? 10, mtime: extra.mtime ?? 1 };
}

describe("fileTypeBucket", () => {
  it("classifies folders, images, office docs, and archives", () => {
    assert.equal(fileTypeBucket(e("Docs", "dir")), "folder");
    assert.equal(fileTypeBucket(e("pic.png", "file")), "image");
    assert.equal(fileTypeBucket(e("notes.docx", "file")), "document");
    assert.equal(fileTypeBucket(e("pack.zip", "file")), "archive");
    assert.equal(fileTypeBucket(e("song.mp3", "file")), "audio");
  });
});

describe("filterAndSortEntries", () => {
  const entries = [
    e("Zed", "dir", { mtime: 3 }),
    e("alpha.txt", "file", { size: 50, mtime: 2 }),
    e("beta.docx", "file", { size: 200, mtime: 9 }),
    e("photo.jpg", "file", { size: 5, mtime: 1 }),
  ];

  it("filters by search and type", () => {
    const q = filterAndSortEntries(entries, { search: "al", type: "all", sort: "name", order: "asc" });
    assert.deepEqual(q.map((x) => x.name), ["alpha.txt"]);
    const docs = filterAndSortEntries(entries, {
      search: "",
      type: "document",
      sort: "name",
      order: "asc",
    });
    assert.deepEqual(docs.map((x) => x.name), ["alpha.txt", "beta.docx"]);
  });

  it("sorts folders first by name, and size descending for files", () => {
    const byName = filterAndSortEntries(entries, { search: "", type: "all", sort: "name", order: "asc" });
    assert.equal(byName[0].name, "Zed");
    const bySize = filterAndSortEntries(entries, { search: "", type: "file", sort: "size", order: "desc" });
    assert.deepEqual(
      bySize.map((x) => x.name),
      ["beta.docx", "alpha.txt", "photo.jpg"],
    );
  });
});
