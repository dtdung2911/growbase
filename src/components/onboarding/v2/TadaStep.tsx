"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { CurrencyInput } from "@/components/ui/CurrencyInput"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useOnboardingV2Store } from "@/lib/stores/onboardingV2Store"
import { useMutationState } from "@tanstack/react-query"
import {
  COMPLETE_ONBOARDING_V2_KEY,
  useCompleteOnboardingV2,
  type CompleteOnboardingV2Response,
} from "@/lib/hooks/useCompleteOnboardingV2"
import { useFunds, useUpdateFund } from "@/lib/hooks/useFunds"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { formatVND } from "@/lib/utils/currency"
import { addMonthsIso } from "@/lib/utils/date"
import { cn } from "@/lib/utils/cn"
import {
  BUDGET_TEMPLATE,
  type CostTypeGroupKey,
  type FeasibilityResult,
} from "@/lib/constants/budgetTemplate"
import { TADA_REVEAL_STAGES, type TadaRevealStage } from "@/lib/constants/tadaReveal"
import { GOAL_PRESET_ICONS } from "./goalPresetIcons"

const STAGE_DELAY_MS = 550

const sumBudgetPct = (groups: readonly CostTypeGroupKey[]) =>
  BUDGET_TEMPLATE.filter((l) => groups.includes(l.costTypeGroup)).reduce((s, l) => s + l.budgetPct, 0)

// 4 nhóm Conscious Spending Plan. Nhóm linh hoạt gộp variable+wasteful+other để bar phủ đúng 100%;
// fixed/savings/debt giữ % chuẩn khớp màn Budget.
const BUDGET_SEGMENTS = [
  { key: "fixed", pct: sumBudgetPct(["fixed"]), color: "bg-primary" },
  { key: "variable", pct: sumBudgetPct(["variable", "wasteful", "other"]), color: "bg-info" },
  { key: "savingsInvestment", pct: sumBudgetPct(["savings_investment"]), color: "bg-success" },
  { key: "debtRepayment", pct: sumBudgetPct(["debt_repayment"]), color: "bg-warning" },
] as const

export function TadaStep() {
  const { t } = useTranslation()
  const router = useRouter()
  const goals = useOnboardingV2Store((s) => s.goals)
  const monthlyIncome = useOnboardingV2Store((s) => s.monthlyIncome)
  const resetOnboarding = useOnboardingV2Store((s) => s.reset)

  const completeOnboarding = useCompleteOnboardingV2()
  const fired = useRef(false)

  // Không đọc state từ completeOnboarding (observer-based): StrictMode unmount gỡ
  // observer khỏi mutation đang chạy và không attach lại khi remount → isSuccess
  // kẹt false vĩnh viễn (spinner treo). useMutationState subscribe thẳng
  // MutationCache nên miễn nhiễm với vòng đời observer.
  const mutationStates = useMutationState({
    filters: { mutationKey: COMPLETE_ONBOARDING_V2_KEY },
    select: (m) => m.state,
  })
  const mutation = mutationStates[mutationStates.length - 1]
  const mutationStatus = mutation?.status ?? "idle"
  const result = mutation?.data as CompleteOnboardingV2Response | undefined

  // Deps [goals, monthlyIncome] (không phải []): store rehydrate từ sessionStorage
  // có thể xong SAU lần mount đầu. Với [] effect chỉ chạy 1 lần lúc income còn null →
  // return sớm → mutation không bao giờ fire → spinner kẹt vĩnh viễn (issue 4).
  // fired ref đảm bảo chỉ gọi mutate đúng 1 lần khi income đã sẵn sàng (goals rỗng hợp lệ).
  useEffect(() => {
    if (fired.current || monthlyIncome === null) return
    fired.current = true
    completeOnboarding.mutate({ goals, monthlyIncome })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goals, monthlyIncome])

  const [revealed, setRevealed] = useState<TadaRevealStage[]>([])
  useEffect(() => {
    if (mutationStatus !== "success") return
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    if (reducedMotion) {
      setRevealed([...TADA_REVEAL_STAGES])
      return
    }
    const timers = TADA_REVEAL_STAGES.map((stage, i) =>
      setTimeout(() => setRevealed((prev) => [...prev, stage]), (i + 1) * STAGE_DELAY_MS)
    )
    return () => timers.forEach(clearTimeout)
  }, [mutationStatus])

  const [adjustedTargetAmount, setAdjustedTargetAmount] = useState<number | null>(null)
  const [adjustedMonths, setAdjustedMonths] = useState<number | null>(null)

  if (monthlyIncome === null) return null

  if (mutationStatus === "error") {
    const status = (mutation?.error as (Error & { status?: number }) | null)?.status
    if (status === 409) {
      return (
        <TadaMessage
          title={t("setupV2.tada.alreadyOnboardedTitle")}
          description={t("setupV2.tada.alreadyOnboardedDesc")}
        >
          <Button className="min-h-[44px] w-full" onClick={() => router.push("/dashboard")}>
            {t("setupV2.tada.cta")}
          </Button>
        </TadaMessage>
      )
    }
    return (
      <TadaMessage
        title={t("setupV2.tada.errorTitle")}
        description={t("setupV2.tada.errorDesc")}
      >
        <Button className="min-h-[44px] w-full" onClick={() => completeOnboarding.mutate({ goals, monthlyIncome })}>
          {t("setupV2.tada.retry")}
        </Button>
      </TadaMessage>
    )
  }

  if (mutationStatus !== "success" || !result) {
    return <TadaPending stage={TADA_REVEAL_STAGES[revealed.length] ?? TADA_REVEAL_STAGES[0]} t={t} />
  }

  const original = result
  // Nhánh infeasible điều chỉnh quỹ chưa khả thi đầu tiên (fallback quỹ đầu — luôn có emergency).
  const targetFund = original.funds.find((f) => !f.feasibility.feasible) ?? original.funds[0]
  const targetAmount = adjustedTargetAmount ?? targetFund.targetAmount
  const months = adjustedMonths ?? targetFund.months

  // Feasibility phải tính TỔNG mọi fund cùng rút từ available, không chỉ targetFund.
  // Các fund khác giữ monthlyNeeded gốc; targetFund dùng giá trị đang chỉnh.
  const otherFundsMonthly = original.funds
    .filter((f) => f !== targetFund)
    .reduce((sum, f) => sum + f.feasibility.monthlyNeeded, 0)
  const adjustedMonthly = otherFundsMonthly + targetAmount / months
  const feasibility: FeasibilityResult = original.feasibility.feasible
    ? original.feasibility
    : {
        monthlyNeeded: adjustedMonthly,
        available: original.feasibility.available,
        feasible: adjustedMonthly <= original.feasibility.available + 1,
      }

  const wasAdjusted = adjustedTargetAmount !== null || adjustedMonths !== null

  return (
    <div className="space-y-4">
      {revealed.includes("budget") && (
        <TadaBudgetBar monthlyIncome={monthlyIncome} />
      )}

      {revealed.includes("goal") && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-primary">
            {t("setupV2.tada.goalTitle")}
          </p>
          {original.funds.map((f) => (
            <div
              key={`${f.fundType}-${f.name}`}
              className="flex items-center gap-3 rounded-[13px] border border-border/40 bg-card p-4 shadow-card"
            >
              <span className="text-2xl text-primary" aria-hidden>
                {GOAL_PRESET_ICONS[f.presetId] ?? GOAL_PRESET_ICONS.custom}
              </span>
              <div className="flex-1">
                <p className="font-semibold text-primary">{f.name}</p>
                <p className="font-mono text-sm tabular-nums text-muted-foreground">
                  {formatVND(f.targetAmount)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {revealed.includes("feasibility") && (
        <div className="space-y-3 rounded-[13px] border border-border/40 bg-card p-4 shadow-card">
          <p className="font-semibold text-foreground">
            {feasibility.feasible
              ? t("setupV2.tada.feasibleTitle", {
                  amount: formatVND(feasibility.monthlyNeeded),
                })
              : t("setupV2.tada.infeasibleTitle")}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("setupV2.tada.rationale.mentalAccounting")}
          </p>
          {/* Gate theo verdict gốc từ server, không theo feasibility live:
              nếu gate live thì vừa gõ qua ngưỡng khả thi là inputs unmount giữa chừng. */}
          {!original.feasibility.feasible && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {t("setupV2.tada.infeasibleDesc")}
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="tada-target">
                  {t("setupV2.tada.adjustTargetLabel")}
                </Label>
                <CurrencyInput
                  id="tada-target"
                  value={targetAmount}
                  onChange={setAdjustedTargetAmount}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tada-months">
                  {t("setupV2.tada.adjustMonthsLabel")}
                </Label>
                <Input
                  id="tada-months"
                  inputMode="numeric"
                  value={months}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "");
                    setAdjustedMonths(Number(digits) || 1);
                  }}
                  className="font-mono tabular-nums"
                />
              </div>
              <p className="font-mono text-sm tabular-nums text-muted-foreground">
                {t("setupV2.tada.monthlyNeeded", {
                  amount: formatVND(feasibility.monthlyNeeded),
                })}
              </p>
            </div>
          )}
        </div>
      )}

      {revealed.includes("todayRemaining") && (
        <div className="space-y-2 rounded-[13px] border border-border/40 bg-card p-4 text-center shadow-card">
          <p className="text-sm text-muted-foreground">
            {t("setupV2.tada.todayRemainingLabel")}
          </p>
          <p className="animate-in zoom-in-95 font-mono text-4xl font-bold tabular-nums text-foreground duration-300 motion-reduce:animate-none">
            {formatVND(original.todayRemaining)}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("setupV2.tada.hookCallback")}
          </p>
        </div>
      )}

      {revealed.length === TADA_REVEAL_STAGES.length && (
        <TadaFinishButton
          wasAdjusted={wasAdjusted}
          fundName={targetFund.name}
          fundType={targetFund.fundType}
          targetAmount={targetAmount}
          months={months}
          onDone={() => {
            // Xóa sessionStorage: user khác đăng nhập cùng tab không được
            // thừa hưởng goal/income cũ và auto-fire mutation ở TadaStep
            resetOnboarding();
            router.push("/dashboard");
          }}
        />
      )}
    </div>
  );
}

function TadaFinishButton({
  wasAdjusted,
  fundName,
  fundType,
  targetAmount,
  months,
  onDone,
}: {
  wasAdjusted: boolean
  fundName: string
  fundType: "emergency" | "goal"
  targetAmount: number
  months: number
  onDone: () => void
}) {
  const { t } = useTranslation()
  const { data: funds, isPending: fundsPending } = useFunds()
  // Match theo name + fund_type: nhiều fund cùng type 'goal' nên fund_type đơn không đủ định danh (AC4)
  const fund = funds?.find((f) => f.name === fundName && f.fund_type === fundType)
  const updateFund = useUpdateFund(fund?.id ?? "")

  const handleClick = async () => {
    if (wasAdjusted && fund) {
      const targetDate = fundType === "goal" ? addMonthsIso(months) : undefined
      await updateFund.mutateAsync({ target_amount: targetAmount, ...(targetDate ? { target_date: targetDate } : {}) })
    }
    onDone()
  }

  return (
    <Button
      className="min-h-[44px] w-full"
      onClick={handleClick}
      // Không chặn vĩnh viễn nếu useFunds lỗi (fund undefined): chỉ chặn khi đang tải/đang lưu.
      // handleClick tự bỏ qua updateFund khi thiếu fund → user vẫn vào được dashboard.
      disabled={wasAdjusted && (fundsPending || updateFund.isPending)}
    >
      {t("setupV2.tada.cta")}
    </Button>
  )
}

function TadaPending({ stage, t }: { stage: TadaRevealStage; t: (key: string) => string }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent motion-reduce:animate-none" />
      <p className="max-w-sm text-sm text-muted-foreground">{t(`setupV2.tada.pending.${stage}`)}</p>
    </div>
  )
}

function TadaBudgetBar({ monthlyIncome }: { monthlyIncome: number }) {
  const { t } = useTranslation()
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

function TadaMessage({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-6 text-center">
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
