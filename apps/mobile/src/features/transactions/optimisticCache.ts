import type { QueryClient } from "@tanstack/react-query"
import type { CreateTransactionInput } from "@growbase/shared/schemas/transaction"

// The 16.2 list query isn't built yet; its rows are modelled as create-input plus
// an id (the idempotency key for offline rows, so 16.4 can correlate cache↔queue).
export type OptimisticTransaction = CreateTransactionInput & { id: string }

export async function mutateCache(
  qc: QueryClient,
  key: readonly unknown[],
  transform: (rows: OptimisticTransaction[]) => OptimisticTransaction[]
): Promise<void> {
  await qc.cancelQueries({ queryKey: key })
  const previous = qc.getQueryData<OptimisticTransaction[]>(key) ?? []
  qc.setQueryData<OptimisticTransaction[]>(key, transform(previous))
}
