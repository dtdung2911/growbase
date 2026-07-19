"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Icon } from "@iconify/react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useAppStore } from "@/lib/stores/appStore"
import { useLivingPlan } from "@/lib/hooks/useLivingPlan"
import { useFunds } from "@/lib/hooks/useFunds"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { formatVND } from "@growbase/shared/rules/currency"
import { cn } from "@/lib/utils/cn"
import { currentStage } from "@growbase/shared/rules/currentStage"
import {
  BUDGET_SEGMENTS,
  FLEXIBLE_COST_TYPE_GROUPS,
  MAX_ALLOCATION_MONTHS,
  calculateTodayRemaining,
  sumBudgetPct,
} from "@growbase/shared/constants/budgetTemplate"
import { TADA_REVEAL_STAGES, pickThreeStageKey, type TadaRevealStage } from "@/lib/constants/tadaReveal"
import { FUND_TYPE_CONFIG, type Fund } from "@growbase/shared/types/app"

const STAGE_DELAY_MS = 550

// "Tada tươi" (BR-OB-014): cùng cấu trúc reveal onboarding nhưng SỐ HÔM NAY từ useLivingPlan —
// balance thật, GĐ thật, income thực. KHÔNG replay snapshot onboarding cũ (brainstorm #11).
export function WelcomeRevealClient() {
  const { t } = useTranslation()
  const router = useRouter()
  const householdId = useAppStore((s) => s.householdId)

  const { plan, emergencyBalance, trailingIncome, isLoading, isError } =
    useLivingPlan()
  const fundsQuery = useFunds()
  const funds = fundsQuery.data ?? []

  // Vào /welcome mà không có hộ (member chưa gắn household): về dashboard, không dựng bức tranh rỗng.
  useEffect(() => {
    if (householdId === null) router.replace("/dashboard")
  }, [householdId, router])

  const loading = isLoading || fundsQuery.isLoading
  const ready = !loading && plan != null

  const [revealed, setRevealed] = useState<TadaRevealStage[]>([])
  useEffect(() => {
    if (!ready) return
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reducedMotion) {
      setRevealed([...TADA_REVEAL_STAGES])
      return
    }
    const timers = TADA_REVEAL_STAGES.map((stage, i) =>
      setTimeout(() => setRevealed((prev) => [...prev, stage]), (i + 1) * STAGE_DELAY_MS)
    )
    return () => timers.forEach(clearTimeout)
  }, [ready])

  if (householdId === null) return null

  if (isError) {
    return (
      <Shell t={t}>
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
          <div>
            <p className="font-semibold text-foreground">{t("welcome.errorTitle")}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t("welcome.errorDesc")}</p>
          </div>
          <Button className="min-h-[44px] w-full" onClick={() => router.push("/dashboard")}>
            {t("welcome.cta")}
          </Button>
        </div>
      </Shell>
    )
  }

  if (!ready || plan === null) {
    return (
      <Shell t={t}>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-[13px]" />
          <Skeleton className="h-40 w-full rounded-[13px]" />
          <Skeleton className="h-28 w-full rounded-[13px]" />
        </div>
      </Shell>
    )
  }

  const timelineLabel = (months: number | null) =>
    months === null
      ? t("setupV2.tada.fundTimelineNever", { max: MAX_ALLOCATION_MONTHS })
      : t("setupV2.tada.fundTimeline", { months })

  // Ghép allocation engine với quỹ thật để lấy tên + icon: emergency match theo fund_type,
  // goal match theo id (living-plan trả goal.id = fund.id). Quỹ không có allocation (sinking/
  // investment/freedom) không nằm trong kế hoạch 3 GĐ nên bỏ khỏi danh sách.
  const fundForAlloc = (allocId: string): Fund | undefined =>
    allocId === "emergency"
      ? funds.find((f) => f.fund_type === "emergency")
      : funds.find((f) => f.id === allocId)
  const planFunds = plan.allocations
    .map((a) => ({ alloc: a, fund: fundForAlloc(a.id) }))
    .filter((x): x is { alloc: (typeof plan.allocations)[number]; fund: Fund } => x.fund != null)

  const hasGoals = plan.allocations.some((a) => a.id !== "emergency")
  const stage1End = plan.stage1EndMonth
  const threeStageKey = pickThreeStageKey(stage1End, hasGoals)
  const threeStageMonths = stage1End !== null && stage1End > 0 ? stage1End : null
  const stage = currentStage(emergencyBalance, plan.emergencyTarget)
  const [beforeStage, afterStage = ""] = t("welcome.currentStage").split("{{stage}}")

  // D1: dùng trailingIncome (income thực 3 tháng) thay income khai onboarding — member mới chưa hề
  // khai income, và "hôm nay chi thoải mái" phải phản ánh thu nhập thật chứ không phải ước tính cũ.
  const todayRemaining = calculateTodayRemaining(trailingIncome)
  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate()

  return (
    <Shell t={t}>
      <div className="space-y-4">
        {revealed.includes("budget") && <BudgetBar monthlyIncome={trailingIncome} t={t} />}

        {revealed.includes("goal") && (
          <div className="space-y-3 rounded-[13px] border border-border/40 bg-card p-4 shadow-card">
            <p className="font-semibold text-foreground">{t("setupV2.tada.goalTitle")}</p>
            {planFunds.map(({ alloc, fund }) => (
              <div key={fund.id} className="flex items-start gap-3">
                <Icon
                  icon={fund.icon ?? FUND_TYPE_CONFIG[fund.fund_type].icon}
                  className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{fund.name}</p>
                  {alloc.monthlyAmount !== null && (
                    <p className="font-mono text-xs tabular-nums text-muted-foreground">
                      {t("setupV2.tada.fundMonthly", { amount: formatVND(alloc.monthlyAmount) })}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">{timelineLabel(alloc.timelineMonths)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {revealed.includes("feasibility") && (
          <div className="space-y-3 rounded-[13px] border border-border/40 bg-card p-4 shadow-card">
            <p className="font-semibold text-foreground">
              {/* plan.capacityMonthly = trailing-income plan number, matches per-fund sums */}
              {t("setupV2.tada.feasibleTitle", { amount: formatVND(plan.capacityMonthly) })}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("setupV2.tada.capacitySource", { percent: sumBudgetPct(["savings_investment"]) })}
            </p>
            <ThreeStageLine template={t(`setupV2.tada.threeStage.${threeStageKey}`)} months={threeStageMonths} />
            <p className="text-sm font-medium text-foreground">
              {beforeStage}
              <span className="font-mono tabular-nums">{stage}</span>
              {afterStage}
            </p>
          </div>
        )}

        {revealed.includes("todayRemaining") && (
          <div className="space-y-2 rounded-[13px] border border-border/40 bg-card p-4 text-center shadow-card">
            <p className="text-sm text-muted-foreground">{t("setupV2.tada.todayRemainingLabel")}</p>
            <p className="animate-in zoom-in-95 font-mono text-4xl font-bold tabular-nums text-foreground duration-300 motion-reduce:animate-none">
              {formatVND(todayRemaining)}
            </p>
            <p className="text-xs text-muted-foreground">
              {t("setupV2.tada.todayRemainingHint", {
                percent: sumBudgetPct(FLEXIBLE_COST_TYPE_GROUPS),
                days: daysInMonth,
              })}
            </p>
          </div>
        )}

        {revealed.length === TADA_REVEAL_STAGES.length && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{t("setupV2.tada.attribution")}</p>
            <Button className="min-h-[44px] w-full" onClick={() => router.push("/dashboard")}>
              {t("welcome.cta")}
            </Button>
          </div>
        )}
      </div>
    </Shell>
  )
}

function Shell({ children, t }: { children: React.ReactNode; t: TFn }) {
  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-4 py-6 pb-16">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{t("welcome.title")}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{t("welcome.subtitle")}</p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex min-h-[44px] shrink-0 items-center text-sm text-muted-foreground hover:text-foreground"
        >
          {t("welcome.skip")}
        </Link>
      </div>
      {children}
    </div>
  )
}

// Câu kể prose; chỉ SỐ tháng bọc font-mono. Copy từ TadaStep.ThreeStageLine (block <30 dòng) —
// tránh import TadaStep coupled onboarding store/mutation vào bundle /welcome (lesson 11.3/12.3).
function ThreeStageLine({ template, months }: { template: string; months: number | null }) {
  if (months === null) return <p className="text-sm text-foreground">{template}</p>
  const [before, after = ""] = template.split("{{months}}")
  return (
    <p className="text-sm text-foreground">
      {before}
      <span className="font-mono tabular-nums">{months}</span>
      {after}
    </p>
  )
}

// Copy từ TadaStep.TadaBudgetBar (block <30 dòng, không đổi logic) vì cùng lý do coupling như trên.
function BudgetBar({ monthlyIncome, t }: { monthlyIncome: number; t: TFn }) {
  return (
    <div className="space-y-3 rounded-[13px] border border-border/40 bg-card p-4 shadow-card">
      <p className="font-semibold text-foreground">{t("setupV2.tada.budgetTitle")}</p>
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {BUDGET_SEGMENTS.map((s) => (
          <div key={s.key} className={s.color} style={{ width: `${s.pct}%` }} />
        ))}
      </div>
      <ul className="space-y-1.5">
        {BUDGET_SEGMENTS.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-sm">
            <span className={cn("h-2.5 w-2.5 shrink-0 rounded-full", s.color)} />
            <span className="text-muted-foreground">{t(`setupV2.tada.budgetLegend.${s.key}`)}</span>
            <span className="ml-auto font-mono tabular-nums text-foreground">
              {s.pct}% ·{" "}
              {t("setupV2.tada.perMonth", {
                amount: formatVND(Math.round((monthlyIncome * s.pct) / 100)),
              })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

type TFn = (key: string, vars?: Record<string, string | number>) => string
