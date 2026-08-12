/**
 * Central data-action dispatcher (Phase 8 extract from app.ts).
 */
import { api } from "../api";
import { log } from "../log";
import {
  convertAllDaySpanToTimed,
  convertTimedSpanToAllDay,
  defaultTimedRange,
  formatLocalDtValue,
  parseDtParts,
  ymd,
} from "./datetime";
import { parseTabId } from "./routing";
import type { AppOrchestrator } from "./orchestrator";
import * as admin from "./admin";
import * as files from "./files";
import * as calendars from "./calendars";
import * as contacts from "./contacts";

export async function onAction(o: AppOrchestrator, ev: Event) {
  const { state, root, render, setFlash, clearFlash } = o;

  const t = (ev.target as HTMLElement).closest<HTMLElement>("[data-action]");
  if (!t) return;
  const action = t.dataset.action;
  if (action) {
    log.debug(`action:${action}`, {
      id: t.dataset.id,
      tab: t.dataset.tab,
      uri: t.dataset.uri,
    });
  }
  if (action === "close-import-progress") {
    if (state.importProgress && (state.importProgress.phase === "done" || state.importProgress.phase === "error")) {
      o.closeImportProgress();
    }
    return;
  }
  if (action === "logout") {
    state.busy = true;
    log.event("logout");
    try {
      await api.logout();
    } catch {
      /* ignore */
    }
    o.clearPortalSessionState();
    clearFlash();
    render();
    return;
  }
  if (action === "select-cal" || action === "toggle-cal") {
    const id = Number(t.dataset.id);
    if (!Number.isFinite(id)) return;
    o.toggleCalendarSelected(id);
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
    return;
  }
  if (action === "edit-cal") {
    const id = Number(t.dataset.id);
    if (!Number.isFinite(id)) return;
    const cal = state.calendars.find((c) => c.id === id && c.canShare);
    if (!cal) return;
    state.selectedId = id;
    if (!state.selectedIds.includes(id)) {
      state.selectedIds = [...state.selectedIds, id];
    }
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
    return;
  }
  if (action === "close-cal-modal") {
    state.calModalOpen = false;
    render();
    return;
  }
  if (action === "open-create-cal-modal") {
    state.createCalModalOpen = true;
    state.calModalOpen = false;
    state.deleteConfirmId = null;
    clearFlash();
    render();
    return;
  }
  if (action === "close-create-cal-modal") {
    state.createCalModalOpen = false;
    clearFlash();
    render();
    return;
  }
  if (action === "delete-cal") {
    const id = Number(t.dataset.id);
    if (!Number.isFinite(id)) return;
    const cal = state.calendars.find((c) => c.id === id && c.canShare);
    if (!cal) return;
    state.deleteConfirmId = id;
    state.calModalOpen = false;
    clearFlash();
    render();
    return;
  }
  if (action === "cancel-delete-cal") {
    state.deleteConfirmId = null;
    render();
    return;
  }
  if (action === "confirm-delete-cal") {
    const id = Number(t.dataset.id);
    const cb = root.querySelector<HTMLInputElement>("#delete-cal-confirm");
    if (!Number.isFinite(id) || !cb?.checked) return;
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
    return;
  }
  if (action === "month-today") {
    const n = new Date();
    state.monthCursor = { y: n.getFullYear(), m: n.getMonth() };
    state.monthExpandDay = null;
    state.busy = true;
    render();
    try {
      await o.loadMonthEvents();
    } finally {
      state.busy = false;
      render();
    }
    return;
  }
  if (action === "month-prev" || action === "month-next") {
    const delta = action === "month-prev" ? -1 : 1;
    const d = new Date(state.monthCursor.y, state.monthCursor.m + delta, 1);
    state.monthCursor = { y: d.getFullYear(), m: d.getMonth() };
    state.monthExpandDay = null;
    state.busy = true;
    render();
    try {
      await o.loadMonthEvents();
    } finally {
      state.busy = false;
      render();
    }
    return;
  }
  if (action === "open-event") {
    ev.stopPropagation();
    const instanceId = Number(t.dataset.instance);
    const uri = t.dataset.uri ?? "";
    if (!Number.isFinite(instanceId) || !uri) return;
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
    return;
  }
  if (action === "open-event-day") {
    ev.stopPropagation();
    const day = t.dataset.day ?? "";
    state.monthExpandDay = state.monthExpandDay === day ? null : day;
    render();
    return;
  }
  if (action === "new-event-day") {
    // Ignore if click originated on an event chip / +more (bubbling)
    const raw = ev.target as HTMLElement | null;
    if (raw?.closest?.(".month-event, .month-event-more")) return;
    const day = t.dataset.day ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
    if (state.selectedId === null) {
      setFlash("error", "Select a calendar first");
      render();
      return;
    }
    const cal = state.calendars.find((c) => c.id === state.selectedId);
    if (!cal || cal.readOnly || !(cal.canShare || cal.access === "readwrite")) {
      setFlash("error", "This calendar is read-only");
      render();
      return;
    }
    state.creatingEvent = true;
    state.editingEvent = o.blankEventForDay(day, state.selectedId);
    state.eventModalOpen = true;
    state.eventDtPicker = null;
    state.calModalOpen = false;
    state.deleteConfirmId = null;
    clearFlash();
    render();
    return;
  }
  if (action === "close-event-modal") {
    state.eventModalOpen = false;
    state.editingEvent = null;
    state.creatingEvent = false;
    state.eventDtPicker = null;
    clearFlash();
    render();
    return;
  }
  /** Keep draft form fields when DT/date picker re-renders the page. */
  function syncOpenItemFormsBeforeDtRender(): void {
    const eventForm = root.querySelector<HTMLFormElement>('[data-form="edit-event"]');
    if (eventForm && state.editingEvent) o.syncEditingEventFromForm(eventForm);
    const taskForm = root.querySelector<HTMLFormElement>('[data-form="task"]');
    if (taskForm && state.editingTask) o.syncEditingTaskFromForm(taskForm);
    const noteForm = root.querySelector<HTMLFormElement>('[data-form="note"]');
    if (noteForm && state.editingNote) o.syncEditingNoteFromForm(noteForm);
    // Contact Birthday (and any future contact date fields)
    if (state.editingContact) {
      contacts.syncContactFormFromDom(o.contactsHost);
    }
  }

  if (action === "dt-open") {
    const field = t.dataset.dtField || "";
    if (!field) return;
    syncOpenItemFormsBeforeDtRender();
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
    return;
  }
  if (action === "dt-month-prev" || action === "dt-month-next") {
    if (!state.eventDtPicker) return;
    syncOpenItemFormsBeforeDtRender();
    const delta = action === "dt-month-prev" ? -1 : 1;
    const d = new Date(state.eventDtPicker.viewY, state.eventDtPicker.viewM + delta, 1);
    state.eventDtPicker = { ...state.eventDtPicker, viewY: d.getFullYear(), viewM: d.getMonth() };
    render();
    return;
  }
  if (action === "dt-set-month") {
    if (!state.eventDtPicker) return;
    syncOpenItemFormsBeforeDtRender();
    const sel = t as HTMLSelectElement;
    const m = Number(sel.value);
    if (!Number.isFinite(m) || m < 0 || m > 11) return;
    state.eventDtPicker = { ...state.eventDtPicker, viewM: m };
    render();
    return;
  }
  if (action === "dt-set-year") {
    if (!state.eventDtPicker) return;
    syncOpenItemFormsBeforeDtRender();
    const sel = t as HTMLSelectElement;
    const y = Number(sel.value);
    if (!Number.isFinite(y) || y < 1 || y > 9999) return;
    state.eventDtPicker = { ...state.eventDtPicker, viewY: y };
    render();
    return;
  }
  if (action === "dt-pick-day") {
    if (!state.eventDtPicker) return;
    const field = state.eventDtPicker.field;
    const day = t.dataset.day ?? "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return;
    syncOpenItemFormsBeforeDtRender();
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
    return;
  }
  if (action === "dt-pick-time") {
    if (!state.eventDtPicker || state.eventDtPicker.dateOnly) return;
    const field = state.eventDtPicker.field;
    const hm = t.dataset.hm ?? "";
    if (!/^\d{2}:\d{2}$/.test(hm)) return;
    syncOpenItemFormsBeforeDtRender();
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
    return;
  }
  if (action === "dt-today") {
    if (!state.eventDtPicker) return;
    const field = state.eventDtPicker.field;
    syncOpenItemFormsBeforeDtRender();
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
    return;
  }
  if (action === "dt-clear") {
    if (!state.eventDtPicker || !state.eventDtPicker.allowClear) return;
    const field = state.eventDtPicker.field;
    syncOpenItemFormsBeforeDtRender();
    o.setDtFieldValue(field, null);
    state.eventDtPicker = null;
    render();
    return;
  }
  if (action === "event-allday-toggle") {
    if (!state.editingEvent) return;
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
        repeat: calendars.readRepeatFromForm(fd),
      };
    } else {
      state.editingEvent = { ...state.editingEvent, allDay: goingAllDay };
    }
    state.eventDtPicker = null;
    render();
    return;
  }
  if (action === "event-repeat-freq" || action === "event-repeat-end") {
    if (!state.editingEvent) return;
    const form = root.querySelector<HTMLFormElement>('[data-form="edit-event"]');
    if (!form) return;
    const fd = new FormData(form);
    // Keep checkbox state in sync when re-rendering
    const allDayEl = form.querySelector<HTMLInputElement>('input[name="allDay"]');
    const nextRepeat = calendars.readRepeatFromForm(fd);
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
    return;
  }
  if (action === "delete-event") {
    if (!state.editingEvent || !state.editingEvent.canWrite || state.creatingEvent) return;
    if (!confirm("Delete this event? CalDAV clients will sync the removal.")) return;
    const inst = state.editingEvent.instanceId;
    const uri = state.editingEvent.uri;
    state.busy = true;
    clearFlash();
    render();
    try {
      await api.deleteEvent(inst, uri);
      state.eventModalOpen = false;
      state.editingEvent = null;
      await o.loadMonthEvents();
      setFlash("success", "Event deleted");
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Delete failed");
    } finally {
      state.busy = false;
      render();
    }
    return;
  }
  if (action === "info") {
    const key = t.dataset.info ?? "";
    o.openInfoModal(key);
    return;
  }
  if (action === "info-close") {
    o.closeInfoModal();
    return;
  }
  if (action === "flash-close") {
    clearFlash();
    render();
    return;
  }
  if (action === "user-menu-toggle") {
    ev.stopPropagation();
    state.userMenuOpen = !state.userMenuOpen;
    render();
    return;
  }
  if (action === "user-menu-close") {
    if (state.userMenuOpen) {
      state.userMenuOpen = false;
      render();
    }
    return;
  }
  if (action === "tab") {
    const tab = parseTabId(t.dataset.tab);
    if (tab) {
      if (tab === "admin") {
        // User menu → Administration: land on Overview
        state.adminPage = "overview";
      }
      await o.activateTab(tab);
    }
    return;
  }
  if (action && action.startsWith("admin-")) {
    if (await admin.handleAdminAction(o.adminHost, action, t, ev)) return;
  }
  // --- Files tab ---
  if (
    action &&
    (action.startsWith("files-") || action === "close-files-upload-progress")
  ) {
    if (await files.handleFilesAction(o.filesHost, action, t, ev)) return;
  }
  if (action === "sort-task" || action === "sort-note") {
    const col = t.dataset.sort || "";
    if (!col) return;
    if (action === "sort-task") {
      if (state.taskSort === col) state.taskOrder = state.taskOrder === "asc" ? "desc" : "asc";
      else {
        state.taskSort = col;
        state.taskOrder = col === "due" || col === "summary" ? "asc" : "desc";
      }
      state.busy = true;
      render();
      try {
        await o.loadTasks();
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Sort failed");
      } finally {
        state.busy = false;
        render();
      }
    } else {
      if (state.noteSort === col) state.noteOrder = state.noteOrder === "asc" ? "desc" : "asc";
      else {
        state.noteSort = col;
        state.noteOrder = "asc";
      }
      state.busy = true;
      render();
      try {
        await o.loadNotes();
      } catch (e) {
        setFlash("error", e instanceof Error ? e.message : "Sort failed");
      } finally {
        state.busy = false;
        render();
      }
    }
    return;
  }
  if (action === "select-task") {
    // Ignore clicks on the checkbox cell
    if ((ev.target as HTMLElement).closest("[data-stop-row], .task-check")) return;
    const instanceId = Number(t.dataset.instance);
    const uri = t.dataset.uri ?? "";
    if (!Number.isFinite(instanceId) || !uri) return;
    const found = state.tasks.find((x) => x.instanceId === instanceId && x.uri === uri) ?? null;
    state.creatingTask = false;
    state.selectedTaskKey = o.itemKey(instanceId, uri);
    state.editingTask = found ? { ...found } : null;
    clearFlash();
    render();
    return;
  }
  if (action === "task-check") {
    ev.preventDefault();
    ev.stopPropagation();
    const instanceId = Number(t.dataset.instance);
    const uri = t.dataset.uri ?? "";
    if (!Number.isFinite(instanceId) || !uri) return;
    const key = o.itemKey(instanceId, uri);
    const task = state.tasks.find((x) => o.itemKey(x.instanceId, x.uri) === key);
    if (!task || !task.canWrite || task.readOnly) return;
    if (state.checkedTaskKeys.includes(key)) {
      state.checkedTaskKeys = state.checkedTaskKeys.filter((k) => k !== key);
    } else {
      state.checkedTaskKeys = [...state.checkedTaskKeys, key];
    }
    render();
    return;
  }
  if (action === "task-select-all") {
    ev.preventDefault();
    const writable = state.tasks.filter((x) => x.canWrite && !x.readOnly);
    const allOn =
      writable.length > 0 &&
      writable.every((x) => state.checkedTaskKeys.includes(o.itemKey(x.instanceId, x.uri)));
    if (allOn) {
      state.checkedTaskKeys = [];
    } else {
      state.checkedTaskKeys = writable.map((x) => o.itemKey(x.instanceId, x.uri));
    }
    render();
    return;
  }
  if (action === "bulk-task-clear") {
    state.checkedTaskKeys = [];
    render();
    return;
  }
  if (
    action === "bulk-task-status" ||
    action === "bulk-task-due" ||
    action === "bulk-task-clear-due" ||
    action === "bulk-task-percent" ||
    action === "bulk-task-delete"
  ) {
    void o.runBulkTaskAction(action);
    return;
  }
  if (action === "select-note") {
    const instanceId = Number(t.dataset.instance);
    const uri = t.dataset.uri ?? "";
    if (!Number.isFinite(instanceId) || !uri) return;
    const found = state.notes.find((x) => x.instanceId === instanceId && x.uri === uri) ?? null;
    state.creatingNote = false;
    state.selectedNoteKey = o.itemKey(instanceId, uri);
    state.editingNote = found ? { ...found } : null;
    clearFlash();
    render();
    return;
  }
  if (action === "new-task") {
    state.creatingTask = true;
    state.selectedTaskKey = null;
    state.editingTask = {
      uri: "",
      instanceId: state.taskCalendars[0]?.id ?? 0,
      calendarId: 0,
      calendarName: "",
      calendarUri: "",
      uid: "",
      parentUid: null,
      summary: "",
      description: "",
      status: "NEEDS-ACTION",
      due: null,
      priority: 0,
      percent: 0,
      completed: null,
      lastmodified: 0,
      readOnly: false,
      canWrite: true,
    };
    clearFlash();
    render();
    return;
  }
  if (action === "new-subtask") {
    if (!state.editingTask || state.creatingTask || !state.editingTask.uid) return;
    if (!state.editingTask.canWrite) return;
    const parent = state.editingTask;
    state.creatingTask = true;
    state.selectedTaskKey = null;
    state.editingTask = {
      uri: "",
      instanceId: parent.instanceId,
      calendarId: parent.calendarId,
      calendarName: parent.calendarName,
      calendarUri: parent.calendarUri,
      uid: "",
      parentUid: parent.uid,
      summary: "",
      description: "",
      status: "NEEDS-ACTION",
      due: null,
      priority: 0,
      percent: 0,
      completed: null,
      lastmodified: 0,
      readOnly: false,
      canWrite: true,
    };
    clearFlash();
    render();
    return;
  }
  if (action === "new-note") {
    state.creatingNote = true;
    state.selectedNoteKey = null;
    state.editingNote = {
      uri: "",
      instanceId: state.noteCalendars[0]?.id ?? 0,
      calendarId: 0,
      calendarName: "",
      calendarUri: "",
      summary: "",
      description: "",
      dtstart: new Date().toISOString(),
      lastmodified: 0,
      readOnly: false,
      canWrite: true,
    };
    clearFlash();
    render();
    return;
  }
  if (action === "cancel-task") {
    state.creatingTask = false;
    state.editingTask = null;
    state.selectedTaskKey = null;
    render();
    return;
  }
  if (action === "cancel-note") {
    state.creatingNote = false;
    state.editingNote = null;
    state.selectedNoteKey = null;
    render();
    return;
  }
  if (action === "delete-task") {
    if (!state.editingTask || state.creatingTask) return;
    if (!confirm("Delete this task? CalDAV clients will sync the removal.")) return;
    state.busy = true;
    clearFlash();
    render();
    try {
      await api.deleteTask(state.editingTask.instanceId, state.editingTask.uri);
      state.selectedTaskKey = null;
      state.editingTask = null;
      await o.loadTasks();
      setFlash("success", "Task deleted");
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Delete failed");
    } finally {
      state.busy = false;
      render();
    }
    return;
  }
  if (action === "delete-note") {
    if (!state.editingNote || state.creatingNote) return;
    if (!confirm("Delete this note? CalDAV clients will sync the removal.")) return;
    state.busy = true;
    clearFlash();
    render();
    try {
      await api.deleteNote(state.editingNote.instanceId, state.editingNote.uri);
      state.selectedNoteKey = null;
      state.editingNote = null;
      await o.loadNotes();
      setFlash("success", "Note deleted");
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Delete failed");
    } finally {
      state.busy = false;
      render();
    }
    return;
  }
  if (action === "select-ab") {
    const id = Number(t.dataset.id);
    if (!Number.isFinite(id)) return;
    state.selectedAbId = id;
    state.abModalOpen = false;
    state.selectedContactUri = null;
    state.editingContact = null;
    state.creatingContact = false;
    state.contactModalOpen = false;
    state.contactSearch = "";
    // Clear list immediately so we never paint previous AB contacts with the new AB id
    // (that caused /addressbooks/{newId}/contacts/{oldUri}/photo → 404).
    state.contacts = [];
    state.photoPreview = null;
    state.photoBase64Pending = null;
    state.removePhotoPending = false;
    clearFlash();
    state.busy = true;
    render();
    try {
      await o.loadContacts(id);
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Failed to load contacts");
    } finally {
      state.busy = false;
      render();
    }
    return;
  }
  if (action === "edit-ab") {
    ev.stopPropagation();
    const id = Number(t.dataset.id);
    if (!Number.isFinite(id)) return;
    const ab = state.addressBooks.find((a) => a.id === id);
    if (!ab) return;
    const switched = state.selectedAbId !== id;
    state.selectedAbId = id;
    state.abModalOpen = true;
    state.contactModalOpen = false;
    clearFlash();
    if (switched) {
      state.selectedContactUri = null;
      state.editingContact = null;
      state.creatingContact = false;
      state.contactSearch = "";
      state.contacts = [];
      state.photoPreview = null;
      state.photoBase64Pending = null;
      state.removePhotoPending = false;
    }
    state.busy = true;
    render();
    try {
      if (switched) {
        await o.loadContacts(id);
      }
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Failed to open address book");
    } finally {
      state.busy = false;
      render();
    }
    return;
  }
  if (action === "close-ab-modal") {
    state.abModalOpen = false;
    render();
    return;
  }
  if (action === "select-contact") {
    const uri = t.dataset.uri ?? "";
    if (!uri) return;
    // Avoid intermediate busy re-render (that jumps scroll); load then paint once.
    clearFlash();
    try {
      await o.openContact(uri);
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Failed to load contact");
    }
    render();
    return;
  }
  if (action === "new-contact") {
    if (state.selectedAbId === null) return;
    o.startNewContact();
    clearFlash();
    render();
    return;
  }
  if (action === "cancel-contact" || action === "close-contact-modal") {
    state.creatingContact = false;
    state.contactModalOpen = false;
    state.editingContact = null;
    state.selectedContactUri = null;
    state.photoPreview = null;
    state.photoBase64Pending = null;
    state.removePhotoPending = false;
    state.eventDtPicker = null;
    clearFlash();
    render();
    return;
  }
  if (action === "add-email" || action === "add-phone" || action === "add-custom") {
    if (!state.editingContact) return;
    contacts.syncContactFormFromDom(o.contactsHost);
    if (!Array.isArray(state.editingContact.emails)) state.editingContact.emails = [""];
    if (!Array.isArray(state.editingContact.phones)) {
      state.editingContact.phones = [{ type: "cell", value: "" }];
    }
    if (!Array.isArray(state.editingContact.custom)) state.editingContact.custom = [];
    if (action === "add-email") {
      if (state.editingContact.emails.length < 10) state.editingContact.emails.push("");
    } else if (action === "add-phone") {
      if (state.editingContact.phones.length < 10) {
        state.editingContact.phones.push({ type: "other", value: "" });
      }
    } else if (state.editingContact.custom.length < 30) {
      state.editingContact.custom.push({ label: "", value: "" });
    }
    render();
    return;
  }
  if (action === "remove-email") {
    if (!state.editingContact) return;
    contacts.syncContactFormFromDom(o.contactsHost);
    const idx = Number(t.dataset.idx);
    if (!Number.isFinite(idx)) return;
    const list = Array.isArray(state.editingContact.emails) ? state.editingContact.emails : [""];
    state.editingContact.emails = list.filter((_, i) => i !== idx);
    if (state.editingContact.emails.length === 0) state.editingContact.emails = [""];
    render();
    return;
  }
  if (action === "remove-phone") {
    if (!state.editingContact) return;
    contacts.syncContactFormFromDom(o.contactsHost);
    const idx = Number(t.dataset.idx);
    if (!Number.isFinite(idx)) return;
    const list = Array.isArray(state.editingContact.phones)
      ? state.editingContact.phones
      : [{ type: "cell", value: "" }];
    state.editingContact.phones = list.filter((_, i) => i !== idx);
    if (state.editingContact.phones.length === 0) {
      state.editingContact.phones = [{ type: "cell", value: "" }];
    }
    render();
    return;
  }
  if (action === "remove-custom") {
    if (!state.editingContact) return;
    contacts.syncContactFormFromDom(o.contactsHost);
    const idx = Number(t.dataset.idx);
    if (!Number.isFinite(idx)) return;
    state.editingContact.custom = (Array.isArray(state.editingContact.custom) ? state.editingContact.custom : []).filter(
      (_, i) => i !== idx,
    );
    render();
    return;
  }
  if (action === "remove-photo") {
    state.photoPreview = null;
    state.photoBase64Pending = null;
    state.removePhotoPending = true;
    if (state.editingContact) state.editingContact.hasPhoto = false;
    render();
    return;
  }
  if (action === "delete-contact") {
    if (state.selectedAbId === null || !state.selectedContactUri) return;
    if (!confirm("Delete this contact? CardDAV clients will sync the removal.")) return;
    state.busy = true;
    clearFlash();
    state.contactModalOpen = true;
    render();
    try {
      await api.deleteContact(state.selectedAbId, state.selectedContactUri);
      state.selectedContactUri = null;
      state.editingContact = null;
      state.creatingContact = false;
      state.contactModalOpen = false;
      state.eventDtPicker = null;
      state.photoPreview = null;
      await o.loadHome();
      setFlash("success", "Contact deleted");
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Delete failed");
    } finally {
      state.busy = false;
      render();
    }
    return;
  }
  if (action === "delete-ab") {
    ev.stopPropagation();
    const id = Number(t.dataset.id ?? state.selectedAbId);
    if (!Number.isFinite(id)) return;
    const ab = state.addressBooks.find((a) => a.id === id);
    if (!ab) return;
    state.deleteAbConfirmId = id;
    state.abModalOpen = false;
    state.contactModalOpen = false;
    clearFlash();
    render();
    return;
  }
  if (action === "cancel-delete-ab") {
    state.deleteAbConfirmId = null;
    render();
    return;
  }
  if (action === "confirm-delete-ab") {
    const id = Number(t.dataset.id);
    const cb = root.querySelector<HTMLInputElement>("#delete-ab-confirm");
    if (!Number.isFinite(id) || !cb?.checked) return;
    const ab = state.addressBooks.find((a) => a.id === id);
    if (!ab) return;
    const force = (ab.cardCount ?? 0) > 0;
    state.busy = true;
    clearFlash();
    render();
    try {
      await api.deleteAddressBook(id, force);
      if (state.selectedAbId === id) {
        state.selectedAbId = null;
        state.contacts = [];
        state.editingContact = null;
        state.selectedContactUri = null;
        state.creatingContact = false;
      }
      state.deleteAbConfirmId = null;
      state.abModalOpen = false;
      state.contactModalOpen = false;
      await o.loadHome();
      if (state.selectedAbId === null && state.addressBooks.length > 0) {
        state.selectedAbId = state.addressBooks[0].id;
        await o.loadContacts(state.selectedAbId);
      }
      setFlash("success", "Address book deleted");
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Delete failed");
    } finally {
      state.busy = false;
      render();
    }
    return;
  }
  if (action === "export-ab") {
    ev.stopPropagation();
    const idRaw = t.dataset.id;
    const abId =
      idRaw !== undefined && idRaw !== ""
        ? Number(idRaw)
        : state.selectedAbId;
    if (abId === null || Number.isNaN(abId)) return;
    state.busy = true;
    clearFlash();
    render();
    try {
      const { blob, filename } = await api.exportAddressBook(abId);
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
    return;
  }
  if (action === "export-contact") {
    if (state.selectedAbId === null || !state.selectedContactUri || state.creatingContact) return;
    state.contactModalOpen = true;
    state.busy = true;
    clearFlash();
    render();
    try {
      const { blob, filename } = await api.exportContact(
        state.selectedAbId,
        state.selectedContactUri,
      );
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
    return;
  }
  if (action === "revoke") {
    const href = t.dataset.href ?? "";
    if (!href || state.selectedId === null) return;
    if (!confirm("Revoke access for this user?")) return;
    state.calModalOpen = true;
    state.busy = true;
    clearFlash();
    render();
    try {
      await api.revoke(state.selectedId, href);
      await o.loadShares(state.selectedId);
      setFlash("success", "Share revoked");
    } catch (e) {
      setFlash("error", e instanceof Error ? e.message : "Revoke failed");
    } finally {
      state.busy = false;
      render();
    }
    return;
  }
  if (action === "export-cal") {
    ev.stopPropagation();
    const idRaw = t.dataset.id;
    const calId =
      idRaw !== undefined && idRaw !== ""
        ? Number(idRaw)
        : state.selectedId;
    if (calId === null || Number.isNaN(calId)) return;
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
  }
}
