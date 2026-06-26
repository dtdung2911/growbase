# Sprint S1 Done

## Files created (mới)

### DB
- `supabase/migrations/006_onboarding.sql` — RPC `complete_onboarding` (atomic: income→accounts→baselines→debts→flag)

### App — Foundation
- `src/middleware.ts`
- `src/lib/supabase/middleware.ts`

### App — Types + Validations
- `src/lib/validations/household.ts`
- `src/lib/validations/onboarding.ts`

### App — Store + Hooks
- `src/lib/stores/wizardStore.ts`
- `src/lib/hooks/useHousehold.ts`
- `src/lib/hooks/useInvitation.ts`
- `src/lib/hooks/useCompleteOnboarding.ts`
- `src/lib/hooks/useCategories.ts`

### App — API Routes
- `src/app/auth/callback/route.ts`
- `src/app/api/household/route.ts`
- `src/app/api/household/invite/route.ts`
- `src/app/api/household/invite/[token]/accept/route.ts`
- `src/app/api/onboarding/complete/route.ts`

### App — Components
- `src/components/ui/CurrencyInput.tsx`
- `src/components/ui/button.tsx`, `card.tsx`, `input.tsx`, `label.tsx`, `badge.tsx`, `select.tsx`, `switch.tsx`
- `src/components/auth/LoginButton.tsx`
- `src/components/onboarding/WizardLayout.tsx`
- `src/components/onboarding/WizardStep1Type.tsx`
- `src/components/onboarding/WizardStep2Invite.tsx`
- `src/components/onboarding/WizardStep3Income.tsx`
- `src/components/onboarding/WizardStep4Accounts.tsx`
- `src/components/onboarding/WizardStep5Debt.tsx`
- `src/components/onboarding/WizardStep6Categories.tsx`
- `src/components/onboarding/WizardStep7Budget.tsx`

### App — Pages
- `src/app/login/page.tsx`
- `src/app/setup/page.tsx`
- `src/app/setup/SetupClient.tsx`
- `src/app/invite/[token]/page.tsx`
- `src/app/invite/[token]/InviteClient.tsx`

### Tests
- `src/__tests__/stores/wizardStore.test.ts` (34 tests)
- `src/__tests__/stores/wizardStore.regression.test.ts` (4 tests)
- `src/__tests__/validations/onboarding.test.ts` (26 tests)
- `src/__tests__/setup/localStorage.ts` (vitest shim)

## Files modified

- `src/types/app.ts` — WizardStep, *Draft types, Household, enums
- `src/types/database.ts` — placeholder extend
- `vitest.config.ts` — setupFiles localStorage shim
- `supabase/migrations/003_functions.sql` — thêm `auth.uid()` guard vào `accept_invitation` (C3 fix)

## Pipeline summary

| Phase | Agent | Kết quả |
|---|---|---|
| Analyst | growbase-analyst | 7 stories, 16 tasks, 8 risks flagged |
| Business Review | growbase-business-review | APPROVED (2 blockers resolved: step5 client-only, copy-link invite) |
| Architect | growbase-architect | 1 migration file, 30+ app files, complete_onboarding RPC atomic |
| Migration | growbase-migration | 006_onboarding.sql verified (trigger recalc không no-op) |
| Senior Developer | growbase-senior-developer | ~35 files, tsc pass, next build pass |
| Code Review | growbase-code-reviewer | 3 CRITICAL, 6 WARNING, 5 MINOR |
| Fixer | growbase-fixer | 3 C + 4 W + 2 M fixed |
| Tester | growbase-tester | 64 tests mới → 116/116 pass |
| QA | growbase-qa | **PASS** — 0 critical, 4 known issues tracked |

## Deviations from spec

1. **shadcn UI viết native** (không install @radix-ui) — API tương thích, có thể swap sau
2. **Email invite = copy-link** (không gửi email thật) — AC không yêu cầu email, PO approved
3. **`totalAmount` không có UI input** — field tồn tại trong schema nhưng wizard không collect; debt_entries.total_amount = 0. Cần design decision sprint sau
4. **income/accounts/debt không có API routes riêng** — persist atomic ở completion (đơn giản hóa đúng theo decision #1)
5. **Database.ts là placeholder** — cần `supabase gen types` sau khi apply migrations

## Known issues (track sang S2)

1. `totalAmount` field: no UI → luôn = 0 trong debt_entries
2. GET /api/household chỉ trả owner household → member-invited flow cần design riêng (S2+)
3. database.ts placeholder → `supabase gen types typescript --local`
4. @supabase/ssr@0.5.2 ↔ supabase-js@2.108.2 version mismatch → align versions

## Test results

- 116/116 pass
- `tsc --noEmit`: 0 errors
- QA verdict: **PASS**

## Next: Sprint S2 ready to start
