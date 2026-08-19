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
  });
});
