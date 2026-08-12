/** Sync color picker + hex text inputs (Phase 8). */

export function bindColorPair(form: HTMLFormElement) {
  const picker = form.querySelector<HTMLInputElement>('input[name="color_picker"]');
  const text = form.querySelector<HTMLInputElement>('input[name="color"]');
  if (!picker || !text) return;
  picker.addEventListener("input", () => {
    text.value = picker.value.toUpperCase();
  });
  text.addEventListener("change", () => {
    let v = text.value.trim();
    if (v && !v.startsWith("#")) v = `#${v}`;
    if (/^#[0-9A-Fa-f]{6}/.test(v)) {
      picker.value = v.slice(0, 7);
      text.value = v.toUpperCase();
    }
  });
}
