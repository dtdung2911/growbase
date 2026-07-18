-- 023: RPC hoàn tác lần nạp quỹ (story 19-4).
-- Undo thật: xóa cả transaction chính lẫn fund_transaction, trừ lại số dư.
-- Lưu ý: balance_after của các entry sau thời điểm nạp trở thành số lịch sử
-- không khớp — chấp nhận, cột này chỉ để hiển thị.

CREATE OR REPLACE FUNCTION fund_contribution_revert(
  p_household_id uuid,
  p_fund_tx_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  v_ft RECORD;
  v_balance numeric;
BEGIN
  IF NOT (p_household_id = ANY(get_user_household_ids())) THEN
    RAISE EXCEPTION 'Access denied: not a member of this household';
  END IF;

  SELECT id, fund_id, amount, linked_transaction_id INTO v_ft
  FROM fund_transactions
  WHERE id = p_fund_tx_id
    AND household_id = p_household_id
    AND transaction_type = 'contribution';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Chỉ hoàn tác được lần nạp quỹ';
  END IF;

  SELECT current_balance INTO v_balance
  FROM funds WHERE id = v_ft.fund_id AND household_id = p_household_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Fund not found'; END IF;

  IF v_balance < v_ft.amount THEN
    RAISE EXCEPTION 'Số dư quỹ không đủ để hoàn tác lần nạp này';
  END IF;

  DELETE FROM fund_transactions WHERE id = v_ft.id;

  IF v_ft.linked_transaction_id IS NOT NULL THEN
    DELETE FROM transactions
    WHERE id = v_ft.linked_transaction_id AND household_id = p_household_id;
  END IF;

  UPDATE funds
  SET current_balance = current_balance - v_ft.amount, updated_at = now()
  WHERE id = v_ft.fund_id;
END;
$$;
