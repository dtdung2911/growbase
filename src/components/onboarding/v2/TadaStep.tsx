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
import {
  EMERGENCY_FUND_TIMELINE_MONTHS,
  calculateFeasibility,
  estimateEmergencyTarget,
  type FeasibilityResult,
} from "@/lib/constants/budgetTemplate"
import { TADA_REVEAL_STAGES, resolveFeasibilityMonths, type TadaRevealStage } from "@/lib/constants/tadaReveal"

const STAGE_DELAY_MS = 550

export function TadaStep() {
  const { t } = useTranslation()
  const router = useRouter()
  const goal = useOnboardingV2Store((s) => s.goal)
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

  // Deps [goal, monthlyIncome] (không phải []): store rehydrate từ sessionStorage
  // có thể xong SAU lần mount đầu. Với [] effect chỉ chạy 1 lần lúc goal còn null →
  // return sớm → mutation không bao giờ fire → spinner kẹt vĩnh viễn (issue 4).
  // fired ref đảm bảo chỉ gọi mutate đúng 1 lần khi goal + income đã sẵn sàng.
  useEffect(() => {
    if (fired.current || !goal || monthlyIncome === null) return
    fired.current = true
    completeOnboarding.mutate({ goal, monthlyIncome })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [goal, monthlyIncome])

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

  if (!goal || monthlyIncome === null) return null

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
        <Button className="min-h-[44px] w-full" onClick={() => completeOnboarding.mutate({ goal, monthlyIncome })}>
          {t("setupV2.tada.retry")}
        </Button>
      </TadaMessage>
    )
  }

  if (mutationStatus !== "success" || !result) {
    return <TadaPending stage={TADA_REVEAL_STAGES[revealed.length] ?? TADA_REVEAL_STAGES[0]} t={t} />
  }

  const original = result
  const originalTargetAmount = goal.targetAmount ?? estimateEmergencyTarget(monthlyIncome)
  const originalMonths = resolveFeasibilityMonths(
    goal.fundType,
    EMERGENCY_FUND_TIMELINE_MONTHS,
    goal.targetMonths ?? EMERGENCY_FUND_TIMELINE_MONTHS
  )
  const targetAmount = adjustedTargetAmount ?? originalTargetAmount
  const months = adjustedMonths ?? originalMonths
  const feasibility: FeasibilityResult = original.feasibility.feasible
    ? original.feasibility
    : calculateFeasibility(targetAmount, months, monthlyIncome)

  const wasAdjusted = adjustedTargetAmount !== null || adjustedMonths !== null

  return (
    <div className="space-y-4">
      {revealed.includes("budget") && (
        <TadaCard title={t("setupV2.tada.budgetTitle")} description={t("setupV2.tada.budgetDesc")} />
      )}

      {revealed.includes("goal") && (
        <TadaCard title={t("setupV2.tada.goalTitle")} description={goal.name} />
      )}

      {revealed.includes("feasibility") && (
        <div className="space-y-3 rounded-[13px] border border-border/40 bg-card p-4 shadow-card">
          <p className="font-semibold text-foreground">
            {feasibility.feasible
              ? t("setupV2.tada.feasibleTitle", { amount: formatVND(feasibility.monthlyNeeded) })
              : t("setupV2.tada.infeasibleTitle")}
          </p>
          {/* Gate theo verdict gốc từ server, không theo feasibility live:
              nếu gate live thì vừa gõ qua ngưỡng khả thi là inputs unmount giữa chừng. */}
          {!original.feasibility.feasible && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t("setupV2.tada.infeasibleDesc")}</p>
              <div className="space-y-1.5">
                <Label htmlFor="tada-target">{t("setupV2.tada.adjustTargetLabel")}</Label>
                <CurrencyInput id="tada-target" value={targetAmount} onChange={setAdjustedTargetAmount} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tada-months">{t("setupV2.tada.adjustMonthsLabel")}</Label>
                <Input
                  id="tada-months"
                  inputMode="numeric"
                  value={months}
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "")
                    setAdjustedMonths(Number(digits) || 1)
                  }}
                  className="font-mono tabular-nums"
                />
              </div>
              <p className="font-mono text-sm tabular-nums text-muted-foreground">
                {t("setupV2.tada.monthlyNeeded", { amount: formatVND(feasibility.monthlyNeeded) })}
              </p>
            </div>
          )}
        </div>
      )}

      {revealed.includes("todayRemaining") && (
        <TadaCard
          title={t("setupV2.tada.todayRemainingTitle", { amount: formatVND(original.todayRemaining) })}
          description={t("setupV2.tada.todayRemainingDesc")}
        />
      )}

      {revealed.length === TADA_REVEAL_STAGES.length && (
        <TadaFinishButton
          wasAdjusted={wasAdjusted}
          targetAmount={targetAmount}
          fundType={goal.fundType}
          months={months}
          onDone={() => {
            // Xóa sessionStorage: user khác đăng nhập cùng tab không được
            // thừa hưởng goal/income cũ và auto-fire mutation ở TadaStep
            resetOnboarding()
            router.push("/dashboard")
          }}
        />
      )}
    </div>
  )
}

function TadaFinishButton({
  wasAdjusted,
  targetAmount,
  fundType,
  months,
  onDone,
}: {
  wasAdjusted: boolean
  targetAmount: number
  fundType: "emergency" | "goal"
  months: number
  onDone: () => void
}) {
  const { t } = useTranslation()
  const { data: funds } = useFunds()
  const fund = funds?.find((f) => f.fund_type === fundType) ?? funds?.[0]
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
      disabled={wasAdjusted && (!fund || updateFund.isPending)}
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

function TadaCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1 rounded-[13px] border border-border/40 bg-card p-4 shadow-card">
      <p className="font-semibold text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
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
