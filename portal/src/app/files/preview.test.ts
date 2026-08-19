import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { classifyFilesPreview } from "./previewKind.ts";

describe("classifyFilesPreview", () => {
  it("classifies images by extension", () => {
    assert.equal(classifyFilesPreview("photo.JPG"), "image");
    assert.equal(classifyFilesPreview("a/b/icon.png"), "image");
    assert.equal(classifyFilesPreview("scan.heic"), "image");
  });

  it("classifies pdf, audio, and video", () => {
    assert.equal(classifyFilesPreview("doc.pdf"), "pdf");
    assert.equal(classifyFilesPreview("track.mp3"), "audio");
    assert.equal(classifyFilesPreview("clip.webm"), "video");
  });

  it("treats markup and source as text (not executed)", () => {
    assert.equal(classifyFilesPreview("notes.txt"), "text");
    assert.equal(classifyFilesPreview("index.html"), "text");
    assert.equal(classifyFilesPreview("app.js"), "text");
    assert.equal(classifyFilesPreview("logo.svg"), "text");
  });

  it("returns unsupported for unknown types", () => {
    assert.equal(classifyFilesPreview("archive.zip"), "unsupported");
    assert.equal(classifyFilesPreview("README"), "unsupported");
    assert.equal(classifyFilesPreview(".env"), "unsupported");
  });
});
