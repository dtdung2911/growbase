# 05 — UX SPECIFICATION
> GrowBase MVP | Screen inventory + component rules + UX patterns
> Claude Code implements UI directly from this file.

---

## 1. DESIGN SYSTEM

### Stack
```
Framework:  shadcn/ui + Tailwind CSS (brand primary #0084DB)
Dark mode:  Supported (deep blue-gray base)
Mobile:     375px primary viewport, 48px touch targets
Desktop:    1280px max-width, sidebar layout
Icons:      lucide-react
Charts:     ApexCharts (react-apexcharts)
```

### Color Tokens (Tailwind)
```
Background:  bg-zinc-950 (page), bg-zinc-900 (card), bg-zinc-800 (input)
Border:      border-zinc-800 (default), border-zinc-700 (hover)
Text:        text-white (primary), text-zinc-400 (secondary), text-zinc-500 (muted)
Success:     text-emerald-400, bg-emerald-950
Warning:     text-amber-400, bg-amber-950
Danger:      text-rose-400, bg-rose-950
Info:        text-blue-400, bg-blue-950
Income:      text-emerald-400
Expense:     text-rose-400
```

### Typography
```
Page title:     text-lg font-semibold
Section title:  text-sm font-medium text-zinc-400 uppercase tracking-wide
Amount large:   text-3xl font-semibold
Amount medium:  text-base font-medium
Amount small:   text-sm text-zinc-400
Label:          text-sm text-zinc-400
```

---

## 2. NAVIGATION

### Mobile (bottom nav, 375px)
```
[🏠 Dashboard] [💸 Giao dịch] [+] [🪣 Quỹ] [📊 Báo cáo]
                              FAB (QuickAdd)
Settings accessible via Dashboard → avatar/menu icon top-right
```

### Desktop (left sidebar, 240px)
```
[Logo] GrowBase
────────────────
[🏠] Dashboard
[💸] Giao dịch
[🪣] Quỹ
[📊] Báo cáo
[💰] Ngân sách
[🏦] Tài sản ròng
[🔔] Khoản định kỳ  [badge if due soon]
────────────────
[⚙️] Cài đặt
```

---

## 3. SCREEN INVENTORY

### SCREEN: /login
```
Purpose:  Authentication entry point
Layout:   Centered card, max-w-sm
Elements:
  - App logo + "GrowBase" title
  - Tagline: "Nền tảng để tăng trưởng tài chính"
  - Button: "Đăng nhập với Google" (Google icon + text)
  - Footer: version number
State: Loading (button spinner during OAuth redirect)
```

### SCREEN: /setup (Wizard)
```
Purpose:  Onboarding 6-7 steps
Layout:   Full screen, max-w-lg centered, progress bar top
Progress: Step X of [6|7] (6 for personal, 7 for family)

STEP 1 — Loại hộ & Tiền tệ
  - 2 large cards: [🏠 Cá nhân] [👨‍👩‍👧 Gia đình]
  - Selected card: border-blue-500, filled background
  - Currency row: [VND] [USD] toggle pills
  - CTA: "Tiếp tục →" (disabled until both selected)

STEP 2 — Thành viên (Family only)
  - Title: "Ai cùng quản lý tài chính với bạn?"
  - Invite form: email input + display_name input + "Thêm" button
  - Invited list: avatar initial + name + email + remove X
  - Note (callout box): "Thêm/xóa thành viên sau → Cài đặt → Thành viên"
  - CTA: "Bỏ qua" + "Tiếp tục →"

STEP 3 — Thu nhập
  - Title: "Thu nhập hàng tháng của gia đình"
  - Income row: [Tên nguồn] [Số tiền/tháng] [Thành viên dropdown] [X]
  - "+" Add another income source
  - Total income display: "Tổng thu nhập: X đ/tháng"
  - Required: ≥1 income before Continue

STEP 4 — Tài khoản
  - Title: "Tài khoản ngân hàng & ví tiền"
  - Account row: [Tên] [Ngân hàng] [Loại] [Chủ] [🏦 Thẻ tín dụng?] [X]
  - "+" Add account
  - Credit card toggle: shows blue hint "Thanh toán thẻ = chuyển khoản nội bộ"
  - Required: ≥1 account before Continue

STEP 5 — Khoản nợ (Optional)
  - Title: "Bạn đang có khoản vay nào không?"
  - Debt card: [Tên bên vay] [Loại nợ] [Trả/tháng] [Dư nợ] [Hạn trả] [Thành viên] [X]
  - "+" Add debt
  - Preview: "Ngân sách trả nợ: X% (Y đ/tháng)"
  - CTA: "Bỏ qua" + "Tiếp tục →"

STEP 6 — Danh mục (Read-only preview)
  - Title: "Danh mục chi tiêu đề xuất"
  - Category tree: accordion by cost_type → group → category list
  - Count: "XX danh mục trong X nhóm"
  - Callout: 💡 "Thêm hoặc chỉnh sửa danh mục → Cài đặt → Danh mục"
  - CTA: "Tiếp tục →" (no input needed)

STEP 7 — Ngân sách
  - Title: "Ngân sách đề xuất (dựa trên thu nhập X đ)"
  - Budget table: [Tên hạng mục] [% input] [Số tiền = % × income] [Loại]
  - "Chi trả nợ" row: if debts → locked 🔒, else editable
  - Total bar: "[███████░░░] X% / 100%" (color: green=≤100, red=>100)
  - Callout: 💡 "Thêm ngân sách tùy chỉnh → Cài đặt → Ngân sách"
  - CTA: "Hoàn thành" (disabled if total > 100%)
```

### SCREEN: /setup — Onboarding V2 (redesign, Epic 8)

> **(Epic 10/11 — planned, 09-07-2026):** Money Model v2 sẽ đổi màn này — GoalStep thêm gợi ý khả thi live ("góp X/tháng · xong ~[thời điểm]") + kéo thả xếp hạng; Tada thêm 1 dòng kế hoạch 3 giai đoạn + attribution (CSP/Clason/CFPB) + nút "Xem kế hoạch chi tiết"; simulation lãi kép 3 tầng kèm disclaimer. Mô tả dưới đây là HIỆN TRẠNG (Epic 8/9). Chi tiết: sprint-change-proposal-2026-07-09.md + BR-OB-009→013.

```
Purpose:  Rút gọn wizard cũ còn 4 bước, mở-và-khép "vòng lặp" cảm xúc Hook↔Tada.
          Framing phương pháp = Conscious Spending Plan (Ramit Sethi); mindset nền
          = Pay Yourself First (George S. Clason, "Người giàu có nhất thành Babylon").
Layout:   Full screen, max-w-lg centered. Components: onboarding/v2/*.
Progress: 4 steps — Hook → Goal → Income → Tada.

STEP 1 — Hook (mở vòng lặp)
  - Demo dashboard nhà mẫu (hookDemoData): "hôm nay còn lại bao nhiêu" từ
    calculateTodayRemaining(HOOK_DEMO_MONTHLY_INCOME, ...).
  - Banner primary-soft + dòng mindset (text-xs muted): "Trả cho bản thân trước —
    nguyên tắc kinh điển từ 'Người giàu có nhất thành Babylon'."
  - Mục đích: cho user thấy TRƯỚC con số ví dụ; Tada step (4) sẽ khép lại bằng
    con số thật của họ.

STEP 2 — Goal (2 tầng)
  - Tầng nền: Emergency fund card LUÔN hiện, target = 3 tháng chi tiêu tự tính
    (không phải lựa chọn — server luôn tạo).
  - Tầng chọn: multi-select preset (education / house / travel / custom) + counter
    số goal đã chọn. Mỗi preset Duotone icon từ PRESET_ICONS (nguồn chung).
  - Custom preset: nhập tên + target + số tháng.

STEP 3 — Income
  - Nhập thu nhập hàng tháng của hộ (nguồn cho feasibility + todayRemaining).

STEP 4 — Tada (khép vòng lặp, 4 stage reveal tuần tự, STAGE_DELAY_MS=550)
  - Stage `budget`: stacked bar ngang chia 4 nhóm cost-type (Cố định / Chi tiêu
    linh hoạt / Tiết kiệm & đầu tư / Trả nợ), màu semantic + legend % · tiền/tháng.
  - Stage `goal`: danh sách thẻ fund (emergency đầu tiên + goal đã chọn), icon KHỚP
    icon đã thấy ở Goal step (PRESET_ICONS chung).
  - Stage `feasibility`: headline plain-language (nhánh feasible/infeasible) + 1 dòng
    rationale: mental accounting (Richard Thaler, Nobel Kinh tế 2017).
  - Stage `todayRemaining`: số lớn text-4xl font-mono zoom-in, ngay dưới là câu khép
    vòng lặp: "Lúc nãy là ví dụ. Đây mới là con số của riêng bạn."
  - reduced-motion: 4 stage hiện full ngay, không animation.

Ghi chú framing: CHỈ dùng 3 nguồn đã xác thực (Clason / Ramit Sethi / Thaler).
KHÔNG nhắc "6 Lọ"/"6 Jars"/"50-30-20" ở bất kỳ đâu.
```

### SCREEN: /dashboard

> **(Epic 13 — Narrative layer planned, 10-07-2026):** header sẽ đeo badge giai đoạn "GĐ1 · tháng 2/6" (lớp phủ, giữ trục tháng); tháng không góp / chuyển GĐ → insight card kể tử tế kèm lối thoát "còn N tháng là đầy lại" (BR-OB-018). Nguồn số: hook useLivingPlan (Epic 12). Mô tả dưới đây là HIỆN TRẠNG. Chi tiết: sprint-change-proposal-2026-07-10.md + BR-OB-014→018.

```
Purpose:  Monthly financial overview
Layout:   1 column mobile, 2 column desktop

SECTIONS (top to bottom):
1. Header: "Tháng M/YYYY" MonthPicker + avatar icon
2. Monthly Buffer Banner (conditional): 
   "💰 Quỹ đệm tháng kế tiếp: X đ — Bạn đã nhận lương chưa? [Xác nhận]"
   Show if: monthly_buffer.balance > 0 AND day 1-10 AND not released
3. Metric Cards (2×2 grid):
   [Tổng thu | Tổng chi]
   [Tiết kiệm | % Tiết kiệm]
   Each card: muted label + large amount + trend vs last month (if available)
4. Spending Donut (ApexCharts Donut):
   Segments: fixed (blue) / variable (amber) / wasteful (red)
   Center: total expense amount
   Legend: 3 behavior_type labels + amounts
5. Budget Progress:
   Each budget line: [Name] [██████░░] X% [remaining or over]
   Color: safe=emerald, warning=amber, danger=rose
   Only show lines with budget_pct > 0
6. Fund Overview (max 6 funds):
   Mini cards: icon + name + balance / target + thin progress bar
7. Recent Transactions (5 items):
   [category icon + color] [description] [date] [±amount]
   "Xem tất cả →" link → /transactions

Loading: All sections show skeleton simultaneously
Empty state (first month): "Chưa có dữ liệu. Thêm giao dịch đầu tiên ↗"
```

### SCREEN: /transactions
```
Purpose:  Transaction list + quick add
Layout:   Full width, infinite scroll

HEADER:
  MonthPicker | Filter icon (opens filter bar)

FILTER BAR (collapsible):
  [Danh mục: All ▼] [Tài khoản: All ▼] [Loại: All ▼]

LIST (grouped by date):
  Date header: "Thứ X, DD/MM" (day of week + date)
  TransactionItem:
    Left: colored category group circle (initial or icon)
    Center: category name (bold) + description (muted)
    Right: ±amount (green=in, red=out) + behavior_type chip (tiny)
  Swipe left (mobile): Edit | Delete actions

FAB: "+" bottom-right (desktop), in bottom nav (mobile)

QuickAdd Sheet/Dialog:
  - Direction toggle: [Chi tiêu] [Thu nhập] [Chuyển khoản]
  - Amount: large text input, formatted VND
  - Category: CategoryPicker trigger button
  - Account: select dropdown
  - Date: date picker (default today)
  - Description: text input (optional)
  - is_unusual_income toggle (only when direction=in)
  - behavior_type: read-only chip showing auto-classification
  - Save button (full width, primary)

CategoryPicker (bottom sheet):
  - Search input (filters all categories)
  - List: group header → category items with color dots
  - Filtered by direction (income/expense)
```

### SCREEN: /funds

> **(Epic 12 — Living Plan planned, 10-07-2026):** đầu trang sẽ có summary strip mini-Tada (capacity tháng 15% income thực, GĐ hiện tại + progress 3 GĐ, cách chia ladder — nguồn useLivingPlan) + sheet "Đổi hạng" kéo thả ghi `priority_rank` (persistent, permission-aware). Kế hoạch luôn tươi, không lưu tĩnh (BR-OB-014→017). Mô tả dưới đây là HIỆN TRẠNG.

```
Purpose:  Fund list overview
Layout:   Cards grid (1 col mobile, 2 col desktop)

HEADER: "Tổng tài sản trong quỹ: X đ"
FAB: "Tạo quỹ mới"

FUND CARD:
  Icon emoji + Fund name (bold) + [fund_type badge]
  Progress bar (fill color = fund.color)
  "X đ / Y đ (Z%)" target progress
  "X tháng nữa đạt mục tiêu" (if target set)
  "Nạp X đ/tháng" monthly contribution
  Buttons: [Nạp quỹ] [Rút quỹ]

Monthly Buffer Card (special):
  Shows "Cho tháng [M+1]: X đ"
  If day 1-10 and not released: green "Sẵn sàng" badge + [Xác nhận nhận lương] button

Click card → /funds/[id]
```

### SCREEN: /funds/[id]

> **(Epic 12/13 — Living Plan + Narrative planned, 10-07-2026):** thêm tab "Kế hoạch" (góp TB + timeline living, kênh gợi ý + lãi kép + disclaimer BR-OB-013, marker chặng 50%); dialog "Nạp quỹ" pre-fill số engine gợi ý tháng này (sửa/bỏ qua được — BR-OB-017); dialog "Rút quỹ" yêu cầu nhập mô tả lý do (BR-OB-018). Mô tả dưới đây là HIỆN TRẠNG.

```
Purpose:  Fund detail + manage
Layout:   Header + tabs

HEADER:
  Fund name + type badge
  Large balance display
  Progress bar to target
  [Nạp quỹ] [Rút quỹ] action buttons

TABS:
  [Lịch sử] [Cài đặt]

Tab Lịch sử:
  Fund transactions grouped by month
  Row: date | type (contribution/withdrawal) | ±amount | balance_after

Tab Cài đặt (FundForm):
  - name, monthly_contribution, target_amount, target_date
  - Dynamic fields by fund_type
  - Delete fund button (bottom, destructive)
```

### SCREEN: /reports
```
Purpose:  Monthly financial analysis
Layout:   MonthPicker + 4 tabs

TAB: Chi tiêu
  Table: [Nhóm] [Số tiền] [% Thu nhập] [Loại chi phí badge]
  Sorted: amount desc
  Total row at bottom

TAB: Thu nhập
  Section "Thu nhập thường xuyên":
    List: [Source name] [Amount] [Thành viên]
    Total
  Section "Thu nhập bất thường":
    List: [Description] [Amount] [Date]
    Total
    Note: "Bạn nên chuyển khoản bất thường này vào quỹ tiết kiệm 💡"

TAB: Ngân sách vs Thực tế
  Table: [Hạng mục] [Ngân sách] [Thực tế] [Còn lại] [Trạng thái]
  Status icons: 🟢 🟡 🔴
  Deviation column: positive=green, negative=red

TAB: Quỹ
  Table: [Quỹ] [Nạp tháng này] [Rút tháng này] [Thay đổi ròng]
  Total row
```

### SCREEN: /budget
```
Purpose:  Budget tracking with expandable groups
Layout:   List with accordion

HEADER: MonthPicker + "Tổng chi tiêu: X đ / Y đ ngân sách"

BUDGET ROW:
  [Group name] [progress bar] [X%] [Xđ / Yđ] [chevron]
  Color: safe/warning/danger (BudgetProgressBar)

EXPANDED:
  List of transactions in that group this month
  Each: category name | amount | date

INLINE EDIT (pencil icon on row):
  Input field: % for this month only (creates budget_override)
  "Xác nhận" saves, "Hủy" cancels
```

### SCREEN: /net-worth
```
Purpose:  Asset snapshot + reconciliation
Layout:   Month picker + form + chart

HEADER: "Tổng tài sản: X đ" + MonthPicker

SECTIONS:
  Tài khoản ngắn hạn:
    Each account row: [Account name] [System: auto-calc] [Thực tế: input field]
  Tài sản dài hạn:
    Savings accounts, securities, precious metals
    [Name] [Type badge] [System value] [Actual: input]
  Quỹ (read-only):
    Each fund: name + balance (from funds table, no input)

DISCREPANCY:
  "Ghi chép: X đ | Thực tế: Y đ | Chênh lệch: ±Z đ"
  Warning badge if |Z| > 100,000

CHART (if >1 month of data):
  ApexCharts LineChart: total_recorded per month
  Single line, no need for legend

Save button: "Lưu snapshot tháng [M/YYYY]"
```

### SCREEN: /scheduled-payments
```
Purpose:  Recurring payment tracker
Layout:   List grouped by status

ACTIVE PAYMENTS:
  PaymentCard:
    [Name] [Amount] [Period badge] [Payment method]
    [Next due: DD/MM/YYYY] [days-until badge: red if ≤7, orange if ≤30]
    [Đã thanh toán] button | [Edit] | [Hủy]

CANCELLED PAYMENTS:
  Muted style, [Kích hoạt lại] button

FAB: Add new payment
```

### SCREEN: /settings
```
Purpose:  Settings hub
Layout:   Menu list → sub-pages

MENU ITEMS:
  Hộ gia đình      → /settings/household
  Tài khoản        → /settings/accounts
  Thu nhập         → /settings/income
  Danh mục         → /settings/categories
  Ngân sách        → /settings/budget
  Khoản nợ         → /settings/debt
  Thành viên       → /settings/members (family only)
  Chi tiêu dự kiến → /settings/estimated-expenses

Each item: icon + label + chevron →
```

### SCREEN: /settings/categories
```
Purpose:  Category management
Layout:   Accordion tree

COST TYPE HEADER: [name] [count] [collapsed/expanded]

GROUP:
  [Group name] → expand categories

CATEGORY ROW:
  [Color dot] [Name] [behavior_type chip] [🔒 if system]
  System: no edit/delete buttons
  Custom: [Edit pencil] [Delete trash]

ADD BUTTON: "Thêm danh mục tùy chỉnh" (at bottom of each group)
ADD FORM (inline):
  [Name input] [Group: locked to current] [behavior_type select] [Save] [Cancel]
```

### SCREEN: /settings/budget
```
Purpose:  Budget line management
Layout:   2 sections

SYSTEM BUDGETS:
  Table: [Name] [% input] [Amount = %×income] [🔒]
  "Chi trả nợ": 🔒 if is_auto_calculated + tooltip
  Row edit: % only (other fields readonly)

CUSTOM BUDGETS:
  Table: [Name] [Linked groups] [% input] [Edit] [Delete]
  "Thêm ngân sách tùy chỉnh" button → form

Total bar: always visible at top of page
Save all button (sticky footer)
```

### SCREEN: /settings/debt
```
Purpose:  Debt management
Layout:   Cards list

DEBT CARD:
  [Creditor name] [Status badge: active=blue, paid=green]
  [Thành viên] | [Type] | [Trả/tháng: X đ]
  [Dư nợ: Y đ] | [Dự kiến xong: MM/YYYY]
  Buttons: [Sửa] [Tất toán] (if active)

"Tất toán" flow:
  1. Confirm dialog: "Tất toán khoản nợ [name]?"
  2. Set actual_end_date = today
  3. status = paid_off
  4. Trigger recalculate_debt_budget
  5. If last debt: show 🎉 notification

FAB: Add new debt
Budget impact preview: "Ngân sách trả nợ hiện tại: X%"
```

---

## 4. COMPONENT SPECS

### CurrencyInput
```
Props: value (number), onChange, placeholder, className
Behavior:
  - onFocus: show raw number (remove formatting)
  - onBlur: format as "1.000.000 đ" (VND) or "$1,000" (USD)
  - keydown: only allow digits
  - large variant: text-2xl h-14 for QuickAdd
```

### CategoryPicker
```
Trigger: button showing selected category name (or "Chọn danh mục...")
Opens: bottom sheet (mobile) or popover (desktop)
Content:
  - Search input (filter categories by name)
  - Accordion: cost_type → group → category list
  - Each item: color dot + name
  - Click → close picker + call onChange(id, name)
Filter: direction prop ('in' | 'out') filters cost_type
```

### MonthPicker
```
Display: "Tháng 5 / 2026"
Controls: [←] [Tháng M/YYYY] [→]
← disables when at earliest data month
→ disables when at current month
State: managed by Zustand currentMonth
```

### BudgetProgressBar
```
Props: actual, budget, label, showAmount
Colors:
  actual/budget < 0.8: emerald (safe)
  actual/budget 0.8-1.0: amber (warning)
  actual/budget > 1.0: rose (danger)
Bar: shows actual/budget percentage (capped at 100% visually)
Text: "X đ còn lại" or "Vượt X đ" (red)
```

### TransactionItem
```
Left: circle avatar, color from category_group.color, initial from group name
Center top: category_group.name (semibold) + " · " + category.name (muted)
Center bottom: description (if exists, muted, truncate)
Right top: amount (emerald if in, rose if out)
Right bottom: date formatted "DD/MM"
Behavior_type chip: tiny badge (fixed/variable/wasteful/debt/savings) — show only in list view
```

### FundCard
```
Header: emoji icon + name (bold) + fund_type badge (gray pill)
Progress: thin bar (fund.color) showing current/target
Stats row: "X đ" balance | "/ Y đ" target | "Z%" 
Footer: "Còn N tháng" | "X đ/tháng"
Action: [Nạp quỹ] (primary) [Rút quỹ] (secondary outline)
```

### EmptyState
```
Props: icon (emoji), title, description (optional), action (optional)
Layout: centered, py-16
Icon: text-4xl
Title: text-sm text-zinc-400
Action button: if provided
```

### SkeletonLoader
```
Transaction: flex row with circle + 2 lines + amount right
FundCard: rect with 3 lines
MetricCard: small rect + large number rect
Use: bg-zinc-800 animate-pulse rounded
```

---

## 5. UX RULES

### Mobile constraints
```
- Bottom nav height: 64px → all page content needs pb-16
- FAB position: bottom-20 right-4 (above bottom nav)
- Bottom sheets: max-h-[85vh], rounded-t-2xl
- All clickable areas: min 44×44px
- Input font-size: 16px (prevent iOS zoom)
- No horizontal scroll on any page
```

### Forms
```
- Required fields: show asterisk (*) + block submit if empty
- Error messages: text-rose-400 text-xs below input
- Loading state: disable all inputs + show spinner on submit button
- Success: close sheet/modal + toast "Đã lưu" + refresh data
- Error: keep form open + toast error message
```

### Destructive actions
```
ALL delete/deactivate/payoff actions MUST:
1. Show AlertDialog with title + description
2. Describe what will be deleted/affected
3. Confirm button: destructive style (rose)
4. Cancel button: outlined
Never delete without confirmation.
```

### Empty states
```
Every list page MUST have:
- Icon (emoji, text-4xl, muted)
- Title: "Chưa có [item]"
- Description: what to do (optional)
- CTA button (optional): "Thêm [item] đầu tiên"
```

### Loading states
```
Page load: skeleton (not spinner)
Action (save/delete): button loading state (spinner + disabled)
Data refresh (month change): skeleton overlay on existing content
Background refresh: no loading indicator
```

### Toasts (sonner)
```
Success: "✓ Đã lưu giao dịch" (auto-dismiss 2s)
Error: "✗ Có lỗi xảy ra. Thử lại?" (action button, 5s)
Loading: "Đang lưu..." (manual dismiss on complete)
Warning: "⚠ [message]" (4s)
Position: top-center (mobile), bottom-right (desktop)
```

### Navigation feedback
```
Active nav item: filled icon + label highlighted
Badge on nav item: rounded-full, min-w-5, text-xs
Back button: chevron-left + previous page title
```
