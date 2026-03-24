import { apiRequest } from "@/lib/api-client";

export interface PatientListItem {
  pid: number | null;
  uuid: string | null;
  name: string;
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

interface ApiEnvelope {
  data?: unknown;
}

interface GetPatientsPageOptions {
  page?: number;
  pageSize?: number;
  search?: string;
}

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
