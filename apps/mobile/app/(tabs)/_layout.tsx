import { Ionicons } from "@expo/vector-icons"
import { router, Tabs } from "expo-router"
import type { ComponentProps } from "react"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "@/lib/i18n/TranslationProvider"
import { useTheme } from "@/lib/theme/ThemeProvider"

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>["tabBar"]>>[0]
type IoniconName = ComponentProps<typeof Ionicons>["name"]

const ICONS: Record<string, IoniconName> = {
  index: "home",
  transactions: "swap-horizontal",
  stats: "stats-chart",
  menu: "menu",
}
const LABELS: Record<string, "nav.home" | "nav.transactions" | "nav.stats" | "nav.menu"> = {
  index: "nav.home",
  transactions: "nav.transactions",
  stats: "nav.stats",
  menu: "nav.menu",
}

function CustomTabBar({ state, navigation }: TabBarProps) {
  const { colors } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()
  // Android with hardware/nav buttons reports insets.bottom = 0; keep a floor so the bar/FAB don't hug the edge.
  const bottomInset = Math.max(insets.bottom, 8)
  const half = Math.ceil(state.routes.length / 2)

  const renderTab = (route: TabBarProps["state"]["routes"][number], index: number) => {
    const focused = state.index === index
    const color = focused ? colors.primary : colors.textMuted
    return (
      <Pressable
        key={route.key}
        style={styles.tab}
        accessibilityRole="button"
        accessibilityState={{ selected: focused }}
        onPress={() => {
          const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true })
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name)
        }}
      >
        <Ionicons name={ICONS[route.name] ?? "ellipse"} size={24} color={color} />
        <Text style={[styles.label, { color }]}>{t(LABELS[route.name] ?? "nav.home")}</Text>
      </Pressable>
    )
  }

  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: colors.card, borderTopColor: colors.border, height: 56 + bottomInset, paddingBottom: bottomInset },
      ]}
    >
      {state.routes.slice(0, half).map(renderTab)}
      <View style={styles.fabSlot} />
      {state.routes.slice(half).map(renderTab)}
      <Pressable
        style={[styles.fab, { backgroundColor: colors.primary, shadowColor: colors.primary, bottom: bottomInset + 8 }]}
        accessibilityRole="button"
        accessibilityLabel={t("nav.quickAdd")}
        onPress={() => router.navigate("/quick-add")}
      >
        <Ionicons name="add" size={30} color={colors.onPrimary} />
      </Pressable>
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <CustomTabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="transactions" />
      <Tabs.Screen name="stats" />
      <Tabs.Screen name="menu" />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    borderTopWidth: 1,
    paddingTop: 6,
  },
  tab: {
    flex: 1,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
  },
  fabSlot: {
    width: 64,
  },
  fab: {
    position: "absolute",
    left: "50%",
    marginLeft: -28,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowOpacity: 0.26,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
})
