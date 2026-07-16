import * as LocalAuthentication from "expo-local-authentication";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { signOutAndPurge } from "@/features/auth/signOut";
import { useTranslation } from "@/lib/i18n/TranslationProvider";
import { useAppStore } from "@/store/appStore";

export function UnlockScreen() {
  const { t } = useTranslation();
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
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>{t("unlock.title")}</Text>
        {failed ? <Text style={styles.error}>{t("unlock.error.failed")}</Text> : null}
        {biometricAvailable ? (
          <Pressable
            style={[styles.button, isPending && styles.buttonDisabled]}
            onPress={authenticate}
            disabled={isPending}
          >
            <Text style={styles.buttonText}>{t("unlock.faceId.cta")}</Text>
          </Pressable>
        ) : null}
        <Pressable
          style={[styles.buttonSecondary, isPending && styles.buttonDisabled]}
          onPress={handlePassword}
          disabled={isPending}
        >
          <Text style={styles.buttonSecondaryText}>{t("unlock.password.cta")}</Text>
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
    backgroundColor: "#eef5fb",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 15,
    borderWidth: 1,
    borderColor: "#e5edf6",
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1d2737",
    marginBottom: 8,
  },
  error: {
    fontSize: 14,
    color: "#ff917d",
  },
  button: {
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: "#0084DB",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#ffffff",
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
    borderColor: "#0084DB",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonSecondaryText: {
    color: "#0084DB",
    fontSize: 16,
    fontWeight: "600",
  },
});
