-- Dev seed: income/expense transactions 01/2026 -> 07/2026 for household "Gia đình của Dũng Dương".
-- Re-runnable: removes prior '[seed]%' rows first. Run as postgres (bypasses RLS).
-- behavior_type left NULL on purpose; trigger tx_set_behavior_type fills it from the category.

DELETE FROM transactions
WHERE household_id = '51bfc33a-3366-4632-a279-fbf5a74666b9'
  AND description LIKE '[seed]%';

-- Fixed salary, 30tr on the 5th of each month
INSERT INTO transactions
  (household_id, member_id, amount, direction, transaction_type, category_id, account_id, description, transaction_date, import_source)
SELECT
  '51bfc33a-3366-4632-a279-fbf5a74666b9',
  'fa1348a5-d312-43b9-bcac-56ce7273b010',
  30000000, 'in', 'income',
  '7fac48f7-05e8-4164-8a7d-0318a4ad5c78',
  'dc15febe-6b5c-4b0d-9051-d0a6fdb3ff0d',
  '[seed] Lương tháng ' || m || '/2026',
  make_date(2026, m, 5),
  'manual'
FROM generate_series(1, 7) AS m;

-- Recurring monthly expenses: base ±15%, rounded to 1000đ, spread over days 1-15
INSERT INTO transactions
  (household_id, member_id, amount, direction, transaction_type, category_id, account_id, description, transaction_date, import_source)
SELECT
  '51bfc33a-3366-4632-a279-fbf5a74666b9',
  'fa1348a5-d312-43b9-bcac-56ce7273b010',
  round((c.base * (0.85 + random() * 0.30)) / 1000) * 1000,
  'out', 'expense',
  c.category_id,
  'dc15febe-6b5c-4b0d-9051-d0a6fdb3ff0d',
  '[seed] ' || c.name,
  make_date(2026, m, 1 + floor(random() * 15)::int),
  'manual'
FROM generate_series(1, 7) AS m
CROSS JOIN (VALUES
  ('0b7f0540-bcec-4e4f-9144-a9ccae53d11a'::uuid, 'Siêu thị & Chợ & Ăn uống', 6000000),
  ('3115fd66-d29b-4233-8249-5fe6e66f426a'::uuid, 'Điện', 900000),
  ('eaa2e2bb-16f5-4f13-948f-25e8410ee5b7'::uuid, 'Nước', 200000),
  ('2fd32ce2-1325-44cc-9ebc-4a2a86556b01'::uuid, 'Xăng xe/Bảo dưỡng', 1200000),
  ('34277f49-054c-4125-ad4b-a700c9dfa75a'::uuid, 'Đỗ/Gửi xe', 300000),
  ('15a80150-e225-49b6-8dfe-8021b15b18b1'::uuid, 'Subscriptions/Dịch vụ số', 350000),
  ('ee6b0948-efa4-45b8-af7a-812ab69a6494'::uuid, 'Phí dịch vụ nhà', 500000),
  ('77eea2d5-5efb-4169-84d0-6a4c19a36700'::uuid, 'Học phí/Sách vở', 2500000),
  ('dcd4bf12-74dc-4d85-bde3-c0e4a95be8a0'::uuid, 'Nhu yếu phẩm/Thực phẩm con', 1200000),
  ('4e106451-e7ca-4b4b-b016-fb30f988adaa'::uuid, 'Điện thoại', 300000),
  ('5f7a05cf-ce26-4a5f-a12d-d475c1964f2b'::uuid, 'Chăm sóc & Mua sắm cá nhân', 800000),
  ('ce81d88f-7509-4a25-88c6-f56cb4dd973e'::uuid, 'Thuốc men Y tế', 400000),
  ('b47869d6-1b46-4670-96c5-1be3a9815d42'::uuid, 'Ăn uống ngoài', 1500000),
  ('b8f8ce20-1e1e-41f5-a453-b298b3f355b5'::uuid, 'Movies/Coffee/Drinks', 700000)
) AS c(category_id, name, base);

-- One-off expenses in specific months (day 1-15)
INSERT INTO transactions
  (household_id, member_id, amount, direction, transaction_type, category_id, account_id, description, transaction_date, import_source)
SELECT
  '51bfc33a-3366-4632-a279-fbf5a74666b9',
  'fa1348a5-d312-43b9-bcac-56ce7273b010',
  o.amount, 'out', 'expense',
  o.category_id,
  'dc15febe-6b5c-4b0d-9051-d0a6fdb3ff0d',
  '[seed] ' || o.name,
  make_date(2026, o.m, 1 + floor(random() * 15)::int),
  'manual'
FROM (VALUES
  ('1177b815-fa91-4f2b-a248-849bc98b4337'::uuid, 'Hiếu hỉ', 2000000, 2),
  ('1177b815-fa91-4f2b-a248-849bc98b4337'::uuid, 'Hiếu hỉ', 2000000, 4),
  ('0816e6dc-1e47-4adb-9920-310fdd55c7d2'::uuid, 'Du lịch', 5000000, 6),
  ('eb4c3ef1-97af-4610-94db-a06a16c46080'::uuid, 'Quần áo (con)', 1500000, 1),
  ('eb4c3ef1-97af-4610-94db-a06a16c46080'::uuid, 'Quần áo (con)', 1500000, 5),
  ('db2e8d2f-a083-4117-8386-f0b5a07c3787'::uuid, 'Sắm sửa đồ gia dụng', 3000000, 3)
) AS o(category_id, name, amount, m);
