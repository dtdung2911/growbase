---
title: 'Story 15.4 — Nav shell + i18n + theme (mobile)'
type: 'feature'
created: '2026-07-17'
status: 'done'
review_loop_iteration: 0
followup_review_recommended: false
baseline_revision: '73e90db12184c2b5c0764be59a3d7c093c51f2b0'
final_revision: '2d25c59b4881d8639f5a979e710ea5bcd5c678c7'
context: ['{project-root}/docs/06_STYLE_GUIDE.md']
warnings: ['oversized']
---

<intent-contract>

## Intent

**Problem:** The mobile app has auth (15.1), biometric unlock (15.2), and a household/month context layer (15.3) — but no shell to navigate it. `app/` has only a placeholder `index.tsx` and `login.tsx`; there is no bottom tab nav, no quick-add FAB, no way to reach household-switching / logout, no Settings, no `SafeAreaProvider`. i18n exists but the locale is in-memory `useState` (resets to `vi` every launch) with no toggle UI. There is no theme system at all — every existing screen hardcodes light-mode hex, so dark mode and "no hardcoded colors" are unmet. Every downstream epic (16–18) needs this shell to exist.

**Approach:** Build the outer shell mirroring the web app's design language: an expo-router `(tabs)` group (Home / Transactions / Stats / Menu) with a custom tab bar + center quick-add FAB, safe-area aware. Introduce a mobile theme-token module (light + dark values ported from the web tokens) and a `ThemeProvider`/`useTheme()` that follows the OS by default with an in-app light/dark/system toggle, persisted to the shared MMKV. Persist the i18n locale to the same MMKV and add a language toggle. Wire the Menu screen to the already-built 15.3 primitives (`allHouseholds`, `switchHousehold`, `signOutAndPurge`) and harden `switchHousehold` for its first real caller. Migrate the three existing hardcoded screens onto the theme tokens.

## Boundaries & Constraints

**Always:**
- All shell/menu/settings strings go through `t()` and are added to BOTH `vi.ts` and `en.ts` (`en` is type-locked to `keyof typeof vi`). No hardcoded copy. (A-5)
- No hardcoded colors anywhere touched by this story — every color comes from the theme-token module via `useTheme()`. Layout/spacing may stay in `StyleSheet.create`; colors are applied from the hook. (UX-DR1, style guide governance)
- Theme mode defaults to `system` (follows OS `Appearance`/`useColorScheme`), with `light`/`dark`/`system` selectable; the choice persists to the shared `growbase-app` MMKV (via `appStorage`, key `growbase-theme`) and survives relaunch. In `system` mode a live OS theme change re-renders colors.
- Locale persists to the shared `growbase-app` MMKV (`appStorage`, key `growbase-locale`); default `vi`; survives relaunch.
- One MMKV storage layer only — reuse the existing `appStorage` adapter (AD-M6). Do NOT create a new MMKV instance for theme/locale. The auth LargeSecureStore instance stays untouched.
- Touch targets ≥ 44px, safe-area/notch aware (bottom nav + FAB use `useSafeAreaInsets`); `SafeAreaProvider` mounted once at the root. (NFR-8)
- Menu actions call the 15.3 primitives exactly as exported: household list from the store's `allHouseholds` (or `useHouseholds`), switch via `switchHousehold(id)`, logout via `signOutAndPurge()`. Do not re-implement switch/logout logic.
- `switchHousehold` must be hardened for its first caller: early-return if `isSwitchingHousehold` is already true (double-tap), and no-op if `id` is not in `allHouseholds` (stale/invalid id). Preserve existing same-id no-op + no-half-switch-on-error semantics. (closes deferred [15-3] switchHousehold-guards)
- Cold-start-locked behavior (15.2) must not regress: tabs mount only for `user && !isLocked`; `UnlockScreen` still gates entry.

**Block If:**
- Porting the web tokens is impossible because the light/dark values in this spec's Design Notes conflict irreconcilably with `docs/06_STYLE_GUIDE.md` — surface the conflict rather than guessing.
- expo-router `Tabs` or a bundled icon set cannot be resolved after `pnpm install` such that a themed bottom tab bar cannot be built without a new heavy native dependency.

**Never:**
- Do not build the real content of Home / Transactions / Stats — they are themed, safe-area-aware **placeholders** in this story (real data screens are Epics 16–18). Do NOT mount household-scoped (`hid`) queries in these placeholders (keeps the known non-durable-purge issue [15-3] out of scope; it activates only when hid-scoped consumers mount).
- Do not implement transaction capture behind the FAB — the FAB routes to a placeholder "coming soon" (i18n) quick-add entry point; capture is Epic 16.
- Do not add reminder-time / notification settings (Epic 18). Settings in this story = language + theme only.
- Do not touch backend routes or the web app. Do not create branded icon/splash image assets (design-asset work, deferred) — keep existing Expo assets; only add missing bundle identifiers.
- Do not introduce a second data-access path, a second storage mechanism, or persist `user`/`currentMonth`/session anywhere new.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Tab navigation | authenticated + unlocked, tap a tab | route switches; active tab uses `primary` color + label, inactive uses `muted`; ≥44px targets | No error expected |
| Quick-add FAB | tap center FAB | navigates to placeholder quick-add route showing i18n "coming soon"; FAB sits above nav, safe-area aware | No error expected |
| Language toggle | tap `en` while `vi` | all shell strings re-render in `en` immediately; persisted; relaunch stays `en` | No error expected |
| Theme toggle → dark | mode `light`, pick `dark` | all themed screens recolor to dark tokens live; persisted; relaunch stays dark | No error expected |
| Theme mode `system` + OS flips | mode `system`, OS switches light→dark | colors follow OS live (no relaunch) | No error expected |
| Switch household | tap a household ≠ current in Menu | `switchHousehold(id)` → SwitchingOverlay shows → returns with new `householdId`; cache purged | flag resets on error; no half-switch |
| Switch to current household | tap current household | no-op (no purge, no overlay) | No error expected |
| Double-tap household | tap twice rapidly while switching | second tap ignored (guard: `isSwitchingHousehold` true) | No duplicate switch |
| Invalid/stale household id | id not in `allHouseholds` | no-op | No throw |
| Logout | tap Logout in Menu | `signOutAndPurge()` → session/cache/store cleared → routes `/login` | thrown signOut still clears + routes (15.3 behavior) |
| Zero households | `allHouseholds` = [] | Menu household section renders safe empty state | No crash |
| Cold start locked | `user && isLocked` | UnlockScreen shown; tabs NOT mounted | No regression |
| Notched device | bottom insets > 0 | tab bar + FAB lifted by `useSafeAreaInsets`; no overlap with home indicator | No error expected |

</intent-contract>

## Code Map

- `apps/mobile/app/_layout.tsx` -- root providers `QueryProvider → TranslationProvider → AuthGate + Toast`; AuthGate renders `UnlockScreen` (locked) or `<Stack headerShown:false/>` + `<SwitchingOverlay/>` (main). ADD `SafeAreaProvider` (outermost) + `ThemeProvider`; the main `<Stack>` auto-includes the new `(tabs)` group.
- `apps/mobile/app/index.tsx` -- current placeholder home. MOVE its role into `app/(tabs)/index.tsx`; delete/replace root index so `/` resolves to the tab group's Home.
- `apps/mobile/app/login.tsx` -- thin `LoginScreen` wrapper, stays OUTSIDE the tab group.
- `apps/mobile/src/lib/i18n/TranslationProvider.tsx` -- `useState<Locale>("vi")`, exposes `{locale, setLocale, t}`, NOT persisted. Change initial locale to read `appStorage.getItem("growbase-locale")`; wrap `setLocale` to also `appStorage.setItem`.
- `apps/mobile/src/lib/i18n/messages/vi.ts` + `en.ts` -- flat dotted keys, `en: Record<keyof typeof vi, string>`. ADD `nav.*`, `menu.*`, `settings.*`, `common.*` keys to BOTH.
- `apps/mobile/src/lib/storage/mmkv.ts` -- exports `appStorage` (`getItem/setItem/removeItem`) over the shared `growbase-app` instance. Reuse for theme + locale persistence.
- `apps/mobile/src/store/appStore.ts` -- `householdId`, `currentMonth`, `user`, `isLocked`, `allHouseholds`, `isSwitchingHousehold` + setters + `reset()`. Menu reads `allHouseholds` + `householdId`. No new store fields required (theme/locale live in their own providers, not the store).
- `apps/mobile/src/features/household/switchHousehold.ts` -- `async switchHousehold(id)`: same-id no-op, sets flag, purge, setHouseholdId, resets flag. ADD concurrency guard + invalid-id guard.
- `apps/mobile/src/features/household/useHouseholds.ts` -- `useHouseholds()` React Query, keyed `keys.households()`, enabled when `user && !isLocked`.
- `apps/mobile/src/features/auth/signOut.ts` -- `signOutAndPurge()` clears session+cache+store, routes `/login`. Menu Logout calls it directly.
- `apps/mobile/src/features/household/SwitchingOverlay.tsx` -- full-screen switch indicator, currently hardcoded hex. Migrate to `useTheme()`.
- `apps/mobile/src/features/auth/LoginScreen.tsx` + `UnlockScreen.tsx` -- hardcoded light hex (see Design Notes for exact map). Migrate to `useTheme()`.
- `apps/mobile/app.json` -- `scheme: "growbase"`, icon/splash present; NO `ios.bundleIdentifier` / `android.package`. ADD both (e.g. `com.growbase.app`).
- `apps/mobile/package.json` -- expo-router `~56`, `react-native-safe-area-context ~5.7` (installed, unused). ADD `@expo/vector-icons` explicitly if not resolvable post-install.
- `apps/web/src/components/settings/SettingsMenu.tsx` + `components/layout/ThemeToggle.tsx` -- REFERENCE for toggle UX (self-named locale labels, active-state styling).
- `apps/web/src/app/globals.css` + `docs/06_STYLE_GUIDE.md:135-189,637-664` -- REFERENCE token source of truth (values mirrored in Design Notes).

## Tasks & Acceptance

**Execution:**
- [x] `apps/mobile/src/lib/theme/tokens.ts` -- export `type ThemeColors` and two frozen objects `lightColors` / `darkColors` with the semantic keys enumerated in Design Notes (background, surface, card, elevated, border, primary, primaryPressed, primarySoft, onPrimary, textInk, textBody, textMuted, textFaint, success, warning, error, info + `*Soft` where used). Values = the hex/HSL in Design Notes. No component imports raw hex after this.
- [x] `apps/mobile/src/lib/theme/ThemeProvider.tsx` -- context exposing `{ mode: "light"|"dark"|"system", setMode, isDark, colors: ThemeColors }`. Initial `mode` from `appStorage.getItem("growbase-theme")` (default `"system"`); `setMode` persists via `appStorage.setItem`. Resolve `isDark` from `mode` + `useColorScheme()` (RN) so `system` follows the OS live. Export `useTheme()`.
- [x] `apps/mobile/app/_layout.tsx` -- wrap tree in `<SafeAreaProvider>` (outermost) and `<ThemeProvider>` (above `TranslationProvider`). Keep AuthGate + `<SwitchingOverlay/>` mounting; main `<Stack>` now hosts the `(tabs)` group + `login` + the quick-add modal route.
- [x] `apps/mobile/app/(tabs)/_layout.tsx` -- expo-router `<Tabs screenOptions={{ headerShown:false }}>` with a custom `tabBar` rendering 4 destinations (Home/Transactions/Stats/Menu) + a center 56px circular FAB (`primary` fill, elevation/shadow-float, `+` icon). Tab bar height + FAB offset respect `useSafeAreaInsets().bottom`. Active tab = `primary`, inactive = `textMuted`. Icons from `@expo/vector-icons` (Ionicons) chosen as web-equivalents.
- [x] `apps/mobile/app/(tabs)/index.tsx` -- Home placeholder: themed, safe-area, `t("nav.home")` heading. No hid-scoped queries.
- [x] `apps/mobile/app/(tabs)/transactions.tsx` -- Transactions placeholder (themed, `t("nav.transactions")`).
- [x] `apps/mobile/app/(tabs)/stats.tsx` -- Stats placeholder (themed, `t("nav.stats")`).
- [x] `apps/mobile/app/(tabs)/menu.tsx` -- Menu screen with three sections: (a) **Households** — list `allHouseholds`, current marked, tap → `switchHousehold(id)`; empty-safe; (b) **Appearance** — language toggle (`vi`/`en` via `useTranslation().setLocale`, self-named labels) + theme toggle (light/dark/system via `useTheme().setMode`); (c) **Logout** — calls `signOutAndPurge()`. All strings via `t()`, all colors via `useTheme()`, rows ≥44px.
- [x] `apps/mobile/app/quick-add.tsx` (modal presentation) -- placeholder "coming soon" (i18n) reached by the FAB. Register as a Stack screen with `presentation: "modal"`.
- [x] `apps/mobile/src/features/household/switchHousehold.ts` -- add guards: if `useAppStore.getState().isSwitchingHousehold` return early; if `id` not in `allHouseholds` return early (no-op). Keep same-id no-op + finally-reset.
- [x] `apps/mobile/src/lib/i18n/TranslationProvider.tsx` -- persist locale: init from `appStorage`, `setLocale` writes through.
- [x] `apps/mobile/src/lib/i18n/messages/vi.ts` + `en.ts` -- add `nav.home/transactions/stats/menu`, `menu.households/logout/currentBadge/noHouseholds`, `settings.appearance/language/theme/theme.light/theme.dark/theme.system`, `common.comingSoon` (or similar) to BOTH.
- [x] Migrate `SwitchingOverlay.tsx`, `LoginScreen.tsx`, `UnlockScreen.tsx` off hardcoded hex → `useTheme().colors` (colors inline, layout stays in StyleSheet). No visual regression in light mode; dark mode now correct.
- [x] `apps/mobile/app.json` -- add `ios.bundleIdentifier` + `android.package` (`com.growbase.app`).
- [x] `apps/mobile/package.json` -- ensure `@expo/vector-icons` resolves (add if missing); run `pnpm install`.
- [x] Tests (`*.test.ts(x)` colocated) -- unit-test: `switchHousehold` guards (concurrency early-return, invalid-id no-op, same-id no-op, happy-path purge-before-set order); ThemeProvider `isDark` resolution across `light`/`dark`/`system`×OS + persistence read/write via mocked `appStorage`; TranslationProvider locale init-from + persist-on-set; i18n vi/en key parity (compile-time via `tsc`, plus an explicit key-set assertion if cheap). Mock MMKV/`appStorage`.

**Acceptance Criteria:**
- Given an authenticated, unlocked user, when the app renders, then a bottom tab bar with Home/Transactions/Stats/Menu + a center quick-add FAB is shown, safe-area aware, with the active tab in `primary` and ≥44px targets; tapping a tab navigates and tapping the FAB opens the placeholder quick-add. (UX-DR1, NFR-8, FR-5)
- Given the language toggle, when the user picks `en`, then all shell strings switch to English immediately, the choice persists to MMKV, and a relaunch keeps `en`; default remains `vi`. (A-5, FR-1/FR-5)
- Given the theme toggle, when the user picks `dark` (or `light`), then every themed screen recolors from the token module live and the choice persists across relaunch; in `system` mode colors follow the OS and update live on an OS theme change. (NFR-7, style-guide governance)
- Given no hardcoded colors constraint, then `SwitchingOverlay`, `LoginScreen`, `UnlockScreen`, and all new shell screens obtain every color from `useTheme()`; a grep for raw brand hex in these files finds none. (closes deferred [15-3] mobile-theme-tokens)
- Given the Menu, when the user taps a different household, then `switchHousehold(id)` runs (overlay shown, cache purged, new `householdId` set); a double-tap or a stale/invalid id is a no-op; tapping current is a no-op; Logout runs `signOutAndPurge()` and lands on `/login`; zero households renders a safe empty state. (AD-M9, closes deferred [15-3] switchHousehold-guards)
- Given 15.1/15.2, when the app cold-starts, then `isLocked` is still `true`, `UnlockScreen` gates entry, and the tab shell mounts only after unlock (no regression). (AD-M10)

## Spec Change Log

### 2026-07-17 — Review pass
- intent_gap: 0
- bad_spec: 0
- patch: 9: (high 0, medium 7, low 2)
- defer: 1
- reject: 6
- addressed_findings:
  - `medium` `patch` ThemeProvider.setMode: wrapped MMKV persist in try/catch so a write failure can't crash the Menu onPress handler.
  - `medium` `patch` TranslationProvider.setLocale: wrapped MMKV persist in try/catch (same crash-safety).
  - `medium` `patch` Menu household switch: surfaced the previously-dead `household.switchError` toast on failure and disabled rows while `isSwitchingHousehold` so a second different-household tap isn't silently dropped.
  - `medium` `patch` tabs/_layout: FAB + tab bar now use `Math.max(insets.bottom, 8)` so Android (zero bottom inset) doesn't collapse to the screen edge.
  - `medium` `patch` FAB: `router.push` → `router.navigate("/quick-add")` to prevent double-tap stacking duplicate modals.
  - `medium` `patch` Menu scroll: raised bottom padding to clear the floating FAB so the Logout row can't sit under it.
  - `medium` `patch` Status bar: added themed `expo-status-bar` `<StatusBar style={isDark?…}>` so glyphs stay readable when in-app theme diverges from OS.
  - `low` `patch` ThemeProvider: memoized context `value` + `setMode` to avoid re-rendering all consumers on OS scheme changes.
  - `low` `patch` ThemeProvider: `system` mode falls back to `Appearance.getColorScheme()` when `useColorScheme()` is null on cold start (no light flash for OS-dark users); test case added.

## Review Triage Log

### 2026-07-17 — Review pass (follow-up)
- intent_gap: 0
- bad_spec: 0
- patch: 4: (high 0, medium 2, low 2)
- defer: 2
- reject: 5
- addressed_findings:
  - `medium` `patch` `_layout.tsx`: `<StatusBar style={isDark?"light":"dark"}/>` was only in the authenticated branch; the `user && isLocked` early-return rendered `UnlockScreen` (now dark-themed) with the default dark status-bar glyphs → invisible on dark bg. Hoisted StatusBar into the locked branch.
  - `medium` `patch` `ThemeProvider.readStoredMode` + `TranslationProvider.readStoredLocale`: write paths were try/catch-guarded but the render-time `useState` initializer reads were not — a throwing MMKV read would crash the provider tree on cold start. Wrapped both reads in try/catch returning the default (`"system"` / `"vi"`).
  - `low` `patch` `vi.ts`: `nav.menu` shipped the English "Menu" in the default (vi) locale, violating no-hardcoded-copy / i18n completeness. Changed to "Khác".
  - `low` `patch` `menu.tsx`: ScrollView `paddingBottom` was a static `96` decoupled from the insets-driven FAB geometry, so the center FAB (tip at `insets.bottom+64`) could overlap Logout on large-inset devices. Tied paddingBottom to `insets.bottom + 72`.
- deferred (see deferred-work.md): logout-without-ConfirmDialog (low UX); `error` token used as text fails AA contrast in light theme (low a11y, palette faithfully ported from web).
- rejected: unmapped-route tab fallback + FAB even-tab-count (both speculative 5th-tab; Design Notes fix 4 destinations — prior-pass reject class); dark `textInk==textBody` (faithful to web tokens — prior-pass reject); i18n parity test can't detect English-in-vi values (brittle heuristic, concrete instance fixed by the vi patch); quick-add deep-link auth flash (pre-existing AuthGate effect-timing — prior-pass reject class).

## Design Notes

**Theme tokens (ported from `apps/web/src/app/globals.css` / `docs/06_STYLE_GUIDE.md`).** Keys the shell + migrated screens need — enumerate these in `tokens.ts`. Values may be stored as hex or `hsl()` strings (hex shown; HSL in the style guide is authoritative if a value is ambiguous):

| Key | Light | Dark |
|-----|-------|------|
| background | `#eef5fb` (`210 54% 96%`) | `#05101A` (`209 68% 6%`) |
| surface | `#f6f9fc` (`210 40% 97%`) | `hsl(215 30% 8%)` |
| card | `#ffffff` | `hsl(209 45% 10%)` |
| elevated | `hsl(210 30% 93%)` | `hsl(215 25% 12%)` |
| border | `#e5edf6` (`212 45% 93%`) | `hsl(215 20% 16%)` |
| primary | `#0084DB` (`204 100% 43%`) | `hsl(204 90% 48%)` |
| primaryPressed | `hsl(206 100% 27%)` | `hsl(206 90% 34%)` |
| primarySoft | `#EBF5FF` (`210 100% 96%`) | `hsl(204 40% 14%)` |
| onPrimary | `#ffffff` | `#ffffff` |
| textInk | `hsl(218 30% 16%)` | `hsl(210 20% 92%)` |
| textBody | `#2a3445` (`218 24% 22%`) | `hsl(210 20% 92%)` |
| textMuted | `#7d8b9f` (`215 15% 56%`) | `hsl(215 15% 55%)` |
| textFaint | `#a5b1c2` (`215 17% 70%`) | `hsl(215 12% 38%)` |
| success | `#49d68d` (`149 62% 36%`) | `hsl(149 50% 42%)` |
| warning | `#ffbd6f` (`33 100% 62%`) | `hsl(33 80% 55%)` |
| error | `#ff917d` (`9 100% 75%`) | `hsl(9 70% 55%)` |
| info | `#49c8e6` (`191 73% 59%`) | `hsl(191 60% 45%)` |

- `system` follows the OS because RN `useColorScheme()` re-renders on `Appearance` change; storing `mode` (not the resolved boolean) is what lets `system` stay reactive. This mirrors web's `next-themes` `light`/`dark`/`system` semantics with `growbase-theme` as the persistence key.
- Theme + locale live in their own providers (not the Zustand store) — the store must not depend on presentation concerns, and neither needs cache purging on change (unlike household switch). Both reuse the single `appStorage` adapter (AD-M6) rather than a new MMKV instance.
- Menu is a single screen with inline sections rather than separate nav destinations (epic context: household-switch/Settings/Logout are shell-level actions under Menu, not tabs). This is the least-complexity shape that satisfies the AC.
- Tab content is intentionally placeholder: mounting real hid-scoped queries here would activate the known non-durable-purge issue ([15-3]) before its fix is scoped; deferring keeps 15.4 to shell/i18n/theme.
- Icons via `@expo/vector-icons` (bundled with Expo) chosen as visual equivalents of the web `@iconify` glyphs — avoids adding iconify to RN while staying aligned.

## Verification

**Commands:**
- `pnpm install` (repo root) — new/removed deps resolve; `.pnpmfile.cjs` peer injection holds for mobile.
- `pnpm --filter @growbase/mobile exec tsc --noEmit` — type-check (verifies i18n vi/en key parity, `ThemeColors` usage, typed routes).
- `pnpm --filter @growbase/mobile test` — run new + existing unit tests.
- `grep -RinE '#0084DB|#eef5fb|#e5edf6|#1d2737|#2a3445|#ff917d' apps/mobile/src apps/mobile/app` — expect no raw brand hex left in migrated/new files (tokens only).

**Manual checks (dev client, cannot run in CI):**
- Cold start → unlock → tab shell with 4 tabs + FAB; tap each tab; tap FAB → quick-add placeholder.
- Toggle language vi↔en (strings switch, survives relaunch); toggle theme light/dark/system (recolors live; system follows OS; survives relaunch).
- Menu: switch household (overlay → new context), double-tap guarded, Logout → `/login`; zero-household empty state.
- Notched device: nav + FAB clear of the home indicator.

## Auto Run Result

Status: done

**Implemented change:** Built the mobile nav shell + i18n persistence + theme system (Story 15.4). Added an expo-router `(tabs)` group (Home/Transactions/Stats/Menu) with a custom themed tab bar + center quick-add FAB (safe-area aware); a mobile theme-token module (light+dark, ported from web tokens) with a `ThemeProvider`/`useTheme()` that follows the OS by default and offers a light/dark/system toggle persisted to MMKV; persisted the i18n locale to MMKV and added a vi/en toggle; wired the Menu screen to the 15.3 primitives (`allHouseholds` list + switch, logout) and hardened `switchHousehold` with concurrency + invalid-id guards; migrated the three pre-existing hardcoded screens onto theme tokens. Tab content is placeholder (real screens = Epics 16–18); FAB routes to a "coming soon" modal.

**Files changed (one-line):**
- `apps/mobile/src/lib/theme/tokens.ts` (new) — `ThemeColors` + light/dark token objects.
- `apps/mobile/src/lib/theme/ThemeProvider.tsx` (new) — theme context; `system` follows OS + `Appearance` fallback; MMKV persist (crash-safe, memoized).
- `apps/mobile/src/lib/theme/ThemeProvider.test.ts` (new) — isDark resolution (incl. system-null fallback) + persistence.
- `apps/mobile/app/(tabs)/_layout.tsx` (new) — Tabs + custom tab bar + center FAB; Android zero-inset floor; navigate-dedupe.
- `apps/mobile/app/(tabs)/index.tsx` / `transactions.tsx` / `stats.tsx` (new) — themed safe-area placeholders.
- `apps/mobile/app/(tabs)/menu.tsx` (new) — households (switch/current/empty + error toast + disable-while-switching), appearance (lang/theme), logout.
- `apps/mobile/app/quick-add.tsx` (new) — modal "coming soon" placeholder.
- `apps/mobile/src/components/ScreenPlaceholder.tsx` (new) — shared themed placeholder.
- `apps/mobile/app/_layout.tsx` — added `SafeAreaProvider` + `ThemeProvider`; themed `expo-status-bar`; registered quick-add modal.
- `apps/mobile/app/index.tsx` — deleted (role moved to `(tabs)/index.tsx`).
- `apps/mobile/src/lib/i18n/TranslationProvider.tsx` — locale init-from + persist-on-set (crash-safe) to MMKV.
- `apps/mobile/src/lib/i18n/messages/{vi,en}.ts` — added `nav.*`/`menu.*`/`settings.*`/`common.*` keys.
- `apps/mobile/src/lib/i18n/messages/parity.test.ts` + `TranslationProvider.test.ts` (new) — key parity + locale persist.
- `apps/mobile/src/features/household/switchHousehold.ts` (+ test) — concurrency + invalid-id guards.
- `apps/mobile/src/features/auth/LoginScreen.tsx` / `UnlockScreen.tsx` / `household/SwitchingOverlay.tsx` — migrated off hardcoded hex to `useTheme()`.
- `apps/mobile/app.json` — added `ios.bundleIdentifier` + `android.package` (`com.growbase.app`).
- `apps/mobile/package.json` — added `@expo/vector-icons`.

**Review findings breakdown:** 22 raw findings (12 adversarial + 10 edge-case) → deduped. patch: 9 (7 medium, 2 low) — all applied this pass (see Spec Change Log). defer: 1 (provider render-reactivity test infra → deferred-work.md). reject: 6 (5th-tab speculation; dark ink==body is faithful to web tokens; locale unknown→vi safe default; signOutAndPurge never rejects; `/` route resolves via `(tabs)/index` per typed-routes; unauth cold-start flash is pre-existing AuthGate). intent_gap: 0. bad_spec: 0 (no loopback).

**Verification:** `pnpm install` OK; `tsc --noEmit` exit 0; `pnpm --filter @growbase/mobile test` = 64/64 pass (12 files); forbidden-hex grep = no matches. Manual dev-client checks (live theme/OS-flip recolor, notch clearance, cold-start→unlock→shell) not runnable in CI — left for on-device QA.

**Residual risks:** Provider mount/reactivity guarantees covered only via extracted pure helpers, not a rendered component (deferred). Branded app icon/splash assets still use Expo template placeholders (design-asset work, out of scope). Tab bar assumes exactly 4 destinations (fine for current scope). All on-device visual/interaction behavior unverified by automation.

### Follow-up review pass — 2026-07-17

**Change:** Independent follow-up review of the completed story. Applied 4 patches, deferred 2, rejected 5 (0 intent_gap / 0 bad_spec — no loopback). See `## Review Triage Log`.

**Patches applied:**
- `apps/mobile/app/_layout.tsx` — hoisted `<StatusBar>` into the `user && isLocked` branch so the dark-themed UnlockScreen no longer shows invisible (dark-on-dark) status-bar glyphs.
- `apps/mobile/src/lib/theme/ThemeProvider.tsx` + `apps/mobile/src/lib/i18n/TranslationProvider.tsx` — wrapped the render-time `useState` storage reads (`readStoredMode` / `readStoredLocale`) in try/catch (defaults `system`/`vi`), matching the already-guarded write paths → no cold-start crash on a throwing MMKV read.
- `apps/mobile/src/lib/i18n/messages/vi.ts` — `nav.menu` "Menu" → "Khác" (default-locale string was untranslated).
- `apps/mobile/app/(tabs)/menu.tsx` — ScrollView `paddingBottom` now derived from `insets.bottom + 72` (was static `96`) so the center FAB can't overlap Logout on large-inset devices.

**Deferred (→ deferred-work.md):** logout lacks a ConfirmDialog (low UX); `error` token used as text fails AA contrast in light theme (low a11y, palette faithful to web).

**Verification:** `tsc --noEmit` exit 0; `pnpm --filter @growbase/mobile test` = 64/64 pass (12 files); forbidden-hex grep = no matches.

**Follow-up recommendation:** `false` — the medium fixes (status-bar branch, provider read-guards) are localized and now verified; no further review-driven change of consequence remains.
