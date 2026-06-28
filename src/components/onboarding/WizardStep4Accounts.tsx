"use client"

import { Icon } from "@iconify/react"
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
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { useWizardStore } from "@/lib/stores/wizardStore"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { AccountDraft, AccountType } from "@/types/app"

const ACCOUNT_TYPE_KEYS: { value: AccountType; key: string }[] = [
  { value: "bank", key: "setup.accountType.bank" },
  { value: "cash", key: "setup.accountType.cash" },
  { value: "savings", key: "setup.accountType.savings" },
  { value: "credit_card", key: "setup.accountType.credit_card" },
  { value: "investment", key: "setup.accountType.investment" },
  { value: "precious_metal", key: "setup.accountType.precious_metal" },
]

export function WizardStep4Accounts() {
  const { t } = useTranslation()
  const accounts = useWizardStore((s) => s.accounts)
  const setAccounts = useWizardStore((s) => s.setAccounts)

  const update = (index: number, patch: Partial<AccountDraft>) => {
    setAccounts(accounts.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  }

  const add = () => {
    setAccounts([
      ...accounts,
      {
        id: crypto.randomUUID(),
        name: "",
        accountType: "bank",
        isCreditCard: false,
      },
    ])
  }

  const remove = (index: number) => {
    setAccounts(accounts.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">{t("setup.step4Title")}</h2>

      {accounts.length === 0 ? (
        <div className="rounded-[13px] border border-border/40 bg-card p-6 text-center shadow-card">
          <p className="text-sm text-muted-foreground">{t("setup.emptyAccount")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account, i) => (
            <div
              key={account.id}
              className="space-y-3 rounded-[13px] border border-border/40 bg-card p-4 shadow-card"
            >
              <div className="flex items-center justify-between">
                <Label>{t("setup.account", { index: i + 1 })}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => remove(i)}
                >
                  <Icon icon="lucide:x" className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={account.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder={t("setup.accountNamePlaceholder")}
              />
              <Input
                value={account.bankName ?? ""}
                onChange={(e) => update(i, { bankName: e.target.value })}
                placeholder={t("setup.bankNamePlaceholder")}
              />
              <Select
                value={account.accountType}
                onValueChange={(v) =>
                  update(i, { accountType: v as AccountType })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPE_KEYS.map((at) => (
                    <SelectItem key={at.value} value={at.value}>
                      {t(at.key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center justify-between">
                <Label htmlFor={`cc-${i}`}>{t("setup.isCreditCard")}</Label>
                <Switch
                  id={`cc-${i}`}
                  checked={account.isCreditCard}
                  onCheckedChange={(v) => update(i, { isCreditCard: v })}
                />
              </div>
              {account.isCreditCard && (
                <Badge variant="info">
                  {t("setup.creditCardNote")}
                </Badge>
              )}
            </div>
          ))}
        </div>
      )}

      <Button type="button" variant="outline" onClick={add} className="w-full">
        <Icon icon="lucide:plus" className="h-4 w-4" />
        {t("setup.addAccount")}
      </Button>
    </div>
  )
}
