import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { infoFromDataset, infoIconHtml, infoTitle } from "./sectionInfo.ts";

describe("infoIconHtml", () => {
  it("carries its own title and paragraphs", () => {
    const html = infoIconHtml({
      title: "Password",
      paragraphs: ["Leave blank to keep your current password."],
    });
    assert.match(html, /class="info-btn"/);
    assert.match(html, /data-action="info"/);
    assert.match(html, /data-info-title="Password"/);
    const raw = html.match(/data-info-paragraphs="([^"]*)"/)?.[1] ?? "";
    const decoded = raw.replaceAll("&quot;", '"').replaceAll("&amp;", "&");
    assert.deepEqual(JSON.parse(decoded), ["Leave blank to keep your current password."]);
  });

  it("escapes quotes in paragraphs and honors a custom label", () => {
    const html = infoIconHtml(
      { title: "Password", paragraphs: ['Say "hello" & leave blank.'] },
      "Password rules",
    );
    assert.match(html, /aria-label="Password rules"/);
    const raw = html.match(/data-info-paragraphs="([^"]*)"/)?.[1] ?? "";
    const decoded = raw
      .replaceAll("&quot;", '"')
      .replaceAll("&#39;", "'")
      .replaceAll("&amp;", "&");
    assert.deepEqual(JSON.parse(decoded), ['Say "hello" & leave blank.']);
  });
});

describe("infoFromDataset", () => {
  it("reads an inline payload", () => {
    const info = infoFromDataset({
      infoTitle: "Password",
      infoParagraphs: JSON.stringify(["At least 8 characters."]),
    });
    assert.deepEqual(info, {
      title: "Password",
      paragraphs: ["At least 8 characters."],
    });
  });

  it("falls back to a registered section key", () => {
    const info = infoFromDataset({ info: "tasks" });
    assert.equal(info?.title, "Tasks");
    assert.ok((info?.paragraphs.length ?? 0) > 0);
  });

  it("returns null when nothing matches", () => {
    assert.equal(infoFromDataset({}), null);
    assert.equal(infoFromDataset({ info: "missing-section" }), null);
  });

  it("prefers an inline payload over a registered key", () => {
    const info = infoFromDataset({
      info: "tasks",
      infoTitle: "Password",
      infoParagraphs: JSON.stringify(["Custom."]),
    });
    assert.equal(info?.title, "Password");
    assert.deepEqual(info?.paragraphs, ["Custom."]);
  });

  it("falls back when the inline JSON is not a string array", () => {
    const info = infoFromDataset({
      info: "tasks",
      infoTitle: "Broken",
      infoParagraphs: "not-json",
    });
    assert.equal(info?.title, "Tasks");
    assert.equal(
      infoFromDataset({ infoTitle: "Broken", infoParagraphs: JSON.stringify([1]) }),
      null,
    );
  });
});

describe("infoTitle", () => {
  it("keeps the registered data-info key", () => {
    const html = infoTitle("Tasks", "tasks", "h1");
    assert.match(html, /<h1>Tasks<\/h1>/);
    assert.match(html, /data-info="tasks"/);
    assert.match(html, /class="info-btn"/);
    assert.doesNotMatch(html, /data-info-paragraphs/);
  });
});
