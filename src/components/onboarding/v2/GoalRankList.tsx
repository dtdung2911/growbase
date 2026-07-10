"use client"

import { Icon } from "@iconify/react"
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useOnboardingV2Store } from "@/lib/stores/onboardingV2Store"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { formatVND } from "@/lib/utils/currency"
import {
  MAX_ALLOCATION_MONTHS,
  calculateAllocationPlan,
  type FundAllocation,
} from "@/lib/constants/budgetTemplate"
import { cn } from "@/lib/utils/cn"
import type { OnboardingGoal } from "@/lib/validations/onboardingV2"

// Mirror GoalStep: engine chỉ nhận goal có target hợp lệ, thứ tự = hạng (goals array order).
function planFor(goals: OnboardingGoal[], monthlyIncome: number | null) {
  if (!monthlyIncome || monthlyIncome <= 0) return null
  return calculateAllocationPlan({
    monthlyIncome,
    goals: goals
      .filter((g) => g.targetAmount !== null && g.targetAmount > 0)
      .map((g) => ({ id: g.presetId, targetAmount: g.targetAmount as number })),
  })
}

type Advise = { delta: number; targetRank: number }

// What-if thuần (BR-OB-011: app chỉ advise): đẩy goal lên 1 bậc, đo timeline mới. Không tự đổi hạng.
function computeAdvise(
  goals: OnboardingGoal[],
  monthlyIncome: number | null,
  index: number,
  alloc: FundAllocation | undefined,
): Advise | null {
  if (index === 0 || !alloc || alloc.timelineMonths === null) return null
  const swapped = [...goals]
  ;[swapped[index - 1], swapped[index]] = [swapped[index], swapped[index - 1]]
  const swappedAlloc = planFor(swapped, monthlyIncome)?.allocations.find(
    (a) => a.id === goals[index].presetId,
  )
  if (!swappedAlloc || swappedAlloc.timelineMonths === null) return null
  const delta = alloc.timelineMonths - swappedAlloc.timelineMonths
  if (delta < 1) return null
  return { delta, targetRank: index }
}

export function GoalRankList() {
  const { t } = useTranslation()
  const goals = useOnboardingV2Store((s) => s.goals)
  const monthlyIncome = useOnboardingV2Store((s) => s.monthlyIncome)
  const reorderGoals = useOnboardingV2Store((s) => s.reorderGoals)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const allocById = new Map(planFor(goals, monthlyIncome)?.allocations.map((a) => [a.id, a]) ?? [])

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = goals.findIndex((g) => g.presetId === active.id)
    const to = goals.findIndex((g) => g.presetId === over.id)
    if (from === -1 || to === -1) return
    reorderGoals(from, to)
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">{t("setupV2.goal.rankTitle")}</p>
        <p className="text-xs text-muted-foreground">{t("setupV2.goal.rankSubtitle")}</p>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={goals.map((g) => g.presetId)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {goals.map((goal, index) => {
              const alloc = allocById.get(goal.presetId)
              return (
                <SortableGoalRow
                  key={goal.presetId}
                  goal={goal}
                  rank={index + 1}
                  alloc={alloc}
                  advise={computeAdvise(goals, monthlyIncome, index, alloc)}
                />
              )
            })}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function SortableGoalRow({
  goal,
  rank,
  alloc,
  advise,
}: {
  goal: OnboardingGoal
  rank: number
  alloc: FundAllocation | undefined
  advise: Advise | null
}) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: goal.presetId,
  })

  const displayName = goal.name || t("setupV2.goal.custom.name")

  const rankColor =
    rank === 1
      ? "bg-primary/10 text-primary"
      : rank === 2
        ? "bg-info/10 text-info"
        : "bg-muted text-muted-foreground"

  const finite =
    alloc && alloc.timelineMonths !== null && alloc.monthlyAmount !== null
      ? { amount: alloc.monthlyAmount, months: alloc.timelineMonths }
      : null

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2.5 rounded-[13px] border border-border/40 bg-card p-3 shadow-card",
        isDragging && "relative z-10 opacity-80",
      )}
    >
      <button
        type="button"
        aria-label={t("setupV2.goal.rankHandleLabel", { name: displayName })}
        className="flex h-11 min-h-[44px] w-11 shrink-0 touch-none cursor-grab items-center justify-center rounded-[13px] text-muted-foreground hover:text-foreground"
        {...attributes}
        {...listeners}
      >
        <Icon icon="solar:hamburger-menu-linear" className="text-xl" aria-hidden />
      </button>
      <span
        className={cn(
          "flex h-7 shrink-0 items-center rounded-full px-2.5 text-xs font-semibold",
          rankColor,
        )}
      >
        {t("setupV2.goal.rankLabel", { rank })}
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate font-medium text-foreground">{displayName}</p>
        {finite ? (
          <p className="font-mono text-xs tabular-nums text-muted-foreground">
            {t("setupV2.goal.suggest", { amount: formatVND(finite.amount), months: finite.months })}
          </p>
        ) : alloc ? (
          <p className="text-xs text-muted-foreground">
            {t("setupV2.goal.suggestNever", { max: MAX_ALLOCATION_MONTHS })}
          </p>
        ) : null}
        {advise && (
          <AdviseHint template={t("setupV2.goal.adviseHint")} delta={advise.delta} rank={advise.targetRank} />
        )}
      </div>
    </li>
  )
}

// Số vào span font-mono tabular-nums (chuẩn 10.3), câu prose thường quanh placeholder.
function AdviseHint({ template, delta, rank }: { template: string; delta: number; rank: number }) {
  const parts = template.split(/(\{\{delta\}\}|\{\{rank\}\})/)
  return (
    <p className="text-xs text-muted-foreground">
      {parts.map((part, i) => {
        if (part === "{{delta}}") return <span key={i} className="font-mono tabular-nums">{delta}</span>
        if (part === "{{rank}}") return <span key={i} className="font-mono tabular-nums">{rank}</span>
        return part
      })}
    </p>
  )
}
