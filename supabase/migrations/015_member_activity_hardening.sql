-- Description: Story 7.2 hardening.
-- 1) insert RLS phải chặn ghi hoạt động vào household user không thuộc.
-- 2) active_date không được ở tương lai (giờ VN), cũng không được backdate quá xa.
-- 3) default active_date theo giờ VN, khớp todayVN() ở app (thay current_date UTC).

BEGIN;

-- Dọn rác trước khi siết: migration 014 dùng INSERT policy yếu nên có thể tồn tại
-- row của (user_id, household_id) không còn là thành viên active → xóa trước khi khóa
DELETE FROM member_activity ma
WHERE NOT EXISTS (
  SELECT 1 FROM household_members hm
  WHERE hm.user_id = ma.user_id
    AND hm.household_id = ma.household_id
    AND hm.is_active = true
);

DROP POLICY IF EXISTS member_activity_insert_own ON member_activity;
CREATE POLICY member_activity_insert_own ON member_activity
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND household_id = ANY(get_user_household_ids())
  );

-- NOT VALID: row hợp lệ cũ có active_date xa hơn ±1 ngày, không được fail khi thêm constraint;
-- chỉ chặn ghi mới (skew đồng hồ cho phép +1, chống backdate ở -1)
ALTER TABLE member_activity
  ADD CONSTRAINT member_activity_active_date_range
  CHECK (
    active_date BETWEEN (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date - 1
                    AND (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date + 1
  ) NOT VALID;

ALTER TABLE member_activity
  ALTER COLUMN active_date SET DEFAULT (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date;

COMMIT;
