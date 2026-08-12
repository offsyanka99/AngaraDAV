/**
 * Thin data-action dispatcher (onAction split).
 * Domain logic lives in *ActionsRouter modules; do not grow handlers here.
 */
import { log } from "../log";
import type { AppOrchestrator } from "./orchestrator";
import * as admin from "./admin";
import * as files from "./files";
import { handleShellAction } from "./shellActionsRouter";
import { handleCalendarsAction } from "./calendars/actionsRouter";
import { handleTasksAction } from "./tasks/actionsRouter";
import { handleNotesAction } from "./notes/actionsRouter";
import { handleContactsAction } from "./contacts/actionsRouter";

export async function onAction(o: AppOrchestrator, ev: Event): Promise<void> {
  const t = (ev.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!t) return;
  const action = t.dataset.action;
  if (!action) return;

  log.debug(`action:${action}`, {
    id: t.dataset.id,
    tab: t.dataset.tab,
    uri: t.dataset.uri,
  });

  if (await handleShellAction(o, action, t, ev)) return;
  if (action.startsWith("admin-") && (await admin.handleAdminAction(o.adminHost, action, t, ev))) {
    return;
  }
  if (
    (action.startsWith("files-") || action === "close-files-upload-progress") &&
    (await files.handleFilesAction(o.filesHost, action, t, ev))
  ) {
    return;
  }
  if (await handleCalendarsAction(o, action, t, ev)) return;
  if (await handleTasksAction(o, action, t, ev)) return;
  if (await handleNotesAction(o, action, t, ev)) return;
  if (await handleContactsAction(o, action, t, ev)) return;
}
