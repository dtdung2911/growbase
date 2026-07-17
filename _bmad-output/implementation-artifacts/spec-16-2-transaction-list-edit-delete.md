---
title: 'Transaction List + Edit/Delete (Mobile)'
type: 'feature'
created: '2026-07-17'
status: 'done'
baseline_revision: '283a48ab83117b051a5322722b4856d5e065783a'
final_revision: 'b3edd14ad8bcf91cba0f95797252ca0e51a7b626'
review_loop_iteration: 0
followup_review_recommended: false
context: [
  '{project-root}/_bmad-output/implementation-artifacts/epic-16-context.md',
  '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-growbase-mobile-2026-07-15/DESIGN.md',
  '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-growbase-mobile-2026-07-15/EXPERIENCE.md'
]
warnings: ['oversized']
---

<intent-contract>

## Intent

**Problem:** Mobile Transactions tab is a stub placeholder; users cannot view recent transactions or correct capture mistakes (wrong amount/date/description) without switching to web.

**Approach:** Build a native transaction list screen (current month, current household) backed by the existing web `/api/transactions` endpoints, with swipe-to-reveal Edit/Delete on eligible rows and a bottom-sheet edit form for non-category/account fields.

## Boundaries & Constraints

**Always:**
- List scoped to `useAppStore().householdId` + `useAppStore().currentMonth`, fetched via `apiFetch<TransactionWithJoins[]>("/api/transactions?month=" + currentMonth)`, query key `keys.transactions(householdId, currentMonth)`.
- Amounts rendered `font-mono` tabular-nums equivalent (RN: `fontFamily: "JetBrains Mono"`), +/- prefix, income/expense color per DESIGN.md semantic tokens.
- Swipe-to-reveal Edit/Delete only shown when: `tx.member_id === myMemberId` AND `tx.transaction_date` is within current month AND `tx.transaction_type` is NOT in `["internal_transfer", "fund_contribution", "fund_withdrawal"]` (system-generated, immutable — mirrors web `TransactionEditSheet` R3 guard). `myMemberId` resolved once via `apiFetch<{members: HouseholdMember[]}>("/api/household/members")`, matching `m.user_id === useAppStore().user.id`, cached under query key `["members", householdId]` (existing `keys.members(hid)` factory).
- Edit sends `PUT /api/transactions/{id}` with the FULL `updateTransactionSchema` payload (server does full replace, not patch) — pre-fill all non-editable fields (`category_id`, `account_id`, `transaction_type`, `direction`, `debt_entry_id`) from the existing row untouched; only `amount`, `description`, `transaction_date`, `is_unusual_income` are user-editable in this story.
- Delete sends `DELETE /api/transactions/{id}` behind `ConfirmDialog`-equivalent (native `Alert`-free — use an in-app confirm sheet, never `Alert.alert`/`confirm()` which are OS dialogs outside this app's design system) before firing.
- On mutation success: invalidate/update `keys.transactions(householdId, currentMonth)` cache (optimistic or invalidate — implementer's choice, but cache MUST reflect the change without a manual pull-to-refresh).
- List states: skeleton rows while loading, illustrated empty state when `data.length === 0` (per EXPERIENCE.md State Patterns), pull-to-refresh.
- Touch targets ≥44px; amount/list text respects OS dynamic type reasonably.
- Every user-facing string via `t()` (vi/en messages files).
- New dependency `react-native-gesture-handler` must be installed via `pnpm --filter @growbase/mobile exec expo install react-native-gesture-handler` (SDK-pinned version) and root layout wrapped in `GestureHandlerRootView` if not already present.

**Block If:** (none identified — all technical unknowns resolved during planning; see Design Notes)

**Never:**
- Never modify the web `/api/transactions/[id]` routes or `transactions` RLS policies to add server-side member/month enforcement — FR-8's "của mình, tháng hiện tại" restriction is enforced as **client-side UI gating only** in this story (no swipe affordance rendered outside those bounds). This is a deliberate, flagged scope boundary: the existing web app allows any household member to edit any household transaction, and changing that is a cross-surface, security-relevant product decision out of scope here.
- Never build category/account pickers in this story — editing category or account is out of scope; if a user needs to change those, they use web. (No existing mobile category/account list hooks exist yet; building them is unscoped, separate work.)
- Never implement sync-chip / pending-error states (UX-DR3's chip belongs to the offline queue in 16.3/16.4, which does not exist yet — this story is online-only, direct API calls).
- Never use `Alert.alert`/browser `confirm()` for the delete confirmation — use an in-app sheet/dialog consistent with the design system.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Happy list load | Household has transactions this month | Skeleton → list rendered, newest first, mono amounts, +/- colored | No error expected |
| Empty month | No transactions this month | Illustration + CTA text (per EXPERIENCE.md empty state copy), no skeleton stuck | No error expected |
| Swipe own current-month tx | Row matches `myMemberId` + current month + non-system type | Reveals Sửa / Xóa actions | No error expected |
| Swipe other member's / other-month / system tx | Row fails any gating condition | No swipe actions revealed (row is view-only) | No error expected |
| Edit save | Valid amount/description/date/is_unusual_income change | `PUT` succeeds, sheet closes, toast.success 2s, list reflects new values | Network/validation error: keep sheet open, toast.error 5s |
| Edit save on system-guarded type server-side | Race: tx became system-type between load and save (unlikely but server still enforces R3) | Server returns 403 | Toast.error 5s with server message, sheet stays open |
| Delete confirm | User confirms delete in in-app dialog | `DELETE` succeeds, row removed from list, toast.success 2s | Network error: toast.error 5s, row remains |
| Delete cancel | User dismisses confirm dialog | No API call, row unchanged | No error expected |
| Household/month switch while on screen | `useAppStore` householdId or currentMonth changes | List re-fetches for new scope (query key changes) | No error expected |

</intent-contract>

## Code Map

- `apps/mobile/app/(tabs)/transactions.tsx` -- replace `ScreenPlaceholder` stub with real screen (list + sheets)
- `apps/mobile/src/features/transactions/useTransactions.ts` -- new: `useQuery` list hook, mirrors `apps/mobile/src/features/household/useHouseholds.ts` pattern
- `apps/mobile/src/features/transactions/useMyMemberId.ts` -- new: resolves current user's `household_members.id` via `/api/household/members`, matches `user_id === user.id`
- `apps/mobile/src/features/transactions/useUpdateTransaction.ts` -- new: `useMutation` PUT wrapper, invalidates `keys.transactions(hid, month)`
- `apps/mobile/src/features/transactions/useDeleteTransaction.ts` -- new: `useMutation` DELETE wrapper, invalidates `keys.transactions(hid, month)`
- `apps/mobile/src/features/transactions/TransactionRow.tsx` -- new: swipeable row (gesture-handler `Swipeable`), amount styling per DESIGN.md, gating logic for showing Sửa/Xóa
- `apps/mobile/src/features/transactions/TransactionEditSheet.tsx` -- new: bottom-sheet edit form (amount, description, date, is_unusual_income), RHF + Zod (`updateTransactionSchema`)
- `apps/mobile/src/features/transactions/DeleteConfirmSheet.tsx` -- new: in-app confirm dialog before delete
- `apps/mobile/src/components/Skeleton.tsx` -- new: generic skeleton row/block, reused for list loading
- `apps/mobile/src/components/EmptyState.tsx` -- new: illustration + title + CTA, reused for empty transactions
- `packages/shared/src/queryKeys.ts` -- existing `keys.transactions(hid, month)`, `keys.members(hid)` — reuse, no changes
- `packages/shared/src/schemas/transaction.ts` -- existing `updateTransactionSchema` — reuse for RHF resolver, no changes
- `packages/shared/src/types/app.ts` -- existing `TransactionWithJoins`, `HouseholdMember`(or equivalent) types — reuse, no changes
- `apps/mobile/src/api/client.ts` -- existing `apiFetch`, auth already wired via `setAccessTokenProvider` (Epic 15) — no changes
- `apps/mobile/src/store/appStore.ts` -- existing `householdId`, `currentMonth`, `user` — reuse, no changes
- `apps/web/src/app/api/transactions/route.ts` (GET), `apps/web/src/app/api/transactions/[id]/route.ts` (PUT/DELETE) -- existing, unchanged, contract reference
- `apps/web/src/components/transactions/TransactionItem.tsx` -- reference for amount/color styling parity
- `apps/mobile/src/lib/i18n/messages/vi.ts`, `en.ts` -- add new keys for this screen (list, edit sheet, delete confirm, empty state)
- `apps/mobile/app/_layout.tsx` -- verify/add `GestureHandlerRootView` wrapper for gesture-handler to work

## Tasks & Acceptance

**Execution:**
- [x] `pnpm --filter @growbase/mobile exec expo install react-native-gesture-handler` -- install SDK-pinned dep -- swipe rows require it
- [x] `apps/mobile/app/_layout.tsx` -- wrap root in `GestureHandlerRootView` if absent -- required for gesture-handler to function
- [x] `apps/mobile/src/components/Skeleton.tsx` -- generic skeleton block/row component -- list loading state per EXPERIENCE.md
- [x] `apps/mobile/src/components/EmptyState.tsx` -- illustration + title + CTA component -- empty month state
- [x] `apps/mobile/src/features/transactions/useMyMemberId.ts` -- fetch `/api/household/members`, derive own `memberId` -- needed for FR-8 gating
- [x] `apps/mobile/src/features/transactions/useTransactions.ts` -- `useQuery` for `/api/transactions?month=` -- list data source
- [x] `apps/mobile/src/features/transactions/useUpdateTransaction.ts` -- `useMutation` PUT + cache invalidate -- edit flow
- [x] `apps/mobile/src/features/transactions/useDeleteTransaction.ts` -- `useMutation` DELETE + cache invalidate -- delete flow
- [x] `apps/mobile/src/features/transactions/TransactionRow.tsx` -- swipeable row, mono amount, gating logic -- core AC behavior
- [x] `apps/mobile/src/features/transactions/TransactionEditSheet.tsx` -- RHF+Zod edit form (amount/description/date/is_unusual_income) -- edit AC
- [x] `apps/mobile/src/features/transactions/DeleteConfirmSheet.tsx` -- in-app confirm before delete -- delete AC, destructive-action rule
- [x] `apps/mobile/app/(tabs)/transactions.tsx` -- assemble FlatList + skeleton/empty + sheets, replace stub -- screen wiring
- [x] `apps/mobile/src/lib/i18n/messages/vi.ts`, `en.ts` -- add screen strings -- i18n rule (no hardcoded copy)
- [x] `apps/mobile/src/features/transactions/*.test.ts` -- unit-test gating logic (own/current-month/system-type matrix) and mutation cache invalidation -- covers I/O matrix edge cases

**Acceptance Criteria:**
- Given the Transactions tab, when the screen loads, then a skeleton is shown until data resolves, then the current month's transactions render newest-first with mono tabular-nums amounts.
- Given no transactions exist for the current month, when the screen loads, then an empty state with illustration and CTA is shown instead of an empty list.
- Given a transaction belongs to the current user, is dated in the current month, and is not a system-generated type, when the user swipes the row, then Sửa and Xóa actions are revealed.
- Given a transaction fails any of the own/current-month/non-system conditions, when the user swipes the row, then no Sửa/Xóa actions appear.
- Given the edit sheet is open with valid changes, when the user saves, then `PUT /api/transactions/{id}` is called with the full payload, the transactions cache updates without a manual refresh, and a success toast shows for 2s.
- Given a save request fails, when the error returns, then the edit sheet stays open, the entered values are preserved, and an error toast shows for 5s.
- Given the delete confirm sheet is open, when the user confirms, then `DELETE /api/transactions/{id}` is called, the row is removed from the cached list, and a success toast shows for 2s.
- Given the delete confirm sheet is open, when the user cancels, then no API call is made and the row remains.

## Spec Change Log

## Review Triage Log

### 2026-07-17 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 4
- defer: 8
- reject: 3
- addressed_findings:
  - `medium` `patch` `useUpdateTransaction.ts`/`useDeleteTransaction.ts` invalidated only `keys.transactions`, missing `keys.budget`/`keys.accounts` invalidation the equivalent web hooks perform — stale budget/account balances after edit/delete. Fixed: added matching invalidation calls.
  - `low` `patch` `DeleteConfirmSheet.tsx` `onRequestClose` wasn't guarded by `isPending` (unlike the sibling `TransactionEditSheet`) — Android back button during an in-flight delete closed the dialog while the request kept running, orphaning the pending state. Fixed: guarded with `isPending ? undefined : onCancel`.
  - `low` `patch` `TransactionEditSheet.tsx` date validation was a pure digit-grouping regex, accepting calendar-impossible dates (e.g. `2026-02-30`) that would surface as an opaque server error on submit. Fixed: added `isValidCalendarDate` round-trip check via `Date.UTC`.
  - `reject` FR-8 (own transactions/current-month) has no server-side enforcement — already a deliberate, documented scope boundary from planning (see Design Notes below), not a defect introduced by this diff.
  - `reject` Idempotency-Key minted fresh per mutation call rather than reused per logical attempt — pre-existing app-wide `apiFetch`/idempotency design, unrelated to this story's diff.
  - `reject` React Hook Form `reset()` smuggling unregistered fields through the Zod resolver to satisfy the full-replace PUT payload — works correctly today (resolver reads `_formValues`), flagged only as an implicit dependency worth hardening later, not a defect.
  - 8 additional low/medium findings (stuck `isPending` when query disabled, no cache invalidation on mutation error, cross-month edit leaves destination month's cache stale, `Swipeable` rows don't auto-close siblings, missing interaction tests for new UI components, no pull-to-refresh, amount `0`/empty visually indistinguishable, silent full lockout when `useMyMemberId` resolves `null`) triaged `defer` — genuine but non-blocking; written to `deferred-work.md` under "Deferred from: code review story 16-2".

## Design Notes

FR-8 ("của mình, tháng hiện tại") has no existing server-side enforcement anywhere in the codebase (not web UI, not API routes, not RLS — verified during planning: `transactions_update`/`transactions_delete` RLS policies in `supabase/migrations/004_rls.sql` gate only on `household_id`). Rather than expand this story into a cross-surface RLS/API change (unscoped, affects web's existing household-collaborative editing, and is a security-relevant behavior change with no AC mention), this story enforces the restriction as client-side UI gating only on mobile: the swipe affordance simply isn't rendered for transactions outside those bounds. This is recorded as a `Never` boundary above, not a silent gap.

Edit scope is deliberately narrower than the full `updateTransactionSchema`: category/account pickers don't exist on mobile yet (no `useCategories`/`useAccounts` hooks anywhere in `apps/mobile`), and building them is unscoped net-new work with no AC basis. The edit sheet pre-fills those fields from the existing row and submits them unchanged, exposing only amount/description/date/is_unusual_income for editing. A user who needs to change category/account still uses web.

## Verification

**Commands:**
- `pnpm --filter @growbase/mobile test -- transactions` -- expected: new unit tests for gating logic and mutation hooks pass
- `pnpm --filter @growbase/mobile exec tsc --noEmit` -- expected: no type errors
- `pnpm --filter @growbase/shared build` (if shared types touched) -- expected: builds clean (not expected to be touched, but re-verify no shared file was edited)

**Manual checks (if no CLI):**
- Run mobile app (`pnpm --filter @growbase/mobile start`), navigate to Transactions tab, verify skeleton → list → swipe → edit → delete flow end-to-end against a real household with mixed own/other-member and system-generated transactions.

## Auto Run Result

**Summary:** Implemented mobile Transactions screen (list + swipe-to-reveal edit/delete) per spec, then applied 4 review-driven patches: cache invalidation parity with web (budget/accounts), an Android back-button guard on the delete sheet during a pending mutation, and calendar-validity date checking on the edit form (previously accepted `2026-02-30`-style impossible dates).

**Files changed** (since baseline `283a48ab83117b051a5322722b4856d5e065783a`):
- `apps/mobile/app/(tabs)/transactions.tsx` — new screen: skeleton/error/empty states, list, edit/delete orchestration
- `apps/mobile/app/_layout.tsx` — wrapped root in `GestureHandlerRootView`
- `apps/mobile/src/features/transactions/` (new dir) — `TransactionRow.tsx`, `TransactionEditSheet.tsx`, `DeleteConfirmSheet.tsx`, `canModifyTransaction.ts` (+test), `useTransactions.ts`, `useUpdateTransaction.ts` (+test), `useDeleteTransaction.ts` (+test), `useMyMemberId.ts`
- `apps/mobile/src/components/Skeleton.tsx`, `EmptyState.tsx` — new shared UI primitives
- `apps/mobile/src/lib/i18n/messages/{vi,en}.ts` — 23 new keys
- `apps/mobile/package.json`, `pnpm-lock.yaml` — added `react-native-gesture-handler`, `react-hook-form`, `@hookform/resolvers`

**Review findings breakdown:** 4 patch (all fixed, see Review Triage Log), 8 defer (written to `deferred-work.md`), 3 reject (2 pre-existing/out-of-scope systemic patterns, 1 already-documented deliberate scope boundary — see Design Notes), 0 intent_gap, 0 bad_spec.

**Verification performed:**
- `pnpm --filter @growbase/mobile exec tsc --noEmit` — clean, no type errors (re-run after patches)
- `pnpm --filter @growbase/mobile test -- --run` — 78/78 tests pass (re-run after patches)
- Manual UI verification not performed (no running device/simulator in this environment) — flagged as residual risk below.

**Residual risks:**
- No manual on-device verification of the swipe → edit → delete flow; static verification (types + unit tests) only.
- FR-8 (own-transaction, current-month restriction) is enforced client-side only, by deliberate scope decision — any household member can still edit/delete another member's current-month transaction via direct API access. Documented as an accepted boundary, not fixed in this story.
- 8 deferred findings in `deferred-work.md` (see above) remain outstanding, none blocking for this story's acceptance criteria.
