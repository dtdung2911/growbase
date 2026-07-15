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
import { useCreateDebt, useUpdateDebt } from "@/lib/hooks/useDebtMutations"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { DebtEntry, DebtType } from "@growbase/shared/types/app"

const DEBT_TYPE_VALUES: DebtType[] = [
  "bank_loan",
  "credit_card",
  "mortgage",
  "personal",
]

type DebtFormProps = {
  debt?: DebtEntry | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DebtForm({ debt, open, onOpenChange }: DebtFormProps) {
  const { t } = useTranslation()
  const isEdit = Boolean(debt)
  const createMutation = useCreateDebt()
  const updateMutation = useUpdateDebt()

  const [creditorName, setCreditorName] = useState("")
  const [debtType, setDebtType] = useState<DebtType>("bank_loan")
  const [totalAmount, setTotalAmount] = useState(0)
  const [remainingAmount, setRemainingAmount] = useState(0)
  const [monthlyPayment, setMonthlyPayment] = useState(0)
  const [interestRate, setInterestRate] = useState("")
  const [startDate, setStartDate] = useState("")
  const [expectedEndDate, setExpectedEndDate] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (debt) {
      setCreditorName(debt.creditor_name)
      setDebtType(debt.debt_type)
      setTotalAmount(debt.total_amount)
      setRemainingAmount(debt.remaining_amount)
      setMonthlyPayment(debt.monthly_payment)
      setInterestRate(debt.interest_rate !== null ? String(debt.interest_rate) : "")
      setStartDate(debt.start_date)
      setExpectedEndDate(debt.expected_end_date ?? "")
      setNotes(debt.notes ?? "")
    } else {
      setCreditorName("")
      setDebtType("bank_loan")
      setTotalAmount(0)
      setRemainingAmount(0)
      setMonthlyPayment(0)
      setInterestRate("")
      setStartDate(new Date().toISOString().slice(0, 10))
      setExpectedEndDate("")
      setNotes("")
    }
  }, [debt])

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!creditorName.trim() || totalAmount <= 0 || monthlyPayment <= 0) return

    const input = {
      creditor_name: creditorName.trim(),
      debt_type: debtType,
      total_amount: totalAmount,
      remaining_amount: remainingAmount || undefined,
      monthly_payment: monthlyPayment,
      interest_rate: interestRate ? Number(interestRate) : undefined,
      start_date: startDate || undefined,
      expected_end_date: expectedEndDate || undefined,
      notes: notes || undefined,
    }

    if (isEdit && debt) {
      updateMutation.mutate(
        { id: debt.id, ...input },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      createMutation.mutate(input, {
        onSuccess: () => onOpenChange(false),
      })
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{isEdit ? t("settings.debt.editTitle") : t("settings.debt.addTitle")}</SheetTitle>
          <SheetDescription>
            {isEdit ? t("settings.debt.editDesc") : t("settings.debt.addDesc")}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="debt-creditor" className="text-xs">
              {t("settings.debt.creditorLabel")}
            </Label>
            <Input
              id="debt-creditor"
              value={creditorName}
              onChange={(e) => setCreditorName(e.target.value)}
              placeholder={t("settings.debt.creditorPlaceholder")}
              className="rounded-xl bg-inset text-base"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="debt-type" className="text-xs">
              {t("settings.debt.typeLabel")}
            </Label>
            <Select
              value={debtType}
              onValueChange={(v) => setDebtType(v as DebtType)}
            >
              <SelectTrigger id="debt-type" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEBT_TYPE_VALUES.map((val) => (
                  <SelectItem key={val} value={val}>
                    {t(`settings.debt.type.${val}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="debt-total" className="text-xs">
                {t("settings.debt.totalLabel")}
              </Label>
              <CurrencyInput
                id="debt-total"
                value={totalAmount}
                onChange={setTotalAmount}
                className="rounded-xl bg-inset"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="debt-remaining" className="text-xs">
                {t("settings.debt.remainingLabel")}
              </Label>
              <CurrencyInput
                id="debt-remaining"
                value={remainingAmount}
                onChange={setRemainingAmount}
                className="rounded-xl bg-inset"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="debt-monthly" className="text-xs">
                {t("settings.debt.monthlyLabel")}
              </Label>
              <CurrencyInput
                id="debt-monthly"
                value={monthlyPayment}
                onChange={setMonthlyPayment}
                className="rounded-xl bg-inset"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="debt-rate" className="text-xs">
                {t("settings.debt.rateLabel")}
              </Label>
              <Input
                id="debt-rate"
                type="number"
                min={0}
                max={100}
                step={0.1}
                value={interestRate}
                onChange={(e) => setInterestRate(e.target.value)}
                placeholder="0"
                className="rounded-xl bg-inset font-mono text-base tabular-nums"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="debt-start" className="text-xs">
                {t("settings.debt.startDate")}
              </Label>
              <Input
                id="debt-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl bg-inset text-base"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="debt-end" className="text-xs">
                {t("settings.debt.endDate")}
              </Label>
              <Input
                id="debt-end"
                type="date"
                value={expectedEndDate}
                onChange={(e) => setExpectedEndDate(e.target.value)}
                className="rounded-xl bg-inset text-base"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="debt-notes" className="text-xs">
              {t("settings.debt.notesLabel")}
            </Label>
            <Input
              id="debt-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("common.optional")}
              className="rounded-xl bg-inset text-base"
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-xl"
            disabled={!creditorName.trim() || totalAmount <= 0 || monthlyPayment <= 0 || isPending}
          >
            {isPending && (
              <Icon icon="lucide:loader-2" className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            {isPending ? t("common.saving") : isEdit ? t("settings.categories.saveChanges") : t("settings.debt.addDebt")}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
