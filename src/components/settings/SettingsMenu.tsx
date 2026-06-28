"use client"

import Link from "next/link"
import { Icon } from "@iconify/react"
import { useTheme } from "next-themes"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { useEffect, useState } from "react"

type SettingsItem = {
  labelKey: string
  href: string
  icon: string
}

const SETTINGS_ITEMS: SettingsItem[] = [
  { labelKey: "settings.categories", href: "/settings/categories", icon: "lucide:tag" },
  { labelKey: "settings.budget", href: "/settings/budget", icon: "lucide:pie-chart" },
  { labelKey: "settings.debt", href: "/settings/debt", icon: "lucide:credit-card" },
  { labelKey: "settings.estimatedExpenses", href: "/settings/estimated-expenses", icon: "lucide:receipt" },
  { labelKey: "settings.accounts", href: "/settings/accounts", icon: "lucide:wallet" },
  { labelKey: "settings.income", href: "/settings/income", icon: "lucide:trending-up" },
  { labelKey: "settings.household", href: "/settings/household", icon: "lucide:home" },
]

export function SettingsMenu() {
  const { t } = useTranslation()
  const { locale, setLocale } = useTranslation()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <div className="space-y-6">
      {/* Data settings */}
      <div className="rounded-[15px] border border-border bg-card">
        {SETTINGS_ITEMS.map((item, i) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-h-[52px] items-center justify-between px-5 py-3.5 transition-colors hover:bg-accent ${
              i < SETTINGS_ITEMS.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <div className="flex items-center gap-3.5">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft">
                <Icon icon={item.icon} className="h-[18px] w-[18px] text-primary" />
              </div>
              <span className="text-sm font-semibold">{t(item.labelKey)}</span>
            </div>
            <Icon icon="lucide:chevron-right" className="h-4 w-4 text-faint" />
          </Link>
        ))}
      </div>

      {/* Appearance settings */}
      <div className="rounded-[15px] border border-border bg-card">
        <div className="border-b border-border px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("settings.appearance")}
          </p>
        </div>

        {/* Language */}
        <div className="flex min-h-[52px] items-center justify-between border-b border-border px-5 py-3.5">
          <div className="flex items-center gap-3.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft">
              <Icon icon="lucide:languages" className="h-[18px] w-[18px] text-primary" />
            </div>
            <span className="text-sm font-semibold">{t("settings.language")}</span>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setLocale("vi")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                locale === "vi"
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              Tiếng Việt
            </button>
            <button
              type="button"
              onClick={() => setLocale("en")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                locale === "en"
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* Theme */}
        <div className="flex min-h-[52px] items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft">
              <Icon icon={mounted && theme === "dark" ? "lucide:moon" : "lucide:sun"} className="h-[18px] w-[18px] text-primary" />
            </div>
            <span className="text-sm font-semibold">{t("settings.theme")}</span>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                mounted && theme === "light"
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("settings.themeLight")}
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                mounted && theme === "dark"
                  ? "bg-primary text-primary-foreground"
                  : "bg-accent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("settings.themeDark")}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
