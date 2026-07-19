import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  mmkv: new Map<string, string>(),
  secure: new Map<string, string>(),
}));

vi.mock("react-native-mmkv", () => ({
  createMMKV: () => ({
    getString: (k: string) => mocks.mmkv.get(k),
    set: (k: string, v: string) => {
      mocks.mmkv.set(k, v);
    },
    remove: (k: string) => {
      mocks.mmkv.delete(k);
    },
  }),
}));

vi.mock("expo-secure-store", () => ({
  getItemAsync: async (k: string) => mocks.secure.get(k) ?? null,
  setItemAsync: async (k: string, v: string) => {
    mocks.secure.set(k, v);
  },
  deleteItemAsync: async (k: string) => {
    mocks.secure.delete(k);
  },
}));

vi.mock("expo-crypto", () => ({
  getRandomBytes: (n: number) => globalThis.crypto.getRandomValues(new Uint8Array(n)),
}));

import { largeSecureStore } from "@/lib/supabase/largeSecureStore";

const KEY = "sb-auth-token";
const SESSION = JSON.stringify({ access_token: "tok", refresh_token: "ref", user: { id: "u1" } });

beforeEach(() => {
  mocks.mmkv.clear();
  mocks.secure.clear();
});

describe("largeSecureStore", () => {
  it("encrypt/decrypt round-trips and keeps the raw blob out of SecureStore", async () => {
    await largeSecureStore.setItem(KEY, SESSION);

    expect(mocks.mmkv.get(KEY)).not.toBe(SESSION); // stored encrypted
    expect(mocks.secure.get(KEY)).not.toContain("tok"); // only the AES key lives here
    expect(await largeSecureStore.getItem(KEY)).toBe(SESSION);
  });

  it("returns null when nothing is stored", async () => {
    expect(await largeSecureStore.getItem(KEY)).toBeNull();
  });

  it("returns null and drops the entry when the MMKV blob is corrupt", async () => {
    mocks.mmkv.set(KEY, "zzzz-not-valid-hex");
    mocks.secure.set(KEY, "00".repeat(32));

    expect(await largeSecureStore.getItem(KEY)).toBeNull();
    expect(mocks.mmkv.has(KEY)).toBe(false);
    expect(mocks.secure.has(KEY)).toBe(false);
  });

  it("returns null without crashing when the SecureStore key is missing", async () => {
    await largeSecureStore.setItem(KEY, SESSION);
    mocks.secure.delete(KEY);

    expect(await largeSecureStore.getItem(KEY)).toBeNull();
  });

  it("removeItem clears both stores", async () => {
    await largeSecureStore.setItem(KEY, SESSION);
    await largeSecureStore.removeItem(KEY);

    expect(mocks.mmkv.has(KEY)).toBe(false);
    expect(mocks.secure.has(KEY)).toBe(false);
  });
});
