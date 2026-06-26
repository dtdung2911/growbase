"use client"

import { Icon } from "@iconify/react"
import { cn } from "@/lib/utils/cn"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { Account } from "@/types/app"

type AccountSettingsCardProps = {
  account: Account
  onEdit: () => void
  onDeactivate: () => void
}

export function AccountSettingsCard({
  account,
  onEdit,
  onDeactivate,
}: AccountSettingsCardProps) {
  const { t } = useTranslation()

  return (
    <div className={cn("rounded-[15px] border border-border bg-card p-4 shadow-panel", !account.is_active && "opacity-50")}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          {account.color && (
            <div
              className="mt-1 h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: account.color }}
            />
          )}
          <div className="space-y-1">
            <h4 className="text-sm font-semibold">{account.name}</h4>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary" className="text-[10px] font-normal">
                {t(`settings.accounts.type.${account.account_type}`)}
              </Badge>
              {account.is_credit_card && (
                <Badge
                  variant="secondary"
                  className="bg-orange-100 text-[10px] font-normal text-orange-700 dark:bg-orange-900 dark:text-orange-300"
                >
                  {t("settings.accounts.creditCardLabel")}
                </Badge>
              )}
            </div>
            {account.bank_name && (
              <p className="text-xs text-muted-foreground">{account.bank_name}</p>
            )}
          </div>
        </div>

        {account.is_active && (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="min-h-[44px] min-w-[44px]"
              onClick={onEdit}
            >
              <Icon icon="lucide:pencil" className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="min-h-[44px] min-w-[44px] text-destructive hover:text-destructive"
              onClick={onDeactivate}
            >
              <Icon icon="lucide:power" className="h-3.5 w-3.5" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
