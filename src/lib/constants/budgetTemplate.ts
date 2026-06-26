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
