/**
 * Shared portal SPA types (Phase 1 extract from app.ts).
 */
import type { FlashType } from "../ui";

export type TabId = "calendars" | "contacts" | "tasks" | "notes" | "files" | "admin";

/** Nested Administration views: #admin, #admin/users, #admin/settings, #admin/database */
export type AdminPageId = "overview" | "users" | "settings" | "database";

export type Flash = { type: FlashType; message: string } | null;
