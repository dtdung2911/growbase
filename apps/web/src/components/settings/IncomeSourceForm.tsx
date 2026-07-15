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
import { CurrencyInput } from "@/components/ui/CurrencyInput"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  useCreateIncomeSource,
  useUpdateIncomeSource,
} from "@/lib/hooks/useIncomeSources"
import { useMembers } from "@/lib/hooks/useMembers"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { IncomeSource } from "@growbase/shared/types/app"

// Radix Select cấm value rỗng → sentinel cho "thu nhập chung / chưa gán".
const SHARED = "__shared__"

type IncomeSourceFormProps = {
  source?: IncomeSource | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function IncomeSourceForm({
  source,
  open,
  onOpenChange,
}: IncomeSourceFormProps) {
  const { t } = useTranslation()
  const isEdit = Boolean(source)
  const createMutation = useCreateIncomeSource()
  const updateMutation = useUpdateIncomeSource()
  const { data: membersData, isLoading: membersLoading } = useMembers()
  const members = membersData?.members ?? []

  const [sourceName, setSourceName] = useState("")
  const [monthlyAmount, setMonthlyAmount] = useState(0)
  const [memberId, setMemberId] = useState("")

  useEffect(() => {
    if (source) {
      setSourceName(source.source_name)
      setMonthlyAmount(source.monthly_amount)
      setMemberId(source.member_id ?? "")
    } else {
      setSourceName("")
      setMonthlyAmount(0)
      setMemberId("")
    }
  }, [source])

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (monthlyAmount <= 0) return

    if (isEdit && source) {
      updateMutation.mutate(
        { id: source.id, monthly_amount: monthlyAmount, member_id: memberId || null },
        { onSuccess: () => onOpenChange(false) }
      )
    } else {
      if (!sourceName.trim()) return
      createMutation.mutate(
        {
          source_name: sourceName.trim(),
          monthly_amount: monthlyAmount,
          member_id: memberId || undefined,
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
            {isEdit ? t("settings.income.editTitle") : t("settings.income.addTitle")}
          </SheetTitle>
          <SheetDescription>
            {isEdit ? t("settings.income.editDesc") : t("settings.income.addDesc")}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {isEdit ? (
            <div className="space-y-1.5">
              <Label className="text-xs">{t("settings.income.sourceLabel")}</Label>
              <p className="text-sm font-semibold">{source?.source_name}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="inc-name" className="text-xs">
                {t("settings.income.sourceNameLabel")}
              </Label>
              <Input
                id="inc-name"
                value={sourceName}
                onChange={(e) => setSourceName(e.target.value)}
                placeholder={t("settings.income.sourceNamePlaceholder")}
                className="rounded-xl bg-inset text-base"
                autoFocus
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="inc-amount" className="text-xs">
              {t("settings.income.monthlyAmountLabel")}
            </Label>
            <CurrencyInput
              id="inc-amount"
              value={monthlyAmount}
              onChange={setMonthlyAmount}
              className="rounded-xl bg-inset"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="inc-member" className="text-xs">
              {t("settings.income.memberLabel")}
            </Label>
            <Select
              value={memberId === "" ? SHARED : memberId}
              onValueChange={(v) => setMemberId(v === SHARED ? "" : v)}
              disabled={membersLoading}
            >
              <SelectTrigger id="inc-member" className="rounded-xl bg-inset">
                <SelectValue placeholder={t("settings.income.memberPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SHARED}>{t("settings.income.shared")}</SelectItem>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.display_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isEdit && (
            <p className="text-xs text-muted-foreground">
              {t("settings.income.editNote")}
            </p>
          )}

          <Button
            type="submit"
            className="w-full rounded-xl"
            disabled={
              monthlyAmount <= 0 ||
              (!isEdit && !sourceName.trim()) ||
              isPending
            }
          >
            {isPending && (
              <Icon icon="lucide:loader-2" className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            {isPending
              ? t("common.saving")
              : isEdit
                ? t("settings.income.updateIncome")
                : t("settings.income.addSource")}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
