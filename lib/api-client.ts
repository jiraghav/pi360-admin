import { selectedWorkspacePatientStorageKey } from "@/lib/workspace";

export type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiRequestOptions<TBody = unknown>
  extends Omit<RequestInit, "body" | "method" | "headers"> {
  method?: ApiMethod;
  body?: TBody;
  headers?: HeadersInit;
  withAuth?: boolean;
  authToken?: string;
}

const getBaseUrl = (): string => {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  return baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
};

const getAuthTokenFromStorage = (): string | null => {
  if (typeof window === "undefined") {
    return null;
  }
  return localStorage.getItem("authToken");
};

const handleUnauthorizedResponse = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem("authToken");
  localStorage.removeItem("user");
  window.sessionStorage.removeItem(selectedWorkspacePatientStorageKey);
  document.cookie = "authToken=; path=/; max-age=0; SameSite=Strict";

  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
};

const buildUrl = (endpoint: string): string => {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint.slice(1) : endpoint;
  return `${getBaseUrl()}/${cleanEndpoint}`;
};

const inFlightRequests = new Map<string, Promise<unknown>>();
const recentGetCache = new Map<string, { expiresAt: number; value: unknown }>();
const recentGetCacheTtlMs = 250;

export async function apiRequest<TResponse, TBody = unknown>(
  endpoint: string,
  options: ApiRequestOptions<TBody> = {}
): Promise<TResponse> {
  const {
    method = "GET",
    body,
    headers,
    withAuth = false,
    authToken,
    ...rest
  } = options;

  const requestHeaders = new Headers(headers);
  const resolvedToken = authToken ?? (withAuth ? getAuthTokenFromStorage() : null);

  if (resolvedToken) {
    requestHeaders.set("Authorization", `Bearer ${resolvedToken}`);
  }

  let requestBody: BodyInit | undefined;
  if (body !== undefined) {
    if (body instanceof FormData) {
      requestBody = body;
    } else if (typeof body === "string") {
      requestBody = body;
      if (!requestHeaders.has("Content-Type")) {
        requestHeaders.set("Content-Type", "text/plain");
      }
    } else {
      requestBody = JSON.stringify(body);
      if (!requestHeaders.has("Content-Type")) {
        requestHeaders.set("Content-Type", "application/json");
      }
    }
  }

  const url = buildUrl(endpoint);
  const dedupeKey = `${method.toUpperCase()}|${url}|${resolvedToken ?? ""}`;

  if (method === "GET" && requestBody === undefined) {
    const cached = recentGetCache.get(dedupeKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value as TResponse;
    }

    const existing = inFlightRequests.get(dedupeKey);
    if (existing) {
      return existing as Promise<TResponse>;
    }

    const promise = (async () => {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: requestBody,
        ...rest,
      });

      if (response.status === 401) {
        handleUnauthorizedResponse();
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
      }

      if (response.status === 204) {
        return undefined as TResponse;
      }

      const json = (await response.json()) as TResponse;
      recentGetCache.set(dedupeKey, { expiresAt: Date.now() + recentGetCacheTtlMs, value: json });
      return json;
    })().finally(() => {
      inFlightRequests.delete(dedupeKey);
    });

    inFlightRequests.set(dedupeKey, promise as Promise<unknown>);
    return promise;
  }

  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    body: requestBody,
    ...rest,
  });

  if (response.status === 401) {
    handleUnauthorizedResponse();
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Request failed with status ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}
