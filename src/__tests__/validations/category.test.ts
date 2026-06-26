import { describe, expect, it } from "vitest"
import {
  createCategorySchema,
  updateCategorySchema,
} from "@/lib/validations/category"

const UUID = "11111111-1111-1111-1111-111111111111"

const validCreate = {
  name: "Ăn uống",
  group_id: UUID,
  default_behavior_type: "variable" as const,
}

// ============================================================
// createCategorySchema
// ============================================================
describe("createCategorySchema", () => {
  it("accepts minimal valid input", () => {
    const r = createCategorySchema.safeParse(validCreate)
    expect(r.success).toBe(true)
  })

  it("accepts all valid behavior_type values", () => {
    for (const t of [
      "fixed",
      "variable",
      "wasteful",
      "debt_repayment",
      "savings_investment",
    ]) {
      const r = createCategorySchema.safeParse({
        ...validCreate,
        default_behavior_type: t,
      })
      expect(r.success).toBe(true)
    }
  })

  it("rejects invalid behavior_type", () => {
    const r = createCategorySchema.safeParse({
      ...validCreate,
      default_behavior_type: "unknown",
    })
    expect(r.success).toBe(false)
  })

  it("rejects empty name", () => {
    const r = createCategorySchema.safeParse({ ...validCreate, name: "" })
    expect(r.success).toBe(false)
  })

  it("rejects name longer than 100 chars", () => {
    const r = createCategorySchema.safeParse({
      ...validCreate,
      name: "a".repeat(101),
    })
    expect(r.success).toBe(false)
  })

  it("accepts name at 100 chars", () => {
    const r = createCategorySchema.safeParse({
      ...validCreate,
      name: "a".repeat(100),
    })
    expect(r.success).toBe(true)
  })

  it("rejects non-uuid group_id", () => {
    const r = createCategorySchema.safeParse({
      ...validCreate,
      group_id: "not-uuid",
    })
    expect(r.success).toBe(false)
  })

  it("accepts optional icon", () => {
    const r = createCategorySchema.safeParse({
      ...validCreate,
      icon: "🍔",
    })
    expect(r.success).toBe(true)
  })

  it("accepts missing icon", () => {
    const r = createCategorySchema.safeParse(validCreate)
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.icon).toBeUndefined()
  })
})

// ============================================================
// updateCategorySchema
// ============================================================
describe("updateCategorySchema", () => {
  it("accepts empty object (all optional)", () => {
    const r = updateCategorySchema.safeParse({})
    expect(r.success).toBe(true)
  })

  it("accepts partial name update", () => {
    const r = updateCategorySchema.safeParse({ name: "Mới" })
    expect(r.success).toBe(true)
  })

  it("rejects empty name when provided", () => {
    const r = updateCategorySchema.safeParse({ name: "" })
    expect(r.success).toBe(false)
  })

  it("accepts is_active boolean", () => {
    const r = updateCategorySchema.safeParse({ is_active: false })
    expect(r.success).toBe(true)
  })

  it("rejects non-boolean is_active", () => {
    const r = updateCategorySchema.safeParse({ is_active: "yes" })
    expect(r.success).toBe(false)
  })

  it("accepts icon update", () => {
    const r = updateCategorySchema.safeParse({ icon: "📦" })
    expect(r.success).toBe(true)
  })
})
