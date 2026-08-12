/**
 * Host surface for Contacts tab (Phase 7).
 */
import type { FlashType } from "../../ui";
import type { AppState, ImportProgress } from "../context";

export type ContactsHost = {
  state: AppState;
  root: HTMLElement;
  render: () => void;
  setFlash: (type: FlashType, message: string) => void;
  clearFlash: () => void;
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
  stopImportElapsedTimer: () => void;
  startImportElapsedTimer: () => void;
  setImportPhase: (phase: ImportProgress["phase"], extra?: Partial<ImportProgress>) => void;
  applyServerImportProgress: (p: {
    percent: number;
    current: number;
    total: number;
    imported: number;
    updated: number;
    skipped: number;
  }) => void;
  readFileTextWithProgress: (file: File, onProgress: (pct: number | null) => void) => Promise<string>;
  loadHome: () => Promise<void>;
  formatImportResult: (r: { imported: number; updated: number; skipped: number }) => string;
};
