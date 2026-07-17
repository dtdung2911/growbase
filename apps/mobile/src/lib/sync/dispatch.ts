import * as Crypto from "expo-crypto"
import { enqueue, type QueuedMutation } from "@/lib/sync/mutationQueue"
import { processQueue } from "@/lib/sync/syncEngine"

type Dispatchable = Pick<QueuedMutation, "householdId" | "kind" | "path" | "method" | "body">

// Offline-first: persist the write locally with a STABLE idempotency key, then
// kick the engine. Online it drains now; offline it waits for reconnect. The same
// key is reused on every replay so the 14.4 server dedupe blocks duplicates.
export function enqueueAndSync(input: Dispatchable): QueuedMutation {
  const idempotencyKey = Crypto.randomUUID()
  const item: QueuedMutation = {
    id: idempotencyKey,
    idempotencyKey,
    householdId: input.householdId,
    kind: input.kind,
    path: input.path,
    method: input.method,
    body: input.body,
    createdAt: Date.now(),
    retryCount: 0,
    status: "pending",
  }
  enqueue(item)
  void processQueue()
  return item
}
