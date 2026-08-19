/**
 * Portal SPA constants (Phase 1 extract from app.ts).
 */

export const TAB_STORAGE_KEY = "angaradav-portal-tab";
export const ADMIN_PAGE_STORAGE_KEY = "angaradav-portal-admin-page";
/** localStorage key prefix; full key is `${prefix}:${username}`. */
export const CAL_SELECTION_STORAGE_KEY = "angaradav-portal-cal-selection";

/** Fallback when /api/ui has not returned yet (or offline). */
export const APP_VERSION_FALLBACK = "2.3.1";

export function splitAppVersion(full: string): { version: string; build: string } {
  const v = (full || APP_VERSION_FALLBACK).trim();
  const plus = v.indexOf("+");
  if (plus <= 0) return { version: v || APP_VERSION_FALLBACK, build: "" };
  return { version: v.slice(0, plus), build: v.slice(plus + 1) };
}

export const DOCS_URL = "https://github.com/offsyanka99/AngaraDAV/tree/main/docs";
