import { appStorage } from "@/lib/storage/mmkv"

const QUEUE_KEY = "growbase-mutation-queue"

export type QueuedMutation = {
  id: string
  idempotencyKey: string
  householdId: string
  kind: "create" | "update" | "delete"
  path: string
  method: "POST" | "PUT" | "DELETE"
  body?: Record<string, unknown>
  createdAt: number
  retryCount: number
  status: "pending" | "error"
  error?: string
}

// Only plain transaction create/edit/delete may be queued (AD-M4). Fund RPCs and
// transfers are balance-sensitive — replaying them against a stale local balance
// would corrupt state, so they are rejected before ever touching the queue.
function isEligible(item: QueuedMutation): boolean {
  if (item.path.includes("/funds") || item.path.endsWith("/transfer")) return false
  if (item.kind === "create") return item.method === "POST" && item.path === "/api/transactions"
  const idScoped = /^\/api\/transactions\/[^/]+$/.test(item.path)
  if (item.kind === "update") return item.method === "PUT" && idScoped
  if (item.kind === "delete") return item.method === "DELETE" && idScoped
  return false
}

let cache: QueuedMutation[] | null = null
const listeners = new Set<() => void>()

function load(): QueuedMutation[] {
  if (cache) return cache
  const raw = appStorage.getItem(QUEUE_KEY)
  if (!raw) {
    cache = []
    return cache
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    cache = Array.isArray(parsed) ? (parsed as QueuedMutation[]) : []
  } catch {
    // A corrupt blob must not brick every future offline write — reset to empty.
    cache = []
  }
  return cache
}

function commit(next: QueuedMutation[]): void {
  cache = next
  appStorage.setItem(QUEUE_KEY, JSON.stringify(next))
  listeners.forEach((notify) => notify())
}

export function enqueue(item: QueuedMutation): void {
  if (!isEligible(item)) {
    throw new Error(`Not queue-eligible: ${item.method} ${item.path}`)
  }
  commit([...load(), item])
}

export function list(householdId: string): QueuedMutation[] {
  return load().filter((m) => m.householdId === householdId)
}

// The optimistic row for an offline "create" is keyed by its queue item id (see
// dispatch.ts). Editing/deleting that row before the create syncs would target a
// server id that doesn't exist yet, so callers must check this first.
export function hasUnsyncedCreate(householdId: string, transactionId: string): boolean {
  return list(householdId).some((m) => m.kind === "create" && m.id === transactionId)
}

export function remove(id: string): void {
  commit(load().filter((m) => m.id !== id))
}

export function updateStatus(id: string, status: QueuedMutation["status"], error?: string): void {
  commit(load().map((m) => (m.id === id ? { ...m, status, error } : m)))
}

export function recordRetry(id: string, error?: string): void {
  commit(load().map((m) => (m.id === id ? { ...m, retryCount: m.retryCount + 1, error } : m)))
}

// Purge alongside the query cache on household switch / logout (AD-M9). The cache
// is wiped globally, so the queue is too — no scope survives the reset.
export function clear(): void {
  commit([])
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getSnapshot(): QueuedMutation[] {
  return load()
}
