# Epic 16 Context: Transaction Capture & Offline

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

This epic delivers the core value proposition of the GrowBase mobile companion app: letting a user record a transaction in under 15 seconds from anywhere, edit or delete their own recent entries, and keep working reliably when offline — with no data loss and no duplicate records once connectivity returns. Everything here is scoped to transaction CRUD only; heavier management (fund operations, budget configuration) stays on the web app.

## Stories

- Story 16.1: Quick-add giao dịch (<15s)
- Story 16.2: List + sửa/xóa giao dịch
- Story 16.3: Offline queue + idempotent sync
- Story 16.4: Sync status + cached read

## Requirements & Constraints

- Tap-to-save for a new transaction must complete in under 15 seconds end-to-end; app cold start ≤3s.
- Transaction fields mirror web: amount, category, date, fund/direction, note.
- Entry screen must be optimized for speed: number keypad up front, category quick-pick prioritizing recent/frequently-used categories, sensible defaults (date = today, fund = default).
- Users may list, edit, and delete only their own transactions within the current month.
- All writes must still respect existing business rules — fund operations remain atomic RPC calls, `behavior_type` stays read-only/trigger-derived in the UI. Only transaction CRUD is eligible for offline queuing; fund operations are not.
- Offline reliability is a hard requirement: no data loss while offline, and sync must be idempotent (no duplicate records even if a mutation is retried).
- Every transaction must expose a visible sync status: pending / synced / error, with a retry affordance on error.
- When offline, the UI must still be usable for reads, sourced from a persisted cache, with a visible "data as of {time}" indicator rather than silently showing stale data as current.
- Cached/query data must be partitioned per household so switching household or logging out cannot leak another household's cached data.
- Standard interaction/accessibility constraints apply: touch targets ≥44px, input font ≥16px, safe-area handling, i18n (vi default + en) with no hardcoded strings, light/dark theme via existing design tokens.

## Technical Decisions

- Mobile is a thin client: no independent business logic. All data flows through the existing Next.js `/api/*` routes; the DB/backend/security model is unchanged and shared with web.
- Reads: TanStack Query v5 with `persistQueryClient` backed by MMKV (`gcTime >= maxAge`) so cached data survives app restarts and offline periods.
- Writes while offline: pushed into a durable local mutation queue (MMKV-backed), replayed sequentially once connectivity returns.
- Every mutating request carries a client-generated **Idempotency-Key**; the corresponding `/api` mutation routes must dedupe on that key — this is a required backend touch point, not purely client-side.
- Replay failure handling: a 4xx conflict surfaces to the user and is dropped from the queue; 5xx/network errors are retried with backoff.
- Only transaction CRUD mutations are eligible for the offline queue (fund operations are excluded by design).
- Single storage layer: MMKV is used for both the persisted query cache and Zustand persistence — do not introduce a second local storage mechanism.
- `householdId` and `currentMonth` are read only from the shared Zustand store, never re-derived locally; cache keys/partitions must be scoped by `householdId` and purged on household switch or logout.
- Query keys must go through the shared `keys.*` factory (consistent with web conventions), not hardcoded strings.
- Sync status per transaction (pending/synced/error) must be tracked and rendered per the mutation queue state, not inferred client-side from network status alone.

## UX & Interaction Patterns

- Entry point is the center FAB "+", available from any tab, opening a bottom-add sheet (uses the `shadow-float` / bottom-sheet styling, `rounded.sheet` for the sheet top).
- Quick-add focus order: amount (native number keypad, tabular-nums/mono styling) → category quick-pick → date → fund → Save.
- On save: `toast.success` (2s) and return to the prior context/screen.
- Transactions list: recent transactions shown with monospace tabular amounts; swipe-on-row reveals Edit / Delete actions, restricted to the user's own transactions in the current month.
- List/mutation UX follows standard patterns: skeleton loading (not spinner) while fetching, empty state when there is nothing to show.
- Offline indicator: a banner is shown while offline; new transactions created offline appear immediately with an optimistic "pending" chip.
- Sync status chip is a small pill per transaction: pending (muted), synced (success), error (error) — error state includes a retry control.
- When reading data offline, show a lightweight "data as of {time}" indicator rather than pretending the view is live.

## Cross-Story Dependencies

- Story 16.1 depends on the auth/session, household/month context, and nav shell/theme foundation delivered in Epic 15 (biometric unlock, householdId + currentMonth context, bottom nav + FAB, i18n/theme).
- Story 16.2 (list/edit/delete) and Story 16.4 (sync status/cached read) both build on the offline queue and idempotent sync mechanism introduced in Story 16.3 — sync chips (16.4) reflect queue state produced by 16.3, and edits/deletes (16.2) must also flow through the same offline-eligible mutation path.
- The Idempotency-Key deduplication requirement (Story 16.3) requires a corresponding change to the existing web `/api` mutation routes — this is a shared backend touch point, not mobile-only work.
- Epic 17 (Glance, Stats, Funds & Budget) consumes the same transaction data and cache partitioning conventions established here.
