import { apiRequest } from "@/lib/api-client";

export interface DashboardSummary {
  activePatients: number;
  unpaidBalance: number;
  totalSubmitted: number;
  pendingReferrals: number;
  needsUpdate: number;
  newNotes: number;
}

export interface NeedsUpdatePatient {
  pid: number | null;
  name: string;
  dob: string | null;
  doi: string | null;
  lastUpdated: string | null;
  facility: string | null;
}

export interface NeedsUpdatePagination {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface NeedsUpdatePatientsPage {
  patients: NeedsUpdatePatient[];
  pagination: NeedsUpdatePagination;
}

interface ApiEnvelope {
  data?: unknown;
}

interface NeedsUpdateQueryOptions {
  page?: number;
  pageSize?: number;
}

const fallbackSummary: DashboardSummary = {
  activePatients: 0,
  unpaidBalance: 0,
  totalSubmitted: 0,
  pendingReferrals: 0,
  needsUpdate: 0,
  newNotes: 0,
};

const fallbackNeedsUpdatePage: NeedsUpdatePatientsPage = {
  patients: [],
  pagination: {
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 1,
  },
};

const toNumber = (value: unknown, defaultValue = 0): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : defaultValue;
  }
  return defaultValue;
};

const pick = (obj: Record<string, unknown>, keys: string[], fallback = 0): number => {
  for (const key of keys) {
    if (key in obj) {
      return toNumber(obj[key], fallback);
    }
  }
  return fallback;
};

const mapNeedsUpdatePatients = (payload: unknown): NeedsUpdatePatient[] => {
  if (!payload || typeof payload !== "object") {
    return fallbackNeedsUpdatePage.patients;
  }

  const data = payload as Record<string, unknown>;
  const source =
    typeof data.summary === "object" && data.summary !== null
      ? (data.summary as Record<string, unknown>)
      : data;

  const rawPatients = source.needsUpdatePatients ?? data.needsUpdatePatients;

  if (!Array.isArray(rawPatients)) {
    return [];
  }

  return rawPatients.map((item) => {
    const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    return {
      pid: row.pid == null ? null : toNumber(row.pid, 0),
      name: typeof row.name === "string" ? row.name : "",
      dob: typeof row.dob === "string" ? row.dob : null,
      doi: typeof row.doi === "string" ? row.doi : null,
      lastUpdated:
        typeof row.lastUpdated === "string"
          ? row.lastUpdated
            : null,
      facility: typeof row.facility === "string" ? row.facility : null,
    };
  });
};

const mapNeedsUpdatePagination = (payload: unknown): NeedsUpdatePagination => {
  if (!payload || typeof payload !== "object") {
    return fallbackNeedsUpdatePage.pagination;
  }

  const data = payload as Record<string, unknown>;
  const source =
    typeof data.summary === "object" && data.summary !== null
      ? (data.summary as Record<string, unknown>)
      : data;

  const rawPagination = source.needsUpdatePagination ?? data.needsUpdatePagination;

  const base =
    rawPagination && typeof rawPagination === "object"
      ? (rawPagination as Record<string, unknown>)
      : {};

  const page = pick(base, ["page", "currentPage"], fallbackNeedsUpdatePage.pagination.page);
  const pageSize = pick(
    base,
    ["pageSize", "perPage"],
    fallbackNeedsUpdatePage.pagination.pageSize,
  );
  const totalItems = pick(
    base,
    ["totalItems", "total", "count"],
    fallbackNeedsUpdatePage.pagination.totalItems,
  );

  const safePageSize = Math.max(1, pageSize);
  const fallbackTotalPages = Math.max(1, Math.ceil(Math.max(totalItems, 0) / safePageSize));
  const totalPages = pick(base, ["totalPages"], fallbackTotalPages);
  const safeTotalPages = Math.max(1, totalPages);

  return {
    page: Math.min(Math.max(1, page), safeTotalPages),
    pageSize: safePageSize,
    totalItems: Math.max(0, totalItems),
    totalPages: safeTotalPages,
  };
};

const mapDashboardSummary = (payload: unknown): DashboardSummary => {
  if (!payload || typeof payload !== "object") {
    return fallbackSummary;
  }

  const data = payload as Record<string, unknown>;
  const source =
    typeof data.summary === "object" && data.summary !== null
      ? (data.summary as Record<string, unknown>)
      : data;

  return {
    activePatients: pick(source, ["activePatients"], fallbackSummary.activePatients),
    unpaidBalance: pick(source, ["unpaidBalance"], fallbackSummary.unpaidBalance),
    totalSubmitted: pick(source, ["totalSubmitted"], fallbackSummary.totalSubmitted),
    pendingReferrals: pick(source, ["pendingReferrals"], fallbackSummary.pendingReferrals),
    needsUpdate: pick(source, ["needsUpdate"], fallbackSummary.needsUpdate),
    newNotes: pick(source, ["newNotes"], fallbackSummary.newNotes),
  };
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await apiRequest<ApiEnvelope>("dashboard.php", {
    method: "GET",
    withAuth: true,
    cache: "no-store",
  });

  return mapDashboardSummary(response.data);
}

export async function getNeedsUpdatePatientsPage(
  options: NeedsUpdateQueryOptions = {},
): Promise<NeedsUpdatePatientsPage> {
  const page = Math.max(1, Math.floor(options.page ?? fallbackNeedsUpdatePage.pagination.page));
  const pageSize = Math.max(1, Math.floor(options.pageSize ?? fallbackNeedsUpdatePage.pagination.pageSize));

  const query = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  });

  const response = await apiRequest<ApiEnvelope>(`needs_update_patients.php?${query.toString()}`, {
    method: "GET",
    withAuth: true,
    cache: "no-store",
  });

  const data = response.data;

  return {
    patients: mapNeedsUpdatePatients(data),
    pagination: mapNeedsUpdatePagination(data),
  };
}
