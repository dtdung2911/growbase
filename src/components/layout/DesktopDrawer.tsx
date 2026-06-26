"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Icon } from "@iconify/react"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { useAppStore } from "@/lib/stores/appStore"
import { createClient } from "@/lib/supabase/client"

const NAV_SECTIONS = [
  {
    labelKey: "nav.section.main",
    items: [
      { href: "/dashboard", labelKey: "nav.dashboard", icon: "lucide:layout-dashboard" },
      { href: "/transactions", labelKey: "nav.transactions", icon: "lucide:arrow-left-right" },
      { href: "/funds", labelKey: "nav.funds", icon: "lucide:piggy-bank" },
    ],
  },
  {
    labelKey: "nav.section.analytics",
    items: [
      { href: "/reports", labelKey: "nav.reports", icon: "lucide:bar-chart-3" },
      { href: "/budget", labelKey: "nav.budget", icon: "lucide:wallet" },
      { href: "/net-worth", labelKey: "nav.netWorth", icon: "lucide:landmark" },
      { href: "/scheduled-payments", labelKey: "nav.scheduledPayments", icon: "lucide:calendar-clock" },
      { href: "/investments", labelKey: "nav.investments", icon: "lucide:trending-up" },
      { href: "/event-budgets", labelKey: "nav.eventBudgets", icon: "lucide:party-popper" },
    ],
  },
  {
    labelKey: "nav.section.settings",
    items: [
      { href: "/settings", labelKey: "nav.settings", icon: "lucide:settings" },
    ],
  },
] as const

export function DesktopDrawer() {
  const pathname = usePathname()
  const router = useRouter()
  const { t } = useTranslation()
  const user = useAppStore((s) => s.user)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const displayName =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "User"
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()

  return (
    <aside className="fixed inset-y-0 z-40 hidden w-[var(--sidebar-width)] flex-col bg-card shadow-sidebar lg:flex">
      {/* Brand */}
      <div className="flex items-center gap-3 px-6 pb-16 pt-16">
        <div className="flex gap-0.5">
          <div className="h-5 w-1.5 rounded-sm bg-primary/35" />
          <div className="h-6 w-1.5 rounded-sm bg-primary/68" />
          <div className="h-7 w-1.5 rounded-sm bg-primary" />
        </div>
        <span className="text-lg font-extrabold tracking-tight">GrowBase</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav flex-1 space-y-6 overflow-y-auto pl-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.labelKey}>
            <p className="mb-2.5 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
              {t(section.labelKey)}
            </p>
            <div className="space-y-1.5">
              {section.items.map((item) => {
                const active = pathname.startsWith(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-active={active}
                    className="sidebar-nav-link flex items-center gap-3 px-4 py-2.5 text-[14px] font-semibold min-h-[44px] text-muted-foreground"
                  >
                    <Icon icon={item.icon} className="h-[22px] w-[22px] shrink-0" />
                    <span>{t(item.labelKey)}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* User card */}
      <div className="mx-5 mb-5 mt-3">
        <div className="flex items-center gap-3 rounded-2xl bg-primary-soft p-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-foreground">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">
              {user?.email || ""}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <Icon icon="lucide:log-out" className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
