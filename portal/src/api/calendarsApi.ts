import { ApiError, encUri, request, streamImport } from "./client";
import type {
  Calendar,
  CalendarEvent,
  CalendarEventDetail,
  DirectoryUser,
  EventWriteBody,
  HolidayCountry,
  ImportProgressEvent,
  ImportResult,
  Share,
} from "./types";


export const calendarsApi = {
  calendars: () => request<{ calendars: Calendar[] }>("/calendars"),
  createCalendar: (body: {
    displayname: string;
    description?: string;
    color?: string;
    readOnly?: boolean;
    holidays?: boolean;
    holidayCountry?: string;
  }) =>
    request<{ calendar: Calendar; holidayImport?: ImportResult | null }>(
      "/calendars",
      {
        method: "POST",
        body: JSON.stringify(body),
      },
    ),
  holidayCountries: () =>
    request<{ countries: HolidayCountry[] }>("/holidays/countries"),
  updateCalendar: (
    instanceId: number,
    body: { displayname?: string; description?: string; color?: string },
  ) =>
    request<{ calendar: Calendar }>(`/calendars/${instanceId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  deleteCalendar: (instanceId: number) =>
    request<{ ok: boolean }>(`/calendars/${instanceId}`, { method: "DELETE" }),
  calendarEvents: (instanceId: number, from: string, to: string) => {
    const qs = new URLSearchParams({ from, to }).toString();
    return request<{ events: CalendarEvent[] }>(
      `/calendars/${instanceId}/events?${qs}`,
    );
  },
  getEvent: (instanceId: number, uri: string) =>
    request<{ event: CalendarEventDetail }>(
      `/calendars/${instanceId}/events/${encUri(uri)}`,
    ),
  createEvent: (instanceId: number, body: EventWriteBody) =>
    request<{ event: CalendarEventDetail }>(`/calendars/${instanceId}/events`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  updateEvent: (instanceId: number, uri: string, body: EventWriteBody) =>
    request<{ event: CalendarEventDetail }>(
      `/calendars/${instanceId}/events/${encUri(uri)}`,
      { method: "PATCH", body: JSON.stringify(body) },
    ),
  deleteEvent: (instanceId: number, uri: string) =>
    request<{ ok: boolean }>(`/calendars/${instanceId}/events/${encUri(uri)}`, {
      method: "DELETE",
    }),
  exportCalendar: async (instanceId: number): Promise<{ blob: Blob; filename: string }> => {
    const res = await fetch(`/api/calendars/${instanceId}/export`, {
      credentials: "same-origin",
    });
    if (!res.ok) {
      let msg = `Export failed (${res.status})`;
      try {
        const data = (await res.json()) as { error?: string };
        if (data.error) msg = data.error;
      } catch {
        /* ignore */
      }
      throw new ApiError(msg, res.status);
    }
    const cd = res.headers.get("Content-Disposition") || "";
    const m = /filename="([^"]+)"/i.exec(cd);
    const filename = m?.[1] || `calendar-${instanceId}.ics`;
    const blob = await res.blob();
    return { blob, filename };
  },
  importCalendar: (
    instanceId: number,
    ics: string,
    onProgress?: (p: ImportProgressEvent) => void,
  ) =>
    streamImport<ImportResult>(
      `/calendars/${instanceId}/import`,
      ics,
      "text/calendar; charset=utf-8",
      onProgress,
    ),
  directory: () => request<{ users: DirectoryUser[] }>("/directory"),
  shares: (instanceId: number) =>
    request<{ shares: Share[] }>(`/calendars/${instanceId}/shares`),
  share: (instanceId: number, username: string, access: "read" | "readwrite") =>
    request<{ share: Share }>(`/calendars/${instanceId}/shares`, {
      method: "POST",
      body: JSON.stringify({ username, access }),
    }),
  revoke: (instanceId: number, href: string) =>
    request<{ ok: boolean }>(`/calendars/${instanceId}/shares`, {
      method: "DELETE",
      body: JSON.stringify({ href }),
    }),

};
