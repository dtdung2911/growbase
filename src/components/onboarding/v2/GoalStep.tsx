"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import { CurrencyInput } from "@/components/ui/CurrencyInput"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useOnboardingV2Store } from "@/lib/stores/onboardingV2Store"
import { goalSchema } from "@/lib/validations/onboardingV2"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { formatVND, formatVNDCompact } from "@/lib/utils/currency"
import {
  calculateAllocationPlan,
  compoundTimelineMonths,
  ladderWeights,
  pickCompoundTier,
  COMPOUND_RATES_YEAR,
  COMPOUND_TIERS,
  MAX_ALLOCATION_MONTHS,
} from "@/lib/constants/budgetTemplate"
import { cn } from "@/lib/utils/cn"
import { CUSTOM_ICON_CHOICES, PRESET_ICON_NAMES } from "./goalPresetIcons";
import { GoalRankList } from "./GoalRankList";

// Timeline > 10 năm → kèm lối thoát (BR-OB-012); nắn chặng opt-in thật ở Tada/Epic 11.
const LONG_TIMELINE_MONTHS = 120;

const GOAL_PRESETS = [
  { presetId: "education", fundType: "goal", targetAmount: 200_000_000 },
  { presetId: "house", fundType: "goal", targetAmount: 500_000_000 },
  { presetId: "travel", fundType: "goal", targetAmount: 30_000_000 },
  { presetId: "custom", fundType: "goal", targetAmount: null },
] as const;

export function GoalStep() {
  const { t } = useTranslation()
  const goals = useOnboardingV2Store((s) => s.goals)
  const monthlyIncome = useOnboardingV2Store((s) => s.monthlyIncome)
  const toggleGoal = useOnboardingV2Store((s) => s.toggleGoal)
  const updateGoalField = useOnboardingV2Store((s) => s.updateGoal)
  const clearGoals = useOnboardingV2Store((s) => s.clearGoals)

  // Nắn chặng = DISPLAY-ONLY (D1/BR-OB-012): state local per presetId, không đổi DB/store.
  const [splitOpen, setSplitOpen] = useState<Record<string, boolean>>({})

  const toggle = (preset: (typeof GOAL_PRESETS)[number]) => {
    // Toggle OFF → prune split state để reselect vẫn "opt-in 1 chạm" (không giữ chặng đã mở).
    if (goals.some((g) => g.presetId === preset.presetId)) {
      setSplitOpen((s) => {
        const next = { ...s }
        delete next[preset.presetId]
        return next
      })
    }
    toggleGoal({
      presetId: preset.presetId,
      fundType: preset.fundType,
      name: preset.presetId === "custom" ? "" : t(`setupV2.goal.${preset.presetId}.name`),
      targetAmount: preset.targetAmount,
      icon: PRESET_ICON_NAMES[preset.presetId] ?? PRESET_ICON_NAMES.custom,
    })
  }

  // Gợi ý khả thi live: hạng tạm = thứ tự thêm quỹ (presetId là id duy nhất trong onboarding).
  // Engine thuần nhẹ (≤600 vòng × ≤6 quỹ) → chạy mỗi keystroke, không debounce/useMemo (Karpathy).
  const plan =
    monthlyIncome && monthlyIncome > 0
      ? calculateAllocationPlan({
          monthlyIncome,
          goals: goals
            .filter((g) => g.targetAmount !== null && g.targetAmount > 0)
            .map((g) => ({ id: g.presetId, targetAmount: g.targetAmount as number })),
        })
      : null
  const allocById = new Map(plan?.allocations.map((a) => [a.id, a]) ?? [])

  // Lãi kép per goal (D2/D3). C = monthlyAmount avg; null (timeline >600) → capacityMonthly ×
  // ladderWeights(nGoals)[rank] (steady-state GĐ3, xấp xỉ dưới disclaimer). Emergency KHÔNG áp
  // (là an toàn, không phải đầu tư) — engine đã tách emergency khỏi goalAllocs.
  const goalCalcs = new Map<
    string,
    {
      halfTarget: number
      baseline: number | null
      compoundMonths: number | null
      stage1Months: number | null
      tierKey: string
    }
  >()
  if (plan) {
    const goalAllocs = plan.allocations.filter((a) => a.id !== "emergency")
    const weights = ladderWeights(goalAllocs.length)
    goalAllocs.forEach((alloc, rank) => {
      const goal = goals.find((g) => g.presetId === alloc.id)
      if (!goal || goal.targetAmount === null || goal.targetAmount <= 0) return
      const target = goal.targetAmount
      const baseline = alloc.timelineMonths
      const contribution =
        alloc.monthlyAmount ?? Math.round(plan.capacityMonthly * (weights[rank] ?? 0))
      const tier = pickCompoundTier(baseline)
      // D3: chỉ khi baseline > tầng 1 (24 tháng) hoặc null; ngắn hơn baseline ≥2 tháng (null → mọi hữu hạn).
      let compoundMonths: number | null = null
      if (baseline === null || baseline > COMPOUND_TIERS[0].maxMonths) {
        const m = compoundTimelineMonths(contribution, target, tier.annualRate)
        if (m !== null && (baseline === null || baseline - m >= 2)) compoundMonths = m
      }
      // Chặng 1 = 50% target: baseline hữu hạn → nửa timeline (engine tuyến tính từ 0);
      // baseline null → compound tầng xa cho nửa target ("lối thoát" thật, là SỐ COMPOUND → cần disclaimer).
      const halfTarget = Math.round(target * 0.5)
      const stage1Months =
        baseline !== null
          ? Math.ceil(baseline / 2)
          : compoundTimelineMonths(contribution, halfTarget, pickCompoundTier(null).annualRate)
      goalCalcs.set(alloc.id, { halfTarget, baseline, compoundMonths, stage1Months, tierKey: tier.key })
    })
  }
  // BR-OB-013: mọi số compound trên màn (line HOẶC split-chặng khi baseline null) LUÔN kèm disclaimer.
  const anyCompound = [...goalCalcs.values()].some(
    (c) => c.compoundMonths !== null || (c.baseline === null && c.stage1Months !== null),
  )

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t("setupV2.goal.title")}
        </h1>
      </div>

      <div className="rounded-[13px] border border-primary/90 bg-card p-4 shadow-card">
        <div className="flex items-start gap-3">
          <Icon
            icon={PRESET_ICON_NAMES.emergency}
            className="text-2xl text-primary"
            aria-hidden
          />
          <div className="flex-1 space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-primary">
                {t("setupV2.goal.emergency.name")}
              </span>
              <Badge>{t("setupV2.goal.emergency.badge")}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("setupV2.goal.emergency.blurb")}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-foreground">
            {t("setupV2.goal.tier2Title")}
          </p>
          {goals.length > 0 && (
            <Badge className="shrink-0 text-xs text-primary">
              {t("setupV2.goal.selectedCount", { n: goals.length })}
            </Badge>
          )}
        </div>

        <div
          role="group"
          aria-label={t("setupV2.goal.tier2Title")}
          className="space-y-3"
        >
          {GOAL_PRESETS.map((preset) => {
            const currentGoal = goals.find(
              (g) => g.presetId === preset.presetId,
            );
            const selected = currentGoal !== undefined;
            return (
              <div
                key={preset.presetId}
                className={cn(
                  "rounded-[13px] border shadow-card transition-[border-color,box-shadow] duration-[250ms] motion-reduce:transition-none",
                  selected
                    ? "border-primary ring-2 ring-primary/20 bg-card"
                    : "border-border/40 bg-card hover:border-border/80",
                )}
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  onClick={() => toggle(preset)}
                  className="flex min-h-[44px] w-full items-center gap-3 rounded-[13px] p-4 text-left"
                >
                  <Icon
                    icon={PRESET_ICON_NAMES[preset.presetId]}
                    className={cn(
                      "text-2xl",
                      selected ? "text-primary" : "text-foreground",
                    )}
                    aria-hidden
                  />
                  <span className="flex-1">
                    <span
                      className={cn(
                        "block font-semibold",
                        selected ? "text-primary" : "text-foreground",
                      )}
                    >
                      {t(`setupV2.goal.${preset.presetId}.name`)}
                    </span>
                    <span className="block text-sm text-muted-foreground">
                      {preset.targetAmount !== null ? (
                        <span className="font-mono tabular-nums">
                          {formatVNDCompact(preset.targetAmount)}
                        </span>
                      ) : (
                        t(`setupV2.goal.${preset.presetId}.desc`)
                      )}
                    </span>
                  </span>
                </button>

                {selected && currentGoal && (
                  <div className="space-y-3 border-t border-border/40 p-4">
                    {preset.presetId === "custom" && (
                      <div className="space-y-1.5">
                        <Label htmlFor={`goal-name-${preset.presetId}`}>
                          {t("setupV2.goal.editor.nameLabel")}
                        </Label>
                        <Input
                          id={`goal-name-${preset.presetId}`}
                          value={currentGoal.name}
                          placeholder={t("setupV2.goal.editor.namePlaceholder")}
                          onChange={(e) =>
                            updateGoalField(preset.presetId, {
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                    )}
                    {preset.presetId === "custom" && (
                      <div className="space-y-1.5">
                        <Label>{t("setupV2.goal.customIconLabel")}</Label>
                        <div
                          role="radiogroup"
                          aria-label={t("setupV2.goal.customIconLabel")}
                          className="grid grid-cols-6 gap-2"
                        >
                          {CUSTOM_ICON_CHOICES.map((choice) => {
                            const active = currentGoal.icon === choice;
                            return (
                              <button
                                key={choice}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                onClick={() =>
                                  updateGoalField(preset.presetId, { icon: choice })
                                }
                                className={cn(
                                  "flex h-11 min-h-[44px] items-center justify-center rounded-[13px] border transition-colors motion-reduce:transition-none",
                                  active
                                    ? "border-primary ring-2 ring-primary"
                                    : "border-border/60 hover:border-border",
                                )}
                              >
                                <Icon
                                  icon={choice}
                                  className={cn(
                                    "text-xl",
                                    active ? "text-primary" : "text-foreground",
                                  )}
                                  aria-hidden
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <Label htmlFor={`goal-target-${preset.presetId}`}>
                        {t("setupV2.goal.editor.targetLabel")}
                      </Label>
                      <CurrencyInput
                        id={`goal-target-${preset.presetId}`}
                        value={currentGoal.targetAmount ?? 0}
                        onChange={(v) =>
                          updateGoalField(preset.presetId, {
                            targetAmount: v || null,
                          })
                        }
                      />
                    </div>
                    {(() => {
                      const alloc = allocById.get(preset.presetId);
                      if (!alloc) return null;
                      const { monthlyAmount, timelineMonths } = alloc;
                      // timelineMonths null (>600) → monthlyAmount cũng null: chỉ báo "chưa xong" + lối thoát.
                      const tooLong =
                        timelineMonths === null ||
                        timelineMonths > LONG_TIMELINE_MONTHS;
                      const calc = goalCalcs.get(preset.presetId);
                      const compoundMonths = calc?.compoundMonths ?? null;
                      const stage1Months = calc?.stage1Months ?? null;
                      const isSplitOpen = Boolean(splitOpen[preset.presetId]);
                      return (
                        <div className="space-y-1">
                          <p className="font-mono text-xs tabular-nums text-muted-foreground">
                            {timelineMonths !== null && monthlyAmount !== null
                              ? t("setupV2.goal.suggest", {
                                  amount: formatVND(monthlyAmount),
                                  months: timelineMonths,
                                })
                              : t("setupV2.goal.suggestNever", {
                                  max: MAX_ALLOCATION_MONTHS,
                                })}
                          </p>
                          {compoundMonths !== null && calc && (
                            <CompoundLine
                              template={t("setupV2.goal.compoundLine")}
                              months={compoundMonths}
                              channel={t(`setupV2.goal.channel.${calc.tierKey}`)}
                            />
                          )}
                          {/* GIỮ escape tĩnh chỉ khi cả compound cũng null (compound line là lối thoát thật). */}
                          {tooLong && compoundMonths === null && (
                            <p className="text-xs text-muted-foreground">
                              {t("setupV2.goal.suggestEscape")}
                            </p>
                          )}
                          {tooLong && calc && stage1Months !== null && (
                            <div className="rounded-[13px] border border-border/60 bg-muted/40 p-3">
                              <button
                                type="button"
                                aria-expanded={isSplitOpen}
                                onClick={() =>
                                  setSplitOpen((s) => ({
                                    ...s,
                                    [preset.presetId]: !s[preset.presetId],
                                  }))
                                }
                                className="flex min-h-[44px] w-full items-center justify-between gap-2 text-left text-sm text-foreground"
                              >
                                <span>{t("setupV2.goal.splitPrompt")}</span>
                                <Icon
                                  icon={
                                    isSplitOpen
                                      ? "solar:alt-arrow-up-linear"
                                      : "solar:alt-arrow-down-linear"
                                  }
                                  className="shrink-0 text-lg text-muted-foreground"
                                  aria-hidden
                                />
                              </button>
                              {isSplitOpen && (
                                <SplitLine
                                  template={t("setupV2.goal.splitStage1")}
                                  amount={formatVNDCompact(calc.halfTarget)}
                                  months={stage1Months}
                                />
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                    {!goalSchema.safeParse(currentGoal).success && (
                      <p className="text-xs text-destructive">
                        {t("setupV2.goal.editor.invalidHint")}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {anyCompound && (
          <p className="rounded bg-warning/10 px-2 py-1 text-xs text-foreground">
            {t("setupV2.goal.compoundDisclaimer", { year: COMPOUND_RATES_YEAR })}
          </p>
        )}

        {goals.length >= 2 && <GoalRankList />}

        <button
          type="button"
          onClick={() => {
            clearGoals();
            setSplitOpen({});
          }}
          className="flex min-h-[44px] w-full items-center justify-center rounded-[13px] border border-dashed border-border/60 px-4 text-sm text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none"
        >
          {t("setupV2.goal.skipForNow")}
        </button>
      </div>
    </div>
  );
}

// Số + kênh tách khỏi template (chuẩn AdviseHint): số mono tabular, kênh nhấn medium; câu prose thường.
function CompoundLine({
  template,
  months,
  channel,
}: {
  template: string;
  months: number;
  channel: string;
}) {
  const parts = template.split(/(\{\{months\}\}|\{\{channel\}\})/);
  return (
    <p className="text-xs text-muted-foreground">
      {parts.map((part, i) => {
        if (part === "{{months}}")
          return (
            <span key={i} className="font-mono tabular-nums text-foreground">
              {months}
            </span>
          );
        if (part === "{{channel}}")
          return (
            <span key={i} className="font-medium text-foreground">
              {channel}
            </span>
          );
        return part;
      })}
    </p>
  );
}

function SplitLine({
  template,
  amount,
  months,
}: {
  template: string;
  amount: string;
  months: number;
}) {
  const parts = template.split(/(\{\{amount\}\}|\{\{months\}\})/);
  return (
    <p className="mt-2 text-sm text-foreground">
      {parts.map((part, i) => {
        if (part === "{{amount}}" || part === "{{months}}")
          return (
            <span key={i} className="font-mono tabular-nums">
              {part === "{{amount}}" ? amount : months}
            </span>
          );
        return part;
      })}
    </p>
  );
}
