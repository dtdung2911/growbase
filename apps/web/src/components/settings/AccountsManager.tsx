"use client"

import { useState } from "react"
import { SkeletonList } from "@/components/shared/SkeletonList"
import { EmptyState } from "@/components/shared/EmptyState"
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"
import { AccountSettingsCard } from "@/components/settings/AccountSettingsCard"
import { AccountEditForm } from "@/components/settings/AccountEditForm"
import { useAccounts } from "@/lib/hooks/useAccounts"
import { useSoftDeleteAccount } from "@/lib/hooks/useAccountMutations"
import { useTranslation } from "@/lib/i18n/useTranslation"
import type { Account } from "@growbase/shared/types/app"

export function AccountsManager() {
  const { t } = useTranslation()
  const { data: accounts, isLoading } = useAccounts()
  const deactivateMutation = useSoftDeleteAccount()

  const [editingAccount, setEditingAccount] = useState<Account | null>(null)
  const [deactivateTarget, setDeactivateTarget] = useState<Account | null>(null)

  if (isLoading) {
    return <SkeletonList count={3} />
  }

  if (!accounts || accounts.length === 0) {
    return (
      <EmptyState
        icon="lucide:wallet"
        title={t("settings.accounts.empty")}
        description={t("settings.accounts.emptyDesc")}
      />
    )
  }

  return (
    <>
      <p className="text-xs text-muted-foreground">
        {t("settings.accounts.adminNote")}
      </p>

      <div className="space-y-3">
        {accounts.map((acc) => (
          <AccountSettingsCard
            key={acc.id}
            account={acc}
            onEdit={() => setEditingAccount(acc)}
            onDeactivate={() => setDeactivateTarget(acc)}
          />
        ))}
      </div>

      {editingAccount && (
        <AccountEditForm
          account={editingAccount}
          open={editingAccount !== null}
          onOpenChange={(open) => {
            if (!open) setEditingAccount(null)
          }}
        />
      )}

      <ConfirmDialog
        open={deactivateTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeactivateTarget(null)
        }}
        title={t("settings.accounts.hideTitle")}
        description={t("settings.accounts.hideDesc", { name: deactivateTarget?.name ?? "" })}
        confirmLabel={t("settings.accounts.hideLabel")}
        onConfirm={() => {
          if (deactivateTarget) {
            deactivateMutation.mutate(deactivateTarget.id, {
              onSuccess: () => setDeactivateTarget(null),
            })
          }
        }}
        isPending={deactivateMutation.isPending}
      />
    </>
  )
}
