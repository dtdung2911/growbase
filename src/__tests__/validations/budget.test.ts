import { describe, expect, it } from "vitest"
import {
  budgetOverrideSchema,
  budgetOverrideDeleteSchema,
} from "@/lib/validations/budget"

const UUID = "11111111-1111-1111-1111-111111111111"

// --- valid fixtures ---
const validOverride = {
  budget_baseline_id: UUID,
  month: "2025-06-01",
  override_pct: 30,
}

const validDelete = {
  budget_baseline_id: UUID,
  month: "2025-06-01",
}

// ============================================================
// budgetOverrideSchema
// ============================================================
describe("budgetOverrideSchema", () => {
  it("accepts valid override input", () => {
    const r = budgetOverrideSchema.safeParse(validOverride)
    expect(r.success).toBe(true)
  })

  it("accepts override_pct = 0", () => {
    const r = budgetOverrideSchema.safeParse({ ...validOverride, override_pct: 0 })
    expect(r.success).toBe(true)
  })

  it("accepts override_pct = 100", () => {
    const r = budgetOverrideSchema.safeParse({ ...validOverride, override_pct: 100 })
    expect(r.success).toBe(true)
  })

  it("rejects override_pct > 100", () => {
    const r = budgetOverrideSchema.safeParse({ ...validOverride, override_pct: 101 })
    expect(r.success).toBe(false)
  })

  it("rejects negative override_pct", () => {
    const r = budgetOverrideSchema.safeParse({ ...validOverride, override_pct: -1 })
    expect(r.success).toBe(false)
  })

  it("rejects non-uuid budget_baseline_id", () => {
    const r = budgetOverrideSchema.safeParse({
      ...validOverride,
      budget_baseline_id: "not-uuid",
    })
    expect(r.success).toBe(false)
  })

  it("rejects empty month", () => {
    const r = budgetOverrideSchema.safeParse({ ...validOverride, month: "" })
    expect(r.success).toBe(false)
  })

  it("rejects missing budget_baseline_id", () => {
    const r = budgetOverrideSchema.safeParse({
      month: "2025-06-01",
      override_pct: 30,
    })
    expect(r.success).toBe(false)
  })

  it("rejects missing override_pct", () => {
    const r = budgetOverrideSchema.safeParse({
      budget_baseline_id: UUID,
      month: "2025-06-01",
    })
    expect(r.success).toBe(false)
  })

  it("rejects string override_pct", () => {
    const r = budgetOverrideSchema.safeParse({
      ...validOverride,
      override_pct: "thirty",
    })
    expect(r.success).toBe(false)
  })
})

// ============================================================
// budgetOverrideDeleteSchema
// ============================================================
describe("budgetOverrideDeleteSchema", () => {
  it("accepts valid delete input", () => {
    const r = budgetOverrideDeleteSchema.safeParse(validDelete)
    expect(r.success).toBe(true)
  })

  it("rejects non-uuid budget_baseline_id", () => {
    const r = budgetOverrideDeleteSchema.safeParse({
      ...validDelete,
      budget_baseline_id: "bad",
    })
    expect(r.success).toBe(false)
  })

  it("rejects empty month", () => {
    const r = budgetOverrideDeleteSchema.safeParse({
      ...validDelete,
      month: "",
    })
    expect(r.success).toBe(false)
  })

  it("rejects missing budget_baseline_id", () => {
    const r = budgetOverrideDeleteSchema.safeParse({ month: "2025-06-01" })
    expect(r.success).toBe(false)
  })

  it("rejects missing month", () => {
    const r = budgetOverrideDeleteSchema.safeParse({ budget_baseline_id: UUID })
    expect(r.success).toBe(false)
  })
})
