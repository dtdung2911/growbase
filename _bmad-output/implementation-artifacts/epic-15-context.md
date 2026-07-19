# Epic 15 Context: Auth, Unlock & Shell

<!-- Generated from planning artifacts. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Establish the mobile app's secure entry path and working context: users log in once, unlock subsequent sessions with Face ID/fingerprint, always operate inside the correct household and month, and navigate a shell (bottom nav + FAB) that stays visually and linguistically consistent with the web app. This epic is foundational — every other epic depends on a working, secure session and household/month context existing first.

## Stories

- Story 15.1: Đăng nhập email/password + session lưu an toàn
- Story 15.2: Face ID unlock (cold start + resume)
- Story 15.3: Household + month context + switch (cache purge)
- Story 15.4: Nav shell + i18n + theme

## Requirements & Constraints

- App must be installable with its own icon and launch directly without entering a URL/domain (no browser chrome).
- End-to-end from tapping the app icon → biometric unlock → completing a transaction save must be under 15 seconds; cold start to an input-ready screen must be ≤ 3 seconds on a mid-range device.
- Failed login must preserve the entered form and surface an error toast for 5 seconds (no silent failure, no form reset).
- Biometric failure must fall back to passcode/password — never a dead end.
- All UI strings go through the shared i18n `t()` function (Vietnamese default, English secondary); no hardcoded copy or colors — reuse the shared theme tokens (light/dark, following OS setting with an in-app toggle).
- Touch targets ≥ 44px, input font ≥ 16px, safe-area/notch aware throughout the shell.
- Household and current-month selection must always be read from the shared client-side store, never trusted from a URL or request body directly (server-side membership checks still apply independently).

## Technical Decisions

- Auth is handled purely by `supabase-js` on-device for login/token refresh — it is never used for data reads/writes. All data access goes through the existing Next.js `/api/*` routes, unchanged on the backend except where explicitly noted.
- Session persistence pattern: an AES-256 key lives in `expo-secure-store`; the encrypted session blob itself is stored in MMKV (the "LargeSecureStore" pattern). Raw/unencrypted session data must never be written to SecureStore directly (SecureStore has a ~2048 byte limit that raw sessions can exceed).
- Supabase client config: `autoRefreshToken: true`, `persistSession: true`, `detectSessionInUrl: false`; token auto-refresh should start/stop in response to `AppState` changes (foreground/background) rather than running unconditionally.
- Every authenticated request to `/api/*` must attach `Authorization: Bearer <access_token>`. Backend `withAuth()` needs to accept Bearer tokens in addition to its existing cookie-session path — this is a backend touch-point, not purely mobile-side.
- Biometric gate uses `expo-local-authentication` (Face ID/fingerprint) to unlock/decrypt the stored session on cold start and on resume after a timeout; on failure, fall back to passcode/password entry.
- Household/month context lives in the shared Zustand store (`householdId`, `currentMonth`) — same shape as documented in project conventions. Default on load: most-recently-used household + current calendar month.
- Persisted TanStack Query cache (via MMKV) must be partitioned per household. Switching household requires purging and invalidating the previously-persisted cache before loading the new household's data (must show a visible "switching" indicator during this). Logout must clear all cache and session state entirely — nothing should survive for the next user/household.
- One single storage layer (MMKV) backs both the query-cache persister and the Zustand persist — do not introduce a second storage mechanism for either.
- Suggested code organization: an `auth/` module owns supabase-js auth + LargeSecureStore + biometric; a `query/` module owns the TanStack Query client + MMKV persister; a `store/` module owns the Zustand store.

## UX & Interaction Patterns

- Bottom tab nav with 4 destinations (Home / Transactions / Stats / Menu) plus a center FAB (`+`, 56px circle, brand fill, `shadow-float`) for quick-add, positioned above the bottom nav and safe-area aware.
- Menu tab hosts household switching, Settings (language/theme/reminder time), and Logout — these are shell-level actions, not separate nav destinations.
- Biometric unlock is a dedicated screen shown on cold start and on resume-after-timeout; it gates entry to the rest of the app. Icon-tap → Face ID → straight into the app is the target flow (no re-login) for the primary "log a transaction fast" use case.
- Switching household: triggered from Menu, must show a visible loading/switching indicator while cache purge + new-household load happens, then return the user to Home.
- Use existing web icon set (`@iconify`) equivalents for nav icons to stay visually aligned with web.

## Cross-Story Dependencies

- Epic 15 is blocked by Epic 14 (project/backend foundation), specifically Story 14.4 (backend touches) — the `withAuth()` Bearer-token acceptance needed by Story 15.1 depends on that backend change landing first.
- Story 15.2 (biometric unlock) depends on Story 15.1's session storage (LargeSecureStore) being in place.
- Story 15.3 (household/month context) depends on Story 15.1/15.2 producing a valid authenticated session to fetch household membership.
- Story 15.4 (nav shell) is the outer shell that 15.2's unlock screen and 15.3's household switch UI sit within; it can be built in parallel but final wiring depends on 15.1–15.3 providing working auth/session/context.
- Epics 16, 17, 18 (core value features) are blocked on this epic completing, since they all require an authenticated session and household/month context to function.
