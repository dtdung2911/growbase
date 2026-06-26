-- Description: S0 — 14 PostgreSQL enum types cho GrowBase.
-- behavior_type bổ sung 'income' (BLOCKER #2 — giữ NOT NULL invariant cho transaction.behavior_type).
-- fund_transactions.transaction_type và scheduled_payments.status dùng text + CHECK (không enum) — xử lý ở 002.

BEGIN;

DO $$ BEGIN
  CREATE TYPE household_type AS ENUM ('personal', 'family');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE currency_code AS ENUM ('VND', 'USD');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE member_role AS ENUM ('owner', 'member', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE account_type AS ENUM ('bank', 'cash', 'savings', 'credit_card', 'investment', 'precious_metal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- BLOCKER #2: thêm 'income' ở cuối để income transactions có behavior_type hợp lệ
DO $$ BEGIN
  CREATE TYPE behavior_type AS ENUM ('fixed', 'variable', 'wasteful', 'debt_repayment', 'savings_investment', 'income', 'loan');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE transaction_type AS ENUM ('income', 'expense', 'internal_transfer', 'fund_contribution', 'fund_withdrawal', 'debt_repayment');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE direction AS ENUM ('in', 'out');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE fund_type AS ENUM ('emergency', 'sinking', 'goal', 'investment', 'freedom');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE import_source AS ENUM ('manual', 'csv', 'gmail');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE debt_type AS ENUM ('bank_loan', 'credit_card', 'mortgage', 'personal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE debt_status AS ENUM ('active', 'paid_off', 'paused');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE scheduled_period AS ENUM ('monthly', 'yearly', 'quarterly');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE expense_status AS ENUM ('planned', 'completed', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
