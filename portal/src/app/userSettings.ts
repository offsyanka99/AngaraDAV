/**
 * Per-user portal settings (theme, calendar day range, week numbers).
 */
import { renderFlash, renderModal } from "../ui.ts";
import type { AppState } from "./context";
import { applyTheme, parseTheme, persistTheme, readStoredTheme, type ThemeId } from "./theme.ts";

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

export function userSettingsModalHtml(state: AppState): string {
  if (!state.userSettingsOpen || !state.user) return "";
  const s = state.userSettings;
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
          <input type="radio" name="theme" value="dark" ${theme === "dark" ? "checked" : ""} />
          Dark
        </label>
        <label class="check-row" data-action="set-theme" data-theme="light">
          <input type="radio" name="theme" value="light" ${theme === "light" ? "checked" : ""} />
          Light
        </label>
      </fieldset>
      <fieldset class="user-settings-fieldset">
        <legend>Calendar</legend>
        <label>Day starts at
          <select name="dayStartHour">${hourOptions(s.dayStartHour)}</select>
        </label>
        <label>Day ends at
          <select name="dayEndHour">${hourOptions(s.dayEndHour)}</select>
        </label>
        <label class="check-row">
          <input type="checkbox" name="showWeekNumbers" ${s.showWeekNumbers ? "checked" : ""} />
          Show week numbers
        </label>
      </fieldset>
    </div>`;
  return renderModal({
    id: "user-settings-modal",
    title: "User settings",
    closeAction: "user-settings-close",
    form: true,
    formAttrs: 'data-form="user-settings"',
    size: "sm",
    body,
    footer: [
      { label: "Cancel", action: "user-settings-close", variant: "ghost" },
      { label: "Save", type: "submit" },
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

export function closeUserSettings(state: AppState): void {
  state.userSettingsOpen = false;
  state.userSettingsError = null;
  applyTheme(state.userSettings.theme);
}