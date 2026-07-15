"use client"

import type { Config, Driver, DriveStep } from "driver.js"

type TFn = (key: string, vars?: Record<string, string | number>) => string

// Thứ tự mảng = thứ tự tour. selector khớp data-tour trong DashboardView (attribute trơ, không đụng /dashboard thật).
// StageBadge/StageEventCard/InviteCompanionPrompt gate trên householdId nên không render ở demo onboarding —
// không có bước tương ứng ở đây, và bộ lọc DOM bên dưới bỏ mọi bước có element vắng.
const STEP_TARGETS: ReadonlyArray<{ selector: string; key: string }> = [
  { selector: '[data-tour="metric-income"]', key: "income" },
  { selector: '[data-tour="metric-expense"]', key: "expense" },
  { selector: '[data-tour="metric-savings"]', key: "savings" },
  { selector: '[data-tour="metric-health"]', key: "health" },
  { selector: '[data-tour="income-expense"]', key: "incomeExpense" },
  { selector: '[data-tour="spending"]', key: "spending" },
  { selector: '[data-tour="top-expenses"]', key: "topExpenses" },
  { selector: '[data-tour="weekday"]', key: "weekday" },
  { selector: '[data-tour="budget"]', key: "budget" },
  { selector: '[data-tour="funds"]', key: "funds" },
  { selector: '[data-tour="recent-tx"]', key: "recentTx" },
]

export async function runDashboardTour(t: TFn, onFinale: () => void) {
  const { driver } = await import("driver.js")

  const steps: DriveStep[] = STEP_TARGETS.filter((s) => document.querySelector(s.selector)).map(
    (s) => ({
      element: s.selector,
      popover: {
        title: t(`setupV2.tour.${s.key}.title`),
        description: t(`setupV2.tour.${s.key}.body`),
      },
    }),
  )

  // Prev ở bước đầu rơi vào nhánh destroy của driver → ẩn để không đóng tour ngoài ý muốn.
  const first = steps[0]
  if (first?.popover) first.popover.showButtons = ["next", "close"]

  let tour: Driver
  const finale: DriveStep = {
    popover: {
      title: t("setupV2.tour.finale.title"),
      description: t("setupV2.tour.finale.body"),
      onDoneClick: () => {
        tour.destroy()
        onFinale()
      },
    },
  }

  const config: Config = {
    showProgress: true,
    allowClose: true,
    animate: !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    smoothScroll: true,
    stagePadding: 8,
    stageRadius: 14,
    progressText: "{{current}} / {{total}}",
    nextBtnText: t("setupV2.tour.next"),
    prevBtnText: t("setupV2.tour.prev"),
    doneBtnText: t("setupV2.tour.finale.cta"),
    steps: [...steps, finale],
  }

  tour = driver(config)
  tour.drive()
}
