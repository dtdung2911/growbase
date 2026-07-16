import { createMMKV } from "react-native-mmkv"

// AD-M6: one shared MMKV instance backs BOTH the Zustand persist and the query
// persister. Distinct from the isolated auth instance ("growbase-supabase-auth").
const mmkv = createMMKV({ id: "growbase-app" })

export const appStorage = {
  getItem: (key: string) => mmkv.getString(key) ?? null,
  setItem: (key: string, value: string) => mmkv.set(key, value),
  removeItem: (key: string) => mmkv.remove(key),
}
