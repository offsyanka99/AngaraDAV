/**
 * Holidays calendar form toggle (Phase 6).
 */
import type { CalendarsHost } from "./host";

export function bindHolidaysToggle(host: CalendarsHost) {
  const form = host.root.querySelector<HTMLFormElement>('[data-form="create-cal"]');
  if (!form) return;
  const cb = form.querySelector<HTMLInputElement>('input[name="holidays"]');
  const wrap = form.querySelector<HTMLElement>("#holidays-country-wrap");
  const nameInput = form.querySelector<HTMLInputElement>('input[name="displayname"]');
  const readOnly = form.querySelector<HTMLInputElement>('input[name="readOnly"]');
  if (!cb || !wrap) return;

  const sync = () => {
    const on = cb.checked;
    wrap.hidden = !on;
    if (nameInput) {
      nameInput.required = !on;
      if (on && !nameInput.value.trim()) {
        nameInput.placeholder = "Auto: Holidays (XX)";
      } else if (!on) {
        nameInput.placeholder = "Work";
      }
    }
    if (on && readOnly) {
      readOnly.checked = true;
    }
  };
  cb.addEventListener("change", sync);
  sync();
}
