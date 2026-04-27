import { apiRequest } from "@/lib/api-client";

interface ApiEnvelope {
  data?: unknown;
}

export interface PusherConfig {
  key: string;
  cluster: string;
  userId: number | null;
}

const toNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

export async function getPusherConfig(): Promise<PusherConfig | null> {
  const response = await apiRequest<ApiEnvelope>("get_pusher_config.php", {
    method: "GET",
    withAuth: true,
    cache: "no-store",
  });

  const payload = response.data && typeof response.data === "object"
    ? (response.data as Record<string, unknown>)
    : {};

  const key = typeof payload.key === "string" ? payload.key : "";
  const cluster = typeof payload.cluster === "string" ? payload.cluster : "";

  if (!key || !cluster) {
    return null;
  }

  return {
    key,
    cluster,
    userId: toNumber(payload.userId),
  };
}
