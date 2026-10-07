/**
 * Copy and sessionStorage flag for a portal session ended by a data restore.
 */
export const DATA_RESTORE_NOTICE_KEY = "angaradav-portal-data-restored";

export const DATA_RESTORE_SUCCESS = "Database and file store restored.";

export const DATA_RESTORE_SIGN_IN = "The database was restored. Please sign in again.";

const IDLE_SIGN_IN = "Your session timed out. Please sign in again.";

export function signInMessageFor401(serverMessage: string): string {
  if (serverMessage === DATA_RESTORE_SIGN_IN) return serverMessage;
  if (/timed\s*out|session expired/i.test(serverMessage)) return serverMessage;
  return IDLE_SIGN_IN;
}

/** Read the restore flag once. A missing sessionStorage (tests, private mode) is false. */
export function takeDataRestoreNotice(): boolean {
  try {
    if (sessionStorage.getItem(DATA_RESTORE_NOTICE_KEY) === "1") {
      sessionStorage.removeItem(DATA_RESTORE_NOTICE_KEY);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}
