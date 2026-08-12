/**
 * Shared ICS/VCF import progress UI (Phase 6; used by calendars + contacts).
 */
import { esc, renderFlash, renderModal, renderModalFooter } from "../../ui";
import type { ImportProgress } from "../context";
import { formatElapsed } from "../format";
import type { CalendarsHost } from "./host";

export function stopImportElapsedTimer(host: CalendarsHost): void {
  if (host.state.importElapsedTimer !== null) {
    clearInterval(host.state.importElapsedTimer);
    host.state.importElapsedTimer = null;
  }
}

export function startImportElapsedTimer(host: CalendarsHost): void {
  stopImportElapsedTimer(host);
  host.state.importElapsedTimer = setInterval(() => {
    if (!host.state.importProgress || host.state.importProgress.phase === "done" || host.state.importProgress.phase === "error") {
      stopImportElapsedTimer(host);
      return;
    }
    host.state.importProgress = {
      ...host.state.importProgress,
      elapsedSec: Math.floor((Date.now() - host.state.importProgress.startedAt) / 1000),
    };
    // Light update: status + bar without full re-render
    if (host.state.importProgress.phase === "processing") {
      updateImportProgressDom(host, host.state.importProgress);
    }
  }, 1000);
}

export function setImportPhase(host: CalendarsHost, phase: ImportProgress["phase"],
  extra: Partial<ImportProgress> = {},): void {
  if (!host.state.importProgress) return;
  host.state.importProgress = {
    ...host.state.importProgress,
    phase,
    elapsedSec: Math.floor((Date.now() - host.state.importProgress.startedAt) / 1000),
    ...extra,
  };
  host.render();
}

export function closeImportProgress(host: CalendarsHost): void {
  stopImportElapsedTimer(host);
  host.state.importProgress = null;
  host.render();
}

export function applyServerImportProgress(host: CalendarsHost, p: {
  percent: number;
  current: number;
  total: number;
  imported: number;
  updated: number;
  skipped: number;
}): void {
  if (!host.state.importProgress || host.state.importProgress.phase === "done" || host.state.importProgress.phase === "error") {
    return;
  }
  host.state.importProgress = {
    ...host.state.importProgress,
    phase: "processing",
    processPercent: p.percent,
    processCurrent: p.current,
    processTotal: p.total,
    processImported: p.imported,
    processUpdated: p.updated,
    processSkipped: p.skipped,
    elapsedSec: Math.floor((Date.now() - host.state.importProgress.startedAt) / 1000),
  };
  updateImportProgressDom(host, host.state.importProgress);
}

export function updateImportProgressDom(host: CalendarsHost, p: ImportProgress): void {
  const status = host.root.querySelector<HTMLElement>("[data-import-status-line]");
  const bar = host.root.querySelector<HTMLElement>(".import-progress-bar");
  const track = host.root.querySelector<HTMLElement>(".import-progress-track");
  const counts = host.root.querySelector<HTMLElement>("[data-import-counts]");
  const unit = p.kind === "calendar" ? "items" : "contacts";
  let statusLine: string;
  if (p.phase === "processing" && p.processTotal > 0) {
    statusLine = `Importing ${p.processCurrent.toLocaleString()} / ${p.processTotal.toLocaleString()} ${unit} (${p.processPercent ?? 0}%) · ${formatElapsed(p.elapsedSec)}`;
  } else if (p.phase === "processing") {
    statusLine = `Importing on server… ${formatElapsed(p.elapsedSec)}`;
  } else {
    return;
  }
  if (status) status.textContent = statusLine;
  if (counts) {
    counts.textContent = `${p.processImported} new · ${p.processUpdated} updated${p.processSkipped ? ` · ${p.processSkipped} skipped` : ""}`;
  }
  if (bar && p.processPercent !== null) {
    bar.classList.remove("is-indeterminate");
    bar.style.width = `${Math.min(100, Math.max(0, p.processPercent))}%`;
  }
  if (track && p.processPercent !== null) {
    track.setAttribute("aria-valuenow", String(p.processPercent));
    track.removeAttribute("aria-valuetext");
  }
}

export function renderImportProgressModal(host: CalendarsHost): string {
  if (!host.state.importProgress) return "";
  const p = host.state.importProgress;
  const running = p.phase !== "done" && p.phase !== "error";
  const kindLabel = p.kind === "calendar" ? "calendar (.ics)" : "contacts (.vcf)";
  const title =
    p.phase === "done"
      ? "Import finished"
      : p.phase === "error"
        ? "Import failed"
        : "Importing…";

  const stepsHtml = (() => {
    const order: Array<{ id: ImportProgress["phase"]; label: string }> = [
      { id: "reading", label: "Reading file" },
      { id: "uploading", label: "Uploading to server" },
      { id: "processing", label: "Importing on server" },
    ];
    const phaseRank: Record<string, number> = {
      reading: 0,
      uploading: 1,
      processing: 2,
      done: 3,
      error: 2,
    };
    const cur = phaseRank[p.phase] ?? 0;
    return order
      .map((s, i) => {
        let state: "pending" | "active" | "done" = "pending";
        if (p.phase === "done") state = "done";
        else if (i < cur) state = "done";
        else if (i === cur) state = p.phase === "error" ? "active" : "active";
        const icon = state === "done" ? "✓" : state === "active" ? "●" : "○";
        return `<li class="import-step import-step-${state}"><span class="import-step-icon" aria-hidden="true">${icon}</span> ${esc(s.label)}</li>`;
      })
      .join("");
  })();

  let body = "";
  if (running) {
    let barPct: number | null = null;
    if (p.phase === "reading" && p.readPercent !== null) {
      barPct = Math.min(100, Math.max(0, p.readPercent));
    } else if (p.phase === "processing" && p.processPercent !== null) {
      barPct = Math.min(100, Math.max(0, p.processPercent));
    }
    const barClass =
      barPct === null ? "import-progress-bar is-indeterminate" : "import-progress-bar";
    const barStyle = barPct !== null ? ` style="width:${barPct}%"` : "";
    const unit = p.kind === "calendar" ? "items" : "contacts";
    let statusLine: string;
    if (p.phase === "reading") {
      statusLine =
        p.readPercent !== null ? `Reading file… ${p.readPercent}%` : "Reading file…";
    } else if (p.phase === "uploading") {
      statusLine = "Uploading to server…";
    } else if (p.processTotal > 0) {
      statusLine = `Importing ${p.processCurrent.toLocaleString()} / ${p.processTotal.toLocaleString()} ${unit} (${p.processPercent ?? 0}%) · ${formatElapsed(p.elapsedSec)}`;
    } else {
      statusLine = `Importing on server… ${formatElapsed(p.elapsedSec)}`;
    }
    const countsLine =
      p.phase === "processing" && p.processTotal > 0
        ? `<p class="muted small" data-import-counts style="margin:0 0 0.5rem">${p.processImported} new · ${p.processUpdated} updated${p.processSkipped ? ` · ${p.processSkipped} skipped` : ""}</p>`
        : `<p class="muted small" data-import-counts style="margin:0 0 0.5rem;display:none"></p>`;
    body = `
      <p class="muted small" style="margin:0 0 0.75rem">
        Importing <strong>${esc(kindLabel)}</strong> from
        <span class="mono">${esc(p.fileName)}</span>
        ${p.fileSizeLabel ? ` <span class="muted">(${esc(p.fileSizeLabel)})</span>` : ""}
      </p>
      <ul class="import-steps">${stepsHtml}</ul>
      <div class="import-progress-track" role="progressbar"
        aria-valuemin="0" aria-valuemax="100"
        ${barPct !== null ? `aria-valuenow="${barPct}"` : 'aria-valuetext="In progress"'}
        aria-label="Import progress">
        <div class="${barClass}"${barStyle}></div>
      </div>
      <p class="import-status-line" data-import-status-line>${esc(statusLine)}</p>
      ${countsLine}
      <p class="muted small">Keep this tab open until the import finishes.
        ${p.kind === "calendar" ? "Each event is written separately — ~1&nbsp;MB calendars can take several minutes on a NAS." : ""}
      </p>`;
  } else if (p.phase === "done") {
    body = `
      ${renderFlash("success", `Success. ${p.resultMessage || "Import completed."}`, {
        className: "import-result",
        style: "margin:0 0 1rem",
      })}
      <p class="muted small" style="margin:0">
        File: <span class="mono">${esc(p.fileName)}</span>
        · Took ${esc(formatElapsed(p.elapsedSec))}
      </p>`;
  } else {
    body = `
      ${renderFlash("error", `Failed. ${p.resultMessage || "Import failed."}`, {
        className: "import-result",
        style: "margin:0 0 1rem",
      })}
      <p class="muted small" style="margin:0">
        File: <span class="mono">${esc(p.fileName)}</span>
        · After ${esc(formatElapsed(p.elapsedSec))}
      </p>
      <p class="muted small">Large imports can time out; try again — already-imported items update faster.</p>`;
  }

  const footer = running
    ? `<p class="muted small" style="margin:0">Please wait…</p>`
    : renderModalFooter([
        { label: "Close", action: "close-import-progress", variant: "primary" },
      ]);

  return renderModal({
    title,
    titleId: "import-progress-title",
    closeAction: "close-import-progress",
    size: "sm",
    className: "import-progress-modal",
    cardClassName: "import-progress-card",
    rootAttrs: "data-import-progress",
    hideClose: running,
    lockBackdrop: running,
    body,
    footer,
  });
}

export function readFileTextWithProgress(
  _host: CalendarsHost,
  file: File,
  onProgress: (pct: number | null) => void,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onprogress = (ev) => {
      if (ev.lengthComputable && ev.total > 0) {
        onProgress(Math.min(100, Math.round((ev.loaded / ev.total) * 100)));
      } else {
        onProgress(null);
      }
    };
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () =>
      reject(reader.error ?? new Error("Failed to read file"));
    reader.readAsText(file);
  });
}
