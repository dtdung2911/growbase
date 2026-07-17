import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  clear,
  enqueue,
  getSnapshot,
  remove,
  type QueuedMutation,
} from "@/lib/sync/mutationQueue"
import { processQueue } from "@/lib/sync/syncEngine"
import { resolveSyncStatus, retrySync } from "@/lib/sync/useSyncStatus"

vi.mock("@/lib/sync/syncEngine", () => ({ processQueue: vi.fn() }))

function make(overrides: Partial<QueuedMutation> = {}): QueuedMutation {
  return {
    id: overrides.id ?? "id-1",
    idempotencyKey: overrides.idempotencyKey ?? overrides.id ?? "id-1",
    householdId: overrides.householdId ?? "hh-1",
    kind: overrides.kind ?? "create",
    path: overrides.path ?? "/api/transactions",
    method: overrides.method ?? "POST",
    body: overrides.body ?? { amount: 10 },
    createdAt: overrides.createdAt ?? 1,
    retryCount: overrides.retryCount ?? 0,
    status: overrides.status ?? "pending",
    error: overrides.error,
  }
}

beforeEach(() => {
  clear()
  vi.mocked(processQueue).mockClear()
})

describe("resolveSyncStatus", () => {
  it("returns 'pending' for an offline create matched by queue-item id", () => {
    enqueue(make({ id: "tx-1" }))

    expect(resolveSyncStatus(getSnapshot(), "tx-1")).toBe("pending")
  })

  it("returns 'error' for a dropped item", () => {
    enqueue(make({ id: "tx-1", status: "error", error: "gone" }))

    expect(resolveSyncStatus(getSnapshot(), "tx-1")).toBe("error")
  })

  it("matches an offline edit by the transaction id embedded in its path", () => {
    enqueue(
      make({ id: "q-9", kind: "update", method: "PUT", path: "/api/transactions/tx-real" }),
    )

    expect(resolveSyncStatus(getSnapshot(), "tx-real")).toBe("pending")
  })

  it("returns null when no queue item matches the transaction", () => {
    enqueue(make({ id: "other" }))

    expect(resolveSyncStatus(getSnapshot(), "tx-unknown")).toBeNull()
  })

  // pending -> absent is the transition the hook renders as a transient "synced" chip.
  it("goes pending -> null once the item is removed after a successful replay", () => {
    enqueue(make({ id: "tx-1" }))
    expect(resolveSyncStatus(getSnapshot(), "tx-1")).toBe("pending")

    remove("tx-1")
    expect(resolveSyncStatus(getSnapshot(), "tx-1")).toBeNull()
  })
})

describe("retrySync", () => {
  it("re-arms a dropped item to 'pending' and kicks the queue", () => {
    enqueue(make({ id: "tx-1", status: "error", error: "boom" }))

    retrySync("tx-1")

    expect(resolveSyncStatus(getSnapshot(), "tx-1")).toBe("pending")
    expect(vi.mocked(processQueue)).toHaveBeenCalledTimes(1)
  })

  it("kicks the queue without changing a still-pending item", () => {
    enqueue(make({ id: "tx-1", status: "pending" }))

    retrySync("tx-1")

    expect(resolveSyncStatus(getSnapshot(), "tx-1")).toBe("pending")
    expect(vi.mocked(processQueue)).toHaveBeenCalledTimes(1)
  })

  it("kicks the queue even when nothing matches the transaction", () => {
    retrySync("tx-none")

    expect(vi.mocked(processQueue)).toHaveBeenCalledTimes(1)
  })
})
