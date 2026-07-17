import type { UpdateTransactionInput } from "@growbase/shared/schemas/transaction"
import { beforeEach, describe, expect, it, vi } from "vitest"

const apiFetch = vi.hoisted(() => vi.fn())
const invalidateQueries = vi.hoisted(() => vi.fn())
const storeRef = vi.hoisted(() => ({ state: { householdId: "h1", currentMonth: "2026-07" } }))

vi.mock("@/api/client", () => ({ apiFetch }))
vi.mock("@/store/appStore", () => ({
  useAppStore: (selector: (s: unknown) => unknown) => selector(storeRef.state),
}))
vi.mock("@tanstack/react-query", () => ({
  useMutation: (opts: unknown) => opts,
  useQueryClient: () => ({ invalidateQueries }),
}))

import { useUpdateTransaction } from "@/features/transactions/useUpdateTransaction"

type CapturedMutation = {
  mutationFn: (input: UpdateTransactionInput) => Promise<unknown>
  onSuccess: () => void
}

const input: UpdateTransactionInput = {
  id: "t1",
  amount: 5000,
  direction: "out",
  transaction_type: "expense",
  category_id: "c1",
  account_id: "a1",
  description: "coffee",
  transaction_date: "2026-07-10",
  is_unusual_income: false,
  debt_entry_id: null,
}

beforeEach(() => {
  apiFetch.mockReset()
  invalidateQueries.mockReset()
})

describe("useUpdateTransaction", () => {
  it("PUTs the full payload to the transaction id endpoint", async () => {
    apiFetch.mockResolvedValue({ id: "t1" })
    const mutation = useUpdateTransaction() as unknown as CapturedMutation

    await mutation.mutationFn(input)

    expect(apiFetch).toHaveBeenCalledWith("/api/transactions/t1", {
      method: "PUT",
      body: input,
    })
  })

  it("invalidates the current-month transactions cache on success", () => {
    const mutation = useUpdateTransaction() as unknown as CapturedMutation
    mutation.onSuccess()

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["transactions", "h1", "2026-07"],
    })
  })
})
