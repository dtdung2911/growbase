import * as LocalAuthentication from "expo-local-authentication";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { signOutAndPurge } from "@/features/auth/signOut";
import { useTranslation } from "@/lib/i18n/TranslationProvider";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { useAppStore } from "@/store/appStore";

export function UnlockScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const unlock = useAppStore((s) => s.unlock);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [failed, setFailed] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const mounted = useRef(true);
  const pending = useRef(false);
  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const authenticate = useCallback(async () => {
    if (pending.current) return;
    pending.current = true;
    setFailed(false);
    setIsPending(true);
    try {
      const result = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false,
        promptMessage: t("unlock.faceId.prompt"),
      });
      if (!mounted.current) return;
      if (result.success) unlock();
      // A user-initiated cancel isn't a failure worth surfacing as an error.
      else if (result.error !== "user_cancel" && result.error !== "app_cancel") setFailed(true);
    } catch {
      if (mounted.current) setFailed(true);
    } finally {
      pending.current = false;
      if (mounted.current) setIsPending(false);
    }
  }, [t, unlock]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const [hasHardware, isEnrolled] = await Promise.all([
          LocalAuthentication.hasHardwareAsync(),
          LocalAuthentication.isEnrolledAsync(),
        ]);
        if (!active || !hasHardware || !isEnrolled) return;
        setBiometricAvailable(true);
        await authenticate();
      } catch {
        // Hardware probe failed; fall back to the password button only.
      }
    })();
    return () => {
      active = false;
    };
  }, [authenticate]);

  async function handlePassword() {
    setIsPending(true);
    await signOutAndPurge();
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textInk }]}>{t("unlock.title")}</Text>
        {failed ? <Text style={[styles.error, { color: colors.error }]}>{t("unlock.error.failed")}</Text> : null}
        {biometricAvailable ? (
          <Pressable
            style={[styles.button, { backgroundColor: colors.primary }, isPending && styles.buttonDisabled]}
            onPress={authenticate}
            disabled={isPending}
          >
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>{t("unlock.faceId.cta")}</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={[styles.buttonSecondary, { borderColor: colors.primary }, isPending && styles.buttonDisabled]}
          onPress={handlePassword}
          disabled={isPending}
        >
          <Text style={[styles.buttonSecondaryText, { color: colors.primary }]}>{t("unlock.password.cta")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  card: {
    borderRadius: 15,
    borderWidth: 1,
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
  },
  error: {
    fontSize: 14,
  },
  button: {
    minHeight: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonSecondary: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSecondaryText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
