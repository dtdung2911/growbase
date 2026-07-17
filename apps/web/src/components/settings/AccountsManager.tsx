"use client"

import { useState } from "react"
import { Icon } from "@iconify/react"
import { Button } from "@/components/ui/button"
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
  const [isCreating, setIsCreating] = useState(false)

  if (isLoading) {
    return <SkeletonList count={3} />
  }

  const isEmpty = !accounts || accounts.length === 0

  return (
    <>
      <Button
        className="w-full rounded-full"
        onClick={() => setIsCreating(true)}
      >
        <Icon icon="lucide:plus" className="mr-1.5 h-4 w-4" />
        {t("settings.accounts.addLabel")}
      </Button>

      {isEmpty ? (
        <EmptyState
          icon="lucide:wallet"
          title={t("settings.accounts.empty")}
          description={t("settings.accounts.emptyDesc")}
        />
      ) : (
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
      )}

      {isCreating && (
        <AccountEditForm
          open={isCreating}
          onOpenChange={setIsCreating}
        />
      )}

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
