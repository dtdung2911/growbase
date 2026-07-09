-- Description: Persist funds.icon từ onboarding (story 9.2).
-- Nền = 016 (giữ 100% hardening). Thay đổi DUY NHẤT so với 016:
--   - INSERT funds thêm cột icon = NULLIF(goal->>'icon','') (nullable, Zod route đã whitelist).
-- Signature 8-arg KHÔNG đổi (icon nằm trong p_goals jsonb) → REVOKE/GRANT giữ nguyên.
-- SECURITY DEFINER SET search_path = public, pg_temp (rule tuyệt đối từ S0).

BEGIN;

DROP FUNCTION IF EXISTS complete_onboarding_v2(uuid, text, numeric, jsonb, jsonb, text, text, text);

CREATE FUNCTION complete_onboarding_v2(
  p_user_id               uuid,
  p_display_name          text,
  p_monthly_income        numeric,
  p_budget_pcts           jsonb,
  p_goals                 jsonb,
  p_household_name_prefix text DEFAULT 'Gia đình của ',
  p_income_source_name    text DEFAULT 'Thu nhập hộ gia đình',
  p_account_name          text DEFAULT 'Tài khoản chính'
) RETURNS jsonb AS $$
DECLARE
  v_household_id uuid;
  v_item         jsonb;
  v_idx          int;
  v_linked_names text[];
  v_linked_ids   uuid[];
  v_fund_id      uuid;
  v_fund_ids     uuid[] := '{}';
BEGIN
  -- Serialize double-submit của cùng user: request thứ 2 chờ tới khi request 1 commit,
  -- rồi EXISTS bên dưới mới thấy member và raise 'Already onboarded'.
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text));

  IF EXISTS (
    SELECT 1 FROM household_members WHERE user_id = p_user_id AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Already onboarded';
  END IF;

  IF p_goals IS NULL OR jsonb_array_length(p_goals) = 0 THEN
    RAISE EXCEPTION 'p_goals must contain at least the emergency fund';
  END IF;
  IF jsonb_array_length(p_goals) > 6 THEN
    RAISE EXCEPTION 'p_goals must not exceed 6 funds';
  END IF;
  IF p_goals->0->>'fund_type' IS DISTINCT FROM 'emergency' THEN
    RAISE EXCEPTION 'p_goals[0] must be the emergency fund';
  END IF;

  FOR v_idx IN 0 .. jsonb_array_length(p_goals) - 1 LOOP
    IF v_idx > 0 AND p_goals->v_idx->>'fund_type' = 'emergency' THEN
      RAISE EXCEPTION 'Only p_goals[0] may be the emergency fund';
    END IF;
    IF COALESCE((p_goals->v_idx->>'target_amount')::numeric, 0) <= 0 THEN
      RAISE EXCEPTION 'Every fund target_amount must be greater than 0';
    END IF;
  END LOOP;

  -- 1. Household + owner member
  INSERT INTO households (name, currency)
  VALUES (p_household_name_prefix || p_display_name, 'VND')
  RETURNING id INTO v_household_id;

  INSERT INTO household_members (household_id, user_id, display_name, role, is_active)
  VALUES (v_household_id, p_user_id, p_display_name, 'owner', true);

  -- 2. Clone category hierarchy (system → household) — hàm có sẵn từ 006
  PERFORM clone_category_hierarchy(v_household_id);

  -- 3. Income: category dưới nhóm "Thu nhập" + income_sources (household-level, không gắn member)
  INSERT INTO income_sources (household_id, member_id, source_name, monthly_amount)
  VALUES (v_household_id, NULL, p_income_source_name, p_monthly_income);

  INSERT INTO categories (household_id, group_id, name, default_behavior_type, is_system, sort_order)
  SELECT v_household_id, cg.id, p_income_source_name, 'income'::behavior_type, false, 0
  FROM category_groups cg
  WHERE cg.household_id = v_household_id AND cg.name = 'Thu nhập';

  -- 4. Account mặc định
  INSERT INTO accounts (household_id, name, account_type)
  VALUES (v_household_id, p_account_name, 'bank');

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

  -- 6. Funds — emergency (p_goals[0]) trước, rồi các quỹ mục tiêu; cùng transaction (rule 1).
  --    Thu id theo đúng thứ tự p_goals để API map lại từng quỹ.
  FOR v_item IN SELECT val FROM jsonb_array_elements(p_goals) AS arr(val)
  LOOP
    INSERT INTO funds (
      household_id, name, fund_type, target_amount, target_date, target_months_expense, icon
    ) VALUES (
      v_household_id,
      v_item->>'name',
      (v_item->>'fund_type')::fund_type,
      (v_item->>'target_amount')::numeric,
      NULLIF(v_item->>'target_date', '')::date,
      NULLIF(v_item->>'target_months_expense', '')::int,
      NULLIF(v_item->>'icon', '')
    )
    RETURNING id INTO v_fund_id;
    v_fund_ids := array_append(v_fund_ids, v_fund_id);
  END LOOP;

  -- 7. Đánh dấu hoàn tất onboarding
  UPDATE households
  SET onboarding_completed = true,
      updated_at = now()
  WHERE id = v_household_id;

  RETURN jsonb_build_object('household_id', v_household_id, 'fund_ids', to_jsonb(v_fund_ids));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Lockdown (giữ pattern 012/013): chỉ service_role (API route đã auth) được gọi.
REVOKE EXECUTE ON FUNCTION complete_onboarding_v2(uuid, text, numeric, jsonb, jsonb, text, text, text)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION complete_onboarding_v2(uuid, text, numeric, jsonb, jsonb, text, text, text)
  TO service_role;

COMMIT;
