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

import { useDeleteTransaction } from "@/features/transactions/useDeleteTransaction"

type CapturedMutation = {
  mutationFn: (id: string) => Promise<unknown>
}

beforeEach(() => {
  enqueueAndSync.mockReset()
  mutateCache.mockReset()
  hasUnsyncedCreate.mockReset()
  hasUnsyncedCreate.mockReturnValue(false)
  storeRef.state = { householdId: "h1", currentMonth: "2026-07" }
})

describe("useDeleteTransaction", () => {
  it("enqueues a delete mutation for the transaction id", async () => {
    enqueueAndSync.mockReturnValue({ id: "q1" })
    mutateCache.mockResolvedValue(undefined)
    const m = useDeleteTransaction() as unknown as CapturedMutation

    await expect(m.mutationFn("t1")).resolves.toEqual({ id: "q1" })

    expect(enqueueAndSync).toHaveBeenCalledWith({
      householdId: "h1",
      kind: "delete",
      path: "/api/transactions/t1",
      method: "DELETE",
    })
  })

  it("optimistically removes the row from the cache", async () => {
    enqueueAndSync.mockReturnValue({ id: "q1" })
    mutateCache.mockResolvedValue(undefined)
    const m = useDeleteTransaction() as unknown as CapturedMutation

    await m.mutationFn("t1")

    expect(mutateCache).toHaveBeenCalledWith({}, ["transactions", "h1", "2026-07"], expect.any(Function))
    const transform = mutateCache.mock.calls[0][2] as (rows: { id: string }[]) => unknown[]
    expect(transform([{ id: "t1" }, { id: "t2" }])).toEqual([{ id: "t2" }])
  })

  it("refuses to delete a transaction that has an unsynced create pending", async () => {
    hasUnsyncedCreate.mockReturnValue(true)
    const m = useDeleteTransaction() as unknown as CapturedMutation

    await expect(m.mutationFn("t1")).rejects.toThrow("Giao dịch chưa đồng bộ xong, thử lại sau")
    expect(enqueueAndSync).not.toHaveBeenCalled()
  })
})
