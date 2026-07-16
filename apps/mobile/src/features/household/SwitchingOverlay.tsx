import { ActivityIndicator, StyleSheet, Text, View } from "react-native"
import { useTranslation } from "@/lib/i18n/TranslationProvider"
import { useAppStore } from "@/store/appStore"

export function SwitchingOverlay() {
  const { t } = useTranslation()
  const isSwitching = useAppStore((s) => s.isSwitchingHousehold)
  if (!isSwitching) return null

  return (
    <View style={styles.overlay}>
      <ActivityIndicator size="large" color="#0084DB" />
      <Text style={styles.label}>{t("household.switching")}</Text>
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
    backgroundColor: "#eef5fb",
  },
  label: {
    fontSize: 16,
    color: "#1d2737",
    fontWeight: "600",
  },
})
