# 04 — TECHNICAL SPECIFICATION
> GrowBase MVP | Stack: Next.js 14 + Supabase + TypeScript
> Claude Code implements directly from this file.

---

## 1. STACK

```
Frontend:  Next.js 14 App Router + TypeScript + Tailwind CSS + shadcn/ui (zinc theme)
State:     Zustand (global) + TanStack Query v5 (server state)
Forms:     React Hook Form + Zod
Charts:    ApexCharts (react-apexcharts)
Backend:   Supabase (PostgreSQL 15 + Auth + RLS + Edge Functions)
Deploy:    Vercel
```

---

## 2. DATABASE SCHEMA (SQL)

### 2.1 Enums

```sql
CREATE TYPE household_type AS ENUM ('personal', 'family');
CREATE TYPE currency_code AS ENUM ('VND', 'USD');
CREATE TYPE member_role AS ENUM ('owner', 'member', 'viewer');
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');
CREATE TYPE account_type AS ENUM ('bank', 'cash', 'savings', 'credit_card', 'investment', 'precious_metal');
CREATE TYPE behavior_type AS ENUM ('fixed', 'variable', 'wasteful', 'debt_repayment', 'savings_investment', 'loan');
CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'internal_transfer', 'fund_contribution', 'fund_withdrawal', 'debt_repayment');
CREATE TYPE direction AS ENUM ('in', 'out');
CREATE TYPE fund_type AS ENUM ('emergency', 'sinking', 'goal', 'investment', 'freedom', 'monthly_buffer');
CREATE TYPE import_source AS ENUM ('manual', 'csv', 'gmail');
CREATE TYPE debt_type AS ENUM ('bank_loan', 'credit_card', 'mortgage', 'personal');
CREATE TYPE debt_status AS ENUM ('active', 'paid_off', 'paused');
CREATE TYPE scheduled_period AS ENUM ('monthly', 'yearly', 'quarterly');
CREATE TYPE expense_status AS ENUM ('planned', 'completed', 'cancelled');
```

### 2.2 Core Tables

```sql
-- Households
CREATE TABLE households (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name             text NOT NULL,
  household_type   household_type NOT NULL DEFAULT 'personal',
  currency         currency_code NOT NULL DEFAULT 'VND',
  onboarding_completed bool NOT NULL DEFAULT false,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);

-- Members
CREATE TABLE household_members (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id   uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name   text NOT NULL,
  role           member_role NOT NULL DEFAULT 'member',
  joined_at      timestamptz DEFAULT now(),
  is_active      bool NOT NULL DEFAULT true,
  UNIQUE(household_id, user_id)
);

-- Invitations
CREATE TABLE household_invitations (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id   uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  email          text NOT NULL,
  display_name   text NOT NULL,
  role           member_role NOT NULL DEFAULT 'member',
  token          text NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  status         invitation_status NOT NULL DEFAULT 'pending',
  expires_at     timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at     timestamptz DEFAULT now()
);

-- Income Sources (SCD Type 2)
CREATE TABLE income_sources (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  member_id       uuid REFERENCES household_members(id),
  source_name     text NOT NULL,
  monthly_amount  numeric(15,0) NOT NULL CHECK (monthly_amount > 0),
  currency        currency_code NOT NULL DEFAULT 'VND',
  effective_from  date NOT NULL DEFAULT CURRENT_DATE,
  effective_to    date,
  is_current      bool NOT NULL DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

-- Accounts
CREATE TABLE accounts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id   uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  member_id      uuid REFERENCES household_members(id),
  name           text NOT NULL,
  bank_name      text,
  account_type   account_type NOT NULL DEFAULT 'bank',
  owner_name     text,
  is_credit_card bool NOT NULL DEFAULT false,
  discount_rate  numeric(4,2) DEFAULT 1.00, -- for precious_metal: 0.85
  is_active      bool NOT NULL DEFAULT true,
  color          text DEFAULT '#3B82F6',
  sort_order     int DEFAULT 0,
  created_at     timestamptz DEFAULT now()
);
```

### 2.3 Category Tables

```sql
-- Cost Types (system only, never changes)
CREATE TABLE cost_types (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code          text NOT NULL UNIQUE, -- 'fixed','variable','wasteful','debt_repayment','savings_investment','income','loan'
  display_name  text NOT NULL,
  display_name_vi text NOT NULL,
  sort_order    int DEFAULT 0,
  is_system     bool NOT NULL DEFAULT true
);

-- Category Groups
CREATE TABLE category_groups (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id   uuid REFERENCES households(id), -- NULL = system group
  cost_type_id   uuid NOT NULL REFERENCES cost_types(id),
  name           text NOT NULL,
  icon           text,
  color          text DEFAULT '#6B7280',
  is_system      bool NOT NULL DEFAULT false,
  sort_order     int DEFAULT 0,
  created_at     timestamptz DEFAULT now()
);

-- Categories
CREATE TABLE categories (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id           uuid REFERENCES households(id), -- NULL = system category
  group_id               uuid NOT NULL REFERENCES category_groups(id),
  name                   text NOT NULL,
  icon                   text,
  default_behavior_type  behavior_type NOT NULL,
  is_system              bool NOT NULL DEFAULT false,
  is_active              bool NOT NULL DEFAULT true,
  sort_order             int DEFAULT 0,
  created_by_member_id   uuid REFERENCES household_members(id),
  created_at             timestamptz DEFAULT now()
);
```

### 2.4 Budget Tables

```sql
-- Budget Baselines
CREATE TABLE budget_baselines (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id              uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name                      text NOT NULL,
  description               text,
  linked_category_group_ids uuid[] DEFAULT '{}',
  budget_pct                numeric(5,2) NOT NULL DEFAULT 0 CHECK (budget_pct >= 0 AND budget_pct <= 100),
  is_system                 bool NOT NULL DEFAULT false,
  is_auto_calculated        bool NOT NULL DEFAULT false,
  auto_calculated_source    text, -- 'debt_entries'
  effective_from            date NOT NULL DEFAULT CURRENT_DATE,
  sort_order                int DEFAULT 0,
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now()
);

-- Budget Month Overrides
CREATE TABLE budget_overrides (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id        uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  budget_baseline_id  uuid NOT NULL REFERENCES budget_baselines(id) ON DELETE CASCADE,
  month               date NOT NULL, -- first day of month
  override_pct        numeric(5,2) NOT NULL,
  created_at          timestamptz DEFAULT now(),
  UNIQUE(budget_baseline_id, month)
);
```

### 2.5 Fund Tables

```sql
-- Funds
CREATE TABLE funds (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id        uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name                text NOT NULL,
  fund_type           fund_type NOT NULL,
  current_balance     numeric(15,0) NOT NULL DEFAULT 0,
  target_amount       numeric(15,0),
  monthly_contribution numeric(15,0) DEFAULT 0,
  expected_return_rate numeric(5,2), -- for goal fund
  target_date         date,
  target_months_expense int, -- for emergency fund
  reset_monthly       bool DEFAULT false, -- for freedom fund
  release_trigger     text DEFAULT 'manual', -- for monthly_buffer: 'manual'|'auto_day10'
  released_at         timestamptz, -- monthly_buffer: last release timestamp
  color               text DEFAULT '#10B981',
  icon                text,
  is_active           bool NOT NULL DEFAULT true,
  sort_order          int DEFAULT 0,
  created_at          timestamptz DEFAULT now()
);

-- Fund Transactions
CREATE TABLE fund_transactions (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id           uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  fund_id                uuid NOT NULL REFERENCES funds(id) ON DELETE CASCADE,
  transaction_type       text NOT NULL CHECK (transaction_type IN ('contribution', 'withdrawal', 'release', 'reset')),
  amount                 numeric(15,0) NOT NULL CHECK (amount > 0),
  direction              direction NOT NULL,
  balance_after          numeric(15,0) NOT NULL,
  linked_transaction_id  uuid REFERENCES transactions(id),
  description            text,
  transaction_date       date NOT NULL DEFAULT CURRENT_DATE,
  is_automatic           bool DEFAULT false,
  created_at             timestamptz DEFAULT now()
);
```

### 2.6 Transactions Table

```sql
CREATE TABLE transactions (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id              uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  member_id                 uuid REFERENCES household_members(id),
  amount                    numeric(15,0) NOT NULL CHECK (amount > 0),
  direction                 direction NOT NULL,
  transaction_type          transaction_type NOT NULL DEFAULT 'expense',
  category_id               uuid REFERENCES categories(id),
  account_id                uuid REFERENCES accounts(id),
  fund_id                   uuid REFERENCES funds(id),
  debt_entry_id             uuid REFERENCES debt_entries(id),
  behavior_type             behavior_type,
    -- SET by trigger from category.default_behavior_type on INSERT
  is_unusual_income         bool NOT NULL DEFAULT false,
  exclude_from_budget_report bool NOT NULL DEFAULT false,
  description               text,
  transaction_date          date NOT NULL DEFAULT CURRENT_DATE,
  import_source             import_source NOT NULL DEFAULT 'manual',
  is_duplicate              bool NOT NULL DEFAULT false,
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now()
);

CREATE INDEX idx_tx_household_date ON transactions(household_id, transaction_date DESC);
CREATE INDEX idx_tx_category ON transactions(category_id);
CREATE INDEX idx_tx_budget_filter ON transactions(household_id, transaction_date, exclude_from_budget_report);
```

### 2.7 Debt, Net Worth, Scheduled, Estimated Tables

```sql
-- Debt Entries
CREATE TABLE debt_entries (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id      uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  member_id         uuid REFERENCES household_members(id),
  creditor_name     text NOT NULL,
  debt_type         debt_type NOT NULL DEFAULT 'bank_loan',
  total_amount      numeric(15,0) NOT NULL,
  remaining_amount  numeric(15,0),
  monthly_payment   numeric(15,0) NOT NULL CHECK (monthly_payment > 0),
  interest_rate     numeric(5,2),
  start_date        date,
  expected_end_date date,
  actual_end_date   date,
  status            debt_status NOT NULL DEFAULT 'active',
  notes             text,
  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);

-- Net Worth Snapshots
CREATE TABLE net_worth_snapshots (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id     uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  snapshot_month   date NOT NULL, -- first day of month
  items            jsonb NOT NULL DEFAULT '[]',
    -- [{account_id, account_name, type, balance_recorded, balance_system}]
  total_recorded   numeric(15,0) NOT NULL DEFAULT 0,
  total_system     numeric(15,0) NOT NULL DEFAULT 0,
  discrepancy      numeric(15,0) GENERATED ALWAYS AS (total_recorded - total_system) STORED,
  notes            text,
  created_at       timestamptz DEFAULT now(),
  UNIQUE(household_id, snapshot_month)
);

-- Scheduled Payments
CREATE TABLE scheduled_payments (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name            text NOT NULL,
  period          scheduled_period NOT NULL DEFAULT 'monthly',
  amount          numeric(15,0) NOT NULL,
  payment_method  text,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  next_due_date   date,
  notes           text,
  created_at      timestamptz DEFAULT now()
);

-- Estimated Expenses
CREATE TABLE estimated_expenses (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id     uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name             text NOT NULL,
  category_id      uuid REFERENCES categories(id),
  linked_fund_id   uuid REFERENCES funds(id),
  estimated_amount numeric(15,0) NOT NULL,
  actual_amount    numeric(15,0),
  target_date      date,
  status           expense_status NOT NULL DEFAULT 'planned',
  notes            text,
  created_at       timestamptz DEFAULT now()
);
```

---

## 3. DATABASE FUNCTIONS (RPC)

### 3.1 Fund Atomic Contribute

```sql
CREATE OR REPLACE FUNCTION fund_contribute(
  p_household_id    uuid,
  p_fund_id         uuid,
  p_member_id       uuid,
  p_amount          numeric,
  p_account_id      uuid,
  p_category_id     uuid,
  p_description     text DEFAULT NULL,
  p_date            date DEFAULT CURRENT_DATE
) RETURNS uuid AS $$
DECLARE
  v_balance_after   numeric;
  v_tx_id           uuid;
BEGIN
  -- Lock fund row
  SELECT current_balance + p_amount INTO v_balance_after
  FROM funds WHERE id = p_fund_id AND household_id = p_household_id
  FOR UPDATE;
  
  IF NOT FOUND THEN RAISE EXCEPTION 'Fund not found'; END IF;

  -- 1. Insert main transaction
  INSERT INTO transactions (
    household_id, member_id, amount, direction, transaction_type,
    category_id, account_id, fund_id,
    exclude_from_budget_report, description, transaction_date, import_source
  ) VALUES (
    p_household_id, p_member_id, p_amount, 'out', 'fund_contribution',
    p_category_id, p_account_id, p_fund_id,
    false, COALESCE(p_description, 'Nạp quỹ'), p_date, 'manual'
  ) RETURNING id INTO v_tx_id;

  -- 2. Insert fund_transaction
  INSERT INTO fund_transactions (
    household_id, fund_id, transaction_type, amount, direction,
    balance_after, linked_transaction_id, description, transaction_date
  ) VALUES (
    p_household_id, p_fund_id, 'contribution', p_amount, 'in',
    v_balance_after, v_tx_id, p_description, p_date
  );

  -- 3. Update fund balance
  UPDATE funds SET current_balance = v_balance_after, updated_at = now()
  WHERE id = p_fund_id;

  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.2 Fund Atomic Withdraw

```sql
CREATE OR REPLACE FUNCTION fund_withdraw(
  p_household_id    uuid,
  p_fund_id         uuid,
  p_member_id       uuid,
  p_amount          numeric,
  p_account_id      uuid,
  p_category_id     uuid,
  p_description     text DEFAULT NULL,
  p_date            date DEFAULT CURRENT_DATE
) RETURNS uuid AS $$
DECLARE
  v_balance_after   numeric;
  v_tx_id           uuid;
BEGIN
  SELECT current_balance - p_amount INTO v_balance_after
  FROM funds WHERE id = p_fund_id AND household_id = p_household_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Fund not found'; END IF;
  IF v_balance_after < 0 THEN RAISE EXCEPTION 'Insufficient fund balance'; END IF;

  INSERT INTO transactions (
    household_id, member_id, amount, direction, transaction_type,
    category_id, account_id, fund_id,
    exclude_from_budget_report, description, transaction_date, import_source
  ) VALUES (
    p_household_id, p_member_id, p_amount, 'out', 'fund_withdrawal',
    p_category_id, p_account_id, p_fund_id,
    true, COALESCE(p_description, 'Rút quỹ'), p_date, 'manual'
  ) RETURNING id INTO v_tx_id;

  INSERT INTO fund_transactions (
    household_id, fund_id, transaction_type, amount, direction,
    balance_after, linked_transaction_id, description, transaction_date
  ) VALUES (
    p_household_id, p_fund_id, 'withdrawal', p_amount, 'out',
    v_balance_after, v_tx_id, p_description, p_date
  );

  UPDATE funds SET current_balance = v_balance_after, updated_at = now()
  WHERE id = p_fund_id;

  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.3 Recalculate Debt Budget

```sql
CREATE OR REPLACE FUNCTION recalculate_debt_budget(p_household_id uuid)
RETURNS void AS $$
DECLARE
  v_total_income  numeric;
  v_total_payment numeric;
  v_debt_pct      numeric;
BEGIN
  SELECT COALESCE(SUM(monthly_amount), 0) INTO v_total_income
  FROM income_sources
  WHERE household_id = p_household_id AND is_current = true;

  SELECT COALESCE(SUM(monthly_payment), 0) INTO v_total_payment
  FROM debt_entries
  WHERE household_id = p_household_id AND status = 'active';

  IF v_total_income > 0 THEN
    v_debt_pct := ROUND((v_total_payment / v_total_income) * 100, 1);
  ELSE
    v_debt_pct := 0;
  END IF;

  UPDATE budget_baselines
  SET budget_pct = v_debt_pct,
      is_auto_calculated = (v_total_payment > 0),
      auto_calculated_source = CASE WHEN v_total_payment > 0 THEN 'debt_entries' ELSE NULL END,
      updated_at = now()
  WHERE household_id = p_household_id AND name = 'Chi trả nợ';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
CREATE OR REPLACE FUNCTION trigger_recalculate_debt_budget()
RETURNS trigger AS $$
BEGIN
  PERFORM recalculate_debt_budget(
    CASE WHEN TG_OP = 'DELETE' THEN OLD.household_id ELSE NEW.household_id END
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER debt_budget_recalc
AFTER INSERT OR UPDATE OR DELETE ON debt_entries
FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_debt_budget();
```

### 3.4 Set behavior_type from category (trigger)

```sql
CREATE OR REPLACE FUNCTION set_transaction_behavior_type()
RETURNS trigger AS $$
BEGIN
  IF NEW.category_id IS NOT NULL THEN
    SELECT default_behavior_type INTO NEW.behavior_type
    FROM categories WHERE id = NEW.category_id;
  END IF;

  -- Force exclude_from_budget for these types
  IF NEW.transaction_type IN ('fund_withdrawal', 'internal_transfer') THEN
    NEW.exclude_from_budget_report := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tx_set_behavior_type
BEFORE INSERT ON transactions
FOR EACH ROW EXECUTE FUNCTION set_transaction_behavior_type();
```

### 3.5 Freedom Fund Monthly Reset (Edge Function / cron)

```sql
-- Called by Supabase scheduled Edge Function on 1st of each month at 00:01
CREATE OR REPLACE FUNCTION reset_freedom_funds()
RETURNS void AS $$
BEGIN
  UPDATE funds
  SET current_balance = 0, updated_at = now()
  WHERE fund_type = 'freedom' AND reset_monthly = true AND is_active = true;
  
  -- Log reset transactions
  INSERT INTO fund_transactions (
    household_id, fund_id, transaction_type, amount, direction,
    balance_after, description, transaction_date, is_automatic
  )
  SELECT household_id, id, 'reset', current_balance, 'out',
    0, 'Auto reset đầu tháng', CURRENT_DATE, true
  FROM funds
  WHERE fund_type = 'freedom' AND reset_monthly = true AND is_active = true
    AND current_balance > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 4. ROW LEVEL SECURITY (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE households ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE funds ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE net_worth_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimated_expenses ENABLE ROW LEVEL SECURITY;

-- Helper function: get user's household_ids
CREATE OR REPLACE FUNCTION get_user_household_ids()
RETURNS uuid[] AS $$
  SELECT ARRAY(
    SELECT household_id FROM household_members
    WHERE user_id = auth.uid() AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Households: member sees their own household
CREATE POLICY households_select ON households FOR SELECT
  USING (id = ANY(get_user_household_ids()));

CREATE POLICY households_update ON households FOR UPDATE
  USING (id = ANY(get_user_household_ids()));

-- Household data (generic pattern for most tables)
-- Apply to: income_sources, accounts, budget_baselines, transactions,
--           funds, fund_transactions, debt_entries, net_worth_snapshots,
--           scheduled_payments, estimated_expenses
CREATE POLICY select_own_household ON transactions FOR SELECT
  USING (household_id = ANY(get_user_household_ids()));
CREATE POLICY insert_own_household ON transactions FOR INSERT
  WITH CHECK (household_id = ANY(get_user_household_ids()));
CREATE POLICY update_own_household ON transactions FOR UPDATE
  USING (household_id = ANY(get_user_household_ids()));
CREATE POLICY delete_own_household ON transactions FOR DELETE
  USING (household_id = ANY(get_user_household_ids()));

-- Categories: system (all read, no write) + custom (household-scoped)
CREATE POLICY categories_select ON categories FOR SELECT
  USING (household_id IS NULL OR household_id = ANY(get_user_household_ids()));
CREATE POLICY categories_insert ON categories FOR INSERT
  WITH CHECK (household_id = ANY(get_user_household_ids()) AND is_system = false);
CREATE POLICY categories_update ON categories FOR UPDATE
  USING (household_id = ANY(get_user_household_ids()) AND is_system = false);
CREATE POLICY categories_delete ON categories FOR DELETE
  USING (household_id = ANY(get_user_household_ids()) AND is_system = false);
-- System category groups: read only
CREATE POLICY category_groups_select ON category_groups FOR SELECT USING (true);
CREATE POLICY cost_types_select ON cost_types FOR SELECT USING (true);
```

---

## 5. API ENDPOINTS (Next.js App Router)

### Pattern
```
/api/[domain]/route.ts
Auth: all routes require Supabase session
Response: { data, error }
```

### Endpoints

```
GET    /api/household                    → get current household + members
POST   /api/household                    → create/update household
POST   /api/household/invite             → send invitation email
POST   /api/household/invite/[token]/accept → accept invitation

GET    /api/income-sources               → list by household
POST   /api/income-sources               → create (SCD Type 2 aware)
PUT    /api/income-sources/[id]          → update (creates new record if amount changes)

GET    /api/accounts                     → list active accounts
POST   /api/accounts                     → create
PUT    /api/accounts/[id]               → update
DELETE /api/accounts/[id]               → soft delete (is_active=false)

GET    /api/categories                   → list (system + household custom, active only)
POST   /api/categories                   → create custom (is_system=false enforced)
PUT    /api/categories/[id]             → update (block if is_system=true)
DELETE /api/categories/[id]             → soft/hard delete (BR-CA-003 logic)

GET    /api/budget                       → list baselines + current month actuals
PUT    /api/budget/[id]                 → update pct (system: pct only; custom: full)
POST   /api/budget/override             → set monthly override
POST   /api/budget/custom               → create custom budget line

GET    /api/transactions?month=YYYY-MM  → list by month
POST   /api/transactions                → create (triggers behavior_type, exclude_from_budget)
PUT    /api/transactions/[id]           → update
DELETE /api/transactions/[id]           → hard delete
POST   /api/transactions/transfer       → internal transfer (creates 2 records)

GET    /api/funds                        → list with balance, progress
POST   /api/funds                        → create
PUT    /api/funds/[id]                  → update settings
POST   /api/funds/[id]/contribute       → RPC: fund_contribute
POST   /api/funds/[id]/withdraw         → RPC: fund_withdraw
POST   /api/funds/[id]/release          → monthly_buffer: mark released

GET    /api/debt                         → list debt entries
POST   /api/debt                         → create (triggers recalculate_debt_budget)
PUT    /api/debt/[id]                   → update (triggers recalculate_debt_budget)
PATCH  /api/debt/[id]/payoff            → mark paid off (triggers milestone notification)

GET    /api/net-worth?month=YYYY-MM     → get snapshot
POST   /api/net-worth                    → upsert snapshot

GET    /api/scheduled-payments           → list
POST   /api/scheduled-payments          → create
PUT    /api/scheduled-payments/[id]     → update
PATCH  /api/scheduled-payments/[id]/paid → mark paid + advance next_due_date

GET    /api/estimated-expenses           → list
POST   /api/estimated-expenses          → create
PUT    /api/estimated-expenses/[id]     → update

GET    /api/dashboard?month=YYYY-MM     → aggregated dashboard data
GET    /api/reports?month=YYYY-MM&tab=spending|income|budget|funds → report data
```

---

## 6. KEY BUSINESS LOGIC (TypeScript)

### 6.1 Dashboard Data Query

```typescript
// Single query for dashboard performance target < 800ms
async function getDashboardData(householdId: string, month: string) {
  const { from, to } = monthRange(month); // helper: first/last day of month

  const [txResult, budgetResult, fundsResult, incomeResult] = await Promise.all([
    // All non-excluded transactions this month
    supabase.from('transactions')
      .select('id, amount, direction, behavior_type, category_id, transaction_date, description, accounts(name), categories(name, category_groups(name, color))')
      .eq('household_id', householdId)
      .eq('exclude_from_budget_report', false)
      .gte('transaction_date', from)
      .lte('transaction_date', to),
    
    // Budget baselines with actuals
    supabase.rpc('get_budget_with_actuals', { p_household_id: householdId, p_month: month }),
    
    // All active funds
    supabase.from('funds').select('*').eq('household_id', householdId).eq('is_active', true),
    
    // Current income sources
    supabase.from('income_sources').select('monthly_amount').eq('household_id', householdId).eq('is_current', true)
  ]);

  const transactions = txResult.data ?? [];
  const totalIncome = transactions.filter(t => t.direction === 'in').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.direction === 'out').reduce((s, t) => s + t.amount, 0);
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome * 100).toFixed(1) : '0';

  return { totalIncome, totalExpense, savingsRate, transactions, budget: budgetResult.data, funds: fundsResult.data };
}
```

### 6.2 Report: Budget vs Actual SQL

```sql
-- get_budget_with_actuals RPC
CREATE OR REPLACE FUNCTION get_budget_with_actuals(
  p_household_id uuid,
  p_month        text  -- 'YYYY-MM'
) RETURNS TABLE (
  budget_id       uuid,
  budget_name     text,
  budget_pct      numeric,
  budget_amount   numeric,
  actual_amount   numeric,
  deviation       numeric,
  status          text -- 'safe'|'warning'|'danger'
) AS $$
DECLARE
  v_month_start date := (p_month || '-01')::date;
  v_month_end   date := (date_trunc('month', v_month_start) + interval '1 month - 1 day')::date;
  v_income      numeric;
BEGIN
  SELECT COALESCE(SUM(monthly_amount), 0) INTO v_income
  FROM income_sources WHERE household_id = p_household_id AND is_current = true;

  RETURN QUERY
  SELECT
    bb.id,
    bb.name,
    COALESCE(bo.override_pct, bb.budget_pct) AS budget_pct,
    ROUND(v_income * COALESCE(bo.override_pct, bb.budget_pct) / 100) AS budget_amount,
    COALESCE(SUM(t.amount) FILTER (WHERE t.direction = 'out'), 0) AS actual_amount,
    ROUND(v_income * COALESCE(bo.override_pct, bb.budget_pct) / 100) - 
      COALESCE(SUM(t.amount) FILTER (WHERE t.direction = 'out'), 0) AS deviation,
    CASE
      WHEN COALESCE(SUM(t.amount) FILTER (WHERE t.direction = 'out'), 0) > 
           ROUND(v_income * COALESCE(bo.override_pct, bb.budget_pct) / 100) THEN 'danger'
      WHEN COALESCE(SUM(t.amount) FILTER (WHERE t.direction = 'out'), 0) > 
           ROUND(v_income * COALESCE(bo.override_pct, bb.budget_pct) / 100 * 0.8) THEN 'warning'
      ELSE 'safe'
    END AS status
  FROM budget_baselines bb
  LEFT JOIN budget_overrides bo ON bo.budget_baseline_id = bb.id AND bo.month = v_month_start
  LEFT JOIN transactions t ON t.household_id = p_household_id
    AND t.transaction_date BETWEEN v_month_start AND v_month_end
    AND t.exclude_from_budget_report = false
    AND t.category_id = ANY(
      SELECT c.id FROM categories c
      WHERE c.group_id = ANY(bb.linked_category_group_ids::uuid[])
    )
  WHERE bb.household_id = p_household_id
  GROUP BY bb.id, bb.name, bb.budget_pct, bo.override_pct
  ORDER BY bb.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 7. SEED DATA SPEC

### 7.1 Cost Types (7 system rows)

```sql
INSERT INTO cost_types (code, display_name, display_name_vi, sort_order) VALUES
('income',              'Income',             'Thu nhập',              0),
('fixed',               'Fixed costs',        'Chi phí cố định',       1),
('variable',            'Variable costs',     'Chi phí phát sinh',     2),
('wasteful',            'Discretionary',      'Chi phí lãng phí',      3),
('debt_repayment',      'Debt repayment',     'Chi trả nợ',            4),
('savings_investment',  'Savings & Investment','Tiết kiệm & Đầu tư',   5),
('loan',                'Loan',               'Vay nợ',                6);
```

### 7.2 System Category Groups (20 groups)

```sql
-- Income
('Thu nhập', income, '#22C55E'),
-- Fixed costs groups
('Thực phẩm & Ăn uống hàng ngày', fixed, '#10B981'),
('Nhà ở & Điện nước', fixed, '#3B82F6'),
('Phương tiện xe cơ cố định', fixed, '#F59E0B'),
('Dịch vụ', fixed, '#8B5CF6'),
('Minnie', fixed, '#EC4899'),
('Giáo dục', fixed, '#A855F7'),
('Work & Tools', fixed, '#6366F1'),
-- Variable costs groups
('Chăm sóc cá nhân', variable, '#EF4444'),
('Quà tặng & Hiếu hỉ', variable, '#84CC16'),
('Phương tiện xe cơ phát sinh', variable, '#FB923C'),
('Thiết bị/Đồ dùng/Nhà cửa', variable, '#06B6D4'),
-- Wasteful groups
('Ăn uống ngoài', wasteful, '#DC2626'),
('Giải trí', wasteful, '#9333EA'),
('Chênh lệch ghi chép', wasteful, '#78716C'),
-- Debt
('Chi trả nợ', debt_repayment, '#78716C'),
-- Savings
('Tiết kiệm', savings_investment, '#059669'),
('Đầu tư', savings_investment, '#0284C7'),
-- Loan
('Vay nợ', loan, '#B45309'),
-- Budget buffer (no categories, budget allocation only)
('Dự trù tháng kế tiếp', fixed, '#94A3B8')
```

### 7.3 System Budget Lines (18 lines, total = 100%)

```sql
-- Insert for each new household during onboarding (copy from budgetTemplate.ts)
('Thực phẩm & Ăn uống hàng ngày',    15, is_system=true, sort_order=1),
('Nhà ở & Điện nước',                  8, is_system=true, sort_order=2),
('Phương tiện',                         7, is_system=true, sort_order=3),  -- links: Phương tiện xe cơ cố định + phát sinh
('Minnie',                              5, is_system=true, sort_order=4),
('Giáo dục',                            3, is_system=true, sort_order=5),
('Dịch vụ',                             3, is_system=true, sort_order=6),
('Work & Tools',                        2, is_system=true, sort_order=7),
('Chăm sóc cá nhân',                    7, is_system=true, sort_order=8),
('Quà tặng & Hiếu hỉ',                 3, is_system=true, sort_order=9),
('Thiết bị/Đồ dùng/Nhà cửa',           3, is_system=true, sort_order=10),
('Ăn uống ngoài',                       4, is_system=true, sort_order=11),
('Giải trí',                             3, is_system=true, sort_order=12),
('Chi trả nợ',                          8, is_system=true, is_auto_calculated=true, sort_order=13),
('Dự trù tháng kế tiếp',              10, is_system=true, sort_order=14),
('Tiết kiệm & Quỹ',                    8, is_system=true, sort_order=15),
('Đầu tư',                              7, is_system=true, sort_order=16),
('Chênh lệch ghi chép',                 2, is_system=true, sort_order=17),
('Vay nợ',                              2, is_system=true, sort_order=18)
-- TOTAL = 100%
```

---

## 8. ENVIRONMENT VARIABLES

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 9. UTILITY FUNCTIONS (TypeScript)

```typescript
// src/lib/utils/date.ts
import { format, startOfMonth, endOfMonth } from 'date-fns'

export const monthRange = (yearMonth: string) => {
  const date = new Date(yearMonth + '-01')
  return {
    from: format(startOfMonth(date), 'yyyy-MM-dd'),
    to: format(endOfMonth(date), 'yyyy-MM-dd'),
  }
}

export const toYearMonth = (date = new Date()) => format(date, 'yyyy-MM')
export const firstDayOfMonth = (yearMonth: string) => yearMonth + '-01'

// src/lib/utils/currency.ts
export const formatVND = (amount: number) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(amount)

// src/lib/utils/budget.ts
export const getBudgetStatus = (actual: number, budget: number): 'safe' | 'warning' | 'danger' => {
  if (actual > budget) return 'danger'
  if (actual > budget * 0.8) return 'warning'
  return 'safe'
}
```
