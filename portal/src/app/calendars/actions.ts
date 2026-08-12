/**
 * Calendar/event form handlers (Phase 6).
 */
import { api } from "../../api";
import { log } from "../../log";
import { convertAllDaySpanToTimed } from "../datetime";
import { entityFlash } from "../format";
import type { CalendarsHost } from "./host";
import { loadMonthEvents, loadShares } from "./loaders";
import { readRepeatFromForm } from "./eventModal";

export async function onShare(host: CalendarsHost, form: HTMLFormElement) {
  if (host.state.selectedId === null) return;
  const fd = new FormData(form);
  const username = String(fd.get("username") ?? "");
  const access = String(fd.get("access") ?? "read") as "read" | "readwrite";
  host.state.calModalOpen = true;
  host.state.busy = true;
  host.clearFlash();
  host.render();
  try {
    await api.share(host.state.selectedId, username, access);
    await loadShares(host, host.state.selectedId);
    host.setFlash("success", `Shared with ${username}`);
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Share failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
}

export async function onSaveEvent(host: CalendarsHost, form: HTMLFormElement) {
  if (!host.state.editingEvent || !host.state.editingEvent.canWrite) return;
  const fd = new FormData(form);
  const summary = String(fd.get("summary") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim();
  const location = String(fd.get("location") ?? "").trim();
  const allDay = fd.get("allDay") === "on";
  const startRaw = String(fd.get("start") ?? "").trim();
  const endRaw = String(fd.get("end") ?? "").trim();
  const targetInstanceId = Number(fd.get("instanceId")) || host.state.editingEvent.instanceId;
  const repeat = readRepeatFromForm(fd);
  if (!summary) {
    host.setFlash("error", "Title is required");
    host.render();
    return;
  }
  if (!startRaw) {
    host.setFlash("error", "Start is required");
    host.render();
    return;
  }
  let start: string;
  let end: string | null;
  if (allDay) {
    start = startRaw.slice(0, 10);
    // Inclusive last day for multi-day all-day events
    end = endRaw ? endRaw.slice(0, 10) : start;
  } else {
    // datetime-local → ISO; date-only fallback keeps multi-day span
    if (/^\d{4}-\d{2}-\d{2}$/.test(startRaw)) {
      const conv = convertAllDaySpanToTimed(startRaw, endRaw || null);
      start = new Date(conv.start).toISOString();
      end = conv.end ? new Date(conv.end).toISOString() : null;
    } else {
      start = new Date(startRaw).toISOString();
      end = endRaw ? new Date(endRaw).toISOString() : null;
    }
  }
  const sourceId = host.state.editingEvent.instanceId;
  const uri = host.state.editingEvent.uri;
  const isCreate = host.state.creatingEvent;
  host.state.busy = true;
  host.clearFlash();
  host.state.eventModalOpen = true;
  host.render();
  log.event(isCreate ? "event.create" : "event.update", {
    instanceId: targetInstanceId,
    uri: isCreate ? null : uri,
    allDay,
    summary,
  });
  try {
    const body = {
      summary,
      description,
      location,
      allDay,
      start,
      end,
      instanceId: targetInstanceId,
      repeat,
    };
    const res = isCreate
      ? await api.createEvent(targetInstanceId, body)
      : await api.updateEvent(sourceId, uri, body);
    if (host.state.selectedId === null || res.event.instanceId !== host.state.selectedId) {
      host.state.selectedId = res.event.instanceId;
    }
    await loadMonthEvents(host);
    // Close modal after successful create/save; flash shows on main page
    host.state.eventModalOpen = false;
    host.state.editingEvent = null;
    host.state.creatingEvent = false;
    host.state.eventDtPicker = null;
    log.event(isCreate ? "event.created" : "event.saved", {
      uri: res.event.uri,
      instanceId: res.event.instanceId,
    });
    host.setFlash(
      "success",
      entityFlash("Event", res.event.summary || summary, isCreate ? "created" : "saved"),
    );
  } catch (e) {
    // Keep modal open so the user can fix errors
    log.warn("event.save failed", e instanceof Error ? e.message : e);
    host.setFlash("error", e instanceof Error ? e.message : "Save failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
}

export async function onEditCal(host: CalendarsHost, form: HTMLFormElement) {
  if (host.state.selectedId === null) return;
  const fd = new FormData(form);
  const displayname = String(fd.get("displayname") ?? "").trim();
  const description = String(fd.get("description") ?? "");
  const color = String(fd.get("color") ?? "").trim();
  host.state.busy = true;
  host.clearFlash();
  host.render();
  try {
    const res = await api.updateCalendar(host.state.selectedId, {
      displayname,
      description,
      color,
    });
    host.state.calModalOpen = true;
    await host.loadHome();
    host.state.selectedId = res.calendar.id;
    await loadShares(host, host.state.selectedId);
    await loadMonthEvents(host);
    host.setFlash("success", "Calendar updated");
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Update failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
}

export async function onCreateCal(host: CalendarsHost, form: HTMLFormElement) {
  const fd = new FormData(form);
  const displayname = String(fd.get("displayname") ?? "").trim();
  const description = String(fd.get("description") ?? "");
  const color = String(fd.get("color") ?? "").trim();
  const holidays = fd.get("holidays") === "on";
  const holidayCountry = String(fd.get("holidayCountry") ?? "").trim();
  const readOnly = fd.get("readOnly") === "on";

  host.state.createCalModalOpen = true;
  if (holidays && !holidayCountry) {
    host.setFlash("error", "Select a country for the holidays calendar");
    host.render();
    return;
  }
  if (!holidays && !displayname) {
    host.setFlash("error", "Display name is required");
    host.render();
    return;
  }

  host.state.busy = true;
  host.clearFlash();
  host.render();
  try {
    const res = await api.createCalendar({
      displayname,
      description,
      color,
      holidays,
      holidayCountry: holidays ? holidayCountry : undefined,
      readOnly,
    });
    host.state.selectedId = res.calendar.id;
    if (!host.state.selectedIds.includes(res.calendar.id)) {
      host.state.selectedIds = [...host.state.selectedIds, res.calendar.id];
    }
    host.state.createCalModalOpen = false;
    await host.loadHome();
    let msg = `Created “${res.calendar.displayname}”`;
    const hi = res.holidayImport ?? res.calendar.holidayImport;
    if (hi) {
      msg += `. Holidays imported: ${host.formatImportResult(hi)}.`;
    }
    if (readOnly) {
      msg += " Calendar is read-only.";
    }
    host.setFlash("success", msg);
  } catch (e) {
    host.state.createCalModalOpen = true;
    host.setFlash("error", e instanceof Error ? e.message : "Create failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
}
