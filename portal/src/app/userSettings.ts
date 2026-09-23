/**
 * Per-user portal settings (theme, calendar day range, week numbers)
 * and self-service DAV password change.
 */
import { esc, renderFlash, renderModal, type FlashType } from "../ui.ts";
import { infoIconHtml } from "./sectionInfo.ts";
import type { AppState } from "./context";
import { applyTheme, parseTheme, persistTheme, readStoredTheme, type ThemeId } from "./theme.ts";

/** Matches Auth::PASSWORD_MIN_LENGTH (installer minimum). */
export const PASSWORD_MIN_LENGTH = 8;

export type UserSettings = {
  theme: ThemeId;
  dayStartHour: number;
  dayEndHour: number;
  showWeekNumbers: boolean;
};

export const USER_SETTINGS_STORAGE_KEY = "angaradav-portal-user-settings";

export const DEFAULT_USER_SETTINGS: UserSettings = {
  theme: "dark",
  dayStartHour: 8,
  dayEndHour: 18,
  showWeekNumbers: false,
};

/** Password fields kept only while the settings modal is open. Never written to localStorage. */
export type PasswordDraft = {
  currentPassword: string;
  password: string;
  passwordConfirm: string;
};

export const EMPTY_PASSWORD_DRAFT: PasswordDraft = {
  currentPassword: "",
  password: "",
  passwordConfirm: "",
};

/** Which password inputs are currently revealed. Not persisted. */
export type PasswordVisibility = Record<keyof PasswordDraft, boolean>;

export const HIDDEN_PASSWORD_VISIBILITY: PasswordVisibility = {
  currentPassword: false,
  password: false,
  passwordConfirm: false,
};

export function nextPasswordVisibility(inputType: string): {
  type: "password" | "text";
  label: "View password" | "Hide password";
  pressed: boolean;
} {
  if (inputType === "password") {
    return { type: "text", label: "Hide password", pressed: true };
  }
  return { type: "password", label: "View password", pressed: false };
}

export function parseHour(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(n) || n < 0 || n > 23) return null;
  return n;
}

export function normalizeUserSettings(partial: Partial<UserSettings> | null | undefined): UserSettings {
  const theme = parseTheme(partial?.theme) ?? DEFAULT_USER_SETTINGS.theme;
  const dayStartHour = parseHour(partial?.dayStartHour) ?? DEFAULT_USER_SETTINGS.dayStartHour;
  const dayEndHour = parseHour(partial?.dayEndHour) ?? DEFAULT_USER_SETTINGS.dayEndHour;
  return {
    theme,
    dayStartHour,
    dayEndHour,
    showWeekNumbers: !!partial?.showWeekNumbers,
  };
}

function perUserKey(username: string): string {
  return `${USER_SETTINGS_STORAGE_KEY}:${username}`;
}

function readJson(key: string): Partial<UserSettings> | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object") return null;
    return data as Partial<UserSettings>;
  } catch {
    return null;
  }
}

export function readStoredUserSettings(username?: string | null): UserSettings {
  const fromStore = username
    ? (readJson(perUserKey(username)) ?? readJson(USER_SETTINGS_STORAGE_KEY))
    : readJson(USER_SETTINGS_STORAGE_KEY);
  const merged: Partial<UserSettings> = { ...(fromStore ?? {}) };
  if (!parseTheme(merged.theme)) {
    merged.theme = readStoredTheme(username);
  }
  return normalizeUserSettings(merged);
}

export function persistUserSettings(settings: UserSettings, username?: string | null): void {
  const normalized = normalizeUserSettings(settings);
  try {
    const payload = JSON.stringify(normalized);
    localStorage.setItem(USER_SETTINGS_STORAGE_KEY, payload);
    if (username) localStorage.setItem(perUserKey(username), payload);
  } catch {
    /* private mode / quota */
  }
  persistTheme(normalized.theme, username);
}

export function applyStoredUserSettings(username?: string | null): UserSettings {
  const settings = readStoredUserSettings(username);
  applyTheme(settings.theme);
  return settings;
}

function hourOptions(selected: number): string {
  const parts: string[] = [];
  for (let h = 0; h < 24; h++) {
    const label = `${String(h).padStart(2, "0")}:00`;
    parts.push(`<option value="${h}" ${h === selected ? "selected" : ""}>${label}</option>`);
  }
  return parts.join("");
}

const PASSWORD_ICON_SHOW = `<svg class="password-toggle-show" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M2.2 12S5.8 5.5 12 5.5 21.8 12 21.8 12 18.2 18.5 12 18.5 2.2 12 2.2 12Z" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.75"/></svg>`;
const PASSWORD_ICON_HIDE = `<svg class="password-toggle-hide" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M3 4.5 21 20.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/><path d="M9.9 6.2A11 11 0 0 1 12 5.5c6.2 0 9.8 6.5 9.8 6.5a18 18 0 0 1-3.3 4.2M6.1 7.9C3.7 9.5 2.2 12 2.2 12S5.8 18.5 12 18.5c1.2 0 2.3-.2 3.3-.6" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/><path d="M9.9 10a3 3 0 0 0 4.1 4.1" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"/></svg>`;

export function passwordFieldHtml(opts: {
  label: string;
  name: keyof PasswordDraft;
  autocomplete: string;
  value: string;
  visible: boolean;
  disabled: boolean;
  required?: boolean;
  minLength?: number;
}): string {
  const toggleLabel = opts.visible ? "Hide password" : "View password";
  const min = opts.minLength ? ` minlength="${opts.minLength}"` : "";
  const required = opts.required ? "required" : "";
  const dis = opts.disabled ? "disabled" : "";
  const showIcon = opts.visible
    ? PASSWORD_ICON_SHOW.replace("<svg ", "<svg hidden ")
    : PASSWORD_ICON_SHOW;
  const hideIcon = opts.visible
    ? PASSWORD_ICON_HIDE
    : PASSWORD_ICON_HIDE.replace("<svg ", "<svg hidden ");
  return `<label>${esc(opts.label)}
          <span class="password-field">
            <input type="${opts.visible ? "text" : "password"}" name="${opts.name}" autocomplete="${esc(opts.autocomplete)}" value="${esc(opts.value)}"${min} ${required} ${dis} />
            <button type="button" class="password-toggle" data-action="toggle-password" aria-label="${toggleLabel}" aria-pressed="${opts.visible ? "true" : "false"}" title="${toggleLabel}" ${dis}>
              ${showIcon}${hideIcon}
            </button>
          </span>
        </label>`;
}

/** Reveal or hide the password input next to this button. Does not re-render. */
export function togglePasswordField(state: AppState, button: HTMLElement): void {
  if (state.userSettingsSaving) return;
  const field = button.closest(".password-field");
  const input = field?.querySelector("input");
  if (!(input instanceof HTMLInputElement)) return;
  const name = input.name;
  if (name !== "currentPassword" && name !== "password" && name !== "passwordConfirm") return;
  const next = nextPasswordVisibility(input.type);
  input.type = next.type;
  state.userPasswordVisible[name] = next.pressed;
  button.setAttribute("aria-pressed", next.pressed ? "true" : "false");
  button.setAttribute("aria-label", next.label);
  button.title = next.label;
  button.querySelector(".password-toggle-show")?.toggleAttribute("hidden", next.pressed);
  button.querySelector(".password-toggle-hide")?.toggleAttribute("hidden", !next.pressed);
}

export function userSettingsModalHtml(state: AppState): string {
  if (!state.userSettingsOpen || !state.user) return "";
  const s = state.userSettings;
  const draft = state.userPasswordDraft;
  const saving = state.userSettingsSaving;
  const dis = saving ? "disabled" : "";
  const theme = parseTheme(document.documentElement.getAttribute("data-theme")) ?? s.theme;
  const err = state.userSettingsError
    ? renderFlash("error", state.userSettingsError, { role: "alert", className: "user-settings-error" })
    : "";
  const body = `
    ${err}
    <div class="stack user-settings-form">
      <fieldset class="user-settings-fieldset">
        <legend>Theme</legend>
        <label class="check-row" data-action="set-theme" data-theme="dark">
          <input type="radio" name="theme" value="dark" ${theme === "dark" ? "checked" : ""} ${dis} />
          Dark
        </label>
        <label class="check-row" data-action="set-theme" data-theme="light">
          <input type="radio" name="theme" value="light" ${theme === "light" ? "checked" : ""} ${dis} />
          Light
        </label>
      </fieldset>
      <fieldset class="user-settings-fieldset">
        <legend>Calendar</legend>
        <label>Day starts at
          <select name="dayStartHour" ${dis}>${hourOptions(s.dayStartHour)}</select>
        </label>
        <label>Day ends at
          <select name="dayEndHour" ${dis}>${hourOptions(s.dayEndHour)}</select>
        </label>
        <label class="check-row">
          <input type="checkbox" name="showWeekNumbers" ${s.showWeekNumbers ? "checked" : ""} ${dis} />
          Show week numbers
        </label>
      </fieldset>
      <fieldset class="user-settings-fieldset">
        <legend>Password ${infoIconHtml({
          title: "Password",
          paragraphs: [
            `Leave blank to keep your current password. A new password is used to sign in here and in calendar, contacts, and file apps. At least ${PASSWORD_MIN_LENGTH} characters.`,
          ],
        })}</legend>
        ${passwordFieldHtml({
          label: "Current password",
          name: "currentPassword",
          autocomplete: "current-password",
          value: draft.currentPassword,
          visible: state.userPasswordVisible.currentPassword,
          disabled: saving,
        })}
        ${passwordFieldHtml({
          label: "New password",
          name: "password",
          autocomplete: "new-password",
          value: draft.password,
          visible: state.userPasswordVisible.password,
          disabled: saving,
          minLength: PASSWORD_MIN_LENGTH,
        })}
        ${passwordFieldHtml({
          label: "Confirm new password",
          name: "passwordConfirm",
          autocomplete: "new-password",
          value: draft.passwordConfirm,
          visible: state.userPasswordVisible.passwordConfirm,
          disabled: saving,
          minLength: PASSWORD_MIN_LENGTH,
        })}
      </fieldset>
    </div>`;
  return renderModal({
    id: "user-settings-modal",
    title: "User settings",
    closeAction: "user-settings-close",
    form: true,
    formAttrs: 'data-form="user-settings"',
    size: "sm",
    lockBackdrop: saving,
    hideClose: saving,
    body,
    footer: [
      { label: "Cancel", action: "user-settings-close", variant: "ghost", disabled: saving },
      { label: saving ? "Saving…" : "Save", type: "submit", disabled: saving },
    ],
  });
}

export function readUserSettingsFromForm(form: HTMLFormElement): UserSettings | { error: string } {
  const fd = new FormData(form);
  const theme = parseTheme(String(fd.get("theme") ?? "")) ?? "dark";
  const dayStartHour = parseHour(fd.get("dayStartHour"));
  const dayEndHour = parseHour(fd.get("dayEndHour"));
  if (dayStartHour === null || dayEndHour === null) {
    return { error: "Choose a start and end hour" };
  }
  if (dayEndHour <= dayStartHour) {
    return { error: "Day end must be after day start" };
  }
  return {
    theme,
    dayStartHour,
    dayEndHour,
    showWeekNumbers: fd.get("showWeekNumbers") === "on",
  };
}

export function readPasswordDraft(form: HTMLFormElement): PasswordDraft {
  const fd = new FormData(form);
  return {
    currentPassword: String(fd.get("currentPassword") ?? ""),
    password: String(fd.get("password") ?? ""),
    passwordConfirm: String(fd.get("passwordConfirm") ?? ""),
  };
}

/**
 * null when both new-password fields are empty (keep the current password).
 * A filled current password alone is ignored so browser autofill does not block Save.
 */
export function readPasswordChange(
  draft: PasswordDraft,
): PasswordDraft | { error: string } | null {
  const { currentPassword, password, passwordConfirm } = draft;
  if (password === "" && passwordConfirm === "") return null;
  if (currentPassword === "") return { error: "Enter your current password" };
  if (password === "" || passwordConfirm === "") {
    return { error: "Enter and confirm a new password" };
  }
  if (password !== passwordConfirm) {
    return { error: "New password confirmation does not match" };
  }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return { error: `New password must be at least ${PASSWORD_MIN_LENGTH} characters` };
  }
  if (password === currentPassword) {
    return { error: "New password must be different from the current password" };
  }
  return draft;
}

export function openUserSettings(state: AppState): void {
  state.userSettingsOpen = true;
  state.userSettingsError = null;
  state.userSettingsSaving = false;
  state.userPasswordDraft = { ...EMPTY_PASSWORD_DRAFT };
  state.userPasswordVisible = { ...HIDDEN_PASSWORD_VISIBILITY };
}

export function closeUserSettings(state: AppState): void {
  if (state.userSettingsSaving) return;
  state.userSettingsOpen = false;
  state.userSettingsError = null;
  state.userPasswordDraft = { ...EMPTY_PASSWORD_DRAFT };
  state.userPasswordVisible = { ...HIDDEN_PASSWORD_VISIBILITY };
  applyTheme(state.userSettings.theme);
}

export async function submitUserSettings(
  state: AppState,
  form: HTMLFormElement,
  hooks: {
    render: () => void;
    setFlash: (type: FlashType, message: string) => void;
    clearFlash: () => void;
    changePassword: (body: PasswordDraft) => Promise<unknown>;
  },
): Promise<void> {
  if (state.userSettingsSaving) return;
  const next = readUserSettingsFromForm(form);
  state.userPasswordDraft = readPasswordDraft(form);
  if ("error" in next) {
    state.userSettingsError = next.error;
    hooks.render();
    return;
  }
  const passwordChange = readPasswordChange(state.userPasswordDraft);
  if (passwordChange && "error" in passwordChange) {
    state.userSettingsError = passwordChange.error;
    hooks.render();
    return;
  }
  if (passwordChange) {
    state.userSettingsSaving = true;
    state.userSettingsError = null;
    hooks.render();
    try {
      await hooks.changePassword(passwordChange);
    } catch (err) {
      state.userSettingsSaving = false;
      state.userSettingsError =
        err instanceof Error && err.message !== "" ? err.message : "Could not change password";
      hooks.render();
      return;
    }
    state.userSettingsSaving = false;
  }
  persistUserSettings(next, state.user?.username ?? null);
  state.userSettings = next;
  state.userSettingsOpen = false;
  state.userSettingsError = null;
  state.userPasswordDraft = { ...EMPTY_PASSWORD_DRAFT };
  state.userPasswordVisible = { ...HIDDEN_PASSWORD_VISIBILITY };
  if (state.calView === "week") state.weekScrollToDayStart = true;
  applyTheme(next.theme);
  hooks.clearFlash();
  if (passwordChange) {
    hooks.setFlash(
      "success",
      "Password changed. Calendar, contacts, and file apps need the new password.",
    );
  }
  hooks.render();
}