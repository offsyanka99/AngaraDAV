/** Tasks loaders (Phase 7). */
import { api } from "../../api";
import { itemKey } from "../keys";
import type { TasksHost } from "./host";

export async function loadTasks(host: TasksHost) {
  const res = await api.tasks({ q: host.state.taskSearch, sort: host.state.taskSort, order: host.state.taskOrder });
  host.state.tasks = res.tasks;
  host.state.taskCalendars = res.calendars;
  const keySet = new Set(host.state.tasks.map((t) => itemKey(t.instanceId, t.uri)));
  host.state.checkedTaskKeys = host.state.checkedTaskKeys.filter((k) => keySet.has(k));
  if (
    host.state.selectedTaskKey !== null &&
    !host.state.tasks.some((t) => `${t.instanceId}|${t.uri}` === host.state.selectedTaskKey)
  ) {
    host.state.selectedTaskKey = null;
    if (!host.state.creatingTask) host.state.editingTask = null;
  }
}
