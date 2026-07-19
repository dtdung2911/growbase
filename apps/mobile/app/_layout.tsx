import { Stack, useRouter, useSegments } from "expo-router"
import { StatusBar } from "expo-status-bar"
import { useEffect } from "react"
import { GestureHandlerRootView } from "react-native-gesture-handler"
import Toast from "react-native-toast-message"
import { SafeAreaProvider } from "react-native-safe-area-context"
import { useAuthSession } from "@/features/auth/useAuthSession"
import { useBiometricLock } from "@/features/auth/useBiometricLock"
import { UnlockScreen } from "@/features/auth/UnlockScreen"
import { useHouseholdBootstrap } from "@/features/household/useHouseholdBootstrap"
import { SwitchingOverlay } from "@/features/household/SwitchingOverlay"
import { TranslationProvider } from "@/lib/i18n/TranslationProvider"
import { QueryProvider } from "@/lib/query/QueryProvider"
import { useAutoRefresh } from "@/lib/supabase/useAutoRefresh"
import { ThemeProvider, useTheme } from "@/lib/theme/ThemeProvider"
import { useAppStore } from "@/store/appStore"

function AuthGate() {
  const { initializing } = useAuthSession()
  useAutoRefresh()
  useBiometricLock()
  useHouseholdBootstrap()
  const user = useAppStore((s) => s.user)
  const isLocked = useAppStore((s) => s.isLocked)
  const { isDark } = useTheme()
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (initializing) return
    const onLogin = segments[0] === "login"
    if (!user && !onLogin) router.replace("/login")
    else if (user && onLogin) router.replace("/")
  }, [initializing, user, segments, router])

  if (initializing) return null
  if (user && isLocked)
    return (
      <>
        <StatusBar style={isDark ? "light" : "dark"} />
        <UnlockScreen />
      </>
    )

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="quick-add" options={{ presentation: "modal" }} />
      </Stack>
      <SwitchingOverlay />
    </>
  )
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryProvider>
            <TranslationProvider>
              <AuthGate />
              <Toast />
            </TranslationProvider>
          </QueryProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
