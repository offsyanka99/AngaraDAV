import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AppState } from "./context.ts";
import { renderLogin } from "./login.ts";

describe("renderLogin", () => {
  it("puts a view-password control on the sign-in password", () => {
    let body = "";
    const root = { innerHTML: "" };
    renderLogin(
      root as unknown as HTMLElement,
      { installGate: null, busy: false } as AppState,
      (html) => {
        body = html;
        return "shell:" + html;
      },
    );
    assert.match(body, /data-action="toggle-password"/);
    assert.match(body, /aria-label="View password"/);
    assert.match(body, /name="password"/);
    assert.match(body, /type="password"/);
    assert.match(body, /\srequired\s/);
    assert.match(body, /autocomplete="current-password"/);
    assert.equal(root.innerHTML, "shell:" + body);
  });

  it("disables the view control while sign-in is busy", () => {
    let body = "";
    renderLogin(
      { innerHTML: "" } as unknown as HTMLElement,
      { installGate: null, busy: true } as AppState,
      (html) => {
        body = html;
        return html;
      },
    );
    assert.match(body, /data-action="toggle-password"[^>]*disabled/);
    assert.match(body, /type="password"[^>]*disabled/);
  });
});
