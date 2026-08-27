/**
 * Calendars + datetime-picker data-action router (onAction split Step 5).
 * Owns: cal list/modals, month nav, events, all dt-* actions, share revoke, export-cal.
 */
import { api } from "../../api";
import {
  convertAllDaySpanToTimed,
  convertTimedSpanToAllDay,
  defaultTimedRange,
  formatLocalDtValue,
  parseDtParts,
  parseYmd,
  ymd,
} from "../datetime";
import { syncOpenItemFormsBeforeDtRender } from "../datetimeSync";
import type { AppOrchestrator } from "../orchestrator";
import { readRepeatFromForm } from "./eventModal";
import { persistCalendarSelection } from "./selectionPersist";

/**
 * Handle calendar-tab and shared datetime-picker actions.
 * Returns true if the action was recognized (including early no-ops).
 */
export async function handleCalendarsAction(
  o: AppOrchestrator,
  action: string,
  t: HTMLElement,
  ev: Event,
): Promise<boolean> {
  const { state, root, render, setFlash, clearFlash } = o;

  if (action === "toggle-cal") {
    // Checkbox only — toggle month-grid visibility (must not be blocked by stopPropagation)
    const id = Number(t.dataset.id);
    if (!Number.isFinite(id)) return true;
    ev.stopPropagation();
    o.toggleCalendarSelected(id);
    state.calendarSelectionSeeded = true;
    state.busy = true;
    clearFlash();
    render();
    try {
      await o.loadMonthEvents();
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Failed to load calendar");
    } finally {
      state.busy = false;
      render();
    }
    return true;
  }

  if (action === "select-cal") {
    // Row click: ensure visible + set as primary for new events (do not toggle off)
    const id = Number(t.dataset.id);
    if (!Number.isFinite(id)) return true;
    if (!state.selectedIds.includes(id)) {
      state.selectedIds = [...state.selectedIds, id];
    }
    state.selectedId = id;
    state.calendarSelectionSeeded = true;
    persistCalendarSelection(state);
    state.busy = true;
    clearFlash();
    render();
    try {
      await o.loadMonthEvents();
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Failed to load calendar");
    } finally {
      state.busy = false;
      render();
    }
    return true;
  }

  if (action === "edit-cal") {
    const id = Number(t.dataset.id);
    if (!Number.isFinite(id)) return true;
    const cal = state.calendars.find((c) => c.id === id && c.canShare);
    if (!cal) return true;
    state.selectedId = id;
    if (!state.selectedIds.includes(id)) {
      state.selectedIds = [...state.selectedIds, id];
    }
    persistCalendarSelection(state);
    state.calModalOpen = true;
    state.deleteConfirmId = null;
    state.busy = true;
    clearFlash();
    render();
    try {
      await o.loadShares(id);
      await o.loadMonthEvents();
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Failed to open calendar");
    } finally {
      state.busy = false;
      render();
    }
    return true;
  }

  if (action === "close-cal-modal") {
    state.calModalOpen = false;
    render();
    return true;
  }

  if (action === "open-create-cal-modal") {
    state.createCalModalOpen = true;
    state.calModalOpen = false;
    state.deleteConfirmId = null;
    clearFlash();
    render();
    return true;
  }

  if (action === "close-create-cal-modal") {
    state.createCalModalOpen = false;
    clearFlash();
    render();
    return true;
  }

  if (action === "delete-cal") {
    const id = Number(t.dataset.id);
    if (!Number.isFinite(id)) return true;
    const cal = state.calendars.find((c) => c.id === id && c.canShare);
    if (!cal) return true;
    state.deleteConfirmId = id;
    state.calModalOpen = false;
    clearFlash();
    render();
    return true;
  }

  if (action === "cancel-delete-cal") {
    state.deleteConfirmId = null;
    render();
    return true;
  }

  if (action === "confirm-delete-cal") {
    const id = Number(t.dataset.id);
    const cb = root.querySelector<HTMLInputElement>("#delete-cal-confirm");
    if (!Number.isFinite(id) || !cb?.checked) return true;
    state.busy = true;
    clearFlash();
    render();
    try {
      await api.deleteCalendar(id);
      if (state.selectedId === id) state.selectedId = null;
      state.selectedIds = state.selectedIds.filter((x) => x !== id);
      state.deleteConfirmId = null;
      state.calModalOpen = false;
      state.shares = [];
      state.monthEvents = [];
      await o.loadHome();
      if (state.selectedId === null) {
        const def = o.pickDefaultCalendar();
        if (def) {
          state.selectedId = def.id;
          if (!state.selectedIds.includes(def.id)) {
            state.selectedIds = [...state.selectedIds, def.id];
          }
          await o.loadMonthEvents();
        } else if (state.selectedIds.length > 0) {
          state.selectedId = state.selectedIds[0];
          await o.loadMonthEvents();
        }
      }
      setFlash("success", "Calendar deleted");
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Delete failed");
    } finally {
      state.busy = false;
      render();
    }
    return true;
  }

  if (action === "cal-view") {
    const view = t.dataset.view;
    if (view !== "month" && view !== "week" && view !== "agenda") return true;
    state.calView = view;
    if (view === "week") state.weekScrollToDayStart = true;
    persistCalendarSelection(state);
    state.monthExpandDay = null;
    state.busy = true;
    render();
    try {
      await o.loadMonthEvents();
    } finally {
      state.busy = false;
      render();
    }
    return true;
  }

  if (action === "month-today") {
    const n = new Date();
    state.monthCursor = { y: n.getFullYear(), m: n.getMonth() };
    state.calFocusDay = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}-${String(n.getDate()).padStart(2, "0")}`;
    state.monthExpandDay = null;
    state.busy = true;
    render();
    try {
      await o.loadMonthEvents();
    } finally {
      state.busy = false;
      render();
    }
    return true;
  }

  if (action === "month-prev" || action === "month-next") {
    const delta = action === "month-prev" ? -1 : 1;
    const view = state.calView;
    if (view === "week") {
      const cur = parseYmd(state.calFocusDay) ?? new Date();
      cur.setDate(cur.getDate() + delta * 7);
      state.calFocusDay = ymd(cur);
      state.monthCursor = { y: cur.getFullYear(), m: cur.getMonth() };
    } else if (view === "agenda") {
      const cur = parseYmd(state.calFocusDay) ?? new Date();
      cur.setDate(cur.getDate() + delta * 7);
      state.calFocusDay = ymd(cur);
      state.monthCursor = { y: cur.getFullYear(), m: cur.getMonth() };
    } else {
      const d = new Date(state.monthCursor.y, state.monthCursor.m + delta, 1);
      state.monthCursor = { y: d.getFullYear(), m: d.getMonth() };
      state.calFocusDay = ymd(d);
    }
    state.monthExpandDay = null;
    state.busy = true;
    render();
    try {
      await o.loadMonthEvents();
    } finally {
      state.busy = false;
      render();
    }
    return true;
  }

  if (action === "open-event") {
    ev.stopPropagation();
    const instanceId = Number(t.dataset.instance);
    const uri = t.dataset.uri ?? "";
    if (!Number.isFinite(instanceId) || !uri) return true;
    state.busy = true;
    clearFlash();
    render();
    try {
      const res = await api.getEvent(instanceId, uri);
      state.editingEvent = {
        ...res.event,
        repeat: res.event.repeat ?? o.defaultRepeat(),
      };
      state.creatingEvent = false;
      state.eventModalOpen = true;
      state.eventDtPicker = null;
      state.calModalOpen = false;
      state.deleteConfirmId = null;
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Failed to open event");
    } finally {
      state.busy = false;
      render();
    }
    return true;
  }

  if (action === "open-event-day") {
    ev.stopPropagation();
    const day = t.dataset.day ?? "";
    state.monthExpandDay = state.monthExpandDay === day ? null : day;
    render();
    return true;
  }

  if (action === "new-event-day") {
    // Ignore if click originated on an event chip / +more (bubbling)
    const raw = ev.target as HTMLElement | null;
    if (raw?.closest?.(".month-event, .month-event-more")) return true;
    const day = t.dataset.day ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return true;
    if (state.selectedId === null) {
      setFlash("error", "Select a calendar first");
      render();
      return true;
    }
    const cal = state.calendars.find((c) => c.id === state.selectedId);
    if (!cal || cal.readOnly || !(cal.canShare || cal.access === "readwrite")) {
      setFlash("error", "This calendar is read-only");
      render();
      return true;
    }
    state.creatingEvent = true;
    state.editingEvent = o.blankEventForDay(day, state.selectedId);
    state.eventModalOpen = true;
    state.eventDtPicker = null;
    state.calModalOpen = false;
    state.deleteConfirmId = null;
    clearFlash();
    render();
    return true;
  }

  if (action === "new-event-slot") {
    const raw = ev.target as HTMLElement | null;
    if (raw?.closest?.(".week-event")) return true;
    const day = t.dataset.day ?? "";
    const hour = Number(t.dataset.hour);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isInteger(hour) || hour < 0 || hour > 23) {
      return true;
    }
    if (state.selectedId === null) {
      setFlash("error", "Select a calendar first");
      render();
      return true;
    }
    const cal = state.calendars.find((c) => c.id === state.selectedId);
    if (!cal || cal.readOnly || !(cal.canShare || cal.access === "readwrite")) {
      setFlash("error", "This calendar is read-only");
      render();
      return true;
    }
    state.creatingEvent = true;
    state.editingEvent = o.blankEventForSlot(day, hour, state.selectedId);
    state.eventModalOpen = true;
    state.eventDtPicker = null;
    state.calModalOpen = false;
    state.deleteConfirmId = null;
    clearFlash();
    render();
    return true;
  }

  if (action === "close-event-modal") {
    state.eventModalOpen = false;
    state.editingEvent = null;
    state.creatingEvent = false;
    state.eventDtPicker = null;
    clearFlash();
    render();
    return true;
  }

  if (action === "dt-open") {
    const field = t.dataset.dtField || "";
    if (!field) return true;
    syncOpenItemFormsBeforeDtRender(o);
    if (state.eventDtPicker?.field === field) {
      state.eventDtPicker = null;
    } else {
      const dateOnly = t.dataset.dtDateOnly === "1";
      const allowClear = t.dataset.dtClear !== "0";
      const name = t.dataset.dtName || field;
      let raw = o.getDtFieldCurrentValue(field);
      if (!raw && (field === "due" || field === "dtstart" || field === "bulk-due")) {
        raw = defaultTimedRange().start;
      }
      const parts = parseDtParts(raw || ymd(new Date()));
      const [ys, ms] = parts.date.split("-").map(Number);
      state.eventDtPicker = {
        field,
        viewY: ys,
        viewM: (ms || 1) - 1,
        dateOnly,
        allowClear,
        name,
      };
    }
    render();
    return true;
  }

  if (action === "dt-month-prev" || action === "dt-month-next") {
    if (!state.eventDtPicker) return true;
    syncOpenItemFormsBeforeDtRender(o);
    const delta = action === "dt-month-prev" ? -1 : 1;
    const d = new Date(state.eventDtPicker.viewY, state.eventDtPicker.viewM + delta, 1);
    state.eventDtPicker = { ...state.eventDtPicker, viewY: d.getFullYear(), viewM: d.getMonth() };
    render();
    return true;
  }

  if (action === "dt-set-month") {
    if (!state.eventDtPicker) return true;
    syncOpenItemFormsBeforeDtRender(o);
    const sel = t as HTMLSelectElement;
    const m = Number(sel.value);
    if (!Number.isFinite(m) || m < 0 || m > 11) return true;
    state.eventDtPicker = { ...state.eventDtPicker, viewM: m };
    render();
    return true;
  }

  if (action === "dt-set-year") {
    if (!state.eventDtPicker) return true;
    syncOpenItemFormsBeforeDtRender(o);
    const sel = t as HTMLSelectElement;
    const y = Number(sel.value);
    if (!Number.isFinite(y) || y < 1 || y > 9999) return true;
    state.eventDtPicker = { ...state.eventDtPicker, viewY: y };
    render();
    return true;
  }

  if (action === "dt-pick-day") {
    if (!state.eventDtPicker) return true;
    const field = state.eventDtPicker.field;
    const day = t.dataset.day ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return true;
    syncOpenItemFormsBeforeDtRender(o);
    const dateOnly = state.eventDtPicker.dateOnly;
    if (dateOnly) {
      o.setDtFieldValue(field, day);
      state.eventDtPicker = null;
    } else {
      const cur = o.getDtFieldCurrentValue(field);
      const hm = parseDtParts(cur || defaultTimedRange(day).start).hm;
      o.setDtFieldValue(field, `${day}T${hm}`);
      // Keep open so user can pick time; update month view
      state.eventDtPicker = {
        ...state.eventDtPicker,
        viewY: Number(day.slice(0, 4)),
        viewM: Number(day.slice(5, 7)) - 1,
      };
    }
    // Event start/end: bump end if needed when changing start day
    if (field === "start" && state.editingEvent && !dateOnly && state.editingEvent.end) {
      const s = new Date(String(state.editingEvent.start));
      const e = new Date(String(state.editingEvent.end));
      if (!Number.isNaN(s.getTime()) && !Number.isNaN(e.getTime()) && e <= s) {
        o.setDtFieldValue("end", formatLocalDtValue(new Date(s.getTime() + 60 * 60 * 1000)));
      }
    }
    render();
    return true;
  }

  if (action === "dt-pick-time") {
    if (!state.eventDtPicker || state.eventDtPicker.dateOnly) return true;
    const field = state.eventDtPicker.field;
    const hm = t.dataset.hm ?? "";
    if (!/^\d{2}:\d{2}$/.test(hm)) return true;
    syncOpenItemFormsBeforeDtRender(o);
    const cur = o.getDtFieldCurrentValue(field) || defaultTimedRange().start;
    const day = parseDtParts(cur).date;
    const next = `${day}T${hm}`;
    o.setDtFieldValue(field, next);
    if (field === "start" && state.editingEvent) {
      state.editingEvent = { ...state.editingEvent, allDay: false };
      const endCur = state.editingEvent.end ? parseDtParts(String(state.editingEvent.end)) : null;
      const startD = new Date(next);
      if (!endCur || new Date(`${endCur.date}T${endCur.hm}`) <= startD) {
        o.setDtFieldValue("end", formatLocalDtValue(new Date(startD.getTime() + 60 * 60 * 1000)));
      }
    }
    state.eventDtPicker = null;
    render();
    return true;
  }

  if (action === "dt-today") {
    if (!state.eventDtPicker) return true;
    const field = state.eventDtPicker.field;
    syncOpenItemFormsBeforeDtRender(o);
    const today = ymd(new Date());
    if (state.eventDtPicker.dateOnly) {
      o.setDtFieldValue(field, today);
    } else {
      const range = defaultTimedRange(today);
      if (field === "start") {
        o.setDtFieldValue("start", range.start);
        if (state.editingEvent && !state.editingEvent.end) o.setDtFieldValue("end", range.end);
      } else if (field === "end") {
        o.setDtFieldValue("end", range.end);
      } else {
        // due / dtstart / bulk-due
        o.setDtFieldValue(field, range.start);
      }
    }
    state.eventDtPicker = null;
    render();
    return true;
  }

  if (action === "dt-clear") {
    if (!state.eventDtPicker || !state.eventDtPicker.allowClear) return true;
    const field = state.eventDtPicker.field;
    syncOpenItemFormsBeforeDtRender(o);
    o.setDtFieldValue(field, null);
    state.eventDtPicker = null;
    render();
    return true;
  }

  if (action === "event-allday-toggle") {
    if (!state.editingEvent) return true;
    const form = root.querySelector<HTMLFormElement>('[data-form="edit-event"]');
    const goingAllDay = (t as HTMLInputElement).checked;
    if (form) {
      const fd = new FormData(form);
      const startRaw = String(fd.get("start") ?? state.editingEvent.start ?? "");
      const endRaw = String(fd.get("end") ?? state.editingEvent.end ?? "") || null;
      let start = startRaw;
      let end = endRaw;
      if (goingAllDay) {
        const conv = convertTimedSpanToAllDay(startRaw, endRaw);
        start = conv.start;
        end = conv.end;
      } else {
        const sDate = startRaw.slice(0, 10);
        const eDate = (endRaw || startRaw).slice(0, 10);
        const conv = convertAllDaySpanToTimed(sDate, eDate);
        start = conv.start;
        end = conv.end;
      }
      state.editingEvent = {
        ...state.editingEvent,
        summary: String(fd.get("summary") ?? state.editingEvent.summary),
        description: String(fd.get("description") ?? state.editingEvent.description),
        location: String(fd.get("location") ?? state.editingEvent.location),
        instanceId: Number(fd.get("instanceId")) || state.editingEvent.instanceId,
        allDay: goingAllDay,
        start,
        end,
        repeat: readRepeatFromForm(fd),
      };
    } else {
      state.editingEvent = { ...state.editingEvent, allDay: goingAllDay };
    }
    state.eventDtPicker = null;
    render();
    return true;
  }

  if (action === "event-repeat-freq" || action === "event-repeat-end") {
    if (!state.editingEvent) return true;
    const form = root.querySelector<HTMLFormElement>('[data-form="edit-event"]');
    if (!form) return true;
    const fd = new FormData(form);
    // Keep checkbox state in sync when re-rendering
    const allDayEl = form.querySelector<HTMLInputElement>('input[name="allDay"]');
    const nextRepeat = readRepeatFromForm(fd);
    state.editingEvent = {
      ...state.editingEvent,
      summary: String(fd.get("summary") ?? state.editingEvent.summary),
      description: String(fd.get("description") ?? state.editingEvent.description),
      location: String(fd.get("location") ?? state.editingEvent.location),
      instanceId: Number(fd.get("instanceId")) || state.editingEvent.instanceId,
      allDay: allDayEl?.checked ?? state.editingEvent.allDay,
      start: String(fd.get("start") ?? state.editingEvent.start ?? ""),
      end: String(fd.get("end") ?? state.editingEvent.end ?? "") || null,
      repeat: nextRepeat,
      hasRrule: !!String(fd.get("repeatFreq") ?? "").trim(),
    };
    if (
      nextRepeat.freq &&
      nextRepeat.endMode === "until" &&
      state.eventDtPicker?.field === "end"
    ) {
      state.eventDtPicker = null;
    }
    render();
    return true;
  }

  if (action === "delete-event") {
    if (!state.editingEvent || !state.editingEvent.canWrite || state.creatingEvent) return true;
    const title = String(state.editingEvent.summary || "this event").trim() || "this event";
    state.confirmDelete = {
      scope: "event",
      title: "Delete event",
      message: `Delete “${title}”?`,
      detail: "CalDAV clients will sync the removal. This cannot be undone.",
    };
    render();
    return true;
  }

  if (action === "revoke") {
    const href = t.dataset.href ?? "";
    if (!href || state.selectedId === null) return true;
    state.confirmDelete = {
      scope: "revoke-share",
      title: "Revoke share",
      message: "Revoke access for this user?",
      detail: "They will lose this calendar until you share it again.",
      href,
    };
    render();
    return true;
  }


  if (action === "export-cal") {
    ev.stopPropagation();
    const idRaw = t.dataset.id;
    const calId =
      idRaw !== undefined && idRaw !== ""
        ? Number(idRaw)
        : state.selectedId;
    if (calId === null || Number.isNaN(calId)) return true;
    state.busy = true;
    clearFlash();
    render();
    try {
      const { blob, filename } = await api.exportCalendar(calId);
      const outcome = await o.saveBlobAsFile(blob, filename);
      if (outcome === "cancelled") {
        setFlash("info", "Export cancelled");
      } else if (outcome === "saved") {
        setFlash("success", `Saved ${filename}`);
      } else {
        setFlash("success", `Download started: ${filename}`);
      }
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Export failed");
    } finally {
      state.busy = false;
      render();
    }
    return true;
  }

  return false;
}
