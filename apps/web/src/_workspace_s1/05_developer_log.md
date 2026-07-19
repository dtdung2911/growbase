# Developer Log: S1 — Auth + Onboarding Wizard

## Foundation + Types + Validations + WizardStore
✓ updateSession helper — src/lib/supabase/middleware.ts
✓ middleware (session + onboarding redirect) — src/middleware.ts — PUBLIC patterns, household query via household_members!inner join
✓ extend app types (WizardStep, IncomeDraft, AccountDraft, DebtDraft, BudgetPctDraft, WizardData, Household + enums) — src/types/app.ts
✓ householdSchema + inviteSchema — src/lib/validations/household.ts
✓ onboarding schemas (income/account/debt/budgetSetup/completeOnboarding) — src/lib/validations/onboarding.ts — refine sum ≤ 100
✓ wizardStore (persist localStorage 'growbase-wizard') — src/lib/stores/wizardStore.ts — computed totalSteps/stepOrder/totalIncome/debtPct/totalBudgetPct/canProceed; setDebts auto-syncs 'Chi trả nợ' pct (BR-BU-002)

## Hooks + API Routes + database types
✓ extend database.ts placeholder (households/members/invitations/category_groups/categories/cost_types + RPC signatures) — src/types/database.ts — vì gen types chưa chạy, cần typed .from()/.rpc()
✓ useHousehold + useUpsertHousehold — src/lib/hooks/useHousehold.ts — onSuccess set appStore.householdId + wizardStore.setHousehold
✓ useCreateInvite + useAcceptInvite — src/lib/hooks/useInvitation.ts
✓ useCompleteOnboarding — src/lib/hooks/useCompleteOnboarding.ts — reset + invalidate household/budget/debts + push /dashboard
✓ useCategories (supabase direct) — src/lib/hooks/useCategories.ts
✓ auth callback route — src/app/auth/callback/route.ts
✓ GET+POST /api/household — src/app/api/household/route.ts — BR-OB-004 upsert, owner member display_name từ user_metadata.full_name
✓ POST /api/household/invite — src/app/api/household/invite/route.ts — owner check 403
✓ POST /api/household/invite/[token]/accept — .../accept/route.ts — alreadyMember pre-check, exception→410/404/409
✓ POST /api/onboarding/complete — src/app/api/onboarding/complete/route.ts — camelCase→snake_case, linked_group_names, exception→401/409

## Shared UI + Auth/Invite pages
✓ shadcn-style primitives (self-contained, KHÔNG dùng @radix-ui vì chưa cài) — src/components/ui/{button,input,label,card,badge,switch,select}.tsx — Deviation: native HTML thay radix; API tương thích shadcn cho consumer. min-h-[44px] + text-base toàn bộ.
✓ CurrencyInput — src/components/ui/CurrencyInput.tsx — raw on focus, VND/USD format on blur, inputMode numeric
✓ WizardLayout — src/components/onboarding/WizardLayout.tsx — progress bar, max-w-lg, sticky footer pb-16
✓ LoginButton (signInWithOAuth google) — src/components/auth/LoginButton.tsx
✓ /login page (server redirect nếu đã login) — src/app/login/page.tsx
✓ /invite/[token] page (SSR get_invitation_by_token) — src/app/invite/[token]/page.tsx
✓ InviteClient (valid/expired/notfound/alreadyMember + signIn redirect back to invite) — src/app/invite/[token]/InviteClient.tsx

## Wizard step components
✓ WizardStep1Type (type cards + currency pills + name input, onDraftChange→SetupClient) — src/components/onboarding/WizardStep1Type.tsx
✓ WizardStep2Invite (RHF + useCreateInvite + copy link + pending list state) — src/components/onboarding/WizardStep2Invite.tsx
✓ WizardStep3Income (field array + CurrencyInput + total) — src/components/onboarding/WizardStep3Income.tsx — wizardStore only, no API
✓ WizardStep4Accounts (field array + account_type Select + is_credit_card Switch + CC Badge) — src/components/onboarding/WizardStep4Accounts.tsx
✓ WizardStep5Debt (field array + debt_type Select + monthly_payment CurrencyInput + debtPct preview + skip) — src/components/onboarding/WizardStep5Debt.tsx
✓ WizardStep6Categories (useCategories tree read-only + count + callout + skeleton) — src/components/onboarding/WizardStep6Categories.tsx
✓ WizardStep7Budget (16 lines + % input + computed VND + 'Chi trả nợ' lock khi có debts (BR-BU-002) + total color (BR-BU-001)) — src/components/onboarding/WizardStep7Budget.tsx

## Setup page orchestration
✓ /setup server page (auth guard + fetch household + redirect /dashboard nếu completed) — src/app/setup/page.tsx
✓ SetupClient (render step theo stepOrder(), step1→upsert→next, lastStep→complete, skip step2/5/7) — src/app/setup/SetupClient.tsx

## Verification
✓ tsc --noEmit: pass (0 errors)
✓ next build: pass (10 routes + middleware compile). Warning Edge Runtime process.version từ supabase-js trong middleware — benign, không ảnh hưởng chức năng.
✓ vitest run: 52/52 pass (utils + budgetTemplate suites không bị ảnh hưởng)

## Deviations from spec
1. **shadcn UI primitives tự viết, KHÔNG dùng @radix-ui**: components/ui rỗng + @radix-ui chưa cài trong package.json. Tạo button/input/label/card/badge/switch/select bằng native HTML + Tailwind, API tương thích shadcn. Nếu sau này cài radix, có thể swap không ảnh hưởng consumer.
2. **database.ts placeholder được extend thủ công** (households/members/invitations/category_groups/categories/cost_types + 3 RPC). Real types phải generate bằng `supabase gen types typescript`. Đây là interim.
3. **Version mismatch @supabase/ssr@0.5.2 ↔ @supabase/supabase-js@2.108.2**: ssr import GenericSchema từ path `@supabase/supabase-js/dist/module/lib/types` đã bị đổi/xoá ở 2.108 → generic Schema resolve về `any` → mọi typed query trả `never`. WORKAROUND: annotate return của createClient (server/client/middleware) là `SupabaseClient<Database>` + cast `as unknown as`. RECOMMEND: align versions (downgrade supabase-js về ~2.46 như package.json declare, hoặc nâng ssr lên bản tương thích) rồi bỏ cast. Cần product owner quyết version.
4. **useCategories nested-select cast thủ công**: placeholder database.ts thiếu FK metadata nên `categories(...)` nested select trả SelectQueryError. Cast `as unknown as GroupRow[]`. Tự khỏi khi gen real types có Relationships.
5. **accept_invitation alreadyMember**: RPC không trả flag alreadyMember; nếu invitation status≠pending nó raise 'not pending'. API pre-check member existence qua get_invitation_by_token + household_members trước khi gọi RPC để trả alreadyMember:true (status 200) đúng contract.

## Known issues
- Edge Runtime warning (supabase-js process.version) trong middleware — không block, nhưng nếu deploy edge cần theo dõi.
- Version mismatch (deviation #3) nên được giải quyết ở sprint sau để bỏ các cast `as unknown`.
