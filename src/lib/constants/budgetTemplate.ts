export type CostTypeGroupKey =
  | "income"
  | "fixed"
  | "variable"
  | "wasteful"
  | "savings_investment"
  | "debt_repayment"
  | "other"

export interface BudgetTemplateLine {
  name: string
  budgetPct: number
  sortOrder: number
  isSystem: true
  isAutoCalculated?: boolean
  autoCalculatedSource?: string
  linkedCategoryGroupNames: string[]
  goalText?: string
  costTypeGroup: CostTypeGroupKey
}

export const COST_TYPE_GROUP_LABELS: Record<CostTypeGroupKey, { vi: string; en: string; goalVi: string }> = {
  income: { vi: "Thu nhập", en: "Income", goalVi: "Tổng thu nhập" },
  fixed: { vi: "Chi phí cố định", en: "Fixed Costs", goalVi: "Ưu tiên nhưng có trần" },
  variable: { vi: "Chi phí phát sinh", en: "Variable Costs", goalVi: "Kiểm soát cảm xúc" },
  wasteful: { vi: "Chi phí lãng phí", en: "Wasteful", goalVi: "Giới hạn cứng" },
  savings_investment: { vi: "Tiết kiệm & Đầu tư", en: "Savings & Investment", goalVi: "Giới hạn cứng" },
  debt_repayment: { vi: "Chi trả nợ", en: "Debt Repayment", goalVi: "Xóa nợ trong kế hoạch" },
  other: { vi: "Khác", en: "Other", goalVi: "" },
}

// "Chi tiêu tháng" cho quỹ khẩn cấp (OQ2): loại income (không phải chi),
// savings_investment (để dành) và other (dòng sổ sách) — còn 81% thu nhập.
export const SPENDING_COST_TYPE_GROUPS: readonly CostTypeGroupKey[] = [
  "fixed",
  "variable",
  "wasteful",
  "debt_repayment",
]

// "Chi tiêu thoải mái" (AR7 — todayRemaining): chỉ nhóm linh hoạt, không gồm
// fixed (cam kết cố định) hay debt/savings (đã cam kết khác).
export const FLEXIBLE_COST_TYPE_GROUPS: readonly CostTypeGroupKey[] = ["variable", "wasteful"]

export const EMERGENCY_FUND_MONTHS = 3

// Preset quỹ khẩn cấp không có targetMonths — giãn mốc gom đủ ra 18 tháng (D2 story 9.1):
// 12 tháng khiến emergency gần như luôn infeasible (cần ~20% income vs available ~19%).
export const EMERGENCY_FUND_TIMELINE_MONTHS = 18

function sumBudgetPct(groups: readonly CostTypeGroupKey[]): number {
  return BUDGET_TEMPLATE.filter((l) => groups.includes(l.costTypeGroup)).reduce((sum, l) => sum + l.budgetPct, 0)
}

export function estimateEmergencyTarget(monthlyIncome: number): number {
  const target = EMERGENCY_FUND_MONTHS * monthlyIncome * (sumBudgetPct(SPENDING_COST_TYPE_GROUPS) / 100)
  return Math.floor(target / 100_000) * 100_000
}

export interface FeasibilityResult {
  monthlyNeeded: number
  available: number
  feasible: boolean
}

export function calculateFeasibility(
  targetAmount: number,
  months: number,
  monthlyIncome: number
): FeasibilityResult {
  const monthlyNeeded = targetAmount / months
  const totalBudget = monthlyIncome * (sumBudgetPct(SPENDING_COST_TYPE_GROUPS) / 100)
  const available = monthlyIncome - totalBudget
  // epsilon tránh false-negative do sai số float ở biên (VND không cần độ chính xác dưới 1 đồng)
  return { monthlyNeeded, available, feasible: monthlyNeeded <= available + 1 }
}

// Feasibility tổng khi nhiều quỹ cùng rút từ available. epsilon +1: target chia đều theo tháng
// sinh sai số float ở biên, VND không cần độ chính xác dưới 1 đồng.
export function calculateAggregateFeasibility(
  monthlyNeededList: number[],
  available: number
): FeasibilityResult {
  const monthlyNeeded = monthlyNeededList.reduce((sum, n) => sum + n, 0)
  return { monthlyNeeded, available, feasible: monthlyNeeded <= available + 1 }
}

export function calculateTodayRemaining(monthlyIncome: number, today: Date = new Date()): number {
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
  const flexibleMonthly = monthlyIncome * (sumBudgetPct(FLEXIBLE_COST_TYPE_GROUPS) / 100)
  return Math.floor(flexibleMonthly / daysInMonth)
}

// 18 dòng tĩnh (total = 100%). Onboarding S1 INSERT vào budget_baselines per household.
// "Chi trả nợ" auto-calculated từ debt_entries (trigger debt_budget_recalc).
// Group names khớp 005_seed.sql system category_groups.
// goalText = mục tiêu hành vi từ Google Sheet "02. Monthly Budget".
// costTypeGroup = loại chi phí để hiển thị grouped table.
export const BUDGET_TEMPLATE: BudgetTemplateLine[] = [
  {
    name: "Thực phẩm & Ăn uống hàng ngày",
    budgetPct: 15,
    sortOrder: 1,
    isSystem: true,
    linkedCategoryGroupNames: ["Thực phẩm & Ăn uống hàng ngày"],
    goalText: "Kiểm soát hành vi",
    costTypeGroup: "fixed",
  },
  {
    name: "Nhà ở & Điện nước",
    budgetPct: 8,
    sortOrder: 2,
    isSystem: true,
    linkedCategoryGroupNames: ["Nhà ở & Điện nước"],
    goalText: "Ổn định – không vượt",
    costTypeGroup: "fixed",
  },
  {
    name: "Phương tiện",
    budgetPct: 7,
    sortOrder: 3,
    isSystem: true,
    linkedCategoryGroupNames: [
      "Phương tiện xe cơ cố định",
      "Phương tiện xe cơ phát sinh",
    ],
    goalText: "Tránh trượt sang lãng phí",
    costTypeGroup: "fixed",
  },
  {
    name: "Con cái",
    budgetPct: 5,
    sortOrder: 4,
    isSystem: true,
    linkedCategoryGroupNames: ["Con cái"],
    goalText: "Kiểm soát hành vi",
    costTypeGroup: "fixed",
  },
  {
    name: "Giáo dục",
    budgetPct: 3,
    sortOrder: 5,
    isSystem: true,
    linkedCategoryGroupNames: ["Giáo dục"],
    goalText: "Đầu tư có chọn lọc",
    costTypeGroup: "fixed",
  },
  {
    name: "Dịch vụ",
    budgetPct: 3,
    sortOrder: 6,
    isSystem: true,
    linkedCategoryGroupNames: ["Dịch vụ"],
    goalText: "Ưu tiên nhưng có trần",
    costTypeGroup: "fixed",
  },
  {
    name: "Work & Tools",
    budgetPct: 2,
    sortOrder: 7,
    isSystem: true,
    linkedCategoryGroupNames: ["Work & Tools"],
    goalText: "Tránh trượt sang lãng phí",
    costTypeGroup: "fixed",
  },
  {
    name: "Dự trù tháng kế tiếp",
    budgetPct: 10,
    sortOrder: 8,
    isSystem: true,
    linkedCategoryGroupNames: ["Dự trù tháng kế tiếp"],
    goalText: "An toàn tháng tiếp theo",
    costTypeGroup: "fixed",
  },
  {
    name: "Chăm sóc cá nhân",
    budgetPct: 7,
    sortOrder: 9,
    isSystem: true,
    linkedCategoryGroupNames: ["Chăm sóc cá nhân"],
    goalText: "Kiểm soát cảm xúc",
    costTypeGroup: "variable",
  },
  {
    name: "Quà tặng & Hiếu hỉ",
    budgetPct: 3,
    sortOrder: 10,
    isSystem: true,
    linkedCategoryGroupNames: ["Quà tặng & Hiếu hỉ"],
    goalText: "Đầu tư có chọn lọc",
    costTypeGroup: "variable",
  },
  {
    name: "Thiết bị/Đồ dùng/Nhà cửa",
    budgetPct: 3,
    sortOrder: 11,
    isSystem: true,
    linkedCategoryGroupNames: ["Thiết bị/Đồ dùng/Nhà cửa"],
    goalText: "Chi theo KH mua sắm",
    costTypeGroup: "variable",
  },
  {
    name: "Ăn uống ngoài",
    budgetPct: 4,
    sortOrder: 12,
    isSystem: true,
    linkedCategoryGroupNames: ["Ăn uống ngoài"],
    goalText: "Kiểm soát hành vi",
    costTypeGroup: "wasteful",
  },
  {
    name: "Giải trí",
    budgetPct: 3,
    sortOrder: 13,
    isSystem: true,
    linkedCategoryGroupNames: ["Giải trí"],
    goalText: "Giới hạn cứng",
    costTypeGroup: "wasteful",
  },
  {
    name: "Tiết kiệm & Quỹ",
    budgetPct: 8,
    sortOrder: 14,
    isSystem: true,
    linkedCategoryGroupNames: ["Tiết kiệm"],
    goalText: "Giới hạn cứng",
    costTypeGroup: "savings_investment",
  },
  {
    name: "Đầu tư",
    budgetPct: 7,
    sortOrder: 15,
    isSystem: true,
    linkedCategoryGroupNames: ["Đầu tư"],
    goalText: "Giới hạn cứng",
    costTypeGroup: "savings_investment",
  },
  {
    name: "Chi trả nợ",
    budgetPct: 8,
    sortOrder: 16,
    isSystem: true,
    isAutoCalculated: true,
    autoCalculatedSource: "debt_entries",
    linkedCategoryGroupNames: ["Chi trả nợ"],
    goalText: "Xóa nợ trong kế hoạch",
    costTypeGroup: "debt_repayment",
  },
  {
    name: "Chênh lệch ghi chép",
    budgetPct: 2,
    sortOrder: 17,
    isSystem: true,
    linkedCategoryGroupNames: ["Chênh lệch ghi chép"],
    costTypeGroup: "other",
  },
  {
    name: "Vay nợ",
    budgetPct: 2,
    sortOrder: 18,
    isSystem: true,
    linkedCategoryGroupNames: ["Vay nợ"],
    goalText: "Hạn chế vay thêm",
    costTypeGroup: "other",
  },
]
