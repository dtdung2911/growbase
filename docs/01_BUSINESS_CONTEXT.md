# 01 — BUSINESS CONTEXT
> GrowBase — Nền tảng quản lý tài chính gia đình  
> Version 1.0 | BA: GrowBase Team | Status: LOCKED

---

## 1. PRODUCT VISION

**Tagline:** GrowBase — Nền tảng để tăng trưởng tài chính.

**Problem:** Hộ gia đình Việt Nam (2 thu nhập, 1 con) quản lý tài chính bằng Excel thủ công — mất thời gian nhập liệu, không có báo cáo hành vi chi tiêu, không theo dõi quỹ và nợ có hệ thống.

**Solution:** Web app thay thế Excel, số hóa toàn bộ luồng: nhập giao dịch → phân loại → ngân sách → báo cáo → quỹ → tài sản ròng.

**Success Metrics MVP:** 
- Nhập giao dịch < 15 giây trên mobile
- Dashboard load < 800ms
- Báo cáo tháng tái hiện đúng logic GG Sheet gốc
- 0 sai lệch double-counting (CC payment, fund withdrawal)

---

## 2. USERS & PERSONAS

### Persona A — Chủ hộ (Owner)
- Người tạo household, cấu hình toàn bộ hệ thống
- Nhập phần lớn giao dịch hàng ngày
- Xem Dashboard + Report hàng tuần, tháng
- Device: mobile primary, desktop thỉnh thoảng

### Persona B — Thành viên (Member)
- Được invite bởi Owner
- Nhập giao dịch của cá nhân mình
- Xem báo cáo chung, không thể sửa cấu hình hệ thống (category system, budget system)
- Device: mobile primary

### Persona C — Cá nhân (Personal)
- household_type = 'personal'
- Không có member, tất cả quyền như Owner
- Flow wizard: bỏ qua step 2 (invite members)

---

## 3. PRODUCT SCOPE

### MVP (Phase 1) — 6 tuần
Auth · Onboarding Wizard 7 bước · Transaction CRUD · Fund Management (6 types) · Dashboard · Reports (4 tabs) · Budget Management · Net Worth · Debt Management · Scheduled Payments · Estimated Expenses · Settings · PWA

### Phase 2 — Sau MVP
CSV/Excel bank import · AI auto-categorization (Claude Haiku) · Smart buffer prediction · Duplicate detection · Month-over-month comparison

### Phase 3 — Scale
Gmail auto-read transactions · Bank statement API (VietQR/Napas) · Full Investment Plan (per-stock tracking) · Multi-household SaaS · Collaboration

### Phase 4 — Mobile
Flutter app · Push notification · Camera OCR receipt · Face ID · Daily AI coaching

### OUT OF SCOPE (mọi phase)
- Thực hiện giao dịch ngân hàng (chỉ ghi nhận, không chuyển tiền)
- Tư vấn đầu tư cụ thể
- Tax calculation

---

## 4. BUSINESS DOMAINS (9 domains)

| Domain | Mô tả ngắn | Core Objects |
|--------|-----------|--------------|
| **Household** | Quản lý hộ gia đình, thành viên, cấu hình | Household, Member, Invitation |
| **Income** | Nguồn thu nhập, lịch sử thay đổi (SCD Type 2) | IncomeSource |
| **Transaction** | Lõi hệ thống — ghi nhận mọi dòng tiền | Transaction, Category, Account |
| **Budget** | Ngân sách baseline %, tracking thực tế vs kế hoạch | BudgetBaseline, MonthlyBudget |
| **Fund** | 6 loại quỹ — contribute/withdraw atomic | Fund, FundTransaction |
| **Debt** | Khoản nợ → auto-tính budget trả nợ | DebtEntry |
| **Net Worth** | Snapshot tài sản hàng tháng + đối soát | NetWorthSnapshot |
| **Scheduled Obligations** | Khoản định kỳ — alert sắp đến hạn | ScheduledPayment |
| **Planning** | Chi tiêu lớn dự kiến — link Sinking Fund | EstimatedExpense |

---

## 5. BUSINESS OBJECTS

### 5.1 Household
```
id, name, household_type ('personal'|'family'), currency ('VND'|'USD'),
onboarding_completed (bool), created_at
```
- 1 User có thể thuộc nhiều Household (khác nhau)
- onboarding_completed=false → redirect /setup mọi route

### 5.2 HouseholdMember
```
id, household_id (FK), user_id (FK), display_name, role ('owner'|'member'|'viewer'),
joined_at, is_active
```
- Owner: full quyền cấu hình
- Member: nhập giao dịch, xem báo cáo
- Viewer (Phase 2): chỉ xem

### 5.3 HouseholdInvitation
```
id, household_id, email, display_name, token (unique), role,
status ('pending'|'accepted'|'rejected'|'expired'), expires_at (+7 ngày)
```

### 5.4 IncomeSource
```
id, household_id, member_id, source_name, monthly_amount, currency,
effective_from, effective_to (null = current), is_current (bool)
```
- SCD Type 2: khi lương thay đổi → SET is_current=false + INSERT new record
- total_monthly_income = SUM(monthly_amount WHERE is_current=true)

### 5.5 Account
```
id, household_id, member_id, name, bank_name, account_type
  ('bank'|'cash'|'savings'|'credit_card'|'investment'|'precious_metal'),
owner_name, is_credit_card (bool), is_active, color, created_at
```
- is_credit_card=true → payment to this account = internal_transfer (BR-CO-003)
- account_type='precious_metal' → có thêm field discount_rate (default 0.85)

### 5.6 Category
```
id, household_id (null = system), name, group_id (FK), icon,
default_behavior_type ('fixed'|'variable'|'wasteful'|'debt_repayment'|'savings_investment'|'loan'),
is_system (bool), is_active, sort_order, created_by_member_id
```
- is_system=true: immutable (BR-SY-001)
- 3-tier: CostType (7) → CategoryGroup (20) → Category (38 system)

### 5.7 CategoryGroup
```
id, name, cost_type_id (FK), color, icon, is_system, sort_order
```

### 5.8 CostType
```
id, name, code ('fixed'|'variable'|'wasteful'|'debt_repayment'|'savings_investment'|'income'|'loan'),
display_label_vi, is_system=true (không bao giờ sửa)
```

### 5.9 Transaction
```
id, household_id, member_id, amount (numeric 15,0), direction ('in'|'out'),
transaction_type ('income'|'expense'|'internal_transfer'|'fund_contribution'|
  'fund_withdrawal'|'debt_repayment'),
category_id (FK), account_id (FK), fund_id (FK, nullable),
debt_entry_id (FK, nullable),
behavior_type ('fixed'|'variable'|'wasteful'|'debt_repayment'|'savings_investment'|'loan'),
  -- READONLY: auto-set từ category.default_behavior_type tại INSERT
is_unusual_income (bool, default false),
  -- user toggle khi direction=in
exclude_from_budget_report (bool, default false),
  -- true: fund_withdrawal, internal_transfer
description, transaction_date, import_source ('manual'|'csv'|'gmail'),
is_duplicate (bool), created_at
```

### 5.10 BudgetBaseline
```
id, household_id, name, linked_category_group_ids (uuid[]),
budget_pct (numeric 5,2), is_system (bool),
is_auto_calculated (bool, default false),
  -- true khi tính từ debt_entries
auto_calculated_source (text),
  -- 'debt_entries'
effective_from (date), created_at
```

### 5.11 Fund
```
id, household_id, name, fund_type
  ('emergency'|'sinking'|'goal'|'investment'|'freedom'|'monthly_buffer'),
current_balance (numeric 15,0), target_amount, monthly_contribution,
color, icon, is_active,
  -- monthly_buffer specific:
release_trigger ('manual'|'auto_day10'),
released_at (timestamptz, nullable -- tháng này đã release chưa)
```

### 5.12 FundTransaction
```
id, household_id, fund_id, transaction_type ('contribution'|'withdrawal'|'release'),
amount, direction ('in'|'out'), balance_after,
linked_transaction_id (FK transactions), description, transaction_date
```

### 5.13 DebtEntry
```
id, household_id, member_id (người chịu nợ), creditor_name,
debt_type ('bank_loan'|'credit_card'|'mortgage'|'personal'),
total_amount, remaining_amount, monthly_payment,
interest_rate (nullable), start_date (nullable), expected_end_date (nullable),
actual_end_date (nullable),
status ('active'|'paid_off'|'paused'), notes, created_at
```

### 5.14 NetWorthSnapshot
```
id, household_id, snapshot_month (date, first day of month),
items (jsonb: [{account_id, account_name, type, balance_recorded, balance_system}]),
total_recorded, total_system, discrepancy,
notes, created_at
```

### 5.15 ScheduledPayment
```
id, household_id, name, period ('monthly'|'yearly'|'quarterly'),
amount, payment_method, status ('active'|'cancelled'|'expired'),
next_due_date, notes, created_at
```

### 5.16 EstimatedExpense
```
id, household_id, name, category_id, linked_fund_id (nullable),
estimated_amount, actual_amount (nullable), target_date,
status ('planned'|'completed'|'cancelled'), notes
```

---

## 6. OBJECT RELATIONSHIPS (key relationships)

```
Household (1) ──── (N) HouseholdMember
Household (1) ──── (N) IncomeSource
Household (1) ──── (N) Account
Household (1) ──── (N) Category [is_system=false]
Household (1) ──── (N) BudgetBaseline
Household (1) ──── (N) Fund
Household (1) ──── (N) Transaction
Household (1) ──── (N) DebtEntry
Household (1) ──── (N) NetWorthSnapshot
Household (1) ──── (N) ScheduledPayment

Transaction (N) ──── (1) Category
Transaction (N) ──── (1) Account
Transaction (N) ──── (0,1) Fund         [fund_contribution / fund_withdrawal]
Transaction (N) ──── (0,1) DebtEntry    [debt_repayment]

DebtEntry (1) ──── UPDATE ──── BudgetBaseline["Chi trả nợ"]
  ON INSERT/UPDATE/DELETE → recalculate_debt_budget()

Fund (1) ──── (N) FundTransaction
FundTransaction (1) ──── (1) Transaction  [linked_transaction_id]

Category (N) ──── (1) CategoryGroup
CategoryGroup (N) ──── (1) CostType
```

---

## 7. DATA FLOW (nguồn → đích)

```
User cấu hình:
  IncomeSource.monthly_amount
    → BudgetBaseline.budget_amount = income × budget_pct
    → Dashboard income metrics

  DebtEntry.monthly_payment  
    → recalculate_debt_budget()
    → BudgetBaseline["Chi trả nợ"].budget_pct

User nhập Transaction:
  Transaction.category_id
    → Category.default_behavior_type → Transaction.behavior_type (auto, readonly)
  Transaction.direction + is_unusual_income
    → Report Tab Income (thường/bất thường)
  Transaction.exclude_from_budget_report = false
    → MonthlyBudget.actual (aggregate by category_group)
  Transaction.fund_id (fund_contribution)
    → FundTransaction → Fund.current_balance

Dashboard reads:
  transactions[current_month] WHERE exclude_from_budget_report=false
    → income metrics, spending donut, budget bars
  funds → fund overview cards
  net_worth_snapshots → net worth chart

Reports read:
  Tab Chi tiêu: SUM(tx) GROUP BY category_group WHERE direction=out
  Tab Thu nhập: SUM(tx) GROUP BY is_unusual_income WHERE direction=in
  Tab Budget vs Actual: budget_baselines JOIN SUM(tx) by category_group
  Tab Quỹ: SUM(fund_transactions) GROUP BY fund_id
```

---

## 8. UBIQUITOUS LANGUAGE

| Term | Định nghĩa |
|------|-----------|
| **Household** | Đơn vị quản lý tài chính (cá nhân hoặc gia đình) |
| **behavior_type** | Phân loại hành vi chi tiêu: fixed/variable/wasteful/debt_repayment/savings_investment/loan. Thuộc tính của Category, không phải Transaction. |
| **exclude_from_budget_report** | Flag trên Transaction. True = không tính vào chi tiêu ngân sách tháng. Fund withdrawal và internal transfer luôn = true. |
| **is_unusual_income** | Thu nhập bất thường (thưởng, freelance, cổ tức). User toggle khi direction=in. Tách riêng trong report tab Thu nhập. |
| **Fund Contribution** | Nạp tiền vào quỹ — tính vào chi tiêu tháng (exclude_from_budget=false). |
| **Fund Withdrawal** | Rút tiền từ quỹ — KHÔNG tính vào chi tiêu (exclude_from_budget=true). |
| **Internal Transfer** | Chuyển tiền giữa 2 tài khoản của household — KHÔNG tính vào chi tiêu. Credit card payment là trường hợp đặc biệt của Internal Transfer. |
| **Monthly Buffer Fund** | Quỹ đệm tháng kế tiếp (fund_type='monthly_buffer'). Nạp cuối tháng → giữ cho chi phí cố định ngày 1-10 → release sau khi nhận lương. |
| **debt_pct** | % ngân sách trả nợ = SUM(debt monthly_payment) / total_income. Auto-calculated, không sửa trực tiếp. |
| **System Category/Budget** | is_system=true — Không sửa tên/mô tả/behavior_type, không xóa. |
| **Custom Category/Budget** | is_system=false — User tạo ra, full CRUD. |
| **SCD Type 2** | Slowly Changing Dimension Type 2: khi income thay đổi → giữ lại lịch sử, INSERT record mới với effective_from mới. |
| **Atomic Fund Operation** | Contribute/Withdraw phải dùng DB transaction (Supabase RPC). Nếu 1 trong 3 bước fail → rollback toàn bộ. |
| **Reconciliation** | Đối soát: so sánh số dư ghi chép (system) vs số dư thực tế (user nhập) trong NetWorthSnapshot. |
| **Scheduled Payment** | Khoản định kỳ (subscription, domain, bảo hiểm). Alert khi ≤ 30 ngày đến hạn. |
| **Estimated Expense** | Chi tiêu lớn dự kiến (tivi, du lịch, học phí năm). Link với Sinking Fund để track tiết kiệm. |

---

## 9. ASSUMPTIONS & CONSTRAINTS

| # | Nội dung |
|---|---------|
| A1 | Tiền tệ primary = VND. Multi-currency display là Phase 2. |
| A2 | Single device session — không cần real-time sync giữa nhiều tab (Phase 3+). |
| A3 | Data ownership: household data bị isolate hoàn toàn qua RLS. User A không bao giờ đọc data của User B. |
| A4 | behavior_type là PROPERTY của Category, không thể override per-transaction. |
| A5 | System categories và system budgets KHÔNG được phép sửa tên/mô tả/xóa bởi bất kỳ user nào. |
| A6 | Atomic operations cho Fund contribute/withdraw — bắt buộc dùng Supabase RPC, không dùng sequential client-side calls. |
| A7 | Mobile-first: UI ưu tiên 375px viewport, touch targets ≥ 44px. |
| A8 | Investment tracking MVP: Net Worth tổng thể only. Investment Plan chi tiết từng mã cổ phiếu → Phase 3. |
| A9 | No financial advice, no bank transactions. GrowBase chỉ ghi nhận, không thực hiện giao dịch. |
| A10 | Lương nhận vào ~ngày 10 hàng tháng — Monthly Buffer Fund designed cho ngày 1-10. |
