-- Description: Story 14.4 — bảng lưu idempotency key cho mutation từ mobile offline queue.
-- Reserve-before-execute: INSERT placeholder (status/response NULL = "đang xử lý"), UPDATE khi xong.
-- Unique (key, user_id) là lock: 2 request cùng key không thể cùng chạy handler.
-- status/response NULL-able để biểu diễn trạng thái "pending/reserved" trước khi có kết quả.

BEGIN;

CREATE TABLE IF NOT EXISTS idempotency_keys (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key        text NOT NULL,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status     int,
  response   jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (key, user_id)
);

ALTER TABLE idempotency_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY idempotency_keys_owner ON idempotency_keys
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

COMMIT;
