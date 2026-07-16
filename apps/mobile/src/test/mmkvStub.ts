// Test-only stub: the real react-native-mmkv pulls nitro's untransformed .ts
// source, which vitest (node env) can't load. Aliased in vitest.config.ts so any
// transitive import resolves here. Tests needing custom behavior still vi.mock it.
export function createMMKV() {
  const store = new Map<string, string>()
  return {
    getString: (key: string) => store.get(key),
    set: (key: string, value: string) => {
      store.set(key, value)
    },
    remove: (key: string) => {
      store.delete(key)
    },
  }
}
