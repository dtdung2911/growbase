import { describe, expect, it } from "vitest"
import { netWorthSnapshotSchema } from "@growbase/shared/schemas/net-worth"

const UUID = "11111111-1111-1111-1111-111111111111"
const UUID2 = "22222222-2222-2222-2222-222222222222"

// --- valid fixtures ---
const validSnapshot = {
  snapshot_month: "2025-06-01",
  items: [
    { account_id: UUID, balance_recorded: 10_000_000 },
    { account_id: UUID2, balance_recorded: 5_000_000 },
  ],
  total_recorded: 15_000_000,
  total_system: 14_500_000,
}

// ============================================================
// netWorthSnapshotSchema
// ============================================================
describe("netWorthSnapshotSchema", () => {
  it("accepts valid snapshot input", () => {
    const r = netWorthSnapshotSchema.safeParse(validSnapshot)
    expect(r.success).toBe(true)
  })

  it("accepts optional notes", () => {
    const r = netWorthSnapshotSchema.safeParse({
      ...validSnapshot,
      notes: "End of month reconciliation",
    })
    expect(r.success).toBe(true)
  })

  it("accepts nullable notes", () => {
    const r = netWorthSnapshotSchema.safeParse({
      ...validSnapshot,
      notes: null,
    })
    expect(r.success).toBe(true)
  })

  it("rejects empty snapshot_month", () => {
    const r = netWorthSnapshotSchema.safeParse({
      ...validSnapshot,
      snapshot_month: "",
    })
    expect(r.success).toBe(false)
  })

  it("rejects empty items array", () => {
    const r = netWorthSnapshotSchema.safeParse({
      ...validSnapshot,
      items: [],
    })
    expect(r.success).toBe(false)
  })

  it("rejects item with non-uuid account_id", () => {
    const r = netWorthSnapshotSchema.safeParse({
      ...validSnapshot,
      items: [{ account_id: "bad", balance_recorded: 100 }],
    })
    expect(r.success).toBe(false)
  })

  it("accepts zero balance_recorded", () => {
    const r = netWorthSnapshotSchema.safeParse({
      ...validSnapshot,
      items: [{ account_id: UUID, balance_recorded: 0 }],
      total_recorded: 0,
    })
    expect(r.success).toBe(true)
  })

  it("accepts negative balance_recorded (credit card debt)", () => {
    const r = netWorthSnapshotSchema.safeParse({
      ...validSnapshot,
      items: [{ account_id: UUID, balance_recorded: -500_000 }],
      total_recorded: -500_000,
    })
    expect(r.success).toBe(true)
  })

  it("accepts zero total_system", () => {
    const r = netWorthSnapshotSchema.safeParse({
      ...validSnapshot,
      total_system: 0,
    })
    expect(r.success).toBe(true)
  })

  it("rejects missing snapshot_month", () => {
    const { snapshot_month: _, ...rest } = validSnapshot
    const r = netWorthSnapshotSchema.safeParse(rest)
    expect(r.success).toBe(false)
  })

  it("rejects missing items", () => {
    const { items: _, ...rest } = validSnapshot
    const r = netWorthSnapshotSchema.safeParse(rest)
    expect(r.success).toBe(false)
  })

  it("rejects missing total_recorded", () => {
    const { total_recorded: _, ...rest } = validSnapshot
    const r = netWorthSnapshotSchema.safeParse(rest)
    expect(r.success).toBe(false)
  })

  it("rejects missing total_system", () => {
    const { total_system: _, ...rest } = validSnapshot
    const r = netWorthSnapshotSchema.safeParse(rest)
    expect(r.success).toBe(false)
  })

  it("accepts single item", () => {
    const r = netWorthSnapshotSchema.safeParse({
      ...validSnapshot,
      items: [{ account_id: UUID, balance_recorded: 10_000_000 }],
    })
    expect(r.success).toBe(true)
  })

  it("rejects item missing account_id", () => {
    const r = netWorthSnapshotSchema.safeParse({
      ...validSnapshot,
      items: [{ balance_recorded: 100 }],
    })
    expect(r.success).toBe(false)
  })

  it("rejects item missing balance_recorded", () => {
    const r = netWorthSnapshotSchema.safeParse({
      ...validSnapshot,
      items: [{ account_id: UUID }],
    })
    expect(r.success).toBe(false)
  })
})
