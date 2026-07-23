import { describe, expect, it } from "vitest"
import {
  fundContributeSchema,
  fundWithdrawSchema,
  updateFundSchema,
} from "@growbase/shared/schemas/fund"

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
  description: "Chi tiêu khẩn cấp",
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
      expect(r.data.transaction_date).toMatch(/^\d{4}-\d{2}-\d{2}(T.*)?$/)
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
      expect(r.data.transaction_date).toMatch(/^\d{4}-\d{2}-\d{2}(T.*)?$/)
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

  it("accepts a non-empty description and trims it", () => {
    const r = fundWithdrawSchema.safeParse({
      ...validWithdraw,
      description: "  Emergency expense  ",
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.description).toBe("Emergency expense")
  })

  it("rejects missing description (now required)", () => {
    const r = fundWithdrawSchema.safeParse({
      amount: 500_000,
      account_id: UUID,
      category_id: UUID2,
    })
    expect(r.success).toBe(false)
  })

  it("rejects empty description", () => {
    const r = fundWithdrawSchema.safeParse({ ...validWithdraw, description: "" })
    expect(r.success).toBe(false)
  })

  it("rejects whitespace-only description", () => {
    const r = fundWithdrawSchema.safeParse({
      ...validWithdraw,
      description: "   ",
    })
    expect(r.success).toBe(false)
  })

  it("rejects description longer than 200 chars", () => {
    const r = fundWithdrawSchema.safeParse({
      ...validWithdraw,
      description: "x".repeat(201),
    })
    expect(r.success).toBe(false)
  })

  it("accepts description at the 200-char boundary", () => {
    const r = fundWithdrawSchema.safeParse({
      ...validWithdraw,
      description: "x".repeat(200),
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

  it("rejects non-integer months", () => {
    expect(updateFundSchema.safeParse({ target_months_expense: 6.5 }).success).toBe(false)
  })

  it("allows null and omission (field is optional)", () => {
    expect(updateFundSchema.safeParse({ target_months_expense: null }).success).toBe(true)
    expect(updateFundSchema.safeParse({}).success).toBe(true)
  })
})

describe("updateFundSchema icon", () => {
  it("accepts valid iconify names including legacy lucide", () => {
    expect(updateFundSchema.safeParse({ icon: "lucide:shield" }).success).toBe(true)
    expect(updateFundSchema.safeParse({ icon: "ph:car-duotone" }).success).toBe(true)
  })

  it("rejects malformed icon (no collection prefix)", () => {
    expect(updateFundSchema.safeParse({ icon: "shield" }).success).toBe(false)
    expect(updateFundSchema.safeParse({ icon: "Lucide:Shield" }).success).toBe(false)
  })

  it("rejects icon longer than 120 chars", () => {
    const long = `ph:${"a".repeat(200)}`
    expect(updateFundSchema.safeParse({ icon: long }).success).toBe(false)
  })
})

describe("updateFundSchema priority_rank", () => {
  it("accepts integer >= 1", () => {
    expect(updateFundSchema.safeParse({ priority_rank: 1 }).success).toBe(true)
    expect(updateFundSchema.safeParse({ priority_rank: 5 }).success).toBe(true)
  })

  it("rejects < 1, non-integer, and negatives", () => {
    expect(updateFundSchema.safeParse({ priority_rank: 0 }).success).toBe(false)
    expect(updateFundSchema.safeParse({ priority_rank: -2 }).success).toBe(false)
    expect(updateFundSchema.safeParse({ priority_rank: 1.5 }).success).toBe(false)
  })

  it("is optional (omission allowed)", () => {
    expect(updateFundSchema.safeParse({}).success).toBe(true)
  })
})

describe("updateFundSchema name", () => {
  it("trims surrounding whitespace", () => {
    const r = updateFundSchema.safeParse({ name: "  Quỹ dự phòng  " })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.name).toBe("Quỹ dự phòng")
  })

  it("rejects whitespace-only name", () => {
    expect(updateFundSchema.safeParse({ name: "   " }).success).toBe(false)
  })
})
