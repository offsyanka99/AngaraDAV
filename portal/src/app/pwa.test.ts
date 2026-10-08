import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const manifest = JSON.parse(
  readFileSync(new URL("../../public/manifest.webmanifest", import.meta.url), "utf8"),
) as {
  display?: string;
  scope?: string;
  start_url?: string;
  icons?: { src?: string; sizes?: string }[];
};

const worker = readFileSync(new URL("../../public/sw.js", import.meta.url), "utf8");

describe("portal manifest", () => {
  it("installs standalone at /portal/ and reuses the existing icons", () => {
    assert.equal(manifest.display, "standalone");
    assert.equal(manifest.scope, "/portal/");
    assert.equal(manifest.start_url, "/portal/");
    const icons = manifest.icons ?? [];
    assert.ok(icons.some((icon) => icon.src === "/favicon.png" && icon.sizes === "512x512"));
    assert.ok(icons.some((icon) => icon.src === "/apple-touch-icon.png" && icon.sizes === "180x180"));
  });
});

describe("portal service worker", () => {
  it("passes requests through and does not cache", () => {
    assert.match(worker, /respondWith\(fetch\(event\.request\)\)/);
    assert.doesNotMatch(worker, /caches\./);
  });
});
