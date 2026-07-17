import { zodResolver } from "@hookform/resolvers/zod"
import { Ionicons } from "@expo/vector-icons"
import {
  updateTransactionSchema,
  type UpdateTransactionInput,
} from "@growbase/shared/schemas/transaction"
import type { TransactionWithJoins } from "@growbase/shared/types/app"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useTranslation } from "@/lib/i18n/TranslationProvider"
import { useTheme } from "@/lib/theme/ThemeProvider"

const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" })
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function isValidCalendarDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false
  const [year, month, day] = value.split("-").map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  )
}

function toDefaults(tx: TransactionWithJoins): UpdateTransactionInput {
  return {
    id: tx.id,
    amount: tx.amount,
    direction: tx.direction as UpdateTransactionInput["direction"],
    transaction_type: tx.transaction_type as UpdateTransactionInput["transaction_type"],
    category_id: tx.category_id,
    account_id: tx.account_id,
    description: tx.description ?? undefined,
    transaction_date: tx.transaction_date,
    is_unusual_income: tx.is_unusual_income,
    debt_entry_id: tx.debt_entry_id,
  }
}

type TransactionEditSheetProps = {
  transaction: TransactionWithJoins | null
  isPending: boolean
  onSubmit: (values: UpdateTransactionInput) => void
  onClose: () => void
}

export function TransactionEditSheet({
  transaction,
  isPending,
  onSubmit,
  onClose,
}: TransactionEditSheetProps) {
  const { colors } = useTheme()
  const { t } = useTranslation()
  const insets = useSafeAreaInsets()

  const { control, handleSubmit, reset, setError, formState } = useForm<UpdateTransactionInput>({
    resolver: zodResolver(updateTransactionSchema),
  })
  const { errors } = formState

  useEffect(() => {
    if (transaction) reset(toDefaults(transaction))
  }, [transaction, reset])

  const submit = handleSubmit((values) => {
    if (!isValidCalendarDate(values.transaction_date)) {
      setError("transaction_date", { message: t("transactions.edit.dateError") })
      return
    }
    onSubmit(values)
  })

  const inputStyle = [styles.input, { borderColor: colors.border, color: colors.textInk, backgroundColor: colors.background }]

  return (
    <Modal
      visible={!!transaction}
      transparent
      animationType="slide"
      onRequestClose={isPending ? undefined : onClose}
    >
      <View style={styles.backdrop}>
        <Pressable style={styles.backdropTop} onPress={isPending ? undefined : onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={[styles.sheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.textInk }]}>
                {t("transactions.edit.title")}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t("transactions.edit.cancel")}
                onPress={onClose}
                disabled={isPending}
                hitSlop={8}
              >
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>

            <Text style={[styles.label, { color: colors.textMuted }]}>
              {t("transactions.edit.amountLabel")}
            </Text>
            <Controller
              control={control}
              name="amount"
              render={({ field }) => (
                <TextInput
                  style={[...inputStyle, styles.amountInput]}
                  keyboardType="number-pad"
                  value={field.value ? String(field.value) : ""}
                  onChangeText={(text) => {
                    const digits = text.replace(/[^0-9]/g, "")
                    field.onChange(digits ? Number(digits) : 0)
                  }}
                  placeholderTextColor={colors.textFaint}
                />
              )}
            />
            {errors.amount ? (
              <Text style={[styles.error, { color: colors.error }]}>
                {t("transactions.edit.amountError")}
              </Text>
            ) : null}

            <Text style={[styles.label, { color: colors.textMuted }]}>
              {t("transactions.edit.descriptionLabel")}
            </Text>
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <TextInput
                  style={inputStyle}
                  value={field.value ?? ""}
                  onChangeText={field.onChange}
                  placeholder={t("transactions.edit.descriptionPlaceholder")}
                  placeholderTextColor={colors.textFaint}
                />
              )}
            />

            <Text style={[styles.label, { color: colors.textMuted }]}>
              {t("transactions.edit.dateLabel")}
            </Text>
            <Controller
              control={control}
              name="transaction_date"
              render={({ field }) => (
                <TextInput
                  style={inputStyle}
                  value={field.value ?? ""}
                  onChangeText={field.onChange}
                  autoCapitalize="none"
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={colors.textFaint}
                />
              )}
            />
            {errors.transaction_date ? (
              <Text style={[styles.error, { color: colors.error }]}>
                {t("transactions.edit.dateError")}
              </Text>
            ) : null}

            <View style={styles.switchRow}>
              <Text style={[styles.switchLabel, { color: colors.textInk }]}>
                {t("transactions.edit.unusualIncome")}
              </Text>
              <Controller
                control={control}
                name="is_unusual_income"
                render={({ field }) => (
                  <Switch value={!!field.value} onValueChange={field.onChange} />
                )}
              />
            </View>

            <Pressable
              style={[styles.saveButton, { backgroundColor: colors.primary, opacity: isPending ? 0.6 : 1 }]}
              accessibilityRole="button"
              disabled={isPending}
              onPress={submit}
            >
              {isPending ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={[styles.saveLabel, { color: colors.onPrimary }]}>
                  {t("transactions.edit.save")}
                </Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  backdropTop: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    gap: 6,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 8,
  },
  input: {
    height: 48,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  amountInput: {
    fontFamily: MONO,
    fontVariant: ["tabular-nums"],
    fontSize: 20,
    fontWeight: "700",
  },
  error: {
    fontSize: 12,
    marginTop: 2,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
  },
  switchLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  saveButton: {
    height: 52,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  saveLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
})
