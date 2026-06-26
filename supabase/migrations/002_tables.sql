-- Description: S0 — 17 tables theo đúng thứ tự FK (Phần B architect design).
-- Tiền dùng numeric(15,0). transactions có CHECK chk_no_unusual_outflow (BLOCKER #1).
-- net_worth_snapshots.discrepancy GENERATED. Indexes spec 2.6 + bổ sung từ architect design.
-- Không cần ALTER TABLE: FK fund_transactions.linked_transaction_id một chiều,
-- transactions tạo trước fund_transactions là đủ.

BEGIN;

-- 1. Households
CREATE TABLE IF NOT EXISTS households (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 text NOT NULL,
  household_type       household_type NOT NULL DEFAULT 'personal',
  currency             currency_code NOT NULL DEFAULT 'VND',
  onboarding_completed bool NOT NULL DEFAULT false,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

-- 2. Household Members
CREATE TABLE IF NOT EXISTS household_members (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id   uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id        uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name   text NOT NULL,
  role           member_role NOT NULL DEFAULT 'member',
  joined_at      timestamptz DEFAULT now(),
  is_active      bool NOT NULL DEFAULT true,
  UNIQUE(household_id, user_id)
);

-- 3. Household Invitations
CREATE TABLE IF NOT EXISTS household_invitations (
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

-- 4. Income Sources (SCD Type 2)
CREATE TABLE IF NOT EXISTS income_sources (
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

-- 5. Accounts
CREATE TABLE IF NOT EXISTS accounts (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id   uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  member_id      uuid REFERENCES household_members(id),
  name           text NOT NULL,
  bank_name      text,
  account_type   account_type NOT NULL DEFAULT 'bank',
  owner_name     text,
  is_credit_card bool NOT NULL DEFAULT false,
  discount_rate  numeric(4,2) DEFAULT 1.00,
  is_active      bool NOT NULL DEFAULT true,
  color          text DEFAULT '#3B82F6',
  sort_order     int DEFAULT 0,
  created_at     timestamptz DEFAULT now()
);

-- 6. Cost Types (system templates + per-household copies)
CREATE TABLE IF NOT EXISTS cost_types (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    uuid REFERENCES households(id) ON DELETE CASCADE,
  code            text NOT NULL,
  display_name    text NOT NULL,
  display_name_vi text NOT NULL,
  sort_order      int DEFAULT 0,
  is_system       bool NOT NULL DEFAULT true,
  created_at      timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS cost_types_system_code ON cost_types (code) WHERE household_id IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS cost_types_household_code ON cost_types (household_id, code) WHERE household_id IS NOT NULL;

-- 7. Category Groups
CREATE TABLE IF NOT EXISTS category_groups (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id   uuid REFERENCES households(id),       -- NULL = system group
  cost_type_id   uuid NOT NULL REFERENCES cost_types(id),
  name           text NOT NULL,
  icon           text,
  color          text DEFAULT '#6B7280',
  is_system      bool NOT NULL DEFAULT false,
  sort_order     int DEFAULT 0,
  created_at     timestamptz DEFAULT now()
);

-- 8. Categories
CREATE TABLE IF NOT EXISTS categories (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id           uuid REFERENCES households(id),  -- NULL = system category
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

-- 9. Funds
CREATE TABLE IF NOT EXISTS funds (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id         uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name                 text NOT NULL,
  description          text,
  fund_type            fund_type NOT NULL,
  current_balance      numeric(15,0) NOT NULL DEFAULT 0,
  target_amount        numeric(15,0),
  monthly_contribution numeric(15,0) DEFAULT 0,
  contribution_day     int DEFAULT 1 CHECK (contribution_day BETWEEN 1 AND 28),
  expected_return_rate numeric(5,2),
  target_date          date,
  target_months_expense int,
  reset_monthly        bool DEFAULT false,
  release_trigger      text DEFAULT 'manual',
  released_at          timestamptz,
  color                text DEFAULT '#10B981',
  icon                 text,
  is_active            bool NOT NULL DEFAULT true,
  priority             int DEFAULT 5,
  per_member           bool DEFAULT false,
  amount_per_member    numeric(15,0),
  sort_order           int DEFAULT 0,
  created_at           timestamptz DEFAULT now(),
  updated_at           timestamptz DEFAULT now()
);

-- 10. Debt Entries
CREATE TABLE IF NOT EXISTS debt_entries (
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

-- 11. Budget Baselines
CREATE TABLE IF NOT EXISTS budget_baselines (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id              uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name                      text NOT NULL,
  description               text,
  linked_category_group_ids uuid[] DEFAULT '{}',
  budget_pct                numeric(5,2) NOT NULL DEFAULT 0 CHECK (budget_pct >= 0 AND budget_pct <= 100),
  is_system                 bool NOT NULL DEFAULT false,
  is_auto_calculated        bool NOT NULL DEFAULT false,
  auto_calculated_source    text,
  effective_from            date NOT NULL DEFAULT CURRENT_DATE,
  sort_order                int DEFAULT 0,
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now()
);

-- 12. Budget Month Overrides
CREATE TABLE IF NOT EXISTS budget_overrides (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id        uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  budget_baseline_id  uuid NOT NULL REFERENCES budget_baselines(id) ON DELETE CASCADE,
  month               date NOT NULL,
  override_pct        numeric(5,2) NOT NULL,
  created_at          timestamptz DEFAULT now(),
  UNIQUE(budget_baseline_id, month)
);

-- 13. Transactions (refs: funds, debt_entries, categories, accounts, household_members)
CREATE TABLE IF NOT EXISTS transactions (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id               uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  member_id                  uuid REFERENCES household_members(id),
  amount                     numeric(15,0) NOT NULL CHECK (amount > 0),
  direction                  direction NOT NULL,
  transaction_type           transaction_type NOT NULL DEFAULT 'expense',
  category_id                uuid REFERENCES categories(id),
  account_id                 uuid REFERENCES accounts(id),
  fund_id                    uuid REFERENCES funds(id),
  debt_entry_id              uuid REFERENCES debt_entries(id),
  behavior_type              behavior_type,  -- SET by trigger from category.default_behavior_type
  is_unusual_income          bool NOT NULL DEFAULT false,
  exclude_from_budget_report bool NOT NULL DEFAULT false,
  description                text,
  transaction_date           date NOT NULL DEFAULT CURRENT_DATE,
  import_source              import_source NOT NULL DEFAULT 'manual',
  is_duplicate               bool NOT NULL DEFAULT false,
  created_at                 timestamptz DEFAULT now(),
  updated_at                 timestamptz DEFAULT now(),
  -- BLOCKER #1 (BR-TX-003): unusual income chỉ tồn tại ở chiều 'in'
  CONSTRAINT chk_no_unusual_outflow CHECK (NOT (direction = 'out' AND is_unusual_income = true))
);

CREATE INDEX IF NOT EXISTS idx_tx_household_date ON transactions(household_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_tx_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_tx_budget_filter ON transactions(household_id, transaction_date, exclude_from_budget_report);

-- 14. Fund Transactions (refs transactions — OK vì transactions tạo trước)
CREATE TABLE IF NOT EXISTS fund_transactions (
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

CREATE INDEX IF NOT EXISTS idx_fund_tx_fund ON fund_transactions(fund_id, transaction_date DESC);

-- 15. Net Worth Snapshots
CREATE TABLE IF NOT EXISTS net_worth_snapshots (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id     uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  snapshot_month   date NOT NULL,
  items            jsonb NOT NULL DEFAULT '[]',
  total_recorded   numeric(15,0) NOT NULL DEFAULT 0,
  total_system     numeric(15,0) NOT NULL DEFAULT 0,
  discrepancy      numeric(15,0) GENERATED ALWAYS AS (total_recorded - total_system) STORED,
  notes            text,
  created_at       timestamptz DEFAULT now(),
  UNIQUE(household_id, snapshot_month)
);

-- 16. Scheduled Payments
CREATE TABLE IF NOT EXISTS scheduled_payments (
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

-- 17. Estimated Expenses
CREATE TABLE IF NOT EXISTS estimated_expenses (
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

-- Supplementary indexes (architect design)
CREATE INDEX IF NOT EXISTS idx_funds_household ON funds(household_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_household_members_user ON household_members(user_id) WHERE is_active = true;

COMMIT;
