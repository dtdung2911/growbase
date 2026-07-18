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

export function sumBudgetPct(groups: readonly CostTypeGroupKey[]): number {
  return BUDGET_TEMPLATE.filter((l) => groups.includes(l.costTypeGroup)).reduce((sum, l) => sum + l.budgetPct, 0)
}

// Chi phí sinh hoạt ước tính 1 tháng = thu nhập × tổng % các line chi tiêu
export function estimateMonthlyLivingCost(monthlyIncome: number): number {
  return monthlyIncome * (sumBudgetPct(SPENDING_COST_TYPE_GROUPS) / 100)
}

export function estimateEmergencyTarget(
  monthlyIncome: number,
  months: number = EMERGENCY_FUND_MONTHS
): number {
  const target = months * estimateMonthlyLivingCost(monthlyIncome)
  return Math.floor(target / 100_000) * 100_000
}

export interface AllocationGoalInput {
  id: string
  targetAmount: number
  initialBalance?: number
}

export interface AllocationInput {
  monthlyIncome: number
  goals: AllocationGoalInput[] // thứ tự = hạng (index 0 = hạng cao nhất)
  emergencyBalance?: number
  // Target quỹ khẩn cấp từ DB (user-editable, BR-OB-014/016). Bỏ trống → estimate theo income (caller cũ).
  emergencyTarget?: number
}

export interface FundAllocation {
  id: string // "emergency" cho quỹ khẩn cấp
  // Góp TRUNG BÌNH mỗi tháng = (target − initialBalance) / timelineMonths. Dùng trung bình vì
  // snapshot tháng 1 luôn 0đ cho goal ở GĐ1 (100% dồn emergency) → "góp 0đ/tháng" mâu thuẫn với
  // "xong trong N tháng". null khi timeline null; 0 khi quỹ đã đầy sẵn (timeline 0).
  monthlyAmount: number | null
  timelineMonths: number | null // tháng hoàn thành (1-based); null nếu > 600 tháng
}

export interface AllocationPlan {
  capacityMonthly: number
  emergencyTarget: number
  stage1EndMonth: number | null // emergency đạt 1× chi tiêu thiết yếu (0 = đã đạt sẵn)
  stage2EndMonth: number | null // emergency đạt target 3×
  allocations: FundAllocation[] // emergency đầu tiên, rồi goals theo hạng
}

export const MAX_ALLOCATION_MONTHS = 600
// 1đ: VND không cần độ chính xác dưới 1 đồng, khớp convention epsilon cũ
const ALLOCATION_EPSILON = 1

// timelineMonths null → góp trung bình không xác định (không bao giờ xong); 0 → quỹ đã đầy sẵn.
function averageMonthly(target: number, initialBalance: number, timelineMonths: number | null): number | null {
  if (timelineMonths === null) return null
  if (timelineMonths === 0) return 0
  return Math.round((target - initialBalance) / timelineMonths)
}

// Bậc thang theo hạng (BR-OB-011). N≥4 (D2): hạng 1-2 giữ 60/30, hạng 3..N chia đều 10%.
export function ladderWeights(n: number): number[] {
  if (n <= 0) return []
  if (n === 1) return [1]
  if (n === 2) return [0.7, 0.3]
  if (n === 3) return [0.6, 0.3, 0.1]
  const tail = 0.1 / (n - 2)
  return [0.6, 0.3, ...Array<number>(n - 2).fill(tail)]
}

// Engine thuần 3 giai đoạn (BR-OB-009..011): single source of truth cho góp/tháng mọi quỹ.
export function calculateAllocationPlan(input: AllocationInput): AllocationPlan {
  const capacity = input.monthlyIncome * (sumBudgetPct(["savings_investment"]) / 100)
  const hasTargetOverride = input.emergencyTarget !== undefined
  const emergencyTarget = input.emergencyTarget ?? estimateEmergencyTarget(input.monthlyIncome)
  // Có override (target DB): ngưỡng GĐ derive từ target — target/3 = 1× chi tiêu thiết yếu, nhất quán
  // currentStage helper 12.2 (BR-OB-016). Không override: giữ estimate income×81% cũ (regression guard).
  const stage1Threshold = hasTargetOverride
    ? emergencyTarget / 3
    : input.monthlyIncome * (sumBudgetPct(SPENDING_COST_TYPE_GROUPS) / 100)

  const emergencyInitial = input.emergencyBalance ?? 0
  let emergencyBalance = emergencyInitial
  const goals = input.goals.map((g) => ({
    id: g.id,
    target: g.targetAmount,
    balance: g.initialBalance ?? 0,
    initialBalance: g.initialBalance ?? 0,
  }))

  const emergencyDone = () => emergencyBalance >= emergencyTarget - ALLOCATION_EPSILON
  const goalDone = (g: { target: number; balance: number }) => g.balance >= g.target - ALLOCATION_EPSILON

  let stage1EndMonth: number | null = emergencyBalance >= stage1Threshold - ALLOCATION_EPSILON ? 0 : null
  let stage2EndMonth: number | null = emergencyDone() ? 0 : null
  let emergencyTimeline: number | null = stage2EndMonth
  const goalTimeline: (number | null)[] = goals.map((g) => (goalDone(g) ? 0 : null))

  // Rót pool cho goals theo ladder; goal đầy giữa chừng → spill sang goals còn lại. Trả phần dư.
  const pourGoals = (pool: number): number => {
    let guard = 0
    while (pool > ALLOCATION_EPSILON && guard++ < goals.length + 2) {
      const incomplete = goals.filter((g) => !goalDone(g))
      if (incomplete.length === 0) break
      const weights = ladderWeights(incomplete.length)
      let consumed = 0
      incomplete.forEach((g, i) => {
        const give = Math.min(pool * weights[i], g.target - g.balance)
        g.balance += give
        consumed += give
      })
      if (consumed <= ALLOCATION_EPSILON) break
      pool -= consumed
    }
    return pool
  }

  const distributeMonth = () => {
    let remaining = capacity
    let guard = 0
    while (remaining > ALLOCATION_EPSILON && guard++ < 4) {
      if (emergencyBalance < stage1Threshold - ALLOCATION_EPSILON) {
        const give = Math.min(remaining, stage1Threshold - emergencyBalance)
        emergencyBalance += give
        remaining -= give
      } else if (!emergencyDone()) {
        const hasGoals = goals.some((g) => !goalDone(g))
        const emergencyShare = hasGoals ? remaining * 0.7 : remaining
        const room = emergencyTarget - emergencyBalance
        const emergencyGive = Math.min(emergencyShare, room)
        emergencyBalance += emergencyGive
        // Phần goals + phần emergency tràn khỏi target; dư từ goals (đầy hết) chảy ngược về emergency.
        const overflow = pourGoals(remaining - emergencyGive)
        if (overflow > ALLOCATION_EPSILON) {
          emergencyBalance += Math.min(overflow, emergencyTarget - emergencyBalance)
        }
        remaining = 0
      } else {
        pourGoals(remaining)
        remaining = 0
      }
    }
  }

  if (capacity > ALLOCATION_EPSILON) {
    for (let month = 1; month <= MAX_ALLOCATION_MONTHS; month++) {
      if (emergencyDone() && goals.every(goalDone)) break

      distributeMonth()

      if (stage1EndMonth === null && emergencyBalance >= stage1Threshold - ALLOCATION_EPSILON) {
        stage1EndMonth = month
      }
      if (stage2EndMonth === null && emergencyDone()) {
        stage2EndMonth = month
        emergencyTimeline = month
      }
      goals.forEach((g, i) => {
        if (goalTimeline[i] === null && goalDone(g)) goalTimeline[i] = month
      })
    }
  }

  return {
    capacityMonthly: Math.floor(capacity),
    emergencyTarget,
    stage1EndMonth,
    stage2EndMonth,
    allocations: [
      {
        id: "emergency",
        monthlyAmount: averageMonthly(emergencyTarget, emergencyInitial, emergencyTimeline),
        timelineMonths: emergencyTimeline,
      },
      ...goals.map((g, i) => ({
        id: g.id,
        monthlyAmount: averageMonthly(g.target, g.initialBalance, goalTimeline[i]),
        timelineMonths: goalTimeline[i],
      })),
    ],
  }
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

// BR-OB-013: lãi suất tham chiếu năm T-1. Cập nhật TAY mỗi năm khi số thị trường đổi.
export const COMPOUND_RATES_YEAR = 2025

// 3 tầng theo timeline baseline (BR-OB-013): <2 năm tiết kiệm 5% · 2-5 năm quỹ trái phiếu 6,5% · >5 năm DCA chỉ số 8%.
export const COMPOUND_TIERS = [
  { maxMonths: 24, annualRate: 0.05, key: "savings" },
  { maxMonths: 60, annualRate: 0.065, key: "bonds" },
  { maxMonths: Infinity, annualRate: 0.08, key: "index" },
] as const

export type CompoundTier = (typeof COMPOUND_TIERS)[number]

// n nhỏ nhất để FV annuity góp cuối kỳ đạt target: C×((1+i)^n − 1)/i ≥ target, i = annualRate/12.
// C ≤ 0 hoặc không đạt trong cap → null; target ≤ 0 → 0. Cap 600 nhất quán MAX_ALLOCATION_MONTHS.
export function compoundTimelineMonths(
  monthlyContribution: number,
  targetAmount: number,
  annualRate: number,
): number | null {
  if (targetAmount <= 0) return 0
  if (monthlyContribution <= 0) return null
  const i = annualRate / 12
  let futureValue = 0
  for (let n = 1; n <= MAX_ALLOCATION_MONTHS; n++) {
    futureValue = futureValue * (1 + i) + monthlyContribution
    if (futureValue >= targetAmount - ALLOCATION_EPSILON) return n
  }
  return null
}

// Chọn tầng theo timeline baseline; null (ngoài cap) coi như tầng xa nhất (index 8%).
export function pickCompoundTier(baselineTimelineMonths: number | null): CompoundTier {
  const last = COMPOUND_TIERS[COMPOUND_TIERS.length - 1]
  if (baselineTimelineMonths === null) return last
  return COMPOUND_TIERS.find((tier) => baselineTimelineMonths <= tier.maxMonths) ?? last
}

// 4 nhóm Conscious Spending Plan (bar Tada + màn kế hoạch chi tiết). Nhóm linh hoạt gộp
// variable+wasteful+other để bar phủ đúng 100%; fixed/savings/debt giữ % chuẩn khớp màn Budget.
// key khớp i18n setupV2.tada.budgetLegend.*.
export const BUDGET_SEGMENTS = [
  { key: "fixed", pct: sumBudgetPct(["fixed"]), color: "bg-primary" },
  { key: "variable", pct: sumBudgetPct(["variable", "wasteful", "other"]), color: "bg-info" },
  { key: "savingsInvestment", pct: sumBudgetPct(["savings_investment"]), color: "bg-success" },
  { key: "debtRepayment", pct: sumBudgetPct(["debt_repayment"]), color: "bg-warning" },
] as const
