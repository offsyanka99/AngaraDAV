/** Pure helpers for the settings backup/restore file (kept import-light for unit tests). */

export function backupFileName(doc: { productVersion?: string; createdAt?: string }): string {
  const stamp = (doc.createdAt || new Date().toISOString()).replace(/[:.]/g, "-");
  const version = doc.productVersion ? `-${doc.productVersion}` : "";
  return `angaradav-settings-backup${version}-${stamp}.json`;
}
