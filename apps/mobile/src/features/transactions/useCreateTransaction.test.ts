import { beforeEach, describe, expect, it, vi } from "vitest"

const apiFetch = vi.hoisted(() => vi.fn())
const invalidateQueries = vi.hoisted(() => vi.fn())
const storeRef = vi.hoisted(() => ({ state: { householdId: "h1", currentMonth: "2026-07" } }))

vi.mock("@/api/client", () => ({ apiFetch }))
vi.mock("@/lib/query/queryClient", () => ({ queryClient: { invalidateQueries } }))
vi.mock("@/store/appStore", () => ({
  useAppStore: (selector: (s: typeof storeRef.state) => unknown) => selector(storeRef.state),
}))
vi.mock("@tanstack/react-query", () => ({ useMutation: (options: unknown) => options }))

import { type NewTransaction, useCreateTransaction } from "@/features/transactions/useCreateTransaction"

type CapturedMutation = {
  mutationFn: (body: NewTransaction) => Promise<{ id: string }>
  onSuccess: (data: unknown, body: NewTransaction) => void
}

const body: NewTransaction = {
  amount: 50000,
  direction: "out",
  transaction_type: "expense",
  category_id: "c1",
  account_id: "a1",
  transaction_date: "2026-07-17",
}

beforeEach(() => {
  apiFetch.mockReset()
  invalidateQueries.mockReset()
  storeRef.state = { householdId: "h1", currentMonth: "2026-07" }
})

describe("useCreateTransaction", () => {
  it("POSTs the body to /api/transactions", async () => {
    apiFetch.mockResolvedValue({ id: "t1" })
    const m = useCreateTransaction() as unknown as CapturedMutation
    await expect(m.mutationFn(body)).resolves.toEqual({ id: "t1" })
    expect(apiFetch).toHaveBeenCalledWith("/api/transactions", { method: "POST", body })
  })

  it("invalidates transactions, dashboard, budget and accounts on success", () => {
    ;(useCreateTransaction() as unknown as CapturedMutation).onSuccess(undefined, body)
    expect(invalidateQueries).toHaveBeenCalledTimes(4)
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["transactions", "h1", "2026-07"] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["dashboard", "h1", "2026-07"] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["budget", "h1", "2026-07"] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["accounts", "h1"] })
  })

  it("also invalidates the transaction's month when it differs from currentMonth", () => {
    const m = useCreateTransaction() as unknown as CapturedMutation
    m.onSuccess(undefined, { ...body, transaction_date: "2026-06-30" })
    expect(invalidateQueries).toHaveBeenCalledTimes(7)
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["transactions", "h1", "2026-06"] })
    expect(invalidateQueries).toHaveBeenCalledWith({ queryKey: ["transactions", "h1", "2026-07"] })
  })
})
