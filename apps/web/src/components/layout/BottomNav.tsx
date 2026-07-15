"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Icon } from "@iconify/react"
import { cn } from "@/lib/utils/cn"
import { useTranslation } from "@/lib/i18n/useTranslation"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

const MAIN_ITEMS = [
  { href: "/dashboard", labelKey: "nav.dashboard", icon: "lucide:layout-dashboard" },
  { href: "/transactions", labelKey: "nav.transactions", icon: "lucide:arrow-left-right" },
  { href: "/funds", labelKey: "nav.funds", icon: "lucide:piggy-bank" },
] as const

const MORE_ITEMS = [
  { href: "/reports", labelKey: "nav.reports", icon: "lucide:bar-chart-3" },
  { href: "/budget", labelKey: "nav.budget", icon: "lucide:wallet" },
  { href: "/net-worth", labelKey: "nav.netWorth", icon: "lucide:landmark" },
  { href: "/scheduled-payments", labelKey: "nav.scheduledPayments", icon: "lucide:calendar-clock" },
  { href: "/settings", labelKey: "nav.settings", icon: "lucide:settings" },
] as const

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useTranslation()
  const [moreOpen, setMoreOpen] = useState(false)

  const isMoreActive = MORE_ITEMS.some((item) => pathname.startsWith(item.href))

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md shadow-soft-md lg:hidden">
        <div className="mx-auto flex h-16 max-w-md items-end pb-[env(safe-area-inset-bottom)]">
          {MAIN_ITEMS.map((item) => {
            const active = pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[56px] pt-1.5 pb-1 text-[10px]",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon icon={item.icon} className="h-5 w-5" />
                <span>{t(item.labelKey)}</span>
              </Link>
            )
          })}

          <Link
            href="/transactions?action=new"
            aria-label="Thêm giao dịch"
            className="flex flex-1 items-center justify-center pb-1"
          >
            <div className="flex h-12 w-12 -mt-4 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-float">
              <Icon icon="lucide:plus" className="h-6 w-6" />
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-1 flex-col items-center justify-center gap-0.5 min-h-[56px] pt-1.5 pb-1 text-[10px]",
              isMoreActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon icon="lucide:more-horizontal" className="h-5 w-5" />
            <span>{t("nav.more")}</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{t("nav.more")}</SheetTitle>
          </SheetHeader>
          <nav className="mt-2 space-y-1 pb-4">
            {MORE_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-sm min-h-[44px]",
                    active
                      ? "bg-primary/10 font-semibold text-primary"
                      : "text-foreground hover:bg-accent"
                  )}
                >
                  <Icon icon={item.icon} className="h-5 w-5" />
                  <span>{t(item.labelKey)}</span>
                </Link>
              )
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
