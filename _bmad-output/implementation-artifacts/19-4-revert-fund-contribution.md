# Story 19.4: RPC hoàn tác lần nạp quỹ

Status: done

## Story

As a người dùng,
I want hoàn tác một lần nạp quỹ nhầm,
so that số dư quỹ và list giao dịch cùng lúc trở về đúng.

## Acceptance Criteria

1. Migration 023: RPC `fund_contribution_revert(p_household_id, p_fund_tx_id)` SECURITY DEFINER, atomic: membership guard → lock fund FOR UPDATE → validate fund_transaction là 'contribution' của household → chặn nếu `current_balance < amount` (message rõ) → DELETE transaction liên kết (`linked_transaction_id`) → DELETE fund_transaction row → trừ `current_balance`.
2. API route POST `/api/funds/[id]/revert` body `{ fund_tx_id }`: withAuth + withIdempotency (pattern contribute), gọi RPC, validate uuid.
3. UI lịch sử quỹ (trang `/funds/[id]`): row contribution (không `is_automatic`) có nút hoàn tác; ConfirmDialog trước; mutation isPending disable; success toast 2s / error toast 5s.
4. Sau hoàn tác: số dư + lịch sử quỹ + list giao dịch + budget/dashboard cập nhật ngay (dùng `invalidateFundOpCaches` từ 19.1 với transaction_date của fund_tx).
5. i18n vi/en cho mọi string mới.

## Tasks / Subtasks

- [ ] Task 1: Migration `supabase/migrations/023_fund_contribution_revert.sql` (AC: #1) — mirror pattern `fund_contribute` (003_functions.sql): guard `get_user_household_ids()`, lock funds FOR UPDATE, RAISE EXCEPTION các case; apply psql + test bằng seed data
- [ ] Task 2: API route `apps/web/src/app/api/funds/[id]/revert/route.ts` (AC: #2) — copy skeleton contribute/route.ts, schema zod `{ fund_tx_id: uuid }`
- [ ] Task 3: Hook `useFundContributionRevert(fundId)` trong useFunds.ts (AC: #4) — onSuccess gọi `invalidateFundOpCaches` (cần transaction_date: truyền từ UI vào mutation input)
- [ ] Task 4: UI nút hoàn tác (AC: #3, #5) — fund detail page history rows (cả bảng desktop lẫn card mobile nếu có 2 layout), chỉ hiện cho `transaction_type === 'contribution'`; ConfirmDialog shared component
- [ ] Task 5: Verify — psql test RPC (revert đúng, chặn thiếu số dư, chặn tx không phải contribution, chặn household khác), tsc + vitest

## Dev Notes

- `fund_contribute` (003, xem pg_get_functiondef): insert transactions (`fund_contribution`, direction 'out', category, fund_id) → insert fund_transactions (`contribution`, direction 'in', balance_after, linked_transaction_id) → update funds.current_balance. Revert đảo đúng chuỗi này bằng DELETE + trừ balance.
- fund_transactions columns: id, household_id, fund_id, transaction_type, amount, direction, balance_after, linked_transaction_id, description, transaction_date, is_automatic, created_at.
- Chọn semantics DELETE cả 2 rows (undo thật) thay vì insert compensating row — history sạch, khớp thiết kế "xóa transaction liên kết". `balance_after` của các entry sau đó thành số lịch sử không khớp — chấp nhận (display-only), ghi chú trong migration.
- Chặn revert khi `current_balance < amount` (đã rút/chi mất phần đó): message "Số dư quỹ không đủ để hoàn tác lần nạp này".
- Chỉ cho revert `transaction_type = 'contribution'` — withdrawal/release/reset không revert được story này.
- FundTransaction type (app.ts:123) — không cần đổi.
- UI: `/funds/[id]/page.tsx` (~396 dòng) render history; thêm cột/nút icon `lucide:undo-2` (pattern icon button + ConfirmDialog như TransactionEditSheet).
- 19.3 đã khóa sửa/xóa transaction gắn quỹ ở API — revert là đường chính thống duy nhất.

### Project Structure Notes

- Files: migration 023 (new), api/funds/[id]/revert/route.ts (new), useFunds.ts, funds/[id]/page.tsx, schemas/fund.ts (thêm schema revert nếu cần), messages vi/en.

### References

- [Source: epics-fund-transaction-sync.md#Story 19.4, FR-4]
- [Source: supabase/migrations/003_functions.sql#fund_contribute]

## Dev Agent Record

### Agent Model Used

claude-fable-5[1m]

### Debug Log References

- web tsc clean (sau khi thêm fund_contribution_revert vào database.ts Functions union); web vitest 532 pass; mobile tsc clean

### Testing

- RPC test psql (transaction rollback, mock JWT claims): happy path nạp 100k → revert → balance về đúng, tx + fund_tx bị xóa; guard thiếu số dư (nạp rồi rút gần hết → revert fail đúng message); guard membership (user lạ → Access denied); guard loại (WHERE transaction_type='contribution' → "Chỉ hoàn tác được lần nạp quỹ").
- UI: nút hoàn tác chỉ hiện cho contribution không is_automatic, ở cả bảng desktop lẫn card mobile; ConfirmDialog trước khi mutate; isPending disable.
- Invalidation: dùng lại `invalidateFundOpCaches` (19.1) với transaction_date của fund_tx.

### Completion Notes List

- Semantics: undo thật (DELETE cả 2 rows) — history sạch; balance_after các entry sau thành số lịch sử, chấp nhận (ghi chú trong migration).
- API: POST /api/funds/[id]/revert body {fund_tx_id} — theo pattern contribute/withdraw/release, có withIdempotency.
- Quyết định: không revert lần nạp is_automatic (từ hệ thống allocation) để tránh phá plan.

### File List

- supabase/migrations/023_fund_contribution_revert.sql (new)
- apps/web/src/app/api/funds/[id]/revert/route.ts (new)
- apps/web/src/lib/hooks/useFunds.ts (modified — useFundContributionRevert)
- apps/web/src/app/(app)/funds/[id]/page.tsx (modified)
- packages/shared/src/types/database.ts (modified — Functions union)
- apps/web/src/lib/i18n/messages/vi.json, en.json (modified)
