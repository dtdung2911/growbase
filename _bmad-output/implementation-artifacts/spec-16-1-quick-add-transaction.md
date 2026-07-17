---
title: 'Story 16.1: Quick-add giao dịch (<15s) — Mobile'
type: 'feature'
created: '2026-07-17'
status: 'done'
baseline_revision: '283a48ab83117b051a5322722b4856d5e065783a'
final_revision: '7e7f2d6fd133c6fc27785e41e831e75317edef84'
review_loop_iteration: 1
followup_review_recommended: false
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-16-context.md'
  - '{project-root}/CLAUDE.md'
warnings: [oversized]
---

<intent-contract>

## Intent

**Problem:** The mobile app's FAB "+" opens `app/quick-add.tsx`, which is still a `ScreenPlaceholder`. Users cannot capture a transaction on mobile — the core value of the product ("ghi một khoản chi trong vài giây").

**Approach:** Replace the placeholder with a quick-add form (in the existing expo-router bottom-modal screen) that captures amount, category, account, date, and optional note, then creates the transaction **online** via the existing `POST /api/transactions` using the shared `apiFetch` client (Bearer + Idempotency-Key already wired). Add the one missing read endpoint (`GET /api/categories`) so the category quick-pick obeys the thin-client rule. Offline queueing, sync chips, and list/edit/delete are explicitly out of scope (stories 16.2–16.4).

## Boundaries & Constraints

**Always:**
- All data reads/writes go through web `/api/*` via `apiFetch` (`apps/mobile/src/api/client.ts`); `supabase-js` is auth-only (AD-M2 thin client). Never query Supabase for categories/accounts from mobile.
- Query keys only via the shared `keys.*` factory. `householdId` and `currentMonth` come only from the Zustand `appStore` — never from URL/body.
- Create body matches `createTransactionSchema` shape (from `@growbase/shared`): `{ amount, direction, transaction_type, category_id, account_id, description?, transaction_date }`. Import the **type** only — no runtime `zod` on device (zod is not a mobile dependency).
- `behavior_type` and `fund_id` are never sent (server trigger / server session own them). `household_id`/`member_id` are server-derived.
- Every user-facing string via `t()`, added to **both** `vi.ts` and `en.ts` (parity test enforces it). No hardcoded colors — use `useTheme()` tokens. Displayed amounts use a mono/tabular style.
- Save is disabled until `amount > 0 && category_id && account_id`, and disabled while the mutation `isPending` (prevents double submit; server `Idempotency-Key` is the backstop).

**Block If:**
- Creating a transaction would require a request field mobile cannot obtain through `/api` (beyond adding `GET /api/categories`) → HALT `blocked`.
- `withAuth()` no longer accepts `Authorization: Bearer` (it currently does, `apps/web/src/lib/supabase/auth-check.ts`) → HALT `blocked`.

**Never:**
- No offline mutation queue, no persisted optimistic writes, no sync chips, no "data as of {time}" — those are stories 16.3/16.4.
- No transfer tab, no `debt_repayment`, no `fund_id`, no editing/deleting transactions (16.2).
- Do not add `@gorhom/bottom-sheet` or a form library — reuse the existing expo-router `presentation: "modal"` screen and a hand-rolled form (matches `LoginScreen` pattern).
- Do not refactor the web `useCategories` hook or the web quick-add components.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Happy — expense | amount>0, category (expense group) + account picked, date=today, expense tab | `POST /api/transactions` `{direction:"out", transaction_type:"expense", ...}` → 201 `{id}`; `toast.success` 2s; `router.back()`; invalidate `keys.transactions/dashboard/budget`; category pushed to recent list | none |
| Happy — income | income tab selected | body `{direction:"in", transaction_type:"income"}`; category picker shows only groups with `cost_type_code === "income"` | none |
| Incomplete form | amount≤0 OR no category OR no account | Save button disabled; no request fires | none |
| Server validation 400 | e.g. stale category_id | Save re-enabled, form values kept, `toast.error` 5s with server message | show `error` from envelope |
| Network / offline / 5xx | no connectivity or server error | form kept, `toast.error` 5s; nothing persisted (queue is 16.3) | catch `ApiError` / thrown |
| Empty account/category lists | household has no accounts or categories loaded | picker shows empty microcopy; Save disabled | queries `enabled: !!householdId && !isLocked` |
| Double-tap Save | mutation in flight | button disabled via `isPending`; single request; server dedupes by `Idempotency-Key` | n/a |

</intent-contract>

## Code Map

- `apps/mobile/app/quick-add.tsx` -- placeholder to replace with the quick-add form screen (already registered as bottom modal in `app/_layout.tsx`; FAB already routes here).
- `apps/mobile/src/api/client.ts` -- `apiFetch<T>(path,{method,body,idempotencyKey})`; returns `envelope.data`, throws `ApiError`; auto Bearer + Idempotency-Key + app-version.
- `apps/mobile/src/features/household/useHouseholds.ts` -- template for a query hook (uses `keys.*`, `enabled: !!user && !isLocked`).
- `apps/mobile/src/store/appStore.ts` -- `householdId`, `currentMonth`, `isLocked` selectors; `persist` via MMKV `appStorage`.
- `apps/mobile/src/lib/query/queryClient.ts` -- `queryClient` (for `invalidateQueries`).
- `apps/mobile/src/lib/i18n/messages/vi.ts` + `en.ts` -- flat dotted string keys; parity test `messages/parity.test.ts`.
- `apps/mobile/src/lib/theme/tokens.ts` + `ThemeProvider.tsx` -- `useTheme() -> {colors,isDark}`.
- `apps/mobile/src/components/ScreenPlaceholder.tsx` -- theme-aware styling reference.
- `packages/shared/src/schemas/transaction.ts` -- `CreateTransactionInput` type (type-only import).
- `packages/shared/src/queryKeys.ts` -- `keys.transactions/categories/accounts/dashboard/budget`.
- `apps/web/src/app/api/transactions/route.ts` -- `POST` create (withAuth + withIdempotency), success `201 {data:{id}}`. No change needed.
- `apps/web/src/app/api/accounts/route.ts` -- existing `GET /api/accounts` → `{data: Account[]}` (`id,name,account_type,color,sort_order,...`). No change.
- `apps/web/src/app/api/categories/route.ts` -- currently POST-only; **add GET** mirroring `apps/web/src/lib/hooks/useCategories.ts` grouped query (groups + nested categories + `cost_type_code`).
- `apps/web/src/lib/supabase/auth-check.ts` -- `withAuth()` already accepts Bearer (verify only).

## Tasks & Acceptance

**Execution:**
- [x] `apps/web/src/app/api/categories/route.ts` -- add `GET` handler under `withAuth()`: query `category_groups` with `.or(household_id.eq.{hid},household_id.is.null)`, nested `cost_types(code)` and `categories(id,name,icon,default_behavior_type,is_system,is_active,sort_order)`; prefer household groups when any non-system exist; return `{data: CategoryGroupWithCategories[], error:null}` ordered by `sort_order`, active categories only. Mirror the shape web `useCategories` builds. -- thin-client category read path.
- [x] `packages/shared/src/types/category.ts` (or nearest shared types file) -- export a `CategoryGroupWithCategories` type `{id,name,icon,color,cost_type_id,cost_type_code,is_system,categories:{id,name,icon,default_behavior_type,is_system}[]}` consumed by the route and mobile. -- avoid shape drift.
- [x] `apps/mobile/src/features/categories/useCategories.ts` -- `useQuery({queryKey: keys.categories(hid), queryFn: () => apiFetch<CategoryGroupWithCategories[]>("/api/categories"), enabled: !!hid && !isLocked})`. -- category source for quick-pick.
- [x] `apps/mobile/src/features/accounts/useAccounts.ts` -- `useQuery({queryKey: keys.accounts(hid), queryFn: () => apiFetch<Account[]>("/api/accounts"), enabled})`. -- account source; default = first (`sort_order`).
- [x] `apps/mobile/src/features/transactions/useCreateTransaction.ts` -- `useMutation` calling `apiFetch<{id:string}>("/api/transactions",{method:"POST", body})`; on success `queryClient.invalidateQueries` for `keys.transactions(hid,month)`, `keys.dashboard(hid,month)`, `keys.budget(hid,month)`. -- create + refresh.
- [x] `apps/mobile/src/features/transactions/recentCategories.ts` -- pure helper + MMKV-persisted store (Zustand `persist` on `appStorage`, key e.g. `growbase-recent-categories`) holding recent category ids; `pushRecent(id)` dedupes and caps at 6, most-recent first; `orderByRecent(groups, recentIds)` surfaces recent-first. -- honors AC "recent đầu".
- [x] `apps/mobile/app/quick-add.tsx` -- replace placeholder with the form: amount `TextInput` (`autoFocus`, `keyboardType="number-pad"`, parsed to number) → expense/income segmented toggle (default expense) → category quick-pick (recent chips first, then grouped list filtered by direction via `cost_type_code`) → account picker (default first account) → date field (default today `YYYY-MM-DD`) → optional description → Save button. Derive `direction`/`transaction_type` from tab. On save call `useCreateTransaction`; success → `toast.success` 2s + `pushRecent(category_id)` + `router.back()`; error → keep form + `toast.error` 5s. Disable Save unless valid and while `isPending`. Accessibility labels on icon-only controls. -- the screen.
- [x] `apps/mobile/src/lib/i18n/messages/vi.ts` + `apps/mobile/src/lib/i18n/messages/en.ts` -- add `tx.*` keys (amount, category, account, date, note, expense, income, save, recent, selectCategory, selectAccount, noCategories, noAccounts, saved, saveError) to both. -- i18n parity.
- [x] `apps/mobile/src/features/transactions/recentCategories.test.ts` + `useCreateTransaction.test.ts` -- vitest: recent dedupe/cap/order; mutation maps input→`apiFetch` body and invalidates the three keys on success (mock `apiFetch`/`queryClient`). Also a small test that expense-vs-income category filtering keys off `cost_type_code`. -- cover I/O matrix logic.

**Acceptance Criteria:**
- Given the user is unlocked on any tab, when they tap the FAB "+", then the quick-add bottom modal opens with the amount field focused and the number keypad shown.
- Given the modal is open, when the user fills amount + picks a category + account (date defaults to today, account defaults to the first account), then the Save button becomes enabled following focus order amount → category → date → account → Save.
- Given a valid expense entry, when the user taps Save, then `POST /api/transactions` is sent with `direction:"out"`, `transaction_type:"expense"`, no `fund_id`/`behavior_type`; on 201 a success toast shows ~2s, the modal closes, and `transactions`/`dashboard`/`budget` queries are invalidated.
- Given the income tab is selected, when choosing a category, then only groups with `cost_type_code === "income"` are offered and the body sends `direction:"in"`, `transaction_type:"income"`.
- Given the server returns 400/500 or the request fails (offline), when Save is tapped, then the form values are preserved and an error toast (~5s) is shown; nothing is queued or persisted.
- Given categories were used before, when opening quick-add, then recently-used categories appear first in the quick-pick.
- Manual/QA (NFR-1/SM-2): tap-FAB → saved completes in under 15 seconds across repeated runs on a 375px device.

## Design Notes

- **Bottom sheet = existing expo-router modal.** `quick-add` is already `presentation:"modal"` (slides from bottom on iOS). No new sheet dependency — keeps the story minimal (Karpathy: no over-engineering).
- **"quỹ (default)" = account, not fund.** The create contract has `account_id` and no `fund_id`; web quick-add collects an account. Mobile defaults `account_id` to the first account (`sort_order`) to cut a tap and satisfy the "default" wording; the picker still allows change.
- **"recent/thường dùng đầu" implemented as recent-first** (last-used, deduped, capped 6, MMKV-persisted). True frequency ranking is deferred — recency is the minimal faithful reading and matches how the web has no recency at all.
- **No runtime zod on device** (zod absent from mobile deps): import `CreateTransactionInput` as a type only; validate the three required fields manually; the server's `createTransactionSchema` is the authoritative validator.
- **Idempotency already handled** by `apiFetch` + web `withIdempotency`; do not add queueing logic here.
- Cost-type discriminator lives on the **group** (`cost_type_code`): `income` = income side, everything else = expense side.

## Verification

**Commands:**
- `pnpm --filter @growbase/mobile type-check` — mobile TS clean.
- `pnpm --filter @growbase/mobile test` — mobile vitest (new tests + i18n parity) green.
- `pnpm --filter web type-check && pnpm --filter web lint` — web (new GET route) clean.
- `pnpm --filter @growbase/shared type-check` (if present) — shared type compiles.

**Manual checks (dev client, 375px):**
- Tap FAB → modal opens, amount focused, numeric keypad up.
- Create an expense and an income; confirm success toast + modal closes; verify the row exists via web app (same household).
- Toggle airplane mode → Save shows error toast, form retained (no crash, no queue).
- Switch language vi/en → all quick-add labels translate.

## Review Triage Log

### 2026-07-17 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 5: (high 1, medium 1, low 3)
- defer: 2: (low 2)
- reject: 5: (low 5)
- addressed_findings:
  - `[high]` `[patch]` Default date used UTC `toISOString()` → previous-day / wrong-month for Vietnam (UTC+7) entries between 00:00–07:00. Switched the default to the shared `todayVN()` (VN-local `YYYY-MM-DD`).
  - `[medium]` `[patch]` Free-text date field + `z.string()` accepted invalid strings (`""`, `2026-13-40`) → raw Postgres 500 in the toast. Added `isValidDate()` (regex + `Date.parse`) to `canSave` gating.
  - `[low]` `[patch]` A transaction dated in a month ≠ `currentMonth` never invalidated that month's caches. `onSuccess` now invalidates both months via a deduped `Set`. Added a cross-month unit test.
  - `[low]` `[patch]` Double-tap before the `isPending` re-render could fire two POSTs. Added a `submitting` ref guard, reset in `finally`.
  - `[low]` `[patch]` Groups present but all with zero active categories rendered headers with no chips and no message. Empty-state now keys off `hasCategories` (any group has ≥1 category).
- deferred: stable idempotency key across manual retries (→ Story 16.3); balance / net-worth key invalidation (→ Epic 17). See `deferred-work.md`.
- rejected (noise / consistent with established web): null `cost_type_code` under income tab, `hasHouseholdGroups` group-override filter (both mirror `apps/web/src/lib/hooks/useCategories.ts`), `number-pad` decimals (VND is integer; `NaN` already disables Save), device-global recent-categories (documented deliberate v1 choice, self-healing), missing note placeholder (field has a label).

### 2026-07-17 — Review pass (follow-up)
- intent_gap: 0
- bad_spec: 0
- patch: 4: (medium 3, low 1)
- defer: 1: (low 1)
- reject: 10: (low 10)
- addressed_findings:
  - `[medium]` `[patch]` Category/account pickers had no loading/error branching — a slow or failed fetch silently showed the "no data yet" empty-state instead of a spinner or error, misleading the user into thinking the household truly has none. Added `isLoading`/`isError` branches (`ActivityIndicator` + new `tx.loadError` text) for both pickers.
  - `[medium]` `[patch]` `onSuccess` never invalidated the accounts cache, so account balances shown elsewhere (accounts list, dashboard) went stale after a quick-add. Added `queryClient.invalidateQueries({ queryKey: keys.accounts(householdId) })`.
  - `[medium]` `[patch]` `isValidDate` used `Date.parse`, which silently normalizes invalid calendar dates (e.g. `2026-02-30` rolls to March 2) instead of rejecting them, letting a mistyped date round-trip into the POST body unnoticed. Rewrote as a round-trip check: construct `Date` from parsed y/m/d and compare the fields back.
  - `[low]` `[patch]` Dead `tx.selectCategory` / `tx.selectAccount` i18n keys, never referenced anywhere. Removed from both `vi.ts`/`en.ts`; added the new `tx.loadError` key used by the loading-state patch above.
- deferred: amount input has no upper bound (`z.number().positive()` only) — arbitrarily large values pass client-side validation with only the API/DB layer as a backstop. Needs a shared-schema-level product decision on a sane max shared by web + mobile; out of scope for this mobile-only story. See `deferred-work.md`.
- rejected (noise / duplicates / out of scope): idempotency-key manual-retry gap (already deferred in the prior pass → Story 16.3, not new), form-field-vs-payload order cosmetic mismatch (no behavioral difference), test-coverage-only suggestions (not a defect), free-text date field UX (deliberate v1 design choice, re-litigated from the prior pass), speculative activity/heartbeat feature request (hypothetical, out of scope), `cost_type_id` type nit (matches established web-side convention), `hasHouseholdGroups` group-override filter (re-flagged; already rejected prior pass as consistent-with-web), `filterByDirection` category whitelist claimed unsafe (verified non-issue — `cost_types` is a closed 7-code system set from seed + onboarding-clone, no custom codes possible), `cost_types` array-vs-object null-guard claimed missing in `apps/web/src/app/api/categories/route.ts` (hallucinated by the reviewing subagent — verified directly against the file; no such guard exists or is needed, the relation is a single object matching the established pattern).

## Auto Run Result

Status: done

**Summary:** Implemented mobile Story 16.1 — the FAB "+" quick-add flow. Replaced the `quick-add.tsx` placeholder with an online capture form (amount → expense/income tab → recent-first category quick-pick filtered by cost-type direction → account picker defaulting to the first account → date defaulting to VN-today → optional note), creating transactions via the existing `POST /api/transactions` (Bearer + Idempotency-Key already wired). Added the missing `GET /api/categories` read endpoint (thin-client rule), a shared `CategoryGroupWithCategories` type, mobile query/mutation hooks, an MMKV-persisted recent-categories store, and i18n strings. A follow-up independent review pass then hardened loading/error states, cache invalidation, and date validation.

**Files changed:**
- `apps/web/src/app/api/categories/route.ts` — added GET (grouped categories + `cost_type_code`) for the thin client.
- `packages/shared/src/types/category.ts` — new `CategoryGroupWithCategories` type shared by route + mobile.
- `apps/mobile/src/features/categories/useCategories.ts` — categories query hook.
- `apps/mobile/src/features/accounts/useAccounts.ts` — accounts query hook.
- `apps/mobile/src/features/transactions/useCreateTransaction.ts` — create mutation; invalidates transactions/dashboard/budget for both `currentMonth` and the transaction's own month, plus `keys.accounts(householdId)` (follow-up pass).
- `apps/mobile/src/features/transactions/recentCategories.ts` — pure picker helpers + MMKV recent-ids store.
- `apps/mobile/app/quick-add.tsx` — the quick-add form screen (replaces placeholder); follow-up pass added loading/error branches for category + account pickers and rewrote `isValidDate` as a round-trip calendar check.
- `apps/mobile/src/lib/i18n/messages/vi.ts` + `en.ts` — `tx.*` strings (parity green); follow-up pass removed 2 dead keys and added `tx.loadError`.
- `apps/mobile/src/features/transactions/{recentCategories,useCreateTransaction}.test.ts` — unit tests; `useCreateTransaction.test.ts` invalidation-count assertions updated for the new accounts invalidation.

**Review findings breakdown (initial pass):** 5 patches applied (1 high: UTC→`todayVN()` date default; 1 medium: date-string validation before submit; 3 low: cross-month cache invalidation, double-submit ref guard, empty-categories state). 2 deferred (stable idempotency key across manual retries → Story 16.3; balance/net-worth invalidation → Epic 17). 5 rejected as noise/consistent-with-web. No `intent_gap`, no `bad_spec`.

**Review findings breakdown (follow-up pass):** 4 patches applied (3 medium: loading/error states for category+account pickers, missing accounts cache invalidation, `isValidDate` calendar-rollover bug; 1 low: dead i18n keys). 1 deferred (unbounded amount input → needs shared-schema-level product decision, out of mobile-only scope). 10 rejected as noise/duplicates/out-of-scope, including one hallucinated finding (claimed missing null-guard in `categories/route.ts` that was verified not to exist or be needed). No `intent_gap`, no `bad_spec`.

**Follow-up review recommended:** false — this pass's findings were defensive/cosmetic (loading states, stale-cache edge case, a narrow date-rollover bug) rather than another high-severity data-correctness gap. The one remaining open item (unbounded amount) is tracked in `deferred-work.md` and needs a cross-app schema decision, not another mobile-scoped review loop.

**Verification:**
- `pnpm --filter @growbase/mobile type-check` → PASS
- `pnpm --filter @growbase/mobile test` → PASS (71 tests, 14 files, including updated invalidation-count assertions)
- `pnpm --filter web type-check` → PASS
- `pnpm --filter @growbase/shared type-check` → PASS
- `pnpm --filter web lint` → pre-existing baseline failure: no ESLint config is checked into the repo, so `next lint` drops into interactive setup and cannot run non-interactively. Unrelated to this change; left as-is (unchanged from initial pass).
