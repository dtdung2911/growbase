"use client"

import { useState, useEffect } from "react"
import { Icon } from "@iconify/react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CurrencyInput } from "@/components/ui/CurrencyInput"
import {
  useCreateEstimatedExpense,
  useUpdateEstimatedExpense,
} from "@/lib/hooks/useEstimatedExpenses"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { EstimatedExpense, EstimatedExpenseStatus } from "@growbase/shared/types/app"

const STATUS_VALUES: EstimatedExpenseStatus[] = ["planned", "completed", "cancelled"]

type EstimatedExpenseFormProps = {
  expense?: EstimatedExpense | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EstimatedExpenseForm({
  expense,
  open,
  onOpenChange,
}: EstimatedExpenseFormProps) {
  const { t } = useTranslation()
  const isEdit = Boolean(expense)
  const createMutation = useCreateEstimatedExpense()
  const updateMutation = useUpdateEstimatedExpense()

  const [name, setName] = useState("")
  const [estimatedAmount, setEstimatedAmount] = useState(0)
  const [categoryId, setCategoryId] = useState("")
  const [linkedFundId, setLinkedFundId] = useState("")
  const [targetDate, setTargetDate] = useState("")
  const [notes, setNotes] = useState("")
  const [status, setStatus] = useState<EstimatedExpenseStatus>("planned")

  useEffect(() => {
    if (expense) {
      setName(expense.name)
      setEstimatedAmount(expense.estimated_amount)
      setCategoryId(expense.category_id ?? "")
      setLinkedFundId(expense.linked_fund_id ?? "")
      setTargetDate(expense.target_date ?? "")
      setNotes(expense.notes ?? "")
      setStatus(expense.status)
    } else {
      setName("")
      setEstimatedAmount(0)
      setCategoryId("")
      setLinkedFundId("")
      setTargetDate("")
      setNotes("")
      setStatus("planned")
    }
  }, [expense])

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || estimatedAmount <= 0) return

    if (isEdit && expense) {
      updateMutation.mutate(
        {
          id: expense.id,
          name: name.trim(),
          estimated_amount: estimatedAmount,
          status,
          target_date: targetDate || null,
          notes: notes || null,
        },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createMutation.mutate(
        {
          name: name.trim(),
          estimated_amount: estimatedAmount,
          category_id: categoryId || undefined,
          linked_fund_id: linkedFundId || undefined,
          target_date: targetDate || undefined,
          notes: notes || undefined,
        },
        { onSuccess: () => onOpenChange(false) }
      )
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>
            {isEdit ? t("settings.estimated.editTitle") : t("settings.estimated.addTitle")}
          </SheetTitle>
          <SheetDescription>
            {isEdit ? t("settings.estimated.editDesc") : t("settings.estimated.addDesc")}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="ee-name" className="text-xs">
              {t("settings.estimated.nameLabel")}
            </Label>
            <Input
              id="ee-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("settings.estimated.namePlaceholder")}
              className="rounded-xl bg-inset text-base"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ee-amount" className="text-xs">
              {t("settings.estimated.amountLabel")}
            </Label>
            <CurrencyInput
              id="ee-amount"
              value={estimatedAmount}
              onChange={setEstimatedAmount}
              className="rounded-xl bg-inset"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ee-target-date" className="text-xs">
              {t("settings.estimated.targetDateLabel")}
            </Label>
            <Input
              id="ee-target-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="rounded-xl bg-inset text-base"
            />
          </div>

          {!isEdit && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="ee-category" className="text-xs">
                  {t("settings.estimated.categoryLabel")}
                </Label>
                <Input
                  id="ee-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  placeholder={t("settings.estimated.categoryPlaceholder")}
                  className="rounded-xl bg-inset text-base"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ee-fund" className="text-xs">
                  {t("settings.estimated.fundLabel")}
                </Label>
                <Input
                  id="ee-fund"
                  value={linkedFundId}
                  onChange={(e) => setLinkedFundId(e.target.value)}
                  placeholder={t("settings.estimated.fundPlaceholder")}
                  className="rounded-xl bg-inset text-base"
                />
              </div>
            </>
          )}

          {isEdit && (
            <div className="space-y-1.5">
              <Label htmlFor="ee-status" className="text-xs">
                {t("settings.estimated.statusLabel")}
              </Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as EstimatedExpenseStatus)}
              >
                <SelectTrigger id="ee-status" className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_VALUES.map((val) => (
                    <SelectItem key={val} value={val}>
                      {t(`settings.estimated.${val}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="ee-notes" className="text-xs">
              {t("settings.debt.notesLabel")}
            </Label>
            <Input
              id="ee-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("common.optional")}
              className="rounded-xl bg-inset text-base"
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-xl"
            disabled={!name.trim() || estimatedAmount <= 0 || isPending}
          >
            {isPending && (
              <Icon icon="lucide:loader-2" className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            {isPending
              ? t("common.saving")
              : isEdit
                ? t("settings.categories.saveChanges")
                : t("settings.estimated.addExpense")}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
