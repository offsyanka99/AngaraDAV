/** "Enable WebDAV-Push for file storage" is usable only while Push and file storage are both on. */
export function canEnableFilesPush(pushEnabled: boolean, filesEnabled: boolean): boolean {
  return pushEnabled && filesEnabled;
}

type CheckboxLike = { checked: boolean; disabled: boolean };
type HintLike = { hidden: boolean };
type FormLike = { querySelector(selector: string): unknown };

/** Re-evaluate the file-push checkbox after the Push or file storage checkbox changes. */
export function syncFilesPushToggle(form: FormLike): void {
  const input = (name: string) => form.querySelector(`input[name="${name}"]`) as CheckboxLike | null;
  const push = input("push_enabled");
  const files = input("files_enabled");
  const filesPush = input("push_files_enabled");
  if (!push || !files || !filesPush) {
    return;
  }
  const available = canEnableFilesPush(push.checked, files.checked);
  filesPush.disabled = !available;
  const hint = form.querySelector("[data-files-push-hint]") as HintLike | null;
  if (hint) {
    hint.hidden = available;
  }
}
