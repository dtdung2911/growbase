import { ScreenPlaceholder } from "@/components/ScreenPlaceholder"
import { useTranslation } from "@/lib/i18n/TranslationProvider"

export default function QuickAddScreen() {
  const { t } = useTranslation()
  return <ScreenPlaceholder title={t("nav.quickAdd")} subtitle={t("common.comingSoon")} />
}
