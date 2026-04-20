import { apiRequest } from "@/lib/api-client";

export interface PatientAppointment {
  id: number;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  title: string | null;
  status: string | null;
  statusCode: string | null;
  facility: string | null;
  provider: string | null;
  category: string | null;
  categoryId: number | null;
  providerId: number | null;
  facilityId: number | null;
  duration: number | null;
  roomNumber: string | null;
  comments: string | null;
  allDay: boolean;
  scheduledNotifications: string[];
  telemedAppointmentNotification: boolean;
  directorTelemed: boolean;
  patientAppointmentNotification: boolean;
  repeats: boolean;
  repeatEvery: number;
  repeatUnit: "day" | "week" | "month" | "year";
  repeatDaysOfWeek: string[];
  untilDate: string | null;
  isRecurring: boolean;
}

export interface AppointmentFormOption {
  id: number;
  name: string;
}

export interface AppointmentStatusOption {
  code: string;
  name: string;
}

export interface AppointmentNotificationOption {
  code: string;
  name: string;
}

export interface RecurringPatientAppointment {
  id: number;
  category: string | null;
  recurrence: string | null;
  endDate: string | null;
  provider: string | null;
}

export interface PatientAppointmentsResponse {
  appointments: PatientAppointment[];
  recurringAppointments: RecurringPatientAppointment[];
  pastAppointments: PatientAppointment[];
}

export interface AppointmentFormOptions {
  providers: AppointmentFormOption[];
  categories: AppointmentFormOption[];
  facilities: AppointmentFormOption[];
  statuses: AppointmentStatusOption[];
  rooms: AppointmentFormOption[];
  notificationOptions: AppointmentNotificationOption[];
  patient: {
    name: string | null;
    homePhone: string | null;
  };
  permissions: {
    canAdd: boolean;
  };
  defaults: {
    providerId: number | null;
    facilityId: number | null;
    categoryId: number | null;
    duration: number;
    statusCode: string | null;
    allDay: boolean;
    scheduledNotifications: string[];
  };
}

interface ApiEnvelope {
  data?: unknown;
}

const toNullableString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value : null;

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  return fallback;
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    return value === "1" || value.toLowerCase() === "true";
  }

  return false;
};

function mapAppointment(value: unknown): PatientAppointment {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    id: toNumber(row.id, 0),
    date: toNullableString(row.date),
    startTime: toNullableString(row.startTime),
    endTime: toNullableString(row.endTime),
    title: toNullableString(row.title),
    status: toNullableString(row.status),
    statusCode: toNullableString(row.statusCode),
    facility: toNullableString(row.facility),
    provider: toNullableString(row.provider),
    category: toNullableString(row.category),
    categoryId: toNumber(row.categoryId, 0) || null,
    providerId: toNumber(row.providerId, 0) || null,
    facilityId: toNumber(row.facilityId, 0) || null,
    duration: toNumber(row.duration, 0) || null,
    roomNumber: toNullableString(row.roomNumber),
    comments: toNullableString(row.comments),
    allDay: toBoolean(row.allDay),
    scheduledNotifications: Array.isArray(row.scheduledNotifications)
      ? row.scheduledNotifications.filter((item): item is string => typeof item === "string" && item.trim() !== "")
      : [],
    telemedAppointmentNotification: toBoolean(row.telemedAppointmentNotification),
    directorTelemed: toBoolean(row.directorTelemed),
    patientAppointmentNotification: toBoolean(row.patientAppointmentNotification),
    repeats: toBoolean(row.repeats),
    repeatEvery: toNumber(row.repeatEvery, 1) || 1,
    repeatUnit:
      row.repeatUnit === "week" || row.repeatUnit === "month" || row.repeatUnit === "year"
        ? row.repeatUnit
        : "day",
    repeatDaysOfWeek: Array.isArray(row.repeatDaysOfWeek)
      ? row.repeatDaysOfWeek.filter((item): item is string => typeof item === "string" && item.trim() !== "")
      : [],
    untilDate: toNullableString(row.untilDate),
    isRecurring: toBoolean(row.isRecurring),
  };
}

function mapAppointmentList(value: unknown): PatientAppointment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(mapAppointment).filter((item) => item.id > 0);
}

function mapRecurringAppointment(value: unknown): RecurringPatientAppointment {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    id: toNumber(row.id, 0),
    category: toNullableString(row.category),
    recurrence: toNullableString(row.recurrence),
    endDate: toNullableString(row.endDate),
    provider: toNullableString(row.provider),
  };
}

function mapRecurringAppointmentList(value: unknown): RecurringPatientAppointment[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(mapRecurringAppointment).filter((item) => item.id > 0);
}

function mapFormOption(value: unknown): AppointmentFormOption {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    id: toNumber(row.id, 0),
    name: toNullableString(row.name) ?? "",
  };
}

function mapFormOptionList(value: unknown): AppointmentFormOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(mapFormOption).filter((item) => item.id > 0 && item.name);
}

function mapStatusOption(value: unknown): AppointmentStatusOption {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    code: toNullableString(row.code) ?? "",
    name: toNullableString(row.name) ?? "",
  };
}

function mapStatusOptionList(value: unknown): AppointmentStatusOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(mapStatusOption).filter((item) => item.code && item.name);
}

function mapNotificationOption(value: unknown): AppointmentNotificationOption {
  const row = value && typeof value === "object" ? (value as Record<string, unknown>) : {};

  return {
    code: toNullableString(row.code) ?? "",
    name: toNullableString(row.name) ?? "",
  };
}

function mapNotificationOptionList(value: unknown): AppointmentNotificationOption[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(mapNotificationOption).filter((item) => item.code && item.name);
}

export async function getPatientAppointments(pid: number): Promise<PatientAppointmentsResponse> {
  const response = await apiRequest<ApiEnvelope>(`get_patient_appointments.php?pid=${pid}`, {
    method: "GET",
    withAuth: true,
    cache: "no-store",
  });

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};

  return {
    appointments: mapAppointmentList(payload.appointments),
    recurringAppointments: mapRecurringAppointmentList(payload.recurringAppointments),
    pastAppointments: mapAppointmentList(payload.pastAppointments),
  };
}

export async function getAppointmentFormOptions(pid: number): Promise<AppointmentFormOptions> {
  const response = await apiRequest<ApiEnvelope>(`get_appointment_form_options.php?pid=${pid}`, {
    method: "GET",
    withAuth: true,
    cache: "no-store",
  });

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};

  const defaults = payload.defaults && typeof payload.defaults === "object"
    ? (payload.defaults as Record<string, unknown>)
    : {};

  return {
    providers: mapFormOptionList(payload.providers),
    categories: mapFormOptionList(payload.categories),
    facilities: mapFormOptionList(payload.facilities),
    statuses: mapStatusOptionList(payload.statuses),
    rooms: mapFormOptionList(payload.rooms),
    notificationOptions: mapNotificationOptionList(payload.notificationOptions),
    patient: {
      name: toNullableString((payload.patient as Record<string, unknown> | undefined)?.name),
      homePhone: toNullableString((payload.patient as Record<string, unknown> | undefined)?.homePhone),
    },
    permissions: {
      canAdd: toBoolean((payload.permissions as Record<string, unknown> | undefined)?.canAdd),
    },
    defaults: {
      providerId: toNumber(defaults.providerId, 0) || null,
      facilityId: toNumber(defaults.facilityId, 0) || null,
      categoryId: toNumber(defaults.categoryId, 0) || null,
      duration: toNumber(defaults.duration, 60) || 60,
      statusCode: toNullableString(defaults.statusCode),
      allDay: toBoolean(defaults.allDay),
      scheduledNotifications: Array.isArray(defaults.scheduledNotifications)
        ? defaults.scheduledNotifications.filter((item): item is string => typeof item === "string" && item.trim() !== "")
        : [],
    },
  };
}

export async function createPatientAppointment(input: {
  pid: number;
  categoryId: number;
  providerId: number;
  facilityId: number;
  date: string;
  startTime: string;
  duration: number;
  title: string;
  statusCode: string;
  roomNumber?: string;
  comments?: string;
  allDay?: boolean;
  telemedAppointmentNotification?: boolean;
  directorTelemed?: boolean;
  patientAppointmentNotification?: boolean;
  scheduledNotifications?: string[];
  repeats?: boolean;
  repeatEvery?: number;
  repeatUnit?: "day" | "week" | "month" | "year";
  repeatDaysOfWeek?: string[];
  untilDate?: string;
}): Promise<{ appointmentId: number; message: string }> {
  const response = await apiRequest<ApiEnvelope>("create_patient_appointment.php", {
    method: "POST",
    withAuth: true,
    cache: "no-store",
    body: input,
  });

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};

  return {
    appointmentId: toNumber(payload.appointmentId, 0),
    message: toNullableString(payload.message) ?? "Appointment created successfully.",
  };
}

export async function updatePatientAppointment(input: {
  appointmentId: number;
  pid: number;
  categoryId: number;
  providerId: number;
  facilityId: number;
  date: string;
  startTime: string;
  duration: number;
  title: string;
  statusCode: string;
  roomNumber?: string;
  comments?: string;
  allDay?: boolean;
  telemedAppointmentNotification?: boolean;
  directorTelemed?: boolean;
  patientAppointmentNotification?: boolean;
  scheduledNotifications?: string[];
  repeats?: boolean;
  repeatEvery?: number;
  repeatUnit?: "day" | "week" | "month" | "year";
  repeatDaysOfWeek?: string[];
  untilDate?: string;
}): Promise<{ appointmentId: number; message: string }> {
  const response = await apiRequest<ApiEnvelope>("update_patient_appointment.php", {
    method: "POST",
    withAuth: true,
    cache: "no-store",
    body: input,
  });

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};

  return {
    appointmentId: toNumber(payload.appointmentId, 0),
    message: toNullableString(payload.message) ?? "Appointment updated successfully.",
  };
}

export async function deletePatientAppointment(input: {
  appointmentId: number;
  pid: number;
}): Promise<{ appointmentId: number; message: string }> {
  const response = await apiRequest<ApiEnvelope>("delete_patient_appointment.php", {
    method: "POST",
    withAuth: true,
    cache: "no-store",
    body: input,
  });

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};

  return {
    appointmentId: toNumber(payload.appointmentId ?? input.appointmentId, input.appointmentId),
    message: toNullableString(payload.message) ?? "Appointment deleted successfully.",
  };
}
