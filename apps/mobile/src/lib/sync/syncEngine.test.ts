import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/api/client", () => {
  class ApiError extends Error {
    status: number
    constructor(status: number, message: string) {
      super(message)
      this.status = status
    }
  }
  return { ApiError, apiFetch: vi.fn() }
})

import { ApiError, apiFetch } from "@/api/client"
import { queryClient } from "@/lib/query/queryClient"
import { clear, enqueue, list, type QueuedMutation } from "@/lib/sync/mutationQueue"
import { processQueue } from "@/lib/sync/syncEngine"
import { useAppStore } from "@/store/appStore"

const mockedFetch = vi.mocked(apiFetch)

function make(overrides: Partial<QueuedMutation> = {}): QueuedMutation {
  return {
    id: overrides.id ?? "id-1",
    idempotencyKey: overrides.idempotencyKey ?? overrides.id ?? "key-1",
    householdId: "hh-1",
    kind: overrides.kind ?? "create",
    path: overrides.path ?? "/api/transactions",
    method: overrides.method ?? "POST",
    body: overrides.body ?? { amount: 10 },
    createdAt: overrides.createdAt ?? 1,
    retryCount: overrides.retryCount ?? 0,
    status: "pending",
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  clear()
  mockedFetch.mockReset()
  useAppStore.setState({ householdId: "hh-1", currentMonth: "2026-07" })
})

afterEach(() => {
  vi.clearAllTimers()
  vi.useRealTimers()
})

describe("processQueue", () => {
  it("removes an item on 2xx and invalidates affected keys", async () => {
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    enqueue(make({ id: "a" }))
    mockedFetch.mockResolvedValue({ id: "server-1" })

    await processQueue()

    expect(list("hh-1")).toHaveLength(0)
    expect(invalidate).toHaveBeenCalled()
    invalidate.mockRestore()
  })

  it("replays strictly FIFO, one request at a time", async () => {
    enqueue(make({ id: "a", idempotencyKey: "ka" }))
    enqueue(make({ id: "b", idempotencyKey: "kb" }))
    mockedFetch.mockResolvedValue({})

    await processQueue()

    expect(mockedFetch.mock.calls.map((c) => c[1]?.idempotencyKey)).toEqual(["ka", "kb"])
    expect(list("hh-1")).toHaveLength(0)
  })

  it("resends the identical idempotency key on retry", async () => {
    enqueue(make({ id: "a", idempotencyKey: "stable-key" }))
    mockedFetch.mockRejectedValueOnce(new ApiError(500, "down"))

    await processQueue()
    expect(list("hh-1")[0].retryCount).toBe(1)

    mockedFetch.mockResolvedValueOnce({})
    await processQueue()

    expect(list("hh-1")).toHaveLength(0)
    const keysSent = mockedFetch.mock.calls.map((c) => c[1]?.idempotencyKey)
    expect(keysSent).toEqual(["stable-key", "stable-key"])
  })

  it.each([400, 401, 403, 404])("drops and marks error on %i", async (status) => {
    enqueue(make({ id: "a" }))
    mockedFetch.mockRejectedValue(new ApiError(status, "nope"))

    await processQueue()

    const item = list("hh-1")[0]
    expect(item.status).toBe("error")
    expect(item.error).toBe("nope")
    expect(item.retryCount).toBe(0)
  })

  it("retains a 409 (in-flight) item and retries it", async () => {
    enqueue(make({ id: "a" }))
    mockedFetch.mockRejectedValue(new ApiError(409, "Yêu cầu đang được xử lý"))

    await processQueue()

    const item = list("hh-1")[0]
    expect(item.status).toBe("pending")
    expect(item.retryCount).toBe(1)
  })

  it("retains and counts a retry on 5xx", async () => {
    enqueue(make({ id: "a" }))
    mockedFetch.mockRejectedValue(new ApiError(503, "unavailable"))

    await processQueue()

    const item = list("hh-1")[0]
    expect(item.status).toBe("pending")
    expect(item.retryCount).toBe(1)
  })

  it("retains and counts a retry on a raw network failure", async () => {
    enqueue(make({ id: "a" }))
    mockedFetch.mockRejectedValue(new TypeError("Network request failed"))

    await processQueue()

    const item = list("hh-1")[0]
    expect(item.status).toBe("pending")
    expect(item.retryCount).toBe(1)
  })

  it("head-of-line blocks: a transient failure stops the pass", async () => {
    enqueue(make({ id: "a", idempotencyKey: "ka" }))
    enqueue(make({ id: "b", idempotencyKey: "kb" }))
    mockedFetch.mockRejectedValue(new ApiError(500, "down"))

    await processQueue()

    expect(mockedFetch).toHaveBeenCalledTimes(1)
    expect(list("hh-1")).toHaveLength(2)
  })

  it("does not run concurrently (single in-flight)", async () => {
    enqueue(make({ id: "a" }))
    let release!: () => void
    mockedFetch.mockReturnValue(
      new Promise<unknown>((resolve) => {
        release = () => resolve({})
      })
    )

    const first = processQueue()
    const second = processQueue()
    release()
    await Promise.all([first, second])

    expect(mockedFetch).toHaveBeenCalledTimes(1)
  })

  it("no-ops when no household is selected", async () => {
    useAppStore.setState({ householdId: null })
    enqueue(make({ id: "a" }))
    mockedFetch.mockResolvedValue({})

    await processQueue()

    expect(mockedFetch).not.toHaveBeenCalled()
  })

  it("skips invalidation when the pass settles nothing (empty queue)", async () => {
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")

    await processQueue()

    expect(invalidate).not.toHaveBeenCalled()
    invalidate.mockRestore()
  })

  it("invalidates on a dropped (4xx) item too, so the optimistic row is rolled back via refetch", async () => {
    const invalidate = vi.spyOn(queryClient, "invalidateQueries")
    enqueue(make({ id: "a" }))
    mockedFetch.mockRejectedValue(new ApiError(404, "not found"))

    await processQueue()

    expect(invalidate).toHaveBeenCalled()
    invalidate.mockRestore()
  })

  it("picks up an item enqueued while a pass is already in flight (no lost wakeup)", async () => {
    let release!: () => void
    mockedFetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          release = () => resolve({})
        })
    )
    enqueue(make({ id: "a", idempotencyKey: "ka" }))

    const firstPass = processQueue()
    enqueue(make({ id: "b", idempotencyKey: "kb" }))
    const concurrentCall = processQueue()

    mockedFetch.mockResolvedValueOnce({})
    release()
    await Promise.all([firstPass, concurrentCall])

    expect(list("hh-1")).toHaveLength(0)
    expect(mockedFetch.mock.calls.map((c) => c[1]?.idempotencyKey)).toEqual(["ka", "kb"])
  })
})
