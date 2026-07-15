import { describe, expect, it } from "vitest"
import {
  scheduledPaymentCreateSchema,
  scheduledPaymentUpdateSchema,
  markPaidFormSchema,
} from "@growbase/shared/schemas/scheduled-payment"

const UUID = "11111111-1111-1111-1111-111111111111"
const UUID2 = "22222222-2222-2222-2222-222222222222"

// --- valid fixtures ---
const validCreate = {
  name: "Internet",
  period: "monthly" as const,
  amount: 300_000,
  next_due_date: "2025-07-01",
}

const validUpdate = {
  ...validCreate,
  id: UUID,
  status: "active" as const,
}

const validMarkPaid = {
  create_transaction: true,
  account_id: UUID,
  category_id: UUID2,
  date: "2025-06-15",
}

// ============================================================
// scheduledPaymentCreateSchema
// ============================================================
describe("scheduledPaymentCreateSchema", () => {
  it("accepts minimal valid input", () => {
    const r = scheduledPaymentCreateSchema.safeParse(validCreate)
    expect(r.success).toBe(true)
  })

  it("accepts all period values", () => {
    for (const p of ["monthly", "quarterly", "yearly"]) {
      const r = scheduledPaymentCreateSchema.safeParse({
        ...validCreate,
        period: p,
      })
      expect(r.success).toBe(true)
    }
  })

  it("rejects invalid period", () => {
    const r = scheduledPaymentCreateSchema.safeParse({
      ...validCreate,
      period: "weekly",
    })
    expect(r.success).toBe(false)
  })

  it("rejects empty name", () => {
    const r = scheduledPaymentCreateSchema.safeParse({
      ...validCreate,
      name: "",
    })
    expect(r.success).toBe(false)
  })

  it("rejects amount = 0", () => {
    const r = scheduledPaymentCreateSchema.safeParse({
      ...validCreate,
      amount: 0,
    })
    expect(r.success).toBe(false)
  })

  it("rejects negative amount", () => {
    const r = scheduledPaymentCreateSchema.safeParse({
      ...validCreate,
      amount: -100,
    })
    expect(r.success).toBe(false)
  })

  it("rejects empty next_due_date", () => {
    const r = scheduledPaymentCreateSchema.safeParse({
      ...validCreate,
      next_due_date: "",
    })
    expect(r.success).toBe(false)
  })

  it("accepts optional payment_method", () => {
    const r = scheduledPaymentCreateSchema.safeParse({
      ...validCreate,
      payment_method: "Auto-debit",
    })
    expect(r.success).toBe(true)
  })

  it("accepts nullable payment_method", () => {
    const r = scheduledPaymentCreateSchema.safeParse({
      ...validCreate,
      payment_method: null,
    })
    expect(r.success).toBe(true)
  })

  it("accepts optional notes", () => {
    const r = scheduledPaymentCreateSchema.safeParse({
      ...validCreate,
      notes: "Pay before 5th",
    })
    expect(r.success).toBe(true)
  })

  it("rejects missing name", () => {
    const { name: _, ...rest } = validCreate
    const r = scheduledPaymentCreateSchema.safeParse(rest)
    expect(r.success).toBe(false)
  })

  it("rejects missing amount", () => {
    const { amount: _, ...rest } = validCreate
    const r = scheduledPaymentCreateSchema.safeParse(rest)
    expect(r.success).toBe(false)
  })
})

// ============================================================
// scheduledPaymentUpdateSchema
// ============================================================
describe("scheduledPaymentUpdateSchema", () => {
  it("accepts valid update input", () => {
    const r = scheduledPaymentUpdateSchema.safeParse(validUpdate)
    expect(r.success).toBe(true)
  })

  it("requires id as uuid", () => {
    const r = scheduledPaymentUpdateSchema.safeParse({
      ...validUpdate,
      id: "not-uuid",
    })
    expect(r.success).toBe(false)
  })

  it("rejects missing id", () => {
    const { id: _, ...rest } = validUpdate
    const r = scheduledPaymentUpdateSchema.safeParse(rest)
    expect(r.success).toBe(false)
  })

  it("accepts all status values", () => {
    for (const s of ["active", "cancelled", "expired"]) {
      const r = scheduledPaymentUpdateSchema.safeParse({
        ...validUpdate,
        status: s,
      })
      expect(r.success).toBe(true)
    }
  })

  it("rejects invalid status", () => {
    const r = scheduledPaymentUpdateSchema.safeParse({
      ...validUpdate,
      status: "paused",
    })
    expect(r.success).toBe(false)
  })
})

// ============================================================
// markPaidFormSchema
// ============================================================
describe("markPaidFormSchema", () => {
  it("accepts valid mark-paid with transaction", () => {
    const r = markPaidFormSchema.safeParse(validMarkPaid)
    expect(r.success).toBe(true)
  })

  it("accepts mark-paid without transaction creation", () => {
    const r = markPaidFormSchema.safeParse({
      create_transaction: false,
    })
    expect(r.success).toBe(true)
  })

  it("rejects create_transaction=true without account_id", () => {
    const r = markPaidFormSchema.safeParse({
      create_transaction: true,
      category_id: UUID2,
    })
    expect(r.success).toBe(false)
  })

  it("rejects create_transaction=true without category_id", () => {
    const r = markPaidFormSchema.safeParse({
      create_transaction: true,
      account_id: UUID,
    })
    expect(r.success).toBe(false)
  })

  it("accepts nullable account_id when not creating tx", () => {
    const r = markPaidFormSchema.safeParse({
      create_transaction: false,
      account_id: null,
      category_id: null,
    })
    expect(r.success).toBe(true)
  })

  it("accepts optional member_id", () => {
    const r = markPaidFormSchema.safeParse({
      ...validMarkPaid,
      member_id: UUID,
    })
    expect(r.success).toBe(true)
  })

  it("rejects non-uuid account_id", () => {
    const r = markPaidFormSchema.safeParse({
      ...validMarkPaid,
      account_id: "bad",
    })
    expect(r.success).toBe(false)
  })

  it("rejects non-uuid category_id", () => {
    const r = markPaidFormSchema.safeParse({
      ...validMarkPaid,
      category_id: "bad",
    })
    expect(r.success).toBe(false)
  })
})
