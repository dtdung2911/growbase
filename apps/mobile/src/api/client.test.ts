import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch, setAccessTokenProvider } from "@/api/client";
import { getApiBaseUrl } from "@/api/config";

vi.mock("expo-constants", () => ({
  default: { expoConfig: { version: "1.2.3" } },
}));

vi.mock("expo-crypto", () => ({
  randomUUID: () => globalThis.crypto.randomUUID(),
}));

const BASE_URL = "http://10.0.0.5:3000";
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CapturedInit = {
  method?: string;
  headers: Record<string, string>;
  body?: string;
  signal?: AbortSignal;
};
type FetchCall = { url: string; init: CapturedInit };

function stubFetch(response: { status?: number; ok?: boolean; json: () => unknown }): FetchCall[] {
  const calls: FetchCall[] = [];
  const status = response.status ?? 200;
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: CapturedInit) => {
      calls.push({ url, init });
      return {
        ok: response.ok ?? (status >= 200 && status < 300),
        status,
        json: async () => response.json(),
      };
    }),
  );
  return calls;
}

beforeEach(() => {
  vi.stubEnv("EXPO_PUBLIC_API_URL", BASE_URL);
  setAccessTokenProvider(() => null);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("apiFetch", () => {
  it("GET sends Authorization + app-version, no Idempotency-Key, returns typed data", async () => {
    setAccessTokenProvider(() => "tok-123");
    const calls = stubFetch({ json: () => ({ data: { id: "h1" }, error: null }) });

    const result = await apiFetch<{ id: string }>("/api/household");

    expect(result).toEqual({ id: "h1" });
    const h = calls[0].init.headers;
    expect(h["Authorization"]).toBe("Bearer tok-123");
    expect(h["app-version"]).toBe("1.2.3");
    expect(h["Idempotency-Key"]).toBeUndefined();
    expect(calls[0].init.method).toBe("GET");
    expect(calls[0].url).toBe(`${BASE_URL}/api/household`);
  });

  it("POST auto-generates a unique v4 Idempotency-Key per call and stringifies body", async () => {
    const calls = stubFetch({ status: 201, json: () => ({ data: { id: "t1" }, error: null }) });

    await apiFetch("/api/transactions", { method: "POST", body: { amount: 10 } });
    await apiFetch("/api/transactions", { method: "POST", body: { amount: 20 } });

    const k1 = calls[0].init.headers["Idempotency-Key"];
    const k2 = calls[1].init.headers["Idempotency-Key"];
    expect(k1).toMatch(UUID_V4);
    expect(k2).toMatch(UUID_V4);
    expect(k1).not.toBe(k2);
    expect(calls[0].init.headers["Content-Type"]).toBe("application/json");
    expect(calls[0].init.body).toBe(JSON.stringify({ amount: 10 }));
  });

  it("POST uses a caller-supplied Idempotency-Key", async () => {
    const calls = stubFetch({ status: 201, json: () => ({ data: null, error: null }) });

    await apiFetch("/api/transactions", { method: "POST", body: {}, idempotencyKey: "abc" });

    expect(calls[0].init.headers["Idempotency-Key"]).toBe("abc");
  });

  it.each(["PUT", "PATCH", "DELETE"] as const)("%s gets an Idempotency-Key", async (method) => {
    const calls = stubFetch({ json: () => ({ data: null, error: null }) });

    await apiFetch("/api/x", { method });

    expect(calls[0].init.headers["Idempotency-Key"]).toMatch(UUID_V4);
  });

  it("treats an empty-string Idempotency-Key as absent and generates a UUID", async () => {
    const calls = stubFetch({ status: 201, json: () => ({ data: null, error: null }) });

    await apiFetch("/api/transactions", { method: "POST", body: {}, idempotencyKey: "" });

    expect(calls[0].init.headers["Idempotency-Key"]).toMatch(UUID_V4);
  });

  it("throws ApiError with envelope status + message on a 400 error envelope", async () => {
    stubFetch({ status: 400, json: () => ({ data: null, error: "msg" }) });

    await expect(apiFetch("/api/x")).rejects.toBeInstanceOf(ApiError);
    await expect(apiFetch("/api/x")).rejects.toMatchObject({ status: 400, message: "msg" });
  });

  it("throws when body.error is non-null even if res.ok (envelope wins)", async () => {
    stubFetch({ status: 200, ok: true, json: () => ({ data: null, error: "x" }) });

    await expect(apiFetch("/api/x")).rejects.toMatchObject({ status: 200, message: "x" });
  });

  it("coerces a non-string envelope error so message is never [object Object]", async () => {
    stubFetch({ status: 400, json: () => ({ data: null, error: { code: 7 } }) });

    await expect(apiFetch("/api/x")).rejects.toMatchObject({ message: "[object Object]" });
  });

  it("throws a generic ApiError on a non-JSON response without crashing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        status: 502,
        json: async () => {
          throw new SyntaxError("Unexpected token < in JSON at position 0");
        },
      })),
    );

    await expect(apiFetch("/api/x")).rejects.toBeInstanceOf(ApiError);
    await expect(apiFetch("/api/x")).rejects.toMatchObject({ status: 502 });
    await expect(apiFetch("/api/x")).rejects.toThrow(/non-JSON/);
  });

  it.each([{ label: "array", body: [] as unknown[] }, { label: "null", body: null }])(
    "throws ApiError when res.ok but the JSON body is a non-envelope $label",
    async ({ body }) => {
      stubFetch({ status: 200, ok: true, json: () => body });

      await expect(apiFetch("/api/x")).rejects.toBeInstanceOf(ApiError);
      await expect(apiFetch("/api/x")).rejects.toThrow(/shape/);
    },
  );

  it("awaits an async token provider and sets Authorization", async () => {
    setAccessTokenProvider(async () => "async-tok");
    const calls = stubFetch({ json: () => ({ data: {}, error: null }) });

    await apiFetch("/api/x");

    expect(calls[0].init.headers["Authorization"]).toBe("Bearer async-tok");
  });

  it("omits Authorization when no token is available", async () => {
    const calls = stubFetch({ json: () => ({ data: {}, error: null }) });

    await apiFetch("/api/x");

    expect(calls[0].init.headers["Authorization"]).toBeUndefined();
    expect(calls[0].init.headers["app-version"]).toBe("1.2.3");
  });

  it("omits Authorization after the provider is cleared with null", async () => {
    setAccessTokenProvider(() => "tok-123");
    setAccessTokenProvider(null);
    const calls = stubFetch({ json: () => ({ data: {}, error: null }) });

    await apiFetch("/api/x");

    expect(calls[0].init.headers["Authorization"]).toBeUndefined();
  });

  it("fails fast when the path has no leading slash", async () => {
    await expect(apiFetch("api/x")).rejects.toThrow(/api\/x/);
  });

  it("passes the abort signal through to fetch", async () => {
    const calls = stubFetch({ json: () => ({ data: {}, error: null }) });
    const controller = new AbortController();

    await apiFetch("/api/x", { signal: controller.signal });

    expect(calls[0].init.signal).toBe(controller.signal);
  });

  it("fails fast when the base URL env is missing", async () => {
    vi.stubEnv("EXPO_PUBLIC_API_URL", undefined);

    await expect(apiFetch("/api/x")).rejects.toThrow(/EXPO_PUBLIC_API_URL/);
  });
});

describe("getApiBaseUrl", () => {
  it("throws naming the env var when unset", () => {
    vi.stubEnv("EXPO_PUBLIC_API_URL", undefined);

    expect(() => getApiBaseUrl()).toThrow(/EXPO_PUBLIC_API_URL/);
  });

  it("strips trailing slashes", () => {
    vi.stubEnv("EXPO_PUBLIC_API_URL", "http://host:3000/");

    expect(getApiBaseUrl()).toBe("http://host:3000");
  });

  it("throws on a whitespace-only value", () => {
    vi.stubEnv("EXPO_PUBLIC_API_URL", "   ");

    expect(() => getApiBaseUrl()).toThrow(/EXPO_PUBLIC_API_URL/);
  });

  it("throws when the value has no http(s) scheme", () => {
    vi.stubEnv("EXPO_PUBLIC_API_URL", "///");

    expect(() => getApiBaseUrl()).toThrow(/EXPO_PUBLIC_API_URL/);
  });
});
