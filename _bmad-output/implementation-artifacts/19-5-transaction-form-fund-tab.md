# Story 19.5: Form giao dịch 3 loại — tab Nạp quỹ

Status: done

## Story

As a người dùng,
I want nạp quỹ ngay từ form thêm giao dịch,
so that không phải rời màn giao dịch để đi tìm trang quỹ.

## Acceptance Criteria

1. QuickAddSheet có tab "Nạp quỹ" bên cạnh Chi tiêu / Thu nhập (giữ tab Chuyển khoản hiện có).
2. Tab Nạp quỹ: ô chọn quỹ (tên + số dư hiện tại); chọn quỹ → hiện form nạp với số dư trước/sau theo số tiền đang nhập (font-mono).
3. Option "+ Tạo quỹ mới" mở modal tạo quỹ (FundForm); quỹ mới tạo xong được chọn sẵn trong ô chọn quỹ.
4. Household chưa có quỹ: empty-state trong tab dẫn đi tạo quỹ (mở FundForm).
5. Submit dùng API contribute hiện có qua `useFundContribute(selectedFundId)` — không endpoint mới; isPending disable, success toast 2s + đóng sheet, error giữ form + toast 5s.
6. i18n vi/en cho string mới.

## Tasks / Subtasks

- [ ] Task 1: Export `ContributeForm` từ `ContributeModal.tsx` (hiện là function nội bộ dòng 59) — thêm `export`, không đổi logic (AC: #2, #5)
- [ ] Task 2: `FundForm.tsx` thêm prop optional `onCreated?: (fund: Fund) => void` gọi sau create thành công (AC: #3)
- [ ] Task 3: Component mới `apps/web/src/components/transactions/FundContributeTab.tsx` (AC: #2,3,4)
  - [ ] useFunds() list; empty → empty-state + Button mở FundForm
  - [ ] Select quỹ: option label "tên — số dư formatVND"; footer option/nút "+ Tạo quỹ mới"
  - [ ] Render `<ContributeForm fund={selected} onClose={...} />` (đã có preview trước/sau: dòng 133 current_balance, dòng 247-250 balanceAfter)
- [ ] Task 4: QuickAddSheet thêm TabsTrigger + TabsContent "fund" (AC: #1) — value "fund", label `tx.fundShort`
- [ ] Task 5: i18n keys + verify (tsc, vitest, trace flow)

## Dev Notes

- QuickAddSheet.tsx (77 dòng): Tabs expense/income/transfer, mỗi TabsContent render form riêng; TransactionForm dùng cho expense/income (KHÔNG sửa TransactionForm — tab mới độc lập, tránh đụng zodResolver createTransactionSchema).
- ContributeForm props: `{ fund: Fund; onClose: () => void; suggestedAmount?: number | null }` — dùng `useFundContribute(fund.id)` bên trong (đã có invalidation 19.1). onClose của tab = đóng QuickAddSheet (truyền từ parent).
- FundForm `{ open, onClose }` dùng ở FundList — thêm onCreated không phá call site cũ.
- useCreateFund trả `Fund` trong onSuccess mutation — FundForm gọi `onCreated?.(fund)` trong onSuccess callback của mutate.
- Empty-state pattern: text muted + Button primary (xem UX rule Error Patterns CLAUDE.md).
- i18n: `tx.fundShort` (vi "Nạp quỹ" / en "Fund"), `tx.selectFund` (vi "Chọn quỹ"), `tx.noFundsYet` (vi "Chưa có quỹ nào. Tạo quỹ đầu tiên để bắt đầu tích lũy."), `tx.createFundNew` (vi "+ Tạo quỹ mới").
- Select component: dùng shadcn Select như các form khác (xem ContributeForm account select).

### Project Structure Notes

- Files: QuickAddSheet.tsx, FundContributeTab.tsx (new), ContributeModal.tsx (export), FundForm.tsx (prop), messages vi/en.

### References

- [Source: epics-fund-transaction-sync.md#Story 19.5, FR-5]

## Dev Agent Record

### Agent Model Used

claude-fable-5[1m]

### Debug Log References

- tsc clean; vitest 532 pass; `pnpm --filter web build` thành công

### Testing

- Tab flow trace: QuickAddSheet 4 tabs (Chi/Thu/Nạp quỹ/Chuyển); tab fund render FundContributeTab; chọn quỹ → ContributeForm (preview số dư trước/sau đã có sẵn trong component tái sử dụng); submit → useFundContribute → POST /api/funds/[id]/contribute (không endpoint mới); onClose đóng sheet.
- Empty-state: funds.length===0 → message + nút mở FundForm.
- Tạo quỹ inline: FundForm onCreated(fund) → setFundId(fund.id) → quỹ mới được chọn sẵn (cả từ empty-state lẫn nút "+ Tạo quỹ mới").

### Completion Notes List

- KHÔNG sửa TransactionForm/createTransactionSchema — tab Nạp quỹ độc lập, tái sử dụng ContributeForm (export từ ContributeModal) tránh duplicate form logic + giữ nguyên invalidation 19.1.
- Giữ tab "Chuyển" hiện có (thiết kế nói 3 loại nhưng transfer là feature đang tồn tại — không xóa).
- FundForm thêm prop optional `onCreated` — call site cũ (FundList) không đổi.

### File List

- apps/web/src/components/transactions/FundContributeTab.tsx (new)
- apps/web/src/components/transactions/QuickAddSheet.tsx (modified)
- apps/web/src/components/funds/ContributeModal.tsx (modified — export ContributeForm)
- apps/web/src/components/funds/FundForm.tsx (modified — onCreated prop)
- apps/web/src/lib/i18n/messages/vi.json, en.json (modified)
