---
baseline_commit: 7feb9f9e89df11de6a8b1059317b8aacbf720d23
---

# Story 1.2: Add Household Membership Double Guard to API Routes

Status: review

## Story

As a household member,
I want the API to verify I belong to a household before it serves me that household's data,
so that I cannot access another household's data by spoofing a householdId.

## Acceptance Criteria

1. **Given** a request to any route that accepts a `householdId` query param or body field
   **When** `withAuth()` succeeds
   **Then** route queries `household_members` to verify `user.id` is an active member of that specific `householdId`

2. **Given** the membership check result
   **When** `user.id` is NOT an active member of the requested `householdId`
   **Then** route returns 403 `{ data: null, error: "Forbidden" }`

3. **Given** both auth and membership checks pass
   **When** data operation executes
   **Then** only data belonging to the verified `householdId` is returned

4. **Given** routes `/api/household`, `/api/households`, and all other household-scoped routes
   **When** audited
   **Then** every route accepting a `householdId` parameter has the double guard present

## Tasks / Subtasks

- [x] Task 1: Audit all API routes for householdId parameters (AC: 4)
  - [x] `find src/app/api -name "route.ts"` — list all routes
  - [x] For each route: check if it reads `householdId` from query params, request body, or path params
  - [x] Document which routes need the guard vs which don't (routes without householdId param are exempt)

- [x] Task 2: Add double guard helper or inline (AC: 1, 2)
  - [x] Option A (recommended): Create `verifyHouseholdMember(supabase, userId, householdId)` helper in `src/lib/supabase/auth-check.ts` returning `{ ok: boolean, error?: NextResponse }`
  - [x] Option B: Inline the membership check in each route
  - [x] Guard pattern: query `household_members` WHERE `user_id = userId AND household_id = householdId AND is_active = true`

- [x] Task 3: Apply guard to each route needing it (AC: 1, 2, 3)
  - [x] After `withAuth()` succeeds, before data operation, run the membership verification
  - [x] Return 403 immediately if guard fails
  - [x] Ensure data operations use only the verified `householdId`

- [x] Task 4: Write tests (AC: 1, 2, 3)
  - [x] Test: valid user + valid householdId → 200 with data
  - [x] Test: valid user + WRONG householdId (belongs to another household) → 403
  - [x] Test: unauthenticated → 401 (from withAuth())

## Dev Notes

### The Two-Layer Guard Pattern (AD-6)

```typescript
export async function GET(request: Request) {
  // Layer 1: Auth + default household membership
  const auth = await withAuth()
  if (auth.error) return auth.error
  const { user, supabase } = auth

  // Layer 2: Verify user belongs to the SPECIFIC householdId being requested
  const householdId = new URL(request.url).searchParams.get("householdId")
  if (!householdId) {
    return NextResponse.json({ data: null, error: "householdId required" }, { status: 400 })
  }

  const { data: member } = await supabase
    .from("household_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("household_id", householdId)
    .eq("is_active", true)
    .maybeSingle()

  if (!member) {
    return NextResponse.json({ data: null, error: "Forbidden" }, { status: 403 })
  }

  // Execute data operation using verified householdId
}
```

### Why Two Layers?

`withAuth()` only verifies the user has SOME active household membership (their default household). It does NOT verify they belong to the SPECIFIC household they're requesting data from. AD-6 closes this gap.

**Attack vector prevented:** User A is member of Household X. User A sends request with `householdId=Y` (Household Y belongs to User B). Without the double guard, if `withAuth()` passes, User A can read User B's data.

### Note on withAuth() householdId

`withAuth()` returns `householdId` from the first active membership. This is the user's "default" household. For routes where the client always sends their own householdId, you can compare `auth.householdId === requestedHouseholdId` as a fast path — but a fresh DB query is safer and handles multi-household scenarios.

### Routes Likely Needing the Guard

Based on codebase structure, household-scoped routes typically include:
- `/api/transactions` — householdId query param
- `/api/budget` — householdId
- `/api/funds` — householdId
- `/api/categories` — householdId
- Any route that reads or writes data filtered by household

Routes that DON'T need the guard (they operate on the authenticated user's own profile):
- `/api/household` POST — creates a household (no householdId to verify yet)
- `/api/auth/*` — session management

### Supabase Client Choice for Guard Query

Use the **user client** (`auth.supabase` from `withAuth()`) for the membership check — RLS ensures users can only see their own `household_members` rows. Do NOT use `supabaseAdmin` for the guard query.

### Project Structure Notes

- If creating a helper: add to `src/lib/supabase/auth-check.ts`
- Do NOT add `export const runtime = "edge"` to any route (AD-5)
- All strings/error messages in TypeScript, not hardcoded in component layer

### References

- [Source: _bmad-output/planning-artifacts/architecture/architecture-growbase-2026-06-27/ARCHITECTURE-SPINE.md#AD-6]
- [Source: _bmad-output/planning-artifacts/architecture/architecture-growbase-2026-06-27/ARCHITECTURE-SPINE.md#AD-1]
- [Source: _bmad-output/planning-artifacts/epics.md#Story-1.2]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Audit finding: 48/50 routes use `auth.householdId` (server-derived from DB, cannot be spoofed) → already safe, no changes needed
- `household/invite/route.ts`: was using `createClient()` + manual auth, missing `is_active=true` on owner check → fixed with `withAuth()` + `verifyHouseholdMember()`
- `onboarding/complete/route.ts`: AD-2 system op, RPC `complete_onboarding` enforces access internally → exempt, no change
- `verifyHouseholdMember()` uses discriminated union return type `{ ok: true } | { ok: false; error: NextResponse }` for type-safe guard checks

### Completion Notes List

- `verifyHouseholdMember(supabase, userId, householdId)` helper added to `auth-check.ts`
- `household/invite/route.ts`: migrated to `withAuth()` + `verifyHouseholdMember()` (AD-1 + AD-6 compliance); fixed missing `is_active=true` bug in owner check
- Audit: 48 data routes already safe (use `auth.householdId` from DB); 1 route fixed (invite); 1 route exempt (onboarding, AD-2)
- 10 new tests (3 helper + 7 invite route); full suite 310 tests — 0 regressions

### Change Log

- 2026-06-27: Story 1.2 implemented — `verifyHouseholdMember` helper added, `household/invite/route.ts` fixed (AD-1+AD-6), tests added

### File List

- src/lib/supabase/auth-check.ts (modified — added `verifyHouseholdMember`)
- src/app/api/household/invite/route.ts (modified — withAuth + verifyHouseholdMember)
- src/lib/supabase/__tests__/auth-check.test.ts (created)
- src/app/api/household/invite/__tests__/route.test.ts (created)
