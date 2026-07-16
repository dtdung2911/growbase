import { Stack, useRouter, useSegments } from "expo-router"
import { useEffect } from "react"
import Toast from "react-native-toast-message"
import { useAuthSession } from "@/features/auth/useAuthSession"
import { useBiometricLock } from "@/features/auth/useBiometricLock"
import { UnlockScreen } from "@/features/auth/UnlockScreen"
import { useHouseholdBootstrap } from "@/features/household/useHouseholdBootstrap"
import { SwitchingOverlay } from "@/features/household/SwitchingOverlay"
import { TranslationProvider } from "@/lib/i18n/TranslationProvider"
import { QueryProvider } from "@/lib/query/QueryProvider"
import { useAutoRefresh } from "@/lib/supabase/useAutoRefresh"
import { useAppStore } from "@/store/appStore"

function AuthGate() {
  const { initializing } = useAuthSession()
  useAutoRefresh()
  useBiometricLock()
  useHouseholdBootstrap()
  const user = useAppStore((s) => s.user)
  const isLocked = useAppStore((s) => s.isLocked)
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    if (initializing) return
    const onLogin = segments[0] === "login"
    if (!user && !onLogin) router.replace("/login")
    else if (user && onLogin) router.replace("/")
  }, [initializing, user, segments, router])

  if (initializing) return null
  if (user && isLocked) return <UnlockScreen />

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <SwitchingOverlay />
    </>
  )
}

export default function RootLayout() {
  return (
    <QueryProvider>
      <TranslationProvider>
        <AuthGate />
        <Toast />
      </TranslationProvider>
    </QueryProvider>
  )
}
