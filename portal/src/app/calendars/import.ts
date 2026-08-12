/**
 * Calendar .ics import flows (Phase 6).
 */
import { api } from "../../api";
import { log } from "../../log";
import { formatFileSize } from "../format";
import type { CalendarsHost } from "./host";
import {
  applyServerImportProgress,
  setImportPhase,
  startImportElapsedTimer,
  stopImportElapsedTimer,
  readFileTextWithProgress,
} from "./importProgress";
import { loadMonthEvents } from "./loaders";

export function bindImportInput(host: CalendarsHost) {
  const input = host.root.querySelector<HTMLInputElement>('input[data-action="import-cal"]');
  if (input) {
    input.addEventListener("change", () => {
      void onImportFile(host, input);
    });
  }
  const createImport = host.root.querySelector<HTMLInputElement>(
    'input[data-action="import-create-cal"]',
  );
  if (createImport) {
    createImport.addEventListener("change", () => {
      void onImportCreateCal(host, createImport);
    });
  }
  const abInput = host.root.querySelector<HTMLInputElement>('input[data-action="import-ab"]');
  if (abInput) {
    abInput.addEventListener("change", () => {
      void host.onImportContacts(abInput);
    });
  }
}

export async function onImportFile(host: CalendarsHost, input: HTMLInputElement) {
  if (host.state.selectedId === null) return;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  host.state.calModalOpen = true;
  await runCalendarImport(host, host.state.selectedId, file, { keepEditModalOpen: true });
}

export async function onImportCreateCal(host: CalendarsHost, input: HTMLInputElement) {
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  const form = host.root.querySelector<HTMLFormElement>('[data-form="create-cal"]');
  const fd = form ? new FormData(form) : new FormData();
  const holidays = fd.get("holidays") === "on";
  const readOnly = fd.get("readOnly") === "on";
  if (holidays) {
    host.setFlash(
      "error",
      "Turn off “Holidays calendar” to import a .ics file into a new calendar.",
    );
    host.state.createCalModalOpen = true;
    host.render();
    return;
  }
  if (readOnly) {
    host.setFlash(
      "error",
      "Turn off “Read-only” before importing — import cannot write to a read-only calendar.",
    );
    host.state.createCalModalOpen = true;
    host.render();
    return;
  }

  let displayname = String(fd.get("displayname") ?? "").trim();
  if (!displayname) {
    displayname = file.name.replace(/\.ics$/i, "").trim() || "Imported calendar";
  }
  const description = String(fd.get("description") ?? "");
  const color = String(fd.get("color") ?? "").trim();

  host.state.busy = true;
  host.clearFlash();
  host.state.createCalModalOpen = true;
  host.render();
  try {
    const res = await api.createCalendar({
      displayname,
      description,
      color,
      readOnly: false,
    });
    host.state.selectedId = res.calendar.id;
    host.state.createCalModalOpen = false;
    await host.loadHome();
    host.setFlash("success", `Created “${res.calendar.displayname}” — importing…`);
    // Import with progress (busy cleared/restored inside)
    await runCalendarImport(host, res.calendar.id, file, {
      keepEditModalOpen: false,
      successPrefix: `Calendar “${res.calendar.displayname}” created. `,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Create or import failed";
    host.state.createCalModalOpen = true;
    host.setFlash("error", msg);
    host.state.busy = false;
    host.render();
  }
}

export async function runCalendarImport(host: CalendarsHost, calId: number,
  file: File,
  opts: { keepEditModalOpen?: boolean; successPrefix?: string } = {},): Promise<void> {
  host.state.busy = true;
  host.clearFlash();
  stopImportElapsedTimer(host);
  host.state.importProgress = {
    kind: "calendar",
    fileName: file.name,
    fileSizeLabel: formatFileSize(file.size),
    phase: "reading",
    readPercent: 0,
    processPercent: null,
    processCurrent: 0,
    processTotal: 0,
    processImported: 0,
    processUpdated: 0,
    processSkipped: 0,
    startedAt: Date.now(),
    elapsedSec: 0,
    resultMessage: null,
    ok: null,
  };
  startImportElapsedTimer(host);
  host.render();
  try {
    const ics = await readFileTextWithProgress(host, file, (pct) => {
      if (!host.state.importProgress || host.state.importProgress.phase !== "reading") return;
      host.state.importProgress = { ...host.state.importProgress, readPercent: pct };
      const bar = host.root.querySelector<HTMLElement>(".import-progress-bar");
      const status = host.root.querySelector<HTMLElement>("[data-import-status-line]");
      if (bar && pct !== null) {
        bar.classList.remove("is-indeterminate");
        bar.style.width = `${pct}%`;
      }
      if (status && pct !== null) status.textContent = `Reading file… ${pct}%`;
    });
    setImportPhase(host, "uploading", { readPercent: 100 });
    setImportPhase(host, "processing", { processPercent: 0 });
    log.event("import.calendar.start", {
      file: file.name,
      bytes: file.size,
      calId,
    });
    const res = await api.importCalendar(calId, ics, (prog) => {
      applyServerImportProgress(host, prog);
    });
    const detail = host.formatImportResult(res);
    if (host.state.selectedId === calId) await loadMonthEvents(host);
    stopImportElapsedTimer(host);
    setImportPhase(host, "done", {
      ok: true,
      resultMessage: `${detail} (from “${file.name}”)`,
    });
    host.setFlash(
      "success",
      `${opts.successPrefix || ""}Import finished for “${file.name}”: ${detail}.`,
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Import failed";
    stopImportElapsedTimer(host);
    setImportPhase(host, "error", { ok: false, resultMessage: msg });
    host.setFlash("error", msg);
  } finally {
    if (opts.keepEditModalOpen) host.state.calModalOpen = true;
    host.state.busy = false;
    host.render();
  }
}
