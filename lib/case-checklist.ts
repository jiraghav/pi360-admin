import { apiRequest } from "@/lib/api-client";

export interface PatientCaseChecklist {
  hasIdUploaded: boolean;
  hasIntakeUploaded: boolean;
  liabilityCleared: boolean;
  limits: string | null;
  policeReport: boolean;
  underinsured: boolean;
  uninsured: boolean;
  hasLopUploaded: boolean;
  hasOswestryDisabilityIndexUploaded: boolean;
  hasHeadacheDisabilityIndexUploaded: boolean;
  hasDutiesPerformedUnderDuressUploaded: boolean;
  hasHospitalRecordsReceivedUploaded: boolean;
  hasLienSentOutUploaded: boolean;
  hasBillsAndRecordsUploaded: boolean;
}

export interface PatientReportTrackingRow {
  key: string;
  title: string;
  sentDates: string[];
  receivedDates: string[];
}

interface ApiEnvelope {
  data?: unknown;
}

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

const toStringOrNull = (value: unknown): string | null => {
  if (typeof value !== "string") {
    return value == null ? null : String(value);
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : item == null ? "" : String(item).trim()))
    .filter(Boolean);
};

export async function getPatientCaseChecklist(
  pid: number,
): Promise<{ checklist: PatientCaseChecklist; reports: PatientReportTrackingRow[] }> {
  const response = await apiRequest<ApiEnvelope>(`get_patient_case_checklist.php?pid=${encodeURIComponent(String(pid))}`, {
    method: "GET",
    withAuth: true,
    cache: "no-store",
  });

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};

  const checklistRaw = payload.checklist && typeof payload.checklist === "object"
    ? (payload.checklist as Record<string, unknown>)
    : {};

  const reportsRaw = Array.isArray(payload.reports) ? payload.reports : [];

  const checklist: PatientCaseChecklist = {
    hasIdUploaded: toBoolean(checklistRaw.hasIdUploaded),
    hasIntakeUploaded: toBoolean(checklistRaw.hasIntakeUploaded),
    liabilityCleared: toBoolean(checklistRaw.liabilityCleared),
    limits: toStringOrNull(checklistRaw.limits),
    policeReport: toBoolean(checklistRaw.policeReport),
    underinsured: toBoolean(checklistRaw.underinsured),
    uninsured: toBoolean(checklistRaw.uninsured),
    hasLopUploaded: toBoolean(checklistRaw.hasLopUploaded),
    hasOswestryDisabilityIndexUploaded: toBoolean(checklistRaw.hasOswestryDisabilityIndexUploaded),
    hasHeadacheDisabilityIndexUploaded: toBoolean(checklistRaw.hasHeadacheDisabilityIndexUploaded),
    hasDutiesPerformedUnderDuressUploaded: toBoolean(checklistRaw.hasDutiesPerformedUnderDuressUploaded),
    hasHospitalRecordsReceivedUploaded: toBoolean(checklistRaw.hasHospitalRecordsReceivedUploaded),
    hasLienSentOutUploaded: toBoolean(checklistRaw.hasLienSentOutUploaded),
    hasBillsAndRecordsUploaded: toBoolean(checklistRaw.hasBillsAndRecordsUploaded),
  };

  const reports = reportsRaw
    .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : {}))
    .map((item) => ({
      key: typeof item.key === "string" ? item.key : "",
      title: typeof item.title === "string" ? item.title : "",
      sentDates: toStringArray(item.sentDates),
      receivedDates: toStringArray(item.receivedDates),
    }))
    .filter((item) => item.key && item.title);

  return { checklist, reports };
}

