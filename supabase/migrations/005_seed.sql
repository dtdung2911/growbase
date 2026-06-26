-- Description: S0 — seed dữ liệu system bất biến.
-- 1. cost_types (7 rows, khớp Google Sheet)
-- 2. system category_groups (20 rows, household_id=NULL, is_system=true)
-- 3. system categories (38 rows, household_id=NULL, is_system=true)
--    default_behavior_type map theo cost_type code.
-- KHÔNG seed budget_baselines (BLOCKER #3 — dùng app constant budgetTemplate.ts).
-- Idempotent: ON CONFLICT DO NOTHING dựa trên unique key có sẵn.

BEGIN;

-- ============================================================
-- 1. Cost Types — code UNIQUE
-- ============================================================
INSERT INTO cost_types (household_id, code, display_name, display_name_vi, sort_order) VALUES
  (NULL, 'income',             'Income',               'Thu nhập',              0),
  (NULL, 'fixed',              'Fixed costs',           'Chi phí cố định',      1),
  (NULL, 'variable',           'Variable costs',        'Chi phí phát sinh',    2),
  (NULL, 'wasteful',           'Discretionary',         'Chi phí lãng phí',     3),
  (NULL, 'debt_repayment',     'Debt repayment',        'Chi trả nợ',           4),
  (NULL, 'savings_investment', 'Savings & Investment',  'Tiết kiệm & Đầu tư',  5),
  (NULL, 'loan',               'Loan',                  'Vay nợ',               6)
ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. System Category Groups (20 groups) — household_id NULL, is_system=true
--    cost_type_id lấy qua sub-select theo code.
--    Guard: chỉ insert nếu chưa có system group cùng tên.
-- ============================================================
INSERT INTO category_groups (household_id, cost_type_id, name, color, is_system, sort_order)
SELECT NULL, ct.id, g.name, g.color, true, g.sort_order
FROM (VALUES
  -- Income
  ('income',             'Thu nhập',                          '#22C55E',  1),
  -- Fixed costs
  ('fixed',              'Thực phẩm & Ăn uống hàng ngày',    '#10B981',  2),
  ('fixed',              'Nhà ở & Điện nước',                 '#3B82F6',  3),
  ('fixed',              'Phương tiện xe cơ cố định',         '#F59E0B',  4),
  ('fixed',              'Dịch vụ',                           '#8B5CF6',  5),
  ('fixed',              'Con cái',                            '#EC4899',  6),
  ('fixed',              'Giáo dục',                          '#A855F7',  7),
  ('fixed',              'Work & Tools',                      '#6366F1',  8),
  -- Variable costs
  ('variable',           'Chăm sóc cá nhân',                 '#EF4444',  9),
  ('variable',           'Quà tặng & Hiếu hỉ',               '#84CC16', 10),
  ('variable',           'Phương tiện xe cơ phát sinh',       '#FB923C', 11),
  ('variable',           'Thiết bị/Đồ dùng/Nhà cửa',         '#06B6D4', 12),
  -- Wasteful
  ('wasteful',           'Ăn uống ngoài',                     '#DC2626', 13),
  ('wasteful',           'Giải trí',                           '#9333EA', 14),
  ('wasteful',           'Chênh lệch ghi chép',               '#78716C', 15),
  -- Debt repayment
  ('debt_repayment',     'Chi trả nợ',                        '#78716C', 16),
  -- Savings & Investment
  ('savings_investment', 'Tiết kiệm',                         '#059669', 17),
  ('savings_investment', 'Đầu tư',                            '#0284C7', 18),
  -- Loan
  ('loan',               'Vay nợ',                            '#B45309', 19),
  -- Budget buffer (no categories, used for budget allocation only)
  ('fixed',              'Dự trù tháng kế tiếp',              '#94A3B8', 20)
) AS g(cost_type_code, name, color, sort_order)
JOIN cost_types ct ON ct.code = g.cost_type_code
WHERE NOT EXISTS (
  SELECT 1 FROM category_groups cg
  WHERE cg.household_id IS NULL AND cg.is_system = true AND cg.name = g.name
);

-- ============================================================
-- 3. System Categories (38 categories) — household_id NULL, is_system=true
--    default_behavior_type = cost_type.code (đã trùng tên với behavior_type enum).
--    Mỗi category thuộc 1 group, tên category là leaf-level chi tiết.
-- ============================================================

-- Helper: insert categories by matching group name
INSERT INTO categories (household_id, group_id, name, default_behavior_type, is_system, sort_order)
SELECT NULL, cg.id, c.cat_name, ct.code::behavior_type, true, c.sort_order
FROM (VALUES
  -- Thu nhập (income) — không seed categories, lấy từ income_sources khi onboarding
  -- Thực phẩm & Ăn uống hàng ngày (fixed)
  ('Thực phẩm & Ăn uống hàng ngày',    'Siêu thị & Chợ & Ăn uống',           1),
  -- Nhà ở & Điện nước (fixed)
  ('Nhà ở & Điện nước',                 'Điện',                                1),
  ('Nhà ở & Điện nước',                 'Nước',                                2),
  ('Nhà ở & Điện nước',                 'Sắm sửa đồ gia dụng',                3),
  -- Phương tiện xe cơ cố định (fixed)
  ('Phương tiện xe cơ cố định',         'Xăng xe/Bảo dưỡng/Sửa xe',           1),
  ('Phương tiện xe cơ cố định',         'Đỗ/Gửi xe',                          2),
  ('Phương tiện xe cơ cố định',         'Phí thuê xe/Taxi',                    3),
  -- Dịch vụ (fixed)
  ('Dịch vụ',                           'Subscriptions/Dịch vụ số',            1),
  ('Dịch vụ',                           'Phí dịch vụ nhà',                     2),
  -- Minnie (fixed)
  ('Con cái',                            'Học phí/Sách vở/Học phẩm',            1),
  ('Con cái',                            'Đồ chơi/Giải trí',                   2),
  ('Con cái',                            'Nhu yếu phẩm/Thực phẩm',             3),
  ('Con cái',                            'Quần áo',                             4),
  -- Giáo dục (fixed)
  ('Giáo dục',                          'Books/Khóa học',                      1),
  -- Work & Tools (fixed)
  ('Work & Tools',                      'Điện thoại',                          1),
  ('Work & Tools',                      'Phí Software/Website',                2),
  -- Chăm sóc cá nhân (variable)
  ('Chăm sóc cá nhân',                 'Y tế Con cái',                       1),
  ('Chăm sóc cá nhân',                 'Thuốc men Y tế',                      2),
  ('Chăm sóc cá nhân',                 'Chăm sóc & Mua sắm cá nhân',         3),
  -- Quà tặng & Hiếu hỉ (variable)
  ('Quà tặng & Hiếu hỉ',               'Hiếu hỉ',                            1),
  ('Quà tặng & Hiếu hỉ',               'Quà cấp/Từ thiện/Tổ chức sự kiện',   2),
  -- Phương tiện xe cơ phát sinh (variable)
  ('Phương tiện xe cơ phát sinh',       'Sắm sửa cho xe / Rửa xe',            1),
  -- Thiết bị/Đồ dùng/Nhà cửa (variable)
  ('Thiết bị/Đồ dùng/Nhà cửa',         'Sắm sửa đồ/thiết bị/nhà cửa',       1),
  -- Ăn uống ngoài (wasteful)
  ('Ăn uống ngoài',                     'Ăn uống ngoài',                       1),
  -- Giải trí (wasteful)
  ('Giải trí',                           'Movies/Coffee/Drinks',               1),
  ('Giải trí',                           'Du lịch',                            2),
  ('Giải trí',                           'Đồ lặt vặt',                        3),
  -- Chênh lệch ghi chép (wasteful)
  ('Chênh lệch ghi chép',               'Chênh lệch ghi chép',               1),
  -- Chi trả nợ (debt_repayment)
  ('Chi trả nợ',                        'Trả nợ',                             1),
  ('Chi trả nợ',                        'Credit Card Payment',                 2),
  -- Tiết kiệm (savings_investment)
  ('Tiết kiệm',                         'Quỹ khẩn cấp',                       1),
  ('Tiết kiệm',                         'Quỹ mua sắm',                        2),
  ('Tiết kiệm',                         'Quỹ Future',                          3),
  -- Đầu tư (savings_investment)
  ('Đầu tư',                            'Chứng khoán',                         1),
  -- Vay nợ (loan)
  ('Vay nợ',                            'Vay nợ',                              1)
) AS c(group_name, cat_name, sort_order)
JOIN category_groups cg ON cg.name = c.group_name AND cg.household_id IS NULL AND cg.is_system = true
JOIN cost_types ct ON ct.id = cg.cost_type_id
WHERE NOT EXISTS (
  SELECT 1 FROM categories cat
  WHERE cat.group_id = cg.id AND cat.name = c.cat_name AND cat.is_system = true AND cat.household_id IS NULL
);

-- KHÔNG seed budget_baselines (BLOCKER #3).

COMMIT;
