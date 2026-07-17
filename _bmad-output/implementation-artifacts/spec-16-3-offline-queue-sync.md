---
title: 'Story 16.3 — Offline queue + idempotent sync (mobile)'
type: 'feature'
created: '2026-07-17'
status: 'done'
review_loop_iteration: 0
followup_review_recommended: false
context: ['_bmad-output/implementation-artifacts/epic-16-context.md']
warnings: ['oversized']
baseline_revision: '283a48ab83117b051a5322722b4856d5e065783a'
---

<intent-contract>

## Intent

**Problem:** The mobile app can render placeholder capture/list screens but has no way to write transactions offline. There is no durable local queue, no automatic replay on reconnect, and no guarantee that a retried write won't create duplicate records. Stories 16.1/16.2 are still placeholders, so the offline-aware mutation layer they will call does not exist yet.

**Approach:** Build a durable, household-scoped MMKV mutation queue plus a sequential sync engine on top of the existing `apiFetch` client (which already accepts a caller-supplied `Idempotency-Key`). Add connectivity detection via `@react-native-community/netinfo` wired to TanStack `onlineManager`, and offline-aware transaction mutation hooks that optimistically update the cache, enqueue when offline, and replay idempotently on reconnect. Only transaction create/edit/delete are queue-eligible (AD-M4).

## Boundaries & Constraints

**Always:**
- Every queued item is minted with a STABLE `idempotencyKey` at enqueue time and sends that SAME key on every replay attempt via `apiFetch(path, { idempotencyKey })` — this is what makes replay idempotent against the 14.4 server dedupe.
- Queue replay is strictly sequential (FIFO, one in-flight at a time) and survives app restarts (persisted to MMKV via `appStorage`).
- Queue is partitioned by `householdId` (AD-M9) and purged alongside the query cache on household switch and logout (extend `purgeQueryCache()`).
- All data access goes through `apiFetch` to `/api/*` with `Authorization: Bearer` (AD-M1/M2); query keys only via `keys.*` from `@growbase/shared/queryKeys`; `householdId`/`currentMonth` read only from `useAppStore`.
- Replay outcome rules: 2xx → remove from queue + invalidate affected keys; 400/401/403/404 → drop item + mark `error` (surface to UI) + roll back optimistic entry; 409 (in-flight duplicate), 5xx, and network failures → keep item, retry with backoff, increment `retryCount`.

**Block If:**
- The persisted queue schema would need to change in a way that cannot be migrated non-destructively for users who already have pending offline items (there are none in production yet — expected false, but HALT if that assumption breaks).

**Never:**
- Never queue fund RPCs (`/api/funds/*`) or transfers (`/api/transactions/transfer`) — they are balance-sensitive and online-only per AD-M4; replaying against a stale local balance would corrupt state. The queue must reject/bypass anything that is not a plain transaction create/edit/delete.
- Never reimplement server business rules locally (`behavior_type`, fund logic stay server-side).
- Do not build the sync-status chip UI, offline banner, or "as of {time}" cached-read indicator — that is Story 16.4. This story only PRODUCES the observable queue state (pending/error) those consume.
- Do not configure TanStack paused-mutation persistence; the durable queue is the single source of offline writes.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Enqueue offline | Create tx while `onlineManager` reports offline | Item persisted to MMKV with stable key + `status:"pending"`; optimistic tx written to `keys.transactions(hid,month)` cache | No error expected |
| Reconnect drain | Offline→online with N pending items | Items replayed FIFO, one at a time; each removed on 2xx; affected query keys invalidated | Per-item rules below |
| Idempotent retry | Prior attempt reached server but response lost (network drop); item retried | Same `idempotencyKey` resent → 14.4 replays cached original 2xx → item removed exactly once | No duplicate record created |
| Client 4xx | Replay returns 400/401/403/404 | Item dropped from queue; `status:"error"` set; optimistic entry rolled back | Error message stored on item for UI |
| In-flight 409 | Replay returns 409 "Yêu cầu đang được xử lý" | Item kept, retried with backoff (NOT dropped) — resolves to cached 2xx once server finishes | Transient; retryCount++ |
| Server 5xx / network | Replay throws `ApiError.status>=500` or fetch rejects | Item kept `pending`, retry with backoff | retryCount++, last error stored |
| Non-eligible op | Fund RPC or transfer requested | Executes online-only via `apiFetch`; never persisted to queue; fails cleanly if offline | Rejected before enqueue |
| Scope purge | Household switch or logout | Persisted queue for that scope cleared with the query cache | No error expected |

</intent-contract>

## Code Map

- `apps/mobile/src/api/client.ts` -- `apiFetch<T>(path,{method,body,idempotencyKey,signal})`, `ApiError{status}`; accepts stable idempotencyKey (reuse, do not modify)
- `apps/mobile/src/lib/storage/mmkv.ts` -- `appStorage` string KV over the plaintext `growbase-app` MMKV instance; queue persistence layer
- `apps/mobile/src/lib/query/queryClient.ts` -- `queryClient`, `persister`, existing `purgeQueryCache()` to extend with queue clear
- `apps/mobile/src/lib/query/QueryProvider.tsx` -- `PersistQueryClientProvider`; mount point to register onlineManager bridge + initial drain
- `apps/mobile/src/store/appStore.ts` -- `useAppStore` (`householdId`, `currentMonth`, `user`); read scope from here
- `packages/shared/src/schemas/transaction.ts` -- `createTransactionSchema`/`updateTransactionSchema`, `CreateTransactionInput`/`UpdateTransactionInput` (no delete schema; delete = URL `:id`)
- `packages/shared/src/queryKeys.ts` -- `keys.transactions/accounts/dashboard/budget/systemBalances` to invalidate after sync
- `apps/web/src/app/api/transactions/route.ts` + `[id]/route.ts` -- replay targets: `POST /api/transactions`, `PUT/DELETE /api/transactions/:id` (no PATCH)
- `apps/web/src/lib/api/idempotency.ts` -- server 14.4 dedupe: replayed key → cached original status+body; 409 while processing; 5xx releases key
- `apps/mobile/src/test/mmkvStub.ts` + `apps/mobile/src/api/client.test.ts` -- vitest patterns/test double to follow

## Tasks & Acceptance

**Execution:**
- [x] `apps/mobile/package.json` -- add `@react-native-community/netinfo` dependency -- required for connectivity/onlineManager; native module means a new dev build is needed (consistent with existing MMKV dev-client requirement)
- [x] `apps/mobile/src/lib/sync/mutationQueue.ts` -- durable queue: `type QueuedMutation` (`id`, `idempotencyKey`, `householdId`, `kind:"create"|"update"|"delete"`, `path`, `method`, `body?`, `createdAt`, `retryCount`, `status:"pending"|"error"`, `error?`), and `enqueue/list(hid)/remove/updateStatus` persisted via `appStorage` under a single namespaced key, plus `subscribe`/`getSnapshot` (external-store shape) so 16.4 can render state -- single durable source of offline writes
- [x] `apps/mobile/src/lib/sync/mutationQueue.test.ts` -- vitest: enqueue+persist round-trip, FIFO ordering, remove, householdId partition/purge, reject non-eligible op -- cover matrix enqueue/partition/purge/non-eligible rows
- [x] `apps/mobile/src/lib/sync/syncEngine.ts` -- `processQueue()`: drain pending FIFO one-at-a-time via `apiFetch(path,{method,body,idempotencyKey})`; apply replay outcome rules (2xx remove+invalidate; 4xx≠409 drop+error+rollback; 409/5xx/network retry with capped exponential backoff); guarded against concurrent runs -- sequential idempotent replay
- [x] `apps/mobile/src/lib/sync/syncEngine.test.ts` -- vitest with mocked `apiFetch`/`ApiError`: 2xx removal+invalidate, idempotent replay (same key on retry), 4xx drop, 409 retain, 5xx/network retry+backoff -- cover matrix reconnect/idempotent/4xx/409/5xx rows
- [x] `apps/mobile/src/lib/network/onlineManager.ts` -- bridge NetInfo → TanStack `onlineManager.setEventListener`; on offline→online transition call `processQueue()` -- automatic drain on reconnect
- [x] `apps/mobile/src/features/transactions/useCreateTransaction.ts`, `useUpdateTransaction.ts`, `useDeleteTransaction.ts` -- offline-aware `useMutation` hooks: mint stable `idempotencyKey`, optimistic write to `keys.transactions(hid,month)`; if online replay immediately else enqueue; on settle invalidate `keys.transactions/accounts/dashboard/systemBalances`; rollback on drop -- the mutation layer 16.1/16.2 UI will call (one cohesive task, shared enqueue helper)
- [x] `apps/mobile/src/lib/query/queryClient.ts` -- extend `purgeQueryCache()` to also clear the persisted mutation queue for the scope -- keep queue and cache purge atomic on switch/logout (AD-M9)
- [x] `apps/mobile/src/lib/query/QueryProvider.tsx` -- register the onlineManager bridge on mount and trigger one `processQueue()` on startup when online -- durable items from prior sessions drain after cold start

**Acceptance Criteria:**
- Given the app cold-starts online with pending items left in MMKV from a prior session, when the provider mounts, then the queue drains automatically without user action.
- Given multiple pending items, when the queue processes, then items replay strictly FIFO with at most one request in flight (no parallel replay).
- Given any fund RPC or transfer is requested, when it is dispatched, then it executes online-only and is never written to the mutation queue.
- Given a queued item, when it is retried after any ambiguous failure, then the identical `Idempotency-Key` is sent on every attempt so the server dedupe prevents duplicate records.
- Given a household switch or logout, when purge runs, then that scope's persisted queue is cleared together with the query cache.

## Design Notes

The epic states a blanket "4xx → drop" rule, but 14.4's `withIdempotency` returns **409** while a same-key request is still processing server-side. Dropping a 409 would discard a write that is actually succeeding. Deliberate refinement: 409 is treated as transient (retry with backoff); only 400/401/403/404 drop. This is grounded in the real server contract, not invented.

Stable-key example (the load-bearing detail):

```ts
const idempotencyKey = Crypto.randomUUID();      // once, at enqueue
enqueue({ id: idempotencyKey, idempotencyKey, householdId, kind: "create",
  path: "/api/transactions", method: "POST", body, createdAt: Date.now(),
  retryCount: 0, status: "pending" });
// every replay: apiFetch(item.path, { method: item.method, body: item.body,
//   idempotencyKey: item.idempotencyKey })
```

Queue lives on the plaintext `growbase-app` MMKV instance (same as the query cache that already holds transaction data) — do not use the encrypted `growbase-supabase-auth` instance.

## Verification

**Commands:**
- `pnpm --filter @growbase/mobile type-check` -- expected: no TypeScript errors
- `pnpm --filter @growbase/mobile test` -- expected: new mutationQueue + syncEngine vitest suites pass (drop/retry/idempotent-replay covered)

## Dev Agent Record

**Status:** implementation complete — set to `in-review`.

### Files created
- `apps/mobile/src/lib/sync/mutationQueue.ts` -- durable household-scoped queue. `QueuedMutation` type + `enqueue`/`list(hid)`/`remove`/`updateStatus`/`recordRetry`/`clear`/`subscribe`/`getSnapshot`. Single MMKV key `growbase-mutation-queue` on plaintext `growbase-app`. `isEligible()` (mutationQueue.ts:19) rejects fund RPCs and transfers before enqueue.
- `apps/mobile/src/lib/sync/syncEngine.ts` -- `processQueue()` (syncEngine.ts:60): FIFO one-in-flight replay via `apiFetch` with stable `idempotencyKey`; outcome rules at `replay()` (syncEngine.ts:31); capped exponential backoff `scheduleRetry()` (syncEngine.ts:49, 1s→30s); `invalidateTransactionScope()` (syncEngine.ts:18) shared with hooks.
- `apps/mobile/src/lib/network/onlineManager.ts` -- `bridgeOnlineManager()` wires NetInfo → TanStack `onlineManager`; drains queue on offline→online transition.
- `apps/mobile/src/lib/sync/dispatch.ts` -- `enqueueAndSync()` shared helper: mints stable key, enqueues, kicks `processQueue()`.
- `apps/mobile/src/features/transactions/optimisticCache.ts` -- `mutateCache()` + `OptimisticTransaction` type.
- `apps/mobile/src/features/transactions/useCreateTransaction.ts` / `useUpdateTransaction.ts` / `useDeleteTransaction.ts` -- offline-aware mutation hooks.
- `apps/mobile/src/lib/sync/mutationQueue.test.ts` (13 tests) + `apps/mobile/src/lib/sync/syncEngine.test.ts` (16 tests).

### Files modified
- `apps/mobile/src/lib/query/queryClient.ts:19` -- `purgeQueryCache()` now also calls `clearMutationQueue()`.
- `apps/mobile/src/lib/query/QueryProvider.tsx` -- registers the onlineManager bridge on mount, always drains (no ineffective `isOnline()` gate — review patch #6), re-drains on late `householdId` hydration.
- `apps/mobile/package.json` -- added `@react-native-community/netinfo@^11.4.1` (native module → new dev build required, consistent with existing MMKV dev-client requirement).
- `apps/mobile/src/lib/sync/mutationQueue.ts` -- review patches #1 (`Array.isArray` guard) and #2 (`hasUnsyncedCreate()`).
- `apps/mobile/src/lib/sync/syncEngine.ts` -- review patches #3 (`dirty` re-drain flag) and #4/#5 (`settledCount`-gated invalidate covering both success and drop).
- `apps/mobile/src/features/transactions/useUpdateTransaction.ts` / `useDeleteTransaction.ts` -- guard with `hasUnsyncedCreate()` before enqueueing (review patch #2).

### Decisions
1. **Offline-first single replay path (Design A):** hooks always `enqueue` + kick `processQueue()` rather than branching online/offline in the hook. When online the item drains immediately (2xx → remove + invalidate); when offline it waits. This removes duplicated outcome logic and matches the epic UX (local save always succeeds, pending chip until sync). "Replay immediately when online" is satisfied by the immediate kick.
2. **"Rollback on drop" lives in the engine, not the hook.** A 4xx surfaces during background replay (after the mutation promise settled), so rollback is done via `invalidateTransactionScope()` — a refetch drops the never-persisted optimistic create / reverts the optimistic edit/delete. A 4xx implies we were online, so the refetch succeeds. Hook-level `onError` rollback would be unreachable for the background path.
3. **Error items stay in the queue with `status:"error"`** (not physically deleted). `processQueue` only replays `status:"pending"`, so they are "dropped from replay" while remaining as records for Story 16.4's error chip + retry action. Reconciles the matrix's "dropped from queue" + "status error set".
4. **409 refinement (from spec Design Notes):** only 400/401/403/404 drop; 409 is treated as transient (14.4 "still processing") and retried with backoff. Grounded in `apps/web/src/lib/api/idempotency.ts`.
5. **Purge is a full queue wipe.** The query cache purge is already global (`queryClient.clear()`), so `clear()` wipes all scopes; partitioning governs replay/display scope during a session, purge is the hard reset (AD-M9). Trivially satisfies "that scope's queue is cleared".
6. **Backoff via self-scheduling `setTimeout`** (one pending timer, head-of-line FIFO). Transient failures retry indefinitely with capped delay (no data loss); only definitive 4xx stop.

### Test / typecheck results
- `pnpm --filter @growbase/mobile type-check` -- PASS (no errors).
- `pnpm --filter @growbase/mobile test` -- PASS, 93/93 tests. Covers enqueue/persist, FIFO, partition/purge, non-eligible rejection, 2xx removal+invalidate, identical-key retry, 4xx drop, 409 retain, 5xx/network retain+retryCount, head-of-line block, single-in-flight concurrency guard, corrupt-blob reset, `hasUnsyncedCreate`, lost-wakeup re-drain, empty-pass invalidate-skip, drop-still-invalidates.

### Blocking issues
None. Story 16.1/16.2 UI and Story 16.4 sync-status chip are intentionally out of scope; this story produces the queue state they consume. The `OptimisticTransaction` cache shape is a documented assumption pending 16.2's real list query (engine invalidation reconciles once it exists).

## Review Triage Log

Blind dual review (Blind Hunter + Edge Case Hunter) against the intent-contract above. 14 findings deduped and triaged; 6 `patch` (fixed directly), 2 `reject` (already-specified or unreachable), 4 `defer` (valid, out of scope), 0 `intent_gap`, 0 `bad_spec`.

**patch — fixed:**
1. `mutationQueue.ts` `load()` crashed on a valid-but-non-array persisted blob (e.g. `"{}"`) — now guards with `Array.isArray`, resets to empty on mismatch.
2. Id-mismatch cascade: editing/deleting a transaction whose create hasn't synced yet targets a server id that doesn't exist. Added `hasUnsyncedCreate()` and wired it into `useUpdateTransaction`/`useDeleteTransaction` as a guard that throws before enqueueing.
3. Lost wakeup: an item enqueued while a pass was already in-flight wasn't picked up until some other trigger fired. Added a `dirty` flag in `syncEngine.ts` — a pass that finds itself re-entered flags for one more drain instead of dropping the write.
4. Empty-queue pass always invalidated (wasted refetch on every reconnect/mount even with nothing to do). Now gated on `settledCount > 0`.
5. Contract's "roll back optimistic entry on 4xx" was never implemented — no rollback path existed on the background-replay drop. Reframed as refetch-on-any-settle (`settledCount` increments on success-remove AND drop-to-error), so a 4xx now triggers `invalidateTransactionScope()` same as a 2xx.
6. `onlineManager.ts` mount-time `isOnline()` gate in `QueryProvider.tsx` was a no-op — TanStack's synchronous default (`true`) is read before NetInfo's first async event ever arrives, so the "only drain if online" check never actually gated anything and cold-start could still miss a real offline state. Removed the gate (`processQueue()` is a safe no-op offline), and added a `useAppStore` subscribe to catch `householdId` hydrating after mount.

Regression tests added for all 6 (2 in `mutationQueue.test.ts`, 3 in `syncEngine.test.ts`; #6 is covered structurally by removing the dead branch — no new test needed since there's no conditional left to cover).

**reject — not a bug:**
7. Household-switch/logout silently purging the queue — this is the contract's I/O matrix row "Scope purge" verbatim ("No error expected"). Explicitly specified behavior, not a gap.
8. `enqueue()` throwing on an ineligible kind/path combo is unreachable in practice: `isEligible()` guards it and all three transaction hooks construct calls correctly. No caller path can hit it.

**defer — valid, out of scope for this story:**
9. `DROP_STATUSES` only covers 400/401/403/404; other 4xx codes (e.g. 422) fall through to retry-forever. Contract only specifies the five outcomes it lists; broadening the drop set is a future refinement, not a regression against this contract.
10. Household switch mid-replay: a stale `householdId` closure inside an in-flight pass, and an orphaned `retryTimer` surviving the switch, aren't fully reconciled. Real, but session-switch hardening is a bigger surface than this story's queue/replay contract covers.
11. Dropped (`status:"error"`) items are never pruned from the queue — by design (Story 16.4 owns the error chip + retry/dismiss action per the contract's "Never" clause); pruning likely belongs there.
12. The queue only surfaces the active household's pending items — correct per AD-M9 scoping, but surfacing background-household pending state is a possible future UX nicety, not a defect here.

**Verification performed:** `pnpm --filter @growbase/mobile exec tsc --noEmit` (clean) and `pnpm --filter @growbase/mobile test -- --run` (93/93 passed) after all patches.

## Auto Run Result

Status: done
Blocking condition: none

Durable MMKV-backed offline mutation queue and sequential sync engine landed for transaction create/edit/delete, per AD-M4 (transaction-only, fund RPCs/transfers stay online-only) and AD-M9 (household-scoped, purged with the query cache on switch/logout). Idempotency-keyed replay with exponential backoff; drop-vs-retry outcome rules match the contract exactly (2xx remove+invalidate, 4xx drop+error+rollback-via-refetch, 409/5xx/network retain+retry).

Blind dual review (Blind Hunter + Edge Case Hunter) surfaced 14 deduped findings: 6 patched directly (corrupt-blob crash guard, id-mismatch cascade guard, lost-wakeup re-drain, empty-pass invalidate skip, 4xx rollback-via-refetch, dead onlineManager mount gate), 2 rejected (household-switch purge and unreachable-enqueue-throw are both already-specified/unreachable, not bugs), 4 deferred to `deferred-work.md`-equivalent scope (DROP_STATUSES breadth, household-switch mid-replay race, error-item pruning, cross-household pending visibility) — none block this story's contract.

Files changed: `apps/mobile/src/lib/sync/{mutationQueue,syncEngine,dispatch}.ts`, `apps/mobile/src/lib/network/onlineManager.ts`, `apps/mobile/src/lib/query/{QueryProvider,queryClient}.tsx|ts`, `apps/mobile/src/features/transactions/{useCreateTransaction,useUpdateTransaction,useDeleteTransaction,optimisticCache}.ts`, plus `mutationQueue.test.ts` / `syncEngine.test.ts`, `package.json`/`pnpm-lock.yaml` (added `@react-native-community/netinfo`).

Verification: `tsc --noEmit` clean; `93/93` tests passed. Committed at `bed9e79`, not pushed.
