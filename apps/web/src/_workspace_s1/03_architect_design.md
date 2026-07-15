# Technical Design: Sprint S1 — Auth + Onboarding Wizard

> Stories: US-1.01→1.05, US-2.01→2.02
> Tuân thủ 7 quyết định đã chốt trong `02_business_review.md`

## Tổng quan trạng thái S0

S0 đã build gần như toàn bộ DB layer:

| Thành phần DB | Trạng thái S0 | Cần làm ở S1 |
|---|---|---|
| Tables: households, household_members, household_invitations, income_sources, accounts, debt_entries, budget_baselines | ✅ `002_tables.sql` | Không |
| `get_invitation_by_token(p_token)` | ✅ `003` §8 | Không |
| `accept_invitation(p_token, p_user_id)` | ✅ `003` §9 | Không |
| `recalculate_debt_budget()` + trigger + div-by-zero guard | ✅ `003` §4 | Không |
| RLS: invitations, members, budget_baselines | ✅ `004_rls.sql` | Không |
| `complete_onboarding(...)` RPC | ❌ Chưa có | **CẦN TẠO** — `006_onboarding.sql` |

S1 DB layer = 1 migration file mới (`006`) với RPC `complete_onboarding`.

---

## DB Layer (cho Migration Agent)

### Migration: `supabase/migrations/006_onboarding.sql`

#### RPC: `complete_onboarding`

**Quyết định: RPC atomic, KHÔNG sequential API calls**
- Decision #1 yêu cầu atomic — 5 bước phải all-or-nothing
- Thứ tự bắt buộc: budget_baselines INSERT **trước** debt_entries để trigger recalculate có target row
- Không phải fund op nhưng cùng class "multi-table atomic"

**Signature:**
```sql
CREATE OR REPLACE FUNCTION complete_onboarding(
  p_household_id     uuid,
  p_income_sources   jsonb,   -- [{ source_name, monthly_amount, member_id? }]
  p_accounts         jsonb,   -- [{ name, bank_name?, account_type, owner_name?, is_credit_card }]
  p_debt_entries     jsonb,   -- [{ creditor_name, debt_type, total_amount, remaining_amount?, monthly_payment, expected_end_date?, member_id? }]
  p_budget_pcts      jsonb    -- [{ name, budget_pct }] — 16 lines từ template
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp
```

**Execution order (1 transaction):**
1. Auth guard: `IF NOT (p_household_id = ANY(get_user_household_ids())) THEN RAISE EXCEPTION 'Access denied'`
2. Idempotency: nếu `onboarding_completed=true` → RAISE 'Onboarding already completed'
3. INSERT income_sources (household_id, is_current=true, currency từ household)
4. INSERT accounts
5. INSERT budget_baselines — loop p_budget_pcts, resolve group names → ids qua `category_groups WHERE name=ANY(...)`. `linked_category_group_ids = {}` nếu không match (không raise).
6. INSERT debt_entries (trigger `debt_budget_recalc` tự chạy → UPDATE baseline 'Chi trả nợ')
7. UPDATE households SET onboarding_completed=true
8. RETURN p_household_id

### RLS — không cần thêm (đã đủ ở S0)

---

## App Layer

### Quyết định kiến trúc

1. **Step 1 submit = upsert household sớm** (cần householdId cho invite + BR-OB-004)
2. **Steps 3-7 = wizardStore localStorage** (no DB write)
3. **Completion = atomic via `complete_onboarding` RPC** (income+accounts+debts+baselines+flag)
4. **Supabase Auth + @supabase/ssr, KHÔNG NextAuth** (đã chốt ở S0)
5. **Invitation = copy share link, KHÔNG gửi email** (decision #2)
6. **KHÔNG có API routes riêng cho income/accounts/debts** — bỏ 3 routes thừa

### File Structure

```
src/
├── middleware.ts                              ★ session + onboarding redirect (US-1.01, BR-OB-001)
├── lib/
│   ├── supabase/
│   │   └── middleware.ts                      ★ updateSession helper
│   ├── validations/
│   │   ├── household.ts                       ★ householdSchema, inviteSchema
│   │   └── onboarding.ts                      ★ income/account/debt/budgetSetup schemas
│   ├── hooks/
│   │   ├── useHousehold.ts                    ★ useHousehold + useUpsertHousehold
│   │   ├── useInvitation.ts                   ★ useCreateInvite + useAcceptInvite
│   │   └── useCompleteOnboarding.ts           ★ mutation → /api/onboarding/complete
│   └── stores/
│       └── wizardStore.ts                     ★ wizard state machine (persist localStorage)
├── types/
│   └── app.ts                                 ◆ extend: WizardData, WizardStep, *Draft types
├── components/
│   ├── ui/
│   │   └── CurrencyInput.tsx                  ★ raw on focus / VND format on blur, 16px
│   └── onboarding/
│       ├── WizardLayout.tsx                   ★ progress bar 6/7, max-w-lg, footer CTA, pb-16
│       ├── WizardStep1Type.tsx               ★ type cards + currency toggle (US-1.02)
│       ├── WizardStep2Invite.tsx             ★ invite form + share link (US-1.03)
│       ├── WizardStep3Income.tsx             ★ income rows + total (US-1.04)
│       ├── WizardStep4Accounts.tsx           ★ account rows + CC hint (US-1.04)
│       ├── WizardStep5Debt.tsx               ★ debt rows + debt_pct client-side + skip (US-1.05)
│       ├── WizardStep6Categories.tsx         ★ category tree read-only + count + callout (US-2.01)
│       └── WizardStep7Budget.tsx             ★ 16 budget lines + % + realtime + lock (US-2.02)
└── app/
    ├── login/
    │   └── page.tsx                           ★ Google sign-in (US-1.01)
    ├── auth/callback/
    │   └── route.ts                           ★ exchange code → redirect by onboarding status
    ├── setup/
    │   ├── page.tsx                           ★ Server: auth guard + fetch household
    │   └── SetupClient.tsx                    ★ Client: wizard orchestration
    ├── invite/[token]/
    │   ├── page.tsx                           ★ Server: fetch invitation by token (SSR)
    │   └── InviteClient.tsx                   ★ Client: accept/reject UI states
    └── api/
        ├── household/
        │   └── route.ts                       ★ GET (current) + POST (upsert + owner member)
        ├── household/invite/
        │   └── route.ts                       ★ POST → INSERT invitation, return inviteLink
        ├── household/invite/[token]/accept/
        │   └── route.ts                       ★ POST → RPC accept_invitation
        └── onboarding/complete/
            └── route.ts                       ★ POST → RPC complete_onboarding
```

★ = tạo mới, ◆ = sửa.

---

### WizardStore

```typescript
// src/lib/stores/wizardStore.ts — zustand + persist(localStorage)
interface WizardStore {
  householdId: string | null
  householdType: HouseholdType | null
  currency: Currency
  currentStep: number
  incomes: IncomeDraft[]
  accounts: AccountDraft[]
  debts: DebtDraft[]
  budgetPcts: BudgetPct[]          // init từ BUDGET_TEMPLATE, mutate ở step 7
  // computed
  totalSteps: () => number         // 7 nếu family, 6 nếu personal
  stepOrder: () => number[]        // family [1..7], personal [1,3,4,5,6,7]
  totalIncome: () => number        // SUM(incomes.monthlyAmount)
  debtPct: () => number            // SUM(debts.monthlyPayment)/totalIncome*100 (preview only)
  totalBudgetPct: () => number     // SUM(budgetPcts.budgetPct) — step 7 validator
  canProceed: () => boolean        // BR-OB-002 gate
  next / prev: () => void
  setHousehold: (id, type, currency) => void
  setIncomes / setAccounts / setDebts / setBudgetPct ...
  reset: () => void
}
```

Step 7 'Chi trả nợ' locked nếu `debts.length > 0` (BR-BU-002): pct = `debtPct()`, disabled input.
Skip step 5 → 'Chi trả nợ' editable, default 8% từ template.

---

### Data Flow

**Step 1:** RHF → `useUpsertHousehold` → POST /api/household → upsert households + member(owner) → `wizardStore.setHousehold()` + `appStore.setHouseholdId()`

**Step 2:** RHF → `useCreateInvite` → POST /api/household/invite → INSERT invitation → return `{ inviteLink }` → UI copy button

**Steps 3-7:** inputs → wizardStore (localStorage, no API calls). Step 5 `debtPct()` = client computed only.

**Completion:** `useCompleteOnboarding` → POST /api/onboarding/complete → `complete_onboarding` RPC [atomic: income→accounts→baselines→debts(trigger recalc)→flag] → `wizardStore.reset()` + redirect /dashboard

---

### Middleware Logic

```
PUBLIC: /login, /auth/callback, /invite/*, _next/*, static
IF no user AND not public → redirect /login
IF user:
  query onboarding_completed from household (via household_members)
  0 rows OR false → redirect /setup (unless already /setup or /invite/*)
  true:
    /login or /setup → redirect /dashboard
```

`/invite/[token]` EXCLUDED from onboarding gate (decision #8) — member mới chưa onboarded.

---

### API Contracts

**`POST /api/household`**
```
Request:  { name, type: 'personal'|'family', currency: 'VND'|'USD' }
Response: 200 { data: { id, name, household_type, currency, onboarding_completed } }
Behavior: upsert household + household_members(owner). BR-OB-004.
```

**`GET /api/household`**
```
Response: 200 { data: household | null }
```

**`POST /api/household/invite`**
```
Request:  { email, display_name, role?: 'member'|'viewer' }
Response: 200 { data: { token, inviteLink } }   // KHÔNG gửi email (decision #2)
          403 { error: 'Not household owner' }
```

**`POST /api/household/invite/[token]/accept`**
```
Request:  {}  (token từ path, user từ session)
Response: 200 { data: { household_id, member_id, alreadyMember: boolean } }
          410 { error: 'Invitation expired' }
          404 { error: 'Invitation not found' }
```

**`POST /api/onboarding/complete`**
```
Request: {
  householdId: string,
  incomes: [{ sourceName, monthlyAmount, memberId? }],    // ≥1
  accounts: [{ name, bankName?, accountType, ownerName?, isCreditCard }],  // ≥1
  debts: [{ creditorName, debtType, totalAmount, remainingAmount?, monthlyPayment, expectedEndDate?, memberId? }],  // có thể []
  budgetPcts: [{ name, budgetPct }]   // 16 lines
}
Response: 200 { data: { householdId } }
          400 { error: 'Total budget exceeds 100%' | 'Validation error' }
          409 { error: 'Onboarding already completed' }
```

---

### Hook Specifications

| Hook | Type | Endpoint |
|---|---|---|
| `useHousehold(id)` | query `keys.household(id)` | GET /api/household |
| `useUpsertHousehold()` | mutation | POST /api/household |
| `useCategories(hid)` | query `keys.categories(hid)` | supabase direct (system categories) |
| `useCreateInvite()` | mutation | POST /api/household/invite |
| `useAcceptInvite()` | mutation | POST /api/household/invite/[token]/accept |
| `useCompleteOnboarding()` | mutation | POST /api/onboarding/complete |

`useInvitationByToken`: fetch ở Server Component (SSR), pass xuống client. Không hook.

---

### Zod Schemas

`src/lib/validations/household.ts`:
- `householdSchema`: `{ name: min(1), type: enum(['personal','family']), currency: enum(['VND','USD']) }`
- `inviteSchema`: `{ email: email(), display_name: min(1), role: enum.default('member') }`

`src/lib/validations/onboarding.ts`:
- `incomeSourceSchema`, `accountSchema`, `debtSchema`, `budgetSetupSchema`
- `completeOnboardingSchema`: gộp tất cả, `incomes.min(1)`, `accounts.min(1)`, `debts.default([])`
- budgetSetupSchema refine: `sum ≤ 100`

Enum values từ `001_enums.sql`:
- `account_type`: `['bank','cash','savings','credit_card','investment','precious_metal']`
- `debt_type`: `['bank_loan','credit_card','mortgage','personal']`

---

### Rủi ro kỹ thuật

1. **Group name → id mapping trong RPC**: nếu budgetTemplate names lệch seed names → `linked_category_group_ids = {}`. Migration agent verify mapping.
2. **Double-submit**: idempotency guard trong RPC (409) + button loading disable.
3. **Middleware exclude /invite/[token]**: tường minh trong matcher.
4. **OAuth redirectTo origin**: dùng `request.url` origin động trong callback route.
5. **PKCE flow**: `signInWithOAuth` từ browser client (verifier lưu cookie), `exchangeCodeForSession` từ server client.
