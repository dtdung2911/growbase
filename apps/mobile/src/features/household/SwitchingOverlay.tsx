import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import { useTranslation } from "@/lib/i18n/TranslationProvider"
import { useTheme } from "@/lib/theme/ThemeProvider"
import { useAppStore } from "@/store/appStore"

export function SwitchingOverlay() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const isSwitching = useAppStore((s) => s.isSwitchingHousehold)
  if (!isSwitching) return null

  return (
    <View style={[styles.overlay, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.label, { color: colors.textInk }]}>{t("household.switching")}</Text>
    </View>
  )
}

// Centered full-screen cover; content is centered so notch/safe-area overlap is a non-issue.
const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
  },
})
