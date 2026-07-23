import { describe, expect, it } from "vitest"
import {
  createTransactionSchema,
  updateTransactionSchema,
  createTransferSchema,
} from "@growbase/shared/schemas/transaction"

const UUID = "11111111-1111-1111-1111-111111111111"
const UUID2 = "22222222-2222-2222-2222-222222222222"

// --- valid fixtures ---
const validCreate = {
  amount: 500_000,
  direction: "out" as const,
  category_id: UUID,
  account_id: UUID2,
}

const validTransfer = {
  from_account_id: UUID,
  to_account_id: UUID2,
  amount: 1_000_000,
}

// ============================================================
// createTransactionSchema
// ============================================================
describe("createTransactionSchema", () => {
  it("accepts minimal valid input", () => {
    const r = createTransactionSchema.safeParse(validCreate)
    expect(r.success).toBe(true)
  })

  it("defaults transaction_type to 'expense'", () => {
    const r = createTransactionSchema.safeParse(validCreate)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.transaction_type).toBe("expense")
  })

  it("defaults is_unusual_income to false", () => {
    const r = createTransactionSchema.safeParse(validCreate)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.is_unusual_income).toBe(false)
  })

  it("defaults transaction_date to today", () => {
    const r = createTransactionSchema.safeParse(validCreate)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.transaction_date).toMatch(/^\d{4}-\d{2}-\d{2}(T.*)?$/)
    }
  })

  it("accepts all valid transaction_type values", () => {
    for (const t of ["income", "expense", "debt_repayment"]) {
      const r = createTransactionSchema.safeParse({
        ...validCreate,
        transaction_type: t,
      })
      expect(r.success).toBe(true)
    }
  })

  it("rejects invalid transaction_type", () => {
    const r = createTransactionSchema.safeParse({
      ...validCreate,
      transaction_type: "fund_contribution",
    })
    expect(r.success).toBe(false)
  })

  it("rejects amount = 0", () => {
    const r = createTransactionSchema.safeParse({ ...validCreate, amount: 0 })
    expect(r.success).toBe(false)
  })

  it("rejects negative amount", () => {
    const r = createTransactionSchema.safeParse({ ...validCreate, amount: -100 })
    expect(r.success).toBe(false)
  })

  it("rejects invalid direction", () => {
    const r = createTransactionSchema.safeParse({
      ...validCreate,
      direction: "both",
    })
    expect(r.success).toBe(false)
  })

  it("rejects non-uuid category_id", () => {
    const r = createTransactionSchema.safeParse({
      ...validCreate,
      category_id: "not-uuid",
    })
    expect(r.success).toBe(false)
  })

  it("rejects non-uuid account_id", () => {
    const r = createTransactionSchema.safeParse({
      ...validCreate,
      account_id: "bad",
    })
    expect(r.success).toBe(false)
  })

  it("accepts optional description", () => {
    const r = createTransactionSchema.safeParse({
      ...validCreate,
      description: "Lunch",
    })
    expect(r.success).toBe(true)
  })

  it("accepts nullable debt_entry_id", () => {
    const r = createTransactionSchema.safeParse({
      ...validCreate,
      debt_entry_id: null,
    })
    expect(r.success).toBe(true)
  })

  it("accepts valid uuid debt_entry_id", () => {
    const r = createTransactionSchema.safeParse({
      ...validCreate,
      debt_entry_id: UUID,
    })
    expect(r.success).toBe(true)
  })
})

// ============================================================
// updateTransactionSchema
// ============================================================
describe("updateTransactionSchema", () => {
  it("requires id field as uuid", () => {
    const r = updateTransactionSchema.safeParse({
      ...validCreate,
      id: UUID,
    })
    expect(r.success).toBe(true)
  })

  it("rejects missing id", () => {
    const r = updateTransactionSchema.safeParse(validCreate)
    expect(r.success).toBe(false)
  })

  it("rejects non-uuid id", () => {
    const r = updateTransactionSchema.safeParse({
      ...validCreate,
      id: "not-uuid",
    })
    expect(r.success).toBe(false)
  })
})

// ============================================================
// createTransferSchema
// ============================================================
describe("createTransferSchema", () => {
  it("accepts valid transfer", () => {
    const r = createTransferSchema.safeParse(validTransfer)
    expect(r.success).toBe(true)
  })

  it("defaults is_credit_card_payment to false", () => {
    const r = createTransferSchema.safeParse(validTransfer)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.is_credit_card_payment).toBe(false)
  })

  it("defaults transaction_date to today", () => {
    const r = createTransferSchema.safeParse(validTransfer)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.transaction_date).toMatch(/^\d{4}-\d{2}-\d{2}(T.*)?$/)
    }
  })

  it("rejects same from and to account", () => {
    const r = createTransferSchema.safeParse({
      ...validTransfer,
      to_account_id: UUID,
    })
    expect(r.success).toBe(false)
    if (!r.success) {
      expect(r.error.issues[0].path).toContain("to_account_id")
    }
  })

  it("rejects amount = 0", () => {
    const r = createTransferSchema.safeParse({ ...validTransfer, amount: 0 })
    expect(r.success).toBe(false)
  })

  it("rejects negative amount", () => {
    const r = createTransferSchema.safeParse({ ...validTransfer, amount: -1 })
    expect(r.success).toBe(false)
  })

  it("rejects non-uuid from_account_id", () => {
    const r = createTransferSchema.safeParse({
      ...validTransfer,
      from_account_id: "bad",
    })
    expect(r.success).toBe(false)
  })

  it("rejects non-uuid to_account_id", () => {
    const r = createTransferSchema.safeParse({
      ...validTransfer,
      to_account_id: "bad",
    })
    expect(r.success).toBe(false)
  })

  it("accepts optional description", () => {
    const r = createTransferSchema.safeParse({
      ...validTransfer,
      description: "Pay credit card",
    })
    expect(r.success).toBe(true)
  })

  it("accepts is_credit_card_payment = true", () => {
    const r = createTransferSchema.safeParse({
      ...validTransfer,
      is_credit_card_payment: true,
    })
    expect(r.success).toBe(true)
  })
})
