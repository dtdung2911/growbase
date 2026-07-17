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

import { useDeleteTransaction } from "@/features/transactions/useDeleteTransaction"

type CapturedMutation = {
  mutationFn: (id: string) => Promise<unknown>
  onSuccess: () => void
}

beforeEach(() => {
  apiFetch.mockReset()
  invalidateQueries.mockReset()
})

describe("useDeleteTransaction", () => {
  it("DELETEs the transaction id endpoint", async () => {
    apiFetch.mockResolvedValue({ id: "t1" })
    const mutation = useDeleteTransaction() as unknown as CapturedMutation

    await mutation.mutationFn("t1")

    expect(apiFetch).toHaveBeenCalledWith("/api/transactions/t1", { method: "DELETE" })
  })

  it("invalidates the current-month transactions cache on success", () => {
    const mutation = useDeleteTransaction() as unknown as CapturedMutation
    mutation.onSuccess()

    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["transactions", "h1", "2026-07"],
    })
  })
})
