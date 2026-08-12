/**
 * Shared host surface for the Calendars domain (Phase 6).
 */
import type { FlashType } from "../../ui";
import type { AppState } from "../context";

export type CalendarsHost = {
  state: AppState;
  root: HTMLElement;
  render: () => void;
  setFlash: (type: FlashType, message: string) => void;
  clearFlash: () => void;
  /** Date/time field helpers still owned by mountApp wrappers */
  localeWeekStart: () => number;
  localeDowLabels: () => string[];
  formatDtDisplay: (value: string, allDay: boolean) => string;
  timeFormatOpts: () => Intl.DateTimeFormatOptions;
  renderPortalDateTimeField: (opts: {
    field: string;
    name: string;
    label: string;
    value: string;
    dateOnly?: boolean;
    required?: boolean;
    disabled?: boolean;
    allowClear?: boolean;
  }) => string;
  getDtFieldCurrentValue: (field: string) => string;
  setDtFieldValue: (field: string, value: string | null) => void;
  positionDtPopovers: () => void;
  renderFlashBanner: () => string;
  accessBadge: (access: string) => string;
  formatImportResult: (r: { imported: number; updated: number; skipped: number }) => string;
  /** Reload calendars/contacts lists after create/edit calendar */
  loadHome: () => Promise<void>;
  /** Contacts .vcf import (Phase 7 will own this; wired from mountApp for now) */
  onImportContacts: (input: HTMLInputElement) => Promise<void>;
};
