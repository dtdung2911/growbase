import { beforeEach, describe, expect, it, vi } from "vitest"
// localStorage cung cấp bởi setupFiles (src/__tests__/setup/localStorage.ts)
import { useWizardStore } from "@/lib/stores/wizardStore"
import type { DebtDraft, IncomeDraft } from "@/types/app"

const DEBT_BUDGET_NAME = "Chi trả nợ"

const income = (monthlyAmount: number): IncomeDraft => ({
  id: "i1",
  sourceName: "Lương",
  monthlyAmount,
})
const debt = (monthlyPayment: number, id = "d1"): DebtDraft => ({
  id,
  creditorName: "NH",
  debtType: "bank_loan",
  totalAmount: 0,
  monthlyPayment,
})

beforeEach(() => {
  localStorage.clear()
  useWizardStore.getState().reset()
})

describe("Regression: debt step KHÔNG INSERT sớm (chỉ update store)", () => {
  // Bug history: nghi ngờ step 5 (Debt) gọi API/INSERT khi nhập debt.
  // Đúng: setDebts() là pure store mutation, complete_onboarding mới persist.
  it("setDebts() không trigger fetch (network call)", () => {
    // spy fetch tạm thời, restore ngay sau — KHÔNG dùng unstubAllGlobals
    // để tránh xoá localStorage stub mà persist middleware cần.
    const fetchSpy = vi.fn()
    const prevFetch = (globalThis as { fetch?: unknown }).fetch
    ;(globalThis as { fetch?: unknown }).fetch = fetchSpy
    try {
      useWizardStore.getState().setIncomes([income(50_000_000)])
      useWizardStore.getState().setDebts([debt(4_200_000)])
      expect(fetchSpy).not.toHaveBeenCalled()
    } finally {
      ;(globalThis as { fetch?: unknown }).fetch = prevFetch
    }
  })

  it("setDebts() chỉ thay đổi store.debts (state mutation thuần)", () => {
    useWizardStore.getState().setIncomes([income(50_000_000)])
    const debts = [debt(4_200_000)]
    useWizardStore.getState().setDebts(debts)
    expect(useWizardStore.getState().debts).toEqual(debts)
  })
})

describe("Regression: 'Chi trả nợ' lock khi debts > 0 (BR-BU-002)", () => {
  it("sau setDebts, pct 'Chi trả nợ' khớp chính xác debtPct()", () => {
    useWizardStore.getState().setIncomes([income(50_000_000)])
    useWizardStore.getState().setDebts([debt(4_200_000)])

    const expected = Math.round(useWizardStore.getState().debtPct() * 100) / 100
    const actual = useWizardStore
      .getState()
      .budgetPcts.find((b) => b.name === DEBT_BUDGET_NAME)!.budgetPct

    expect(actual).toBe(expected)
  })

  it("cập nhật lại khi debts thay đổi (thêm debt thứ 2)", () => {
    useWizardStore.getState().setIncomes([income(50_000_000)])
    useWizardStore.getState().setDebts([debt(2_000_000, "d1")])
    const after1 = useWizardStore
      .getState()
      .budgetPcts.find((b) => b.name === DEBT_BUDGET_NAME)!.budgetPct

    useWizardStore
      .getState()
      .setDebts([debt(2_000_000, "d1"), debt(2_000_000, "d2")])
    const after2 = useWizardStore
      .getState()
      .budgetPcts.find((b) => b.name === DEBT_BUDGET_NAME)!.budgetPct

    expect(after2).toBeGreaterThan(after1)
    expect(after2).toBe(
      Math.round(useWizardStore.getState().debtPct() * 100) / 100
    )
  })
})
