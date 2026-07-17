import { Ionicons } from "@expo/vector-icons"
import type { ComponentProps } from "react"
import { StyleSheet, Text, View } from "react-native"
import { useTheme } from "@/lib/theme/ThemeProvider"

type EmptyStateProps = {
  icon?: ComponentProps<typeof Ionicons>["name"]
  title: string
  message?: string
}

export function EmptyState({ icon = "receipt-outline", title, message }: EmptyStateProps) {
  const { colors } = useTheme()
  return (
    <View style={styles.container}>
      <View style={[styles.iconWrap, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={40} color={colors.primary} />
      </View>
      <Text style={[styles.title, { color: colors.textInk }]}>{title}</Text>
      {message ? <Text style={[styles.message, { color: colors.textMuted }]}>{message}</Text> : null}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 32,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  message: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 21,
  },
})
