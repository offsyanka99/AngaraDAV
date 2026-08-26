import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { noteLooksLikeHtml, notePlainText } from "./html.ts";

describe("note html helpers", () => {
  it("detects HTML", () => {
    assert.equal(noteLooksLikeHtml("<p>Hi</p>"), true);
    assert.equal(noteLooksLikeHtml("plain"), false);
  });

  it("strips tags for list preview", () => {
    assert.equal(notePlainText("<p>Hello <strong>team</strong></p>"), "Hello team");
    const preview = notePlainText("<h1>Title</h1><p>See <code>shell.ts</code></p>");
    assert.match(preview, /Title/);
    assert.match(preview, /shell\.ts/);
  });
});
