---
spec: import-transactions-v2
status: approved
branch: feat/import-transactions-v2
decisions:
  - SPLIT confirmed — implement Goal 1 (migration + fix consumers + test) fully, THEN Goal 2 (import).
  - fund_transactions.transaction_date ALSO altered to timestamptz (keep time consistent in fund ledger).
created: 2026-07-22
author: DzungDuong
---

# Import Transactions v2 + datetime cho transaction_date

## Bối cảnh
Nâng cấp import giao dịch: file template Excel chuẩn, parse tiền/ngày-giờ chắc, preview sửa được ghi chú + hiện giờ. Ràng buộc: `transactions.transaction_date` đang là `DATE` → phải đổi sang `timestamptz` (phương án b) để lưu giờ:phút. Việc đổi kiểu cột này lan tới budget RPC live + nhiều API route.

## ⚠️ Cảnh báo scope + rủi ro
Đây là **2 deliverable độc lập** (multi-goal, vượt xa 900–1600 token):

**GOAL 1 — Migration `transaction_date` DATE → timestamptz (nền, RỦI RO CAO).**
Chạm vào **budget aggregation vừa deploy prod**. Class bug chính: `BETWEEN v_month_start AND v_month_end` với `v_month_end` = ngày cuối tháng → khi cột thành timestamptz, `2026-07-31` = `2026-07-31 00:00`, **bỏ sót mọi giao dịch ngày 31 sau 00:00**. Lỗi âm thầm, sai số liệu tiền. Xuất hiện ở RPC live + 8 API route + grouping list.

**GOAL 2 — Import v2 (feature).**
Template Excel + auto-detect + parse datetime + preview (giờ + edit ghi chú). Phần lớn độc lập; chỉ phần "lưu giờ" phụ thuộc Goal 1.

**Khuyến nghị: TÁCH 2 spec.** Goal 1 ship + test kỹ trước (đụng tiền/budget prod), Goal 2 sau. Nếu gộp, rủi ro migration trộn với UI khó review/rollback.

---

## GOAL 1 — datetime migration

### Acceptance
- **AC1.1** Given cột `transactions.transaction_date` kiểu date, When chạy migration 027, Then cột thành `timestamptz`, dữ liệu cũ cast về `AT TIME ZONE 'Asia/Ho_Chi_Minh'` (00:00 VN), default `now()`.
- **AC1.2** Given giao dịch chi ngày 31 lúc 14:00, When tính budget tháng đó, Then khoản đó **được** tính (không bị BETWEEN cắt).
- **AC1.3** Given filter/list/report theo khoảng tháng, When có giao dịch cuối ngày cuối tháng, Then không mất dòng nào.
- **AC1.4** Given danh sách giao dịch nhóm theo ngày, When nhiều giao dịch khác giờ cùng ngày, Then vẫn gộp đúng 1 nhóm/ngày.

### Code map (sửa — nguồn: điều tra)
- `supabase/migrations/027_transaction_datetime.sql` (MỚI): `ALTER COLUMN transaction_date TYPE timestamptz USING (transaction_date::timestamp AT TIME ZONE 'Asia/Ho_Chi_Minh')`, SET DEFAULT now(). Quyết: có ALTER luôn `fund_transactions.transaction_date` (002:234) không — RPC copy ngày từ transactions sang; nếu giữ date thì giờ bị cắt ở fund_transactions.
- **`024_fund_expense.sql:168,200`** — `BETWEEN v_month_start AND v_month_end` → `>= v_month_start AND < (v_month_start + interval '1 month')`. RPC BUDGET LIVE, ưu tiên cao nhất. (027 phải CREATE OR REPLACE lại hàm này.)
- `dashboard/route.ts:53` `.eq(transaction_date, yesterday)` → range [day, day+1). `:44,61,169-170,202-204` so chuỗi/`.gte/.lte` → range nửa mở.
- `transactions/route.ts:27-28` `.gte/.lte` → nửa mở. `living-plan/route.ts:47-48,54-55,98`; `reports/monthly-summary/route.ts:43-44` — như trên.
- `useTransactionReminder.ts:40` `=== today` → so phần ngày (`slice(0,10)`).
- `TransactionList.tsx:44` groupByDate key → `d.slice(0,10)`. `:147` format thêm giờ. `TransactionEditSheet.tsx:156` format timestamp.
- `schemas/transaction.ts:12,27` + `fund.ts:47,59,67` default `.slice(0,10)` → full ISO. Test `transaction.test.ts:50,176`, `fund.test.ts:37,103` regex date-only → cập nhật.
- `mark_payment_paid`/`fund_contribute`/`fund_withdraw`/`fund_expense` param `p_date date` → cân nhắc widen `timestamptz` để giữ giờ (nếu không, mọi ghi qua RPC = 00:00).
- `database.ts:103` + `app.ts:75,132`: type vẫn `string`, cập nhật comment.
- Dedup import `route.ts:53` key gồm transaction_date → normalize `slice(0,10)` để không đổi ngữ nghĩa chống trùng.
- `seed_transactions_dev.sql`: make_date vẫn hợp lệ (00:00). Không đổi.

### Test Goal 1
Migration apply local + verify: giao dịch 31/14:00 vào budget; range API không mất dòng cuối tháng; grouping list đúng; vitest 534 pass.

---

## GOAL 2 — Import v2

### Acceptance
- **AC2.1** Given màn import, When bấm "Tải template", Then tải `.xlsx` cột: **Ngày giờ (d/m/Y H:i), thu, chi, diễn giải**.
- **AC2.2** Given upload file theo template, When qua bước map, Then 4 cột tự nhận (auto-detect đã hỗ trợ), map cột vẫn là fallback cho file lạ.
- **AC2.3** Given ô "Ngày giờ" = "22/07/2026 14:30", When parse, Then ra ISO đủ giờ (không cắt về date).
- **AC2.4** Given cột thu/chi nhiều định dạng số ("1.000.000", "1,000,000"), When parse, Then đúng số tiền; thu→income/in, chi→expense/out.
- **AC2.5** Given bước 3 Xem trước, When xem, Then cột Ngày hiện cả giờ:phút.
- **AC2.6** Given bước 3 Xem trước, When sửa ô Ghi chú 1 dòng, Then giá trị đó dùng khi import.

### Code map
- `excel.ts`: thêm helper generate template (`XLSX.utils.aoa_to_sheet` + `write`) — xlsx@0.18.5 đã có. `formatDateCell:51-56` → giữ giờ (không ép YYYY-MM-DD).
- `csv.ts:132-148 parseDate` → bắt thêm group `H:i(:s)`, trả ISO đủ giờ.
- `ImportClient.tsx`: nút tải template (bước 1); `PreviewRow:51-62` thêm field note editable; date cell `:804-806`/`:882` hiện giờ; description cell `:807-811`/`:894` → `<input>` sửa được, cập nhật state previewRows.
- `parseAmount` (csv.ts:109) đã chắc — không đổi (xác nhận với anh nếu có định dạng fail).
- `route.ts:6-14` importRowSchema: transaction_date nhận datetime (có thể siết regex ISO).

### Test Goal 2
Tải template → điền → upload → auto-map → preview hiện giờ + sửa note → import; datetime persist (cần Goal 1). vitest cho parseDate datetime + parseAmount.

---

## Thứ tự
Goal 1 (migration + fix consumers + test) → Goal 2 (import). Goal 2 cần Goal 1 để giờ persist.
