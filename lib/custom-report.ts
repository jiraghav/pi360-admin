import { apiRequest } from "@/lib/api-client";

export interface PatientCustomReportData {
  pid: number;
  balance: number | null;
  initialVisit: string | null;
  visits: number | null;
  lastVisit: string | null;
  nextVisit: string | null;
  missedVisit: string | null;
  schedule: number | null;
  referralsReceived: number | null;
  referralsSent: number | null;
  profileUpToDate: boolean;
  profileUpToDateTime: string | null;
  lastMarkedReviewed: string | null;
}

export interface PatientRealReportData {
  balance: number | null;
  visits: number | null;
  schedule: number | null;
  referralsSent: number | null;
  referralsReceived: number | null;
  lastEncounter: string | null;
}

export interface SavePatientCustomReportInput {
  pid: number;
  balance: string;
  initialVisit: string;
  visits: string;
  lastVisit: string;
  nextVisit: string;
  missedVisit: string;
  schedule: string;
  referralsReceived: string;
  referralsSent: string;
  profileUpToDate: boolean;
  action?: "save" | "save_share";
}

interface ApiEnvelope {
  data?: unknown;
}

const toNullableString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value : value == null ? null : String(value);

const toNullableNumber = (value: unknown): number | null => {
  if (value == null) {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const toNullableInt = (value: unknown): number | null => {
  const num = toNullableNumber(value);
  return num == null ? null : Number.isFinite(num) ? Math.trunc(num) : null;
};

const toBoolean = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  if (typeof value === "string") {
    return value === "1" || value.toLowerCase() === "true" || value.toLowerCase() === "yes";
  }
  return false;
};

export async function getPatientCustomReportData(
  pid: number,
): Promise<{ customData: PatientCustomReportData | null; realData: PatientRealReportData | null }> {
  const response = await apiRequest<ApiEnvelope>(
    `get_patient_custom_report_data.php?pid=${encodeURIComponent(String(pid))}`,
    {
      method: "GET",
      withAuth: true,
      cache: "no-store",
    },
  );

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};

  const customRaw = payload.customData && typeof payload.customData === "object"
    ? (payload.customData as Record<string, unknown>)
    : null;

  const realRaw = payload.realData && typeof payload.realData === "object"
    ? (payload.realData as Record<string, unknown>)
    : null;

  const customData: PatientCustomReportData | null = customRaw
    ? {
      pid,
      balance: toNullableNumber(customRaw.balance),
      initialVisit: toNullableString(customRaw.initialVisit),
      visits: toNullableInt(customRaw.visits),
      lastVisit: toNullableString(customRaw.lastVisit),
      nextVisit: toNullableString(customRaw.nextVisit),
      missedVisit: toNullableString(customRaw.missedVisit),
      schedule: toNullableInt(customRaw.schedule),
      referralsReceived: toNullableInt(customRaw.referralsReceived),
      referralsSent: toNullableInt(customRaw.referralsSent),
      profileUpToDate: toBoolean(customRaw.profileUpToDate),
      profileUpToDateTime: toNullableString(customRaw.profileUpToDateTime),
      lastMarkedReviewed: toNullableString(customRaw.lastMarkedReviewed),
    }
    : null;

  const realData: PatientRealReportData | null = realRaw
    ? {
      balance: toNullableNumber(realRaw.balance),
      visits: toNullableInt(realRaw.visits),
      schedule: toNullableInt(realRaw.schedule),
      referralsSent: toNullableInt(realRaw.referralsSent),
      referralsReceived: toNullableInt(realRaw.referralsReceived),
      lastEncounter: toNullableString(realRaw.lastEncounter),
    }
    : null;

  return { customData, realData };
}

export async function savePatientCustomReportData(
  input: SavePatientCustomReportInput,
): Promise<{ patient: { lastUpdated: string | null; profileUpToDate: boolean; profileUpToDateTime: string | null } | null; message: string }> {
  const response = await apiRequest<ApiEnvelope>("update_patient_custom_report_data.php", {
    method: "POST",
    withAuth: true,
    cache: "no-store",
    body: {
      pid: input.pid,
      balance: input.balance,
      initialVisit: input.initialVisit,
      visits: input.visits,
      lastVisit: input.lastVisit,
      nextVisit: input.nextVisit,
      missedVisit: input.missedVisit,
      schedule: input.schedule,
      referralsReceived: input.referralsReceived,
      referralsSent: input.referralsSent,
      profileUpToDate: input.profileUpToDate,
      action: input.action ?? "save",
    },
  });

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};

  const patientRaw = payload.patient && typeof payload.patient === "object"
    ? (payload.patient as Record<string, unknown>)
    : null;

  const patient = patientRaw
    ? {
      lastUpdated: toNullableString(patientRaw.lastUpdated),
      profileUpToDate: toBoolean(patientRaw.profileUpToDate),
      profileUpToDateTime: toNullableString(patientRaw.profileUpToDateTime),
    }
    : null;

  return {
    patient,
    message: typeof payload.message === "string" ? payload.message : "Custom report saved.",
  };
}

export async function markPatientProfileReviewed(
  pid: number,
): Promise<{ lastUpdated: string | null; message: string }> {
  const response = await apiRequest<ApiEnvelope>("mark_patient_profile_reviewed.php", {
    method: "POST",
    withAuth: true,
    cache: "no-store",
    body: { pid },
  });

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};

  const patient = payload.patient && typeof payload.patient === "object"
    ? (payload.patient as Record<string, unknown>)
    : {};

  return {
    lastUpdated: toNullableString(patient.lastUpdated),
    message: typeof payload.message === "string" ? payload.message : "Profile marked as reviewed.",
  };
}

export async function removePatientProfileFromUpToDate(
  pid: number,
): Promise<{ lastUpdated: string | null; message: string }> {
  const response = await apiRequest<ApiEnvelope>("remove_profile_from_up_to_date.php", {
    method: "POST",
    withAuth: true,
    cache: "no-store",
    body: { pid },
  });

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};

  const patient = payload.patient && typeof payload.patient === "object"
    ? (payload.patient as Record<string, unknown>)
    : {};

  return {
    lastUpdated: toNullableString(patient.lastUpdated),
    message: typeof payload.message === "string" ? payload.message : "Profile marked as not up to date.",
  };
}
