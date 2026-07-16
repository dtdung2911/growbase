import { QueryClient } from "@tanstack/react-query"
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister"
import { appStorage } from "@/lib/storage/mmkv"

export const queryClient = new QueryClient()

export const persister = createSyncStoragePersister({
  storage: appStorage,
  key: "growbase-query-cache",
})

// Switching household / logout must leave no cross-household data behind: drop
// both the in-memory cache and its persisted MMKV blob.
export async function purgeQueryCache(): Promise<void> {
  await queryClient.cancelQueries()
  queryClient.clear()
  await persister.removeClient()
}
