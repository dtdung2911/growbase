import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { useTranslation } from "@/lib/i18n/TranslationProvider";
import { supabase } from "@/lib/supabase/client";

export function LoginScreen() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0 && !isPending;

  async function handleSubmit() {
    if (!canSubmit) return;
    setIsPending(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        // Keep the form as-is; the redirect happens via onAuthStateChange on success.
        const message =
          error.message === "Invalid login credentials"
            ? t("login.error.invalidCredentials")
            : error.message;
        Toast.show({ type: "error", text1: message, visibilityTime: 5000 });
      }
    } catch {
      Toast.show({ type: "error", text1: t("login.error.network"), visibilityTime: 5000 });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>GrowBase</Text>

        <Text style={styles.label}>{t("login.email")}</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          editable={!isPending}
        />

        <Text style={styles.label}>{t("login.password")}</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
          editable={!isPending}
        />

        <Pressable
          style={[styles.button, !canSubmit && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {isPending ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.buttonText}>{t("login.submit")}</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1d2737",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#2a3445",
    marginTop: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: "#e5edf6",
    borderRadius: 18,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1d2737",
    backgroundColor: "#ffffff",
  },
  button: {
    minHeight: 48,
    borderRadius: 999,
    backgroundColor: "#0084DB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
