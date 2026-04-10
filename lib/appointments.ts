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
  isRecurring: boolean;
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
