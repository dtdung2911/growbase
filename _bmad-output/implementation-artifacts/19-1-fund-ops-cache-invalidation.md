# Story 19.1: Fund ops invalidate đầy đủ query cache

Status: done

## Story

As a người dùng,
I want list giao dịch, budget và dashboard cập nhật ngay sau khi nạp/rút/tạo/xóa quỹ,
so that không bao giờ thấy số liệu stale phải F5.

## Acceptance Criteria

1. **Given** user nạp quỹ từ ContributeModal với `transaction_date` thuộc tháng bất kỳ, **When** mutation thành công, **Then** query `transactions` được invalidate theo **tháng của transaction_date** (không chỉ `currentMonth` trong store), **And** `budgetActuals`, `budget`, `dashboard`, `reports` của tháng liên quan cũng được invalidate.
2. **Given** user rút quỹ, tạo quỹ, xóa quỹ, release quỹ đệm, **When** mutation thành công, **Then** mọi query key bị ảnh hưởng (funds, fundDetail, fundTransactions, transactions, dashboard, budgetActuals, livingPlan) được invalidate — audit từng mutation trong `apps/web/src/lib/hooks/useFunds.ts`.
3. Tất cả keys lấy từ factory `keys.*` trong `@growbase/shared/queryKeys` — không hardcode mảng key. Nếu cần invalidate theo prefix (mọi tháng/tab), thêm helper prefix vào factory thay vì hardcode.

## Tasks / Subtasks

- [ ] Task 1: Thêm prefix helpers tối thiểu vào keys factory (AC: #3)
  - [ ] `packages/shared/src/queryKeys.ts`: thêm helper dạng `reportsByHousehold: (hid) => ["reports", hid] as const` (chỉ thêm helper thực sự dùng — không thêm dư)
- [ ] Task 2: Fix invalidation contribute/withdraw theo tháng giao dịch (AC: #1)
  - [ ] `useFundContribute`/`useFundWithdraw` trong `apps/web/src/lib/hooks/useFunds.ts`: dùng tham số thứ 2 của `onSuccess` (`variables`: input đã submit) → `txMonth = variables.transaction_date.slice(0, 7)`
  - [ ] Invalidate `keys.transactions(hid, txMonth)`; nếu `txMonth !== month` (store) invalidate thêm `keys.transactions(hid, month)`
  - [ ] Invalidate thêm: `keys.budgetActuals(hid, txMonth)`, `keys.budget(hid, txMonth)`, `keys.dashboard(hid, month)`, `keys.dashboard(hid, txMonth)` (nếu khác), reports theo prefix helper
- [ ] Task 3: Audit các mutation còn lại (AC: #2)
  - [ ] `useCreateFund`: đã có funds + dashboard — thêm `livingPlan` (fund mới ảnh hưởng allocation plan)
  - [ ] `useUpdateFund`: đã có funds + fundDetail + dashboard — thêm `livingPlan` (target/priority_rank đổi → plan đổi)
  - [ ] `useDeleteFund`: thêm `livingPlan`, `fundDetail`/`fundTransactions` của fund bị xóa (removeQueries) — cân nhắc `qc.removeQueries` vì fund không còn
  - [ ] `useFundRelease`: hiện chỉ invalidate `funds` — thêm `livingPlan`, `dashboard`
  - [ ] `useReorderGoalFunds`: đã đủ (funds + livingPlan + dashboard) — xác nhận, không đổi
- [ ] Task 4: Verify (AC: tất cả)
  - [ ] `pnpm --filter @growbase/web exec tsc --noEmit` sạch
  - [ ] Trace tay flow: nạp quỹ với date tháng trước → list giao dịch tháng đó refetch khi điều hướng tới

## Dev Notes

- **Hard gate**: invoke skill `karpathy-guidelines` trước khi viết code. Minimal diff — chỉ sửa `onSuccess` các mutation, không refactor cấu trúc hook.
- Hiện trạng (`apps/web/src/lib/hooks/useFunds.ts`):
  - `useFundContribute` (dòng ~149-158) và `useFundWithdraw` (~181-190) ĐÃ invalidate `transactions/fundTransactions/fundDetail/funds/livingPlan` nhưng theo `month` từ store — miss khi `transaction_date` thuộc tháng khác; thiếu hẳn `budgetActuals`/`budget`/`dashboard`/`reports`.
  - `useFundRelease` (~246-250) chỉ invalidate `funds`.
  - `useCreateFund`/`useUpdateFund`/`useDeleteFund` thiếu `livingPlan`.
- Keys factory: `packages/shared/src/queryKeys.ts` — `transactions(hid, month)`, `budget(hid, month)`, `budgetActuals(hid, month)`, `dashboard(hid, month)`, `reports(hid, month, tab)`, `funds(hid)`, `fundDetail(hid, fundId)`, `fundTransactions(hid, fundId)`, `livingPlan(hid)`. TanStack v5 invalidate theo prefix mảng → helper `["reports", hid]` invalidate mọi tháng/tab.
- `FundContributeInput`/`FundWithdrawInput` (packages/shared/src/schemas/fund.ts) có `transaction_date` string `YYYY-MM-DD` → month = `.slice(0, 7)`.
- KHÔNG đổi API routes/RPC — story này thuần client cache.
- i18n: không có string mới. Toast giữ nguyên.
- Rule bất biến: keys từ factory (Non-Negotiable #5).

### Project Structure Notes

- Chỉ 2 files: `apps/web/src/lib/hooks/useFunds.ts`, `packages/shared/src/queryKeys.ts` (nếu cần helper).
- packages/shared consumed as source — không cần build step riêng.

### References

- [Source: _bmad-output/planning-artifacts/epics-fund-transaction-sync.md#Story 19.1, AD-3]
- [Source: memory project_fund_transaction_sync.md — gói 1]

## Dev Agent Record

### Agent Model Used

claude-fable-5[1m]

### Debug Log References

- `pnpm --filter web exec tsc --noEmit` — clean
- `pnpm --filter web test` — 39 files / 532 tests pass

### Testing

- Flow nạp quỹ khác tháng: `invalidateFundOpCaches` nhận `variables.transaction_date` (type `FundContributeInput` z.infer → luôn string), invalidate transactions/budget/budgetActuals/dashboard cho cả txMonth lẫn storeMonth (dedupe khi trùng) — trace tay qua code, khớp AC1.
- Flow rút quỹ: cùng helper — khớp AC1.
- Audit từng mutation (AC2): create/update thêm livingPlan; delete thêm livingPlan + removeQueries fundDetail/fundTransactions (fund không còn); release thêm fundDetail/livingPlan/dashboard; reorder đã đủ, không đổi.
- AC3: mọi key qua `keys.*`; thêm duy nhất 1 prefix helper `reportsByHousehold` vào factory (invalidate mọi tháng/tab reports).

### Completion Notes List

- Extract `invalidateFundOpCaches` module-level dùng chung cho contribute/withdraw (2 chỗ giống hệt, chống drift).
- Quyết định tự chọn: reports invalidate theo prefix household (rẻ, an toàn) thay vì tính từng tab; delete fund dùng `removeQueries` cho cache của fund đã xóa thay vì invalidate (tránh refetch 404).
- Review: self-audit theo karpathy-guidelines (unattended pipeline).

### File List

- apps/web/src/lib/hooks/useFunds.ts (modified)
- packages/shared/src/queryKeys.ts (modified — thêm reportsByHousehold)
