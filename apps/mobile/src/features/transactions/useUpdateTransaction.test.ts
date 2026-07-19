import { beforeEach, describe, expect, it, vi } from "vitest"

const enqueueAndSync = vi.hoisted(() => vi.fn())
const mutateCache = vi.hoisted(() => vi.fn())
const hasUnsyncedCreate = vi.hoisted(() => vi.fn())
const storeRef = vi.hoisted(() => ({ state: { householdId: "h1", currentMonth: "2026-07" } }))

vi.mock("@/lib/sync/dispatch", () => ({ enqueueAndSync }))
vi.mock("@/lib/sync/mutationQueue", () => ({ hasUnsyncedCreate }))
vi.mock("./optimisticCache", () => ({ mutateCache }))
vi.mock("@/lib/query/queryClient", () => ({ queryClient: {} }))
vi.mock("@/store/appStore", () => ({
  useAppStore: (selector: (s: typeof storeRef.state) => unknown) => selector(storeRef.state),
}))
vi.mock("@tanstack/react-query", () => ({ useMutation: (options: unknown) => options }))

import type { UpdateTransactionInput } from "@growbase/shared/schemas/transaction"
import { useUpdateTransaction } from "@/features/transactions/useUpdateTransaction"

type CapturedMutation = {
  mutationFn: (input: UpdateTransactionInput) => Promise<unknown>
}

const input: UpdateTransactionInput = {
  id: "00000000-0000-0000-0000-000000000001",
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
  hasUnsyncedCreate.mockReset()
  hasUnsyncedCreate.mockReturnValue(false)
  storeRef.state = { householdId: "h1", currentMonth: "2026-07" }
})

describe("useUpdateTransaction", () => {
  it("enqueues an update mutation for the transaction id", async () => {
    enqueueAndSync.mockReturnValue({ id: "q1" })
    mutateCache.mockResolvedValue(undefined)
    const m = useUpdateTransaction() as unknown as CapturedMutation

    await expect(m.mutationFn(input)).resolves.toEqual({ id: "q1" })

    expect(enqueueAndSync).toHaveBeenCalledWith({
      householdId: "h1",
      kind: "update",
      path: "/api/transactions/00000000-0000-0000-0000-000000000001",
      method: "PUT",
      body: input,
    })
  })

  it("optimistically merges the update into the cached row", async () => {
    enqueueAndSync.mockReturnValue({ id: "q1" })
    mutateCache.mockResolvedValue(undefined)
    const m = useUpdateTransaction() as unknown as CapturedMutation

    await m.mutationFn(input)

    expect(mutateCache).toHaveBeenCalledWith({}, ["transactions", "h1", "2026-07"], expect.any(Function))
    const transform = mutateCache.mock.calls[0][2] as (rows: Record<string, unknown>[]) => unknown[]
    expect(transform([{ id: input.id, amount: 1 }])).toEqual([{ ...input }])
  })

  it("refuses to update a transaction that has an unsynced create pending", async () => {
    hasUnsyncedCreate.mockReturnValue(true)
    const m = useUpdateTransaction() as unknown as CapturedMutation

    await expect(m.mutationFn(input)).rejects.toThrow("Giao dịch chưa đồng bộ xong, thử lại sau")
    expect(enqueueAndSync).not.toHaveBeenCalled()
  })
})
