/**
 * Show a sticky notification when a checked calendar's display reminder is due.
 * Uses the same interval as background sync. A hidden tab waits until it is visible.
 */
import { api } from "../../api";
import { log } from "../../log";
import type { AppState } from "../context";
import { clampPollSeconds } from "../backgroundSyncDiff";
import { notify } from "../notify";
import {
  dueReminders,
  MAX_REMINDER_TOASTS,
  pickReminderKeys,
  readSeenKeys,
  reminderKey,
  reminderKeysToDismiss,
  reminderMessage,
  reminderWindow,
  writeSeenKeys,
  type ReminderOccurrence,
} from "./eventReminders";

export type EventReminderHost = {
  state: AppState;
  activateTab: (tab: "calendars", opts?: { clearFlash?: boolean }) => Promise<void>;
  openEvent: (instanceId: number, uri: string) => Promise<void>;
};

type Poller = {
  host: EventReminderHost;
  timer: ReturnType<typeof setTimeout> | null;
  pollSeconds: number;
  inFlight: boolean;
  stopped: boolean;
  poke: boolean;
  seen: Set<string>;
  shown: Map<string, number>;
  suppressRemember: Set<string>;
};

let poller: Poller | null = null;

function reminderStorage(): Storage | null {
  try {
    if (typeof sessionStorage === "undefined") return null;
    return sessionStorage;
  } catch {
    return null;
  }
}

function clearTimer(): void {
  if (!poller || poller.timer === null) return;
  clearTimeout(poller.timer);
  poller.timer = null;
}

function schedule(): void {
  if (!poller || poller.stopped) return;
  clearTimer();
  if (typeof document !== "undefined" && document.hidden) return;
  const wait = poller.pollSeconds * 1000;
  poller.timer = setTimeout(() => {
    void tick();
  }, wait);
}

function calendarsEnabled(state: AppState): boolean {
  const services = state.portalUi.services;
  if (!services) return true;
  return services.caldav;
}

function dismissQuiet(key: string): void {
  if (!poller) return;
  const id = poller.shown.get(key);
  if (id == null) return;
  if (!notify.isVisible(id)) {
    poller.shown.delete(key);
    return;
  }
  poller.suppressRemember.add(key);
  notify.dismiss(id);
}

function remember(key: string): void {
  if (!poller) return;
  poller.seen.add(key);
  poller.seen = new Set(writeSeenKeys(reminderStorage(), [...poller.seen]));
}

function onReminderDismiss(key: string): void {
  const current = poller;
  if (!current) return;
  current.shown.delete(key);
  if (current.suppressRemember.delete(key)) return;
  remember(key);
  if (current.stopped) return;
  if (current.inFlight) {
    current.poke = true;
    return;
  }
  clearTimer();
  void tick();
}

async function openFromReminder(host: EventReminderHost, occ: ReminderOccurrence): Promise<void> {
  if (!calendarsEnabled(host.state)) {
    notify.info("Calendar is turned off in system settings.");
    return;
  }
  if (host.state.activeTab !== "calendars") {
    await host.activateTab("calendars", { clearFlash: false });
  }
  if (host.state.activeTab !== "calendars") return;
  await host.openEvent(occ.instanceId, occ.uri);
}

function showReminder(occ: ReminderOccurrence, now: Date, username: string): void {
  if (!poller) return;
  const minutes = occ.reminderMinutes;
  if (minutes === null) return;
  const key = reminderKey(username, occ.instanceId, occ.uri, occ.start, minutes);
  if (poller.shown.has(key) || poller.seen.has(key)) return;
  const id = notify.info(reminderMessage(occ, now, poller.host.state.portalUi.timeFormat), {
    duration: null,
    pinned: true,
    onClick: () => {
      const host = poller?.host;
      if (host) void openFromReminder(host, occ);
    },
    onDismiss: () => onReminderDismiss(key),
  });
  if (id < 0 || !poller) return;
  poller.shown.set(key, id);
}

async function tick(): Promise<void> {
  if (!poller || poller.stopped || poller.inFlight) return;
  if (typeof document !== "undefined" && document.hidden) return;
  const current = poller;
  const { state } = current.host;
  if (!state.user || !calendarsEnabled(state)) {
    for (const key of [...current.shown.keys()]) dismissQuiet(key);
    schedule();
    return;
  }
  const username = state.user.username;
  const selectedIds = [...state.selectedIds];
  if (selectedIds.length === 0) {
    for (const key of [...current.shown.keys()]) dismissQuiet(key);
    schedule();
    return;
  }

  current.inFlight = true;
  const now = new Date();
  const range = reminderWindow(now);
  try {
    const settled = await Promise.allSettled(
      selectedIds.map(async (instanceId) => {
        const res = await api.calendarEvents(instanceId, range.from, range.to);
        return { instanceId, events: res.events };
      }),
    );
    if (!poller || poller !== current || current.stopped) return;

    const occurrences: ReminderOccurrence[] = [];
    const fetched = new Set<number>();
    for (const result of settled) {
      if (result.status !== "fulfilled") continue;
      fetched.add(result.value.instanceId);
      for (const event of result.value.events) {
        occurrences.push({
          instanceId: result.value.instanceId,
          uri: event.uri,
          summary: event.summary,
          start: event.start,
          end: event.end,
          allDay: event.allDay,
          reminderMinutes: event.reminderMinutes ?? null,
        });
      }
    }

    for (const [key, id] of [...current.shown]) {
      if (!notify.isVisible(id)) current.shown.delete(key);
    }

    const due = dueReminders(occurrences, now, current.seen, username);
    const dueKeys = new Set(
      due.map((occ) =>
        reminderKey(username, occ.instanceId, occ.uri, occ.start, occ.reminderMinutes as number),
      ),
    );
    const selected = new Set(selectedIds);
    for (const key of reminderKeysToDismiss(current.shown.keys(), dueKeys, fetched, selected)) {
      dismissQuiet(key);
    }
    const byKey = new Map(
      due.map((occ) => [
        reminderKey(username, occ.instanceId, occ.uri, occ.start, occ.reminderMinutes as number),
        occ,
      ]),
    );
    for (const key of pickReminderKeys(
      [...byKey.keys()],
      new Set(current.shown.keys()),
      MAX_REMINDER_TOASTS,
    )) {
      const occ = byKey.get(key);
      if (occ) showReminder(occ, now, username);
    }
    log.debug("eventReminders", { due: due.length, shown: current.shown.size });
  } catch (e) {
    log.debug("eventReminders", e instanceof Error ? e.message : e);
  } finally {
    if (poller === current) {
      current.inFlight = false;
      if (!current.stopped && current.poke) {
        current.poke = false;
        void tick();
      } else if (!current.stopped) {
        schedule();
      }
    }
  }
}

function onVisibility(): void {
  if (!poller || poller.stopped) return;
  if (typeof document !== "undefined" && document.hidden) {
    clearTimer();
    return;
  }
  if (poller.inFlight) return;
  clearTimer();
  void tick();
}

export function startEventReminders(host: EventReminderHost): void {
  stopEventReminders();
  poller = {
    host,
    timer: null,
    pollSeconds: clampPollSeconds(host.state.portalUi.syncPollSeconds),
    inFlight: false,
    stopped: false,
    poke: false,
    seen: new Set(readSeenKeys(reminderStorage())),
    shown: new Map(),
    suppressRemember: new Set(),
  };
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisibility);
  }
  if (typeof document !== "undefined" && document.hidden) return;
  void tick();
}

export function stopEventReminders(): void {
  if (!poller) return;
  poller.stopped = true;
  clearTimer();
  if (typeof document !== "undefined") {
    document.removeEventListener("visibilitychange", onVisibility);
  }
  for (const key of [...poller.shown.keys()]) dismissQuiet(key);
  poller = null;
}

export function setEventReminderInterval(seconds: unknown): void {
  if (!poller || poller.stopped) return;
  const next = clampPollSeconds(seconds);
  if (next === poller.pollSeconds) return;
  poller.pollSeconds = next;
  schedule();
}
