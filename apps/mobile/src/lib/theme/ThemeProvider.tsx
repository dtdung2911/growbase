import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react"
import { Appearance, useColorScheme } from "react-native"
import { appStorage } from "@/lib/storage/mmkv"
import { darkColors, lightColors, type ThemeColors } from "@/lib/theme/tokens"

export type ThemeMode = "light" | "dark" | "system"

const STORAGE_KEY = "growbase-theme"

// Storing `mode` (not the resolved boolean) is what keeps `system` reactive:
// useColorScheme() re-renders on OS Appearance changes.
export function resolveIsDark(
  mode: ThemeMode,
  systemScheme: string | null | undefined,
  fallbackScheme?: string | null | undefined,
): boolean {
  if (mode === "system") return (systemScheme ?? fallbackScheme) === "dark"
  return mode === "dark"
}

export function readStoredMode(): ThemeMode {
  try {
    const stored = appStorage.getItem(STORAGE_KEY)
    return stored === "light" || stored === "dark" || stored === "system" ? stored : "system"
  } catch {
    return "system"
  }
}

export function persistThemeMode(mode: ThemeMode): void {
  appStorage.setItem(STORAGE_KEY, mode)
}

type ThemeContextValue = {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  isDark: boolean
  colors: ThemeColors
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "system",
  setMode: () => {},
  isDark: false,
  colors: lightColors,
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(readStoredMode)
  // useColorScheme() can be null on cold start; fall back to Appearance so OS-dark users don't flash light.
  const isDark = resolveIsDark(mode, useColorScheme(), Appearance.getColorScheme())
  const colors = isDark ? darkColors : lightColors

  const setMode = useCallback((next: ThemeMode) => {
    try {
      persistThemeMode(next)
    } catch {}
    setModeState(next)
  }, [])

  const value = useMemo(() => ({ mode, setMode, isDark, colors }), [mode, isDark, colors, setMode])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}
