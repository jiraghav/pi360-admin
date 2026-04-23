import { apiRequest } from "@/lib/api-client";

interface ApiEnvelope {
  data?: unknown;
}

const toString = (value: unknown): string => (typeof value === "string" ? value : value == null ? "" : String(value));

export async function getPatientTreatmentPlan(pid: number): Promise<string> {
  const response = await apiRequest<unknown>(`get_patient_treatment_plan.php?pid=${encodeURIComponent(String(pid))}`, {
    method: "GET",
    withAuth: true,
    cache: "no-store",
  });

  if (typeof response === "string") {
    return response;
  }

  if (!response || typeof response !== "object") {
    return "";
  }

  const record = response as Record<string, unknown>;
  const data = record.data;

  if (typeof data === "string") {
    return data;
  }

  const payload = data && typeof data === "object"
    ? (data as Record<string, unknown>)
    : record;

  return toString(
    payload.treatmentPlan ??
      payload.treatment_plan ??
      payload.plan ??
      payload.text ??
      record.treatmentPlan ??
      record.treatment_plan,
  );
}

export interface TreatmentPlanNote {
  id: number;
  body: string;
  createdAt: string;
  shared: boolean;
}

export async function getPatientTreatmentPlanNotes(pid: number): Promise<TreatmentPlanNote[]> {
  const response = await apiRequest<ApiEnvelope>(
    `get_patient_treatment_plan_notes.php?pid=${encodeURIComponent(String(pid))}`,
    {
      method: "GET",
      withAuth: true,
      cache: "no-store",
    },
  );

  const payload = response.data && typeof response.data === "object" ? (response.data as Record<string, unknown>) : {};
  const raw = Array.isArray(payload.notes) ? payload.notes : [];

  return raw
    .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : {}))
    .map((item) => ({
      id: typeof item.id === "number" ? item.id : Number(item.id ?? 0),
      body: toString(item.body),
      createdAt: toString(item.createdAt),
      shared: Boolean(item.shared),
    }))
    .filter((note) => Number.isFinite(note.id) && note.id > 0);
}

export async function savePatientTreatmentPlan(params: {
  pid: number;
  treatmentPlan: string;
  action: "save" | "save_share";
}): Promise<{ treatmentPlan: string; message: string }> {
  const response = await apiRequest<ApiEnvelope>("update_patient_treatment_plan.php", {
    method: "POST",
    withAuth: true,
    cache: "no-store",
    body: params,
  });

  const payload = response.data && typeof response.data === "object" ? (response.data as Record<string, unknown>) : {};
  return {
    treatmentPlan: toString(payload.treatmentPlan),
    message: toString(payload.message),
  };
}
