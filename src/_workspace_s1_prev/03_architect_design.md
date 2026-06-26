## Technical Design: Sprint S0 — Foundation (Schema + Seed + Next.js init)

### Tổng quan
S0 = foundation sprint thuần hạ tầng. Document này: (1) chốt 4 BLOCKER + 1 WARNING, (2) migration files structure, (3) app scaffold structure.

---

## PHẦN A — Quyết định 4 BLOCKER + WARNING

### BLOCKER #1 — CHECK constraint BR-TX-003
**Quyết định:** Thêm vào table `transactions`:
```sql
CONSTRAINT chk_no_unusual_outflow CHECK (NOT (direction = 'out' AND is_unusual_income = true))
```
Data integrity invariant — không bypass được kể cả qua RPC hay raw SQL. Đặt tên constraint để app layer catch theo tên. `is_unusual_income DEFAULT false` nên các transaction out hiện hữu pass tự động.

### BLOCKER #2 — Income categories + behavior_type
**Quyết định:** Thêm `'income'` vào enum `behavior_type`.
```sql
CREATE TYPE behavior_type AS ENUM ('fixed', 'variable', 'wasteful', 'debt_repayment', 'savings_investment', 'income');
```
Giữ NOT NULL invariant. Income categories seed với `default_behavior_type='income'`. Trigger `set_transaction_behavior_type` sẽ gán `'income'` cho income transactions — nhất quán.
**Downstream S3:** Report grouping behavior_type phải filter `direction='out'` trước khi group.

### BLOCKER #3 — Budget template storage
**Quyết định:** Hardcode constant `src/lib/constants/budgetTemplate.ts`. KHÔNG seed `budget_baselines` với `household_id=null`.
`budget_baselines.household_id` là NOT NULL FK. 16 dòng tĩnh → TypeScript constant phù hợp hơn. Onboarding S1 map template → INSERT rows cho household mới.
```typescript
export interface BudgetTemplateLine {
  name: string
  budgetPct: number
  sortOrder: number
  isSystem: true
  isAutoCalculated?: boolean
  autoCalculatedSource?: string
  linkedCategoryGroupNames: string[]
}
```

### BLOCKER #4 — RLS household_members + household_invitations

#### 4.1 household_members
```sql
CREATE POLICY hm_select ON household_members FOR SELECT
  USING (household_id = ANY(get_user_household_ids()));
CREATE POLICY hm_insert ON household_members FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY hm_update ON household_members FOR UPDATE
  USING (household_id IN (
    SELECT household_id FROM household_members
    WHERE user_id = auth.uid() AND role = 'owner' AND is_active = true));
CREATE POLICY hm_delete ON household_members FOR DELETE
  USING (household_id IN (
    SELECT household_id FROM household_members
    WHERE user_id = auth.uid() AND role = 'owner' AND is_active = true));
```
`get_user_household_ids()` là SECURITY DEFINER STABLE nên không recursion khi gọi trong SELECT policy.

#### 4.2 household_invitations — invite token flow
**Quyết định:** SECURITY DEFINER RPC functions. RLS bảng dùng `own_household` pattern (member manage invitations), luồng accept đi qua RPC.

RLS policies (4 cái, tất cả `get_user_household_ids()` pattern):
```sql
CREATE POLICY hi_select ON household_invitations FOR SELECT USING (...own_household...);
CREATE POLICY hi_insert ON household_invitations FOR INSERT WITH CHECK (...own_household...);
CREATE POLICY hi_update ON household_invitations FOR UPDATE USING (...own_household...);
CREATE POLICY hi_delete ON household_invitations FOR DELETE USING (...own_household...);
```

2 SECURITY DEFINER functions vào `003_functions.sql`:
```sql
-- Read invitation by token (trước khi user là member)
CREATE OR REPLACE FUNCTION get_invitation_by_token(p_token text)
RETURNS TABLE (invitation_id uuid, household_id uuid, household_name text, email text,
               display_name text, role member_role, status invitation_status, expires_at timestamptz)
AS $$ SELECT i.id, i.household_id, h.name, i.email, i.display_name, i.role, i.status, i.expires_at
   FROM household_invitations i JOIN households h ON h.id = i.household_id WHERE i.token = p_token;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Accept invitation: atomic (validate token → insert member → mark accepted)
CREATE OR REPLACE FUNCTION accept_invitation(p_token text, p_user_id uuid) RETURNS uuid AS $$
DECLARE v_inv household_invitations%ROWTYPE; v_member_id uuid;
BEGIN
  SELECT * INTO v_inv FROM household_invitations WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invitation not found'; END IF;
  IF v_inv.status <> 'pending' THEN RAISE EXCEPTION 'Invitation not pending'; END IF;
  IF v_inv.expires_at < now() THEN
    UPDATE household_invitations SET status = 'expired' WHERE id = v_inv.id;
    RAISE EXCEPTION 'Invitation expired';
  END IF;
  INSERT INTO household_members (household_id, user_id, display_name, role)
  VALUES (v_inv.household_id, p_user_id, v_inv.display_name, v_inv.role)
  ON CONFLICT (household_id, user_id) DO NOTHING RETURNING id INTO v_member_id;
  UPDATE household_invitations SET status = 'accepted' WHERE id = v_inv.id;
  RETURN v_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 4.3 households — bổ sung INSERT + DELETE
Spec chỉ có select + update. Onboarding cần INSERT:
```sql
CREATE POLICY households_insert ON households FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY households_delete ON households FOR DELETE
  USING (id IN (SELECT household_id FROM household_members
                WHERE user_id = auth.uid() AND role = 'owner' AND is_active = true));
```

### WARNING #5 — @supabase/ssr
**Quyết định:** Dùng `@supabase/ssr`. KHÔNG cài `@supabase/auth-helpers-nextjs`.
auth-helpers deprecated chính thức. @supabase/ssr là chuẩn Next.js 14 App Router (cookie-based, Server Components, middleware). Tránh rework S1.

---

## PHẦN B — Circular FK Resolution

**Không cần ALTER TABLE.** FK chỉ một chiều: `fund_transactions.linked_transaction_id → transactions`. Tạo `transactions` trước `fund_transactions` là đủ.

**Thứ tự tạo bảng bắt buộc trong 002_tables.sql:**
```
households
household_members
household_invitations
income_sources
accounts
cost_types → category_groups → categories
funds
debt_entries
budget_baselines → budget_overrides
transactions (refs: funds, debt_entries, categories, accounts, household_members)
fund_transactions (refs transactions — OK)
net_worth_snapshots
scheduled_payments
estimated_expenses
```

---

## PHẦN C — Migration Files (cho Migration Agent)

### Tổng quan 5 files
```
supabase/migrations/
├── 001_enums.sql      — 14 enums (behavior_type + 'income')
├── 002_tables.sql     — 19 tables, đúng thứ tự FK + CHECK constraint + indexes
├── 003_functions.sql  — RPCs + triggers + helpers (gồm get/accept invitation)
├── 004_rls.sql        — Enable RLS + policies đầy đủ (gồm household_members/invitations/households)
└── 005_seed.sql       — cost_types + system groups + system categories (KHÔNG seed budget_baselines)
```

### 001_enums.sql
- 14 enums theo spec 2.1
- **Sửa:** `behavior_type` thêm `'income'` ở cuối
- `fund_transactions.transaction_type` và `scheduled_payments.status` = text + CHECK (không enum)

### 002_tables.sql
- 19 tables theo thứ tự Phần B
- `numeric(15,0)` cho tất cả tiền
- `transactions` có thêm: `CONSTRAINT chk_no_unusual_outflow CHECK (NOT (direction='out' AND is_unusual_income=true))`
- Indexes spec 2.6: `idx_tx_household_date`, `idx_tx_category`, `idx_tx_budget_filter`
- Indexes bổ sung: `idx_fund_tx_fund(fund_id, transaction_date DESC)`, `idx_funds_household(household_id) WHERE is_active=true`, `idx_household_members_user(user_id) WHERE is_active=true`
- GENERATED: `net_worth_snapshots.discrepancy GENERATED ALWAYS AS (total_recorded - total_system) STORED`
- UNIQUE: `net_worth_snapshots(household_id, snapshot_month)`

### 003_functions.sql
**Thứ tự định nghĩa (get_user_household_ids TRƯỚC tiên vì RLS dùng nó):**
1. `get_user_household_ids()` — SECURITY DEFINER STABLE
2. `fund_contribute()` — SECURITY DEFINER, lock FOR UPDATE, atomic
3. `fund_withdraw()` — SECURITY DEFINER, lock FOR UPDATE, balance check exception
4. `recalculate_debt_budget()` + trigger function + trigger `debt_budget_recalc`
5. `set_transaction_behavior_type()` trigger function + trigger `tx_set_behavior_type` BEFORE INSERT ON transactions
6. `reset_freedom_funds()` — SECURITY DEFINER
7. `get_budget_with_actuals()` — spec 6.2
8. `get_invitation_by_token()` — SECURITY DEFINER STABLE
9. `accept_invitation()` — SECURITY DEFINER (xem code ở Phần A.4.2)

### 004_rls.sql
Enable RLS trên **tất cả** tables (gồm bảng spec bỏ sót: household_invitations, category_groups, cost_types, budget_overrides):
```sql
ALTER TABLE <name> ENABLE ROW LEVEL SECURITY;
```

Policies:
- Generic `own_household` pattern (select/insert/update/delete) cho: `income_sources, accounts, budget_baselines, budget_overrides, transactions, funds, fund_transactions, debt_entries, net_worth_snapshots, scheduled_payments, estimated_expenses`
- `households`: select + update (spec) + insert (authed) + delete (owner only)
- `household_members`: 4 policies riêng (hm_select/insert/update/delete — Phần A.4.1)
- `household_invitations`: 4 policies own_household (hi_select/insert/update/delete)
- `categories`: spec pattern (include is_system=false check cho write)
- `category_groups`: SELECT `USING (true)` + insert/update/delete cho custom (household-scoped, is_system=false)
- `cost_types`: SELECT `USING (true)` only

### 005_seed.sql
```sql
BEGIN;
-- 1. cost_types (6 rows, spec 7.1)
-- 2. system category_groups (17 rows, spec 7.2, household_id=NULL, is_system=true)
--    dùng sub-select lấy cost_type_id: (SELECT id FROM cost_types WHERE code='fixed')
-- 3. system categories (1 per group, household_id=NULL, is_system=true)
--    default_behavior_type map: fixed→'fixed', variable→'variable', wasteful→'wasteful',
--    debt_repayment→'debt_repayment', savings_investment→'savings_investment', income→'income'
-- KHÔNG seed budget_baselines
COMMIT;
```

---

## PHẦN D — App Scaffold (cho Senior Developer)

### Dependencies package.json
```
next@14, react, react-dom
@supabase/supabase-js, @supabase/ssr
@tanstack/react-query@5
zustand
react-hook-form, zod, @hookform/resolvers
recharts, date-fns, lucide-react, sonner
tailwindcss, class-variance-authority, clsx, tailwind-merge
```

### File structure
```
/
├── components.json                — shadcn config (zinc, CSS variables)
├── tailwind.config.ts
├── tsconfig.json                  — paths: "@/*" → "src/*"
├── next.config.mjs
├── .env.example                   — 3 biến spec 8, không commit .env.local
└── src/
    ├── app/
    │   ├── layout.tsx             — root layout, wrap <Providers>
    │   ├── providers.tsx          — "use client": QueryClientProvider + <Toaster/>
    │   ├── globals.css            — Tailwind + zinc CSS vars
    │   └── page.tsx               — placeholder
    ├── components/ui/             — 21 shadcn components
    ├── lib/
    │   ├── supabase/client.ts     — createBrowserClient
    │   ├── supabase/server.ts     — createServerClient + cookies adapter
    │   ├── stores/appStore.ts     — Zustand (householdId, currentMonth, user, setters)
    │   ├── queries/queryKeys.ts   — keys factory (CLAUDE.md)
    │   ├── hooks/.gitkeep
    │   ├── validations/.gitkeep
    │   ├── constants/budgetTemplate.ts  — 16 budget lines (BLOCKER #3)
    │   └── utils/cn.ts, date.ts, currency.ts, budget.ts
    └── types/database.ts, app.ts, api.ts
```

### Key files content

**appStore.ts:**
```typescript
interface AppStore {
  householdId: string | null
  currentMonth: string       // 'YYYY-MM', default = toYearMonth(new Date())
  user: User | null
  setCurrentMonth: (month: string) => void
  setHouseholdId: (id: string) => void
  setUser: (user: User | null) => void
}
```

**supabase/client.ts:**
```typescript
import { createBrowserClient } from '@supabase/ssr'
export const createClient = () =>
  createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
```

**supabase/server.ts:** `createServerClient` + `cookies()` từ `next/headers` với getAll/setAll adapter (@supabase/ssr pattern).

**providers.tsx:** `"use client"`, `QueryClient` trong `useState` (stable), `QueryClientProvider`, `<Toaster richColors position="top-center"/>`. Default: `staleTime: 60_000`, `refetchOnWindowFocus: false`.

**types/api.ts:**
```typescript
export type ApiResponse<T> = { data: T; error: null } | { data: null; error: string }
```

### S0 KHÔNG tạo
- API routes (`src/app/api/` rỗng)
- Custom hooks (chỉ .gitkeep)
- Zod schemas (chỉ .gitkeep)
- Auth middleware (S1)

---

## PHẦN E — Decisions Summary

| Vấn đề | Quyết định | Lý do |
|--------|-----------|-------|
| BR-TX-003 | DB CHECK `chk_no_unusual_outflow` | Data integrity invariant |
| Income behavior_type | Thêm `'income'` vào enum | Giữ NOT NULL invariant |
| Budget template | App constant `budgetTemplate.ts` | 16 dòng tĩnh, tránh schema change |
| Invitation flow | SECURITY DEFINER RPC get/accept | Không leak bảng, atomic accept |
| household_members RLS | Policies riêng, owner-scoped write | Tránh recursion với SECURITY DEFINER helper |
| households INSERT/DELETE | Bổ sung (authed insert, owner delete) | Onboarding cần |
| Supabase lib | `@supabase/ssr` | auth-helpers deprecated |
| Circular FK | Không ALTER TABLE cần | FK một chiều, thứ tự bảng đủ |

---

## PHẦN F — Cần user xác nhận

**Không phải blocker S0**, nhưng cần chốt trước S1:
1. Danh sách system categories con đầy đủ per group (S0 dùng 1 category/group làm baseline)
2. Mapping budget line name → category_group names cho onboarding wizard
