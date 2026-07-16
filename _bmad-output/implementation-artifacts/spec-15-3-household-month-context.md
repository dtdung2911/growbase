---
title: 'Story 15.3 — Household + month context + switch (cache purge)'
type: 'feature'
created: '2026-07-17'
status: 'done'
review_loop_iteration: 0
warnings: ['oversized']
baseline_revision: '85065a8122dfdf8f04f437f0811116489588ec4b'
followup_review_recommended: false
final_revision: '0b910eaa220d926e4b0df889d064efb58353fbcf'
---

<intent-contract>

## Intent

**Problem:** The mobile app has no working household/month context. The Zustand store holds `householdId`/`currentMonth` fields but has no setters, no persistence, and nothing populates them; there is no TanStack Query client or MMKV-backed cache at all, no way to fetch the user's households, no household-switch mechanism, and logout (only reachable today from the lock-screen password fallback) never clears app state or cache. Without this, every downstream epic that reads household-scoped data cannot function.

**Approach:** Establish the mobile context layer mirroring the web patterns: persist `householdId` in a single shared MMKV instance, add a QueryClient with an MMKV persister backed by that same instance, fetch memberships via the existing `GET /api/households`, bootstrap the default household (persisted-if-still-a-member, else first) + current month on app load, expose a household-switch action that purges + invalidates the persisted cache (with a visible switching indicator) before loading the new household, and a logout action that clears session + cache + store entirely.

## Boundaries & Constraints

**Always:**
- `householdId` and `currentMonth` are read only from the shared Zustand store, never from a URL or request body (A-7). Server-side membership checks still apply independently.
- One single MMKV storage layer backs BOTH the query-cache persister and the Zustand `persist` (AD-M6). Do not introduce a second storage mechanism for either. The auth LargeSecureStore MMKV instance (`id: "growbase-supabase-auth"`) stays isolated and untouched.
- Switching household MUST purge + invalidate the persisted query cache before the new household's data loads (AD-M9), and MUST surface a visible switching indicator while it happens.
- Logout MUST clear everything: supabase session, the query cache + its persisted MMKV blob, and the Zustand store (`user`, `householdId`, `currentMonth`, `allHouseholds`) — nothing survives for the next user/household.
- Default month on load is the current calendar month via shared `toYearMonth()` from `@growbase/shared`; do not persist `currentMonth` (it always resets to current on cold start). Persist only `householdId` (mirror web `partialize`).
- `isLocked` stays non-persisted and initialises `true` every launch; `user` stays non-persisted (restored from the supabase session). Do not regress the 15.1/15.2 cold-start-locked behavior.
- All new UI strings go through `t()` and are added to BOTH `vi.ts` and `en.ts` (the `en` object is type-locked to `vi`'s keys). No hardcoded copy or colors — reuse shared theme tokens.
- Household list is fetched through `apiFetch` against `/api/households` (Bearer token already wired by `useAuthSession`), unwrapping the `{ data, error }` envelope. Do not add a second data-access path (no direct supabase data reads on mobile).

**Block If:**
- The `/api/households` response shape diverges from `{ data: { id, name, role }[] }` such that the default-selection logic cannot be derived.
- A requirement emerges that forces a second persistent storage mechanism (would violate AD-M6) — do not silently add one.

**Never:**
- Do not build the Menu / nav-shell UI or a full household-switcher list screen — that is Story 15.4. This story delivers the context/data layer, the `switchHousehold` action, and the switching-indicator overlay; 15.4 consumes them.
- Do not touch backend routes or the web app store/layout (they are reference only).
- Do not persist `user`, `currentMonth`, `isLocked`, or the raw session anywhere new.
- Do not implement per-household multi-blob cache retention; switching purges the persisted cache (a clean partition), it does not keep N households' blobs around.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Bootstrap, persisted household still a member | store `householdId` = X (persisted), memberships include X | keep X as `householdId`; `currentMonth` = current month; `allHouseholds` populated | No error expected |
| Bootstrap, persisted household no longer a member | persisted `householdId` = X, memberships = [A, B] (no X) | fall back to first membership (A); persist A | No error expected |
| Bootstrap, no persisted household | `householdId` = null, memberships = [A, B] | select first (A); persist A | No error expected |
| Bootstrap, user has zero households | memberships = [] | `householdId` stays null, `allHouseholds` = []; app does not crash | Render safe empty state; no throw |
| Household switch | switch to Y ≠ current | `isSwitchingHousehold` = true → cancel in-flight queries → clear in-memory cache → purge persisted MMKV cache blob → set `householdId` = Y → `isSwitchingHousehold` = false | On purge/switch error, still land on a consistent state (flag reset, no half-switch) |
| Switch to already-current household | switch to X === current `householdId` | no-op: no purge, no indicator | No error expected |
| Logout | authenticated session present | supabase `signOut()` → clear query cache + persisted blob → reset store (user/householdId/currentMonth/allHouseholds) → route `/login` | If `signOut()` throws, force store+cache reset and still route to `/login` (never a dead end) |
| Households fetch fails (network) | `GET /api/households` errors | keep existing store context; expose query error state; bootstrap does not overwrite with empty/crash | Surface error via query state; no store corruption |

</intent-contract>

## Code Map

- `apps/mobile/src/store/appStore.ts` -- current Zustand store (`householdId`, `currentMonth`, `user`, `isLocked`, `setUser`, `clearUser`, `lock`, `unlock`); NOT persisted. Extend + wrap in `persist`.
- `apps/mobile/app/_layout.tsx` -- `AuthGate` decides login/unlock/main; only wraps `TranslationProvider`+`Toast`. Add QueryProvider, mount bootstrap, render switching overlay.
- `apps/mobile/src/api/client.ts` -- `apiFetch<T>(path, opts)` + `ApiError`; Bearer via `accessTokenProvider` (already wired). Reuse for household fetch.
- `apps/mobile/src/lib/supabase/largeSecureStore.ts` -- MMKV v4 API reference: `createMMKV({ id })` → `.getString(k)`, `.set(k,v)`, `.remove(k)`. Isolated auth instance — do NOT reuse its id.
- `apps/mobile/src/features/auth/useAuthSession.ts` -- session restore + `setAccessTokenProvider`; cold start `lock()`. Bootstrap runs after this resolves.
- `apps/mobile/src/features/auth/UnlockScreen.tsx` -- line ~70 has the only `supabase.auth.signOut()` (password fallback). Route it through the new clear-all signOut.
- `packages/shared/src/queryKeys.ts` -- `keys` factory; every data key scoped by `hid` (e.g. `transactions(hid, month)`) — natural partition after purge.
- `packages/shared/src/rules/date.ts` -- `toYearMonth()` canonical `YYYY-MM` producer. Use instead of the inline mobile helper.
- `apps/web/src/lib/stores/appStore.ts` -- REFERENCE: `persist` config, `allHouseholds: HouseholdSummary[]` (`{ id, name, role: "owner"|"member" }`), `partialize: householdId`.
- `apps/web/src/app/(app)/layout.tsx` (lines ~61-100) -- REFERENCE: bootstrap/default-selection logic (persisted-valid-else-first).
- `apps/web/src/app/api/households/route.ts` -- `GET` returns `{ data: { id, name, role }[] }` for the current user; `[]` when none.
- `apps/mobile/src/lib/i18n/messages/vi.ts` + `en.ts` + `TranslationProvider.tsx` -- flat dotted keys, `en` type-locked to `vi`. Add household/switch/logout keys to both.

## Tasks & Acceptance

**Execution:**
- [x] `apps/mobile/package.json` -- add deps `@tanstack/react-query-persist-client` and `@tanstack/query-sync-storage-persister` (react-native-mmkv is synchronous → sync persister). Run `pnpm install`.
- [x] `apps/mobile/src/lib/storage/mmkv.ts` -- export ONE shared MMKV instance (`createMMKV({ id: "growbase-app" })`, distinct from the auth id) and a sync storage adapter exposing `getItem/setItem/removeItem` (over `.getString/.set/.remove`) reusable by both the Zustand persister and the query persister (AD-M6).
- [x] `apps/mobile/src/store/appStore.ts` -- add `allHouseholds: HouseholdSummary[]`, `isSwitchingHousehold: boolean`; add `setHouseholdId`, `setCurrentMonth`, `setAllHouseholds`, `setSwitchingHousehold`, and a `reset()` (clears user/householdId/currentMonth→current/allHouseholds; leaves `isLocked` init behavior intact). Wrap `create` in `persist` using the shared MMKV adapter, `name: "growbase-workspace"`, `partialize: (s) => ({ householdId: s.householdId })`. Replace the inline month helper with shared `toYearMonth()`. Keep `user` & `isLocked` out of persisted state.
- [x] `apps/mobile/src/lib/query/queryClient.ts` -- create the `QueryClient` and the MMKV-backed `createSyncStoragePersister` (using the shared adapter, a stable key e.g. `growbase-query-cache`); export the `queryClient`, the `persister`, and a `purgeQueryCache()` helper that cancels queries, `queryClient.clear()`s, and `persister.removeClient()`s.
- [x] `apps/mobile/src/lib/query/QueryProvider.tsx` -- `PersistQueryClientProvider` wrapper wiring `queryClient` + `persister`.
- [ ] `packages/shared/src/index.ts` (or appropriate barrel) + a types file -- export a `HouseholdSummary = { id: string; name: string; role: "owner" | "member" }` type for mobile to consume (promote the shape currently duplicated in the web store; do NOT edit the web store).
- [x] `apps/mobile/src/features/household/useHouseholds.ts` -- `useQuery` calling `apiFetch<HouseholdSummary[]>("/api/households")`, keyed with a stable key (add `keys.households()` to the shared factory if absent). Enabled only when authenticated + unlocked.
- [x] `apps/mobile/src/features/household/useHouseholdBootstrap.ts` -- consume `useHouseholds`; on data arrival set `allHouseholds`, then choose default `householdId` (persisted if still a member, else first, else null) via `setHouseholdId`; idempotent (does not clobber a valid current selection). Gated on `user && !isLocked`.
- [x] `apps/mobile/src/features/household/switchHousehold.ts` -- `switchHousehold(id)`: if `id === current` no-op; else `setSwitchingHousehold(true)` → `await purgeQueryCache()` → `setHouseholdId(id)` → `setSwitchingHousehold(false)` (reset flag even on error).
- [x] `apps/mobile/src/features/auth/signOut.ts` -- `signOutAndPurge()`: `await supabase.auth.signOut()` (force-continue on throw) → `await purgeQueryCache()` → `useAppStore.getState().reset()` (+ clear persisted zustand blob) → `router.replace("/login")`.
- [x] `apps/mobile/src/features/household/SwitchingOverlay.tsx` -- full-screen overlay (spinner + `t()` label) rendered when `isSwitchingHousehold`; safe-area aware, theme tokens, ≥16px font.
- [x] `apps/mobile/app/_layout.tsx` -- wrap the tree in `<QueryProvider>`; invoke `useHouseholdBootstrap()` inside `AuthGate`; render `<SwitchingOverlay/>` above the stack.
- [x] `apps/mobile/src/features/auth/UnlockScreen.tsx` -- replace the inline `supabase.auth.signOut()` + manual cleanup in the password fallback with `signOutAndPurge()` so it also clears cache/store.
- [x] `apps/mobile/src/lib/i18n/messages/vi.ts` + `en.ts` -- add household/switch/logout keys (e.g. `household.switching`, `household.switchError`, `auth.logout`) to BOTH files.
- [x] Tests (`*.test.ts(x)` colocated) -- unit-test: store persist/partialize + `reset`; `switchHousehold` purge sequence (flag true→false, `purgeQueryCache` called before `setHouseholdId`, same-id no-op); `useHouseholdBootstrap` default-selection cases from the I/O matrix; `signOutAndPurge` clear-all + force-continue on signOut throw; `useHouseholds` envelope handling. Mock MMKV + queryClient/persister.

**Acceptance Criteria:**
- Given an authenticated, unlocked user with ≥1 household, when the app loads, then `householdId` and `currentMonth` are read from the Zustand store, `currentMonth` = current calendar month, and `householdId` defaults to the persisted household if still a member, otherwise the first membership. (FR-4, A-7)
- Given the user switches to a different household, when the switch runs, then `isSwitchingHousehold` is true for the duration, the in-memory cache is cleared AND the persisted MMKV cache blob is purged before the new `householdId` is set, and the indicator is dismissed afterward. (AD-M9)
- Given the user logs out, when `signOutAndPurge()` runs, then the supabase session, the query cache, its persisted MMKV blob, and the store (user/householdId/currentMonth/allHouseholds) are all cleared and the user is routed to `/login`; a thrown `signOut()` still results in a fully-cleared, routed state. (AD-M9)
- Given the app persists state, then exactly one MMKV storage layer backs both the Zustand persist and the query persister, and the auth LargeSecureStore instance remains separate and unmodified. (AD-M6)
- Given the 15.1/15.2 behavior, when the app cold-starts, then `isLocked` is still `true` and `user`/session are restored from supabase (no regression).

## Spec Change Log

## Review Triage Log

### 2026-07-17 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 3
- defer: 6
- reject: 6
- addressed_findings:
  - `medium` `patch` `reset()` did not clear `isSwitchingHousehold` → logout mid-switch left `SwitchingOverlay` mounted over `/login`, trapping the user. Fixed: `reset()` now sets `isSwitchingHousehold: false` (+ test).
  - `medium` `patch` `signOutAndPurge` skipped store reset + `/login` route if `purgeQueryCache()` threw (only a thrown `signOut()` was handled), violating the spec AC "a thrown signOut still results in a fully-cleared, routed state". Fixed: purge wrapped in try/catch, reset+clearStorage+route in `finally` (+ test).
  - `medium` `patch` `useHouseholdBootstrap` replaced a stale/revoked persisted household with a different one via raw `setHouseholdId` (no purge) → new household could read the old household's persisted cache (AD-M9), and wrote on every fetch. Fixed: write only on change; when replacing a non-null household, `purgeQueryCache()` before `setHouseholdId`.

### 2026-07-17 — Review pass (follow-up)
- intent_gap: 0
- bad_spec: 0
- patch: 1: (medium 1)
- defer: 1: (medium 1)
- reject: 13
- addressed_findings:
  - `medium` `patch` `useHouseholdBootstrap` used `void purgeQueryCache().finally(() => setHouseholdId(next))`, which set the new `householdId` even when the purge **rejected** — switching without a successful purge lets the new household read the stale persisted cache (the exact AD-M9 leak the surrounding comment warns against), plus an unhandled promise rejection. Fixed: switch only on purge success (`.then(setHouseholdId).catch(noop)`), mirroring `switchHousehold`'s no-half-switch-on-error semantics. tsc 0, 50 tests still pass.
- deferred (new ledger entry): purge is not durable — `PersistQueryClientProvider`'s live persist subscription re-writes the `growbase-query-cache` blob after `purgeQueryCache()`'s `removeClient()` (throttled persist fires post-removal on the `clear()`-induced cache event / `useHouseholds` refetch). Harmless today (only same-user households mounted); a real cross-context leak once 15.4 mounts hid-scoped consumers. Distinct from the already-logged removeClient-rejection case.
- rejected: households key not user-scoped, no `maxAge`/`buster`, hardcoded overlay colors, `currentMonth` month-boundary refresh, `switchHousehold` concurrency/invalid-id/error-UI/flip-after-clear ordering (all duplicates of existing 15-3 ledger entries D2–D6); `apiFetch` non-array cast (server route guarantees an array); bootstrap-purge extra refetch + `allHouseholds` unconditional write (low perf, no consumers yet); `signOut` reset-after-purge race and residual `{householdId:null}` blob (benign — token already invalidated, no sensitive data); households fetch error not surfaced to UI (error state exposed via the hook; UI belongs to 15.4).

## Design Notes

- Cache partition strategy: purge-on-switch (clear + `removeClient`) rather than retaining per-household blobs. Query keys already embed `hid`, so after a purge only the active household's data is ever persisted — this satisfies AD-M9's "partitioned + purge before load" with the least storage/complexity, and matches web's invalidate-on-switch behavior.
- `switchHousehold` / `signOutAndPurge` live outside the store (in query/household/auth modules) because they orchestrate `queryClient`, which the store must not import (circular dep). The store only holds the `isSwitchingHousehold` flag + setters.
- Bootstrap belongs in `AuthGate`, gated on `user && !isLocked`, so household fetch never fires for a locked/cold session (respects 15.2).
- `HouseholdSummary` promoted to shared to avoid a third copy; web store left untouched to avoid regression (it can migrate later).

## Verification

**Commands:**
- `pnpm install` (from repo root) — confirm new deps resolve, `.pnpmfile.cjs` peer injection still holds for mobile.
- `pnpm --filter @growbase/mobile exec tsc --noEmit` — type-check (verifies i18n key parity vi/en, HouseholdSummary usage).
- `pnpm --filter @growbase/mobile test` (or the mobile jest runner) — run the new unit tests.
- `pnpm --filter @growbase/shared exec tsc --noEmit` — verify shared type export compiles.

**Manual checks (dev client, cannot run in CI):**
- Cold start → unlock → Home shows data for the default household; kill + relaunch → same household restored (persisted), month = current.
- Trigger `switchHousehold` (temporary dev trigger or via test harness) → switching overlay appears → after it dismisses, `householdId` changed and cache is fresh.
- Trigger `signOutAndPurge` → lands on `/login`; relaunch → no prior household/cache leaked.

## Auto Run Result

Status: done

**Summary:** Established the mobile household + month context layer: MMKV-persisted `householdId` (single shared MMKV instance backing both the Zustand persist and a new TanStack Query cache persister — AD-M6), household bootstrap with default-selection on app load, a `switchHousehold` action that purges + invalidates the persisted cache with a switching-indicator overlay (AD-M9), and a `signOutAndPurge` logout that clears session + cache + store entirely. Household list fetched via `apiFetch(/api/households)`. `HouseholdSummary` promoted to shared; `households()` query key added; mobile month helper switched to shared `toYearMonth()`.

**Files changed (feature):**
- `apps/mobile/package.json` / `pnpm-lock.yaml` — add `@tanstack/react-query-persist-client` + `@tanstack/query-sync-storage-persister`.
- `apps/mobile/src/lib/storage/mmkv.ts` — single shared `growbase-app` MMKV instance + getItem/setItem/removeItem adapter (AD-M6).
- `apps/mobile/src/store/appStore.ts` — `allHouseholds`/`isSwitchingHousehold` + setters + `reset()`; `persist` (partialize `householdId`); shared `toYearMonth()`.
- `apps/mobile/src/lib/query/queryClient.ts` — QueryClient + MMKV sync persister + `purgeQueryCache()`.
- `apps/mobile/src/lib/query/QueryProvider.tsx` — `PersistQueryClientProvider`.
- `packages/shared/src/types/app.ts` — `HouseholdSummary`; `packages/shared/src/queryKeys.ts` — `households()`.
- `apps/mobile/src/features/household/{useHouseholds,useHouseholdBootstrap,switchHousehold,SwitchingOverlay}.{ts,tsx}` — fetch/bootstrap/switch/indicator.
- `apps/mobile/src/features/auth/signOut.ts` — `signOutAndPurge` clear-all.
- `apps/mobile/app/_layout.tsx` — QueryProvider wrap + bootstrap + overlay.
- `apps/mobile/src/features/auth/UnlockScreen.tsx` — password fallback → `signOutAndPurge`.
- `apps/mobile/src/lib/i18n/messages/{vi,en}.ts` — household/switch/logout keys.
- `apps/mobile/src/test/mmkvStub.ts` + `vitest.config.ts` — test-only MMKV stub (fixed pre-existing suites broken by the new transitive mmkv import).

**Review findings breakdown:** 3 patches applied (reset clears `isSwitchingHousehold`; `signOutAndPurge` always clears+routes even if purge throws; bootstrap purges cache when replacing a stale household + writes only on change — all with tests). 6 deferred (unencrypted query cache; cross-user cache partitioning; persister maxAge/buster; mobile theme tokens → 15.4; month-boundary refresh; `switchHousehold` concurrency/invalid-id guards → 15.4). 6 rejected (UTC→local month is intended web alignment; logout `isLocked` is not a regression since fresh login unlocks via SIGNED_IN; non-array data guarded by typed envelope; `isPending`/switch-flag findings subsumed by existing/other fixes; renderHook effect test needs absent RN renderer).

**Verification:** `pnpm install` ok; `tsc --noEmit` exit 0 for mobile AND shared; `pnpm --filter @growbase/mobile test` → 9 files / 50 tests passed. Manual dev-client checks (cold-start restore, switch overlay, logout no-leak) listed in Verification — cannot run in this unattended CI context.

**Residual risks:** The persisted query cache is unencrypted and not user-partitioned (deferred D1/D2) — a real data-at-rest / cross-user-on-shared-device concern introduced by adding persistence. Additionally, `purgeQueryCache()`'s `removeClient()` is not durable while the `PersistQueryClientProvider` subscription is live (new deferred entry) — the blob can be re-written by a post-purge cache event; harmless until 15.4 mounts hid-scoped consumers. Hooks are tested via extracted pure logic + mocks (no RN test renderer installed), so React render-time wiring is not exercised by automated tests.

---

**Follow-up review pass (2026-07-17):** Fresh adversarial + edge-case review of the same baseline diff. 1 patch applied (`useHouseholdBootstrap` no longer switches `householdId` when the purge rejects — closes an AD-M9 leak + unhandled rejection; mirrors `switchHousehold`). 1 new item deferred (purge not durable — persister re-writes blob after `removeClient`). 13 findings rejected (duplicates of ledger D2–D6, or low/benign). Verification: `pnpm --filter @growbase/mobile exec tsc --noEmit` exit 0; `pnpm --filter @growbase/mobile test` → 9 files / 50 tests passed. `followup_review_recommended` set to `false` (single localized fix).
