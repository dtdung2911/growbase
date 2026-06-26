-- Description: S0 — Enable RLS trên TẤT CẢ 17 tables + policies.
-- Generic own_household pattern dùng get_user_household_ids() (định nghĩa ở 003).
-- households (+insert/delete onboarding), household_members (owner-scoped write),
-- household_invitations (own_household), categories/category_groups/cost_types (system read).
-- BLOCKER #4 — Phần A.4 architect design.

BEGIN;

-- ============================================================
-- Enable RLS trên tất cả tables (gồm bảng spec bỏ sót)
-- ============================================================
ALTER TABLE households            ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members     ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_sources        ENABLE ROW LEVEL SECURITY;
ALTER TABLE accounts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_types            ENABLE ROW LEVEL SECURITY;
ALTER TABLE category_groups       ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories            ENABLE ROW LEVEL SECURITY;
ALTER TABLE funds                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE fund_transactions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_entries          ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_baselines      ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_overrides      ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions          ENABLE ROW LEVEL SECURITY;
ALTER TABLE net_worth_snapshots   ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_payments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE estimated_expenses    ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- households — select + update (spec) + insert (authed) + delete (owner only)
-- ============================================================
DROP POLICY IF EXISTS households_select ON households;
CREATE POLICY households_select ON households FOR SELECT
  USING (id = ANY(get_user_household_ids()));

DROP POLICY IF EXISTS households_update ON households;
CREATE POLICY households_update ON households FOR UPDATE
  USING (id = ANY(get_user_household_ids()));

DROP POLICY IF EXISTS households_insert ON households;
CREATE POLICY households_insert ON households FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS households_delete ON households;
CREATE POLICY households_delete ON households FOR DELETE
  USING (id IN (
    SELECT household_id FROM household_members
    WHERE user_id = auth.uid() AND role = 'owner' AND is_active = true));

-- ============================================================
-- household_members — Phần A.4.1 (owner-scoped write)
-- ============================================================
DROP POLICY IF EXISTS hm_select ON household_members;
CREATE POLICY hm_select ON household_members FOR SELECT
  USING (household_id = ANY(get_user_household_ids()));

DROP POLICY IF EXISTS hm_insert ON household_members;
CREATE POLICY hm_insert ON household_members FOR INSERT
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS hm_update ON household_members;
CREATE POLICY hm_update ON household_members FOR UPDATE
  USING (household_id IN (
    SELECT household_id FROM household_members
    WHERE user_id = auth.uid() AND role = 'owner' AND is_active = true));

DROP POLICY IF EXISTS hm_delete ON household_members;
CREATE POLICY hm_delete ON household_members FOR DELETE
  USING (household_id IN (
    SELECT household_id FROM household_members
    WHERE user_id = auth.uid() AND role = 'owner' AND is_active = true));

-- ============================================================
-- household_invitations — Phần A.4.2 (own_household pattern)
-- ============================================================
DROP POLICY IF EXISTS hi_select ON household_invitations;
CREATE POLICY hi_select ON household_invitations FOR SELECT
  USING (household_id = ANY(get_user_household_ids()));

DROP POLICY IF EXISTS hi_insert ON household_invitations;
CREATE POLICY hi_insert ON household_invitations FOR INSERT
  WITH CHECK (household_id = ANY(get_user_household_ids()));

DROP POLICY IF EXISTS hi_update ON household_invitations;
CREATE POLICY hi_update ON household_invitations FOR UPDATE
  USING (household_id = ANY(get_user_household_ids()));

DROP POLICY IF EXISTS hi_delete ON household_invitations;
CREATE POLICY hi_delete ON household_invitations FOR DELETE
  USING (household_id = ANY(get_user_household_ids()));

-- ============================================================
-- Generic own_household pattern (select/insert/update/delete)
-- Áp dụng: income_sources, accounts, funds, fund_transactions, debt_entries,
--          budget_baselines, budget_overrides, transactions,
--          net_worth_snapshots, scheduled_payments, estimated_expenses
-- ============================================================

-- income_sources
DROP POLICY IF EXISTS income_sources_select ON income_sources;
CREATE POLICY income_sources_select ON income_sources FOR SELECT
  USING (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS income_sources_insert ON income_sources;
CREATE POLICY income_sources_insert ON income_sources FOR INSERT
  WITH CHECK (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS income_sources_update ON income_sources;
CREATE POLICY income_sources_update ON income_sources FOR UPDATE
  USING (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS income_sources_delete ON income_sources;
CREATE POLICY income_sources_delete ON income_sources FOR DELETE
  USING (household_id = ANY(get_user_household_ids()));

-- accounts
DROP POLICY IF EXISTS accounts_select ON accounts;
CREATE POLICY accounts_select ON accounts FOR SELECT
  USING (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS accounts_insert ON accounts;
CREATE POLICY accounts_insert ON accounts FOR INSERT
  WITH CHECK (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS accounts_update ON accounts;
CREATE POLICY accounts_update ON accounts FOR UPDATE
  USING (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS accounts_delete ON accounts;
CREATE POLICY accounts_delete ON accounts FOR DELETE
  USING (household_id = ANY(get_user_household_ids()));

-- funds
DROP POLICY IF EXISTS funds_select ON funds;
CREATE POLICY funds_select ON funds FOR SELECT
  USING (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS funds_insert ON funds;
CREATE POLICY funds_insert ON funds FOR INSERT
  WITH CHECK (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS funds_update ON funds;
CREATE POLICY funds_update ON funds FOR UPDATE
  USING (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS funds_delete ON funds;
CREATE POLICY funds_delete ON funds FOR DELETE
  USING (household_id = ANY(get_user_household_ids()));

-- fund_transactions
DROP POLICY IF EXISTS fund_transactions_select ON fund_transactions;
CREATE POLICY fund_transactions_select ON fund_transactions FOR SELECT
  USING (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS fund_transactions_insert ON fund_transactions;
CREATE POLICY fund_transactions_insert ON fund_transactions FOR INSERT
  WITH CHECK (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS fund_transactions_update ON fund_transactions;
CREATE POLICY fund_transactions_update ON fund_transactions FOR UPDATE
  USING (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS fund_transactions_delete ON fund_transactions;
CREATE POLICY fund_transactions_delete ON fund_transactions FOR DELETE
  USING (household_id = ANY(get_user_household_ids()));

-- debt_entries
DROP POLICY IF EXISTS debt_entries_select ON debt_entries;
CREATE POLICY debt_entries_select ON debt_entries FOR SELECT
  USING (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS debt_entries_insert ON debt_entries;
CREATE POLICY debt_entries_insert ON debt_entries FOR INSERT
  WITH CHECK (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS debt_entries_update ON debt_entries;
CREATE POLICY debt_entries_update ON debt_entries FOR UPDATE
  USING (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS debt_entries_delete ON debt_entries;
CREATE POLICY debt_entries_delete ON debt_entries FOR DELETE
  USING (household_id = ANY(get_user_household_ids()));

-- budget_baselines
DROP POLICY IF EXISTS budget_baselines_select ON budget_baselines;
CREATE POLICY budget_baselines_select ON budget_baselines FOR SELECT
  USING (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS budget_baselines_insert ON budget_baselines;
CREATE POLICY budget_baselines_insert ON budget_baselines FOR INSERT
  WITH CHECK (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS budget_baselines_update ON budget_baselines;
CREATE POLICY budget_baselines_update ON budget_baselines FOR UPDATE
  USING (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS budget_baselines_delete ON budget_baselines;
CREATE POLICY budget_baselines_delete ON budget_baselines FOR DELETE
  USING (household_id = ANY(get_user_household_ids()));

-- budget_overrides
DROP POLICY IF EXISTS budget_overrides_select ON budget_overrides;
CREATE POLICY budget_overrides_select ON budget_overrides FOR SELECT
  USING (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS budget_overrides_insert ON budget_overrides;
CREATE POLICY budget_overrides_insert ON budget_overrides FOR INSERT
  WITH CHECK (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS budget_overrides_update ON budget_overrides;
CREATE POLICY budget_overrides_update ON budget_overrides FOR UPDATE
  USING (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS budget_overrides_delete ON budget_overrides;
CREATE POLICY budget_overrides_delete ON budget_overrides FOR DELETE
  USING (household_id = ANY(get_user_household_ids()));

-- transactions
DROP POLICY IF EXISTS transactions_select ON transactions;
CREATE POLICY transactions_select ON transactions FOR SELECT
  USING (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS transactions_insert ON transactions;
CREATE POLICY transactions_insert ON transactions FOR INSERT
  WITH CHECK (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS transactions_update ON transactions;
CREATE POLICY transactions_update ON transactions FOR UPDATE
  USING (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS transactions_delete ON transactions;
CREATE POLICY transactions_delete ON transactions FOR DELETE
  USING (household_id = ANY(get_user_household_ids()));

-- net_worth_snapshots
DROP POLICY IF EXISTS net_worth_snapshots_select ON net_worth_snapshots;
CREATE POLICY net_worth_snapshots_select ON net_worth_snapshots FOR SELECT
  USING (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS net_worth_snapshots_insert ON net_worth_snapshots;
CREATE POLICY net_worth_snapshots_insert ON net_worth_snapshots FOR INSERT
  WITH CHECK (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS net_worth_snapshots_update ON net_worth_snapshots;
CREATE POLICY net_worth_snapshots_update ON net_worth_snapshots FOR UPDATE
  USING (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS net_worth_snapshots_delete ON net_worth_snapshots;
CREATE POLICY net_worth_snapshots_delete ON net_worth_snapshots FOR DELETE
  USING (household_id = ANY(get_user_household_ids()));

-- scheduled_payments
DROP POLICY IF EXISTS scheduled_payments_select ON scheduled_payments;
CREATE POLICY scheduled_payments_select ON scheduled_payments FOR SELECT
  USING (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS scheduled_payments_insert ON scheduled_payments;
CREATE POLICY scheduled_payments_insert ON scheduled_payments FOR INSERT
  WITH CHECK (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS scheduled_payments_update ON scheduled_payments;
CREATE POLICY scheduled_payments_update ON scheduled_payments FOR UPDATE
  USING (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS scheduled_payments_delete ON scheduled_payments;
CREATE POLICY scheduled_payments_delete ON scheduled_payments FOR DELETE
  USING (household_id = ANY(get_user_household_ids()));

-- estimated_expenses
DROP POLICY IF EXISTS estimated_expenses_select ON estimated_expenses;
CREATE POLICY estimated_expenses_select ON estimated_expenses FOR SELECT
  USING (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS estimated_expenses_insert ON estimated_expenses;
CREATE POLICY estimated_expenses_insert ON estimated_expenses FOR INSERT
  WITH CHECK (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS estimated_expenses_update ON estimated_expenses;
CREATE POLICY estimated_expenses_update ON estimated_expenses FOR UPDATE
  USING (household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS estimated_expenses_delete ON estimated_expenses;
CREATE POLICY estimated_expenses_delete ON estimated_expenses FOR DELETE
  USING (household_id = ANY(get_user_household_ids()));

-- ============================================================
-- categories — system (read all, no write) + custom (household-scoped)
-- BR-SY-001: is_system=true bất biến → write chỉ cho is_system=false
-- ============================================================
DROP POLICY IF EXISTS categories_select ON categories;
CREATE POLICY categories_select ON categories FOR SELECT
  USING (household_id IS NULL OR household_id = ANY(get_user_household_ids()));
DROP POLICY IF EXISTS categories_insert ON categories;
CREATE POLICY categories_insert ON categories FOR INSERT
  WITH CHECK (household_id = ANY(get_user_household_ids()) AND is_system = false);
DROP POLICY IF EXISTS categories_update ON categories;
CREATE POLICY categories_update ON categories FOR UPDATE
  USING (household_id = ANY(get_user_household_ids()) AND is_system = false);
DROP POLICY IF EXISTS categories_delete ON categories;
CREATE POLICY categories_delete ON categories FOR DELETE
  USING (household_id = ANY(get_user_household_ids()) AND is_system = false);

-- ============================================================
-- category_groups — SELECT all (system + own); write chỉ cho custom household group
-- ============================================================
DROP POLICY IF EXISTS category_groups_select ON category_groups;
CREATE POLICY category_groups_select ON category_groups FOR SELECT USING (true);
DROP POLICY IF EXISTS category_groups_insert ON category_groups;
CREATE POLICY category_groups_insert ON category_groups FOR INSERT
  WITH CHECK (household_id = ANY(get_user_household_ids()) AND is_system = false);
DROP POLICY IF EXISTS category_groups_update ON category_groups;
CREATE POLICY category_groups_update ON category_groups FOR UPDATE
  USING (household_id = ANY(get_user_household_ids()) AND is_system = false);
DROP POLICY IF EXISTS category_groups_delete ON category_groups;
CREATE POLICY category_groups_delete ON category_groups FOR DELETE
  USING (household_id = ANY(get_user_household_ids()) AND is_system = false);

-- ============================================================
-- cost_types — system (read all) + household-scoped CRUD
-- ============================================================
DROP POLICY IF EXISTS cost_types_select ON cost_types;
CREATE POLICY cost_types_select ON cost_types FOR SELECT USING (
  household_id IS NULL
  OR household_id = ANY(get_user_household_ids())
);

DROP POLICY IF EXISTS cost_types_insert ON cost_types;
CREATE POLICY cost_types_insert ON cost_types FOR INSERT WITH CHECK (
  household_id = ANY(get_user_household_ids())
);

DROP POLICY IF EXISTS cost_types_update ON cost_types;
CREATE POLICY cost_types_update ON cost_types FOR UPDATE USING (
  household_id = ANY(get_user_household_ids())
);

DROP POLICY IF EXISTS cost_types_delete ON cost_types;
CREATE POLICY cost_types_delete ON cost_types FOR DELETE USING (
  household_id = ANY(get_user_household_ids())
);

COMMIT;
