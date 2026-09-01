/**
 * Toast notifications (transient system messages).
 *
 * The toast stack is mounted once on <body>, outside the SPA re-render root, so
 * auto-dismiss timers and enter/exit animations survive a full render().
 *
 * Rules of the road (see docs/portal-notifications-plan.md):
 *   - success/info auto-dismiss, errors stay until dismissed;
 *   - timers pause on hover/focus and while the tab is hidden (WCAG 2.2.1);
 *   - screen readers are served by two persistent live regions, not by the
 *     toast nodes themselves (a live region created together with its text is
 *     not announced).
 *
 * Persistent, contextual messages (form validation, install gate, session
 * expired on the sign-in screen) stay inline banners — see renderFlash in ui.ts.
 */
import type { FlashType } from "../ui";

export type NoticeAction = { label: string; onClick: () => void };

export type NoticeOptions = {
  /** Optional single action (Undo / Retry / View). Extends the auto-dismiss delay. */
  action?: NoticeAction;
  /** Override auto-dismiss delay in ms; null keeps the toast until dismissed. */
  duration?: number | null;
};

type Toast = {
  id: number;
  type: FlashType;
  message: string;
  el: HTMLElement;
  countEl: HTMLElement;
  count: number;
  /** null = sticky */
  duration: number | null;
  remaining: number;
  startedAt: number;
  timer: ReturnType<typeof setTimeout> | null;
  leaving: boolean;
  action?: NoticeAction;
};

const MAX_VISIBLE = 4;
const EXIT_MS = 200;
const MIN_MS = 5000;
const MAX_MS = 10000;
const MS_PER_WORD = 350;
const ACTION_MS = 12000;

let host: HTMLElement | null = null;
let politeRegion: HTMLElement | null = null;
let assertiveRegion: HTMLElement | null = null;
let seq = 0;
let paused = false;
let errorsSuppressed = false;
const toasts: Toast[] = [];

function durationFor(type: FlashType, message: string, hasAction: boolean): number | null {
  if (type === "error") return null;
  if (hasAction) return ACTION_MS;
  const words = message.trim().split(/\s+/).length;
  return Math.min(MAX_MS, Math.max(MIN_MS, words * MS_PER_WORD));
}

function srRegion(live: "polite" | "assertive"): HTMLElement {
  const el = document.createElement("div");
  el.className = "sr-only";
  el.setAttribute("aria-live", live);
  el.setAttribute("aria-atomic", "true");
  return el;
}

/** Create the toast stack + live regions. Safe to call more than once. */
export function mountNotifications(): void {
  if (host && host.isConnected) return;
  host = document.createElement("div");
  host.className = "toasts";
  host.setAttribute("role", "region");
  host.setAttribute("aria-label", "Notifications");
  politeRegion = srRegion("polite");
  assertiveRegion = srRegion("assertive");
  document.body.append(host, politeRegion, assertiveRegion);

  host.addEventListener("click", onHostClick);
  // Hover/focus propagates from the toasts even though .toasts is pointer-events:none.
  host.addEventListener("mouseenter", pauseAll);
  host.addEventListener("mouseleave", resumeAll);
  host.addEventListener("focusin", pauseAll);
  host.addEventListener("focusout", resumeAll);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pauseAll();
    else resumeAll();
  });
}

function ensureHost(): HTMLElement {
  if (!host || !host.isConnected) mountNotifications();
  return host as HTMLElement;
}

function announce(type: FlashType, message: string): void {
  const region = type === "error" ? assertiveRegion : politeRegion;
  if (!region) return;
  // Re-setting identical text is not re-announced; clear first.
  region.textContent = "";
  setTimeout(() => {
    region.textContent = message;
  }, 50);
}

function onHostClick(ev: MouseEvent): void {
  const target = ev.target as HTMLElement | null;
  const btn = target?.closest<HTMLElement>(".toast-close, .toast-action");
  if (!btn) return;
  const id = Number(btn.closest<HTMLElement>(".toast")?.dataset.toastId ?? "");
  if (!Number.isFinite(id)) return;
  ev.preventDefault();
  const onClick = btn.classList.contains("toast-action")
    ? toasts.find((x) => x.id === id)?.action?.onClick
    : undefined;
  dismiss(id);
  onClick?.();
}

function startTimer(t: Toast): void {
  if (t.duration === null || paused || t.leaving) return;
  t.startedAt = Date.now();
  t.timer = setTimeout(() => dismiss(t.id), t.remaining);
}

function stopTimer(t: Toast): void {
  if (t.timer === null) return;
  clearTimeout(t.timer);
  t.timer = null;
  t.remaining = Math.max(600, t.remaining - (Date.now() - t.startedAt));
}

function pauseAll(): void {
  if (paused) return;
  paused = true;
  for (const t of toasts) stopTimer(t);
}

function resumeAll(): void {
  if (!paused) return;
  paused = false;
  for (const t of toasts) startTimer(t);
}

function buildToast(t: Toast): void {
  const el = t.el;
  el.className = `toast toast-${t.type}`;
  el.dataset.toastId = String(t.id);

  const text = document.createElement("span");
  text.className = "toast-text";
  text.textContent = t.message;

  t.countEl.className = "toast-count";
  t.countEl.hidden = true;

  const close = document.createElement("button");
  close.type = "button";
  close.className = "toast-close";
  close.setAttribute("aria-label", "Dismiss message");
  close.title = "Dismiss";
  close.textContent = "×";

  el.append(text, t.countEl);
  if (t.action) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toast-action";
    btn.textContent = t.action.label;
    el.append(btn);
  }
  el.append(close);
}

function trim(): void {
  const alive = toasts.filter((t) => !t.leaving);
  for (let i = 0; i < alive.length - MAX_VISIBLE; i += 1) {
    dismiss(alive[i].id);
  }
}

function show(type: FlashType, message: string, opts: NoticeOptions = {}): number {
  const text = message.trim();
  if (!text) return -1;
  if (type === "error" && errorsSuppressed) return -1;
  if (type !== "error") errorsSuppressed = false;

  const existing = toasts.find(
    (t) => !t.leaving && t.type === type && t.message === text && !t.action,
  );
  if (existing) {
    existing.count += 1;
    existing.countEl.textContent = `×${existing.count}`;
    existing.countEl.hidden = false;
    stopTimer(existing);
    existing.remaining = existing.duration ?? 0;
    startTimer(existing);
    announce(type, text);
    return existing.id;
  }

  seq += 1;
  const duration = opts.duration !== undefined ? opts.duration : durationFor(type, text, !!opts.action);
  const t: Toast = {
    id: seq,
    type,
    message: text,
    el: document.createElement("div"),
    countEl: document.createElement("span"),
    count: 1,
    duration,
    remaining: duration ?? 0,
    startedAt: Date.now(),
    timer: null,
    leaving: false,
    action: opts.action,
  };
  buildToast(t);
  toasts.push(t);
  ensureHost().appendChild(t.el);
  // Next frame so the enter transition runs from the initial state.
  requestAnimationFrame(() => t.el.classList.add("is-shown"));
  trim();
  startTimer(t);
  announce(type, text);
  return t.id;
}

function dismiss(id: number): void {
  const idx = toasts.findIndex((t) => t.id === id);
  if (idx < 0) return;
  const t = toasts[idx];
  if (t.leaving) return;
  stopTimer(t);
  t.leaving = true;
  t.el.classList.add("is-leaving");
  t.el.classList.remove("is-shown");
  setTimeout(() => {
    t.el.remove();
    const i = toasts.indexOf(t);
    if (i >= 0) toasts.splice(i, 1);
  }, EXIT_MS);
}

function dismissAll(): void {
  for (const t of [...toasts]) dismiss(t.id);
}

/**
 * After a session expiry every in-flight request fails; suppress the resulting
 * error toasts so only the "session timed out" banner is shown.
 */
function setErrorsSuppressed(value: boolean): void {
  errorsSuppressed = value;
}

export const notify = {
  show,
  success: (message: string, opts?: NoticeOptions) => show("success", message, opts),
  info: (message: string, opts?: NoticeOptions) => show("info", message, opts),
  error: (message: string, opts?: NoticeOptions) => show("error", message, opts),
  dismiss,
  dismissAll,
  setErrorsSuppressed,
};
