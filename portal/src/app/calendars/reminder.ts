/**
 * One display reminder on a VEVENT. Preset minutes are before the start.
 * "keep" leaves a reminder the form does not edit.
 */
export const REMINDER_PRESETS: { minutes: number; label: string }[] = [
  { minutes: 0, label: "At start" },
  { minutes: 5, label: "5 minutes before" },
  { minutes: 15, label: "15 minutes before" },
  { minutes: 30, label: "30 minutes before" },
  { minutes: 60, label: "1 hour before" },
  { minutes: 1440, label: "1 day before" },
  { minutes: 10080, label: "1 week before" },
];

export function reminderFromForm(fd: FormData): {
  reminderMinutes: number | null;
  reminderCustom: boolean;
} {
  const raw = String(fd.get("reminder") ?? "");
  if (raw === "keep") return { reminderMinutes: null, reminderCustom: true };
  if (raw === "") return { reminderMinutes: null, reminderCustom: false };
  const n = Number(raw);
  if (!Number.isFinite(n)) return { reminderMinutes: null, reminderCustom: false };
  return { reminderMinutes: n, reminderCustom: false };
}

/** Value sent on create/update. null clears the portal display reminder. */
export function reminderPayload(fd: FormData): number | "keep" | null {
  const raw = String(fd.get("reminder") ?? "");
  if (raw === "keep") return "keep";
  if (raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}
