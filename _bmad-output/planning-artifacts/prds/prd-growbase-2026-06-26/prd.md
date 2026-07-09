---
title: GrowBase — PRD Chuẩn Hóa UI & Xác Nhận Luồng Nghiệp Vụ
status: draft
created: 2026-06-26
updated: 2026-06-26
author: DzungDuong
sprint: UI-Polish
---

# GrowBase — PRD: Chuẩn Hóa UI & Xác Nhận Luồng Nghiệp Vụ

## 1. Vision & Problem Statement

GrowBase là ứng dụng quản lý tài chính cho cá nhân và hộ gia đình — từ 1 người đến nhiều thành viên trong cùng một workspace. Thay thế Google Sheets thủ công và các app phức tạp như Money Lover bằng trải nghiệm đơn giản, trực quan.

**Model:** Household workspace — mọi thành viên được add vào đều có quyền ngang nhau, không phân cấp role.

**Vấn đề giải quyết:** Sau khi implement S0→S4, giao diện cần được chuẩn hóa theo bộ nhận diện thương hiệu Spike Admin và các luồng nghiệp vụ cần được tài liệu hóa để xác nhận tính đúng đắn trước khi phát triển tiếp.

**Success sau 6 tháng dùng:** Người dùng nhìn rõ bức tranh tài chính toàn cảnh, kiểm soát dòng tiền, và đặt định hướng cho tương lai.

---

## 2. Goals & Success Metrics

| Goal | Deliverable | Done khi | Counter-metric |
|------|-------------|----------|----------------|
| G1: UI Chuẩn Hóa | Update code toàn bộ screens/components theo Spike Admin style guide | Tất cả screens pass checklist · Zero hard-coded colors · Tất cả components khớp spec | Không break mobile layout · Sidebar/navbar giữ nguyên |
| G2: Business Flow Validation | Tài liệu hóa 8 luồng nghiệp vụ để user xác nhận | Tất cả 8 luồng được viết ra và confirmed | Không thay đổi code trong sprint này |

**Ngoài scope:** S5 (PWA + Deploy + Import).

---

## 3. Feature Inventory (S0→S4 — Đã implement)

| Sprint | Features |
|--------|----------|
| S0 | Deploy + Schema + Seed + Next.js init |
| S1 | Google OAuth · Onboarding Wizard 7 bước (US-1.01→1.05, US-2.01→2.02) |
| S2 | Transactions 5 loại · Fund CRUD + Contribute/Withdraw · App Shell (US-3.01→3.05, US-4.01→4.05) |
| S3 | Dashboard · Reports 4 tabs · Budget Page · Net Worth · Scheduled Payments (US-5.01→5.06, US-6.01→6.02, US-7.01→7.03) |
| S4 | Settings (Category/Budget/Account/Income/Member/Household) · Debt Manager · Estimated Expenses · UX Polish (US-2.03→2.04, US-6.03→6.05, US-8.01→8.04, US-9.04) |
| REDESIGN | Spike Admin UI — Sidebar, Navbar, Theme base |
| FUND_MGMT | Fund CRUD chi tiết · Contribute/Withdraw atomic RPC · Fund Detail page |

---

## 4. Business Flows (G2 — Đã xác nhận)

### 4.1 Onboarding (7 bước)

**Gate:** Tất cả routes bị chặn → `/setup` cho đến khi `onboarding_completed = true`.

```
Bước 1 [BẮT BUỘC] — Chọn household_type (personal|family) + currency
  personal → bỏ qua Bước 2, progress bar 6 bước

Bước 2 [TÙY CHỌN, family only] — Mời thành viên qua email (token 7 ngày)

Bước 3 [BẮT BUỘC] — ≥1 IncomeSource (monthly_amount, effective_from)

Bước 4 [BẮT BUỘC] — ≥1 Account

Bước 5 [TÙY CHỌN] — Khai báo DebtEntry
  → Trigger: recalculate_debt_budget() → khóa "Chi trả nợ" budget

Bước 6 [TÙY CHỌN] — Budget % (SUM ≤ 100%, dòng nợ locked nếu Bước 5 có data)

Bước 7 [TÙY CHỌN] — Tạo Quỹ từ template

Hoàn thành:
  UPSERT budget_baselines (effective_from = ngày 1 tháng hiện tại)
  SET onboarding_completed = true → Redirect /dashboard
```

### 4.2 Nhập Giao Dịch (5 loại)

```
1. THU NHẬP (direction=in)
   category: CostType='income' only
   is_unusual_income=true → trigger phân bổ quỹ (atomic RPC)

2. CHI TIÊU (direction=out)
   behavior_type: readonly từ category.default_behavior_type
   Nếu account là CC → force type='internal_transfer'
   Nếu category linked sinking fund → hỏi "Rút quỹ hay chi ngân sách?"

3. CHUYỂN KHOẢN NỘI BỘ (internal_transfer)
   RPC atomic: 2 legs (out + in) · cả 2 exclude_from_budget=true

4. NẠP QUỸ (fund_contribution)
   RPC atomic: INSERT transaction + fund_transaction + UPDATE balance
   exclude_from_budget=false (tiền thực sự rời túi)

5. RÚT QUỸ (fund_withdrawal)
   Validate: amount ≤ fund.current_balance
   RPC atomic: INSERT transaction + fund_transaction + UPDATE balance
   exclude_from_budget=true
```

**Ảnh hưởng lên Budget report:**

| Loại | Budget actual | Fund balance |
|------|--------------|--------------|
| Chi tiêu ngân sách | Tăng | — |
| Nạp quỹ | Tăng | Tăng |
| Rút quỹ | Không đổi | Giảm |
| Chuyển khoản | Không đổi | — |

### 4.3 Theo Dõi Ngân Sách Hằng Tháng

```
Budget amount = total_income × budget_pct
Actual amount = SUM(tx.amount WHERE direction=out AND exclude=false
                AND category IN linked_category_groups AND month=current)

Nếu có monthly override → dùng override_pct
Dòng "Chi trả nợ": auto-locked khi có active debts (BR-BU-002)
SUM(budget_pct) ≤ 100% (BR-BU-001)
```

### 4.4 Vòng Đời Quỹ (6 loại)

| Loại | Target | Đầu tư | Reset | Đặc điểm |
|------|--------|--------|-------|----------|
| Emergency | months × avg_expense | Không | Không | Ưu tiên 1, cảnh báo khi < 50% |
| Sinking | fixed amount + date | Không | Không | Có thể link category_group |
| Goal | lớn + dài hạn | Có | Không | expected_return_rate |
| Investment | không giới hạn | Có | Không | Block nếu Emergency < 50% |
| Freedom | discretionary | Không | Ngày 1/tháng | Cron reset |
| Monthly Buffer | đệm lương | Không | Không | Banner ngày 1-10 |

Tất cả nạp/rút: **RPC bắt buộc** (BR-CO-003).

### 4.5 Quản Lý Nợ

```
CREATE DebtEntry → recalculate_debt_budget()
  debt_pct = SUM(monthly_payment active debts) / total_income × 100
  Khóa dòng "Chi trả nợ" (is_auto_calculated=true)

Ghi nhận thanh toán: expense transaction với category cost_type='debt_repayment'

MARK paid_off (tất cả debts):
  recalculate_debt_budget() → debt_pct=0
  Mở khóa "Chi trả nợ"
  Hiện notification: "Bạn đã trả hết nợ!"
```

### 4.6 Net Worth & Đối Soát

```
Load accounts → User nhập balance_recorded → System tính balance_system
discrepancy = recorded - system
Nếu ABS(discrepancy) > 100,000 VND → cảnh báo
UPSERT net_worth_snapshot(household_id, snapshot_month=ngày 1) — 1 snapshot/tháng
```

### 4.7 Thanh Toán Định Kỳ

```
days_until_due: ≤7 → badge đỏ | 8-30 → badge cam | >30 → không badge
Mark paid → advance next_due_date (monthly+1m, quarterly+3m, yearly+1y)
           → hỏi tạo transaction tự động
```

### 4.8 Phân Bổ Thu Nhập Bất Thường

```
is_unusual_income=true → load allocation_rules (priority order)
Mỗi rule: pct hoặc fixed amount
Constraint: không nạp Investment nếu Emergency < 50% target
User review → confirm → RPC fund_contribution cho từng quỹ
```

---

## 5. UX/Design Requirements (G1)

### 5.1 Design Tokens

| Token | Giá trị |
|-------|---------|
| Primary | `#0085DB` |
| Background | `#F0F5F9` |
| Card surface | `#FFFFFF` |
| Text chính | `#111C2D` |
| Text phụ | `#707A82` |
| Border | `#DFE5EF` |
| Success | `#4BD08B` |
| Warning | `#F8C076` |
| Error | `#FB977D` |
| Font | `Plus Jakarta Sans` |

**Rule:** Zero hard-coded colors — tất cả qua CSS variables/Tailwind tokens.

### 5.2 Component Standards

**Cards:**
- Standard: `border-radius: 13px` · `box-shadow: rgba(37,83,185,0.1) 0px 2px 6px`
- Stat card: `border-radius: 18px`
- `CardContent padding: 30px 30px 24px`

**Buttons:**
- Height: `44px` (md) · `30px` (sm) · `56px` (lg)
- `border-radius: 25px` (pill — tất cả variants)
- States: hover (darken 20%) · active (darken 40%) · disabled (`rgba(0,0,0,0.12)`)

**Inputs/Forms:**
- Height: `44px` · `border-radius: 18px` · border: `1px solid #DFE5EF`
- Focus: border `#0085DB` · Error: border `#FB977D` + text 12px bên dưới
- Label floating above field

**Badges/Chips:**
- Height: `24px` · `border-radius: 16px` · `font: 12px weight 600`
- Dùng tinted background style (background nhạt + border + text đậm hơn)

**Tables:**
- Trong Card 13px radius
- Header: `12px weight 500` · Body: `12px weight 400`
- Row border: `1px solid #E5EAEF`

**Page Header Banner:**
- Mỗi trang: `bg #FFFFFF · border-radius 13px · padding 20px 24px`
- Title `22px weight 700` (trái) + Breadcrumb (phải)

**Không thay đổi:** Sidebar (270px) + Navbar (64px) — đã chuẩn.

### 5.3 Animation & Transitions

**Easing mặc định:** `cubic-bezier(0.4, 0, 0.2, 1)`

| Component | Animation | Duration |
|-----------|-----------|----------|
| Button hover | darken background | 250ms |
| Button press | darken 40% | 100ms |
| Input focus | border → #0085DB | 250ms |
| Dropdown | fade + slide down | 250ms |
| Switch toggle | track + thumb slide | 150ms |
| Skeleton | shimmer sweep | 1500ms infinite |
| Toast | slide in bottom | 250ms |
| Modal | fade + scale 0.9→1 | 250ms |
| Settings FAB | rotate 360° on hover | 1000ms linear |

**Bắt buộc:** `prefers-reduced-motion` → tắt tất cả animation. Không dùng `transition: all`.

### 5.4 Dark Mode

- Bao gồm trong sprint này
- Toggle: floating button bottom-right + Settings > Appearance
- Tất cả color tokens có dark variant
- Không hard-code màu — dùng `next-themes` + CSS variables

### 5.5 Pass/Fail Checklist per Screen

- [ ] Không hard-coded color
- [ ] Card đúng border-radius + shadow
- [ ] Button đúng height + radius + states
- [ ] Input đúng height + radius + states
- [ ] Badge dùng đúng semantic color + tinted style
- [ ] Font `Plus Jakarta Sans`
- [ ] Spacing theo 8px multiples
- [ ] Page header banner đúng format
- [ ] Animation đúng theo spec + prefers-reduced-motion
- [ ] Dark mode hoạt động

---

## 6. Non-Functional Requirements

### 6.1 Mobile & Responsive

- Primary breakpoint: 375px (1 cột)
- Touch targets: `min 44×44px`
- Input font: `16px` (tránh iOS zoom)
- Pages có nav: `padding-bottom: 64px`

### 6.2 Performance

- Skeleton loading cho lists và charts (không spinner toàn trang)
- Lazy load ApexCharts khi tab active
- TanStack Query cache stale-time phù hợp per query

### 6.3 Accessibility

- `prefers-reduced-motion`: tắt animation
- WCAG AA: 4.5:1 (text) · 3:1 (large text)
- `aria-label` cho icon-only buttons
- Keyboard navigation đầy đủ

### 6.4 Internationalization

- Mặc định: `vi` · Hỗ trợ: `vi`, `en`
- Tất cả strings qua `t()` — không hard-code text
- Số tiền: format theo currency household
- Ngày: `DD/MM/YYYY` (vi) · `MM/DD/YYYY` (en)

### 6.5 Security

- Mọi API route: `withAuth()` đầu tiên → 401 nếu không có session
- RLS enforced tại DB level
- Response: `{ data: T | null, error: string | null }`

---

## 7. Business Rules Quan Trọng

| Rule | Mô tả |
|------|-------|
| BR-CO-003 | Fund nạp/rút PHẢI dùng RPC (atomic) |
| BR-CO-001 | Fund withdraw: amount ≤ current_balance |
| BR-TX-001 | fund_withdrawal: exclude_from_budget=true |
| BR-TX-002 | internal_transfer: cả 2 legs exclude=true |
| BR-TX-005 | CC account → force internal_transfer |
| BR-CA-001 | behavior_type: readonly từ category |
| BR-BU-001 | SUM(budget_pct) ≤ 100% |
| BR-BU-002 | Nợ active → khóa "Chi trả nợ" budget |
| BR-DT-001 | Thêm/sửa/xóa nợ → recalculate_debt_budget() |
| BR-OB-001 | onboarding_completed=false → block all routes |
| BR-NW-002 | discrepancy > 100k → cảnh báo |
| BR-SP-002 | Mark paid → advance next_due_date tự động |

---

## 8. Open Items

| ID | Câu hỏi | Status |
|----|---------|--------|
| OQ-1 | Thứ tự ưu tiên update screens (screen nào trước?) | **Toàn bộ** — update tất cả screens cùng sprint |
| OQ-3 | ApexCharts animation spec riêng hay dùng default? | [TBD] |
| OQ-4 | Freedom Fund cron: Supabase pg_cron hay external? | [TBD] |
| OQ-5 | Allocation Rules UI đã implement chưa? | [TBD] |

**Assumptions đã confirm:**
- A-1: Sidebar + navbar không thay đổi
- A-2: G2 = tài liệu hóa only, không fix code sprint này
- A-3: S5 ngoài scope
- OQ-2: Dark mode **included** trong sprint này
