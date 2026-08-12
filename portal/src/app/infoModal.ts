/** Section (i) info modal (Phase 8). */
import { esc } from "../ui";
import { SECTION_INFO } from "./sectionInfo";
import type { AppOrchestrator } from "./orchestrator";

export function openInfoModal(o: AppOrchestrator, key: string) {
  const { root } = o;

  const info = SECTION_INFO[key];
  if (!info) return;
  const modal = root.querySelector<HTMLElement>("#info-modal");
  const titleEl = root.querySelector<HTMLElement>("#info-modal-title");
  const bodyEl = root.querySelector<HTMLElement>("#info-modal-body");
  if (!modal || !titleEl || !bodyEl) return;
  titleEl.textContent = info.title;
  bodyEl.innerHTML = info.paragraphs
    .map((p) => `<p>${esc(p)}</p>`)
    .join("");
  modal.hidden = false;
  document.body.classList.add("info-modal-open");
  const closeBtn = modal.querySelector<HTMLButtonElement>(".info-modal-close");
  closeBtn?.focus();
}

export function closeInfoModal(o: AppOrchestrator) {
  const { root } = o;
  const modal = root.querySelector<HTMLElement>("#info-modal");
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove("info-modal-open");
}
