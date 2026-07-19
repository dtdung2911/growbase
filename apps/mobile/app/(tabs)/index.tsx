import { Ionicons } from "@expo/vector-icons"
import { formatVND } from "@growbase/shared/rules/currency"
import type { TransactionWithJoins } from "@growbase/shared/types/app"
import { router } from "expo-router"
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { EmptyState } from "@/components/EmptyState"
import { Skeleton, TransactionRowSkeleton } from "@/components/Skeleton"
import { getBudgetUsage, getDailyAllowance } from "@/features/dashboard/homeGlance"
import { useDashboard } from "@/features/dashboard/useDashboard"
import { useTranslation } from "@/lib/i18n/TranslationProvider"
import { useIsOnline } from "@/lib/network/useIsOnline"
import { useTheme } from "@/lib/theme/ThemeProvider"
import { useAppStore } from "@/store/appStore"

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" })

function formatTime(ms: number): string {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

function RecentRow({ tx }: { tx: TransactionWithJoins }) {
  const { colors } = useTheme()
  const { t } = useTranslation()
  const isIncome = tx.direction === "in"
  return (
    <View style={[styles.recentRow, { backgroundColor: colors.card }]}>
      <View style={[styles.iconCircle, { backgroundColor: colors.primarySoft }]}>
        <Text style={styles.iconText}>{tx.category?.icon ?? "💰"}</Text>
      </View>
      <View style={styles.recentMiddle}>
        <Text style={[styles.recentName, { color: colors.textInk }]} numberOfLines={1}>
          {tx.category?.name ?? t("transactions.uncategorized")}
        </Text>
        {tx.description ? (
          <Text style={[styles.recentDesc, { color: colors.textMuted }]} numberOfLines={1}>
            {tx.description}
          </Text>
        ) : null}
      </View>
      <Text style={[styles.amount, { color: isIncome ? colors.success : colors.error }]}>
        {isIncome ? "+" : "-"}
        {formatVND(tx.amount)}
      </Text>
    </View>
  )
}

export default function HomeScreen() {
  const { colors } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const isOnline = useIsOnline()
  const currentMonth = useAppStore((s) => s.currentMonth)

  const { data, isPending, isPaused, dataUpdatedAt, refetch, isRefetching } = useDashboard()

  const daily = data ? getDailyAllowance(data.budgetLines, currentMonth) : null
  const usage = data ? getBudgetUsage(data.totalExpense, data.budgetLines) : null
  const usagePct = usage?.usagePct ?? null
  const usageColor =
    usagePct == null
      ? colors.textMuted
      : usage?.over
        ? colors.error
        : usagePct >= 80
          ? colors.warning
          : colors.success

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Text style={[styles.heading, { color: colors.textInk }]}>{t("nav.home")}</Text>

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

      {isPending && !isPaused ? (
        <View style={styles.body}>
          <Skeleton height={120} radius={18} />
          <Skeleton height={120} radius={18} />
          {Array.from({ length: 4 }).map((_, i) => (
            <TransactionRowSkeleton key={i} />
          ))}
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 88, flexGrow: 1 }]}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
        >
          {!data ? (
            <EmptyState icon="cloud-offline-outline" title={t("home.loadError")} />
          ) : !data.hasAnyTransactionEver ? (
            <EmptyState
              icon="receipt-outline"
              title={t("home.empty.title")}
              message={t("home.empty.message")}
              action={{ label: t("home.empty.cta"), onPress: () => router.navigate("/quick-add") }}
            />
          ) : (
            <>
              {daily ? (
                <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                    {t("home.dailyAllowance.title")}
                  </Text>
                  <Text
                    style={[styles.statAmount, { color: daily.overspent ? colors.error : colors.textInk }]}
                  >
                    {formatVND(daily.amount)}
                  </Text>
                  <Text style={[styles.statCaption, { color: colors.textFaint }]}>
                    {t("home.dailyAllowance.caption")}
                  </Text>
                </View>
              ) : null}

              <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                  {t("home.monthSpend.title")}
                </Text>
                <Text style={[styles.statAmount, { color: colors.textInk }]}>
                  {formatVND(data.totalExpense)}
                </Text>
                {usage && usage.totalBudget > 0 ? (
                  <>
                    <View style={styles.budgetMeta}>
                      <Text style={[styles.budgetPct, { color: usageColor }]}>
                        {t("home.monthSpend.ofBudget").replace("{pct}", String(usagePct))}
                      </Text>
                      <Text style={[styles.budgetTotal, { color: colors.textMuted }]}>
                        {t("home.monthSpend.budgetLabel")} {formatVND(usage.totalBudget)}
                      </Text>
                    </View>
                    <View style={[styles.track, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.fill,
                          { backgroundColor: usageColor, width: `${Math.min(usagePct ?? 0, 100)}%` },
                        ]}
                      />
                    </View>
                  </>
                ) : null}
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textInk }]}>
                  {t("home.recent.title")}
                </Text>
                {data.recentTransactions.length > 0 ? (
                  data.recentTransactions.slice(0, 5).map((tx) => <RecentRow key={tx.id} tx={tx} />)
                ) : (
                  <Text style={[styles.recentEmpty, { color: colors.textMuted }]}>
                    {t("home.recentEmpty")}
                  </Text>
                )}
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  bannerText: { flex: 1, fontSize: 13, fontWeight: "600" },
  cachedAs: { paddingHorizontal: 16, paddingBottom: 8, fontSize: 12 },
  body: { paddingHorizontal: 16, gap: 16 },
  statCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 18,
    gap: 6,
  },
  statLabel: { fontSize: 13, fontWeight: "600" },
  statAmount: { fontSize: 30, fontWeight: "800", fontFamily: MONO, fontVariant: ["tabular-nums"] },
  statCaption: { fontSize: 12 },
  budgetMeta: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginTop: 2,
  },
  budgetPct: { fontSize: 14, fontWeight: "700" },
  budgetTotal: { fontSize: 13, fontFamily: MONO, fontVariant: ["tabular-nums"] },
  track: { height: 8, borderRadius: 4, overflow: "hidden", marginTop: 8 },
  fill: { height: 8, borderRadius: 4 },
  section: { gap: 4 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  recentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    minHeight: 64,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  iconText: { fontSize: 20 },
  recentMiddle: { flex: 1, gap: 2 },
  recentName: { fontSize: 15, fontWeight: "700" },
  recentDesc: { fontSize: 13 },
  amount: { fontSize: 15, fontWeight: "600", fontFamily: MONO, fontVariant: ["tabular-nums"] },
  recentEmpty: { fontSize: 14, paddingVertical: 8 },
})
