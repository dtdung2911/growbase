import { Ionicons } from "@expo/vector-icons"
import { formatVND } from "@growbase/shared/rules/currency"
import type { TransactionWithJoins } from "@growbase/shared/types/app"
import { useRef } from "react"
import { Platform, Pressable, StyleSheet, Text, View } from "react-native"
import { Swipeable } from "react-native-gesture-handler"
import { useTranslation } from "@/lib/i18n/TranslationProvider"
import { useTheme } from "@/lib/theme/ThemeProvider"
import { canModifyTransaction } from "@/features/transactions/canModifyTransaction"
import { useSyncStatus } from "@/lib/sync/useSyncStatus"

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" })

type TransactionRowProps = {
  transaction: TransactionWithJoins
  myMemberId: string | null
  currentMonth: string
  onEdit: (tx: TransactionWithJoins) => void
  onDelete: (tx: TransactionWithJoins) => void
}

export function TransactionRow({
  transaction: tx,
  myMemberId,
  currentMonth,
  onEdit,
  onDelete,
}: TransactionRowProps) {
  const { colors } = useTheme()
  const { t } = useTranslation()
  const swipeRef = useRef<Swipeable>(null)
  const { status: syncStatus, retry } = useSyncStatus(tx.id)

  const isIncome = tx.direction === "in"
  const categoryName = tx.category?.name ?? t("transactions.uncategorized")
  const categoryIcon = tx.category?.icon ?? "💰"
  const canModify = canModifyTransaction(tx, myMemberId, currentMonth)

  const content = (
    <View style={[styles.row, { backgroundColor: colors.card }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
        <Text style={styles.iconText}>{categoryIcon}</Text>
      </View>
      <View style={styles.middle}>
        <Text style={[styles.name, { color: colors.textInk }]} numberOfLines={1}>
          {categoryName}
        </Text>
        {tx.description ? (
          <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={1}>
            {tx.description}
          </Text>
        ) : null}
      </View>
      <View style={styles.right}>
        <Text style={[styles.amount, { color: isIncome ? colors.success : colors.error }]}>
          {isIncome ? "+" : "-"}
          {formatVND(tx.amount)}
        </Text>
        {syncStatus === "error" ? (
          <Pressable
            onPress={retry}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={`${t("sync.error")}. ${t("sync.retry")}`}
            style={[styles.chip, { borderColor: colors.error }]}
          >
            <Ionicons name="refresh" size={11} color={colors.error} />
            <Text style={[styles.chipText, { color: colors.error }]}>{t("sync.error")}</Text>
          </Pressable>
        ) : syncStatus ? (
          <View
            accessible
            accessibilityLabel={t(syncStatus === "synced" ? "sync.synced" : "sync.pending")}
            style={[
              styles.chip,
              { borderColor: syncStatus === "synced" ? colors.success : colors.textMuted },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: syncStatus === "synced" ? colors.success : colors.textMuted },
              ]}
            >
              {t(syncStatus === "synced" ? "sync.synced" : "sync.pending")}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  )

  if (!canModify) return content

  const renderRightActions = () => (
    <View style={styles.actions}>
      <Pressable
        style={[styles.action, { backgroundColor: colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel={t("transactions.action.edit")}
        onPress={() => {
          swipeRef.current?.close()
          onEdit(tx)
        }}
      >
        <Ionicons name="pencil" size={18} color={colors.onPrimary} />
        <Text style={[styles.actionLabel, { color: colors.onPrimary }]}>
          {t("transactions.action.edit")}
        </Text>
      </Pressable>
      <Pressable
        style={[styles.action, { backgroundColor: colors.error }]}
        accessibilityRole="button"
        accessibilityLabel={t("transactions.action.delete")}
        onPress={() => {
          swipeRef.current?.close()
          onDelete(tx)
        }}
      >
        <Ionicons name="trash" size={18} color="#ffffff" />
        <Text style={[styles.actionLabel, { color: "#ffffff" }]}>
          {t("transactions.action.delete")}
        </Text>
      </Pressable>
    </View>
  )

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false}>
      {content}
    </Swipeable>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 64,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: {
    fontSize: 20,
  },
  middle: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
  },
  desc: {
    fontSize: 13,
  },
  right: {
    alignItems: "flex-end",
    gap: 4,
  },
  amount: {
    fontSize: 15,
    fontWeight: "600",
    fontFamily: MONO,
    fontVariant: ["tabular-nums"],
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
  },
  action: {
    width: 76,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
})
