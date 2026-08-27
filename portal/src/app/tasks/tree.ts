/** Task tree helpers (Phase 7). */
import type { TaskItem } from "../../api";
import { esc } from "../../ui";
import { itemKey } from "../keys";
import type { TasksHost } from "./host";
import { isOpenTaskStatus } from "./listing";

export function tasksInTreeOrder(_host: TasksHost, list: TaskItem[]): { task: TaskItem; depth: number }[] {
  const byUid = new Map<string, TaskItem>();
  for (const t of list) {
    if (t.uid) byUid.set(t.uid, t);
  }
  const orderIndex = new Map(list.map((t, i) => [itemKey(t.instanceId, t.uri), i]));
  const children = new Map<string, TaskItem[]>();
  const roots: TaskItem[] = [];
  for (const t of list) {
    const p = t.parentUid;
    if (p && byUid.has(p) && p !== t.uid) {
      const arr = children.get(p) ?? [];
      arr.push(t);
      children.set(p, arr);
    } else {
      roots.push(t);
    }
  }
  const byOrder = (a: TaskItem, b: TaskItem) =>
    (orderIndex.get(itemKey(a.instanceId, a.uri)) ?? 0) -
    (orderIndex.get(itemKey(b.instanceId, b.uri)) ?? 0);
  roots.sort(byOrder);
  for (const [, kids] of children) kids.sort(byOrder);

  const out: { task: TaskItem; depth: number }[] = [];
  const visiting = new Set<string>();
  const walk = (t: TaskItem, depth: number) => {
    const id = t.uid || itemKey(t.instanceId, t.uri);
    if (visiting.has(id)) return;
    visiting.add(id);
    out.push({ task: t, depth: Math.min(depth, 8) });
    for (const c of children.get(t.uid) ?? []) {
      walk(c, depth + 1);
    }
    visiting.delete(id);
  };
  for (const r of roots) walk(r, 0);
  // Any unvisited (shouldn't happen) — append flat
  for (const t of list) {
    if (!out.some((x) => x.task === t)) out.push({ task: t, depth: 0 });
  }
  return out;
}

/** UIDs that cannot be chosen as parent of `self` (self + descendants). */

export function taskDescendantUids(host: TasksHost, selfUid: string): Set<string> {
  const blocked = new Set<string>([selfUid]);
  if (!selfUid) return blocked;
  let grew = true;
  while (grew) {
    grew = false;
    for (const t of host.state.tasks) {
      if (t.parentUid && blocked.has(t.parentUid) && t.uid && !blocked.has(t.uid)) {
        blocked.add(t.uid);
        grew = true;
      }
    }
  }
  return blocked;
}

/** Nested subtasks of `selfUid` (does not include self). */
export function taskDescendantCount(host: TasksHost, selfUid: string): number {
  if (!selfUid) return 0;
  return Math.max(0, taskDescendantUids(host, selfUid).size - 1);
}

export function parentTaskOptions(host: TasksHost, forTask: TaskItem, creating: boolean): string {
  const calInstance = forTask.instanceId;
  const blocked = creating || !forTask.uid ? new Set<string>() : taskDescendantUids(host, forTask.uid);
  const candidates = host.state.tasks.filter(
    (x) =>
      x.uid &&
      x.instanceId === calInstance &&
      !blocked.has(x.uid) &&
      x.uid !== forTask.uid &&
      isOpenTaskStatus(x.status),
  );
  const selected = forTask.parentUid || "";
  const opts = [
    `<option value="">None (top-level)</option>`,
    ...candidates.map(
      (x) =>
        `<option value="${esc(x.uid)}" ${x.uid === selected ? "selected" : ""}>${esc(x.summary || x.uid)}</option>`,
    ),
  ];
  // Keep selected parent visible even if filtered out of list (e.g. other calendar)
  if (selected && !candidates.some((x) => x.uid === selected)) {
    const orphan = host.state.tasks.find((x) => x.uid === selected);
    opts.push(
      `<option value="${esc(selected)}" selected>${esc(orphan?.summary || selected)} (current)</option>`,
    );
  }
  return opts.join("");
}

export function writableCheckedTasks(host: TasksHost): TaskItem[] {
  const set = new Set(host.state.checkedTaskKeys);
  return host.state.tasks.filter((t) => set.has(itemKey(t.instanceId, t.uri)) && t.canWrite && !t.readOnly);
}
