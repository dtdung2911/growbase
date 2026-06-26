-- Description: Sprint C+D — enhance scheduled_payments, add investment + event_budget tables.

BEGIN;

-- ============================================================
-- Sprint C: scheduled_payments — add expiry_date
-- ============================================================
ALTER TABLE scheduled_payments ADD COLUMN IF NOT EXISTS expiry_date date;

-- ============================================================
-- Sprint D: Investment Portfolio & DCA Tracking
-- ============================================================

-- Investment holdings — current stock/fund positions
CREATE TABLE IF NOT EXISTS investment_holdings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id     uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  stock_code       text NOT NULL,
  weight_pct       numeric(5,2) NOT NULL DEFAULT 0,
  total_invested   numeric(15,0) NOT NULL DEFAULT 0,
  current_value    numeric(15,0) NOT NULL DEFAULT 0,
  notes            text,
  sort_order       int DEFAULT 0,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now(),
  UNIQUE(household_id, stock_code)
);

-- Investment DCA plan — target allocation per stock
CREATE TABLE IF NOT EXISTS investment_dca_plans (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id          uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  stock_code            text NOT NULL,
  target_allocation_pct numeric(5,2) NOT NULL DEFAULT 0,
  is_active             bool NOT NULL DEFAULT true,
  created_at            timestamptz DEFAULT now(),
  UNIQUE(household_id, stock_code)
);

-- Investment purchases — monthly DCA purchase log
CREATE TABLE IF NOT EXISTS investment_purchases (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  holding_id      uuid NOT NULL REFERENCES investment_holdings(id) ON DELETE CASCADE,
  purchase_month  date NOT NULL,
  budget          numeric(15,0) NOT NULL DEFAULT 0,
  price           numeric(15,2) NOT NULL,
  fees            numeric(15,0) NOT NULL DEFAULT 0,
  quantity        numeric(15,4) NOT NULL DEFAULT 0,
  amount          numeric(15,0) NOT NULL DEFAULT 0,
  end_value       numeric(15,0) NOT NULL DEFAULT 0,
  monthly_return  numeric(10,2) NOT NULL DEFAULT 0,
  notes           text,
  created_at      timestamptz DEFAULT now(),
  UNIQUE(holding_id, purchase_month)
);

-- ============================================================
-- Sprint D: Event Budget (Tết, du lịch, etc.)
-- ============================================================

-- Event budgets — special period budgets
CREATE TABLE IF NOT EXISTS event_budgets (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id    uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name            text NOT NULL,
  total_budget    numeric(15,0) NOT NULL DEFAULT 0,
  total_actual    numeric(15,0) NOT NULL DEFAULT 0,
  event_date      date,
  status          text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
  notes           text,
  created_at      timestamptz DEFAULT now()
);

-- Event budget items — line items within an event budget
CREATE TABLE IF NOT EXISTS event_budget_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_budget_id  uuid NOT NULL REFERENCES event_budgets(id) ON DELETE CASCADE,
  name             text NOT NULL,
  planned_amount   numeric(15,0) NOT NULL DEFAULT 0,
  actual_amount    numeric(15,0) NOT NULL DEFAULT 0,
  sort_order       int DEFAULT 0,
  notes            text,
  created_at       timestamptz DEFAULT now()
);

COMMIT;
