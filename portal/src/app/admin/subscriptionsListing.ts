/** Pure labels for the Administration subscriptions table. */

export function subscriptionKindLabel(kind: string): string {
  switch (kind) {
    case "calendars":
      return "Calendar";
    case "addressbooks":
      return "Address book";
    case "files":
      return "File folder";
    case "principals":
      return "Principal";
    default:
      return "Other";
  }
}

/** Host plus the last characters of the path. Never the full endpoint URL. */
export function endpointDisplay(host: string, hint: string): string {
  const trimmedHost = host.trim();
  const trimmedHint = hint.trim();
  if (trimmedHost === "" && trimmedHint === "") return "—";
  if (trimmedHint === "") return trimmedHost;
  if (trimmedHost === "") return `…${trimmedHint}`;
  return `${trimmedHost} …${trimmedHint}`;
}

export function triggerDisplay(content: string | null, property: string | null): string {
  const parts: string[] = [];
  if (content) parts.push(`content ${content}`);
  if (property) parts.push(`property ${property}`);
  return parts.length === 0 ? "—" : parts.join(", ");
}

export function subscriptionEmptyMessage(opts: {
  error: string | null;
  showExpired: boolean;
}): string {
  if (opts.error) return opts.error;
  if (opts.showExpired) return "No subscriptions.";
  return "No active subscriptions.";
}
