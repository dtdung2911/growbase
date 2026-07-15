"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Icon } from "@iconify/react"
import { Button } from "@/components/ui/button"
import { CurrencyInput } from "@/components/ui/CurrencyInput"
import { Label } from "@/components/ui/label"
import { useOnboardingV2Store } from "@/lib/stores/onboardingV2Store"
import { useAppStore } from "@/lib/stores/appStore"
import { useMutation, useMutationState, useQueryClient } from "@tanstack/react-query"
import {
  COMPLETE_ONBOARDING_V2_KEY,
  useCompleteOnboardingV2,
  type CompleteOnboardingV2Response,
  type OnboardingFundResult,
} from "@/lib/hooks/useCompleteOnboardingV2"
import { useFunds } from "@/lib/hooks/useFunds"
import { keys } from "@growbase/shared/queryKeys"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { formatVND } from "@growbase/shared/rules/currency"
import { addMonthsIso } from "@growbase/shared/rules/date"
import { cn } from "@/lib/utils/cn"
import { toast } from "sonner"
import {
  BUDGET_SEGMENTS,
  FLEXIBLE_COST_TYPE_GROUPS,
  MAX_ALLOCATION_MONTHS,
  calculateAllocationPlan,
  sumBudgetPct,
} from "@growbase/shared/constants/budgetTemplate"
import { TADA_REVEAL_STAGES, pickThreeStageKey, type TadaRevealStage } from "@/lib/constants/tadaReveal"
import { PRESET_ICON_NAMES } from "./goalPresetIcons";
import { PlanDetailSheet } from "./PlanDetailSheet";

const STAGE_DELAY_MS = 550

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

  if (monthlyIncome === null) return null

  if (mutationStatus === "error") {
    const status = (mutation?.error as (Error & { status?: number }) | null)?.status
    if (status === 409) {
      return (
        <TadaMessage
          title={t("setupV2.tada.alreadyOnboardedTitle")}
          description={t("setupV2.tada.alreadyOnboardedDesc")}
        >
          <Button
            className="min-h-[44px] w-full"
            onClick={() => {
              resetOnboarding();
              router.push("/dashboard");
            }}
          >
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
  // Quỹ có thể chỉnh: goal hạng cao nhất — không bao giờ đụng quỹ khẩn cấp (BR-OB-006).
  const adjustFund = original.funds.find((f) => f.fundType === "goal")
  const targetAmount = adjustedTargetAmount ?? adjustFund?.targetAmount ?? 0

  // Re-run engine client-side: đổi target quỹ đang chỉnh → timeline + phân bổ giãn theo (một nguồn số với server).
  const engineGoals = original.funds
    .filter((f) => f.fundType === "goal")
    .map((f) => ({
      id: f.id,
      targetAmount: adjustFund && f.id === adjustFund.id ? targetAmount : f.targetAmount,
    }))
  const livePlan = calculateAllocationPlan({ monthlyIncome, goals: engineGoals })
  const allocById = new Map(livePlan.allocations.map((a) => [a.id, a]))
  const allocFor = (f: OnboardingFundResult) =>
    allocById.get(f.fundType === "emergency" ? "emergency" : f.id)

  const fundMonthly = (f: OnboardingFundResult) => allocFor(f)?.monthlyAmount ?? null
  const fundTimeline = (f: OnboardingFundResult) => allocFor(f)?.timelineMonths ?? null
  const targetFor = (f: OnboardingFundResult) =>
    adjustFund && f.id === adjustFund.id ? targetAmount : f.targetAmount

  // livePlan re-time TẤT CẢ quỹ theo target mới → DB target_date mọi goal fund phải khớp Tada
  // (không chỉ quỹ vừa chỉnh) nếu không dashboard sẽ mâu thuẫn. Emergency không đụng (target_date luôn null).
  const goalFundUpdates = original.funds
    .filter((f) => f.fundType === "goal")
    .map((f) => {
      const timeline = fundTimeline(f)
      return {
        fundId: f.id,
        target_date: timeline !== null ? addMonthsIso(timeline) : null,
        ...(adjustFund && f.id === adjustFund.id ? { target_amount: targetAmount } : {}),
      }
    })

  // API không trả icon: quỹ custom lấy icon user chọn từ goals state (match theo name), preset map từ presetId.
  const iconFor = (f: OnboardingFundResult) =>
    f.presetId === "custom"
      ? goals.find((g) => g.presetId === "custom" && g.name.trim() === f.name.trim())?.icon ?? PRESET_ICON_NAMES.custom
      : PRESET_ICON_NAMES[f.presetId] ?? PRESET_ICON_NAMES.custom

  const timelineLabel = (months: number | null) =>
    months === null
      ? t("setupV2.tada.fundTimelineNever", { max: MAX_ALLOCATION_MONTHS })
      : t("setupV2.tada.fundTimeline", { months })

  const wasAdjusted = adjustedTargetAmount !== null
  // goalSchema min(100_000): số nhỏ hơn (vd gõ "20" = 20đ) không được đẩy vào PATCH.
  const belowMinTarget = adjustedTargetAmount !== null && adjustedTargetAmount < 100_000

  // Dòng kể 3 giai đoạn: chỉ surface số tháng GĐ1 (stage1EndMonth) — GĐ2/GĐ3 là narrative kế hoạch,
  // không phải mốc đã đạt nên s2===null không cần nhánh riêng. Nhánh theo edge engine (§Edge story).
  const stage1End = livePlan.stage1EndMonth
  const threeStageKey = pickThreeStageKey(stage1End, engineGoals.length > 0)
  const threeStageMonths = stage1End !== null && stage1End > 0 ? stage1End : null

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
              key={f.id}
              className="flex items-center gap-3 rounded-[13px] border border-border/40 bg-card p-4 shadow-card"
            >
              <Icon icon={iconFor(f)} className="text-2xl text-primary" aria-hidden />
              <div className="flex-1">
                <p className="font-semibold text-primary">{f.name}</p>
                <p className="font-mono text-sm tabular-nums text-muted-foreground">
                  {formatVND(targetFor(f))}
                </p>
                {fundMonthly(f) !== null && (
                  <p className="font-mono text-xs tabular-nums text-muted-foreground">
                    {t("setupV2.tada.fundMonthly", { amount: formatVND(fundMonthly(f)!) })}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">{timelineLabel(fundTimeline(f))}</p>
              </div>
            </div>
          ))}
          <p className="font-mono text-sm font-semibold tabular-nums text-foreground">
            {t("setupV2.tada.totalMonthly", { amount: formatVND(livePlan.capacityMonthly) })}
          </p>
        </div>
      )}

      {revealed.includes("feasibility") && (
        <div className="space-y-3 rounded-[13px] border border-border/40 bg-card p-4 shadow-card">
          <p className="font-semibold text-foreground">
            {t("setupV2.tada.feasibleTitle", { amount: formatVND(livePlan.capacityMonthly) })}
          </p>
          <p className="text-xs text-muted-foreground">
            {t("setupV2.tada.capacitySource", { percent: sumBudgetPct(["savings_investment"]) })}
          </p>
          <ThreeStageLine template={t(`setupV2.tada.threeStage.${threeStageKey}`)} months={threeStageMonths} />
          <p className="text-xs text-muted-foreground">
            {t("setupV2.tada.rationale.mentalAccounting")}
          </p>
          {adjustFund ? (
            <div className="space-y-3">
              <p className="text-sm font-medium text-foreground">
                {t("setupV2.tada.adjustingFund", { name: adjustFund.name })}
              </p>
              <div className="space-y-1.5">
                <Label htmlFor="tada-target">{t("setupV2.tada.adjustTargetLabel")}</Label>
                <CurrencyInput
                  id="tada-target"
                  value={targetAmount}
                  // Clamp khớp cap Zod onboarding (100_000_000_000_000) → tránh PATCH số vượt trần
                  onChange={(v) => setAdjustedTargetAmount(v ? Math.min(v, 100_000_000_000_000) : null)}
                />
                {belowMinTarget && (
                  <p className="text-xs text-destructive">{t("setupV2.tada.minTargetHint")}</p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{timelineLabel(fundTimeline(adjustFund))}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t("setupV2.tada.noAdjustHint")}</p>
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
          <p className="text-xs text-muted-foreground">
            {t("setupV2.tada.todayRemainingHint", {
              percent: sumBudgetPct(FLEXIBLE_COST_TYPE_GROUPS),
              days: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate(),
            })}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("setupV2.tada.hookCallback")}
          </p>
        </div>
      )}

      {revealed.length === TADA_REVEAL_STAGES.length && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{t("setupV2.tada.attribution")}</p>
          <PlanDetailSheet
            plan={livePlan}
            funds={original.funds.map((f) => ({ ...f, targetAmount: targetFor(f) }))}
            monthlyIncome={monthlyIncome}
          />
        </div>
      )}

      {revealed.length === TADA_REVEAL_STAGES.length && (
        <TadaFinishButton
          wasAdjusted={wasAdjusted}
          invalid={belowMinTarget}
          updates={goalFundUpdates}
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

interface GoalFundUpdate {
  fundId: string
  target_date: string | null
  target_amount?: number
}

function TadaFinishButton({
  wasAdjusted,
  invalid,
  updates,
  onDone,
}: {
  wasAdjusted: boolean
  invalid: boolean
  updates: GoalFundUpdate[]
  onDone: () => void
}) {
  const { t } = useTranslation()
  const { data: funds, isPending: fundsPending } = useFunds()
  const qc = useQueryClient()
  const householdId = useAppStore((s) => s.householdId)

  // Sequential PATCH mọi goal fund: quỹ chỉnh nhận {target_amount, target_date}, còn lại {target_date} mới.
  const patchFunds = useMutation({
    mutationFn: async (ups: GoalFundUpdate[]) => {
      for (const { fundId, ...body } of ups) {
        const res = await fetch(`/api/funds/${fundId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json.error ?? t("funds.updateFailed"))
        }
      }
    },
    onSuccess: () => {
      if (householdId) void qc.invalidateQueries({ queryKey: keys.funds(householdId) })
    },
  })

  const handleClick = async () => {
    if (invalid) return // số dưới min không bao giờ được PATCH (button cũng disabled)
    if (wasAdjusted) {
      if (!funds || funds.length === 0) {
        toast.warning(t("setupV2.tada.fundNotFound"))
      } else {
        try {
          await patchFunds.mutateAsync(updates)
        } catch (err) {
          // Giữ user ở Tada (không sang dashboard) khi lưu lỗi.
          toast.error(err instanceof Error ? err.message : t("funds.updateFailed"), { duration: 5000 })
          return
        }
      }
    }
    onDone()
  }

  return (
    <Button
      className="min-h-[44px] w-full"
      onClick={handleClick}
      // Không chặn vĩnh viễn nếu useFunds lỗi (funds undefined): chỉ chặn khi đang tải/đang lưu.
      disabled={invalid || (wasAdjusted && (fundsPending || patchFunds.isPending))}
    >
      {t("setupV2.tada.cta")}
    </Button>
  )
}

// Câu kể prose; chỉ SỐ tháng bọc font-mono (không mono cả câu). Template có/không {{months}}
// tùy nhánh — split trả 1 phần khi vắng placeholder nên months===null render nguyên câu.
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
