-- ============================================================
-- 019. get_budget_with_actuals() — cột phân bổ ngân sách theo income THỰC tháng đang xem
-- ============================================================
-- Trước: v_income = SUM(income_sources.monthly_amount) → dùng income khai onboarding,
-- không đổi theo tháng. User chốt nghiệp vụ: cột budget phải tính theo thu nhập THỰC
-- của tháng đang xem (mirror BR-OB-015 income vận hành = thực hộ gộp).
-- Base: 003_functions.sql (không migration nào replace function này sau 003).
-- Chỉ thay khối tính v_income; phần còn lại giữ nguyên byte-for-byte.
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
    AND t.category_id = ANY(
      SELECT c.id FROM categories c
      WHERE c.group_id = ANY(bb.linked_category_group_ids::uuid[])
    )
  WHERE bb.household_id = p_household_id
  GROUP BY bb.id, bb.name, bb.budget_pct, bo.override_pct, bb.sort_order
  ORDER BY bb.sort_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
