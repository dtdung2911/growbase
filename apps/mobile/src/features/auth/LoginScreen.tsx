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
import { useTheme } from "@/lib/theme/ThemeProvider";
import { supabase } from "@/lib/supabase/client";

export function LoginScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
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
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.textInk }]}>GrowBase</Text>

        <Text style={[styles.label, { color: colors.textBody }]}>{t("login.email")}</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.textInk, backgroundColor: colors.card }]}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          editable={!isPending}
          placeholderTextColor={colors.textFaint}
        />

        <Text style={[styles.label, { color: colors.textBody }]}>{t("login.password")}</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.textInk, backgroundColor: colors.card }]}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password"
          textContentType="password"
          editable={!isPending}
          placeholderTextColor={colors.textFaint}
        />

        <Pressable
          style={[styles.button, { backgroundColor: colors.primary }, !canSubmit && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {isPending ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>{t("login.submit")}</Text>
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
  },
  card: {
    borderRadius: 15,
    borderWidth: 1,
    padding: 24,
    gap: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    marginTop: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    minHeight: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
