import { apiRequest } from "@/lib/api-client";

export interface PatientListItem {
  pid: number | null;
  uuid: string | null;
  name: string;
  facilityId: number | null;
  dob: string | null;
  doi: string | null;
  lastUpdated: string | null;
  lastVisit: string | null;
  nextVisit: string | null;
  phone: string | null;
  email: string | null;
  balance: number;
  facility: string | null;
  status: string | null;
  needsUpdate: boolean;
}

export interface PatientsPagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface PatientsPage {
  patients: PatientListItem[];
  pagination: PatientsPagination;
}

export interface SavePatientDemographicsInput {
  pid: number;
  name: string;
  phone: string;
  email: string;
  facilityId: number | null;
  dob: string;
  doi: string;
}

export interface CreatePatientInput {
  firstName: string;
  lastName: string;
  dob?: string;
  doi?: string;
  phone?: string;
  email?: string;
  facilityId?: number | null;
  status?: string;
}

export interface PatientStatusOption {
  id: string;
  title: string;
}

export interface SavePatientVisitsBillingInput {
  pid: number;
  lastVisit: string;
  initialVisit?: string;
  nextVisit: string;
  missedVisit?: string;
  visits?: string;
  schedule?: string;
  referralsReceived?: string;
  referralsSent?: string;
  profileUpToDate?: boolean;
  balance: string;
  action?: "save" | "save_share";
}

interface ApiEnvelope {
  data?: unknown;
}

interface GetPatientsPageOptions {
  page?: number;
  pageSize?: number;
  search?: string;
}

type PatientPatch = Partial<PatientListItem>;

const fallbackPagination: PatientsPagination = {
  page: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 1,
};

const toNumber = (value: unknown, defaultValue = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }

  return defaultValue;
};

const toNullableString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value : null;

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

const pickNumber = (
  source: Record<string, unknown>,
  keys: string[],
  fallback: number,
): number => {
  for (const key of keys) {
    if (key in source) {
      return toNumber(source[key], fallback);
    }
  }

  return fallback;
};

const mapPatients = (payload: unknown): PatientListItem[] => {
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const data = payload as Record<string, unknown>;
  const rawPatients = data.patients;

  if (!Array.isArray(rawPatients)) {
    return [];
  }

  return rawPatients.map((item) => {
    const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};

    return {
      pid: row.pid == null ? null : toNumber(row.pid, 0),
      uuid: toNullableString(row.uuid),
      name: typeof row.name === "string" ? row.name : "",
      facilityId: row.facilityId == null ? null : toNumber(row.facilityId, 0),
      dob: toNullableString(row.dob),
      doi: toNullableString(row.doi),
      lastUpdated: toNullableString(row.lastUpdated),
      lastVisit: toNullableString(row.lastVisit),
      nextVisit: toNullableString(row.nextVisit),
      phone: toNullableString(row.phone),
      email: toNullableString(row.email),
      balance: toNumber(row.balance, 0),
      facility: toNullableString(row.facility),
      status: toNullableString(row.status),
      needsUpdate: toBoolean(row.needsUpdate),
    };
  });
};

const mapPatientPatch = (payload: unknown): PatientPatch | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const row = payload as Record<string, unknown>;
  const patch: PatientPatch = {};

  if ("pid" in row) {
    patch.pid = row.pid == null ? null : toNumber(row.pid, 0);
  }
  if ("uuid" in row) {
    patch.uuid = toNullableString(row.uuid);
  }
  if ("name" in row) {
    patch.name = typeof row.name === "string" ? row.name : "";
  }
  if ("facilityId" in row) {
    patch.facilityId = row.facilityId == null ? null : toNumber(row.facilityId, 0);
  }
  if ("dob" in row) {
    patch.dob = toNullableString(row.dob);
  }
  if ("doi" in row) {
    patch.doi = toNullableString(row.doi);
  }
  if ("lastUpdated" in row) {
    patch.lastUpdated = toNullableString(row.lastUpdated);
  }
  if ("lastVisit" in row) {
    patch.lastVisit = toNullableString(row.lastVisit);
  }
  if ("nextVisit" in row) {
    patch.nextVisit = toNullableString(row.nextVisit);
  }
  if ("phone" in row) {
    patch.phone = toNullableString(row.phone);
  }
  if ("email" in row) {
    patch.email = toNullableString(row.email);
  }
  if ("balance" in row) {
    patch.balance = toNumber(row.balance, 0);
  }
  if ("facility" in row) {
    patch.facility = toNullableString(row.facility);
  }
  if ("status" in row) {
    patch.status = toNullableString(row.status);
  }
  if ("needsUpdate" in row) {
    patch.needsUpdate = toBoolean(row.needsUpdate);
  }

  return patch;
};

const mapPagination = (payload: unknown): PatientsPagination => {
  if (!payload || typeof payload !== "object") {
    return fallbackPagination;
  }

  const data = payload as Record<string, unknown>;
  const rawPagination =
    data.pagination && typeof data.pagination === "object"
      ? (data.pagination as Record<string, unknown>)
      : {};

  const page = pickNumber(rawPagination, ["page", "currentPage"], fallbackPagination.page);
  const pageSize = Math.max(
    1,
    pickNumber(rawPagination, ["pageSize", "perPage"], fallbackPagination.pageSize),
  );
  const totalItems = Math.max(
    0,
    pickNumber(rawPagination, ["totalItems", "total", "count"], fallbackPagination.totalItems),
  );
  const totalPages = Math.max(
    1,
    pickNumber(
      rawPagination,
      ["totalPages"],
      Math.max(1, Math.ceil(totalItems / pageSize)),
    ),
  );

  return {
    page: Math.min(Math.max(1, page), totalPages),
    pageSize,
    totalItems,
    totalPages,
  };
};

export async function getPatientsPage(
  options: GetPatientsPageOptions = {},
): Promise<PatientsPage> {
  const page = Math.max(1, Math.floor(options.page ?? fallbackPagination.page));
  const pageSize = Math.max(1, Math.floor(options.pageSize ?? fallbackPagination.pageSize));
  const search = (options.search ?? "").trim();

  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  if (search) {
    query.set("search", search);
  }

  const response = await apiRequest<ApiEnvelope>(`patients.php?${query.toString()}`, {
    method: "GET",
    withAuth: true,
    cache: "no-store",
  });

  return {
    patients: mapPatients(response.data),
    pagination: mapPagination(response.data),
  };
}

export async function createPatient(input: CreatePatientInput): Promise<{ patient: PatientListItem | null; message: string }> {
  const response = await apiRequest<ApiEnvelope>("create_patient.php", {
    method: "POST",
    withAuth: true,
    cache: "no-store",
    body: input,
  });

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};
  const patients = mapPatients({ patients: payload.patient ? [payload.patient] : [] });

  return {
    patient: patients[0] ?? null,
    message: typeof payload.message === "string" ? payload.message : "Patient created.",
  };
}

export async function getPatientStatusOptions(search = "", limit = 100): Promise<PatientStatusOption[]> {
  const query = new URLSearchParams({
    limit: String(limit),
  });

  if (search.trim()) {
    query.set("search", search.trim());
  }

  const response = await apiRequest<ApiEnvelope>(`patient_status_options.php?${query.toString()}`, {
    method: "GET",
    withAuth: true,
    cache: "no-store",
  });

  const payload = response.data;
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const rawStatuses = (payload as Record<string, unknown>).statuses;
  if (!Array.isArray(rawStatuses)) {
    return [];
  }

  return rawStatuses
    .map((item) => {
      const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
      const id = toNullableString(row.id) ?? "";
      const title = toNullableString(row.title) ?? id;

      return { id, title };
    })
    .filter((status) => status.id && status.title);
}

export async function savePatientDemographics(
  input: SavePatientDemographicsInput,
): Promise<{ patient: PatientPatch | null; message: string }> {
  const response = await apiRequest<ApiEnvelope>("update_patient_demographics.php", {
    method: "POST",
    withAuth: true,
    cache: "no-store",
    body: input,
  });

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};

  return {
    patient: mapPatientPatch(payload.patient),
    message: typeof payload.message === "string" ? payload.message : "Patient demographics saved.",
  };
}

export async function savePatientVisitsBilling(
  input: SavePatientVisitsBillingInput,
): Promise<{ patient: PatientPatch | null; message: string }> {
  const response = await apiRequest<ApiEnvelope>("update_patient_visits_billing.php", {
    method: "POST",
    withAuth: true,
    cache: "no-store",
    body: input,
  });

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};

  return {
    patient: mapPatientPatch(payload.patient),
    message: typeof payload.message === "string" ? payload.message : "Visits and billing saved.",
  };
}
