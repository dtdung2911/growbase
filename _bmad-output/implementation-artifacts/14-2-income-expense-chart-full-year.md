---
baseline_commit: 8d33fee2813e1c35693cc1b7db2d03b93336989a
---

# Story 14-2: Chart "Thu nhập vs Chi tiêu" hiển thị đủ từ đầu năm

Status: review

## Story

As a **thành viên household**,
I want **biểu đồ "Thu nhập vs Chi tiêu" ở Dashboard hiển thị mọi tháng từ tháng 01 đến tháng hiện tại**,
so that **tôi thấy xu hướng thu/chi cả năm thay vì chỉ 2 tháng gần nhất**.

## Context / Problem

Chart `IncomeExpenseBar` hiện chỉ vẽ **2 cột** (tháng trước + tháng hiện tại):
- `src/app/api/dashboard/route.ts:36-37` — query chỉ fetch `prevFrom`→`to` (2 tháng).
- `src/components/dashboard/DashboardCharts.tsx:32` — `IncomeExpenseBar` nhận 4 scalar (`income/expense/lastIncome/lastExpense`), xaxis hardcode `[prevLabel, curLabel]`, series 2 điểm, `stackType: "100%"`.
- Render tại `src/components/dashboard/DashboardView.tsx:109`.

Cần: chart hiển thị từ **2026-01 → tháng hiện tại** (`month` từ appStore, format "YYYY-MM").

## Acceptance Criteria

1. **AC1 — Full-year series**: Chart hiển thị 1 cột-nhóm cho mỗi tháng từ tháng 01 của năm đang xem đến tháng `month` (inclusive). Với `month=2026-07` → 7 nhóm (01..07).
2. **AC2 — Income vs Expense**: Mỗi tháng có 2 giá trị: income (`transaction_type='income'`) và expense (`transaction_type` ∈ `expense`,`debt_repayment`) — **khớp cách route phân loại `totalIncome/totalExpense` hiện tại** (route.ts:82-90). Không tính fund_contribution/withdrawal/internal_transfer vào thu/chi.
3. **AC3 — Không phá stats khác**: `totalIncome`, `totalExpense`, `lastMonthIncome/Expense`, donut behavior, top categories, weekday — giữ nguyên. Thêm aggregation là **additive**.
4. **AC4 — Nhãn tháng i18n**: Nhãn trục x là tháng viết tắt theo `locale` (vi/en), như logic `toLocaleDateString` hiện có.
5. **AC5 — Empty/ít tháng**: Nếu `month` là tháng 01 → chart 1 nhóm. Không lỗi khi tháng chưa có giao dịch (income=0, expense=0).

## Tasks / Subtasks

- [x] **T1 — API aggregation** (`src/app/api/dashboard/route.ts`)
  - [x] Thêm query nhẹ (sau block hiện tại): fetch `transaction_date, amount, transaction_type` từ `{year}-01-01` đến `to` (`to` đã tính sẵn cho `month`), `eq household_id`. `year` = `month.split("-")[0]`.
  - [x] Aggregate: khởi tạo map cho các tháng `01..currentMonthNum`, cộng income (type income) và expense (type expense|debt_repayment). Trả mảng `monthlyIncomeExpense: { month: "YYYY-MM", income, expense }[]` theo thứ tự tháng tăng dần.
  - [x] Thêm `monthlyIncomeExpense` vào object response `data`.
- [x] **T2 — Type** (`src/types/app.ts`)
  - [x] Thêm field `monthlyIncomeExpense: { month: string; income: number; expense: number }[]` vào type `DashboardData`.
- [x] **T3 — Chart component** (`src/components/dashboard/DashboardCharts.tsx`)
  - [x] Đổi `IncomeExpenseBarProps` → `{ monthly: { month: string; income: number; expense: number }[] }` (bỏ 4 scalar + `month`). Categories = nhãn tháng viết tắt từ mỗi `monthly[i].month` (dùng `locale`). Series income = `monthly.map(x=>x.income)`, expense = `monthly.map(x=>x.expense)`.
  - [x] Bỏ `stackType: "100%"` và `stacked: true` → **grouped columns** (cột income/expense cạnh nhau) để so sánh số tuyệt đối. Giữ style còn lại (colors SEMANTIC.info/error, borderRadius, formatter M, tooltip formatVND).
- [x] **T4 — Caller** (`src/components/dashboard/DashboardView.tsx:109`)
  - [x] Truyền `monthly={data.monthlyIncomeExpense}` thay cho các prop cũ. Cập nhật subtitle/caption card nếu đang là "so với tháng trước" → i18n "từ đầu năm" (nếu có).
- [x] **T5 — Verify**: `npx tsc --noEmit` + `npm run build` sạch. Chart hiển thị 7 tháng với seed data (income 30tr đều, expense 17–21.7tr).

## Dev Notes

### Karpathy gate
Apply `karpathy-guidelines`. Additive, tối thiểu. KHÔNG viết RPC/SQL function mới (route đã aggregate client-side; giữ pattern đó). KHÔNG dùng useMemo/useCallback thừa.

### Route classification (BẮT BUỘC khớp — route.ts:78-116)
```typescript
if (type === "income") { totalIncome += amt; continue }
if (type === "fund_contribution") fundContributions += amt
const isRealExpense = type === "expense" || type === "debt_repayment"
if (isRealExpense) totalExpense += amt
```
→ Chart income = type income; expense = expense|debt_repayment. Bỏ fund/transfer khỏi thu-chi.

### `to`/`monthRange`
`monthRange(month)` cho `{ from, to }` của tháng. `to` = cuối tháng `month`. Query year-start dùng `` `${year}-01-01` `` → `to`.

### IncomeExpenseBar hiện tại (DashboardCharts.tsx:24-105)
```typescript
type IncomeExpenseBarProps = { income; expense; lastIncome; lastExpense; month }
// options: chart.stacked=true, stackType="100%", xaxis.categories=[prevLabel,curLabel]
// series: [{name income, data:[lastIncome, income]}, {name expense, data:[lastExpense, expense]}]
```
Nhãn tháng: `new Date(y, m-1, 1).toLocaleDateString(locale==="vi"?"vi-VN":"en-US", { month:"short" })`. Áp cho từng phần tử `monthly`.

### useDashboard (không đổi)
`useDashboard()` fetch `/api/dashboard?month=...`, key `keys.dashboard(hid, month)`. Chỉ thêm field vào response → hook tự có.

### Files touched
| File | Action |
|------|--------|
| `src/app/api/dashboard/route.ts` | UPDATE — query + aggregate monthlyIncomeExpense |
| `src/types/app.ts` | UPDATE — DashboardData thêm monthlyIncomeExpense |
| `src/components/dashboard/DashboardCharts.tsx` | UPDATE — IncomeExpenseBar nhận monthly[] |
| `src/components/dashboard/DashboardView.tsx` | UPDATE — truyền prop mới |
| i18n (nếu đổi subtitle) | UPDATE — key "từ đầu năm" |

### Không được phá
- Toàn bộ aggregation/response fields hiện có (donut, top cat, weekday, stats).
- Auth check đầu route (đã có).

## Testing

- Seed data đã có (2026-01..07): chart phải hiện 7 nhóm, income 30tr đều, expense 17–21.7tr, tháng 6 cao nhất.
- Đổi `month` về 2026-01 → 1 nhóm, không lỗi.
- `tsc` + build pass.
- Manual browser: mở Dashboard → chart "Thu nhập vs Chi tiêu" 7 cột-nhóm.

## Dependencies
- Sau 14-1 (done) và item-2 seed (done) → có data để verify.

## Dev Agent Record

### Completion Notes
Chart full-year xong. Route thêm query year-start→to + aggregate monthlyIncomeExpense (additive, khớp classification totalIncome/Expense). IncomeExpenseBar → grouped columns N tháng. Cũng fix hookDemoData.ts (onboarding demo) sinh monthlyIncomeExpense để tsc pass. tsc + build clean.

### File List
- src/app/api/dashboard/route.ts (M) — query + aggregate monthlyIncomeExpense
- src/types/app.ts (M) — DashboardData.monthlyIncomeExpense
- src/components/dashboard/DashboardCharts.tsx (M) — IncomeExpenseBar nhận monthly[], grouped columns
- src/components/dashboard/DashboardView.tsx (M) — truyền monthly + subtitle dashboard.sinceJanuary
- src/lib/i18n/messages/vi.json + en.json (M) — key dashboard.sinceJanuary
- src/components/onboarding/v2/hookDemoData.ts (M) — demo data thêm monthlyIncomeExpense

### Testing
| Flow (AC) | Method | Result |
|-----------|--------|--------|
| Full-year 7 nhóm với seed (AC1) | DB trace | income 30tr/tháng, expense 17.18–21.75tr, tháng 6 cao nhất — pass |
| Income vs expense classification (AC2) | code trace | income=type income, expense=expense|debt_repayment, bỏ fund/transfer — khớp route |
| Stats khác không phá (AC3) | build + code trace | aggregation additive, fields cũ giữ nguyên — pass |
| month=2026-01 → 1 nhóm, empty=0 (AC5) | code trace | array pre-seed 01..currentMonthNum, income/expense 0 — pass |
| tsc + build | automated | clean |

**CẦN verify tay trên browser**: mở Dashboard → chart "Thu nhập vs Chi tiêu" hiện 7 cột-nhóm (01→07), income ~30tr, expense ~17–22tr.

### Change Log
- 17-07-2026: Chart income-vs-expense full-year (Jan→current), grouped columns.
