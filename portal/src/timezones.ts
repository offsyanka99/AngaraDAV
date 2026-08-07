/**
 * IANA timezone list for install + system settings selects.
 * Prefer browser Intl; fall back to a curated common set.
 */

const FALLBACK_TIMEZONES = [
  "UTC",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "America/Anchorage",
  "America/Argentina/Buenos_Aires",
  "America/Chicago",
  "America/Denver",
  "America/Edmonton",
  "America/Halifax",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/New_York",
  "America/Sao_Paulo",
  "America/Toronto",
  "America/Vancouver",
  "Asia/Dubai",
  "Asia/Hong_Kong",
  "Asia/Jerusalem",
  "Asia/Kolkata",
  "Asia/Seoul",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Melbourne",
  "Australia/Sydney",
  "Europe/Amsterdam",
  "Europe/Berlin",
  "Europe/London",
  "Europe/Madrid",
  "Europe/Moscow",
  "Europe/Paris",
  "Europe/Rome",
  "Europe/Warsaw",
  "Pacific/Auckland",
  "Pacific/Honolulu",
];

let cached: string[] | null = null;

export function listTimezones(): string[] {
  if (cached) return cached;
  try {
    const intl = Intl as unknown as { supportedValuesOf?: (k: string) => string[] };
    if (typeof intl.supportedValuesOf === "function") {
      const list = intl.supportedValuesOf("timeZone");
      if (Array.isArray(list) && list.length > 0) {
        cached = [...list].sort((a, b) => a.localeCompare(b));
        return cached;
      }
    }
  } catch {
    /* ignore */
  }
  cached = [...FALLBACK_TIMEZONES];
  return cached;
}

/** HTML `<option>` list for a timezone `<select>`. */
export function timezoneSelectOptions(selected: string): string {
  const cur = selected || "UTC";
  const zones = listTimezones();
  const has = zones.includes(cur);
  const opts = zones.map(
    (z) => `<option value="${escapeAttr(z)}" ${z === cur ? "selected" : ""}>${escapeText(z)}</option>`,
  );
  if (!has && cur) {
    opts.unshift(
      `<option value="${escapeAttr(cur)}" selected>${escapeText(cur)}</option>`,
    );
  }
  return opts.join("");
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function escapeText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
