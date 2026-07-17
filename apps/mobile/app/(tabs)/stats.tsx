import { Ionicons } from "@expo/vector-icons"
import { formatVND } from "@growbase/shared/rules/currency"
import { router } from "expo-router"
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { EmptyState } from "@/components/EmptyState"
import { Skeleton } from "@/components/Skeleton"
import { SpendingBar } from "@/features/stats/SpendingBar"
import { SpendingDonut } from "@/features/stats/SpendingDonut"
import { aggregateByCategory, aggregateByGroup, topNWithOther } from "@/features/stats/statsAggregate"
import { useCategories } from "@/features/stats/useCategories"
import { useDashboard } from "@/features/dashboard/useDashboard"
import { useTransactions } from "@/features/transactions/useTransactions"
import { useTranslation } from "@/lib/i18n/TranslationProvider"
import { useIsOnline } from "@/lib/network/useIsOnline"
import { useTheme } from "@/lib/theme/ThemeProvider"

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" })

function formatTime(ms: number): string {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export default function StatsScreen() {
  const { colors } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const isOnline = useIsOnline()

  const txQuery = useTransactions()
  const catQuery = useCategories()
  const dashQuery = useDashboard()

  const isPending = txQuery.isPending || catQuery.isPending || dashQuery.isPending
  const isPaused = txQuery.isPaused || catQuery.isPaused || dashQuery.isPaused
  const isRefetching = txQuery.isRefetching || catQuery.isRefetching || dashQuery.isRefetching
  const updatedAts = [txQuery.dataUpdatedAt, catQuery.dataUpdatedAt, dashQuery.dataUpdatedAt].filter((ms) => ms > 0)
  const dataUpdatedAt = updatedAts.length > 0 ? Math.min(...updatedAts) : 0
  const refetch = () => {
    txQuery.refetch()
    catQuery.refetch()
    dashQuery.refetch()
  }

  const transactions = txQuery.data
  const otherLabel = t("stats.uncategorized")
  const categorySlices = transactions
    ? topNWithOther(aggregateByCategory(transactions, otherLabel), 6, otherLabel)
    : []
  const groupSlices = transactions && catQuery.data ? aggregateByGroup(transactions, catQuery.data, otherLabel) : []
  const budgetLines = [...(dashQuery.data?.budgetLines ?? [])].sort(
    (a, b) => (Number.isFinite(b.usage_pct) ? b.usage_pct : 0) - (Number.isFinite(a.usage_pct) ? a.usage_pct : 0),
  )

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Text style={[styles.heading, { color: colors.textInk }]}>{t("nav.stats")}</Text>

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
          <Skeleton height={220} radius={18} />
          <Skeleton height={160} radius={18} />
          <Skeleton height={140} radius={18} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 88, flexGrow: 1 }]}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
        >
          {!transactions ? (
            <EmptyState icon={!isOnline ? "cloud-offline-outline" : "alert-circle-outline"} title={t("stats.loadError")} />
          ) : transactions.length === 0 ? (
            <EmptyState
              icon="stats-chart-outline"
              title={t("stats.empty.title")}
              message={t("stats.empty.message")}
              action={{ label: t("stats.empty.cta"), onPress: () => router.navigate("/quick-add") }}
            />
          ) : (
            <>
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textInk }]}>{t("stats.byCategory")}</Text>
                <SpendingDonut slices={categorySlices} />
              </View>

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textInk }]}>{t("stats.byGroup")}</Text>
                <SpendingBar slices={groupSlices} />
              </View>

              {budgetLines.length > 0 ? (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.textInk }]}>{t("stats.budget")}</Text>
                  {budgetLines.map((line) => {
                    const pct = Number.isFinite(line.usage_pct) ? line.usage_pct : 0
                    const usageColor = pct >= 100 ? colors.error : pct >= 80 ? colors.warning : colors.success
                    return (
                      <View
                        key={line.cost_type_id}
                        style={[styles.budgetCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                      >
                        <View style={styles.budgetHead}>
                          <Text style={[styles.budgetName, { color: colors.textInk }]} numberOfLines={1}>
                            {line.cost_type_name}
                          </Text>
                          <Text style={[styles.budgetPct, { color: usageColor }]}>
                            {Math.round(pct)}%
                          </Text>
                        </View>
                        <View style={styles.budgetMeta}>
                          <Text style={[styles.budgetAmount, { color: colors.textMuted }]}>
                            {formatVND(line.actual_amount)} / {formatVND(line.budget_amount)}
                          </Text>
                          <Text style={[styles.budgetAmount, { color: colors.textFaint }]}>
                            {t("stats.remaining")} {formatVND(line.remaining)}
                          </Text>
                        </View>
                        <View style={[styles.track, { backgroundColor: colors.border }]}>
                          <View
                            style={[
                              styles.fill,
                              { backgroundColor: usageColor, width: `${Math.max(0, Math.min(pct, 100))}%` },
                            ]}
                          />
                        </View>
                      </View>
                    )
                  })}
                </View>
              ) : null}
            </>
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heading: { fontSize: 24, fontWeight: "800", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
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
  body: { paddingHorizontal: 16, gap: 20 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  budgetCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 14, gap: 8 },
  budgetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  budgetName: { flex: 1, fontSize: 15, fontWeight: "700" },
  budgetPct: { fontSize: 14, fontWeight: "700", fontFamily: MONO, fontVariant: ["tabular-nums"] },
  budgetMeta: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 },
  budgetAmount: { fontSize: 13, fontFamily: MONO, fontVariant: ["tabular-nums"] },
  track: { height: 8, borderRadius: 4, overflow: "hidden" },
  fill: { height: 8, borderRadius: 4 },
})
