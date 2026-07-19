import { beforeEach, describe, expect, it } from "vitest"
import { appStorage } from "@/lib/storage/mmkv"
import {
  clear,
  enqueue,
  getSnapshot,
  hasUnsyncedCreate,
  list,
  recordRetry,
  remove,
  subscribe,
  updateStatus,
  type QueuedMutation,
} from "@/lib/sync/mutationQueue"

const QUEUE_KEY = "growbase-mutation-queue"

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
})

describe("mutationQueue", () => {
  it("enqueue persists to MMKV and is readable back", () => {
    enqueue(make({ id: "a" }))

    expect(list("hh-1")).toHaveLength(1)
    const raw = appStorage.getItem(QUEUE_KEY)
    expect(raw).not.toBeNull()
    expect(JSON.parse(raw as string)[0].id).toBe("a")
  })

  it("preserves FIFO ordering", () => {
    enqueue(make({ id: "a" }))
    enqueue(make({ id: "b" }))
    enqueue(make({ id: "c" }))

    expect(list("hh-1").map((m) => m.id)).toEqual(["a", "b", "c"])
  })

  it("remove drops the matching item only", () => {
    enqueue(make({ id: "a" }))
    enqueue(make({ id: "b" }))

    remove("a")

    expect(list("hh-1").map((m) => m.id)).toEqual(["b"])
  })

  it("partitions list() by householdId", () => {
    enqueue(make({ id: "a", householdId: "hh-1" }))
    enqueue(make({ id: "b", householdId: "hh-2" }))

    expect(list("hh-1").map((m) => m.id)).toEqual(["a"])
    expect(list("hh-2").map((m) => m.id)).toEqual(["b"])
  })

  it("clear() purges every scope", () => {
    enqueue(make({ id: "a", householdId: "hh-1" }))
    enqueue(make({ id: "b", householdId: "hh-2" }))

    clear()

    expect(list("hh-1")).toHaveLength(0)
    expect(list("hh-2")).toHaveLength(0)
  })

  it("updateStatus marks an item as error with a message", () => {
    enqueue(make({ id: "a" }))

    updateStatus("a", "error", "boom")

    const item = list("hh-1")[0]
    expect(item.status).toBe("error")
    expect(item.error).toBe("boom")
  })

  it("recordRetry increments retryCount and keeps the item pending", () => {
    enqueue(make({ id: "a" }))

    recordRetry("a", "timeout")

    const item = list("hh-1")[0]
    expect(item.retryCount).toBe(1)
    expect(item.status).toBe("pending")
    expect(item.error).toBe("timeout")
  })

  it("rejects a fund RPC as non-eligible", () => {
    expect(() =>
      enqueue(make({ id: "f", kind: "create", method: "POST", path: "/api/funds/fund-1/contribute" }))
    ).toThrow(/eligible/i)
    expect(list("hh-1")).toHaveLength(0)
  })

  it("rejects a transfer as non-eligible", () => {
    expect(() =>
      enqueue(make({ id: "t", kind: "create", method: "POST", path: "/api/transactions/transfer" }))
    ).toThrow(/eligible/i)
    expect(list("hh-1")).toHaveLength(0)
  })

  it("getSnapshot returns a stable reference until the next write", () => {
    enqueue(make({ id: "a" }))
    const first = getSnapshot()
    expect(getSnapshot()).toBe(first)

    enqueue(make({ id: "b" }))
    expect(getSnapshot()).not.toBe(first)
  })

  it("resets to empty instead of crashing on a corrupt (non-array) persisted blob", () => {
    appStorage.setItem(QUEUE_KEY, JSON.stringify({ not: "an array" }))

    expect(list("hh-1")).toEqual([])

    enqueue(make({ id: "a" }))
    expect(list("hh-1")).toHaveLength(1)
  })

  it("hasUnsyncedCreate is true only for a pending create with that id", () => {
    enqueue(make({ id: "tx-1", kind: "create" }))

    expect(hasUnsyncedCreate("hh-1", "tx-1")).toBe(true)
    expect(hasUnsyncedCreate("hh-1", "tx-2")).toBe(false)
    expect(hasUnsyncedCreate("hh-2", "tx-1")).toBe(false)
  })

  it("notifies subscribers on every write", () => {
    let hits = 0
    const unsub = subscribe(() => {
      hits += 1
    })

    enqueue(make({ id: "a" }))
    remove("a")

    expect(hits).toBe(2)
    unsub()
    enqueue(make({ id: "b" }))
    expect(hits).toBe(2)
  })
})
