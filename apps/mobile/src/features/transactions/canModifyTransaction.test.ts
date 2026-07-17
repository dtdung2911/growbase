import type { TransactionWithJoins } from "@growbase/shared/types/app"
import { describe, expect, it } from "vitest"
import { canModifyTransaction } from "@/features/transactions/canModifyTransaction"

function makeTx(overrides: Partial<TransactionWithJoins> = {}): TransactionWithJoins {
  return {
    id: "t1",
    household_id: "h1",
    member_id: "m1",
    amount: 1000,
    direction: "out",
    transaction_type: "expense",
    category_id: "c1",
    account_id: "a1",
    fund_id: null,
    debt_entry_id: null,
    behavior_type: null,
    is_unusual_income: false,
    exclude_from_budget_report: false,
    description: null,
    transaction_date: "2026-07-10",
    created_at: "2026-07-10T00:00:00Z",
    updated_at: "2026-07-10T00:00:00Z",
    category: null,
    account: null,
    ...overrides,
  }
}

describe("canModifyTransaction", () => {
  const month = "2026-07"

  it("allows own, current-month, non-system transactions", () => {
    expect(canModifyTransaction(makeTx(), "m1", month)).toBe(true)
  })

  it("rejects when memberId is null", () => {
    expect(canModifyTransaction(makeTx(), null, month)).toBe(false)
  })

  it("rejects another member's transaction", () => {
    expect(canModifyTransaction(makeTx({ member_id: "m2" }), "m1", month)).toBe(false)
  })

  it("rejects a transaction outside the current month", () => {
    expect(canModifyTransaction(makeTx({ transaction_date: "2026-06-30" }), "m1", month)).toBe(false)
  })

  it.each(["internal_transfer", "fund_contribution", "fund_withdrawal"] as const)(
    "rejects system-generated type %s",
    (type) => {
      expect(canModifyTransaction(makeTx({ transaction_type: type }), "m1", month)).toBe(false)
    },
  )

  it.each(["income", "expense", "debt_repayment"] as const)(
    "allows editable type %s",
    (type) => {
      expect(canModifyTransaction(makeTx({ transaction_type: type }), "m1", month)).toBe(true)
    },
  )
})
