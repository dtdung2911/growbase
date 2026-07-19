import { keys } from "@growbase/shared/queryKeys"
import { apiFetch, ApiError } from "@/api/client"
import { queryClient } from "@/lib/query/queryClient"
import { list, recordRetry, remove, updateStatus, type QueuedMutation } from "@/lib/sync/mutationQueue"
import { useAppStore } from "@/store/appStore"

const BASE_DELAY_MS = 1_000
const MAX_DELAY_MS = 30_000

// 400/401/403/404 are the caller's fault (bad payload, auth, gone) — replaying
// never helps, so the item is dropped. 409 is the 14.4 "still processing" case:
// transient, must be retried, not dropped.
const DROP_STATUSES = new Set([400, 401, 403, 404])

let running = false
let dirty = false
let retryTimer: ReturnType<typeof setTimeout> | null = null

export function invalidateTransactionScope(householdId: string): void {
  const month = useAppStore.getState().currentMonth
  queryClient.invalidateQueries({ queryKey: keys.transactions(householdId, month) })
  queryClient.invalidateQueries({ queryKey: keys.accounts(householdId) })
  queryClient.invalidateQueries({ queryKey: keys.dashboard(householdId, month) })
  queryClient.invalidateQueries({ queryKey: keys.budget(householdId, month) })
  queryClient.invalidateQueries({ queryKey: keys.systemBalances(householdId) })
}

async function replay(item: QueuedMutation): Promise<boolean> {
  try {
    await apiFetch(item.path, {
      method: item.method,
      body: item.body,
      idempotencyKey: item.idempotencyKey,
    })
    remove(item.id)
    return true
  } catch (err) {
    if (err instanceof ApiError && DROP_STATUSES.has(err.status)) {
      updateStatus(item.id, "error", err.message)
      return true
    }
    recordRetry(item.id, err instanceof Error ? err.message : String(err))
    return false
  }
}

function scheduleRetry(retryCount: number): void {
  if (retryTimer) return
  const delay = Math.min(BASE_DELAY_MS * 2 ** retryCount, MAX_DELAY_MS)
  retryTimer = setTimeout(() => {
    retryTimer = null
    void processQueue()
  }, delay)
}

export async function processQueue(): Promise<void> {
  if (running) {
    // A new item arrived (or a reconnect fired) while a pass was already in
    // flight — its snapshot of `pending` won't see it, so flag another pass.
    dirty = true
    return
  }
  const householdId = useAppStore.getState().householdId
  if (!householdId) return

  running = true
  let settledCount = 0
  try {
    // Strict FIFO, one in-flight: a transient failure stops the pass (head-of-line)
    // and schedules a backed-off retry rather than reordering or parallelising.
    const pending = list(householdId).filter((m) => m.status === "pending")
    for (const item of pending) {
      const settled = await replay(item)
      if (!settled) {
        scheduleRetry(item.retryCount)
        break
      }
      settledCount += 1
    }
  } finally {
    running = false
  }

  // Refetch on any settle, not just success: a dropped (4xx) item's rollback is
  // "re-fetch the true server state" rather than manually undoing the optimistic
  // write. Skip entirely when nothing changed, so an empty/no-op pass is free.
  if (settledCount > 0) invalidateTransactionScope(householdId)

  if (dirty) {
    dirty = false
    void processQueue()
  }
}
