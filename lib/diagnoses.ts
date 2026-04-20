import { apiRequest } from "@/lib/api-client";

export interface DiagnosisIssueSubtypeOption {
  id: string;
  title: string;
}

export interface DiagnosisIssueOption {
  id: string;
  title: string;
  subtypeId: string | null;
  subtypeTitle: string | null;
  codes: string | null;
}

export interface DiagnosisIssueOptionsResponse {
  subtypes: DiagnosisIssueSubtypeOption[];
  issues: DiagnosisIssueOption[];
}

export interface PatientDiagnosisRecord {
  id: number;
  pid: number;
  issueType: string;
  issueOptionId: string;
  issueTitle: string;
  subtypeOptionId: string | null;
  subtypeTitle: string | null;
  codes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface ApiEnvelope {
  data?: unknown;
}

const toNullableString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value : null;

const toStringValue = (value: unknown): string =>
  typeof value === "string" ? value : value === null || value === undefined ? "" : String(value);

export async function getDiagnosisIssueOptions(
  issueType: string = "medical_problem",
): Promise<DiagnosisIssueOptionsResponse> {
  const response = await apiRequest<ApiEnvelope>(
    `get_diagnosis_issue_options.php?thistype=${encodeURIComponent(issueType)}`,
    {
      method: "GET",
      withAuth: true,
      cache: "no-store",
    },
  );

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};

  const subtypesRaw = Array.isArray(payload.subtypes) ? payload.subtypes : [];
  const issuesRaw = Array.isArray(payload.issues) ? payload.issues : [];

  return {
    subtypes: subtypesRaw
      .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : {}))
      .map((item) => ({
        id: toStringValue(item.id).trim(),
        title: toStringValue(item.title).trim(),
      }))
      .filter((item) => item.id && item.title),
    issues: issuesRaw
      .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : {}))
      .map((item) => ({
        id: toStringValue(item.id).trim(),
        title: toStringValue(item.title).trim(),
        subtypeId: toNullableString(item.subtypeId ? toStringValue(item.subtypeId).trim() : null),
        subtypeTitle: toNullableString(item.subtypeTitle ? toStringValue(item.subtypeTitle).trim() : null),
        codes: toNullableString(item.codes ? toStringValue(item.codes).trim() : null),
      }))
      .filter((item) => item.id && item.title),
  };
}

export async function getPatientDiagnoses(pid: number, issueType: string = "medical_problem"): Promise<PatientDiagnosisRecord[]> {
  const response = await apiRequest<ApiEnvelope>(
    `get_patient_diagnoses.php?pid=${encodeURIComponent(String(pid))}&type=${encodeURIComponent(issueType)}`,
    {
      method: "GET",
      withAuth: true,
      cache: "no-store",
    },
  );

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};

  const diagnosesRaw = Array.isArray(payload.diagnoses) ? payload.diagnoses : [];

  return diagnosesRaw
    .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : {}))
    .map((item) => ({
      id: Number(item.id ?? 0),
      pid: Number(item.pid ?? 0),
      issueType: toStringValue(item.issueType).trim(),
      issueOptionId: toStringValue(item.issueOptionId).trim(),
      issueTitle: toStringValue(item.issueTitle).trim(),
      subtypeOptionId: toNullableString(item.subtypeOptionId ? toStringValue(item.subtypeOptionId).trim() : null),
      subtypeTitle: toNullableString(item.subtypeTitle ? toStringValue(item.subtypeTitle).trim() : null),
      codes: toNullableString(item.codes ? toStringValue(item.codes).trim() : null),
      createdAt: toNullableString(item.createdAt ? toStringValue(item.createdAt).trim() : null),
      updatedAt: toNullableString(item.updatedAt ? toStringValue(item.updatedAt).trim() : null),
    }))
    .filter((item) => Number.isFinite(item.id) && item.id > 0);
}

export async function savePatientDiagnosis(input: {
  pid: number;
  issueType?: string;
  issueOptionId?: string;
  issueOptionIds?: string[];
  diagnosisId?: number;
}): Promise<{ diagnosisId: number; diagnosisIds: number[]; skippedIssueOptionIds: string[]; message: string }> {
  const response = await apiRequest<ApiEnvelope>("save_patient_diagnosis.php", {
    method: "POST",
    withAuth: true,
    cache: "no-store",
    body: {
      pid: input.pid,
      type: input.issueType ?? "medical_problem",
      issueOptionId: input.issueOptionId ?? "",
      issueOptionIds: input.issueOptionIds ?? [],
      diagnosisId: input.diagnosisId ?? 0,
    },
  });

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};

  const diagnosisIdsRaw = Array.isArray(payload.diagnosisIds) ? payload.diagnosisIds : [];
  const skippedRaw = Array.isArray(payload.skippedIssueOptionIds) ? payload.skippedIssueOptionIds : [];

  const diagnosisIds = diagnosisIdsRaw.map((item) => Number(item)).filter((item) => Number.isFinite(item) && item > 0);

  return {
    diagnosisId: Number(payload.diagnosisId ?? 0),
    diagnosisIds,
    skippedIssueOptionIds: skippedRaw.map((item) => toStringValue(item).trim()).filter(Boolean),
    message: toStringValue(payload.message).trim() || "Saved.",
  };
}

export async function deletePatientDiagnosis(input: { pid: number; diagnosisId: number }): Promise<{ message: string }> {
  const response = await apiRequest<ApiEnvelope>("delete_patient_diagnosis.php", {
    method: "POST",
    withAuth: true,
    cache: "no-store",
    body: input,
  });

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};

  return {
    message: toStringValue(payload.message).trim() || "Removed.",
  };
}
