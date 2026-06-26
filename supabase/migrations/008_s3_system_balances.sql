-- Description: S3 — RPCs for system balances and mark payment paid.
-- get_system_balances: SUM transactions per account for net worth system estimate.
-- mark_payment_paid: advance next_due_date + optionally create transaction. Atomic with FOR UPDATE.

-- ============================================================
-- 1. get_system_balances(p_household_id) → TABLE
--    Calculates system balance per active account by summing transactions.
--    Used by net worth page to show system estimate vs recorded balance.
-- ============================================================
CREATE OR REPLACE FUNCTION get_system_balances(p_household_id uuid)
RETURNS TABLE (
  account_id     uuid,
  account_name   text,
  account_type   text,
  system_balance numeric
) AS $$
BEGIN
  IF NOT (p_household_id = ANY(get_user_household_ids())) THEN
    RAISE EXCEPTION 'Access denied: not a member of this household';
  END IF;

  RETURN QUERY
  SELECT
    a.id,
    a.name,
    a.account_type::text,
    COALESCE(SUM(CASE t.direction WHEN 'in' THEN t.amount ELSE -t.amount END), 0) AS system_balance
  FROM accounts a
  LEFT JOIN transactions t ON t.account_id = a.id AND t.household_id = p_household_id
  WHERE a.household_id = p_household_id AND a.is_active = true
  GROUP BY a.id, a.name, a.account_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ============================================================
-- 2. mark_payment_paid(p_payment_id, p_household_id, ...) → uuid
--    Advances next_due_date based on period. Optionally inserts transaction.
--    Returns transaction id if created, otherwise payment id.
-- ============================================================
CREATE OR REPLACE FUNCTION mark_payment_paid(
  p_payment_id         uuid,
  p_household_id       uuid,
  p_create_transaction bool DEFAULT false,
  p_account_id         uuid DEFAULT NULL,
  p_category_id        uuid DEFAULT NULL,
  p_member_id          uuid DEFAULT NULL,
  p_date               date DEFAULT CURRENT_DATE
) RETURNS uuid AS $$
DECLARE
  v_payment   scheduled_payments%ROWTYPE;
  v_new_date  date;
  v_tx_id     uuid;
BEGIN
  -- Auth guard
  IF NOT (p_household_id = ANY(get_user_household_ids())) THEN
    RAISE EXCEPTION 'Access denied: not a member of this household';
  END IF;

  -- Lock row to prevent race conditions
  SELECT * INTO v_payment
  FROM scheduled_payments
  WHERE id = p_payment_id AND household_id = p_household_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  IF v_payment.status != 'active' THEN
    RAISE EXCEPTION 'Payment is not active';
  END IF;

  -- Advance next_due_date based on period
  CASE v_payment.period
    WHEN 'monthly'   THEN v_new_date := v_payment.next_due_date + interval '1 month';
    WHEN 'quarterly' THEN v_new_date := v_payment.next_due_date + interval '3 months';
    WHEN 'yearly'    THEN v_new_date := v_payment.next_due_date + interval '1 year';
  END CASE;

  UPDATE scheduled_payments
  SET next_due_date = v_new_date
  WHERE id = p_payment_id;

  -- Optionally create transaction
  IF p_create_transaction = true THEN
    INSERT INTO transactions (
      household_id, member_id, amount, direction, transaction_type,
      category_id, account_id, description, transaction_date, import_source
    ) VALUES (
      p_household_id, p_member_id, v_payment.amount, 'out', 'expense',
      p_category_id, p_account_id,
      'Thanh toan ' || v_payment.name,
      p_date, 'manual'
    ) RETURNING id INTO v_tx_id;

    RETURN v_tx_id;
  END IF;

  RETURN p_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;
