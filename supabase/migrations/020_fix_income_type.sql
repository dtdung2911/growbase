-- ============================================================
-- 020. Backfill: income nhập qua QuickAdd bị lưu nhầm transaction_type='expense'
-- ============================================================
-- WHY: Trước fix TransactionForm, tab "Thu nhập" (defaultDirection='in', hideDirection)
-- không derive transaction_type từ direction → fallback cứng 'expense'. Kết quả:
-- income rows lưu transaction_type='expense' dù direction='in'. Điều này làm
-- capacity/dashboard income/budget/trailing = 0.
-- behavior_type do DB trigger set, đáng tin: behavior_type='income' = income thật.
-- Idempotent: chạy lại khớp 0 rows.
-- ============================================================
UPDATE transactions
SET transaction_type = 'income'
WHERE behavior_type = 'income'
  AND transaction_type = 'expense'
  AND direction = 'in';
