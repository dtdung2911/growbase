-- Description: Story 7.2 — theo dõi hoạt động tối giản để suy "dùng đều ≥5/7 ngày".
-- 1 bảng, upsert idempotent theo ngày (PK user_id+active_date). KHÔNG event pipeline/analytics.
-- RLS: insert/select row của chính mình; thành viên cùng household select được để đếm.

BEGIN;

CREATE TABLE member_activity (
  household_id uuid NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id      uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  active_date  date NOT NULL DEFAULT current_date,
  PRIMARY KEY (user_id, active_date)
);

CREATE INDEX member_activity_household_user_date_idx
  ON member_activity (household_id, user_id, active_date DESC);

ALTER TABLE member_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY member_activity_insert_own ON member_activity
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- get_user_household_ids() (003) trả household của user → phủ cả "select own" và
-- "thành viên cùng household select được" trong 1 policy
CREATE POLICY member_activity_select_household ON member_activity
  FOR SELECT USING (household_id = ANY(get_user_household_ids()));

COMMIT;
