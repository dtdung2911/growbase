-- Description: S1 — RPC complete_onboarding cho Onboarding Wizard (US-1.04/1.05, US-2.02).
-- Atomic all-or-nothing: 1 plpgsql function = 1 transaction tự nhiên.
-- Thứ tự INSERT BẮT BUỘC: clone_categories → income_sources → accounts → budget_baselines → debt_entries → UPDATE households.
--   budget_baselines PHẢI tồn tại TRƯỚC debt_entries để trigger debt_budget_recalc (003 §4)
--   tìm thấy baseline 'Chi trả nợ' và UPDATE budget_pct = debt_pct (không no-op).
-- KHÔNG tạo table/enum/RLS mới — toàn bộ đã có ở S0. Chỉ thêm functions.
-- SECURITY DEFINER SET search_path = public, pg_temp (rule tuyệt đối từ S0).

BEGIN;

-- ============================================================
-- clone_category_hierarchy() — clone system cost_types, category_groups,
-- categories vào household. Mỗi household có bản copy riêng.
-- Gọi 1 lần duy nhất khi onboarding.
-- ============================================================
CREATE OR REPLACE FUNCTION clone_category_hierarchy(
  p_household_id uuid
) RETURNS void AS $$
BEGIN
  -- 1. Clone cost_types (system → household)
  INSERT INTO cost_types (household_id, code, display_name, display_name_vi, sort_order, is_system)
  SELECT p_household_id, code, display_name, display_name_vi, sort_order, false
  FROM cost_types
  WHERE household_id IS NULL AND is_system = true
  ON CONFLICT DO NOTHING;

  -- 2. Clone category_groups (map system cost_type → household cost_type by code)
  INSERT INTO category_groups (household_id, cost_type_id, name, icon, color, is_system, sort_order)
  SELECT p_household_id, hct.id, sg.name, sg.icon, sg.color, false, sg.sort_order
  FROM category_groups sg
  JOIN cost_types sct ON sct.id = sg.cost_type_id AND sct.household_id IS NULL
  JOIN cost_types hct ON hct.code = sct.code AND hct.household_id = p_household_id
  WHERE sg.household_id IS NULL AND sg.is_system = true
  ON CONFLICT DO NOTHING;

  -- 3. Clone categories (map system group → household group by name)
  INSERT INTO categories (household_id, group_id, name, icon, default_behavior_type, is_system, sort_order)
  SELECT p_household_id, hcg.id, sc.name, sc.icon, sc.default_behavior_type, false, sc.sort_order
  FROM categories sc
  JOIN category_groups scg ON scg.id = sc.group_id AND scg.household_id IS NULL AND scg.is_system = true
  JOIN category_groups hcg ON hcg.name = scg.name AND hcg.household_id = p_household_id
  WHERE sc.household_id IS NULL AND sc.is_system = true
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ============================================================
-- complete_onboarding() — kết thúc wizard, ghi income + accounts +
-- budget_baselines + debt_entries + set onboarding_completed.
--
-- p_income_sources: [{ source_name, monthly_amount, member_id? }]            (>=1)
-- p_accounts:       [{ name, bank_name?, account_type, owner_name?, is_credit_card }] (>=1)
-- p_debt_entries:   [{ creditor_name, debt_type, total_amount,
--                      remaining_amount?, monthly_payment, expected_end_date?, member_id? }] (có thể [])
-- p_budget_pcts:    [{ name, budget_pct, linked_group_names: [text] }]       (18 lines)
-- ============================================================
CREATE OR REPLACE FUNCTION complete_onboarding(
  p_household_id     uuid,
  p_income_sources   jsonb,
  p_accounts         jsonb,
  p_debt_entries     jsonb,
  p_budget_pcts      jsonb
) RETURNS uuid AS $$
DECLARE
  v_currency          currency_code;
  v_completed         bool;
  v_item              jsonb;
  v_idx               int;
  v_linked_names      text[];
  v_linked_ids        uuid[];
BEGIN
  -- 1. Auth guard — phải là member của household này
  IF NOT (p_household_id = ANY(get_user_household_ids())) THEN
    RAISE EXCEPTION 'Access denied: not a member of this household';
  END IF;

  -- 2. Idempotency — lock household row, kiểm tra đã onboard chưa
  SELECT onboarding_completed, currency
    INTO v_completed, v_currency
  FROM households
  WHERE id = p_household_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Household not found';
  END IF;

  IF v_completed = true THEN
    RAISE EXCEPTION 'Onboarding already completed';
  END IF;

  -- 3. Clone category hierarchy (cost_types → groups → categories) per household
  PERFORM clone_category_hierarchy(p_household_id);

  -- 4. INSERT income_sources (currency lấy từ household, is_current=true)
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_income_sources)
  LOOP
    INSERT INTO income_sources (
      household_id, member_id, source_name, monthly_amount, currency, is_current
    ) VALUES (
      p_household_id,
      NULLIF(v_item->>'member_id', '')::uuid,
      v_item->>'source_name',
      (v_item->>'monthly_amount')::numeric,
      v_currency,
      true
    );
  END LOOP;

  -- 4b. Create income categories from income_sources under "Thu nhập" group
  INSERT INTO categories (household_id, group_id, name, default_behavior_type, is_system, sort_order)
  SELECT
    p_household_id,
    cg.id,
    src.source_name,
    'income'::behavior_type,
    false,
    row_number() OVER (ORDER BY src.created_at)::int
  FROM income_sources src
  JOIN category_groups cg ON cg.household_id = p_household_id AND cg.name = 'Thu nhập'
  WHERE src.household_id = p_household_id AND src.is_current = true;

  -- 5. INSERT accounts
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_accounts)
  LOOP
    INSERT INTO accounts (
      household_id, name, bank_name, account_type, owner_name, is_credit_card
    ) VALUES (
      p_household_id,
      v_item->>'name',
      NULLIF(v_item->>'bank_name', ''),
      COALESCE(NULLIF(v_item->>'account_type', ''), 'bank')::account_type,
      NULLIF(v_item->>'owner_name', ''),
      COALESCE((v_item->>'is_credit_card')::bool, false)
    );
  END LOOP;

  -- 6. INSERT budget_baselines (TRƯỚC debt_entries — trigger cần baseline 'Chi trả nợ')
  --    Resolve linked_group_names → uuid[] qua HOUSEHOLD category_groups (not system).
  FOR v_item, v_idx IN
    SELECT val, ordinality::int
    FROM jsonb_array_elements(p_budget_pcts) WITH ORDINALITY AS arr(val, ordinality)
  LOOP
    SELECT COALESCE(
             array_agg(elem),
             ARRAY[]::text[]
           )
      INTO v_linked_names
    FROM jsonb_array_elements_text(COALESCE(v_item->'linked_group_names', '[]'::jsonb)) AS elem;

    IF array_length(v_linked_names, 1) IS NULL THEN
      v_linked_ids := '{}'::uuid[];
    ELSE
      SELECT COALESCE(array_agg(cg.id), '{}'::uuid[])
        INTO v_linked_ids
      FROM category_groups cg
      WHERE cg.household_id = p_household_id
        AND cg.name = ANY(v_linked_names);
    END IF;

    INSERT INTO budget_baselines (
      household_id, name, budget_pct, sort_order, linked_category_group_ids, is_system
    ) VALUES (
      p_household_id,
      v_item->>'name',
      (v_item->>'budget_pct')::numeric,
      v_idx,
      v_linked_ids,
      true
    );
  END LOOP;

  -- 7. INSERT debt_entries — AFTER budget_baselines.
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_debt_entries)
  LOOP
    INSERT INTO debt_entries (
      household_id, member_id, creditor_name, debt_type,
      total_amount, remaining_amount, monthly_payment, expected_end_date
    ) VALUES (
      p_household_id,
      NULLIF(v_item->>'member_id', '')::uuid,
      v_item->>'creditor_name',
      COALESCE(NULLIF(v_item->>'debt_type', ''), 'bank_loan')::debt_type,
      (v_item->>'total_amount')::numeric,
      NULLIF(v_item->>'remaining_amount', '')::numeric,
      (v_item->>'monthly_payment')::numeric,
      NULLIF(v_item->>'expected_end_date', '')::date
    );
  END LOOP;

  -- 8. Đánh dấu hoàn tất onboarding
  UPDATE households
  SET onboarding_completed = true,
      updated_at = now()
  WHERE id = p_household_id;

  -- 9. Trả về household id
  RETURN p_household_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

COMMIT;
