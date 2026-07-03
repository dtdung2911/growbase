"use client"

import { CurrencyInput } from "@/components/ui/CurrencyInput"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useOnboardingV2Store } from "@/lib/stores/onboardingV2Store"
import type { OnboardingGoal } from "@/lib/validations/onboardingV2"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { formatVNDCompact } from "@/lib/utils/currency"
import { cn } from "@/lib/utils/cn"
import HouseFillIcon from "@iconify-react/bi/house-fill";
import ShieldDuotoneIcon from "@iconify-react/stash/shield-duotone";
import GraduationCapDuotoneIcon from "@iconify-react/stash/graduation-cap-duotone";
import HomeTwotoneIcon from "@iconify-react/ant-design/home-twotone";
import HouseLineDuotoneIcon from "@iconify-react/ph/house-line-duotone";
import IslandDuotoneIcon from "@iconify-react/ph/island-duotone";
import PencilSimpleLineDuotoneIcon from "@iconify-react/ph/pencil-simple-line-duotone";

const GOAL_PRESETS = [
  {
    presetId: "emergency",
    emoji: (
      <ShieldDuotoneIcon
        height="1.6em"
        style={{ color: "var(--primary-color)" }}
      />
    ),
    fundType: "emergency",
    targetAmount: null,
    targetMonths: null,
  },
  {
    presetId: "education",
    emoji: (
      <GraduationCapDuotoneIcon
        height="1.8em"
        style={{ color: "var(--primary-color)" }}
      />
    ),
    fundType: "goal",
    targetAmount: 200_000_000,
    targetMonths: 60,
  },
  {
    presetId: "house",
    // emoji: <HouseFillIcon height="1em" style={{ color: "var(--primary)" }} />,
    emoji: (
      <HouseLineDuotoneIcon
        height="1.5em"
        style={{ color: "var(--primary-color)" }}
      />
    ),
    fundType: "goal",
    targetAmount: 500_000_000,
    targetMonths: 36,
  },
  {
    presetId: "travel",
    emoji: (
      <IslandDuotoneIcon 
      height="1.8em" style={{ color: "var(--primary-color)" }} />
    ),
    fundType: "goal",
    targetAmount: 30_000_000,
    targetMonths: 12,
  },
  {
    presetId: "custom",
    emoji: (
      <PencilSimpleLineDuotoneIcon
        height="1.3em"
        style={{ color: "var(--primary-color)" }}
      />
    ),
    fundType: "goal",
    targetAmount: null,
    targetMonths: null,
  },
] as const;

export function GoalStep() {
  const { t } = useTranslation()
  const goal = useOnboardingV2Store((s) => s.goal)
  const setGoal = useOnboardingV2Store((s) => s.setGoal)

  const selectPreset = (preset: (typeof GOAL_PRESETS)[number]) => {
    if (goal?.presetId === preset.presetId) return
    setGoal({
      presetId: preset.presetId,
      fundType: preset.fundType,
      name: preset.presetId === "custom" ? "" : t(`setupV2.goal.${preset.presetId}.name`),
      targetAmount: preset.targetAmount,
      targetMonths: preset.targetMonths,
    })
  }

  const updateGoal = (patch: Partial<OnboardingGoal>) => {
    if (goal) setGoal({ ...goal, ...patch })
  }

  const durationLabel = (months: number) =>
    months % 12 === 0
      ? t("setupV2.goal.years", { n: months / 12 })
      : t("setupV2.goal.months", { n: months })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{t("setupV2.goal.title")}</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">{t("setupV2.goal.subtitle")}</p>
      </div>

      <div role="radiogroup" aria-label={t("setupV2.goal.title")} className="space-y-3">
        {GOAL_PRESETS.map((preset) => {
          const selected = goal?.presetId === preset.presetId
          const showEditor = selected && preset.presetId !== "emergency"
          return (
            <div
              key={preset.presetId}
              className={cn(
                "rounded-[13px] border bg-card shadow-card transition-[border-color,box-shadow] duration-[250ms] motion-reduce:transition-none",
                selected ? "border-primary ring-2 ring-primary/20" : "border-border/40"
              )}
            >
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => selectPreset(preset)}
                className="flex min-h-[44px] w-full items-center gap-3 rounded-[13px] p-4 text-left"
              >
                <span className="text-2xl" aria-hidden>
                  {preset.emoji}
                </span>
                <span className="flex-1">
                  <span className="block font-semibold text-foreground">
                    {t(`setupV2.goal.${preset.presetId}.name`)}
                  </span>
                  <span className="block text-sm text-muted-foreground">
                    {preset.targetAmount !== null && preset.targetMonths !== null ? (
                      <span className="font-mono tabular-nums">
                        {formatVNDCompact(preset.targetAmount)} / {durationLabel(preset.targetMonths)}
                      </span>
                    ) : (
                      t(`setupV2.goal.${preset.presetId}.desc`)
                    )}
                  </span>
                </span>
              </button>

              {showEditor && goal && (
                <div className="space-y-3 border-t border-border/40 p-4">
                  {preset.presetId === "custom" && (
                    <div className="space-y-1.5">
                      <Label htmlFor="goal-name">{t("setupV2.goal.editor.nameLabel")}</Label>
                      <Input
                        id="goal-name"
                        value={goal.name}
                        placeholder={t("setupV2.goal.editor.namePlaceholder")}
                        onChange={(e) => updateGoal({ name: e.target.value })}
                      />
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <Label htmlFor="goal-target">{t("setupV2.goal.editor.targetLabel")}</Label>
                    <CurrencyInput
                      id="goal-target"
                      value={goal.targetAmount ?? 0}
                      onChange={(v) => updateGoal({ targetAmount: v || null })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="goal-months">{t("setupV2.goal.editor.monthsLabel")}</Label>
                    <Input
                      id="goal-months"
                      inputMode="numeric"
                      value={goal.targetMonths ?? ""}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "")
                        updateGoal({ targetMonths: digits ? Number(digits) : null })
                      }}
                      className="font-mono tabular-nums"
                    />
                    {goal.targetMonths !== null && goal.targetMonths > 0 && (
                      <p className="text-xs text-muted-foreground">{durationLabel(goal.targetMonths)}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
