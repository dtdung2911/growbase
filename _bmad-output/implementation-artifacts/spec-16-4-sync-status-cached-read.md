---
title: 'Sync Status Display + Cached/Offline Read'
type: 'feature'
created: '2026-07-17'
status: 'done'
baseline_revision: '47d845ee95b9d83cadabe7f57e9d603674358b06'
final_revision: '9b6b0e25671b1affb2707855e7d2a3e6fe7968ec'
review_loop_iteration: 0
followup_review_recommended: false
context: ['_bmad-output/implementation-artifacts/epic-16-context.md']
warnings: []
---

<intent-contract>

## Intent

**Problem:** Users on the mobile app have no visibility into whether their offline-created transactions have synced, are pending, or failed — and no indication that data shown while offline is stale/cached.

**Approach:** Add a per-transaction sync-state chip (pending/synced/error) driven by the existing mutation queue's `subscribe`/`getSnapshot` API, an app-wide offline banner driven by connectivity state, and a "data as of {time}" indicator on the transactions list using TanStack Query's `dataUpdatedAt`.

## Boundaries & Constraints

**Always:**
- Read queue state via `mutationQueue.subscribe`/`getSnapshot` (already exported, `useSyncExternalStore`-shaped) — never poll or re-derive queue state by other means.
- Resolve a transaction's sync status by matching queue items to the transaction id (queue items are keyed per-transaction already, per `hasUnsyncedCreate` precedent) — pending/error come directly from `QueuedMutation.status`; "synced" is a transient UI-only state inferred when a previously-matched item disappears from the snapshot (i.e., removed after successful replay).
- All new copy goes through `t()`, added to both `apps/mobile/src/lib/i18n/messages/en.ts` and `vi.ts` under a new `sync.*` / `offline.*` namespace (parity test enforces both files).
- Offline banner driven by connectivity, not by queue emptiness — read connectivity via a new small hook wrapping `@tanstack/react-query`'s `onlineManager` (already bridged to NetInfo in `onlineManager.ts`), not a second NetInfo subscription.
- Cached "data as of" indicator scoped to the transactions list only (`useTransactions`), using `dataUpdatedAt` from its `useQuery` result — no other screen currently fetches real data to attach this to.
- Follow `apps/mobile/src/api/client.test.ts` / `mmkvStub.ts` patterns for new tests (fetch stubbing, MMKV stub already globally aliased).

**Block If:** none — scope is fully determined by current codebase state (see Never below for what's out of scope and why).

**Never:**
- Do not build cached-read UI for stats/funds/budget — those screens (`app/(tabs)/index.tsx`, `stats.tsx`) are bare placeholders with no data fetching; the epic-context assumption that they exist is stale. Out of scope for this story.
- Do not change `mutationQueue.ts` or `syncEngine.ts` retry/backoff/drop/idempotency semantics — those are settled in story 16.3 and out of scope here.
- Do not add a `"synced"` status field to `QueuedMutation` — synced is UI-derived only, never persisted.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Pending offline create | Transaction created while offline, queue item `status: "pending"` | Row shows muted "pending" chip | No error |
| Sync succeeds | Queued item removed from snapshot after successful replay | Chip briefly shows "synced" success state, then disappears | No error |
| Sync fails (dropped) | Queue item `status: "error"` (e.g. 404/400 drop) | Row shows error-colored chip with retry affordance | Retry re-enqueues or triggers `processQueue()` |
| Goes offline | NetInfo/onlineManager reports offline | App-wide banner appears with offline copy | No error |
| Comes back online | onlineManager reports online again | Banner disappears; existing `processQueue()` trigger (from 16.3) unaffected | No error |
| Viewing cached transactions offline | Transactions list rendered from persisted cache while offline | "Số liệu tính đến {time}" indicator shown using `dataUpdatedAt` | No error |

</intent-contract>

## Code Map

- `apps/mobile/src/lib/sync/mutationQueue.ts` -- existing queue read API (`subscribe`, `getSnapshot`, `QueuedMutation` type) consumed by new hook, unmodified
- `apps/mobile/src/lib/sync/syncEngine.ts` -- existing `processQueue()` retry entry point, referenced for manual-retry action, unmodified
- `apps/mobile/src/lib/sync/useSyncStatus.ts` -- NEW: `useSyncExternalStore`-based hook exposing per-transaction sync status (`"pending" | "error" | "synced" | undefined`) and a `retry()` action
- `apps/mobile/src/lib/network/onlineManager.ts` -- existing NetInfo↔onlineManager bridge, source for new `useIsOnline` hook
- `apps/mobile/src/lib/network/useIsOnline.ts` -- NEW: small hook wrapping `@tanstack/react-query`'s `onlineManager` subscription
- `apps/mobile/src/features/transactions/TransactionRow.tsx` -- add sync-state chip, currently renders no sync indicator
- `apps/mobile/src/features/transactions/useTransactions.ts` -- source of `dataUpdatedAt` for the cached-data indicator
- `apps/mobile/app/(tabs)/transactions.tsx` -- render offline banner + "data as of" indicator above the list
- `apps/mobile/src/lib/i18n/messages/en.ts`, `vi.ts` -- add `sync.*`/`offline.*` keys (parity enforced by `parity.test.ts`)
- `apps/mobile/src/api/client.test.ts`, `apps/mobile/src/test/mmkvStub.ts` -- reference test patterns (fetch stubbing, MMKV stub) to follow for new hook tests

## Tasks & Acceptance

**Execution:**
- [x] `apps/mobile/src/lib/sync/useSyncStatus.ts` -- create hook wrapping `mutationQueue.subscribe`/`getSnapshot`, deriving pending/error per transaction id and a transient synced flag on item removal, plus `retry(transactionId)` calling `processQueue()` -- centralizes status derivation so `TransactionRow` stays presentational
- [x] `apps/mobile/src/lib/sync/useSyncStatus.test.ts` -- unit test pending/error/synced-transition/retry cases against a stubbed queue
- [x] `apps/mobile/src/lib/network/useIsOnline.ts` -- create hook subscribing to `onlineManager` for boolean connectivity state
- [x] `apps/mobile/src/features/transactions/TransactionRow.tsx` -- render sync chip (muted pending / success-then-fade synced / error with retry tap) using `useSyncStatus`
- [x] `apps/mobile/app/(tabs)/transactions.tsx` -- render offline banner (via `useIsOnline`) and "data as of {time}" indicator (via `useTransactions`'s `dataUpdatedAt`) above the list
- [x] `apps/mobile/src/lib/i18n/messages/en.ts`, `vi.ts` -- add `sync.pending`, `sync.synced`, `sync.error`, `sync.retry`, `offline.banner`, `offline.dataAsOf` keys (vi copy for `dataAsOf`: "Số liệu tính đến {time}")

**Acceptance Criteria:**
- Given a transaction created while offline, when the queue item is pending, then its row shows a muted pending chip.
- Given a pending queue item is successfully replayed and removed from the queue, when the UI next renders, then the row briefly shows a synced state before returning to normal.
- Given a queue item is dropped with an error status, when viewing the row, then an error chip with a retry action is shown, and tapping retry triggers `processQueue()`.
- Given the device goes offline, when on the transactions screen, then an offline banner is visible; when connectivity returns, the banner disappears.
- Given the transactions list is rendered from persisted cache while offline, when viewing the screen, then a "data as of {time}" indicator is shown using the query's `dataUpdatedAt`.
- Given a new i18n key is added, when `parity.test.ts` runs, then it passes (both `en.ts` and `vi.ts` have matching non-empty keys).

## Design Notes

The mutation queue never records a `"synced"` status (items are simply removed on success, per `mutationQueue.ts`/`syncEngine.ts` from story 16.3) — `useSyncStatus` must track this by diffing the previous snapshot against the current one: if a transaction id was present with `status: "pending"` on the last snapshot and is absent now, treat it as newly synced and hold that UI state for a short fixed duration (e.g. via local state + timeout) before clearing. This keeps `mutationQueue.ts` unchanged (per Never) while still supporting the synced UI moment.

## Verification

**Commands:**
- `pnpm --filter @growbase/mobile test` -- expected: all tests pass, including new `useSyncStatus.test.ts` and updated `parity.test.ts`
- `pnpm --filter @growbase/mobile typecheck` -- expected: no TypeScript errors

**Manual checks (if no CLI):**
- Run mobile app via dev client, toggle airplane mode, create a transaction offline, confirm pending chip appears, re-enable network, confirm chip transitions to synced then disappears.

## Spec Change Log

(none — no bad_spec loopback occurred)

## Review Triage Log

### 2026-07-17 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 4 (high 1, medium 2, low 1)
- defer: 1
- reject: 8
- addressed_findings:
  - `[high]` `[patch]` `matchQueued` in `useSyncStatus.ts` used `.find()` (first/oldest match) when a transaction has more than one queued mutation (e.g. an errored edit followed by a newer offline edit) — chip status and retry could act on the stale item. Changed to select the most-recently-created match by `createdAt`.
  - `[medium]` `[patch]` i18n key `offline.cachedAs` didn't match the spec-contracted name `offline.dataAsOf`. Renamed in `en.ts`, `vi.ts`, and the usage site in `transactions.tsx`.
  - `[medium]` `[patch]` "data as of" indicator render condition included `transactions.length > 0`, hiding the cached-data indicator for a genuinely empty offline transaction list, contradicting the spec's "Always" boundary (scoped to the transactions list, not to non-empty state). Dropped the length clause.
  - `[low]` `[patch]` `flashSynced` was only reset to `false` on the `queued === null` transition; a rapid pending→null→pending cycle within the 2s flash window could leave it stuck `true` (masked today only by an independent `queued === null` check at the render site). Added a reset when `queued` transitions back to non-null.

## Auto Run Result

**Status:** done

**Summary:** Added per-transaction sync-state chip (pending/synced/error+retry) driven by the existing mutation queue, an app-wide offline banner driven by connectivity, and a "data as of {time}" cached-data indicator on the transactions list. No changes to `mutationQueue.ts`/`syncEngine.ts` semantics.

**Files changed:**
- `apps/mobile/src/lib/sync/useSyncStatus.ts` (new) — hook deriving pending/error/synced status + retry action from the queue snapshot
- `apps/mobile/src/lib/sync/useSyncStatus.test.ts` (new) — unit tests for the pure status/retry helpers
- `apps/mobile/src/lib/network/useIsOnline.ts` (new) — boolean connectivity hook wrapping `onlineManager`
- `apps/mobile/src/features/transactions/TransactionRow.tsx` — renders the sync chip
- `apps/mobile/app/(tabs)/transactions.tsx` — renders offline banner + cached-data indicator
- `apps/mobile/src/lib/i18n/messages/en.ts`, `vi.ts` — new `sync.*`/`offline.*` keys

**Review findings breakdown:** 4 patched (1 high, 2 medium, 1 low — all applied directly, see Review Triage Log), 1 deferred (no RN hook/component test-renderer harness exists yet for the new stateful/UI pieces), 8 rejected as noise/unreachable/already-mitigated (e.g. delete optimistically removes the row before a chip could render; default `networkMode: 'online'` means no fetch attempts while offline so isError-vs-cached-indicator can't conflict; `processQueue()` already fully swallows errors internally so it can never reject; concurrent-retry taps are naturally coalesced by `syncEngine`'s `running`/`dirty` flags). 0 intent_gap, 0 bad_spec.

**Verification performed:** `pnpm --filter @growbase/mobile test` — 123/123 passed across 20 files (including `useSyncStatus.test.ts` and `parity.test.ts`); `pnpm --filter @growbase/mobile type-check` — clean, no errors. Both re-run after applying all 4 patches.

**Residual risks:** No automated coverage for the flash-timer stateful transition in `useSyncStatus` or for the new `useIsOnline`/banner/indicator rendering (tracked in deferred-work.md — needs an RN test-renderer dependency this project doesn't have yet). Manual device/dev-client verification of the visual chip states and offline banner was not performed in this automated run.
