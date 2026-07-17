import { Ionicons } from "@expo/vector-icons"
import { formatVND } from "@growbase/shared/rules/currency"
import { FUND_TYPE_CONFIG } from "@growbase/shared/types/app"
import { router } from "expo-router"
import { Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { EmptyState } from "@/components/EmptyState"
import { Skeleton } from "@/components/Skeleton"
import { deriveFundStatus, fundIconFor, groupFunds } from "@/features/funds/fundsGroup"
import { useFunds } from "@/features/funds/useFunds"
import { useTranslation } from "@/lib/i18n/TranslationProvider"
import { useIsOnline } from "@/lib/network/useIsOnline"
import { useTheme } from "@/lib/theme/ThemeProvider"

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" })

function formatTime(ms: number): string {
  const d = new Date(ms)
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
}

export default function FundsScreen() {
  const { colors } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  const isOnline = useIsOnline()
  const query = useFunds()

  const funds = query.data
  const groups = funds ? groupFunds(funds) : []

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" hitSlop={8} style={styles.back}>
          <Ionicons name="chevron-back" size={26} color={colors.textInk} />
        </Pressable>
        <Text style={[styles.heading, { color: colors.textInk }]}>{t("funds.title")}</Text>
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
          <Skeleton height={120} radius={18} />
          <Skeleton height={120} radius={18} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 24, flexGrow: 1 }]}
          refreshControl={
            <RefreshControl refreshing={query.isRefetching} onRefresh={() => { query.refetch() }} tintColor={colors.primary} />
          }
        >
          {!funds ? (
            <EmptyState icon={!isOnline ? "cloud-offline-outline" : "alert-circle-outline"} title={t("funds.loadError")} />
          ) : groups.length === 0 ? (
            <EmptyState icon="wallet-outline" title={t("funds.empty.title")} message={t("funds.empty.message")} />
          ) : (
            groups.map((group) => {
              const config = FUND_TYPE_CONFIG[group.type]
              return (
                <View key={group.type} style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: config.color }]}>{t(`funds.group.${group.type}`)}</Text>
                  {group.funds.map((fund) => {
                    const status = deriveFundStatus(fund)
                    return (
                      <View
                        key={fund.id}
                        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
                      >
                        <View style={styles.cardHead}>
                          <View style={[styles.icon, { backgroundColor: `${config.color}22` }]}>
                            <Ionicons name={fundIconFor(group.type)} size={18} color={config.color} />
                          </View>
                          <Text style={[styles.name, { color: colors.textInk }]} numberOfLines={1}>
                            {fund.name}
                          </Text>
                          <Text style={[styles.balance, { color: colors.textInk }]}>
                            {formatVND(fund.current_balance)}
                          </Text>
                        </View>
                        {status.progressPct != null ? (
                          <>
                            <View style={styles.metaRow}>
                              <Text style={[styles.meta, { color: colors.textMuted }]}>
                                {t("funds.of")
                                  .replace("{current}", formatVND(fund.current_balance))
                                  .replace("{target}", formatVND(status.targetAmount ?? 0))}
                              </Text>
                              <Text style={[styles.pct, { color: config.color }]}>{Math.round(status.progressPct)}%</Text>
                            </View>
                            <View style={[styles.track, { backgroundColor: colors.border }]}>
                              <View
                                style={[styles.fill, { backgroundColor: config.color, width: `${status.progressPct}%` }]}
                              />
                            </View>
                          </>
                        ) : null}
                      </View>
                    )
                  })}
                </View>
              )
            })
          )}
        </ScrollView>
      )}
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
  body: { paddingHorizontal: 16, gap: 20 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: "700" },
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 14, gap: 8 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  icon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  name: { flex: 1, fontSize: 15, fontWeight: "700" },
  balance: { fontSize: 15, fontWeight: "700", fontFamily: MONO, fontVariant: ["tabular-nums"] },
  metaRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 8 },
  meta: { fontSize: 13, fontFamily: MONO, fontVariant: ["tabular-nums"] },
  pct: { fontSize: 13, fontWeight: "700", fontFamily: MONO, fontVariant: ["tabular-nums"] },
  track: { height: 8, borderRadius: 4, overflow: "hidden" },
  fill: { height: 8, borderRadius: 4 },
})
