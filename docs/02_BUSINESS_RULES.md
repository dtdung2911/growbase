# 02 — BUSINESS RULES CATALOG
> GrowBase MVP | Format: ID · Condition · Action · Enforcement Layer

---

## LEGEND

| Prefix | Domain |
|--------|--------|
| BR-SY | System entities (immutability) |
| BR-OB | Onboarding |
| BR-CA | Category |
| BR-BU | Budget |
| BR-TX | Transaction |
| BR-CO | Constraint / Financial |
| BR-FU | Fund |
| BR-DT | Debt |
| BR-NW | Net Worth |
| BR-SP | Scheduled Payment |

**Enforcement layers:**
- `DB` = Database trigger / RLS policy / constraint
- `RPC` = Supabase RPC function
- `APP` = Application layer (server-side validation)
- `UI` = Client-side UI only (UX, không phải security)

---

## BR-SY — System Entities

### BR-SY-001 System category/budget: immutable name/description
```
IF category.is_system = true OR budget_baseline.is_system = true
THEN block UPDATE(name, description, behavior_type, group_id, linked_category_group_ids)
AND block DELETE (hard or soft)
Enforcement: DB (RLS policy) + APP (reject PATCH fields) + UI (hide edit/delete buttons)
```

### BR-SY-002 System budget: percentage-only edit
```
IF budget_baseline.is_system = true
THEN ONLY allow UPDATE(budget_pct, effective_from)
THEN reject any other field update
Enforcement: APP (PATCH endpoint whitelist) + UI (disable non-% fields)
```

### BR-SY-003 Custom entities: household-scoped ownership
```
IF category.is_system = false OR budget_baseline.is_system = false
THEN only household that created it can UPDATE/DELETE
RLS: WHERE household_id = auth.household_id AND is_system = false
Enforcement: DB (RLS)
```

---

## BR-OB — Onboarding

### BR-OB-001 Onboarding gate
```
IF households.onboarding_completed = false
THEN redirect all app routes → /setup
Enforcement: APP (Next.js middleware)
```

### BR-OB-002 Minimum required steps
```
Step 1 (household type + currency) = REQUIRED
Step 3 (≥1 income source) = REQUIRED  
Step 4 (≥1 account) = REQUIRED
Steps 2, 5, 6, 7 = OPTIONAL (skip allowed)
Enforcement: UI (disable "Tiếp tục" button until required fields filled)
```

### BR-OB-003 Step 2 conditional
```
IF household_type = 'personal'
THEN skip wizard step 2 (invite members)
THEN progress bar shows 6 steps instead of 7
Enforcement: APP (wizard state machine)
```

### BR-OB-004 Wizard guard against duplicate household
```
IF user already has household (households record exists)
THEN UPDATE existing household instead of INSERT new
Enforcement: APP (upsert logic in wizard step 1)
```

### BR-OB-005 Budget save on wizard completion
```
WHEN user completes step 7 (or skips to finish)
THEN UPSERT budget_baselines with effective_from = first day of current month
THEN SET households.onboarding_completed = true
THEN redirect → /dashboard
Enforcement: APP (wizard completion handler)
```

### BR-OB-006 Emergency fund bắt buộc (Onboarding V2)
```
WHEN onboarding V2 (Goal step) render
THEN emergency fund LUÔN được tạo (bắt buộc, KHÔNG phải lựa chọn user)
  - Target = estimateEmergencyTarget(monthlyIncome), EMERGENCY_FUND_MONTHS tháng chi tiêu
  - Server (API /onboarding/complete) tự dựng p_goals[0] = emergency, không phụ thuộc UI
  - RPC complete_onboarding_v2 RAISE nếu p_goals rỗng hoặc p_goals[0].fund_type <> 'emergency'
Enforcement: DB (migration 013 guard) + APP (route dựng emergency)
```

### BR-OB-007 Multi-goal atomic (Onboarding V2)
```
WHEN user chọn N goal preset (education/house/travel/custom) ở Goal step
THEN tất cả funds (emergency + N goal) được tạo trong CÙNG 1 transaction
  - Qua RPC complete_onboarding_v2(p_goals jsonb[]) — emergency [0], goal [1..N]
  - Fail 1 phần → rollback toàn bộ (rule 1: fund ops atomic RPC only)
Enforcement: DB (complete_onboarding_v2 single transaction)
```

### BR-OB-008 Framing phương pháp (verifiable-only)
```
WHEN copy onboarding tự giới thiệu phương pháp
THEN CHỈ dùng 3 nguồn đã xác thực:
  - Pay Yourself First — George S. Clason, "Người giàu có nhất thành Babylon" (1926)
  - Conscious Spending Plan — Ramit Sethi ("I Will Teach You To Be Rich")
  - Mental accounting — Richard Thaler (Nobel Kinh tế 2017)
CẤM nhắc "6 Lọ"/"6 Jars"/"50-30-20" ở bất kỳ đâu trong app
  (data model = 6 fund_type + 18 budget line linh hoạt, không khớp 6 tỷ lệ cứng)
Enforcement: APP (copy review) + i18n string audit
```

---

## BR-CA — Category

### BR-OB-009 Capacity góp quỹ (Money Model v2, 09-07-2026)
```
Tổng góp/tháng của MỌI fund = bucket savings_investment (15% thu nhập ròng).
Không fund nào được gợi ý vượt tổng này. Nhóm "other" thuộc chi linh hoạt,
KHÔNG tính vào capacity (hết đếm trùng available 19% cũ).
```
Nguồn: Conscious Spending Plan (Ramit Sethi) — savings+invest 15-20%.

### BR-OB-010 Thứ tự làm đầy — Hybrid 3 giai đoạn
```
GĐ1: 100% capacity → emergency, đến 1 THÁNG chi tiêu thiết yếu
GĐ2: 70% emergency / 30% goals, đến khi emergency = 3 tháng chi tiêu
GĐ3: 100% goals (+ nhánh đầu tư cho quỹ dài hạn)
Emergency target = 3 × chi tiêu thiết yếu tháng (KHÔNG phải income)
```
Nguồn: CFPB (spending shock vs income shock), CFP Board/Vanguard/Fidelity (3-6 tháng EXPENSES), Ramsey (sequencing).

### BR-OB-011 Phân bổ nhiều goals
```
Tỷ trọng bậc thang theo hạng: 2 quỹ = 70/30; 3 quỹ = 60/30/10.
Hạng do USER xếp (kéo thả, label màu) — app chỉ advise, không tự đổi hạng.
KHÔNG waterfall. KHÔNG slider % trong onboarding (default cứng;
chỉnh chi tiết = trang Funds hậu onboarding).
```

### BR-OB-012 Hiển thị timeline (voice: sự thật luôn kèm lối thoát)
```
Số timeline gây tụt mood KHÔNG BAO GIỜ render một mình — luôn kèm ≥1 lối
thoát (lãi kép / nắn chặng / đổi hạng). Nắn chặng = OPT-IN 1 chạm,
chỉ gợi ý khi timeline > 10 năm; user không tap = giữ nguyên full target.
```

### BR-OB-013 Simulation lãi kép (gợi ý tham khảo)
```
3 tầng theo timeline: <2 năm = 5%/năm (tiết kiệm) · 2-5 năm = 6,5%
(quỹ trái phiếu) · >5 năm = 8% (DCA index/vàng). % cập nhật theo năm T-1.
LUÔN kèm disclaimer highlight "tham khảo, không phải cam kết".
Mode gợi ý tham khảo — KHÔNG phải tư vấn đầu tư.
```

### BR-OB-014 Living Plan — kế hoạch luôn tươi (Tada↔Dashboard, 10-07-2026)
```
Kế hoạch phân bổ KHÔNG lưu tĩnh. Mọi màn hình (Funds strip, fund detail,
dashboard badge, Tada) tính lại từ engine với STATE THẬT mỗi render:
priority_rank (DB) + income thực hộ + emergency balance thật.
Tada = snapshot đầu tiên của cùng một hàm; member mới xem "Tada tươi" bằng
số hiện tại, KHÔNG replay snapshot cũ. Không schema plan.
```
Nguồn: brainstorm 10-07-2026 (living forecast — chìa khoá giải Tada tươi + tụt GĐ + chen ladder + drift cùng lúc).

### BR-OB-015 Income vận hành — thu nhập thực cả hộ
```
Capacity góp/tháng = 15% × TỔNG thu nhập THỰC cả hộ trong tháng
(ví chung, mọi member). Timeline dài hạn dùng trailing average 3 tháng
(chống rung). Income onboarding CHỈ dùng estimate bức tranh ban đầu,
không phải nguồn vận hành.
```
Nguồn: brainstorm 10-07-2026 (income vận hành = thực hộ gộp; mở rộng capacity BR-OB-009 sang vận hành).

### BR-OB-016 Hạng quỹ persistent
```
Hạng goal funds sống ở cột priority_rank (DB), do USER xếp (kéo thả —
sheet "Đổi hạng"); app chỉ advise, không tự đổi hạng. Goal mới tạo →
rank cuối ladder, mọi số recompute tự nhiên (living plan), KHÔNG hỏi lại.
Quyền sửa kế hoạch (hạng/target) theo permission flag per member, owner cấp.
```
Nguồn: brainstorm 10-07-2026 (gap kỹ thuật: hạng chỉ tồn tại lúc gửi route onboarding → migration priority_rank; mở rộng BR-OB-011).

### BR-OB-017 Góp quỹ vận hành — advise không act
```
Góp quỹ = thao tác TAY từng quỹ. Engine chỉ PRE-FILL số gợi ý
(capacity tháng × ladder, trừ phần đã góp trong tháng) — sửa/bỏ qua được.
KHÔNG auto-allocate. Tháng không góp = HỢP LỆ: timeline tự giãn +
kể tử tế kèm lối thoát, KHÔNG phải lỗi.
```
Nguồn: brainstorm 10-07-2026 (advise-not-act thành triết lý vận hành — mở rộng BR-OB-011).

### BR-OB-018 Sự kiện giai đoạn — luôn kèm lối thoát
```
Chuyển giai đoạn (lên/xuống, kể cả rút emergency tụt ngưỡng) PHẢI được
KỂ kèm lối thoát ("còn N tháng là đầy lại") — BR-OB-012 áp cho vận hành.
Rút quỹ yêu cầu nhập mô tả lý do (text, lưu vào lịch sử). KHÔNG notify
chéo member khi biến động lan. Ngưỡng GĐ derive từ emergency target
(GĐ1 = target/3, GĐ2 = target); emergency target giữ số onboarding, user tự sửa.
```
Nguồn: brainstorm 10-07-2026 (tụt GĐ được kể + lối thoát; friction tốt khi rút — mở rộng BR-OB-012).

### BR-CA-001 behavior_type locked to category
```
WHEN transaction is INSERT
THEN transaction.behavior_type = category.default_behavior_type
THEN field is READONLY on transaction form (user cannot change)
Enforcement: DB (trigger set behavior_type on INSERT) + UI (readonly field display)
```

### BR-CA-002 CategoryPicker filter by transaction direction
```
IF transaction.direction = 'in'
THEN CategoryPicker shows ONLY categories WHERE cost_type.code = 'income'
IF transaction.direction = 'out'
THEN CategoryPicker shows categories WHERE cost_type.code IN 
  ('fixed','variable','wasteful','debt_repayment','savings_investment','loan')
Enforcement: UI (query filter) + APP (validate on submit)
```

### BR-CA-003 Soft delete only when category has transactions
```
IF category.is_system = false
AND EXISTS (SELECT 1 FROM transactions WHERE category_id = this.id)
THEN SET is_active = false (soft delete only)
THEN existing transactions retain category_id (no nullify)
ELSE hard DELETE allowed
Enforcement: APP (check before delete) + DB (no CASCADE delete on category_id FK)
```

### BR-CA-004 Custom category: required behavior_type on create
```
WHEN INSERT category WHERE is_system = false
THEN default_behavior_type is REQUIRED
Enforcement: APP (form validation) + DB (NOT NULL constraint)
```

### BR-CA-005 Category group assignment
```
WHEN creating custom category
THEN must assign to existing category_group
THEN cannot create new top-level cost_type (system-only)
Enforcement: UI (group dropdown, no "create new cost_type" option)
```

---

## BR-BU — Budget

### BR-BU-001 Total budget percentage ≤ 100%
```
IF SUM(budget_pct) of all active budget_baselines for household > 100
THEN block SAVE + show error "Tổng ngân sách vượt 100%, giảm bớt các hạng mục"
Enforcement: APP (validate before UPSERT) + UI (realtime total display)
```

### BR-BU-002 Debt budget line: locked when active debts exist
```
IF COUNT(debt_entries WHERE household_id = X AND status = 'active') > 0
THEN budget_baseline WHERE name = 'Chi trả nợ': is_auto_calculated = true
THEN UI: lock budget_pct field, show tooltip "Tính từ khoản nợ trong Cài đặt"
THEN user cannot directly edit this line's pct
Enforcement: UI (conditional lock) + APP (reject PATCH to this line when is_auto_calculated=true)
```

### BR-BU-003 Budget month override
```
User can override budget_pct for specific month (not change baseline)
INSERT budget_overrides (household_id, budget_baseline_id, month, override_pct)
Lookup priority: override > baseline
Enforcement: APP (query with COALESCE(override_pct, baseline_pct))
```

---

## BR-TX — Transaction

### BR-TX-001 Fund withdrawal: exclude from budget
```
IF transaction.transaction_type = 'fund_withdrawal'
THEN transaction.exclude_from_budget_report = true (forced)
Enforcement: DB (trigger or DEFAULT in RPC) + APP (force value on insert)
```

### BR-TX-002 Internal transfer: exclude from budget (both legs)
```
IF transaction.transaction_type = 'internal_transfer'
THEN transaction.exclude_from_budget_report = true (both OUT and IN records)
Enforcement: DB trigger + APP (InternalTransferForm sets both records)
```

### BR-TX-003 is_unusual_income: only on income transactions
```
IF transaction.direction = 'out'
THEN is_unusual_income MUST = false
Enforcement: DB (check constraint) + UI (hide toggle when direction=out)
```

### BR-TX-004 Debt transaction: link debt_entry
```
IF transaction.category.cost_type.code = 'debt_repayment'
THEN show dropdown to select debt_entry_id (optional but encouraged)
THEN transaction.behavior_type = 'debt_repayment' (from BR-CA-001)
Enforcement: UI (show debt dropdown) + APP (no required constraint, nullable FK)
```

### BR-TX-005 Credit card payment = internal transfer
```
IF user selects account WHERE is_credit_card = true as account_to in any transfer
THEN force transaction_type = 'internal_transfer'
THEN show label "Thanh toán thẻ [account.name]"
Enforcement: UI (detect is_credit_card and switch form) + APP (validate type)
```

---

## BR-CO — Financial Constraints

### BR-CO-001 Fund withdraw ≤ balance
```
IF withdraw_amount > fund.current_balance
THEN block operation
THEN show error "Số dư quỹ không đủ. Hiện có: {current_balance}"
Enforcement: APP (validate before RPC call) + RPC (double-check in function)
```

### BR-CO-002 Fund contribution: tính vào chi tiêu tháng
```
fund_contribution transaction MUST have exclude_from_budget_report = false
(contribution là chi tiêu thực sự của tháng — user đang "bỏ tiền vào quỹ")
Enforcement: DB (RPC sets value explicitly)
```

### BR-CO-003 Atomic fund operations mandatory
```
ALL fund_contribution and fund_withdrawal MUST use Supabase RPC
NEVER use sequential client-side Supabase calls for fund operations
RPC must: BEGIN → INSERT transaction → INSERT fund_transaction → UPDATE fund.balance → COMMIT
IF any step fails → ROLLBACK
Enforcement: RPC (Supabase database function with explicit transaction)
```

### BR-CO-004 Account balance tracking
```
MVP: account.balance is NOT maintained by system (no auto-update on transactions)
User manually inputs balance in NetWorthSnapshot for reconciliation
Phase 2: CSV import will reconcile
Enforcement: Design decision — no account balance auto-update in MVP
```

---

## BR-FU — Fund

### BR-FU-001 Monthly buffer release flow
```
IF fund.fund_type = 'monthly_buffer' AND fund.current_balance > 0
AND current_day BETWEEN 1 AND 10
THEN show Dashboard banner "Bạn có {balance} trong Quỹ đệm. Đã nhận lương chưa?"
WHEN user confirms "Đã nhận lương"
THEN SET fund.released_at = now() (for current month)
THEN hide banner
Enforcement: UI (check condition) + APP (set released_at)
```

### BR-FU-002 Fund type dictates form fields
```
emergency: target_months_of_expense (int)
sinking: target_amount (required), target_date
goal: target_amount (required), target_date, expected_return_rate (optional)
investment: no target (open-ended)
freedom: reset_monthly (bool) — if true: balance resets to 0 on 1st of each month
monthly_buffer: release_trigger ('manual'|'auto_day10')
Enforcement: UI (dynamic form) + APP (validate required fields by type)
```

### BR-FU-003 Freedom fund monthly reset
```
IF fund.fund_type = 'freedom' AND fund.reset_monthly = true
THEN on first day of each month: SET fund.current_balance = 0
Enforcement: DB (scheduled Supabase function / cron via pg_cron or Edge Function)
```

### BR-FU-004 Fund deactivation
```
IF fund.is_active SET TO false AND fund.current_balance > 0
THEN require user confirmation "Quỹ còn {balance}. Tiếp tục vô hiệu hóa?"
THEN suggest withdraw before deactivating
Enforcement: UI (confirm dialog with balance display)
```

---

## BR-DT — Debt

### BR-DT-001 Auto-calculate debt budget percentage
```
WHEN debt_entries INSERT, UPDATE, DELETE (for household)
THEN recalculate_debt_budget(household_id):
  debt_pct = ROUND(
    SUM(monthly_payment WHERE status = 'active') / 
    SUM(income_sources.monthly_amount WHERE is_current = true) * 100
  , 1)
THEN UPDATE budget_baselines 
  SET budget_pct = debt_pct, is_auto_calculated = true
  WHERE household_id = X AND name = 'Chi trả nợ'
Enforcement: DB (trigger on debt_entries) + RPC (recalculate function)
```

### BR-DT-002 Debt payoff milestone notification
```
WHEN debt_entry.status SET TO 'paid_off'
AND COUNT(debt_entries WHERE status = 'active' AND household_id = X) = 0
THEN INSERT notification:
  type = 'debt_free_milestone'
  message = "🎉 Bạn đã trả hết nợ! Ngân sách trả nợ được giải phóng."
THEN recalculate_debt_budget() → debt_pct = 0
Enforcement: APP (post-update logic) + DB (trigger after status change)
```

### BR-DT-003 Debt entry: optional in wizard
```
Wizard step 5 can be skipped (no debt entries required)
IF skipped: budget line "Chi trả nợ" shows 0%, user can manually edit
IF debt entered: budget line locked (BR-BU-002)
Enforcement: UI (skip button) + APP (conditional logic)
```

---

## BR-NW — Net Worth

### BR-NW-001 Snapshot: 1 per month per household
```
household can have only 1 net_worth_snapshot per month (snapshot_month)
IF snapshot exists for month → UPDATE, not INSERT
Enforcement: DB (UNIQUE constraint on household_id + snapshot_month)
```

### BR-NW-002 Discrepancy calculation
```
discrepancy = total_recorded (user input) - total_system (from accounts/funds)
IF ABS(discrepancy) > 100000 (100k VND)
THEN show warning "Chênh lệch {discrepancy}. Kiểm tra lại?"
Enforcement: APP (calculate on save) + UI (show warning)
```

---

## BR-SP — Scheduled Payment

### BR-SP-001 Alert threshold
```
IF scheduled_payment.status = 'active'
AND (next_due_date - CURRENT_DATE) <= 30
THEN show alert badge on Scheduled Payments nav item
IF (next_due_date - CURRENT_DATE) <= 7
THEN badge color = red (urgent)
ELSE badge color = orange
IF (next_due_date - CURRENT_DATE) > 30
THEN no badge
Check: on page load (no background polling in MVP)
Enforcement: UI (computed on render)
```

### BR-SP-002 After mark as paid: advance next_due_date
```
WHEN scheduled_payment marked as "Đã thanh toán"
IF period = 'monthly' THEN next_due_date += 1 month
IF period = 'yearly' THEN next_due_date += 1 year
IF period = 'quarterly' THEN next_due_date += 3 months
Enforcement: APP (calculate new date on mark-paid)
```

### BR-SP-003 Mark paid: optionally create transaction
```
WHEN user marks scheduled_payment as paid
THEN prompt "Tự động tạo giao dịch chi tiêu cho khoản này?"
IF user confirms → INSERT transaction (amount, category mapped from payment_method/type)
Enforcement: UI (prompt) + APP (conditional insert)
```

---

## VALIDATION SUMMARY TABLE

| Rule | Blocks Action | User Sees |
|------|--------------|-----------|
| BR-BU-001 | Save budget | "Tổng vượt 100%" |
| BR-CO-001 | Fund withdraw | "Số dư không đủ" |
| BR-SY-001 | Edit system entity | Edit/Delete buttons hidden |
| BR-TX-001/002 | Save tx type | exclude_from_budget forced |
| BR-OB-001 | Access app routes | Redirect /setup |
| BR-OB-002 | Progress wizard | "Tiếp tục" disabled |
| BR-DT-001 | — (auto-trigger) | budget_pct updates silently |
| BR-FU-003 | — (auto-trigger) | freedom fund resets on 1st |
| BR-NW-002 | — (warning only) | "Chênh lệch {X}" |
