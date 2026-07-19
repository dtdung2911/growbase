"use client"

import { useLivingPlan } from "@/lib/hooks/useLivingPlan"
import { useTranslation } from "@/lib/i18n/useTranslation"
import { currentStage } from "@growbase/shared/rules/currentStage"
import { stageBadgeContent } from "@growbase/shared/rules/stageBadge"

// Lớp phủ độc lập tháng browsed (BR-OB-014): mang câu chuyện 3 giai đoạn lên dashboard hằng ngày.
export function StageBadge() {
  const { t } = useTranslation()
  const { plan, capacityThisMonth, emergencyBalance, isLoading, isError } = useLivingPlan()

  if (isLoading || isError || !plan) return null
  // Hộ mới / 0 income: chưa có capacity lẫn target → badge chỉ ra số vô nghĩa, ẩn tử tế.
  if (capacityThisMonth === 0 && plan.emergencyTarget === 0) return null

  const stage = currentStage(emergencyBalance, plan.emergencyTarget)
  const content = stageBadgeContent(stage, plan.stage1EndMonth, plan.stage2EndMonth)

  return (
    <span className="inline-flex w-fit items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs text-primary">
      {content.kind === "months" ? (
        <MonthsLabel template={t(`dashboard.stageBadge.stage${content.stage}`)} months={content.months} />
      ) : content.kind === "dream" ? (
        t("dashboard.stageBadge.stage3")
      ) : (
        t("dashboard.stageBadge.stagePlain", { stage: content.stage })
      )}
    </span>
  )
}

// Tách số ra mono span: split template ở placeholder, giữ prefix/suffix theo ngôn ngữ.
function MonthsLabel({ template, months }: { template: string; months: number }) {
  const [prefix, suffix] = template.split("{{months}}")
  return (
    <>
      {prefix}
      <span className="font-mono tabular-nums">{months}</span>
      {suffix ?? ""}
    </>
  )
}
