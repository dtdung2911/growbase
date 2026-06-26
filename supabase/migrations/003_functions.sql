-- Description: S0 — helper functions, RPCs và triggers.
-- THỨ TỰ QUAN TRỌNG: get_user_household_ids() định nghĩa TRƯỚC TIÊN vì 004_rls.sql dùng nó.
-- Gồm: set_updated_at, get_user_household_ids, fund_contribute, fund_withdraw,
-- recalculate_debt_budget (+trigger), set_transaction_behavior_type (+trigger),
-- reset_freedom_funds, get_budget_with_actuals, get_invitation_by_token, accept_invitation.

BEGIN;

-- ============================================================
-- 0. set_updated_at() — generic trigger để giữ updated_at đồng bộ
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS households_set_updated_at ON households;
CREATE TRIGGER households_set_updated_at
  BEFORE UPDATE ON households
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS debt_entries_set_updated_at ON debt_entries;
CREATE TRIGGER debt_entries_set_updated_at
  BEFORE UPDATE ON debt_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS budget_baselines_set_updated_at ON budget_baselines;
CREATE TRIGGER budget_baselines_set_updated_at
  BEFORE UPDATE ON budget_baselines
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS transactions_set_updated_at ON transactions;
CREATE TRIGGER transactions_set_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS funds_set_updated_at ON funds;
CREATE TRIGGER funds_set_updated_at
  BEFORE UPDATE ON funds
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 1. get_user_household_ids() — dùng bởi RLS (định nghĩa TRƯỚC)
--    SECURITY DEFINER STABLE → không recursion khi gọi trong policy SELECT
-- ============================================================
CREATE OR REPLACE FUNCTION get_user_household_ids()
RETURNS uuid[] AS $$
  SELECT ARRAY(
    SELECT household_id FROM household_members
    WHERE user_id = auth.uid() AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

-- ============================================================
-- 2. fund_contribute() — atomic, lock fund FOR UPDATE
-- ============================================================
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
  IF NOT (p_household_id = ANY(get_user_household_ids())) THEN
    RAISE EXCEPTION 'Access denied: not a member of this household';
  END IF;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ============================================================
-- 3. fund_withdraw() — atomic, lock fund FOR UPDATE, balance check
-- ============================================================
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
  IF NOT (p_household_id = ANY(get_user_household_ids())) THEN
    RAISE EXCEPTION 'Access denied: not a member of this household';
  END IF;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ============================================================
-- 4. recalculate_debt_budget() + trigger function + trigger
-- ============================================================
CREATE OR REPLACE FUNCTION recalculate_debt_budget(p_household_id uuid)
RETURNS void AS $$
DECLARE
  v_total_income  numeric;
  v_total_payment numeric;
  v_debt_pct      numeric;
BEGIN
  IF NOT (p_household_id = ANY(get_user_household_ids())) THEN
    RAISE EXCEPTION 'Access denied: not a member of this household';
  END IF;

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION trigger_recalculate_debt_budget()
RETURNS trigger AS $$
BEGIN
  PERFORM recalculate_debt_budget(
    CASE WHEN TG_OP = 'DELETE' THEN OLD.household_id ELSE NEW.household_id END
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS debt_budget_recalc ON debt_entries;
CREATE TRIGGER debt_budget_recalc
  AFTER INSERT OR UPDATE OR DELETE ON debt_entries
  FOR EACH ROW EXECUTE FUNCTION trigger_recalculate_debt_budget();

-- ============================================================
-- 5. set_transaction_behavior_type() trigger + trigger
--    BR-CA-001 + BR-TX-001/002: gán behavior_type, force exclude_from_budget
-- ============================================================
CREATE OR REPLACE FUNCTION set_transaction_behavior_type()
RETURNS trigger AS $$
BEGIN
  IF NEW.category_id IS NOT NULL THEN
    SELECT default_behavior_type INTO NEW.behavior_type
    FROM categories WHERE id = NEW.category_id;
  END IF;

  -- Force exclude_from_budget cho các loại này (cả 2 legs của internal_transfer)
  IF NEW.transaction_type IN ('fund_withdrawal', 'internal_transfer') THEN
    NEW.exclude_from_budget_report := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS tx_set_behavior_type ON transactions;
CREATE TRIGGER tx_set_behavior_type
  BEFORE INSERT ON transactions
  FOR EACH ROW EXECUTE FUNCTION set_transaction_behavior_type();

-- ============================================================
-- 6. reset_freedom_funds() — cron / Edge Function đầu tháng
-- ============================================================
CREATE OR REPLACE FUNCTION reset_freedom_funds()
RETURNS void AS $$
BEGIN
  -- Log reset transactions TRƯỚC (đọc current_balance hiện tại) rồi mới reset balance
  INSERT INTO fund_transactions (
    household_id, fund_id, transaction_type, amount, direction,
    balance_after, description, transaction_date, is_automatic
  )
  SELECT household_id, id, 'reset', current_balance, 'out',
    0, 'Auto reset đầu tháng', CURRENT_DATE, true
  FROM funds
  WHERE fund_type = 'freedom' AND reset_monthly = true AND is_active = true
    AND current_balance > 0;

  UPDATE funds
  SET current_balance = 0, updated_at = now()
  WHERE fund_type = 'freedom' AND reset_monthly = true AND is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ============================================================
-- 7. get_budget_with_actuals() — Report Budget vs Actual (spec 6.2)
-- ============================================================
CREATE OR REPLACE FUNCTION get_budget_with_actuals(
  p_household_id uuid,
  p_month        text   -- 'YYYY-MM'
) RETURNS TABLE (
  cost_type_id    uuid,
  cost_type_code  text,
  cost_type_name  text,
  budget_pct      numeric,
  override_pct    numeric,
  effective_pct   numeric,
  budget_amount   numeric,
  actual_amount   numeric,
  remaining       numeric,
  usage_pct       numeric
) AS $$
DECLARE
  v_month_start date := (p_month || '-01')::date;
  v_month_end   date := (date_trunc('month', v_month_start) + interval '1 month - 1 day')::date;
  v_income      numeric;
  v_eff_pct     numeric;
  v_budget      numeric;
  v_actual      numeric;
BEGIN
  IF NOT (p_household_id = ANY(get_user_household_ids())) THEN
    RAISE EXCEPTION 'Access denied: not a member of this household';
  END IF;

  SELECT COALESCE(SUM(monthly_amount), 0) INTO v_income
  FROM income_sources WHERE household_id = p_household_id AND is_current = true;

  RETURN QUERY
  SELECT
    bb.id                                        AS cost_type_id,
    ''::text                                     AS cost_type_code,
    bb.name                                      AS cost_type_name,
    bb.budget_pct                                AS budget_pct,
    bo.override_pct                              AS override_pct,
    COALESCE(bo.override_pct, bb.budget_pct)     AS effective_pct,
    ROUND(v_income * COALESCE(bo.override_pct, bb.budget_pct) / 100) AS budget_amount,
    COALESCE(SUM(t.amount) FILTER (WHERE t.direction = 'out'), 0)    AS actual_amount,
    ROUND(v_income * COALESCE(bo.override_pct, bb.budget_pct) / 100) -
      COALESCE(SUM(t.amount) FILTER (WHERE t.direction = 'out'), 0)  AS remaining,
    CASE
      WHEN ROUND(v_income * COALESCE(bo.override_pct, bb.budget_pct) / 100) > 0
      THEN ROUND(
        COALESCE(SUM(t.amount) FILTER (WHERE t.direction = 'out'), 0) * 100.0 /
        ROUND(v_income * COALESCE(bo.override_pct, bb.budget_pct) / 100)
      , 1)
      ELSE 0
    END                                          AS usage_pct
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
  GROUP BY bb.id, bb.name, bb.budget_pct, bo.override_pct, bb.sort_order
  ORDER BY bb.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ============================================================
-- 8. get_invitation_by_token() — đọc invitation trước khi user là member
-- ============================================================
CREATE OR REPLACE FUNCTION get_invitation_by_token(p_token text)
RETURNS TABLE (
  invitation_id  uuid,
  household_id   uuid,
  household_name text,
  email          text,
  display_name   text,
  role           member_role,
  status         invitation_status,
  expires_at     timestamptz
) AS $$
  SELECT i.id, i.household_id, h.name, i.email, i.display_name, i.role, i.status, i.expires_at
  FROM household_invitations i
  JOIN households h ON h.id = i.household_id
  WHERE i.token = p_token;
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public, pg_temp;

-- ============================================================
-- 9. accept_invitation() — atomic: validate token → insert member → mark accepted
-- ============================================================
CREATE OR REPLACE FUNCTION accept_invitation(p_token text, p_user_id uuid)
RETURNS uuid AS $$
DECLARE
  v_inv       household_invitations%ROWTYPE;
  v_member_id uuid;
BEGIN
  -- Security: chỉ chính user đang đăng nhập mới được accept cho mình.
  -- Ngăn impersonation qua PostgREST direct call với p_user_id tuỳ ý.
  IF p_user_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT * INTO v_inv FROM household_invitations WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invitation not found'; END IF;
  IF v_inv.status <> 'pending' THEN RAISE EXCEPTION 'Invitation not pending'; END IF;
  IF v_inv.expires_at < now() THEN
    UPDATE household_invitations SET status = 'expired' WHERE id = v_inv.id;
    RAISE EXCEPTION 'Invitation expired';
  END IF;

  INSERT INTO household_members (household_id, user_id, display_name, role)
  VALUES (v_inv.household_id, p_user_id, v_inv.display_name, v_inv.role)
  ON CONFLICT (household_id, user_id) DO NOTHING
  RETURNING id INTO v_member_id;

  -- Re-accept edge case: member đã tồn tại → ON CONFLICT DO NOTHING không
  -- RETURNING row → v_member_id NULL. Fallback SELECT để trả đúng member id,
  -- giúp API phân biệt "đã là member" với lỗi thật.
  IF v_member_id IS NULL THEN
    SELECT id INTO v_member_id FROM household_members
    WHERE household_id = v_inv.household_id AND user_id = p_user_id;
  END IF;

  UPDATE household_invitations SET status = 'accepted' WHERE id = v_inv.id;
  RETURN v_member_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

COMMIT;
