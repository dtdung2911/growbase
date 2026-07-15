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
import { useTranslation } from "@/lib/i18n/useTranslation"
import { formatVND } from "@growbase/shared/rules/currency"
import {
  MAX_ALLOCATION_MONTHS,
  calculateAllocationPlan,
  type FundAllocation,
} from "@growbase/shared/constants/budgetTemplate"
import { cn } from "@/lib/utils/cn"

export type RankItem = {
  id: string
  name: string
  targetAmount: number | null
  currentBalance?: number
}

// Engine chỉ nhận item có target hợp lệ, thứ tự = hạng (items array order = index 0 hạng cao nhất).
function planFor(items: RankItem[], monthlyIncome: number | null, emergencyBalance: number) {
  if (!monthlyIncome || monthlyIncome <= 0) return null
  return calculateAllocationPlan({
    monthlyIncome,
    emergencyBalance,
    goals: items
      .filter((i) => i.targetAmount !== null && i.targetAmount > 0)
      .map((i) => ({
        id: i.id,
        targetAmount: i.targetAmount as number,
        initialBalance: i.currentBalance,
      })),
  })
}

type Advise = { delta: number; targetRank: number }

// What-if thuần (BR-OB-011: app chỉ advise): đẩy item lên 1 bậc, đo timeline mới. Không tự đổi hạng.
function computeAdvise(
  items: RankItem[],
  monthlyIncome: number | null,
  emergencyBalance: number,
  index: number,
  alloc: FundAllocation | undefined,
): Advise | null {
  if (index === 0 || !alloc || alloc.timelineMonths === null) return null
  const swapped = [...items]
  ;[swapped[index - 1], swapped[index]] = [swapped[index], swapped[index - 1]]
  const swappedAlloc = planFor(swapped, monthlyIncome, emergencyBalance)?.allocations.find(
    (a) => a.id === items[index].id,
  )
  if (!swappedAlloc || swappedAlloc.timelineMonths === null) return null
  const delta = alloc.timelineMonths - swappedAlloc.timelineMonths
  if (delta < 1) return null
  return { delta, targetRank: index }
}

type GoalRankListProps = {
  items: RankItem[]
  monthlyIncome: number | null
  onReorder: (from: number, to: number) => void
  emergencyBalance?: number
  readOnly?: boolean
}

export function GoalRankList({
  items,
  monthlyIncome,
  onReorder,
  emergencyBalance = 0,
  readOnly = false,
}: GoalRankListProps) {
  const { t } = useTranslation()
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const allocById = new Map(
    planFor(items, monthlyIncome, emergencyBalance)?.allocations.map((a) => [a.id, a]) ?? [],
  )

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const from = items.findIndex((i) => i.id === active.id)
    const to = items.findIndex((i) => i.id === over.id)
    if (from === -1 || to === -1) return
    onReorder(from, to)
  }

  const rows = items.map((item, index) => (
    <SortableGoalRow
      key={item.id}
      item={item}
      rank={index + 1}
      alloc={allocById.get(item.id)}
      advise={computeAdvise(items, monthlyIncome, emergencyBalance, index, allocById.get(item.id))}
      readOnly={readOnly}
    />
  ))

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-foreground">{t("setupV2.goal.rankTitle")}</p>
        <p className="text-xs text-muted-foreground">{t("setupV2.goal.rankSubtitle")}</p>
      </div>
      <DndContext
        sensors={readOnly ? undefined : sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">{rows}</ul>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function SortableGoalRow({
  item,
  rank,
  alloc,
  advise,
  readOnly,
}: {
  item: RankItem
  rank: number
  alloc: FundAllocation | undefined
  advise: Advise | null
  readOnly: boolean
}) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled: readOnly,
  })

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
      {!readOnly && (
        <button
          type="button"
          aria-label={t("setupV2.goal.rankHandleLabel", { name: item.name })}
          className="flex h-11 min-h-[44px] w-11 shrink-0 touch-none cursor-grab items-center justify-center rounded-[13px] text-muted-foreground hover:text-foreground"
          {...attributes}
          {...listeners}
        >
          <Icon icon="solar:hamburger-menu-linear" className="text-xl" aria-hidden />
        </button>
      )}
      <span
        className={cn(
          "flex h-7 shrink-0 items-center rounded-full px-2.5 text-xs font-semibold",
          rankColor,
        )}
      >
        {t("setupV2.goal.rankLabel", { rank })}
      </span>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="truncate font-medium text-foreground">{item.name}</p>
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
