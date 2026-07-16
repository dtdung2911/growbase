import { ScreenPlaceholder } from "@/components/ScreenPlaceholder"
import { useTranslation } from "@/lib/i18n/TranslationProvider"

export default function HomeScreen() {
  const { t } = useTranslation()
  return <ScreenPlaceholder title={t("nav.home")} />
}
