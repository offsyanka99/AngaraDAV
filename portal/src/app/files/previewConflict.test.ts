import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { previewRefreshConflict, type PreviewStamp } from "./previewConflict.ts";

function preview(over: Partial<PreviewStamp> = {}): PreviewStamp {
  return {
    path: "notes/a.txt",
    name: "a.txt",
    etag: '"1"',
    ignored: null,
    ...over,
  };
}

describe("previewRefreshConflict", () => {
  it("stays quiet when the etag matches", () => {
    assert.equal(
      previewRefreshConflict(preview(), "notes", [
        { path: "notes/a.txt", type: "file", etag: '"1"' },
      ]),
      null,
    );
  });

  it("asks to reload when a DAV write changes the etag", () => {
    assert.deepEqual(
      previewRefreshConflict(preview(), "notes", [
        { path: "notes/a.txt", type: "file", etag: '"2"' },
      ]),
      { kind: "changed", path: "notes/a.txt", name: "a.txt", etag: '"2"' },
    );
  });

  it("does not ask again after the user keeps that server version", () => {
    assert.equal(
      previewRefreshConflict(preview({ ignored: { kind: "changed", etag: '"2"' } }), "notes", [
        { path: "notes/a.txt", type: "file", etag: '"2"' },
      ]),
      null,
    );
  });

  it("asks when the file disappeared from this folder", () => {
    assert.deepEqual(
      previewRefreshConflict(preview(), "notes", []),
      { kind: "missing", path: "notes/a.txt", name: "a.txt", etag: null },
    );
  });

  it("does not ask again after the user keeps a missing file", () => {
    assert.equal(
      previewRefreshConflict(preview({ ignored: { kind: "missing" } }), "notes", []),
      null,
    );
  });

  it("asks again when a kept version is replaced", () => {
    assert.deepEqual(
      previewRefreshConflict(preview({ ignored: { kind: "changed", etag: '"2"' } }), "notes", [
        { path: "notes/a.txt", type: "file", etag: '"3"' },
      ]),
      { kind: "changed", path: "notes/a.txt", name: "a.txt", etag: '"3"' },
    );
  });

  it("does not prompt when the listing has no etag", () => {
    assert.equal(
      previewRefreshConflict(preview(), "notes", [
        { path: "notes/a.txt", type: "file", etag: null },
      ]),
      null,
    );
  });

  it("does not treat a file in another folder as missing", () => {
    assert.equal(
      previewRefreshConflict(preview(), "other", []),
      null,
    );
  });

  it("adopts an etag the preview did not have yet", () => {
    assert.deepEqual(
      previewRefreshConflict(preview({ etag: null }), "", [
        { path: "notes/a.txt", type: "file", etag: '"9"' },
      ]),
      null,
    );
    assert.deepEqual(
      previewRefreshConflict(preview({ path: "a.txt", etag: null }), "", [
        { path: "a.txt", type: "file", etag: '"9"' },
      ]),
      { kind: "adopt", path: "a.txt", etag: '"9"' },
    );
  });
});
