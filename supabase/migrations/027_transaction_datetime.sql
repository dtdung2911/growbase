-- 027: transaction_date DATE -> timestamptz (giữ giờ:phút cho import v2).
-- Dữ liệu cũ (date, 00:00 VN) cast qua AT TIME ZONE 'Asia/Ho_Chi_Minh'.
-- Đồng thời sửa class bug BETWEEN cắt ngày cuối tháng: mọi predicate theo tháng
-- chuyển sang half-open range [start, next_month_start) tính theo giờ VN.

-- 1. Đổi kiểu cột (cả fund_transactions để ledger quỹ khớp giờ)
ALTER TABLE transactions
  ALTER COLUMN transaction_date TYPE timestamptz
    USING (transaction_date::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  ALTER COLUMN transaction_date SET DEFAULT now();

ALTER TABLE fund_transactions
  ALTER COLUMN transaction_date TYPE timestamptz
    USING (transaction_date::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh'),
  ALTER COLUMN transaction_date SET DEFAULT now();

-- 2. get_budget_with_actuals: half-open range VN thay BETWEEN (bản live từ 024)
CREATE OR REPLACE FUNCTION public.get_budget_with_actuals(p_household_id uuid, p_month text)
 RETURNS TABLE(cost_type_id uuid, cost_type_code text, cost_type_name text, budget_pct numeric, override_pct numeric, effective_pct numeric, budget_amount numeric, actual_amount numeric, remaining numeric, usage_pct numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  v_month_first_day date        := (p_month || '-01')::date;
  v_range_start     timestamptz := v_month_first_day::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh';
  v_range_end       timestamptz := (v_month_first_day + interval '1 month')::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh';
  v_income          numeric;
BEGIN
  IF NOT (p_household_id = ANY(get_user_household_ids())) THEN
    RAISE EXCEPTION 'Access denied: not a member of this household';
  END IF;

  SELECT COALESCE(SUM(amount), 0) INTO v_income
  FROM transactions
  WHERE household_id = p_household_id
    AND transaction_type = 'income'
    AND transaction_date >= v_range_start
    AND transaction_date <  v_range_end;

  IF v_income = 0 THEN
    SELECT COALESCE(SUM(monthly_amount), 0) INTO v_income
    FROM income_sources WHERE household_id = p_household_id AND is_current = true;
  END IF;

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
  LEFT JOIN budget_overrides bo ON bo.budget_baseline_id = bb.id AND bo.month = v_month_first_day
  LEFT JOIN transactions t ON t.household_id = p_household_id
    AND t.transaction_date >= v_range_start
    AND t.transaction_date <  v_range_end
    AND t.exclude_from_budget_report = false
    AND NOT (t.transaction_type = 'expense' AND t.fund_id IS NOT NULL)
    AND t.category_id = ANY(
      SELECT c.id FROM categories c
      WHERE c.group_id = ANY(bb.linked_category_group_ids::uuid[])
    )
  WHERE bb.household_id = p_household_id
  GROUP BY bb.id, bb.name, bb.budget_pct, bo.override_pct, bb.sort_order
  ORDER BY bb.sort_order;
END;
$function$;

-- 3. Widen p_date date -> timestamptz để RPC giữ giờ (không ép về 00:00).
-- Đổi kiểu tham số = đổi chữ ký hàm → phải DROP bản date cũ trước (CREATE OR REPLACE
-- không đổi được kiểu tham số, sẽ tạo overload thừa).
DROP FUNCTION IF EXISTS fund_contribute(uuid, uuid, uuid, numeric, uuid, uuid, text, date);
DROP FUNCTION IF EXISTS fund_withdraw(uuid, uuid, uuid, numeric, uuid, uuid, text, date);
DROP FUNCTION IF EXISTS fund_expense(uuid, uuid, uuid, numeric, uuid, uuid, text, date);
DROP FUNCTION IF EXISTS mark_payment_paid(uuid, uuid, bool, uuid, uuid, uuid, date);

CREATE OR REPLACE FUNCTION fund_contribute(
  p_household_id    uuid,
  p_fund_id         uuid,
  p_member_id       uuid,
  p_amount          numeric,
  p_account_id      uuid,
  p_category_id     uuid,
  p_description     text DEFAULT NULL,
  p_date            timestamptz DEFAULT now()
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

  INSERT INTO transactions (
    household_id, member_id, amount, direction, transaction_type,
    category_id, account_id, fund_id,
    exclude_from_budget_report, description, transaction_date, import_source
  ) VALUES (
    p_household_id, p_member_id, p_amount, 'out', 'fund_contribution',
    p_category_id, p_account_id, p_fund_id,
    false, COALESCE(p_description, 'Nạp quỹ'), p_date, 'manual'
  ) RETURNING id INTO v_tx_id;

  INSERT INTO fund_transactions (
    household_id, fund_id, transaction_type, amount, direction,
    balance_after, linked_transaction_id, description, transaction_date
  ) VALUES (
    p_household_id, p_fund_id, 'contribution', p_amount, 'in',
    v_balance_after, v_tx_id, p_description, p_date
  );

  UPDATE funds SET current_balance = v_balance_after, updated_at = now()
  WHERE id = p_fund_id;

  RETURN v_tx_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

CREATE OR REPLACE FUNCTION fund_withdraw(
  p_household_id    uuid,
  p_fund_id         uuid,
  p_member_id       uuid,
  p_amount          numeric,
  p_account_id      uuid,
  p_category_id     uuid,
  p_description     text DEFAULT NULL,
  p_date            timestamptz DEFAULT now()
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

CREATE OR REPLACE FUNCTION fund_expense(
  p_household_id uuid,
  p_fund_id uuid,
  p_member_id uuid,
  p_amount numeric,
  p_category_id uuid,
  p_account_id uuid,
  p_description text DEFAULT NULL,
  p_date timestamptz DEFAULT now()
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_balance numeric;
  v_tx_id uuid;
BEGIN
  IF NOT (p_household_id = ANY(get_user_household_ids())) THEN
    RAISE EXCEPTION 'Access denied: not a member of this household';
  END IF;

  SELECT current_balance INTO v_balance
  FROM funds WHERE id = p_fund_id AND household_id = p_household_id AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Fund not found'; END IF;

  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'Số dư quỹ không đủ (hiện có %)', v_balance;
  END IF;

  INSERT INTO transactions (
    household_id, member_id, amount, direction, transaction_type,
    category_id, account_id, fund_id,
    exclude_from_budget_report, description, transaction_date, import_source
  ) VALUES (
    p_household_id, p_member_id, p_amount, 'out', 'expense',
    p_category_id, p_account_id, p_fund_id,
    false, COALESCE(NULLIF(p_description, ''), 'Chi từ quỹ'), p_date, 'manual'
  ) RETURNING id INTO v_tx_id;

  INSERT INTO fund_transactions (
    household_id, fund_id, transaction_type, amount, direction,
    balance_after, linked_transaction_id, description, transaction_date
  ) VALUES (
    p_household_id, p_fund_id, 'expense', p_amount, 'out',
    v_balance - p_amount, v_tx_id, COALESCE(NULLIF(p_description, ''), 'Chi từ quỹ'), p_date
  );

  UPDATE funds SET current_balance = v_balance - p_amount, updated_at = now()
  WHERE id = p_fund_id;

  RETURN v_tx_id;
END;
$$;

CREATE OR REPLACE FUNCTION mark_payment_paid(
  p_payment_id         uuid,
  p_household_id       uuid,
  p_create_transaction bool DEFAULT false,
  p_account_id         uuid DEFAULT NULL,
  p_category_id        uuid DEFAULT NULL,
  p_member_id          uuid DEFAULT NULL,
  p_date               timestamptz DEFAULT now()
) RETURNS uuid AS $$
DECLARE
  v_payment   scheduled_payments%ROWTYPE;
  v_new_date  date;
  v_tx_id     uuid;
BEGIN
  IF NOT (p_household_id = ANY(get_user_household_ids())) THEN
    RAISE EXCEPTION 'Access denied: not a member of this household';
  END IF;

  SELECT * INTO v_payment
  FROM scheduled_payments
  WHERE id = p_payment_id AND household_id = p_household_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  IF v_payment.status != 'active' THEN
    RAISE EXCEPTION 'Payment is not active';
  END IF;

  CASE v_payment.period
    WHEN 'monthly'   THEN v_new_date := v_payment.next_due_date + interval '1 month';
    WHEN 'quarterly' THEN v_new_date := v_payment.next_due_date + interval '3 months';
    WHEN 'yearly'    THEN v_new_date := v_payment.next_due_date + interval '1 year';
  END CASE;

  UPDATE scheduled_payments
  SET next_due_date = v_new_date
  WHERE id = p_payment_id;

  IF p_create_transaction = true THEN
    INSERT INTO transactions (
      household_id, member_id, amount, direction, transaction_type,
      category_id, account_id, description, transaction_date, import_source
    ) VALUES (
      p_household_id, p_member_id, v_payment.amount, 'out', 'expense',
      p_category_id, p_account_id,
      'Thanh toan ' || v_payment.name,
      p_date, 'manual'
    ) RETURNING id INTO v_tx_id;

    RETURN v_tx_id;
  END IF;

  RETURN p_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
