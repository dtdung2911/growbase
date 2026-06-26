import { describe, expect, it } from "vitest"
import {
  createEstimatedExpenseSchema,
  updateEstimatedExpenseSchema,
} from "@/lib/validations/estimated-expense"

const UUID = "11111111-1111-1111-1111-111111111111"

const validCreate = {
  name: "Sửa nhà",
  estimated_amount: 50_000_000,
}

// ============================================================
// createEstimatedExpenseSchema
// ============================================================
describe("createEstimatedExpenseSchema", () => {
  it("accepts minimal valid input", () => {
    const r = createEstimatedExpenseSchema.safeParse(validCreate)
    expect(r.success).toBe(true)
  })

  it("rejects empty name", () => {
    const r = createEstimatedExpenseSchema.safeParse({
      ...validCreate,
      name: "",
    })
    expect(r.success).toBe(false)
  })

  it("rejects estimated_amount = 0", () => {
    const r = createEstimatedExpenseSchema.safeParse({
      ...validCreate,
      estimated_amount: 0,
    })
    expect(r.success).toBe(false)
  })

  it("rejects negative estimated_amount", () => {
    const r = createEstimatedExpenseSchema.safeParse({
      ...validCreate,
      estimated_amount: -1,
    })
    expect(r.success).toBe(false)
  })

  it("accepts optional category_id as uuid", () => {
    const r = createEstimatedExpenseSchema.safeParse({
      ...validCreate,
      category_id: UUID,
    })
    expect(r.success).toBe(true)
  })

  it("rejects non-uuid category_id", () => {
    const r = createEstimatedExpenseSchema.safeParse({
      ...validCreate,
      category_id: "bad",
    })
    expect(r.success).toBe(false)
  })

  it("accepts optional linked_fund_id as uuid", () => {
    const r = createEstimatedExpenseSchema.safeParse({
      ...validCreate,
      linked_fund_id: UUID,
    })
    expect(r.success).toBe(true)
  })

  it("rejects non-uuid linked_fund_id", () => {
    const r = createEstimatedExpenseSchema.safeParse({
      ...validCreate,
      linked_fund_id: "not-a-uuid",
    })
    expect(r.success).toBe(false)
  })

  it("accepts optional target_date", () => {
    const r = createEstimatedExpenseSchema.safeParse({
      ...validCreate,
      target_date: "2025-12-31",
    })
    expect(r.success).toBe(true)
  })

  it("accepts optional notes", () => {
    const r = createEstimatedExpenseSchema.safeParse({
      ...validCreate,
      notes: "Cần hoàn thành trước Tết",
    })
    expect(r.success).toBe(true)
  })
})

// ============================================================
// updateEstimatedExpenseSchema
// ============================================================
describe("updateEstimatedExpenseSchema", () => {
  it("accepts empty object (all optional)", () => {
    const r = updateEstimatedExpenseSchema.safeParse({})
    expect(r.success).toBe(true)
  })

  it("accepts partial name update", () => {
    const r = updateEstimatedExpenseSchema.safeParse({ name: "Mua xe" })
    expect(r.success).toBe(true)
  })

  it("rejects empty name when provided", () => {
    const r = updateEstimatedExpenseSchema.safeParse({ name: "" })
    expect(r.success).toBe(false)
  })

  it("accepts all valid status values", () => {
    for (const s of ["planned", "completed", "cancelled"]) {
      const r = updateEstimatedExpenseSchema.safeParse({ status: s })
      expect(r.success).toBe(true)
    }
  })

  it("rejects invalid status", () => {
    const r = updateEstimatedExpenseSchema.safeParse({ status: "pending" })
    expect(r.success).toBe(false)
  })

  it("accepts actual_amount = 0 (nonnegative)", () => {
    const r = updateEstimatedExpenseSchema.safeParse({ actual_amount: 0 })
    expect(r.success).toBe(true)
  })

  it("accepts actual_amount = null", () => {
    const r = updateEstimatedExpenseSchema.safeParse({ actual_amount: null })
    expect(r.success).toBe(true)
  })

  it("rejects negative actual_amount", () => {
    const r = updateEstimatedExpenseSchema.safeParse({ actual_amount: -1 })
    expect(r.success).toBe(false)
  })

  it("accepts target_date = null", () => {
    const r = updateEstimatedExpenseSchema.safeParse({ target_date: null })
    expect(r.success).toBe(true)
  })

  it("accepts notes = null", () => {
    const r = updateEstimatedExpenseSchema.safeParse({ notes: null })
    expect(r.success).toBe(true)
  })
})
