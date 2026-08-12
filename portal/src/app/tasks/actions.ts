/** Tasks bulk + save handlers (Phase 7). */
import { api } from "../../api";
import { entityFlash } from "../format";
import { itemKey } from "../keys";
import type { TasksHost } from "./host";
import { loadTasks } from "./loaders";
import { writableCheckedTasks } from "./tree";

/**
 * Pull live form values into editingTask before re-render (e.g. Due date picker).
 * Without this, Title/Description/Status typed in the form are wiped on render().
 */
export function syncEditingTaskFromForm(host: TasksHost, form: HTMLFormElement): void {
  if (!host.state.editingTask) return;
  const fd = new FormData(form);
  const dueLocal = String(fd.get("due") ?? "").trim();
  const instanceRaw = fd.get("instanceId");
  const instanceId =
    instanceRaw !== null && String(instanceRaw) !== ""
      ? Number(instanceRaw)
      : host.state.editingTask.instanceId;
  const parentRaw = String(fd.get("parentUid") ?? "").trim();
  host.state.editingTask = {
    ...host.state.editingTask,
    instanceId: Number.isFinite(instanceId) && instanceId > 0 ? instanceId : host.state.editingTask.instanceId,
    summary: String(fd.get("summary") ?? host.state.editingTask.summary),
    description: String(fd.get("description") ?? host.state.editingTask.description),
    status: String(fd.get("status") ?? host.state.editingTask.status),
    due: dueLocal ? new Date(dueLocal).toISOString() : null,
    priority: Number(fd.get("priority") ?? host.state.editingTask.priority ?? 0),
    percent: Number(fd.get("percent") ?? host.state.editingTask.percent ?? 0),
    parentUid: parentRaw === "" ? null : parentRaw,
  };
}

export async function runBulkTaskAction(host: TasksHost, action:
    | "bulk-task-status"
    | "bulk-task-due"
    | "bulk-task-clear-due"
    | "bulk-task-percent"
    | "bulk-task-delete",) {
  const selected = writableCheckedTasks(host);
  if (selected.length === 0) {
    host.setFlash("error", "No writable tasks selected");
    host.render();
    return;
  }
  const items = selected.map((t) => ({ instanceId: t.instanceId, uri: t.uri }));

  if (action === "bulk-task-delete") {
    // Confirmation is handled by the themed confirmDelete modal (shell router).
    host.state.busy = true;
    host.clearFlash();
    host.render();
    try {
      const res = await api.bulkTasks({ op: "delete", items });
      host.state.checkedTaskKeys = [];
      if (host.state.selectedTaskKey && selected.some((t) => itemKey(t.instanceId, t.uri) === host.state.selectedTaskKey)) {
        host.state.selectedTaskKey = null;
        host.state.editingTask = null;
        host.state.creatingTask = false;
      }
      await loadTasks(host);
      if (res.failed > 0) {
        host.setFlash(
          "error",
          `Deleted ${res.ok}, failed ${res.failed}${res.errors[0] ? `: ${res.errors[0]}` : ""}`,
        );
      } else {
        host.setFlash("success", `Deleted ${res.ok} task${res.ok === 1 ? "" : "s"}`);
      }
    } catch (e) {
      host.setFlash("error", e instanceof Error ? e.message : "Bulk delete failed");
    } finally {
      host.state.busy = false;
      host.render();
    }
    return;
  }

  let fields: { status?: string; due?: string | null; percent?: number } = {};
  if (action === "bulk-task-status") {
    const sel = host.root.querySelector<HTMLSelectElement>("#bulk-task-status");
    const status = sel?.value?.trim() ?? "";
    if (!status) {
      host.setFlash("error", "Choose a status to apply");
      host.render();
      return;
    }
    fields = { status };
  } else if (action === "bulk-task-due") {
    const raw = host.state.bulkDueValue.trim();
    if (!raw) {
      host.setFlash("error", "Choose a due date to apply");
      host.render();
      return;
    }
    const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(raw)
      ? new Date(raw + "T00:00:00")
      : new Date(raw.length === 16 ? raw : raw);
    if (Number.isNaN(dueDate.getTime())) {
      host.setFlash("error", "Invalid due date");
      host.render();
      return;
    }
    fields = { due: dueDate.toISOString() };
  } else if (action === "bulk-task-clear-due") {
    fields = { due: null };
  } else if (action === "bulk-task-percent") {
    const input = host.root.querySelector<HTMLInputElement>("#bulk-task-percent");
    const raw = input?.value?.trim() ?? "";
    if (raw === "") {
      host.setFlash("error", "Enter a percent complete (0–100)");
      host.render();
      return;
    }
    const pct = Number(raw);
    if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
      host.setFlash("error", "Percent must be between 0 and 100");
      host.render();
      return;
    }
    fields = { percent: Math.round(pct) };
  }

  host.state.busy = true;
  host.clearFlash();
  host.render();
  try {
    const res = await api.bulkTasks({ op: "update", items, fields });
    await loadTasks(host);
    // Refresh open editor if it was in the bulk set
    if (host.state.editingTask && !host.state.creatingTask) {
      const key = itemKey(host.state.editingTask.instanceId, host.state.editingTask.uri);
      const refreshed = host.state.tasks.find((x) => itemKey(x.instanceId, x.uri) === key);
      if (refreshed) host.state.editingTask = { ...refreshed };
    }
    const label =
      action === "bulk-task-status"
        ? "status"
        : action === "bulk-task-due"
          ? "due date"
          : action === "bulk-task-clear-due"
            ? "due date"
            : "percent";
    if (res.failed > 0) {
      host.setFlash(
        "error",
        `Updated ${label} on ${res.ok}, failed ${res.failed}${res.errors[0] ? `: ${res.errors[0]}` : ""}`,
      );
    } else {
      host.setFlash(
        "success",
        `Updated ${label} on ${res.ok} task${res.ok === 1 ? "" : "s"}`,
      );
    }
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Bulk update failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
}

export async function onSaveTask(host: TasksHost, form: HTMLFormElement) {
  const fd = new FormData(form);
  const summary = String(fd.get("summary") ?? "").trim();
  const description = String(fd.get("description") ?? "").trim();
  const status = String(fd.get("status") ?? "NEEDS-ACTION");
  const dueLocal = String(fd.get("due") ?? "").trim();
  const due = dueLocal ? new Date(dueLocal).toISOString() : null;
  const priority = Number(fd.get("priority") ?? 0);
  const percent = Number(fd.get("percent") ?? 0);
  const parentRaw = String(fd.get("parentUid") ?? "").trim();
  const parentUid = parentRaw === "" ? null : parentRaw;
  host.state.busy = true;
  host.clearFlash();
  host.render();
  try {
    if (host.state.creatingTask) {
      const instanceId = Number(fd.get("instanceId"));
      if (!Number.isFinite(instanceId) || instanceId <= 0) {
        throw new Error("Select a calendar");
      }
      const res = await api.createTask({
        instanceId,
        summary,
        description,
        status,
        due,
        priority,
        percent,
        parentUid,
      });
      host.state.creatingTask = false;
      host.state.selectedTaskKey = itemKey(res.task.instanceId, res.task.uri);
      host.state.editingTask = res.task;
      host.setFlash(
        "success",
        entityFlash(parentUid ? "Subtask" : "Task", res.task.summary || summary, "created"),
      );
    } else if (host.state.editingTask) {
      const res = await api.updateTask(host.state.editingTask.instanceId, host.state.editingTask.uri, {
        summary,
        description,
        status,
        due,
        priority,
        percent,
        parentUid,
      });
      host.state.editingTask = res.task;
      host.state.selectedTaskKey = itemKey(res.task.instanceId, res.task.uri);
      host.setFlash("success", entityFlash("Task", res.task.summary || summary, "saved"));
    }
    await loadTasks(host);
  } catch (e) {
    host.setFlash("error", e instanceof Error ? e.message : "Save failed");
  } finally {
    host.state.busy = false;
    host.render();
  }
}
