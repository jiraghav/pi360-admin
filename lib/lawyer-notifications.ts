import { apiRequest } from "@/lib/api-client";

interface ApiEnvelope {
  data?: unknown;
}

export interface LawyerNotification {
  id: number;
  title: string;
  message: string;
  createdAt: string | null;
  patientName: string | null;
  caseId: number | null;
  taskId: number | null;
  taskTitle: string | null;
  taskDescription: string | null;
  priority: string | null;
  status: string | null;
  isRead: boolean;
  notificationType: string | null;
  taskType: string | null;
  noteId: number | null;
  documentId: number | null;
  taskAuthorization: boolean;
  taskDocumentId: number | null;
}

export interface LawyerTask {
  id: number;
  pid: number | null;
  dob: string | null;
  doi: string | null;
  documentId: number | null;
  lawyerName: string;
  patientName: string;
  staffNames: string[];
  title: string;
  description: string;
  priorityLabel: string;
  taskDate: string;
  status: number;
  type: number;
  statusLabel: string;
  notesCount: number;
  lawyerId: number | null;
  userId: number | null;
  authorization: boolean;
}

export interface LawyerTaskNote {
  id: number;
  note: string;
  createdBy: string;
  createdAt: string;
}

export interface EmrNotification {
  id: number;
  taskId: number | null;
  emailId: number | null;
  pid: number | null;
  lawyerName: string;
  lawyerId: number | null;
  title: string;
  message: string;
  isRead: boolean;
  readBy: string;
  createdAt: string;
  patientName: string;
  fromUser: string;
  taskTitle: string;
  taskDescription: string;
  taskStatus: number | null;
  taskStatusLabel: string;
  authorization: boolean;
  authorizationTask: string;
  notesCount: number;
}

export interface LawyerTasksQuery {
  page?: number;
  pageSize?: number;
  type?: number;
  authorization?: number;
  title?: string;
  lawyer?: string;
  patient?: string;
  priority?: string;
  status?: string;
  staffOnly?: boolean;
}

export interface LawyerTasksPage {
  tasks: LawyerTask[];
  totalItems: number;
  filteredItems: number;
  page: number;
  pageSize: number;
}

export interface EmrNotificationsQuery {
  page?: number;
  pageSize?: number;
  readStatus?: string;
  lawyer?: string;
  patient?: string;
  title?: string;
}

export interface EmrNotificationsPage {
  notifications: EmrNotification[];
  totalItems: number;
  filteredItems: number;
  page: number;
  pageSize: number;
}

const lawyerNotificationsEndpoint = "../lawyer_apis/notifications.php";
const markLawyerNotificationReadEndpoint = "../lawyer_apis/mark_notification_read.php";
const lawyerTasksEndpoint = "get_lawyer_tasks.php";
const updateLawyerTaskStatusEndpoint = "update_lawyer_task_status.php";
const deleteLawyerTaskEndpoint = "delete_lawyer_task.php";
const getLawyerTaskNotesEndpoint = "get_lawyer_task_notes.php";
const saveLawyerNotificationPrefEndpoint = "save_lawyer_notification_pref.php";
const addLawyerTaskNoteEndpoint = "add_lawyer_task_note.php";
const createLawyerTaskEndpoint = "create_lawyer_task.php";
const getEmrNotificationsEndpoint = "get_emr_notifications.php";
const markEmrNotificationReadEndpoint = "mark_emr_notification_read.php";

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes";
  }

  return false;
};

const toNullableString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value : null;

const stripHtml = (value: string): string => value.replace(/<[^>]*>/g, "\n").replace(/\n+/g, "\n").trim();

const mapNotifications = (payload: unknown): LawyerNotification[] => {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const data = payload as Record<string, unknown>;
  const rawNotifications = Array.isArray(data.notifications) ? data.notifications : [];

  return rawNotifications.map((item) => {
    const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};

    return {
      id: toNumber(row.id) ?? 0,
      title: toNullableString(row.title) ?? "Lawyer notification",
      message: toNullableString(row.message) ?? "",
      createdAt: toNullableString(row.created_at),
      patientName: toNullableString(row.patient_name),
      caseId: toNumber(row.case_id),
      taskId: toNumber(row.task_id),
      taskTitle: toNullableString(row.task_title),
      taskDescription: toNullableString(row.task_description),
      priority: toNullableString(row.priority),
      status: toNullableString(row.status),
      isRead: toBoolean(row.is_read),
      notificationType: toNullableString(row.notification_type),
      taskType: toNullableString(row.task_type),
      noteId: toNumber(row.note_id),
      documentId: toNumber(row.document_id),
      taskAuthorization: toBoolean(row.task_authorization),
      taskDocumentId: toNumber(row.task_document_id),
    };
  }).filter((notification) => notification.id > 0);
};

export async function getLawyerNotifications(pid?: number): Promise<LawyerNotification[]> {
  const query = new URLSearchParams();

  if (pid) {
    query.set("pid", String(pid));
  }

  const endpoint = query.size > 0
    ? `${lawyerNotificationsEndpoint}?${query.toString()}`
    : lawyerNotificationsEndpoint;

  const response = await apiRequest<ApiEnvelope>(endpoint, {
    method: "GET",
    withAuth: true,
    cache: "no-store",
  });

  return mapNotifications(response.data);
}

export async function markLawyerNotificationRead(id: number): Promise<void> {
  await apiRequest(markLawyerNotificationReadEndpoint, {
    method: "POST",
    withAuth: true,
    cache: "no-store",
    body: { id },
  });
}

const mapLawyerTask = (item: unknown): LawyerTask => {
  const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};

  return {
    id: toNumber(row.id) ?? 0,
    pid: toNumber(row.pid),
    dob: toNullableString(row.dob),
    doi: toNullableString(row.doi),
    documentId: toNumber(row.document_id),
    lawyerName: toNullableString(row.lawyer_name) ?? "",
    patientName: toNullableString(row.patient_name) ?? "",
    staffNames: (toNullableString(row.staff_names) ?? "")
      .split(/<br\s*\/?>/i)
      .map((name) => stripHtml(name))
      .filter(Boolean),
    title: toNullableString(row.title) ?? "",
    description: toNullableString(row.description) ?? "",
    priorityLabel: toNullableString(row.priority_label) ?? "",
    taskDate: toNullableString(row.task_date) ?? "",
    status: toNumber(row.status) ?? 0,
    type: toNumber(row.type) ?? 0,
    statusLabel: toNullableString(row.status_label) ?? "",
    notesCount: toNumber(row.notes_count) ?? 0,
    lawyerId: toNumber(row.lawyer_id),
    userId: toNumber(row.user_id),
    authorization: toBoolean(row.authorization),
  };
};

export async function getLawyerTasks(query: LawyerTasksQuery = {}): Promise<LawyerTasksPage> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.max(1, query.pageSize ?? 10);
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  params.set("type", String(query.type ?? 1));
  params.set("authorization", String(query.authorization ?? 0));
  params.set("title", query.title ?? "");
  params.set("lawyer", query.lawyer?.trim() ?? "");
  params.set("patient", query.patient?.trim() ?? "");
  params.set("priority", query.priority ?? "");
  params.set("status", query.status ?? "99");
  params.set("staffOnly", query.staffOnly ? "1" : "0");

  const response = await apiRequest<ApiEnvelope>(`${lawyerTasksEndpoint}?${params.toString()}`, {
    method: "GET",
    withAuth: true,
    cache: "no-store",
  });

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};
  const rawTasks = Array.isArray(payload.tasks) ? payload.tasks : [];
  const rawPagination = payload.pagination && typeof payload.pagination === "object"
    ? (payload.pagination as Record<string, unknown>)
    : {};

  return {
    tasks: rawTasks.map(mapLawyerTask).filter((task) => task.id > 0),
    totalItems: toNumber(rawPagination.totalItems) ?? 0,
    filteredItems: toNumber(rawPagination.totalItems) ?? 0,
    page: toNumber(rawPagination.page) ?? page,
    pageSize: toNumber(rawPagination.pageSize) ?? pageSize,
  };
}

export async function updateLawyerTaskStatus(id: number, status: number): Promise<void> {
  await apiRequest(updateLawyerTaskStatusEndpoint, {
    method: "POST",
    withAuth: true,
    cache: "no-store",
    body: { taskId: id, status },
  });
}

export async function deleteLawyerTask(id: number): Promise<void> {
  await apiRequest(deleteLawyerTaskEndpoint, {
    method: "POST",
    withAuth: true,
    cache: "no-store",
    body: { taskId: id },
  });
}

export async function getLawyerTaskNotes(taskId: number): Promise<LawyerTaskNote[]> {
  const response = await apiRequest<ApiEnvelope>(`${getLawyerTaskNotesEndpoint}?taskId=${taskId}`, {
    method: "GET",
    withAuth: true,
    cache: "no-store",
  });

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};
  const rawNotes = Array.isArray(payload.notes) ? payload.notes : [];

  return rawNotes.map((item) => {
    const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};

    return {
      id: toNumber(row.id) ?? 0,
      note: toNullableString(row.note) ?? "",
      createdBy: toNullableString(row.created_by) ?? "",
      createdAt: toNullableString(row.created_at) ?? "",
    };
  });
}

export async function addLawyerTaskNote(input: {
  taskId: number;
  pid: number | null;
  note: string;
}): Promise<void> {
  await apiRequest(addLawyerTaskNoteEndpoint, {
    method: "POST",
    withAuth: true,
    cache: "no-store",
    body: {
      taskId: input.taskId,
      pid: input.pid,
      note: input.note,
    },
  });
}

export async function getEmrNotifications(query: EmrNotificationsQuery = {}): Promise<EmrNotificationsPage> {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.max(1, query.pageSize ?? 10);
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  params.set("read_status", query.readStatus ?? "0");
  params.set("lawyer", query.lawyer?.trim() ?? "");
  params.set("patient", query.patient?.trim() ?? "");
  params.set("title", query.title?.trim() ?? "");

  const response = await apiRequest<ApiEnvelope>(`${getEmrNotificationsEndpoint}?${params.toString()}`, {
    method: "GET",
    withAuth: true,
    cache: "no-store",
  });

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};
  const rawNotifications = Array.isArray(payload.notifications) ? payload.notifications : [];
  const rawPagination = payload.pagination && typeof payload.pagination === "object"
    ? (payload.pagination as Record<string, unknown>)
    : {};

  return {
    notifications: rawNotifications.map((item) => {
      const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};

      return {
        id: toNumber(row.id) ?? 0,
        taskId: toNumber(row.task_id),
        emailId: toNumber(row.email_id),
        pid: toNumber(row.pid),
        lawyerName: toNullableString(row.lawyer_name) ?? "",
        lawyerId: toNumber(row.lawyer_id),
        title: toNullableString(row.title) ?? "",
        message: toNullableString(row.message) ?? "",
        isRead: toBoolean(row.is_read),
        readBy: toNullableString(row.read_by) ?? "",
        createdAt: toNullableString(row.created_at) ?? "",
        patientName: toNullableString(row.patient_name) ?? "",
        fromUser: toNullableString(row.from_user) ?? "",
        taskTitle: toNullableString(row.task_title) ?? "",
        taskDescription: toNullableString(row.task_description) ?? "",
        taskStatus: toNumber(row.task_status),
        taskStatusLabel: toNullableString(row.task_status_label) ?? "",
        authorization: toBoolean(row.authorization),
        authorizationTask: toNullableString(row.authorization_task) ?? "",
        notesCount: toNumber(row.notes_count) ?? 0,
      };
    }).filter((notification) => notification.id > 0),
    totalItems: toNumber(rawPagination.totalItems) ?? 0,
    filteredItems: toNumber(rawPagination.totalItems) ?? 0,
    page: toNumber(rawPagination.page) ?? page,
    pageSize: toNumber(rawPagination.pageSize) ?? pageSize,
  };
}

export async function markEmrNotificationRead(id: number, status = 1): Promise<void> {
  await apiRequest(markEmrNotificationReadEndpoint, {
    method: "POST",
    withAuth: true,
    cache: "no-store",
    body: { id, status },
  });
}

export async function createLawyerTask(input: {
  pid?: number | null;
  title: string;
  description: string;
  priority: number;
}): Promise<{ taskId: number | null; message: string }> {
  const response = await apiRequest<ApiEnvelope>(createLawyerTaskEndpoint, {
    method: "POST",
    withAuth: true,
    cache: "no-store",
    body: input,
  });

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};

  return {
    taskId: toNumber(payload.taskId),
    message: toNullableString(payload.message) ?? "Task created.",
  };
}

export async function saveLawyerNotificationPreference(enabled: boolean): Promise<void> {
  await apiRequest(saveLawyerNotificationPrefEndpoint, {
    method: "POST",
    withAuth: true,
    cache: "no-store",
    body: { enabled },
  });
}

export function getOpenEmrInterfaceUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${baseUrl}/../../interface/${cleanPath}`;
}

export function getOpenEmrDocumentUrl(pid: number, documentId: number): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  const params = new URLSearchParams({
    patient_id: String(pid),
    document_id: String(documentId),
    as_file: "false",
  });

  return `${baseUrl}/../../controller.php?document&retrieve&${params.toString()}`;
}
