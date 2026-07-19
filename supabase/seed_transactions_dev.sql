-- Dev seed: income/expense transactions 01/2026 -> 07/2026 for the first (oldest) household in the DB.
-- Re-runnable: removes prior '[seed]%' rows first. Run as postgres (bypasses RLS).
-- behavior_type left NULL on purpose; trigger tx_set_behavior_type fills it from the category.
-- Everything resolved dynamically (household, member, account, categories by name) —
-- never hardcode ids: they change on every `supabase db reset` / fresh onboarding.

DO $$
DECLARE missing text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM households) THEN
    RAISE EXCEPTION 'No household found — complete onboarding first, then re-run this seed.';
  END IF;

  SELECT string_agg(n, ', ') INTO missing
  FROM unnest(ARRAY[
    'Thu nhập hộ gia đình',
    'Siêu thị & Chợ & Ăn uống', 'Điện', 'Nước', 'Xăng xe/Bảo dưỡng/Sửa xe',
    'Đỗ/Gửi xe', 'Subscriptions/Dịch vụ số', 'Phí dịch vụ nhà',
    'Học phí/Sách vở/Học phẩm', 'Nhu yếu phẩm/Thực phẩm', 'Điện thoại',
    'Chăm sóc & Mua sắm cá nhân', 'Thuốc men Y tế', 'Ăn uống ngoài',
    'Movies/Coffee/Drinks', 'Hiếu hỉ', 'Du lịch', 'Quần áo', 'Sắm sửa đồ gia dụng'
  ]) AS n
  WHERE NOT EXISTS (
    SELECT 1 FROM categories c
    JOIN (SELECT id FROM households ORDER BY created_at LIMIT 1) h ON c.household_id = h.id
    WHERE c.name = n
  );
  IF missing IS NOT NULL THEN
    RAISE EXCEPTION 'Seed categories missing for household: %', missing;
  END IF;
END $$;

-- Session context: first household + its first member and active account
DROP TABLE IF EXISTS seed_ctx;
CREATE TEMP TABLE seed_ctx AS
SELECT h.id AS household_id,
  (SELECT m.id FROM household_members m WHERE m.household_id = h.id ORDER BY m.joined_at LIMIT 1) AS member_id,
  (SELECT a.id FROM accounts a WHERE a.household_id = h.id AND a.is_active ORDER BY a.created_at LIMIT 1) AS account_id
FROM (SELECT id FROM households ORDER BY created_at LIMIT 1) h;

BEGIN;

DELETE FROM transactions
WHERE household_id = (SELECT household_id FROM seed_ctx)
  AND description LIKE '[seed]%';

-- Fixed salary, 30tr on the 5th of each month
INSERT INTO transactions
  (household_id, member_id, amount, direction, transaction_type, category_id, account_id, description, transaction_date, import_source)
SELECT
  ctx.household_id, ctx.member_id,
  30000000, 'in', 'income',
  cat.id, ctx.account_id,
  '[seed] Lương tháng ' || m || '/2026',
  make_date(2026, m, 5),
  'manual'
FROM generate_series(1, 7) AS m
CROSS JOIN seed_ctx ctx
JOIN categories cat ON cat.household_id = ctx.household_id AND cat.name = 'Thu nhập hộ gia đình';

-- Recurring monthly expenses: base ±15%, rounded to 1000đ, spread over days 1-15
INSERT INTO transactions
  (household_id, member_id, amount, direction, transaction_type, category_id, account_id, description, transaction_date, import_source)
SELECT
  ctx.household_id, ctx.member_id,
  round((c.base * (0.85 + random() * 0.30)) / 1000) * 1000,
  'out', 'expense',
  cat.id, ctx.account_id,
  '[seed] ' || c.name,
  make_date(2026, m, 1 + floor(random() * 15)::int),
  'manual'
FROM generate_series(1, 7) AS m
CROSS JOIN (VALUES
  ('Siêu thị & Chợ & Ăn uống', 6000000),
  ('Điện', 900000),
  ('Nước', 200000),
  ('Xăng xe/Bảo dưỡng/Sửa xe', 1200000),
  ('Đỗ/Gửi xe', 300000),
  ('Subscriptions/Dịch vụ số', 350000),
  ('Phí dịch vụ nhà', 500000),
  ('Học phí/Sách vở/Học phẩm', 2500000),
  ('Nhu yếu phẩm/Thực phẩm', 1200000),
  ('Điện thoại', 300000),
  ('Chăm sóc & Mua sắm cá nhân', 800000),
  ('Thuốc men Y tế', 400000),
  ('Ăn uống ngoài', 1500000),
  ('Movies/Coffee/Drinks', 700000)
) AS c(name, base)
CROSS JOIN seed_ctx ctx
JOIN categories cat ON cat.household_id = ctx.household_id AND cat.name = c.name;

-- One-off expenses in specific months (day 1-15)
INSERT INTO transactions
  (household_id, member_id, amount, direction, transaction_type, category_id, account_id, description, transaction_date, import_source)
SELECT
  ctx.household_id, ctx.member_id,
  o.amount, 'out', 'expense',
  cat.id, ctx.account_id,
  '[seed] ' || o.name,
  make_date(2026, o.m, 1 + floor(random() * 15)::int),
  'manual'
FROM (VALUES
  ('Hiếu hỉ', 2000000, 2),
  ('Hiếu hỉ', 2000000, 4),
  ('Du lịch', 5000000, 6),
  ('Quần áo', 1500000, 1),
  ('Quần áo', 1500000, 5),
  ('Sắm sửa đồ gia dụng', 3000000, 3)
) AS o(name, amount, m)
CROSS JOIN seed_ctx ctx
JOIN categories cat ON cat.household_id = ctx.household_id AND cat.name = o.name;

COMMIT;
