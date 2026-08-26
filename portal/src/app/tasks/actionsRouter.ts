/**
 * Tasks tab data-action router (onAction split Step 2).
 * Owns: sort-task, select/check/bulk, new/subtask/cancel/delete.
 */
import type { AppOrchestrator } from "../orchestrator";
import { filterTasks } from "./listing";

/**
 * Handle task actions. Returns true if the action was recognized
 * (including no-ops such as select-task on the checkbox cell).
 */
export async function handleTasksAction(
  o: AppOrchestrator,
  action: string,
  t: HTMLElement,
  ev: Event,
): Promise<boolean> {
  const { state, render, setFlash, clearFlash } = o;

  if (action === "sort-task") {
    const col = t.dataset.sort || "";
    if (!col) return true;
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
    return true;
  }

  if (action === "select-task") {
    // Ignore clicks on the checkbox cell
    if ((ev.target as HTMLElement).closest("[data-stop-row], .task-check")) return true;
    const instanceId = Number(t.dataset.instance);
    const uri = t.dataset.uri ?? "";
    if (!Number.isFinite(instanceId) || !uri) return true;
    const found = state.tasks.find((x) => x.instanceId === instanceId && x.uri === uri) ?? null;
    state.creatingTask = false;
    state.selectedTaskKey = o.itemKey(instanceId, uri);
    state.editingTask = found ? { ...found } : null;
    state.taskModalOpen = !!found;
    clearFlash();
    render();
    return true;
  }

  if (action === "task-check") {
    ev.stopPropagation();
    const instanceId = Number(t.dataset.instance);
    const uri = t.dataset.uri ?? "";
    if (!Number.isFinite(instanceId) || !uri) return true;
    const key = o.itemKey(instanceId, uri);
    const task = state.tasks.find((x) => o.itemKey(x.instanceId, x.uri) === key);
    if (!task || task.readOnly || task.canWrite === false) return true;
    const on = t instanceof HTMLInputElement ? t.checked : !state.checkedTaskKeys.includes(key);
    if (on) {
      if (!state.checkedTaskKeys.includes(key)) state.checkedTaskKeys = [...state.checkedTaskKeys, key];
    } else {
      state.checkedTaskKeys = state.checkedTaskKeys.filter((k) => k !== key);
    }
    render();
    return true;
  }

  if (action === "task-filter") {
    if (ev.type !== "change") return true;
    const col = t.dataset.col ?? "";
    const value = t instanceof HTMLSelectElement ? t.value : "";
    if (col === "status" || col === "due" || col === "calendar" || col === "percent") {
      state.taskFilters = { ...state.taskFilters, [col]: value };
      const listed = filterTasks(state.tasks, state.taskFilters);
      const visible = new Set(listed.map((x) => o.itemKey(x.instanceId, x.uri)));
      state.checkedTaskKeys = state.checkedTaskKeys.filter((k) => visible.has(k));
    }
    render();
    return true;
  }

  if (action === "task-select-all") {
    ev.stopPropagation();
    const listed = filterTasks(state.tasks, state.taskFilters);
    const writable = listed.filter((x) => !x.readOnly && x.canWrite !== false);
    const on = t instanceof HTMLInputElement ? t.checked : writable.length > 0 && writable.length !== state.checkedTaskKeys.length;
    state.checkedTaskKeys = on ? writable.map((x) => o.itemKey(x.instanceId, x.uri)) : [];
    render();
    return true;
  }

  if (action === "bulk-task-clear") {
    state.checkedTaskKeys = [];
    render();
    return true;
  }

  if (
    action === "bulk-task-status" ||
    action === "bulk-task-due" ||
    action === "bulk-task-clear-due" ||
    action === "bulk-task-percent" ||
    action === "bulk-task-delete"
  ) {
    if (action === "bulk-task-delete") {
      const n = state.checkedTaskKeys.length;
      if (n === 0) {
        setFlash("error", "No tasks selected");
        render();
        return true;
      }
      state.confirmDelete = {
        scope: "bulk-task",
        title: n === 1 ? "Delete task" : `Delete ${n} tasks`,
        message:
          n === 1
            ? "Delete the selected task?"
            : `Delete ${n} selected tasks?`,
        detail: "CalDAV clients will sync the removal. This cannot be undone.",
        count: n,
      };
      render();
      return true;
    }
    void o.runBulkTaskAction(action);
    return true;
  }

  if (action === "new-task") {
    state.creatingTask = true;
    state.selectedTaskKey = null;
    state.taskModalOpen = true;
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
    return true;
  }

  if (action === "new-subtask") {
    if (!state.editingTask || state.creatingTask || !state.editingTask.uid) return true;
    if (!state.editingTask.canWrite) return true;
    const parent = state.editingTask;
    state.creatingTask = true;
    state.selectedTaskKey = null;
    state.taskModalOpen = true;
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
    return true;
  }

  if (action === "cancel-task") {
    state.creatingTask = false;
    state.editingTask = null;
    state.taskModalOpen = false;
    render();
    return true;
  }

  if (action === "delete-task") {
    if (!state.editingTask || state.creatingTask) return true;
    const title = String(state.editingTask.summary || "this task").trim() || "this task";
    state.confirmDelete = {
      scope: "task",
      title: "Delete task",
      message: `Delete “${title}”?`,
      detail: "CalDAV clients will sync the removal. This cannot be undone.",
    };
    render();
    return true;
  }

  return false;
}
