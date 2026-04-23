import { apiRequest } from "@/lib/api-client";

interface ApiEnvelope {
  data?: unknown;
}

export interface PatientCopyDetailsAddress {
  street: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
}

export interface PatientCopyDetails {
  pid: number;
  name: string;
  dob: string;
  doi: string;
  phone: string;
  lawyer: string;
  address: PatientCopyDetailsAddress;
}

const toNullableString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value : value == null ? null : String(value);

const toString = (value: unknown): string => (typeof value === "string" ? value : value == null ? "" : String(value));

export async function getPatientCopyDetails(pid: number): Promise<PatientCopyDetails | null> {
  const response = await apiRequest<ApiEnvelope>(`get_patient_copy_details.php?pid=${encodeURIComponent(String(pid))}`, {
    method: "GET",
    withAuth: true,
    cache: "no-store",
  });

  const payload = response.data && typeof response.data === "object" ? (response.data as Record<string, unknown>) : {};
  const raw = payload.details && typeof payload.details === "object" ? (payload.details as Record<string, unknown>) : null;
  if (!raw) {
    return null;
  }

  const addressRaw = raw.address && typeof raw.address === "object" ? (raw.address as Record<string, unknown>) : {};

  return {
    pid: typeof raw.pid === "number" ? raw.pid : Number(raw.pid ?? 0),
    name: toString(raw.name),
    dob: toString(raw.dob),
    doi: toString(raw.doi),
    phone: toString(raw.phone),
    lawyer: toString(raw.lawyer),
    address: {
      street: toNullableString(addressRaw.street),
      city: toNullableString(addressRaw.city),
      state: toNullableString(addressRaw.state),
      postalCode: toNullableString(addressRaw.postalCode),
    },
  };
}

