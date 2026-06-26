"use client"

import { useState, useMemo } from "react"
import { Icon } from "@iconify/react"
import { Button } from "@/components/ui/button"
import { SkeletonList } from "@/components/shared/SkeletonList"
import { EmptyState } from "@/components/shared/EmptyState"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { EstimatedExpenseCard } from "@/components/settings/EstimatedExpenseCard"
import { EstimatedExpenseForm } from "@/components/settings/EstimatedExpenseForm"
import {
  useEstimatedExpenses,
  useDeleteEstimatedExpense,
} from "@/lib/hooks/useEstimatedExpenses"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { EstimatedExpense } from "@/types/app"

export function EstimatedExpenseManager() {
  const { t } = useTranslation()
  const { data: expenses, isLoading } = useEstimatedExpenses()
  const deleteMutation = useDeleteEstimatedExpense()

  const [showForm, setShowForm] = useState(false)
  const [editingExpense, setEditingExpense] = useState<EstimatedExpense | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EstimatedExpense | null>(null)

  const { planned, completed, cancelled } = useMemo(() => {
    if (!expenses) return { planned: [], completed: [], cancelled: [] }
    const p: EstimatedExpense[] = []
    const c: EstimatedExpense[] = []
    const x: EstimatedExpense[] = []
    for (const e of expenses) {
      if (e.status === "planned") p.push(e)
      else if (e.status === "completed") c.push(e)
      else x.push(e)
    }
    return { planned: p, completed: c, cancelled: x }
  }, [expenses])

  if (isLoading) {
    return <SkeletonList count={3} />
  }

  if (!expenses || expenses.length === 0) {
    return (
      <>
        <EmptyState
          icon="lucide:receipt"
          title={t("settings.estimated.empty")}
          description={t("settings.estimated.emptyDesc")}
          ctaLabel={t("settings.estimated.addExpense")}
          onCta={() => setShowForm(true)}
        />
        <EstimatedExpenseForm
          open={showForm}
          onOpenChange={setShowForm}
        />
      </>
    )
  }

  const renderGroup = (titleKey: string, items: EstimatedExpense[]) => {
    if (items.length === 0) return null
    return (
      <div className="space-y-3">
        <h3 className="text-xs font-semibold uppercase text-muted-foreground">
          {t(titleKey)} ({items.length})
        </h3>
        {items.map((e) => (
          <EstimatedExpenseCard
            key={e.id}
            expense={e}
            onEdit={() => {
              setEditingExpense(e)
              setShowForm(true)
            }}
            onDelete={() => setDeleteTarget(e)}
          />
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("settings.estimatedExpenses")}</h2>
          <Button
            size="sm"
            className="min-h-[44px] gap-1.5"
            onClick={() => {
              setEditingExpense(null)
              setShowForm(true)
            }}
          >
            <Icon icon="lucide:plus" className="h-4 w-4" />
            {t("settings.estimated.addExpense")}
          </Button>
        </div>

        {renderGroup("settings.estimated.planned", planned)}
        {renderGroup("settings.estimated.completed", completed)}
        {renderGroup("settings.estimated.cancelled", cancelled)}
      </div>

      <EstimatedExpenseForm
        expense={editingExpense}
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open)
          if (!open) setEditingExpense(null)
        }}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title={t("settings.estimated.deleteTitle")}
        description={t("settings.estimated.deleteDesc", { name: deleteTarget?.name ?? "" })}
        confirmLabel={t("common.delete")}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget.id, {
              onSuccess: () => setDeleteTarget(null),
            })
          }
        }}
        isPending={deleteMutation.isPending}
      />
    </>
  )
}
