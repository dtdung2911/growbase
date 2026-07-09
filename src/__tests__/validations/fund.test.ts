import { describe, expect, it } from "vitest"
import {
  fundContributeSchema,
  fundWithdrawSchema,
  updateFundSchema,
} from "@/lib/validations/fund"

const UUID = "11111111-1111-1111-1111-111111111111"
const UUID2 = "22222222-2222-2222-2222-222222222222"

// --- valid fixtures ---
const validContribute = {
  amount: 1_000_000,
  account_id: UUID,
}

const validWithdraw = {
  amount: 500_000,
  account_id: UUID,
  category_id: UUID2,
}

// ============================================================
// fundContributeSchema
// ============================================================
describe("fundContributeSchema", () => {
  it("accepts minimal valid input", () => {
    const r = fundContributeSchema.safeParse(validContribute)
    expect(r.success).toBe(true)
  })

  it("defaults transaction_date to today", () => {
    const r = fundContributeSchema.safeParse(validContribute)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.transaction_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it("accepts optional description", () => {
    const r = fundContributeSchema.safeParse({
      ...validContribute,
      description: "Monthly savings",
    })
    expect(r.success).toBe(true)
  })

  it("rejects amount = 0", () => {
    const r = fundContributeSchema.safeParse({ ...validContribute, amount: 0 })
    expect(r.success).toBe(false)
  })

  it("rejects negative amount", () => {
    const r = fundContributeSchema.safeParse({
      ...validContribute,
      amount: -100,
    })
    expect(r.success).toBe(false)
  })

  it("rejects non-uuid account_id", () => {
    const r = fundContributeSchema.safeParse({
      ...validContribute,
      account_id: "not-a-uuid",
    })
    expect(r.success).toBe(false)
  })

  it("rejects missing account_id", () => {
    const r = fundContributeSchema.safeParse({ amount: 1_000_000 })
    expect(r.success).toBe(false)
  })

  it("rejects missing amount", () => {
    const r = fundContributeSchema.safeParse({ account_id: UUID })
    expect(r.success).toBe(false)
  })

  it("accepts custom transaction_date", () => {
    const r = fundContributeSchema.safeParse({
      ...validContribute,
      transaction_date: "2025-06-15",
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.transaction_date).toBe("2025-06-15")
  })
})

// ============================================================
// fundWithdrawSchema
// ============================================================
describe("fundWithdrawSchema", () => {
  it("accepts minimal valid input", () => {
    const r = fundWithdrawSchema.safeParse(validWithdraw)
    expect(r.success).toBe(true)
  })

  it("defaults transaction_date to today", () => {
    const r = fundWithdrawSchema.safeParse(validWithdraw)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.transaction_date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  it("requires category_id (unlike contribute)", () => {
    const r = fundWithdrawSchema.safeParse({
      amount: 500_000,
      account_id: UUID,
    })
    expect(r.success).toBe(false)
  })

  it("rejects non-uuid category_id", () => {
    const r = fundWithdrawSchema.safeParse({
      ...validWithdraw,
      category_id: "bad",
    })
    expect(r.success).toBe(false)
  })

  it("rejects amount = 0", () => {
    const r = fundWithdrawSchema.safeParse({ ...validWithdraw, amount: 0 })
    expect(r.success).toBe(false)
  })

  it("rejects negative amount", () => {
    const r = fundWithdrawSchema.safeParse({ ...validWithdraw, amount: -1 })
    expect(r.success).toBe(false)
  })

  it("rejects non-uuid account_id", () => {
    const r = fundWithdrawSchema.safeParse({
      ...validWithdraw,
      account_id: "bad-id",
    })
    expect(r.success).toBe(false)
  })

  it("accepts optional description", () => {
    const r = fundWithdrawSchema.safeParse({
      ...validWithdraw,
      description: "Emergency expense",
    })
    expect(r.success).toBe(true)
  })

  it("accepts large amount", () => {
    const r = fundWithdrawSchema.safeParse({
      ...validWithdraw,
      amount: 999_999_999_999,
    })
    expect(r.success).toBe(true)
  })
})

describe("updateFundSchema target_months_expense", () => {
  it("accepts an integer within [1, 24]", () => {
    expect(updateFundSchema.safeParse({ target_months_expense: 6 }).success).toBe(true)
    expect(updateFundSchema.safeParse({ target_months_expense: 1 }).success).toBe(true)
    expect(updateFundSchema.safeParse({ target_months_expense: 24 }).success).toBe(true)
  })

  it("rejects values below 1 or above 24", () => {
    expect(updateFundSchema.safeParse({ target_months_expense: 0 }).success).toBe(false)
    expect(updateFundSchema.safeParse({ target_months_expense: 25 }).success).toBe(false)
  })

  it("allows null and omission (field is optional)", () => {
    expect(updateFundSchema.safeParse({ target_months_expense: null }).success).toBe(true)
    expect(updateFundSchema.safeParse({}).success).toBe(true)
  })

  it("keeps icon as a free string (no enum whitelist)", () => {
    expect(updateFundSchema.safeParse({ icon: "lucide:piggy-bank" }).success).toBe(true)
    expect(updateFundSchema.safeParse({ icon: "ph:car-duotone" }).success).toBe(true)
  })
})
