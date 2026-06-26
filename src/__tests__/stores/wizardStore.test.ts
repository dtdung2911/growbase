import { beforeEach, describe, expect, it } from "vitest"
// localStorage cung cấp bởi setupFiles (src/__tests__/setup/localStorage.ts)
import { useWizardStore } from "@/lib/stores/wizardStore"
import { BUDGET_TEMPLATE } from "@/lib/constants/budgetTemplate"
import type { AccountDraft, DebtDraft, IncomeDraft } from "@/types/app"

const DEBT_BUDGET_NAME = "Chi trả nợ"
const DEBT_TEMPLATE_PCT = BUDGET_TEMPLATE.find(
  (t) => t.name === DEBT_BUDGET_NAME
)!.budgetPct

// helpers — factory cho drafts hợp lệ
const income = (monthlyAmount: number, id = "i1"): IncomeDraft => ({
  id,
  sourceName: "Lương",
  monthlyAmount,
})

const account = (id = "a1"): AccountDraft => ({
  id,
  name: "Vietcombank",
  accountType: "bank",
  isCreditCard: false,
})

const debt = (monthlyPayment: number, id = "d1"): DebtDraft => ({
  id,
  creditorName: "Ngân hàng X",
  debtType: "bank_loan",
  totalAmount: 0,
  monthlyPayment,
})

// reset store về init state trước mỗi test (store là singleton)
beforeEach(() => {
  localStorage.clear()
  useWizardStore.getState().reset()
})

describe("wizardStore.canProceed()", () => {
  it("step 1: false khi householdType=null, true sau khi setHousehold", () => {
    useWizardStore.setState({ currentStep: 1 })
    expect(useWizardStore.getState().canProceed()).toBe(false)

    useWizardStore.getState().setHousehold("h1", "personal", "VND")
    useWizardStore.setState({ currentStep: 1 })
    expect(useWizardStore.getState().canProceed()).toBe(true)
  })

  it("step 3: false khi incomes=[], true khi có >=1 income", () => {
    useWizardStore.setState({ currentStep: 3, incomes: [] })
    expect(useWizardStore.getState().canProceed()).toBe(false)

    useWizardStore.getState().setIncomes([income(5_000_000)])
    useWizardStore.setState({ currentStep: 3 })
    expect(useWizardStore.getState().canProceed()).toBe(true)
  })

  it("step 4: false khi accounts=[], true khi có >=1 account", () => {
    useWizardStore.setState({ currentStep: 4, accounts: [] })
    expect(useWizardStore.getState().canProceed()).toBe(false)

    useWizardStore.getState().setAccounts([account()])
    useWizardStore.setState({ currentStep: 4 })
    expect(useWizardStore.getState().canProceed()).toBe(true)
  })

  it("step 7: false khi totalBudgetPct > 100, true khi <= 100", () => {
    useWizardStore.setState({ currentStep: 7 })
    // default template = 100 → pass (<= 100)
    expect(useWizardStore.getState().totalBudgetPct()).toBe(100)
    expect(useWizardStore.getState().canProceed()).toBe(true)

    // đẩy 1 dòng lên cao để tổng > 100
    useWizardStore.getState().setBudgetPct("Đầu tư", 50)
    expect(useWizardStore.getState().totalBudgetPct()).toBeGreaterThan(100)
    expect(useWizardStore.getState().canProceed()).toBe(false)
  })

  it("step 7: true tại boundary chính xác = 100", () => {
    useWizardStore.setState({ currentStep: 7 })
    expect(useWizardStore.getState().totalBudgetPct()).toBe(100)
    expect(useWizardStore.getState().canProceed()).toBe(true)
  })

  it.each([2, 5, 6])("step %i (optional): luôn true", (step) => {
    useWizardStore.setState({ currentStep: step })
    expect(useWizardStore.getState().canProceed()).toBe(true)
  })
})

describe("wizardStore.stepOrder()", () => {
  it("personal type: skip step 2 → [1,3,4,5,6,7]", () => {
    useWizardStore.getState().setHousehold("h1", "personal", "VND")
    expect(useWizardStore.getState().stepOrder()).toEqual([1, 3, 4, 5, 6, 7])
  })

  it("family type: full [1,2,3,4,5,6,7]", () => {
    useWizardStore.getState().setHousehold("h1", "family", "VND")
    expect(useWizardStore.getState().stepOrder()).toEqual([1, 2, 3, 4, 5, 6, 7])
  })
})

describe("wizardStore.totalSteps()", () => {
  it("personal: 6 steps", () => {
    useWizardStore.getState().setHousehold("h1", "personal", "VND")
    expect(useWizardStore.getState().totalSteps()).toBe(6)
  })

  it("family: 7 steps", () => {
    useWizardStore.getState().setHousehold("h1", "family", "VND")
    expect(useWizardStore.getState().totalSteps()).toBe(7)
  })

  it("default (householdType=null): 6 (non-family)", () => {
    expect(useWizardStore.getState().totalSteps()).toBe(6)
  })
})

describe("wizardStore.totalIncome()", () => {
  it("sum nhiều income sources", () => {
    useWizardStore
      .getState()
      .setIncomes([income(5_000_000, "i1"), income(3_000_000, "i2")])
    expect(useWizardStore.getState().totalIncome()).toBe(8_000_000)
  })

  it("incomes=[] → 0", () => {
    expect(useWizardStore.getState().totalIncome()).toBe(0)
  })
})

describe("wizardStore.debtPct()", () => {
  it("income 50tr + debt 4.2tr/tháng → 8.4%", () => {
    useWizardStore.getState().setIncomes([income(50_000_000)])
    useWizardStore.getState().setDebts([debt(4_200_000)])
    expect(useWizardStore.getState().debtPct()).toBeCloseTo(8.4, 5)
  })

  it("income=0 → 0 (guard chia cho 0)", () => {
    useWizardStore.getState().setIncomes([])
    useWizardStore.getState().setDebts([debt(4_200_000)])
    expect(useWizardStore.getState().debtPct()).toBe(0)
  })

  it("multiple debts: SUM(monthlyPayment) / income * 100", () => {
    useWizardStore.getState().setIncomes([income(40_000_000)])
    useWizardStore
      .getState()
      .setDebts([debt(2_000_000, "d1"), debt(2_000_000, "d2")])
    // (2tr + 2tr) / 40tr * 100 = 10
    expect(useWizardStore.getState().debtPct()).toBeCloseTo(10, 5)
  })

  it("no debts → 0", () => {
    useWizardStore.getState().setIncomes([income(50_000_000)])
    expect(useWizardStore.getState().debtPct()).toBe(0)
  })
})

describe("wizardStore.totalBudgetPct()", () => {
  it("init từ BUDGET_TEMPLATE → tổng = 100", () => {
    expect(useWizardStore.getState().totalBudgetPct()).toBe(100)
  })

  it("phản ánh thay đổi sau setBudgetPct", () => {
    const before = useWizardStore.getState().totalBudgetPct()
    // 'Đầu tư' template = 7 → set về 0 → tổng giảm đúng 7
    useWizardStore.getState().setBudgetPct("Đầu tư", 0)
    expect(useWizardStore.getState().totalBudgetPct()).toBe(before - 7)
  })

  it("sum = 0 khi reset hết tất cả về 0", () => {
    BUDGET_TEMPLATE.forEach((t) =>
      useWizardStore.getState().setBudgetPct(t.name, 0)
    )
    expect(useWizardStore.getState().totalBudgetPct()).toBe(0)
  })
})

describe("wizardStore.setDebts() auto-sync 'Chi trả nợ' (BR-BU-002)", () => {
  it("thêm debt → pct 'Chi trả nợ' = debtPct()", () => {
    useWizardStore.getState().setIncomes([income(50_000_000)])
    useWizardStore.getState().setDebts([debt(4_200_000)])

    const line = useWizardStore
      .getState()
      .budgetPcts.find((b) => b.name === DEBT_BUDGET_NAME)!
    expect(line.budgetPct).toBeCloseTo(8.4, 2)
  })

  it("pct được round về 2 chữ số thập phân", () => {
    // income 30tr, debt 1tr → 3.333...% → round 3.33
    useWizardStore.getState().setIncomes([income(30_000_000)])
    useWizardStore.getState().setDebts([debt(1_000_000)])

    const line = useWizardStore
      .getState()
      .budgetPcts.find((b) => b.name === DEBT_BUDGET_NAME)!
    expect(line.budgetPct).toBe(3.33)
  })

  it("xóa hết debts → restore về template default", () => {
    useWizardStore.getState().setIncomes([income(50_000_000)])
    useWizardStore.getState().setDebts([debt(4_200_000)])
    // confirm đã đổi
    expect(
      useWizardStore.getState().budgetPcts.find((b) => b.name === DEBT_BUDGET_NAME)!
        .budgetPct
    ).not.toBe(DEBT_TEMPLATE_PCT)

    useWizardStore.getState().setDebts([])
    expect(
      useWizardStore.getState().budgetPcts.find((b) => b.name === DEBT_BUDGET_NAME)!
        .budgetPct
    ).toBe(DEBT_TEMPLATE_PCT)
  })

  it("không ảnh hưởng các budget line khác", () => {
    const foodBefore = useWizardStore
      .getState()
      .budgetPcts.find((b) => b.name === "Thực phẩm & Ăn uống hàng ngày")!
      .budgetPct
    useWizardStore.getState().setIncomes([income(50_000_000)])
    useWizardStore.getState().setDebts([debt(4_200_000)])
    const foodAfter = useWizardStore
      .getState()
      .budgetPcts.find((b) => b.name === "Thực phẩm & Ăn uống hàng ngày")!
      .budgetPct
    expect(foodAfter).toBe(foodBefore)
  })
})

describe("wizardStore.next() navigation", () => {
  it("personal: 1 → 3 (skip 2)", () => {
    useWizardStore.getState().setHousehold("h1", "personal", "VND")
    useWizardStore.setState({ currentStep: 1 })
    useWizardStore.getState().next()
    expect(useWizardStore.getState().currentStep).toBe(3)
  })

  it("personal: chuỗi đầy đủ 1→3→4→5→6→7", () => {
    useWizardStore.getState().setHousehold("h1", "personal", "VND")
    useWizardStore.setState({ currentStep: 1 })
    const seen = [useWizardStore.getState().currentStep]
    for (let i = 0; i < 5; i++) {
      useWizardStore.getState().next()
      seen.push(useWizardStore.getState().currentStep)
    }
    expect(seen).toEqual([1, 3, 4, 5, 6, 7])
  })

  it("personal: next() ở step cuối (7) không vượt biên", () => {
    useWizardStore.getState().setHousehold("h1", "personal", "VND")
    useWizardStore.setState({ currentStep: 7 })
    useWizardStore.getState().next()
    expect(useWizardStore.getState().currentStep).toBe(7)
  })

  it("family: 1 → 2 (không skip)", () => {
    useWizardStore.getState().setHousehold("h1", "family", "VND")
    useWizardStore.setState({ currentStep: 1 })
    useWizardStore.getState().next()
    expect(useWizardStore.getState().currentStep).toBe(2)
  })

  it("family: chuỗi đầy đủ 1→2→3→4→5→6→7", () => {
    useWizardStore.getState().setHousehold("h1", "family", "VND")
    useWizardStore.setState({ currentStep: 1 })
    const seen = [useWizardStore.getState().currentStep]
    for (let i = 0; i < 6; i++) {
      useWizardStore.getState().next()
      seen.push(useWizardStore.getState().currentStep)
    }
    expect(seen).toEqual([1, 2, 3, 4, 5, 6, 7])
  })
})

describe("wizardStore.prev() navigation", () => {
  it("personal: 3 → 1 (skip 2)", () => {
    useWizardStore.getState().setHousehold("h1", "personal", "VND")
    useWizardStore.setState({ currentStep: 3 })
    useWizardStore.getState().prev()
    expect(useWizardStore.getState().currentStep).toBe(1)
  })

  it("prev() ở step đầu (1) không vượt biên", () => {
    useWizardStore.getState().setHousehold("h1", "personal", "VND")
    useWizardStore.setState({ currentStep: 1 })
    useWizardStore.getState().prev()
    expect(useWizardStore.getState().currentStep).toBe(1)
  })
})

describe("wizardStore.reset()", () => {
  it("clear tất cả về init state", () => {
    useWizardStore.getState().setHousehold("h1", "family", "USD")
    useWizardStore.getState().setIncomes([income(5_000_000)])
    useWizardStore.getState().setAccounts([account()])
    useWizardStore.getState().setDebts([debt(1_000_000)])
    useWizardStore.setState({ currentStep: 5 })

    useWizardStore.getState().reset()

    const s = useWizardStore.getState()
    expect(s.householdId).toBeNull()
    expect(s.householdType).toBeNull()
    expect(s.currency).toBe("VND")
    expect(s.currentStep).toBe(1)
    expect(s.incomes).toEqual([])
    expect(s.accounts).toEqual([])
    expect(s.debts).toEqual([])
    expect(s.totalBudgetPct()).toBe(100) // budgetPcts về template
  })
})
