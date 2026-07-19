import { QueryClient } from "@tanstack/react-query"
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"
import { appStorage } from "@/lib/storage/mmkv"
import { clear as clearMutationQueue } from "@/lib/sync/mutationQueue"

export const queryClient = new QueryClient()

export const persister = createSyncStoragePersister({
  storage: appStorage,
  key: "growbase-query-cache",
})

// Switching household / logout must leave no cross-household data behind: drop
// the in-memory cache, its persisted MMKV blob, and the durable mutation queue
// (AD-M9 — queue and cache are purged atomically).
export async function purgeQueryCache(): Promise<void> {
  await queryClient.cancelQueries()
  queryClient.clear()
  await persister.removeClient()
  clearMutationQueue()
}
