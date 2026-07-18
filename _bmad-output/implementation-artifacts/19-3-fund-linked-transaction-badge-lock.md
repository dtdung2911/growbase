# Story 19.3: Badge + khóa transaction gắn quỹ

Status: done

## Story

As a người dùng,
I want transaction nạp quỹ hiển thị rõ thuộc quỹ nào và không sửa/xóa trực tiếp được,
so that số dư quỹ không bao giờ lệch với lịch sử giao dịch.

## Acceptance Criteria

1. Transaction có `fund_id IS NOT NULL` trong list giao dịch render badge tên quỹ (row đã hiện category "Tiết kiệm & Quỹ" → badge "· <tên quỹ>" cạnh đó); click badge dẫn tới `/funds/[fund_id]` (stopPropagation khỏi row).
2. Sheet chi tiết giao dịch gắn quỹ: read-only (đã có cho system types — mở rộng điều kiện sang `fund_id`), hiện message i18n + link "Xem quỹ" tới trang quỹ.
3. API PUT/DELETE `/api/transactions/[id]` trả 403 khi transaction có `fund_id IS NOT NULL` (message hướng dẫn thao tác từ trang quỹ) — bổ sung bên cạnh guard SYSTEM_TYPES hiện có (để chặn cả expense gắn quỹ của story 19.6 sau này).
4. GET `/api/transactions` join thêm `funds(id, name)` → field `fund` trên `TransactionWithJoins` (optional để không phá dashboard/recentTransactions).
5. i18n vi/en đầy đủ cho mọi string mới.

## Tasks / Subtasks

- [ ] Task 1: Data plumbing (AC: #4)
  - [ ] `apps/web/src/app/api/transactions/route.ts` GET select thêm `funds(id, name)`; map `fund: funds ?? null` như pattern categories/accounts (dòng 24, 36-39)
  - [ ] `packages/shared/src/types/app.ts` `TransactionWithJoins` thêm `fund?: { id: string; name: string } | null`
- [ ] Task 2: UI badge + link (AC: #1, #5)
  - [ ] `TransactionItem.tsx`: khi `tx.fund_id && tx.fund` render Badge nhỏ "<tên quỹ>" cạnh categoryName (pattern Badge costType hiện có dòng 44-48); onClick stopPropagation + `router.push(\`/funds/\${tx.fund_id}\`)`
- [ ] Task 3: Khóa UI (AC: #2, #5)
  - [ ] `TransactionEditSheet.tsx`: `const isLocked = isSystemTx || Boolean(transaction.fund_id)` — dùng isLocked thay isSystemTx cho title/delete-button/read-only body; thêm message `tx.fundTxLocked` + link `/funds/[fund_id]` khi fund_id
- [ ] Task 4: Khóa API (AC: #3)
  - [ ] `apps/web/src/app/api/transactions/[id]/route.ts`: PUT + DELETE select thêm `fund_id`; guard `existing.fund_id` → 403 `tx.fundTxLocked` message (tiếng Việt như các error hiện có)
- [ ] Task 5: Verify
  - [ ] tsc + vitest; trace flow: GET trả fund join; PUT/DELETE transaction có fund_id → 403

## Dev Notes

- Hard gate karpathy: diff nhỏ, mở rộng guard hiện có thay vì viết mới.
- Hiện trạng:
  - Row `TransactionItem` là `<button>` mở edit sheet — badge phải stopPropagation, không nest `<a>` trong button (dùng span role="link" hoặc onClick router.push).
  - `TransactionEditSheet.tsx` dòng 41-43: SYSTEM_TYPES read-only đã có (`tx.systemTxReadonly` key i18n dòng 100-101 messages). fund_contribution đã bị khóa theo type — story này thêm chiều `fund_id` (đón expense-từ-quỹ 19.6).
  - API `[id]/route.ts`: PUT dòng 24-46 select `id, transaction_type` + guard SYSTEM_TYPES; DELETE tương tự (~dòng 87-98). Thêm `fund_id` vào select + guard.
  - GET route.ts dòng 24: select string + map thủ công `categories→category`, `accounts→account` (dòng 36-39) — làm giống cho `funds→fund`.
- i18n keys mới đề xuất: `tx.fundTxLocked` (vi: "Giao dịch gắn quỹ — hoàn tác hoặc chi từ trang quỹ."), `tx.viewFund` (vi: "Xem quỹ"). Thêm cả vi.json + en.json (dòng ~100).
- KHÔNG đổi RPC/migration. Mobile app đọc qua cùng /api — thêm field optional an toàn.

### Project Structure Notes

- Files: transactions/route.ts, transactions/[id]/route.ts, TransactionItem.tsx, TransactionEditSheet.tsx, packages/shared/src/types/app.ts, messages/vi.json + en.json.

### References

- [Source: epics-fund-transaction-sync.md#Story 19.3, FR-3]
- [Source: 19-2-system-savings-category.md — category hệ thống đã có, contribute gắn fund_id]

## Dev Agent Record

### Agent Model Used

claude-fable-5[1m]

### Debug Log References

- web tsc clean; web vitest 39/532 pass; mobile tsc clean (sau khi regenerate typed routes); mobile vitest 24/158 pass

### Testing

- GET /api/transactions: thêm join `funds(id,name)` + map `fund` theo đúng pattern categories/accounts — trace code.
- Lock UI: `isLocked = isSystemTx || fund_id` áp cho title/delete button/read-only body; message `tx.fundTxLocked` + Link "Xem quỹ" khi fund_id.
- Lock API: PUT + DELETE guard `existing.fund_id` → 403 sau guard SYSTEM_TYPES (đón cả expense-từ-quỹ 19.6, loại này không nằm trong SYSTEM_TYPES).
- Badge row: chỉ render khi `fund_id && fund`; stopPropagation khỏi row button, router.push /funds/[id].

### Completion Notes List

- `fund` optional trên TransactionWithJoins để dashboard/recentTransactions (không join fund) không phải đổi.
- Badge dùng span role="link" trong row (row là `<button>`, không nest `<a>`).
- Baseline fix ngoài scope: mobile tsc fail do `.expo/types/router.d.ts` stale (thiếu /funds, /budget từ epic 17) — regenerate bằng expo start ngắn (file gitignored, không commit).

### File List

- apps/web/src/app/api/transactions/route.ts (modified)
- apps/web/src/app/api/transactions/[id]/route.ts (modified)
- apps/web/src/components/transactions/TransactionItem.tsx (modified)
- apps/web/src/components/transactions/TransactionEditSheet.tsx (modified)
- packages/shared/src/types/app.ts (modified)
- apps/web/src/lib/i18n/messages/vi.json, en.json (modified)
