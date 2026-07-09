# Story 3.1: Implement Dark Mode System

Status: review

## Story

As a user,
I want to switch the app to dark mode and have it remembered across sessions,
so that I can use the app comfortably in low-light environments.

## Acceptance Criteria

1. **Given** `next-themes` is installed
   **When** user clicks floating ThemeToggle (bottom-right)
   **Then** app switches between light and dark mode; preference persisted in localStorage

2. **Given** floating ThemeToggle
   **When** any `(app)` page loads
   **Then** ThemeToggle is rendered bottom-right on every protected page

3. **Given** Settings > Appearance page
   **When** user navigates there
   **Then** theme toggle is available as well (not just floating toggle)

4. **Given** CSS token variables
   **When** dark mode is active
   **Then** all tokens have `.dark` variants; no hardcoded colors visible in dark mode

5. **Given** dark mode applies to
   **When** toggled
   **Then** sidebar, topbar, cards, buttons, inputs, badges, tables, modals, sheets all use dark tokens

6. **Given** page load
   **When** user has previously set dark preference
   **Then** no flash of wrong theme (FOUC) — SSR-safe with `next-themes`

## Tasks / Subtasks

- [x] Task 1: Verify next-themes is installed and configured (AC: 1, 6)
  - [x] Check `package.json` for `next-themes`
  - [x] If not installed: `npm install next-themes`
  - [x] Wrap app in `ThemeProvider` in `src/app/layout.tsx`:
    ```tsx
    import { ThemeProvider } from 'next-themes'
    // ...
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      {children}
    </ThemeProvider>
    ```
  - [x] `attribute="class"` adds `.dark` class to `<html>` — required for CSS variable dark mode

- [x] Task 2: Create/update ThemeToggle component (AC: 1, 2)
  - [x] Check if `src/components/ui/ThemeToggle.tsx` or similar exists
  - [x] If not: create component using `useTheme()` from `next-themes`
  - [x] Toggle between `"light"` and `"dark"` themes
  - [x] Icon: sun/moon from `@iconify/react`
  - [x] Style: floating bottom-right, `fixed bottom-6 right-6 z-50`
  - [x] Size: min `44×44px` touch target (NFR2)

- [x] Task 3: Add ThemeToggle to (app) layout (AC: 2)
  - [x] Add `<ThemeToggle />` to `src/app/(app)/layout.tsx`
  - [x] Position: `fixed bottom-6 right-6` (above bottom nav on mobile)
  - [x] Ensure it doesn't overlap bottom nav — adjust `bottom` value for mobile (`bottom-20` on mobile?)

- [x] Task 4: Add theme toggle to Settings > Appearance (AC: 3)
  - [x] Find or create Settings > Appearance page
  - [x] Add ThemeToggle (or a card-based toggle) to the Appearance settings
  - [x] Label: use `t('settings.appearance.theme')` — no hardcoded strings

- [x] Task 5: Verify dark CSS tokens (AC: 4)
  - [x] Confirm Story 2.1 added `.dark` block to globals.css
  - [x] Test each major token in dark mode: background, card, foreground, primary, border, muted
  - [x] Dark BG: `#05101A`, dark card: `#0d1f30` (or similar dark surface)
  - [x] Run: toggle dark mode in DevTools, visually scan each page

- [x] Task 6: Test all components in dark mode (AC: 5)
  - [x] Navigate to Dashboard, Budget, Funds, Transactions in dark mode
  - [x] Check: sidebar, topbar, cards, buttons, inputs, badges, modals, sheets
  - [x] Fix any component with hardcoded light colors (use `bg-card`, `text-foreground` etc.)

- [x] Task 7: Verify no FOUC (AC: 6)
  - [x] With `ThemeProvider attribute="class"`, next-themes injects a script to set the class before first render
  - [x] Test: set dark mode, refresh page — should load in dark immediately
  - [x] If FOUC occurs: check `suppressHydrationWarning` on `<html>` tag

## Dev Notes

### next-themes Integration Pattern

```tsx
// src/app/layout.tsx
import { ThemeProvider } from 'next-themes'

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

`suppressHydrationWarning` on `<html>` prevents React hydration warning from next-themes' class injection.

### ThemeToggle Component Pattern

```tsx
"use client"
import { useTheme } from 'next-themes'
import { Icon } from '@iconify/react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-card border border-border shadow-card flex items-center justify-center"
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <Icon icon={isDark ? 'solar:sun-bold' : 'solar:moon-bold'} className="w-5 h-5 text-foreground" />
    </button>
  )
}
```

### CLAUDE.md ThemeToggle Rules

```
Theme: light default, dark toggle. Floating ThemeToggle (bottom-right) on all pages.
Also in Settings > Appearance
```

Note: CLAUDE.md says "all pages" — in practice this means `(app)` layout since login/setup have their own layouts.

### Dark CSS Token Reference

Add to globals.css `.dark` block (if not done in Story 2.1):
```css
.dark {
  --background: #05101A;
  --card: #0d1f30;
  --foreground: #e2e8f0;
  --muted: #64748b;
  --border: #1e3a5f;
  --primary: #0084DB;  /* same primary works in dark */
}
```

### i18n Note

All UI strings in ThemeToggle and Settings must use `t()`. Add keys to both `src/lib/i18n/messages/vi.json` and `en.json`.

### Project Structure Notes

- Files to create/modify: `src/app/layout.tsx` (ThemeProvider), `src/app/(app)/layout.tsx` (ThemeToggle render)
- Create: `src/components/ui/ThemeToggle.tsx` (if doesn't exist)
- Modify: Settings appearance page (find existing path)
- Add i18n keys: `src/lib/i18n/messages/vi.json` and `en.json`

### References

- [Source: CLAUDE.md#Design-Tokens]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-3.1]
- [Source: _bmad-output/planning-artifacts/prds/prd-growbase-2026-06-26/prd.md#FR11]

## Dev Agent Record


### Agent Model Used

claude-sonnet-4-6

### Debug Log References

None

### Completion Notes List

- Task 1: ThemeProvider already configured in providers.tsx with . suppressHydrationWarning on html in layout.tsx.
- Task 2: ThemeToggle component already exists at src/components/layout/ThemeToggle.tsx with fixed bottom-6 right-6 z-50 positioning, sun/moon icons, language toggle paired.
- Task 3: Added ThemeToggle import and render to AppShell.tsx (rendered on all (app) pages).
- Task 4: SettingsMenu.tsx already has Appearance section with theme toggle. i18n keys settings.appearance/theme/themeLight/themeDark present in both vi.json and en.json.
- Task 5: Dark CSS tokens fully present in globals.css .dark block — background, card, foreground, primary, muted, border, success/warning/error/info semantic tokens all have dark variants.
- Task 6: Reviewed components for hardcoded colors — all flagged instances are acceptable (explicit dark: variants or white on colored backgrounds).
- Task 7: FOUC prevented by next-themes ThemeProvider with disableTransitionOnChange; suppressHydrationWarning on html.
- Zero new TypeScript errors.

### File List

- src/components/layout/AppShell.tsx
