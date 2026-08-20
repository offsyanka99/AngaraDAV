import { encUri, request } from "./client";
import type {
  ItemCalendarOption,
  NoteItem,
  NoteWriteBody,
  TaskItem,
  TaskWriteBody,
} from "./types";


export const itemsApi = {
  tasks: (opts: { q?: string; sort?: string; order?: string } = {}) => {
    const p = new URLSearchParams();
    if (opts.q) p.set("q", opts.q);
    if (opts.sort) p.set("sort", opts.sort);
    if (opts.order) p.set("order", opts.order);
    const qs = p.toString() ? `?${p}` : "";
    return request<{ tasks: TaskItem[]; calendars: ItemCalendarOption[] }>(
      `/tasks${qs}`,
    );
  },
  createTask: (body: TaskWriteBody) =>
    request<{ task: TaskItem }>("/tasks", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateTask: (instanceId: number, uri: string, body: TaskWriteBody) =>
    request<{ task: TaskItem }>(`/tasks/${instanceId}/${encUri(uri)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteTask: (instanceId: number, uri: string) =>
    request<{ ok: boolean }>(`/tasks/${instanceId}/${encUri(uri)}`, {
      method: "DELETE",
    }),
  /** Bulk delete or update selected tasks (status / due / percent). */
  bulkTasks: (body: {
    op: "delete" | "update" | "copy";
    items: { instanceId: number; uri: string }[];
    fields?: { status?: string; due?: string | null; percent?: number };
  }) =>
    request<{ ok: number; failed: number; errors: string[] }>("/tasks/bulk", {
      method: "POST",
      body: JSON.stringify(body),
    }),

  notes: (opts: { q?: string; sort?: string; order?: string } = {}) => {
    const p = new URLSearchParams();
    if (opts.q) p.set("q", opts.q);
    if (opts.sort) p.set("sort", opts.sort);
    if (opts.order) p.set("order", opts.order);
    const qs = p.toString() ? `?${p}` : "";
    return request<{ notes: NoteItem[]; calendars: ItemCalendarOption[] }>(
      `/notes${qs}`,
    );
  },
  createNote: (body: NoteWriteBody) =>
    request<{ note: NoteItem }>("/notes", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateNote: (instanceId: number, uri: string, body: NoteWriteBody) =>
    request<{ note: NoteItem }>(`/notes/${instanceId}/${encUri(uri)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteNote: (instanceId: number, uri: string) =>
    request<{ ok: boolean }>(`/notes/${instanceId}/${encUri(uri)}`, {
      method: "DELETE",
    }),
  bulkNotes: (body: {
    op: "delete" | "copy";
    items: { instanceId: number; uri: string }[];
  }) =>
    request<{ ok: number; failed: number; errors: string[] }>("/notes/bulk", {
      method: "POST",
      body: JSON.stringify(body),
    }),

};
