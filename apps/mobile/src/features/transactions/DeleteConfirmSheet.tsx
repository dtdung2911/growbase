import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native"
import { useTranslation } from "@/lib/i18n/TranslationProvider"
import { useTheme } from "@/lib/theme/ThemeProvider"

type DeleteConfirmSheetProps = {
  visible: boolean
  isPending: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function DeleteConfirmSheet({
  visible,
  isPending,
  onConfirm,
  onCancel,
}: DeleteConfirmSheetProps) {
  const { colors } = useTheme()
  const { t } = useTranslation()

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={isPending ? undefined : onCancel}
    >
      <Pressable style={styles.backdrop} onPress={isPending ? undefined : onCancel}>
        <Pressable style={[styles.dialog, { backgroundColor: colors.card }]} onPress={() => {}}>
          <Text style={[styles.title, { color: colors.textInk }]}>
            {t("transactions.delete.title")}
          </Text>
          <Text style={[styles.message, { color: colors.textMuted }]}>
            {t("transactions.delete.message")}
          </Text>
          <View style={styles.buttons}>
            <Pressable
              style={[styles.button, { backgroundColor: colors.elevated }]}
              accessibilityRole="button"
              disabled={isPending}
              onPress={onCancel}
            >
              <Text style={[styles.buttonLabel, { color: colors.textBody }]}>
                {t("transactions.delete.cancel")}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.button, { backgroundColor: colors.error, opacity: isPending ? 0.6 : 1 }]}
              accessibilityRole="button"
              disabled={isPending}
              onPress={onConfirm}
            >
              {isPending ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={[styles.buttonLabel, { color: "#ffffff" }]}>
                  {t("transactions.delete.confirm")}
                </Text>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  dialog: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 18,
    padding: 20,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  message: {
    fontSize: 15,
    lineHeight: 21,
  },
  buttons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: "700",
  },
})
