import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { AppState } from "./context.ts";
import { renderLogin } from "./login.ts";
import { DATA_RESTORE_SUCCESS } from "./sessionEnd.ts";

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

  it("should show the data-restore success line when that reload flag is set", () => {
    let body = "";
    renderLogin(
      { innerHTML: "" } as unknown as HTMLElement,
      { installGate: null, busy: false, dataRestoreNotice: true } as AppState,
      (html) => {
        body = html;
        return html;
      },
    );
    assert.match(body, new RegExp(DATA_RESTORE_SUCCESS.replace(/[.]/g, "\\.")));
    assert.match(body, /class="flash flash-success"/);
  });

  it("should omit the data-restore success line when the flag is off", () => {
    let body = "";
    renderLogin(
      { innerHTML: "" } as unknown as HTMLElement,
      { installGate: null, busy: false, dataRestoreNotice: false } as AppState,
      (html) => {
        body = html;
        return html;
      },
    );
    assert.equal(body.includes(DATA_RESTORE_SUCCESS), false);
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
