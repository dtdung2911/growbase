# Epic 16 Context: Transaction Capture & Offline

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

This is the product's core loop: capture a transaction in under 15 seconds, view/edit/delete recent transactions, and keep all of that working reliably when the device has no signal — no lost entries, no duplicates on reconnect (CAP-2, CAP-6). It delivers the primary reason the mobile app exists (fast, low-friction capture in the moment) while extending the offline-first architecture built in Epic 14 into real user-facing behavior: local durable queuing of writes, idempotent replay, and visible sync/cache-freshness state so the user always trusts what they see.

## Stories

- Story 16.1: Quick-add giao dịch (<15s)
- Story 16.2: List + sửa/xóa giao dịch
- Story 16.3: Offline queue + idempotent sync
- Story 16.4: Sync status + cached read

## Requirements & Constraints

- Create transaction with the same fields as web: amount, category, date (default today), fund/direction (income/expense), optional note.
- Capture screen must be tap-minimized: number keypad pre-focused for amount, category quick-pick with recent/frequent entries surfaced first, date and fund pre-defaulted. End-to-end (icon tap → biometric unlock → save complete) must be under 15s; cold start to entry screen ≤3s on a mid-range device.
- Users can view recent transactions and edit/delete only their own transactions from the current month.
- Every write must go through server-side business rules unchanged — fund operations via atomic RPC, `behavior_type` stays readonly — the client must never reimplement that logic locally.
- No data loss for transactions created offline; sync must be idempotent so retries never produce duplicate records.
- While offline, other screens must still show the last-synced data from cache with a visible "as of {time}" indicator.
- Each transaction created offline must expose a sync status (pending / synced / error) in the UI.
- Accessibility floor applies to capture form and sync indicators: touch targets ≥44px, input font ≥16px, screen-reader labels on FAB and sync chip.

## Technical Decisions

- Offline model (AD-M4): reads come from the persisted TanStack Query cache (`persistQueryClient` + MMKV, `gcTime >= maxAge`). Writes are pushed into a durable local mutation queue and replayed sequentially once back online; each mutating call carries a client-generated Idempotency-Key (the `/api` dedupe-by-key backend behavior was already delivered in Epic 14, Story 14.4 — this epic only consumes it).
- Queue eligibility is narrow: only transaction create/edit/delete are queued offline. Balance-sensitive fund operations are online-only and out of mobile v1 scope entirely — they must never be queued, since replaying them against a stale local balance would corrupt state.
- Replay failure handling: a 4xx conflict response surfaces to the user and the mutation is dropped from the queue; 5xx or network failures retry with backoff.
- Household-scoped cache (AD-M9): the persisted query cache is partitioned by `householdId`. Switching household purges and invalidates the persisted cache before loading the new household's data; logout clears cache and session entirely.
- All data access goes through `fetch` to `/api/*` (never `supabase-js` directly for data — AD-M1); every request carries `Authorization: Bearer <access_token>` (AD-M2).
- Client conventions mirror web (AD-M6): TanStack Query v5 + Zustand v5, query keys only via the shared `keys.*` factory, `householdId`/`currentMonth` read only from the Zustand store. MMKV is the single storage layer for both query-cache persistence and Zustand persistence.

## UX & Interaction Patterns

- Quick-add is a FAB ("+") that opens a bottom sheet with spring animation. Focus order: amount (number keypad pre-open) → category quick-pick (recent/frequent first) → date (default today) → fund (default) → Save. Saving shows a 2s success toast, returns to the prior screen, and updates visible figures immediately.
- Transaction list: swipe a row to reveal Edit/Delete, scoped to the user's own current-month transactions. Skeleton while loading, empty state when there's nothing to show; amounts always render in mono/tabular-nums.
- Offline variant of the capture flow: with no signal, the transaction still saves locally, shown with a `pending` chip plus an offline banner; once connectivity returns, it syncs automatically and the chip disappears.
- Sync chip is a small pill: pending (muted), synced (success), error (error) — the error state includes a retry action.
- When offline and reading other screens, show a cached-data indicator ("Số liệu tính đến {time}") rather than presenting stale data as live.

## Cross-Story Dependencies

- Story 16.1 (create) and Story 16.2 (list/edit/delete) are the entry points whose writes Story 16.3's offline queue wraps.
- Story 16.3's idempotent sync relies on the Bearer + Idempotency-Key fetch client already built in Epic 14 (Story 14.3) and the server-side dedupe behavior from Story 14.4 — no new backend contract is introduced here.
- Story 16.4 (sync status + cached read) surfaces state produced by Story 16.3's queue and depends on the same household-scoped cache partitioning (AD-M9) used by household switching in Epic 15 and by stats/funds/budget reads in Epic 17.
- The whole epic depends on Epic 14 (API client, monorepo/shared code) and Epic 15 (auth/unlock, household + month context, nav shell) being complete before work starts.
