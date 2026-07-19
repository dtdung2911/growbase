import type { BadgeProps } from "@/components/ui/badge"

type BadgeVariant = NonNullable<BadgeProps["variant"]>

// Màu badge theo cost_type code (khớp cost_types.code seed). Label dùng i18n key behavior.<code>.
export const COST_TYPE_BADGE_VARIANT: Record<string, BadgeVariant> = {
  fixed: "secondary",
  variable: "info",
  wasteful: "warning",
  savings_investment: "success",
  debt_repayment: "violet",
  loan: "violet",
  income: "success",
}

export const COST_TYPE_FILTER_CODES = [
  "fixed",
  "variable",
  "wasteful",
  "savings_investment",
  "debt_repayment",
  "loan",
  "income",
] as const
