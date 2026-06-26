-- Description: S2 — Add BEFORE UPDATE trigger on transactions to re-derive
-- behavior_type when category_id changes. Existing set_transaction_behavior_type()
-- function (003_functions.sql) only fires on INSERT. Editing a transaction's
-- category won't update behavior_type without this trigger.

-- Drop if exists for idempotency
DROP TRIGGER IF EXISTS tx_set_behavior_type_on_update ON transactions;

-- Add BEFORE UPDATE trigger, only fires when category_id actually changes
CREATE TRIGGER tx_set_behavior_type_on_update
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  WHEN (OLD.category_id IS DISTINCT FROM NEW.category_id)
  EXECUTE FUNCTION set_transaction_behavior_type();
