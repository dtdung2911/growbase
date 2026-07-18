# Story 19.7: UI chi từ quỹ — nguồn tiền, nút trang quỹ, báo cáo tách dòng

Status: done

## Story

As a người dùng,
I want chọn nguồn tiền khi chi tiêu và thấy báo cáo tách bạch chi-từ-thu-nhập / chi-từ-quỹ,
so that hiểu đúng tiền tháng này đi đâu.

## Acceptance Criteria

1. Form Chi tiêu (TransactionForm, create mode): trường "Nguồn tiền" mặc định "Thu nhập tháng", chọn được quỹ (hiện số dư); chọn quỹ → submit gọi POST `/api/funds/[id]/expense` (hook `useFundExpense` mới, invalidate qua `invalidateFundOpCaches`); mặc định → flow createTransaction như cũ. Chỉ hiện cho loại expense.
2. Gợi ý lưới đỡ: chọn category có quỹ tên tương đồng (normalize bỏ dấu, khớp từ) và số dư > 0 → hint dismissable đề nghị chuyển nguồn sang quỹ đó, bấm → set nguồn tiền.
3. TransactionEditSheet: transaction `expense` có selector "Nguồn tiền" (Thu nhập tháng / quỹ) gọi POST `/api/transactions/[id]/change-source` — hoạt động cả với expense thường lẫn expense gắn quỹ (hành động được phép duy nhất trên tx khóa).
4. Trang chi tiết quỹ: nút "Chi từ quỹ" mở modal (category + amount + account + date + note) submit qua useFundExpense.
5. Báo cáo: `MonthlySummaryRow` thêm `expenseFromFund`; OverviewTab cột Tổng chi hiện sub-line "từ quỹ" khi > 0 (2 dòng: từ thu nhập mặc định là phần còn lại).
6. i18n vi/en; isPending disable; toast chuẩn.

## Tasks / Subtasks

- [ ] Task 1: Hook `useFundExpense()` trong useFunds.ts — input `FundExpenseInput & { fund_id: string }`, dùng invalidateFundOpCaches (AC: #1,4)
- [ ] Task 2: TransactionForm — state `fundSourceId` + prop optional `onSubmitFundExpense?: (fundId, data) => void`; block "Nguồn tiền" sau Category (chỉ direction out + expense + !initialData); suggestion hint (useFunds + useCategories name match) (AC: #1,2)
- [ ] Task 3: QuickAddSheet truyền onSubmitFundExpense cho tab expense (AC: #1)
- [ ] Task 4: TransactionEditSheet — selector nguồn tiền cho expense, mutation change-source + invalidate (AC: #3)
- [ ] Task 5: `FundExpenseModal` component + nút "Chi từ quỹ" ở funds/[id]/page.tsx (AC: #4)
- [ ] Task 6: monthly-summary route select thêm `transaction_type, fund_id`, tính `expenseFromFund`; OverviewTab sub-line (AC: #5)
- [ ] Task 7: i18n + tsc + vitest + build

## Dev Notes

- monthly-summary route.ts:39 select thiếu transaction_type/fund_id; loop dòng 66-75 direction out → totalExpense. Thêm `expenseFromFund` vào type + row init + loop (`tx.transaction_type === 'expense' && tx.fund_id`). totalExpense giữ nguyên semantics (mọi direction out).
- OverviewTab dòng 232-234 cell Tổng chi — thêm sub-line nhỏ khi expenseFromFund > 0.
- TransactionForm: Category block dòng 130-145; direction/transactionType từ watch (dòng 74-75). Create mode = !initialData.
- Normalize tên: lowercase + `.normalize("NFD").replace(/\p{Diacritic}/gu, "")`; match khi 1 từ (>2 ký tự) của category name xuất hiện trong fund name hoặc ngược lại.
- TransactionEditSheet: 19.3 đã có isLocked; selector nguồn tiền đặt ngoài phần form (hiện cả khi locked, chỉ cho transaction_type='expense'). Sau change-source thành công: invalidate transactions/funds/budget (dùng invalidateFundOpCaches với fund cũ/mới — đơn giản: invalidate cả 2 qua 2 lần gọi hoặc export helper; tối thiểu: gọi invalidateFundOpCaches với fund mới nếu có, quỹ cũ được cover vì helper invalidate keys.funds toàn household — fundDetail quỹ cũ cần thêm invalidate riêng nếu biết id cũ (transaction.fund_id trước đổi)).
- FundExpenseModal: pattern ContributeModal (Sheet bottom); CategoryPicker direction="out".
- RPC/routes đã có từ 19.6 — story này KHÔNG đụng migration.

### Project Structure Notes

- Files: useFunds.ts, TransactionForm.tsx, QuickAddSheet.tsx, TransactionEditSheet.tsx, FundExpenseModal.tsx (new), funds/[id]/page.tsx, api/reports/monthly-summary/route.ts, OverviewTab.tsx, messages vi/en.

### References

- [Source: epics-fund-transaction-sync.md#Story 19.7, FR-12/13]
- [Source: 19-6-spend-from-fund-rpc.md — routes + RPC semantics]

## Dev Agent Record

### Agent Model Used

claude-fable-5[1m]

### Debug Log References

- tsc clean; vitest 532 pass; next build compiled; mobile tsc clean

### Testing

- Nguồn tiền create-mode: showFundSource chỉ khi !initialData + expense + parent truyền onSubmitFundExpense; chọn quỹ → submit route sang handleFundExpense (QuickAddSheet) → useFundExpense POST /api/funds/[id]/expense; mặc định → createTransaction như cũ.
- Suggestion: nameMatches (normalize NFD bỏ dấu, từ >2 ký tự khớp chéo) + balance > 0; dismiss được; bấm "Dùng quỹ" set nguồn.
- Đổi nguồn hậu kiểm: selector trong TransactionEditSheet (chỉ expense, cả tx khóa); useChangeFundSource invalidate cache cả quỹ cũ + mới (previous_fund_id truyền từ UI).
- Trang quỹ: nút "Chi từ quỹ" (disable khi balance=0) mở FundExpenseModal (preview số dư sau chi, đỏ khi âm).
- Báo cáo: monthly-summary thêm expenseFromFund; OverviewTab cột chi hiện dòng chính = chi-từ-thu-nhập, sub-line "Từ quỹ: X" khi > 0.

### Completion Notes List

- useFundExpense nhận fund_id trong input (dùng chung form giao dịch + modal trang quỹ, tránh 2 hook).
- totalExpense giữ nguyên semantics trong API (mọi direction out) — UI tự tách bằng phép trừ, chart giữ tổng.
- Quyết định: selector nguồn tiền trong edit sheet là hành động được phép duy nhất trên expense gắn quỹ (đi qua RPC atomic, không qua PATCH bị khóa).

### File List

- apps/web/src/lib/hooks/useFunds.ts (modified — useFundExpense, useChangeFundSource)
- apps/web/src/components/transactions/TransactionForm.tsx (modified — Nguồn tiền + suggestion)
- apps/web/src/components/transactions/QuickAddSheet.tsx (modified)
- apps/web/src/components/transactions/TransactionEditSheet.tsx (modified — change source selector)
- apps/web/src/components/funds/FundExpenseModal.tsx (new)
- apps/web/src/app/(app)/funds/[id]/page.tsx (modified — nút Chi từ quỹ)
- apps/web/src/app/api/reports/monthly-summary/route.ts (modified — expenseFromFund)
- apps/web/src/components/reports/OverviewTab.tsx (modified — tách 2 dòng)
- apps/web/src/lib/i18n/messages/vi.json, en.json (modified)
