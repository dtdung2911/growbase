"use client"

import { CurrencyInput } from "@/components/ui/CurrencyInput"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useOnboardingV2Store } from "@/lib/stores/onboardingV2Store"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { formatVNDCompact } from "@/lib/utils/currency"
import { cn } from "@/lib/utils/cn"
import { GOAL_PRESET_ICONS } from "./goalPresetIcons"

const GOAL_PRESETS = [
  { presetId: "education", fundType: "goal", targetAmount: 200_000_000, targetMonths: 60 },
  { presetId: "house", fundType: "goal", targetAmount: 500_000_000, targetMonths: 36 },
  { presetId: "travel", fundType: "goal", targetAmount: 30_000_000, targetMonths: 12 },
  { presetId: "custom", fundType: "goal", targetAmount: null, targetMonths: null },
] as const;

export function GoalStep() {
  const { t } = useTranslation()
  const goals = useOnboardingV2Store((s) => s.goals)
  const toggleGoal = useOnboardingV2Store((s) => s.toggleGoal)
  const updateGoalField = useOnboardingV2Store((s) => s.updateGoal)
  const clearGoals = useOnboardingV2Store((s) => s.clearGoals)

  const toggle = (preset: (typeof GOAL_PRESETS)[number]) =>
    toggleGoal({
      presetId: preset.presetId,
      fundType: preset.fundType,
      name: preset.presetId === "custom" ? "" : t(`setupV2.goal.${preset.presetId}.name`),
      targetAmount: preset.targetAmount,
      targetMonths: preset.targetMonths,
    })

  const durationLabel = (months: number) =>
    months % 12 === 0
      ? t("setupV2.goal.years", { n: months / 12 })
      : t("setupV2.goal.months", { n: months })

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t("setupV2.goal.title")}
        </h1>
      </div>

      <div className="rounded-[13px] border border-primary/90 bg-card p-4 shadow-card">
        <div className="flex items-start gap-3">
          <span className="text-2xl text-primary" aria-hidden>
            {GOAL_PRESET_ICONS.emergency}
          </span>
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
                    : "border-border/40 bg-foreground/15 hover:border-border/80 hover:bg-foreground/20",
                )}
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={selected}
                  onClick={() => toggle(preset)}
                  className="flex min-h-[44px] w-full items-center gap-3 rounded-[13px] p-4 text-left"
                >
                  <span
                    className={cn(
                      "text-2xl",
                      selected ? "text-primary" : "text-foreground",
                    )}
                    aria-hidden
                  >
                    {GOAL_PRESET_ICONS[preset.presetId]}
                  </span>
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
                      {preset.targetAmount !== null &&
                      preset.targetMonths !== null ? (
                        <span className="font-mono tabular-nums">
                          {formatVNDCompact(preset.targetAmount)} /{" "}
                          {durationLabel(preset.targetMonths)}
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
                    <div className="space-y-1.5">
                      <Label htmlFor={`goal-months-${preset.presetId}`}>
                        {t("setupV2.goal.editor.monthsLabel")}
                      </Label>
                      <Input
                        id={`goal-months-${preset.presetId}`}
                        inputMode="numeric"
                        value={currentGoal.targetMonths ?? ""}
                        onChange={(e) => {
                          const digits = e.target.value.replace(/\D/g, "");
                          updateGoalField(preset.presetId, {
                            targetMonths: digits ? Number(digits) : null,
                          });
                        }}
                        className="font-mono tabular-nums"
                      />
                      {currentGoal.targetMonths !== null &&
                        currentGoal.targetMonths > 0 && (
                          <p className="text-xs text-muted-foreground">
                            {durationLabel(currentGoal.targetMonths)}
                          </p>
                        )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => clearGoals()}
          className="flex min-h-[44px] w-full items-center justify-center rounded-[13px] border border-dashed border-border/60 px-4 text-sm text-muted-foreground transition-colors hover:text-foreground motion-reduce:transition-none"
        >
          {t("setupV2.goal.skipForNow")}
        </button>
      </div>
    </div>
  );
}
