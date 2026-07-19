import { beforeEach, describe, expect, it, vi } from "vitest"

const enqueueAndSync = vi.hoisted(() => vi.fn())
const mutateCache = vi.hoisted(() => vi.fn())
const storeRef = vi.hoisted(() => ({ state: { householdId: "h1", currentMonth: "2026-07" } }))

vi.mock("@/lib/sync/dispatch", () => ({ enqueueAndSync }))
vi.mock("./optimisticCache", () => ({ mutateCache }))
vi.mock("@/lib/query/queryClient", () => ({ queryClient: {} }))
vi.mock("@/store/appStore", () => ({
  useAppStore: (selector: (s: typeof storeRef.state) => unknown) => selector(storeRef.state),
}))
vi.mock("@tanstack/react-query", () => ({ useMutation: (options: unknown) => options }))

import type { CreateTransactionInput } from "@growbase/shared/schemas/transaction"
import { useCreateTransaction } from "@/features/transactions/useCreateTransaction"

type CapturedMutation = {
  mutationFn: (input: CreateTransactionInput) => Promise<unknown>
}

const input: CreateTransactionInput = {
  amount: 50000,
  direction: "out",
  transaction_type: "expense",
  category_id: "11111111-1111-1111-1111-111111111111",
  account_id: "22222222-2222-2222-2222-222222222222",
  transaction_date: "2026-07-17",
  is_unusual_income: false,
}

beforeEach(() => {
  enqueueAndSync.mockReset()
  mutateCache.mockReset()
  storeRef.state = { householdId: "h1", currentMonth: "2026-07" }
})

describe("useCreateTransaction", () => {
  it("enqueues a create mutation and returns the queued item", async () => {
    enqueueAndSync.mockReturnValue({ id: "q1" })
    mutateCache.mockResolvedValue(undefined)
    const m = useCreateTransaction() as unknown as CapturedMutation

    await expect(m.mutationFn(input)).resolves.toEqual({ id: "q1" })

    expect(enqueueAndSync).toHaveBeenCalledWith({
      householdId: "h1",
      kind: "create",
      path: "/api/transactions",
      method: "POST",
      body: input,
    })
  })

  it("optimistically prepends the new row keyed by the queued item id", async () => {
    enqueueAndSync.mockReturnValue({ id: "q1" })
    mutateCache.mockResolvedValue(undefined)
    const m = useCreateTransaction() as unknown as CapturedMutation

    await m.mutationFn(input)

    expect(mutateCache).toHaveBeenCalledWith({}, ["transactions", "h1", "2026-07"], expect.any(Function))
    const transform = mutateCache.mock.calls[0][2] as (rows: unknown[]) => unknown[]
    expect(transform([])).toEqual([{ ...input, id: "q1" }])
  })
})
