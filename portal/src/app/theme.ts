/**
 * Portal color theme (dark default, light optional).
 * Applied on <html> so body className resets (layout-auth) do not drop it.
 */

export type ThemeId = "dark" | "light";

export const THEME_STORAGE_KEY = "angaradav-portal-theme";

export function parseTheme(raw: unknown): ThemeId | null {
  return raw === "dark" || raw === "light" ? raw : null;
}

function perUserKey(username: string): string {
  return `${THEME_STORAGE_KEY}:${username}`;
}

/** Per-user preference if present, else global, else dark. */
export function readStoredTheme(username?: string | null): ThemeId {
  try {
    if (username) {
      const per = parseTheme(localStorage.getItem(perUserKey(username)));
      if (per) return per;
    }
    return parseTheme(localStorage.getItem(THEME_STORAGE_KEY)) ?? "dark";
  } catch {
    return "dark";
  }
}

export function persistTheme(theme: ThemeId, username?: string | null): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
    if (username) {
      localStorage.setItem(perUserKey(username), theme);
    }
  } catch {
    /* private mode / quota */
  }
}

export function currentTheme(): ThemeId {
  return parseTheme(document.documentElement.getAttribute("data-theme")) ?? "dark";
}

export function applyTheme(theme: ThemeId): void {
  const html = document.documentElement;
  html.setAttribute("data-theme", theme);
  html.style.colorScheme = theme;
  const meta = document.querySelector('meta[name="color-scheme"]');
  if (meta) meta.setAttribute("content", theme);
}

export function applyStoredTheme(username?: string | null): ThemeId {
  const theme = readStoredTheme(username);
  applyTheme(theme);
  return theme;
}
