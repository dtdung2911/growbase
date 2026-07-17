import { formatVNDCompact } from "@growbase/shared/rules/currency"
import { Platform, StyleSheet, Text, View } from "react-native"
import { PieChart } from "react-native-gifted-charts"
import { useTranslation } from "@/lib/i18n/TranslationProvider"
import { chartPalette } from "@/lib/theme/chartPalette"
import { useTheme } from "@/lib/theme/ThemeProvider"
import type { CategorySlice } from "@/features/stats/statsAggregate"

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" })

export function SpendingDonut({ slices }: { slices: CategorySlice[] }) {
  const { colors, isDark } = useTheme()
  const { t } = useTranslation()

  if (slices.length === 0 || slices.every((s) => s.amount <= 0)) {
    return <Text style={[styles.empty, { color: colors.textMuted }]}>{t("stats.noExpense")}</Text>
  }

  const palette = chartPalette(isDark)
  const colored = slices.map((s, i) => ({ ...s, color: palette[i % palette.length] }))

  return (
    <View style={styles.wrap}>
      <View style={styles.chart}>
        <PieChart
          data={colored.map((s) => ({ value: s.amount, color: s.color }))}
          donut
          radius={90}
          innerRadius={56}
          innerCircleColor={colors.card}
          strokeColor={colors.card}
          strokeWidth={2}
        />
      </View>
      <View style={styles.legend}>
        {colored.map((s) => (
          <View key={s.key} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: s.color }]} />
            <Text style={[styles.legendName, { color: colors.textInk }]} numberOfLines={1}>
              {s.icon ? `${s.icon} ` : ""}
              {s.name}
            </Text>
            <Text style={[styles.legendAmount, { color: colors.textMuted }]}>{formatVNDCompact(s.amount)}</Text>
            <Text style={[styles.legendPct, { color: colors.textFaint }]}>{Math.round(s.pct)}%</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  chart: { alignItems: "center" },
  empty: { fontSize: 14, paddingVertical: 12 },
  legend: { gap: 10 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 24 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  legendName: { flex: 1, fontSize: 14, fontWeight: "600" },
  legendAmount: { fontSize: 13, fontFamily: MONO, fontVariant: ["tabular-nums"] },
  legendPct: { fontSize: 13, width: 44, textAlign: "right", fontFamily: MONO, fontVariant: ["tabular-nums"] },
})
