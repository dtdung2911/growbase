import { describe, expect, it } from "vitest"
import {
  createDebtSchema,
  updateDebtSchema,
  paidOffDebtSchema,
} from "@growbase/shared/schemas/debt"

const UUID = "11111111-1111-1111-1111-111111111111"

const validCreate = {
  creditor_name: "Ngân hàng ABC",
  debt_type: "bank_loan" as const,
  total_amount: 100_000_000,
  monthly_payment: 5_000_000,
}

// ============================================================
// createDebtSchema
// ============================================================
describe("createDebtSchema", () => {
  it("accepts minimal valid input", () => {
    const r = createDebtSchema.safeParse(validCreate)
    expect(r.success).toBe(true)
  })

  it("accepts all valid debt_type values", () => {
    for (const t of ["bank_loan", "credit_card", "mortgage", "personal"]) {
      const r = createDebtSchema.safeParse({ ...validCreate, debt_type: t })
      expect(r.success).toBe(true)
    }
  })

  it("rejects invalid debt_type", () => {
    const r = createDebtSchema.safeParse({
      ...validCreate,
      debt_type: "shark_loan",
    })
    expect(r.success).toBe(false)
  })

  it("rejects empty creditor_name", () => {
    const r = createDebtSchema.safeParse({ ...validCreate, creditor_name: "" })
    expect(r.success).toBe(false)
  })

  it("rejects total_amount = 0", () => {
    const r = createDebtSchema.safeParse({ ...validCreate, total_amount: 0 })
    expect(r.success).toBe(false)
  })

  it("rejects negative total_amount", () => {
    const r = createDebtSchema.safeParse({ ...validCreate, total_amount: -1 })
    expect(r.success).toBe(false)
  })

  it("rejects monthly_payment = 0", () => {
    const r = createDebtSchema.safeParse({ ...validCreate, monthly_payment: 0 })
    expect(r.success).toBe(false)
  })

  it("rejects negative monthly_payment", () => {
    const r = createDebtSchema.safeParse({
      ...validCreate,
      monthly_payment: -500,
    })
    expect(r.success).toBe(false)
  })

  it("accepts optional remaining_amount", () => {
    const r = createDebtSchema.safeParse({
      ...validCreate,
      remaining_amount: 50_000_000,
    })
    expect(r.success).toBe(true)
  })

  it("accepts remaining_amount = 0 (nonnegative)", () => {
    const r = createDebtSchema.safeParse({
      ...validCreate,
      remaining_amount: 0,
    })
    expect(r.success).toBe(true)
  })

  it("rejects negative remaining_amount", () => {
    const r = createDebtSchema.safeParse({
      ...validCreate,
      remaining_amount: -1,
    })
    expect(r.success).toBe(false)
  })

  it("accepts optional interest_rate", () => {
    const r = createDebtSchema.safeParse({
      ...validCreate,
      interest_rate: 12.5,
    })
    expect(r.success).toBe(true)
  })

  it("accepts interest_rate = 0", () => {
    const r = createDebtSchema.safeParse({
      ...validCreate,
      interest_rate: 0,
    })
    expect(r.success).toBe(true)
  })

  it("rejects interest_rate > 100", () => {
    const r = createDebtSchema.safeParse({
      ...validCreate,
      interest_rate: 101,
    })
    expect(r.success).toBe(false)
  })

  it("rejects negative interest_rate", () => {
    const r = createDebtSchema.safeParse({
      ...validCreate,
      interest_rate: -1,
    })
    expect(r.success).toBe(false)
  })

  it("accepts optional member_id as uuid", () => {
    const r = createDebtSchema.safeParse({
      ...validCreate,
      member_id: UUID,
    })
    expect(r.success).toBe(true)
  })

  it("rejects non-uuid member_id", () => {
    const r = createDebtSchema.safeParse({
      ...validCreate,
      member_id: "bad",
    })
    expect(r.success).toBe(false)
  })

  it("accepts optional notes", () => {
    const r = createDebtSchema.safeParse({
      ...validCreate,
      notes: "Trả trước hạn",
    })
    expect(r.success).toBe(true)
  })
})

// ============================================================
// updateDebtSchema
// ============================================================
describe("updateDebtSchema", () => {
  it("accepts empty object (all partial)", () => {
    const r = updateDebtSchema.safeParse({})
    expect(r.success).toBe(true)
  })

  it("accepts partial creditor_name update", () => {
    const r = updateDebtSchema.safeParse({ creditor_name: "Mới" })
    expect(r.success).toBe(true)
  })

  it("accepts partial monthly_payment update", () => {
    const r = updateDebtSchema.safeParse({ monthly_payment: 3_000_000 })
    expect(r.success).toBe(true)
  })

  it("rejects invalid debt_type in partial", () => {
    const r = updateDebtSchema.safeParse({ debt_type: "unknown" })
    expect(r.success).toBe(false)
  })
})

// ============================================================
// paidOffDebtSchema
// ============================================================
describe("paidOffDebtSchema", () => {
  it("accepts valid uuid", () => {
    const r = paidOffDebtSchema.safeParse({ id: UUID })
    expect(r.success).toBe(true)
  })

  it("rejects non-uuid id", () => {
    const r = paidOffDebtSchema.safeParse({ id: "not-uuid" })
    expect(r.success).toBe(false)
  })

  it("rejects missing id", () => {
    const r = paidOffDebtSchema.safeParse({})
    expect(r.success).toBe(false)
  })
})
