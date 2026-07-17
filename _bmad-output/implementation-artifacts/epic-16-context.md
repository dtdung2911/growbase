# Epic 16 Context: Transaction Capture & Offline

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

This epic is the heart of the mobile product: let a user capture a transaction in under 15 seconds, edit or delete it, and keep everything working reliably offline with no lost or duplicated records. It delivers the speed-optimized quick-add flow, a recent-transactions list with edit/delete, a durable offline mutation queue with idempotent sync, and per-transaction sync status plus cached reads so users trust their data even without connectivity.
## Stories

- Story 16.1: Quick-add giao dịch (<15s)
- Story 16.2: List + sửa/xóa giao dịch
- Story 16.3: Offline queue + idempotent sync
- Story 16.4: Sync status + cached read

## Requirements & Constraints

- Capture screen optimized for minimum taps: native number keypad pre-opened for amount, category quick-pick with recent/frequently-used surfaced first, sensible defaults for date (today) and fund. Success is measured: capture-to-save must be under 15 seconds across repeated runs.
- Users can view recent transactions and edit/delete only their own transactions within the current month.
- All writes must respect system business rules — fund operations go through atomic RPC, `behavior_type` is read-only, and no business logic is re-implemented client-side. Balance-sensitive fund operations are online-only and out of scope for mobile v1; only transaction create/edit/delete are captured here.
- Retrying a mutation must never create duplicate records (idempotency requirement).
- When offline, the app must show last-synced data (stats/funds/budget as cached) with a "data as of {time}" indicator, and display sync state (pending / synced / error) for transactions created offline.
- All user-facing strings via `t()` (vi default, en); friendly, non-blaming microcopy.

## Technical Decisions

- **Thin native client over shared API.** The RN app holds no business logic. All data reads/writes go through the existing web `/api/*` routes; `supabase-js` is used only for auth (login, token refresh, obtaining the access token) — never for data. The app attaches `Authorization: Bearer <access_token>` to every `/api` call. (Backend touch: `withAuth()` must accept Bearer tokens alongside cookie sessions.)
- **Offline model (AD-M4).** Reads come from a persisted TanStack Query cache (`persistQueryClient` + MMKV, with `gcTime >= maxAge`). Writes are pushed into a durable local mutation queue and replayed sequentially when connectivity returns. Every mutating call carries a client-generated **Idempotency-Key**. (Backend touch: `/api` mutation routes must dedupe by Idempotency-Key.)
- **Queue eligibility.** Only balance-insensitive mutations (transaction create/edit/delete) may be queued. Fund RPC operations are online-only and must never enter the queue (avoids replaying against a stale balance).
- **Replay failure handling.** A 4xx conflict surfaces to the user and drops the item from the queue; 5xx/network errors retry with backoff. Each transaction carries a sync status (pending/synced/error) shown in the UI.
- **Household-scoped cache (AD-M9).** The persisted query cache is partitioned by `householdId`. Switching household purges and invalidates the persisted cache before loading the new one; logout clears all cache and session.
- **State & storage.** TanStack Query v5 + Zustand v5. Query keys always via the `keys.*` factory; `householdId` and `currentMonth` come only from the Zustand store (never from URL/body). A single storage layer — MMKV — backs both query-cache persistence and Zustand persistence.
- **Library layout** under the mobile lib: `api/` (fetch client with Bearer + Idempotency-Key), `offline/` (mutation queue + replay), `query/` (Query client + MMKV persist), `store/` (Zustand). Relevant deps: `react-native-mmkv` 3.x, `@tanstack/query-async-storage-persister` (MMKV) 5.x. The client sends an `app-version` header so the backend can gate a minimum version (since these API contracts change).

## UX & Interaction Patterns

- **Information architecture:** bottom tab nav with 4 items (Home / Transactions / Stats / Menu) plus a center FAB "+". The FAB is a 56px brand-filled circle with `shadow-float`, floating over the center of the bottom nav.
- **Quick-add sheet:** tapping the FAB opens a bottom sheet (native spring animation). Focus order: amount (native number keypad pre-open) → category quick-pick (recent/frequent first) → date (default today) → fund (default) → Save. On save: `toast.success` for 2s, return to prior context, numbers update.
- **Transaction row:** swipe reveals Edit / Delete; amounts render in mono with tabular-nums; a sync chip appears when pending/error.
- **Sync chip:** small pill — pending (muted), synced (success, then disappears), error (error color, with a retry action).
- **Offline & optimistic:** an offline banner ("recording still saves, will sync later"); optimistic add shows the transaction immediately with a pending chip; cached views show "Số liệu tính đến {time}".
- **Loading/empty:** skeletons for list/stat (never full-screen spinner); empty state encourages capturing the first transaction.
- **Accessibility & platform:** screen-reader labels for FAB, sync chip, and icon-only buttons; safe-area / home-indicator aware.

## Cross-Story Dependencies

- Story 16.1's quick-add produces the mutations that 16.3 queues/syncs and 16.4 surfaces status for; 16.4's sync chip reflects the queue state managed in 16.3. 16.2's edit/delete flow through the same `/api` + queue path.
- Builds on the prior mobile-foundation epic: nav shell, household/month context (Zustand), auth/session, and MMKV storage must already be in place.
- Requires two backend changes to the shared web `/api`: accept Bearer tokens in `withAuth()`, and dedupe mutation routes by Idempotency-Key.
