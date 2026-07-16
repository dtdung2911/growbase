---
title: 'Story 15.2: Face ID unlock (cold start + resume)'
type: 'feature' # feature | bugfix | refactor | chore
created: '2026-07-16'
status: 'done' # draft | ready-for-dev | in-progress | in-review | done | blocked
review_loop_iteration: 0 # incremented by step-04 before each review loopback
followup_review_recommended: false # set by step-04 on status: done from the final review pass significance judgment
baseline_revision: '65a7069ec5dae0f64a5dd5ca1a35031970593c0f'
final_revision: '35b827bc8b59d5a64ef03ec71e13690639974ea1'
context: []
warnings: []
---

<intent-contract>

## Intent

**Problem:** After Story 15.1, a session persists across app restarts (LargeSecureStore), but anyone with the device can open the app and land straight in the data — there is no biometric gate on cold start or on resuming from background.

**Approach:** Add a shared `isLocked` flag to the Zustand store, defaulting to locked whenever a session is *restored* from storage (cold start) or the app resumes from background past a timeout; render a dedicated `UnlockScreen` that auto-prompts Face ID/fingerprint via `expo-local-authentication` and falls back to password re-entry when biometrics fail or are unavailable.

## Boundaries & Constraints

**Always:**
- A session restored from `largeSecureStore` (cold start) must be locked until biometric (or fallback) succeeds — never render app content for a stale/unattended session.
- Biometric failure/unavailability must never be a dead end: always offer a working path back into the app (device passcode via `disableDeviceFallback: false`, and an app-level "enter password" escape hatch that re-runs the existing login flow).
- Resuming from background after `LOCK_TIMEOUT_MS` (60s) re-locks; resuming before that threshold does not re-prompt.
- A successful interactive sign-in (fresh login, including via the fallback path) unlocks immediately — the user just proved identity with a password, so no redundant biometric prompt.
- All new UI copy goes through `t()` with vi (default) + en keys added in the same change.

**Block If:** none identified — no ambiguity requires pausing implementation.

**Never:**
- Do not add a "peek without decrypting" API to `largeSecureStore.ts` — out of scope; the existing `getItem`/`getSession()` restore path is reused as-is.
- Do not build a custom password-verification-only flow; reuse the existing `LoginScreen`/`signInWithPassword` path for the fallback rather than inventing a lighter-weight re-auth.
- Do not persist `isLocked` (no MMKV/Zustand persist middleware) — it must always start `true` per process launch so cold start is never silently unlocked.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Cold start with stored session | `useAuthSession` initial `getSession()` resolves with a session | `isLocked=true`, `UnlockScreen` renders, Face ID auto-prompts | No error expected |
| Resume, short background | App backgrounded then foregrounded before 60s elapsed | Stays unlocked, no re-prompt | No error expected |
| Resume, long background | App backgrounded then foregrounded after ≥60s elapsed | `isLocked` set `true`, `UnlockScreen` renders again | No error expected |
| Biometric success | `authenticateAsync` resolves `{success: true}` | `unlock()` called, app content renders | No error expected |
| Biometric fail/cancel | `authenticateAsync` resolves `{success: false}` | Stay locked, fallback "enter password" button visible | Toast/error not required — button is always visible, not error-triggered |
| No hardware / not enrolled | `hasHardwareAsync` or `isEnrolledAsync` resolves `false` | Skip auto-prompt entirely, show fallback button only | No error expected |
| Fallback password re-entry | User taps "enter password" | `supabase.auth.signOut()` then `router.replace('/login')`; on successful login, `onAuthStateChange` fires and unlocks | Existing login error handling (5s toast) applies unchanged |

</intent-contract>

## Code Map

- `apps/mobile/src/store/appStore.ts` -- Zustand store; add `isLocked`/`lock`/`unlock`.
- `apps/mobile/src/features/auth/useAuthSession.ts` -- session restore hook; distinguish initial restore vs. interactive sign-in to decide lock/unlock.
- `apps/mobile/src/lib/supabase/useAutoRefresh.ts` -- existing AppState pattern to mirror for the new background-timeout hook.
- `apps/mobile/app/_layout.tsx` -- `AuthGate`; gate rendering on `isLocked` before the existing login/app redirect logic.
- `apps/mobile/src/features/auth/UnlockScreen.tsx` -- new; biometric prompt + fallback UI.
- `apps/mobile/src/features/auth/useBiometricLock.ts` -- new; background-timeout re-lock hook + pure `shouldRelock` helper.
- `apps/mobile/src/lib/i18n/messages/vi.ts` / `en.ts` -- add `unlock.*` keys.
- `apps/mobile/src/features/auth/useAuthSession.test.ts` -- existing pattern for testing pure helpers without mounting the hook.
- `apps/mobile/src/lib/supabase/largeSecureStore.test.ts` -- existing pattern for mocking native modules with `vi.mock`.

## Tasks & Acceptance

**Execution:**
- [x] `apps/mobile/package.json` -- add `expo-local-authentication` (SDK 56-compatible version) -- provides `hasHardwareAsync`/`isEnrolledAsync`/`authenticateAsync`.
- [x] `apps/mobile/src/store/appStore.ts` -- add `isLocked: boolean` (default `true`), `lock: () => void`, `unlock: () => void` -- shared gate state, mirroring existing `setUser`/`clearUser` style.
- [x] `apps/mobile/src/features/auth/useAuthSession.ts` -- add a ref flag to distinguish the initial `getSession()` resolution from later `onAuthStateChange` events; call `appStore.lock()` if the initial resolution has a session, call `appStore.unlock()` on any session set via a later `onAuthStateChange` event -- cold-start restore locks, interactive sign-in unlocks.
- [x] `apps/mobile/src/features/auth/useBiometricLock.ts` -- export `shouldRelock(backgroundedAt: number | null, now: number, timeoutMs: number): boolean` (pure) and `useBiometricLock(): void` (AppState listener mirroring `useAutoRefresh`: records `backgroundedAt` on `background`, calls `appStore.lock()` via `shouldRelock` on transition back to `active`) -- implements resume-after-timeout.
- [x] `apps/mobile/src/features/auth/useBiometricLock.test.ts` -- unit tests for `shouldRelock`: elapsed < timeout → `false`; elapsed ≥ timeout → `true`; `backgroundedAt === null` → `false` -- covers the I/O matrix's timeout edge cases.
- [x] `apps/mobile/src/features/auth/UnlockScreen.tsx` -- on mount, check `hasHardwareAsync`/`isEnrolledAsync`; if both true, call `authenticateAsync({ disableDeviceFallback: false })` and `unlock()` on success; always render an "enter password" button calling `supabase.auth.signOut()` then `router.replace('/login')` -- satisfies the "never a dead end" constraint.
- [x] `apps/mobile/app/_layout.tsx` -- in `AuthGate`, read `isLocked` from `useAppStore`, call `useBiometricLock()`, and render `<UnlockScreen />` when `user && isLocked`, before the existing login/app segment-redirect effect -- wires the gate into the app shell.
- [x] `apps/mobile/src/lib/i18n/messages/vi.ts` + `en.ts` -- add `unlock.title`, `unlock.faceId.cta`, `unlock.password.cta`, `unlock.error.failed` -- new UI copy, no hardcoded strings.

**Acceptance Criteria:**
- Given a stored session from a previous login, when the app cold-starts, then `UnlockScreen` renders and Face ID/fingerprint is auto-prompted (per NFR-1, this must not block the screen from being interactive within ≤3s).
- Given the app is unlocked and backgrounded for less than 60s, when it resumes, then no re-prompt occurs and app content stays visible.
- Given the app is unlocked and backgrounded for 60s or more, when it resumes, then `UnlockScreen` renders again.
- Given biometric hardware is absent or unenrolled, when `UnlockScreen` mounts, then no biometric prompt fires and only the password fallback button is shown.
- Given biometric authentication fails or is cancelled, when the user taps "enter password", then they are signed out and routed to `/login`; a subsequent successful login unlocks the app without a further biometric prompt.

## Design Notes

- **Lock/unlock ownership split:** cold-start lock decision lives in `useAuthSession` (it already knows the difference between "restored from storage" and "just signed in"); the *re-lock-on-resume* decision lives in the new `useBiometricLock` hook. Both write to the same `appStore.lock()`/`unlock()` actions — single source of truth, two triggers.
- **Why signOut() on fallback instead of a lighter password check:** there's no existing "verify password without establishing a new session" API, and building one is out of scope per the boundaries above. Signing out and reusing `LoginScreen` costs one extra round-trip but is simplest and already tested.
- **`LOCK_TIMEOUT_MS = 60_000`:** not specified by the epic/PRD; chosen as a reasonable finance-app default. Keep it as a named constant in `useBiometricLock.ts` so it's trivially tunable later without a spec change.
- **Native fallback vs. app fallback:** `disableDeviceFallback: false` lets iOS/Android offer the OS-level device passcode automatically on repeated Face ID failure — this covers the "passcode" half of the AC. The app-level "enter password" button covers the "password" half (no biometrics enrolled at all, or the user dismisses the native prompt).

## Verification

**Commands:**
- `pnpm --filter @growbase/mobile test` -- expect all vitest suites (including new `useBiometricLock.test.ts`) to pass.
- `pnpm --filter @growbase/mobile type-check` -- expect zero TypeScript errors.

**Manual checks (if no CLI):**
- On a simulator/device with Face ID enrolled: force-quit and relaunch after a prior login → `UnlockScreen` shows, Face ID prompts automatically, success enters the app.
- Background the app, wait >60s, foreground it → locked again.
- Background the app, wait <60s, foreground it → stays unlocked.
- On a simulator with no biometrics enrolled: only the password fallback button appears, no auto-prompt.

## Review Triage Log

### 2026-07-16 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 5 (high 1, medium 2, low 2)
- defer: 0
- reject: 7 (low 7)
- addressed_findings:
  - `[high]` `[patch]` Missing iOS `NSFaceIDUsageDescription` (and Android biometric config) — `authenticateAsync` would crash at runtime on iOS. Added `expo-local-authentication` config plugin with `faceIDPermission` to `apps/mobile/app.json`.
  - `[medium]` `[patch]` `useAuthSession.ts` skipped the first `onAuthStateChange` event positionally (`initialAuthChangeHandled` ref) instead of checking the actual event type, so a real early auth event could be silently swallowed. Replaced with an explicit `event === "INITIAL_SESSION"` check; ref removed.
  - `[medium]` `[patch]` `UnlockScreen.tsx` had no try/catch around `authenticateAsync`/`hasHardwareAsync`/`isEnrolledAsync`/`signOut`, risking unhandled rejections and a stuck screen on hardware/network error. Wrapped all four calls; hardware-probe failure now falls back to password-only UI, auth/sign-out failure now surfaces the existing error state instead of throwing.
  - `[low]` `[patch]` Buttons in `UnlockScreen.tsx` had no pending/disabled state during async auth or sign-out calls, contradicting the project's `isPending → disabled button` convention and allowing double-taps. Added `isPending` state disabling both buttons during in-flight operations, mirroring `LoginScreen.tsx`.
  - `[low]` `[patch]` A user-cancelled biometric prompt (`result.error === "user_cancel"`/`"app_cancel"`) showed the same generic "Authentication failed" message as a real failure. Now cancels are silent; only genuine failures set the error text.
  - `[low]` `[reject]` Hardcoded hex colors in `UnlockScreen.tsx`'s `StyleSheet` (no theme-token system). Matches the existing convention in `LoginScreen.tsx` verbatim — not a regression introduced by this story; no mobile theming layer exists yet to migrate to.
  - `[low]` `[reject]` "Enter password" button copy signs out + redirects to `/login` rather than checking password in-place. This is the deliberate, documented tradeoff in Design Notes ("no lighter-weight re-auth API exists"); functionally the user still ends up entering their password, satisfying the epic AC's "password" fallback.
  - `[low]` `[reject]` Two fallback trust levels (OS device passcode vs. full app sign-out) noted as an implicit product decision. Already reasoned through in Design Notes ("Native fallback vs. app fallback"); matches the epic AC's literal "passcode/password" wording.
  - `[low]` `[reject]` `useBiometricLock` runs unconditionally regardless of login state. Harmless no-op when logged out (mirrors the existing `useAutoRefresh` pattern, which has the same characteristic).
  - `[low]` `[reject]` `AppState` "inactive" transitions (control center, incoming call) aren't treated as backgrounding. Intentional/conventional — momentary "inactive" interruptions shouldn't force a re-lock, and the existing `useAutoRefresh` hook doesn't special-case it either.
  - `[low]` `[reject]` Device clock moved backward could indefinitely delay the resume re-lock timer. Requires physical device tampering by someone who already holds the unlocked device; disproportionate to fix cost, and no existing hook in the codebase guards against clock skew.
  - `[low]` `[reject]` `_layout.tsx`'s segment-redirect effect doesn't gate on `isLocked`. Traced through: it only ever navigates to the same destination the user would land on post-unlock anyway, and `<Stack>` doesn't mount while locked, so there's no visible or functional side effect.

### 2026-07-16 — Review pass (follow-up)
- intent_gap: 0
- bad_spec: 0
- patch: 4 (high 1, medium 1, low 2)
- defer: 2 (low 2)
- reject: 2 (low 2)
- addressed_findings:
  - `[high]` `[patch]` `useAuthSession.ts`'s `onAuthStateChange` handler called `unlock()` for *any* event carrying a session, not just an interactive sign-in — a non-interactive `TOKEN_REFRESHED`/`USER_UPDATED` event (driven by `useAutoRefresh`) would silently clear `isLocked` without the user ever touching Face ID, defeating the lock. Changed the condition to `session && event === "SIGNED_IN"`.
  - `[medium]` `[patch]` `UnlockScreen.tsx`'s `handlePassword` swallowed a `supabase.auth.signOut()` failure and navigated to `/login` regardless, but since no `SIGNED_OUT` event fires on that path, the store's `user`/`isLocked` stayed unchanged and `AuthGate` kept rendering `<UnlockScreen/>` over the login route — a dead end violating the "never a dead end" constraint. Catch now calls `clearUser()` + `unlock()` so `AuthGate` actually releases.
  - `[low]` `[patch]` `authenticate` in `UnlockScreen.tsx` had no unmount guard (unlike the hardware-probe effect), so a mid-flight `authenticateAsync` resolving after the component unmounted (e.g. user tapped password fallback first) could call `setState`/`unlock()` on a gone screen. Added a `mounted` ref checked before applying results.
  - `[low]` `[patch]` `shouldRelock` compared `now - backgroundedAt` without guarding against a negative result, so a device clock moving backward while backgrounded (NTP sync, manual change) would never trigger a re-lock regardless of real elapsed time. Now treats a negative elapsed time as suspicious and forces a re-lock; added a regression test.
  - `[low]` `[defer]` Native Face ID permission string (`app.json` `faceIDPermission`) is Vietnamese-only, no English variant — OS-level permission strings aren't wired through the app's `t()` i18n system, out of this story's scope.
  - `[low]` `[defer]` No test exercises `useAuthSession`'s auth-state-driven lock/unlock transitions end-to-end (only the pure `shouldRelock` helper is unit tested) — needs RN hook/integration test infra not yet present in `apps/mobile`.
  - `[low]` `[reject]` "Enter password" CTA signs out + redirects to `/login` rather than checking a password in-place. Matches the spec's `<intent-contract>` I/O matrix verbatim ("Fallback password re-entry ... `supabase.auth.signOut()` then `router.replace('/login')`"); not a defect.
  - `[low]` `[reject]` `LOCK_TIMEOUT_MS = 60_000` called out as "not spec'd, tune freely" in a stale comment. The value is spec'd (`<intent-contract>` "after `LOCK_TIMEOUT_MS` (60s)"); the comment was simply wrong and has been removed rather than treated as a behavior finding.

### 2026-07-16 — Review pass (follow-up)
- intent_gap: 0
- bad_spec: 0
- patch: 2 (low 2)
- defer: 2 (medium 1, low 1)
- reject: 9 (medium 1, low 8)
- addressed_findings:
  - `[low]` `[patch]` `authenticateAsync({ disableDeviceFallback: false })` in `UnlockScreen.tsx` passed no `promptMessage`, so the native biometric dialog showed the OS default text instead of localized copy on every unlock attempt. Added `unlock.faceId.prompt` to both `vi.ts`/`en.ts` and wired it through.
  - `[low]` `[patch]` `authenticate()` in `UnlockScreen.tsx` had no re-entrancy guard of its own — the `isPending` state disables the buttons, but a tap landing before that state commits could still start a second concurrent `authenticateAsync` call. Added a synchronous `pending` ref checked/set at the top of `authenticate`, independent of the `isPending` state used for rendering (kept out of the `useCallback` deps to avoid re-triggering the mount-time auto-authenticate effect).
  - `[medium]` `[defer]` If `supabase.auth.signOut()` throws in `UnlockScreen.tsx`'s password-fallback handler, the catch path clears local store state only — the persisted Supabase session token is never invalidated, so a later cold start can restore it and gate behind biometrics only instead of the forced password re-entry the flow intends. Fixing this safely (e.g. local-scope sign-out or storage wipe) is more than a mechanical patch; deferred to `deferred-work.md`.
  - `[low]` `[defer]` New native module `expo-local-authentication` requires a fresh dev-client build before this feature works on-device; no rebuild step is called out in the spec's Verification section. Deferred to `deferred-work.md`.
  - `[medium]` `[reject]` Sign-out succeeding still races `router.replace("/login")` in `handlePassword`'s `finally` against the async `SIGNED_OUT` listener clearing `user`, while `AuthGate` has already unmounted `<Stack/>` in favor of `<UnlockScreen/>`. Traced the full render cycle: `AuthGate`'s redirect `useEffect` is declared above the `user && isLocked` conditional render and re-fires once `clearUser()` lands (regardless of which branch was showing), re-issuing `router.replace` once `<Stack/>` is actually mounted again. Self-healing, no observable defect.
  - `[low]` `[reject]` `UnlockScreen.tsx` only probes `hasHardwareAsync()`/`isEnrolledAsync()` once on mount; disabling biometrics on-device while the lock screen is showing wouldn't hide the Face ID button. Narrow window (requires a settings change mid-lock-screen) and the password fallback remains available regardless; not worth the added complexity.
  - `[low]` `[reject]` `authenticate`'s failure path only shows a generic "Authentication failed" message, not distinguishing lockout vs hardware-busy vs mismatch. Cosmetic UX nice-to-have, password fallback is always one tap away.
  - `[low]` `[reject]` No accessibility labels/testIDs on `UnlockScreen.tsx`'s `Pressable`s or error text. Cosmetic, no functional defect.
  - `[low]` `[reject]` Mount-time auto-authenticate effect only fires once per mount; relies on `UnlockScreen` remounting on every fresh lock. True today (component is conditionally rendered, not just hidden); flagged as a future-refactor risk only, no current bug.
  - `[low]` `[reject]` Untested `AppState` listener wiring in `useBiometricLock`. Already recorded in this same review-pass's prior entry (line above) and in `deferred-work.md`; not re-added.
  - `[low]` `[reject]` `faceIDPermission` Vietnamese-only permission string. Already recorded in this spec's own deferred-work entry from the previous pass; not re-added.
  - `[low]` `[reject]` `useAuthSession`'s `getSession()` has no timeout guard — a hang would leave `initializing` `true` forever. Pre-existing behavior from story 15.1's `useAuthSession`, not introduced or exposed by this story's changes.
  - `[low]` `[reject]` `unlock()` on `"SIGNED_IN"` trusts the raw event name as proof of interactive login; a hypothetical future `setSession()` call elsewhere could also emit it. No such call exists anywhere in the current codebase — speculative, not an observed defect.

## Auto Run Result

**Summary:** Implemented Story 15.2 — biometric-gated unlock on top of Story 15.1's persisted session. Cold-start session restore now locks the app behind a `UnlockScreen` that auto-prompts Face ID/fingerprint (`expo-local-authentication`), backgrounding for ≥60s re-locks on resume, interactive sign-in unlocks immediately, and biometric failure/unavailability always falls back to a working "enter password" path (device passcode via the OS, or app-level sign-out + re-login).

**Files changed:**
- `apps/mobile/package.json` — added `expo-local-authentication` dependency.
- `apps/mobile/app.json` — added `expo-local-authentication` config plugin with `faceIDPermission` (fixes the iOS crash found in review).
- `apps/mobile/src/store/appStore.ts` — added `isLocked` (default `true`), `lock()`, `unlock()`.
- `apps/mobile/src/features/auth/useAuthSession.ts` — locks on cold-start session restore, unlocks on interactive sign-in; distinguishes the two via an explicit `event === "INITIAL_SESSION"` check (patched during review from a fragile positional ref).
- `apps/mobile/src/features/auth/useBiometricLock.ts` (new) — pure `shouldRelock` helper + `AppState`-based re-lock-on-resume hook, mirroring `useAutoRefresh`.
- `apps/mobile/src/features/auth/useBiometricLock.test.ts` (new) — unit tests for `shouldRelock`'s three timeout branches.
- `apps/mobile/src/features/auth/UnlockScreen.tsx` (new) — biometric prompt + password fallback UI; hardened during review with try/catch on all native calls, pending/disabled button state, and cancel-vs-failure differentiation.
- `apps/mobile/app/_layout.tsx` — `AuthGate` now calls `useBiometricLock()` and renders `UnlockScreen` when `user && isLocked`.
- `apps/mobile/src/lib/i18n/messages/vi.ts` / `en.ts` — added `unlock.title`, `unlock.faceId.cta`, `unlock.password.cta`, `unlock.error.failed`, `unlock.faceId.prompt` (added this pass).

**Review findings breakdown (cumulative across all three passes):** 0 intent_gap, 0 bad_spec, 11 patch (2 high, 3 medium, 6 low — all applied), 4 defer, 18 reject (1 medium, 17 low, dropped silently; see Review Triage Log above for reasoning on each).

**Follow-up pass 2 (2026-07-16) verification:** `pnpm --filter @growbase/mobile exec tsc --noEmit` clean; `pnpm --filter @growbase/mobile exec vitest run src/features/auth/useBiometricLock.test.ts` — 4/4 pass (including new clock-skew regression test). No manual on-device run performed this pass.

**Follow-up pass 3 (2026-07-16) — this pass:** localized the native Face ID prompt text (`unlock.faceId.prompt`) and hardened `authenticate()` in `UnlockScreen.tsx` with a synchronous ref-based re-entrancy guard (closes a double-tap race the `isPending` state alone didn't fully cover). Deferred a security-relevant gap (sign-out failure leaves the persisted Supabase session valid) and a deployment note (new native module needs a fresh dev-client build) to `deferred-work.md`. Verification: `pnpm --filter @growbase/mobile exec tsc --noEmit` clean; `pnpm --filter @growbase/mobile test -- --run` — all suites pass. No manual on-device run performed this pass.

**Residual risk:** Auth-state-driven lock/unlock transitions (`useAuthSession.ts`) are still only covered by manual reasoning + the pure `shouldRelock` unit tests, not an integration test — tracked as a deferred item. Native Face ID permission string remains Vietnamese-only. Sign-out failure during password fallback can leave a persisted session behind (see deferred-work.md).

**Follow-up review recommendation: `false`.** This pass's changes are two localized, low-consequence fixes (a missing i18n string on a native dialog, and a defensive re-entrancy guard on an already-mitigated race) — no core-security/auth-logic behavior changed. Does not warrant another independent review pass.

**Verification:**
- `pnpm --filter @growbase/mobile type-check` — 0 errors.
- `pnpm --filter @growbase/mobile test` — all suites pass, including new `useBiometricLock.test.ts`.
- Manual on-device checks (simulator Face ID prompt, background timeout, no-biometrics fallback) were not run in this unattended pass — no simulator/device available in this environment. Flagged as a residual risk below.

**Residual risks:**
- Manual on-device/simulator verification (per this spec's own Verification section) has not been performed — the cold-start prompt timing (NFR-1: interactive within ≤3s), the real Face ID prompt UX, and the `app.json` plugin's actual effect on a built iOS binary are unverified beyond static analysis and unit tests.
- `LOCK_TIMEOUT_MS = 60_000` is an unvalidated product default (documented in Design Notes) — worth confirming with product/design before wider rollout.
- The app-level password fallback still depends on a full `signOut()` round-trip; acceptable per this story's scope but a candidate for a lighter-weight re-auth API in a future story.
