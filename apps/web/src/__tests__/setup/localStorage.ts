// Vitest globalSetup-style shim: cung cấp localStorage/sessionStorage cho test env "node".
// zustand persist middleware resolve storage qua createJSONStorage(() => localStorage | sessionStorage)
// nên chúng phải tồn tại TRƯỚC khi store module được import.
function createStorageShim(): Storage {
  const memoryStore = new Map<string, string>()
  return {
    get length() {
      return memoryStore.size
    },
    clear: () => memoryStore.clear(),
    getItem: (k: string) => memoryStore.get(k) ?? null,
    key: (i: number) => Array.from(memoryStore.keys())[i] ?? null,
    removeItem: (k: string) => void memoryStore.delete(k),
    setItem: (k: string, v: string) => void memoryStore.set(k, String(v)),
  }
}

for (const name of ["localStorage", "sessionStorage"] as const) {
  if (typeof globalThis[name] === "undefined") {
    Object.defineProperty(globalThis, name, {
      value: createStorageShim(),
      writable: true,
      configurable: true,
    })
  }
}
