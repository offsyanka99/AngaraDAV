/** Contacts VCF import (Phase 7). */
import { api } from "../../api";
import { log } from "../../log";
import { formatFileSize } from "../format";
import type { ContactsHost } from "./host";
import { loadContacts } from "./loaders";

export async function onImportContacts(host: ContactsHost, input: HTMLInputElement) {
  if (host.state.selectedAbId === null) return;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  const abId = host.state.selectedAbId;
  host.state.abModalOpen = true;
  host.state.busy = true;
  host.clearFlash();
  host.stopImportElapsedTimer();
  host.state.importProgress = {
    kind: "contacts",
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
  host.startImportElapsedTimer();
  host.render();
  try {
    const vcf = await host.readFileTextWithProgress(file, (pct) => {
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
    host.setImportPhase("uploading", { readPercent: 100 });
    host.setImportPhase("processing", { processPercent: 0 });
    log.event("import.contacts.start", {
      file: file.name,
      bytes: file.size,
      abId,
    });
    const res = await api.importAddressBook(abId, vcf, (prog) => {
      host.applyServerImportProgress(prog);
    });
    const detail = host.formatImportResult(res);
    await host.loadHome();
    if (host.state.selectedAbId === abId) await loadContacts(host, abId);
    host.stopImportElapsedTimer();
    host.setImportPhase("done", {
      ok: true,
      resultMessage: `${detail} (from “${file.name}”)`,
    });
    host.setFlash("success", `Import finished for “${file.name}”: ${detail}.`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Import failed";
    host.stopImportElapsedTimer();
    host.setImportPhase("error", { ok: false, resultMessage: msg });
    host.setFlash("error", msg);
  } finally {
    host.state.busy = false;
    host.render();
  }
}

/** Pull live form values into editingContact before re-host.render(multi email/phone). */
