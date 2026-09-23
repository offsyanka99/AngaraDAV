import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_USER_SETTINGS,
  EMPTY_PASSWORD_DRAFT,
  HIDDEN_PASSWORD_VISIBILITY,
  PASSWORD_MIN_LENGTH,
  nextPasswordVisibility,
  normalizeUserSettings,
  parseHour,
  passwordFieldHtml,
  readPasswordChange,
  readPasswordDraft,
  readUserSettingsFromForm,
  userSettingsModalHtml,
} from "./userSettings.ts";
import type { AppState } from "./context.ts";

describe("parseHour", () => {
  it("accepts 0–23", () => {
    assert.equal(parseHour(0), 0);
    assert.equal(parseHour("8"), 8);
    assert.equal(parseHour(23), 23);
  });

  it("rejects out of range", () => {
    assert.equal(parseHour(-1), null);
    assert.equal(parseHour(24), null);
    assert.equal(parseHour("x"), null);
  });
});

describe("readUserSettingsFromForm", () => {
  it("rejects day end at or before day start", () => {
    const form = { elements: {} } as unknown as HTMLFormElement;
    const orig = FormData;
    class FakeFormData {
      constructor(_form?: unknown) {}
      get(name: string) {
        const v: Record<string, string> = {
          theme: "dark",
          dayStartHour: "12",
          dayEndHour: "12",
        };
        return v[name] ?? null;
      }
    }
    globalThis.FormData = FakeFormData as unknown as typeof FormData;
    try {
      const r = readUserSettingsFromForm(form);
      assert.ok("error" in r);
      if ("error" in r) assert.match(r.error, /after day start/i);
    } finally {
      globalThis.FormData = orig;
    }
  });
});

function withForm(
  values: Record<string, string>,
  fn: (form: HTMLFormElement) => void,
): void {
  const orig = globalThis.FormData;
  class FakeFormData {
    get(name: string) {
      return Object.prototype.hasOwnProperty.call(values, name) ? values[name] : null;
    }
  }
  globalThis.FormData = FakeFormData as unknown as typeof FormData;
  try {
    fn({} as HTMLFormElement);
  } finally {
    globalThis.FormData = orig;
  }
}

describe("readPasswordChange", () => {
  it("ignores a current password alone", () => {
    assert.equal(
      readPasswordChange({
        currentPassword: "current-password",
        password: "",
        passwordConfirm: "",
      }),
      null,
    );
  });

  it("requires the current password and a matching new password", () => {
    const missingCurrent = readPasswordChange({
      currentPassword: "",
      password: "new-password",
      passwordConfirm: "new-password",
    });
    assert.ok(missingCurrent && "error" in missingCurrent);

    const mismatch = readPasswordChange({
      currentPassword: "current-password",
      password: "new-password",
      passwordConfirm: "other-password",
    });
    assert.ok(mismatch && "error" in mismatch);
    if (mismatch && "error" in mismatch) assert.match(mismatch.error, /does not match/i);

    const short = readPasswordChange({
      currentPassword: "current-password",
      password: "short",
      passwordConfirm: "short",
    });
    assert.ok(short && "error" in short);
    if (short && "error" in short) {
      assert.match(short.error, new RegExp(String(PASSWORD_MIN_LENGTH)));
    }

    const same = readPasswordChange({
      currentPassword: "same-password",
      password: "same-password",
      passwordConfirm: "same-password",
    });
    assert.ok(same && "error" in same);
    if (same && "error" in same) assert.match(same.error, /different/i);
  });

  it("accepts a confirmed new password and keeps it out of calendar settings", () => {
    const draft = {
      currentPassword: "current-password",
      password: "new-password",
      passwordConfirm: "new-password",
    };
    assert.deepEqual(readPasswordChange(draft), draft);
    withForm(
      {
        theme: "light",
        dayStartHour: "9",
        dayEndHour: "17",
        ...draft,
      },
      (form) => {
        assert.deepEqual(readPasswordDraft(form), draft);
        const settings = readUserSettingsFromForm(form);
        assert.ok(!("error" in settings));
        if (!("error" in settings)) {
          assert.equal(settings.theme, "light");
          assert.equal(settings.dayStartHour, 9);
          assert.equal("password" in settings, false);
        }
      },
    );
  });
});

describe("password visibility", () => {
  it("shows the password on the first toggle and hides it on the next", () => {
    const shown = nextPasswordVisibility("password");
    assert.equal(shown.type, "text");
    assert.equal(shown.label, "Hide password");
    assert.equal(shown.pressed, true);
    const hidden = nextPasswordVisibility(shown.type);
    assert.equal(hidden.type, "password");
    assert.equal(hidden.label, "View password");
    assert.equal(hidden.pressed, false);
  });

  it("puts a view-password control on each field", () => {
    const html = passwordFieldHtml({
      label: "Current password",
      name: "currentPassword",
      autocomplete: "current-password",
      value: "secret",
      visible: false,
      disabled: false,
    });
    assert.match(html, /type="password"/);
    assert.match(html, /aria-label="View password"/);
    assert.match(html, /data-action="toggle-password"/);
    const revealed = passwordFieldHtml({
      label: "New password",
      name: "password",
      autocomplete: "new-password",
      value: "secret",
      visible: true,
      disabled: false,
    });
    assert.match(revealed, /type="text"/);
    assert.match(revealed, /aria-label="Hide password"/);
    const signIn = passwordFieldHtml({
      label: "Password",
      name: "password",
      autocomplete: "current-password",
      value: "",
      visible: false,
      disabled: false,
      required: true,
    });
    assert.match(signIn, /required/);
    assert.match(signIn, /aria-label="View password"/);
  });
});

describe("user settings password section", () => {
  it("puts the rules in the (i) and a view control on each field", () => {
    const previous = globalThis.document;
    globalThis.document = {
      documentElement: { getAttribute: () => "dark" },
    } as unknown as Document;
    try {
      const html = userSettingsModalHtml({
        userSettingsOpen: true,
        user: { username: "alice" },
        userSettings: { ...DEFAULT_USER_SETTINGS },
        userPasswordDraft: { ...EMPTY_PASSWORD_DRAFT },
        userPasswordVisible: { ...HIDDEN_PASSWORD_VISIBILITY },
        userSettingsSaving: false,
        userSettingsError: null,
      } as AppState);
      assert.match(html, /data-info-title="Password"/);
      assert.match(html, /Leave blank to keep your current password/);
      assert.match(html, /At least 8 characters/);
      assert.doesNotMatch(html, /<p class="muted small">Leave blank/);
      assert.equal((html.match(/data-action="toggle-password"/g) ?? []).length, 3);
      assert.match(html, /name="currentPassword"/);
      assert.match(html, /name="passwordConfirm"/);
    } finally {
      globalThis.document = previous;
    }
  });
});

describe("normalizeUserSettings", () => {
  it("fills defaults", () => {
    const s = normalizeUserSettings({});
    assert.equal(s.theme, "dark");
    assert.equal(s.dayStartHour, 8);
    assert.equal(s.dayEndHour, 18);
    assert.equal(s.showWeekNumbers, false);
  });
});
