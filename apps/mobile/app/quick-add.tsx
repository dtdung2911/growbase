import { useRouter } from "expo-router"
import { useRef, useState } from "react"
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native"
import Toast from "react-native-toast-message"
import { ApiError } from "@/api/client"
import { useAccounts } from "@/features/accounts/useAccounts"
import { useCategories } from "@/features/categories/useCategories"
import {
  filterByDirection,
  recentCategoriesFor,
  useRecentCategories,
} from "@/features/transactions/recentCategories"
import { useCreateTransaction } from "@/features/transactions/useCreateTransaction"
import { useTranslation } from "@/lib/i18n/TranslationProvider"
import { useTheme } from "@/lib/theme/ThemeProvider"
import { todayVN } from "@growbase/shared/rules/date"

const isValidDate = (d: string) => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d)
  if (!m) return false
  const [y, mo, day] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const dt = new Date(y, mo - 1, day)
  return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === day
}

export default function QuickAddScreen() {
  const { t } = useTranslation()
  const { colors } = useTheme()
  const router = useRouter()

  const categoriesQuery = useCategories()
  const accountsQuery = useAccounts()
  const create = useCreateTransaction()
  const recentIds = useRecentCategories((s) => s.recentIds)
  const pushRecent = useRecentCategories((s) => s.push)
  const submitting = useRef(false)

  const [tab, setTab] = useState<"expense" | "income">("expense")
  const [amountText, setAmountText] = useState("")
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [date, setDate] = useState(todayVN)
  const [note, setNote] = useState("")

  const direction = tab === "income" ? "in" : "out"
  const amount = Number(amountText)
  const accounts = accountsQuery.data ?? []
  const selectedAccountId = accountId ?? accounts[0]?.id ?? null
  const groups = filterByDirection(categoriesQuery.data ?? [], direction)
  const recent = recentCategoriesFor(groups, recentIds)
  const hasCategories = groups.some((g) => g.categories.length > 0)

  const canSave =
    amount > 0 &&
    !!categoryId &&
    !!selectedAccountId &&
    isValidDate(date) &&
    !create.isPending

  function switchTab(next: "expense" | "income") {
    setTab(next)
    setCategoryId(null)
  }

  async function handleSave() {
    if (!canSave || !categoryId || !selectedAccountId || submitting.current) return
    submitting.current = true
    try {
      await create.mutateAsync({
        amount,
        direction,
        transaction_type: tab,
        category_id: categoryId,
        account_id: selectedAccountId,
        description: note.trim() || undefined,
        transaction_date: date,
        is_unusual_income: false,
      })
      pushRecent(categoryId)
      Toast.show({ type: "success", text1: t("tx.saved"), visibilityTime: 2000 })
      router.back()
    } catch (e) {
      const message = e instanceof ApiError ? e.message : t("tx.saveError")
      Toast.show({ type: "error", text1: message, visibilityTime: 5000 })
    } finally {
      submitting.current = false
    }
  }

  const chip = (selected: boolean) => [
    styles.chip,
    { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primarySoft : colors.card },
  ]

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.segment, { borderColor: colors.border }]}>
          {(["expense", "income"] as const).map((key) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: tab === key }}
              style={[styles.segmentItem, tab === key && { backgroundColor: colors.primary }]}
              onPress={() => switchTab(key)}
            >
              <Text style={{ color: tab === key ? colors.onPrimary : colors.textBody, fontWeight: "600" }}>
                {t(key === "expense" ? "tx.expense" : "tx.income")}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.textBody }]}>{t("tx.amount")}</Text>
        <TextInput
          accessibilityLabel={t("tx.amount")}
          style={[styles.amount, { borderColor: colors.border, color: colors.textInk, backgroundColor: colors.card }]}
          value={amountText}
          onChangeText={setAmountText}
          keyboardType="number-pad"
          autoFocus
          placeholder="0"
          placeholderTextColor={colors.textFaint}
        />

        <Text style={[styles.label, { color: colors.textBody }]}>{t("tx.category")}</Text>
        {categoriesQuery.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : categoriesQuery.isError ? (
          <Text style={{ color: colors.textMuted }}>{t("tx.loadError")}</Text>
        ) : !hasCategories ? (
          <Text style={{ color: colors.textMuted }}>{t("tx.noCategories")}</Text>
        ) : (
          <>
            {recent.length > 0 && (
              <>
                <Text style={[styles.hint, { color: colors.textMuted }]}>{t("tx.recent")}</Text>
                <View style={styles.chipRow}>
                  {recent.map((c) => (
                    <Pressable
                      key={`recent-${c.id}`}
                      accessibilityRole="button"
                      accessibilityState={{ selected: categoryId === c.id }}
                      style={chip(categoryId === c.id)}
                      onPress={() => setCategoryId(c.id)}
                    >
                      <Text style={{ color: colors.textInk }}>{c.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
            {groups.map((g) => (
              <View key={g.id} style={styles.group}>
                <Text style={[styles.hint, { color: colors.textMuted }]}>{g.name}</Text>
                <View style={styles.chipRow}>
                  {g.categories.map((c) => (
                    <Pressable
                      key={c.id}
                      accessibilityRole="button"
                      accessibilityState={{ selected: categoryId === c.id }}
                      style={chip(categoryId === c.id)}
                      onPress={() => setCategoryId(c.id)}
                    >
                      <Text style={{ color: colors.textInk }}>{c.name}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </>
        )}

        <Text style={[styles.label, { color: colors.textBody }]}>{t("tx.account")}</Text>
        {accountsQuery.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : accountsQuery.isError ? (
          <Text style={{ color: colors.textMuted }}>{t("tx.loadError")}</Text>
        ) : accounts.length === 0 ? (
          <Text style={{ color: colors.textMuted }}>{t("tx.noAccounts")}</Text>
        ) : (
          <View style={styles.chipRow}>
            {accounts.map((a) => (
              <Pressable
                key={a.id}
                accessibilityRole="button"
                accessibilityState={{ selected: selectedAccountId === a.id }}
                style={chip(selectedAccountId === a.id)}
                onPress={() => setAccountId(a.id)}
              >
                <Text style={{ color: colors.textInk }}>{a.name}</Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text style={[styles.label, { color: colors.textBody }]}>{t("tx.date")}</Text>
        <TextInput
          accessibilityLabel={t("tx.date")}
          style={[styles.input, { borderColor: colors.border, color: colors.textInk, backgroundColor: colors.card }]}
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
          placeholderTextColor={colors.textFaint}
        />

        <Text style={[styles.label, { color: colors.textBody }]}>{t("tx.note")}</Text>
        <TextInput
          accessibilityLabel={t("tx.note")}
          style={[styles.input, { borderColor: colors.border, color: colors.textInk, backgroundColor: colors.card }]}
          value={note}
          onChangeText={setNote}
          placeholderTextColor={colors.textFaint}
        />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("tx.save")}
          style={[styles.button, { backgroundColor: colors.primary }, !canSave && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={!canSave}
        >
          {create.isPending ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <Text style={[styles.buttonText, { color: colors.onPrimary }]}>{t("tx.save")}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 20, paddingBottom: 40, gap: 8 },
  segment: { flexDirection: "row", borderWidth: 1, borderRadius: 999, overflow: "hidden" },
  segmentItem: { flex: 1, minHeight: 44, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 14, marginTop: 12 },
  hint: { fontSize: 12, marginTop: 4 },
  group: { gap: 4 },
  amount: {
    height: 56,
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 16,
    fontSize: 28,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  input: { height: 44, borderWidth: 1, borderRadius: 18, paddingHorizontal: 16, fontSize: 16 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { minHeight: 44, justifyContent: "center", borderWidth: 1, borderRadius: 999, paddingHorizontal: 16 },
  button: { minHeight: 48, borderRadius: 999, alignItems: "center", justifyContent: "center", marginTop: 24 },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { fontSize: 16, fontWeight: "600" },
})
