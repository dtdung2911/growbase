-- 022: Category hệ thống "Tiết kiệm & Quỹ" thay 3 categories quỹ template cũ
-- (story 19-2). Idempotent: guard NOT EXISTS, remap trước khi xóa.

-- 1. Template category (household_id NULL)
INSERT INTO categories (household_id, group_id, name, default_behavior_type, is_system, sort_order)
SELECT NULL, g.id, 'Tiết kiệm & Quỹ', 'savings_investment', true, 1
FROM category_groups g
WHERE g.household_id IS NULL AND g.name = 'Tiết kiệm' AND g.is_system = true
  AND NOT EXISTS (
    SELECT 1 FROM categories c
    WHERE c.household_id IS NULL AND c.name = 'Tiết kiệm & Quỹ'
  );

-- 2. Clone cho mọi household hiện hữu có group "Tiết kiệm"
INSERT INTO categories (household_id, group_id, name, default_behavior_type, is_system, sort_order)
SELECT g.household_id, g.id, 'Tiết kiệm & Quỹ', 'savings_investment', true, 1
FROM category_groups g
WHERE g.household_id IS NOT NULL AND g.name = 'Tiết kiệm'
  AND NOT EXISTS (
    SELECT 1 FROM categories c
    WHERE c.household_id = g.household_id AND c.name = 'Tiết kiệm & Quỹ'
  );

-- 3. Remap transactions + estimated_expenses đang trỏ 3 categories cũ
--    (match category mới theo household của row, nên xử lý được cả ref lạc vào template)
UPDATE transactions t
SET category_id = n.id
FROM categories n
WHERE n.name = 'Tiết kiệm & Quỹ'
  AND n.household_id = t.household_id
  AND t.category_id IN (
    SELECT c.id FROM categories c
    JOIN category_groups g ON g.id = c.group_id
    WHERE c.name IN ('Quỹ khẩn cấp', 'Quỹ mua sắm', 'Quỹ Future') AND g.name = 'Tiết kiệm'
  );

UPDATE estimated_expenses e
SET category_id = n.id
FROM categories n
WHERE n.name = 'Tiết kiệm & Quỹ'
  AND n.household_id = e.household_id
  AND e.category_id IN (
    SELECT c.id FROM categories c
    JOIN category_groups g ON g.id = c.group_id
    WHERE c.name IN ('Quỹ khẩn cấp', 'Quỹ mua sắm', 'Quỹ Future') AND g.name = 'Tiết kiệm'
  );

-- 4. Xóa 3 categories cũ (template + household clones). FK còn sót → fail loud, chủ đích.
DELETE FROM categories c
USING category_groups g
WHERE g.id = c.group_id
  AND g.name = 'Tiết kiệm'
  AND c.name IN ('Quỹ khẩn cấp', 'Quỹ mua sắm', 'Quỹ Future');

-- 5. clone_category_hierarchy: giữ is_system=true cho "Tiết kiệm & Quỹ" khi clone
--    (nguyên văn 006, chỉ đổi biểu thức is_system ở bước clone categories)
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
  SELECT p_household_id, hcg.id, sc.name, sc.icon, sc.default_behavior_type,
         (sc.name = 'Tiết kiệm & Quỹ'), sc.sort_order
  FROM categories sc
  JOIN category_groups scg ON scg.id = sc.group_id AND scg.household_id IS NULL AND scg.is_system = true
  JOIN category_groups hcg ON hcg.name = scg.name AND hcg.household_id = p_household_id
  WHERE sc.household_id IS NULL AND sc.is_system = true
  ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
