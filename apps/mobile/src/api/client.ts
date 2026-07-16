import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import { getApiBaseUrl } from "@/api/config";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type AccessTokenProvider = () => string | null | Promise<string | null>;

let accessTokenProvider: AccessTokenProvider | null = null;

// Auth lands in Epic 15; until then the client never sources tokens itself.
export function setAccessTokenProvider(provider: AccessTokenProvider | null): void {
  accessTokenProvider = provider;
}

type ApiFetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: Record<string, unknown> | unknown[];
  idempotencyKey?: string;
  signal?: AbortSignal;
};

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  if (!path.startsWith("/")) {
    throw new Error(`apiFetch path must start with "/": got "${path}"`);
  }

  const method = options.method ?? "GET";
  const headers: Record<string, string> = {
    "app-version": Constants.expoConfig?.version ?? "0.0.0",
  };

  // Provider errors are programmer errors — let them propagate rather than swallow.
  const token = accessTokenProvider ? await accessTokenProvider() : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const hasBody = options.body !== undefined;
  if (hasBody) headers["Content-Type"] = "application/json";

  if (MUTATING_METHODS.has(method)) {
    // Empty string counts as absent; never send a blank Idempotency-Key.
    headers["Idempotency-Key"] = options.idempotencyKey || Crypto.randomUUID();
  }

  const res = await fetch(`${getApiBaseUrl()}${path}`, {
    method,
    headers,
    body: hasBody ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  let parsed: unknown;
  try {
    parsed = await res.json();
  } catch {
    throw new ApiError(res.status, `Unexpected non-JSON response (status ${res.status})`);
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    Array.isArray(parsed) ||
    (!("data" in parsed) && !("error" in parsed))
  ) {
    throw new ApiError(res.status, `Unexpected response shape (status ${res.status})`);
  }

  const envelope = parsed as { data?: unknown; error?: unknown };

  // Envelope is the source of truth: a non-null error fails the call even on res.ok.
  if (envelope.error != null || !res.ok) {
    const message =
      envelope.error != null ? String(envelope.error) : `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message);
  }

  return envelope.data as T;
}
