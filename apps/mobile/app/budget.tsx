import { Ionicons } from "@expo/vector-icons"
import { formatVND, formatVNDCompact } from "@growbase/shared/rules/currency"
import { router } from "expo-router"
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { EmptyState } from "@/components/EmptyState"
import { Skeleton } from "@/components/Skeleton"
import { type BudgetGroup, type BudgetLineStatus, budgetLineStatus, clampPct, groupBudgetLines } from "@/features/budget/budgetGroup"
import { useBudget } from "@/features/budget/useBudget"
import { useTheme } from "@/lib/theme/ThemeProvider"
import { useTranslation } from "@/lib/i18n/TranslationProvider"
import { useIsOnline } from "@/lib/network/useIsOnline"

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" })

function formatTime(ms: number): string {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export default function BudgetScreen() {
  const { colors } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const isOnline = useIsOnline()
  const query = useBudget()

  const lines = query.data
  const groups = lines ? groupBudgetLines(lines) : []
  const totalBudget = groups.reduce((s, g) => s + g.budgetAmount, 0)
  const totalActual = groups.reduce((s, g) => s + g.actualAmount, 0)
  const totalRemaining = totalBudget - totalActual
  const totalUsage = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0

  const statusColor = (status: BudgetLineStatus): string =>
    status === "over" ? colors.error : status === "warning" ? colors.warning : colors.success

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={8} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={colors.textInk} />
        </Pressable>
        <Text style={[styles.heading, { color: colors.textInk }]}>{t("budget.title")}</Text>
      </View>

      {!isOnline ? (
        <View style={[styles.banner, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name="cloud-offline-outline" size={16} color={colors.primary} />
          <Text style={[styles.bannerText, { color: colors.primary }]}>{t("offline.banner")}</Text>
        </View>
      ) : null}

      {!isOnline && query.dataUpdatedAt > 0 ? (
        <Text style={[styles.cachedAs, { color: colors.textMuted }]}>
          {t("offline.dataAsOf").replace("{time}", formatTime(query.dataUpdatedAt))}
        </Text>
      ) : null}

      {query.isPending && !query.isPaused ? (
        <View style={styles.body}>
          <Skeleton height={120} radius={18} />
          <Skeleton height={160} radius={18} />
          <Skeleton height={160} radius={18} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24, flexGrow: 1 }]}
          refreshControl={
            <RefreshControl refreshing={query.isRefetching} onRefresh={() => { query.refetch() }} tintColor={colors.primary} />
          }
        >
          {!lines ? (
            <EmptyState icon={!isOnline ? "cloud-offline-outline" : "alert-circle-outline"} title={t("budget.loadError")} />
          ) : groups.length === 0 ? (
            <EmptyState icon="pie-chart-outline" title={t("budget.empty.title")} message={t("budget.empty.message")} />
          ) : (
            <>
              <SummaryCard
                colors={colors}
                budget={totalBudget}
                actual={totalActual}
                remaining={totalRemaining}
                usagePct={totalUsage}
                color={statusColor(budgetLineStatus(totalUsage))}
                labels={{
                  allocated: t("budget.allocated"),
                  spent: t("budget.spent"),
                  remaining: t("budget.remaining"),
                }}
              />
              {groups.map((group) => (
                <GroupCard
                  key={group.key}
                  group={group}
                  colors={colors}
                  title={t(`budget.group.${group.key}`)}
                  color={statusColor(budgetLineStatus(group.usagePct))}
                  statusColor={statusColor}
                  usageLabel={t("budget.usage")}
                />
              ))}
            </>
          )}
        </ScrollView>
      )}
    </View>
  )
}

type Colors = ReturnType<typeof useTheme>["colors"]

function SummaryCard({
  colors,
  budget,
  actual,
  remaining,
  usagePct,
  color,
  labels,
}: {
  colors: Colors
  budget: number
  actual: number
  remaining: number
  usagePct: number
  color: string
  labels: { allocated: string; spent: string; remaining: string }
}) {
  return (
    <View style={[styles.summary, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.summaryRow}>
        <SummaryStat label={labels.allocated} value={budget} colors={colors} />
        <SummaryStat label={labels.spent} value={actual} colors={colors} />
        <SummaryStat label={labels.remaining} value={remaining} colors={colors} />
      </View>
      <View style={styles.summaryBarRow}>
        <View style={[styles.track, { backgroundColor: colors.border, flex: 1 }]}>
          <View style={[styles.fill, { backgroundColor: color, width: `${clampPct(usagePct)}%` }]} />
        </View>
        <Text style={[styles.pct, { color }]}>{Math.round(usagePct)}%</Text>
      </View>
    </View>
  )
}

function SummaryStat({ label, value, colors }: { label: string; value: number; colors: Colors }) {
  return (
    <View style={styles.summaryStat}>
      <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: colors.textInk }]} numberOfLines={1}>
        {formatVNDCompact(value)}
      </Text>
    </View>
  )
}

function GroupCard({
  group,
  colors,
  title,
  color,
  statusColor,
  usageLabel,
}: {
  group: BudgetGroup
  colors: Colors
  title: string
  color: string
  statusColor: (status: BudgetLineStatus) => string
  usageLabel: string
}) {
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.groupHead}>
        <Text style={[styles.groupTitle, { color: colors.textInk }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[styles.groupPct, { color }]}>{Math.round(group.usagePct)}%</Text>
      </View>
      <Text style={[styles.groupMeta, { color: colors.textMuted }]}>
        {formatVND(group.actualAmount)} / {formatVND(group.budgetAmount)}
      </Text>

      {group.lines.map((line) => {
        const pct = Number.isFinite(line.usage_pct) ? line.usage_pct : 0
        const lineColor = statusColor(budgetLineStatus(pct))
        return (
          <View key={line.cost_type_id} style={styles.line}>
            <View style={styles.lineHead}>
              <Text style={[styles.lineName, { color: colors.textInk }]} numberOfLines={1}>
                {line.cost_type_name}
              </Text>
              <Text style={[styles.linePct, { color: lineColor }]}>{Math.round(pct)}%</Text>
            </View>
            <View style={styles.lineMeta}>
              <Text style={[styles.lineAmount, { color: colors.textMuted }]}>
                {formatVND(line.actual_amount)} / {formatVND(line.budget_amount)}
              </Text>
              <Text style={[styles.lineAmount, { color: colors.textFaint }]}>{formatVND(line.remaining)}</Text>
            </View>
            <View style={[styles.track, { backgroundColor: colors.border }]}>
              <View style={[styles.fill, { backgroundColor: lineColor, width: `${clampPct(pct)}%` }]} />
            </View>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12 },
  back: { minHeight: 44, minWidth: 44, alignItems: "center", justifyContent: "center" },
  heading: { fontSize: 24, fontWeight: "800" },
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
  summary: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 16, gap: 14 },
  summaryRow: { flexDirection: "row", gap: 12 },
  summaryStat: { flex: 1, gap: 4 },
  summaryLabel: { fontSize: 12, fontWeight: "600" },
  summaryValue: { fontSize: 15, fontWeight: "800", fontFamily: MONO, fontVariant: ["tabular-nums"] },
  summaryBarRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 14, gap: 10 },
  groupHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 },
  groupTitle: { flex: 1, fontSize: 16, fontWeight: "700" },
  groupPct: { fontSize: 14, fontWeight: "700", fontFamily: MONO, fontVariant: ["tabular-nums"] },
  groupMeta: { fontSize: 13, fontFamily: MONO, fontVariant: ["tabular-nums"] },
  line: { gap: 6, marginTop: 4 },
  lineHead: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 },
  lineName: { flex: 1, fontSize: 14, fontWeight: "600" },
  linePct: { fontSize: 13, fontWeight: "700", fontFamily: MONO, fontVariant: ["tabular-nums"] },
  lineMeta: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 },
  lineAmount: { fontSize: 12, fontFamily: MONO, fontVariant: ["tabular-nums"] },
  track: { height: 8, borderRadius: 4, overflow: "hidden" },
  fill: { height: 8, borderRadius: 4 },
  pct: { fontSize: 13, fontWeight: "700", fontFamily: MONO, fontVariant: ["tabular-nums"] },
})
