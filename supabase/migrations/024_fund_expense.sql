-- 024: Chi từ quỹ (story 19-6).
-- Luật: một đồng chỉ ăn budget một lần, tại tháng rời thu nhập.
-- - fund_expense: expense với category user chọn + fund_id, trừ số dư quỹ.
-- - transaction_change_fund_source: đổi nguồn tiền hậu kiểm (gắn/bỏ fund_id).
-- - get_budget_with_actuals: actual bỏ qua expense có fund_id (fund_contribution
--   vẫn tính — nạp quỹ là lúc tiền rời thu nhập).

-- 1. Cho phép loại 'expense' trong lịch sử quỹ
ALTER TABLE fund_transactions DROP CONSTRAINT fund_transactions_transaction_type_check;
ALTER TABLE fund_transactions ADD CONSTRAINT fund_transactions_transaction_type_check
  CHECK (transaction_type = ANY (ARRAY['contribution', 'withdrawal', 'release', 'reset', 'expense']));

-- 2. RPC chi từ quỹ
CREATE OR REPLACE FUNCTION fund_expense(
  p_household_id uuid,
  p_fund_id uuid,
  p_member_id uuid,
  p_amount numeric,
  p_category_id uuid,
  p_account_id uuid,
  p_description text DEFAULT NULL,
  p_date date DEFAULT CURRENT_DATE
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

-- 3. RPC đổi nguồn tiền hậu kiểm (gắn/bỏ fund_id trên expense hiện hữu)
CREATE OR REPLACE FUNCTION transaction_change_fund_source(
  p_household_id uuid,
  p_transaction_id uuid,
  p_fund_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_tx RECORD;
  v_balance numeric;
BEGIN
  IF NOT (p_household_id = ANY(get_user_household_ids())) THEN
    RAISE EXCEPTION 'Access denied: not a member of this household';
  END IF;

  SELECT id, amount, fund_id, transaction_type, description, transaction_date INTO v_tx
  FROM transactions
  WHERE id = p_transaction_id AND household_id = p_household_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Giao dịch không tồn tại'; END IF;

  IF v_tx.transaction_type <> 'expense' THEN
    RAISE EXCEPTION 'Chỉ đổi nguồn tiền cho giao dịch chi tiêu';
  END IF;

  IF v_tx.fund_id IS NOT DISTINCT FROM p_fund_id THEN RETURN; END IF;

  -- Hoàn tiền quỹ cũ
  IF v_tx.fund_id IS NOT NULL THEN
    UPDATE funds SET current_balance = current_balance + v_tx.amount, updated_at = now()
    WHERE id = v_tx.fund_id AND household_id = p_household_id;
    DELETE FROM fund_transactions
    WHERE linked_transaction_id = v_tx.id AND fund_id = v_tx.fund_id;
  END IF;

  -- Trừ quỹ mới
  IF p_fund_id IS NOT NULL THEN
    -- is_active: không cho gắn expense vào quỹ đã xóa mềm (hoàn tiền quỹ cũ ở trên
    -- vẫn chấp nhận quỹ inactive — tiền phải về đúng nơi đã trừ)
    SELECT current_balance INTO v_balance
    FROM funds WHERE id = p_fund_id AND household_id = p_household_id AND is_active = true
    FOR UPDATE;

    IF NOT FOUND THEN RAISE EXCEPTION 'Fund not found'; END IF;

    IF v_balance < v_tx.amount THEN
      RAISE EXCEPTION 'Số dư quỹ không đủ (hiện có %)', v_balance;
    END IF;

    INSERT INTO fund_transactions (
      household_id, fund_id, transaction_type, amount, direction,
      balance_after, linked_transaction_id, description, transaction_date
    ) VALUES (
      p_household_id, p_fund_id, 'expense', v_tx.amount, 'out',
      v_balance - v_tx.amount, v_tx.id, v_tx.description, v_tx.transaction_date
    );

    UPDATE funds SET current_balance = v_balance - v_tx.amount, updated_at = now()
    WHERE id = p_fund_id;
  END IF;

  UPDATE transactions SET fund_id = p_fund_id, updated_at = now()
  WHERE id = v_tx.id;
END;
$$;

-- 4. Budget actual bỏ qua expense có fund_id (một đồng một lần)
--    Nguyên văn 019, chỉ thêm 1 điều kiện vào LEFT JOIN transactions.
CREATE OR REPLACE FUNCTION public.get_budget_with_actuals(p_household_id uuid, p_month text)
 RETURNS TABLE(cost_type_id uuid, cost_type_code text, cost_type_name text, budget_pct numeric, override_pct numeric, effective_pct numeric, budget_amount numeric, actual_amount numeric, remaining numeric, usage_pct numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
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

  -- Income vận hành = tổng thu nhập THỰC trong tháng đang xem (mọi member, ví chung).
  -- CHỈ transaction_type='income': fund_withdrawal cũng direction='in' (rút quỹ về ví)
  -- nên lọc theo direction sẽ đội thu nhập lên (mirror /api/living-plan sumMonthIncome).
  SELECT COALESCE(SUM(amount), 0) INTO v_income
  FROM transactions
  WHERE household_id = p_household_id
    AND transaction_type = 'income'
    AND transaction_date BETWEEN v_month_start AND v_month_end;

  -- Fallback = income_sources onboarding (BR-OB-015: estimate bức tranh ban đầu)
  -- khi tháng chưa có thu nhập thực → tránh cột budget về 0 cho hộ mới.
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
  LEFT JOIN budget_overrides bo ON bo.budget_baseline_id = bb.id AND bo.month = v_month_start
  LEFT JOIN transactions t ON t.household_id = p_household_id
    AND t.transaction_date BETWEEN v_month_start AND v_month_end
    AND t.exclude_from_budget_report = false
    -- 19-6: chi từ quỹ không ăn budget tháng (đã ăn lúc nạp quỹ)
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
