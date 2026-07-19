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
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useCreateAccount, useUpdateAccount } from "@/lib/hooks/useAccountMutations"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { Account, AccountType } from "@growbase/shared/types/app"
import { BRAND } from "@/lib/design-tokens"

const ACCOUNT_TYPE_VALUES: AccountType[] = [
  "bank",
  "cash",
  "savings",
  "credit_card",
  "investment",
  "precious_metal",
]

type AccountEditFormProps = {
  account?: Account | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AccountEditForm({ account, open, onOpenChange }: AccountEditFormProps) {
  const { t } = useTranslation()
  const isCreate = !account
  const createMutation = useCreateAccount()
  const updateMutation = useUpdateAccount()

  const [name, setName] = useState("")
  const [bankName, setBankName] = useState("")
  const [accountType, setAccountType] = useState<AccountType>("bank")
  const [ownerName, setOwnerName] = useState("")
  const [isCreditCard, setIsCreditCard] = useState(false)
  const [color, setColor] = useState("")

  useEffect(() => {
    if (!account) {
      setName("")
      setBankName("")
      setAccountType("bank")
      setOwnerName("")
      setIsCreditCard(false)
      setColor("")
      return
    }
    setName(account.name)
    setBankName(account.bank_name ?? "")
    setAccountType(account.account_type)
    setOwnerName(account.owner_name ?? "")
    setIsCreditCard(account.is_credit_card)
    setColor(account.color ?? "")
  }, [account])

  const isPending = createMutation.isPending || updateMutation.isPending

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const input = {
      name: name.trim(),
      bank_name: bankName || undefined,
      account_type: accountType,
      owner_name: ownerName || undefined,
      is_credit_card: isCreditCard,
      color: color || undefined,
    }
    const close = { onSuccess: () => onOpenChange(false) }

    if (isCreate) {
      createMutation.mutate(input, close)
    } else {
      updateMutation.mutate({ id: account.id, ...input }, close)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>
            {t(isCreate ? "settings.accounts.addTitle" : "settings.accounts.editTitle")}
          </SheetTitle>
          <SheetDescription>
            {t(isCreate ? "settings.accounts.addDesc" : "settings.accounts.editDesc")}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="acc-name" className="text-xs">
              {t("settings.accounts.nameLabel")}
            </Label>
            <Input
              id="acc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl bg-inset text-base"
              autoFocus
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="acc-bank" className="text-xs">
              {t("settings.accounts.bankLabel")}
            </Label>
            <Input
              id="acc-bank"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder={t("settings.accounts.bankPlaceholder")}
              className="rounded-xl bg-inset text-base"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="acc-type" className="text-xs">
              {t("settings.accounts.typeLabel")}
            </Label>
            <Select
              value={accountType}
              onValueChange={(v) => setAccountType(v as AccountType)}
            >
              <SelectTrigger id="acc-type" className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPE_VALUES.map((val) => (
                  <SelectItem key={val} value={val}>
                    {t(`settings.accounts.type.${val}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="acc-owner" className="text-xs">
              {t("settings.accounts.ownerLabel")}
            </Label>
            <Input
              id="acc-owner"
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder={t("common.optional")}
              className="rounded-xl bg-inset text-base"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="acc-credit" className="text-xs">
              {t("settings.accounts.creditCardLabel")}
            </Label>
            <Switch
              id="acc-credit"
              checked={isCreditCard}
              onCheckedChange={setIsCreditCard}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="acc-color" className="text-xs">
              {t("settings.accounts.colorLabel")}
            </Label>
            <Input
              id="acc-color"
              type="color"
              value={color || BRAND.primary}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-16 rounded-xl border p-1"
            />
          </div>

          <Button
            type="submit"
            className="w-full rounded-xl"
            disabled={!name.trim() || isPending}
          >
            {isPending && (
              <Icon icon="lucide:loader-2" className="mr-1.5 h-4 w-4 animate-spin" />
            )}
            {isPending
              ? t("common.saving")
              : t(isCreate ? "settings.accounts.addLabel" : "settings.categories.saveChanges")}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
