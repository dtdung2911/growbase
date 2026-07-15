"use client"

import { useEffect, useState } from "react"
import { Icon } from "@iconify/react"
import { arrayMove } from "@dnd-kit/sortable"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { GoalRankList, type RankItem } from "@/components/onboarding/v2/GoalRankList"
import { useReorderGoalFunds } from "@/lib/hooks/useFunds"
import { useLivingPlan } from "@/lib/hooks/useLivingPlan"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { Fund } from "@growbase/shared/types/app"

type RankSheetProps = {
  goalFunds: Fund[] // active goal funds đã sort theo hạng
}

export function RankSheet({ goalFunds }: RankSheetProps) {
  const { t } = useTranslation()
  const { trailingIncome, emergencyBalance } = useLivingPlan()
  const reorder = useReorderGoalFunds()
  const [order, setOrder] = useState<Fund[]>(goalFunds)

  // Hoà local order với server khi funds đổi, trừ khi đang lưu (tránh đè optimistic đang chạy).
  useEffect(() => {
    if (!reorder.isPending) setOrder(goalFunds)
  }, [goalFunds, reorder.isPending])

  const handleReorder = (from: number, to: number) => {
    if (reorder.isPending) return // khoá double-drag → tránh 2 loop PATCH interleave gây rank bẩn
    const prev = order
    const next = arrayMove(order, from, to)
    setOrder(next)
    reorder.mutate(
      next.map((f) => f.id),
      { onError: () => setOrder(prev) },
    )
  }

  const items: RankItem[] = order.map((f) => ({
    id: f.id,
    name: f.name,
    targetAmount: f.target_amount,
    currentBalance: f.current_balance,
  }))

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="min-h-[44px]">
          <Icon icon="solar:ranking-linear" className="h-4 w-4" />
          {t("funds.plan.rankCta")}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto pb-8">
        <SheetHeader className="sr-only">
          <SheetTitle>{t("funds.plan.rankSheetTitle")}</SheetTitle>
          <SheetDescription>{t("funds.plan.rankSheetDesc")}</SheetDescription>
        </SheetHeader>
        <div className="mx-auto max-w-md">
          <GoalRankList
            items={items}
            monthlyIncome={trailingIncome}
            emergencyBalance={emergencyBalance}
            onReorder={handleReorder}
            readOnly={reorder.isPending}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
