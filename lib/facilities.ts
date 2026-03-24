import { apiRequest } from "@/lib/api-client";

export interface FacilityOption {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
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

export async function getFacilities(search = "", limit = 5000): Promise<FacilityOption[]> {
  const query = new URLSearchParams({
    limit: String(limit),
  });

  if (search.trim()) {
    query.set("search", search.trim());
  }

  const response = await apiRequest<ApiEnvelope>(`facilities.php?${query.toString()}`, {
    method: "GET",
    withAuth: true,
    cache: "no-store",
  });

  const payload = response.data;
  if (!payload || typeof payload !== "object") {
    return [];
  }

  const rawFacilities = (payload as Record<string, unknown>).facilities;
  if (!Array.isArray(rawFacilities)) {
    return [];
  }

  return rawFacilities
    .map((item) => {
      const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};

      return {
        id: toNumber(row.id, 0),
        name: toNullableString(row.name) ?? "",
        city: toNullableString(row.city),
        state: toNullableString(row.state),
      };
    })
    .filter((facility) => facility.id > 0 && facility.name);
}
