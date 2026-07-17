import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import {
  getSnapshot,
  subscribe,
  updateStatus,
  type QueuedMutation,
} from "@/lib/sync/mutationQueue"
import { processQueue } from "@/lib/sync/syncEngine"

export type SyncStatus = "pending" | "error" | "synced" | null

const SYNCED_FLASH_MS = 2_000

// A create's optimistic row is keyed by the queue item id; an edit carries the
// real tx id in its path. Delete removes the row optimistically, so only
// create/edit ever surface a chip. A transaction can have more than one queued
// mutation (e.g. an edit that errored, followed by a newer offline edit) — pick
// the most recent by createdAt so status/retry always act on the latest one.
function matchQueued(queue: QueuedMutation[], txId: string): QueuedMutation | undefined {
  const matches = queue.filter((m) => m.id === txId || m.path === `/api/transactions/${txId}`)
  return matches.reduce<QueuedMutation | undefined>(
    (latest, m) => (!latest || m.createdAt > latest.createdAt ? m : latest),
    undefined,
  )
}

export function resolveSyncStatus(
  queue: QueuedMutation[],
  txId: string,
): "pending" | "error" | null {
  return matchQueued(queue, txId)?.status ?? null
}

// A dropped (4xx) item stays in the queue as "error" and is skipped by
// processQueue until it's pending again — re-arm it before kicking the drain.
export function retrySync(txId: string): void {
  const item = matchQueued(getSnapshot(), txId)
  if (item?.status === "error") updateStatus(item.id, "pending")
  void processQueue()
}

export function useSyncStatus(txId: string): { status: SyncStatus; retry: () => void } {
  const queued = useSyncExternalStore(subscribe, () => resolveSyncStatus(getSnapshot(), txId))

  const [flashSynced, setFlashSynced] = useState(false)
  const prev = useRef(queued)
  useEffect(() => {
    if (prev.current !== null && queued === null) {
      setFlashSynced(true)
      const timer = setTimeout(() => setFlashSynced(false), SYNCED_FLASH_MS)
      prev.current = queued
      return () => clearTimeout(timer)
    }
    if (queued !== null) setFlashSynced(false)
    prev.current = queued
  }, [queued])

  return {
    status: flashSynced && queued === null ? "synced" : queued,
    retry: () => retrySync(txId),
  }
}
