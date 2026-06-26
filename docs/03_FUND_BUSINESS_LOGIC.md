# Fund System — Business Logic & Rules

## 5 loại Fund và đặc tính

| Fund | Mục đích | Reset? | Đầu tư? | Priority |
|------|----------|--------|---------|---------|
| Emergency | Rủi ro bất ngờ | Không | Không | 1 (cao nhất) |
| Sinking | Chi lớn biết trước | Không | Không | 2 |
| Goal | Mục tiêu dài hạn | Không | Có | 3 |
| Investment | Tăng trưởng tài sản | Không | Có | 4 |
| Freedom | Tiêu thoải mái | Có (hàng tháng) | Không | 5 |

---

## Quy tắc nghiệp vụ cốt lõi

### Rule 1: Nạp quỹ = chi tiêu, Rút quỹ ≠ chi tiêu

```
Khi nạp quỹ (fund_contribution):
  - transaction_type = 'fund_contribution'
  - exclude_from_budget_report = FALSE
  - Tính vào chi tiêu tháng đó (như chi tiêu bình thường)
  - Cộng vào fund.current_balance

Khi rút quỹ để chi thực (fund_withdrawal):
  - transaction_type = 'fund_withdrawal'
  - exclude_from_budget_report = TRUE  ← TRIGGER tự động set
  - KHÔNG tính vào chi tiêu tháng đó
  - Trừ khỏi fund.current_balance
```

**Ví dụ thực tế:**
- Tháng 1-12: nạp Quỹ tivi 1.2tr/tháng → mỗi tháng báo cáo có 1.2tr "Nạp Quỹ thiết bị"
- Tháng 3: rút 14.6tr mua tivi → báo cáo tháng 3 KHÔNG có khoản 14.6tr
- Kết quả: chi tiêu tháng 3 sạch, không méo trend alerts

### Rule 2: Thứ tự ưu tiên nạp quỹ khi dư tiền

```
Priority 1: Emergency Fund (nếu < 100% target)
Priority 2: Sinking Funds (ưu tiên fund gần deadline nhất)
Priority 3: Goal Funds
Priority 4: Investment Fund
Priority 5: Freedom Fund (reset hàng tháng)
```

**Không bao giờ đầu tư khi Emergency Fund < 50% target.**

### Rule 3: Thu nhập bất thường → Allocation Rules

```typescript
// Khi nhận thu nhập có is_unusual_income = true:
async function applyAllocationRules(
  amount: number,
  householdId: string
): Promise<AllocationResult[]> {
  // 1. Load income_allocation_rules theo priority
  // 2. Áp dụng tuần tự: % hoặc fixed amount
  // 3. Tạo fund_transactions tương ứng
  // 4. Hiển thị suggestion cho user xác nhận
}
```

**Ví dụ:** Thưởng Tết 20tr →
- Rule 1 (priority 1): 30% = 6tr → Quỹ khẩn cấp
- Rule 2 (priority 2): 20% = 4tr → Quỹ học phí Minnie
- Rule 3 (priority 3): 50% = 10tr → Quỹ đầu tư

### Rule 4: Freedom Fund reset đầu tháng

```typescript
// Cron job ngày 1 hàng tháng:
async function resetFreedomFunds(householdId: string) {
  const freedomFunds = await getFundsByType(householdId, 'freedom')
  for (const fund of freedomFunds) {
    if (fund.reset_monthly) {
      // Số dư cũ còn lại → ghi vào lịch sử nhưng reset về amount_per_member
      await createFundTransaction(fund.id, 'adjustment',
        fund.amount_per_member - fund.current_balance,
        'Reset đầu tháng'
      )
    }
  }
}
```

### Rule 5: Emergency Fund target tự động tính

```sql
-- Target = trung bình chi tiêu 3 tháng × target_months_expense
SELECT calculate_emergency_target(:household_id)
-- Tự cập nhật khi chi tiêu thay đổi
```

### Rule 6: Sinking Fund + category_group liên kết

```
category_groups.funded_by_fund_id → funds.id

Khi user nhập giao dịch vào category thuộc group có funded_by_fund_id:
  → Hệ thống hỏi: "Khoản này rút từ [Quỹ X] hay chi từ ngân sách?"
  → User chọn "Rút quỹ" → transaction_type = 'fund_withdrawal'
  → User chọn "Chi ngân sách" → transaction_type = 'expense' (thường)
```

---

## Fund Dashboard — màn hình chính

```
┌─────────────────────────────────────────────────────────┐
│ Hệ thống Quỹ                          Tổng: 47.5 triệu  │
├─────────────────────────────────────────────────────────┤
│ 🛡️ Quỹ khẩn cấp          21tr / 120tr  ████░░░░  17%   │
│    ↳ Nạp 4tr/tháng → đủ trong 25 tháng                 │
├─────────────────────────────────────────────────────────┤
│ 🪣 SINKING FUNDS                                         │
│ 📚 Quỹ học phí Minnie     0 / 30tr     ░░░░░░░░   0%   │
│    ↳ Nạp 2.5tr/tháng → đủ trước 02/2027  [!]           │
│ 📺 Quỹ thiết bị & nhà     0 / 15tr     ░░░░░░░░   0%   │
│    ↳ Nạp 1.2tr/tháng → đủ sau 12.5 tháng               │
│ 🚗 Quỹ xe cộ              2.4tr (tích lũy)              │
│ 🔄 Quỹ chi phí định kỳ   1.6tr / 4.8tr ████░░░░  33%   │
│ 🎁 Quỹ hiếu hỉ           1.5tr (tích lũy)              │
│ ✈️ Quỹ du lịch            0 / 10tr     ░░░░░░░░   0%   │
├─────────────────────────────────────────────────────────┤
│ 🎓 GOAL FUNDS                                            │
│ 🎓 Quỹ đại học Minnie     0 / 500tr   13 năm còn lại   │
│    ↳ 2tr/tháng vào CCQ @ 12%/năm ≈ 500tr               │
├─────────────────────────────────────────────────────────┤
│ 📈 INVESTMENT FUND        118tr / 1tỷ  ████░░░░  11.8% │
│    FPT · TCB · DCDS · E1VFVN30 · Vàng                  │
├─────────────────────────────────────────────────────────┤
│ 🎯 FREEDOM FUNDS (reset đầu tháng)                      │
│ Dũng:   1tr/tháng   [████████░░  80% còn lại]          │
│ Phương: 1tr/tháng   [████░░░░░░  40% còn lại]          │
└─────────────────────────────────────────────────────────┘
```

---

## API endpoints cần implement

```typescript
// Fund CRUD
GET    /api/funds                    // list all funds
POST   /api/funds                    // tạo fund mới (cấu hình động)
PUT    /api/funds/:id                // sửa fund
DELETE /api/funds/:id                // xóa/archive fund

// Fund transactions
GET    /api/funds/:id/transactions   // lịch sử nạp/rút
POST   /api/funds/:id/contribute     // nạp thủ công
POST   /api/funds/:id/withdraw       // rút để chi tiêu (tạo transaction + fund_transaction)
POST   /api/funds/transfer           // chuyển tiền giữa 2 quỹ

// Automation
POST   /api/funds/monthly-contribution  // cron: nạp quỹ tự động đầu tháng
POST   /api/funds/reset-freedom         // cron: reset Freedom Fund đầu tháng
POST   /api/funds/apply-allocation-rules // khi có thu nhập bất thường

// Reports
GET    /api/funds/overview            // tổng quan tất cả quỹ
GET    /api/funds/projection          // dự báo tăng trưởng
GET    /api/funds/:id/history?months=6 // biểu đồ lịch sử
```

---

## Onboarding wizard (5 bước)

Khi tenant mới tạo household, wizard dẫn qua:

**Bước 1:** Nhập thu nhập hàng tháng (thường xuyên + bất thường trung bình)

**Bước 2:** Chọn quỹ muốn tạo (pre-filled gợi ý dựa trên profile)
- Emergency Fund → suggest 3-6 tháng chi tiêu
- Chọn Sinking Funds phù hợp từ template

**Bước 3:** Cài % ngân sách baseline cho từng nhóm danh mục

**Bước 4:** Kết nối tài khoản ngân hàng

**Bước 5:** Kết nối Gmail (optional) + test automation

→ Sau 5 bước: household sẵn sàng 100%, không cần config thêm.