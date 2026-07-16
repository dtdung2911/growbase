import { ScreenPlaceholder } from "@/components/ScreenPlaceholder"
import { useTranslation } from "@/lib/i18n/TranslationProvider"

export default function TransactionsScreen() {
  const { t } = useTranslation()
  return <ScreenPlaceholder title={t("nav.transactions")} />
}
