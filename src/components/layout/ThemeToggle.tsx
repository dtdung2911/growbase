"use client"

import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Icon } from "@iconify/react"
import { useTranslation } from "@/lib/i18n/useTranslation"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { locale, setLocale } = useTranslation()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  const isDark = theme === "dark"

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
      <button
        type="button"
        onClick={() => setLocale(locale === "vi" ? "en" : "vi")}
        className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
        aria-label="Switch language"
      >
        {locale === "vi" ? "EN" : "VI"}
      </button>
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        <Icon
          icon={isDark ? "lucide:sun" : "lucide:moon"}
          className="h-[18px] w-[18px]"
        />
      </button>
    </div>
  )
}
