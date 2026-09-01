/**
 * Portal JSON API types (SPA).
 */
export type PortalUser = {
  username: string;
  displayname: string;
  email: string;
  principal: string;
  csrfToken?: string;
  /** True when the DAV user has the portal Admin role. */
  isAdmin?: boolean;
  /** Role label from the API (e.g. "Admin" | "User"). */
  role?: string;
};

/** GET /api/admin/dashboard payload (Administration Overview). */
export type AdminDashboardStats = {
  version: string;
  git?: string;
  users: number;
  calendars: number;
  events: number;
  addressBooks: number;
  contacts: number;
  /** Classic dashboard aliases */
  nbusers?: number;
  nbcalendars?: number;
  nbevents?: number;
  nbbooks?: number;
  nbcontacts?: number;
  services: {
    /** Portal Administration available */
    administration?: boolean;
    /** @deprecated use administration */
    webAdmin?: boolean;
    caldav: boolean;
    carddav: boolean;
    files: boolean;
    tasks: boolean;
    notes: boolean;
    push: boolean;
  };
  links?: {
    docs?: string;
    releases?: string;
    /** Portal Administration overview */
    administration?: string;
  };
};

/** GET /api/admin/users list item (never includes digesta1). */
export type AdminUserSummary = {
  username: string;
  displayname: string;
  email: string;
  principal: string;
};

/** GET /api/admin/users/{username} detail. */
export type AdminUserDetail = AdminUserSummary & {
  calendarCount: number;
  addressBookCount: number;
  contactCount: number;
  eventCount: number;
};

/** Admin-managed calendar for another user. */
export type AdminUserCalendar = {
  id: number;
  instanceId: number;
  calendarId: number;
  uri: string;
  displayname: string;
  description: string;
  calendarcolor: string;
  components: string;
  todos: boolean;
  notes: boolean;
  eventCount: number;
  davUri: string;
};

/** Admin-managed address book for another user. */
export type AdminUserAddressBook = {
  id: number;
  uri: string;
  displayname: string;
  description: string;
  contactCount: number;
  davUri: string;
};

/** GET/PATCH /api/admin/settings/database (never includes password; write needs confirm: "CONFIRM"). */
export type AdminDatabaseSettings = {
  backend: string;
  sqlite_file: string;
  pgsql_host: string;
  pgsql_dbname: string;
  pgsql_username: string;
  hasPassword: boolean;
  hasEncryptionKey: boolean;
  writeEnabled: boolean;
  writable?: boolean;
  warning: string;
};

/** GET/PATCH /api/admin/settings/system */
export type AdminSystemSettings = {
  timezone: string;
  card_enabled: boolean;
  cal_enabled: boolean;
  files_enabled: boolean;
  files_storage_path: string;
  files_max_upload_mb: number;
  files_quota_mb: number;
  files_quarantine_days: number;
  tasks_enabled: boolean;
  notes_enabled: boolean;
  invite_from: string;
  dav_auth_type: string;
  session_max_age_minutes: number;
  push_enabled: boolean;
  push_external_url: string;
  push_log_level: string;
  push_max_subscriptions_per_principal?: number;
  push_max_subscriptions_per_resource?: number;
  push_max_registrations_per_hour?: number;
  push_worker_batch_size?: number;
  push_worker_poll_ms?: number;
  push_max_delivery_attempts?: number;
  portal_log_level?: string;
  portal_time_format?: string;
  portal_week_start?: string;
  portal_admin_users?: string | string[];
  portal_admin_ui_enabled?: boolean;
  hasAdminPassword: boolean;
  configured_version?: string;
  auth_realm?: string;
  writable?: boolean;
};

/** GET /api/admin/settings/backup response payload. */
export type AdminSettingsBackup = {
  kind: string;
  formatVersion: number;
  productVersion: string;
  createdAt: string;
  createdBy: string;
  settings: Record<string, unknown>;
  database: Record<string, unknown>;
  checksum: string;
};

/** POST /api/admin/settings/restore response payload (dryRun or applied). */
export type AdminSettingsRestoreResult = {
  changed: Record<string, { from: unknown; to: unknown }>;
  unchanged: string[];
  invalid: { key: string; reason: string }[];
  unknown: string[];
  productVersion: string;
  versionMismatch: boolean;
  applied: string[];
};

/** Feature status from GET /api/admin/capabilities (parity matrix). */
export type AdminFeatureStatus = "full" | "read-only" | "coming-soon" | "deferred" | string;

export type AdminCapabilityPage = {
  id: string;
  label: string;
  status: AdminFeatureStatus;
  /** When false, page is gated in the Administration shell. */
  available: boolean;
  /** Deep link into portal Administration (e.g. /portal/#admin/users). */
  portalUrl: string;
  portalLabel: string;
  summary: string;
};

/** GET /api/admin/capabilities payload. */
export type AdminCapabilities = {
  uiEnabled: boolean;
  /** Portal Administration entry (/portal/#admin). */
  portalAdminUrl: string;
  pages: AdminCapabilityPage[];
};

export type Calendar = {
  id: number;
  calendarId: number;
  instanceId: number;
  uri: string;
  displayname: string;
  description: string;
  color: string;
  access: string;
  accessCode: number;
  canShare: boolean;
  components: string;
  readOnly?: boolean;
  holidaysCountry?: string | null;
  holidayImport?: { imported: number; updated: number; skipped: number };
};

export type HolidayCountry = {
  code: string;
  name: string;
};

export type ImportResult = {
  imported: number;
  updated: number;
  skipped: number;
};

/** Live import progress (NDJSON stream from server). */
export type ImportProgressEvent = {
  percent: number;
  current: number;
  total: number;
  imported: number;
  updated: number;
  skipped: number;
};

/** VEVENT occurrence for the month grid (from GET /calendars/{id}/events) */
export type CalendarEvent = {
  uid: string;
  uri: string;
  summary: string;
  /** ISO datetime or YYYY-MM-DD for all-day */
  start: string;
  end: string | null;
  allDay: boolean;
  /** Set client-side when merging multi-calendar month views */
  instanceId?: number;
};

export type EventRepeat = {
  freq: "" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY" | string;
  interval: number;
  until: string | null;
  count: number | null;
  byDay: string[];
  /** UI-only: keep Ends=On date even before a date is chosen */
  endMode?: "never" | "until" | "count";
};

/** Full VEVENT for the edit modal */
export type CalendarEventDetail = {
  uri: string;
  instanceId: number;
  calendarId: number;
  calendarName: string;
  calendarUri: string;
  uid: string;
  summary: string;
  description: string;
  location: string;
  start: string | null;
  end: string | null;
  allDay: boolean;
  hasRrule: boolean;
  repeat: EventRepeat;
  readOnly: boolean;
  canWrite: boolean;
};

export type EventWriteBody = {
  summary?: string;
  description?: string;
  location?: string;
  start?: string | null;
  end?: string | null;
  allDay?: boolean;
  /** Move to another calendar (instance id) */
  instanceId?: number;
  repeat?: EventRepeat | null;
};

export type Share = {
  href: string;
  principal: string;
  username: string;
  displayname: string;
  access: string;
  accessCode: number;
  status: number;
};

export type DirectoryUser = {
  username: string;
  displayname: string;
  email?: string;
};

export type AddressBook = {
  id: number;
  uri: string;
  displayname: string;
  description: string;
  cardCount: number;
};

export type ContactPhone = {
  type: "cell" | "work" | "home" | "other" | string;
  value: string;
};

export type ContactAddress = {
  street: string;
  city: string;
  region: string;
  postal: string;
  country: string;
};

/** vCard X-* extension properties (custom fields) */
export type ContactCustomField = {
  name?: string;
  label: string;
  value: string;
};

export type ContactSummary = {
  uri: string;
  displayname: string;
  firstname: string;
  lastname: string;
  org: string;
  email: string;
  phone: string;
  hasPhoto: boolean;
  etag?: string;
};

export type ContactDetail = {
  uri: string;
  displayname: string;
  firstname: string;
  lastname: string;
  fullname: string;
  org: string;
  title: string;
  emails: string[];
  phones: ContactPhone[];
  address: ContactAddress;
  url: string;
  note: string;
  /** YYYY-MM-DD (vCard BDAY) */
  birthday?: string | null;
  /** YYYY-MM-DD (vCard ANNIVERSARY / special) */
  specialDate?: string | null;
  specialDateLabel?: string;
  custom: ContactCustomField[];
  hasPhoto: boolean;
  photoDataUri?: string | null;
};

export type ContactWriteBody = {
  firstname?: string;
  lastname?: string;
  fullname?: string;
  org?: string;
  title?: string;
  emails?: string[];
  phones?: ContactPhone[];
  address?: ContactAddress;
  url?: string;
  note?: string;
  birthday?: string | null;
  specialDate?: string | null;
  specialDateLabel?: string;
  custom?: ContactCustomField[];
  photoBase64?: string | null;
  removePhoto?: boolean;
};

export type TaskItem = {
  uri: string;
  instanceId: number;
  calendarId: number;
  calendarName: string;
  calendarUri: string;
  /** VTODO UID — used for subtask parent links (RELATED-TO) */
  uid: string;
  /** Parent task UID when this is a subtask; null for top-level */
  parentUid: string | null;
  summary: string;
  description: string;
  status: string;
  due: string | null;
  priority: number;
  percent: number;
  completed: string | null;
  lastmodified: number;
  readOnly: boolean;
  canWrite: boolean;
};

export type NoteItem = {
  uri: string;
  instanceId: number;
  calendarId: number;
  calendarName: string;
  calendarUri: string;
  summary: string;
  description: string;
  dtstart: string | null;
  lastmodified: number;
  readOnly: boolean;
  canWrite: boolean;
};

export type ItemCalendarOption = {
  id: number;
  displayname: string;
  color: string;
  components: string;
};

export type TaskWriteBody = {
  instanceId?: number;
  summary?: string;
  description?: string;
  status?: string;
  due?: string | null;
  priority?: number;
  percent?: number;
  /** Parent VTODO UID (same calendar); null/"" for top-level */
  parentUid?: string | null;
};

export type NoteWriteBody = {
  instanceId?: number;
  summary?: string;
  description?: string;
  dtstart?: string | null;
};

/** Portal Files tab — private WebDAV home status */
export type FilesStatus = {
  enabled: boolean;
  ready: boolean;
  error: string | null;
  davPath: string;
  maxUploadBytes: number;
  quotaBytes: number;
  usedBytes: number;
  availableBytes: number;
};

export type FileEntry = {
  name: string;
  path: string;
  type: "file" | "dir";
  size: number;
  mtime: number;
  etag?: string | null;
};

/** DAV service switches from Admin System settings (also public on /info.php). */
export type PortalUiServices = {
  caldav?: boolean;
  carddav?: boolean;
  tasks?: boolean;
  notes?: boolean;
  files?: boolean;
};

export type PortalUi = {
  timeFormat?: string;
  weekStart?: string;
  logLevel?: string;
  /** Server idle session lifetime in seconds (matches session_max_age_minutes). */
  sessionIdleSeconds?: number;
  /** Full product version including +sha when known (from server), e.g. 2.0.1+fef872a. */
  version?: string;
  /** Short git SHA only. */
  git?: string;
  /**
   * Which portal user tabs to show. When omitted (older server), SPA keeps all tabs
   * (fail-open). When present, disabled services hide the matching tab.
   */
  services?: PortalUiServices;
};

/** Install/upgrade wizard status (public; works while portal API is blocked for upgrades). */
export type InstallStatusPublic = {
  step: string;
  locked?: boolean;
  message?: string;
  productVersion?: string;
  configuredVersion?: string | null;
  installUrl?: string;
  portalUrl?: string;
  csrfToken?: string;
};
