import { Ionicons } from "@expo/vector-icons"
import { router } from "expo-router"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import Toast from "react-native-toast-message"
import { signOutAndPurge } from "@/features/auth/signOut"
import { switchHousehold } from "@/features/household/switchHousehold"
import { useTranslation, type Locale } from "@/lib/i18n/TranslationProvider"
import { useTheme, type ThemeMode } from "@/lib/theme/ThemeProvider"
import { useAppStore } from "@/store/appStore"

const LOCALES: { value: Locale; label: string }[] = [
  { value: "vi", label: "Tiếng Việt" },
  { value: "en", label: "English" },
]

export default function MenuScreen() {
  const { t, locale, setLocale } = useTranslation()
  const { colors, mode, setMode } = useTheme()
  const insets = useSafeAreaInsets()
  const households = useAppStore((s) => s.allHouseholds)
  const currentId = useAppStore((s) => s.householdId)
  const isSwitching = useAppStore((s) => s.isSwitchingHousehold)

  const themeOptions: { value: ThemeMode; label: string }[] = [
    { value: "light", label: t("settings.theme.light") },
    { value: "dark", label: t("settings.theme.dark") },
    { value: "system", label: t("settings.theme.system") },
  ]

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 72 },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t("menu.households")}</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {households.length === 0 ? (
          <Text style={[styles.empty, { color: colors.textMuted }]}>{t("menu.noHouseholds")}</Text>
        ) : (
          households.map((h) => {
            const active = h.id === currentId
            return (
              <Pressable
                key={h.id}
                style={[styles.row, isSwitching && !active ? styles.rowDisabled : null]}
                accessibilityRole="button"
                disabled={isSwitching}
                onPress={() => {
                  switchHousehold(h.id).catch(() => {
                    Toast.show({ type: "error", text1: t("household.switchError") })
                  })
                }}
              >
                <Text style={[styles.rowLabel, { color: colors.textInk }]}>{h.name}</Text>
                {active ? (
                  <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
                    <Text style={[styles.badgeText, { color: colors.primary }]}>{t("menu.currentBadge")}</Text>
                  </View>
                ) : null}
              </Pressable>
            )
          })
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable style={styles.row} accessibilityRole="button" onPress={() => router.push("/funds")}>
          <View style={styles.rowLead}>
            <Ionicons name="wallet-outline" size={20} color={colors.textInk} />
            <Text style={[styles.rowLabel, { color: colors.textInk }]}>{t("menu.funds")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
        </Pressable>
        <Pressable style={styles.row} accessibilityRole="button" onPress={() => router.push("/budget")}>
          <View style={styles.rowLead}>
            <Ionicons name="pie-chart-outline" size={20} color={colors.textInk} />
            <Text style={[styles.rowLabel, { color: colors.textInk }]}>{t("menu.budget")}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textFaint} />
        </Pressable>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{t("settings.appearance")}</Text>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.rowLabel, { color: colors.textInk }]}>{t("settings.language")}</Text>
        <View style={styles.segment}>
          {LOCALES.map((o) => (
            <SegmentButton
              key={o.value}
              label={o.label}
              active={locale === o.value}
              colors={colors}
              onPress={() => setLocale(o.value)}
            />
          ))}
        </View>
        <Text style={[styles.rowLabel, styles.spacedTop, { color: colors.textInk }]}>{t("settings.theme")}</Text>
        <View style={styles.segment}>
          {themeOptions.map((o) => (
            <SegmentButton
              key={o.value}
              label={o.label}
              active={mode === o.value}
              colors={colors}
              onPress={() => setMode(o.value)}
            />
          ))}
        </View>
      </View>

      <Pressable
        style={[styles.logout, { borderColor: colors.error }]}
        accessibilityRole="button"
        onPress={() => {
          signOutAndPurge()
        }}
      >
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={[styles.logoutText, { color: colors.error }]}>{t("menu.logout")}</Text>
      </Pressable>
    </ScrollView>
  )
}

function SegmentButton({
  label,
  active,
  colors,
  onPress,
}: {
  label: string
  active: boolean
  colors: ReturnType<typeof useTheme>["colors"]
  onPress: () => void
}) {
  return (
    <Pressable
      style={[
        styles.segmentButton,
        { backgroundColor: active ? colors.primary : colors.elevated },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
    >
      <Text style={[styles.segmentText, { color: active ? colors.onPrimary : colors.textBody }]}>{label}</Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    gap: 8,
    // paddingBottom is applied inline from insets.bottom so the center FAB
    // (which protrudes above the tab bar) never covers Logout on any device.
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    marginTop: 12,
    marginBottom: 4,
  },
  card: {
    borderRadius: 15,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  row: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowDisabled: {
    opacity: 0.5,
  },
  rowLead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  spacedTop: {
    marginTop: 8,
  },
  empty: {
    fontSize: 15,
    paddingVertical: 8,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  segment: {
    flexDirection: "row",
    gap: 8,
  },
  segmentButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: "600",
  },
  logout: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 999,
    borderWidth: 1,
    marginTop: 20,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
  },
})
