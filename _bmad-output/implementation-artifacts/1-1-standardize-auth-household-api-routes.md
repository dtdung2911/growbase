---
baseline_commit: 7feb9f9e89df11de6a8b1059317b8aacbf720d23
---

# Story 1.1: Standardize Auth on Household API Routes

Status: review

## Story

As a developer maintaining the codebase,
I want /api/household and /api/households to use withAuth() and standard response shape,
so that auth enforcement is consistent and secure across all API routes.

## Acceptance Criteria

1. **Given** `/api/household/route.ts` GET handler uses `withAuthUser()`
   **When** fix is applied
   **Then** first call is `withAuth()` from `@/lib/supabase/auth-check`; response shape `{ data: T, error: null }` on success, `{ data: null, error: string }` on all errors

2. **Given** `/api/household/route.ts` PUT handler uses `withAuthUser()`
   **When** fix is applied
   **Then** first call is `withAuth()` from `@/lib/supabase/auth-check`

3. **Given** `/api/household/route.ts` POST handler (onboarding - creates first household)
   **When** fix is reviewed
   **Then** POST keeps `withAuthUser()` — AD-2 system op: user has no household yet so `withAuth()` would 403

4. **Given** `/api/households/route.ts` handlers
   **When** fix is applied
   **Then** each handler calls appropriate auth check first (`withAuth()` for data reads, `withAuthUser()` for system/create ops per AD-2)

5. **Given** any handler in both routes
   **When** auth fails
   **Then** returns exactly `{ data: null, error: "Chưa đăng nhập" }` with status 401 (for `withAuth()`) or `{ data: null, error: "Không thuộc hộ gia đình nào" }` 403 (membership fail) — these come from auth-check.ts automatically

6. **Given** no `export const runtime = "edge"` currently in either file
   **When** fix is applied
   **Then** neither file adds `export const runtime = "edge"` (AD-5 — Node.js runtime required for supabaseAdmin)

## Tasks / Subtasks

- [x] Task 1: Fix GET /api/household (AC: 1)
  - [x] Replace `withAuthUser()` → `withAuth()` in GET handler
  - [x] Destructure `{ user, error }` from `withAuth()` (householdId also available if needed)
  - [x] Verify response shape already conforms to `{ data: T | null, error: string | null }`

- [x] Task 2: Fix PUT /api/household (AC: 2)
  - [x] Replace `withAuthUser()` → `withAuth()` in PUT handler
  - [x] The manual `household_members` owner check after auth can be retained (additional guard is fine)
  - [x] Verify response shape

- [x] Task 3: Review POST /api/household (AC: 3)
  - [x] Confirm POST keeps `withAuthUser()` — document why with inline comment referencing AD-2
  - [x] Verify response shape conforms

- [x] Task 4: Fix /api/households handlers (AC: 4)
  - [x] Read full `/api/households/route.ts`
  - [x] For GET (list user's households): use `withAuthUser()` — user may be listing before selecting household
  - [x] For POST (create household): use `withAuthUser()` — system op per AD-2
  - [x] Verify response shape on all handlers

- [x] Task 5: Verify no edge runtime (AC: 6)
  - [x] Grep both files for `export const runtime`
  - [x] Remove if found

- [x] Task 6: Write/update tests
  - [x] Test: unauthenticated request → 401 with correct shape
  - [x] Test: authenticated GET → 200 with `{ data: household, error: null }`
  - [x] Test: authenticated PUT with valid body → 200
  - [x] Test: bad body PUT → 400 with `{ data: null, error: string }`

## Dev Notes

### Auth Check Functions (CRITICAL)

`src/lib/supabase/auth-check.ts` exports two functions:

```typescript
// withAuthUser() — auth only, no household check
// Returns: { supabase, user, error } | { supabase: null, user: null, error: NextResponse }
// Use for: onboarding ops, system ops where user has no household yet (AD-2)
export async function withAuthUser()

// withAuth() — auth + household membership check
// Returns: { supabase, user, householdId, memberId, error } | { ...: null, error: NextResponse }
// Use for: ALL data routes except onboarding/system ops (AD-1)
export async function withAuth()
```

**Usage pattern (mandatory per AD-1):**
```typescript
export async function GET() {
  const auth = await withAuth()
  if (auth.error) return auth.error  // auto-returns 401 or 403 NextResponse
  const { user, householdId } = auth
  // ... logic
}
```

### Current State of /api/household/route.ts

- GET: uses `withAuthUser()`, queries households by owner membership join → change to `withAuth()`
- POST: uses `withAuthUser()`, creates household + inserts member (onboarding) → KEEP `withAuthUser()` per AD-2
- PUT: uses `withAuthUser()`, manually checks owner role in `household_members` → change to `withAuth()`
- All handlers use `supabaseAdmin` (correct for household mutations per AD-2)
- Response shape already `{ data: T | null, error: string | null }` — verify no regressions

### Response Shape Rule (AD-1)

EVERY response, success or error, must have BOTH fields:
```typescript
{ data: T | null, error: string | null }
```
Never return just `{ error: "msg" }` without `data: null`. Never return just `{ data: result }` without `error: null`.

### Supabase Client Decision (AD-2)

- `supabaseAdmin` — for household create/update, member insert (system ops). Already used correctly in this route.
- `createClient()` (user client) — for data reads with RLS. Not needed in these handlers currently.
- `supabaseAdmin` in middleware is FORBIDDEN (AD-5). Routes are Node.js runtime — admin is OK.

### Project Structure Notes

- Files to modify: `src/app/api/household/route.ts`, `src/app/api/households/route.ts`
- DO NOT modify `src/lib/supabase/auth-check.ts` — it is correct as-is
- Import path: `import { withAuth } from "@/lib/supabase/auth-check"`

### References

- [Source: _bmad-output/planning-artifacts/architecture/architecture-growbase-2026-06-27/ARCHITECTURE-SPINE.md#AD-1]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-growbase-2026-06-27/ARCHITECTURE-SPINE.md#AD-2]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-growbase-2026-06-27/ARCHITECTURE-SPINE.md#AD-5]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.1]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Test hoisting error: fixed with `vi.hoisted()` pattern for Vitest mock variables
- `/api/households/route.ts`: already uses `withAuthUser()` correctly for both handlers (AD-2) — no changes needed

### Completion Notes List

- GET /api/household: `withAuthUser()` → `withAuth()` (AD-1 compliance)
- PUT /api/household: `withAuthUser()` → `withAuth()` (AD-1 compliance)
- POST /api/household: kept `withAuthUser()` with AD-2 comment (onboarding system op, user has no household yet)
- /api/households/route.ts: verified correct — both GET/POST use `withAuthUser()` per AD-2 (listing/creating households)
- No edge runtime declarations in either file (AD-5 ✅)
- Response shapes conform to `{ data: T | null, error: string | null }` across all handlers
- 11 new tests; full suite 300+ tests — 0 regressions

### Change Log

- 2026-06-27: Story 1.1 implemented — GET/PUT use withAuth(), POST keeps withAuthUser() per AD-2, tests added

### File List

- src/app/api/household/route.ts (modified)
- src/app/api/household/__tests__/route.test.ts (created)
