"use client"

import { useEffect, useState } from "react"
import { Icon } from "@iconify/react"
import { useTheme } from "next-themes"
import { format, addMonths, subMonths, parse } from "date-fns"
import { vi, enUS } from "date-fns/locale"
import { Button } from "@/components/ui/button"
import { NotificationDropdown } from "@/components/layout/NotificationDropdown"
import { useAppStore } from "@/lib/stores/appStore"
import { HouseholdSwitcher } from "@/components/layout/HouseholdSwitcher"
import { useTranslation } from "@/lib/i18n/useTranslation"

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function TopHeader() {
  const currentMonth = useAppStore((s) => s.currentMonth)
  const setCurrentMonth = useAppStore((s) => s.setCurrentMonth)
  const user = useAppStore((s) => s.user)
  const { locale, setLocale } = useTranslation()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  const dateLocale = locale === "vi" ? vi : enUS
  const monthDate = parse(currentMonth, "yyyy-MM", new Date())
  const displayLabel = capitalizeFirst(
    format(monthDate, "MMMM yyyy", { locale: dateLocale })
  )

  const goPrev = () => {
    const prev = subMonths(monthDate, 1)
    setCurrentMonth(format(prev, "yyyy-MM"))
  }

  const goNext = () => {
    const next = addMonths(monthDate, 1)
    setCurrentMonth(format(next, "yyyy-MM"))
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    ""
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <header className="fixed min-w-[calc(100%-var(--sidebar-width))] top-0 z-40 lg:mx-auto">
      <div className="flex items-center justify-between bg-card px-4 py-2 shadow-soft-xs lg:border-b lg:px-5  header-custom">
        <div className="flex items-center gap-3">
          <HouseholdSwitcher />
          {/* Month nav */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={goPrev}
              className="h-9 w-9 rounded-full"
            >
              <Icon icon="lucide:chevron-left" className="h-5 w-5" />
            </Button>
            <span className="min-w-[140px] text-center text-sm font-semibold">
              {displayLabel}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={goNext}
              className="h-9 w-9 rounded-full"
            >
              <Icon icon="lucide:chevron-right" className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 lg:gap-3">
          {/* Notification bell */}
          <NotificationDropdown />

          {/* Language toggle */}
          <button
            type="button"
            onClick={() => setLocale(locale === "vi" ? "en" : "vi")}
            className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-xs font-bold text-muted-foreground transition-colors hover:text-foreground"
            aria-label="Switch language"
          >
            {locale === "vi" ? "EN" : "VI"}
          </button>

          {/* Theme toggle */}
          {mounted && (
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="grid h-9 w-9 place-items-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:text-foreground"
              aria-label={
                theme === "dark"
                  ? "Switch to light mode"
                  : "Switch to dark mode"
              }
            >
              <Icon
                icon={theme === "dark" ? "lucide:sun" : "lucide:moon"}
                className="h-[18px] w-[18px]"
              />
            </button>
          )}

          {/* User pill — desktop only */}
          <div className="hidden items-center gap-2.5 rounded-xl bg-surface px-2 py-1.5 pr-3.5 lg:flex">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight">
                {displayName}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {user?.email || ""}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
