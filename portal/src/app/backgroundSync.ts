/**
 * Poll GET /api/sync-status while a user tab is visible and toast when the
 * active domain's collection revision changed out-of-band.
 */
import { api, type SyncStatus } from "../api";
import { log } from "../log";
import type { AppState } from "./context";
import { disposeFilesPreviewState, resetFilesTransferTreeState } from "./files/stateReset";
import { notify } from "./notify";
import {
  clampPollSeconds,
  DEFAULT_POLL_SECONDS,
  domainNoun,
  hasOpenEditor,
  isCompoundBusy,
  isDomainStale,
  shouldShowStaleToast,
} from "./backgroundSyncDiff";

export {
  clampPollSeconds,
  DEFAULT_POLL_SECONDS,
  domainNoun,
  hasComponent,
  hasOpenEditor,
  isCompoundBusy,
  isDomainStale,
  MAX_POLL_SECONDS,
  MIN_POLL_SECONDS,
  shouldShowStaleToast,
} from "./backgroundSyncDiff";

export type BackgroundSyncHost = {
  state: AppState;
  render: () => void;
  loadNotes: () => Promise<void>;
  loadTasks: () => Promise<void>;
  loadMonthEvents: () => Promise<void>;
  loadContacts: (abId: number) => Promise<void>;
  loadFiles: () => Promise<void>;
};

type Poller = {
  host: BackgroundSyncHost;
  timer: ReturnType<typeof setTimeout> | null;
  pollSeconds: number;
  inFlight: boolean;
  stopped: boolean;
};

let poller: Poller | null = null;
let lastSnapshot: SyncStatus | null = null;
let staleToastId: number | null = null;
let refreshInFlight = false;

function pollSecondsFromState(state: AppState): number {
  return clampPollSeconds(state.portalUi.syncPollSeconds ?? DEFAULT_POLL_SECONDS);
}

function applyPollSeconds(seconds: unknown): void {
  const next = clampPollSeconds(seconds);
  if (poller && !poller.stopped) {
    if (next === poller.pollSeconds) return;
    poller.pollSeconds = next;
    schedule();
    return;
  }
}

function schedule(): void {
  if (!poller || poller.stopped) return;
  if (poller.timer !== null) {
    clearTimeout(poller.timer);
    poller.timer = null;
  }
  if (typeof document !== "undefined" && document.hidden) return;
  poller.timer = setTimeout(() => {
    void tick();
  }, poller.pollSeconds * 1000);
}

function fetchStatus(state: AppState): Promise<SyncStatus> {
  const includeFiles = state.activeTab === "files";
  return api.syncStatus({
    includeFiles,
    path: includeFiles ? state.filesPath : undefined,
  });
}

function dismissStaleToast(): void {
  if (staleToastId === null) return;
  notify.dismiss(staleToastId);
  staleToastId = null;
}

function showStaleToast(host: BackgroundSyncHost): void {
  if (staleToastId !== null && notify.isVisible(staleToastId)) return;
  const tab = host.state.activeTab;
  const noun = domainNoun(tab);
  const message = `${noun.charAt(0).toUpperCase()}${noun.slice(1)} changed in the background. Refresh to pick up the latest.`;
  // WCAG 2.2.1 exception: sticky until dismiss/Refresh — auto-dismiss would hide the only way to apply remote changes.
  staleToastId = notify.info(message, {
    duration: null,
    action: {
      label: "Refresh",
      onClick: () => {
        void requestRefresh(host);
      },
    },
  });
  log.event("backgroundSync.stale", { tab });
}

async function tick(): Promise<void> {
  if (!poller || poller.stopped) return;
  if (typeof document !== "undefined" && document.hidden) return;
  const { host } = poller;
  const { state } = host;
  if (!state.user || state.activeTab === "admin") {
    schedule();
    return;
  }
  if (poller.inFlight) return;
  poller.inFlight = true;
  try {
    const status = await fetchStatus(state);
    if (!poller || poller.stopped) return;
    applyPollSeconds(status.pollSeconds);
    const changed = isDomainStale(state.activeTab, lastSnapshot, status, state.selectedIds);
    log.debug("backgroundSync", { tab: state.activeTab, changed });
    if (!lastSnapshot) {
      lastSnapshot = status;
      return;
    }
    if (!changed) {
      dismissStaleToast();
      return;
    }
    if (
      !shouldShowStaleToast({
        staleToastId,
        stale: true,
        busy: isCompoundBusy(state) || refreshInFlight,
        toastVisible: staleToastId !== null && notify.isVisible(staleToastId),
      })
    ) {
      return;
    }
    showStaleToast(host);
  } catch {
    /* network blips are silent; 401 is handled by the API client */
  } finally {
    if (poller) poller.inFlight = false;
    if (poller && !poller.stopped) schedule();
  }
}

function onVisibilityOrFocus(): void {
  if (!poller || poller.stopped) return;
  if (typeof document !== "undefined" && document.hidden) {
    if (poller.timer !== null) {
      clearTimeout(poller.timer);
      poller.timer = null;
    }
    return;
  }
  void tick();
}

function closeOpenEditor(state: AppState): void {
  state.editingNote = null;
  state.creatingNote = false;
  state.noteModalOpen = false;
  state.editingTask = null;
  state.creatingTask = false;
  state.taskModalOpen = false;
  state.editingEvent = null;
  state.creatingEvent = false;
  state.eventModalOpen = false;
  state.editingContact = null;
  state.creatingContact = false;
  state.contactModalOpen = false;
  state.filesRenamePath = null;
  state.filesMkdirOpen = false;
  state.filesDeletePaths = null;
  resetFilesTransferTreeState(state);
  disposeFilesPreviewState(state);
  state.calModalOpen = false;
  state.createCalModalOpen = false;
  state.abModalOpen = false;
  state.confirmRefresh = false;
}

async function loadActiveTab(host: BackgroundSyncHost): Promise<void> {
  const { state } = host;
  switch (state.activeTab) {
    case "notes":
      await host.loadNotes();
      break;
    case "tasks":
      await host.loadTasks();
      break;
    case "calendars":
      await host.loadMonthEvents();
      break;
    case "contacts":
      if (state.selectedAbId !== null) await host.loadContacts(state.selectedAbId);
      break;
    case "files":
      await host.loadFiles();
      break;
    default:
      break;
  }
}

async function runRefresh(host: BackgroundSyncHost): Promise<void> {
  dismissStaleToast();
  refreshInFlight = true;
  try {
    await loadActiveTab(host);
    host.render();
  } catch {
    if (typeof location !== "undefined") location.reload();
  } finally {
    refreshInFlight = false;
  }
}

export async function requestRefresh(host: BackgroundSyncHost): Promise<void> {
  if (isCompoundBusy(host.state)) {
    showStaleToast(host);
    return;
  }
  if (hasOpenEditor(host.state)) {
    host.state.confirmRefresh = true;
    host.render();
    return;
  }
  await runRefresh(host);
}

export function cancelRefreshConfirm(host: BackgroundSyncHost): void {
  host.state.confirmRefresh = false;
  host.render();
  showStaleToast(host);
}

export async function confirmRefreshAndReload(host: BackgroundSyncHost): Promise<void> {
  closeOpenEditor(host.state);
  host.render();
  await runRefresh(host);
}

export async function captureSyncSnapshot(host: { state: AppState }): Promise<void> {
  if (!host.state.user || host.state.activeTab === "admin") return;
  try {
    const status = await fetchStatus(host.state);
    lastSnapshot = status;
    applyPollSeconds(status.pollSeconds);
    dismissStaleToast();
  } catch {
    /* keep previous snapshot */
  }
}

export function onBackgroundSyncTabChange(): void {
  dismissStaleToast();
}

export function setBackgroundSyncInterval(seconds: unknown): void {
  applyPollSeconds(seconds);
}

function detachPoller(): void {
  if (!poller) return;
  poller.stopped = true;
  if (poller.timer !== null) {
    clearTimeout(poller.timer);
    poller.timer = null;
  }
  if (typeof document !== "undefined") {
    document.removeEventListener("visibilitychange", onVisibilityOrFocus);
  }
  if (typeof window !== "undefined") {
    window.removeEventListener("focus", onVisibilityOrFocus);
  }
  poller = null;
}

export function startBackgroundSync(host: BackgroundSyncHost): void {
  detachPoller();
  poller = {
    host,
    timer: null,
    pollSeconds: pollSecondsFromState(host.state),
    inFlight: false,
    stopped: false,
  };
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisibilityOrFocus);
  }
  if (typeof window !== "undefined") {
    window.addEventListener("focus", onVisibilityOrFocus);
  }
  schedule();
}

export function stopBackgroundSync(): void {
  detachPoller();
  dismissStaleToast();
  lastSnapshot = null;
  refreshInFlight = false;
}

export function backgroundSyncHost(): BackgroundSyncHost | null {
  return poller && !poller.stopped ? poller.host : null;
}
