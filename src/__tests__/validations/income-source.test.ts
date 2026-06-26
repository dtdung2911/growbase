import { describe, expect, it } from "vitest"
import {
  createIncomeSourceSchema,
  updateIncomeSourceSchema,
} from "@/lib/validations/income-source"

const UUID = "11111111-1111-1111-1111-111111111111"

const validCreate = {
  source_name: "Lương chính",
  monthly_amount: 25_000_000,
}

// ============================================================
// createIncomeSourceSchema
// ============================================================
describe("createIncomeSourceSchema", () => {
  it("accepts minimal valid input", () => {
    const r = createIncomeSourceSchema.safeParse(validCreate)
    expect(r.success).toBe(true)
  })

  it("rejects empty source_name", () => {
    const r = createIncomeSourceSchema.safeParse({
      ...validCreate,
      source_name: "",
    })
    expect(r.success).toBe(false)
  })

  it("rejects monthly_amount = 0", () => {
    const r = createIncomeSourceSchema.safeParse({
      ...validCreate,
      monthly_amount: 0,
    })
    expect(r.success).toBe(false)
  })

  it("rejects negative monthly_amount", () => {
    const r = createIncomeSourceSchema.safeParse({
      ...validCreate,
      monthly_amount: -1,
    })
    expect(r.success).toBe(false)
  })

  it("accepts optional member_id as uuid", () => {
    const r = createIncomeSourceSchema.safeParse({
      ...validCreate,
      member_id: UUID,
    })
    expect(r.success).toBe(true)
  })

  it("rejects non-uuid member_id", () => {
    const r = createIncomeSourceSchema.safeParse({
      ...validCreate,
      member_id: "bad",
    })
    expect(r.success).toBe(false)
  })

  it("accepts missing member_id", () => {
    const r = createIncomeSourceSchema.safeParse(validCreate)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.member_id).toBeUndefined()
  })
})

// ============================================================
// updateIncomeSourceSchema
// ============================================================
describe("updateIncomeSourceSchema", () => {
  it("accepts valid monthly_amount", () => {
    const r = updateIncomeSourceSchema.safeParse({ monthly_amount: 30_000_000 })
    expect(r.success).toBe(true)
  })

  it("rejects monthly_amount = 0", () => {
    const r = updateIncomeSourceSchema.safeParse({ monthly_amount: 0 })
    expect(r.success).toBe(false)
  })

  it("rejects negative monthly_amount", () => {
    const r = updateIncomeSourceSchema.safeParse({ monthly_amount: -1 })
    expect(r.success).toBe(false)
  })

  it("rejects missing monthly_amount", () => {
    const r = updateIncomeSourceSchema.safeParse({})
    expect(r.success).toBe(false)
  })
})
