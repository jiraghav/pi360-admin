import { apiRequest } from "@/lib/api-client";

export interface PatientClaimRow {
  encounter: number;
  date: string;
  label: string;
  lineCount: number;
}

interface ApiEnvelope {
  data?: unknown;
}

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const toString = (value: unknown): string => (typeof value === "string" ? value : value == null ? "" : String(value));

export async function getPatientClaims(pid: number): Promise<PatientClaimRow[]> {
  const response = await apiRequest<ApiEnvelope>(`get_patient_claims.php?pid=${encodeURIComponent(String(pid))}`, {
    method: "GET",
    withAuth: true,
    cache: "no-store",
  });

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};

  const raw = Array.isArray(payload.claims) ? payload.claims : [];

  return raw
    .map((item) => (item && typeof item === "object" ? (item as Record<string, unknown>) : {}))
    .map((item) => ({
      encounter: toNumber(item.encounter, 0),
      date: toString(item.date),
      label: toString(item.label),
      lineCount: toNumber(item.lineCount, 0),
    }))
    .filter((item) => item.encounter > 0 && item.label);
}

export async function downloadPatient837(
  pid: number,
  encounters: number[],
): Promise<{ filename: string; content: string }> {
  const response = await apiRequest<ApiEnvelope>("download_patient_837.php", {
    method: "POST",
    withAuth: true,
    cache: "no-store",
    body: {
      pid,
      encounters,
    },
  });

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};

  return {
    filename: toString(payload.filename) || "claims_837.txt",
    content: toString(payload.content),
  };
}

