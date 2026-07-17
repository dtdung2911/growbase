import { Ionicons } from "@expo/vector-icons"
import type { UpdateTransactionInput } from "@growbase/shared/schemas/transaction"
import type { TransactionWithJoins } from "@growbase/shared/types/app"
import { useState } from "react"
import { FlatList, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"
import { ApiError } from "@/api/client"
import { EmptyState } from "@/components/EmptyState"
import { TransactionRowSkeleton } from "@/components/Skeleton"
import { DeleteConfirmSheet } from "@/features/transactions/DeleteConfirmSheet"
import { TransactionEditSheet } from "@/features/transactions/TransactionEditSheet"
import { TransactionRow } from "@/features/transactions/TransactionRow"
import { useDeleteTransaction } from "@/features/transactions/useDeleteTransaction"
import { useMyMemberId } from "@/features/transactions/useMyMemberId"
import { useTransactions } from "@/features/transactions/useTransactions"
import { useUpdateTransaction } from "@/features/transactions/useUpdateTransaction"
import { useTranslation } from "@/lib/i18n/TranslationProvider"
import { useIsOnline } from "@/lib/network/useIsOnline"
import { useTheme } from "@/lib/theme/ThemeProvider"
import { useAppStore } from "@/store/appStore"

function formatTime(ms: number): string {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export default function TransactionsScreen() {
  const { colors } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const currentMonth = useAppStore((s) => s.currentMonth)
  const isOnline = useIsOnline()

  const { data: transactions, isPending, isError, dataUpdatedAt } = useTransactions()
  const { data: myMemberId = null } = useMyMemberId()
  const updateMutation = useUpdateTransaction()
  const deleteMutation = useDeleteTransaction()

  const [editingTx, setEditingTx] = useState<TransactionWithJoins | null>(null)
  const [deletingTx, setDeletingTx] = useState<TransactionWithJoins | null>(null)

  const showError = (error: unknown) => {
    Toast.show({
      type: "error",
      text1: error instanceof ApiError ? error.message : t("transactions.error.generic"),
      visibilityTime: 5000,
    })
  }

  const handleSave = (values: UpdateTransactionInput) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        setEditingTx(null)
        Toast.show({ type: "success", text1: t("transactions.edit.success"), visibilityTime: 2000 })
      },
      onError: showError,
    })
  }

  const handleDelete = () => {
    if (!deletingTx) return
    deleteMutation.mutate(deletingTx.id, {
      onSuccess: () => {
        setDeletingTx(null)
        Toast.show({ type: "success", text1: t("transactions.delete.success"), visibilityTime: 2000 })
      },
      onError: (error) => {
        setDeletingTx(null)
        showError(error)
      },
    })
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Text style={[styles.heading, { color: colors.textInk }]}>{t("nav.transactions")}</Text>

      {!isOnline ? (
        <View style={[styles.banner, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="cloud-offline-outline" size={16} color={colors.primary} />
          <Text style={[styles.bannerText, { color: colors.primary }]}>{t("offline.banner")}</Text>
        </View>
      ) : null}

      {!isOnline && dataUpdatedAt > 0 ? (
        <Text style={[styles.cachedAs, { color: colors.textMuted }]}>
          {t("offline.dataAsOf").replace("{time}", formatTime(dataUpdatedAt))}
        </Text>
      ) : null}

      {isPending ? (
        <View>
          {Array.from({ length: 6 }).map((_, i) => (
            <TransactionRowSkeleton key={i} />
          ))}
        </View>
      ) : isError ? (
        <EmptyState icon="cloud-offline-outline" title={t("transactions.loadError")} />
      ) : !transactions || transactions.length === 0 ? (
        <EmptyState
          title={t("transactions.empty.title")}
          message={t("transactions.empty.message")}
        />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(tx) => tx.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 88 }}
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
          )}
          renderItem={({ item }) => (
            <TransactionRow
              transaction={item}
              myMemberId={myMemberId}
              currentMonth={currentMonth}
              onEdit={setEditingTx}
              onDelete={setDeletingTx}
            />
          )}
        />
      )}

      <TransactionEditSheet
        transaction={editingTx}
        isPending={updateMutation.isPending}
        onSubmit={handleSave}
        onClose={() => setEditingTx(null)}
      />
      <DeleteConfirmSheet
        visible={!!deletingTx}
        isPending={deleteMutation.isPending}
        onConfirm={handleDelete}
        onCancel={() => setDeletingTx(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heading: {
    fontSize: 24,
    fontWeight: "800",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bannerText: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
  },
  cachedAs: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    fontSize: 12,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 72,
  },
})
