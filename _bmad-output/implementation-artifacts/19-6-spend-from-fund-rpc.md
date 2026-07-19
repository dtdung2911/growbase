# Story 19.6: RPC chi từ quỹ + budget bỏ qua fund expense + RPC đổi nguồn tiền

Status: done

## Story

As a hệ thống,
I want chi tiêu từ quỹ là thao tác atomic và không ăn budget tháng,
so that một đồng chỉ tính vào budget một lần — tại tháng nó rời thu nhập.

## Acceptance Criteria

1. Migration 024: RPC `fund_expense(p_household_id, p_fund_id, p_member_id, p_amount, p_category_id, p_account_id, p_description, p_date) RETURNS uuid` atomic: guard membership → lock fund → chặn `current_balance < p_amount` (message kèm số dư) → INSERT transactions (type `expense`, direction 'out', category user chọn, `fund_id`) → INSERT fund_transactions (type mới 'expense', direction 'out', linked_transaction_id) → trừ current_balance.
2. CHECK constraint fund_transactions.transaction_type mở rộng thêm 'expense'; type union `FundTransaction.transaction_type` (app.ts) thêm "expense".
3. RPC `transaction_change_fund_source(p_household_id, p_transaction_id, p_fund_id uuid /*nullable*/)` atomic hậu kiểm: chỉ expense không phải system types; hoàn tiền + xóa fund_transactions entry của quỹ cũ (nếu có); trừ tiền + tạo entry ở quỹ mới (nếu có); chặn âm quỹ mới.
4. `get_budget_with_actuals` (019): actual bỏ qua transactions `transaction_type='expense' AND fund_id IS NOT NULL` — KHÔNG loại fund_contribution (nạp quỹ vẫn ăn budget line Tiết kiệm tại tháng rời thu nhập); `fund_withdrawal` giữ nguyên.
5. API routes: POST `/api/funds/[id]/expense` (schema zod fundExpenseSchema trong packages/shared) và POST `/api/transactions/[id]/change-source` body `{ fund_id: uuid | null }` — withAuth + withIdempotency, gọi RPC.
6. database.ts Functions union thêm 2 RPC mới. psql test đủ case.

## Tasks / Subtasks

- [ ] Task 1: Migration `supabase/migrations/024_fund_expense.sql` (AC: #1,2,3,4)
  - [ ] ALTER CHECK constraint thêm 'expense'
  - [ ] fund_expense (pattern fund_contribute 003 + guard balance như fund_withdraw)
  - [ ] transaction_change_fund_source
  - [ ] CREATE OR REPLACE get_budget_with_actuals — copy nguyên văn (đã dump), chỉ thêm điều kiện JOIN `AND NOT (t.transaction_type = 'expense' AND t.fund_id IS NOT NULL)`
  - [ ] Apply + test psql (happy, thiếu số dư, đổi nguồn 2 chiều, budget actual bỏ qua fund expense)
- [ ] Task 2: Schema + types (AC: #2,5,6) — fundExpenseSchema (amount dương, category_id/account_id uuid, date default), FundTransaction type, database.ts Functions
- [ ] Task 3: API routes (AC: #5) — pattern contribute/revert route
- [ ] Task 4: Verify tsc + vitest web/mobile

## Dev Notes

- get_budget_with_actuals hiện tại (dump pg_get_functiondef): LEFT JOIN transactions điều kiện dòng 57-63 (household, date between, exclude_from_budget_report=false, category thuộc linked_category_group_ids). Chỉ thêm 1 dòng điều kiện; giữ nguyên income calc + fallback income_sources + phần đầu RETURNS TABLE.
- LƯU Ý nạp quỹ (fund_contribution, fund_id NOT NULL, direction out) PHẢI tiếp tục tính vào actual line Tiết kiệm — điều kiện loại trừ phải check transaction_type='expense', không chỉ fund_id.
- fund_transactions.transaction_type là TEXT + CHECK ['contribution','withdrawal','release','reset'] — ALTER bằng DROP CONSTRAINT + ADD CONSTRAINT (tên `fund_transactions_transaction_type_check`).
- behavior_type transactions do DB trigger từ category — expense từ quỹ mang category user chọn → behavior đúng loại chi.
- transaction_change_fund_source phải xử lý fund_transactions entry: DELETE entry cũ theo linked_transaction_id + fund cũ; INSERT entry mới. Revert 19.4 chỉ áp cho 'contribution' nên không đụng.
- 19.3 đã chặn PATCH/DELETE transaction có fund_id ở API — change-source là route riêng chủ đích, hợp lệ.
- UI story 19.7 sẽ dùng các route này — story này thuần backend + routes.

### Project Structure Notes

- Files: migration 024 (new), api/funds/[id]/expense/route.ts (new), api/transactions/[id]/change-source/route.ts (new), packages/shared schemas/fund.ts + types/app.ts + types/database.ts.

### References

- [Source: epics-fund-transaction-sync.md#Story 19.6, FR-10/11/14]
- [Source: 023_fund_contribution_revert.sql — pattern guard/lock]

## Dev Agent Record

### Agent Model Used

claude-fable-5[1m]

### Debug Log References

- Migration 024 apply sạch; web tsc + 532 tests pass; mobile tsc pass

### Testing (psql, transaction rollback + mock JWT)

- fund_expense: chi 50k → balance 4.5tr → 4.45tr, transactions row type expense + fund_id đúng, fund_transactions row 'expense' out 50k; chi vượt số dư → ERROR "Số dư quỹ không đủ (hiện có ...)".
- transaction_change_fund_source: bỏ nguồn quỹ → hoàn tiền + xóa ft entry; gắn lại → trừ tiền + tạo ft entry; no-op khi nguồn không đổi (IS NOT DISTINCT FROM); chỉ expense (guard transaction_type).
- get_budget_with_actuals: sum(actual) TRƯỚC = SAU khi thêm fund expense 77k → fund expense không ăn budget; fund_contribution vẫn tính (điều kiện chỉ loại expense+fund_id).

### Completion Notes List

- fund_transactions.transaction_type TEXT + CHECK → mở rộng thêm 'expense' (lịch sử quỹ hiện được cả khoản chi); FundTransaction union type cập nhật tương ứng.
- change_fund_source quản lý cả fund_transactions entry (xóa cũ/tạo mới) để lịch sử quỹ khớp; revert 19.4 không đụng vì chỉ áp cho 'contribution'.
- Route change-source là đường chủ đích duy nhất sửa fund_id (PATCH transaction thường đã bị 19.3 chặn).

### File List

- supabase/migrations/024_fund_expense.sql (new)
- apps/web/src/app/api/funds/[id]/expense/route.ts (new)
- apps/web/src/app/api/transactions/[id]/change-source/route.ts (new)
- packages/shared/src/schemas/fund.ts, types/app.ts, types/database.ts (modified)
