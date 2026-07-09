-- Description: Epic 4 (Onboarding V2) — RPC complete_onboarding_v2 khởi tạo toàn bộ
-- bức tranh tài chính (household + account + categories/budget + income + goal fund)
-- từ đúng 2 input: goal + monthlyIncome. Atomic all-or-nothing (story 4.4).
-- KHÔNG sửa complete_onboarding() cũ (006) — route wizard cũ bị xoá ở story 4.7, không phải đây.
-- Thứ tự INSERT giống pattern 006: household → member → clone_category_hierarchy →
--   income category + income_sources → accounts → budget_baselines → funds → UPDATE households.
-- SECURITY DEFINER SET search_path = public, pg_temp (rule tuyệt đối từ S0).

BEGIN;

-- ============================================================
-- complete_onboarding_v2() — Tada: dựng household mới hoàn toàn cho user
-- chưa từng onboard, từ goal + monthlyIncome.
--
-- p_budget_pcts: [{ name, budget_pct, linked_group_names: [text] }]  (18 dòng, từ BUDGET_TEMPLATE)
-- p_goal:        { fund_type, name, target_amount, target_date?, target_months_expense? }
-- ============================================================
CREATE OR REPLACE FUNCTION complete_onboarding_v2(
  p_user_id       uuid,
  p_display_name  text,
  p_monthly_income numeric,
  p_budget_pcts   jsonb,
  p_goal          jsonb
) RETURNS uuid AS $$
DECLARE
  v_household_id uuid;
  v_item         jsonb;
  v_idx          int;
  v_linked_names text[];
  v_linked_ids   uuid[];
BEGIN
  IF EXISTS (
    SELECT 1 FROM household_members WHERE user_id = p_user_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Already onboarded';
  END IF;

  -- 1. Household + owner member
  INSERT INTO households (name, currency)
  VALUES ('Gia đình của ' || p_display_name, 'VND')
  RETURNING id INTO v_household_id;

  INSERT INTO household_members (household_id, user_id, display_name, role, is_active)
  VALUES (v_household_id, p_user_id, p_display_name, 'owner', true);

  -- 2. Clone category hierarchy (system → household) — hàm có sẵn từ 006
  PERFORM clone_category_hierarchy(v_household_id);

  -- 3. Income: category dưới nhóm "Thu nhập" + income_sources (household-level, không gắn member)
  INSERT INTO income_sources (household_id, member_id, source_name, monthly_amount)
  VALUES (v_household_id, NULL, 'Thu nhập hộ gia đình', p_monthly_income);

  INSERT INTO categories (household_id, group_id, name, default_behavior_type, is_system, sort_order)
  SELECT v_household_id, cg.id, 'Thu nhập hộ gia đình', 'income'::behavior_type, false, 0
  FROM category_groups cg
  WHERE cg.household_id = v_household_id AND cg.name = 'Thu nhập';

  -- 4. Account mặc định
  INSERT INTO accounts (household_id, name, account_type)
  VALUES (v_household_id, 'Tài khoản chính', 'bank');

  -- 5. Budget baselines — resolve linked_group_names → uuid[] qua category_groups household
  FOR v_item, v_idx IN
    SELECT val, ordinality::int
    FROM jsonb_array_elements(p_budget_pcts) WITH ORDINALITY AS arr(val, ordinality)
  LOOP
    SELECT COALESCE(array_agg(elem), ARRAY[]::text[])
      INTO v_linked_names
    FROM jsonb_array_elements_text(COALESCE(v_item->'linked_group_names', '[]'::jsonb)) AS elem;

    IF array_length(v_linked_names, 1) IS NULL THEN
      v_linked_ids := '{}'::uuid[];
    ELSE
      SELECT COALESCE(array_agg(cg.id), '{}'::uuid[])
        INTO v_linked_ids
      FROM category_groups cg
      WHERE cg.household_id = v_household_id AND cg.name = ANY(v_linked_names);
    END IF;

    INSERT INTO budget_baselines (
      household_id, name, budget_pct, sort_order, linked_category_group_ids, is_system
    ) VALUES (
      v_household_id,
      v_item->>'name',
      (v_item->>'budget_pct')::numeric,
      v_idx,
      v_linked_ids,
      true
    );
  END LOOP;

  -- 6. Goal fund thật — trong cùng transaction (A-1: không mutation balance rời rạc)
  INSERT INTO funds (
    household_id, name, fund_type, target_amount, target_date, target_months_expense
  ) VALUES (
    v_household_id,
    p_goal->>'name',
    (p_goal->>'fund_type')::fund_type,
    (p_goal->>'target_amount')::numeric,
    NULLIF(p_goal->>'target_date', '')::date,
    NULLIF(p_goal->>'target_months_expense', '')::int
  );

  -- 7. Đánh dấu hoàn tất onboarding
  UPDATE households
  SET onboarding_completed = true,
      updated_at = now()
  WHERE id = v_household_id;

  RETURN v_household_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

COMMIT;
