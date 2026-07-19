-- 026: Chặn ghi trực tiếp lên transaction gắn quỹ ở tầng RLS (review Epic 19).
-- Lock 19-3 trước đây chỉ nằm ở API route — client gọi thẳng PostgREST bằng JWT
-- vẫn sửa/xóa được row có fund_id, làm lệch số dư quỹ vs sổ giao dịch.
-- Các RPC SECURITY DEFINER (fund_contribute/withdraw/expense/revert/change_fund_source)
-- chạy với owner postgres nên bypass RLS, không bị ảnh hưởng.

DROP POLICY IF EXISTS transactions_insert ON transactions;
CREATE POLICY transactions_insert ON transactions FOR INSERT
  WITH CHECK (household_id = ANY(get_user_household_ids()) AND fund_id IS NULL);

DROP POLICY IF EXISTS transactions_update ON transactions;
CREATE POLICY transactions_update ON transactions FOR UPDATE
  USING (household_id = ANY(get_user_household_ids()) AND fund_id IS NULL)
  WITH CHECK (household_id = ANY(get_user_household_ids()) AND fund_id IS NULL);

DROP POLICY IF EXISTS transactions_delete ON transactions;
CREATE POLICY transactions_delete ON transactions FOR DELETE
  USING (household_id = ANY(get_user_household_ids()) AND fund_id IS NULL);
