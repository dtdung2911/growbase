import { formatVNDCompact } from "@growbase/shared/rules/currency"
import { StyleSheet, Text, View } from "react-native"
import { BarChart } from "react-native-gifted-charts"
import { useTranslation } from "@/lib/i18n/TranslationProvider"
import { chartPalette } from "@/lib/theme/chartPalette"
import { useTheme } from "@/lib/theme/ThemeProvider"
import type { GroupSlice } from "@/features/stats/statsAggregate"

export function SpendingBar({ slices }: { slices: GroupSlice[] }) {
  const { colors, isDark } = useTheme()
  const { t } = useTranslation()

  if (slices.length === 0 || slices.every((s) => s.amount <= 0)) {
    return <Text style={[styles.empty, { color: colors.textMuted }]}>{t("stats.noExpense")}</Text>
  }

  const palette = chartPalette(isDark)
  const data = slices.map((s, i) => ({
    value: s.amount,
    label: s.name.length > 8 ? `${s.name.slice(0, 8)}…` : s.name,
    frontColor: palette[i % palette.length],
    topLabelComponent: () => (
      <Text style={[styles.topLabel, { color: colors.textMuted }]}>{formatVNDCompact(s.amount)}</Text>
    ),
  }))

  return (
    <View style={styles.wrap}>
      <BarChart
        data={data}
        barWidth={30}
        spacing={26}
        initialSpacing={14}
        barBorderRadius={6}
        hideRules
        yAxisThickness={0}
        xAxisThickness={0}
        hideYAxisText
        xAxisLabelTextStyle={[styles.axisLabel, { color: colors.textMuted }]}
        height={160}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { marginTop: 4 },
  empty: { fontSize: 14, paddingVertical: 12 },
  topLabel: { fontSize: 10, fontWeight: "600", marginBottom: 4 },
  axisLabel: { fontSize: 9 },
})
