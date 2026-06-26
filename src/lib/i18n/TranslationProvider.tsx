"use client"

import { createContext, useState, useEffect, useCallback, type ReactNode } from "react"
import viMessages from "./messages/vi.json"
import enMessages from "./messages/en.json"

export type Locale = "vi" | "en"
type Messages = Record<string, string>

const dictionaries: Record<Locale, Messages> = {
  vi: viMessages,
  en: enMessages,
}

type TranslationContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

export const TranslationContext = createContext<TranslationContextValue>({
  locale: "vi",
  setLocale: () => {},
  t: (key) => key,
})

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("vi")

  useEffect(() => {
    const stored = localStorage.getItem("growbase-locale")
    if (stored === "en") setLocaleState("en")
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem("growbase-locale", newLocale)
    document.documentElement.lang = newLocale
  }, [])

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      let value = dictionaries[locale][key] ?? key
      if (vars) {
        Object.entries(vars).forEach(([k, v]) => {
          value = value.replace(`{{${k}}}`, String(v))
        })
      }
      return value
    },
    [locale]
  )

  return (
    <TranslationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </TranslationContext.Provider>
  )
}
