// Vitest globalSetup-style shim: cung cấp localStorage cho test env "node".
// zustand persist middleware (wizardStore) resolve storage qua createJSONStorage(() => localStorage)
// nên localStorage phải tồn tại TRƯỚC khi store module được import.
const memoryStore = new Map<string, string>()

const localStorageShim: Storage = {
  get length() {
    return memoryStore.size
  },
  clear: () => memoryStore.clear(),
  getItem: (k: string) => memoryStore.get(k) ?? null,
  key: (i: number) => Array.from(memoryStore.keys())[i] ?? null,
  removeItem: (k: string) => void memoryStore.delete(k),
  setItem: (k: string, v: string) => void memoryStore.set(k, String(v)),
}

if (typeof globalThis.localStorage === "undefined") {
  Object.defineProperty(globalThis, "localStorage", {
    value: localStorageShim,
    writable: true,
    configurable: true,
  })
}
